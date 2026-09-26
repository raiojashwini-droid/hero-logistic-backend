# Hero Logistics — API Specification

**File:** `api_specification.md`  
**Version:** 1.0  
**Prepared Date:** 05 August 2026  
**API Style:** REST/JSON with real-time WebSocket and webhook extensions  
**Base Path:** `/api/v1`  
**Status:** Implementation baseline

---

## 1. Purpose

This document defines the application programming interface for the Hero Logistics enterprise platform. It translates the final consolidated PRD into consistent APIs for:

- Super Admin and SaaS governance;
- Sales/CRM;
- Company Admin;
- Dispatcher;
- Driver mobile;
- Warehouse;
- Yard Attendant;
- Accounts;
- Customer/Shipper;
- shared files, messages, notifications, reports and audit.

The actual source-code repository was not supplied with the request. Endpoint names below are the recommended contract derived from the complete product specifications and must be converted into an OpenAPI 3.1 document during implementation.

---

## 2. Core API Principles

1. Tenant isolation is mandatory on every tenant-owned endpoint.
2. Branch/depot scope is enforced server-side.
3. Permissions are action-specific.
4. High-risk create/process endpoints require idempotency keys.
5. Updates use optimistic concurrency.
6. All requests receive a correlation ID.
7. All business-changing actions create audit events.
8. File access uses short-lived signed URLs.
9. Lists use server-side filtering, sorting and pagination.
10. API responses never expose fields the caller is not authorised to view.
11. Business status transitions are actions, not arbitrary free-form field updates.
12. API versioning must be explicit.

---

## 3. Authentication and Session Model

### 3.1 Supported Authentication

Recommended web model:

- short-lived access JWT in `HttpOnly`, `Secure`, `SameSite` cookie;
- rotating refresh token in separate `HttpOnly` cookie;
- CSRF token for state-changing browser requests where required.

Recommended mobile/integration model:

- OAuth2/OIDC bearer token;
- scoped service account for integrations;
- API keys only for limited machine-to-machine use.

### 3.2 Auth Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/login` | Authenticate user |
| POST | `/auth/refresh` | Rotate access/refresh session |
| POST | `/auth/logout` | Revoke current session |
| POST | `/auth/logout-all` | Revoke all user sessions |
| POST | `/auth/forgot-password` | Create reset request |
| POST | `/auth/reset-password` | Complete password reset |
| POST | `/auth/verify-email` | Verify email |
| POST | `/auth/mfa/challenge` | Submit MFA challenge |
| POST | `/auth/mfa/setup` | Start MFA setup |
| POST | `/auth/mfa/verify` | Verify MFA setup |
| GET | `/auth/sessions` | List active sessions |
| DELETE | `/auth/sessions/{sessionId}` | Revoke session |
| GET | `/me` | Current user, roles, scopes and features |

### 3.3 Tenant Resolution

Tenant context may be resolved by:

1. verified custom domain;
2. tenant subdomain;
3. access-token claim;
4. explicit platform-admin tenant selection during an audited impersonation session.

Client-supplied tenant IDs must never override authenticated tenant context.

---

## 4. Standard Headers

| Header | Required | Purpose |
|---|---:|---|
| `Authorization` | Mobile/integration | Bearer token |
| `X-CSRF-Token` | Browser writes where configured | CSRF protection |
| `X-Correlation-ID` | Optional from client | End-to-end trace ID |
| `Idempotency-Key` | Required for critical POST actions | Replay protection |
| `If-Match` | Updates | Entity version/ETag |
| `X-Branch-ID` | Conditional | Requested authorised branch |
| `X-Depot-ID` | Conditional | Requested authorised depot |
| `Accept-Language` | Optional | Locale |
| `X-Timezone` | Optional | IANA timezone display preference |
| `X-Device-ID` | Mobile/offline | Device registration |
| `X-Client-Version` | Recommended | Compatibility telemetry |

The server returns `X-Correlation-ID` on every response.

---

## 5. Standard Response Envelopes

### 5.1 Successful Single Resource

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "version": 4
  },
  "meta": {
    "correlationId": "cor_123"
  }
}
```

### 5.2 Successful List

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 128,
    "totalPages": 7,
    "sort": "-createdAt",
    "correlationId": "cor_123"
  }
}
```

