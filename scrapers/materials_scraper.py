"""
AlloyWatch Materials Scraper
Runs nightly on Railway. Fetches commodity prices and news disruption signals.

Usage:
  python scrapers/materials_scraper.py

Environment variables required:
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEWS_API_KEY
"""

import os
import json
import httpx
import asyncio
from datetime import datetime, timezone
from typing import Optional

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
NEWS_API_KEY = os.environ.get("NEWS_API_KEY")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

# Keywords that signal supply disruption per material
DISRUPTION_KEYWORDS = {
    "inconel-718": ["inconel supply", "nickel shortage", "superalloy lead time", "haynes international"],
    "ti-6al-4v": ["titanium shortage", "titanium supply disruption", "VSMPO", "titanium sponge"],
    "toray-t700": ["carbon fibre shortage", "carbon fiber supply", "toray production", "composite shortage"],
    "inconel-625": ["inconel 625 lead time", "nickel alloy shortage"],
    "maraging-300": ["maraging steel supply", "ultra high strength steel shortage"],
}


async def fetch_news_alerts(client: httpx.AsyncClient, material_slug: str) -> list[dict]:
    """Fetch news articles that may signal supply disruptions."""
    if not NEWS_API_KEY:
        print(f"  [skip] No NEWS_API_KEY for {material_slug}")
        return []

    keywords = " OR ".join(DISRUPTION_KEYWORDS.get(material_slug, []))
    if not keywords:
        return []

    url = "https://newsapi.org/v2/everything"
    params = {
        "q": keywords,
        "sortBy": "publishedAt",
        "pageSize": 5,
        "language": "en",
        "apiKey": NEWS_API_KEY,
    }

    try:
        r = await client.get(url, params=params, timeout=10)
        r.raise_for_status()
        articles = r.json().get("articles", [])
        print(f"  [news] {material_slug}: {len(articles)} articles found")
        return articles
    except Exception as e:
        print(f"  [error] News fetch for {material_slug}: {e}")
        return []


async def get_materials(client: httpx.AsyncClient) -> list[dict]:
    """Fetch all tracked materials from Supabase."""
    r = await client.get(
        f"{SUPABASE_URL}/rest/v1/materials",
        headers=HEADERS,
        params={"is_active": "eq.true", "select": "id,slug,name,category"},
    )
    r.raise_for_status()
    return r.json()


async def insert_alert(client: httpx.AsyncClient, alert: dict) -> None:
    """Insert a supply disruption alert into Supabase."""
    r = await client.post(
        f"{SUPABASE_URL}/rest/v1/alerts",
        headers=HEADERS,
        json=alert,
    )
    if r.status_code not in (200, 201):
        print(f"  [error] Insert alert failed: {r.text}")


async def run_scraper():
    print(f"[AlloyWatch Scraper] Starting at {datetime.now(timezone.utc).isoformat()}")

    async with httpx.AsyncClient() as client:
        materials = await get_materials(client)
        print(f"[AlloyWatch Scraper] Found {len(materials)} tracked materials")

        for material in materials:
            print(f"\n[→] Processing {material['name']} ({material['slug']})")

            # Fetch news disruption signals
            articles = await fetch_news_alerts(client, material["slug"])

            for article in articles[:2]:  # max 2 alerts per material per run
                if not article.get("title"):
                    continue

                alert = {
                    "material_id": material["id"],
                    "alert_type": "news",
                    "title": article["title"][:255],
                    "summary": (article.get("description") or "")[:500],
                    "severity": "medium",  # default; manual review can upgrade
                    "source_url": article.get("url"),
                    "is_active": True,
                }
                await insert_alert(client, alert)
                print(f"  [✓] Alert inserted: {alert['title'][:60]}...")

    print(f"\n[AlloyWatch Scraper] Done at {datetime.now(timezone.utc).isoformat()}")


if __name__ == "__main__":
    asyncio.run(run_scraper())
