import os
import json

from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

os.environ["LD_LIBRARY_PATH"] = (
    "/workspace/.local/chromelibs/usr/lib/x86_64-linux-gnu:/workspace/.local/chromelibs:"
    + os.environ.get("LD_LIBRARY_PATH", "")
)

URL = "http://127.0.0.1:4179/"
KEY = "five_years_diary_v1"
PHOTOS = [f"/workspace/fiveyears-diary/tests/edge-photo-{i}.png" for i in range(4)]
BAD = "/workspace/fiveyears-diary/tests/not-a-backup.json"

results = []


def check(name, condition, detail=""):
    results.append((name, bool(condition), detail))
    print(("PASS  " if condition else "FAIL  ") + name + (f" | {detail}" if detail else ""))


def storage(page):
    raw = page.evaluate(f"localStorage.getItem('{KEY}')")
    return json.loads(raw) if raw else {}


def run():
    for index, path in enumerate(PHOTOS):
        img = Image.new("RGB", (900, 700), (200 - index * 8, 190, 170))
        ImageDraw.Draw(img).rectangle([100, 100, 800, 600], fill=(74, 37, 37))
        img.save(path)
    with open(BAD, "w", encoding="utf-8") as handle:
        handle.write('{"hello": "not a diary"}')

    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--no-sandbox"])
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.goto(URL, wait_until="networkidle")
        page.evaluate("localStorage.clear()")
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(500)

        page.get_by_role("button", name="데모 체험하기").click()
        page.wait_for_timeout(700)
        page.get_by_label("2024년 11월 21일 기록").fill("내가 직접 고친 2024년 기록")
        page.wait_for_timeout(900)

        page.locator(".topbar__actions").get_by_role("button", name="데모 초기화").click()
        page.wait_for_timeout(600)
        check("demo off keeps my own edit", page.get_by_label("2024년 11월 21일 기록").input_value() == "내가 직접 고친 2024년 기록")
        check("demo off hides demo text", page.get_by_label("2023년 11월 21일 기록").input_value() == "")
        check("demo flag off stored", storage(page).get("demoActive") is False)

        page.locator(".topbar__actions").get_by_role("button", name="데모 데이터 채우기").click()
        page.wait_for_timeout(600)
        check("demo back shows demo again", len(page.get_by_label("2023년 11월 21일 기록").input_value()) > 30)
        check("my edit still overrides demo", page.get_by_label("2024년 11월 21일 기록").input_value() == "내가 직접 고친 2024년 기록")

        page.locator('button[aria-label="설정"]').click()
        page.wait_for_timeout(300)
        page.set_input_files('input[accept*="json"]', BAD)
        page.wait_for_timeout(300)
        page.get_by_role("button", name="덮어쓰기").click()
        page.wait_for_timeout(400)
        check("bad backup reports an error", "백업이 아니에요" in page.locator(".settings__msg").inner_text(), page.locator(".settings__msg").inner_text())
        page.locator(".segmented__item", has_text="English").click()
        page.wait_for_timeout(400)
        check("document title follows language", "five-year diary" in page.title(), page.title())
        page.locator(".modal__foot").get_by_role("button", name="Close").click()
        page.wait_for_timeout(300)
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(700)
        check("language survives reload", page.evaluate("document.documentElement.lang") == "en")
        check("settings reopen in English", page.locator('button[aria-label="Settings"]').count() == 1)

        page.locator('button[aria-label="Settings"]').click()
        page.wait_for_timeout(300)
        page.locator(".modal__foot").get_by_role("button", name="Close").click()
        page.wait_for_timeout(200)

        # photo limit, four files at once
        page.set_input_files('input[accept="image/*"]', PHOTOS)
        page.wait_for_timeout(2000)
        check("only three photos stored", page.locator(".photo img").count() == 3, str(page.locator(".photo img").count()))
        error_text = page.locator(".photo-error").inner_text() if page.locator(".photo-error").count() else "none"
        check("limit message shows", "Three photos" in error_text, error_text)
        check("storage holds three", len(storage(page)["notes"]["11-21"]["photos"]) == 3)

        check("no console errors", len(errors) == 0, "; ".join(errors[:2]))
        browser.close()

    failed = sum(1 for _, ok, _ in results if not ok)
    print(f"\n{len(results) - failed}/{len(results)} passed, {failed} failed")
    return 1 if failed else 0


raise SystemExit(run())
