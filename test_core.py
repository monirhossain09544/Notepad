"""
PHASE 1 CORE POC — Modern Notepad App
Single script that proves, in isolation:
  A. MongoDB CRUD for rich notes (HTML + plain text + tags + folder + flags), datetime-safe
  B. Soft delete (trash) -> restore -> permanent delete
  C. Full-text search over title + plain_text
  D. Emergent LLM key works: auto-title, summarize, improve-writing, continue,
     tone change, action-items, note-scoped Q&A, tag suggestions (parseable JSON)

Run:  python /app/test_core.py
"""
import asyncio
import json
import os
import re
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path("/app/backend/.env"))

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone  # noqa: E402

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "test_database")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
MODEL = ("openai", "gpt-5.4")

COLL = "notes_poc"
RESULTS = []


def record(name, ok, detail=""):
    RESULTS.append((name, ok, detail))
    tag = "PASS" if ok else "FAIL"
    print(f"[{tag}] {name}" + (f" :: {detail}" if detail else ""))


def now():
    return datetime.now(timezone.utc)


def serialize_doc(doc):
    """MongoDB doc -> JSON-safe dict (the classic datetime pitfall)."""
    if doc is None:
        return None
    out = {}
    for k, v in doc.items():
        if k == "_id":
            continue
        if isinstance(v, datetime):
            out[k] = v.isoformat()
        elif isinstance(v, list):
            out[k] = [x.isoformat() if isinstance(x, datetime) else x for x in v]
        elif isinstance(v, dict):
            out[k] = serialize_doc(v)
        else:
            out[k] = v
    return out


def html_to_text(html: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", html or "")
    text = re.sub(r"</(p|div|h1|h2|h3|li|blockquote)>", "\n", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"&amp;", "&", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


SAMPLE_HTML = (
    "<h2>Quarterly Product Review — Orbit Release</h2>"
    "<p>The Orbit release shipped on Tuesday with the new offline sync engine. "
    "Retention improved 12% week over week, but onboarding drop-off is still high at step three.</p>"
    "<ul><li>Ship the revised onboarding tour before the 14th</li>"
    "<li>Ask Priya to review the sync conflict resolution copy</li>"
    "<li>Cut the pricing page hero video, it slows first paint badly</li></ul>"
    "<p>Also we need to decide whether search stays client side or moves to the server. "
    "Marco thinks server side, i think we should measure first honestly.</p>"
)


# ----------------------------------------------------------------------------
# LLM helper
# ----------------------------------------------------------------------------
async def llm(system: str, prompt: str, session: str) -> str:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session,
        system_message=system,
    ).with_model(*MODEL)
    buf = []
    async for ev in chat.stream_message(UserMessage(text=prompt)):
        if isinstance(ev, TextDelta):
            buf.append(ev.content)
        elif isinstance(ev, StreamDone):
            break
    return "".join(buf).strip()


def parse_json(raw: str):
    """Tolerant JSON extraction from an LLM response."""
    if not raw:
        return None
    txt = raw.strip()
    txt = re.sub(r"^```(?:json)?", "", txt).strip()
    txt = re.sub(r"```$", "", txt).strip()
    try:
        return json.loads(txt)
    except Exception:
        pass
    m = re.search(r"(\{.*\}|\[.*\])", txt, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1))
        except Exception:
            return None
    return None


