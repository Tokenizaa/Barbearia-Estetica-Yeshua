#!/usr/bin/env python3
"""Private, minimal Google Maps lead scraper using Playwright.

This process requires Python + Chromium and runs outside Cloudflare Workers.
It only reads publicly visible listings and does not attempt to bypass CAPTCHA,
login walls, access controls, or anti-abuse measures.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import re
import sys
from datetime import datetime, timezone
from urllib.parse import quote_plus, urlparse

from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError


def clean(value: str | None) -> str | None:
    value = re.sub(r"\s+", " ", value or "").strip()
    return value or None


async def text_or_none(locator) -> str | None:
    try:
        return clean(await locator.first.inner_text(timeout=1200))
    except Exception:
        return None


async def attr_or_none(locator, attr: str) -> str | None:
    try:
        return clean(await locator.first.get_attribute(attr, timeout=1200))
    except Exception:
        return None


async def scrape(search: str, limit: int, headless: bool = True) -> list[dict]:
    query_url = "https://www.google.com/maps/search/" + quote_plus(search)
    results: list[dict] = []
    seen: set[str] = set()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context(
            locale="pt-BR",
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        )
        page = await context.new_page()
        try:
            await page.goto(query_url, wait_until="domcontentloaded", timeout=45000)
            try:
                await page.get_by_role("button", name=re.compile("Accept all|Aceitar tudo", re.I)).click(timeout=1500)
            except Exception:
                pass

            feed = page.locator('div[role="feed"]')
            try:
                await feed.wait_for(timeout=15000)
            except PlaywrightTimeoutError:
                body = (await page.locator("body").inner_text())[:1000]
                if re.search(r"captcha|unusual traffic|tráfego incomum", body, re.I):
                    raise RuntimeError("A fonte apresentou uma verificação de acesso; busca interrompida sem tentar contorná-la.")
                raise RuntimeError("A lista pública do Google Maps não carregou nesta sessão.")

            previous_count = 0
            stable_rounds = 0
            while len(results) < limit and stable_rounds < 4:
                cards = page.locator('a[href*="/maps/place/"]')
                count = await cards.count()
                for i in range(count):
                    if len(results) >= limit:
                        break
                    card = cards.nth(i)
                    href = await attr_or_none(card, "href")
                    if not href or href in seen:
                        continue
                    seen.add(href)
                    name = await attr_or_none(card, "aria-label") or await text_or_none(card)
                    if not name:
                        continue
                    parent = card.locator("xpath=..")
                    blob = await text_or_none(parent) or ""
                    rating_match = re.search(r"(\d[.,]\d)\s*\((\d[.\d,]*)\)", blob)
                    phone_match = re.search(r"(?:\+?\d[\d ()-]{7,}\d)", blob)
                    results.append({
                        "business_name": name,
                        "category": None,
                        "address": None,
                        "city": None,
                        "region": None,
                        "phone": clean(phone_match.group(0)) if phone_match else None,
                        "website_url": None,
                        "rating": float(rating_match.group(1).replace(",", ".")) if rating_match else None,
                        "reviews_count": int(re.sub(r"\D", "", rating_match.group(2))) if rating_match else None,
                        "source_url": href,
                        "source_provider": "google-maps-playwright",
                        "captured_at": datetime.now(timezone.utc).isoformat(),
                        "raw_public_text": blob[:1500] or None,
                    })
                if count == previous_count:
                    stable_rounds += 1
                else:
                    stable_rounds = 0
                    previous_count = count
                await feed.evaluate("(el) => { el.scrollTop = el.scrollHeight; }")
                await page.wait_for_timeout(900)

            # Open each listing for structured public details when possible.
            for item in results:
                try:
                    await page.goto(item["source_url"], wait_until="domcontentloaded", timeout=15000)
                    await page.wait_for_timeout(250)
                    item["address"] = await attr_or_none(page.locator('button[data-item-id="address"]'), "aria-label")
                    item["phone"] = item["phone"] or await attr_or_none(page.locator('button[data-item-id^="phone:tel:"]'), "aria-label")
                    website = await attr_or_none(page.locator('a[data-item-id="authority"]'), "href")
                    if website and urlparse(website).scheme in ("http", "https"):
                        item["website_url"] = website
                    item["category"] = await text_or_none(page.locator('button[jsaction*="category"]'))
                except Exception:
                    continue
        finally:
            await context.close()
            await browser.close()

    return results[:limit]


async def main() -> int:
    parser = argparse.ArgumentParser(description="Scraper privado de estabelecimentos públicos no Google Maps")
    parser.add_argument("--search", "-s", required=True, help='Consulta, por exemplo: "Barbearias em Porto Alegre RS"')
    parser.add_argument("--limit", "-t", type=int, default=10)
    parser.add_argument("--output", "-o", default="-", help="Arquivo JSON de saída; padrão: stdout")
    parser.add_argument("--headed", action="store_true", help="Executar navegador visível para diagnóstico")
    args = parser.parse_args()
    if not 1 <= args.limit <= 100:
        parser.error("--limit precisa estar entre 1 e 100")

    try:
        records = await scrape(args.search, args.limit, headless=not args.headed)
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 2

    output = json.dumps({"ok": True, "query": args.search, "count": len(records), "results": records}, ensure_ascii=False, indent=2)
    if args.output == "-":
        print(output)
    else:
        with open(args.output, "w", encoding="utf-8") as file:
            file.write(output + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
