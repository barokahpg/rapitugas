# RapiTugas

Aplikasi web berbahasa Indonesia untuk orang tua pengguna Android. Baca file `.txt` ekspor WhatsApp, pilih nama pengirim, cari pesan, simpan tugas, dan tandai selesai. Bukan aplikasi resmi WhatsApp, tidak membaca WhatsApp secara langsung.

## Penggunaan

1. Buka situs dengan koneksi internet dan tunggu indikator **Aplikasi siap dibuka offline**.
2. Untuk mencoba tanpa data pribadi, pilih **Coba data contoh**.
3. Di WhatsApp Android, buka grup, pilih menu → Lainnya → Ekspor chat → Tanpa media. Simpan file teks.
4. Di RapiTugas, pilih **Masukkan chat** lalu pilih `.txt`, isi nama grup dan format tanggal.
5. Pilih pengirim yang merupakan guru, lalu simpan pilihan.
6. Gunakan **Simpan tugas** dan tab **Tugas** untuk mengatur penyelesaian.
7. Aktifkan **Simpan di perangkat ini** dalam **Penyimpanan & data** untuk mempertahankan chat setelah tab ditutup. Secara default data hanya ada di memori tab.

Pembaruan memakai nama grup yang sama dan akan menggabungkan pesan baru. Pesan dengan waktu, pengirim, isi, dan urutan duplikat yang sama dilewati. Pesan yang diedit di WhatsApp bisa menjadi entri baru pada impor berikutnya. Pengirim difilter berdasarkan nama/nomor yang tertulis dalam file, sehingga nama identik pada beberapa grup dianggap pengirim yang sama. Filter grup tersedia untuk mempersempitnya.

## Offline dan privasi

Semua HTML, CSS, JavaScript, ikon dan manifest berasal dari situs yang sama. Font menggunakan sistem perangkat. Service worker menyimpan shell aplikasi setelah pemuatan pertama dan melayani aset tanpa jaringan. Cache tidak memuat isi chat. Tidak ada CDN, analitik, atau API untuk pengiriman chat. Membuka tautan panduan resmi memerlukan jaringan.

Penyimpanan lokal adalah pilihan pengguna. Salinan tersimpan berada dalam profil browser ini, tidak tersinkron antarperangkat, dan bisa hilang ketika data browser dibersihkan. Hosting situs menggunakan akses privat Sites; cache shell aplikasi hanya mencakup aset aplikasi, bukan rute autentikasi. Pemilik profil perangkat tetap bisa membuka shell yang sudah tersimpan saat offline. Foto, dokumen, dan audio tidak diproses oleh versi ini.

## Pengembangan dan pemeriksaan

Buildless: direktori publik `dist/`, tanpa dependency runtime. Jalankan `npm test` dan `npm run check`. `scripts/tokens.py` menghasilkan CSS token dari DESIGN.md. Preview memakai supervisor Sites yang disediakan lingkungan.

Saat mengubah aset produksi, naikkan versi cache di `dist/sw.js`. Pembaruan worker akan aktif setelah tab versi lama ditutup. Service worker memerlukan HTTPS atau localhost; membuka HTML langsung melalui `file://` tidak mengaktifkan offline cache.

Lihat QA.md untuk pemeriksaan dan batas verifikasi versi awal.
