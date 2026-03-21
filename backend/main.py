import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import health, stt, knowledge, sessions, payments

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Telepromt IA API iniciada — v%s", app.version)
    yield

app = FastAPI(
    title="Telepromt IA API",
    version="0.1.0",
    description="API del SaaS Telepromt IA",
    lifespan=lifespan,
)

# Orígenes desde env (web app, etc.) + orígenes fijos del desktop Tauri
_env_origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
_tauri_origins = ["tauri://localhost", "https://tauri.localhost"]
cors_origins = list(dict.fromkeys([o.strip() for o in _env_origins + _tauri_origins if o.strip()]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(stt.router)
app.include_router(knowledge.router)
app.include_router(sessions.router)
app.include_router(payments.router)

