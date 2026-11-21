import base64
import io
import json
import os
import sys
import tempfile

from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

os.environ["LD_LIBRARY_PATH"] = (
    "/workspace/.local/chromelibs/usr/lib/x86_64-linux-gnu:/workspace/.local/chromelibs:"
    + os.environ.get("LD_LIBRARY_PATH", "")
)

URL = "http://127.0.0.1:4179/"
KEY = "five_years_diary_v1"
OUT = "/workspace/browser"
PHOTO = "/workspace/fiveyears-diary/tests/sample-photo.png"

results = []


def check(name, condition, detail=""):
    results.append((name, bool(condition), detail))
    print(("PASS  " if condition else "FAIL  ") + name + (f" | {detail}" if detail else ""))


def make_photo():
    img = Image.new("RGB", (1600, 1000), (238, 232, 220))
    draw = ImageDraw.Draw(img)
    for i in range(0, 1600, 40):
        draw.rectangle([i, 0, i + 18, 1000], fill=(210 + (i // 40) % 20, 196, 172))
    draw.ellipse([520, 260, 1080, 820], fill=(74, 37, 37))
    draw.rectangle([700, 420, 900, 660], fill=(250, 247, 240))
    img.save(PHOTO)


def storage(page):
    raw = page.evaluate(f"localStorage.getItem('{KEY}')")
    return json.loads(raw) if raw else {}


def wait_saved(page):
    page.wait_for_function(
        "() => { const el = document.querySelector('.save-status'); return el && el.getAttribute('data-state') === 'saved'; }",
        timeout=5000,
    )


def run():
    make_photo()
    console_errors = []
    failed = 0

    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--no-sandbox"])
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        page = ctx.new_page()
        page.on("console", lambda m: console_errors.append(f"{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        page.goto(URL, wait_until="networkidle")
        page.evaluate("localStorage.clear()")
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(600)

        # 1. initial state
        check("initial date is today", page.locator("h1").inner_text().strip() == "11월 21일", page.locator("h1").inner_text())
        check("five year slots", page.locator(".year-slot").count() == 5)
        check("current year highlighted", page.locator(".year-slot--current .year-slot__year").inner_text().startswith("2026"))
        check("current year says 올해", "올해" in page.locator(".year-slot--current").inner_text())
        check("demo banner shows", page.get_by_text("3년 치 시간여행").is_visible())
        check("footer note shows", "이 브라우저" in page.locator(".app__foot").inner_text())
        check("no horizontal overflow at 1440", page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth"))

        # 2. demo
        page.get_by_role("button", name="데모 체험하기").click()
        page.wait_for_timeout(800)
        years = page.locator(".year-slot textarea")
        values = [years.nth(i).input_value() for i in range(5)]
        check("demo fills 2023", len(values[0]) > 30, values[0][:24])
        check("demo fills 2024", len(values[1]) > 30, values[1][:24])
        check("demo fills 2025", len(values[2]) > 30, values[2][:24])
        check("demo leaves 2027 empty", values[4] == "")
        badge = page.locator(".recall")
        check("recall badge appears", badge.count() == 1 and "년 전" in badge.inner_text(), badge.inner_text() if badge.count() else "none")
        check("demo active stored", storage(page).get("demoActive") is True)

        # 3. inline edit and persistence
        entry = page.get_by_label("2026년 11월 21일 기록")
        entry.fill("오늘의 첫 문장을 적었습니다. 다섯 해 뒤에 다시 읽어 보려고요.")
        page.wait_for_timeout(900)
        wait_saved(page)
        check("save status shows 저장됨", "저장됨" in page.locator(".save-status").inner_text())
        saved = storage(page)
        check("entry saved to localStorage", "오늘의 첫 문장" in saved.get("entries", {}).get("2026-11-21", ""))
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(800)
        check(
            "entry survives reload",
            "오늘의 첫 문장" in page.get_by_label("2026년 11월 21일 기록").input_value(),
        )

        # 4. month index
        page.locator('.month-tab[aria-label="3월"]').click()
        page.wait_for_timeout(300)
        check("month index jumps to the 1st", page.locator("h1").inner_text().strip() == "3월 1일", page.locator("h1").inner_text())

        # 5. calendar and leap day
        page.locator(".date-nav__label").click()
        page.wait_for_timeout(200)
        check("calendar popover opens", page.locator(".popover").is_visible())
        page.get_by_role("button", name="지난달").click()
        page.wait_for_timeout(200)
        check("calendar moved to February", "2월" in page.locator(".cal__month").inner_text())
        page.locator('.cal__day[aria-label="2월 29일"]').click()
        page.wait_for_timeout(400)
        check("leap page opens", page.locator("h1").inner_text().strip() == "2월 29일", page.locator("h1").inner_text())
        check("only the leap year is writable", page.locator(".year-slot textarea").count() == 1, str(page.locator(".year-slot textarea").count()))
        check("non-leap years explain why", page.locator(".year-slot--leap-off").count() == 4)
        page.get_by_role("button", name="오늘", exact=True).click()
        page.wait_for_timeout(300)

        # 6. stats
        page.locator('button[aria-label="통계"]').click()
        page.wait_for_timeout(400)
        check("stats have three figures", page.locator(".figures .figure").count() == 3)
        check("heatmap has 5 x 53 cells", page.locator(".heatmap__cell").count() == 265)
        summary = page.locator(".stats__summary").inner_text()
        check("stats summary counts the range", "1,826" in summary, summary)
        page.locator(".modal__foot").get_by_role("button", name="닫기").click()
        page.wait_for_timeout(300)

        # 7. settings
        page.locator('button[aria-label="설정"]').click()
        page.wait_for_timeout(300)
        page.get_by_label("이름").fill("조재철")
        page.wait_for_timeout(200)
        check("name reaches the header", "조재철의 오년" in page.locator(".brand__sub").inner_text(), page.locator(".brand__sub").inner_text())

        page.locator(".font-card", has_text="고딕").click()
        page.wait_for_timeout(300)
        check("font switches to gothic", page.evaluate("document.documentElement.dataset.font") == "sans")
        font_family = page.locator(".year-slot textarea").first.evaluate("el => getComputedStyle(el).fontFamily")
        check("diary text follows the font", "Pretendard" in font_family, font_family[:40])

        page.get_by_role("button", name="1년 줄이기").click()
        page.wait_for_timeout(300)
        check("start year steps down", page.locator(".year-slot__year").first.inner_text().startswith("2022"))
        page.get_by_role("button", name="1년 늘리기").click()
        page.wait_for_timeout(300)

        page.locator(".segmented__item", has_text="English").click()
        page.wait_for_timeout(400)
        check("language switches to English", "Settings" in page.locator(".modal__title").inner_text())
        check("date follows the language", "November" in page.locator("h1").inner_text(), page.locator("h1").inner_text())
        page.locator(".segmented__item", has_text="한국어").click()
        page.wait_for_timeout(300)

        with page.expect_download() as download_info:
            page.locator(".modal").get_by_role("button", name="내보내기").click()
        download = download_info.value
        export_path = download.path()
        with open(export_path, "r", encoding="utf-8") as handle:
            backup = json.load(handle)
        check("export downloads valid JSON", "entries" in backup and "2026-11-21" in backup["entries"])
        check("export file name is dated", download.suggested_filename.startswith("fiveyears-backup-"), download.suggested_filename)

        page.set_input_files('input[accept*="json"]', export_path)
        page.wait_for_timeout(400)
        check("import asks before replacing", "덮어씁니다" in page.locator(".settings__confirm").inner_text())
        page.get_by_role("button", name="덮어쓰기").click()
        page.wait_for_timeout(500)
        check("import reports success", "불러왔어요" in page.locator(".settings__msg").inner_text())
        page.locator(".modal__foot").get_by_role("button", name="닫기").click()
        page.wait_for_timeout(300)

        # 8. mood, highlight, photo
        check("demo mood shows as selected", page.locator(".chip", has_text="평온").get_attribute("aria-pressed") == "true")
        page.locator(".chip", has_text="설렘").click()
        page.wait_for_timeout(900)
        check("mood chip selects", page.locator(".chip", has_text="설렘").get_attribute("aria-pressed") == "true")
        check("mood saved", storage(page).get("notes", {}).get("11-21", {}).get("mood") == "flutter")

        highlight = page.get_by_label("2024 해마다의 한 줄")
        highlight.fill("첫 회의록을 칭찬받은 날")
        page.wait_for_timeout(900)
        check("highlight saved", storage(page)["notes"]["11-21"]["highlights"].get("2024") == "첫 회의록을 칭찬받은 날")

        page.set_input_files('input[accept="image/*"]', PHOTO)
        page.wait_for_timeout(1800)
        photos = page.locator(".photo img")
        check("photo thumbnail appears", photos.count() == 1)
        src = photos.first.get_attribute("src")
        raw = base64.b64decode(src.split(",", 1)[1])
        photo_img = Image.open(io.BytesIO(raw))
        check("photo is JPEG", photo_img.format == "JPEG", photo_img.format)
        check("photo capped at 800px", photo_img.width == 800, f"{photo_img.width}x{photo_img.height}")
        check("photo saved", len(storage(page)["notes"]["11-21"]["photos"]) == 1)
        page.get_by_role("button", name="사진 빼기").click()
        page.wait_for_timeout(500)
        check("photo removed", page.locator(".photo img").count() == 0)

        # 9. random travel
        before = page.locator("h1").inner_text()
        page.get_by_role("button", name="랜덤 시간여행").click()
        page.wait_for_timeout(500)
        check("random travel moves to a written day", page.locator("h1").inner_text() != before, f"{before} -> {page.locator('h1').inner_text()}")

        # 10. screenshots
        page.get_by_role("button", name="오늘", exact=True).click()
        page.wait_for_timeout(700)
        page.screenshot(path=f"{OUT}/fiveyears-e2e-demo.png")
        page.locator('button[aria-label="통계"]').click()
        page.wait_for_timeout(500)
        page.screenshot(path=f"{OUT}/fiveyears-e2e-stats.png")
        page.locator(".modal__foot").get_by_role("button", name="닫기").click()

        # 11. responsive widths
        for width, height in [(320, 720), (375, 812), (390, 844), (768, 1024), (1024, 768), (1280, 800), (1440, 900), (1920, 1080)]:
            page.set_viewport_size({"width": width, "height": height})
            page.wait_for_timeout(250)
            overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
            check(f"no horizontal overflow at {width}", overflow <= 0, f"{overflow}px")

        page.set_viewport_size({"width": 1440, "height": 900})
        page.wait_for_timeout(300)
        page.screenshot(path=f"{OUT}/fiveyears-e2e-desktop.png")

        # 12. mobile
        mobile = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=1)
        mp = mobile.new_page()
        mp.on("console", lambda m: console_errors.append(f"m {m.type}: {m.text}") if m.type == "error" else None)
        mp.on("pageerror", lambda e: console_errors.append(f"m pageerror: {e}"))
        mp.goto(URL, wait_until="networkidle")
        mp.wait_for_timeout(600)
        check("mobile starts on the five-year page", mp.locator(".page--left").is_visible() and not mp.locator(".page--right").is_visible())
        check("mobile hides the staircase index", not mp.locator(".month-index").is_visible())
        check("mobile shows the month strip", mp.locator(".month-strip").is_visible())
        mp.locator(".segment__item", has_text="프리노트").click()
        mp.wait_for_timeout(400)
        check("mobile note tab shows the right page", mp.locator(".page--right").is_visible() and not mp.locator(".page--left").is_visible())
        mp.screenshot(path=f"{OUT}/fiveyears-e2e-mobile.png")
        mp.locator(".segment__item", has_text="5년 기록").click()
        mp.wait_for_timeout(300)
        mp.screenshot(path=f"{OUT}/fiveyears-e2e-mobile-timeline.png")

        check("no console errors", len(console_errors) == 0, "; ".join(console_errors[:3]))

        browser.close()

    failed = sum(1 for _, ok, _ in results if not ok)
    print(f"\n{len(results) - failed}/{len(results)} passed, {failed} failed")
    return 1 if failed else 0


sys.exit(run())
