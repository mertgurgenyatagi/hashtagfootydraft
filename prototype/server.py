"""Local web server for the #footydraft single-player prototype.

    python -m prototype.server

Serves index.html and a tiny JSON API over one in-memory game session. Stdlib
only (plus torch, for the trained bot checkpoint) -- no framework, no database,
nothing persisted. Refreshing the page keeps the game; restarting the server
does not.
"""

import json
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import torch

from .game import Catalogue, Format, Game, load_champion, setup_options

HERE = Path(__file__).resolve().parent
PORT = 8777

DEVICE = torch.device("cpu")  # inference only; keeps the GPU free for training
LOCK = threading.Lock()
STATE = {"game": None}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def _send(self, payload, code=200, content_type="application/json"):
        body = payload if isinstance(payload, bytes) else json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _body(self):
        length = int(self.headers.get("Content-Length") or 0)
        return json.loads(self.rfile.read(length) or b"{}")

    def _state(self, error=None):
        game = STATE["game"]
        payload = game.state() if game else {"started": False}
        payload["setup"] = SETUP
        payload["error"] = error
        return payload

    def do_GET(self):
        url = urlparse(self.path)
        if url.path in ("/", "/index.html"):
            self._send((HERE / "index.html").read_bytes(), content_type="text/html; charset=utf-8")
        elif url.path == "/api/state":
            with LOCK:
                self._send(self._state())
        elif url.path == "/api/scopes":
            q = parse_qs(url.query)
            fmt = Format(q.get("format", ["auction"])[0])
            size = int(q.get("lobby_size", ["3"])[0])
            self._send(CATALOGUE.feasible_scopes(fmt, size))
        else:
            self._send({"error": "not found"}, code=404)

    def do_POST(self):
        url = urlparse(self.path)
        try:
            body = self._body()
        except Exception:
            self._send({"error": "bad request"}, code=400)
            return

        with LOCK:
            error = None
            try:
                if url.path == "/api/new":
                    STATE["game"] = Game(CATALOGUE, body, CHAMPION, CHAMPION_VERSION, DEVICE)
                elif url.path == "/api/action":
                    if STATE["game"]:
                        STATE["game"].apply(body.get("action"))
                elif url.path == "/api/move":
                    if STATE["game"]:
                        error = STATE["game"].move(body["from"], body["to"])
                else:
                    self._send({"error": "not found"}, code=404)
                    return
            except Exception as exc:  # a prototype crash shouldn't take the page down
                import traceback
                traceback.print_exc()
                error = f"{type(exc).__name__}: {exc}"
            self._send(self._state(error))


CATALOGUE = Catalogue()
SETUP = setup_options(CATALOGUE)
CHAMPION, CHAMPION_VERSION = load_champion(DEVICE)


def main():
    print(f"Loaded {len(CATALOGUE.players)} footballers.")
    print("Bots: " + (f"champion.pt v{CHAMPION_VERSION}" if CHAMPION else "heuristic (no checkpoint found)"))
    url = f"http://localhost:{PORT}/"
    print(f"Serving {url}  (Ctrl+C to stop)")
    threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
