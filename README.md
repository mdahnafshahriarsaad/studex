# 🎓 STUDEX — Smart Academic Planner & Study Engine

> **Plan smarter. Study better. Achieve more.**

Studex is a production-grade academic planning engine built with **React, TypeScript, TailwindCSS, Express.js, and SQLite**. It features intelligent daily target calculation, multi-device database sync, email verification authentication, complete Bangla (বাংলা) language & font support, and guardian monitoring portals.

---

## 🌟 Key Features

- 🔐 **Real Authentication & Email Verification System**:
  - Secure Email + Password Signup & Login with JWT Tokens and bcrypt password hashing.
  - Verification email flow with unverified dashboard restriction.
  - Forgot & Reset Password workflows.

- 🗄️ **Persistent Database & Multi-Device Sync**:
  - SQLite backend database storing Users, Profiles, Subjects, Chapters, Exams, Study Sessions, Guardian Connections, and Settings.
  - Multi-device sync across laptops, mobile phones, and tablets.

- 🇧🇩 **Full Bangla (বাংলা) Support & Dynamic Font Switching**:
  - Instant toggle between English and বাংলা (Bengali).
  - Automatically loads and applies **Hind Siliguri** / **Noto Sans Bengali** typography when Bangla mode is active.
  - User language preference saved in the database across sessions.

- 📅 **AI Planner & Missed Target Recovery Engine**:
  - Dynamic page-by-page target calculation based on exam deadlines.
  - Automated recovery planner for missed study days.

- 👨‍👩‍👦 **Guardian Connections & Monitoring**:
  - Unique student passcodes for parent/guardian reports and progress tracking.

- 🎨 **Apple Liquid Glass Design Engine**:
  - 4 curated themes: AMOLED Dark, Midnight Blue, Light Glass, Minimal White.
  - High Quality vs. Performance Mode selector for budget mobile devices.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Framer Motion, Lucide Icons
- **Backend**: Node.js, Express.js, JWT, bcryptjs, Nodemailer
- **Database**: SQLite3 (`studex.db`)
- **Fonts**: Inter, Hind Siliguri, Noto Sans Bengali (Google Fonts)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm or yarn

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mdahnafshahriarsaad/studex.git
   cd studex
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

   Fill in your configuration:
   ```env
   PORT=5000
   JWT_SECRET=your_super_secret_jwt_key
   FRONTEND_URL=http://localhost:3000

   # SMTP Configuration (Optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   ```

4. **Start the Backend Server**:
   ```bash
   node server/index.js
   ```

5. **Start the Frontend Dev Server**:
   ```bash
   npm run dev
   ```

   Open `http://localhost:3000` in your browser.

---

## 📦 Production Build

To build the project for production:

```bash
npm run build
```

This generates optimized static production assets in the `dist/` folder.

---

## 🔒 Security

- All sensitive tokens and keys are loaded via environment variables (`.env`).
- Never commit `.env` or `studex.db` to public version control.

---

## 📄 License

Developed for Studex Global EdTech. All rights reserved.
