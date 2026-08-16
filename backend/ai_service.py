"""AI assistant powered by the Emergent universal LLM key.

Every call uses stream_message(); non-streaming endpoints accumulate the stream.
"""
import json
import logging
import os
import re
import uuid
from pathlib import Path
from typing import AsyncGenerator, Optional

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

from emergentintegrations.llm.chat import (  # noqa: E402
    LlmChat,
    StreamDone,
    TextDelta,
    UserMessage,
)

logger = logging.getLogger("notepad.ai")

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
PROVIDER = "openai"
MODEL = "gpt-5.4"

MAX_CONTEXT_CHARS = 12000


class AIError(Exception):
    pass


def _client(system_message: str, session_id: Optional[str] = None) -> LlmChat:
    if not EMERGENT_LLM_KEY:
        raise AIError("AI is not configured (missing EMERGENT_LLM_KEY).")
    return LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id or f"note-{uuid.uuid4()}",
        system_message=system_message,
    ).with_model(PROVIDER, MODEL)


async def stream_text(
    system_message: str, prompt: str, session_id: Optional[str] = None
) -> AsyncGenerator[str, None]:
    chat = _client(system_message, session_id)
    try:
        async for event in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(event, TextDelta):
                if event.content:
                    yield event.content
            elif isinstance(event, StreamDone):
                break
    except AIError:
        raise
    except Exception as exc:  # pragma: no cover - network dependent
        logger.exception("LLM stream failed")
        raise AIError(str(exc)) from exc


async def run_text(
    system_message: str, prompt: str, session_id: Optional[str] = None
) -> str:
    chunks = []
    async for delta in stream_text(system_message, prompt, session_id):
        chunks.append(delta)
    result = "".join(chunks).strip()
    if not result:
        raise AIError("The model returned an empty response.")
    return result


def clean_html(raw: str) -> str:
    """Remove markdown code fences / stray commentary around HTML output."""
    text = (raw or "").strip()
    text = re.sub(r"^```(?:html)?", "", text).strip()
    text = re.sub(r"```$", "", text).strip()
    if "<" not in text:
        # model replied with plain text - wrap it in paragraphs
        paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
        return "".join(f"<p>{p}</p>" for p in paragraphs)
    return text


def parse_json(raw: str):
    if not raw:
        return None
    text = raw.strip()
    text = re.sub(r"^```(?:json)?", "", text).strip()
    text = re.sub(r"```$", "", text).strip()
    try:
        return json.loads(text)
    except Exception:
        pass
    match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            return None
    return None


def trim(text: str) -> str:
    text = text or ""
    if len(text) <= MAX_CONTEXT_CHARS:
        return text
    return text[:MAX_CONTEXT_CHARS] + "\n\n[note truncated]"


# --------------------------------------------------------------------------
# Prompts
# --------------------------------------------------------------------------
TITLE_SYS = (
    "You write short, specific titles for personal notes. Reply with ONLY the title. "
    "Maximum 6 words. No quotes, no trailing punctuation, no explanation."
)
SUMMARY_SYS = (
    'You summarize notes. Reply ONLY with JSON in this exact shape: '
    '{"bullets": ["...", "..."]} with 3 to 5 short, information-dense bullets. No markdown fences.'
)
IMPROVE_SYS = (
    "You are a precise copy editor. Improve grammar, clarity, punctuation and flow of the note "
    "while preserving the author's meaning, facts and approximate length. Keep the existing "
    "structure. Reply with ONLY valid HTML using <p>, <h1>, <h2>, <h3>, <ul>, <ol>, <li>, "
    "<strong>, <em>, <blockquote> tags. No markdown, no code fences, no commentary."
)
CONTINUE_SYS = (
    "You continue the user's note in their own voice and register. Add 2 to 4 new sentences that "
    "move the thought forward. Never repeat what is already written. Reply with ONLY HTML "
    "paragraphs wrapped in <p> tags. No code fences, no commentary."
)
TONE_SYS = (
    "You rewrite notes in a requested tone without inventing new facts. Reply with ONLY valid "
    "HTML using <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em> tags. "
    "No markdown, no code fences, no commentary."
)
ACTIONS_SYS = (
    'You extract concrete, actionable tasks from notes. Reply ONLY with JSON: '
    '{"items": ["task", "task"]}. Each task is a short imperative phrase. '
    'If there are no tasks, return an empty array. No markdown fences.'
)
TAGS_SYS = (
    'You suggest topical tags for notes. Reply ONLY with JSON: {"tags": ["tag", "tag"]} with 3 to 5 '
    'lowercase tags of one or two words each. No markdown fences.'
)
ASK_SYS = (
    "You answer questions about a single note. Use ONLY the note content provided. "
    "If the answer is not in the note, say clearly that the note does not cover it. "
    "Be concise and concrete. Plain prose, no markdown headings."
)


async def gen_title(text: str) -> dict:
    title = await run_text(TITLE_SYS, f"Note content:\n{trim(text)}")
    title = title.strip().strip('"').strip()
    return {"title": title[:120]}


async def gen_summary(text: str) -> dict:
    raw = await run_text(SUMMARY_SYS, f"Note:\n{trim(text)}")
    data = parse_json(raw) or {}
    bullets = [str(b).strip() for b in data.get("bullets", []) if str(b).strip()]
    if not bullets:
        bullets = [line.strip("-* ") for line in raw.split("\n") if line.strip()][:5]
    return {"bullets": bullets}


async def gen_improved(note_html: str) -> dict:
    raw = await run_text(IMPROVE_SYS, f"Note HTML:\n{note_html}")
    return {"html": clean_html(raw)}


async def gen_continuation(text: str) -> dict:
    raw = await run_text(CONTINUE_SYS, f"Note so far:\n{trim(text)}")
    return {"html": clean_html(raw)}


async def gen_tone(note_html: str, tone: str) -> dict:
    raw = await run_text(
        TONE_SYS, f"Rewrite this note in a {tone} tone.\n\nNote HTML:\n{note_html}"
    )
    return {"html": clean_html(raw), "tone": tone}


async def gen_action_items(text: str) -> dict:
    raw = await run_text(ACTIONS_SYS, f"Note:\n{trim(text)}")
    data = parse_json(raw) or {}
    items = [str(i).strip() for i in data.get("items", []) if str(i).strip()]
    return {"items": items}


async def gen_tags(text: str) -> dict:
    raw = await run_text(TAGS_SYS, f"Note:\n{trim(text)}")
    data = parse_json(raw) or {}
    tags = [str(t).strip().lower() for t in data.get("tags", []) if str(t).strip()]
    return {"tags": tags[:6]}


def ask_prompt(text: str, question: str) -> str:
    return f"NOTE:\n{trim(text)}\n\nQUESTION: {question}"


async def gen_answer(text: str, question: str, session_id: Optional[str] = None) -> dict:
    answer = await run_text(ASK_SYS, ask_prompt(text, question), session_id)
    return {"answer": answer}
