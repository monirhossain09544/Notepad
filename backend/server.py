"""Modern Notepad API — FastAPI + MongoDB."""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware

import routers_ai
import routers_notes
from db import client, ensure_indexes
from routers_meta import folders_router, stats_router, tags_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("notepad")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await ensure_indexes()
    logger.info("Notepad API ready")
    yield
    client.close()


app = FastAPI(title="Modern Notepad API", version="1.0.0", lifespan=lifespan)

api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def health():
    return {"status": "ok", "service": "notepad", "ai": bool(os.environ.get("EMERGENT_LLM_KEY"))}


api_router.include_router(routers_notes.router)
api_router.include_router(folders_router)
api_router.include_router(tags_router)
api_router.include_router(stats_router)
api_router.include_router(routers_ai.router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
