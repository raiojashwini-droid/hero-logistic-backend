# Hero Logistics — Project Memory Brain

**File:** `memory_bran.md`  
**Version:** 1.0  
**Purpose:** Persistent implementation context for developers and AI coding assistants  
**Project:** Hero Logistics Enterprise Logistics OS  
**Last Consolidated:** 05 August 2026

---

## 1. Read This First

This file is the compact implementation memory for the Hero Logistics project.

It must be read before making code changes.

Authoritative companion documents:

1. `Hero_Logistics_FINAL_Complete_Master_PRD_v1.0.md`
2. `database.md`
3. `api_specification.md`
4. `architecter.md`

Important truth:

- the final PRD is the product requirement source;
- these technical files are the recommended implementation baseline;
- actual application source code was not attached when these files were created;
- do not claim an existing module, table or endpoint already exists unless verified in the repository;
- do not silently invent client requirements;
- preserve all portal scope and security boundaries.

---

## 2. Product in One Paragraph

Hero Logistics is a multi-tenant Logistics Operating System combining SaaS governance, CRM, company administration, transport management, dispatch, driver mobile workflows, GPS/ELD, warehouse management, yard management, customer self-service, invoicing, payments, payroll, expenses, tax and reporting.

The system must provide one authoritative shared data model while exposing role-specific portals.

---

## 3. Portals and Routes

| Role / Portal | Base Route | Core Responsibility |
|---|---|---|
| Super Admin | `/admin/*` | Tenants, plans, features, branding, billing, support and platform health |
| Sales Manager | `/sales/*` | Leads, deals, demos, trials and onboarding |
| Company Admin | `/company-admin/*` | Company-wide users, branches, fleet, drivers, loads, compliance and settings |
| Dispatcher | `/dispatcher/*` | Create, plan, assign, monitor and complete loads |
| Driver | `/driver/*` | Assigned run, navigation, proof, checklist, HOS and expenses |
| Warehouse | `/warehouse/*` | Receive, locate, move, stage and prepare dispatch |
| Yard Attendant | `/yard/*` | Shift, scan, physical movement, lanes, outbound and issues |
| Accounts | `/accounts/*` | Invoices, payments, payroll, expenses, tax and P&L |
| Customer/Shipper | `/customer/*` | Booking, tracking, documents, invoices and support |

---

## 4. Recommended Technical Baseline

- Frontend: React 19 + Vite + TypeScript.
- Styling: Tailwind CSS v4 and shared design tokens.
- Backend: Node.js LTS + TypeScript.
- Architecture: modular monolith first.
- ORM: Prisma.
- Primary DB: PostgreSQL 16 + PostGIS, pending final ADR.
- Cache: Redis.
- Queue: SQS/RabbitMQ-compatible.
- Files: S3-compatible object storage.
- Realtime: WebSocket/Socket.IO with Redis adapter.
- API: REST `/api/v1`.
- Auth: short access token + rotating secure refresh session + MFA.
- Observability: OpenTelemetry.
- Production reference: AWS ECS/Fargate, RDS, Redis, S3, CloudFront/WAF.
- Offline: IndexedDB queue for Driver/Yard/Warehouse configured actions.
- Printing: local authenticated print agent.

Do not switch technologies without an ADR.

---

## 5. Non-Negotiable Security Rules

1. Every tenant-owned record has `tenant_id`.
2. Every API enforces tenant context server-side.
3. Branch/depot scope is server-side.
4. UI hiding is not authorisation.
5. Direct object references must be scope checked.
6. Sensitive bank, tax, identity and payroll fields are encrypted/masked.
7. No tokens in localStorage.
8. No plaintext passwords or integration secrets.
9. File upload requires type/size validation and malware scan.
10. Exports require separate permission.
11. Super Admin impersonation is time-limited and fully audited.
12. High-risk financial actions may require maker-checker approval.
13. Audit, movement, status and posted financial history is immutable to normal users.
14. Offline sync is idempotent and cannot overwrite stale authoritative locations.
15. AI cannot bypass compliance, RBAC or hard validation.

---

