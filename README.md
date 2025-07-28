# 🏪 Enhanced POS (Point of Sale) System

Sistem Point of Sale (POS) modern dan lengkap yang dibangun dengan React, TypeScript, dan Tailwind CSS. Aplikasi ini dirancang khusus untuk toko kecil hingga menengah dengan fitur-fitur lengkap untuk mengelola penjualan, stok, pelanggan, dan laporan.

## ✨ Fitur Utama

### 📦 Manajemen Produk

- ➕ Tambah, edit, dan hapus produk
- 📊 Tracking stok real-time
- 🔍 Pencarian produk dengan barcode
- 📸 Upload gambar produk
- ⚠️ Notifikasi stok rendah dan habis

### 🛒 Sistem Penjualan

- 🛍️ Interface kasir yang user-friendly dan modern
- 💳 Multiple metode pembayaran (Tunai, Kartu, E-Wallet)
- 💰 Quick money buttons (20k, 50k, 100k, dll) dan "uang pas"
- 💸 Sistem diskon fleksibel (persentase & nominal)
- 🧾 Cetak struk otomatis
- 🖨️ Dukungan thermal printer dengan konfigurasi lengkap
- 🔄 Void/batalkan transaksi
- 👥 Link transaksi dengan pelanggan

### 👥 Manajemen Pelanggan

- 📝 Database pelanggan lengkap
- 📞 Kontak dan informasi pelanggan
- 📈 Riwayat pembelian pelanggan
- 🔍 Pencarian pelanggan

### 📊 Laporan & Analytics

- 💰 Laporan penjualan harian/periode
- 📈 Analytics performa produk
- 📋 Laporan stok
- 📤 Export data ke CSV
- 📊 Dashboard dengan statistik real-time

### 👨‍💼 Manajemen User & Shift

- 🔐 Multi-user dengan role berbeda (Admin, Supervisor, Kasir, Staff)
- ⏰ Sistem shift dengan tracking dan ID format yang logis
- 🔒 Permission-based access control
- 👤 Manajemen akun pengguna
- 🆔 Format Shift ID yang readable (SH241228-1430-42)
- 📊 Laporan shift lengkap dengan perhitungan kas

### ⚙️ Pengaturan & Kustomisasi

- 🏪 Konfigurasi toko (nama, pajak, mata uang)
- 💰 Pengaturan finansial (pajak, diskon, service charge)
- 🧾 Pengaturan struk dengan customization lengkap
- 🖨️ Konfigurasi thermal printer dan receipt settings
- 📁 Sistem backup/restore data dengan export/import
- ⌨️ Keyboard shortcuts untuk efisiensi
- ���� Auto-save dengan localStorage
- 🔔 Notification center dengan status online/offline
- ⚠️ Alert stok rendah dan habis otomatis

## 💻 Persyaratan Sistem

### Minimum System Requirements

- **OS:** Windows 10/11, macOS 10.15+, atau Linux Ubuntu 18.04+
- **RAM:** 4GB (8GB recommended)
- **Storage:** 1GB free space
- **Browser:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Software Prerequisites

#### 1. Node.js dan npm

**Download & Install:**

