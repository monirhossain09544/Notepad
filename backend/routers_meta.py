"""Folders, tags and workspace stats."""
import uuid

from fastapi import APIRouter, HTTPException

from db import folders_col, notes_col, serialize, tags_col, utcnow
from models import FolderCreate, FolderUpdate, TagCreate, TagUpdate

folders_router = APIRouter(prefix="/folders", tags=["folders"])
tags_router = APIRouter(prefix="/tags", tags=["tags"])
stats_router = APIRouter(tags=["stats"])


@folders_router.get("")
async def list_folders():
    docs = await folders_col.find().sort("name", 1).to_list(300)
    return [serialize(d) for d in docs]


@folders_router.post("")
async def create_folder(payload: FolderCreate):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Folder name is required")
    now = utcnow()
    doc = {"id": str(uuid.uuid4()), "name": name[:80], "created_at": now, "updated_at": now}
    await folders_col.insert_one(dict(doc))
    return serialize(doc)


@folders_router.put("/{folder_id}")
async def update_folder(folder_id: str, payload: FolderUpdate):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Folder name is required")
    result = await folders_col.update_one(
        {"id": folder_id}, {"$set": {"name": name[:80], "updated_at": utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Folder not found")
    return serialize(await folders_col.find_one({"id": folder_id}))


@folders_router.delete("/{folder_id}")
async def delete_folder(folder_id: str):
    result = await folders_col.delete_one({"id": folder_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Folder not found")
    await notes_col.update_many({"folder_id": folder_id}, {"$set": {"folder_id": None}})
    return {"deleted": True, "id": folder_id}


@tags_router.get("")
async def list_tags():
    docs = await tags_col.find().sort("name", 1).to_list(300)
    return [serialize(d) for d in docs]


@tags_router.post("")
async def create_tag(payload: TagCreate):
    name = payload.name.strip().lower()
    if not name:
        raise HTTPException(status_code=400, detail="Tag name is required")
    existing = await tags_col.find_one({"name": name})
    if existing:
        return serialize(existing)
    now = utcnow()
    doc = {
        "id": str(uuid.uuid4()),
        "name": name[:40],
        "color": payload.color,
        "created_at": now,
        "updated_at": now,
    }
    await tags_col.insert_one(dict(doc))
    return serialize(doc)


@tags_router.put("/{tag_id}")
async def update_tag(tag_id: str, payload: TagUpdate):
    patch = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if "name" in patch:
        patch["name"] = patch["name"].strip().lower()[:40]
    patch["updated_at"] = utcnow()
    result = await tags_col.update_one({"id": tag_id}, {"$set": patch})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tag not found")
    return serialize(await tags_col.find_one({"id": tag_id}))


@tags_router.delete("/{tag_id}")
async def delete_tag(tag_id: str):
    result = await tags_col.delete_one({"id": tag_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tag not found")
    await notes_col.update_many({"tag_ids": tag_id}, {"$pull": {"tag_ids": tag_id}})
    return {"deleted": True, "id": tag_id}


@stats_router.get("/stats")
async def workspace_stats():
    live = {"trashed": False, "archived": False}
    all_count = await notes_col.count_documents(live)
    pinned = await notes_col.count_documents({**live, "pinned": True})
    archived = await notes_col.count_documents({"trashed": False, "archived": True})
    trashed = await notes_col.count_documents({"trashed": True})

    folder_counts = {}
    async for row in notes_col.aggregate(
        [{"$match": live}, {"$group": {"_id": "$folder_id", "n": {"$sum": 1}}}]
    ):
        if row["_id"]:
            folder_counts[row["_id"]] = row["n"]

    tag_counts = {}
    async for row in notes_col.aggregate(
        [
            {"$match": live},
            {"$unwind": "$tag_ids"},
            {"$group": {"_id": "$tag_ids", "n": {"$sum": 1}}},
        ]
    ):
        tag_counts[row["_id"]] = row["n"]

    words = 0
    async for row in notes_col.aggregate(
        [{"$match": {"trashed": False}}, {"$group": {"_id": None, "w": {"$sum": "$word_count"}}}]
    ):
        words = row.get("w") or 0

    total = await notes_col.count_documents({})
    return {
        "all": all_count,
        "pinned": pinned,
        "archive": archived,
        "trash": trashed,
        "total": total,
        "words": words,
        "folders": folder_counts,
        "tags": tag_counts,
    }
