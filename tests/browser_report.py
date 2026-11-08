"""Real Chrome smoke of the exact staged fictional pixel-diff report.
The page is deliberately script-free and has no external assets.
"""
import functools
import http.server
import os
from pathlib import Path
import shutil
import threading
import unittest
from playwright.sync_api import sync_playwright,expect

ROOT=Path(os.environ.get("VISUAL_DEMO_ROOT") or Path(__file__).resolve().parents[1]).resolve()

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*_):
        pass

class FictionalReportBrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        executable=os.environ.get("BROWSER_EXECUTABLE") or next(
            (p for name in ("google-chrome","chromium","chromium-browser")
             if (p:=shutil.which(name))),None)
        if not executable:
            raise RuntimeError("CHROME_REQUIRED_NO_SKIP")
        cls.engine=sync_playwright().start()
        cls.browser=cls.engine.chromium.launch(executable_path=executable,headless=True,
           args=["--no-sandbox","--disable-dev-shm-usage","--disable-background-networking"])
        cls.server=http.server.ThreadingHTTPServer(("127.0.0.1",0),
            functools.partial(QuietHandler,directory=str(ROOT)))
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True)
        cls.thread.start()
        cls.origin=f"http://127.0.0.1:{cls.server.server_port}"
        print("Observed Chrome:",cls.browser.version,flush=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.engine.stop()
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=5)

    def setUp(self):
        self.context=self.browser.new_context(viewport={"width":375,"height":812})
        self.addCleanup(self.context.close)
        self.external=[]
        self.errors=[]
        def only_local(route):
            if route.request.url.startswith(self.origin+"/"):
                route.continue_()
            else:
                self.external.append(route.request.url)
                route.abort()
        self.context.route("**/*",only_local)
        self.page=self.context.new_page()
        self.page.on("pageerror",lambda e:self.errors.append(str(e)))
        self.page.goto(self.origin)
        expect(self.page.get_by_role("heading",name="Offline pixel comparison")).to_be_visible()

    def tearDown(self):
        self.assertEqual(self.external,[],"No external requests")
        self.assertEqual(self.errors,[],"No script errors")

    def test_fictional_pixel_comparison_and_text_alternative(self):
        self.assertEqual(self.page.locator(".pixel").count(),8)
        self.assertEqual(self.page.locator(".pixel.changed").count(),2)
        expect(self.page.locator("main")).to_contain_text("Verdict: REVIEW")
        expect(self.page.locator("main")).to_contain_text("1 of 4 pixels differ (25%)")
        expect(self.page.locator("main")).to_contain_text("Column 2, row 2")
        self.assertEqual(self.page.locator(".grid[aria-hidden=true]").count(),2)
        self.assertEqual(self.page.locator("script").count(),0)
        self.assertEqual(self.page.locator("img").count(),0)
        self.assertEqual(self.page.locator("h1").count(),1)

    def test_readable_at_320_px_and_desktop_without_horizontal_page_overflow(self):
        for width,height in ((320,700),(375,812),(768,900),(1440,900)):
            with self.subTest(width=width):
                self.page.set_viewport_size({"width":width,"height":height})
                result=self.page.evaluate("""() => ({
                  scrollWidth:document.documentElement.scrollWidth,
                  viewport:innerWidth,sections:document.querySelectorAll('.panels section').length
                })""")
                self.assertLessEqual(result["scrollWidth"],result["viewport"])
                self.assertEqual(result["sections"],2)

if __name__=="__main__":
    unittest.main(verbosity=2)
