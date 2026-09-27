"""
AlloyWatch Materials Scraper v2
Runs nightly on Railway. Fetches disruption signals from trade press RSS feeds
(primary) and NewsAPI (fallback). Both write to the alerts table.

Environment variables required:
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
Optional:
  NEWS_API_KEY  — enables NewsAPI fallback pass
"""

import os
import asyncio
import feedparser
import httpx
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

# ── Config ────────────────────────────────────────────────────────────────────

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
NEWS_API_KEY = os.environ.get("NEWS_API_KEY")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

# ── RSS feeds ─────────────────────────────────────────────────────────────────
RSS_FEEDS = [
    ("Aviation Week",       "https://aviationweek.com/rss.xml"),
    ("Defense News",        "https://www.defensenews.com/arc/outboundfeeds/rss/"),
    ("FlightGlobal",        "https://www.flightglobal.com/rss/"),
    ("SpaceNews",           "https://spacenews.com/feed/"),
    ("Aerospace Technology","https://www.aerospace-technology.com/feeds/news/"),
    ("Aero-Mag",            "https://www.aero-mag.com/feed/"),
    ("The Manufacturer",    "https://www.themanufacturer.com/feed/"),
    ("American Machinist",  "https://www.americanmachinist.com/rss"),
    ("Fastmarkets",         "https://www.fastmarkets.com/rss/latest-news"),
    ("Reuters Business",    "https://feeds.reuters.com/reuters/businessNews"),
]

# ── Keywords per material slug ────────────────────────────────────────────────
MATERIAL_KEYWORDS: dict[str, list[str]] = {
    "inconel-718": [
        "inconel 718", "inconel718", "superalloy shortage", "superalloy lead time",
        "nickel superalloy", "haynes international", "special metals",
    ],
    "ti-6al-4v": [
        "ti-6al-4v", "titanium 6-4", "titanium alloy shortage", "titanium sponge",
        "VSMPO", "VSMPO-AVISMA", "titanium supply disruption", "titanium lead time",
    ],
    "toray-t700": [
        "toray t700", "carbon fibre shortage", "carbon fiber shortage",
        "CFRP supply", "composite shortage", "toray production",
    ],
    "inconel-625": [
        "inconel 625", "nickel alloy shortage", "corrosion-resistant alloy shortage",
    ],
    "maraging-300": [
        "maraging steel", "ultra high strength steel shortage",
    ],
    "rhenium": [
        "rhenium supply", "rhenium shortage", "rhenium price", "rhenium allocation",
    ],
    "beryllium": [
        "beryllium supply", "beryllium shortage", "materion", "ngk berylco",
    ],
    "hafnium": [
        "hafnium supply", "hafnium shortage", "hafnium price",
    ],
    "tungsten": [
        "tungsten shortage", "tungsten supply disruption", "tungsten lead time",
    ],
    "cobalt": [
        "cobalt shortage", "cobalt supply disruption", "DRC cobalt", "cobalt allocation",
    ],
}

