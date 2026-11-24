# Antra - Customer Order Management & Video Recording System

**Antra** is an enterprise-grade Customer Order Management web application with in-browser camera video recording, automated PDF dossier generation, and official Google Drive API v3 cloud storage synchronization.

Designed with a modern SaaS dashboard, mobile-first responsiveness (Android Chrome, iOS Safari, tablets, and desktop), and a secure SQLite relational database.

---

## 📸 Key Features

- **Executive SaaS Dashboard**: Real-time business metrics (Total Customers, Total Orders, Total Videos, Today's Orders with percentage trends), recent activity timeline, recent customer dossiers, and order videos.
- **In-Browser Video Camera Integration**:
  - Live preview with front/rear camera switching (`facingMode: 'environment'` preference on mobile).
  - High-Definition MediaRecorder recording with duration timer (`00:00`).
  - Pause, resume, stop, and retake controls.
  - Option to upload existing video files from phone gallery or desktop.
  - Video upload progress bar.
- **Automated Google Drive Folder Hierarchy**:
  ```
  CUSTOMER DATABASE
      |
      |---- CUSTOMER001
      |       |---- Customer Details.pdf
      |       |---- Customer Details.json
      |       |---- Orders
      |               |---- ORDER001
      |               |       |---- Order Video.mp4
      |               |       |---- Order Details.pdf
      |               |
      |               |---- ORDER002
      |                       |---- Order Video.mp4
      |                       |---- Order Details.pdf
  ```
  - Re-uses existing customer folder if customer exists (supports multiple orders under one Customer ID).
  - Uploads video recordings directly to the appropriate order subfolder.
  - Saves Google Drive File and Folder IDs directly in the relational database.
- **Server-Side PDF Generation**:
  - Automatically generates branded `Customer Details.pdf` and `Order Details.pdf` with digital verification stamps and timestamps.
- **Secure Relational Database**: SQLite with Write-Ahead Logging (WAL) for high performance and integrity, tracking customers, orders, videos, activity logs, and settings.
- **Admin Security & Authentication**: Encrypted bcrypt passwords, HTTP-only JWT sessions, and protected API endpoints.
- **Mobile-First Responsive Layout**: Desktop sidebar navigation with mobile hamburger menu and quick-access bottom navigation bar.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Lucide Icons
- **Backend**: Next.js API Routes (Node.js runtime)
- **Database**: SQLite (via `better-sqlite3` with WAL mode)
- **Cloud Storage**: Google Drive API v3 (OAuth 2.0 & Service Account support)
- **PDF Engine**: PDFKit
- **Media Capture**: Browser MediaDevices API & MediaRecorder API

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- Node.js 18+ or 20+
- npm 9+

### 2. Install Dependencies
```bash
cd antra
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Default Administrator Login

When first launched, Antra automatically seeds an administrator account:
- **Email**: `admin@antra.com`
- **Password**: `admin123`

You can change your password anytime under **Settings -> Administrator Profile & Security**.

---

## ☁️ Google Cloud & Google Drive API v3 Setup Guide

Antra works immediately out of the box with automated local storage hierarchy mirroring Google Drive. To activate live Google Drive cloud synchronization:

### Step 1: Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click **Select a project** -> **New Project**.
3. Name it **Antra Customer Management** and click **Create**.

### Step 2: Enable Google Drive API
1. In Google Cloud Console, navigate to **APIs & Services** -> **Library**.
2. Search for **Google Drive API**.
3. Click on **Google Drive API** and click **Enable**.

### Step 3: Configure OAuth Consent Screen
1. Go to **APIs & Services** -> **OAuth consent screen**.
2. Select **External** (or **Internal** if using Google Workspace).
3. Fill in App Name: `Antra`, User support email, and Developer email.
4. Under **Scopes**, add `https://www.googleapis.com/auth/drive` or `https://www.googleapis.com/auth/drive.file`.
5. Under **Test users**, add your Google email address.

### Step 4: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** -> **Credentials**.
2. Click **Create Credentials** -> **OAuth client ID**.
3. Application type: **Web application** (or **Desktop app / Other** for easy manual token generation).
4. Save your **Client ID** and **Client Secret**.

### Step 5: Configure Credentials in Antra
You can configure Google Drive in two ways:
1. **Via Antra Settings UI**: Open **Settings -> Google Drive API v3 Integration**, enter your Client ID, Secret, and Refresh Token, then click **Test Connection** & **Save Drive Settings**.
2. **Via `.env` file**:
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REFRESH_TOKEN=your-refresh-token
   GOOGLE_ROOT_FOLDER_NAME=CUSTOMER DATABASE
   ```

*(Alternatively, you can paste a Google Service Account JSON directly in the Settings page).*

---

## 📁 Directory Structure

```
antra/
├── data/                      # Relational SQLite database (antra.sqlite)
├── storage/                   # Local file & video storage mirror
│   └── CUSTOMER DATABASE/
│       └── CUST001/
│           ├── Customer Details.pdf
│           ├── Customer Details.json
│           └── Orders/
│               └── ORD-001/
│                   ├── Order Video.mp4
│                   └── Order Details.pdf
├── src/
│   ├── app/                   # Next.js App router & API routes
│   │   ├── api/
│   │   │   ├── auth/          # Login, logout, session
│   │   │   ├── customers/     # Customer records & PDF generator
│   │   │   ├── orders/        # Order creation, submission workflow, PDF
│   │   │   ├── videos/        # Video streaming with byte ranges (HTTP 206)
│   │   │   ├── dashboard/     # Real-time statistics & trends
│   │   │   └── settings/      # Drive config, profile, DB diagnostics
│   │   ├── globals.css        # Tailwind styling & animations
│   │   ├── layout.js          # Root layout & meta tags
│   │   └── page.js            # Main dashboard shell
│   ├── components/            # UI Views & Interactive Widgets
│   │   ├── Sidebar.js         # Desktop deep navy navigation sidebar
│   │   ├── Header.js          # Top header with dynamic date & notifications
│   │   ├── MobileNav.js       # Responsive bottom bar & drawer navigation
│   │   ├── DashboardView.js   # SaaS KPI metrics & recent activity
│   │   ├── AddCustomerView.js # Customer & order form with camera recorder
│   │   ├── CameraRecorder.js  # Live MediaRecorder with front/rear switch
│   │   ├── CustomerRecordsView.js # Customer management, history & PDF
│   │   ├── AllOrdersView.js   # Orders table with status filters
│   │   ├── VideoGalleryView.js# Grid of verification videos
│   │   ├── SearchCustomerView.js # Unified instant search
│   │   ├── SettingsView.js    # Drive configuration & DB diagnostics
│   │   └── VideoPlayerModal.js# Video playback modal
│   └── lib/                   # Backend engines & helpers
│       ├── db.js              # SQLite connection & schema initialization
│       ├── auth.js            # JWT signing & cookie session handling
│       ├── drive.js           # Google Drive API v3 client & folder hierarchy
│       ├── storage.js         # File hierarchy coordinator
│       └── pdf.js             # Branded PDF dossier & receipt generator
├── .env.example
├── package.json
└── README.md
```

---

## 📱 Mobile Responsiveness

Antra is fully optimized for mobile devices:
- **Rear Camera Priority**: Defaults to high-resolution rear environment camera for parcel inspection.
- **Touch-Friendly Controls**: Large tap targets for recording, pausing, and submitting.
- **Adaptive UI**: Tables smoothly transform into card lists on smaller screens; bottom navigation bar provides one-tap switching between views.
- **HTTP 206 Range Streaming**: Video playback supports seeking and scrubbing across mobile Safari and Chrome.

---

## 📜 License
Private & Confidential. Built for Antra Customer Management.