### 5.3 Error

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_CONFLICT",
    "message": "The selected driver has an overlapping assignment.",
    "fieldErrors": {
      "driverId": ["Driver is already assigned to LD-10578."]
    },
    "details": {
      "conflictingLoadId": "LD-10578"
    }
  },
  "meta": {
    "correlationId": "cor_123"
  }
}
```

---

## 6. HTTP Status Codes

| Code | Usage |
|---:|---|
| 200 | Successful read or action |
| 201 | Resource created |
| 202 | Accepted asynchronous job |
| 204 | Successful operation with no body |
| 400 | Invalid request syntax |
| 401 | Authentication required/expired |
| 403 | Permission or scope denied |
| 404 | Resource not found in caller scope |
| 409 | Conflict, stale version or duplicate |
| 412 | Failed `If-Match` precondition |
| 422 | Business validation failure |
| 423 | Resource locked |
| 429 | Rate limited |
| 500 | Unhandled server error |
| 502/503 | Integration or service unavailable |

---

## 7. Pagination, Filtering and Sorting

### 7.1 Page Pagination

- `page=1`
- `pageSize=20`
- maximum page size configurable, recommended 100.

### 7.2 Cursor Pagination

Use for telemetry, audit, messages and large activity streams:

- `cursor=<opaque>`
- `limit=100`
- `direction=next`

### 7.3 Filtering

Examples:

- `filter[status]=active`
- `filter[branchId]=...`
- `filter[dateFrom]=2026-05-01`
- `filter[dateTo]=2026-05-31`
- `filter[customerId]=...`
- `filter[search]=LD-10583`

### 7.4 Sorting

- `sort=createdAt`
- `sort=-createdAt`
- multiple: `sort=status,-requiredDate`.

### 7.5 Sparse Fields and Includes

Optional:

- `fields[loads]=id,reference,status`
- `include=customer,currentAssignment`.

Includes must be whitelisted to prevent expensive arbitrary joins.

---

## 8. Idempotency and Concurrency

### 8.1 Idempotent Operations

Require `Idempotency-Key` for:

- tenant provisioning;
- load activation;
- inbound receipt completion;
- inventory movement completion;
- outbound dispatch confirmation;
- payment creation/allocation/refund;
- payroll processing;
- invoice sending;
- tax lodgement;
- offline sync batch.

The server stores request fingerprint and response for a configurable period.

### 8.2 Optimistic Concurrency

Resources return:

- `version` field;
- `ETag` header.

Updates require:

- `If-Match: "4"` or version in payload.

Stale requests return `409` or `412`.

---

# 9. Endpoint Catalogue

## 9.1 Platform / Super Admin

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/platform/dashboard` | `platform.dashboard.view` | SaaS KPI and health dashboard |
| GET | `/platform/tenants` | `platform.tenant.view` | List tenants |
| POST | `/platform/tenants` | `platform.tenant.create` | Provision tenant |
| GET | `/platform/tenants/{tenantId}` | `platform.tenant.view` | Tenant workspace inspector |
| PATCH | `/platform/tenants/{tenantId}` | `platform.tenant.edit` | Update tenant |
| POST | `/platform/tenants/{tenantId}/suspend` | `platform.tenant.suspend` | Suspend tenant |
| POST | `/platform/tenants/{tenantId}/reactivate` | `platform.tenant.reactivate` | Reactivate tenant |
| POST | `/platform/tenants/{tenantId}/impersonation-sessions` | `platform.tenant.impersonate` | Start audited login-as session |
| DELETE | `/platform/impersonation-sessions/{id}` | `platform.tenant.impersonate` | End impersonation |
| GET | `/platform/plans` | `platform.plan.view` | List plans |
| POST | `/platform/plans` | `platform.plan.create` | Create versioned plan |
| PATCH | `/platform/plans/{planId}` | `platform.plan.edit` | Edit plan draft |
| POST | `/platform/plans/{planId}/publish` | `platform.plan.publish` | Publish plan version |
| GET | `/platform/features` | `platform.feature.view` | Feature registry |
| PUT | `/platform/tenants/{tenantId}/features/{featureKey}` | `platform.feature.override` | Tenant feature override |
| GET | `/platform/subscriptions` | `platform.subscription.view` | Subscription list |
| POST | `/platform/subscriptions/{id}/upgrade` | `platform.subscription.manage` | Upgrade |
| POST | `/platform/subscriptions/{id}/downgrade` | `platform.subscription.manage` | Downgrade |
| POST | `/platform/subscriptions/{id}/renew` | `platform.subscription.manage` | Renew |
| GET | `/platform/support-tickets` | `platform.support.view` | Ticket queue |
| PATCH | `/platform/support-tickets/{id}` | `platform.support.manage` | Assign/update ticket |
| GET | `/platform/health` | `platform.health.view` | Service health |
| GET | `/platform/audit` | `platform.audit.view` | Platform audit |

