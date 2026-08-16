"""Note CRUD, lifecycle, export and per-note AI chat history."""
import re
import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Response

from db import chats_col, notes_col, serialize, utcnow
from models import NoteCreate, NoteUpdate, ToggleBody
from utils import (
    count_words,
    html_to_markdown,
    html_to_text,
    make_snippet,
    slugify,
)

router = APIRouter(prefix="/notes", tags=["notes"])

SORTS = {
    "updated": ("updated_at", -1),
    "created": ("created_at", -1),
    "title": ("title", 1),
}


def shape(doc) -> dict:
    note = serialize(doc)
    if not note:
        return note
    note["snippet"] = make_snippet(note.get("plain_text", ""))
    return note


async def get_note_or_404(note_id: str) -> dict:
    doc = await notes_col.find_one({"id": note_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Note not found")
    return doc


@router.get("")
async def list_notes(
    view: str = Query("all"),
    folder_id: Optional[str] = None,
    tag_id: Optional[str] = None,
    q: Optional[str] = None,
    sort: str = Query("updated"),
    limit: int = Query(500, le=1000),
):
    query: dict = {}
    if view == "trash":
        query["trashed"] = True
    elif view == "archive":
        query.update({"trashed": False, "archived": True})
    elif view == "pinned":
        query.update({"trashed": False, "archived": False, "pinned": True})
    elif view == "folder":
        query.update({"trashed": False, "archived": False, "folder_id": folder_id})
    elif view == "tag":
        query.update({"trashed": False, "archived": False, "tag_ids": tag_id})
    else:  # all
        query.update({"trashed": False, "archived": False})

    if q:
        needle = re.escape(q.strip())
        query["$or"] = [
            {"title": {"$regex": needle, "$options": "i"}},
            {"plain_text": {"$regex": needle, "$options": "i"}},
        ]

    field, direction = SORTS.get(sort, SORTS["updated"])
    cursor = notes_col.find(query).sort([("pinned", -1), (field, direction)]).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [shape(d) for d in docs]


@router.post("/trash/empty")
async def empty_trash():
    result = await notes_col.delete_many({"trashed": True})
    return {"deleted": result.deleted_count}


@router.post("")
async def create_note(payload: NoteCreate):
    html = payload.html_content or ""
    plain = html_to_text(html)
    now = utcnow()
    doc = {
        "id": str(uuid.uuid4()),
        "title": (payload.title or "").strip(),
        "html_content": html,
        "plain_text": plain,
        "word_count": count_words(plain),
        "folder_id": payload.folder_id,
        "tag_ids": payload.tag_ids or [],
        "pinned": False,
        "archived": False,
        "trashed": False,
        "color": payload.color,
        "created_at": now,
        "updated_at": now,
        "trashed_at": None,
    }
    await notes_col.insert_one(dict(doc))
    return shape(doc)


@router.get("/{note_id}")
async def get_note(note_id: str):
    return shape(await get_note_or_404(note_id))


@router.put("/{note_id}")
async def update_note(note_id: str, payload: NoteUpdate):
    await get_note_or_404(note_id)
    patch = payload.model_dump(exclude_unset=True)
    if "html_content" in patch:
        plain = html_to_text(patch["html_content"] or "")
        patch["plain_text"] = plain
        patch["word_count"] = count_words(plain)
    if "title" in patch and patch["title"] is not None:
        patch["title"] = patch["title"][:200]
    patch["updated_at"] = utcnow()
    await notes_col.update_one({"id": note_id}, {"$set": patch})
    return shape(await notes_col.find_one({"id": note_id}))


@router.post("/{note_id}/duplicate")
async def duplicate_note(note_id: str):
    src = await get_note_or_404(note_id)
    now = utcnow()
    copy = dict(src)
    copy.pop("_id", None)
    copy["id"] = str(uuid.uuid4())
    copy["title"] = ((src.get("title") or "Untitled") + " (copy)")[:200]
    copy["pinned"] = False
    copy["trashed"] = False
    copy["trashed_at"] = None
    copy["created_at"] = now
    copy["updated_at"] = now
    await notes_col.insert_one(dict(copy))
    return shape(copy)


@router.post("/{note_id}/pin")
async def pin_note(note_id: str, body: ToggleBody):
    await get_note_or_404(note_id)
    await notes_col.update_one(
        {"id": note_id}, {"$set": {"pinned": body.value, "updated_at": utcnow()}}
    )
    return shape(await notes_col.find_one({"id": note_id}))


@router.post("/{note_id}/archive")
async def archive_note(note_id: str, body: ToggleBody):
    await get_note_or_404(note_id)
    await notes_col.update_one(
        {"id": note_id}, {"$set": {"archived": body.value, "updated_at": utcnow()}}
    )
    return shape(await notes_col.find_one({"id": note_id}))


@router.post("/{note_id}/trash")
async def trash_note(note_id: str):
    await get_note_or_404(note_id)
    now = utcnow()
    await notes_col.update_one(
        {"id": note_id},
        {"$set": {"trashed": True, "trashed_at": now, "pinned": False, "updated_at": now}},
    )
    return shape(await notes_col.find_one({"id": note_id}))


@router.post("/{note_id}/restore")
async def restore_note(note_id: str):
    await get_note_or_404(note_id)
    await notes_col.update_one(
        {"id": note_id},
        {"$set": {"trashed": False, "trashed_at": None, "archived": False, "updated_at": utcnow()}},
    )
    return shape(await notes_col.find_one({"id": note_id}))


@router.delete("/{note_id}")
async def delete_note(note_id: str):
    await get_note_or_404(note_id)
    await notes_col.delete_one({"id": note_id})
    await chats_col.delete_many({"note_id": note_id})
    return {"deleted": True, "id": note_id}


@router.get("/{note_id}/export")
async def export_note(note_id: str, format: str = Query("md")):
    doc = await get_note_or_404(note_id)
    title = doc.get("title") or "Untitled note"
    if format == "txt":
        body = f"{title}\n\n{doc.get('plain_text', '')}\n"
        media = "text/plain; charset=utf-8"
        ext = "txt"
    elif format == "html":
        body = (
            "<!doctype html><html><head><meta charset='utf-8'>"
            f"<title>{title}</title></head><body><h1>{title}</h1>"
            f"{doc.get('html_content', '')}</body></html>"
        )
        media = "text/html; charset=utf-8"
        ext = "html"
    else:
        body = f"# {title}\n\n{html_to_markdown(doc.get('html_content', ''))}\n"
        media = "text/markdown; charset=utf-8"
        ext = "md"
    filename = f"{slugify(title)}.{ext}"
    return Response(
        content=body,
        media_type=media,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{note_id}/chat")
async def get_chat(note_id: str):
    docs = await chats_col.find({"note_id": note_id}).sort("created_at", 1).to_list(200)
    return [serialize(d) for d in docs]


@router.delete("/{note_id}/chat")
async def clear_chat(note_id: str):
    result = await chats_col.delete_many({"note_id": note_id})
    return {"deleted": result.deleted_count}
