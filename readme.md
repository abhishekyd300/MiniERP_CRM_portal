# Mini ERP + CRM Portal — 48-Hour Build Plan

## 1. Tech Stack (final recommendation)

**Backend**
- Node.js + TypeScript
- **Express.js** (not NestJS) — Nest's DI/module boilerplate costs you hours you don't have. Express + a clean folder structure is faster to ship in 48h.
- **PostgreSQL** (Neon or Supabase — free, instant, no server setup)
- **Prisma ORM** — gives you migrations, type-safety, and a schema file that doubles as documentation. Much faster than raw SQL or Sequelize for this scope.
- **Zod** for request validation
- **jsonwebtoken** + **bcrypt** for auth
- **express-async-errors** + a central error-handler middleware

**Frontend**
- **React + Vite + TypeScript**
- **TailwindCSS** + a component set (shadcn/ui or just plain Tailwind) for fast, clean admin UI
- **React Router**
- **Axios** + **React Query (TanStack Query)** for API calls/caching
- **React Hook Form + Zod** for forms

**Deployment**
- DB: Neon (Postgres, free tier)
- Backend: Render (free web service)
- Frontend: Vercel
- Skip AWS entirely — it's explicitly marked optional/bonus, and it will burn hours on IAM/EC2 setup you don't have.

**Why this stack**: every piece here has near-zero setup friction (no Docker, no server provisioning, no ORM migration headaches), which matters more than "impressiveness" when the clock is the real constraint.

---

## 2. Time Budget (48 hours)

| Block | Hours | Focus |
|---|---|---|
| Phase 0 | 1h | Repo, project scaffold, DB provisioning |
| Phase 1 | 3h | Prisma schema (all tables) + migrations |
| Phase 2 | 3h | Auth + role middleware |
| Phase 3 | 4h | Customer CRM APIs |
| Phase 4 | 4h | Product/Inventory APIs + stock log |
| Phase 5 | 6h | Sales Challan APIs (core business logic — hardest part) |
| Phase 6 | 2h | Postman collection + backend polish |
| Phase 7 | 14h | Frontend (all screens) |
| Phase 8 | 3h | Deployment (backend, frontend, DB) |
| Phase 9 | 3h | README, screen recording, architecture doc |
| Buffer | 5h | Bug fixes, edge cases, submission prep |

Backend (Phase 0–6) ≈ 21h. Frontend ≈ 14h. Deployment + docs ≈ 6h. Buffer ≈ 5h. That's the realistic split — **don't let backend eat past hour 21.**

---

## 3. Phase 0 — Project Setup (1h)

```bash
mkdir erp-crm-portal && cd erp-crm-portal
mkdir backend frontend
cd backend && npm init -y
npm i express cors dotenv bcrypt jsonwebtoken zod @prisma/client express-async-errors
npm i -D typescript ts-node-dev @types/express @types/node @types/cors @types/bcrypt @types/jsonwebtoken prisma
npx tsc --init
npx prisma init
```

- Push an empty repo to GitHub immediately, commit early and often (they explicitly check commit history).
- Create a Neon project, grab the connection string, put it in `backend/.env` as `DATABASE_URL`.
- Folder structure for backend:
```
backend/
  src/
    config/        (env, db client)
    middleware/     (auth, role-check, error handler, validate)
    modules/
      auth/
      customers/
      products/
      challans/
    utils/
    app.ts
    server.ts
  prisma/
    schema.prisma
```

---

## 4. Phase 1 — Database Schema (3h)

Design all tables in `schema.prisma` up front — this prevents painful migrations mid-build.

Core tables:
- **User** (id, name, email, password hash, role enum: ADMIN/SALES/WAREHOUSE/ACCOUNTS)
- **Customer** (name, mobile, email, businessName, gstNumber?, type enum: RETAIL/WHOLESALE/DISTRIBUTOR, address, status enum: LEAD/ACTIVE/INACTIVE, followUpDate?, notes relation)
- **CustomerNote** (customerId, note, createdBy, createdAt) — for follow-up notes history
- **Product** (name, sku, category, unitPrice, currentStock, minStockAlert, location)
- **StockMovement** (productId, quantityChanged, type enum: IN/OUT, reason, createdBy, timestamp)
- **Challan** (challanNumber auto-generated, customerId, status enum: DRAFT/CONFIRMED/CANCELLED, totalQuantity, createdBy, createdAt)
- **ChallanItem** (challanId, productId, **productNameSnapshot, skuSnapshot, priceSnapshot** — this is the "store snapshot, not just ID" requirement, quantity)

Run `npx prisma migrate dev --name init` once schema is done. Commit the migration.

---

## 5. Phase 2 — Auth & Roles (3h)

- `POST /auth/login` — validate with Zod, compare bcrypt hash, issue JWT with `{ id, role }` payload.
- Seed script (`prisma/seed.ts`) to create one user per role (admin/sales/warehouse/accounts) — you need these for the "test login credentials" submission requirement anyway.
- Middleware:
  - `authenticate` — verifies JWT, attaches `req.user`
  - `authorize(...roles)` — rejects with 403 if `req.user.role` not in allowed list
- Apply role rules per the business context, e.g.:
  - Warehouse can adjust stock; Sales can create challans; Accounts views everything read-mostly; Admin has full access.
  - Don't over-engineer this — a simple allow-list per route is enough for the assignment's scope.

---

## 6. Phase 3 — Customer CRM Module (4h)