## 6. Canonical Roles

Platform roles:

- `super_admin`
- `sales_manager`
- `company_admin`
- `dispatcher`
- `driver`
- `warehouse_manager`
- `warehouse_supervisor`
- `warehouse_staff`
- `yard_attendant`
- `accounts_manager`
- `accounts_officer`
- `payroll_officer`
- `finance_manager`
- `customer`
- `auditor`

Tenant custom roles may exist, but permissions remain canonical action keys.

---

## 7. Permission Naming Pattern

Use:

`<domain>.<resource>.<action>`

Examples:

- `dispatch.load.create`
- `dispatch.load.activate`
- `dispatch.gps.view`
- `warehouse.inbound.receive`
- `warehouse.lane.manage`
- `yard.stock.move`
- `yard.dispatch.confirm`
- `accounts.invoice.approve`
- `accounts.payment.refund`
- `platform.tenant.impersonate`

View, export, approve, process, override and delete are distinct permissions.

---

## 8. Canonical Identifiers and Data Rules

- Internal PK: UUID, UUIDv7 recommended.
- Human references:
  - tenant: `TEN-...`
  - load: `LD-...` or configured sequence;
  - invoice: `INV-...`;
  - payment: `PAY-...`;
  - receipt: `GR-...`;
  - movement: `MT-...`;
  - claim: `CC-...`;
  - pay run: `PR-...`.
- References are tenant unique unless explicitly global.
- Store timestamps in UTC.
- Display IANA timezone.
- Store money as decimal plus currency.
- Store weight/dimensions in canonical units.
- Use `version` for optimistic concurrency.
- Use soft deletion only where legally/operationally allowed.
- Do not put core query fields only inside JSON metadata.

---

## 9. Canonical Workflows

### 9.1 Load-to-Cash

`Customer/Booking → Draft Load → Stops/Items → Assignment → Activation → Warehouse/Yard Staging → Dispatch Ready → Active Transport → Delivered/POD → Completed → Invoice → Payment Allocation → Paid`

### 9.2 Inbound-to-Inventory

`Expected/Draft Receipt → Scan/Manual Items → Condition & Documents → Location Validation → Complete Receipt → Inventory Available/On Hold → Movement History`

### 9.3 Inventory-to-Dispatch

`Storage → Holding/Staging → Load Lane → Verification → Dispatch Ready → Driver Pickup → Departure Record → Active Load`

### 9.4 Payroll

`Timesheets → Draft Pay Run → Calculation → Exception Review → Approval → Payment → Payslips → PAYG/Super → Lock Period`

### 9.5 Payment

`Payment Received → Customer Match → Invoice Allocation → Part Paid/Paid/Credit → Reconciliation → Optional Refund`

---

## 10. Canonical Statuses

### Load primary

- draft
- planned
- active
- completed
- cancelled

### Load operational

- not_ready
- ready
- pending_dispatch
- assigned
- accepted
- en_route_to_pickup
- at_pickup
- loaded
- in_transit
- at_stop
- at_delivery
- delivered
- on_hold
- delayed
- failed_delivery
- returned
- cancelled

### Inventory

- expected
- receiving
- in_storage
- reserved
- to_move
- staged
- ready
- on_hold
- damaged
- quarantined
- in_transit
- dispatched
- returned

### Movement

- draft
- pending
- in_progress
- completed
- partially_completed
- failed
- cancelled

### Driver

- available
- on_duty
- en_route
- at_pickup
- at_delivery
- break
- off_duty
- on_leave
- unavailable
- delayed
- offline

### Asset

- available
- active
- assigned
- in_transit
- maintenance
- out_of_service
- sold
- inactive

Never create a new status casually. Update the canonical registry and transition rules first.

---

## 11. Critical Business Invariants

### Loads

- activated load has required customer, route, stops and items;
- each item maps a pickup and drop-off stop;
- resource assignment passes availability, compliance, capacity and conflict checks;
- required proof blocks configured completion;
- cancellation/hold/override requires reason;
- status history is immutable.

### Drivers and assets

