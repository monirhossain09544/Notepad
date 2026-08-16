"""AI assistant endpoints (all note-scoped)."""
import functools
import json
import uuid

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

import ai_service
from db import chats_col, notes_col, utcnow
from models import AIRequest, AskRequest
from utils import html_to_text

router = APIRouter(prefix="/ai", tags=["ai"])


async def resolve_content(note_id, html_override):
    """Returns (html, plain_text). Prefers the payload html (unsaved edits)."""
    html = html_override
    if html is None and note_id:
        doc = await notes_col.find_one({"id": note_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Note not found")
        html = doc.get("html_content") or ""
    html = html or ""
    plain = html_to_text(html)
    if len(plain.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Write a little more in this note first \u2014 the assistant needs some content to work with.",
        )
    return html, plain


def ai_guard(func):
    """Turn AI/provider failures into clean 502s (keeps FastAPI signature intact)."""

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            raise
        except ai_service.AIError as exc:
            raise HTTPException(status_code=502, detail=f"AI request failed: {exc}") from exc
        except Exception as exc:  # pragma: no cover - network dependent
            raise HTTPException(status_code=502, detail=f"AI request failed: {exc}") from exc

    return wrapper


@router.post("/title")
@ai_guard
async def ai_title(payload: AIRequest):
    _, plain = await resolve_content(payload.note_id, payload.html_content)
    return await ai_service.gen_title(plain)


@router.post("/summarize")
@ai_guard
async def ai_summarize(payload: AIRequest):
    _, plain = await resolve_content(payload.note_id, payload.html_content)
    return await ai_service.gen_summary(plain)


@router.post("/improve")
@ai_guard
async def ai_improve(payload: AIRequest):
    html, _ = await resolve_content(payload.note_id, payload.html_content)
    return await ai_service.gen_improved(html)


@router.post("/continue")
@ai_guard
async def ai_continue(payload: AIRequest):
    _, plain = await resolve_content(payload.note_id, payload.html_content)
    return await ai_service.gen_continuation(plain)


@router.post("/tone")
@ai_guard
async def ai_tone(payload: AIRequest):
    html, _ = await resolve_content(payload.note_id, payload.html_content)
    tone = (payload.tone or "professional").strip().lower()
    return await ai_service.gen_tone(html, tone)


@router.post("/action-items")
@ai_guard
async def ai_action_items(payload: AIRequest):
    _, plain = await resolve_content(payload.note_id, payload.html_content)
    return await ai_service.gen_action_items(plain)


@router.post("/suggest-tags")
@ai_guard
async def ai_suggest_tags(payload: AIRequest):
    _, plain = await resolve_content(payload.note_id, payload.html_content)
    return await ai_service.gen_tags(plain)


async def _save_message(note_id, role, content):
    if not note_id:
        return
    await chats_col.insert_one(
        {
            "id": str(uuid.uuid4()),
            "note_id": note_id,
            "role": role,
            "content": content,
            "created_at": utcnow(),
        }
    )


@router.post("/ask")
@ai_guard
async def ai_ask(payload: AskRequest):
    question = (payload.question or "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Ask a question first")
    _, plain = await resolve_content(payload.note_id, payload.html_content)
    await _save_message(payload.note_id, "user", question)
    result = await ai_service.gen_answer(
        plain, question, session_id=f"ask-{payload.note_id or uuid.uuid4()}"
    )
    await _save_message(payload.note_id, "assistant", result["answer"])
    return result


@router.post("/ask/stream")
async def ai_ask_stream(payload: AskRequest):
    question = (payload.question or "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Ask a question first")
    _, plain = await resolve_content(payload.note_id, payload.html_content)
    await _save_message(payload.note_id, "user", question)

    async def event_generator():
        collected = []
        try:
            async for delta in ai_service.stream_text(
                ai_service.ASK_SYS,
                ai_service.ask_prompt(plain, question),
                session_id=f"ask-{payload.note_id or uuid.uuid4()}",
            ):
                collected.append(delta)
                yield f"data: {json.dumps({'delta': delta})}\n\n"
            answer = "".join(collected).strip()
            await _save_message(payload.note_id, "assistant", answer)
            yield f"data: {json.dumps({'done': True, 'answer': answer})}\n\n"
        except Exception as exc:  # pragma: no cover - network dependent
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
