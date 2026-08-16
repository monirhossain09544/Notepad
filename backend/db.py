"""MongoDB access layer + JSON-safe serialization helpers."""
import os
import logging
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logger = logging.getLogger("notepad.db")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ.get("DB_NAME", "notepad_db")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

notes_col = db["notes"]
folders_col = db["folders"]
tags_col = db["tags"]
chats_col = db["ai_chats"]


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def serialize(doc):
    """Convert a Mongo document into a JSON-safe dict (datetime -> ISO string)."""
    if doc is None:
        return None
    out = {}
    for key, value in doc.items():
        if key == "_id":
            continue
        out[key] = _clean(value)
    return out


def _clean(value):
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    if isinstance(value, list):
        return [_clean(v) for v in value]
    if isinstance(value, dict):
        return {k: _clean(v) for k, v in value.items() if k != "_id"}
    return value


async def ensure_indexes():
    """Create the indexes the app relies on. Safe to call on every boot."""
    try:
        await notes_col.create_index(
            [("title", "text"), ("plain_text", "text")], name="note_text_idx"
        )
    except Exception as exc:  # index may already exist with another spec
        logger.warning("text index skipped: %s", exc)
    try:
        await notes_col.create_index("id", unique=True)
        await notes_col.create_index([("updated_at", -1)])
        await notes_col.create_index([("created_at", -1)])
        await notes_col.create_index([("folder_id", 1)])
        await notes_col.create_index([("tag_ids", 1)])
        await notes_col.create_index([("trashed", 1), ("archived", 1), ("pinned", -1)])
        await folders_col.create_index("id", unique=True)
        await tags_col.create_index("id", unique=True)
        await chats_col.create_index([("note_id", 1), ("created_at", 1)])
    except Exception as exc:
        logger.warning("index creation issue: %s", exc)