- expired mandatory document blocks assignment;
- on-leave/unavailable driver cannot be assigned;
- maintenance/out-of-service asset cannot be assigned;
- no overlapping assignment;
- truck/trailer compatibility and capacity required;
- fatigue/HOS rules are hard rules when enabled.

### Inventory

- each item has one authoritative current location;
- source location must match server before move;
- destination must be active, permitted and have capacity;
- DG/cold/value restrictions must be respected;
- movement updates item and capacity atomically;
- duplicate VIN/barcode/container requires review;
- every completed move creates audit history.

### Dispatch

- only staged and verified loads are dispatch-ready;
- hold items cannot dispatch;
- driver/truck/trailer and documents must be confirmed;
- physical departure creates dispatch record and operational status update.

### Accounts

- invoice totals and GST reconcile;
- sent/posted records cannot be overwritten;
- payment allocation cannot exceed payment or invoice balance;
- overpayment becomes credit;
- refund cannot exceed refundable balance;
- approved/paid payroll is controlled/locked;
- closed financial period blocks edits;
- tax lodgement preserves original and amendments.

---

## 12. API Rules to Remember

- base path `/api/v1`;
- standard success/error envelope;
- correlation ID on every request;
- idempotency key for critical POST actions;
- `If-Match`/version for updates;
- 403 for known but unauthorised action;
- 404 may be used to avoid out-of-scope enumeration;
- 409 for duplicate/stale/conflict;
- 422 for business validation;
- lists support filter/sort/pagination;
- files use upload intent and signed URLs;
- realtime events never grant access independently of API permissions;
- OpenAPI 3.1 is required.

---

## 13. Database Rules to Remember

- shared schema, tenant_id on tenant-owned tables;
- PostgreSQL RLS recommended;
- foreign keys must be tenant safe;
- transactions for multi-record state changes;
- outbox event in same transaction;
- GPS/audit/messages partition by time;
- use decimal for money;
- object files are not stored as DB blobs;
- audit logs are append-only;
- posted finance uses reversal, not destructive update;
- indexes follow actual list filters.

---

## 14. Architecture Rules to Remember

- modular monolith first;
- modules communicate through application services and domain events;
- do not make every module a microservice;
- keep APIs stateless;
- use queue for slow work;
- direct uploads to object storage;
- local print agent for network printers;
- Redis for transient cache, locks and realtime fan-out;
- search index is not source of truth;
- AI is advisory;
- offline sync uses idempotent operation IDs;
- production requires observability, backup and runbooks.

---

## 15. UI/UX Rules

- preserve branch/depot context visibly;
- status needs text, not colour only;
- do not redesign screens outside approved requirements without instruction;
- tables must be usable on desktop and responsive;
- Yard/Driver are mobile-first;
- preserve filters on return navigation;
- warn about unsaved changes;
- show exact validation reasons;
- show loading, empty, offline, stale and error states;
- show timezone on operational schedules;
- mask sensitive values;
- financial fields explicitly label GST inclusive/exclusive;
- no hard-coded sample counts or names.

---

## 16. Realtime and Offline Rules

### Realtime

- secure rooms by tenant/branch/load/conversation;
- event includes entity version;
- reconnect supports missed-event recovery;
- GPS freshness state: live/recent/stale/offline;
- do not broadcast raw high-frequency GPS to all clients.

### Offline

- Driver/Yard/Warehouse only where enabled;
- IndexedDB, not localStorage for operational queue;
- encrypt sensitive local data;
- operation UUID is idempotency key;
- server validates stale source state;
- user resolves conflicts;
- never discard pending photos/actions on logout or finish shift without warning.

---

## 17. Files, Photos and Documents

- upload intent;
- direct object-storage upload;
- checksum;
- malware scan;
- safe status before use;
- signed download URL;
- uploader and timestamp;
- GPS/time metadata for proof when permitted;
- retention and legal hold;
- mandatory photo stages configurable by load type;
- damage requires evidence when policy says so.

---

## 18. Printing