## 9.2 Sales and CRM

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/crm/dashboard` | `crm.dashboard.view` | Pipeline KPIs |
| GET | `/crm/leads` | `crm.lead.view` | Leads |
| POST | `/crm/leads` | `crm.lead.create` | Create lead |
| PATCH | `/crm/leads/{id}` | `crm.lead.edit` | Update lead |
| GET | `/crm/deals` | `crm.deal.view` | Deal pipeline |
| POST | `/crm/deals` | `crm.deal.create` | Create deal |
| POST | `/crm/deals/{id}/transition` | `crm.deal.transition` | Change stage |
| POST | `/crm/demo-bookings` | `crm.demo.create` | Book demo |
| POST | `/crm/trials` | `crm.trial.create` | Start trial |
| POST | `/crm/trials/{id}/extend` | `crm.trial.extend` | Extend trial |
| POST | `/crm/trials/{id}/convert` | `crm.trial.convert` | Convert to paid tenant |
| GET | `/crm/onboarding/{tenantId}` | `crm.onboarding.view` | Handover checklist |

## 9.3 Company Administration

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/company/dashboard` | `company.dashboard.view` | Company command centre |
| GET | `/companies/current` | `company.profile.view` | Current company |
| PATCH | `/companies/current` | `company.profile.edit` | Update company |
| GET | `/branches` | `branch.view` | Branch list |
| POST | `/branches` | `branch.create` | Create branch |
| GET | `/branches/{id}` | `branch.view` | Branch detail |
| PATCH | `/branches/{id}` | `branch.edit` | Update branch |
| POST | `/branches/{id}/activate` | `branch.status.manage` | Activate |
| POST | `/branches/{id}/deactivate` | `branch.status.manage` | Deactivate |
| GET | `/depots` | `depot.view` | Depot list |
| POST | `/depots` | `depot.create` | Create depot |
| GET | `/users` | `user.view` | Tenant users |
| POST | `/users/invitations` | `user.invite` | Invite user |
| PATCH | `/users/{id}` | `user.edit` | Edit user |
| POST | `/users/{id}/suspend` | `user.suspend` | Suspend user |
| GET | `/roles` | `role.view` | Roles |
| POST | `/roles` | `role.create` | Create custom role |
| PUT | `/roles/{id}/permissions` | `role.permission.manage` | Update matrix |
| GET | `/settings` | `settings.view` | Company settings |
| PATCH | `/settings/{section}` | `settings.edit` | Update setting section |

## 9.4 Customers

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/customers` | `customer.view` | Search customers |
| POST | `/customers` | `customer.create` | Create customer |
| GET | `/customers/{id}` | `customer.view` | Customer detail |
| PATCH | `/customers/{id}` | `customer.edit` | Update customer |
| GET | `/customers/{id}/contacts` | `customer.view` | Contacts |
| POST | `/customers/{id}/contacts` | `customer.edit` | Add contact |
| GET | `/customers/{id}/loads` | `load.view` | Customer load history |
| GET | `/customers/{id}/invoices` | `invoice.view` | Customer invoices |
| POST | `/customers/{id}/statements` | `invoice.statement.create` | Generate statement |

## 9.5 Loads and Dispatcher

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/dispatcher/dashboard` | `dispatch.dashboard.view` | Dispatch dashboard |
| GET | `/loads` | `dispatch.load.view` | Filtered load list |
| POST | `/loads` | `dispatch.load.create` | Create draft load |
| GET | `/loads/{id}` | `dispatch.load.view` | Load detail |
| PATCH | `/loads/{id}` | `dispatch.load.edit` | Update editable fields |
| POST | `/loads/{id}/duplicate` | `dispatch.load.create` | Duplicate draft |
| POST | `/loads/{id}/activate` | `dispatch.load.activate` | Validate and activate |
| POST | `/loads/{id}/cancel` | `dispatch.load.cancel` | Cancel with reason |
| POST | `/loads/{id}/hold` | `dispatch.load.hold` | Place on hold |
| POST | `/loads/{id}/resume` | `dispatch.load.edit` | Resume |
| POST | `/loads/{id}/transfer` | `dispatch.load.transfer` | Branch/resource transfer |
| GET | `/loads/{id}/stops` | `dispatch.load.view` | Stops |
| POST | `/loads/{id}/stops` | `dispatch.load.edit` | Add stop |
| PATCH | `/loads/{id}/stops/{stopId}` | `dispatch.load.edit` | Edit stop |
| POST | `/loads/{id}/stops/reorder` | `dispatch.load.edit` | Reorder stops |
| GET | `/loads/{id}/items` | `dispatch.load.view` | Items |
| POST | `/loads/{id}/items` | `dispatch.load.edit` | Add item |
| POST | `/loads/{id}/assignments` | `dispatch.load.assign` | Assign resources |
| POST | `/loads/{id}/assignments/swap` | `dispatch.load.assign` | Swap driver/asset |
| POST | `/loads/{id}/status-transitions` | `dispatch.load.status` | Controlled status transition |
| GET | `/loads/{id}/timeline` | `dispatch.load.view` | Status/event timeline |
| POST | `/loads/{id}/notes` | `dispatch.load.edit` | Add note |
| POST | `/loads/{id}/documents` | `dispatch.load.edit` | Attach file |
| POST | `/loads/{id}/photos` | `dispatch.load.edit` | Upload proof photo |
| GET | `/planning-board` | `dispatch.planning.view` | Planning data |
| POST | `/planning-board/assignments` | `dispatch.planning.edit` | Board assignment |
| POST | `/planning-board/optimisations` | `dispatch.planning.optimise` | Generate suggestion |
| POST | `/planning-board/optimisations/{id}/apply` | `dispatch.planning.optimise` | Apply selected suggestions |
| GET | `/gps/positions` | `dispatch.gps.view` | Current positions |
| GET | `/gps/history` | `dispatch.gps.history` | GPS history |
| POST | `/gps/location-share-requests` | `dispatch.gps.send_location` | Send destination |
| GET | `/route-events` | `dispatch.gps.view` | Route/geofence events |