# ----------------------------------------------------------------------------
# A/B/C — MongoDB
# ----------------------------------------------------------------------------
async def test_mongo(db):
    notes = db[COLL]
    await notes.delete_many({})

    # indexes (text index on title + plain_text)
    try:
        await notes.create_index([("title", "text"), ("plain_text", "text")], name="note_text_idx")
        await notes.create_index([("updated_at", -1)])
        await notes.create_index([("folder_id", 1)])
        await notes.create_index([("tag_ids", 1)])
        await notes.create_index([("trashed", 1), ("archived", 1)])
        record("Mongo: indexes created (text + filters)", True)
    except Exception as e:
        record("Mongo: indexes created", False, str(e))
        return None

    folder_id = str(uuid.uuid4())
    tag_id = str(uuid.uuid4())

    # CREATE rich note
    note_id = str(uuid.uuid4())
    plain = html_to_text(SAMPLE_HTML)
    doc = {
        "id": note_id,
        "title": "Quarterly Product Review",
        "html_content": SAMPLE_HTML,
        "plain_text": plain,
        "folder_id": folder_id,
        "tag_ids": [tag_id],
        "pinned": False,
        "archived": False,
        "trashed": False,
        "color": None,
        "created_at": now(),
        "updated_at": now(),
        "trashed_at": None,
    }
    await notes.insert_one(dict(doc))
    got = await notes.find_one({"id": note_id})
    ok = got is not None and got["html_content"] == SAMPLE_HTML and "<h2>" in got["html_content"]
    record("Mongo: create rich note preserves HTML formatting", ok)

    # serialization safety
    ser = serialize_doc(got)
    try:
        json.dumps(ser)
        record("Mongo: datetime-safe JSON serialization", isinstance(ser["created_at"], str))
    except Exception as e:
        record("Mongo: datetime-safe JSON serialization", False, str(e))

    # UPDATE
    new_html = SAMPLE_HTML + "<p>Follow up: budget approval pending from finance.</p>"
    await notes.update_one(
        {"id": note_id},
        {"$set": {"html_content": new_html, "plain_text": html_to_text(new_html),
                  "pinned": True, "updated_at": now()}},
    )
    got = await notes.find_one({"id": note_id})
    record("Mongo: update note content + pin flag",
           got["pinned"] is True and "budget approval" in got["plain_text"])

    # extra notes for search
    others = [
        ("Grocery list", "<p>oat milk, sourdough bread, tahini, blueberries</p>"),
        ("Sync engine design", "<p>Conflict resolution uses a last-write-wins vector clock hybrid.</p>"),
        ("Book notes", "<p>Deep Work by Cal Newport. Attention residue is the key idea.</p>"),
    ]
    for t, h in others:
        await notes.insert_one({
            "id": str(uuid.uuid4()), "title": t, "html_content": h,
            "plain_text": html_to_text(h), "folder_id": None, "tag_ids": [],
            "pinned": False, "archived": False, "trashed": False, "color": None,
            "created_at": now(), "updated_at": now(), "trashed_at": None,
        })

    # C — SEARCH (text index)
    res = await notes.find({"$text": {"$search": "onboarding"}}).to_list(20)
    record("Search: text index finds word in body", len(res) == 1 and res[0]["id"] == note_id,
           f"{len(res)} hit(s)")

    res = await notes.find({"$text": {"$search": "grocery"}}).to_list(20)
    record("Search: text index finds word in title", len(res) == 1 and res[0]["title"] == "Grocery list")

    # regex fallback search (substring / partial typing — needed for live search UX)
    q = re.escape("sync")
    res = await notes.find({"$or": [{"title": {"$regex": q, "$options": "i"}},
                                    {"plain_text": {"$regex": q, "$options": "i"}}]}).to_list(20)
    record("Search: regex partial-match fallback works", len(res) >= 2, f"{len(res)} hit(s)")

    # filter by folder & tag
    res = await notes.find({"folder_id": folder_id}).to_list(20)
    res2 = await notes.find({"tag_ids": tag_id}).to_list(20)
    record("Filter: by folder and by tag", len(res) == 1 and len(res2) == 1)

    # B — TRASH / RESTORE / PERMANENT DELETE
    await notes.update_one({"id": note_id}, {"$set": {"trashed": True, "trashed_at": now()}})
    active = await notes.count_documents({"trashed": False})
    trashed = await notes.count_documents({"trashed": True})
    record("Lifecycle: soft-delete moves note to trash", active == 3 and trashed == 1)

    await notes.update_one({"id": note_id}, {"$set": {"trashed": False, "trashed_at": None}})
    got = await notes.find_one({"id": note_id})
    record("Lifecycle: restore from trash keeps content intact",
           got["trashed"] is False and "onboarding" in got["plain_text"])

    # archive
    await notes.update_one({"id": note_id}, {"$set": {"archived": True}})
    record("Lifecycle: archive flag", (await notes.find_one({"id": note_id}))["archived"] is True)
    await notes.update_one({"id": note_id}, {"$set": {"archived": False}})

    # duplicate
    src = await notes.find_one({"id": note_id})
    dup = dict(src)
    dup.pop("_id")
    dup["id"] = str(uuid.uuid4())
    dup["title"] = src["title"] + " (copy)"
    await notes.insert_one(dup)
    record("Lifecycle: duplicate note", await notes.count_documents({}) == 5)

    # permanent delete
    await notes.delete_one({"id": dup["id"]})
    record("Lifecycle: permanent delete", await notes.count_documents({"id": dup["id"]}) == 0)

    return plain