Routes:
```
POST   /customers
GET    /customers          (pagination + search by name/mobile/business + filter by status/type)
GET    /customers/:id
PUT    /customers/:id
POST   /customers/:id/notes
```
- Validate every body with Zod schemas.
- Pagination: `?page=&limit=` with a sensible default and a `totalCount` in the response.
- Search: use Prisma's `contains` (case-insensitive) on name/mobile/business fields.
- Detail endpoint should include the notes/follow-up history.

---

## 7. Phase 4 — Product & Inventory Module (4h)

Routes:
```
POST   /products
GET    /products            (pagination + search + low-stock filter)
PUT    /products/:id
POST   /products/:id/stock  (manual stock adjustment -> writes a StockMovement row)
GET    /products/:id/movements
```
- Every stock change (manual adjustment or challan confirmation) must **only** happen through a function that also writes a `StockMovement` row — never mutate `currentStock` directly elsewhere. Centralize this in one `adjustStock()` helper used by both the manual endpoint and the challan module.
- Low-stock detection: `currentStock <= minStockAlert` — surface this as a filter/flag in the GET response, since it's an implied requirement from "minimum stock alert quantity."

---

## 8. Phase 5 — Sales Challan Module (6h — the core logic)

This is what interviewers will scrutinize hardest. Key rules to get right:

```
POST   /challans              (create as Draft)
PUT    /challans/:id          (edit while Draft)
POST   /challans/:id/confirm  (Draft -> Confirmed, triggers stock deduction)
POST   /challans/:id/cancel
GET    /challans
GET    /challans/:id
```

Business logic checklist:
1. **Challan number**: auto-generate, e.g. `CH-2026-000123` (sequential or date-based — document your scheme in the README).
2. **Draft creation**: store line items with a **snapshot** of product name, SKU, and price at that moment (don't just store `productId` — copy the fields onto `ChallanItem`).
3. **Confirm action**: 
   - Wrap in a **Prisma transaction**.
   - For each item, re-check `currentStock >= quantity`.
   - If any item is short, **abort the whole transaction** and return `400` with a clear message naming the product and available quantity — don't partially confirm.
   - If all pass, deduct stock via your shared `adjustStock()` helper (writes StockMovement with reason "Challan Confirmed", type OUT) and flip status to CONFIRMED.
4. **Stock must never go negative** — enforce this at the DB/service layer, not just the frontend.
5. **Cancel**: if a confirmed challan is cancelled, decide/document whether stock is restored (reasonable default: yes, restore it, log an IN movement with reason "Challan Cancelled").

This module is where "understanding real-world business flow" is actually judged — don't rush it.

---

## 9. Phase 6 — API Polish + Postman (2h)

- Consistent response shape: `{ success, data, message }` and `{ success: false, error }` on failures.
- Central error-handler middleware mapping Zod errors → 400, JWT errors → 401, not-found → 404.
- Export a Postman collection covering every route with example bodies for each role's token.

---

## 10. Phase 7 — Frontend (≈14h)

Priority order (build in this sequence so a partial build still demos well):
1. Login page + auth context + protected routes by role (2h)
2. Customer list (search/filter/pagination) + add/edit + detail page with notes (4h)
3. Product list + add/edit + stock movement view (3h)
4. Challan creation flow (select customer → add products → quantities → save draft/confirm) + challan list/detail (4h)
5. Basic dashboard/nav shell tying it together (1h)

Keep UI simple and consistent: a sidebar nav, a data table component reused across Customers/Products/Challans, and one modal/form pattern reused everywhere. Don't design three different UI patterns — reuse components to save hours.

---

## 11. Phase 8 — Deployment (3h)

1. Push Prisma schema to Neon (`npx prisma migrate deploy`).
2. Backend to Render: connect GitHub repo, set `DATABASE_URL` and `JWT_SECRET` as env vars, build command `npm run build`, start command `node dist/server.js`.
3. Frontend to Vercel: set `VITE_API_URL` env var pointing to the Render backend URL.
4. Smoke-test the full flow on the live URLs before recording anything.

---

## 12. Phase 9 — Documentation & Submission (3h)

README must cover (per the assignment):
- Local setup steps (backend + frontend, env vars needed)
- How the server was set up / deployed
- How env vars are managed
- Architecture explanation (short — 1 paragraph on backend, 1 on frontend, 1 on data model decisions like snapshotting)
- Assumptions made (e.g. challan numbering scheme, cancel-restores-stock decision)
- Known limitations
- Test credentials for all 4 roles
- Links: repo, live frontend, live backend, Postman collection

Record a 5–8 min screen capture: login as each role briefly, then walk through the full flow — add customer → add product → create draft challan → confirm challan → show stock reduced → show it blocks over-selling.

---

## 13. Scope-Cutting Rules (if you're running out of time)

If you're behind schedule past hour 30, cut in this order — these are safe to trim without losing core evaluation points:
1. Skip PDF invoice export, S3 image upload, Docker, GitHub Actions (all explicitly bonus).
2. Simplify role permissions to just Admin (full access) + everyone else (read + their own module) rather than granular per-route rules.
3. Drop customer notes as a separate table — fold into a single `notes` text field with timestamps appended.
4. Skip the cancel-restores-stock logic — cancel just needs to work; restoring stock can be a documented limitation.

**Never cut**: the Draft→Confirm stock deduction transaction, the negative-stock guard, and the product snapshot on challan items — these are the specific business-logic checks the assignment is testing for.