## 9.6 Driver Mobile

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/driver/active-load` | `driver.load.view_assigned` | Current assignment |
| POST | `/driver/loads/{id}/accept` | `driver.load.accept` | Accept assignment |
| POST | `/driver/loads/{id}/reject` | `driver.load.reject` | Reject with reason |
| POST | `/driver/loads/{id}/events` | `driver.load.update` | Arrival/departure/milestone |
| POST | `/driver/loads/{id}/pod` | `driver.pod.create` | Signature/photos/POD |
| POST | `/driver/gps/positions` | `driver.gps.send` | GPS batch upload |
| GET | `/driver/checklists/templates` | `driver.checklist.view` | Applicable template |
| POST | `/driver/checklists/submissions` | `driver.checklist.submit` | Pre/post trip checklist |
| POST | `/driver/defects` | `driver.defect.create` | Report defect |
| GET | `/driver/hos` | `driver.hos.view` | HOS summary |
| POST | `/driver/hos/events` | `driver.hos.update` | HOS event |
| POST | `/driver/expenses` | `driver.expense.create` | Fuel/toll expense |
| POST | `/driver/trailer-swaps` | `driver.asset.swap` | Drop-and-hook record |
| POST | `/driver/offline/sync` | `driver.sync` | Offline batch |

## 9.7 Driver and Fleet Management

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/drivers` | `driver.view` | Driver list |
| POST | `/drivers` | `driver.create` | Create driver |
| GET | `/drivers/{id}` | `driver.view` | Detail |
| PATCH | `/drivers/{id}` | `driver.edit` | Edit |
| GET | `/drivers/{id}/availability` | `driver.view` | Availability |
| POST | `/drivers/{id}/shifts` | `workforce.shift.assign` | Assign shift |
| GET | `/drivers/{id}/compliance` | `driver.compliance.view` | Compliance |
| POST | `/drivers/{id}/documents` | `driver.compliance.edit` | Upload document |
| GET | `/drivers/{id}/activity` | `driver.audit.view` | Activity timeline |
| GET | `/vehicles` | `vehicle.view` | Vehicle list |
| POST | `/vehicles` | `vehicle.create` | Create vehicle |
| GET | `/vehicles/{id}` | `vehicle.view` | Detail |
| PATCH | `/vehicles/{id}` | `vehicle.edit` | Edit |
| GET | `/trailers` | `trailer.view` | Trailer list |
| POST | `/trailers` | `trailer.create` | Create trailer |
| GET | `/maintenance/work-orders` | `maintenance.view` | Work orders |
| POST | `/maintenance/work-orders` | `maintenance.create` | Create work order |

