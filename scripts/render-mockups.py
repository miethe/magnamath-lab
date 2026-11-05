#!/usr/bin/env python3
"""Render the final-product HTML mockups to deterministic PNG files.

Prerequisites:
  python3 -m pip install playwright
  playwright install chromium

The script also accepts MAGNAMATH_CHROMIUM=/path/to/chromium and will use
/usr/bin/chromium when available. It intentionally renders local HTML through
page.set_content so no development server or network access is required.
"""

from __future__ import annotations

import asyncio
import os
from pathlib import Path

from playwright.async_api import async_playwright

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MOCKUP_ROOT = PROJECT_ROOT / "design" / "mockups"
OUTPUT_ROOT = MOCKUP_ROOT / "png"

MOCKUPS: tuple[tuple[str, str, tuple[int, int]], ...] = (
    ("01-fold-studio.html", "01-fold-studio.png", (1440, 900)),
    ("02-explorer.html", "02-explorer.png", (1440, 900)),
    ("03-net-workshop.html", "03-net-workshop.png", (1440, 900)),
    ("04-build-along.html", "04-build-along.png", (1440, 900)),
    ("05-learning-lab.html", "05-learning-lab.png", (1440, 900)),
    ("06-spatial-motion-lab.html", "06-spatial-motion-lab.png", (1440, 900)),
    ("07-mobile-build.html", "07-mobile-build.png", (390, 844)),
)


def chromium_path() -> str | None:
    configured = os.getenv("MAGNAMATH_CHROMIUM")
    if configured:
        path = Path(configured)
        if not path.is_file():
            raise FileNotFoundError(f"MAGNAMATH_CHROMIUM does not exist: {path}")
        return str(path)

    system_chromium = Path("/usr/bin/chromium")
    return str(system_chromium) if system_chromium.is_file() else None


async def render() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    css = (MOCKUP_ROOT / "mockups.css").read_text(encoding="utf-8")

    launch_kwargs: dict[str, object] = {
        "headless": True,
        "args": ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    }
    executable = chromium_path()
    if executable:
        launch_kwargs["executable_path"] = executable

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(**launch_kwargs)
        try:
            for source_name, output_name, viewport in MOCKUPS:
                source = (MOCKUP_ROOT / source_name).read_text(encoding="utf-8")
                document = source.replace(
                    '<link rel="stylesheet" href="mockups.css">',
                    f"<style>{css}</style>",
                )
                page = await browser.new_page(
                    viewport={"width": viewport[0], "height": viewport[1]},
                    device_scale_factor=1,
                )
                try:
                    await page.set_content(document, wait_until="load")
                    await page.screenshot(
                        path=str(OUTPUT_ROOT / output_name),
                        full_page=False,
                    )
                finally:
                    await page.close()
                print(output_name)
        finally:
            await browser.close()


if __name__ == "__main__":
    asyncio.run(render())
