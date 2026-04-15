"""Sports Predict — FastAPI 앱 진입점"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import init_db, close_db
from routes import odds, stats, predictions, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(title="Sports Predict API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(odds.router, prefix="/api/odds", tags=["odds"])
app.include_router(stats.router, prefix="/api/stats", tags=["stats"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])