## 9.8 Warehouse

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/warehouse/dashboard` | `warehouse.dashboard.view` | Warehouse overview |
| GET | `/inventory/items` | `warehouse.stock.find` | Search stock |
| GET | `/inventory/items/{id}` | `warehouse.stock.find` | Item detail |
| GET | `/inventory/items/{id}/history` | `warehouse.history.view` | Item history |
| GET | `/warehouse/receipts` | `warehouse.inbound.view` | Receipts |
| POST | `/warehouse/receipts` | `warehouse.inbound.create` | Create draft receipt |
| PATCH | `/warehouse/receipts/{id}` | `warehouse.inbound.edit` | Edit draft |
| POST | `/warehouse/receipts/{id}/items` | `warehouse.inbound.edit` | Add item |
| POST | `/warehouse/receipts/{id}/complete` | `warehouse.inbound.receive` | Complete receipt |
| POST | `/warehouse/movements` | `warehouse.movement.create` | Create movement |
| POST | `/warehouse/movements/{id}/complete` | `warehouse.movement.create` | Complete movement |
| POST | `/warehouse/transfers` | `warehouse.transfer.create` | Cross-depot transfer |
| GET | `/warehouse/staging-areas` | `warehouse.staging.view` | Staging list |
| POST | `/warehouse/staging-areas` | `warehouse.staging.manage` | Create area |
| POST | `/warehouse/staging-areas/{id}/assignments` | `warehouse.staging.manage` | Stage items |
| GET | `/warehouse/load-lanes` | `warehouse.lane.view` | Lanes |
| POST | `/warehouse/load-lanes` | `warehouse.lane.manage` | Create lane |
| POST | `/warehouse/load-lanes/{id}/assignments` | `warehouse.lane.manage` | Assign load/items |
| POST | `/warehouse/load-lanes/{id}/ready` | `warehouse.dispatch.confirm` | Mark ready |
| GET | `/warehouse/dispatch-ready` | `warehouse.dispatch.view` | Ready list |
| POST | `/warehouse/dispatch/{loadId}/confirm` | `warehouse.dispatch.confirm` | Confirm departure |
| GET | `/warehouse/map` | `warehouse.map.view` | Map summary |
| POST | `/warehouse/scans/resolve` | `warehouse.scanner.use` | Resolve barcode |
| POST | `/warehouse/scans/execute` | `warehouse.scanner.use` | Execute scan action |

## 9.9 Yard Attendant

| Method | Path | Permission | Purpose |
|---|---|---|---|
| POST | `/yard/work-sessions/start` | `yard.shift.start` | Start work |
| POST | `/yard/work-sessions/{id}/finish` | `yard.shift.finish` | Finish work |
| GET | `/yard/dashboard` | `yard.dashboard.view` | Yard overview |
| GET | `/yard/inbound-receipts` | `yard.inbound.view` | Inbound list |
| POST | `/yard/inbound-receipts` | `yard.inbound.create` | Create receipt |
| POST | `/yard/inbound-receipts/{id}/complete` | `yard.inbound.complete` | Complete receipt |
| GET | `/yard/inventory/search` | `yard.stock.search` | Search inventory |
| POST | `/yard/movements` | `yard.stock.move` | Create movement |
| POST | `/yard/movements/{id}/complete` | `yard.stock.move` | Confirm movement |
| GET | `/yard/staging-areas` | `yard.staging.view` | Staging areas |
| POST | `/yard/staging-areas/{id}/assignments` | `yard.staging.assign` | Stage items |
| GET | `/yard/load-lanes` | `yard.lane.view` | Lane list |
| POST | `/yard/load-lanes/{id}/assignments` | `yard.lane.manage` | Assign items |
| GET | `/yard/vehicles` | `yard.vehicle.view` | Vehicles |
| GET | `/yard/locations` | `yard.location.view` | Locations |
| GET | `/yard/loads` | `yard.load.view` | Authorised loads |
| GET | `/yard/activities` | `yard.activity.view` | Movement/activity history |
| POST | `/yard/scans/resolve` | `yard.scan.execute` | Resolve scan |
| POST | `/yard/scans/execute` | `yard.scan.execute` | Perform scan action |
| GET | `/yard/map` | `yard.map.view` | Yard/warehouse map |
| GET | `/yard/outbound-dispatch` | `yard.dispatch.view` | Ready list |
| POST | `/yard/outbound-dispatch/{loadId}/confirm` | `yard.dispatch.confirm` | Mark departed |
| POST | `/yard/issues` | `yard.issue.create` | Report issue |
| GET | `/yard/issues` | `yard.issue.view_own` | Issue list |
| POST | `/yard/offline/sync` | `yard.sync` | Offline batch |

## 9.10 Labels, Documents, Imports and Printing

| Method | Path | Permission | Purpose |
|---|---|---|---|
| POST | `/labels` | `label.create` | Generate label |
| GET | `/labels` | `label.view` | Label list |
| POST | `/labels/{id}/print` | `label.print` | Print label |
| POST | `/documents/generate` | `document.generate` | Generate document |
| GET | `/documents/{id}` | `document.view` | Metadata/download URL |
| GET | `/printers` | `printer.view` | Printer status |
| POST | `/printers` | `printer.manage` | Register printer |
| POST | `/print-jobs` | `print.manage` | Queue job |
| POST | `/print-jobs/{id}/cancel` | `print.manage` | Cancel |
| POST | `/print-spooler/pause` | `print.manage` | Pause spooler |
| POST | `/imports` | `import.execute` | Start import |
| GET | `/imports/{id}` | `import.view` | Import result |
| GET | `/imports/{id}/rows` | `import.view` | Row validation |
| POST | `/exports` | `export.execute` | Start export |
| GET | `/exports/{id}` | `export.view` | Export status/download |

## 9.11 Messages and Notifications

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/conversations` | `message.view` | Conversation list |
| POST | `/conversations` | `message.create` | Create direct/group conversation |
| GET | `/conversations/{id}` | `message.view` | Detail |
| POST | `/conversations/{id}/messages` | `message.send` | Send message |
| POST | `/conversations/{id}/participants` | `message.manage` | Add participant |
| POST | `/conversations/{id}/read` | `message.view` | Mark read |
| POST | `/conversations/{id}/archive` | `message.manage` | Archive |
| GET | `/notifications` | `notification.view` | User notifications |
| POST | `/notifications/read-all` | `notification.view` | Mark all read |
| GET | `/announcements` | `announcement.view` | Announcements |
| POST | `/announcements` | `announcement.create` | Create announcement |

