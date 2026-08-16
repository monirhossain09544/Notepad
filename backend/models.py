"""Pydantic request/response models."""
from typing import List, Optional

from pydantic import BaseModel, Field


class NoteCreate(BaseModel):
    title: Optional[str] = None
    html_content: Optional[str] = None
    folder_id: Optional[str] = None
    tag_ids: List[str] = Field(default_factory=list)
    color: Optional[str] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    html_content: Optional[str] = None
    folder_id: Optional[str] = None
    tag_ids: Optional[List[str]] = None
    color: Optional[str] = None
    pinned: Optional[bool] = None
    archived: Optional[bool] = None


class ToggleBody(BaseModel):
    value: bool = True


class FolderCreate(BaseModel):
    name: str


class FolderUpdate(BaseModel):
    name: str


class TagCreate(BaseModel):
    name: str
    color: str = "186 52% 44%"


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class AIRequest(BaseModel):
    note_id: Optional[str] = None
    html_content: Optional[str] = None
    tone: Optional[str] = None
    instruction: Optional[str] = None


class AskRequest(BaseModel):
    note_id: Optional[str] = None
    html_content: Optional[str] = None
    question: str