- cloud creates print job;
- local print agent claims job;
- agent prints to Zebra/laser printer;
- agent reports printing/completed/failed;
- browser does not directly access arbitrary LAN printer;
- print jobs are auditable and retryable;
- duplicate/reprint reason recorded where required.

---

## 19. AI Rules

Allowed:

- extract draft load data;
- OCR receipts/documents;
- suggest driver/resource;
- optimise planning;
- predict delay;
- suggest quick reply;
- generate insights.

Not allowed:

- bypass compliance;
- silently activate or dispatch a load;
- silently approve refund/payroll/tax;
- expose tenant data to another tenant;
- replace authoritative deterministic validation;
- hide confidence/source.

Record model, version, confidence and human correction where relevant.

---

## 20. Testing Checklist for Every Feature

- happy path;
- missing required field;
- invalid status transition;
- wrong role;
- wrong branch/depot;
- wrong tenant/direct API;
- duplicate request/idempotency;
- stale version;
- bulk partial failure;
- audit event;
- notification/event;
- responsive UI;
- accessibility;
- file security when relevant;
- offline conflict when relevant;
- financial reconciliation when relevant.

---

## 21. Coding Assistant Instructions

Before editing code:

1. Locate the existing module and current patterns.
2. Read this memory file and the relevant PRD section.
3. Verify actual stack and schema in repository.
4. Do not create duplicate entities/endpoints.
5. Identify permissions and tenant scope.
6. Identify canonical status and transition.
7. Identify audit event.
8. Identify tests.
9. Make the smallest safe implementation.
10. Report any conflict between code and PRD.

When producing a plan, include:

- files to modify;
- schema/migration impact;
- API impact;
- frontend impact;
- permission changes;
- tests;
- rollback risk.

---

## 22. Do Not Do These Things

- do not store JWT in localStorage;
- do not trust frontend role checks;
- do not omit tenant_id;
- do not invent direct cross-portal copies of shared data;
- do not hard delete audit/movement/status/posted finance;
- do not use floating-point money;
- do not silently override stale item location;
- do not auto-apply AI planning;
- do not expose full bank/tax data;
- do not mark dispatch ready with missing required checks;
- do not mark invoice paid without allocation/reconciliation logic;
- do not create unversioned public APIs;
- do not add a new status without transition mapping;
- do not manually edit production database;
- do not commit secrets.

---

## 23. Current Open Decisions

These require Product/Technical confirmation:

1. PostgreSQL or MySQL?
2. NestJS or structured Express?
3. PWA or React Native for Driver?
4. Production cloud and region?
5. GPS provider?
6. Mapping/routing provider?
7. Payment gateway?
8. Accounting integration?
9. Payroll/STP provider?
10. ATO lodgement integration?
11. WhatsApp provider?
12. Exact offline scope?
13. Raw GPS retention?
14. Audit retention?
15. Full general ledger required?
16. Multi-currency launch scope?
17. AI provider and privacy policy?
18. Exact approval thresholds?
19. Exact mandatory proof photos by load type?
20. Printer agent operating-system support?

Do not conceal these decisions by hard-coding assumptions.

---

## 24. Suggested Next Implementation Order

1. Confirm ADRs and stack.
2. Create monorepo and shared TypeScript packages.
3. Implement tenant, company, branch, identity and RBAC.
4. Implement audit/outbox/file foundations.
5. Implement customers, drivers, vehicles and locations.
6. Implement load/stops/items/status/assignment.
7. Implement Dispatcher dashboard/planning.
8. Implement Warehouse/Yard inventory and movement.
9. Implement Driver mobile proof/checklist/GPS.
10. Implement messaging and notifications.
11. Implement invoice/payment.
12. Implement payroll/expenses/tax.
13. Implement reports.
14. Implement Super Admin SaaS billing/features/branding.
15. Implement advanced AI, optimisation and integrations.

---

## 25. Completion Rule

A task is not complete until:

- backend permission is enforced;
- tenant/scope is enforced;
- validation is implemented;
- audit is recorded;
- UI handles loading/error/empty;
- tests pass;
- status/data consistency is preserved;
- documentation is updated.

---

**End of `memory_bran.md`**