## 9.12 Accounts

### Invoices and receivables

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/accounts/dashboard` | `accounts.dashboard.view` | Accounts KPIs |
| GET | `/invoices` | `accounts.invoice.view` | Invoice list |
| POST | `/invoices` | `accounts.invoice.create` | Create draft |
| GET | `/invoices/{id}` | `accounts.invoice.view` | Detail |
| PATCH | `/invoices/{id}` | `accounts.invoice.edit` | Edit draft |
| POST | `/invoices/{id}/submit-review` | `accounts.invoice.review` | Submit |
| POST | `/invoices/{id}/approve` | `accounts.invoice.approve` | Approve |
| POST | `/invoices/{id}/mark-ready` | `accounts.invoice.approve` | Ready to send |
| POST | `/invoices/{id}/send` | `accounts.invoice.send` | Generate/send |
| POST | `/invoices/{id}/hold` | `accounts.invoice.hold` | Hold |
| POST | `/invoices/{id}/reject` | `accounts.invoice.reject` | Reject |
| POST | `/invoices/{id}/credit-notes` | `accounts.invoice.credit` | Create credit |
| POST | `/invoices/statements` | `accounts.invoice.statement` | Customer statement |

### Payments

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/payments` | `accounts.payment.view` | Payments |
| POST | `/payments` | `accounts.payment.create` | Record payment |
| GET | `/payments/{id}` | `accounts.payment.view` | Detail |
| PATCH | `/payments/{id}` | `accounts.payment.edit` | Edit permitted payment |
| POST | `/payments/{id}/allocations` | `accounts.payment.allocate` | Allocate |
| DELETE | `/payments/{id}/allocations/{allocationId}` | `accounts.payment.allocate` | Reverse allocation |
| POST | `/payments/{id}/refunds` | `accounts.payment.refund` | Request/process refund |
| GET | `/reconciliations` | `accounts.payment.reconcile` | Batches |
| POST | `/reconciliations` | `accounts.payment.reconcile` | Start reconciliation |
| POST | `/reconciliations/{id}/complete` | `accounts.payment.reconcile` | Complete |

