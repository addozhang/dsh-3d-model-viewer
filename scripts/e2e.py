#!/usr/bin/env python3
"""End-to-end check of the 3D viewer plugin against a real dsh web instance.

Boots a private `dsh web` on a free port, mints a browser-session cookie from
the local DSH credentials store, drives the real GUI with Playwright, and
verifies the plugin loads, renders, and reacts to drags without crashing.

Requirements (local machine only):
  - python3 + playwright (`pip install playwright`) and system Chrome
  - a dsh profile whose web bundle includes this plugin (default: `web`)

Usage:  npm run test:e2e
Env:    E2E_WORKSPACE (default 3d-diy), E2E_SESSION_SUBSTR (default empty = first)
"""
import asyncio
import base64
import hashlib
import hmac
import json
import os
import re
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DSH_HOME = Path(os.environ.get("DSH_HOME", Path.home() / ".dsh"))


def free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def wait_listening(port: int, timeout: float = 30.0) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=1):
                return
        except OSError:
            time.sleep(0.3)
    raise TimeoutError(f"dsh web did not listen on {port}")


def mint_cookie(authority: str) -> tuple[str, str]:
    text = (DSH_HOME / ".credentials.yaml").read_text()
    block = re.search(
        r"client-connection/browser-session:.*?secret:\s*([A-Za-z0-9_-]{43})", text, re.S
    )
    if not block:
        raise RuntimeError("browser-session secret not found in credentials store")
    secret = base64.urlsafe_b64decode(block.group(1) + "=")
    def b64u(b: bytes) -> str:
        return base64.urlsafe_b64encode(b).decode().rstrip("=")
    name = "dsh-auth-" + b64u(hashlib.sha256(authority.encode()).digest())
    now = int(time.time() * 1000)
    payload = json.dumps(
        {"version": 1, "authority": authority, "issuedAt": now, "expiresAt": now + 86_400_000},
        separators=(",", ":"),
    ).encode()
    body = b64u(payload)
    sig = b64u(hmac.new(secret, body.encode(), hashlib.sha256).digest())
    return name, f"v1.{body}.{sig}"


async def drive(port: int) -> int:
    from playwright.async_api import async_playwright

    authority = f"127.0.0.1:{port}"
    name, value = mint_cookie(authority)
    workspace = os.environ.get("E2E_WORKSPACE", "3d-diy")
    session_substr = os.environ.get("E2E_SESSION_SUBSTR", "")
    failures: list[str] = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True, channel="chrome", args=["--enable-unsafe-swiftshader"]
        )
        ctx = await browser.new_context(viewport={"width": 1500, "height": 950})
        await ctx.add_cookies([{"name": name, "value": value, "url": f"http://{authority}"}])
        page = await ctx.new_page()
        errors: list[str] = []
        page.on("pageerror", lambda e: errors.append(str(e)))

        await page.goto(f"http://{authority}/")
        await page.wait_for_timeout(3000)

        if session_substr:
            await page.click(f"text={session_substr}", timeout=15000)
        else:
            # sidebar innerText: ... WORKSPACE / SESSION NAME / N分钟 ...
            # pick the first time-line that follows the workspace header line
            # expand the workspace group first (collapsed by default)
            try:
                await page.get_by_text(workspace, exact=True).first.click(timeout=5000)
                await page.wait_for_timeout(1200)
            except Exception:
                pass
            name = ""
            for _ in range(30):
                name = await page.evaluate(
                    r"""(ws) => {
                        const lines = document.body.innerText.split("\n").map(s => s.trim()).filter(Boolean);
                        const w = lines.findIndex(l => l === ws);
                        if (w < 0) return null;
                        for (let i = w + 1; i < lines.length; i++) {
                          if (/^\d+分钟$/.test(lines[i]) && i > w + 1) return lines[i - 1];
                        }
                        return null;
                      }""",
                    workspace,
                )
                if name:
                    break
                await page.wait_for_timeout(500)
            if not name:
                raise RuntimeError("no session row found under workspace header within 15s")
            await page.click(f"text={name}", timeout=10000)
        await page.wait_for_timeout(4000)
        await page.wait_for_timeout(4000)

        trigger = page.locator("[data-dsh-3d-session-trigger]")
        if await trigger.count() == 0:
            print(f"NOTE: no 3D preview trigger in workspace '{workspace}' (no models referenced); skipping interaction checks")
        else:
            await trigger.first.click()
            await page.wait_for_timeout(3000)
            canvas = page.locator("[data-dsh-3d-canvas]")
            if await canvas.count() == 0:
                failures.append("3D canvas did not mount")
            else:
                box = await canvas.first.bounding_box()
                assert box
                cx, cy = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
                # rotate, pan, zoom, double-click reset
                await page.mouse.move(cx, cy); await page.mouse.down()
                await page.mouse.move(cx + 80, cy - 50, steps=8); await page.mouse.up()
                await page.mouse.move(cx, cy); await page.mouse.down(button="right")
                await page.mouse.move(cx - 60, cy + 40, steps=6); await page.mouse.up(button="right")
                await page.mouse.move(cx, cy)
                await page.mouse.wheel(0, -240)
                await page.mouse.dblclick(cx, cy)
                await page.wait_for_timeout(600)

        plugin_errors = [e for e in errors if "dsh-3d-model-viewer" in e or "slot entry crashed" in e]
        if plugin_errors:
            failures.append(f"plugin page errors: {plugin_errors[:2]}")

        shot = REPO / "artifacts"
        shot.mkdir(exist_ok=True)
        await page.screenshot(path=str(shot / "e2e.png"))
        await browser.close()

    for f in failures:
        print("FAIL:", f)
    print("e2e:", "PASS" if not failures else "FAIL", f"({len(errors)} total page errors)")
    return 1 if failures else 0


def main() -> int:
    port = free_port()
    print(f"booting dsh web on 127.0.0.1:{port} ...")
    proc = subprocess.Popen(
        ["dsh", "web", "--no-open", "--port", str(port)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        wait_listening(port)
        return asyncio.run(drive(port))
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == "__main__":
    sys.exit(main())
