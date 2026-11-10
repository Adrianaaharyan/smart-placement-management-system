"""
Browser smoke test: walks every tab and the main actions in a real browser.

Setup (once):
    pip install playwright
    python -m playwright install chromium

Run (the script starts its own static server, so nothing else is needed):
    python3 tests/e2e/smoke_test.py

Environment:
    CHROME_PATH   use an installed Chrome/Chromium instead of Playwright's download
    SCREENSHOTS   directory to save screenshots into (optional)
"""
import functools
import http.server
import os
import socketserver
import sys
import threading

from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SHOTS = os.environ.get("SCREENSHOTS")
failures = []


def check(name, condition, detail=""):
    print(("PASS  " if condition else "FAIL  ") + name + (("  " + str(detail)) if detail and not condition else ""))
    if not condition:
        failures.append(name)


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve():
    handler = functools.partial(Quiet, directory=ROOT)
    httpd = socketserver.TCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, "http://127.0.0.1:%d/" % httpd.server_address[1]


def shot(page, name, **kw):
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True)
        page.screenshot(path=os.path.join(SHOTS, name + ".png"), **kw)


def no_overflow(page):
    return not page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")


def run(p, url):
    launch = {"args": ["--no-sandbox"]}
    if os.environ.get("CHROME_PATH"):
        launch["executable_path"] = os.environ["CHROME_PATH"]
    browser = p.chromium.launch(**launch)
    errors = []

    def on_console(msg):
        # Web fonts may be unreachable on CI or offline machines; that is not an app error.
        if msg.type == "error" and "ERR_" not in msg.text and "Failed to load resource" not in msg.text:
            errors.append(msg.text)

    page = browser.new_page(viewport={"width": 1280, "height": 900})
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", on_console)

    # Dashboard
    page.goto(url)
    page.wait_for_selector(".reported")
    check("dashboard: official headline tiles render", page.locator(".reported > div").count() == 8)
    check("dashboard: school table has 11 schools plus a total row", page.locator("table tbody tr").count() >= 12)
    check("dashboard: sample-data banner is shown", page.locator(".banner").count() == 1)
    check("dashboard: no horizontal overflow", no_overflow(page))
    shot(page, "dashboard", full_page=True)

    # Drives
    page.click('a[data-tab="drives"]')
    page.click('tr.row:has-text("Paisa Bazaar")')
    page.wait_for_selector("#ddetail .item")
    before = page.locator("#ddetail h3:has-text('Applicants')").inner_text()
    page.click('#ddetail button:has-text("Add to drive")')
    after = page.locator("#ddetail h3:has-text('Applicants')").inner_text()
    check("drives: adding a student increases the applicant count", before != after, (before, after))
    page.fill("#dq", "red bull")
    check("drives: search narrows the list", page.locator("#drows tr.row").count() == 1)
    shot(page, "drives")

    # Students
    page.click('a[data-tab="students"]')
    page.select_option("#sb", "MBA")
    check("students: programme filter applies", page.locator("#srows tr.row").count() > 0)
    page.click("#srows tr.row >> nth=0")
    check("students: profile opens", page.locator("#sdetail h2").count() == 1)
    shot(page, "students")

    # Portal: apply, then mark Offered and expect Placed
    page.click('a[data-tab="portal"]')
    check("portal: alerts panel lists notifications", page.locator("#pnotif .notif").count() > 0)
    check("portal: upcoming drives are listed", page.locator("#pupcoming .drow").count() > 0)
    unread = page.locator("#pnotif .notif.unread").count()
    badge = page.locator('a[data-tab="portal"] .badge')
    check("portal: tab shows an unread badge", unread == 0 or badge.count() == 1)
    page.locator('#pupcoming button:has-text("Prep plan")').first.click()
    steps = page.locator("#pprep .step")
    check("portal: prep plan opens with steps", steps.count() > 0)
    if steps.count():
        before = page.locator("#pprep .meter .num").first.inner_text()
        page.locator("#pprep .step input[type=checkbox]").first.check()
        after = page.locator("#pprep .meter .num").first.inner_text()
        check("portal: ticking a step updates progress", before != after, before + " -> " + after)
    if page.locator('[data-act="notif-readall"]').count():
        page.click('[data-act="notif-readall"]')
        check("portal: mark all read clears the badge", page.locator('a[data-tab="portal"] .badge').count() == 0)
    page.fill("#portal-today", "2027-06-01")
    page.dispatch_event("#portal-today", "change")
    check("portal: changing the demo date offers the real date", page.locator('[data-act="today-reset"]').count() == 1)
    page.click('[data-act="today-reset"]')
    apply_btn = page.locator('#pdetail button:has-text("Apply")')
    if apply_btn.count():
        apply_btn.first.click()
        page.locator("#pdetail select.stage").last.select_option("Offered")
        status = page.locator("#pdetail .dhead .pill").first.inner_text()
        check("portal: an Offered stage makes the student Placed", status == "Placed", status)
    else:
        check("portal: has an open drive to apply to", False)
    shot(page, "portal")

    # Aptitude round
    page.click('a[data-tab="practice"]')
    page.click('button:has-text("Start round")')
    for _ in range(10):
        page.click(".opt >> nth=0")
        page.click('button[data-act="nextq"]')
    score = page.locator(".big").inner_text()
    check("aptitude: ten questions end on a numeric score", score.isdigit() and 0 <= int(score) <= 100, score)
    shot(page, "aptitude")

    # CSV import
    page.click('a[data-tab="students"]')
    page.locator("details.add summary:has-text('Import')").click()
    page.fill("#csv-in", "Test One,R1,B.Tech CSE,8.2,0,Python;SQL,70,2,1\nBad,row")
    page.click('#import-form button[type="submit"]')
    check("import: valid row accepted, bad row skipped", "Imported 1 students, skipped 1 invalid row" in page.locator("#toast").inner_text())
    page.click('a[data-tab="dashboard"]')
    check("import: banner switches from sample to imported", page.locator(".banner").count() == 0)

    # Phone width: every tab fits
    phone = browser.new_page(viewport={"width": 390, "height": 844})
    phone.on("pageerror", lambda e: errors.append(str(e)))
    phone.goto(url)
    for tab in ["dashboard", "drives", "students", "portal", "practice"]:
        phone.click('a[data-tab="%s"]' % tab)
        check("phone width: %s has no horizontal overflow" % tab, no_overflow(phone))
    shot(phone, "mobile")

    check("no JavaScript errors on any page", not errors, errors)
    browser.close()


def main():
    httpd, url = serve()
    try:
        with sync_playwright() as p:
            run(p, url)
    finally:
        httpd.shutdown()
    print("\n%d check(s) failed" % len(failures) if failures else "\nAll checks passed")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