### Payroll, contractors and expenses

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/payroll-runs` | `accounts.payroll.view` | Payroll list |
| POST | `/payroll-runs` | `accounts.payroll.create` | Create |
| POST | `/payroll-runs/{id}/calculate` | `accounts.payroll.create` | Calculate |
| POST | `/payroll-runs/{id}/submit` | `accounts.payroll.create` | Submit approval |
| POST | `/payroll-runs/{id}/approve` | `accounts.payroll.approve` | Approve |
| POST | `/payroll-runs/{id}/process` | `accounts.payroll.process` | Process payments |
| GET | `/payroll-runs/{id}/payslips` | `accounts.payroll.view` | Payslips |
| GET | `/contractor-claims` | `accounts.contractor.view` | Claims |
| POST | `/contractor-claims` | `accounts.contractor.create` | Create claim |
| POST | `/contractor-claims/{id}/approve` | `accounts.contractor.approve` | Approve |
| POST | `/contractor-claims/{id}/reject` | `accounts.contractor.approve` | Reject |
| POST | `/contractor-claims/{id}/pay` | `accounts.contractor.pay` | Pay |
| GET | `/expenses` | `accounts.expense.view` | Expenses |
| POST | `/expenses` | `accounts.expense.create` | Create |
| POST | `/expenses/{id}/approve` | `accounts.expense.approve` | Approve |
| POST | `/expenses/{id}/reject` | `accounts.expense.reject` | Reject |
| POST | `/expenses/{id}/reimburse` | `accounts.expense.reimburse` | Reimburse |

### Tax and financial reports

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/tax/gst` | `accounts.tax.view` | GST summary |
| GET | `/tax/payg` | `accounts.tax.view` | PAYG summary |
| GET | `/tax/periods` | `accounts.tax.view` | Tax periods |
| POST | `/tax/periods/{id}/prepare` | `accounts.tax.prepare` | Prepare BAS |
| POST | `/tax/periods/{id}/lodge` | `accounts.tax.lodge` | Lodge |
| POST | `/tax/periods/{id}/payments` | `accounts.tax.record_payment` | Record payment |
| GET | `/financials/pnl` | `accounts.pnl.view` | P&L |
| GET | `/financials/cash-flow` | `accounts.report.view` | Cash flow |
| GET | `/vehicle-costs` | `accounts.vehicle_cost.view` | Vehicle costs |

## 9.13 Customer / Shipper

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/customer/dashboard` | `customer.dashboard.view` | Customer overview |
| POST | `/customer/booking-requests` | `customer.booking.create` | Request load |
| GET | `/customer/loads` | `customer.load.view` | Customer loads |
| GET | `/customer/loads/{id}/tracking` | `customer.tracking.view` | Sanitised tracking |
| GET | `/customer/loads/{id}/documents` | `customer.document.view` | POD/BOL |
| GET | `/customer/invoices` | `customer.invoice.view` | Invoices |
| GET | `/customer/invoices/{id}/download` | `customer.invoice.view` | Invoice PDF |
| POST | `/customer/support-tickets` | `customer.support.create` | Support case |

## 9.14 Reports and Audit

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/reports/definitions` | `report.view` | Available reports |
| POST | `/reports/runs` | `report.run` | Run report |
| GET | `/reports/runs/{id}` | `report.view` | Status/result |
| POST | `/reports/schedules` | `report.schedule` | Create schedule |
| PATCH | `/reports/schedules/{id}` | `report.schedule` | Update |
| GET | `/audit` | `audit.view` | Authorised audit query |
| GET | `/audit/{id}` | `audit.view` | Audit detail |

---

# 10. Critical Payload Examples

## 10.1 Activate Load

```json
POST /api/v1/loads/{loadId}/activate
Idempotency-Key: 607f...
If-Match: "8"

{
  "assignment": {
    "driverId": "drv_uuid",
    "vehicleId": "veh_uuid",
    "trailerId": "trl_uuid"
  },
  "acknowledgeWarnings": [],
  "override": null
}
```

Possible validation response:

```json
{
  "success": false,
  "error": {
    "code": "LOAD_ACTIVATION_FAILED",
    "message": "The load cannot be activated.",
    "details": {
      "violations": [
        {
          "code": "DRIVER_LICENCE_EXPIRED",
          "entityId": "drv_uuid",
          "message": "Driver licence expired on 21 July 2026."
        }
      ]
    }
  }
}
```

## 10.2 Complete Inventory Movement

```json
POST /api/v1/warehouse/movements/{movementId}/complete
Idempotency-Key: e12a...
If-Match: "3"

{
  "items": [
    {
      "inventoryItemId": "item_uuid",
      "expectedSourceLocationId": "loc_a",
      "destinationLocationId": "loc_b",
      "condition": "good"
    }
  ],
  "confirmation": true
}
```

## 10.3 Allocate Payment

```json
POST /api/v1/payments/{paymentId}/allocations
Idempotency-Key: a119...

{
  "allocations": [
    {
      "invoiceId": "invoice_uuid",
      "amount": "2000.00"
    }
  ]
}
```

---

# 11. File Upload API

Recommended two-step flow:

1. `POST /files/upload-intents`
2. Client uploads directly to object storage.
3. `POST /files/{fileId}/complete`
4. Server scans and marks file safe.
5. Business endpoint links file.

