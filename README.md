# STUDEX | Smart Academic Planner & Study Engine 🎓

[![Build Status](https://img.shields.io/badge/Build-Passing-emerald)](https://github.com/mdahnafshahriarsaad/studex)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20PWA%20%7C%20Android%20APK-electric)](https://github.com/mdahnafshahriarsaad/studex)
[![Language](https://img.shields.io/badge/Language-English%20%7C%20%E0%A6%AC%E0%A6%BE%E0%A6%82%E0%A6%B2%E0%A6%BE-purple)](https://github.com/mdahnafshahriarsaad/studex)

> **Studex** is a production-grade, Apple-inspired Liquid Glass AMOLED Academic Planner & Study Engine designed to help students maximize focus, complete full syllabi before exams using mathematical daily page target algorithms, and enable read-only parental/guardian progress monitoring across devices.

---

## 🌟 Key Features

### 1. 🔐 Production Authentication & Email Verification System
- **Real Backend Authentication**: Powered by Express.js API server & persistent database store.
- **Email + Password Methods**: Signup, Login, Logout, Forgot Password, and Reset Password.
- **Email Verification Mandatory**: New users receive a verification token/link (`/?verifyToken=...`). Unverified users are blocked with *"Please verify your email before continuing."*

### 2. 🗄️ Multi-Device Database Sync
- **Backend Database**: Persists Users, Student Profiles, Subjects, Chapters, Exams, Study Sessions, and Guardian Connections.
- **Cross-Device Sync**: Same account seamlessly logs in on Phone or Laptop and syncs all study history and progress in real time via REST API.

### 3. 🎯 5-Subject Daily Study Routine Engine
- **Multi-Subject Allocation**: Generates balanced daily study routines containing up to 5 subjects per day (e.g. Physics, Mathematics, Chemistry, English, Biology).
- **Today's Target Section**: Dedicated dashboard tab displaying subject, chapter, page ranges, estimated time, and completion status.

### 4. 📊 Full Syllabus Completion Routine (Math.ceil Algorithm)
- **Exam Preparation Roadmap**: Full subject and chapter breakdown with remaining days and completion percentage.
- **Always Round UP Algorithm**:
  $$\text{Daily Target} = \left\lceil \frac{\text{Remaining Pages}}{\text{Remaining Days}} \right\rceil$$
  Enforces `Math.ceil()` (e.g., 4.3 pages $\rightarrow$ 5 pages) to guarantee complete syllabus coverage before exam dates.

### 5. 🇧🇩 Full Bangla (বাংলা) Support & Hind Siliguri Font
- **Complete Localization**: Toggle between English and বাংলা across all navigation, headers, forms, settings, and pages.
- **Google Hind Siliguri Font**: Applied automatically when Bangla mode is active for readable text.
- **Language Preference Persistence**: Saved in database profile across logins.

### 6. 🛡️ Multi-Device Guardian Mode
- **Parental Monitoring**: Students generate a unique Guardian Passcode / Link (`STUDEX-XXXX`).
- **Strict Permission Rules**: Guardians can view daily reports, progress, and exam countdowns from any device, but **CANNOT** edit syllabus data, alter progress, or tamper with timers.

### 7. 🎨 Apple Liquid Glass AMOLED UI & Theme Engine
- **4 Custom Themes**:
  - AMOLED Dark (Default)
  - Midnight Blue
  - Light Glass
  - Minimal White
- **Performance Engine**: Toggle between **High Quality Mode** (full Liquid Glass backdrop blur & glow) and **Performance Mode** (optimized for low-end mobile hardware).

### 8. 📲 Mobile APK & PWA Installation
- **Android APK Download**: Direct `.apk` download with 3D Studex branding.
- **Progressive Web App (PWA)**: Desktop & Mobile home-screen installation.

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v9 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/mdahnafshahriarsaad/studex.git
cd studex
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 4. Start Development Server & Backend
To run both the Vite Frontend and Express Backend Server:

**Terminal 1 (Backend API Server):**
```bash
npm run server
```
*Backend runs on `http://localhost:5000`*

**Terminal 2 (Frontend Dev Server):**
```bash
npm run dev
```
*Frontend runs on `http://localhost:3000`*

---

## 🛠️ Project Structure

```
studex/
├── public/                 # Static assets, logos, icons, PWA manifest, Studex.apk
│   ├── logo-mark.png       # 3D Studex emblem icon
│   ├── wordmark.png        # Studex 3D wordmark
│   ├── watermark.png       # Liquid glass background watermark
│   └── Studex.apk          # Standalone Android package
├── server/                 # Express API server & DB
│   ├── index.js            # Express API endpoints & Auth engine
│   └── studex_database.json # Persistent JSON Database Store
├── src/
│   ├── components/         # Reusable UI cards, buttons, badges & navigation
│   │   ├── navigation/     # Sidebar, Header, BottomNav
│   │   └── ui/             # GlassCard, Button, Badge
│   ├── hooks/              # Custom React hooks (useUserStore)
│   ├── layouts/            # MainLayout wrapper
│   ├── pages/              # Dashboard, TodaysTarget, CompleteSyllabus, Guardian, etc.
│   ├── services/           # Auth, storage, plannerEngine, revisionService
│   ├── styles/             # index.css (Liquid Glass & Bangla font rules)
│   ├── types/              # TypeScript interfaces
│   └── utils/              # i18n translation dictionary & constants
├── index.html              # HTML entry point with Google Fonts
├── package.json            # Scripts & dependencies
├── tailwind.config.js      # Tailwind CSS configuration
└── vite.config.ts          # Vite build config & proxy
```

---

## 🔒 Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `5000` |
| `JWT_SECRET` | Secret key for session authentication tokens | `studex_secret` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |

---

## 🤝 License & Credits

Designed & Developed for **Studex: Smart Academic Planner**.
Copyright © 2026 Studex. All rights reserved.