HIGH_SEVERITY_TERMS = [
    "shortage", "allocation", "force majeure", "critical supply", "supply crisis",
    "export ban", "sanctions", "trade restriction", "mill closure", "plant closure",
]
MEDIUM_SEVERITY_TERMS = [
    "lead time", "delay", "disruption", "supply chain", "constraint",
    "limited availability", "extended lead", "backlog",
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def score_severity(text: str) -> str:
    lower = text.lower()
    if any(t in lower for t in HIGH_SEVERITY_TERMS):
        return "high"
    if any(t in lower for t in MEDIUM_SEVERITY_TERMS):
        return "medium"
    return "low"


def parse_published_at(entry) -> str:
    for attr in ("published", "updated"):
        raw = getattr(entry, attr, None)
        if raw:
            try:
                return parsedate_to_datetime(raw).isoformat()
            except Exception:
                pass
    return datetime.now(timezone.utc).isoformat()


def article_matches(material_slug: str, title: str, summary: str) -> bool:
    keywords = MATERIAL_KEYWORDS.get(material_slug, [])
    haystack = (title + " " + summary).lower()
    return any(kw.lower() in haystack for kw in keywords)


# ── Supabase ──────────────────────────────────────────────────────────────────

async def get_materials(client: httpx.AsyncClient) -> list[dict]:
    r = await client.get(
        f"{SUPABASE_URL}/rest/v1/materials",
        headers=HEADERS,
        params={"is_active": "eq.true", "select": "id,slug,name,category"},
    )
    r.raise_for_status()
    return r.json()


async def insert_alert(client: httpx.AsyncClient, alert: dict) -> bool:
    """Insert alert; returns True on success, False on duplicate/error."""
    r = await client.post(
        f"{SUPABASE_URL}/rest/v1/alerts",
        headers={**HEADERS, "Prefer": "resolution=ignore-duplicates"},
        json=alert,
    )
    if r.status_code == 409 or (r.status_code == 400 and "23505" in r.text):
        print(f"    [skip] Duplicate: {alert['title'][:60]}...")
        return False
    if r.status_code not in (200, 201):
        print(f"    [error] Insert failed ({r.status_code}): {r.text[:120]}")
        return False
    return True


# ── RSS pass ──────────────────────────────────────────────────────────────────

async def fetch_rss_feed(client: httpx.AsyncClient, name: str, url: str) -> list:
    try:
        r = await client.get(
            url, timeout=15, follow_redirects=True,
            headers={"User-Agent": "AlloyWatch/2.0 (materials intelligence)"},
        )
        if r.status_code != 200:
            print(f"  [rss] {name}: HTTP {r.status_code}")
            return []
        parsed = feedparser.parse(r.text)
        print(f"  [rss] {name}: {len(parsed.entries)} entries")
        return parsed.entries
    except Exception as e:
        print(f"  [rss] {name}: error — {e}")
        return []


async def run_rss_pass(client: httpx.AsyncClient, materials: list[dict]) -> int:
    print("\n── RSS pass ─────────────────────────────────────────────────────")

    tasks = [fetch_rss_feed(client, name, url) for name, url in RSS_FEEDS]
    feed_results = await asyncio.gather(*tasks)

    all_entries = []
    for (name, _), entries in zip(RSS_FEEDS, feed_results):
        for entry in entries:
            all_entries.append((name, entry))

    print(f"\n  {len(all_entries)} total entries across {len(RSS_FEEDS)} feeds")

    inserted = 0
    for material in materials:
        slug = material["slug"]
        matched = 0
        for source_name, entry in all_entries:
            title = entry.get("title", "")
            summary = entry.get("summary", "") or entry.get("description", "")

            if not article_matches(slug, title, summary):
                continue

            alert = {
                "material_id": material["id"],
                "alert_type": "news",
                "title": title[:255],
                "summary": summary[:500],
                "severity": score_severity(title + " " + summary),
                "source_url": entry.get("link"),
                "is_active": True,
            }

            ok = await insert_alert(client, alert)
            if ok:
                inserted += 1
                matched += 1
                print(f"    [✓] {material['name']}: {title[:70]}...")

            if matched >= 3:
                break

    return inserted


# ── NewsAPI fallback pass ─────────────────────────────────────────────────────

async def fetch_newsapi(client: httpx.AsyncClient, material_slug: str) -> list[dict]:
    keywords = " OR ".join(MATERIAL_KEYWORDS.get(material_slug, []))
    if not keywords:
        return []
    try:
        r = await client.get(
            "https://newsapi.org/v2/everything",
            params={
                "q": keywords,
                "sortBy": "publishedAt",
                "pageSize": 5,
                "language": "en",
                "apiKey": NEWS_API_KEY,
            },
            timeout=10,
        )
        r.raise_for_status()
        articles = r.json().get("articles", [])
        print(f"  [newsapi] {material_slug}: {len(articles)} articles")
        return articles
    except Exception as e:
        print(f"  [newsapi] {material_slug}: error — {e}")
        return []


async def run_newsapi_pass(client: httpx.AsyncClient, materials: list[dict]) -> int:
    if not NEWS_API_KEY:
        print("\n── NewsAPI pass: skipped (no API key) ───────────────────────────")
        return 0

    print("\n── NewsAPI fallback pass ────────────────────────────────────────")
    inserted = 0

    for material in materials:
        articles = await fetch_newsapi(client, material["slug"])
        for article in articles[:2]:
            title = article.get("title", "")
            if not title:
                continue

            summary = article.get("description") or ""
            alert = {
                "material_id": material["id"],
                "alert_type": "news",
                "title": title[:255],
                "summary": summary[:500],
                "severity": score_severity(title + " " + summary),
                "source_url": article.get("url"),
                "is_active": True,
            }
            ok = await insert_alert(client, alert)
            if ok:
                inserted += 1
                print(f"    [✓] {material['name']}: {title[:70]}...")

    return inserted


# ── Main ──────────────────────────────────────────────────────────────────────

async def run_scraper():
    print(f"[AlloyWatch Scraper v2] Starting at {datetime.now(timezone.utc).isoformat()}")

    async with httpx.AsyncClient() as client:
        materials = await get_materials(client)
        print(f"[AlloyWatch Scraper v2] {len(materials)} tracked materials")

        rss_count = await run_rss_pass(client, materials)
        news_count = await run_newsapi_pass(client, materials)

        total = rss_count + news_count
        print(f"\n[AlloyWatch Scraper v2] Done — {rss_count} from RSS · {news_count} from NewsAPI · {total} total new alerts")
        print(f"[AlloyWatch Scraper v2] Finished at {datetime.now(timezone.utc).isoformat()}")


if __name__ == "__main__":
    asyncio.run(run_scraper())