# ----------------------------------------------------------------------------
# D — AI features
# ----------------------------------------------------------------------------
async def test_ai(plain):
    if not EMERGENT_LLM_KEY:
        record("AI: EMERGENT_LLM_KEY present", False, "missing key")
        return
    record("AI: EMERGENT_LLM_KEY present", EMERGENT_LLM_KEY.startswith("sk-emergent"))

    sid = f"poc-{uuid.uuid4()}"

    # 1 auto title
    out = await llm(
        "You write short note titles. Reply with ONLY the title, max 6 words, no quotes, no punctuation at the end.",
        f"Note content:\n{plain}", sid + "-title")
    ok = bool(out) and len(out) < 90 and "\n" not in out
    record("AI 1/8: auto-title", ok, repr(out[:80]))

    # 2 summarize -> JSON bullets
    raw = await llm(
        'You summarize notes. Reply ONLY with JSON: {"bullets": ["...", "..."]} with 3-5 concise bullets.',
        f"Note:\n{plain}", sid + "-sum")
    data = parse_json(raw)
    ok = isinstance(data, dict) and isinstance(data.get("bullets"), list) and len(data["bullets"]) >= 2
    record("AI 2/8: summarize returns parseable JSON bullets", ok,
           f"{len(data['bullets']) if ok else 0} bullets")

    # 3 improve writing -> HTML back
    out = await llm(
        "You are an editor. Improve grammar, clarity and flow of the user's note. "
        "Keep the meaning and roughly the same length. Reply with ONLY valid HTML using "
        "<p>, <h2>, <ul>, <li>, <strong>, <em> tags. No markdown, no code fences, no commentary.",
        f"Note HTML:\n{SAMPLE_HTML}", sid + "-improve")
    ok = bool(out) and "<" in out and ">" in out and "```" not in out and len(out) > 80
    record("AI 3/8: improve-writing returns applicable HTML", ok, f"{len(out)} chars")

    # 4 continue writing
    out = await llm(
        "Continue the user's note naturally in their voice. Reply with ONLY 2-3 new sentences of HTML "
        "wrapped in <p> tags. Do not repeat existing content. No code fences.",
        f"Note so far:\n{plain}", sid + "-cont")
    ok = bool(out) and "<p" in out.lower()
    record("AI 4/8: continue writing", ok, f"{len(out)} chars")

    # 5 tone change
    out = await llm(
        "Rewrite the user's note in a professional tone. Reply with ONLY valid HTML "
        "(<p>, <h2>, <ul>, <li>). No code fences, no commentary.",
        f"Note HTML:\n{SAMPLE_HTML}", sid + "-tone")
    ok = bool(out) and "<" in out and "```" not in out
    record("AI 5/8: tone change (professional)", ok, f"{len(out)} chars")

    # 6 action items
    raw = await llm(
        'Extract actionable tasks from the note. Reply ONLY with JSON: {"items": ["task", "task"]}. '
        'If none, use an empty array.',
        f"Note:\n{plain}", sid + "-actions")
    data = parse_json(raw)
    ok = isinstance(data, dict) and isinstance(data.get("items"), list) and len(data["items"]) >= 2
    record("AI 6/8: action-item extraction", ok, f"{len(data['items']) if ok else 0} items")

    # 7 note-scoped Q&A
    out = await llm(
        "Answer questions using ONLY the provided note. If the note does not contain the answer, "
        "say you could not find it in this note. Be concise.",
        f"NOTE:\n{plain}\n\nQUESTION: Who should review the sync conflict resolution copy?",
        sid + "-ask")
    ok = bool(out) and "priya" in out.lower()
    record("AI 7/8: note-scoped Q&A grounded in note", ok, repr(out[:100]))

    # 8 tag suggestions
    raw = await llm(
        'Suggest 3-5 short lowercase topic tags for the note. Reply ONLY with JSON: '
        '{"tags": ["tag", "tag"]}. Each tag 1-2 words.',
        f"Note:\n{plain}", sid + "-tags")
    data = parse_json(raw)
    ok = isinstance(data, dict) and isinstance(data.get("tags"), list) and len(data["tags"]) >= 3
    record("AI 8/8: tag suggestions parseable JSON", ok, str(data.get("tags") if ok else raw[:80]))


async def main():
    print("=" * 78)
    print("PHASE 1 CORE POC — Modern Notepad (Mongo + Search + AI assistant)")
    print("=" * 78)
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    try:
        plain = await test_mongo(db)
        print("-" * 78)
        if plain:
            await test_ai(plain)
    finally:
        await db[COLL].drop()
        client.close()

    print("=" * 78)
    failed = [r for r in RESULTS if not r[1]]
    print(f"TOTAL: {len(RESULTS)}  PASSED: {len(RESULTS) - len(failed)}  FAILED: {len(failed)}")
    if failed:
        for n, _, d in failed:
            print(f"  FAILED -> {n} {d}")
        print("RESULT: CORE NOT READY")
        sys.exit(1)
    print("RESULT: CORE WORKS — proceed to Phase 2")


if __name__ == "__main__":
    asyncio.run(main())