- Kunjungi [nodejs.org](https://nodejs.org/)
- Download versi LTS (Long Term Support)
- **Minimum version:** Node.js 18.0+, npm 8.0+

**Verifikasi instalasi:**

```bash
node --version    # Should show v18.0+ or higher
npm --version     # Should show 8.0+ or higher
```

#### 2. Git

**Download & Install:**

- Windows: [git-scm.com](https://git-scm.com/download/win)
- macOS: `brew install git` atau download dari [git-scm.com](https://git-scm.com/download/mac)
- Linux: `sudo apt install git` (Ubuntu/Debian)

**Verifikasi instalasi:**

```bash
git --version     # Should show git version 2.30+
```

### 🖥️ Recommended Code Editors

#### Visual Studio Code (Primary Recommended)

- **Download:** [code.visualstudio.com](https://code.visualstudio.com/)
- **Recommended Extensions:**
  - ES7+ React/Redux/React-Native snippets
  - TypeScript Importer
  - Tailwind CSS IntelliSense
  - Prettier - Code formatter
  - ESLint
  - Auto Rename Tag
  - Bracket Pair Colorizer
  - GitLens

#### Alternative Editors

- **WebStorm** (JetBrains) - Premium IDE dengan fitur lengkap
- **Sublime Text** - Lightweight dan cepat
- **Atom** - Open source dari GitHub

### 🛠️ Development Tools (Optional tapi Recommended)

#### Browser Developer Tools

- **Chrome DevTools** - Built-in di Google Chrome
- **React Developer Tools** - Extension untuk debugging React
- **Redux DevTools** - Jika menggunakan Redux

#### Package Manager Alternatives

```bash
# npm (default)
npm install

# Yarn (alternative, faster)
npm install -g yarn
yarn install

# pnpm (alternative, disk-efficient)
npm install -g pnpm
pnpm install
```

## 🚀 Instalasi & Setup

### 1. Clone Repository

```bash
git clone [repository-url]
cd enhanced-pos-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create `.env` file di root directory:

```env
# Development
NODE_ENV=development
PORT=3000

# Database (if using external DB)
DATABASE_URL=your_database_url

# API Keys (if needed)
PAYMENT_API_KEY=your_payment_api_key
```

### 4. Start Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

### 5. Build for Production

```bash
npm run build
npm start
```

## 📁 Struktur Project

```
enhanced-pos-system/
├── client/                 # Frontend React app
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components
│   │   ├── EnhancedPOS.tsx # Main POS component
│   │   ├── EnhancedModals.tsx # Modal components
│   │   └── Dashboard.tsx   # Dashboard component
│   ├── hooks/             # Custom React hooks
│   │   └── useKeyboardShortcuts.tsx
│   ├── pages/             # Page components
│   ├── lib/               # Utility functions
│   └── global.css         # Global styles
├── server/                # Backend Express server
│   ���── routes/            # API routes
│   └── index.ts           # Server entry point
├── shared/                # Shared types and utilities
├── public/                # Static assets
├── package.json           # Dependencies and scripts
├── tailwind.config.ts     # Tailwind CSS config
├── tsconfig.json          # TypeScript config
└── vite.config.ts         # Vite bundler config
```

## 🎮 Panduan Penggunaan

### Login Default

- **Username:** `admin`
- **Password:** `admin`
- **Role:** Administrator

> **Catatan:** Untuk keamanan, sebaiknya ubah password default setelah instalasi pertama kali.

### Keyboard Shortcuts

- `Ctrl+1` atau `F1` - Buka modul Pesanan
- `Ctrl+2` atau `F2` - Buka modul Stok
- `Ctrl+3` atau `F3` - Buka modul Pelanggan
- `Ctrl+4` atau `F4` - Buka modul Laporan
- `Ctrl+5` atau `F5` - Buka modul Shift
- `Ctrl+6` atau `F6` - Buka Pengaturan
- `Ctrl+Enter` atau `F9` - Proses Pembayaran
- `Ctrl+N` - Tambah Produk
- `Ctrl+Shift+N` - Tambah Pelanggan
- `Ctrl+F` - Fokus ke Pencarian
- `Ctrl+Q` - Logout
- `Esc` - Kosongkan Keranjang

### Workflow Dasar

1. **Login** dengan kredensial yang sesuai
2. **Buka Shift** untuk memulai jam kerja
3. **Tambah Produk** ke sistem (jika belum ada)
4. **Proses Transaksi** di modul Pesanan
5. **Cetak Struk** setelah pembayaran
6. **Tutup Shift** di akhir jam kerja
7. **Cek Laporan** untuk analisis penjualan

## 🆕 Update Terbaru

### Versi 2.2.0 - December 2024
- 📱 **NEW:** Panduan lengkap konversi ke APK & iOS
- 🔵 **NEW:** Dukungan Bluetooth printer lengkap dengan Web Bluetooth API
- ⚙️ **IMPROVED:** Settings printer dengan pilihan koneksi Network/Bluetooth
- 📱 **IMPROVED:** PWA configuration untuk mobile app readiness
- 🖨️ **IMPROVED:** ESC/POS commands untuk thermal printer Bluetooth

### Versi 2.1.0 - December 2024

- ✅ **FIXED:** Masalah "Cannot access 'products' before initialization"
- 🔔 **NEW:** Notification center dengan konsolidasi semua notifikasi
- 💰 **NEW:** Quick money buttons untuk pembayaran cepat
- 🖨️ **NEW:** Dukungan thermal printer lengkap
- 💸 **NEW:** Sistem diskon yang lebih fleksibel
- 📁 **NEW:** Backup/restore data dengan export/import CSV
- 🆔 **IMPROVED:** Format Shift ID yang lebih logical dan readable
- ⚙️ **IMPROVED:** Reorganisasi settings dengan tab finansial terpisah
- 🔄 **IMPROVED:** UI keranjang belanja yang lebih modern dan responsif
- 🌐 **IMPROVED:** Status online/offline terintegrasi dengan notification center

### Fitur yang Diperbaiki

- State initialization order yang menyebabkan error startup
- Discount button visibility di shopping cart
- CSV export format dengan proper UTF-8 BOM
- Duplication removal dalam settings menu
- Notification system yang lebih komprehensif

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000
# Or use different port
PORT=3001 npm run dev
```

#### 2. Node Modules Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 3. TypeScript Errors

```bash
# Type check
npm run typecheck
```

#### 4. Build Errors

```bash
# Clean build
rm -rf dist
npm run build
```

### Browser Compatibility

- **Chrome/Edge:** Full support
- **Firefox:** Full support
- **Safari:** Full support (macOS/iOS)
- **Internet Explorer:** Not supported

## 🛡️ Security Features

- 🔐 Multi-level user authentication
- 🔒 Role-based access control
- 💾 Local data encryption
- 🔄 Automatic session management
- 📊 Activity logging

## 📱 Responsiveness

Aplikasi ini responsive dan dapat digunakan di:

- 🖥️ Desktop (1920x1080+)
- 💻 Laptop (1366x768+)
- 📱 Tablet (768x1024+)
- 📱 Mobile (375x667+)

## 🔄 Updates & Maintenance

### Regular Updates

```bash
# Update dependencies
npm update

# Check for outdated packages
npm outdated

# Update specific package
npm install package-name@latest
```

### Backup Data

Data disimpan di localStorage browser. Untuk backup:

1. Buka Browser DevTools (F12)
2. Console tab
3. Run: `console.log(localStorage.getItem('posData'))`
4. Copy output ke file txt

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Support

Jika mengalami masalah atau butuh bantuan:

- 📧 Email: support@enhancedpos.com
- 💬 Discord: EnhancedPOS Community
- 📚 Documentation: [docs.enhancedpos.com](https://docs.enhancedpos.com)
- 🐛 Bug Reports: GitHub Issues

## 🚀 Deployment Options

### Netlify (Recommended for Frontend)

1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`

### Vercel

1. Import GitHub repository
2. Auto-deploy on push

### Traditional Hosting

1. Run `npm run build`
2. Upload `dist` folder to web server
3. Configure web server for SPA routing

## 📱 Mobile App Development (APK & iOS)

### 🎯 Method 1: Capacitor (Recommended)

**Capacitor** adalah platform native runtime yang memungkinkan web app menjadi mobile app native.

#### Setup Capacitor

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init

# Install platform packages
npm install @capacitor/android @capacitor/ios

# Add platforms
npx cap add android
npx cap add ios
```

#### Configure capacitor.config.ts

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.enhancedpos',
  appName: 'Enhanced POS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#4F46E5",
      showSpinner: true,
      spinnerColor: "#ffffff"
    },
    Bluetooth: {
      displayStrings: {
        scanning: "Mencari perangkat...",
        cancel: "Batal",
        availableDevices: "Perangkat Tersedia",
        noDeviceFound: "Tidak ada perangkat ditemukan"
      }
    }
  }
};

export default config;
```

#### Android APK Development

1. **Install Android Studio**
   - Download dari [developer.android.com/studio](https://developer.android.com/studio)
   - Install Android SDK dan emulator

2. **Build untuk Android**
   ```bash
   # Build web app
   npm run build

   # Copy to native project
   npx cap copy android

   # Update native dependencies
   npx cap update android

   # Open in Android Studio
   npx cap open android
   ```

3. **Generate APK**
   - Di Android Studio: Build → Generate Signed Bundle/APK
   - Pilih APK → Create new keystore atau gunakan existing
   - Pilih release build type
   - APK akan tersimpan di `android/app/build/outputs/apk/release/`

#### iOS App Development

1. **Prerequisites**
   - macOS dengan Xcode installed
   - Apple Developer Account ($99/year)
   - iOS device untuk testing

2. **Build untuk iOS**
   ```bash
   # Build web app
   npm run build

   # Copy to iOS project
   npx cap copy ios

   # Update dependencies
   npx cap update ios

   # Open in Xcode
   npx cap open ios
   ```

3. **Configure iOS Project**
   - Di Xcode, set Bundle Identifier (com.yourcompany.enhancedpos)
   - Set Development Team dari Apple Developer Account
   - Configure signing certificates

### 🎯 Method 2: PWA (Progressive Web App)

**PWA** memberikan pengalaman native-like tanpa perlu app store.

#### PWA Features Sudah Tersedia
- ✅ Service Worker untuk offline functionality
- ✅ Web App Manifest untuk installability
- ✅ Responsive design untuk mobile
- ✅ Cache strategy untuk performance

#### Install PWA di Mobile
1. **Android (Chrome):**
   - Buka website di Chrome
   - Tap menu (3 dots) → "Add to Home screen"
   - App akan muncul di home screen seperti native app

2. **iOS (Safari):**
   - Buka website di Safari
   - Tap Share button → "Add to Home Screen"
   - App akan tersimpan di home screen

### 📱 Mobile-Specific Features

#### Bluetooth Printer Support
- ✅ Web Bluetooth API sudah terintegrasi
- ✅ ESC/POS commands untuk thermal printer
- ✅ Auto-detect printer devices
- ✅ Real-time connection status

#### Offline Functionality
- ✅ Local storage untuk data persistence
- ✅ Offline mode dengan sync ketika online
- ✅ Cached resources untuk performance

### 🚀 Quick Start Mobile Development

#### Option A: PWA (Termudah - 30 menit)
```bash
# 1. Deploy ke hosting (Netlify/Vercel)
npm run build

# 2. Akses dari mobile browser
# 3. Install as PWA dari browser menu
```

#### Option B: Android APK (1-2 hari)
```bash
# 1. Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Initialize project
npx cap init "Enhanced POS" "com.yourcompany.enhancedpos"

# 3. Build and add Android
npm run build
npx cap add android
npx cap copy android

# 4. Open in Android Studio
npx cap open android

# 5. Build APK di Android Studio
```

#### Option C: iOS App (2-3 hari + Apple Developer Account)
```bash
# 1. Setup sama seperti Android
npm install @capacitor/ios
npx cap add ios
npx cap copy ios

# 2. Open in Xcode (macOS only)
npx cap open ios

# 3. Configure signing & build
```

### 💡 Recommendations

**Untuk memulai cepat:**
1. **Deploy PWA dulu** - Testing di mobile browser
2. **Buat Android APK** - Distribusi lebih mudah
3. **iOS App** - Jika diperlukan untuk App Store

**Estimasi waktu:**
- PWA: 30 menit - 1 jam
- Android APK: 1-2 hari
- iOS App: 2-3 hari + review process

---

**🎉 Selamat menggunakan Enhanced POS System! Semoga dapat membantu mengoptimalkan bisnis Anda.**
