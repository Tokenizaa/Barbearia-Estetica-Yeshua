"""Private HTTP wrapper for the standalone Playwright scraper."""
import os
import hmac
from typing import Any

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from scraper import scrape

app = FastAPI(title="Beleza Digital Private Prospecting Scraper", docs_url=None, redoc_url=None)
SECRET = os.environ.get("PROSPECTING_SCRAPER_SECRET", "")


class SearchRequest(BaseModel):
    search: str = Field(min_length=3, max_length=300)
    limit: int = Field(default=10, ge=1, le=100)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/search")
async def search_leads(payload: SearchRequest, x_scraper_secret: str = Header(default="")) -> dict[str, Any]:
    if not SECRET:
        raise HTTPException(status_code=503, detail="Scraper secret is not configured")
    if not hmac.compare_digest(x_scraper_secret, SECRET):
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        results = await scrape(payload.search, payload.limit)
    except Exception as exc:
        # Do not return internal details or secrets to callers.
        raise HTTPException(status_code=502, detail="Public listing search failed") from exc
    return {"ok": True, "query": payload.search, "count": len(results), "results": results}
