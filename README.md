# 🚀 FundVision 2.0 — Premium Crowdfunding Platform
> A production-ready MERN Stack crowdfunding platform with AI-powered insights, real-time updates, Razorpay payments, and a premium startup-level UI.

![FundVision](https://img.shields.io/badge/FundVision-2.0-2563EB?style=for-the-badge&logo=heart&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwindcss)

---

## ✨ Features

### 🎨 Frontend
- **Premium UI** — Glassmorphism, soft shadows, smooth Framer Motion animations
- **Responsive** — Mobile-first, works perfectly on all devices
- **Dark Mode** — Full dark mode support via Tailwind
- **Infinite Scroll** — Campaign list with lazy loading
- **Skeleton Loading** — Beautiful loading states
- **Real-time** — Live donation counters via Socket.io

### 🔐 Authentication
- JWT + Refresh Token authentication
- Email verification
- Forgot / Reset Password
- Role-based access control (Admin, Organization, Donor)
- Google OAuth ready

### 📋 Campaign System
- Multi-step campaign creation with image upload (Cloudinary)
- Admin approval workflow
- Campaign updates & milestones
- Like, bookmark, share functionality
- Progress tracking with live updates

### 💳 Payments (Razorpay Test Mode)
- Secure payment processing
- Anonymous donations
- Auto-generated receipt numbers
- Downloadable donation certificates
- 80G tax exemption tracking

### 🤖 AI Features (Grok API)
- **Campaign Summary** — AI-generated concise summaries
- **Trust Score** — Transparency & reliability analysis
- **Natural Language Search** — "Help children with education"
- **Personalized Recommendations** — Based on history & interests
- **Impact Messages** — After donation personalized impact
- **Fraud Detection** — Admin alerts for suspicious campaigns
- **Dashboard Insights** — Actionable AI suggestions
- **FundBot Chatbot** — Floating AI assistant across the site

### ⚡ Real-time (Socket.io)
- Live donation counter on campaign pages
- Notification push to organization on new donation
- Admin alerts for pending approvals
- Campaign update broadcasts

### 📊 Analytics (Recharts)
- Donation trends (line charts)
- Category breakdown (pie charts)
- Monthly performance (bar charts)
- Organization analytics dashboard

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS 3, Framer Motion |
| State | Zustand, React Query (TanStack) |
| Forms | React Hook Form |
| Charts | Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + bcryptjs |
| Uploads | Multer + Cloudinary |
| Payments | Razorpay (Test Mode) |
| AI | Grok API (xAI) |
| Real-time | Socket.io |
| Email | Nodemailer |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Cloudinary account (free tier)
- Razorpay Test account
- Grok API key (xAI)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd FundVision
npm run install-all
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
# Fill in all values in .env
```

### 3. Seed Database

```bash
cd server
node seed.js
```

### 4. Start Development

```bash
# From root directory
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

---

## 📁 Project Structure

```
FundVision/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ai/            # AI Chatbot
│   │   │   ├── campaigns/     # Campaign cards
│   │   │   ├── common/        # ProtectedRoute, PageLoader
│   │   │   └── layout/        # Navbar, Footer
│   │   ├── context/           # Zustand auth store
│   │   ├── pages/
│   │   │   ├── auth/          # Login, Register, etc.
│   │   │   ├── campaigns/     # Create, Edit campaigns
│   │   │   ├── dashboard/     # Donor, Org, Admin dashboards
│   │   │   └── organizations/ # Setup, Profile
│   │   ├── services/          # API calls, Socket.io
│   │   └── App.jsx            # Routes
│   └── package.json
│
├── server/                    # Express.js backend
│   ├── config/                # DB, Cloudinary
│   ├── controllers/           # Business logic
│   ├── middleware/            # Auth, error handling
│   ├── models/                # Mongoose schemas
│   ├── routes/                # API routes
│   ├── socket/                # Socket.io manager
│   ├── utils/                 # Email, AI helpers
│   ├── seed.js                # Database seeder
│   ├── index.js               # Server entry point
│   └── .env.example
│
├── package.json               # Root monorepo config
└── README.md
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fundvision.com | Admin@123 |
| Donor | donor@test.com | Test@123 |
| Organization | org@test.com | Test@123 |

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Request reset |
| POST | `/api/auth/reset-password/:token` | Reset password |

### Campaigns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List campaigns |
| GET | `/api/campaigns/:id` | Get campaign |
| POST | `/api/campaigns` | Create campaign |
| PUT | `/api/campaigns/:id` | Update campaign |
| POST | `/api/campaigns/:id/like` | Like/unlike |
| POST | `/api/campaigns/:id/bookmark` | Bookmark |

### Donations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/donations/create-order` | Create Razorpay order |
| POST | `/api/donations/verify-payment` | Verify & complete |
| GET | `/api/donations/my-donations` | Donor history |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | FundBot chat |
| POST | `/api/ai/search` | NL search |
| GET | `/api/ai/recommendations` | Personalized campaigns |
| GET | `/api/ai/trust-score/:id` | Campaign trust score |

---

## 🚢 Deployment

The entire app — including the blockchain donation ledger — runs on 100% free
tiers with no crypto, wallet, or blockchain network setup required.

### Backend (Railway / Render)
```bash
# Set environment variables in dashboard
# Deploy from GitHub
# Build command: npm install
# Start command: node index.js
```

### Frontend (Vercel / Netlify)
```bash
cd client
npm run build
# Deploy /dist folder
# Set VITE_API_URL env var
```

### MongoDB Atlas
1. Create cluster on mongodb.com
2. Add IP whitelist (0.0.0.0/0 for production)
3. Copy connection string to `MONGODB_URI`

The blockchain ledger (`Block` collection) lives in the same MongoDB Atlas
database — no separate database, RPC provider, or API key needed.

---

## ⚙️ Environment Variables

See `server/.env.example` for all required variables:

```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_32_char_secret
CLOUDINARY_CLOUD_NAME=...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
GROK_API_KEY=xai-...
CLIENT_URL=http://localhost:5173

# Note: the blockchain donation ledger requires NO extra env vars — it runs
# entirely on MongoDB + Node's built-in crypto module.
```

---

## 🎯 Razorpay Test Cards

| Card | Number | Expiry | CVV |
|------|--------|--------|-----|
| Success | 4111 1111 1111 1111 | Any future | Any |
| Failure | 4000 0000 0000 0002 | Any future | Any |

**UPI Test**: `success@razorpay`

---

## ⛓️ Blockchain Donation Ledger (100% Free — No Crypto Required)

FundVision records every verified donation in an immutable, tamper-evident
ledger built entirely on the server using SHA-256 hashing — the same chaining
principle real blockchains use, with **zero gas fees, no wallet, no MetaMask,
and no external network dependency**. It works out of the box on any free
hosting tier.

### How it works
1. Donor completes a Razorpay payment → donation saved in MongoDB.
2. The backend appends a new **block** to the ledger: `currentHash = SHA256(blockNumber + donationId + campaignId + amount + timestamp + previousHash)`.
3. Each block references the previous block's hash, forming a hash-chain.
4. A unique transaction ID (`TX-XXXXXXXXXXXX`) and the hashes are saved back to the donation record, which is marked **Blockchain Verified**.
5. Anyone can browse verified donations and inspect their blocks at `/ledger`.
6. `GET /api/blockchain/verify` walks the entire chain and detects any tampering instantly — if historical data changes, the recomputed hash no longer matches.

### Setup
No setup required — the ledger uses only MongoDB (already part of the stack)
and Node's built-in `crypto` module. It activates automatically as soon as the
server starts.

### Key files
- `server/models/Block.js` — immutable block schema (append-only)
- `server/services/ledgerService.js` — hash-chain logic (append + verify)
- `server/routes/blockchain.js` — blockchain REST API (`/status`, `/verify`, `/blocks`, `/block/:n`, admin & org stats)
- `client/src/pages/DonationLedger.jsx` — public blockchain explorer with search, filters & pagination
- `client/src/components/blockchain/BlockchainBadge.jsx` — verified-status badge shown on donations

---

## 📱 PWA Support

FundVision is PWA-ready. Add to home screen on mobile for an app-like experience.

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 License

MIT License — feel free to use for your portfolio, final year project, or startup MVP.

---

## 🙏 Built With Love

FundVision is built with the vision that **technology should make giving easier, more transparent, and more impactful**. Every line of code serves a cause.

> *"Alone we can do so little; together we can do so much."* — Helen Keller

---

**⭐ Star this repo if FundVision helped you!**