Upload intent request:

```json
{
  "fileName": "POD_LD-1057.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 1258291,
  "purpose": "load_pod"
}
```

Files remain unavailable until malware scan succeeds.

---

# 12. Real-Time API

Use WebSocket or Socket.IO-compatible transport with authenticated rooms.

### Channels

- `tenant:{tenantId}`
- `branch:{branchId}`
- `depot:{depotId}`
- `user:{userId}`
- `load:{loadId}`
- `conversation:{conversationId}`
- `planning:{branchId}:{date}`

### Events

- `load.created`
- `load.updated`
- `load.status_changed`
- `load.assignment_changed`
- `gps.position_updated`
- `route.delay_detected`
- `inventory.received`
- `inventory.moved`
- `lane.updated`
- `dispatch.ready`
- `dispatch.departed`
- `message.created`
- `notification.created`
- `print_job.updated`
- `report_run.updated`
- `payment.allocated`
- `payroll.status_changed`

Every event includes tenant context, entity version, occurred time and correlation ID.

---

# 13. Webhooks

### Outbound webhook events

- tenant lifecycle;
- load lifecycle;
- driver assignment;
- delivery/POD;
- inbound receipt;
- inventory movement;
- dispatch confirmation;
- invoice sent/paid/overdue;
- payment/refund;
- payroll completion;
- issue created/resolved.

### Delivery rules

- HMAC signature;
- timestamp and replay protection;
- exponential retry;
- dead-letter state;
- tenant-configured secret;
- attempt log;
- test webhook action;
- no sensitive fields unless event contract explicitly allows them.

---

# 14. Offline Synchronization

`POST /offline/sync` or portal-specific equivalent:

```json
{
  "deviceId": "device_uuid",
  "batchId": "offline_batch_uuid",
  "operations": [
    {
      "operationId": "client_uuid",
      "type": "yard.issue.create",
      "occurredAt": "2026-08-05T06:15:00Z",
      "payload": {}
    }
  ]
}
```

Per-operation result:

- accepted;
- duplicate;
- conflict;
- validation_failed;
- permission_denied;
- retryable_failure.

Offline operations must be idempotent and retain original device timestamp plus server receipt timestamp.

---

# 15. Rate Limiting

Recommended initial policies:

| Endpoint class | Limit |
|---|---|
| Login | 5 attempts / 15 minutes per IP/account |
| Standard authenticated API | 600 requests / minute per user |
| Search | 120 requests / minute |
| GPS batch upload | Provider/device-specific |
| File intents | 60 / minute |
| Exports/reports | 20 starts / hour per user |
| Webhooks | Contract-specific |
| Public customer tracking | Strict token/IP limit |

Return `429` with `Retry-After`.

---

# 16. API Security Requirements

- validate JWT issuer, audience, expiry and token version;
- rotate refresh tokens;
- deny suspended tenant/user;
- enforce tenant and scope in every repository call;
- verify object ownership;
- validate all payloads using shared schemas;
- redact secrets and personal financial data from logs;
- sign download URLs with short expiry;
- scan files;
- encrypt integration credentials;
- audit impersonation;
- use anti-replay for webhooks and mobile sync;
- apply maker-checker rules to financial approvals;
- never trust role or tenant identifiers supplied in request body.

---

# 17. API Versioning and Deprecation

- version in URL: `/api/v1`;
- additive changes may remain within version;
- breaking changes require `/v2`;
- return `Deprecation` and `Sunset` headers;
- maintain changelog;
- generated SDKs should pin API version;
- mobile clients require backward-compatible support window.

---

# 18. OpenAPI and Testing Requirements

1. Maintain OpenAPI 3.1 as source of truth.
2. Generate request/response validators.
3. Generate TypeScript client types.
4. Contract-test frontend and backend.
5. Include permission and scope in endpoint descriptions.
6. Include examples for success and each important business error.
7. Test idempotency.
8. Test stale `If-Match`.
9. Test cross-tenant IDOR.
10. Test bulk partial failures.
11. Test integration retry.
12. Test rate limits.

---

# 19. API Definition of Done

- OpenAPI schema approved;
- all endpoints enforce tenant/RBAC;
- validation schemas exist;
- idempotency implemented for high-risk actions;
- optimistic concurrency works;
- standard errors used;
- audit hooks verified;
- correlation IDs propagated;
- pagination and filters tested;
- signed file access implemented;
- real-time events secured;
- webhooks signed and retried;
- performance and security tests pass.

---

**End of `api_specification.md`**
