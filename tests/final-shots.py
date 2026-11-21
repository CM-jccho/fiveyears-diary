import os
from playwright.sync_api import sync_playwright

os.environ["LD_LIBRARY_PATH"] = (
    "/workspace/.local/chromelibs/usr/lib/x86_64-linux-gnu:/workspace/.local/chromelibs:"
    + os.environ.get("LD_LIBRARY_PATH", "")
)

URL = "http://127.0.0.1:4179/"
OUT = "/workspace/browser"


def settle(page):
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(900)


def run():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--no-sandbox"])

        desk = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        page = desk.new_page()
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.goto(URL, wait_until="networkidle")
        page.evaluate("localStorage.clear()")
        page.reload(wait_until="networkidle")
        settle(page)
        page.screenshot(path=f"{OUT}/fiveyears-desktop.png")

        page.get_by_role("button", name="데모 체험하기").click()
        settle(page)
        page.screenshot(path=f"{OUT}/fiveyears-demo.png")

        page.locator('button[aria-label="통계"]').click()
        page.wait_for_timeout(600)
        page.screenshot(path=f"{OUT}/fiveyears-stats.png")
        page.locator(".modal__foot").get_by_role("button", name="닫기").click()
        page.wait_for_timeout(300)

        page.locator('button[aria-label="설정"]').click()
        page.wait_for_timeout(500)
        page.screenshot(path=f"{OUT}/fiveyears-settings.png")
        page.locator(".modal__foot").get_by_role("button", name="닫기").click()
        page.wait_for_timeout(300)

        mobile = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=1)
        mp = mobile.new_page()
        mp.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        mp.goto(URL, wait_until="networkidle")
        settle(mp)
        mp.get_by_role("button", name="데모 체험하기").click()
        settle(mp)
        mp.screenshot(path=f"{OUT}/fiveyears-mobile.png")
        mp.locator(".segment__item", has_text="프리노트").click()
        mp.wait_for_timeout(500)
        mp.screenshot(path=f"{OUT}/fiveyears-mobile-note.png")

        print("errors:", errors)
        browser.close()


run()
