# RapiTugas — mulai di sini

Paket ini berisi kode lengkap yang dapat kamu edit dan jalankan sendiri. Aplikasi tidak memerlukan server ChatGPT, akun WhatsApp, API key, database, npm install, atau layanan berbayar. Tidak ada dependency runtime dari CDN.

## Jalankan di komputer, tanpa koneksi internet

Prasyarat: Python 3 sudah terpasang dan browser modern.

1. Ekstrak ZIP ini.
2. Buka terminal di folder RapiTugas.
3. Windows: jalankan `py JALANKAN.py`. macOS/Linux: `python3 JALANKAN.py`.
4. Buka **http://localhost:8080** pada komputer yang sama.
5. Untuk menghentikan server lokal, tekan Ctrl+C pada terminal.

Jika port sudah dipakai, jalankan `python3 JALANKAN.py --port 8081` (atau `py` pada Windows), lalu buka http://localhost:8081.

Server kecil ini berjalan di komputermu sendiri dan hanya menerima koneksi lokal. Ini bukan server ChatGPT. Setelah Python terpasang, tidak perlu internet untuk menjalankannya.

## Pakai di Android atau hosting sendiri

Unggah seluruh isi folder `dist/` ke hosting statis milikmu dengan HTTPS, atau layani folder tersebut dari server lokal pada perangkat yang sama. Tidak perlu proses build. Server perlu menyajikan file `.mjs` sebagai JavaScript dan `sw.js` sebagai JavaScript.

Membuka `dist/index.html` langsung melalui pengelola file (`file://`) bukan cara yang didukung karena aplikasi memakai modul JavaScript dan service worker. ZIP ini adalah source code web, bukan APK.

## Aset offline

HTML, CSS, JavaScript, ikon, dan manifest ada di folder `dist/`. Font menggunakan font sistem. Tidak ada pengambilan CSS/font dari internet. Service worker menyimpan aset aplikasi setelah pertama dibuka melalui HTTPS atau localhost.

Tunggu tulisan “Aplikasi siap dibuka offline”. Jika ingin chat tersedia setelah tab ditutup, buka **Penyimpanan & data** lalu aktifkan **Simpan di perangkat ini**. Data tidak pindah otomatis ke alamat situs atau perangkat lain. Simpan juga file ekspor chat aslinya. Cache/data bisa hilang jika data browser dibersihkan.

## Isi paket

- `dist/`: aplikasi siap dijalankan, termasuk seluruh aset lokal.
- `JALANKAN.py`: server lokal, hanya menggunakan pustaka standar Python.
- `tests/`: pengujian parser, impor ulang, filter, dan simulasi aset offline.
- `scripts/tokens.py`: pembuat CSS token dari DESIGN.md.
- `DESIGN.md` dan `UX-CONTRACT.md`: rancangan tampilan dan perilaku.
- `README.md`: dokumentasi versi aplikasi awal.
- `QA.md`: hasil pengujian dan keterbatasannya.

Untuk pengembangan, Node.js diperlukan hanya untuk `npm test` dan `npm run check`. Tidak diperlukan untuk memakai aplikasi dengan server Python di atas.

Kode runtime disalin persis dari versi awal yang dibuat. Konfigurasi hosting ChatGPT, riwayat Git, dan kredensial tidak disertakan. Sembilan pengujian otomatis pada versi awal lulus; uji langsung pada Android belum dilakukan.
