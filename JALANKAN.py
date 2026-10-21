#!/usr/bin/env python3
"""Server lokal RapiTugas; tidak memerlukan paket Python tambahan."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse

class RapiTugasHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".mjs": "text/javascript", ".js": "text/javascript", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml"}

def main():
    parser = argparse.ArgumentParser(description="Jalankan RapiTugas di komputer ini.")
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error("Port harus antara 1 dan 65535.")
    public = Path(__file__).resolve().parent / "dist"
    if not (public / "index.html").is_file():
        parser.error("Folder dist tidak ditemukan. Ekstrak seluruh isi ZIP terlebih dahulu.")
    handler = partial(RapiTugasHandler, directory=str(public))
    try:
        server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    except OSError as error:
        parser.error(f"Server lokal belum bisa dimulai: {error}. Coba --port 8081.")
    print(f"Buka http://localhost:{args.port} di browser pada komputer ini.", flush=True)
    print("Tekan Ctrl+C untuk berhenti. Tidak memerlukan koneksi internet.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == "__main__":
    main()
