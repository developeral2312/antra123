# Antra - Customer Order Management & Video Recording System

**Antra** is an enterprise-grade Customer Order Management web application with in-browser camera video recording, automated PDF dossier generation, and a PostgreSQL relational database.

Designed with a modern SaaS dashboard, mobile-first responsiveness (Android Chrome, iOS Safari, tablets, and desktop), and reliable local verified file archiving.

---

## 📸 Key Features

- **Executive SaaS Dashboard**: Real-time business metrics (Total Customers, Total Orders, Total Videos, Today's Orders with percentage trends), recent activity timeline, recent customer dossiers, and order videos.
- **In-Browser Video Camera Integration**:
  - Live preview with front/rear camera switching (`facingMode: 'environment'` preference on mobile).
  - High-Definition MediaRecorder recording with duration timer (`00:00`).
  - Pause, resume, stop, and retake controls.
  - Option to upload existing video files from phone gallery or desktop.
  - Video upload progress bar.
- **Automated Local Storage Hierarchy**:
  ```
  storage/CUSTOMER DATABASE
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
- **Server-Side PDF Generation**:
  - Automatically generates branded `Customer Details.pdf` and `Order Details.pdf` with digital verification stamps and timestamps.
- **PostgreSQL Relational Database**: Powered by `pg` connection pooling, tracking customers, orders, videos, activity logs, admin users, and settings with automatic schema initialization.
- **Admin Security & Authentication**: Encrypted bcrypt passwords, HTTP-only JWT sessions, and protected API endpoints.
- **Mobile-First Responsive Layout**: Desktop sidebar navigation with mobile hamburger menu and quick-access bottom navigation bar.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Lucide Icons
- **Backend**: Next.js API Routes (Node.js runtime)
- **Database**: PostgreSQL (via `pg` connection pool)
- **Storage**: Organized local file & video storage (`storage/CUSTOMER DATABASE`) with HTTP 206 byte-range streaming
- **PDF Engine**: PDFKit
- **Media Capture**: Browser MediaDevices API & MediaRecorder API

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- Node.js 18+ or 20+
- npm 9+
- PostgreSQL 14+

### 2. Install Dependencies
```bash
cd antra123
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` and configure your PostgreSQL connection string:
```bash
cp .env.example .env
```
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/company_database
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=YOUR_PASSWORD
PGDATABASE=company_database
PGSCHEMA=antra
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The database, schema, tables, and default admin user are created automatically on startup.

---

## 🔐 Default Administrator Login

When first launched, Antra automatically seeds an administrator account in PostgreSQL:
- **Email**: `admin@antra.com`
- **Password**: `admin123`

You can change your password anytime under **Settings -> Administrator Profile & Security**.

---

## 📁 Directory Structure

```
antra123/
├── storage/                   # Local file & video storage archive
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
│   │   │   └── settings/      # Admin profile & PostgreSQL diagnostics
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
│   │   ├── SettingsView.js    # Admin profile & PostgreSQL diagnostics
│   │   └── VideoPlayerModal.js# Video playback modal
│   └── lib/                   # Backend engines & helpers
│       ├── db.js              # PostgreSQL pool & schema initialization
│       ├── auth.js            # JWT signing & cookie session handling
│       ├── storage.js         # Local file hierarchy coordinator
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
