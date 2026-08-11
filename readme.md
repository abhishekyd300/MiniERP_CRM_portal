# Mini ERP + CRM Operations Portal

A full-stack ERP/CRM system built for a wholesale/distribution business, covering customer management, product & inventory tracking, and a sales challan workflow with real-time stock control.

---

## Table of Contents

- [Submission Links](#submission-links)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Core Modules](#core-modules)
- [Local Setup Instructions](#local-setup-instructions)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Project Locally](#running-the-project-locally)
- [Deployment](#deployment)
- [Test Login Credentials](#test-login-credentials)
- [API Documentation](#api-documentation)
- [Assumptions Made](#assumptions-made)
- [Known Limitations / Incomplete Parts](#known-limitations--incomplete-parts)
- [Bonus Features Implemented](#bonus-features-implemented)

---

## Submission Links

| Item | Link |
|---|---|
| GitHub Repository | `[(https://github.com/abhishekyd300/MiniERP_CRM_portal) ]` |
| Live Frontend URL | `[ (minicrmportal.vercel.app) ]` |
| Live Backend API URL | `[ (https://minicrm-backend.vercel.app/) ]` |
| Screen Recording | `[https://drive.google.com/file/d/192-ULMJRiQOsuETl-6uTxvwYEg3vV6K9/view?usp=drive_link]` |

---

## Tech Stack

**Backend**
- Node.js + TypeScript
- Express.js
- PostgreSQL (hosted on Supabase)
- Prisma ORM
- Zod (validation)
- JWT (`jsonwebtoken`) + `bcrypt` for authentication

**Frontend**
- React + TypeScript (Vite)
- TailwindCSS
- React Router
- Axios + React Query
- React Hook Form + Zod

**Deployment**
- Frontend: `[ Vercel]`
- Backend: `[ Vercel]`
- Database: Supabase (PostgreSQL)

> AWS deployment was not used for this submission — deployed via free-tier alternatives as permitted in the assignment brief.

---

## Architecture Overview

**Backend**: A layered Express + TypeScript API. Routes → controllers → services → Prisma. Authentication is JWT-based; a role-check middleware (`authorize(...roles)`) gates each route by user role (Admin, Sales, Warehouse, Accounts). All stock mutations — whether from a manual adjustment or a confirmed challan — pass through a single `adjustStock()` service function, which also writes a `StockMovement` audit row. This keeps stock history consistent regardless of the mutation source.

**Database**: PostgreSQL via Supabase, modeled with Prisma. Key design decision: `ChallanItem` stores a **snapshot** of product name, SKU, and price at the time of challan creation (not just a foreign key), so historical challans remain accurate even if product details change later.

**Frontend**: A React SPA with role-aware routing — users only see nav items and actions permitted for their role. Shared table/form components are reused across the Customer, Product, and Challan modules to keep the UI consistent.

---

## Core Modules

1. **Authentication & Roles** — JWT login, 4 roles (Admin, Sales, Warehouse, Accounts), role-based route protection on both API and frontend.
2. **Customer CRM** — Add/edit/search customers, customer detail page, follow-up notes log, status tracking (Lead/Active/Inactive).
3. **Product & Inventory** — Add/edit products, stock movement log (IN/OUT with reason and audit trail), low-stock alerts based on minimum stock threshold.
4. **Sales Challan** — Multi-product challan creation, auto-generated challan numbers, Draft/Confirmed/Cancelled status flow, stock deduction on confirmation with negative-stock prevention, product data snapshotting.

---

## Local Setup Instructions

### Prerequisites
- Node.js `[ version, v24.11.1 ]`
- npm
- A Supabase project (free tier) for PostgreSQL

### Clone the repository
```bash
git clone [ https://github.com/abhishekyd300/MiniERP_CRM_portal ]
cd [ backend, frontend ]
```

### Install dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=          # Supabase Postgres connection string (direct, port 5432)
JWT_SECRET=             # any long random string
JWT_EXPIRES_IN=1d
PORT=5000
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=           # e.g. http://localhost:5000 for local, or the deployed backend URL
```

> `.env` files are excluded via `.gitignore` and never committed. `.env.example` files are provided in both `backend/` and `frontend/` as templates.

---

## Database Setup

1. Create a free project on [Supabase](https://supabase.com).
2. Copy the **direct connection string** (port `5432`, not the pooled `6543` one) from Project Settings → Database, and set it as `DATABASE_URL` in `backend/.env`.
3. Run Prisma migrations:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
4. Seed initial role-based test users:
   ```bash
   npx prisma db seed
   ```

---

## Running the Project Locally

### Backend
```bash
cd backend
npm run dev
# API runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

---

## Deployment

- **Database**: Supabase (PostgreSQL) — free tier, connection string used directly in backend env vars.
- **Backend**: Deployed on `[ Vercel ]`. Build command: `npm run build`. Start command: `[ node dist/server.js ]`. Environment variables (`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`) set in the platform's dashboard.
- **Frontend**: Deployed on `[ Vercel ]`, with `minicrmportal.vercel.app` set to point to the deployed backend URL.

---

## Test Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `[ admin@minicrm.com ]` | `[ Admin@123 ]` |
| Sales | `[ sales@minicrm.com ]` | `[ Sales@123 ]` |
| Warehouse | `[ warehouse@minicrm.com ]` | `[ Warehouse@123 ]` |
| Accounts | `[ accounts@minicrm.com ]` | `[ Accounts@123 ]` |

---

## API Documentation

A full Postman collection is included at `[ path or link ]`, covering all endpoints with example request bodies and pre-configured auth tokens per role.

**Sample endpoints:**
```
POST   /auth/login
GET    /customers
POST   /customers
GET    /customers/:id
PUT    /customers/:id
POST   /customers/:id/notes

GET    /products
POST   /products
PUT    /products/:id
POST   /products/:id/stock
GET    /products/:id/movements

POST   /challans
PUT    /challans/:id
POST   /challans/:id/confirm
POST   /challans/:id/cancel
GET    /challans
GET    /challans/:id
```

All endpoints return validation errors, proper HTTP status codes, and support pagination/search/filtering where applicable.

---

## Assumptions Made

- Challan numbers are auto-generated using the scheme `[ e.g. CH-YYYY-NNNNNN, sequential per year ]`.
- Cancelling a **confirmed** challan `[ restores stock via an IN movement / does not restore stock — state your actual behavior ]`.

---

## Known Limitations / Incomplete Parts

- `[ No PDF invoice export ]`
---

## Bonus Features Implemented

- `[ Docker setup — remove if not done ]`
  
