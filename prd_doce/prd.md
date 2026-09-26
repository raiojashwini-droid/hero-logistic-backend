# Hero Logistics — Final Complete Master Product Requirements Document

**Document Version:** 1.0 Final Consolidated Baseline  
**Prepared Date:** 05 August 2026  
**Prepared For:** Hero Logistics Product, Business, Operations, Dispatch, Fleet, Warehouse, Yard, Finance, Design, Engineering, Security and QA Teams  
**Product Type:** Enterprise multi-tenant Logistics Operating System  
**Document Status:** FINAL CONSOLIDATED MARKDOWN PRD  
**Default Region Context:** Australia and New Zealand  
**Default Currency:** AUD unless tenant configuration specifies otherwise  
**Default Timezone:** Australia/Sydney unless branch or depot configuration specifies otherwise  

**CONFIDENTIAL**

---

## Final Consolidation Note

This file combines:

- all unique Markdown PRDs created earlier in this conversation;
- all newly supplied portal PRDs;
- the stakeholder-provided enterprise/SaaS and Super Admin source document;
- the unique shared platform foundation from the previously generated five-portal Master PRD.

Files that were byte-for-byte identical were included once. Content that is similar but not identical has been preserved as a baseline or supplemental specification so no unique requirement is lost.

### Requirement Precedence

Where two sections describe the same feature differently:

1. approved legal, safety, tax and compliance rules take priority;
2. the stricter security, data-isolation, validation and audit rule applies;
3. portal-specific rules apply to that portal;
4. shared platform rules apply across all portals;
5. unresolved product conflicts must be confirmed by the Product Owner before implementation.

All sample users, customers, dates, IDs, amounts, routes, telemetry and operational counts are illustrative and must not be hard-coded.

---

## Source Manifest

| # | Source | File | Inclusion | SHA-256 | Notes |
|---:|---|---|---|---|---|
| 1 | Stakeholder Enterprise/SaaS source | `Pasted markdown(113).md` | Included in full | `d197ceb063fce696…` | Contains enterprise SaaS, multi-tenancy, Super Admin and additional role/module specifications. |
| 2 | Prior Master PRD | `Hero_Logistics_Master_PRD_All_5_Portals_v1.0.md` | Shared foundation only | `8e84888b8ee49acc…` | Portal copies were excluded from this source because their authoritative files are included separately. |
| 3 | Company Admin Portal PRD | `Hero_Logistics_Admin_Portal_PRD_v1.0.md` | Included in full | `7bf57074f3e51a35…` | Detailed company administration and operational control specification. |
| 4 | Dispatcher Portal — Detailed Baseline | `Hero_Logistics_Dispatcher_Portal_PRD_v1.0(3).md` | Included in full | `91370be99455e13c…` | Stakeholder/uploaded detailed dispatcher baseline. |
| 5 | Dispatcher Portal — Supplemental Developer Specification | `Hero_Logistics_Dispatcher_Portal_PRD_v1.0.md` | Included in full | `f808f45adac4e111…` | Earlier assistant-created implementation specification; retained because it contains unique requirements. |
| 6 | Warehouse Portal PRD | `Hero_Logistics_Warehouse_Portal_PRD_v1.0(2).md` | Included in full | `297b189d271f9f2a…` | Exact duplicate numbered copies were collapsed into one authoritative copy. |
| 7 | Yard Attendant Portal PRD | `Hero_Logistics_Yard_Attendant_Portal_PRD_v1.0(2).md` | Included in full | `be7d1700d7f2e285…` | Exact duplicate numbered copies were collapsed into one authoritative copy. |
| 8 | Accounts Portal PRD | `Hero_Logistics_Accounts_Portal_PRD_v1.0(2).md` | Included in full | `db35fc64e2decaba…` | Exact duplicate numbered copies were collapsed into one authoritative copy. |

---

## Master Contents

1. Enterprise SaaS Logistics OS and stakeholder-provided platform specification  
2. Consolidated shared cross-portal platform foundation  
3. Company Admin Portal detailed PRD  
4. Dispatcher Portal detailed baseline  
5. Dispatcher Portal supplemental developer specification  
6. Warehouse Portal detailed PRD  
7. Yard Attendant Portal detailed PRD  
8. Accounts Portal detailed PRD  
9. Final consolidated implementation rules and sign-off  

---


## Part 1 — Enterprise SaaS Logistics OS, Super Admin and Extended Platform Source

**Source classification:** Stakeholder-provided master source, preserved in full.

### Product Requirement Document (PRD)
#### Hero Logistics — Enterprise SaaS Logistics OS & Multi-Tenant Platform

---

#### 1. Executive Summary & Vision

**Hero Logistics** is a next-generation, multi-tenant enterprise Logistics Operating System (OS) designed for freight carriers, 3PL logistics providers, dispatchers, warehouse managers, fleet operators, drivers, and shippers. The platform unifies end-to-end supply chain execution, real-time GPS fleet telemetry, AI-assisted dispatching, warehouse management (WMS), yard operations, automated invoicing & payroll, and white-label tenant governance into a single cohesive cloud platform.

##### Key Objectives
* **Unified Logistics Ecosystem:** Eliminate fragmented software stacks by combining TMS, WMS, YMS, ELD, CRM, and ERP accounting into one seamless platform.
* **Multi-Tenant SaaS Architecture:** Enable Super Admins to provision isolated tenant workspaces, manage subscription tiers (Starter, Professional, Enterprise, Custom), enforce licensing limits, and customize white-label branding.
* **Role-Based Portals:** Deliver 9 specialized, high-performing web and mobile interfaces tailored for specific operational personas.
* **Real-time Visibility & Automation:** Provide live GPS tracking, automated driver load assignments, instant POD collection, dynamic rate calculations, and automated invoice/payroll processing.

---

#### 2. Platform Architecture & Multi-Tenancy

##### 2.1 Multi-Tenant Isolation
* **Tenant Workspace Model:** Every carrier/company operates in an isolated SaaS workspace with dedicated data scoping (`#TEN-XXXX`).
* **Licensing & Capacity Limits:** Dynamic enforcement of active user limits, driver capacity, fleet vehicle counts, branch limits, and storage quotas based on active plans.
* **White-Label Engine:** Custom domain routing (`cname`), branded headers/logos, customizable primary accent colors, and custom PDF templates per tenant.

##### 2.2 Role-Based Access Control (RBAC)
The system supports strict granular permissions across 9 core roles:
1. `Super Admin` — Platform owner & licensing manager
2. `Sales Manager` — CRM leads, trials & client onboarding
3. `Company Admin` — Tenant business owner & fleet admin
4. `Dispatcher` — Load planner & real-time fleet controller
5. `Driver` — Mobile fleet operator & ELD compliance
6. `Warehouse Manager` — Inbound/outbound stock & inventory controller
7. `Yard Attendant` — Gate scan, trailer movements & lane management
8. `Accounts Manager` — Invoices, payroll, expenses, GST/PAYG & PnL
9. `Shipper / Customer` — Self-service load booking, tracking & POD download

---

#### 3. Product Scope & Detailed Personas / Portals

```
               ┌─────────────────────────────────────────┐
               │    Hero Logistics Enterprise OS        │
               └────────────────────┬────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       │                            │                            │
 ┌─────┴──────┐               ┌─────┴──────┐              ┌──────┴─────┐
 │  SaaS &    │               │  Fleet &   │              │ Warehouse  │
 │ Governance │               │ Operations │              │ & Finance  │
 └─────┬──────┘               └─────┬──────┘              └──────┬─────┘
       │                            │                            │
 ├─ Super Admin Portal        ├─ Company Admin Console     ├─ WMS Manager Portal
 ├─ Sales CRM & Trials        ├─ Dispatcher Terminal       ├─ Yard Attendant App
 └─ Shipper Customer Portal   └─ Driver Mobile App         └─ Accounts & Payroll
```

---

#### 4. Detailed Module Specifications

##### 4.1 Super Admin Portal (`/admin/*`)
* **Platform Dashboard:** Live SaaS MRR/ARR metrics, active vs trial tenant counts, platform health indicators (API, DB, Storage, AI jobs), and real-time audit feed.
* **Tenant Companies Management:** Provision new SaaS tenants (`#TEN-1`), update plan tiers, inspect workspace resources (Users, Drivers, Fleet, Loads), suspend/reactivate licenses, and simulate company login sessions.
* **Subscriptions & Licensing Plans:** Manage plan tiers (Starter, Professional, Enterprise, Custom Enterprise), monthly/annual pricing, user/driver thresholds, feature entitlements, promos/coupons, and overage billing settings.
* **Feature Access Matrix:** Enable/disable global system feature gates (`feat-base-shell`, `feat-ops-map`, `feat-drivers-eld`, `feat-dispatch-board`, `feat-white-labeling`, `feat-crm-leads`, etc.) with plan defaults and tenant manual overrides.
* **White-Label Customizer:** Custom domain (CNAME) manager, logo uploaders (Light/Dark/Favicon), accent color palette builder, PDF manifest/invoice templates, email SMTP envelope customizer, and login panel overrides.
* **Support Tickets & System Audit:** Ticket queue assignment (L1/L2/L3), resolution notes, and immutable system audit logs recording operator IP, timestamp, and actions.

##### 4.2 Sales & CRM Portal (`/sales/*`)
* **Sales Command Dashboard:** Pipeline deal value, lead conversion rates, demo booking schedule, active trial monitor, and revenue forecasting.
* **Lead Tracker & Pipeline Board:** Drag-and-drop deal stage management (New Lead, Demo Scheduled, Proposal Sent, Trial Active, Closed Won).
* **Trial Management & Handover:** Monitor trial expiry countdowns (e.g. 14-day trials), extend trial durations, convert trial tenants to paid subscriptions, and initiate onboarding handover workflows.

##### 4.3 Company Admin Console (`/company-admin/*`)
* **Command Centre:** Unified operational overview of active loads, available drivers, online vehicles, warehouse stock summary, and daily revenue.
* **Fleet & Asset Management:** Vehicle registry (Semi-trucks, Flatbeds, Refrigerated Trailers), maintenance schedules, registration renewals, inspection logs, and asset assignment.
* **Drivers & Roster Management:** Driver profiles, CDL license tracking, medical clearance records, safety checklists, and roster scheduling.
* **Branches & Depot Control:** Multi-terminal branch setup (e.g. Chicago HQ, LA Depot), branch manager assignment, and regional resource allocation.

##### 4.4 Dispatcher Terminal (`/dispatcher/*`)
* **Interactive Dispatch Board:** Drag-and-drop load assignment interface mapping loads to available drivers and trucks.
* **Live GPS Fleet Monitor:** Real-time map displaying vehicle telemetry, speed, route progress, geofence arrivals, and delay alerts.
* **Load Inbox & Booking Requests:** Review inbound shipper load requests, generate rate quotes, issue Rate Confirmations, and dispatch driver manifests.
* **Communication Depot:** Real-time chat channel connecting dispatchers with drivers and customers.

##### 4.5 Driver Mobile App (`/driver/*`)
* **Active Run & Navigation:** Turn-by-turn route overview, pickup/delivery instructions, special handling notes, and arrival pings.
* **Digital Proof of Delivery (POD):** E-signature capture, photo attachment of delivered freight/pallets, and instant POD sync to customer portal.
* **Safety Checklists & HOS/ELD:** Pre-trip & post-trip inspection checklists, hours of service logging, and fatigue management pings.
* **Offline Sync Queue:** Store trip events, signature captures, and photos locally when offline, automatically syncing upon network restoration.
* **Expense & Trailer Swap:** Fuel receipt uploads, toll expense logging, and trailer drop-and-hook recording.

##### 4.6 Warehouse Management System (WMS) (`/warehouse/*`)
* **Inbound Receiving:** Scan inbound shipments, generate item barcodes/labels, record damaged items, and assign staging locations.
* **Current Stock & Inventory Search:** Real-time aisle/bay/rack slotting, stock quantity search, and lot/serial number tracking.
* **Movements & Stock Transfers:** Inter-aisle stock transfers, replenishment alerts, and warehouse heatmaps.
* **Outbound Dispatch & Load Lanes:** Staging outbound pallets into assigned load lanes, verifying cross-dock transfers, and loading confirmation.

##### 4.7 Yard & Gate Attendant Terminal (`/yard/*`)
* **Yard Overview & Map:** Live visual mapping of yard bays, trailer locations, and dock door statuses (Occupied, Empty, Loading, Unloading).
* **Gate Check-In & Check-Out:** Fast QR/barcode scanning of arriving/departing trucks, driver license verification, and seal number checks.
* **Yard Movements & Work Status:** Assign yard hostlers to move trailers between parking slots and dock doors.
* **Incident Reporting:** Log yard damages, unauthorized access, or equipment breakdowns with photo logs.

##### 4.8 Accounts & Financials Portal (`/accounts/*`)
* **Invoicing & Ledger:** Automated invoice generation from completed loads, review pending invoices, send digital receipts, and track overdue accounts.
* **Payroll & Contractor Settlements:** Process driver mileage/hourly pay, contractor revenue splits, deduction management, and paystub generation.
* **Expenses & Vehicle Cost Audit:** Expense categorization (Fuel, Maintenance, Tolls, Insurance), vehicle cost-per-mile analysis, and tax reporting (GST / PAYG).
* **Profit & Loss (P&L) Analytics:** Real-time gross margin charts, operating revenue vs cost breakdowns, and financial export reports.

##### 4.9 Shipper / Customer Portal (`/customer/*`)
* **Self-Service Load Booking:** Create new freight requests, select trailer types, specify pickup/dropoff windows, and obtain instant quote estimates.
* **Live Shipment Tracking:** Interactive map tracking assigned loads with real-time ETA updates.
* **Documents & Invoices:** View, download, and store signed Proof of Delivery (POD) documents, Bills of Lading (BOL), and billing invoices.
* **Dispatcher Direct Chat & Support:** Live chat interface with assigned dispatchers and support ticket management.

---

#### 5. Technology Stack & Infrastructure

| Component | Technology / Library |
| :--- | :--- |
| **Frontend Framework** | React 19 (Vite 8, ES Modules) |
| **Routing** | React Router DOM v7 |
| **Styling & Theme** | Vanilla CSS + TailwindCSS v4, CSS Custom Properties |
| **Icons & Visuals** | Lucide React, React Icons |
| **Maps & Telemetry** | Leaflet, React Leaflet (Interactive OpenStreetMap) |
| **Charts & Analytics** | Recharts |
| **Sliders & Motion** | Swiper, Framer Motion |
| **Backend Runtime** | Node.js (REST API / Microservices) |
| **Database** | PostgreSQL / MongoDB (Multi-Tenant Schemas) |

---

#### 6. Non-Functional Requirements (NFRs)

1. **Performance & Speed:** Initial page load under 1.5s; map rendering frame rate at 60 FPS; seamless state updates.
2. **Security & Data Isolation:** Strict tenant ID validation on every API request; encrypted payload storage; HTTPS enforcement.
3. **Reliability & Offline Capability:** LocalStorage / IndexedDB fallback for Driver Mobile App during connectivity loss.
4. **Usability & Accessibility:** Modern Dark/Light glassmorphism UI, intuitive navigation, high contrast text, and responsive mobile-first views for driver/yard portals.

---

#### 7. Future Enhancement Roadmap

* 🤖 **AI Autonomous Dispatcher:** Predictive route optimization matching loads to closest drivers based on HOS capacity.
* 📦 **IoT Telemetry Sensor Integration:** Live temperature and humidity sensors for cold-chain refrigerated trailers.
* 💳 **Automated Payment Gateway Connections:** Native Stripe, PayPal, and Plaid ACH integrations for instant invoice settlement.
* 📄 **OCR Document Parser:** Automatic data extraction from scanned paper Bills of Lading (BOL) and driver receipts.


### Hero Logistics Enterprise Suite
### Product Requirements Document (PRD)

Version: 1.0
Module: Super Admin Portal
Section: Overview Dashboard
Status: Draft
Priority: Critical
Access Level: Super Admin

---

### 1. Module Overview

#### Module Name

Super Admin Dashboard

#### Description

The Super Admin Dashboard is the central command center of the Hero Logistics Enterprise SaaS Platform. It provides a complete operational overview of the entire multi-tenant system, including tenant companies, subscriptions, revenue, platform health, AI services, billing, support tickets, analytics, and administrative actions.

The dashboard enables platform owners to monitor business performance, manage SaaS tenants, provision new companies, control licensing, monitor infrastructure health, and perform administrative actions from a single interface.

---

### 2. Business Goal

Provide one centralized dashboard that allows the platform owner to

• Monitor platform health
• Monitor SaaS revenue
• Monitor tenant activity
• Manage subscriptions
• Manage companies
• Review billing
• Review AI usage
• Track support tickets
• Monitor infrastructure
• Perform administrative actions quickly

---

### 3. User Role

Primary User

Super Admin

Permissions

✔ Full Platform Access

✔ Create Company

✔ Suspend Company

✔ Reactivate Company

✔ Manage Plans

✔ Login As Tenant

✔ View Revenue

✔ Configure Features

✔ Configure White Label

✔ Billing Management

✔ User Management

✔ Security Management

✔ Audit Logs

✔ AI Controls

---

### 4. Navigation

Sidebar

• Dashboard

• Companies

• Subscriptions

• Membership Plans

• Feature Access

• White Label

• Support Tickets

• Billing

• System Analytics

• Inter Company Transfers

• AI Controls

• User Management

• Settings

---

### 5. Dashboard Layout

The dashboard consists of the following sections.

1. Header

2. KPI Cards

3. Revenue Chart

4. Tenant Overview Table

5. Platform Actions

6. Platform Health Center

7. Subscription Monitoring

8. Recent Platform Activity

9. Provision New SaaS Tenant

10. Suspend License

11. Reactivate Company

12. Simulate Login

13. Create Plan

14. Edit Plan

15. Change Subscription

16. Enable Feature

17. Disable Feature

18. White Label Branding

19. Support Tickets

20. Tenant Workspace Inspector

---

### 6. Header Section

Display

Super Admin

Overview

Description

Configure global licensing rules, audit tenant margins, and resolve support tickets.

Button

Export Report

---

### 7. KPI Cards

The dashboard displays real-time platform statistics.

Card 1

Title

Active Companies

Value

4

Description

SaaS instances online

Status

Stable

---

Card 2

Title

Trial Companies

Value

2

Description

SaaS trial instances

Indicator

+1 MoM

---

Card 3

Title

Paid Companies

Value

3

Description

Subscribed paying contracts

Status

Stable

---

Card 4

Title

Monthly Revenue

Value

$42,910

Description

Platform cash stream baseline

Growth

+4%

---

Card 5

Title

Failed Payments

Value

1

Description

Payment gateway errors

Status

0 alerts

---

Card 6

Title

Support Tickets

Value

2

Description

Requires administrative response

Status

Alert

---

Card 7

Title

Active Users

Value

118

Description

Active platform users

Growth

+3 Active

---

Card 8

Title

Platform Usage

Value

14.2%

Description

AWS Node Limits

Status

Stable

---

### 8. Revenue Analytics

Component

MRR Revenue Timeline

Chart Type

Line Chart

XAxis

January

February

March

April

May

June

YAxis

Revenue (USD)

Purpose

Display monthly recurring revenue trend.

---

### 9. Tenant Overview

Description

Displays all registered tenant companies.

Table Columns

Company

Subscription Plan

Status

Active Users

Monthly Revenue

Trial Expiry

Last Login

Actions

Actions

View

Suspend

Login As

Billing

Sorting

Enabled

Search

Enabled

Pagination

Enabled

Column Visibility

Supported

CSV Export

Supported

Excel Export

Supported

PDF Export

Supported

---

### 10. Platform Actions

Quick administrative workflows.

Actions

Add Company

Suspend Company

Reactivate Company

Login As Company

Create Plan

Edit Plan

Change Subscription

Enable Feature

Disable Feature

White Label

Export Report

---

### 11. Platform Health Center

System Status

API Health

99.98%

Database Health

Synced

Storage Health

52.3% Free

Queue Health

0 Pending

AI Processing Health

Active

Usage Metrics

Active Sessions

42

Requests Per Minute

1250 RPM

Storage Usage

4.78 TB / 10 TB

AI Jobs

14050

Open Tickets

2

High Priority

1

Waiting Customer

1

Waiting Internal

1

Quick Actions

Open Ticket

Assign Ticket

Resolve Ticket

---

### 12. Subscription Monitoring

Displays

Active Plans

Expiring Plans

Overdue Payments

Upgrade Opportunities

Quick Actions

Renew

Upgrade

Change Subscription

---

### 13. Recent Platform Activity

Purpose

Displays latest administrative events.

Example

Company Created

Plan Changed

Subscription Upgraded

Trial Converted

Billing Updated

Login Activity

Each activity contains

Timestamp

Operator

Company

Description

---

### 14. Permissions

Only Super Admin can access this module.

Unauthorized users must receive

403 Forbidden

No menu visibility

No API access

---

### 15. Business Rules

• KPI cards refresh automatically every 60 seconds.

• Revenue charts use live billing data.

• Only Active companies appear by default.

• Trial companies are highlighted.

• Suspended companies cannot login.

• Login As generates audit logs.

• Export Report respects active filters.

• Every administrative action creates an audit log.

---

### 16. API Requirements

GET /api/super-admin/dashboard

GET /api/super-admin/platform-health

GET /api/super-admin/revenue

GET /api/super-admin/tenant-overview

GET /api/super-admin/recent-activity

POST /api/super-admin/export

---

### 17. Database Tables

companies

subscriptions

users

plans

billing

payments

support_tickets

audit_logs

system_metrics

feature_access

white_label

---

### 18. Acceptance Criteria

✅ Dashboard loads under 2 seconds.

✅ KPI values are accurate.

✅ Charts render correctly.

✅ Search and filters work.

✅ Export functions generate valid files.

✅ Audit logs record all actions.

✅ Unauthorized users cannot access dashboard.

✅ Responsive layout works on desktop, tablet, and mobile.

---

### Super Admin → Companies

#### Module Purpose
- Manage all SaaS tenant companies from a single interface.
- Provision new tenant workspaces.
- Monitor company status, subscription, usage, and activity.
- Perform administrative actions like suspend, reactivate, billing, and login as tenant.

---

### User Role
- Super Admin only

---

### Permissions
- View Companies
- Create Company
- Edit Company
- Suspend Company
- Reactivate Company
- Delete Company
- Login As Company
- View Billing
- View Users
- View Branches
- View Fleet
- View Loads
- View Support Tickets
- View Audit Logs
- Export Data

---

### Header
- Page Title: Companies
- Description
- Export Report Button
- Provision Tenant Button

---

### KPI Cards

#### Total Companies
- Display total registered tenants.

#### Active Companies
- Display active companies.

#### Trial Companies
- Display trial companies.

#### Suspended Companies
- Display suspended companies.

#### Expiring This Month
- Companies whose trial expires this month.

#### Monthly Revenue
- Total MRR generated.

#### Annual Revenue
- ARR calculation.

#### Active Users
- Total users across all companies.

#### Total Drivers
- Total registered drivers.

#### Total Loads
- Total active loads.

#### Storage Usage
- Current storage usage.

---

### Search

- Search by Company Name
- Search by Company ID
- Search by Email
- Search by Account Manager

---

### Filters

- Status
- Subscription Plan
- Trial
- Country
- Created Date
- Last Login
- Account Manager

---

### Export

- CSV
- Excel
- PDF

---

### Company Table

Columns

- Company Name
- Company ID
- Subscription Plan
- Status
- Branches
- Users
- Drivers
- Fleet Vehicles
- Active Loads
- Monthly Revenue
- Last Login
- Trial Expiry
- Created Date
- Account Manager
- Actions

---

### Actions

- View
- Edit
- Suspend
- Reactivate
- Login As
- Billing
- Tenant Inspector

---

### Provision New SaaS Tenant

Fields

- Company Name
- Workspace Manager Email
- Workspace Manager Password
- Subscription Plan

Buttons

- Finalize Setup
- Cancel

Validation

- Company name required.
- Email unique.
- Password minimum 8 characters.
- Subscription mandatory.

System Actions

- Create Workspace
- Create Database
- Create Company Admin
- Assign Subscription
- Generate Audit Log
- Send Welcome Email

---

### Suspend Company

Fields

- Select Company
- Reason
- Confirmation

Business Rules

- Only active companies can be suspended.
- Company users cannot login after suspension.
- Billing remains active.
- Audit log generated.

---

### Reactivate Company

Fields

- Select Company

Business Rules

- Only suspended companies allowed.
- Previous subscription restored.
- Login enabled.
- Audit log generated.

---

### Login As Company

Purpose

Allow Super Admin to access tenant workspace.

Rules

- Read audit log.
- Record timestamp.
- Record IP.
- Record operator.
- Session expires automatically.

---

### Tenant Workspace Inspector

Tabs

#### Overview
- Company Information
- Account Manager
- Region
- Joined Date
- Last Login
- Active Users
- Drivers
- Fleet
- Branches

Actions

- Suspend Workspace
- Delete Workspace

---

#### Subscription

Display

- Current Plan
- Billing Rate
- Billing Cycle
- Renewal Date
- Trial Expiry

---

#### Users

Display

- Name
- Email
- Role
- Status

Actions

- View
- Suspend
- Reset Password

---

#### Branches

Display

- Branch Name
- Location
- Staff Count

---

#### Fleet

Display

- Vehicle Number
- Vehicle Type
- Status

---

#### Loads

Display

- Load Number
- Route
- Status

---

#### Billing

Display

- Monthly Revenue
- Annual Projection
- Billing Cycle
- Auto Renewal

Invoices

- Paid
- Draft
- Sent
- Overdue

Actions

- View Invoice
- Download PDF

---

#### Support Tickets

Display

- Ticket Number
- Subject
- Priority
- Status

Actions

- View
- Assign
- Resolve

---

#### Feature Access

Display

- Feature Name
- Status

Actions

- Enable
- Disable

---

#### Audit Log

Display

- Action
- User
- Timestamp
- IP Address
- Description

---

### Business Rules

- Company ID must be unique.
- One active subscription per company.
- Trial automatically expires.
- Suspended companies cannot login.
- Deleted company cannot be recovered.
- Login As must generate audit logs.
- Billing always linked to subscription.
- Storage limits depend on subscription.
- Driver limits depend on plan.
- User limits depend on plan.

---

### Notifications

- Company Created
- Company Suspended
- Company Reactivated
- Subscription Updated
- Trial Expiring
- Billing Failed

---

### Validation Rules

- Required fields mandatory.
- Email unique.
- Password complexity required.
- Company name unique.
- Subscription required.
- Plan must exist.

---

### APIs

GET /companies

GET /companies/{id}

POST /companies

PUT /companies/{id}

DELETE /companies/{id}

POST /companies/suspend

POST /companies/reactivate

POST /companies/login-as

GET /companies/{id}/billing

GET /companies/{id}/users

GET /companies/{id}/loads

GET /companies/{id}/fleet

GET /companies/{id}/branches

GET /companies/{id}/audit

---

### Database Tables

companies

company_users

subscriptions

subscription_plans

branches

fleet

loads

billing

invoices

support_tickets

feature_access

audit_logs

storage_usage

---

### Audit Logs

Log

- Company Created
- Company Updated
- Company Deleted
- Company Suspended
- Company Reactivated
- Login As
- Billing Updated
- Subscription Changed
- User Added
- User Removed

Store

- User
- Timestamp
- IP Address
- Browser
- Old Value
- New Value

---

### Security

- RBAC enabled.
- JWT authentication.
- MFA support.
- Session timeout.
- Login audit.
- IP logging.
- Activity tracking.

---

### Error States

- Company Not Found
- Subscription Missing
- Invalid Plan
- Duplicate Company
- Duplicate Email
- Permission Denied
- Server Error

---

### Success Messages

- Company created successfully.
- Company updated successfully.
- Company suspended successfully.
- Company reactivated successfully.
- Login session started.
- Billing updated successfully.

---

### Acceptance Criteria

- Company CRUD working.
- Search working.
- Filters working.
- Export working.
- Tenant Inspector working.
- Suspend/Reactivate working.
- Login As working.
- Billing visible.
- Users visible.
- Fleet visible.
- Branches visible.
- Loads visible.
- Audit logs generated.
- RBAC enforced.
- Responsive UI.
- Performance <2 seconds.


### Super Admin → Subscriptions

#### Module Purpose
- Manage all tenant subscriptions.
- Monitor active, trial, suspended, and expired subscriptions.
- Track MRR, ARR, renewals, payments, and subscription lifecycle.
- Upgrade, downgrade, renew, suspend, or cancel subscription plans.

---

### User Role
- Super Admin

---

### Permissions
- View Subscriptions
- Create Subscription
- Edit Subscription
- Upgrade Plan
- Downgrade Plan
- Renew Subscription
- Suspend Subscription
- Resume Subscription
- Cancel Subscription
- View Billing
- View Payment History
- Export Reports

---

### Header
- Page Title: Subscriptions
- Description
- Export Report Button

---

### KPI Cards

#### Active Subscriptions
- Total active subscriptions.

#### Trial Subscriptions
- Total trial subscriptions.

#### Expiring Trials
- Trials expiring soon.

#### Suspended Subscriptions
- Suspended or On-Hold subscriptions.

#### Monthly Recurring Revenue (MRR)
- Current monthly revenue.

#### Annual Recurring Revenue (ARR)
- Yearly projected revenue.

#### Failed Payments
- Total failed payment transactions.

---

### Charts

#### MRR Performance
- Monthly Revenue Trend
- Line Chart

#### ARR Projection
- Annual Revenue Projection
- Area Chart

#### Churn & Growth Analytics
- Upgrades
- Downgrades
- Churn Rate
- Subscription Growth

---

### Search

- Search by Company Name
- Search by Subscription ID

---

### Filters

- Plan
- Status
- Billing Cycle
- Auto Renewal
- Payment Status

---

### Subscription Table

Columns

- Subscription ID
- Company
- Plan
- Status
- Billing Period
- Start Date
- Next Renewal
- Monthly Amount
- Auto Renewal
- Actions

---

### Actions

- View Subscription
- Upgrade Plan
- Downgrade Plan
- Renew Subscription
- Suspend Subscription
- Resume Subscription
- View Billing
- View Ledger
- View Audit Logs

---

### Subscription Workspace Inspector

Tabs

#### Overview
Display
- Subscription ID
- Company
- Status
- Assigned Plan
- Billing Period
- Start Date
- Auto Renewal
- Monthly MRR
- Annual Projection
- Next Renewal
- Payment Gateway

Actions
- Upgrade Plan
- View Ledger & Invoices

---

#### Plan Details
Display
- Current Plan
- Version
- Features
- User Limits
- Driver Limits
- Fleet Limits
- Storage Limits

---

#### Billing & Cycle
Display
- Monthly Amount
- Billing Cycle
- Renewal Date
- Auto Renewal
- Payment Method
- Invoice History

---

#### Limits & Modules
Display
- Active Users
- Drivers
- Fleet
- Storage
- API Calls
- Enabled Modules

---

#### Audit Log
Display
- Subscription Created
- Plan Changed
- Renewal
- Payment Success
- Payment Failed
- Suspension
- Reactivation

---

### Upgrade Subscription

Fields

- Select Company
- Current Plan
- New Plan
- Effective Date

Validation

- New plan must exist.
- Cannot downgrade automatically if restrictions apply.

Business Rules

- Calculate price difference.
- Update limits.
- Generate invoice.
- Create audit log.

---

### Downgrade Subscription

Business Rules

- Check current usage.
- Prevent downgrade if limits exceeded.
- Notify tenant.
- Create audit log.

---

### Renew Subscription

Business Rules

- Generate renewal invoice.
- Extend expiry date.
- Send confirmation email.
- Update billing records.

---

### Suspend Subscription

Business Rules

- Block tenant access.
- Keep billing history.
- Keep audit logs.
- Notify company admin.

---

### Resume Subscription

Business Rules

- Restore access.
- Restore plan features.
- Update subscription status.

---

### Validation Rules

- Company must exist.
- Plan must exist.
- Billing cycle required.
- Renewal date required.
- Auto renewal boolean only.

---

### Notifications

- Trial Expiring
- Subscription Renewed
- Subscription Suspended
- Subscription Reactivated
- Plan Upgraded
- Plan Downgraded
- Payment Failed
- Payment Successful

---

### APIs

GET /subscriptions

GET /subscriptions/{id}

POST /subscriptions

PUT /subscriptions/{id}

DELETE /subscriptions/{id}

POST /subscriptions/upgrade

POST /subscriptions/downgrade

POST /subscriptions/renew

POST /subscriptions/suspend

POST /subscriptions/resume

GET /subscriptions/{id}/billing

GET /subscriptions/{id}/audit

---

### Database Tables

subscriptions

subscription_plans

subscription_history

subscription_limits

billing

payments

payment_methods

renewals

audit_logs

companies

---

### Business Rules

- One active subscription per company.
- Plan determines feature access.
- Subscription controls user limits.
- Subscription controls driver limits.
- Subscription controls fleet limits.
- Subscription controls storage limits.
- Failed payments trigger alerts.
- Trial automatically converts or expires.
- Every change generates audit logs.

---

### Security

- Super Admin only.
- JWT authentication.
- RBAC validation.
- Audit logging enabled.
- IP logging enabled.

---

### Error States

- Subscription Not Found
- Invalid Plan
- Company Not Found
- Renewal Failed
- Payment Failed
- Permission Denied

---

### Success Messages

- Subscription created successfully.
- Subscription updated successfully.
- Subscription upgraded successfully.
- Subscription renewed successfully.
- Subscription suspended successfully.
- Subscription resumed successfully.

---

### Acceptance Criteria

- Subscription CRUD working.
- Search working.
- Filters working.
- Charts working.
- Inspector working.
- Upgrade working.
- Downgrade working.
- Renew working.
- Suspend working.
- Resume working.
- Billing integration working.
- Audit logs generated.
- Responsive UI.
- Performance under 2 seconds.


### Super Admin → Membership Plans

#### Module Purpose
- Create and manage SaaS subscription plans.
- Configure licensing rules, pricing, limits, and features.
- Control plan lifecycle and versioning.
- Manage coupons, trials, billing, migrations, and payment gateways.

---

### User Role
- Super Admin

---

### Permissions
- View Plans
- Create Plan
- Edit Plan
- Clone Plan
- Version Plan
- Publish Plan
- Deprecate Plan
- Delete Draft Plan
- Manage Coupons
- Manage Trial
- Manage Payment Gateways
- Manage Billing Ledger
- Export Reports

---

### Header
- Page Title: Membership Plans
- Description
- Export Report
- Create Plan

---

### KPI Cards

#### Total Licensing Plans
- Total registered plans

#### Active Subscribers
- Total paying subscribers

#### Trial Subscribers
- Total trial tenants

#### Monthly Revenue (MRR)
- Current recurring revenue

#### Annual Revenue (ARR)
- Projected annual revenue

#### Upgrade Rate
- Percentage of upgraded tenants

#### Downgrade Rate
- Percentage of downgraded tenants

#### Churn Rate
- Monthly churn percentage

#### Growth Index
- Overall SaaS growth score

---

### Billing Toggle

- Monthly Billing
- Annual Billing (15% Discount)

---

### Plans Grid

Each Plan Card Displays

- Plan Name
- Version
- Status
- Monthly Price
- Annual Price
- Trial Days
- Active Users Limit
- Driver Limit
- Fleet Limit
- Storage Limit
- Modules Included
- Subscribers Count
- Monthly Revenue
- Growth Percentage

Actions

- Configure
- Clone Plan
- Publish
- Deprecate

---

### Search

- Search by Plan Name
- Search by Plan ID

---

### Filters

- Status
- Billing Type
- Version
- Published/Draft

---

### Export

- CSV
- Excel
- PDF

---

### Plans Registry Table

Columns

- Plan ID
- Plan Name
- Version
- Status
- Monthly Price
- Annual Price
- Trial Days
- Subscribers
- Monthly Revenue
- Created By
- Last Updated
- Actions

---

### Plan Actions

- View
- Configure
- Clone
- Publish
- Deprecate
- Version History
- Delete Draft

---

### Create New Plan Wizard

#### Step 1 - Information

Fields

- Plan Name
- Version
- Lifecycle Status
- Description

Validation

- Plan Name Required
- Version Required
- Unique Version

Buttons

- Cancel
- Next

---

#### Step 2 - Limits

Fields

- Max Users
- Max Drivers
- Max Fleet Vehicles
- Max Branches
- Storage Limit (GB)
- API Calls Limit

Rules

- 0 = Unlimited
- Positive numbers only

Buttons

- Back
- Next

---

#### Step 3 - Features

Selectable Modules

- Dispatch
- Fleet
- GPS
- Driver App
- Warehouse
- CRM
- Customer Portal
- Billing
- AI Dispatch
- Reports
- API Access
- White Label
- Integrations

Buttons

- Back
- Next

---

#### Step 4 - Billing

Fields

- Monthly Price
- Annual Price
- Trial Days
- Currency

Validation

- Amount > 0
- Trial Days >=0

Buttons

- Back
- Next

---

#### Step 5 - Review

Display Summary

- Plan Info
- Limits
- Features
- Pricing

Buttons

- Save Draft
- Publish
- Back

---

### Configure Existing Plan

Editable

- Description
- Limits
- Features
- Pricing
- Trial Days
- Status

---

### Version Control

Display

- Current Version
- Release History
- Created By
- Release Date
- Changelog

Actions

- Compare Versions
- Rollback
- Publish Version

---

### Lifecycle Management

States

- Draft
- Published
- Deprecated
- Archived

Rules

- Published plans cannot be deleted.
- Draft plans can be deleted.
- Deprecated plans cannot accept new subscriptions.
- Existing subscribers continue until migrated.

---

### Feature Matrix

Columns

- Feature
- Starter
- Professional
- Enterprise
- Custom Enterprise

Rows

- Dispatch
- Fleet
- GPS
- Driver App
- AI Dispatch
- Reports
- API
- White Label
- CRM
- Customer Portal
- Integrations

Limits

- Users
- Drivers
- Fleet
- Branches
- Storage
- API Calls

---

### Coupons & Promotions

Display

- Promo Code
- Campaign Name
- Discount Type
- Discount Value
- Redemption Count
- Maximum Usage
- Expiry Date
- Status

Actions

- Add Coupon
- Edit Coupon
- Disable Coupon
- Delete Coupon

Coupon Types

- Percentage Discount
- Fixed Discount
- Trial Extension

---

### Trial Management

Display

- Company
- Admin
- Trial Expiry
- Days Remaining
- Usage Limits
- Status

Actions

- Convert To Paid
- Extend Trial
- Notify Customer

Business Rules

- Auto notify before expiry.
- Expired trial becomes Hold.
- Manual conversion supported.

---

### Revenue Intelligence

Charts

- MRR Timeline
- ARR Projection
- Subscriber Mix
- Customer Lifetime Value
- CAC
- Churn
- Net Revenue Retention

---

### Overage Billing

Track

- User Limit Exceeded
- Driver Limit Exceeded
- Storage Exceeded
- API Calls Exceeded

Actions

- Generate Invoice
- Upgrade Suggestion
- Notify Company

---

### Payment Gateways

Supported

- Stripe
- PayPal
- ACH
- Wire Transfer

Settings

- API Keys
- Secret Keys
- Routing
- Payment Terms

Actions

- Save Configuration
- Test Connection

---

### Bulk Migration

Fields

- Source Plan
- Destination Plan

Rules

- Validate Limits
- Update Features
- Generate Audit Logs
- Notify Companies

---

### Billing Ledger

Display

- Invoice Number
- Company
- Plan
- Billing Period
- Status
- Payment Method
- Amount

Actions

- View Invoice
- Download Receipt
- Send Email

---

### Audit Center

Display

- Action
- Operator
- Timestamp
- IP Address
- Details

Tracked Events

- Plan Created
- Plan Updated
- Plan Published
- Plan Deprecated
- Coupon Created
- Trial Converted
- Bulk Migration
- Gateway Updated

---

### Validation Rules

- Plan Name Unique
- Version Unique
- Monthly Price Required
- Annual Price Required
- Trial Days Positive
- Limits Positive
- Feature Dependency Validation

---

### Notifications

- Plan Published
- Plan Deprecated
- Trial Expiring
- Coupon Expiring
- Payment Gateway Error
- Bulk Migration Completed

---

### APIs

GET /plans

GET /plans/{id}

POST /plans

PUT /plans/{id}

DELETE /plans/{id}

POST /plans/clone

POST /plans/publish

POST /plans/deprecate

GET /plans/version-history

POST /plans/rollback

GET /plans/feature-matrix

POST /plans/coupons

GET /plans/trials

POST /plans/convert-trial

POST /plans/extend-trial

POST /plans/bulk-migration

GET /plans/billing-ledger

GET /plans/audit

---

### Database Tables

subscription_plans

plan_versions

plan_features

plan_limits

plan_pricing

plan_trials

plan_coupons

coupon_redemptions

bulk_migrations

billing_ledger

payment_gateways

audit_logs

---

### Business Rules

- One active published version.
- Draft editable.
- Published immutable.
- Version history maintained.
- Every update logged.
- Feature dependency validation.
- Coupons expire automatically.
- Trial conversion creates invoice.
- Bulk migration updates all tenants.

---

### Security

- Super Admin only.
- RBAC enforced.
- MFA supported.
- Audit logging mandatory.

---

### Error States

- Duplicate Plan
- Invalid Version
- Invalid Pricing
- Dependency Missing
- Migration Failed
- Coupon Invalid
- Payment Gateway Error

---

### Success Messages

- Plan created successfully.
- Plan updated successfully.
- Plan published successfully.
- Plan cloned successfully.
- Coupon created successfully.
- Trial converted successfully.
- Migration completed successfully.

---

### Acceptance Criteria

- Plan CRUD working.
- Wizard working.
- Version control working.
- Feature matrix working.
- Coupons working.
- Trial management working.
- Revenue analytics working.
- Overage billing working.
- Payment gateway configuration working.
- Bulk migration working.
- Billing ledger working.
- Audit center working.
- Responsive UI.
- Performance under 2 seconds.

### Super Admin → Feature Access

#### Module Purpose
- Centralized management of all SaaS platform features.
- Control feature licensing by subscription plan.
- Register new platform modules.
- Manage feature dependencies.
- Configure company-level feature overrides.
- Monitor feature adoption and usage analytics.
- Maintain feature version history and audit logs.

---

### User Role

- Super Admin

---

### Permissions

- View Features
- Create Feature
- Edit Feature
- Delete Feature
- Clone Feature
- Enable Feature
- Disable Feature
- Configure Licensing
- Configure Company Overrides
- Manage Feature Versioning
- Export Feature Reports
- View Analytics
- View Audit Logs

---

### Header

- Page Title: Feature Access
- Description
- Export Report
- Create Feature Button

---

### KPI Cards

#### Total Licensed Features
- Total registered platform features.

#### Active Features
- Features currently enabled.

#### Premium Tier Modules
- Premium-only modules.

#### Premium License Adopters
- Companies using premium modules.

#### Beta Modules
- Features in beta stage.

#### License Utilization
- Percentage of licensed features in use.

#### Assigned Today
- Newly assigned features.

#### Updated This Month
- Features modified during current month.

---

### Tabs

- Dynamic Features Matrix
- Feature Usage Analytics
- Security & Audit Center

---

### Search

- Search Feature Name
- Search Feature ID

---

### Filters

- Category
- Status
- Licensing Type
- Plan
- Version

---

### Export

- CSV
- Excel
- PDF

---

### Feature Categories

Platform

Operations

Fleet

Drivers

Dispatch

Loads

Administration

API

Developer Tools

Billing

CRM

Customer Portal

Tracking

Warehouse

Finance

HR

Reports

Integrations

---

### Feature Registry Table

Columns

- Feature Name
- Feature ID
- Description
- Category
- Licensing Type
- Status
- Usage Count
- Companies
- Version
- Dependencies
- Actions

---

### Feature Actions

- View
- Configure
- Clone
- Enable
- Disable
- Delete
- Version History

---

### Register New Feature Wizard

#### Step 1

Metadata

Fields

- Feature Name
- Unique Feature ID
- Description
- Category
- Licensing Type

Validation

- Required
- Unique Feature ID

Buttons

- Cancel
- Next

---

#### Step 2

Plan Entitlements

Enable by default for

- Starter
- Professional
- Enterprise
- Custom Enterprise

Buttons

- Back
- Next

---

#### Step 3

Dependencies

Fields

- Required Features
- API Dependency
- Database Dependency

Validation

- Circular dependency check

Buttons

- Back
- Save Feature

---

### Feature Configuration

Editable Fields

- Feature Name
- Description
- Category
- Licensing
- Status
- Version
- Dependencies
- API Load
- Storage Requirement

---

### Licensing Policy

Overview

Display

- Description
- Licensing Category
- Required Modules
- Estimated API Load
- Storage Capacity
- Performance Footprint
- Licensing Tier
- Feature Dependencies

---

### Company Overrides

Purpose

Grant or revoke feature access for individual companies.

Fields

- Company
- Override Type
- Reason

Override Types

- Force Enabled
- Force Disabled

Actions

- Create Override
- Edit Override
- Delete Override

Business Rules

- Override takes priority over plan.
- Every override generates audit log.

---

### Feature Analytics

Display

- Adoption Rate
- Monthly Growth
- Utilization
- Estimated Revenue
- Companies Using
- API Requests
- Storage Usage

Charts

- Adoption Trend
- Usage Trend
- Revenue Contribution

---

### Version Control

Display

- Current Version
- Previous Versions
- Published Date
- Published By
- Changelog

Actions

- Bump Version
- Publish
- Rollback

Validation

- Semantic Versioning

---

### Dynamic Feature Matrix

Columns

Starter

Professional

Enterprise

Custom Enterprise

Rows

All Features

Actions

- Enable
- Disable
- Compare Plans

---

### Feature Dependencies

Display

Required Modules

Dependent Modules

Dependency Graph

Validation

- Prevent disabling parent dependency.

---

### Security & Audit Center

Audit Logs

Display

- Action
- Feature
- Operator
- Timestamp
- IP Address
- Browser
- Details

Tracked Events

- Feature Created
- Feature Updated
- Feature Deleted
- Feature Enabled
- Feature Disabled
- Feature Cloned
- Version Published
- Company Override Created

---

### Validation Rules

- Feature Name Required
- Feature ID Unique
- Version Required
- Dependency Validation
- Licensing Required

---

### Notifications

- Feature Created
- Feature Updated
- Feature Disabled
- Feature Enabled
- Version Published
- Override Applied

---

### APIs

GET /features

GET /features/{id}

POST /features

PUT /features/{id}

DELETE /features/{id}

POST /features/clone

POST /features/enable

POST /features/disable

GET /features/analytics

GET /features/audit

POST /features/version

POST /features/rollback

POST /features/company-override

GET /features/matrix

---

### Database Tables

features

feature_versions

feature_dependencies

feature_categories

feature_overrides

feature_usage

feature_analytics

feature_permissions

audit_logs

companies

plans

---

### Business Rules

- Feature ID immutable after creation.
- Version history maintained.
- Parent dependency cannot be disabled.
- Overrides supersede plan settings.
- Disabled features hidden from tenant UI.
- Every change creates audit log.
- Usage analytics updated automatically.

---

### Security

- Super Admin access only.
- RBAC validation.
- MFA supported.
- Audit logging mandatory.
- IP tracking enabled.

---

### Error States

- Duplicate Feature ID
- Dependency Missing
- Invalid Version
- Override Conflict
- Feature Not Found
- Permission Denied

---

### Success Messages

- Feature created successfully.
- Feature updated successfully.
- Feature cloned successfully.
- Feature enabled successfully.
- Feature disabled successfully.
- Override applied successfully.
- Version published successfully.

---

### Acceptance Criteria

- Feature CRUD working.
- Registration wizard working.
- Feature matrix working.
- Company overrides working.
- Versioning working.
- Dependency validation working.
- Analytics working.
- Audit logs generated.
- Export working.
- Responsive UI.
- Performance under 2 seconds.

### Super Admin → White Label

#### Module Purpose

- Allow Super Admin to fully customize tenant branding.
- Support White Label SaaS deployment.
- Manage custom domains and SSL.
- Configure themes, branding assets, emails, PDFs, login pages.
- Manage deployment pipeline and API integrations.

---

### User Role

- Super Admin

---

### Permissions

- View White Label
- Manage Branding
- Manage Themes
- Manage Domains
- Manage SMTP
- Manage PDF Templates
- Manage Login Page
- Manage Assets
- Deploy Branding
- Manage Security
- Manage API Integrations
- Export Audit Logs

---

### Header

- Page Title : White Label
- Export Report

---

### KPI Cards

#### Active White Label Clients
- Total tenants using white-label branding.

#### Active Custom Domains
- Total configured domains.

#### Pending Deployments
- Waiting deployments.

#### Branding Health Score
- Branding validation percentage.

#### SSL Status
- SSL certificate health.

#### Active Theme Version
- Current published theme version.

#### Last Deployment
- Last successful deployment.

#### Failed Deployments
- Failed deployment count.

#### Audit Events Today
- Branding changes today.

---

### Navigation Tabs

- Overview
- Brand Config
- Theme Builder
- Domain Manager
- Communications
- PDF Customizer
- Login & Override
- Asset Library
- Deployment Timeline
- Security & Access
- API Integrations

---

### Overview

Display

- Theme Distribution
- Branding Adoption
- Build History
- Live Preview

Charts

- Theme Usage
- Branding Adoption
- Release Timeline

---

### Brand Configuration

Fields

- Platform Name
- Portal Name
- Short Name
- Company Logo (Light)
- Company Logo (Dark)
- Loader Animation
- Favicon
- Login Background
- Dashboard Background
- Email Logo
- Invoice Logo
- Manifest Logo
- Font Family
- Typography Style
- Button Radius

Actions

- Save Branding
- Reset Branding
- Preview

Validation

- Logo Required
- Supported PNG / SVG / JPG
- Max Upload Size
- Unique Platform Name

---

### Theme Builder

Display

- Theme Name
- Accent Color
- Sidebar Color
- Header Color
- Status
- Version

Actions

- Register Theme
- Clone Theme
- Publish Theme
- Delete Draft

Rules

- Only one Published theme.
- Draft editable.
- Published immutable.

---

### Domain Manager

Display

- Domain
- CNAME
- SSL Status
- DNS Status
- Health
- Redirect Rule

Actions

- Register Domain
- Renew SSL
- Delete Domain
- Verify DNS

Validation

- Valid Domain
- Unique Domain
- SSL Required

Business Rules

- Force HTTPS
- DNS verification mandatory.

---

### Communications

Sections

#### SMTP

Fields

- SMTP Host
- SMTP Port
- Username
- Password
- Encryption

#### Email Templates

Templates

- Welcome Email
- Reset Password
- Driver Invitation
- Company Invitation

Fields

- Subject
- Greeting
- HTML Content

Actions

- Save
- Send Test Email

#### SMS

Fields

- Test Number

Actions

- Send Test SMS

Validation

- Valid Email
- Valid Phone

---

### PDF Customizer

Fields

- Header Text
- Footer Text
- Watermark
- QR Code
- Logo
- Signature Box

Actions

- Save Layout
- Preview PDF

Business Rules

- QR generated automatically.
- Variables supported.
- Multi-page footer.

---

### Login & Override

Fields

- Login Greeting
- Background Image
- Illustration Type
- Help Center URL

Toggle

- Hide Vendor Branding
- Hide Documentation Links
- Hide Footer
- Hide Copyright

Actions

- Save
- Preview

---

### Asset Library

Supported Assets

- Logos
- Images
- Backgrounds
- PDFs
- Icons
- Videos

Actions

- Upload
- Replace
- Delete
- Download

Validation

- Supported Formats
- File Size Limit

---

### Deployment Timeline

Display

- Version
- Build Number
- Release Date
- Released By
- Duration
- Status

Actions

- Deploy
- Rollback
- Compare Builds
- View Diff

Business Rules

- Only Published versions deployable.
- Rollback creates audit log.

---

### Security & Access

Sections

#### MFA

Toggle

- Enabled
- Disabled

#### Session Timeout

Fields

- Minutes

#### Allowed IP

Multiple IP List

#### Secrets

Store

- Backend Secret
- Webhook Token
- API Secret

Actions

- Add Secret
- Rotate Secret
- Delete Secret

Validation

- Encrypted Storage
- Hidden Values

---

### API Integrations

Supported

- Cloudflare
- AWS S3
- SendGrid
- Twilio
- Stripe
- Firebase

Display

- Status
- Health
- Last Sync

Actions

- Test Connection
- Reconnect
- Disconnect
- Save

---

### Live Preview

Modes

- Portal
- Email
- PDF
- Login

Purpose

Real-time preview before deployment.

---

### Audit Logs

Track

- Branding Updated
- Theme Published
- Domain Added
- SSL Renewed
- SMTP Updated
- Email Template Updated
- Login Updated
- Deployment Completed
- Rollback
- Secret Rotated

Fields

- User
- Timestamp
- IP
- Browser
- Details

---

### Search

- Search Assets
- Search Domains
- Search Themes
- Search Builds

---

### Export

- CSV
- PDF
- Audit Logs

---

### Validation Rules

- Platform Name Required
- Domain Unique
- SSL Mandatory
- Theme Name Unique
- Logo Required
- SMTP Required
- Secret Encrypted
- API Keys Required

---

### Notifications

- Deployment Completed
- Deployment Failed
- SSL Expiring
- Domain Verified
- SMTP Failed
- Theme Published
- Secret Rotated

---

### APIs

GET /white-label

GET /white-label/themes

POST /white-label/theme

PUT /white-label/theme

POST /white-label/publish

GET /white-label/domains

POST /white-label/domain

PUT /white-label/domain

DELETE /white-label/domain

POST /white-label/smtp

POST /white-label/email-template

POST /white-label/pdf

POST /white-label/login

POST /white-label/assets

POST /white-label/deploy

POST /white-label/rollback

POST /white-label/security

POST /white-label/api

GET /white-label/audit

---

### Database Tables

branding_settings

branding_assets

theme_versions

custom_domains

ssl_certificates

smtp_settings

email_templates

pdf_templates

login_settings

deployment_history

security_settings

api_integrations

audit_logs

---

### Business Rules

- One active published branding version.
- Branding deployment affects all assigned tenants.
- SSL required for custom domains.
- Theme changes require deployment.
- Every deployment logged.
- Secrets encrypted.
- API keys masked.
- Preview available before publish.

---

### Security

- RBAC enforced.
- MFA supported.
- Secrets encrypted.
- IP whitelist supported.
- Audit logging mandatory.

---

### Error States

- Invalid Domain
- SSL Verification Failed
- Deployment Failed
- SMTP Connection Failed
- Asset Upload Failed
- Theme Conflict
- Permission Denied

---

### Success Messages

- Branding saved successfully.
- Theme published successfully.
- Domain verified successfully.
- SMTP updated successfully.
- PDF template saved successfully.
- Deployment completed successfully.
- Rollback completed successfully.

---

### Acceptance Criteria

- Branding configuration working.
- Theme builder working.
- Domain management working.
- SMTP working.
- Email templates working.
- PDF customization working.
- Login customization working.
- Asset library working.
- Deployment pipeline working.
- Security configuration working.
- API integrations working.
- Live preview working.
- Audit logs generated.
- Responsive UI.
- Performance under 2 seconds.


### Super Admin → Support Tickets

#### Module Purpose

- Manage all platform support tickets.
- Handle tenant issues from a centralized support desk.
- Assign tickets to support agents.
- Track SLA and response time.
- Resolve customer issues.
- Maintain complete communication history.

---

### User Role

- Super Admin
- Support Manager
- Support Agent (Limited Access)

---

### Permissions

- View Tickets
- Create Ticket
- Edit Ticket
- Assign Ticket
- Reply Ticket
- Resolve Ticket
- Reopen Ticket
- Close Ticket
- Delete Ticket
- Export Tickets

---

### Header

- Page Title : Support Tickets
- Export Report
- New Ticket

---

### KPI Cards

#### Total Tickets
- Total tickets created.

#### Open Tickets
- Tickets awaiting response.

#### Resolved Tickets
- Successfully closed tickets.

#### High Priority Tickets
- Urgent tickets.

#### Average Response Time
- Average first response.

#### Average Resolution Time
- Average ticket resolution.

#### Pending Customer Reply
- Waiting on customer.

#### Pending Internal Action
- Waiting on support staff.

---

### Search

- Ticket ID
- Company Name
- Subject
- Customer Name

---

### Filters

- Status
- Priority
- Category
- Company
- Assigned Agent
- Created Date
- Updated Date

---

### Export

- CSV
- Excel
- PDF

---

### Ticket Queue

Columns

- Ticket ID
- Company
- Subject
- Category
- Priority
- Status
- Assigned Agent
- Created Date
- Last Updated
- Actions

---

### Ticket Status

- New
- Open
- Assigned
- In Progress
- Waiting Customer
- Waiting Internal
- Resolved
- Closed
- Reopened

---

### Ticket Priority

- Low
- Medium
- High
- Critical

---

### Ticket Categories

- General Platform
- Billing
- Subscription
- Login
- User Management
- Dispatch
- Loads
- Fleet
- Drivers
- GPS
- AI
- API
- White Label
- Integrations
- Security
- Other

---

### Actions

- View
- Reply
- Assign
- Resolve
- Reopen
- Close
- Delete

---

### Create Ticket

Fields

- Company
- Category
- Priority
- Subject
- Description
- Attachment

Buttons

- Create Ticket
- Cancel

Validation

- Company Required
- Category Required
- Priority Required
- Subject Required
- Description Required

---

### Ticket Details

Display

- Ticket Number
- Company
- Customer
- Email
- Phone
- Subject
- Description
- Category
- Priority
- Status
- Assigned Agent
- Created Date
- Last Updated
- Attachments

---

### Conversation Timeline

Display

- Customer Message
- Support Reply
- Internal Notes
- Attachments
- Timestamp
- Sender

Actions

- Reply
- Edit Reply
- Delete Reply

---

### Ticket Assignment

Fields

- Ticket
- Support Agent
- Support Level

Support Levels

- L1 Support
- L2 Senior Specialist
- L3 Engineering
- Platform Administrator

Actions

- Assign
- Reassign

Business Rules

- Only one primary assignee.
- Reassignment logged.

---

### Ticket Response

Fields

- Reply Message
- Attachment

Actions

- Send Reply
- Save Draft

Validation

- Reply Required

---

### Resolve Ticket

Fields

- Resolution Notes

Actions

- Mark Resolved

Business Rules

- Customer notified automatically.
- Resolution logged.

---

### Close Ticket

Business Rules

- Only resolved tickets can close.
- Closed tickets become read-only.

---

### Reopen Ticket

Business Rules

- Only closed tickets.
- SLA restarts.
- Customer notified.

---

### Attachments

Supported

- PDF
- DOCX
- XLSX
- JPG
- PNG
- ZIP

Max Size

- 25 MB

Actions

- Upload
- Download
- Delete

---

### Internal Notes

Purpose

Support-only comments.

Visible To

- Super Admin
- Support Team

Not Visible To

- Customer

---

### SLA Management

Display

- SLA Target
- Remaining Time
- Breached
- Resolution Time

Rules

- High Priority = 4 Hours
- Medium = 8 Hours
- Low = 24 Hours

---

### Notifications

Customer

- Ticket Created
- Ticket Assigned
- Ticket Replied
- Ticket Resolved
- Ticket Closed

Support

- New Ticket
- Ticket Escalated
- SLA Warning
- Ticket Reopened

---

### Dashboard Widgets

- Open Tickets
- Today's Tickets
- SLA Breaches
- Tickets by Priority
- Tickets by Category
- Agent Workload
- Resolution Trend

---

### Reports

- Daily Ticket Report
- Monthly Ticket Report
- Agent Performance
- SLA Report
- Resolution Report
- Customer Satisfaction Report

---

### Audit Logs

Track

- Ticket Created
- Ticket Updated
- Ticket Assigned
- Ticket Reassigned
- Reply Added
- Reply Edited
- Ticket Resolved
- Ticket Closed
- Ticket Reopened
- Attachment Uploaded

Fields

- User
- Timestamp
- IP Address
- Browser
- Action
- Details

---

### Validation Rules

- Subject Required
- Description Required
- Valid Company
- Valid Category
- Valid Priority
- Attachment Size Limit
- Attachment Format Validation

---

### APIs

GET /support/tickets

GET /support/tickets/{id}

POST /support/tickets

PUT /support/tickets/{id}

DELETE /support/tickets/{id}

POST /support/tickets/reply

POST /support/tickets/assign

POST /support/tickets/resolve

POST /support/tickets/reopen

POST /support/tickets/close

POST /support/tickets/upload

GET /support/reports

GET /support/audit

---

### Database Tables

support_tickets

ticket_messages

ticket_assignments

ticket_attachments

ticket_categories

ticket_priorities

ticket_status

support_agents

sla_rules

ticket_audit_logs

notifications

companies

users

---

### Business Rules

- Ticket number auto-generated.
- SLA starts on ticket creation.
- Assignment required before resolution.
- Every action creates audit log.
- Closed tickets cannot be edited.
- Internal notes hidden from customer.
- Attachments virus scanned.
- Email notifications automatic.

---

### Security

- RBAC enabled.
- MFA supported.
- Attachment virus scanning.
- Audit logging mandatory.
- IP tracking enabled.

---

### Error States

- Ticket Not Found
- Invalid Company
- Invalid Attachment
- SLA Configuration Missing
- Permission Denied
- Internal Server Error

---

### Success Messages

- Ticket created successfully.
- Ticket assigned successfully.
- Reply sent successfully.
- Ticket resolved successfully.
- Ticket closed successfully.
- Ticket reopened successfully.

---

### Acceptance Criteria

- Ticket CRUD working.
- Search working.
- Filters working.
- Assignment working.
- Reply system working.
- Resolution workflow working.
- SLA tracking working.
- Notifications working.
- Reports working.
- Audit logs working.
- Responsive UI.
- Performance under 2 seconds.


### Super Admin → Billing

#### Module Purpose

- Centralized platform billing management.
- Monitor all invoices and payments.
- Track Monthly Recurring Revenue (MRR).
- Track Annual Recurring Revenue (ARR).
- Manage failed payments and unpaid invoices.
- Generate invoices, receipts, tax reports, and billing analytics.

---

### User Role

- Super Admin
- Finance Admin (Read/Manage)
- Accounts Manager (Limited)

---

### Permissions

- View Billing Dashboard
- View Invoices
- Generate Invoice
- Regenerate Invoice
- Download Invoice
- Send Invoice
- View Payments
- View Failed Payments
- View Tax Reports
- Export Billing Reports
- Manage Payment Status
- Manage Refunds

---

### Header

- Page Title : Billing
- Export Report

---

### KPI Cards

#### Total Revenue
- Total revenue collected across all companies.

#### Monthly MRR
- Current Monthly Recurring Revenue.

#### Annual ARR
- Annual projected revenue.

#### Paid Invoices
- Successfully paid invoices.

#### Unpaid Invoices
- Outstanding invoices.

#### Failed Payments
- Failed payment attempts.

#### Refunds Issued
- Completed refunds.

#### Average Invoice Value
- Average invoice amount.

---

### Tabs

- Invoices
- Payments
- Failed Payments
- Tax / GST Summary

---

### Revenue Analytics

Charts

#### Monthly Revenue Trend
- Line Chart

#### Revenue by Plan
- Bar Chart

#### Payment Status
- Pie Chart

#### Monthly Collections
- Area Chart

---

### Search

- Invoice Number
- Company Name
- Transaction ID

---

### Filters

- Invoice Status
- Company
- Plan
- Payment Method
- Date Range
- Currency

---

### Export

- PDF Report
- CSV Export
- Excel Export
- Tax Report

---

### Invoice Registry

Columns

- Invoice Number
- Company
- Plan
- Billing Period
- Issue Date
- Due Date
- Payment Status
- Payment Method
- Amount
- Tax
- Total
- Actions

---

### Invoice Status

- Draft
- Sent
- Paid
- Unpaid
- Overdue
- Cancelled
- Refunded

---

### Invoice Actions

- View
- Download PDF
- Send Email
- Regenerate
- Mark Paid
- Cancel
- Refund

---

### Invoice Details

Display

- Invoice Number
- Company
- Plan
- Billing Period
- Issue Date
- Due Date
- Currency
- Payment Method
- Base Amount
- Tax Amount
- Discount
- Total Amount
- Status

Buttons

- Download PDF
- Email Invoice
- Print
- Regenerate Invoice

---

### Invoice Line Items

Display

- Subscription Fee
- Add-on Charges
- API Usage
- Storage Overage
- Driver Overage
- User Overage
- Discounts
- Coupons
- Tax

---

### Payment Registry

Columns

- Payment ID
- Invoice
- Company
- Gateway
- Method
- Amount
- Transaction ID
- Status
- Date

Actions

- View
- Refund
- Retry

---

### Payment Status

- Pending
- Processing
- Paid
- Failed
- Refunded
- Cancelled

---

### Failed Payments

Display

- Invoice
- Company
- Gateway
- Error
- Failed Time
- Retry Count

Actions

- Retry Payment
- Notify Company
- Change Payment Method

Business Rules

- Maximum Retry = 3
- Notify after every failed attempt.

---

### Tax / GST Summary

Display

- Invoice
- Company
- Base Amount
- GST %
- GST Amount
- Total Amount

Reports

- GST Report
- VAT Report
- Tax Summary
- Monthly Tax Collection

---

### Payment Methods

Supported

- Stripe
- PayPal
- ACH
- Wire Transfer
- Manual Invoice

Display

- Gateway Status
- Last Transaction
- Health

Actions

- Configure
- Test
- Disable

---

### Refund Management

Fields

- Invoice
- Refund Amount
- Refund Reason

Actions

- Issue Refund

Business Rules

- Refund <= Paid Amount
- Audit Required

---

### Billing Reports

Reports

- Revenue Report
- Invoice Report
- Payment Report
- Failed Payment Report
- Tax Report
- Refund Report
- Company Billing Report
- Subscription Revenue Report

---

### Notifications

Customer

- Invoice Generated
- Invoice Sent
- Payment Received
- Payment Failed
- Invoice Overdue
- Refund Processed

Finance Team

- Failed Payment
- High Value Invoice
- Refund Issued
- Gateway Error

---

### Dashboard Widgets

- Revenue Today
- Revenue This Month
- Outstanding Balance
- Failed Payments
- Recent Transactions
- Top Paying Companies

---

### Audit Logs

Track

- Invoice Generated
- Invoice Updated
- Invoice Regenerated
- Invoice Deleted
- Payment Received
- Payment Failed
- Refund Issued
- Tax Exported
- Report Generated

Fields

- User
- Timestamp
- IP Address
- Browser
- Action
- Details

---

### Validation Rules

- Company Required
- Plan Required
- Amount > 0
- Due Date Required
- Currency Required
- Payment Method Required
- Tax Percentage Valid

---

### APIs

GET /billing/dashboard

GET /billing/invoices

GET /billing/invoices/{id}

POST /billing/invoices

PUT /billing/invoices/{id}

DELETE /billing/invoices/{id}

POST /billing/invoices/regenerate

POST /billing/invoices/send

POST /billing/invoices/download

GET /billing/payments

POST /billing/payments/retry

POST /billing/payments/refund

GET /billing/failed-payments

GET /billing/tax

GET /billing/reports

GET /billing/audit

---

### Database Tables

billing

invoices

invoice_items

payments

payment_transactions

refunds

tax_records

payment_gateways

billing_reports

audit_logs

companies

subscriptions

---

### Business Rules

- Every subscription generates an invoice.
- Invoice number auto-generated.
- Tax calculated automatically.
- Failed payment retries maximum 3.
- Refunds require completed payment.
- Every billing action creates audit log.
- Revenue updates dashboard automatically.
- Overdue invoices generate reminders.

---

### Security

- RBAC enabled.
- Finance permissions required.
- Payment data encrypted.
- PCI compliance.
- Audit logging mandatory.

---

### Error States

- Invoice Not Found
- Payment Failed
- Invalid Gateway
- Refund Failed
- Tax Calculation Error
- Permission Denied
- Internal Server Error

---

### Success Messages

- Invoice generated successfully.
- Invoice regenerated successfully.
- Payment received successfully.
- Refund issued successfully.
- Report exported successfully.
- Tax report generated successfully.

---

### Acceptance Criteria

- Invoice CRUD working.
- Payment registry working.
- Failed payment handling working.
- Refund workflow working.
- Tax summary working.
- Revenue analytics working.
- Reports export working.
- Audit logs generated.
- Notifications working.
- Responsive UI.
- Performance under 2 seconds.

---


### Super Admin → System Analytics

#### Module Purpose

- Monitor overall SaaS platform performance.
- Analyze tenant growth and platform revenue.
- Track API usage, storage, active users, and system health.
- Provide operational insights for business decisions.
- Generate analytics reports for management.

---

### User Role

- Super Admin

---

### Permissions

- View Analytics Dashboard
- View Revenue Analytics
- View Company Analytics
- View User Analytics
- View API Analytics
- View Storage Analytics
- Export Reports
- Download Charts
- View Audit Logs

---

### Header

- Page Title : System Analytics
- Export Report

---

### KPI Cards

#### Platform Revenue
- Annual Recurring Revenue (ARR)

#### Monthly Recurring Revenue (MRR)
- Monthly revenue growth

#### Company Growth
- Total Companies
- Monthly New Companies

#### Active Users
- Total Active Users

#### API Requests
- Requests Per Minute (RPM)

#### Storage Used
- Current Storage Consumption

#### Login Events
- Monthly Login Count

#### SLA Score
- Platform Uptime
- Availability %

---

### Analytics Sections

#### Revenue Analytics

Charts

- Monthly Revenue Trend
- Annual Revenue Trend
- Revenue by Subscription Plan
- Revenue by Company

Metrics

- MRR
- ARR
- Average Revenue Per Tenant (ARPT)
- Average Revenue Per User (ARPU)
- Customer Lifetime Value (CLV)
- Churn Revenue

---

#### Company Analytics

Charts

- Monthly Company Growth
- Active vs Suspended Companies
- Trial vs Paid Companies

Metrics

- Total Companies
- New Companies
- Active Companies
- Suspended Companies
- Trial Companies
- Converted Companies

---

#### User Analytics

Display

- Active Users
- New Users
- User Growth
- Login Frequency
- Role Distribution

Charts

- User Growth Timeline
- Users by Role
- Users by Company

---

#### Module Usage Analytics

Display

- Dispatch Module Usage
- GPS Usage
- Driver Module Usage
- Fleet Module Usage
- Warehouse Module Usage
- Accounts Module Usage
- AI Module Usage
- Customer Portal Usage

Charts

- Top Used Modules
- Least Used Modules
- Module Adoption %

---

#### API Usage Analytics

Display

- Requests Per Minute
- Requests Per Hour
- Daily API Requests
- Failed Requests
- Success Rate
- Average Response Time

Charts

- API Timeline
- API Error Rate
- Endpoint Usage
- Peak Hours

---

#### Storage Analytics

Display

- Total Storage
- Used Storage
- Remaining Storage
- Company Storage Usage

Charts

- Storage Growth
- Storage by Company
- Storage by Module

Alerts

- High Usage Warning
- Limit Reached

---

#### Login Analytics

Display

- Total Logins
- Last Login
- Login Success
- Failed Login

Charts

- Daily Login Trend
- Login by Company
- Login by Country
- Login by Device

---

#### Performance Analytics

Display

- CPU Usage
- Memory Usage
- Queue Health
- Database Health
- Cache Usage
- Background Jobs

Charts

- CPU Timeline
- Memory Timeline
- Queue Processing

---

#### SLA Analytics

Display

- Uptime %
- Downtime
- Average Response Time
- Average Resolution Time

Charts

- SLA Trend
- Incident Trend

---

#### AI Analytics

Display

- AI Requests
- AI Success Rate
- AI Failures
- AI Processing Time
- AI Storage

Charts

- AI Usage
- AI Model Usage
- AI Failure Rate

---

### Dashboard Widgets

- Revenue Today
- Revenue This Month
- Top Companies
- Active Sessions
- Online Users
- API Health
- Database Health
- Queue Status
- Storage Health

---

### Search

- Company Name
- User Name
- Module Name

---

### Filters

- Date Range
- Company
- Subscription Plan
- Module
- Country
- Status

---

### Export

- CSV
- Excel
- PDF
- PNG Charts

---

### Reports

- Revenue Report
- Company Growth Report
- User Activity Report
- Storage Report
- API Report
- SLA Report
- Login Report
- AI Usage Report
- Executive Summary Report

---

### Notifications

- Revenue Target Achieved
- Storage Warning
- High API Usage
- SLA Breach
- Company Growth Milestone
- Login Spike
- AI Failure Alert

---

### Audit Logs

Track

- Analytics Viewed
- Report Exported
- Dashboard Filter Applied
- Chart Downloaded

Fields

- User
- Timestamp
- IP Address
- Browser
- Action
- Details

---

### Validation Rules

- Date Range Required
- Company Exists
- Module Exists
- Export Format Valid

---

### APIs

GET /analytics/dashboard

GET /analytics/revenue

GET /analytics/companies

GET /analytics/users

GET /analytics/modules

GET /analytics/api

GET /analytics/storage

GET /analytics/login

GET /analytics/sla

GET /analytics/ai

GET /analytics/reports

GET /analytics/export

GET /analytics/audit

---

### Database Tables

analytics_reports

analytics_cache

company_statistics

user_statistics

module_statistics

api_statistics

storage_statistics

login_statistics

sla_statistics

ai_statistics

audit_logs

---

### Business Rules

- Dashboard refresh every 60 seconds.
- Charts update in real time.
- Reports generated based on selected filters.
- Storage calculated from all tenants.
- API metrics aggregated platform-wide.
- Analytics visible only to authorized users.
- Every export creates an audit log.

---

### Security

- RBAC Enabled
- Super Admin Only
- Audit Logging Mandatory
- Export Permissions Required
- Data Encryption Enabled

---

### Error States

- Analytics Data Not Available
- Report Generation Failed
- Export Failed
- API Timeout
- Permission Denied
- Internal Server Error

---

### Success Messages

- Report generated successfully.
- Analytics exported successfully.
- Dashboard refreshed successfully.
- Chart downloaded successfully.

---

### Acceptance Criteria

- Revenue analytics working.
- Company analytics working.
- User analytics working.
- Module analytics working.
- API analytics working.
- Storage analytics working.
- Login analytics working.
- SLA analytics working.
- AI analytics working.
- Reports export working.
- Audit logs generated.
- Responsive UI.
- Performance under 2 seconds.

---


### Super Admin → Inter-Company Transfers

#### Module Purpose

- Manage asset, vehicle, load, inventory, and equipment transfers between tenant companies.
- Provide approval workflow for transfers.
- Maintain complete audit history.
- Validate transfer permissions and business rules.
- Track transfer lifecycle from request to completion.

---

### User Role

- Super Admin
- Company Admin (Limited)
- Dispatcher (View Only)

---

### Permissions

- View Transfers
- Create Transfer
- Edit Transfer
- Approve Transfer
- Reject Transfer
- Cancel Transfer
- Complete Transfer
- View Audit Trail
- Configure Company Permissions
- Export Reports

---

### Header

- Page Title : Inter-Company Transfers
- Export Report

---

### KPI Cards

#### Total Transfers

Display total transfer requests.

---

#### Completed Transfers

Successfully completed transfers.

---

#### In Transit

Transfers currently moving.

---

#### Pending Approval

Awaiting Super Admin approval.

---

#### Rejected Transfers

Rejected requests.

---

#### Cancelled Transfers

Cancelled transfers.

---

#### Transfer Value

Total asset value transferred.

---

#### Active Companies

Companies participating in transfers.

---

### Search

- Transfer ID
- Asset Name
- VIN Number
- Load Number
- Source Company
- Destination Company

---

### Filters

- Status
- Asset Type
- Company
- Date Range
- Approval Status

---

### Export

- CSV
- Excel
- PDF

---

### Transfer Registry

Columns

- Transfer ID
- Asset Name
- Asset Type
- Source Company
- Destination Company
- Requested By
- Request Date
- Status
- Approval Status
- Actions

---

### Supported Transfer Types

- Vehicle
- Trailer
- Driver
- Load
- Warehouse Inventory
- Reefer Container
- Equipment
- Documents
- Customer Account
- Fleet Asset

---

### Transfer Status

- Draft
- Pending Approval
- Approved
- Rejected
- In Transit
- Completed
- Cancelled

---

### Actions

- View
- Approve
- Reject
- Cancel
- Complete
- Audit Trail

---

### Create Transfer

Fields

- Transfer Type
- Asset
- Source Company
- Destination Company
- Requested By
- Reason
- Expected Transfer Date
- Notes
- Attachments

Buttons

- Save Draft
- Submit Request
- Cancel

Validation

- Asset Required
- Source Company Required
- Destination Company Required
- Transfer Date Required

---

### Transfer Details

Display

- Transfer ID
- Asset Details
- Source Company
- Destination Company
- Status
- Approval Status
- Requested By
- Approved By
- Created Date
- Last Updated

---

### Approval Workflow

Step 1

Transfer Created

↓

Step 2

Pending Approval

↓

Step 3

Super Admin Review

↓

Step 4

Approve / Reject

↓

Step 5

Transfer Execution

↓

Step 6

Completed

---

### Approve Transfer

Fields

- Approval Notes

Actions

- Approve
- Cancel

Business Rules

- Verify permissions.
- Verify destination company.
- Generate audit log.
- Notify both companies.

---

### Reject Transfer

Fields

- Rejection Reason

Actions

- Reject

Business Rules

- Mandatory rejection reason.
- Notify requester.
- Generate audit log.

---

### Complete Transfer

Fields

- Completion Notes

Actions

- Mark Completed

Business Rules

- Asset ownership updated.
- Company inventory updated.
- Audit log generated.

---

### Transfer Permissions Matrix

Display

Columns

- Company
- Can Send
- Can Receive
- Auto Approval
- Approval Required

Actions

- Enable
- Disable
- Edit

Business Rules

- Auto Approval only for trusted companies.
- Approval Required by default.

---

### Transfer Audit Trail

Display

- Created
- Approved
- Rejected
- In Transit
- Completed

Each Event Contains

- Timestamp
- User
- Action
- Details
- IP Address

---

### Notifications

Requester

- Transfer Submitted
- Transfer Approved
- Transfer Rejected
- Transfer Completed

Destination Company

- Incoming Transfer
- Transfer Accepted

Super Admin

- Approval Required
- High Value Transfer
- Failed Transfer

---

### Reports

- Transfer Summary
- Company Transfer Report
- Asset Transfer Report
- Pending Approval Report
- Completed Transfer Report

---

### Dashboard Widgets

- Pending Transfers
- Today's Transfers
- Completed Transfers
- Top Transfer Companies
- Transfer Value
- Approval Queue

---

### Validation Rules

- Source Company Exists
- Destination Company Exists
- Asset Exists
- Asset Available
- Transfer Date Valid
- Duplicate Transfer Prevention

---

### APIs

GET /transfers

GET /transfers/{id}

POST /transfers

PUT /transfers/{id}

DELETE /transfers/{id}

POST /transfers/approve

POST /transfers/reject

POST /transfers/complete

GET /transfers/audit

GET /transfers/reports

GET /transfers/permissions

PUT /transfers/permissions

---

### Database Tables

company_transfers

transfer_assets

transfer_history

transfer_permissions

transfer_attachments

transfer_notes

companies

vehicles

loads

drivers

warehouse_inventory

audit_logs

notifications

---

### Business Rules

- Source company must own asset.
- Destination company must be active.
- Suspended companies cannot transfer.
- Every approval generates audit log.
- Ownership changes only after completion.
- Duplicate active transfers not allowed.
- High value transfers require approval.
- Auto Approval only for approved companies.

---

### Security

- RBAC Enabled
- Audit Logging Mandatory
- Approval Authorization Required
- IP Tracking Enabled
- MFA Supported

---

### Error States

- Transfer Not Found
- Asset Not Available
- Company Not Found
- Approval Failed
- Duplicate Transfer
- Permission Denied
- Internal Server Error

---

### Success Messages

- Transfer created successfully.
- Transfer approved successfully.
- Transfer rejected successfully.
- Transfer completed successfully.
- Permission updated successfully.

---

### Acceptance Criteria

- Transfer CRUD working.
- Approval workflow working.
- Permission matrix working.
- Audit trail working.
- Notifications working.
- Reports working.
- Search working.
- Filters working.
- Export working.
- Responsive UI.
- Performance under 2 seconds.

---


### Super Admin → AI Controls

#### Module Purpose

- Centrally manage all Artificial Intelligence features across the SaaS platform.
- Enable or disable AI modules globally.
- Configure AI models, confidence thresholds, and processing limits.
- Monitor AI requests, latency, failures, and resource consumption.
- Track AI activity logs and system health.
- Control AI licensing and feature availability.

---

### User Role

- Super Admin

---

### Permissions

- View AI Dashboard
- Enable AI Features
- Disable AI Features
- Configure AI Models
- Configure AI Thresholds
- Configure API Limits
- View AI Analytics
- View AI Activity Logs
- Export AI Reports

---

### Header

- Page Title : AI Controls
- Export Report

---

### KPI Cards

#### AI Features Active

- Total enabled AI modules.

---

#### AI Requests Today

- Total AI inference requests processed.

---

#### Average Latency

- Average model response time.

---

#### Success Rate

- AI request success percentage.

---

#### Failed Requests

- Failed AI processing jobs.

---

#### AI Storage

- Storage consumed by AI models, embeddings, OCR data, and artifacts.

---

#### AI Queue Size

- Pending AI jobs waiting for execution.

---

#### Model Health

- Current operational status of AI services.

---

### AI Feature Management

Available Features

- Load Parse AI
- Receipt OCR
- Odometer Detection
- Smart Dispatch
- ETA Prediction
- Chat Assistant
- Route Optimization
- AI Load Builder
- Invoice OCR
- POD Recognition
- Driver Risk Detection
- Fuel Prediction
- Predictive Maintenance
- AI Chat Support

Display

- Feature Name
- Description
- Status
- Version
- Requests Today
- Success Rate

Actions

- Enable
- Disable
- Configure

---

### AI Model Configuration

Display

- Model Name
- Model Version
- Provider
- Status

Supported Providers

- OpenAI
- Azure OpenAI
- Anthropic
- Google Gemini
- AWS Bedrock
- Local LLM

Actions

- Change Model
- Update Version
- Test Model
- Rollback Model

---

### Confidence Threshold Settings

Fields

- Load Parse Confidence
- OCR Confidence
- Odometer Detection Confidence
- ETA Prediction Confidence
- Dispatch Confidence
- Invoice OCR Confidence

Validation

- Minimum 0%
- Maximum 100%

Actions

- Save Configuration
- Reset Default

---

### Daily Processing Limits

Fields

- AI API Calls Per Day
- OCR Requests Per Day
- Chat Requests Per Day
- Route Optimization Jobs
- AI Load Builder Jobs
- Maximum Concurrent AI Jobs

Business Rules

- Requests above limit are queued.
- Admin notification on threshold breach.

---

### AI Queue Monitoring

Display

- Queue Size
- Running Jobs
- Failed Jobs
- Waiting Jobs
- Completed Jobs

Actions

- Retry Job
- Cancel Job
- View Details

---

### AI Activity Logs

Display

- Feature Name
- Event
- Company
- User
- Status
- Timestamp

Examples

- Load Parse Completed
- OCR Scan Finished
- Smart Dispatch Executed
- AI Load Builder Generated
- ETA Prediction Completed
- AI Chat Session Started

Actions

- View Details
- Retry
- Export

---

### AI Usage Analytics

Charts

#### Requests by Feature

- Load Parse
- OCR
- Smart Dispatch
- ETA Prediction
- AI Chat
- AI Load Builder

---

#### Daily AI Requests

Line Chart

---

#### Success vs Failed Requests

Pie Chart

---

#### Average Response Time

Bar Chart

---

#### AI Resource Consumption

Charts

- CPU Usage
- GPU Usage
- RAM Usage
- Storage Usage

---

### AI Health Monitoring

Display

- AI Service Status
- Queue Health
- API Availability
- Model Availability
- Embedding Service Status
- OCR Service Status

Health Status

- Healthy
- Warning
- Critical
- Offline

---

### AI Licensing

Display

Which subscription plans can access

- Starter
- Professional
- Enterprise
- Custom Enterprise

Actions

- Enable for Plan
- Disable for Plan

---

### AI Cost Monitoring

Display

- Total AI Cost
- Monthly AI Cost
- Cost Per Company
- Cost Per Request
- Token Consumption
- OCR Pages Processed

Charts

- Monthly AI Spend
- Cost by Company
- Cost by Feature

---

### Search

- AI Feature
- Company
- User
- Job ID

---

### Filters

- Feature
- Status
- Company
- Date
- Model
- Provider

---

### Export

- CSV
- Excel
- PDF

---

### Notifications

Super Admin

- AI Service Down
- Queue Overflow
- Daily Limit Reached
- Model Failure
- High Latency
- High AI Cost

Company Admin

- AI Limit Reached
- AI Job Failed

---

### Audit Logs

Track

- Feature Enabled
- Feature Disabled
- Model Changed
- Threshold Updated
- API Limit Changed
- AI Job Retried
- AI Job Cancelled
- Configuration Updated

Fields

- User
- Timestamp
- IP Address
- Browser
- Action
- Old Value
- New Value

---

### Validation Rules

- Confidence 0–100
- API Limit > 0
- Valid AI Provider
- Valid Model Version
- Feature Exists

---

### APIs

GET /ai/dashboard

GET /ai/features

PUT /ai/features/{id}

GET /ai/models

PUT /ai/models/{id}

POST /ai/test-model

GET /ai/jobs

POST /ai/jobs/retry

POST /ai/jobs/cancel

GET /ai/activity

GET /ai/analytics

GET /ai/cost

GET /ai/health

GET /ai/licensing

PUT /ai/licensing

GET /ai/audit

---

### Database Tables

ai_features

ai_models

ai_model_versions

ai_jobs

ai_job_queue

ai_activity_logs

ai_usage_statistics

ai_cost_reports

ai_configuration

ai_thresholds

ai_limits

ai_health_status

audit_logs

notifications

---

### Business Rules

- AI features can be enabled or disabled globally.
- AI processing follows subscription licensing.
- Queue processes jobs FIFO unless priority is assigned.
- Failed jobs may be retried up to three times.
- Configuration changes require audit logs.
- AI costs calculated per request and provider.
- Usage analytics update in real time.
- Model rollback available only for published versions.

---

### Security

- RBAC Enabled
- Super Admin Access
- API Keys Encrypted
- Audit Logging Mandatory
- IP Tracking Enabled
- MFA Supported

---

### Error States

- AI Service Offline
- Invalid Model
- Provider Not Available
- Queue Full
- API Limit Exceeded
- Permission Denied
- Internal Server Error

---

### Success Messages

- AI feature enabled successfully.
- AI feature disabled successfully.
- Configuration updated successfully.
- Model changed successfully.
- AI job retried successfully.
- AI limits updated successfully.

---

### Acceptance Criteria

- AI dashboard working.
- Feature enable/disable working.
- Model configuration working.
- Threshold configuration working.
- Queue monitoring working.
- AI analytics working.
- Cost monitoring working.
- Licensing working.
- Audit logs generated.
- Notifications working.
- Export working.
- Responsive UI.
- Performance under 2 seconds.

---

### Super Admin → User Management

#### Module Purpose

- Centralized management of all platform users.
- Create, update, suspend, and delete users.
- Assign users to companies and roles.
- Control user access across the SaaS platform.
- Monitor user activity and login history.
- Support impersonation ("Login As") for troubleshooting.

---

### User Role

- Super Admin

---

### Permissions

- View Users
- Create User
- Edit User
- Delete User
- Suspend User
- Activate User
- Reset Password
- Login As User
- Assign Role
- Assign Company
- Export Users
- View Audit Logs

---

### Header

- Page Title : User Management
- Add New User
- Export Users

---

### KPI Cards

#### Total Users

Display total registered users.

---

#### Active Users

Users with Active status.

---

#### Pending Users

Users waiting for activation.

---

#### Suspended Users

Disabled users.

---

#### Super Admins

Total Super Admin accounts.

---

#### Company Admins

Total Company Admin accounts.

---

#### Dispatchers

Total Dispatcher accounts.

---

#### Drivers

Total Driver accounts.

---

#### Warehouse Managers

Total Warehouse Manager accounts.

---

#### Customers

Total Customer accounts.

---

### Search

- User Name
- Email
- User ID
- Company
- Role

---

### Filters

- Status
- Role
- Company
- Created Date
- Last Login

---

### Export

- CSV
- Excel
- PDF

---

### User List

Columns

- Avatar
- Full Name
- User ID
- Email
- Phone
- Company
- Role
- Status
- Last Login
- Created Date
- Actions

---

### User Status

- Active
- Pending
- Suspended
- Locked
- Deleted

---

### Actions

- View
- Edit
- Login As
- Suspend
- Activate
- Reset Password
- Delete

---

### Add New User

Fields

- Full Name
- Email
- Phone
- Password
- Confirm Password
- Status
- Role
- Company

Buttons

- Add User
- Cancel

Validation

- Name Required
- Email Required
- Email Unique
- Password Required
- Password Minimum 8 Characters
- Role Required
- Company Required

---

### Edit User

Editable Fields

- Name
- Email
- Phone
- Status
- Role
- Company

Read Only

- User ID
- Created Date

Actions

- Save
- Cancel

---

### Delete User

Confirmation

Display

- User Name
- User ID
- Role

Buttons

- Cancel
- Delete

Business Rules

- Super Admin cannot delete own account.
- System Root account cannot be deleted.
- Deleted users remain in audit history.

---

### Suspend User

Business Rules

- Login disabled immediately.
- Existing sessions terminated.
- Audit log generated.
- Notification sent.

---

### Activate User

Business Rules

- Login restored.
- Previous permissions restored.
- Audit log generated.

---

### Reset Password

Fields

- New Password
- Confirm Password

Actions

- Reset Password
- Send Password Email

Validation

- Minimum 8 Characters
- Strong Password Required

---

### Login As User

Purpose

Allow Super Admin to troubleshoot user issues.

Business Rules

- Login session recorded.
- User notified (optional).
- Audit log generated.
- Auto logout after timeout.

---

### User Profile

Display

- Avatar
- Name
- Email
- Phone
- Company
- Role
- Status
- Last Login
- Login Count
- MFA Status
- Created Date

---

### User Activity

Display

- Login History
- IP Address
- Browser
- Device
- Location
- Failed Login Attempts
- Password Changes

---

### Bulk Actions

Supported

- Activate
- Suspend
- Delete
- Change Role
- Change Company
- Export

---

### Notifications

User

- Welcome Email
- Password Reset
- Account Activated
- Account Suspended
- Role Changed

Super Admin

- New User Created
- Failed Login
- User Locked

---

### Dashboard Widgets

- Active Users
- Online Users
- New Users Today
- Failed Logins
- Suspended Users
- User Growth

---

### Audit Logs

Track

- User Created
- User Updated
- User Deleted
- User Suspended
- User Activated
- Password Reset
- Login As
- Role Changed
- Company Changed

Fields

- User
- Operator
- Timestamp
- IP Address
- Browser
- Old Value
- New Value

---

### Validation Rules

- Email Unique
- Phone Format
- Password Complexity
- Company Exists
- Role Exists

---

### APIs

GET /users

GET /users/{id}

POST /users

PUT /users/{id}

DELETE /users/{id}

POST /users/suspend

POST /users/activate

POST /users/reset-password

POST /users/login-as

GET /users/activity

GET /users/audit

POST /users/bulk-action

---

### Database Tables

users

user_profiles

user_roles

companies

user_sessions

password_resets

login_history

failed_logins

audit_logs

notifications

---

### Business Rules

- Email must be unique.
- One primary role per user.
- One company assignment per user.
- Login As always generates audit logs.
- Password encrypted using bcrypt/argon2.
- Deleted users cannot log in.
- Suspended users lose active sessions immediately.
- System Root account is protected.

---

### Security

- RBAC Enabled
- MFA Supported
- Password Encryption
- JWT Authentication
- Session Timeout
- IP Tracking
- Device Tracking
- Audit Logging Mandatory

---

### Error States

- User Not Found
- Duplicate Email
- Invalid Company
- Invalid Role
- Password Validation Failed
- Permission Denied
- Internal Server Error

---

### Success Messages

- User created successfully.
- User updated successfully.
- User suspended successfully.
- User activated successfully.
- Password reset successfully.
- User deleted successfully.
- Login session started successfully.

---

### Acceptance Criteria

- User CRUD working.
- Search working.
- Filters working.
- Bulk actions working.
- Login As working.
- Password reset working.
- User activity working.
- Audit logs working.
- Notifications working.
- Export working.
- Responsive UI.
- Performance under 2 seconds.

---



### Super Admin → Roles & Permissions

#### Module Purpose

- Manage all system roles and permission policies.
- Create custom roles.
- Assign permissions to platform modules.
- Control access using Role-Based Access Control (RBAC).
- Manage permission inheritance.
- Maintain complete permission audit history.

---

### User Role

- Super Admin

---

### Permissions

- View Roles
- Create Role
- Edit Role
- Delete Role
- Clone Role
- Assign Permissions
- Assign Users
- Export Roles
- View Audit Logs

---

### Header

- Page Title : Roles & Permissions
- Create Role Button
- Export Roles

---

### KPI Cards

#### Total Roles

Display total system roles.

---

#### System Roles

Built-in platform roles.

---

#### Custom Roles

Roles created by administrators.

---

#### Active Permissions

Total enabled permissions.

---

#### Assigned Users

Users assigned to roles.

---

#### Recently Updated

Roles modified recently.

---

#### Permission Groups

Total permission modules.

---

#### Audit Events

Permission-related changes today.

---

### Search

- Role Name
- Permission Name
- User Name

---

### Filters

- Role Type
- Status
- Module
- Created By
- Updated Date

---

### Export

- CSV
- Excel
- PDF

---

### Roles Table

Columns

- Role Name
- Description
- Total Permissions
- Assigned Users
- Status
- Created By
- Last Updated
- Actions

---

### Default System Roles

- Super Admin
- Company Admin
- Dispatcher
- Driver
- Warehouse Manager
- Accounts Manager
- Yard Attendant
- Sales Representative
- Customer

---

### Role Status

- Active
- Disabled
- Archived

---

### Actions

- View
- Edit
- Clone
- Delete
- Assign Users
- View Permissions

---

### Create Role

Fields

- Role Name
- Description
- Status

Permission Matrix

Modules

- Dashboard & Analytics
- User Management
- Roles & Permissions
- Companies & Tenants
- Loads & Dispatch
- Fleet & Vehicles
- Drivers & Roster
- Warehouse & Stock
- Yard Management
- Billing & Invoices
- Inter-Company Transfers
- AI Controls
- Support Tickets
- White Label
- System Settings

Permission Types

- View
- Create
- Edit
- Delete
- Approve
- Export
- Manage

Buttons

- Save
- Cancel

Validation

- Role Name Required
- Unique Role Name

---

### Edit Role

Editable

- Role Name
- Description
- Status
- Permission Matrix

Actions

- Save Changes
- Cancel

---

### Delete Role

Display

- Role Name
- Assigned Users

Business Rules

- Cannot delete System Roles.
- Cannot delete role assigned to active users.
- Confirmation required.

Buttons

- Delete
- Cancel

---

### Clone Role

Purpose

Create a new role using an existing role as a template.

Fields

- New Role Name

Actions

- Clone
- Cancel

---

### Permission Matrix

Each Module Supports

- View
- Create
- Edit
- Delete
- Manage
- Export
- Approve

Example

Dashboard

✔ View

✔ Export

Users

✔ Create

✔ Edit

✔ Delete

Billing

✔ View

✔ Export

AI Controls

✔ Manage

✔ Configure

---

### Assign Users

Fields

- Select Users
- Select Company

Actions

- Assign
- Remove

Business Rules

- One primary role per user.
- Role update immediately refreshes permissions.

---

### Permission Groups

Platform

Administration

Operations

Fleet

Drivers

Loads

Warehouse

Finance

CRM

Customer Portal

AI

Analytics

Settings

White Label

Security

---

### Role Inheritance

Rules

- Super Admin inherits all permissions.
- Child roles cannot exceed parent permissions.
- Custom roles inherit only selected permissions.

---

### Dashboard Widgets

- Total Roles
- Active Users by Role
- Permission Distribution
- Most Used Roles
- Recently Modified Roles

---

### Audit Logs

Track

- Role Created
- Role Updated
- Role Deleted
- Role Cloned
- Permission Changed
- User Assigned
- User Removed

Fields

- User
- Operator
- Timestamp
- IP Address
- Browser
- Old Permission
- New Permission

---

### Notifications

- Role Created
- Role Updated
- Role Deleted
- Permission Changed
- User Assigned

---

### Validation Rules

- Role Name Required
- Role Name Unique
- Minimum One Permission
- Cannot Remove Own Super Admin Permission
- Cannot Delete Built-in Roles

---

### APIs

GET /roles

GET /roles/{id}

POST /roles

PUT /roles/{id}

DELETE /roles/{id}

POST /roles/clone

GET /roles/permissions

PUT /roles/permissions

POST /roles/assign-users

POST /roles/remove-users

GET /roles/audit

---

### Database Tables

roles

permissions

role_permissions

user_roles

permission_groups

role_audit_logs

audit_logs

users

companies

---

### Business Rules

- System roles are read-only.
- Custom roles can be modified.
- Permission updates take effect immediately.
- Every permission change generates an audit log.
- Role deletion blocked if assigned users exist.
- Role cloning copies all permissions.
- Export respects RBAC.

---

### Security

- RBAC Enabled
- Permission Validation on Every API
- JWT Authentication
- MFA Supported
- Audit Logging Mandatory
- IP Tracking Enabled

---

### Error States

- Role Not Found
- Duplicate Role Name
- Permission Missing
- System Role Protected
- Active Users Assigned
- Permission Denied
- Internal Server Error

---

### Success Messages

- Role created successfully.
- Role updated successfully.
- Role cloned successfully.
- Role deleted successfully.
- Permissions updated successfully.
- Users assigned successfully.

---

### Acceptance Criteria

- Role CRUD working.
- Permission matrix working.
- User assignment working.
- Clone role working.
- Search working.
- Filters working.
- Export working.
- Audit logs generated.
- Responsive UI.
- Performance under 2 seconds.

---


### Super Admin → Settings

#### Module Purpose

- Manage global platform configurations.
- Configure company profile and branding.
- Manage billing and subscription settings.
- Configure White Label settings.
- Manage GPS, ELD, Accounting, Email, SMS integrations.
- Maintain platform security and audit logs.

---

### User Role

- Super Admin

---

### Permissions

- View Settings
- Edit Company Profile
- Manage Branding
- Manage White Label
- Configure Business Hours
- Manage Subscription Settings
- Configure GPS Providers
- Configure Accounting Integrations
- Configure Email Templates
- Configure SMS Templates
- View Security Logs
- Export Audit Logs

---

### Header

- Page Title : Settings
- Save Changes
- Export Settings

---

### Navigation Sections

- Company Profile
- Branding & Theme
- Business Hours
- Billing & Subscription
- White Label Setup
- Logistics Configuration
- GPS & ELD Integrations
- Email & SMS Templates
- Accounting Integrations
- Security Audit Logs

---

### Company Profile

#### Purpose

Manage organization information.

##### Fields

- Company Name
- Registration Number
- Admin Email
- Company Phone
- Website
- Address
- Country
- Timezone
- Currency
- Language

##### Actions

- Save Company Profile
- Reset Changes

##### Validation

- Company Name Required
- Email Required
- Registration Number Unique

---

### Branding & Theme

#### Purpose

Customize platform appearance.

##### Fields

- Primary Theme Color
- Secondary Color
- Accent Color
- Company Logo
- Favicon
- Login Background
- Dashboard Background
- Theme Mode

##### Theme Options

- Light
- Dark
- System
- Custom

##### Actions

- Upload Logo
- Upload Background
- Save Branding
- Reset Branding

##### Validation

- PNG
- JPG
- SVG
- Maximum Upload Size

---

### Business Hours

#### Purpose

Configure default operating hours.

##### Fields

Monday

Tuesday

Wednesday

Thursday

Friday

Saturday

Sunday

Each Day

- Opening Time
- Closing Time
- Open / Closed

##### Business Rules

- Individual branches can override.

---

### Billing & Subscription

Display

- Current Plan
- Subscription Status
- Billing Cycle
- Payment Method
- Renewal Date

Usage

- Users
- Branches
- Drivers
- Fleet
- Storage

Invoices

- Invoice History
- Download PDF
- Payment Status

Actions

- Update Payment Method
- Upgrade Plan
- Cancel Subscription

---

### White Label Setup

Fields

- Custom Domain
- Login Title
- Platform Name
- Brand Theme

Toggles

- Hide Hero Branding
- Hide Documentation Links
- Hide Footer

Actions

- Save White Label

Validation

- Domain Format
- SSL Required

---

### Logistics Configuration

Supported Niches

- Car Carrying
- General Freight
- HAZMAT
- Refrigerated
- Flatbed
- Container
- Courier
- LTL
- FTL

Configuration

- Enable
- Disable

Default Niche

Dropdown

Business Rules

- Enabled niche controls visible forms.
- Disabled niche hides related modules.

---

### GPS & ELD Integrations

Supported Providers

- Geotab
- Trakka
- Teletrac Navman
- Samsara
- Motive
- Verizon Connect

Fields

- Provider
- API Key
- Secret
- Status
- Last Sync

Actions

- Connect
- Disconnect
- Test Connection
- Update API Key

Validation

- API Key Required
- Secret Required

---

### Email Templates

Templates

- Welcome Email
- Password Reset
- Driver Invitation
- Company Invitation
- Invoice Email
- POD Confirmation
- Dispatch Notification

Fields

- Subject
- HTML Body
- Variables
- Footer

Actions

- Preview
- Save
- Send Test Email

---

### SMS Templates

Templates

- Dispatch SMS
- ETA Update
- Driver Alert
- OTP
- Delivery Confirmation

Fields

- Message Body
- Variables

Actions

- Save
- Send Test SMS

---

### Accounting Integrations

Supported

- Xero
- QuickBooks
- Zoho Books
- MYOB

Display

- Status
- Last Sync
- API Key

Actions

- Connect
- Disconnect
- Sync Now
- Test Connection

Business Rules

- Sync invoices automatically.
- Manual sync supported.

---

### Security Settings

Configuration

- Password Policy
- MFA
- Session Timeout
- Login Attempt Limit
- IP Whitelist
- Device Trust
- Audit Logging

Fields

- Minimum Password Length
- Password Expiry
- Session Timeout
- Failed Login Attempts

Actions

- Save Security Settings

---

### Company Security Audit Logs

Display

- Timestamp
- User
- Action
- Description
- IP Address
- Browser
- Authentication Status

Filters

- User
- Date
- Action
- Status

Actions

- View Details
- Export Logs

---

### Search

- User
- Setting
- Provider

---

### Filters

- Category
- Status
- Provider
- Date

---

### Export

- Settings Backup
- CSV
- PDF
- Audit Logs

---

### Notifications

- Subscription Renewal
- Payment Failed
- GPS Connection Failed
- Email Delivery Failed
- SMS Failed
- Security Alert
- Failed Login
- Integration Disconnected

---

### Validation Rules

- Email Format
- Domain Format
- API Keys Required
- Valid Business Hours
- Valid Theme Colors
- Valid Currency
- Required Company Details

---

### APIs

GET /settings

PUT /settings/company

PUT /settings/branding

PUT /settings/business-hours

PUT /settings/billing

PUT /settings/white-label

PUT /settings/logistics

PUT /settings/gps

PUT /settings/email

PUT /settings/sms

PUT /settings/accounting

PUT /settings/security

GET /settings/audit

POST /settings/test-email

POST /settings/test-sms

POST /settings/test-gps

POST /settings/test-accounting

---

### Database Tables

settings

company_profile

branding

business_hours

subscription_settings

white_label

logistics_configuration

gps_integrations

email_templates

sms_templates

accounting_integrations

security_settings

audit_logs

notifications

---

### Business Rules

- Only Super Admin can modify global settings.
- Branding updates apply platform-wide.
- White Label changes require deployment.
- GPS integrations validated before saving.
- Accounting sync logs every transaction.
- Email and SMS templates support dynamic variables.
- Every settings change generates an audit log.
- Security settings apply immediately.

---

### Security

- RBAC Enabled
- MFA Supported
- JWT Authentication
- Secrets Encrypted
- API Keys Masked
- Audit Logging Mandatory
- IP Tracking Enabled

---

### Error States

- Invalid Email
- Invalid Domain
- Invalid API Key
- GPS Connection Failed
- Accounting Sync Failed
- Email Failed
- SMS Failed
- Permission Denied
- Internal Server Error

---

### Success Messages

- Company profile updated successfully.
- Branding updated successfully.
- Business hours updated successfully.
- Billing settings updated successfully.
- White Label settings updated successfully.
- GPS integration connected successfully.
- Email template saved successfully.
- SMS template saved successfully.
- Accounting integration connected successfully.
- Security settings updated successfully.

---

### Acceptance Criteria

- Company profile working.
- Branding working.
- Business hours working.
- Billing settings working.
- White Label working.
- Logistics configuration working.
- GPS integrations working.
- Email templates working.
- SMS templates working.
- Accounting integrations working.
- Security settings working.
- Audit logs working.
- Search working.
- Export working.
- Responsive UI.
- Performance under 2 seconds.

---




### Company Admin → Command Centre

#### Module Purpose

- Central operational dashboard for Company Admin.
- Provide a real-time overview of fleet operations, loads, drivers, revenue, invoices, support tickets, and maintenance.
- Enable quick operational actions from one screen.
- Surface alerts requiring immediate attention.

---

### User Role

- Company Admin

---

### Permissions

- View Dashboard
- View KPIs
- View Recent Loads
- View Driver Alerts
- View Pending Invoices
- View Tickets
- Create Quick Actions
- Export Dashboard

---

### Header

- Company Name
- Dashboard
- Search
- Notifications
- User Profile

---

### KPI Cards

#### Loads (MTD)

Display

- Total Loads
- Monthly Growth %

---

#### Active Fleet

Display

- Active Vehicles
- Total Fleet

---

#### Monthly Revenue

Display

- Revenue
- Growth %

---

#### Active Branches

Display

- Active Branches
- Total Depots

---

### Quick Actions

Buttons

- New Load
- Assign Driver
- Track Load
- Create Customer
- Generate Invoice
- More Actions

---

### Load Status Summary

Display

- Total Loads
- Draft
- Assigned
- Picked Up
- In Transit
- Delivered
- Cancelled

Charts

- Status Distribution
- Monthly Load Trend

---

### Recent Loads

Columns

- Load ID
- Route
- Status
- Driver
- ETA

Actions

- View
- Edit
- Track

---

### Unread Messages

Display

- Sender
- Preview
- Time
- Unread Count

Actions

- Open Conversation
- Reply

---

### Support Ticket Summary

Display

- Open
- In Progress
- Waiting
- Resolved

Actions

- View Tickets
- Create Ticket

---

### Pending Invoices

Display

- Invoice Number
- Customer
- Amount
- Due Date

Actions

- View
- Generate
- Send Reminder

---

### Driver Alerts

Display

- Driver Name
- Alert Type
- Severity
- Date

Alert Types

- License Expiry
- Fatigue Breach
- Missing Pre-start
- Compliance Warning
- Medical Expiry

Actions

- View Driver
- Notify Driver

---

### Truck Maintenance

Display

- Vehicle
- Registration
- Maintenance Type
- Due Date
- Status

Actions

- Schedule Maintenance
- View Vehicle

---

### Knowledge Base Widget

Display

- Search Articles
- Popular Articles

Actions

- Open Knowledge Base
- Create Support Ticket

---

### Dashboard Widgets

- Fleet Health
- Driver Availability
- Vehicle Availability
- Active Loads
- Revenue Summary
- Recent Activities
- Notifications
- Support Overview

---

### Search

- Loads
- Driver
- Customer
- Invoice

---

### Filters

- Date Range
- Branch
- Driver
- Status

---

### Notifications

- New Load Assigned
- Driver Alert
- Maintenance Due
- Invoice Due
- Support Ticket Updated
- New Message

---

### Audit Logs

Track

- Dashboard Viewed
- Quick Action Used
- Report Exported

---

### APIs

GET /company/dashboard

GET /company/dashboard/kpis

GET /company/dashboard/recent-loads

GET /company/dashboard/messages

GET /company/dashboard/invoices

GET /company/dashboard/alerts

GET /company/dashboard/tickets

GET /company/dashboard/maintenance

---

### Database Tables

dashboard_statistics

loads

drivers

vehicles

branches

messages

tickets

invoices

maintenance

notifications

---

### Business Rules

- Dashboard refresh every 60 seconds.
- KPI cards update automatically.
- Quick actions respect RBAC.
- Alerts shown by priority.
- Recent data sorted newest first.
- Every dashboard access logged.

---

### Security

- RBAC Enabled
- Company Isolation
- JWT Authentication
- Audit Logging

---

### Error States

- Dashboard Data Unavailable
- KPI Loading Failed
- Permission Denied
- Internal Server Error

---

### Success Messages

- Dashboard loaded successfully.
- Report exported successfully.

---

### Acceptance Criteria

- Dashboard loads successfully.
- KPI cards update correctly.
- Quick actions work.
- Recent loads visible.
- Driver alerts visible.
- Invoice widget working.
- Messages working.
- Ticket widget working.
- Responsive UI.
- Performance under 2 seconds.

---


### PRD – Sales Dashboard
Module: Sales Portal → Sales Dashboard
Version: 1.0
Status: Production Ready
Owner: Product Team
Audience: UI/UX, Frontend, Backend, QA, DevOps

---

### 1. Module Overview

Sales Dashboard is the primary workspace for the Sales Team.

It provides a complete overview of:

- Lead Pipeline
- Demo Activities
- Trial Companies
- Proposal Status
- Won/Lost Deals
- Pipeline Revenue
- Sales Activities
- Follow-up Tasks
- Monthly Performance
- Conversion Analytics

This page is the first screen after Sales user login.

---

### 2. Business Objective

The dashboard enables Sales Representatives and Sales Managers to:

- View sales performance in real time.
- Monitor pipeline movement.
- Track follow-up activities.
- Manage active prospects.
- Quickly perform sales actions.
- Monitor monthly revenue.
- Analyze conversion rate.
- Improve sales productivity.

---

### 3. User Roles

##### Sales Director

Permissions

- Full Dashboard Access
- View All Leads
- View Reports
- Create Lead
- Edit Lead
- Delete Lead
- Assign Sales Rep
- View Revenue
- Export Reports

---

##### Sales Manager

Permissions

- View Team Dashboard
- Manage Team Leads
- Assign Tasks
- Book Demo
- View Reports

---

##### Sales Representative

Permissions

- View Assigned Leads
- Book Demo
- Update Pipeline
- Log Calls
- Add Notes
- Start Trial
- Send Proposal

---

### 4. Dashboard Header

Displays

- Page Title
- Module Description

Title

Sales Dashboard

Subtitle

Manage leads, pipeline, and sales reports.

---

### 5. KPI Cards

The first section contains KPI summary cards.

---

#### Card 1

Title

NEW LEADS

Value

6

Description

6 Pending

Color

Blue

Click Action

Open Leads Module filtered by New Lead.

---

#### Card 2

Title

DEMOS BOOKED

Value

12

Description

Slots Ready

Color

Purple

Click

Open Demo Bookings page.

---

#### Card 3

Title

TRIALS ACTIVE

Value

21

Description

Active Usage

Color

Orange

Click

Open Trial Companies.

---

#### Card 4

Title

PROPOSALS SENT

Value

10

Description

Negotiating

Color

Yellow

Click

Open Proposal module.

---

#### Card 5

Title

DEALS WON

Value

5

Description

Closed & Synced

Color

Green

Click

Open Won Deals.

---

#### Card 6

Title

DEALS LOST

Value

5

Description

Needs Re-engage

Color

Red

Click

Open Lost Deals.

---

#### Card 7

Title

PIPELINE VALUE

Value

$306,960

Description

Potential MRR

Color

Indigo

Click

Open Revenue Report.

---

### 6. Pipeline Stage Distribution Matrix

Displays complete pipeline summary.

Stages

- New Lead
- Contacted
- Demo Booked
- Demo Completed
- Trial Started
- Proposal Sent
- Negotiation
- Won
- Lost

Each stage displays:

- Stage Name
- Lead Count
- Color Indicator
- Clickable Navigation

Clicking a stage opens Pipeline Board filtered by selected stage.

---

### 7. Selected Lead Details Workspace

Displays currently selected lead.

Example

Company

Vance Refrigeration

Contact

Robert Vance

Current Stage

New Lead

Displays

Fleet Size

12 Trucks

Transport Niche

Car Carrying

Current Software

Spreadsheets (Excel)

Estimated Value

$2,004/month

Pain Points

Manual route sheets take hours.

Next Follow-up Date

2026-07-13

---

### 8. Internal Notes

Displays latest CRM notes.

Each note contains

- User Name
- Date
- Time
- Comment

Supports

- Rich Text
- Timestamp
- Edit
- Delete
- Mention User

---

### 9. CRM Direct Dispatch Actions

Available buttons

- Recommend Plan
- Book Demo
- Start Trial
- Send Proposal
- Mark Won
- Mark Lost

Each action opens its respective modal.

---

### 10. Quick Note Box

Allows sales rep to enter activity.

Placeholder

Quick write note and press Enter...

Press Enter

Creates activity timeline entry.
---

### 11. Upcoming Follow-up Tasks

#### Purpose

Displays all upcoming, overdue, and scheduled follow-up activities for the sales team.

---

#### Section Title

UPCOMING FOLLOW-UP TASKS

Display total pending task count.

Example

3 Tasks

---

#### Task Card Fields

Each task card contains:

- Company Name
- Task Status
- Due Date
- Due Time
- Contact Person
- Assigned Sales Representative
- Task Description
- Priority
- Task Type

---

#### Example

Company

Freight-A-Way

Status

Overdue

Due Date

2026-07-16

Due Time

03:30 PM

Task

Touchpoint checklist regarding pain points:
Fuel tax calculation mistakes.

---

#### Another Example

Company

QuickLoad Logistics

Status

Overdue

Due Date

2026-07-17

Task

Call regarding Driver Dispatch Automation.

---

#### Another Example

Company

Vance Refrigeration

Status

Upcoming

Due Date

2026-07-19

Task

Demo Follow-up

Description

Send customized pricing deck for 12 trucks.

---

#### Available Actions

- Open Task
- Edit
- Complete
- Delete
- Reschedule
- Assign User

---

#### Status Types

- Pending
- Upcoming
- Overdue
- Completed
- Cancelled

---

### 12. Recent Activity Timeline

#### Purpose

Shows complete sales activity history.

Every activity performed on a lead is logged here.

---

#### Timeline Events

Supported Events

- Lead Created
- Phone Call
- Email Sent
- Demo Scheduled
- Demo Completed
- Trial Started
- Proposal Sent
- Proposal Revised
- Proposal Accepted
- Proposal Rejected
- Internal Note
- Follow-up Created
- Deal Won
- Deal Lost
- Company Converted

---

#### Activity Card Fields

Each activity contains:

- Company Name
- Event Type
- Date
- Time
- User
- Description
- Icon

---

#### Example

Company

Vance Refrigeration

Activity

Lead Created

Date

2026-07-14

Time

02:15 PM

Created By

SYSTEM HUB

Description

Inbound workspace registration processed.

---

#### Example

Company

Hudson Logistics Corp

Activity

Demo Scheduled

Date

2026-07-12

User

Alex Wright

Description

Zoom Product Walkthrough booked.

---

#### Example

Company

Global Shipping Co.

Activity

Deal Won

Description

Enterprise License finalized.

---

### 13. Monthly Sales Analytics

#### Purpose

Displays monthly pipeline growth.

---

#### Graph Type

Area Chart

---

#### X Axis

Months

- Jan
- Feb
- Mar
- Apr
- May
- Jun

---

#### Y Axis

Pipeline Revenue

---

#### Tooltip

Displays

- Month
- Revenue
- Growth %

---

#### Filters

- Current Month
- Quarter
- Year
- Custom Date

---

### 14. Conversion Funnel Chart

Displays conversion efficiency.

Stages

Lead

↓

Demo

↓

Trial

↓

Proposal

↓

Won

---

#### Metrics

Conversion Rate

Demo Success Rate

Proposal Success Rate

Win Rate

Loss Rate

Average Closing Time

---

### 15. Create New Task Modal

Purpose

Create follow-up activities.

---

#### Fields

Task Title *

Task Type *

Due Date *

Due Time *

Priority *

Associated Lead

Assigned User

Reminder

Notes

---

#### Task Types

- Phone Call
- Email
- Zoom Meeting
- Site Visit
- Proposal Follow-up
- Trial Follow-up
- Internal Review

---

#### Priority

Low

Medium

High

Critical

---

#### Buttons

Cancel

Create Task

---

#### Validation

Task Title Required

Due Date Required

Priority Required

---

### 16. Recommend Plan Modal

Purpose

Recommend SaaS License.

---

#### Plans

Starter

Professional

Enterprise

---

Each card displays

Plan Name

Monthly Price

Features

Recommended Badge

Apply Button

---

Starter

$199

Supports

Small Fleet

---

Professional

$499

Growing Companies

---

Enterprise

$1299

Large Fleet

Unlimited Modules

---

#### Button

Apply Selected Plan

---

### 17. Schedule Demo Modal

Purpose

Book Zoom Demo.

---

#### Fields

Lead *

Date *

Time *

Presenter *

Meeting Agenda

Internal Notes

Timezone

Meeting Duration

---

#### Buttons

Cancel

Confirm Zoom Schedule

---

#### Validation

Date Required

Time Required

Presenter Required

---

### 18. Start Trial Modal

Purpose

Activate Trial Workspace.

---

#### Fields

Trial Duration

Workspace Plan

Driver License Limit

Module Access

Storage Quota

Admin Email

---

#### Default

14 Days

---

#### Buttons

Cancel

Activate Trial

---

### 19. Send Proposal Modal

Purpose

Generate SaaS Proposal.

---

#### Fields

Proposal Title

Base License

Additional Modules

Discount %

Validity

Custom Notes

---

#### Buttons

Save Draft

Send Proposal

Preview

Cancel

---

### 20. Company Conversion Wizard

Purpose

Convert Won Lead into Company Workspace.

6 Step Workflow

Step 1

Subscription Plan

↓

Step 2

Company Information

↓

Step 3

Admin Information

↓

Step 4

Depot Allocation

↓

Step 5

Review

↓

Step 6

Provision Workspace

---

Each step validates before moving next.

Previous Step available.

Final step provisions tenant automatically.

---

### End of Sales Dashboard Part-2

Remaining Sections (Part-3)

- Business Rules
- Automation Rules
- Notification Rules
- API Endpoints
- Database Tables
- Permission Matrix
- Audit Logs
- Security Rules
- Error Messages
- Success Messages
- Acceptance Criteria
- QA Test Cases
- Edge Cases
- Performance Requirements
- Future Enhancements
---

### 21. Business Rules

#### BR-001

Every Lead must belong to one Sales Representative.

Priority: High

---

#### BR-002

A Lead cannot move directly from "New Lead" to "Won".

Allowed Flow

New Lead
↓

Contacted
↓

Demo Booked
↓

Demo Completed
↓

Trial Started
↓

Proposal Sent
↓

Negotiation
↓

Won

Alternative

Negotiation
↓

Lost

---

#### BR-003

Every Demo Booking must have

- Lead
- Date
- Time
- Presenter

Mandatory.

---

#### BR-004

Only Won Leads can be converted into Company Workspace.

---

#### BR-005

Proposal cannot be generated until

- Demo Completed

OR

- Trial Started

---

#### BR-006

Trial Workspace duration

Default

14 Days

Maximum

30 Days

---

#### BR-007

Every activity performed by Sales must create Timeline history.

---

#### BR-008

Deleting Lead does not remove activity history.

Status

Archived

---

#### BR-009

Every Follow-up must have Due Date.

---

#### BR-010

Only Sales Director can permanently delete Lead.

---

### 22. Automation Rules

System automatically performs following actions.

---

#### Lead Created

Automatically

Assign Lead Number

Example

LD-000245

---

Assign Sales Representative

Round Robin

OR

Manual Assignment

---

Create Timeline Event

Lead Created

---

Send Welcome Email (Optional)

---

### Demo Booked

Automatically

Create Calendar Event

Send Email

Send SMS Reminder

Create Timeline

---

### Demo Completed

Automatically

Ask Feedback

Calculate Lead Score

Update Stage

---

### Trial Started

Automatically

Create Trial Workspace

Generate Login Credentials

Create Admin User

Assign Trial License

Send Trial Email

---

### Proposal Sent

Automatically

Generate Proposal Number

Attach PDF

Send Email

Update Timeline

---

### Proposal Accepted

Automatically

Move Lead

↓

Won

Create Company Wizard

Notify Operations Team

---

### Deal Won

Automatically

Generate Customer ID

Provision Company

Create Tenant

Assign Subscription

Generate Invoice

Notify Admin

---

### Deal Lost

Automatically

Move Lead

↓

Lost

Capture Loss Reason

Create Re-engagement Reminder

---

### 23. Notification Rules

System Notifications

Demo Reminder

24 Hours Before

---

Demo Reminder

1 Hour Before

---

Trial Expiring

7 Days

3 Days

1 Day

---

Proposal Expiry

5 Days

2 Days

1 Day

---

Follow-up Reminder

30 Minutes Before

---

Overdue Follow-up

Every Morning

09:00 AM

---

Deal Won

Notify

Sales Director

Operations

Implementation Team

Finance

---

### 24. API Requirements

GET

/api/sales/dashboard

Returns

Dashboard KPIs

---

GET

/api/leads

Returns

Lead List

---

POST

/api/leads

Create Lead

---

PUT

/api/leads/{id}

Update Lead

---

DELETE

/api/leads/{id}

Archive Lead

---

GET

/api/followups

Return Follow-up Tasks

---

POST

/api/demo

Book Demo

---

POST

/api/trial

Start Trial

---

POST

/api/proposal

Generate Proposal

---

POST

/api/company/convert

Convert Lead

↓

Company

---

GET

/api/reports/dashboard

Dashboard Analytics

---

### 25. Database Tables

sales_leads

Stores

Lead Information

---

sales_followups

Stores

Follow-up Tasks

---

sales_notes

Stores

Internal Notes

---

sales_calls

Call History

---

sales_emails

Email History

---

sales_demos

Demo Bookings

---

sales_trials

Trial Workspaces

---

sales_proposals

Proposal Records

---

sales_pipeline_history

Pipeline Movement

---

sales_activity_logs

Activity Timeline

---

sales_dashboard_metrics

Dashboard KPIs

---

sales_reports

Generated Reports

---

sales_notifications

Notification Queue

---

### 26. Permission Matrix

Sales Director

✓ Everything

---

Sales Manager

✓ Team Dashboard

✓ Team Reports

✓ Assign Leads

✓ Assign Tasks

---

Sales Representative

✓ Own Leads

✓ Book Demo

✓ Trial

✓ Proposal

✓ Notes

---

Read Only

View Dashboard Only

---

### 27. Audit Logs

Every Action Logged

Log Fields

Log ID

User

Action

Entity

Old Value

New Value

IP Address

Browser

Date

Time

---

Examples

Lead Created

Demo Booked

Proposal Sent

Proposal Accepted

Trial Started

Lead Converted

Company Created

Task Deleted

---

### 28. Error Messages

Lead Not Found

Demo Date Required

Presenter Required

Proposal Already Exists

Trial Already Active

Invalid Stage

Access Denied

Network Error

Server Error

Validation Failed

---

### 29. Success Messages

Lead Created Successfully

Demo Scheduled Successfully

Trial Activated

Proposal Sent

Company Converted Successfully

Dashboard Updated

Task Completed

Note Saved

---

### 30. Performance Requirements

Dashboard Load Time

<2 Seconds

---

API Response

<500ms

---

Search Response

<300ms

---

Charts

Load Under

1 Second

---

Support

10,000+

Leads

---

Support

100+

Concurrent Users

---

### 31. Security Requirements

JWT Authentication

Role Based Access Control

Encrypted Passwords

HTTPS Only

CSRF Protection

Rate Limiting

Audit Logging

Session Timeout

Secure File Uploads

SQL Injection Protection

XSS Protection

---

### 32. Acceptance Criteria

Dashboard loads successfully.

All KPI cards display correctly.

Pipeline updates instantly.

Charts display accurate data.

Timeline records all activities.

Tasks save successfully.

Demo booking works.

Trial activation works.

Proposal generation works.

Company conversion works.

Reports export successfully.

Notifications trigger correctly.

Permissions enforced correctly.

---

### 33. Edge Cases

Lead without Email

Duplicate Company

Duplicate Proposal

Trial Expired

Proposal Expired

Deleted Sales User

Inactive Lead

Large Revenue Values

Empty Dashboard

No Reports

No Tasks

Multiple Tabs Editing Same Lead

Lost Internet Connection

Session Timeout

---

### 34. Future Enhancements

AI Lead Scoring

AI Follow-up Suggestions

WhatsApp Integration

LinkedIn Sync

Zoom API

Google Calendar Sync

Microsoft Calendar Sync

Voice Call Recording

AI Meeting Summary

Sales Forecast AI

Revenue Prediction

Auto Proposal Generator

OpenAI Email Writer

Power BI Integration

---

END OF DOCUMENT

Module Status

Production Ready

Version

1.0

Owner

Product Team

Approval

Pending

### 02-Leads.md

> **Module:** Sales Portal → Leads\
> **Version:** 1.0\
> **Status:** Production Ready (Starter Draft)

------------------------------------------------------------------------

### Module Overview

The Leads module is the central CRM workspace used to capture, qualify,
manage, nurture, and convert prospects into active customer companies.

#### Primary Objectives

-   Capture inbound and outbound leads
-   Track complete sales lifecycle
-   Assign sales representatives
-   Schedule demos
-   Start trial companies
-   Send proposals
-   Convert qualified leads into companies
-   Maintain complete activity history

------------------------------------------------------------------------

### Main Screens

1.  Leads Dashboard
2.  Lead Registry
3.  Register Inbound Carrier Lead
4.  Lead 360 Profile
5.  Demo Booking
6.  Trial Activation
7.  Proposal Generation
8.  Company Conversion Wizard

------------------------------------------------------------------------

### Lead Pipeline

New Lead → Contacted → Demo Booked → Demo Completed → Trial Started →
Proposal Sent → Negotiation → Won / Lost

------------------------------------------------------------------------

### Lead List

Each Lead Card displays:

-   Company Name
-   Contact Person
-   Email
-   Fleet Size
-   Transport Niche
-   Estimated Revenue
-   Lead Score
-   Sales Aging
-   Current Stage
-   Assigned Sales Rep

------------------------------------------------------------------------

### Search & Filters

-   Search by Company
-   Search by Contact
-   Search by Email
-   Transport Niche
-   Fleet Size
-   Lead Stage
-   Assigned Sales Rep

------------------------------------------------------------------------

### Register Lead Form

Fields:

-   Company Legal Name
-   Contact Person
-   Email
-   Phone
-   Fleet Size
-   Transport Niche
-   Revenue Estimate
-   Assigned Rep
-   Current Software
-   Pain Points
-   Priority
-   Tags
-   Next Follow-up
-   Notes

Validation:

-   Required fields cannot be empty
-   Duplicate email not allowed
-   Fleet size must be numeric

------------------------------------------------------------------------

### Lead Actions

-   View
-   Edit
-   Delete
-   Book Demo
-   Start Trial
-   Send Proposal
-   Mark Won
-   Mark Lost
-   Convert to Company

------------------------------------------------------------------------

### Business Rules

-   Every lead must have one owner.
-   Every stage change is logged.
-   Won leads can be converted into companies.
-   Lost leads remain archived.

------------------------------------------------------------------------

### APIs

GET /api/leads POST /api/leads PUT /api/leads/{id} DELETE
/api/leads/{id}

------------------------------------------------------------------------

### Database Tables

-   sales_leads
-   sales_notes
-   sales_tasks
-   sales_calls
-   sales_emails
-   sales_demos
-   sales_trials
-   sales_proposals
-   sales_activity_logs

------------------------------------------------------------------------

### Acceptance Criteria

-   Lead creation works.
-   Lead editing works.
-   Filters work correctly.
-   Pipeline updates correctly.
-   Activity timeline records all actions.
-   Conversion wizard provisions company successfully.

> **Note:** This is the initial `02-Leads.md` structure. The complete
> enterprise version will expand each section with all forms, modals,
> workflows, permissions, APIs, database schema, validations, and QA
> scenarios.


### 03-Pipeline-Board.md

**Module:** Sales Portal → Pipeline Board\
**Version:** 1.0\
**Status:** Production Ready

------------------------------------------------------------------------

### Module Overview

The Pipeline Board is a Kanban-style CRM workspace that allows the sales
team to manage every lead from first contact until conversion into an
active customer.

------------------------------------------------------------------------

### Business Objective

-   Visualize complete sales pipeline
-   Drag & drop lead movement
-   Track conversion progress
-   Manage sales activities
-   Trigger demos, trials and proposals
-   Convert won leads into active companies

------------------------------------------------------------------------

### Pipeline Stages

1.  New Lead
2.  Contacted
3.  Demo Booked
4.  Demo Completed
5.  Trial Started
6.  Proposal Sent
7.  Negotiation
8.  Won
9.  Lost

------------------------------------------------------------------------

### Lead Card

Each card displays:

-   Company Name
-   Contact Person
-   Email
-   Assigned Sales Rep
-   Fleet Size
-   Transport Niche
-   Estimated Contract Value
-   Lead Score
-   Current Stage
-   Days in Current Stage

Actions:

-   Open Lead
-   Recommend Plan
-   Schedule Demo
-   Start Trial
-   Send Proposal
-   Mark Won
-   Mark Lost

------------------------------------------------------------------------

### Lead 360 Workspace Tabs

-   Overview
-   Timeline
-   Contacts
-   Meetings
-   Calls
-   Emails
-   Tasks
-   Notes
-   Documents
-   Demo
-   Trial
-   Proposals

------------------------------------------------------------------------

### Schedule Zoom Demo

Fields

-   Lead
-   Date
-   Time
-   Presenter
-   Meeting Agenda
-   Internal Notes

Buttons

-   Cancel
-   Confirm Zoom Schedule

------------------------------------------------------------------------

### Proposal Modal

Fields

-   Proposal Title
-   Base License
-   Add-on Items
-   Discount
-   Validity
-   Notes

Buttons

-   Save Draft
-   Send Proposal

------------------------------------------------------------------------

### Convert to Company

Available only for Won leads.

Wizard Steps

1.  Select Plan
2.  Company Information
3.  Admin User
4.  Branch / Depot
5.  Review
6.  Provision Workspace

------------------------------------------------------------------------

### Business Rules

-   Every stage transition is logged.
-   Won leads can be provisioned.
-   Lost leads are archived.
-   Stage transitions follow the configured workflow.

------------------------------------------------------------------------

### APIs

GET /api/pipeline PUT /api/pipeline/{leadId}/stage GET /api/leads/{id}
POST /api/demo POST /api/trial POST /api/proposal POST
/api/company/convert

------------------------------------------------------------------------

### Database Tables

-   sales_pipeline
-   sales_pipeline_history
-   sales_leads
-   sales_activity_logs
-   sales_demos
-   sales_trials
-   sales_proposals

------------------------------------------------------------------------

### Notifications

-   Demo Reminder
-   Trial Expiry
-   Proposal Expiry
-   Follow-up Reminder
-   Deal Won Notification

------------------------------------------------------------------------

### Audit Logs

Log:

-   Stage Changed
-   Demo Booked
-   Trial Started
-   Proposal Sent
-   Deal Won
-   Deal Lost

------------------------------------------------------------------------

### Acceptance Criteria

-   Drag & drop works.
-   Stage changes persist.
-   Timeline updates automatically.
-   Proposal generation works.
-   Company conversion completes successfully.


### Demo Bookings PRD

#### 1. Module Overview
The Demo Bookings module manages the complete lifecycle of product demonstrations for prospective customers. It allows the Sales Team to schedule, track, conduct, and review demos while integrating with Leads, Trial Companies, Proposals, and CRM activities.

---

#### 2. Business Objectives

- Schedule product demonstrations.
- Prevent scheduling conflicts.
- Track demo status.
- Capture customer feedback.
- Convert demos into trials or proposals.
- Maintain complete audit history.

---

#### 3. User Roles

##### Sales Director
- Full access

##### Sales Manager
- Manage team demos

##### Sales Representative
- Create/Edit own demos
- Join meetings
- Submit feedback

##### Read Only
- View only

---

#### 4. Dashboard KPIs

- Total Demo Bookings
- Upcoming Demos
- Completed Demos
- Cancelled Demos
- Demo Conversion Rate
- Average Demo Duration
- Presenter Performance

---

#### 5. Demo Booking List

Columns:

- Company
- Contact Person
- Presenter
- Date
- Time
- Status
- Meeting Link
- Rating
- Created By
- Actions

---

#### 6. Search & Filters

Search:
- Company
- Contact
- Presenter
- Email

Filters:
- Upcoming
- Completed
- Cancelled
- Today
- This Week
- This Month
- Presenter

---

#### 7. Schedule Zoom Product Walkthrough

Fields

- Lead Prospect
- Demo Date
- Demo Time
- Time Zone
- Meeting Agenda
- Presenter

Buttons

- Confirm Zoom Schedule
- Cancel

---

#### 8. Workflow

Lead
→ Demo Booked
→ Reminder Sent
→ Demo Started
→ Demo Completed
→ Feedback Submitted
→ Trial Started OR Proposal Issued

---

#### 9. Validation Rules

- Lead required
- Date required
- Time required
- No past dates
- No duplicate bookings
- No presenter conflicts

---

#### 10. Demo Status

- Draft
- Scheduled
- Upcoming
- Live
- Completed
- Cancelled

---

#### 11. Demo Actions

- Book Demo
- Edit Demo
- Join Zoom
- Send Reminder
- Mark Complete
- Submit Feedback
- Cancel Demo

---

#### 12. Feedback Module

Fields

- Rating (1–5)
- Notes

Rules

- Rating mandatory
- One feedback per completed demo

---

#### 13. Notifications

- Demo Created
- Reminder Sent
- Demo Updated
- Demo Cancelled
- Demo Completed

Delivery

- Email
- SMS
- In-App Notification

---

#### 14. Reports

- Demo Report
- Presenter Report
- Conversion Report

Export

- PDF
- CSV
- Excel

---

#### 15. Database

##### demo_bookings

- id
- lead_id
- company_id
- presenter_id
- meeting_date
- meeting_time
- timezone
- meeting_link
- agenda
- status
- created_by
- updated_by
- created_at
- updated_at

##### demo_feedback

- id
- demo_id
- rating
- feedback
- created_by
- created_at

---

#### 16. APIs

GET /demo-bookings

GET /demo-bookings/{id}

POST /demo-bookings

PUT /demo-bookings/{id}

DELETE /demo-bookings/{id}

POST /demo-bookings/{id}/complete

POST /demo-bookings/{id}/feedback

POST /demo-bookings/{id}/reminder

---

#### 17. Audit Logs

Track:

- Demo Created
- Demo Updated
- Reminder Sent
- Demo Joined
- Demo Completed
- Feedback Submitted
- Status Changed

Store

- User
- Timestamp
- IP Address
- Browser

---

#### 18. Security

- Role Based Access
- Authentication Required
- Audit Logging Enabled
- HTTPS Required

---

#### 19. Acceptance Criteria

- Demo can be scheduled successfully.
- Duplicate demos are prevented.
- Conflicts are detected.
- Feedback is stored.
- Reports export successfully.
- Audit logs record every action.


### Trial Companies PRD

### 1. Module Overview

The **Trial Companies** module manages the complete lifecycle of SaaS trial workspaces. It enables the Sales Team and Super Admin to provision trial companies, monitor usage, extend trial periods, simulate login, analyze adoption, and convert successful trials into paid subscriptions.

---

### 2. Business Objectives

- Provision new trial workspaces.
- Track all active trial companies.
- Monitor usage and engagement.
- Manage trial expiry.
- Extend trial duration.
- Login as company for support.
- Convert trial to paid subscription.
- Track trial conversion metrics.

---

### 3. User Roles

#### Sales Director
- Full Access

#### Sales Manager
- Manage assigned trials

#### Sales Representative
- View assigned trials
- Extend trial
- Login As Company

#### Super Admin
- Complete Access

#### Read Only
- View only

---

### 4. Dashboard Summary Cards

- Active Trial Companies
- Expired Trials
- Expiring Soon
- Converted Trials
- Trial Conversion Rate
- Active Users
- Storage Consumption
- Most Used Modules

---

### 5. Trial Companies Registry

Columns

- Company Name
- Trial Admin
- Trial Status
- Trial Start Date
- Trial End Date
- Days Remaining
- Users
- Storage Used
- Most Used Module
- Assigned Sales Rep
- Actions

Actions

- View Details
- Login As Company
- Extend Trial
- Convert to Paid

---

### 6. Search & Filters

Search

- Company Name
- Admin Name
- Email

Filters

- Active
- Expired
- Expiring Soon
- Converted
- Fleet Size
- Sales Representative

---

### 7. Trial Company Details

Display

- Company Name
- Admin Name
- Contact Email
- Trial Period
- Status
- Days Remaining
- Subscription Recommendation
- Active Users
- Drivers
- Vehicles
- Storage Usage
- API Usage
- Most Used Module

---

### 8. Login As Company

Purpose

Securely simulate customer workspace.

Rules

- RBAC required
- Audit Log mandatory
- Read-only warning banner

---

### 9. Extend Trial

Fields

- Company
- Current Expiry Date
- Extension Days
- Extension Reason

Buttons

- Extend Trial
- Cancel

Business Rules

- Default extension +14 days
- Maximum extension configurable
- Cannot exceed policy limit

---

### 10. Convert Trial to Paid

Workflow

Trial Company
→ Select Subscription Plan
→ Billing
→ Workspace Provision
→ Activate Subscription
→ Company Active

---

### 11. Trial Usage Analytics

Track

- Users
- Drivers
- Fleet
- Branches
- Loads
- Storage
- API Calls
- AI Usage
- Login Count

---

### 12. Trial Status Lifecycle

Draft

↓

Provisioned

↓

Active

↓

Expiring Soon

↓

Expired

↓

Extended

↓

Converted

↓

Archived

---

### 13. Notifications

- Trial Started
- 7 Days Remaining
- 3 Days Remaining
- 1 Day Remaining
- Trial Expired
- Trial Extended
- Trial Converted

Delivery

- Email
- SMS
- In-App

---

### 14. Business Rules

- One active trial per company.
- Company email must be unique.
- Duplicate trials not allowed.
- Trial duration configurable.
- Trial conversion preserves all data.
- Trial extension requires authorization.

---

### 15. Validation Rules

- Company required
- Admin required
- Valid email required
- Start Date required
- End Date greater than Start Date
- Extension cannot overlap
- User quota validation

---

### 16. Reports

- Active Trial Report
- Expiry Report
- Usage Report
- Conversion Report
- Feature Adoption Report

Export

- PDF
- CSV
- Excel

---

### 17. Database Tables

#### trial_companies

- id
- company_name
- admin_name
- admin_email
- start_date
- end_date
- status
- assigned_sales_rep
- created_at
- updated_at

#### trial_usage

- id
- company_id
- users
- drivers
- vehicles
- storage_used
- api_calls
- ai_requests
- updated_at

#### trial_extensions

- id
- company_id
- previous_end_date
- new_end_date
- reason
- approved_by
- created_at

---

### 18. APIs

GET /trial-companies

GET /trial-companies/{id}

POST /trial-companies

PUT /trial-companies/{id}

DELETE /trial-companies/{id}

POST /trial-companies/{id}/extend

POST /trial-companies/{id}/convert

POST /trial-companies/{id}/login

GET /trial-companies/report

---

### 19. Permissions

| Action | Sales Rep | Sales Manager | Sales Director | Super Admin |
|--------|-----------|---------------|----------------|-------------|
| View | ✅ | ✅ | ✅ | ✅ |
| Extend Trial | ✅ | ✅ | ✅ | ✅ |
| Login As Company | ✅ | ✅ | ✅ | ✅ |
| Convert Trial | ❌ | ✅ | ✅ | ✅ |
| Delete | ❌ | ❌ | ✅ | ✅ |

---

### 20. Audit Logs

Capture

- Trial Created
- Trial Extended
- Trial Expired
- Trial Converted
- Login Simulation
- Feature Usage
- Status Changes

Store

- User
- Timestamp
- Browser
- IP Address
- Previous Value
- New Value

---

### 21. Security

- Role Based Access Control
- HTTPS Only
- Session Timeout
- Audit Logging
- Secure Login Simulation
- Encrypted Credentials

---

### 22. Acceptance Criteria

- Trial company creation succeeds.
- Trial limits enforced.
- Extension follows policy.
- Login simulation works.
- Trial converts without data loss.
- Reports export correctly.
- Notifications trigger correctly.
- Audit logs capture every action.
- Permissions enforced.
- UI matches provided Trial Companies design.


### Follow-Ups PRD

#### 1. Module Overview
The Follow-Ups module manages sales tasks, reminders, touchpoints, calls, emails and meetings until lead closure.

#### 2. Business Objectives
- Manage follow-up tasks
- Track pending activities
- Improve conversions

#### 3. Dashboard
- Total Follow-Ups
- Pending
- Completed
- Missed
- Due Today
- Overdue

#### 4. Task List
Columns: Company, Contact, Task, Type, Due Date, Priority, Status, Assigned Rep, Actions.

#### 5. Create Task
Fields: Task Title, Lead, Task Type, Due Date, Due Time, Priority, Description.

#### 6. Status
Created -> Pending -> In Progress -> Completed / Missed / Cancelled.

#### 7. Notifications
Email, SMS and In-App reminders before due date.

#### 8. Reports
Pending, Completed, Missed and Rep Productivity reports. Export PDF/CSV/Excel.

#### 9. Database
follow_up_tasks(id,lead_id,title,task_type,due_date,due_time,priority,status,assigned_to,notes,created_at).

#### 10. APIs
GET/POST/PUT/DELETE /follow-ups, complete, reschedule, report.

#### 11. Audit Logs
Task Created, Updated, Completed, Rescheduled, Deleted.

#### 12. Acceptance Criteria
Tasks, reminders, reports and permissions work correctly.

### Onboarding Handover PRD

### 1. Module Overview
The Onboarding Handover module manages the transition of a Won Sales Opportunity into a fully operational customer workspace. It ensures every provisioning, legal, technical, training, and go-live activity is completed before handing the customer to Operations.

---

### 2. Business Objectives
- Standardize customer onboarding.
- Track onboarding progress.
- Prevent missed setup tasks.
- Ensure legal compliance.
- Coordinate Sales, Operations and Support.
- Convert Won deals into Active Companies.

---

### 3. User Roles
#### Sales Director
Full Access

#### Sales Manager
Manage handovers

#### Sales Representative
View and update assigned handovers

#### Operations Admin
Complete provisioning tasks

#### Super Admin
Complete access

---

### 4. Dashboard KPIs
- Total Handovers
- Pending
- In Progress
- Completed
- High Risk
- Avg Completion Time
- Due Today
- Overdue

---

### 5. Handovers List
Columns:
- Company
- Owner
- Progress %
- Risk
- Target Date
- Status
- Actions

Actions:
- View
- Edit
- Complete Checklist
- Send Package
- Convert to Active Workspace

---

### 6. Search & Filters
Search:
- Company
- Owner

Filters:
- Pending
- In Progress
- Completed
- High Risk
- Due Today
- Overdue

---

### 7. Setup Handover Stepper
1. Company Workspace Provisioned
2. SaaS Subscription Activated
3. Company Admin Registered
4. Role Permissions Assigned
5. Customer Data Imported
6. Roster & ELD Training
7. Production Go-Live

Each step:
- Pending
- In Progress
- Completed

---

### 8. Legal Checklist
- Signed SLA
- W-9 / Tax Documents
- NDA
- Billing Approval
- Contract Verification

---

### 9. Task Management
Fields:
- Task
- Owner
- Due Date
- Priority
- Notes
- Status

Buttons:
- Add Task
- Complete
- Reassign
- Delete

---

### 10. Progress Rules
Progress auto-calculated from completed checklist items.
0-25% = High Risk
26-75% = Medium Risk
76-100% = Low Risk

---

### 11. Notifications
- Handover Created
- Task Assigned
- Due Reminder
- Overdue Reminder
- Checklist Completed
- Workspace Activated

Channels:
- Email
- In-App
- SMS

---

### 12. Business Rules
- Won deal required.
- Owner mandatory.
- All mandatory checklist items must complete before activation.
- Legal documents required before go-live.

---

### 13. Validation Rules
- Company required.
- Owner required.
- Target date required.
- Cannot activate if mandatory tasks pending.

---

### 14. Reports
- Onboarding Status
- Completion Time
- Risk Report
- Owner Performance

Export:
PDF
CSV
Excel

---

### 15. Database Tables
#### onboarding_handovers
- id
- company_id
- owner_id
- progress
- risk
- target_date
- status
- created_at
- updated_at

#### onboarding_tasks
- id
- handover_id
- title
- owner
- due_date
- priority
- status

#### onboarding_checklist
- id
- handover_id
- item
- completed
- completed_by
- completed_at

---

### 16. APIs
GET /handover
GET /handover/{id}
POST /handover
PUT /handover/{id}
POST /handover/{id}/complete-task
POST /handover/{id}/activate
GET /handover/report

---

### 17. Permissions
| Action | Sales Rep | Sales Manager | Ops Admin | Super Admin |
|---|---|---|---|---|
| View | Yes | Yes | Yes | Yes |
| Edit | Own | Yes | Yes | Yes |
| Complete Tasks | Own | Yes | Yes | Yes |
| Activate Workspace | No | No | Yes | Yes |

---

### 18. Audit Logs
Track:
- Handover Created
- Task Added
- Task Completed
- Checklist Updated
- Package Sent
- Workspace Activated

Store:
- User
- Timestamp
- IP
- Browser

---

### 19. Security
- RBAC
- HTTPS
- Audit Logging
- Session Timeout
- Secure Workspace Activation

---

### 20. Acceptance Criteria
- Won customer appears in handover list.
- Checklist updates progress.
- Mandatory tasks enforced.
- Notifications sent.
- Reports export correctly.
- Workspace activates only after validation.
- Audit logs record all actions.


### Sales Reports PRD

#### Module Overview

Sales Reports module provides complete reporting and analytics for the
Sales Portal. It enables management to monitor lead generation,
conversions, revenue, demos, trials, proposals, sales representative
performance, and activity logs.

#### Navigation

Sales Portal → Sales Reports

#### Tabs

-   Leads
-   Conversions
-   Revenue
-   Demos
-   Trials
-   Proposals
-   Rep Performance
-   Activities

#### Leads Report

##### KPIs

-   Total Leads
-   New Leads
-   Active Pipeline
-   Won
-   Lost

##### Table Columns

-   Company
-   Sales Representative
-   Transport Niche
-   Estimated Revenue
-   Current Stage
-   Lead Score

##### Actions

-   Search
-   Filter
-   Export PDF
-   Export CSV/Excel

#### Conversion Funnel Report

##### Funnel Stages

-   New Lead
-   Contacted
-   Demo Booked
-   Demo Completed
-   Trial Started
-   Proposal Sent
-   Negotiation
-   Won
-   Lost

##### Metrics

-   Conversion Rate
-   Demo → Trial Rate
-   Proposal Acceptance Rate

#### Revenue Analytics

##### KPIs

-   Monthly MRR
-   Annual ARR
-   Pipeline Value

##### Charts

-   Revenue by Stage
-   Monthly Trend

#### Demo Bookings Report

##### KPIs

-   Total Demos
-   Upcoming
-   Completed

##### Table

-   Company
-   Presenter
-   Date
-   Time
-   Status
-   Rating

#### Trial Workspaces Report

##### KPIs

-   Active Trials
-   Expired Trials
-   Expiring Soon

##### Details

-   Company
-   Trial Period
-   Status
-   Usage

#### Licensing Proposals Report

##### KPIs

-   Total Proposals
-   Sent
-   Accepted
-   Total Proposal Value

##### Table

-   Company
-   Proposal Value
-   Total
-   Validity
-   Status

#### Rep Performance

##### KPIs

-   Active Reps
-   Leads
-   Pipeline
-   Won
-   Revenue

##### Table

-   Representative
-   Total Leads
-   Pipeline
-   Won Deals
-   Monthly Revenue

#### Activities Report

##### KPIs

-   Total Leads
-   Demos Logged
-   Trials Provisioned
-   Proposals Issued

#### Global Features

-   Date Range Filter
-   Search
-   Export PDF
-   Export CSV
-   Export Excel
-   Sorting
-   Pagination

#### Business Rules

-   Reports are role-based.
-   Metrics update from live CRM data.
-   Exports respect active filters.
-   Revenue uses proposal and subscription values.
-   Funnel updates automatically after stage changes.

#### Permissions

-   Sales Director: Full access
-   Sales Manager: View + Export
-   Sales Representative: Own records only

#### Audit Logs

Track: - Export actions - Filter changes - Report generation - User
access

#### Acceptance Criteria

-   Reports load correctly.
-   KPIs match database values.
-   Charts refresh automatically.
-   Export files are generated successfully.
-   Filters work across all tabs.



### Settings PRD

#### Module Overview

The Settings module provides centralized configuration for the Sales
Portal. Sales administrators can configure email templates, sales
pipeline stages, lead acquisition sources, and default CRM behavior.

------------------------------------------------------------------------

### Navigation

Sales Portal → Settings

------------------------------------------------------------------------

### Objectives

-   Standardize sales communication.
-   Configure CRM pipeline stages.
-   Maintain lead acquisition sources.
-   Reduce manual configuration.
-   Support reusable email templates.

------------------------------------------------------------------------

### Sections

#### 1. Email & Touchpoint Templates

##### Purpose

Manage reusable email templates used throughout the sales lifecycle.

##### Fields

-   Template Selector
-   Subject Line
-   Email Body Editor
-   Merge Tags Preview

##### Supported Templates

-   Welcome Sandbox Invite
-   Trial Invitation
-   Demo Confirmation
-   Proposal Email
-   Follow-up Reminder
-   Trial Expiry Reminder
-   Deal Won Welcome

##### Merge Tags

-   {{contact_name}}
-   {{company_name}}
-   {{rep_name}}
-   {{trial_end_date}}
-   {{proposal_link}}

##### Actions

-   Save Template
-   Preview Template
-   Reset Default

------------------------------------------------------------------------

#### 2. Pipeline Stages

##### Purpose

Configure CRM workflow stages.

##### Default Stages

1.  New Lead
2.  Contacted
3.  Demo Booked
4.  Demo Completed
5.  Trial Started
6.  Proposal Sent
7.  Negotiation
8.  Won
9.  Lost

##### Features

-   Add Stage
-   Rename Stage
-   Reorder Stage
-   Disable Stage
-   Delete Custom Stage

##### Validation

-   Default stages cannot be deleted.
-   Stage names must be unique.

------------------------------------------------------------------------

#### 3. Lead Acquisition Sources

##### Purpose

Manage available lead sources.

##### Default Sources

-   Google Search
-   LinkedIn
-   Partner Referral
-   Cold Call

##### Features

-   Add Source
-   Edit Source
-   Delete Custom Source
-   Activate/Deactivate Source

------------------------------------------------------------------------

### Business Rules

-   Template changes affect future emails only.
-   Pipeline changes apply to new CRM activities.
-   Deleted sources are hidden but preserved in history.
-   Merge tags are validated before saving.

------------------------------------------------------------------------

### Permissions

#### Sales Director

-   Full access

#### Sales Manager

-   View/Edit

#### Sales Representative

-   View only

------------------------------------------------------------------------

### Audit Logs

Track: - Template Updated - Stage Created - Stage Modified - Stage
Deleted - Source Added - Source Updated - Settings Saved

------------------------------------------------------------------------

### Database Tables

-   email_templates
-   pipeline_stages
-   lead_sources
-   audit_logs

------------------------------------------------------------------------

### APIs

-   GET /settings/templates
-   PUT /settings/templates
-   GET /settings/pipeline
-   POST /settings/pipeline
-   GET /settings/sources
-   POST /settings/sources

------------------------------------------------------------------------

### Acceptance Criteria

-   Templates save successfully.
-   Merge tags render correctly.
-   Pipeline updates immediately.
-   Lead sources are available in Lead forms.
-   Audit logs capture every configuration change.


### Driver-Dashboard-PRD.md

### Driver Dashboard

#### Module Overview

The Driver Dashboard is the primary landing page for authenticated
drivers. It provides a real-time operational overview including duty
status, assigned loads, schedule, HOS (Hours of Service), messages,
alerts, pay summary, and quick operational actions.

------------------------------------------------------------------------

### Business Objectives

-   Give drivers one centralized operational dashboard.
-   Reduce navigation time.
-   Display live dispatch information.
-   Improve HOS compliance.
-   Improve safety compliance.
-   Allow fast communication with dispatch.
-   Display current earnings and upcoming work.

------------------------------------------------------------------------

### Dashboard Header

##### Display

-   Driver Name
-   Driver Initials Avatar
-   Current Duty Status
-   Last Sync Timestamp
-   Assigned Vehicle
-   Vehicle Registration
-   Odometer Reading

Example

-   Welcome back, Noah Williams
-   Vehicle: TX-ROAD88
-   Freightliner Cascadia
-   Odometer: 245,678 km

------------------------------------------------------------------------

### Driver Status

Supported Statuses

-   On Duty
-   In Transit
-   On Break
-   Off Duty

Actions

-   Change Status
-   Save Status
-   Log Status History

Business Rules

-   Only one active status.
-   Status history must be logged.
-   Dispatch sees changes instantly.

------------------------------------------------------------------------

### Primary Action Buttons

-   Start Pre-Start Checklist
-   Message Dispatch
-   View My Loads
-   Upload Document
-   Clock In / Clock Out

------------------------------------------------------------------------

### KPI Cards

#### Loads Today

Displays: - Total Loads Today - Upcoming Loads - Next Load Time

#### Completed This Week

Displays: - Deliveries Completed - SLA Percentage

#### Drive Time Today

Displays: - Drive Time - Remaining HOS Hours

#### Diesel Balance

Displays: - Fuel Remaining - Estimated Range

#### Pay This Period

Displays: - Gross Pay - Before Tax

------------------------------------------------------------------------

### Status Filter

Supported Filters

-   All
-   On Duty
-   In Transit
-   Upcoming
-   Completed

------------------------------------------------------------------------

### Current Load Card

Displays

-   Load ID
-   Status
-   Pickup City
-   Delivery City
-   Pickup Time
-   Pickup Address
-   Delivery Time
-   Delivery Address
-   Load Type
-   Reference Number

Buttons

-   View Active Run
-   Upload Document

------------------------------------------------------------------------

### Today's Schedule

Display

-   Time
-   Activity
-   Location
-   Load ID

Activities

-   Pickup
-   Delivery
-   POD & Close

------------------------------------------------------------------------

### Next Load

Display

-   Date
-   Route
-   Load Number

------------------------------------------------------------------------

### HOS (Hours of Service)

Display

-   Next Break Due
-   Work Time Remaining
-   Shift Elapsed
-   Maximum Shift

Buttons

-   Log Rest Break
-   View HOS Logbook

Business Rules

-   Calculate automatically.
-   Alert before HOS violation.
-   Prevent illegal driving hours.

------------------------------------------------------------------------

### Messages

Display

-   Sender
-   Department
-   Time
-   Preview
-   Unread Count

Functions

-   Quick Reply
-   Send Message
-   View Conversation

------------------------------------------------------------------------

### Alerts

Examples

-   Pre-start Checklist Pending
-   Medical Certificate Expiring
-   Licence Expiry
-   Vehicle Maintenance
-   Document Expiry

Actions

-   View Alert
-   Mark Read

------------------------------------------------------------------------

### Pay Summary

Displays

-   Current Pay Period
-   Gross Earnings
-   Before Tax

Action

-   View Pay Summary

------------------------------------------------------------------------

### Notifications

-   New Load Assigned
-   Load Updated
-   Dispatch Message
-   HOS Warning
-   Safety Reminder
-   Payroll Ready
-   Document Expiry

------------------------------------------------------------------------

### Permissions

Driver Can

-   View Own Loads
-   Update Status
-   Upload Documents
-   Complete Checklist
-   Send Messages
-   View Pay
-   View HOS

Driver Cannot

-   Modify Loads
-   Edit Fleet
-   Change Payroll
-   Assign Drivers

------------------------------------------------------------------------

### Validation Rules

-   Driver must be Clocked In before starting work.
-   Checklist required before trip.
-   HOS must remain compliant.
-   Mandatory fields cannot be blank.
-   GPS must be enabled during active trip.

------------------------------------------------------------------------

### Database Tables

-   drivers
-   driver_status_logs
-   driver_dashboard
-   loads
-   load_assignments
-   hos_logs
-   driver_messages
-   alerts
-   payroll
-   documents

------------------------------------------------------------------------

### APIs

GET /driver/dashboard

GET /driver/loads

PUT /driver/status

GET /driver/schedule

GET /driver/messages

POST /driver/messages

GET /driver/pay

GET /driver/hos

POST /driver/documents

------------------------------------------------------------------------

### Audit Logs

Record

-   Status Changes
-   Checklist Started
-   Checklist Completed
-   Documents Uploaded
-   Messages Sent
-   Clock In
-   Clock Out
-   HOS Events

------------------------------------------------------------------------

### Acceptance Criteria

-   Dashboard loads within 3 seconds.
-   Driver sees only assigned information.
-   Status updates immediately.
-   Live load information is accurate.
-   HOS calculations are correct.
-   Alerts display correctly.
-   Messages sync successfully.
-   Pay summary matches payroll.
-   Audit logs record all actions.



### Safety-Checklist-PRD.md

### Safety Checklist (Pre-Start Inspection)

#### Module Overview

The Safety Checklist module ensures every driver completes a mandatory
pre-start inspection before commencing a trip. It verifies vehicle
roadworthiness, safety equipment, driver fitness, and Chain of
Responsibility (CoR) compliance.

------------------------------------------------------------------------

### Objectives

-   Improve fleet safety.
-   Ensure legal compliance.
-   Prevent unsafe vehicle operation.
-   Capture inspection history.
-   Record defects with evidence.

------------------------------------------------------------------------

### Navigation

Driver Portal → Start Pre-Start Checklist

------------------------------------------------------------------------

### Dashboard Header

Displays: - Checklist Status - Last Saved Timestamp - Sync Status - Next
Reminder - Vehicle - Trailer - Load Reference - Date & Time

------------------------------------------------------------------------

### Key Actions

-   Save Draft
-   Submit Checklist
-   Report Defect
-   Upload Photo
-   View History
-   Message Dispatch

------------------------------------------------------------------------

### Checklist Progress

Displays: - Total Items - Completed - Passed - Failed - N/A - Not
Checked - Progress Percentage

------------------------------------------------------------------------

### Inspection Categories

#### Vehicle & Equipment Checks

1.  Brakes (Service & Park Brake)
2.  Tyres -- Condition & Pressure
3.  Head / Tail / Brake / Reverse Lights
4.  Indicators & Hazard Lights
5.  Steering & Suspension
6.  Windscreen / Windows / Mirrors
7.  Wipers & Washer
8.  Horn
9.  Seat Belts / Airbags
10. Fire Extinguisher
11. First Aid Kit
12. Load Securement Equipment
13. Fluid Levels (Oil, Coolant, Brake Fluid)
14. Fuel Level
15. Oil / Fuel / Air Leaks
16. Body / Chassis / Coupling
17. Load Area Clear & Safe
18. Driver Fatigue / Fitness
19. Load Secured / Straps / Chains
20. Other Notes / Additional Checks

Each inspection item supports: - Pass (Yes) - Fail (No) - N/A - Optional
Notes - Photo Attachment

------------------------------------------------------------------------

### Defect Reporting

Fields - Defect Category - Severity - Description - Vehicle - Trailer -
Photos - GPS Location - Timestamp

Actions - Save Defect - Notify Dispatch - Create Maintenance Request

Business Rule: Any failed critical item blocks trip start until resolved
or overridden by an authorized manager.

------------------------------------------------------------------------

### Photo Upload

Supported Formats - JPG - PNG - HEIC

Rules - Maximum 10 MB per photo - Multiple photos allowed - Timestamp
stored - GPS metadata stored

Suggested Photos - Front - Rear - Left - Right - Cabin - Damage Area

------------------------------------------------------------------------

### Checklist Summary

Displays - Passed Count - Failed Count - N/A Count - Not Checked Count

------------------------------------------------------------------------

### Requirements

-   Complete all mandatory items.
-   Resolve failed safety-critical items.
-   Submit checklist before departure.
-   Keep inspection history.

------------------------------------------------------------------------

### History

Display - Inspection Date - Vehicle - Result - Pass % - Submitted By

Actions - View Details - Download PDF

------------------------------------------------------------------------

### Help & Resources

-   Safety Procedures
-   Vehicle Inspection Guide
-   Report Incident
-   Contact Support

------------------------------------------------------------------------

### Notifications

-   Daily Checklist Reminder
-   Checklist Submitted
-   Checklist Rejected
-   Critical Defect Found
-   Maintenance Created

------------------------------------------------------------------------

### Permissions

Driver - Complete Checklist - Upload Photos - Report Defect - View
History

Dispatcher - View Submitted Checklists

Fleet Manager - Review - Approve - Reject - Create Maintenance Job

------------------------------------------------------------------------

### Validation Rules

-   Mandatory items cannot remain unchecked.
-   Driver must be clocked in.
-   Vehicle must be assigned.
-   Critical failures require defect report.
-   Photos required for reported defects.

------------------------------------------------------------------------

### Database Tables

-   safety_checklists
-   checklist_items
-   checklist_photos
-   defect_reports
-   maintenance_requests
-   vehicles
-   trailers
-   audit_logs

------------------------------------------------------------------------

### APIs

-   GET /driver/checklist
-   POST /driver/checklist
-   PUT /driver/checklist
-   POST /driver/checklist/photos
-   POST /driver/defects
-   GET /driver/checklist/history

------------------------------------------------------------------------

### Audit Logs

Track: - Checklist Started - Draft Saved - Checklist Submitted - Defect
Reported - Photos Uploaded - Maintenance Triggered

------------------------------------------------------------------------

### Acceptance Criteria

-   Driver cannot start work without mandatory checklist.
-   Progress updates in real time.
-   Failed critical items create alerts.
-   Photos upload successfully.
-   Inspection history is searchable.
-   Audit trail records every action.





### Assigned-Jobs-PRD.md

### Assigned Jobs Module PRD

Version: 1.0
Module: Driver Portal → Assigned Jobs

---

### 1. Module Overview

The Assigned Jobs module is the driver's primary workspace for viewing, managing, and tracking all freight loads assigned to them.

It allows drivers to:

- View upcoming loads
- Monitor active jobs
- Review completed loads
- View cancelled jobs
- Search assigned work
- Filter loads
- Create load requests (Owner Driver Mode)
- Edit permitted load information
- Sync latest dispatch updates

This module acts as the central job management screen before Pickup & Loading begins.

---

### 2. Objectives

- Display every assigned load.
- Reduce missed pickups.
- Improve driver planning.
- Provide quick load search.
- Enable dispatch communication.
- Allow owner drivers to request loads.
- Keep job information synchronized.

---

### 3. Navigation

Driver Portal

→ Assigned Jobs

---

### 4. Dashboard Summary Cards

Display the following KPI cards.

#### Upcoming Loads

Purpose

Shows upcoming scheduled jobs.

Display

- Total Upcoming Loads
- Change Indicator
- Next Pickup Time

Example

Upcoming

2

Next:
08:00 AM Today

---

#### In Progress

Purpose

Displays currently active loads.

Display

- Active Loads
- Status

Example

In Progress

2

Active Loads

---

#### Completed

Purpose

Shows completed deliveries.

Display

- Completed Count
- Weekly SLA

Example

Completed

3

100% SLA

---

#### Cancelled

Purpose

Cancelled assignments.

Display

- Cancelled Count

---

#### Total Jobs

Displays

- Total Assigned Jobs

---

### 5. Search

Search Placeholder

Search by:

- Load ID
- Reference Number
- Customer
- Pickup
- Delivery
- Route

Search updates instantly.

---

### 6. Job Tabs

Tabs

- All
- Upcoming
- In Progress
- Completed
- Cancelled

Selecting a tab filters jobs.

---

### 7. Job Table

Columns

- Load ID
- Status
- Route
- Pickup
- Delivery
- Load Type
- Stops
- Date
- Time
- Reference Number
- Actions

---

### 8. Status Definitions

Upcoming

Load not started.

In Progress

Driver has started.

Completed

Delivery finished.

Cancelled

Dispatch cancelled load.

---

### 9. Job Actions

Each job supports:

- View Details
- Edit (if permitted)
- Open Pickup Workflow
- Open Active Run
- View Route
- Contact Dispatch

---

### 10. Create New Load Request

Purpose

Owner Drivers can request new work.

Fields

Origin City

Destination City

Pickup Address

Delivery Address

Pickup Date

Pickup Time

Delivery Date

Delivery Time

Customer

Reference Number

Load Type

Stops

Notes

Buttons

Cancel

Submit Request

---

### 11. Edit Assigned Job

Editable Fields

Pickup

Delivery

Customer

Stops

Reference

Notes

Status

Buttons

Cancel

Save Changes

Only editable before dispatch.

---

### 12. Filters

Filter By

Status

Load Type

Date

Customer

Route

Stops

Reference

---

### 13. Pagination

Display

Current Page

Total Pages

Rows Per Page

Next

Previous

---

### 14. Refresh Controls

Actions

Refresh List

Sync Now

Auto Refresh

Display

Last Sync Time

Connection Status

Refresh Interval

Example

Every 5 Minutes

---

### 15. Quick Actions

Buttons

Refresh List

Message Dispatch

View Calendar

Sync Now

---

### 16. Load Detail Preview

Clicking a row opens preview.

Information

Load ID

Pickup

Delivery

Reference

Vehicle

Trailer

Stops

Load Type

Status

Customer

Assigned Date

Notes

---

### 17. Business Rules

Only assigned loads appear.

Completed loads become read-only.

Cancelled jobs cannot be started.

Only dispatch can assign loads.

Owner Driver mode can submit requests.

---

### 18. Notifications

Driver receives notifications for:

New Assignment

Load Updated

Pickup Changed

Delivery Changed

Load Cancelled

Dispatch Message

---

### 19. Permissions

Driver

View Jobs

Search

Filter

Edit Allowed Fields

Create Load Request (Owner Driver)

Dispatcher

Assign Jobs

Modify Jobs

Cancel Jobs

Fleet Manager

View All

Override

Reassign

---

### 20. Validation Rules

Pickup required.

Delivery required.

Reference must be unique.

Date cannot be invalid.

Completed jobs cannot be edited.

Cancelled jobs cannot be restarted.

---

### 21. Database Tables

loads

load_assignments

drivers

customers

vehicles

trailers

stops

load_notes

dispatch_messages

audit_logs

---

### 22. APIs

GET /driver/jobs

GET /driver/jobs/:id

POST /driver/job-request

PUT /driver/jobs/:id

GET /driver/jobs/search

GET /driver/jobs/filter

POST /driver/jobs/sync

---

### 23. Audit Logs

Track

Job Assigned

Job Edited

Request Submitted

Status Updated

Sync Executed

Dispatch Viewed

Search Performed

Filter Applied

---

### 24. Acceptance Criteria

✓ Driver sees all assigned jobs.

✓ Search returns accurate records.

✓ Filters work correctly.

✓ Summary cards update automatically.

✓ Owner Driver can submit load requests.

✓ Editing follows permission rules.

✓ Sync updates latest dispatch information.

✓ Audit logs record every important action.

✓ Responsive across Desktop, Tablet, and Mobile.

✓ Integrated with Pickup & Loading workflow.




### Pickup & Loading Module PRD

Version: 1.0
Module: Driver Portal → Pickup & Loading

---

### 1. Module Overview

The Pickup & Loading module manages the complete pickup workflow for every assigned vehicle before dispatch.

Drivers can:

- View pickup location
- Scan VIN barcodes
- Verify assigned vehicles
- Add owner-driver vehicles
- Remove incorrect vehicles
- Edit vehicle details
- Capture pickup photos
- Confirm pickup completion
- Validate load before dispatch

Every pickup action is GPS, timestamp and audit logged.

---

### 2. Objectives

- Prevent loading incorrect vehicles.
- Verify every VIN.
- Ensure all assigned vehicles are collected.
- Maintain Chain of Responsibility (CoR).
- Prepare load for dispatch.
- Capture complete pickup evidence.

---

### 3. Navigation

Driver Portal

→ Pickup & Loading

---

### 4. Header Information

Display

Load ID

Route

Pickup Time

Estimated Finish

Load Type

Truck

Trailer

Driver

Current Mode

Auto Save Status

Example

LD-3987

Melbourne

↓

Sydney

Pickup
08:00 AM

Truck

TRK-101

Trailer

TRL-205

Auto Save Enabled

---

### 5. Pickup Summary

Display

Pickup Location

Total Cars

Picked Up

Remaining

Completion %

Dispatch Status

Example

Total Cars

8

Picked Up

3

Remaining

5

38%

---

### 6. Pickup Location Card

Display

Pickup Company

Street Address

Google Map Link

Directions

Contact Person

Phone Number

Special Instructions

---

### 7. Driver Mode

Supported Modes

Assigned Driver Mode

Owner Driver Mode

Assigned Mode

Driver cannot modify assigned vehicles.

Owner Driver Mode

Driver may

Add Cars

Remove Cars

Edit Destinations

Edit Vehicle Details

Switch Modes

Assigned

↓

Owner Driver

---

### 8. Vehicle Groups

Vehicles grouped by delivery stop.

Example

DROP 1

Auto World Sydney

DROP 2

Newcastle Motors

DROP 3

Gold Coast Autos

DROP 4

Brisbane Depot

Each section displays

Number of Cars

Destination

Completion

---

### 9. Vehicle Card

Each vehicle displays

VIN

Registration

Make

Model

Colour

Destination

Pickup Status

Pickup Time

Current Deck

Photo Status

Damage Flag

Example

Toyota Camry

VIN

1HGCM82633A004352

ABC123

Picked Up

08:12 AM

---

### 10. Vehicle Status

Possible Status

Not Picked Up

Picked Up

Wrong Vehicle

Removed

Added

Damaged

---

### 11. VIN Barcode Scanner

Purpose

Scan VIN using device camera.

Scanner Features

Live Camera

Flash

Auto Focus

1080p HD

Manual VIN Entry

Barcode Recognition

Vehicle Selection

Buttons

Open Scanner

Scan VIN

Flash

Cancel

---

### 12. VIN Validation Rules

If VIN belongs to assigned load

Mark Picked Up

If VIN not assigned

Show

Wrong Vehicle

Blocked

Driver cannot continue.

Message

Vehicle not assigned to this pickup.

---

### 13. Manual VIN Entry

Fields

VIN

Search

Validate

Mark Picked Up

---

### 14. Add Vehicle

Owner Driver only.

Fields

Drop Location

Make

Model

VIN

Registration

Colour

Year

Customer

Buttons

Save

Cancel

---

### 15. Edit Vehicle

Editable

Destination

Registration

Colour

Notes

Buttons

Save

Cancel

---

### 16. Remove Vehicle

Owner Driver only.

Confirmation Required

Reason

Vehicle unavailable

Cancelled

Customer Request

Wrong Assignment

Other

---

### 17. Pickup Photos

Driver may upload

Front

Rear

Left

Right

Interior

Damage

VIN Plate

Loading Position

Rules

Maximum 10MB

JPG

PNG

HEIC

Unlimited Company Limit

GPS Tagged

Timestamp Stored

---

### 18. Damage Reporting

Fields

Damage Type

Severity

Description

Photos

Location

Customer Signature

Dispatch Notification

---

### 19. Auto Save

Every action saves automatically.

Examples

VIN Scanned

Photo Uploaded

Vehicle Added

Vehicle Removed

Vehicle Edited

GPS Updated

---

### 20. Pickup Progress

Display

Total Cars

Scanned

Remaining

Percentage

Example

8 Cars

3 Picked Up

5 Remaining

38%

Progress Bar

---

### 21. Pickup Completion Rules

Before completion

Every assigned vehicle scanned.

No invalid VIN.

Required photos uploaded.

Mandatory checks completed.

---

### 22. Confirm Pickup

Button

Confirm All Cars Picked Up

Confirmation

All assigned vehicles collected.

Continue?

Buttons

Yes

Cancel

---

### 23. Completion Workflow

Vehicle Pickup

↓

Pickup Complete

↓

Dispatch Ready

↓

Driver returns to Active Run

↓

Dispatch Button Enabled

---

### 24. Quick Actions

Scan VIN

Add Vehicle

Call Dispatch

View Load

Open Yard Map

Directions

Upload Photo

Report Damage

---

### 25. Business Rules

Wrong VIN cannot be accepted.

Every pickup recorded.

Every scan stores GPS.

Vehicle cannot be dispatched twice.

Dispatch unavailable until pickup complete.

Owner Driver permissions override vehicle editing.

---

### 26. Notifications

Vehicle Picked Up

Wrong Vehicle

Pickup Completed

Dispatch Ready

Damage Report Submitted

Photo Uploaded

Vehicle Added

Vehicle Removed

---

### 27. Permissions

Driver

Scan VIN

Upload Photos

Report Damage

Confirm Pickup

Dispatcher

View Pickup Progress

Fleet Manager

Override Pickup

Add Vehicle

Approve Changes

---

### 28. Database Tables

loads

load_items

pickup_events

pickup_photos

pickup_damage_reports

vehicles

vehicle_scans

gps_logs

audit_logs

---

### 29. APIs

GET /driver/pickup

POST /driver/pickup/scan

POST /driver/pickup/manual

POST /driver/pickup/photo

POST /driver/pickup/add-vehicle

PUT /driver/pickup/edit-vehicle

DELETE /driver/pickup/remove-vehicle

POST /driver/pickup/complete

GET /driver/pickup/status

---

### 30. Audit Logs

Track

VIN Scanned

Manual VIN Entered

Wrong Vehicle

Vehicle Added

Vehicle Removed

Vehicle Edited

Photo Uploaded

Damage Report

Pickup Completed

GPS Recorded

Dispatch Enabled

---

### 31. Acceptance Criteria

✓ Driver can scan VIN successfully.

✓ Wrong VIN is rejected.

✓ Pickup progress updates instantly.

✓ Auto Save works for every action.

✓ GPS stored for every pickup.

✓ Photos upload successfully.

✓ Owner Driver permissions work correctly.

✓ Pickup cannot complete until all assigned vehicles are collected.

✓ Dispatch activates only after pickup completion.

✓ Full audit trail maintained.




### Dispatch & Active Run Module PRD

Version: 1.0
Module: Driver Portal → Dispatch & Active Run

---

### 1. Module Overview

The Dispatch & Active Run module manages the driver's journey after completing pickup. Once all assigned vehicles have been successfully scanned and loaded, the driver dispatches the load and begins the transport journey.

This module provides:

- Dispatch Confirmation
- Active Run Dashboard
- GPS Navigation
- Route Progress
- Next Stop Management
- Vehicle Tracking
- ETA Monitoring
- Customer Notifications
- Driver Notes
- Incident Reporting
- Live Status Updates

All dispatch activities are automatically GPS and timestamp logged.

---

### 2. Objectives

- Start transport legally.
- Record dispatch location.
- Track driver progress.
- Update customers automatically.
- Provide live navigation.
- Maintain complete audit trail.

---

### 3. Navigation

Driver Portal

→ Dispatch & Active Run

---

### 4. Dashboard Header

Display

- Load ID
- Route
- Pickup Time
- Estimated Finish
- Truck
- Trailer
- Driver
- Current Status

Example

LD-3987

Melbourne VIC

↓

Sydney NSW

Truck

MAN TGX 26.580

Trailer

TRL-205

Status

Ready to Dispatch

---

### 5. Progress Tracker

Three-step workflow

✓ Picked Up

↓

Dispatch

↓

Delivered

Display

- Picked Up Vehicles
- Dispatch Status
- Delivered Vehicles

Example

Picked Up

8 / 8

Dispatch

Pending

Delivered

0 / 8

---

### 6. Dispatch Readiness

Dispatch button becomes available only when:

- All assigned vehicles picked up
- VIN validation completed
- Required photos uploaded
- Mandatory checklist completed
- No critical defects exist

---

### 7. Next Stop Card

Display

- Destination
- Address
- Contact Person
- Phone Number
- ETA
- Distance Remaining
- Delivery Instructions

Actions

- Directions
- Call Contact

---

### 8. Dispatch Confirmation Modal

Title

Confirm Leave Yard & Dispatch

Display

- Load ID
- Pickup Yard
- Pickup Status
- Total Vehicles
- GPS Location
- Current Time

Departure Checklist

- All vehicles secured
- Straps checked
- Height clearance verified
- Gate pass verified
- Shipping documents verified

Buttons

- Confirm Leave Yard & Dispatch
- Cancel

---

### 9. Dispatch Process

Workflow

Pickup Complete

↓

Dispatch Confirmation

↓

GPS Recorded

↓

Timestamp Recorded

↓

Customer Notification

↓

Dispatch Notification

↓

Load Status = In Transit

↓

Driver Navigation Starts

---

### 10. Dispatch Success Screen

Display

- Dispatch Successful
- Departure Time
- GPS Coordinates
- Origin Yard
- Total Vehicles
- Customer Notification Status

Buttons

- Open GPS Navigation
- View Active Run
- Close

---

### 11. Active Run Dashboard

Display

- Pickup Location
- Delivery Location
- Total Cars
- Truck
- Trailer
- Driver
- Status
- Distance Remaining
- ETA

---

### 12. Vehicle Summary

Display

- Total Cars
- Picked Up
- Delivered
- Remaining

Vehicle status updates automatically.

---

### 13. GPS Navigation

Display

- Destination
- Distance
- ETA
- Estimated Arrival

Buttons

- Open Google Maps
- Open Waze

---

### 14. Route Tracking

System tracks

- Current GPS
- Speed
- Heading
- Distance Travelled
- Distance Remaining
- Live ETA

Auto Refresh

Every 30 seconds

---

### 15. Driver Status

Available Status

- Ready
- Dispatched
- In Transit
- On Break
- Arrived
- Delivered
- Completed

Status updates automatically.

---

### 16. Quick Actions

Buttons

- Scan Vehicles
- Upload Photo
- Add Job Note
- Message Dispatch
- Report Issue
- Call Dispatch
- Open Navigation

---

### 17. Scan / Select Vehicles

Displays all assigned vehicles.

Information

- Make
- Model
- VIN
- Deck Position
- Scan Status

Button

Confirm All Scanned Vehicles

---

### 18. Photo Upload

Supported Photos

- Vehicle
- Damage
- Load Position
- Trailer
- Incident

Formats

- JPG
- PNG
- HEIC

Maximum Size

10 MB

GPS and Timestamp stored automatically.

---

### 19. Driver Notes

Fields

- Note
- Category
- Visibility

Categories

- Pickup
- Delivery
- Delay
- Customer
- Vehicle
- Incident

---

### 20. Report Issue

Issue Types

- Breakdown
- Traffic
- Accident
- Vehicle Damage
- Customer Delay
- Weather
- Other

Attachments

- Photos
- Notes
- GPS

Automatically notify Dispatch.

---

### 21. Customer Notifications

Automatically send

- Load Dispatched
- Driver En Route
- ETA Updated
- Delay Notification
- Arrival Notification

Methods

- SMS
- Email
- Push Notification

---

### 22. Live Sync

Display

- Last Sync Time
- Connection Status

Buttons

- Sync Now

Auto Sync

Every 30 Seconds

---

### 23. Business Rules

- Dispatch allowed only after pickup completion.
- GPS mandatory during dispatch.
- Every dispatch recorded.
- Customer notified automatically.
- Dispatch cannot be reversed without manager approval.
- ETA recalculated continuously.

---

### 24. Notifications

Driver receives

- Route Updated
- Traffic Alert
- Customer Message
- Dispatch Message
- Delay Warning
- Delivery Reminder

---

### 25. Permissions

Driver

- Dispatch Load
- Navigate
- Upload Photos
- Add Notes
- Report Issue

Dispatcher

- Monitor Run
- Send Messages
- Update Route

Fleet Manager

- Override Dispatch
- View Live Tracking
- Reassign Load

---

### 26. Database Tables

- loads
- load_dispatch
- driver_runs
- gps_tracking
- run_notes
- run_photos
- route_updates
- customer_notifications
- audit_logs

---

### 27. APIs

GET /driver/run

POST /driver/run/dispatch

POST /driver/run/photo

POST /driver/run/note

POST /driver/run/report-issue

POST /driver/run/status

GET /driver/run/navigation

GET /driver/run/tracking

POST /driver/run/sync

---

### 28. Audit Logs

Track

- Dispatch Started
- GPS Recorded
- Dispatch Confirmed
- Navigation Opened
- Route Updated
- ETA Changed
- Issue Reported
- Note Added
- Photo Uploaded
- Customer Notified

---

### 29. Acceptance Criteria

✓ Driver cannot dispatch before pickup completion.

✓ Dispatch records GPS automatically.

✓ Timestamp recorded correctly.

✓ Customer receives dispatch notification.

✓ Navigation opens correctly.

✓ Route updates in real time.

✓ Driver notes save successfully.

✓ Issues notify dispatch instantly.

✓ ETA recalculates continuously.

✓ Complete audit trail maintained.

✓ Responsive on Mobile, Tablet and Desktop.

✓ Fully integrated with Pickup & Loading and Delivery & POD modules.


### Delivery & POD Module PRD

Version: 1.0

Module:
Driver Portal → Delivery & POD

---

### 1. Module Overview

The Delivery & Proof of Delivery (POD) module manages the complete delivery workflow after the driver reaches the destination.

The module ensures:

- Correct vehicle delivery
- VIN verification
- Delivery confirmation
- Vehicle inspection
- Damage recording
- Delivery photographs
- Customer signature
- POD generation
- Customer notification
- Load completion

Every action performed inside this module is automatically GPS tagged, timestamped and audit logged.

---

### 2. Objectives

- Deliver the correct vehicle.
- Verify VIN before handover.
- Capture delivery evidence.
- Collect customer signature.
- Record damages if found.
- Generate legal Proof of Delivery.
- Close transport job.

---

### 3. Navigation

Driver Portal

↓

Delivery & POD

---

### 4. Dashboard Header

Display

- Load ID
- Route
- Driver
- Truck
- Trailer
- Total Vehicles
- Delivered Vehicles
- Remaining Vehicles
- Delivery Status

---

### 5. Delivery Summary

Display

- Total Cars
- Delivered
- Remaining
- Delivery Location
- Customer Name
- ETA
- Arrival Time

---

### 6. Delivery Stops

Display

- Stop Number
- Customer Name
- Delivery Address
- Contact Person
- Contact Number
- Instructions

Actions

- Open Navigation
- Call Customer

---

### 7. Vehicle Delivery List

Each vehicle displays

- Make
- Model
- VIN
- Registration
- Deck Position
- Delivery Status
- Damage Status

Status

- Pending
- Ready
- Delivered
- Refused
- Damaged

---

### 8. VIN Verification

Driver must scan VIN before unloading.

Methods

- Camera Scanner
- Manual VIN Entry

Rules

Correct VIN

↓

Allow Delivery

Wrong VIN

↓

Show Error

↓

Block Delivery

---

### 9. Vehicle Inspection

Driver checks

- Exterior
- Interior
- Glass
- Wheels
- Lights
- Accessories
- Existing Damage
- New Damage

---

### 10. Damage Report

Fields

Damage Type

Severity

Description

Photos

Customer Comments

Driver Notes

GPS

Timestamp

Buttons

Save Damage Report

Notify Dispatch

---

### 11. Delivery Photos

Mandatory Photos

Front

Rear

Left Side

Right Side

VIN Plate

Delivered Position

Damage Photos (If Required)

Rules

JPG

PNG

HEIC

Maximum 10MB

GPS Tagged

Timestamp Stored

---

### 12. Customer Signature POD

Purpose

Collect customer's digital signature as proof of successful delivery.

Fields

Receiver Full Name *

Example

Mark Robinson

Signature Pad *

Draw Signature

Buttons

Clear Drawing

Save Signature

Validation

Receiver name mandatory

Signature mandatory

GPS mandatory

Timestamp mandatory

Business Rules

Customer cannot complete delivery without signature unless company policy allows "Signature Exception".

---

### 13. Signature Exception

Available only for authorized users.

Reasons

Customer Refused

Contactless Delivery

After Hours Delivery

Unable to Sign

Lost Device

Manager Approval Required

---

### 14. Delivery Notes

Fields

Customer Notes

Driver Notes

Delivery Comments

Special Instructions

---

### 15. Customer Confirmation

Customer confirms

Vehicle Received

Condition Accepted

Damage Report Acknowledged

Signature Completed

---

### 16. POD Generation

Generate

Proof Of Delivery PDF

Includes

Company Logo

Driver

Vehicle

VIN

Photos

GPS

Timestamp

Receiver

Digital Signature

Notes

Damage Report

QR Verification

---

### 17. POD Preview

Driver can

View POD

Download PDF

Share PDF

Email Customer

Print POD

---

### 18. Customer Notification

Automatically send

Delivery Completed

POD PDF

Invoice Trigger

SMS

Email

Push Notification

---

### 19. Complete Delivery

Button

Complete Delivery

System performs

VIN Validation

↓

Photo Validation

↓

Signature Validation

↓

POD Generated

↓

Customer Notified

↓

Delivery Completed

---

### 20. Close Load

Available only after

All Vehicles Delivered

All POD Completed

All Signatures Saved

All Photos Uploaded

Actions

Close Load

Return Dashboard

---

### 21. Quick Actions

Scan VIN

Take Photo

Upload Photo

Capture Signature

Generate POD

Call Dispatch

Open Navigation

Report Damage

---

### 22. Business Rules

Wrong VIN cannot be delivered.

Signature mandatory.

Photos mandatory.

GPS mandatory.

Timestamp mandatory.

POD generated automatically.

Load closes only after all vehicles delivered.

---

### 23. Notifications

Delivery Completed

POD Generated

Signature Captured

Customer Notified

Damage Report Submitted

Dispatch Updated

Load Closed

---

### 24. Permissions

Driver

Deliver Vehicle

Capture Photos

Capture Signature

Generate POD

Dispatcher

View Delivery

View POD

Fleet Manager

Override Completion

Approve Exceptions

Reopen Delivery

---

### 25. Database Tables

delivery_events

delivery_items

delivery_photos

delivery_damage_reports

customer_signatures

pod_documents

vehicle_delivery_logs

gps_tracking

audit_logs

---

### 26. APIs

GET /driver/delivery

POST /driver/delivery/scan

POST /driver/delivery/photo

POST /driver/delivery/signature

POST /driver/delivery/damage

POST /driver/delivery/complete

GET /driver/pod

GET /driver/pod/pdf

POST /driver/load/close

---

### 27. Audit Logs

Track

Vehicle Delivered

VIN Verified

Photo Uploaded

Signature Captured

Damage Report

POD Generated

Customer Notified

Load Closed

---

### 28. Acceptance Criteria

✓ Driver can verify VIN.

✓ Wrong VIN blocked.

✓ Delivery photos upload successfully.

✓ Customer signature saved.

✓ GPS stored.

✓ Timestamp stored.

✓ POD PDF generated automatically.

✓ Customer receives POD.

✓ Load closes successfully.

✓ Complete audit history maintained.


### Fuel-&-Expenses-PRD.md

### Fuel & Expenses Module PRD

Version: 1.0

Module:
Driver Portal → Fuel & Expenses

---

### 1. Module Overview

The Fuel & Expenses module enables drivers to record all operating expenses during a trip, upload supporting receipts, capture odometer readings, monitor fuel consumption, and provide real-time cost visibility to Dispatch, Fleet, and Accounts teams.

All expense transactions are linked to the active load, assigned vehicle, and driver profile. Every expense entry is GPS-tagged, timestamped, and included in reimbursement and profitability reports.

---

### 2. Objectives

- Record fuel purchases.
- Record maintenance expenses.
- Record tyre expenses.
- Record toll expenses.
- Record miscellaneous operating expenses.
- Upload receipts immediately.
- Track fuel efficiency.
- Calculate cost per kilometre.
- Support reimbursement workflow.
- Improve trip profitability reporting.

---

### 3. Navigation

Driver Portal

↓

Fuel & Expenses

---

### 4. Header Information

Display

- Module Name
- Active Load
- Current Vehicle
- Current Trailer
- Driver
- Load Status

---

### 5. Vehicle & Load Information

Display

Truck

Trailer

Active Load

Load Type

Load ID

Current Route

Current Odometer

Distance Remaining

Trip Progress

Start Date

Estimated Finish Date

Status

Example

Truck

TRK-101

MAN TGX 26.580

Trailer

TRL-305

Load

LD-3987

Melbourne

↓

Sydney

---

### 6. Status Card

Display

Last Sync

Connection Status

Auto Refresh

Sync Button

Example

Online

Last Sync

29 May 2025

10:15 AM

Auto Refresh

Every 5 Minutes

---

### 7. Key Actions

Buttons

➕ Add Expense

📄 Upload Receipt

📟 Capture Odometer

📊 View Reports

🔄 Sync Now

---

### 8. Dashboard Summary Cards

Display

Fuel Used Today

Total Spent Today

Average Fuel Economy

Cost Per Kilometre

Example

Fuel Used

68 L

Today

Total Spent

$312.50

Average Economy

2.08 km/L

Cost Per KM

$1.46

---

### 9. Expense Categories

Supported Categories

Fuel

Maintenance

Tyres

Tolls

Other

Each category has

- Color Indicator
- Icon
- Total Cost
- Expense Count

---

### 10. Expense List

Each expense displays

Category

Vendor

Location

Date

Time

Odometer

Litres

Price

Status

Receipt

Approval Status

Example

Fuel

BP Service Centre

Yass NSW

68 L

$139.40

Approved

---

### 11. Add Expense

Fields

Category *

Vendor / Location *

Amount *

Fuel Quantity (L)

Current Odometer

Date

Time

Expense Notes

Receipt Attachment

Buttons

Cancel

Save Expense

---

### 12. Expense Validation

Amount Required

Category Required

Vendor Required

Receipt Optional

Fuel Quantity Required (Fuel Only)

Odometer Required

No negative values allowed.

---

### 13. Receipt Upload

Supported Formats

JPG

PNG

PDF

Maximum Size

10 MB

Driver may

Capture Photo

Browse File

Replace Receipt

Delete Receipt

View Receipt

---

### 14. Receipt Gallery

Displays

Receipt Thumbnail

Vendor

Expense Date

Amount

Upload Status

Actions

View

Replace

Delete

Download

---

### 15. Odometer Capture

Purpose

Capture latest odometer reading.

Fields

Current Odometer (km)

Buttons

Save Reading

Validation

Reading must always increase.

---

### 16. Analytics

Displays

Fuel Efficiency

Trip Range

Cost Efficiency Score

Average Fuel Consumption

Cost per Kilometre

Average Expense per Day

Fuel Trend

Expense Trend

---

### 17. Category Cost Breakdown

Displays

Fuel

Maintenance

Tyres

Tolls

Other

Shows

Dollar Value

Percentage

Pie Chart

---

### 18. Expense Summary

Displays

Fuel Total

Maintenance Total

Tyres Total

Tolls Total

Other Total

Grand Total

---

### 19. Reports

Driver can

View Trip Report

Export PDF

Export Excel

Share Report

Download Report

---

### 20. Trip Expense Report

Includes

Trip Details

Driver

Truck

Load

Fuel Used

Fuel Cost

Maintenance Cost

Tyre Cost

Toll Cost

Other Cost

Total Cost

Cost Per KM

Average Fuel Economy

Receipt Summary

Approval Status

---

### 21. Expense Alerts

Examples

Receipt Missing

Duplicate Expense

Fuel Quantity Missing

Pending Approval

Rejected Expense

Actions

Upload Receipt

Edit Expense

---

### 22. Business Rules

Every expense belongs to one load.

Every expense belongs to one driver.

Fuel entries require litres.

Receipt recommended for reimbursement.

Expenses become read-only after approval.

Managers can reject expenses.

---

### 23. Notifications

Expense Logged

Receipt Uploaded

Expense Approved

Expense Rejected

Receipt Missing

Expense Edited

---

### 24. Permissions

Driver

Create Expense

Upload Receipt

Capture Odometer

View Reports

Dispatcher

View Only

Accounts

Approve Expense

Reject Expense

Fleet Manager

View Reports

Audit Expenses

---

### 25. Database Tables

expenses

expense_categories

expense_receipts

fuel_logs

odometer_logs

trip_reports

drivers

loads

vehicles

audit_logs

---

### 26. APIs

GET /driver/expenses

POST /driver/expenses

PUT /driver/expenses/:id

DELETE /driver/expenses/:id

POST /driver/expenses/receipt

POST /driver/odometer

GET /driver/expenses/report

GET /driver/expenses/analytics

---

### 27. Audit Logs

Track

Expense Created

Expense Updated

Expense Deleted

Receipt Uploaded

Receipt Replaced

Receipt Deleted

Odometer Captured

Expense Approved

Expense Rejected

Report Exported

---

### 28. Acceptance Criteria

✓ Driver can create expenses.

✓ Fuel expenses calculate litres correctly.

✓ Cost per kilometre updates automatically.

✓ Fuel efficiency updates instantly.

✓ Receipts upload successfully.

✓ Odometer validation works.

✓ Reports export correctly.

✓ Approval workflow functions correctly.

✓ Full audit trail maintained.

✓ Responsive across Mobile, Tablet, and Desktop.


### Messages Module PRD

Version: 1.0

Module:
Driver Portal → Messages

---

### 1. Module Overview

The Messages module provides secure real-time communication between Drivers, Dispatch, Customers, Yard Staff, Fleet Managers, Safety Team, Maintenance Team, Accounts, and System Notifications.

The messaging system allows drivers to communicate instantly without leaving the application.

All conversations are encrypted, synchronized in real time, and stored with complete audit history.

---

### 2. Objectives

- Enable real-time communication.
- Reduce phone calls.
- Improve dispatch coordination.
- Keep conversations linked to loads.
- Support quick communication templates.
- Maintain secure communication records.
- Provide instant notifications.

---

### 3. Navigation

Driver Portal

↓

Messages

---

### 4. Dashboard Header

Display

- Module Name
- Current Driver
- Active Load
- Truck
- Trailer
- Online Status
- Last Sync Time

---

### 5. Vehicle & Load Information

Display

Truck

Trailer

Load ID

Load Type

Current Route

Current Status

Example

Truck

TRK-101

Trailer

TRL-305

Load

LD-3987

Melbourne

↓

Sydney

---

### 6. Status Panel

Display

Online Status

Last Sync

Auto Refresh

Sync Button

Example

Online

Last Sync

29 May 2025

10:15 AM

Auto Refresh

Every 5 Minutes

---

### 7. Key Actions

Buttons

📝 New Message

👥 Quick Contacts

📋 Message Templates

📄 View Load Details

⚠ Report Issue

🔄 Sync Now

---

### 8. Search

Search By

- Contact Name
- Company
- Load ID
- Customer
- Dispatch
- Message Text

Instant Search supported.

---

### 9. Filters

Available Filters

All

Unread

Read

Important

Groups

Archived

System Notifications

---

### 10. Conversation List

Each conversation displays

Profile Icon

Name

Role

Latest Message

Associated Load

Timestamp

Unread Count

Priority Badge

Status

Example

Dispatch Support

Unread

LD-3987

10:15 AM

2 Unread

---

### 11. Conversation Types

Supported Types

Driver ↔ Dispatch

Driver ↔ Customer

Driver ↔ Yard

Driver ↔ Fleet

Driver ↔ Accounts

Driver ↔ Maintenance

Driver ↔ Safety

Driver Groups

Broadcast Messages

System Notifications

---

### 12. Conversation Screen

Display

Recipient

Online Status

Load Reference

Message History

Read Status

Typing Indicator

Attachments

Timestamp

Delivery Status

---

### 13. Send New Message

Fields

Recipient *

Message *

Attachment

Priority

Related Load

Buttons

Cancel

Send Message

---

### 14. Message Types

Supported

Text

Photo

Document

PDF

Location

System Alert

Quick Template

---

### 15. Attachments

Supported Files

JPG

PNG

PDF

DOCX

Maximum Size

20 MB

Actions

Upload

Preview

Download

Delete

---

### 16. Quick Contacts

Categories

Dispatch

Pickup Yard

Delivery Customer

Fleet Maintenance

Safety Officer

Accounts

Branch Office

Emergency Contact

Each Contact Displays

Name

Role

Phone Number

Online Status

Call Button

Message Button

---

### 17. Message Templates

Default Templates

I am leaving the yard now.

Arrived at pickup location.

Completed delivery and POD signed.

Fuel stop required.

Traffic delay (20 minutes).

Vehicle breakdown.

Need dispatch assistance.

Arrived at delivery location.

Waiting for unloading.

Load completed successfully.

Users can also create custom templates.

---

### 18. Message Status

Possible Status

Sending

Sent

Delivered

Read

Failed

Archived

---

### 19. Read Receipts

Display

Sent Time

Delivered Time

Read Time

Reader Name

---

### 20. Notifications

Receive notifications for

New Message

Unread Message

Dispatch Update

Customer Reply

Load Update

System Alert

Maintenance Reminder

Safety Reminder

---

### 21. Push Notifications

Supported

Mobile Push

Desktop Notification

Email Alert

SMS (Critical Only)

---

### 22. Group Messaging

Supported Groups

Dispatch Team

Driver Group

Branch Team

Maintenance Team

Safety Team

Operations

Managers

---

### 23. Archive

Drivers may

Archive Conversation

Restore Conversation

Delete Local Copy

Search Archived Messages

---

### 24. Business Rules

Every message belongs to a conversation.

Messages linked to loads remain permanently searchable.

Deleted messages remain in audit logs.

System notifications cannot be deleted.

Only sender can edit messages within allowed time.

---

### 25. Security

End-to-End Encryption

TLS Communication

Role-Based Access

Message Audit Logs

Secure File Storage

Attachment Virus Scan

---

### 26. Permissions

Driver

Read Messages

Send Messages

Upload Files

Archive Conversations

Dispatcher

Broadcast Messages

View Driver Conversations

Fleet Manager

View Operational Conversations

Safety Team

Send Safety Notices

Accounts

Send Invoice Notifications

System

Generate Automated Messages

---

### 27. Database Tables

messages

message_threads

message_templates

message_attachments

message_status

contacts

groups

notifications

audit_logs

---

### 28. APIs

GET /driver/messages

GET /driver/messages/:threadId

POST /driver/messages

PUT /driver/messages/read

POST /driver/messages/template

GET /driver/contacts

POST /driver/messages/upload

GET /driver/notifications

POST /driver/messages/archive

---

### 29. Audit Logs

Track

Message Sent

Message Delivered

Message Read

Attachment Uploaded

Attachment Deleted

Conversation Archived

Template Used

Notification Sent

Group Message Sent

---

### 30. Acceptance Criteria

✓ Driver can send messages successfully.

✓ Messages deliver in real time.

✓ Unread counter updates automatically.

✓ Read receipts display correctly.

✓ Attachments upload successfully.

✓ Quick Contacts work correctly.

✓ Message Templates insert correctly.

✓ Search and filters return accurate results.

✓ Notifications appear instantly.

✓ All conversations remain encrypted.

✓ Full audit history maintained.

✓ Responsive across Mobile, Tablet, and Desktop.


### Documents-&-Compliance-PRD.md

### Driver Portal → Documents & Compliance

#### Module Overview

The Documents & Compliance module allows drivers to securely manage all personal, vehicle, trailer and compliance-related documents. It tracks expiry dates, sends reminders, maintains compliance status, allows uploading/downloading documents and provides complete compliance history.

---

### Objectives

- Store all driver documents digitally.
- Track compliance status.
- Prevent expired documents.
- Upload & download documents.
- Share documents with Admin.
- Generate compliance reports.
- Maintain audit history.

---

### Dashboard

Display

- Compliance Score
- Total Documents
- Valid Documents
- Expiring Soon
- Expired Documents
- Uploaded Documents
- Active Load
- Truck
- Trailer
- Last Sync
- Online Status

---

### Tabs

#### My Documents

Contains

- Driver Licence
- Medical Certificate
- Heavy Vehicle Card
- Dangerous Goods Licence
- Chain of Responsibility
- First Aid Certificate
- Fatigue Certificate
- White Card
- Other Certificates

---

#### Vehicle Documents

Contains

- Vehicle Registration
- Trailer Registration
- Insurance
- Roadworthy Certificate
- Trailer Inspection
- NHVR Permit
- Over Size Permit
- Maintenance Certificate

---

#### Compliance History

Shows

- Upload History
- Renewal History
- Expired Documents
- Deleted Documents
- Compliance Changes
- Reminder History

---

### Compliance Overview

Display

- Total Documents
- Valid
- Expiring Soon
- Expired
- Uploaded
- Compliance %

Status

🟢 Valid

🟡 Expiring Soon

🔴 Expired

⚪ Not Required

---

### Upload Document

Fields

- Document Title
- Category
- Expiry Date
- Description
- Upload File

Supported Files

- PDF
- JPG
- PNG
- JPEG

Maximum Size

10 MB

Buttons

- Upload & Save
- Cancel

---

### Document Categories

Personal

Vehicle

Trailer

Insurance

Permits

Certificates

Compliance

Other

---

### Document Actions

- Upload
- Download
- Preview
- Replace
- Share with Admin
- Delete (Permission Based)
- View History

---

### Expiry Tracking

Automatic reminders

- 90 Days
- 60 Days
- 30 Days
- 15 Days
- 7 Days
- 1 Day
- Expired

Notifications sent to

- Driver
- Company Admin
- Fleet Manager

---

### Expiring Soon

Displays

- Document Name
- Expiry Date
- Remaining Days
- Renew Button

---

### Expired Documents

Displays

- Document Name
- Expired Date
- Overdue Days
- Upload New Version

Mandatory documents block compliance until renewed.

---

### Compliance Report

Generate report containing

- Driver Details
- Vehicle Details
- Document Summary
- Compliance Score
- Expired Documents
- Expiring Documents
- Upload History
- Audit History

Export

- PDF
- Excel

---

### Search & Filters

Search By

- Document Name
- Category
- Vehicle
- Trailer
- Status

Filters

- All
- Valid
- Expiring Soon
- Expired
- Uploaded
- Personal
- Vehicle
- Trailer

---

### Quick Actions

- Upload Document
- Check Expiry
- View Expired
- Download All
- Share with Admin
- View Compliance Report

---

### Notifications

- Document Uploaded
- Document Updated
- Document Approved
- Document Expiring
- Document Expired
- Compliance Warning
- Compliance Restored

---

### Business Rules

- Every document belongs to one driver or vehicle.
- Duplicate documents are not allowed.
- Mandatory documents require expiry dates.
- Expired mandatory documents reduce compliance score.
- Only Admin can permanently delete documents.
- Every upload creates a new version.

---

### Permissions

#### Driver

- View Documents
- Upload Documents
- Download Documents
- Share Documents

#### Company Admin

- View All
- Approve
- Reject
- Archive
- Delete

#### Fleet Manager

- View Reports
- Monitor Compliance
- Generate Reports

---

### Database Tables

- documents
- document_categories
- document_versions
- document_history
- compliance_status
- expiry_notifications
- audit_logs

---

### APIs

GET /driver/documents

GET /driver/documents/{id}

POST /driver/documents

PUT /driver/documents/{id}

DELETE /driver/documents/{id}

GET /driver/compliance

POST /driver/documents/share

GET /driver/compliance/report

---

### Audit Logs

Track

- Upload
- Replace
- Delete
- Download
- Share
- Approval
- Rejection
- Expiry Reminder
- Compliance Update

---

### Acceptance Criteria

- Driver can upload documents.
- Supported files upload successfully.
- Compliance score updates automatically.
- Expiry reminders trigger correctly.
- Expired documents appear automatically.
- Reports export successfully.
- Documents can be shared with Admin.
- Audit logs capture every action.
- Mobile and Desktop responsive.
- Complete compliance history maintained.


````md
# Timesheets-&-Clock-In-Out-PRD.md

# Driver Portal → Timesheets / Clock In-Out

## Module Overview

The Timesheets & Clock In-Out module allows drivers to record their working hours, break times, overtime, shift locations, attendance, and submit weekly timesheets for payroll processing. Every clock event is GPS and timestamp verified to ensure accurate attendance and fatigue compliance.

---

# Objectives

- Record work hours.
- Record clock in/out.
- Record breaks.
- Track overtime.
- Generate weekly timesheets.
- Improve payroll accuracy.
- Ensure fatigue compliance.

---

# Dashboard

Display

- Current Shift Status
- Hours Worked Today
- Weekly Hours
- Monthly Hours
- Break Time
- Overtime
- Current Location
- Last Clock Event
- Online Status

---

# Tabs

## Today

Displays

- Current Shift
- Clock In Time
- Clock Out Time
- Breaks
- Notes

---

## This Week

Displays

- Daily Hours
- Weekly Total
- Weekly Balance
- Overtime

---

## This Month

Displays

- Monthly Hours
- Total Shifts
- Overtime
- Attendance

---

## All Timesheets

Displays complete history.

---

# Weekly Summary

Display

- Total Hours
- Scheduled Hours
- Balance
- Overtime
- Break Hours
- Attendance %

---

# Current Status

Display

- Clocked In
- Clocked Out
- On Break
- Working Since
- Current Shift Duration
- GPS Location
- Geofence Status

---

# Key Actions

- Clock In
- Start Break
- End Break
- Clock Out
- Submit Timesheet
- View Timesheets
- Download PDF

---

# Clock In

Fields

- Auto Date
- Auto Time
- GPS Location
- Geofence
- Notes (Optional)

System stores

- Timestamp
- Latitude
- Longitude
- Device

---

# Break Management

Actions

- Start Break
- End Break

Display

- Break Start
- Break End
- Break Duration

Rules

Multiple breaks supported.

---

# Clock Out

System records

- End Time
- GPS
- Shift Duration
- Total Work Hours
- Total Break Time
- Overtime

---

# Timeline

Display

- Clock In
- Break Started
- Break Ended
- Notes Added
- Clock Out

Each entry contains

- Time
- GPS
- Location
- Status

---

# Notes

Driver may add

- Delay Notes
- Traffic
- Vehicle Issue
- Customer Notes
- General Notes

---

# Timesheet Summary

Displays

- Work Time
- Break Time
- Total Shift
- Overtime
- Status

Status

Draft

Submitted

Approved

Rejected

---

# Week Overview

Display

Monday

Tuesday

Wednesday

Thursday

Friday

Saturday

Sunday

Weekly Total

Attendance

---

# Break Rules

Configurable

Minimum Break

Maximum Daily Hours

Maximum Weekly Hours

Fatigue Rules

Compliance Status

---

# Recent Timesheets

Displays

- Date
- Total Hours
- Status
- Approval Date

---

# Reports

Generate

- Daily Report
- Weekly Report
- Monthly Report

Export

- PDF
- Excel

---

# Search & Filters

Search

- Date
- Status
- Week

Filters

- Draft
- Submitted
- Approved
- Rejected

---

# Notifications

- Shift Started
- Break Reminder
- Break Overdue
- Clock Out Reminder
- Timesheet Submitted
- Timesheet Approved
- Timesheet Rejected

---

# Business Rules

- Clock In required before Clock Out.
- GPS required for every clock event.
- Break rules follow company policy.
- Submitted timesheets become read-only.
- Admin approval required for payroll.

---

# Permissions

## Driver

- Clock In
- Clock Out
- Break
- Submit Timesheet
- View Reports

## Manager

- View Team Timesheets
- Approve
- Reject
- Edit

## Payroll

- View Approved Timesheets
- Export Payroll Data

---

# Database Tables

- timesheets
- attendance_logs
- break_logs
- overtime_logs
- gps_logs
- approvals
- audit_logs

---

# APIs

GET /driver/timesheets

POST /driver/clock-in

POST /driver/start-break

POST /driver/end-break

POST /driver/clock-out

POST /driver/timesheets/submit

GET /driver/timesheets/report

---

# Audit Logs

Track

- Clock In
- Break Started
- Break Ended
- Clock Out
- Note Added
- Timesheet Submitted
- Approved
- Rejected

---

# Acceptance Criteria

- Driver can Clock In.
- GPS captured successfully.
- Breaks calculate correctly.
- Overtime calculated automatically.
- Weekly summary updates instantly.
- Timesheet submission works.
- Reports export successfully.
- Manager approval workflow works.
- Audit logs maintained.
- Mobile & Desktop responsive.

```
````
# Payroll-&-Pay-History-PRD.md

# Driver Portal → Payroll & Pay History

## Module Overview

The Payroll & Pay History module allows drivers to view their earnings, deductions, tax information, payment history, payslips, bank details, and payroll reports. It provides complete visibility into every pay cycle and allows drivers to download official payroll documents.

---

# Objectives

- View payroll summary.
- View earnings.
- View deductions.
- Download payslips.
- View tax statements.
- Update bank details.
- Track payment status.
- Improve payroll transparency.

---

# Dashboard

Display

- Total Earnings (YTD)
- Net Pay
- Gross Pay
- Pending Payments
- Total Deductions
- Next Pay Date
- Payment Frequency
- Current Payroll Status

---

# Tabs

## Overview

Display

- Net Pay
- Gross Earnings
- Total Deductions
- Next Payment
- Current Payroll Status

---

## Pay History

Displays

- Pay Period
- Pay Date
- Status
- Net Amount
- Gross Amount
- Payslip

Status

- Paid
- Processing
- Pending
- Cancelled

---

## Earnings

Displays

- Base Salary
- Load Allowance
- Distance Allowance
- Bonus
- Overtime
- Other Allowances

Shows

Total Earnings

---

## Deductions

Displays

- PAYG Tax
- Superannuation
- Union Fees
- Loan Recovery
- Insurance
- Other Deductions

Shows

Total Deductions

---

## Tax

Displays

- Financial Year
- Gross Income
- Tax Paid
- PAYG Statement
- Income Statement

Export PDF

---

# Pay Summary

Displays

- Current Pay Period
- Gross Pay
- Net Pay
- Deductions
- Processing Status

---

# Current Pay Breakdown

Earnings

- Base Pay
- Distance Allowance
- Load Allowance
- Bonus
- Other Payments

Deductions

- PAYG
- Super
- Insurance
- Other

---

# Payment Method

Display

- Bank Name
- Account Holder
- BSB
- Account Number

Button

Update Bank Details

---

# Update Bank Details

Fields

- Account Holder Name
- Bank Name
- BSB Number
- Account Number

Buttons

- Save
- Cancel

Validation

- BSB Required
- Account Number Required

---

# Payslip Preview

Displays

- Pay Period
- Payment Date
- Net Pay
- Gross Pay
- Earnings Breakdown
- Deductions Breakdown

Buttons

- Download PDF
- Close

---

# Pay History

Shows

- Complete Payroll Archive
- Payslip PDF
- Payment Status
- Amount
- Payment Date

---

# Annual Tax Statements

Displays

- Financial Year
- Gross Earnings
- Tax Withheld

Export

- PDF

---

# Reports

Generate

- Payroll Report
- Earnings Report
- Tax Report
- Deduction Report

Export

- PDF
- Excel

---

# Search & Filters

Search

- Pay Period
- Financial Year

Filters

- Paid
- Pending
- Processing
- Cancelled

---

# Notifications

- Payroll Processed
- Payment Released
- Payslip Available
- Tax Statement Ready
- Bank Details Updated

---

# Business Rules

- Payslips cannot be edited.
- Tax statements are read-only.
- Bank changes require validation.
- Only processed payroll appears in history.

---

# Permissions

## Driver

- View Payroll
- Download Payslip
- Download Tax Statement
- Update Bank Details

## Payroll Admin

- Generate Payroll
- Process Payments
- Update Payroll
- Export Reports

---

# Database Tables

- payrolls
- payroll_items
- payslips
- tax_statements
- bank_accounts
- deductions
- earnings
- audit_logs

---

# APIs

GET /driver/payroll

GET /driver/pay-history

GET /driver/payslip/{id}

GET /driver/tax-statements

PUT /driver/bank-details

GET /driver/payroll/report

---

# Audit Logs

Track

- Payslip Downloaded
- Tax Statement Downloaded
- Bank Updated
- Payroll Viewed
- Report Exported

---

# Acceptance Criteria

- Driver can view payroll.
- Payslips download successfully.
- Tax statements available.
- Bank details update correctly.
- Reports export successfully.
- Payment history accurate.
- Audit logs maintained.
- Responsive on Mobile & Desktop.

```

### Trailer-Swap-&-Equipment-PRD.md

### Driver Portal → Trailer Swap & Equipment

#### Module Overview

The Trailer Swap & Equipment module allows drivers to manage their assigned truck and trailer, perform trailer swaps, inspect equipment, report defects, and ensure all fleet equipment remains safe and compliant before continuing a trip.

The module supports both **Direct Swap** and **Approval-Based Swap** depending on company policy.

---

### Objectives

- Manage assigned equipment.
- Swap trailers safely.
- Verify equipment before use.
- Record inspection results.
- Notify dispatch automatically.
- Maintain equipment history.
- Improve fleet safety and compliance.

---

### Dashboard

Display

- Current Truck
- Current Trailer
- Driver
- Equipment Status
- Company Swap Policy
- Last Sync
- Online Status

---

### Current Equipment

Display

- Driver Name
- Driver ID
- Truck ID
- Truck Model
- Truck Registration
- Truck VIN
- Trailer ID
- Trailer Model
- Trailer Registration
- Trailer VIN

Status

- Active
- Available
- Maintenance
- In Use
- Unavailable

---

### Trailer Search

Search By

- Trailer ID
- Registration
- VIN
- Trailer Type
- Location

Filters

- All
- Available
- In Use
- Maintenance
- Unavailable

---

### Available Trailer List

Each trailer displays

- Trailer ID
- Model
- Registration
- VIN
- Capacity
- Current Yard
- Status

Buttons

- Select Trailer
- View Details

---

### Trailer Specifications

Displays

- Trailer ID
- Model
- Registration
- VIN
- Capacity
- Manufacturer
- Build Year
- Last Inspection Date
- Service Due Date

Buttons

- View Details
- Close

---

### Trailer Swap

Fields

- Swap Type
- New Trailer
- Reason
- Date & Time
- Location
- Notes

Buttons

- Confirm Swap
- Cancel

---

### Swap Types

Supported

- Direct Swap
- Approval Required
- Emergency Swap
- Workshop Replacement

---

### Equipment Inspection Checklist

Driver must verify

- Tyres & Wheels
- Lights & Indicators
- Brakes & Air Lines
- Coupling & Locks
- Deck & Ramps
- General Condition

Checkbox

"I confirm the equipment has been inspected and is roadworthy."

---

### Company Policy

Display

- Policy Type
- Approval Required
- Dispatch Notification
- Equipment Inspection Required
- Photo Required
- After Hours Allowed

---

### Swap Workflow

Current Trailer

↓

Select New Trailer

↓

Inspection Checklist

↓

Company Policy Validation

↓

Confirm Swap

↓

Dispatch Notification

↓

Equipment Updated

---

### Equipment History

Displays

- Previous Trailer
- New Trailer
- Date
- Time
- Driver
- Location
- Reason

---

### Maintenance

Quick Actions

- Report Defect
- Safety Inspection
- Service History
- Maintenance Request

---

### Equipment Alerts

Displays

- Service Due
- Inspection Due
- Damage Reported
- Registration Expiring
- Insurance Expiring

---

### Notifications

- Trailer Swapped
- Dispatch Notified
- Inspection Completed
- Service Due
- Equipment Assigned
- Equipment Removed

---

### Business Rules

- Trailer must be Available before assignment.
- Inspection required before swap.
- Approval required if company policy demands.
- Dispatch notified automatically.
- Equipment history cannot be deleted.
- Driver cannot assign unavailable trailer.

---

### Permissions

#### Driver

- View Equipment
- Swap Trailer
- Complete Inspection
- Report Defect

#### Dispatcher

- Approve Swap
- Assign Equipment
- Monitor Equipment

#### Fleet Manager

- Manage Equipment
- View History
- Override Assignments
- Configure Policies

---

### Database Tables

- equipment
- trailers
- trucks
- equipment_assignments
- trailer_swaps
- inspection_checklists
- maintenance_logs
- equipment_history
- audit_logs

---

### APIs

GET /driver/equipment

GET /driver/trailers

POST /driver/trailer-swap

POST /driver/equipment-inspection

GET /driver/equipment-history

POST /driver/report-defect

GET /driver/company-policy

---

### Audit Logs

Track

- Trailer Assigned
- Trailer Swapped
- Inspection Completed
- Dispatch Notified
- Equipment Updated
- Defect Reported
- Service Requested
- Policy Checked

---

### Acceptance Criteria

- Driver can view assigned equipment.
- Trailer search works correctly.
- Only available trailers can be selected.
- Inspection checklist is mandatory.
- Company policy is enforced.
- Dispatch receives swap notification.
- Equipment history is maintained.
- Defects can be reported successfully.
- Audit logs capture all equipment activities.
- Responsive across Mobile, Tablet, and Desktop.

```

# Offline-Sync-PRD.md

# Driver Portal → Offline Sync

## Module Overview

The Offline Sync module allows drivers to continue working even without an internet connection. All offline activities are securely stored on the device and automatically synchronized with the server once connectivity is restored.

The module ensures no operational data is lost during poor network coverage.

---

# Objectives

- Support offline operation.
- Prevent data loss.
- Automatically synchronize data.
- Track sync status.
- Retry failed uploads.
- Improve reliability in remote areas.

---

# Dashboard

Display

- Total Sync Items
- Synced Items
- Pending Items
- Uploading Items
- Queued Items
- Failed Items
- Last Sync Time
- Connection Status
- Storage Usage

---

# Sync Status

Display

- Online
- Offline
- Syncing
- Paused
- Failed

Color Indicators

🟢 Synced

🟡 Pending

🔵 Uploading

🟠 Queued

🔴 Failed

---

# Queue Summary

Displays

- Total Queue Items
- Synced
- Pending
- Uploading
- Queued
- Failed

---

# Sync Tabs

- All Items
- Pending
- Uploading
- Queued
- Failed

---

# Offline Queue Items

Each queue item displays

- Reference Number
- Module Type
- Date
- Time
- File Size
- Current Status
- Sync Progress

Supported Item Types

- Safety Checklist
- Load Photos
- POD Signature
- Fuel Expense
- Trailer Swap
- Damage Report
- Documents
- Messages
- Timesheets

---

# Search & Filters

Search By

- Reference ID
- Module
- Notes

Filters

- All
- Pending
- Failed
- Uploading
- Synced

---

# Sync Progress

Displays

- Upload Percentage
- Current Status
- Remaining Files
- Estimated Completion Time

Example

Uploading

85%

---

# Sync Controls

Buttons

- Sync Now
- Retry Failed
- Pause Sync
- Resume Sync
- Clear Completed
- Open Sync Settings

---

# Sync Settings

Configurable Options

- Auto Sync
- Sync Every 5 Minutes
- Wi-Fi Only Sync
- Mobile Data Sync
- Background Sync
- Large File Upload
- Storage Cleanup

---

# Storage Usage

Display

- Used Storage
- Available Storage
- Offline Cache Size

Buttons

- Manage Storage
- Clear Cache

---

# Recent Sync Activity

Displays

- Module Name
- Status
- Date
- Time
- Reference ID

---

# Notifications

- Sync Started
- Sync Completed
- Sync Failed
- Connection Restored
- Queue Full
- Retry Successful
- Storage Almost Full

---

# Business Rules

- Offline data is stored locally.
- Data sync starts automatically when internet is available.
- Failed items remain in queue until successfully uploaded.
- Duplicate records are prevented.
- Sync order follows creation timestamp.
- Deleted synced records remain in audit history.

---

# Permissions

## Driver

- View Queue
- Sync Data
- Retry Failed
- Pause Sync
- Clear Completed

## Admin

- Monitor Sync Logs
- Resolve Sync Errors

## System

- Automatic Synchronization
- Conflict Resolution
- Background Upload

---

# Database Tables

- offline_queue
- sync_logs
- sync_settings
- upload_queue
- failed_uploads
- local_cache
- audit_logs

---

# APIs

GET /driver/offline-sync

POST /driver/offline-sync

POST /driver/offline-sync/retry

POST /driver/offline-sync/pause

POST /driver/offline-sync/resume

DELETE /driver/offline-sync/clear

GET /driver/offline-sync/settings

---

# Audit Logs

Track

- Queue Created
- Item Added
- Sync Started
- Sync Completed
- Sync Failed
- Retry Attempted
- Queue Cleared
- Settings Updated

---

# Acceptance Criteria

- Driver can continue working offline.
- Offline records are saved securely.
- Sync starts automatically when online.
- Failed uploads can be retried.
- Queue status updates correctly.
- Duplicate uploads are prevented.
- Storage usage is tracked.
- Sync logs are maintained.
- Audit logs capture all sync activities.
- Responsive on Mobile, Tablet, and Desktop.

```



````md
# Account-Statement-PRD.md

# Customer Portal → Account Statement

## Module Overview

The **Account Statement** module provides customers with a complete financial summary of their account. Customers can review outstanding balances, invoices, payments, credits, adjustments, and download official account statements in PDF or CSV format for accounting purposes.

This module serves as the customer's financial ledger within the Customer Portal.

---

# Objectives

- View complete account statement.
- Track outstanding balance.
- View payment history.
- Download official statements.
- Export accounting data.
- Improve financial transparency.
- Maintain billing history.

---

# Navigation

Customer Portal

↓

Finance

↓

Account Statement

---

# Screen Header

Title

Account Statement

Subtitle

Download complete billing history statement.

---

# Account Summary

Display

- Account Holder Name
- Customer Code
- Account Number
- Company Name
- Billing Email
- Statement Date
- Currency

Example

Account Holder

ABC Transport Solutions

Customer Code

ABC-1025

Currency

AUD

---

# Financial Summary Cards

Display

## Total Outstanding

Amount currently unpaid.

Example

$18,540.00 AUD

---

## Current Balance

Current account balance.

---

## Total Paid

Payments received.

---

## Credit Balance

Available credits.

---

## Overdue Amount

Outstanding overdue invoices.

---

## Last Payment

Latest payment received.

---

# Statement Period

Allow selection of

- Current Month
- Last Month
- Last 3 Months
- Last 6 Months
- Current Financial Year
- Previous Financial Year
- Custom Date Range

---

# Statement Information

Display

- Opening Balance
- Total Charges
- Total Payments
- Credits
- Adjustments
- Closing Balance

---

# Transactions Table

Columns

- Date
- Reference Number
- Transaction Type
- Description
- Debit
- Credit
- Balance
- Status

Example

27 May 2025

INV-2025-0527

Invoice

Freight Transport Charge

Debit

$5,760.50

Balance

$18,540.00

Status

Outstanding

---

# Transaction Types

Supported

- Invoice
- Payment
- Credit Note
- Debit Note
- Adjustment
- Refund
- Deposit
- Finance Charge

---

# Payment History

Display

- Payment Date
- Payment Method
- Reference
- Amount
- Status

Status

- Paid
- Pending
- Failed
- Refunded

---

# Outstanding Invoices

Display

- Invoice Number
- Due Date
- Outstanding Amount
- Days Overdue

Buttons

- View Invoice
- Pay Now

---

# Credits & Adjustments

Display

- Credit Notes
- Discounts
- Refunds
- Manual Adjustments

---

# Download Options

Buttons

Download PDF Statement

Export CSV Spreadsheet

Download Excel

Print Statement

---

# PDF Statement

Generated PDF contains

- Company Logo
- Customer Information
- Billing Address
- Statement Period
- Transaction History
- Outstanding Balance
- Payment Summary
- Closing Balance

---

# CSV Export

Include

- Transaction Date
- Reference
- Type
- Description
- Debit
- Credit
- Balance

---

# Search

Search By

- Invoice Number
- Reference
- Transaction ID
- Payment ID

---

# Filters

Filter By

- All
- Invoices
- Payments
- Credits
- Outstanding
- Paid
- Overdue

Date Filters

- Today
- This Month
- Last Month
- Custom Range

---

# Quick Actions

- Download Statement
- Export CSV
- View Invoice
- Pay Invoice
- Contact Accounts

---

# Notifications

Customer receives notifications for

- Statement Ready
- Payment Received
- New Invoice
- Credit Applied
- Refund Processed
- Overdue Reminder

---

# Business Rules

- Statement is generated from all financial transactions.
- Closing balance equals opening balance plus charges minus payments.
- Paid invoices cannot appear as outstanding.
- Credits automatically reduce outstanding balance.
- Downloaded statements are read-only.
- Only authorized customers can access their statements.

---

# Permissions

## Customer

- View Statement
- Download PDF
- Export CSV
- View Transactions

## Accounts Team

- View All Statements
- Generate Statements
- Apply Credits
- Process Adjustments

## Company Admin

- View Company Financials
- Download Reports

---

# Database Tables

- customers
- account_statements
- invoices
- invoice_payments
- payment_transactions
- credit_notes
- adjustments
- account_balances
- audit_logs

---

# APIs

GET /customer/account-statement

GET /customer/account-summary

GET /customer/account-transactions

GET /customer/account-statement/pdf

GET /customer/account-statement/csv

GET /customer/outstanding-invoices

---

# Audit Logs

Track

- Statement Viewed
- PDF Downloaded
- CSV Exported
- Invoice Opened
- Payment Initiated
- Filters Applied
- Search Performed

---

# Validation Rules

- Customer must be authenticated.
- Only own account statement is accessible.
- Date range cannot exceed configured system limit.
- PDF generation must include latest transaction data.
- CSV export must include all filtered records.

---

# Acceptance Criteria

- Customer can view complete account statement.
- Outstanding balance displays correctly.
- Opening and closing balances calculate accurately.
- Transaction history is complete.
- Payment history is visible.
- Outstanding invoices are listed.
- PDF statement downloads successfully.
- CSV export works correctly.
- Search and filters function properly.
- Audit logs record all statement activities.
- Fully responsive on Desktop, Tablet, and Mobile.

```
````
````md
### Saved-Payment-Methods-PRD.md

### Customer Portal → Saved Payment Methods

#### Module Overview

The **Saved Payment Methods** module allows customers to securely manage their payment methods for invoices and account payments. Customers can add, update, remove and set default payment methods for faster checkout. All payment information is tokenized and securely managed through Stripe.

---

### Objectives

- Save payment methods securely.
- Support multiple payment methods.
- Set default payment method.
- Add new cards.
- Remove old payment methods.
- Update expiry information.
- Improve checkout experience.

---

### Navigation

Customer Portal

↓

Finance

↓

Saved Payment Methods

---

### Screen Header

Title

Saved Payment Methods

Subtitle

Manage credit cards and direct debit options.

---

### Payment Methods Summary

Display

- Total Saved Payment Methods
- Default Payment Method
- Last Updated
- Payment Gateway
- Customer Account

---

### Saved Payment Method Card

Display

#### Credit Card

Fields

- Card Brand
- Last 4 Digits
- Expiry Date
- Card Holder Name
- Status

Example

Visa

Ending ****4242

Expires 12/28

Default

---

#### Direct Debit

Display

- Bank Name
- Account Ending
- Status

Example

ANZ Bank

Ending ****8819

Active

---

### Payment Method Status

Supported Status

- Default
- Active
- Expired
- Disabled
- Verification Pending

---

### Supported Payment Methods

- Visa
- Mastercard
- American Express
- Debit Card
- Bank Direct Debit

Future Support

- Apple Pay
- Google Pay
- PayPal

---

### Add New Payment Method

Fields

#### Payment Type

Dropdown

- Credit Card
- Direct Debit

---

#### Card Holder Name

Required

---

#### Card Number

Masked Input

Validation

Luhn Validation

---

#### Expiry Date

MM/YY

Cannot be expired.

---

#### CVV

3–4 Digits

---

#### Billing Address

Optional

---

Buttons

- Save Payment Method
- Cancel

---

### Make Default

Action

Customer selects a payment method.

↓

System updates default payment method.

↓

Previous default becomes Active.

---

### Remove Payment Method

Rules

- Confirmation required.
- Default method cannot be removed until another default exists.
- Payment method used in active transactions cannot be deleted.

---

### Payment Method Details

Display

- Payment Type
- Token ID
- Created Date
- Last Used
- Expiry
- Status

---

### Payment Workflow

Customer

↓

Open Saved Payment Methods

↓

Add Card

↓

Stripe Tokenization

↓

Card Verified

↓

Saved Successfully

↓

Available During Checkout

---

### Stripe Integration

System Uses

- Stripe Customer
- Stripe Payment Method
- Stripe Setup Intent
- Stripe Tokenization

Card details are never stored inside Hero Logistics database.

---

### Security

- PCI DSS Compliant
- Stripe Tokenization
- SSL Encryption
- Secure API Communication
- Fraud Detection
- No CVV Storage

---

### Search

Search By

- Card Holder
- Card Type
- Bank Name

---

### Filters

- Active
- Default
- Expired
- Disabled

---

### Quick Actions

- Add New Payment Method
- Make Default
- Remove
- Edit Nickname
- Refresh

---

### Notifications

Customer receives

- Payment Method Added
- Payment Method Updated
- Payment Method Removed
- Default Changed
- Card Expiring Soon

Admin receives

- New Payment Method Added
- Verification Failed

---

### Business Rules

- One payment method must remain default.
- Expired cards cannot be used.
- CVV is never stored.
- Stripe manages sensitive payment data.
- Customer can store multiple payment methods.
- Duplicate payment methods are not allowed.

---

### Permissions

#### Customer

- View Payment Methods
- Add Payment Method
- Remove Payment Method
- Make Default

#### Accounts Team

- View Payment Methods
- Disable Payment Method

#### Super Admin

- View Audit Logs
- Payment Configuration
- Gateway Management

---

### Database Tables

- customers
- payment_methods
- stripe_customers
- stripe_payment_methods
- payment_method_logs
- audit_logs

---

### APIs

GET /customer/payment-methods

POST /customer/payment-methods

PUT /customer/payment-methods/{id}

DELETE /customer/payment-methods/{id}

POST /customer/payment-methods/default

GET /customer/payment-methods/{id}

---

### Audit Logs

Track

- Payment Method Added
- Payment Method Updated
- Payment Method Deleted
- Default Changed
- Verification Completed
- Payment Method Used

---

### Validation Rules

- Card number must pass Luhn validation.
- Expiry date cannot be in the past.
- CVV required during verification.
- Duplicate payment methods blocked.
- Default payment method must always exist.

---

### Acceptance Criteria

- Customer can add a payment method.
- Stripe tokenization works correctly.
- Multiple payment methods supported.
- Default payment method updates successfully.
- Payment methods display correctly.
- Expired cards are blocked.
- Delete confirmation works.
- Audit logs are maintained.
- Payment data remains PCI compliant.
- Fully responsive on Desktop, Tablet, and Mobile.

```
````
### Dashboard-PRD.md

### Customer Portal → Dashboard

#### Module Overview

The Customer Dashboard provides customers with a complete overview of their logistics operations, active shipments, deliveries, invoices, documents, and recent activities from a single screen. It acts as the landing page after login and provides quick access to all important business information.

---

### Objectives

- Provide business overview
- Display shipment status
- Track active loads
- Monitor deliveries
- View invoices & payments
- Access documents quickly
- View recent activities
- Navigate to important modules

---

### Navigation

Customer Portal

→ Dashboard

(Default Landing Page)

---

### Dashboard KPI Cards

Display following KPI cards:

- Active Loads
- Upcoming Deliveries
- Outstanding Invoices
- Outstanding Balance
- Payments This Month
- Documents

Each card displays:

- Current Value
- Trend Percentage
- Comparison with Last Month
- Quick Action Link

---

### Header Actions

Buttons

- Refresh Dashboard
- Export Dashboard
- More Actions

---

### Active Loads Widget

Display

- Load Number
- Route
- Status
- Assigned Driver
- ETA

Actions

- View Load
- Track Load

---

### Upcoming Deliveries

Display

- Delivery Date
- Load Number
- Route
- ETA
- Delivery Status

Actions

- View Details

---

### Recent Documents

Display

- POD
- Invoice
- Condition Report
- Contract
- Load Photos

Actions

- Preview
- Download

---

### Recent Activity Timeline

Display latest activities

- Load Updated
- Driver Assigned
- POD Uploaded
- Invoice Created
- Payment Received
- New Message

Each activity includes

- Date
- Time
- User
- Description

---

### Invoice Summary

Display

- Total Invoices
- Paid
- Outstanding
- Overdue
- Outstanding Amount
- Paid This Month

Actions

- View Invoices
- Make Payment

---

### Recent Invoices

Display

- Invoice Number
- Invoice Date
- Amount
- Status

Status

- Paid
- Outstanding
- Overdue
- Partially Paid

---

### Search

Search by

- Load ID
- Invoice Number
- Customer Reference
- Route

---

### Notifications

Customer receives

- New Booking Confirmation
- Load Status Updated
- Driver Assigned
- POD Uploaded
- Invoice Generated
- Payment Received
- Delivery Completed

---

### Business Rules

- Dashboard loads customer-specific data only.
- KPI cards update in real-time.
- Outstanding balance equals unpaid invoices.
- Recent activity displays latest events first.
- Only authorized customer data is visible.

---

### Permissions

Customer

- View Dashboard
- Export Dashboard
- View Widgets

Company Admin

- View Company Dashboard

---

### Database Tables

- customers
- dashboard_summary
- loads
- invoices
- payments
- documents
- notifications
- activities

---

### APIs

GET /customer/dashboard

GET /customer/dashboard/summary

GET /customer/dashboard/activities

GET /customer/dashboard/invoices

GET /customer/dashboard/loads

GET /customer/dashboard/documents

---

### Audit Logs

Track

- Dashboard Viewed
- Dashboard Exported
- Widget Opened
- Quick Action Clicked

---

### Acceptance Criteria

- Dashboard loads within 3 seconds.
- KPI cards display correct values.
- Active Loads update automatically.
- Recent Activity refreshes correctly.
- Invoice Summary is accurate.
- Documents are downloadable.
- Dashboard is fully responsive.
- Audit logs are generated.

### My-Loads-PRD.md

### Customer Portal → My Loads

#### Module Overview

The **My Loads** module allows customers to view, search, filter, track, and manage all transport bookings and freight loads. Customers can monitor every shipment from booking until delivery while accessing load details, tracking, PODs, invoices, and related documents.

---

### Objectives

- View all customer loads
- Track shipment progress
- Search loads quickly
- Filter by status
- View load details
- Create new booking
- Download load information

---

### Navigation

Customer Portal

→ My Loads

---

### Dashboard Summary Cards

Display

- Total Loads
- In Transit
- Upcoming
- Completed
- Cancelled

Each card displays

- Total Count
- Quick View Link

---

### Header Actions

Buttons

- Refresh
- Download
- Create Booking

---

### Search

Search By

- Load Number
- PO Reference
- Driver Name
- Route
- Customer Reference

---

### Filters

Status

- All
- In Transit
- Upcoming
- Completed
- Cancelled

Load Type

- Car Carrier
- General Freight
- Dangerous Goods
- Warehousing / 3PL

Date Range

- Start Date
- End Date

---

### Loads Table

Display Columns

- Load ID
- PO Reference
- Route
- Load Type
- Status
- Driver
- Pickup Date
- Delivery Date
- ETA
- Actions

---

### Load Status

Supported

- Draft
- Confirmed
- Scheduled
- At Pickup
- Loaded
- Dispatched
- In Transit
- Arrived
- Delivered
- Cancelled

---

### Actions

Each Load Supports

- View Details
- Live Tracking
- View Documents
- Download POD
- View Invoice
- Message Dispatch

---

### Pagination

Supports

- Previous
- Next
- Page Numbers
- Rows Per Page

---

### Load Analytics

Display

- Total Loads
- In Transit
- Delivered
- Scheduled
- Delayed
- Cancelled

---

### Load Types

Display

- Car Carrier
- General Freight
- Dangerous Goods
- Warehousing

---

### Quick Filters

Display

- Requires Attention
- Delayed Loads
- POD Pending
- Invoice Pending

---

### Create Booking

Button

+ Create Booking

Redirects to

Create Booking Module

---

### Business Rules

- Customer sees only their own loads.
- Latest status displayed automatically.
- ETA updates in real time.
- Delivered loads become read-only.
- Cancelled loads cannot be edited.

---

### Notifications

Customer receives

- Booking Confirmed
- Driver Assigned
- Pickup Started
- Load Dispatched
- In Transit
- Delivered
- POD Uploaded
- Invoice Generated

---

### Permissions

Customer

- View Loads
- Search Loads
- Filter Loads
- Track Loads
- Download Documents

Company Admin

- View Company Loads

---

### Database Tables

- customer_loads
- loads
- load_status
- load_tracking
- load_documents
- load_items
- audit_logs

---

### APIs

GET /customer/loads

GET /customer/loads/{id}

GET /customer/loads/status

GET /customer/loads/tracking

GET /customer/loads/documents

---

### Audit Logs

Track

- Load Viewed
- Load Downloaded
- Tracking Opened
- Filters Applied
- Search Performed

---

### Acceptance Criteria

- Customer can view all loads.
- Search works correctly.
- Filters work correctly.
- Load status updates in real time.
- Tracking opens successfully.
- Documents are downloadable.
- Pagination works.
- Mobile responsive.
- Audit logs generated successfully.

```
````md id="1f9jzk"
### Create-Booking-PRD.md

### Customer Portal → Create Booking

#### Module Overview

The **Create Booking** module allows customers to submit new transport requests by providing pickup, delivery, freight details, service options, and special requirements. The booking is sent directly to the Dispatch Team for review and confirmation.

---

### Objectives

- Create transport bookings
- Capture shipment details
- Add multiple freight items
- Select service options
- Save draft bookings
- Submit booking requests
- Notify dispatch automatically

---

### Navigation

Customer Portal

→ Create Booking

---

### Booking Workflow

Step 1

Booking Details

↓

Step 2

Items & Freight

↓

Step 3

Options & Requirements

↓

Step 4

Review & Submit

↓

Booking Submitted

---

### Header Actions

Buttons

- Save as Draft
- Clear Form
- Submit Booking Request
- More Actions

---

### Step 1 – Booking Details

#### Pickup Details

Fields

- Pickup Location *
- Pickup Date *
- Pickup Time *
- Ready From
- Contact Name
- Contact Phone
- Pickup Instructions

---

#### Delivery Details

Fields

- Delivery Location *
- Delivery Date *
- Delivery Time *
- Delivery From
- Delivery Until
- Contact Name
- Contact Phone
- Delivery Instructions

---

### Step 2 – Items & Freight

Display

Items Table

Columns

- Item Type
- Description
- Quantity
- Weight
- Dimensions
- Declared Value
- Actions

Buttons

- Add Item
- Edit Item
- Delete Item

---

### Freight Types

Supported

- Car Carrier
- General Freight
- Dangerous Goods
- Warehousing / 3PL

---

### Step 3 – Options & Requirements

Service Options

- Express Delivery
- Insurance
- Tail Lift
- Enclosed Transport
- Temperature Controlled
- Special Equipment

Additional Notes

- Dispatch Notes
- Special Instructions

---

### Step 4 – Review & Submit

Display Summary

- Route
- Pickup Details
- Delivery Details
- Total Items
- Total Weight
- Declared Value
- Service Options
- Special Instructions

---

### Confirmation Popup

Display

- Route
- Booking Date
- Total Items
- Total Weight

Buttons

- Review Form
- Submit Request

---

### Booking Status

Supported

- Draft
- Submitted
- Under Review
- Quote Sent
- Confirmed
- Scheduled
- Cancelled

---

### Search

Search Previous Drafts By

- Booking Number
- Route
- Date

---

### Validations

Required Fields

- Pickup Location
- Delivery Location
- Pickup Date
- At least One Item
- Freight Type

Validation Rules

- Pickup Date cannot be in the past.
- Delivery Date must be after Pickup Date.
- Weight must be greater than 0.
- Declared Value cannot be negative.

---

### Notifications

Customer receives

- Booking Saved
- Booking Submitted
- Booking Confirmed
- Quote Ready
- Booking Cancelled

Dispatch receives

- New Booking Request
- Booking Updated

---

### Business Rules

- Customer can save unlimited drafts.
- Booking number generated automatically.
- Booking becomes read-only after confirmation.
- Dispatch reviews every submitted booking.
- Multiple freight items are supported.

---

### Permissions

#### Customer

- Create Booking
- Save Draft
- Edit Draft
- Submit Booking
- View Booking Status

#### Dispatcher

- Review Booking
- Approve
- Reject
- Convert to Load

---

### Database Tables

- bookings
- booking_items
- booking_routes
- booking_services
- booking_notes
- booking_status
- audit_logs

---

### APIs

GET /customer/bookings

POST /customer/bookings

PUT /customer/bookings/{id}

POST /customer/bookings/{id}/submit

GET /customer/bookings/{id}

DELETE /customer/bookings/{id}

---

### Audit Logs

Track

- Booking Created
- Draft Saved
- Booking Updated
- Booking Submitted
- Booking Cancelled
- Item Added
- Item Removed

---

### Acceptance Criteria

- Customer can create a booking.
- Multiple items can be added.
- Draft booking saves successfully.
- Validation prevents incomplete submissions.
- Booking submits successfully.
- Dispatch receives booking instantly.
- Booking status updates correctly.
- Responsive on Desktop, Tablet, and Mobile.
```
````
### Invoices-&-Payments-PRD.md

### Customer Portal → Invoices & Payments

#### Module Overview

The **Invoices & Payments** module enables customers to view all invoices, monitor payment status, download tax invoices, make secure online payments, manage saved payment methods, and access complete billing history.

---

### Objectives

- View all invoices
- Track payment status
- Download tax invoices
- Pay invoices online
- View payment history
- Manage saved payment methods
- Download account statements

---

### Navigation

Customer Portal

→ Invoices & Payments

---

### Dashboard Summary Cards

Display

- Total Invoices
- Paid
- Outstanding
- Overdue
- Outstanding Balance
- Paid This Month

---

### Header Actions

Buttons

- Refresh
- Export
- Make Payment

---

### Invoice Summary

Display

- Total Invoices
- Paid Invoices
- Outstanding Invoices
- Partially Paid
- Overdue Invoices
- Outstanding Amount

---

### Invoice List

Display Columns

- Invoice Number
- Related Load
- Invoice Date
- Due Date
- Amount
- Payment Status
- Actions

---

### Invoice Status

Supported

- Draft
- Issued
- Pending
- Partially Paid
- Paid
- Overdue
- Cancelled

---

### Invoice Details

Display

- Invoice Number
- Customer Name
- Related Load
- Invoice Date
- Due Date
- GST
- Line Items
- Total Amount
- Outstanding Balance
- Payment Status

Buttons

- Download PDF
- Pay Invoice
- Print Invoice

---

### Line Item Breakdown

Display

- Freight Charges
- Fuel Surcharge
- Insurance
- Additional Charges
- GST
- Total Amount

---

### Payment History

Display

- Payment Date
- Payment Method
- Transaction ID
- Amount
- Status

---

### Payment Status

Supported

- Pending
- Processing
- Paid
- Failed
- Refunded

---

### Pay Invoice

Supports

- Stripe Payment Gateway
- Credit Card
- Debit Card
- Saved Payment Methods

Fields

- Card Holder Name
- Card Number
- Expiry Date
- CVV

Buttons

- Confirm Payment
- Cancel

---

### Saved Payment Methods

Display

- Default Card
- Saved Cards
- Bank Accounts

Actions

- Add
- Remove
- Make Default

---

### Account Statement

Display

- Current Balance
- Outstanding Balance
- Payments Received
- Credits
- Statement Period

Buttons

- Download PDF
- Export CSV

---

### Search

Search By

- Invoice Number
- Load Number
- Reference Number

---

### Filters

- All
- Paid
- Outstanding
- Overdue
- Partially Paid
- Cancelled

Date Filters

- Today
- This Month
- Last Month
- Custom Range

---

### Quick Actions

- View Invoice
- Download PDF
- Pay Now
- View Payment History
- Download Statement

---

### Notifications

Customer receives

- Invoice Created
- Payment Successful
- Payment Failed
- Payment Reminder
- Invoice Overdue
- Receipt Generated

Accounts Team receives

- Payment Received
- Payment Failed

---

### Business Rules

- Only Outstanding invoices can be paid.
- Paid invoices become read-only.
- GST calculated automatically.
- Payment updates invoice instantly.
- Receipts generated automatically.

---

### Permissions

#### Customer

- View Invoices
- Download PDF
- Pay Invoice
- View Statements

#### Accounts Team

- Create Invoice
- Update Status
- View Payments
- Process Refunds

#### Admin

- View All Invoices
- Export Reports
- Manage Payments

---

### Database Tables

- invoices
- invoice_items
- payments
- payment_methods
- payment_transactions
- account_statements
- audit_logs

---

### APIs

GET /customer/invoices

GET /customer/invoices/{id}

POST /customer/payments

GET /customer/payment-history

GET /customer/account-statement

GET /customer/invoices/pdf

---

### Audit Logs

Track

- Invoice Viewed
- Invoice Downloaded
- Payment Started
- Payment Successful
- Payment Failed
- Receipt Downloaded

---

### Acceptance Criteria

- Customer can view invoices.
- Invoice details load correctly.
- PDF downloads successfully.
- Online payment works securely.
- Payment history updates instantly.
- Saved payment methods function correctly.
- Account statement downloads successfully.
- Invoice status updates automatically.
- Audit logs record all payment activities.
- Fully responsive on Desktop, Tablet, and Mobile.

```
# Documents-&-PODs-PRD.md

# Customer Portal → Documents & PODs

## Module Overview

The **Documents & PODs** module allows customers to access, upload, download, preview, and manage all shipment-related documents from a single location. Customers can view Proof of Delivery (POD), Invoices, Condition Reports, Delivery Photos, Contracts, Rate Confirmations, and other logistics documents linked to their loads.

---

# Objectives

- Centralized document repository
- Download shipment documents
- View Proof of Delivery (POD)
- Upload customer documents
- Request missing documents
- Preview files online
- Search and filter documents
- Track upload history

---

# Navigation

Customer Portal

→ Documents & PODs

---

# Dashboard Summary Cards

Display

- Total Documents
- POD Documents
- Invoices
- Condition Reports
- Other Documents

Each card displays

- Total Count
- Quick View Link

---

# Header Actions

Buttons

- Upload Document
- Request Document
- Download Selected
- More Actions

---

# Search

Search By

- Document Name
- Load Number
- Reference Number
- Invoice Number

---

# Filters

Document Type

- All Documents
- POD
- Invoice
- Condition Report
- Photos
- Other Documents

Load Filter

- All Loads

Date Filter

- Upload Date
- Custom Date Range

---

# Documents Table

Display Columns

- Document Name
- Document Type
- Customer
- Related Load
- Route
- Upload Date
- Uploaded By
- File Size
- Actions

---

# Supported Document Types

- Proof of Delivery (POD)
- Tax Invoice
- Condition Report
- Pre-Load Report
- Delivery Photos
- Pickup Photos
- Load Photos
- Rate Confirmation
- Delivery Instructions
- Contract
- Bill of Lading
- Customs Documents
- Other Documents

---

# Document Status

Supported

- Uploaded
- Available
- Requested
- Pending Approval
- Archived

---

# Document Actions

Each document supports

- Preview
- Download
- Share
- Print
- View Details

---

# Upload Document

Purpose

Upload customer documents including POD, signed documents, customs paperwork and supporting files.

Fields

- Document Title *
- Document Category *
- Related Load *
- Attachment *

Supported Files

- PDF
- JPG
- PNG
- DOCX
- XLSX

Maximum Size

10 MB

Buttons

- Save & Upload
- Cancel

---

# Request Document

Purpose

Customer can request missing documents from Dispatch.

Fields

- Document Needed
- Related Load Number
- Notes / Instructions

Buttons

- Send Request
- Cancel

Request Types

- Signed POD
- Condition Report
- Invoice
- Load Photos
- Delivery Photos
- Customs Documents
- Other

---

# Document Preview

Display

- File Name
- File Type
- Upload Date
- Uploaded By
- Related Load
- File Size

Actions

- Download
- Print
- Share

---

# Recently Uploaded

Display

- File Name
- Upload Date
- File Size

---

# Document Analytics

Display

- Total Documents
- POD Percentage
- Invoice Percentage
- Report Percentage
- Other Documents Percentage

---

# Quick Actions

- Upload Document
- Request Document
- Download Statement
- Contact Dispatch

---

# Notifications

Customer receives

- Document Uploaded
- POD Available
- Invoice Uploaded
- Request Approved
- Request Completed
- New Document Added

Dispatch receives

- New Document Request
- Customer Upload

---

# Business Rules

- Customers can only view their own documents.
- Every document must belong to one customer.
- Related load is mandatory for shipment documents.
- Maximum upload size is 10 MB.
- Duplicate documents are prevented.
- Deleted documents remain in audit logs.
- POD becomes available only after delivery completion.

---

# Permissions

## Customer

- View Documents
- Download Documents
- Upload Documents
- Request Documents

## Dispatcher

- Upload Documents
- Approve Requests
- Share Documents

## Accounts

- Upload Invoices
- View Documents

## Admin

- Full Access

---

# Database Tables

- documents
- document_categories
- document_requests
- document_uploads
- document_versions
- load_documents
- audit_logs

---

# APIs

GET /customer/documents

GET /customer/documents/{id}

POST /customer/documents/upload

POST /customer/documents/request

GET /customer/documents/download/{id}

GET /customer/documents/search

DELETE /customer/documents/{id}

---

# Audit Logs

Track

- Document Uploaded
- Document Downloaded
- Document Viewed
- Document Requested
- Request Completed
- Document Shared
- Document Deleted

---

# Validation Rules

- Document Title is required.
- Category is mandatory.
- Related Load is required for shipment documents.
- Only supported file formats are accepted.
- Maximum upload size is 10 MB.
- Duplicate document names are allowed only if versioned.

---

# Acceptance Criteria

- Customer can view all available documents.
- Search and filters work correctly.
- Documents download successfully.
- Upload functionality works.
- Document requests are submitted successfully.
- PODs become available after delivery.
- Preview works for supported files.
- Notifications are sent correctly.
- Audit logs capture all document activities.
- Fully responsive on Desktop, Tablet, and Mobile.

```

### Messages-&-Support-PRD.md

### Customer Portal → Messages & Support

#### Module Overview

The **Messages & Support** module enables customers to communicate directly with Dispatch, Support, and Accounts teams, manage conversations, create support tickets, track ticket status, and access self-help resources from one centralized communication hub.

---

### Objectives

- Communicate with Dispatch Team
- Raise Support Tickets
- Track Ticket Status
- Receive System Notifications
- Manage Conversations
- Access Help Articles
- Improve Customer Support Experience

---

### Navigation

Customer Portal

→ Messages & Support

---

### Dashboard Summary Cards

Display

- Unread Messages
- Open Tickets
- Awaiting Response
- Resolved Tickets (Last 30 Days)

Each card contains

- Count
- Quick View Link

---

### Header Actions

Buttons

- Message Dispatch
- Create Support Ticket
- More Actions

---

### Conversation Search

Search By

- Conversation
- Load Number
- Subject
- Team Name

---

### Filters

Conversation Type

- All
- Dispatch
- Support
- Accounts
- General

Status

- Open
- Closed
- Awaiting Reply

---

### Conversation List

Display Columns

- Team
- Subject
- Last Message
- Date & Time
- Unread Count
- Status

Supported Teams

- Dispatch Team
- Support Team
- Accounts Team
- Customer Success

---

### Conversation Window

Display

- Team Name
- Conversation Started Date
- Related Load
- Message Timeline
- Read Status
- Attachments

Actions

- Send Message
- Attach File
- View Load
- Close Conversation

---

### Messaging Features

Supported

- Real-Time Chat
- Read Receipts
- Typing Indicator
- File Attachments
- Message History
- Emoji Support (Optional)

---

### Dispatch Contact

Display

- Expected Response Time
- Contact Dispatch Button
- Related Load Information

---

### Support Tickets

Display

- Ticket Number
- Subject
- Created Date
- Category
- Priority
- Status

Supported Status

- Open
- In Progress
- Awaiting Customer
- Resolved
- Closed

---

### Create Support Ticket

Purpose

Allow customers to report issues directly to Hero Logistics Support.

Fields

- Subject Heading *
- Category *
- Priority *
- Problem Description *
- Attachment (Optional)

Supported Categories

- Portal Support
- Billing
- Invoice
- Booking
- Documents
- Tracking
- Technical Issue
- General Enquiry

Priority Levels

- Low
- Normal
- High
- Critical

Buttons

- Submit Ticket
- Cancel

---

### Ticket Workflow

Create Ticket

↓

Support Review

↓

Assigned Agent

↓

In Progress

↓

Customer Reply (If Required)

↓

Resolved

↓

Closed

---

### Attachments

Supported Files

- PDF
- JPG
- PNG
- DOCX
- XLSX

Maximum Size

10 MB

---

### Help Resources

Display

- Customer Portal Guide
- Frequently Asked Questions
- How to Track a Load
- Contact Support
- Knowledge Base

---

### Notifications

Customer receives

- New Message
- Dispatch Reply
- Ticket Created
- Ticket Updated
- Ticket Resolved
- Ticket Closed

Support Team receives

- New Ticket
- Customer Reply
- Attachment Uploaded

---

### Business Rules

- Customers can only view their own conversations.
- Every support ticket receives a unique ticket number.
- Closed tickets become read-only.
- Attachments must not exceed 10 MB.
- Every ticket is linked to one customer account.
- Message history cannot be deleted.

---

### Permissions

#### Customer

- View Conversations
- Send Messages
- Create Tickets
- Reply to Tickets
- Upload Attachments

#### Dispatch Team

- Reply to Dispatch Messages
- Update Load Conversations

#### Support Team

- View Tickets
- Respond
- Resolve Tickets
- Close Tickets

#### Accounts Team

- Respond to Billing Queries

#### Admin

- Full Access

---

### Database Tables

- conversations
- conversation_messages
- support_tickets
- ticket_comments
- ticket_attachments
- help_articles
- notifications
- audit_logs

---

### APIs

GET /customer/messages

POST /customer/messages

GET /customer/messages/{id}

GET /customer/support-tickets

POST /customer/support-tickets

PUT /customer/support-tickets/{id}

POST /customer/support-tickets/reply

GET /customer/help-articles

---

### Audit Logs

Track

- Conversation Opened
- Message Sent
- Message Read
- Ticket Created
- Ticket Updated
- Ticket Resolved
- Attachment Uploaded
- Help Article Viewed

---

### Validation Rules

- Subject is required.
- Category is mandatory.
- Problem Description is required.
- Priority must be selected.
- Maximum attachment size is 10 MB.
- Only supported file formats are accepted.

---

### Acceptance Criteria

- Customer can send messages to Dispatch.
- Conversations update in real-time.
- Support tickets are created successfully.
- Ticket status updates correctly.
- File attachments upload successfully.
- Help articles are accessible.
- Notifications are delivered properly.
- Search and filters work correctly.
- Audit logs record all communication activities.
- Fully responsive on Desktop, Tablet, and Mobile.

```

# Account-&-User-Management-PRD.md

# Customer Portal → Account & User Management

## Module Overview

The **Account & User Management** module allows customers to manage their company profile, portal users, roles, permissions, account settings, notification preferences, and login security. Company administrators can invite team members, assign portal roles, activate/deactivate users, and maintain secure access to the Customer Portal.

---

# Objectives

- Manage company users
- Invite new portal users
- Assign portal roles
- Activate/Deactivate users
- Manage profile information
- Improve account security
- Track user activity

---

# Navigation

Customer Portal

→ Account & User Management

---

# Dashboard Summary

Display

- Total Users
- Active Users
- Pending Invitations
- Disabled Users
- Company Administrator

---

# Header Actions

Buttons

- Add New User
- Export Users
- Refresh
- More Actions

---

# User List

Display Columns

- User Name
- Email
- Phone
- Role
- Status
- Last Login
- Created Date
- Actions

---

# User Status

Supported

- Active
- Pending Invitation
- Disabled
- Locked
- Deleted

---

# Portal Roles

Supported Roles

### Company Administrator

Permissions

- Full Customer Portal Access
- Manage Users
- Create Bookings
- View All Loads
- Pay Invoices
- Download Documents
- Manage Company Settings

---

### Booking User

Permissions

- Create Booking
- View Loads
- View Documents
- Message Dispatch

Cannot

- Manage Users
- Pay Invoices
- Change Company Settings

---

### Finance User

Permissions

- View Invoices
- Pay Invoices
- Download Statements
- View Payment History

---

### Read Only User

Permissions

- View Loads
- View Documents
- View Dashboard

Cannot Edit Any Data

---

# Add New Portal User

Purpose

Invite a new employee to access the Customer Portal.

Fields

## Full Name *

Text

Required

Maximum 100 Characters

Example

Sarah Jenkins

---

## Email Address *

Email

Required

Must be unique.

Example

sarah.jenkins@abctransport.com.au

---

## Phone Number

Optional

Australian Mobile Validation

Example

0400 123 456

---

## Portal Role *

Dropdown

- Company Administrator
- Booking User
- Finance User
- Read Only User

---

## Account Status

Dropdown

- Active
- Pending Invitation
- Disabled

Default

Active

---

Buttons

- Invite User
- Cancel

---

# Invite User Workflow

Company Admin

↓

Enter User Details

↓

Validate Email

↓

Generate Invitation

↓

Send Email Invitation

↓

User Accepts Invitation

↓

Create Password

↓

Account Activated

---

# Edit User

Fields

- Full Name
- Phone Number
- Role
- Status

Actions

- Save Changes
- Cancel

---

# Reset Password

Actions

- Send Reset Email
- Force Password Change
- Unlock Account

---

# Disable User

Confirmation Required

Display

"Are you sure you want to disable this user?"

Buttons

- Disable
- Cancel

---

# Company Profile

Display

- Company Name
- ABN
- Email
- Phone
- Billing Address
- Company Logo

Actions

- Edit
- Save

---

# Notification Settings

Customer Can Configure

- Email Notifications
- SMS Notifications
- Booking Updates
- Invoice Notifications
- POD Notifications
- Marketing Emails

---

# Security Settings

Display

- Change Password
- Two-Factor Authentication (2FA)
- Login Sessions
- Device History
- Login Activity

---

# User Activity

Track

- Last Login
- Last Logout
- Browser
- Device
- IP Address

---

# Notifications

Users receive

- Invitation Email
- Welcome Email
- Password Reset
- Account Activated
- Account Disabled
- Role Changed

Admin receives

- User Joined
- Invitation Accepted
- Failed Login Alerts

---

# Business Rules

- Email address must be unique.
- Invitation expires after 7 days.
- Only Company Administrator can manage users.
- Disabled users cannot log in.
- One company must always have at least one Administrator.
- Deleted users remain in audit logs.

---

# Permissions

## Company Administrator

Full Access

## Booking User

Booking Only

## Finance User

Finance Modules Only

## Read Only User

View Only

---

# Database Tables

- users
- user_roles
- user_permissions
- invitations
- login_history
- notification_settings
- company_profiles
- audit_logs

---

# APIs

GET /customer/users

POST /customer/users

PUT /customer/users/{id}

DELETE /customer/users/{id}

POST /customer/users/invite

POST /customer/users/reset-password

GET /customer/company-profile

PUT /customer/company-profile

---

# Audit Logs

Track

- User Created
- Invitation Sent
- Invitation Accepted
- User Updated
- Role Changed
- User Disabled
- Password Reset
- Login Success
- Login Failed

---

# Validation Rules

- Full Name is required.
- Email must be valid and unique.
- Phone number must be valid.
- Role selection is mandatory.
- Administrator role cannot be removed from the last active admin.

---

# Acceptance Criteria

- Company Admin can invite new users.
- Invitation email is sent successfully.
- User can activate account from email.
- Roles are assigned correctly.
- User status updates properly.
- Password reset works.
- Security settings function correctly.
- Audit logs record all user activities.
- Responsive on Desktop, Tablet, and Mobile.

```


---

## Part 2 — Consolidated Shared Cross-Portal Platform Foundation

**Source classification:** Unique shared sections extracted from the previously created five-portal Master PRD. Repeated embedded portal copies were intentionally excluded because the authoritative portal files follow below.

### Hero Logistics Platform — Master Product Requirements Document

**Document Version:** 1.0  
**Prepared For:** Hero Logistics Product, Operations, Finance, Warehouse, Yard, Design, Engineering, Security and QA Teams  
**Prepared Date:** 05 August 2026  
**Product Type:** Multi-tenant, multi-company, multi-branch logistics operations platform  
**Included Portals:** Admin, Dispatcher, Warehouse, Yard Attendant and Accounts  
**Document Status:** Consolidated baseline PRD for architecture, UX, implementation, API design, QA and UAT  
**Default Region Context:** Australia and New Zealand  
**Default Currency:** AUD, configurable by company  
**Default Timezone:** Australia/Sydney, configurable by branch/depot  

**CONFIDENTIAL**

---

#### Document Control

| Item | Details |
|---|---|
| Product Owner | Hero Logistics / Authorised Company Representative |
| Master Document Purpose | Consolidate five role-based portal PRDs into one implementation baseline |
| Primary Stakeholders | Company Admin, Operations, Dispatch, Warehouse, Yard, Accounts, Compliance, Engineering, QA and Security |
| Source Portals | Admin Portal, Dispatcher Portal, Warehouse Portal, Yard Attendant Portal and Accounts Portal |
| Decision Rule | Shared platform rules apply across portals; portal-specific requirements apply within that portal |
| Conflict Rule | The stricter security, validation, audit or compliance rule applies until the Product Owner confirms otherwise |
| Sample Data Rule | All names, dates, IDs, routes, financial values and counts shown in source screens are illustrative |

##### Revision History

| Version | Date | Change Summary |
|---|---|---|
| 1.0 | 05 Aug 2026 | Consolidated the five approved portal PRDs into one master product specification |

---

#### 1. Executive Summary

Hero Logistics is a unified transport, fleet, warehouse, yard and financial operations platform delivered through role-based portals. The platform coordinates the complete business lifecycle from company setup and load creation through physical inventory handling, transport dispatch, delivery completion, invoicing, payment collection, payroll and reporting.

The five included portals are designed around distinct responsibilities while operating on shared master data and workflow records:

| Portal | Primary Responsibility |
|---|---|
| Admin Portal | Company-wide control, branches, users, roles, fleet, loads, warehouse, finance, compliance and settings |
| Dispatcher Portal | Load planning, driver and asset assignment, live dispatch, GPS monitoring and communication |
| Warehouse Portal | Inbound receiving, inventory control, movements, staging, load lanes, printing and dispatch preparation |
| Yard Attendant Portal | Scan-first physical yard execution, location updates, outbound checks and issue reporting |
| Accounts Portal | Invoices, payments, payroll, expenses, GST/PAYG, P&L, vehicle costs and financial reports |

The system must maintain one authoritative record for each shared entity and expose only the actions and fields required by the authenticated user's company, branch, depot, role and permissions.

---

#### 2. Consolidated Product Vision

Create a secure, real-time logistics operating system that connects commercial, operational, physical and financial workflows without duplicate data entry.

The platform must provide:

- a single source of truth for loads, customers, drivers, vehicles, trailers, inventory and financial records;
- branch- and depot-scoped role access;
- real-time operational status and exception visibility;
- safe and compliant assignment and movement rules;
- complete auditability across all portals;
- shared notifications, documents, messages and reports;
- responsive desktop, tablet and handheld workflows;
- configurable company rules without hard-coded sample values.

---

#### 3. Platform-Wide Objectives

1. Reduce manual coordination across administration, dispatch, warehouse, yard and accounts.
2. Prevent invalid assignments, movements, dispatches and financial transactions.
3. Improve load, asset and workforce utilisation.
4. Maintain accurate inventory and location records.
5. Improve on-time pickup, delivery and customer billing.
6. Support compliance, safety and Chain of Responsibility evidence.
7. Protect tenant, company, branch, employee, customer and financial data.
8. Provide complete operational and financial audit trails.
9. Support scalable multi-company and multi-branch growth.
10. Deliver reliable reporting from shared authoritative data.

---

#### 4. Scope of This Master PRD

##### 4.1 Included Portals

- Company Admin Portal
- Dispatcher Portal
- Warehouse Portal
- Yard Attendant Portal
- Accounts Portal

##### 4.2 Shared Platform Capabilities

- authentication and session management;
- multi-tenant and multi-company isolation;
- branch and depot scope;
- role-based access control;
- global search;
- notifications;
- messages;
- documents and file storage;
- audit logs;
- reporting and export;
- configurable statuses and workflows;
- integration monitoring;
- responsive layouts;
- offline-safe yard and warehouse actions where enabled.

##### 4.3 Related but Separately Specified Portals

The Driver Portal, Customer Portal, Super Admin SaaS Portal and public-facing booking experiences may consume shared workflows but require their own detailed PRDs unless explicitly included in a later revision.

---

#### 5. Portal Relationship and Ownership Model

| Shared Domain | Authoritative Owner / Primary Management Portal | Consuming Portals |
|---|---|---|
| Companies, branches and settings | Admin | All portals |
| Users, roles and permissions | Admin | All portals |
| Customers | Admin / authorised Accounts or Dispatcher users | Dispatcher, Accounts, Warehouse |
| Loads and stops | Dispatcher / Admin | Warehouse, Yard, Accounts |
| Drivers | Admin / authorised Operations roles | Dispatcher, Accounts |
| Vehicles and trailers | Admin / Fleet | Dispatcher, Warehouse, Yard, Accounts |
| Warehouse and yard locations | Admin / Warehouse Manager | Warehouse, Yard, Dispatcher |
| Inventory and item location | Warehouse / Yard execution | Dispatcher, Admin |
| Load lanes and staging | Warehouse / Yard | Dispatcher, Admin |
| GPS and route telemetry | Dispatcher / telematics integration | Admin |
| Invoices and payments | Accounts | Admin reporting |
| Payroll and contractor pay | Accounts | Admin reporting |
| Compliance and safety policies | Admin / Compliance | Dispatcher, Warehouse, Yard, Accounts |
| Reports | Shared reporting service | Permission-based access across portals |

---

#### 6. Cross-Portal End-to-End Workflows

##### 6.1 Load-to-Cash

1. Customer and pricing data are available from authorised master records.
2. Dispatcher or authorised Admin creates a load.
3. The system validates load, route, items, dates and resources.
4. Warehouse and Yard users receive, locate, move and stage related items.
5. Yard/Warehouse marks the load dispatch-ready after required checks.
6. Dispatcher confirms assignment and monitors active transport.
7. Driver and operational teams submit milestones, GPS, documents and proof.
8. Load reaches Delivered and then Completed status.
9. Accounts creates or reviews the related invoice.
10. Invoice is approved and sent.
11. Customer payment is recorded and allocated.
12. Reports and P&L update from posted transactions.

##### 6.2 Inbound-to-Inventory

1. Expected inbound receipt or transfer is created.
2. Warehouse Manager or Yard Attendant receives items by manual entry, import or scan.
3. Condition, documents, photos and identifiers are validated.
4. A valid initial location is assigned.
5. Inventory and movement history are created atomically.
6. Items become available, staged, held or restricted based on rules.

##### 6.3 Inventory-to-Outbound Dispatch

1. Load requirements identify required items.
2. Items are moved from storage to holding/staging areas.
3. Items are assigned to a compatible load lane.
4. Required item count, documents, condition and restrictions are verified.
5. Driver, truck and trailer information is confirmed.
6. Load becomes Dispatch Ready.
7. Yard/Warehouse records physical departure.
8. Dispatcher sees updated active-load and GPS status.

##### 6.4 Compliance and Safety

1. Admin configures required documents, expiry rules and safety checklists.
2. Driver, vehicle, trailer and staff compliance are evaluated.
3. Non-compliant resources are blocked from assignment or work.
4. Yard/Warehouse issues and safety defects are reported with evidence.
5. Authorised supervisors resolve or override according to permission.
6. All decisions remain auditable.

##### 6.5 Payroll and Workforce

1. Workforce shifts and attendance are captured.
2. Approved timesheets and pay rules feed Accounts.
3. Accounts prepares employee or contractor pay.
4. Approval, payment, PAYG and superannuation records are created.
5. Admin and authorised reports receive summary data.

---

#### 7. Shared Role and Access Principles

- Every user belongs to one tenant/company.
- Users may be assigned to one or more branches or depots.
- Access is calculated from role, permissions, scope and record relationship.
- Backend permission checks are mandatory.
- Sensitive fields must be masked unless specifically required.
- View, create, edit, approve, export, override and delete permissions must be distinct.
- Maker-checker separation must apply to high-risk financial and compliance actions.
- Completed operational history and posted financial records must not be physically deleted by normal users.
- Cross-branch and cross-depot access must be explicitly granted.

---

#### 8. Shared Status and Data Consistency Rules

1. Shared entities must have one canonical identifier.
2. Portal-specific labels must map to canonical backend statuses.
3. Status changes must use server-side transition rules.
4. Updates affecting multiple records must be transactional.
5. Concurrent edits must use optimistic locking or equivalent conflict detection.
6. All timestamps must be stored in UTC and displayed in configured local time.
7. All financial values must store currency and precision.
8. Every movement must preserve source and destination.
9. Every assignment must preserve prior and new resources.
10. Every posted financial event must preserve its accounting and audit reference.

---

#### 9. Shared Data Model

Core shared entities include:

- Tenant
- Company
- Branch
- Depot
- Warehouse
- Yard
- Location
- Zone
- Row / Aisle
- Bay / Position
- Staging Area
- Load Lane
- User
- Role
- Permission
- User Scope
- Customer
- Customer Contact
- Load
- Load Stop
- Load Item
- Load Assignment
- Load Status History
- Driver
- Workforce Shift
- Vehicle
- Trailer
- Compliance Document
- Inventory Item
- Inbound Receipt
- Movement
- Transfer
- Dispatch Confirmation
- GPS Position
- Geofence Event
- Message
- Notification
- Document
- Photo
- Safety Checklist
- Issue Report
- Invoice
- Payment
- Payroll Run
- Contractor Claim
- Expense
- Tax Period
- Vehicle Cost
- Report Definition
- Report Run
- Audit Log

The detailed portal chapters define additional fields, states and relationships.

---

#### 10. Shared Integration Requirements

Potential integrations include:

- telematics and GPS;
- mapping, routing and geocoding;
- email, SMS, push and WhatsApp;
- accounting platforms;
- payment gateways;
- bank feeds;
- payroll and timesheets;
- ATO/BAS lodgement;
- document storage and PDF generation;
- barcode, QR and network printers;
- VIN or registration lookup;
- antivirus and file scanning;
- weather and traffic services.

Every integration must support:

- encrypted credentials;
- environment-specific configuration;
- health status;
- retry and idempotency;
- duplicate protection;
- structured logs and correlation IDs;
- visible failure state;
- manual fallback where operationally required.

---

#### 11. Shared Security and Audit Requirements

##### 11.1 Security

- TLS for all communications;
- encryption at rest;
- field-level protection for bank, tax and sensitive identity data;
- secure password hashing;
- optional or enforced 2FA;
- session expiration and device management;
- CSRF protection where applicable;
- XSS and injection prevention;
- secure file upload and malware scanning;
- rate limiting;
- secure secret management;
- backup encryption;
- tenant and branch isolation.

##### 11.2 Audit

The platform must audit:

- authentication;
- role and permission changes;
- load and assignment changes;
- inventory receipts and movements;
- dispatch confirmations;
- compliance and safety decisions;
- messages where required by policy;
- invoice and payment actions;
- payroll and tax actions;
- exports and reports;
- overrides;
- security changes.

Audit records must include actor, role, entity, action, prior value, new value, reason, timestamp, IP/device and correlation ID where applicable.

---

#### 12. Shared Non-Functional Requirements

| Area | Requirement |
|---|---|
| Availability | Target 99.9% monthly availability |
| Performance | Standard filtered lists under 2 seconds under normal load |
| Search | Common indexed searches should return within 1 second |
| Scalability | Support multiple companies, branches, depots and high transaction volumes |
| Responsiveness | Desktop, tablet and task-appropriate handheld layouts |
| Accessibility | Keyboard support, labels, contrast, focus states and non-colour status cues |
| Reliability | Transactional updates and safe retry behaviour |
| Offline | Configurable encrypted queue for supported yard/warehouse actions |
| Observability | Logs, metrics, traces, health checks and alerting |
| Recovery | Documented backup, restore, RPO and RTO targets |
| Browser Support | Current stable Chrome, Edge, Safari and Firefox |

---

#### 13. Unified Release Approach

##### Phase 1 — Shared Foundation and Admin

- tenant/company/branch model;
- authentication;
- RBAC;
- users and roles;
- core master data;
- Admin dashboard and settings;
- audit and notifications.

##### Phase 2 — Dispatch Operations

- load creation;
- planning;
- assignment;
- active loads;
- driver and vehicle views;
- communication.

##### Phase 3 — Warehouse and Yard Execution

- inbound receiving;
- search;
- movement;
- staging;
- load lanes;
- dispatch ready;
- scanning;
- map and issue reporting.

##### Phase 4 — Real-Time and Automation

- live GPS;
- geofences;
- optimisation;
- offline sync;
- advanced printing;
- AI load inbox and operational insights.

##### Phase 5 — Accounts and Compliance

- invoices;
- payments;
- payroll;
- expenses;
- GST/PAYG;
- P&L;
- vehicle costs;
- scheduled reports and integrations.

---

#### 14. Master Definition of Done

The complete platform is ready only when:

- portal-specific functional requirements are implemented;
- shared entity and status mappings are consistent;
- server-side RBAC and scope checks pass;
- cross-portal workflows pass integration testing;
- audit logs cover all high-risk actions;
- financial and operational totals reconcile;
- responsive and accessibility checks pass;
- performance targets pass;
- backup and recovery are verified;
- security testing passes;
- QA and UAT pass;
- API and user documentation are updated;
- monitoring and support procedures are live;
- no critical or high-severity defects remain.

---

#### 15. Detailed Portal Specifications

The following parts preserve the complete detailed requirements from each approved portal PRD. Repeated global requirements should be implemented as shared platform capabilities rather than separate duplicated systems.

---


---

## Part 3 — Company Admin Portal Detailed PRD

**Source classification:** Earlier generated Admin Portal PRD, preserved in full.

### Product Requirements Document

#### Hero Logistics Admin Portal

**Fleet, Load, Warehouse, Finance, Compliance and Operations Management Platform**

| **Document Version** | 1.0                                               |
|----------------------|---------------------------------------------------|
| **Prepared For**     | Hero Logistics - Company Admin & Engineering Team |
| **Prepared Date**    | 5 August 2026                                     |
| **Product Type**     | Multi-branch logistics operations web application |
| **Document Status**  | Baseline PRD for design, development, QA and UAT  |

**CONFIDENTIAL**

### Document Control

| **Item**                 | **Details**                                                                                                                                        |
|--------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| **Owner**                | Product Owner / Company Admin                                                                                                                      |
| **Primary Users**        | Company Admin, Dispatcher, Accounts Manager, Warehouse Manager, Yard Attendant, Sales Representative and operational support staff                 |
| **Related User Portals** | Driver Portal and Customer Portal consume selected data and workflows governed by this Admin Portal.                                               |
| **Source Material**      | Admin portal menu structure, dashboard content, module screens, sample tables, alerts, roles and permission examples supplied by the stakeholder.  |
| **Decision Rule**        | Where the supplied screen copy did not define detailed behaviour, this PRD records a reasonable product assumption and labels it for confirmation. |

> **Important sample-data note:** Dates, names, load references, invoice values, vehicle registrations, branches, counts and financial figures shown in the supplied screens are illustrative test data. Some sample records contain dates after the document date; they must not be interpreted as production records or system time requirements.

#### Revision History

| **Version** | **Date**   | **Author/Owner** | **Change Summary**                                           |
|-------------|------------|------------------|--------------------------------------------------------------|
| 1.0         | 5 Aug 2026 | Product Team     | Initial baseline covering the complete Company Admin portal. |

### Contents

> 1\. Executive Summary
>
> 2\. Product Vision and Objectives
>
> 3\. Product Scope
>
> 4\. Users, Roles and Permissions
>
> 5\. Information Architecture and Navigation
>
> 6\. Command Centre
>
> 7\. Loads and Dispatch
>
> 8\. AI Load Inbox
>
> 9\. Customers
>
> 10\. Live Tracking
>
> 11\. Drivers
>
> 12\. Vehicles
>
> 13\. Branches
>
> 14\. Assets
>
> 15\. Warehouse
>
> 16\. Pricing and Rate Cards
>
> 17\. Payroll
>
> 18\. Finance
>
> 19\. Documents Repository
>
> 20\. Reports and Analytics
>
> 21\. Messages
>
> 22\. Support and Knowledge Base
>
> 23\. Roles and Permissions Administration
>
> 24\. Settings
>
> 25\. Safety Checklists
>
> 26\. Delivery Issues
>
> 27\. End-to-End Workflows
>
> 28\. Data and Entity Model
>
> 29\. Integrations
>
> 30\. Notifications and Automation
>
> 31\. Non-Functional Requirements
>
> 32\. Audit, Security and Compliance
>
> 33\. Analytics and Success Metrics
>
> 34\. Release Scope and Prioritisation
>
> 35\. QA, UAT and Definition of Done
>
> 36\. Risks, Dependencies and Open Decisions
>
> Appendix A. Status Definitions
>
> Appendix B. Permission Catalogue
>
> Appendix C. Screen Inventory

### 1. Executive Summary

Hero Logistics Admin Portal is a central operational command platform for managing logistics loads, dispatch, drivers, fleet vehicles, branch operations, warehouses, assets, pricing, payroll, finance, compliance documents, reports, messaging, support, safety enforcement and delivery exceptions. The portal is intended to provide a single source of truth across multiple branches and countries while preserving role-based access and auditable actions.

- The portal must support day-to-day execution: create and dispatch loads, assign resources, track trips, resolve exceptions and collect proof of delivery.

- The portal must support business control: pricing, payroll, invoicing, cash position, compliance, reporting and approval workflows.

- The portal must support distributed operations across Australia and New Zealand, including branch-level segregation, local time zones and currencies.

- AI-assisted features may recommend or extract information, but users remain accountable for review and approval of operational decisions.

### 2. Product Vision and Objectives

#### 2.1 Vision

Create a secure, reliable and intuitive logistics operations platform that gives authorised users real-time visibility and control from load intake to final delivery, financial settlement and compliance reporting.

#### 2.2 Business Objectives

- Reduce manual dispatch effort and duplicate data entry.

- Improve on-time delivery and fleet utilisation through live telemetry and proactive alerts.

- Prevent non-compliant trips through enforced driver, vehicle and safety checks.

- Accelerate invoicing, payroll preparation and financial reconciliation.

- Provide consistent processes across branches while allowing branch-specific access and configuration.

- Create measurable audit trails for sensitive actions and regulatory evidence.

- Improve customer and driver communication through a central message and support hub.

#### 2.3 Product Principles

- Operational clarity: every load, vehicle, driver and issue has a visible status and owner.

- Exception-first design: overdue, blocked, urgent and non-compliant items are prioritised.

- Least privilege: users see and change only what their assigned role and branch allow.

- Human-controlled AI: AI outputs are suggestions or drafts until an authorised user confirms them.

- Traceability: critical changes include who, what, when, prior value and resulting value.

### 3. Product Scope

#### 3.1 In Scope

- Company Admin portal modules listed in the primary navigation.

- Multi-branch and multi-country operational views.

- Load lifecycle, dispatch, live tracking, safety, delivery exception and completion workflows.

- Driver, vehicle, asset, warehouse and compliance management.

- Pricing, payroll, finance, documents, reports, messages and support.

- Role-based access control, settings, audit logs and integration health.

- Administrative interactions with Driver and Customer portals.

#### 3.2 Out of Scope for This Baseline

- Native mobile application UX specifications; this PRD defines the admin web portal and related workflow contracts only.

- Detailed accounting ledger implementation replacing Xero or another accounting system.

- Hardware procurement or installation for GPS, telematics, temperature sensors, scanners or warehouse devices.

- Exact AI model/vendor selection and model-training strategy.

- Country-specific legal advice; compliance functions must be reviewed by qualified legal, payroll and safety specialists.

- Full customer-facing and driver-facing screen designs except where required to complete an admin workflow.

#### 3.3 Assumptions

- The system is multi-tenant or at minimum company-isolated, and the Company Admin operates only within the assigned company.

- Branches may operate in different time zones and currencies; all records store UTC plus the applicable local time zone.

- The platform exposes APIs or integration services for Driver and Customer portals.

- A load may contain multiple pickup/delivery stops and may be associated with general freight, car carrying or dangerous goods.

- Compliance expiry calculations use configurable warning windows, with 30 days as the default.

- Financial amounts are stored with explicit currency codes and appropriate decimal precision.

### 4. Users, Roles and Permissions

The platform shall use role-based access control (RBAC) with optional custom roles. Permissions are module- and action-specific (show, view, create, edit, delete, manage, export, approve and specialised workflow actions). Branch and company scope must be applied in addition to the assigned role.

| **Role**                 | **Primary Responsibility**                                                                                         |
|--------------------------|--------------------------------------------------------------------------------------------------------------------|
| **Super Admin**          | Platform-wide governance, tenant/company management, global settings and unrestricted support/audit access.        |
| **Company Admin**        | Full company-level administration across operations, users, branches, finance, compliance and settings.            |
| **Dispatcher**           | Create, plan, assign and monitor loads; view drivers, vehicles and yard/warehouse availability.                    |
| **Driver**               | Limited access to assigned loads, vehicle information, checklists, support and own messages through Driver Portal. |
| **Warehouse Manager**    | Manage warehouse stock, tasks, transfers, yard activities and related operational visibility.                      |
| **Accounts Manager**     | Manage invoices, finance, inter-company transfers, payroll-related outputs and financial reporting.                |
| **Yard Attendant**       | Manage yard activities and update relevant vehicle/stock movements with limited operational access.                |
| **Sales Representative** | Manage customers, view loads and invoices, and coordinate support or account communication.                        |
| **Customer**             | Create/view authorised loads, view invoices and create/view support tickets through Customer Portal.               |
| **Custom Role**          | Administrator-defined permission bundle with company and branch scope.                                             |

#### 4.1 Permission Enforcement Rules

- The backend must enforce permissions for every API action; hidden UI controls are not sufficient security.

- A user with view permission but no edit permission may inspect details but cannot save changes.

- Delete, cancel, approve, payroll export, finance export, permission change and checklist enforcement actions require explicit permissions.

- Branch-restricted users can access only records associated with authorised branches unless a cross-branch permission is granted.

- Role and permission changes take effect immediately or on token refresh according to the security architecture, and must be audited.

### 5. Information Architecture and Navigation

The left navigation shall provide clear access to the modules below. Menu visibility is permission-driven. Modules with unread or urgent items may display badges, such as unread Messages or pending AI Load Inbox items.

| **Navigation Item**          | **Purpose**                                                                       |
|------------------------------|-----------------------------------------------------------------------------------|
| **Command Centre**           | Operational overview and high-priority actions.                                   |
| **Loads**                    | All loads, statuses, filters, bulk actions and load details.                      |
| **Load Inbox**               | AI-assisted and field-submitted draft loads awaiting review.                      |
| **Customers**                | Customer master records, contacts, contracts and related activity.                |
| **Live Tracking**            | Real-time fleet map, telemetry and route monitoring.                              |
| **Drivers**                  | Driver profiles, availability, compliance, assignments and performance.           |
| **Vehicles**                 | Fleet inventory, assignments, service and compliance.                             |
| **Branches**                 | Company branch list, configuration, summary and setup.                            |
| **Assets**                   | Non-vehicle asset register, assignments, condition and maintenance.               |
| **Warehouse**                | Warehouses, inventory, movements, shipments and tasks.                            |
| **Pricing**                  | Rate cards, freight lanes, vehicle rates, fuel surcharge and customer rates.      |
| **Payroll**                  | Driver/staff earnings, pay runs, timesheets and compliant exports.                |
| **Finance**                  | Revenue, expenses, invoices, cash flow and transactions.                          |
| **Documents**                | Central document vault across company, driver, vehicle and customer folders.      |
| **Reports & Analytics**      | Operational, financial, compliance and AI insight reports.                        |
| **Messages**                 | Conversations, announcements, templates and communication analytics.              |
| **Support & Knowledge Base** | Tickets, open requests, articles and FAQs.                                        |
| **Roles & Permissions**      | Role creation and module/action permission administration.                        |
| **Settings**                 | Company, users, workflows, integrations, AI, notifications, security and billing. |
| **Safety Checklists**        | Pre-trip checklist configuration and trip-block enforcement.                      |
| **Delivery Issues**          | Operational exceptions, severity, status, owner and resolution history.           |

### 6. Command Centre

**Purpose.** Provide an executive and operational overview of fleet activity, workload, revenue, messages, support, invoice exposure, driver alerts and maintenance due items.

**Primary data displayed or captured.** Aggregated load counts, active/total fleet, revenue, branches, depots, messages, tickets, invoices, driver compliance alerts and vehicle maintenance alerts.

**Key business rules.**

- MTD comparisons use the previous equivalent calendar period unless the organisation configures another rule.

- Monetary KPIs must display the company or branch currency.

| **ID** | **Area**         | **Requirement**                                                                                                             | **Priority** |
|--------|------------------|-----------------------------------------------------------------------------------------------------------------------------|--------------|
| CC-001 | KPIs             | Display Loads MTD, Active Fleet, Monthly Revenue, active Branches and Total Depots with period comparison where applicable. | Must         |
| CC-002 | Actions          | Provide quick actions for New Load, Assign Driver, Track Load, Create Customer, Create Invoice and a More Actions launcher. | Must         |
| CC-003 | Load Status      | Show current-month status breakdown for Draft, Assigned/Planned, In Transit/Active, Delivered/Completed and Cancelled.      | Must         |
| CC-004 | Operational Feed | Show recent loads, unread messages, support ticket summary, driver alerts and maintenance due cards.                        | Must         |
| CC-005 | Finance Snapshot | Show pending invoice total and near-due invoices with customer, amount and due timing.                                      | Must         |
| CC-006 | Navigation       | Each card and View All action must open the relevant filtered module.                                                       | Must         |
| CC-007 | Refresh          | Dashboard data must show last refresh time and support automatic refresh without resetting user context.                    | Should       |

###### Acceptance Criteria

- Authorised users see only KPI values and records within their company and branch scope.

- Clicking a status count opens Loads pre-filtered to that status and reporting period.

- Critical/overdue alerts are visually distinct and sorted ahead of informational items.

- Dashboard totals reconcile with the source modules for the same filters and date range.

### 7. Loads and Dispatch

**Purpose.** Create, plan, assign, monitor, complete, cancel, import and export loads across the organisation.

**Primary data displayed or captured.** Load reference/PO, customer, type, cargo, stops, addresses/geocodes, pickup windows, delivery window, driver, vehicle, branch, progress, pricing, documents, issues and timestamps.

**Key business rules.**

- Load references must be unique within the company.

- Dangerous Goods loads trigger specialised driver, vehicle, document and checklist requirements.

- All changes after dispatch are audited.

| **ID** | **Area**       | **Requirement**                                                                                                                                 | **Priority** |
|--------|----------------|-------------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| LD-001 | List           | Display load reference, status/sub-status, type, customer, route/stops, driver/vehicle, pickup date, ETA/delivery, progress and actions.        | Must         |
| LD-002 | Statuses       | Support Draft, Planned/Assigned, Active, Completed and Cancelled with configured sub-statuses such as Ready, En Route, At Stop and Delivered.   | Must         |
| LD-003 | Filters        | Filter by status, load type, customer, driver, vehicle, location, date and advanced criteria; support reset.                                    | Must         |
| LD-004 | Table Controls | Support column selection, grouping, sorting, pagination and selectable rows.                                                                    | Should       |
| LD-005 | Bulk Actions   | Allow authorised users to assign a driver, mark completed, cancel or export selected loads with validation.                                     | Must         |
| LD-006 | Create/Edit    | New Load must capture customer, load type, references, origin, destination, stops, cargo, dates, service requirements, pricing and attachments. | Must         |
| LD-007 | Assignment     | Assign an available and compliant driver and suitable vehicle; warn or block invalid assignments.                                               | Must         |
| LD-008 | Progress       | Calculate route/load progress based on completed stops or live trip state and show exceptions.                                                  | Must         |
| LD-009 | Import/Export  | Import loads from a validated template and export the current view or selected rows.                                                            | Should       |
| LD-010 | Alerts         | Show load-specific delay risk, missing documents, break warnings and other operational alerts.                                                  | Must         |
| LD-011 | History        | Maintain status, assignment, pricing, stop and document change history.                                                                         | Must         |

###### Acceptance Criteria

- A Draft load can be saved without assignment; an Active trip cannot begin until required validations pass.

- A driver or vehicle cannot be assigned if unavailable, out of service or blocked by mandatory compliance, unless a permitted override exists and is audited.

- Cancelling a load requires a reason and prevents further trip updates unless restored by an authorised role.

- Completing a load requires all mandatory stops and proof-of-delivery requirements to be satisfied or an audited exception approval.

- Bulk actions return per-record success/failure results rather than silently skipping invalid loads.

### 8. AI Load Inbox

**Purpose.** Collect field-submitted, email, portal and file-upload load drafts, extract structured details and route them to an authorised reviewer for dispatch.

**Primary data displayed or captured.** Source type, original content/attachment, extracted fields, field confidence, urgency, validation issues, reviewer, review time and resulting load ID.

**Key business rules.**

- AI outputs are advisory and must never bypass role, safety, compliance or financial controls.

- Uploaded content must be malware-scanned and access-controlled.

| **ID** | **Area**            | **Requirement**                                                                                                   | **Priority** |
|--------|---------------------|-------------------------------------------------------------------------------------------------------------------|--------------|
| AI-001 | Sources             | Support draft creation from Email Booking, Customer Portal, PDF/File Upload and manual entry.                     | Must         |
| AI-002 | Queue               | Display draft ID, source reference, urgency, confidence, received time, driver, vehicle, cargo and route summary. | Must         |
| AI-003 | Filters             | Filter by All Inbox, source, urgency and confidence; search by draft ID, driver, route or PO reference.           | Must         |
| AI-004 | Review              | Open a review screen showing original source content beside extracted fields and validation warnings.             | Must         |
| AI-005 | Correction          | Allow authorised users to edit extracted data before conversion to a real load.                                   | Must         |
| AI-006 | Confidence          | Assign High, Medium or Low confidence at field and draft level, with configurable review thresholds.              | Should       |
| AI-007 | Dispatch            | Convert an approved draft into a load and optionally assign/dispatch it in one controlled workflow.               | Must         |
| AI-008 | Duplicate Detection | Warn when source reference, PO, customer, route and dates indicate a possible duplicate.                          | Should       |
| AI-009 | Audit               | Retain source file/message, extracted values, reviewer changes and approval result.                               | Must         |

###### Acceptance Criteria

- No AI-generated draft becomes an active operational load without an authorised human confirmation.

- Required fields and compliance validations must pass before dispatch.

- Low-confidence fields are highlighted and reviewer correction is recorded.

- Urgent drafts are sorted above normal drafts and may generate notifications.

- Converting a draft creates a link between the inbox record and final load.

### 9. Customers

**Purpose.** Maintain customer accounts, contacts, service preferences, contracts, pricing relationships, billing data and operational history.

**Primary data displayed or captured.** Customer identity, contacts, billing and service addresses, tax/registration details, credit/payment terms, branches, contracts, rate cards, portal users and status.

**Key business rules.**

- A customer may operate across multiple branches and have multiple authorised contacts.

- Customer-specific rates override standard rates only when active and date-valid.

| **ID** | **Area**        | **Requirement**                                                                                                                  | **Priority** |
|--------|-----------------|----------------------------------------------------------------------------------------------------------------------------------|--------------|
| CU-001 | Customer Master | Create, view, edit, archive and search customer records.                                                                         | Must         |
| CU-002 | Profile         | Store legal name, trading name, account code, addresses, contacts, tax details, payment terms and assigned sales representative. | Must         |
| CU-003 | Operations      | Show customer loads, active shipments, delivery issues, PODs and service notes.                                                  | Must         |
| CU-004 | Commercial      | Associate customer rate cards, contracts, credit terms, discounts and fuel surcharge rules.                                      | Must         |
| CU-005 | Finance         | Show invoices, outstanding amount, overdue balance and payment history subject to permission.                                    | Must         |
| CU-006 | Portal Access   | Invite, suspend and manage customer portal users.                                                                                | Should       |
| CU-007 | Documents       | Link contracts, PODs, insurance, account forms and other customer documents.                                                     | Must         |
| CU-008 | Status          | Support Prospect, Active, On Hold and Archived customer states.                                                                  | Should       |

###### Acceptance Criteria

- Customer account codes are unique within the company.

- Archived customers remain available for historical reporting but cannot be selected for new loads unless reactivated.

- Credit hold or overdue rules can warn or block new bookings based on configured workflow.

- Sensitive financial/tax fields are visible only to authorised roles.

### 10. Live Tracking

**Purpose.** Provide real-time map visibility, telemetry, route monitoring, fleet state and actionable alerts.

**Primary data displayed or captured.** Vehicle ID, driver, coordinates, event timestamp, speed, state, heading, sensor readings, load, route, ETA and alert state.

**Key business rules.**

- Telemetry frequency depends on the connected provider and plan; the UI must not claim “live” when data is stale.

- All timestamps are stored in UTC and displayed in the relevant local time zone.

| **ID** | **Area**      | **Requirement**                                                                                                        | **Priority** |
|--------|---------------|------------------------------------------------------------------------------------------------------------------------|--------------|
| TR-001 | Map           | Display active vehicles on a map with pan, zoom, reset and map settings.                                               | Must         |
| TR-002 | Fleet KPIs    | Show active vehicles, on-time rate, critical alerts and average fleet speed.                                           | Must         |
| TR-003 | Vehicle Panel | Search and filter vehicles by All, In Transit, Idle, Alert and Maintenance.                                            | Must         |
| TR-004 | Telemetry     | Show last location, timestamp, speed, heading, ignition/state and available sensor information.                        | Must         |
| TR-005 | Load Context  | Link tracked vehicle to current driver, active load, route, stops, ETA and issues.                                     | Must         |
| TR-006 | Alerts        | Generate geofence, route deviation, excessive idle, sensor, speed, connectivity and ETA alerts based on configuration. | Should       |
| TR-007 | History       | Provide authorised playback or location history for a selected period.                                                 | Should       |
| TR-008 | Privacy       | Apply retention, role access and masking rules to driver/location data.                                                | Must         |

###### Acceptance Criteria

- The map displays a clear “last updated” time and stale/offline state.

- Selecting a vehicle opens its current load and telemetry summary.

- Critical alerts can be acknowledged, assigned and linked to a delivery issue.

- Tracking data is restricted by company and branch scope.

- Temporary telemetry loss does not overwrite the last known valid position.

### 11. Drivers

**Purpose.** Manage driver identity, contact details, licences, employment/engagement status, branch, availability, assignments, compliance and performance.

**Primary data displayed or captured.** Driver ID, name, DOB/age display, phone/email, address, branch, licence number/class/state/expiry, status, documents, training, assignments and performance.

**Key business rules.**

- Age should be calculated from DOB rather than stored as an independent value.

- Driver recommendations must consider availability, qualifications, location, hours/fatigue, route experience and branch rules when data is available.

| **ID** | **Area**     | **Requirement**                                                                                                   | **Priority** |
|--------|--------------|-------------------------------------------------------------------------------------------------------------------|--------------|
| DR-001 | List         | Display driver name, ID, contact, licence, status, branch, assignment, compliance and action menu.                | Must         |
| DR-002 | Profile      | Create and maintain personal/contact details, licence classes, employment details, emergency contacts and branch. | Must         |
| DR-003 | Availability | Support On Duty, Off Duty, On Leave and Unavailable states with effective dates/reasons.                          | Must         |
| DR-004 | Compliance   | Track licence, medical, fatigue, training, dangerous goods and other required documents with expiry.              | Must         |
| DR-005 | Assignment   | Show current and upcoming load assignments and prevent conflicting assignment.                                    | Must         |
| DR-006 | Performance  | Calculate/display compliance and operational performance indicators with transparent definitions.                 | Should       |
| DR-007 | Insights     | Provide expiring-document alerts, suggested drivers and performance watch lists.                                  | Should       |
| DR-008 | Bulk         | Support driver import, document upload, availability calendar and export.                                         | Should       |
| DR-009 | Portal       | Manage driver portal access, activation and reset/security actions.                                               | Should       |

###### Acceptance Criteria

- A driver cannot start a load when a mandatory licence, medical or checklist requirement is invalid.

- Availability changes immediately affect assignment suggestions and validation.

- Expiring soon uses the configured warning threshold and shows the exact expiry date.

- Compliance score calculation is documented and does not hide the underlying missing/expiring items.

- Sensitive personal fields are restricted and audited when viewed or edited.

### 12. Vehicles

**Purpose.** Maintain the fleet register, current assignments, status, odometer, service schedules, compliance and operating condition.

**Primary data displayed or captured.** Vehicle ID, registration, VIN/chassis, type, make, model, year, branch, status, driver, odometer, capacity, service schedule, compliance and documents.

**Key business rules.**

- Maintenance due may be time-based, distance-based or both.

- Vehicle type and capacity must be validated against load requirements.

| **ID** | **Area**      | **Requirement**                                                                                                      | **Priority** |
|--------|---------------|----------------------------------------------------------------------------------------------------------------------|--------------|
| VH-001 | List          | Display vehicle ID/name, registration, type/make/model, year, status, driver, odometer, compliance and next service. | Must         |
| VH-002 | Profile       | Store ownership, specifications, capacity, branch, registration, insurance, roadworthy and operational attributes.   | Must         |
| VH-003 | Status        | Support Active, In Maintenance, Out of Service, Sold and Inactive states.                                            | Must         |
| VH-004 | Assignment    | Associate current driver/load and retain assignment history.                                                         | Must         |
| VH-005 | Maintenance   | Track scheduled and corrective maintenance, odometer thresholds, costs and due/overdue status.                       | Must         |
| VH-006 | Compliance    | Track registration, insurance, roadworthy and configured compliance documents.                                       | Must         |
| VH-007 | Insights      | Show overdue compliance, upcoming service and maintenance recommendations.                                           | Should       |
| VH-008 | Import/Export | Support controlled bulk import and export of the fleet register.                                                     | Should       |

###### Acceptance Criteria

- Out-of-service, sold or inactive vehicles cannot be assigned to new loads.

- A compliance or maintenance block prevents trip start unless an explicit, authorised exception process is configured.

- Odometer updates retain source and timestamp.

- Vehicle list totals reconcile with status and compliance summaries.

- Registration numbers are unique within the relevant jurisdiction/company rule.

### 13. Branches

**Purpose.** Configure and manage organisational branches, depots and operational locations across countries.

**Primary data displayed or captured.** Name, code, legal company, address, country, region, manager, status, branch type, phone, time zone, currency, established date and setup state.

**Key business rules.**

- Depots may be represented as branches or subordinate locations depending on final data architecture; this requires confirmation.

- Branch deletion is not allowed after transactional activity; use status-based closure.

| **ID** | **Area** | **Requirement**                                                                                        | **Priority** |
|--------|----------|--------------------------------------------------------------------------------------------------------|--------------|
| BR-001 | List     | Display branch name/code, company, country, state/region, manager, status and recent load volume.      | Must         |
| BR-002 | Profile  | Capture address, contact, time zone, currency, branch type, manager and operating details.             | Must         |
| BR-003 | Status   | Support Active, Inactive, Pending Setup and Closed.                                                    | Must         |
| BR-004 | Summary  | Show branch totals, top branches by load volume and location map.                                      | Should       |
| BR-005 | Setup    | Provide branch setup checklist covering users, warehouse, pricing, integrations and required settings. | Should       |
| BR-006 | Bulk     | Support branch import and export with validation.                                                      | Could        |
| BR-007 | Scope    | Use branch assignments to restrict data access and default module filters.                             | Must         |

###### Acceptance Criteria

- Branch code is unique within the company.

- A branch cannot be closed while active loads, payroll runs or uncompleted operational tasks remain unless a migration/closure workflow is completed.

- Branch local time zone and currency are applied to relevant displays and records.

- Pending Setup branches are not available for normal operational assignment until mandatory setup items are complete.

### 14. Assets

**Purpose.** Manage non-vehicle operational assets such as forklifts, containers, material-handling equipment, generators, scanners, workshop equipment and PPE.

**Primary data displayed or captured.** Asset ID, QR value, name, category, type/model, serial number, branch, location, assignee, status, condition, service dates, compliance and documents.

**Key business rules.**

- Category-specific fields and maintenance schedules may be configurable.

- PPE may require per-user issue and expiry tracking.

| **ID** | **Area**    | **Requirement**                                                                                               | **Priority** |
|--------|-------------|---------------------------------------------------------------------------------------------------------------|--------------|
| AS-001 | Register    | Create and manage an asset register with asset ID, QR code, name, category, type, branch/location and status. | Must         |
| AS-002 | Assignment  | Assign assets to warehouses, yards, teams, users or other supported entities and retain history.              | Must         |
| AS-003 | Condition   | Track condition such as Good, Fair and Poor with inspection notes.                                            | Must         |
| AS-004 | Maintenance | Track next service, due, overdue and repair-required states.                                                  | Must         |
| AS-005 | Compliance  | Track certifications, inspections and expiry alerts where applicable.                                         | Must         |
| AS-006 | QR          | Generate and scan asset QR codes to open or update authorised asset records.                                  | Should       |
| AS-007 | Categories  | Allow authorised management of asset categories and types.                                                    | Should       |
| AS-008 | Bulk        | Support CSV import and export.                                                                                | Should       |

###### Acceptance Criteria

- Asset IDs are unique within the company.

- Out-of-service assets cannot be assigned to active operational use.

- Failed or overdue maintenance is clearly visible and may block task assignment according to category rules.

- Assignment and location changes are auditable.

- Compliance summaries reconcile with item-level records.

### 15. Warehouse

**Purpose.** Manage warehouse locations, inventory, stock movements, incoming/outgoing shipments, picking, put-away, transfers, cycle counts and operational alerts.

**Primary data displayed or captured.** Warehouse, item/SKU, unit, bin/location, lot/serial, expiry, quantities, cost/value, movement, task, shipment, branch and user.

**Key business rules.**

- Whether the warehouse is a full WMS or a lighter operational inventory module must be confirmed.

- Barcode support is recommended alongside QR where hardware permits.

| **ID** | **Area**       | **Requirement**                                                                                           | **Priority** |
|--------|----------------|-----------------------------------------------------------------------------------------------------------|--------------|
| WH-001 | Warehouse List | Display warehouse name/code, branch/location, type, status, stock items, inventory value and utilisation. | Must         |
| WH-002 | Inventory      | Track item/SKU, quantities by Available, Reserved, In Transit and On Order, location/bin and value.       | Must         |
| WH-003 | Movements      | Record stock in, stock out, transfers and adjustments with reason, user and timestamp.                    | Must         |
| WH-004 | Tasks          | Create and manage pick, put-away, transfer and cycle-count tasks with due times and owners.               | Must         |
| WH-005 | Shipments      | Track incoming and outgoing shipments and link to loads or purchase orders where applicable.              | Must         |
| WH-006 | Alerts         | Generate low-stock, expiry, overdue-task and shipment-arrival alerts.                                     | Must         |
| WH-007 | Dashboard      | Show warehouse KPIs, locations, inventory summary, movements, pending tasks and recent activity.          | Must         |
| WH-008 | Controls       | Prevent negative inventory unless authorised adjustment rules allow it.                                   | Must         |
| WH-009 | Export         | Export warehouse and stock views subject to permission.                                                   | Should       |

###### Acceptance Criteria

- Every stock movement changes inventory through a controlled transaction and creates an immutable movement record.

- Reserved quantity cannot exceed available stock unless backorder/on-order rules are enabled.

- Transfers show source decrement and destination in-transit/receipt states.

- Inventory value uses the configured costing method and currency.

- Overdue tasks appear in alerts and may be escalated to supervisors.

### 16. Pricing and Rate Cards

**Purpose.** Configure company-wide and customer-specific pricing for freight lanes, vehicle classes, fuel surcharge and contract rates.

**Primary data displayed or captured.** Rate card, customer, origin, destination, distance band, vehicle/load type, base rate, minimum charge, per-km rate, fuel surcharge, currency, tax and effective dates.

**Key business rules.**

- Tax calculation may be delegated to Finance/accounting configuration.

- Route distance source and rounding rules must be configured.

| **ID** | **Area**       | **Requirement**                                                                                     | **Priority** |
|--------|----------------|-----------------------------------------------------------------------------------------------------|--------------|
| PR-001 | Lane Pricing   | Manage origin/destination, minimum charge, base linehaul, per-kilometre rate, fuel levy and status. | Must         |
| PR-002 | Vehicle Matrix | Configure rates by vehicle type/class and applicable load/service conditions.                       | Must         |
| PR-003 | Customer Rates | Create customer-specific rate cards with effective dates and priority over standard rates.          | Must         |
| PR-004 | Fuel Matrix    | Configure surcharge percentages by fuel index, region, date range or rule.                          | Must         |
| PR-005 | Calculation    | Calculate quoted/load charge using the applicable rate hierarchy and retain a pricing breakdown.    | Must         |
| PR-006 | Import/Export  | Import validated rate sheets and export pricing to Excel.                                           | Should       |
| PR-007 | Approval       | Optionally require approval for new or changed rate cards.                                          | Should       |
| PR-008 | Versioning     | Retain effective dates, version history and who changed a rate.                                     | Must         |

###### Acceptance Criteria

- The pricing engine selects the most specific active rate in a documented order: customer special rate, contract rate, lane/vehicle rate, then manual permitted rate.

- Expired or future rates do not apply outside their effective period.

- Pricing changes do not retroactively alter an approved load or invoice unless an authorised repricing action is completed.

- Manual overrides require reason and permission and are audited.

- Imported rows return clear validation errors.

### 17. Payroll

**Purpose.** Manage driver and staff payroll runs, approved timesheets, mileage and allowances, payslips, bank export and Single Touch Payroll readiness.

**Primary data displayed or captured.** Pay run, employee/driver, pay period, branch, hours, trips, mileage, rates, allowances, deductions, gross, tax/super fields, net, approval, payslip and export status.

**Key business rules.**

- Actual payroll and STP implementation must be validated by an Australian payroll specialist and supported provider.

- The system may integrate with a payroll platform instead of calculating every statutory value internally.

| **ID** | **Area**   | **Requirement**                                                                        | **Priority** |
|--------|------------|----------------------------------------------------------------------------------------|--------------|
| PY-001 | Runs       | Create weekly, fortnightly or configured payroll runs by branch and pay period.        | Must         |
| PY-002 | Timesheets | Import or calculate approved hours, trips, mileage, overtime and other earning inputs. | Must         |
| PY-003 | Rates      | Apply employee/driver pay rates, allowances, deductions and configured rules.          | Must         |
| PY-004 | Review     | Provide draft, pending review, approved, completed and failed/cancelled states.        | Must         |
| PY-005 | Breakdown  | Show driver/employee pay breakdown and exceptions before approval.                     | Must         |
| PY-006 | Payslips   | Generate downloadable payslips after approval/completion.                              | Must         |
| PY-007 | ABA        | Generate an authorised ABA/bank payment file with validation and audit.                | Must         |
| PY-008 | STP        | Prepare STP-compliant output or integration status and lodgement readiness.            | Must         |
| PY-009 | Export     | Export payroll summaries and reconciliation reports.                                   | Should       |

###### Acceptance Criteria

- Only approved timesheets and earnings inputs are included in an approvable pay run.

- A completed pay run is locked from direct editing; corrections use adjustment or reversal workflows.

- ABA and STP exports require explicit permission and are logged.

- Payroll totals reconcile to individual employee/driver breakdowns.

- Sensitive payroll data is not visible to operational roles without finance/payroll permission.

### 18. Finance

**Purpose.** Provide financial visibility and operational transaction management for revenue, expenses, invoices, receivables, payables, cash position and profitability.

**Primary data displayed or captured.** Invoice, customer, load, line items, tax, due date, status, payment, transaction, expense category, branch, bank/accounting reference and currency.

**Key business rules.**

- The accounting system of record must be designated during implementation.

- Cross-currency consolidation rules require confirmation.

| **ID** | **Area**         | **Requirement**                                                                                                           | **Priority** |
|--------|------------------|---------------------------------------------------------------------------------------------------------------------------|--------------|
| FN-001 | Dashboard        | Show total revenue, expenses, net profit, outstanding invoices, cash in bank and overdue invoices with period comparison. | Must         |
| FN-002 | Charts           | Show revenue, expenses and cash flow trends for the selected date range.                                                  | Must         |
| FN-003 | Invoices         | Create, view, issue, send, mark/record payment, credit and cancel invoices according to workflow.                         | Must         |
| FN-004 | Transactions     | Record authorised income/expense transactions with category, branch, reference and attachments.                           | Must         |
| FN-005 | Receivables      | Track outstanding and overdue invoices, ageing and reminders.                                                             | Must         |
| FN-006 | Expense Analysis | Show expense category breakdown such as fuel, staff, maintenance, warehouse and other.                                    | Must         |
| FN-007 | Cash Position    | Show cash in bank, accounts receivable, accounts payable and available credit when connected data exists.                 | Should       |
| FN-008 | Filters/Export   | Filter by branch, payment status and date; export authorised reports.                                                     | Must         |
| FN-009 | Integration      | Synchronise with configured accounting/payment systems and surface sync status/errors.                                    | Should       |

###### Acceptance Criteria

- Financial dashboard values reconcile to the underlying transactions or connected accounting source.

- Invoice totals match line items, tax, surcharge, discounts and payments/credits.

- Editing an issued invoice follows controlled revision/credit rules rather than silent overwrite.

- Payment gateway status is not treated as final settlement until the system receives a verified result.

- Currency and branch scope are explicit in all financial totals.

### 19. Documents Repository

**Purpose.** Provide a secure, searchable document vault for company, driver, vehicle and customer documents, including compliance status and entity linkage.

**Primary data displayed or captured.** Document ID, title, file, MIME type, size, checksum, category, entity, tags, issue/expiry, verification status, access scope, uploader and versions.

**Key business rules.**

- Retention policies may differ for PODs, contracts, payroll and safety evidence.

- Electronic signature requirements are not fully specified and may require a later integration.

| **ID** | **Area**   | **Requirement**                                                                                          | **Priority** |
|--------|------------|----------------------------------------------------------------------------------------------------------|--------------|
| DO-001 | Folders    | Organise documents under Company, Driver, Vehicle and Customer categories with optional subfolders/tags. | Must         |
| DO-002 | Upload     | Upload supported file types with title, category, entity, status, issue/expiry dates and access scope.   | Must         |
| DO-003 | List       | Display title, category, associated entity, size, uploaded by, upload date, status and actions.          | Must         |
| DO-004 | Search     | Search by document title, entity, category, reference or tags and filter by status/expiry.               | Must         |
| DO-005 | Versioning | Support replacement/new versions without losing historical evidence.                                     | Must         |
| DO-006 | Compliance | Generate expiry alerts and feed driver/vehicle/company compliance state.                                 | Must         |
| DO-007 | Security   | Scan uploads, enforce role/entity access and prevent public unauthorised URLs.                           | Must         |
| DO-008 | Audit      | Log upload, view/download where required, change, verify and delete/archive actions.                     | Must         |

###### Acceptance Criteria

- A document linked to a required compliance item affects compliance status after verification according to configuration.

- Deleting an in-use compliance record uses archive/retention rules rather than irreversible removal.

- File type, size and malware validation occurs before the document becomes available.

- Users cannot access documents outside company/branch/entity permissions even with a guessed URL.

- Version history identifies the active version.

### 20. Reports and Analytics

**Purpose.** Enable authorised users to access, generate, export, schedule and analyse operational, financial, compliance and AI insight reports.

**Primary data displayed or captured.** Report definition, category, parameters, filters, dataset, owner, schedule, recipients, format, run history, download and status.

**Key business rules.**

- Emailing reports containing sensitive data must follow data classification rules.

- Exact report catalogue should be maintained as a separate report specification.

| **ID** | **Area**      | **Requirement**                                                                              | **Priority** |
|--------|---------------|----------------------------------------------------------------------------------------------|--------------|
| RP-001 | Catalogue     | Organise reports into Operations, Financial, Compliance and Analytics & Insights categories. | Must         |
| RP-002 | Search/Filter | Search by name/category/keyword and filter by type, status and date range.                   | Must         |
| RP-003 | Run           | Generate reports with user-selected parameters and branch/company scope.                     | Must         |
| RP-004 | Export        | Export supported formats such as PDF, CSV and Excel based on report type.                    | Must         |
| RP-005 | Schedule      | Schedule reports with recurrence, recipients, filters, format and active status.             | Must         |
| RP-006 | Favourites    | Allow users to favourite reports and view recent history.                                    | Should       |
| RP-007 | Custom Report | Provide a controlled custom report builder using approved datasets/fields.                   | Should       |
| RP-008 | Insights      | Surface AI-generated or rule-based trends and risks with supporting data links.              | Should       |
| RP-009 | Audit         | Track generated, downloaded and scheduled report activity.                                   | Must         |

###### Acceptance Criteria

- Report results respect the requesting user’s permissions and branch scope.

- Scheduled reports do not send data to unauthorised recipients.

- Every report displays report period, data refresh time, filters and currency/time-zone context.

- AI insights link to the data or records supporting the statement and are labelled as insights, not audited facts.

- Large exports are processed reliably with status and error reporting.

### 21. Messages

**Purpose.** Provide a central communication hub for direct messages, teams, drivers, warehouses, branches, customers, announcements and message analytics.

**Primary data displayed or captured.** Conversation, participant, entity, message body, channel, attachments, timestamps, delivery/read status, branch, announcement audience and template.

**Key business rules.**

- Email/SMS/portal delivery may be represented in one conversation with channel-specific statuses.

- Moderation and retention rules require company policy confirmation.

| **ID** | **Area**      | **Requirement**                                                                              | **Priority** |
|--------|---------------|----------------------------------------------------------------------------------------------|--------------|
| MS-001 | Inbox         | Show unread-first inbox with participant, role/entity, preview, time and unread count.       | Must         |
| MS-002 | Conversations | Create and continue authorised one-to-one or group conversations.                            | Must         |
| MS-003 | Participants  | Support users, drivers, teams, branches, warehouses and customers according to access rules. | Must         |
| MS-004 | Announcements | Create and publish targeted announcements with author, date and audience.                    | Must         |
| MS-005 | Broadcast     | Send broadcast/alert messages to permitted audiences with confirmation.                      | Should       |
| MS-006 | Templates     | Create and use approved message templates and automated message content.                     | Should       |
| MS-007 | Attachments   | Attach authorised documents/images with secure storage and scanning.                         | Should       |
| MS-008 | Status        | Track sent, delivered, failed and read state where supported.                                | Should       |
| MS-009 | Analytics     | Show message activity, replies, read rate and delivery success.                              | Should       |

###### Acceptance Criteria

- Unread counts update when messages are opened/read and reconcile with the menu badge.

- Users can message only participants available within their permission and company scope.

- Broadcasts require confirmation and are audited.

- Delivery status accurately reflects the connected channel and does not falsely indicate read state.

- Archived or deleted conversation behaviour follows retention policy.

### 22. Support and Knowledge Base

**Purpose.** Allow users to raise, track, triage and resolve support requests while providing searchable self-service articles and FAQs.

**Primary data displayed or captured.** Ticket ID, requester, subject, description, category, priority, status, owner, related entity, comments, attachments, SLA timestamps and resolution.

**Key business rules.**

- Support ownership may be internal staff or platform support; escalation paths require confirmation.

- Ticket dates in supplied examples are sample data.

| **ID** | **Area**       | **Requirement**                                                                               | **Priority** |
|--------|----------------|-----------------------------------------------------------------------------------------------|--------------|
| SP-001 | My Tickets     | Show a user’s tickets with ID, subject, status, priority, created/updated dates and details.  | Must         |
| SP-002 | Open Tickets   | Provide authorised company-wide queue with search and priority/status filtering.              | Must         |
| SP-003 | Create         | Raise a ticket with category, subject, description, priority, attachments and related entity. | Must         |
| SP-004 | Workflow       | Support Open, In Progress, Waiting and Resolved/Closed statuses with owner and history.       | Must         |
| SP-005 | Comments       | Support requester/support replies, internal notes and attachments.                            | Must         |
| SP-006 | SLA            | Track response and resolution targets by priority where configured.                           | Should       |
| SP-007 | Knowledge Base | Search and browse categories and popular articles.                                            | Must         |
| SP-008 | Article Admin  | Authorised users can create, edit, publish, unpublish and categorise articles.                | Should       |
| SP-009 | Linking        | Link tickets to loads, invoices, drivers, vehicles, branches or system errors.                | Should       |

###### Acceptance Criteria

- A requester can view only their own tickets unless assigned broader support permission.

- Status changes and replies generate configured notifications.

- Resolved tickets retain full history and may be reopened according to policy.

- Internal notes are never visible to customer/driver requesters.

- Knowledge base search returns relevant published articles only.

### 23. Roles and Permissions Administration

**Purpose.** Create and maintain roles and granular module-level permissions while protecting system-defined roles and auditability.

**Primary data displayed or captured.** Role, description, system/custom flag, permissions, company, branch scope, assigned users, status and audit history.

**Key business rules.**

- Whether multiple roles combine permissions additively should be confirmed; additive access is recommended unless explicit deny rules are implemented.

- Permission naming must use a stable machine identifier plus user-friendly label.

| **ID** | **Area**   | **Requirement**                                                                            | **Priority** |
|--------|------------|--------------------------------------------------------------------------------------------|--------------|
| RB-001 | List       | Display role names, permission summary and actions.                                        | Must         |
| RB-002 | Create     | Create custom company roles with name, description and permission set.                     | Must         |
| RB-003 | Actions    | Support show, view, create, edit, delete, manage, export and module-specific permissions.  | Must         |
| RB-004 | Scope      | Support company-wide or branch-scoped roles and assignments.                               | Must         |
| RB-005 | Assign     | Assign one or more permitted roles to users according to the chosen access model.          | Must         |
| RB-006 | Protection | Prevent deletion of protected system roles and prevent removal of the final Company Admin. | Must         |
| RB-007 | Impact     | Show how many users are assigned before a role is changed or archived.                     | Should       |
| RB-008 | Audit      | Log role creation, permission changes, assignment and revocation.                          | Must         |

###### Acceptance Criteria

- A user cannot grant permissions they do not possess unless they hold a dedicated privilege administration permission.

- Backend endpoints enforce the same permission catalogue as the UI.

- Changing a role affects assigned users according to the documented session/token refresh rule.

- The system prevents lockout by protecting at least one active company administrator.

- Permission descriptions are human-readable and grouped by module.

### 24. Settings

**Purpose.** Centralise company configuration, setup progress, users, branches, integrations, AI, communication, workflow rules, notifications, security, audit logs and subscription details.

**Primary data displayed or captured.** Company profile, defaults, setup checklist, users, roles, branch configuration, integrations, credentials reference, workflows, notifications, security policy, plan and system status.

**Key business rules.**

- System health details visible to Company Admin must not expose sensitive infrastructure information.

- AI subscription and feature availability depend on plan and configuration.

| **ID** | **Area**       | **Requirement**                                                                                                                               | **Priority** |
|--------|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| ST-001 | Dashboard      | Show company setup completion, active users, branches, integrations, AI subscription and system health.                                       | Must         |
| ST-002 | Checklist      | Provide setup checklist for Company Profile, Users & Roles, Branches, Integrations, Financial Settings, AI, Communication and Workflow Rules. | Must         |
| ST-003 | Company        | Manage company identity, branding, addresses, contacts, time zones, currency and defaults.                                                    | Must         |
| ST-004 | Integrations   | Connect/configure integrations and show connected, warning, failed and last-sync status.                                                      | Must         |
| ST-005 | Workflow Rules | Create controlled automation and approval rules with enable/disable state.                                                                    | Should       |
| ST-006 | Notifications  | Configure event/channel preferences, templates and escalation rules.                                                                          | Must         |
| ST-007 | Security       | Manage authentication policy, sessions, MFA policy, IP/session controls where supported and security logs.                                    | Must         |
| ST-008 | Audit Logs     | Search and export authorised system activity logs.                                                                                            | Must         |
| ST-009 | Subscription   | Show plan, usage, billing status and permitted subscription actions.                                                                          | Should       |
| ST-010 | System Health  | Show database, backup, storage, API and version/update status appropriate to the user role.                                                   | Should       |

###### Acceptance Criteria

- Only authorised administrators can change organisation-wide settings.

- Integration secrets are masked after save and never returned in plaintext.

- Disabling an integration or automation clearly shows downstream impact.

- Critical configuration changes require confirmation and audit logging.

- Setup percentage is based on documented checklist rules, not a hard-coded display value.

### 25. Safety Checklists

**Purpose.** Create and enforce pre-trip safety checklists that may block a driver from starting a trip until all mandatory items are completed.

**Primary data displayed or captured.** Checklist, version, applicability rules, item, response type, required flag, evidence, result, trip/load, driver, vehicle, timestamps and override.

**Key business rules.**

- Regulatory content must be approved by the organisation’s safety/compliance owner.

- Offline driver completion and later synchronisation may be required for remote operations.

| **ID** | **Area**      | **Requirement**                                                                                                 | **Priority** |
|--------|---------------|-----------------------------------------------------------------------------------------------------------------|--------------|
| SC-001 | Create        | Create checklists with name, code, description, target audience, trigger and items.                             | Must         |
| SC-002 | Items         | Configure item text, required/optional status, response type, evidence/photo requirement and failure behaviour. | Must         |
| SC-003 | Applicability | Target all drivers, qualifications, load types, vehicle types, branches or other supported conditions.          | Must         |
| SC-004 | Enforcement   | Enable strict execution that blocks trip start when required items are incomplete or failed.                    | Must         |
| SC-005 | Versioning    | Version published checklists and retain the exact version completed for each trip.                              | Must         |
| SC-006 | Preview       | Preview the driver experience before activation.                                                                | Should       |
| SC-007 | Status        | Activate, disable and view checklist usage without deleting historical results.                                 | Must         |
| SC-008 | Audit         | Record responses, evidence, device/user, time, location where permitted and any override.                       | Must         |
| SC-009 | Metrics       | Show total active/enforced checklists and trips blocked today.                                                  | Should       |

###### Acceptance Criteria

- A trip subject to an active strict checklist cannot start until all required items pass.

- A failed safety-critical item creates a blocking result and may create a delivery/maintenance issue.

- Disabling a checklist affects future triggers only and preserves prior responses.

- Overrides require a dedicated permission, reason and audit event.

- The driver sees clear guidance on incomplete or failed items.

### 26. Delivery Issues

**Purpose.** Capture, prioritise, assign and resolve delivery exceptions such as location problems, temperature alerts and customer refusals.

**Primary data displayed or captured.** Issue ID, load/shipment, stop, type, source, priority, status, owner, driver, vehicle, customer, evidence, notes, actions, timestamps and resolution.

**Key business rules.**

- The displayed “middle status column” requirement is included in the list view.

- Exact issue catalogue and automatic rules should be configurable.

| **ID** | **Area**  | **Requirement**                                                                                                | **Priority** |
|--------|-----------|----------------------------------------------------------------------------------------------------------------|--------------|
| DI-001 | Feed      | Display issue time, shipment/load reference, priority, source, issue type, summary, driver and current status. | Must         |
| DI-002 | Sources   | Support GPS, sensor, driver, customer, system and manual issue creation.                                       | Must         |
| DI-003 | Priority  | Support configurable severity such as Critical, High, Medium and Low.                                          | Must         |
| DI-004 | Status    | Support New/Open, Acknowledged, In Progress, Waiting, Resolved and Closed with a visible status column.        | Must         |
| DI-005 | Ownership | Assign issue owner/team, due time and escalation.                                                              | Must         |
| DI-006 | Details   | Show related load, stop, customer, driver, vehicle, telemetry/evidence, notes and timeline.                    | Must         |
| DI-007 | Actions   | Update status, add resolution notes, contact stakeholders, reattempt/reschedule and create related tasks.      | Must         |
| DI-008 | Logs      | Maintain status and resolution logs for tracking and audit.                                                    | Must         |
| DI-009 | Alerts    | Notify relevant users for critical/high issues and escalations.                                                | Must         |

###### Acceptance Criteria

- Critical issues are placed at the top and notify the configured escalation group.

- Resolving an issue requires a resolution category and note.

- Issue status changes are timestamped with actor and prior/new state.

- Sensor/GPS issues retain source data and do not become resolved solely because a later reading is normal unless the configured rule allows auto-resolution.

- A customer refusal can initiate reschedule, return, charge or cancellation workflow according to policy.

### 27. End-to-End Workflows

#### 27.1 New Load to Delivery Completion

1\. Authorised user creates a new load or reviews an AI Load Inbox draft.

2\. System validates customer, addresses/stops, dates, load type, cargo and required documents.

3\. Pricing engine calculates charges or a permitted user applies an audited override.

4\. Dispatcher selects a compliant, available driver and suitable active vehicle.

5\. System runs driver, vehicle, fatigue/availability, safety and dangerous-goods validations.

6\. Driver completes required pre-trip checklist; trip start remains blocked until mandatory checks pass.

7\. Live Tracking receives telemetry and updates ETA, route state and operational alerts.

8\. Driver completes stops and uploads required POD/evidence.

9\. Delivery issues are resolved or approved as exceptions.

10\. Load becomes Completed; invoice eligibility, payroll inputs, documents and reporting are updated.

#### 27.2 AI Draft Review and Dispatch

1\. A booking arrives by email, customer portal, file upload or manual intake.

2\. System stores the original source, extracts structured fields and calculates confidence.

3\. Duplicate, missing field, compliance and route warnings are displayed.

4\. Reviewer compares source and extracted data, corrects fields and records decision.

5\. Approved draft converts to a load; rejected/duplicate draft records a reason.

6\. Optional assignment/dispatch occurs only after standard load validations.

#### 27.3 Driver Assignment

1\. Dispatcher opens an unassigned load and requests driver suggestions or searches manually.

2\. System filters by branch, availability, licence/qualification, compliance, fatigue/hours, location and schedule conflicts.

3\. Vehicle suitability and availability are validated in parallel.

4\. Dispatcher confirms assignment; notifications are sent to the driver and relevant team.

5\. Reassignment records previous and new assignment plus reason.

#### 27.4 Safety Block and Override

1\. At trip start, system determines applicable active checklist version(s).

2\. Driver completes required items and provides evidence where configured.

3\. Incomplete or failed mandatory item blocks the trip and generates clear remediation guidance.

4\. Where policy permits, an authorised supervisor may override with reason and evidence.

5\. Trip starts only after successful completion or valid override; the result is permanently linked to the load.

#### 27.5 Delivery Issue Resolution

1\. Issue is created automatically or manually and classified by source/type/severity.

2\. System assigns or alerts the appropriate operational team.

3\. Owner acknowledges, investigates and records actions/communications.

4\. Issue may cause ETA update, reschedule, return, maintenance, customer refusal or other workflow.

5\. Resolution requires category and notes; status history remains visible.

#### 27.6 Invoice and Payment

1\. Completed/eligible load creates an invoice draft using approved load pricing and extras.

2\. Accounts user reviews tax, customer terms, line items, POD and references.

3\. Invoice is approved/issued and delivered to the customer through configured channels.

4\. Payment status is updated by gateway/accounting sync or authorised reconciliation.

5\. Overdue rules send reminders and update receivables reporting.

6\. Credits/cancellations use controlled finance workflows and retain audit history.

#### 27.7 Payroll Run

1\. Payroll user creates a run for branch and pay period.

2\. Approved timesheets, trips, mileage, allowances and deductions are loaded.

3\. System flags missing or inconsistent inputs.

4\. Authorised reviewer approves the run.

5\. Payslips, ABA/bank file and STP output/integration are generated as permitted.

6\. Completed run is locked; adjustments occur through a controlled process.

#### 27.8 Support Ticket

1\. User searches the Knowledge Base or raises a ticket.

2\. Ticket is categorised, prioritised and routed to an owner/team.

3\. Replies, internal notes, attachments and related entities are recorded.

4\. SLA/escalation events notify responsible users.

5\. Resolution is shared with requester and ticket is resolved/closed with history retained.

### 28. Data and Entity Model

The final physical database design may differ, but the product requires the following logical entities and relationships.

| **Entity**                                               | **Description**                                                          |
|----------------------------------------------------------|--------------------------------------------------------------------------|
| **Company / Tenant**                                     | Top-level data isolation, branding, defaults, subscription and settings. |
| **Branch / Depot / Location**                            | Operational scope, address, time zone, currency, manager and status.     |
| **User / Role / Permission**                             | Identity, authentication, company/branch scope and authorised actions.   |
| **Customer / Contact / Contract**                        | Customer master, portal users, terms, rate cards and agreements.         |
| **Load / Stop / Cargo / Assignment**                     | Shipment lifecycle, route, resources, status, pricing and history.       |
| **Driver / Driver Compliance / Availability**            | Driver identity, licences, documents, status and assignments.            |
| **Vehicle / Maintenance / Vehicle Compliance**           | Fleet register, service, odometer, status and documents.                 |
| **Asset / Asset Assignment / Asset Maintenance**         | Non-vehicle assets, condition, assignment and service.                   |
| **Warehouse / Inventory Item / Stock Balance**           | Locations, SKUs, quantities, value and bins.                             |
| **Stock Movement / Warehouse Task / Shipment**           | Transactional inventory and operational task history.                    |
| **Rate Card / Pricing Rule / Price Calculation**         | Commercial configuration, versioning and calculated breakdown.           |
| **Invoice / Payment / Credit / Transaction**             | Receivables, settlement and finance records.                             |
| **Payroll Run / Timesheet / Earning / Payslip**          | Payroll inputs, approvals, outputs and lock history.                     |
| **Document / Document Version / Compliance Requirement** | Files, metadata, entity linkage, expiry and verification.                |
| **Checklist / Checklist Version / Response**             | Safety configuration and immutable trip completion evidence.             |
| **Telemetry Event / Tracking Alert**                     | Location/sensor events, freshness and alert workflow.                    |
| **Delivery Issue / Issue Log**                           | Exception, priority, owner, status history and resolution.               |
| **Conversation / Message / Announcement**                | Communication records and delivery/read state.                           |
| **Support Ticket / Ticket Comment / KB Article**         | Support and self-service knowledge records.                              |
| **Report / Schedule / Report Run**                       | Report definitions, parameters, recipients and audit history.            |
| **Audit Event / Notification / Integration Sync**        | Traceability, alerts and external-system health.                         |

#### 28.1 Data Integrity Rules

- Every transactional entity includes company/tenant ID and, where relevant, branch ID.

- Soft delete/archive is used for records with historical or compliance value.

- Statuses use controlled enumerations and transitions rather than arbitrary free text.

- Money includes amount and ISO currency code; dates/times include time zone context.

- Files store checksum, MIME type, size, storage reference and access classification.

- All external identifiers and integration mappings are unique within their provider/company scope.

- Audit records are append-only and tamper-evident according to the selected architecture.

### 29. Integrations

| **Integration**                    | **Product Requirement**                                                                                                             |
|------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| **GPS / Telematics**               | Vehicle location, speed, state, route/ETA and alerts. Must support token rotation, last-sync status, retry and stale-data handling. |
| **Maps / Geocoding**               | Address lookup, route display, distance and geofence support. Provider quotas and map attribution must be respected.                |
| **Accounting (e.g., Xero)**        | Invoices, payments, accounts and reconciliation depending on system-of-record decision.                                             |
| **Payment Gateway (e.g., Stripe)** | Customer payments and verified payment status; secrets must be encrypted/masked.                                                    |
| **Email / SMTP**                   | Transactional email, report delivery, notifications and support communication.                                                      |
| **SMS Gateway**                    | Urgent alerts and configured operational/customer notifications.                                                                    |
| **Payroll / STP Provider**         | STP lodgement or compliant output, payroll reconciliation and status.                                                               |
| **Bank / ABA Export**              | File-based payment workflow with permissions, validation and audit.                                                                 |
| **AI / Document Extraction**       | Load intake extraction, recommendations and insights with human review and data controls.                                           |
| **File/Object Storage**            | Private document, POD, image and report storage with signed access and retention.                                                   |
| **Identity / MFA**                 | Secure user authentication, password policy, MFA and session controls.                                                              |
| **Sensors / IoT**                  | Temperature and other telemetry events where specialised loads require them.                                                        |

#### 29.1 Integration Behaviour

- Each integration exposes connection state, last successful sync, last error and a safe reconnect/test action.

- Transient failures use retry with backoff and do not create duplicate transactions.

- Inbound webhooks/events are authenticated, idempotent and logged.

- Outbound requests use correlation IDs and redact secrets/personal data from logs.

- The UI distinguishes connected, warning, failed and disabled states.

- Integration outages degrade gracefully and do not corrupt internal records.

### 30. Notifications and Automation

Notifications may be delivered through in-app, email, SMS and portal channels. Users can configure preferences subject to mandatory safety, security and compliance notifications.

| **Domain**          | **Example Events**                                                                                        |
|---------------------|-----------------------------------------------------------------------------------------------------------|
| **Load**            | Created, assigned, reassigned, delayed, stop reached, completed, cancelled or missing required documents. |
| **Driver**          | Assignment, licence/medical expiry, compliance block, fatigue warning or availability change.             |
| **Vehicle**         | Maintenance due/overdue, compliance expiry, out-of-service state or telemetry alert.                      |
| **Warehouse**       | Low stock, expiry, overdue task, incoming shipment or transfer exception.                                 |
| **Finance**         | Invoice issued, due soon, overdue, paid, payment failed, sync error or approval required.                 |
| **Payroll**         | Timesheet missing, run ready for review, approved, completed or export failure.                           |
| **Documents**       | Upload verification, expiry warning, rejection or access request.                                         |
| **Support**         | Ticket created, assigned, replied, escalated, resolved or reopened.                                       |
| **Safety / Issues** | Checklist block, critical delivery issue, unresolved escalation or authorised override.                   |
| **System**          | Integration failure, backup warning, security event, permission change or maintenance notice.             |

### 31. Non-Functional Requirements

| **ID**  | **Area**           | **Requirement**                                                                                                                                                                              | **Priority** |
|---------|--------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| NFR-001 | Availability       | Target service availability of at least 99.9% monthly for core admin operations, excluding planned maintenance agreed in the service policy.                                                 | Must         |
| NFR-002 | Performance        | Typical authenticated list/dashboard API responses should complete within 2 seconds at the 95th percentile under expected load; live tracking and heavy reports may use progressive loading. | Must         |
| NFR-003 | Scalability        | Architecture must scale by companies, branches, users, vehicles, telemetry events, loads, messages and documents without cross-tenant degradation.                                           | Must         |
| NFR-004 | Responsiveness     | Support modern desktop and tablet layouts; core workflows must remain usable at standard laptop resolutions.                                                                                 | Must         |
| NFR-005 | Accessibility      | Target WCAG 2.1 AA for keyboard access, contrast, labels, focus, error messages and screen-reader semantics.                                                                                 | Must         |
| NFR-006 | Browser Support    | Support current and previous major versions of Chrome, Edge and Safari unless contractually narrowed.                                                                                        | Must         |
| NFR-007 | Time/Currency      | Store time in UTC, display using branch/user time zone, and store/display ISO currency. AEST labels must account for daylight-saving zones where applicable.                                 | Must         |
| NFR-008 | Data Retention     | Retention must be configurable by document and data class, with legal hold where required.                                                                                                   | Must         |
| NFR-009 | Backup/Recovery    | Automated encrypted backups with tested restore process; target RPO/RTO must be agreed before production launch.                                                                             | Must         |
| NFR-010 | Observability      | Structured logs, metrics, tracing/correlation IDs, integration health and alerting are required for production support.                                                                      | Must         |
| NFR-011 | Import Reliability | Bulk imports provide pre-validation, row-level results, downloadable error file and idempotency/duplicate controls.                                                                          | Must         |
| NFR-012 | Export Reliability | Exports preserve filters and permissions and protect sensitive data; large exports use queued generation when needed.                                                                        | Must         |
| NFR-013 | Search             | Search is permission-aware and returns results within a usable response time for expected data volumes.                                                                                      | Must         |
| NFR-014 | Localisation       | Initial UI language may be English, with formatting designed to support future localisation.                                                                                                 | Must         |
| NFR-015 | Usability          | Destructive actions require confirmation; forms preserve user input after validation errors and provide clear success/failure feedback.                                                      | Must         |

### 32. Audit, Security and Compliance

| **ID**  | **Area**       | **Requirement**                                                                                                                        | **Priority** |
|---------|----------------|----------------------------------------------------------------------------------------------------------------------------------------|--------------|
| SEC-001 | Authentication | Secure password hashing, configurable password policy, MFA support for privileged users and account lock/rate-limit protections.       | Must         |
| SEC-002 | Authorisation  | Server-side RBAC and company/branch/object-level access checks on every protected action.                                              | Must         |
| SEC-003 | Sessions       | Secure, HttpOnly, SameSite cookies or equivalently protected tokens; session revocation and inactivity/absolute expiry.                | Must         |
| SEC-004 | Data Isolation | Prevent cross-company/tenant access in queries, storage paths, caches, exports and background jobs.                                    | Must         |
| SEC-005 | Encryption     | TLS in transit; encryption at rest for databases, backups and object storage; protect sensitive secrets using a secrets manager.       | Must         |
| SEC-006 | Input/Uploads  | Validate inputs, apply CSRF protections where applicable, scan uploads and prevent unsafe file execution.                              | Must         |
| SEC-007 | Audit          | Record privileged actions, finance/payroll exports, permission changes, overrides, document verification and security events.          | Must         |
| SEC-008 | Logging        | Redact credentials, tokens, payment data, personal documents and AI-extracted confidential content from logs.                          | Must         |
| SEC-009 | Privacy        | Apply least-data access, retention, export/deletion workflows and location-data controls aligned with applicable privacy requirements. | Must         |
| SEC-010 | Vulnerability  | Use dependency scanning, secure headers, rate limiting, penetration testing and remediation before production.                         | Must         |
| SEC-011 | Backups        | Encrypt backups, limit access, monitor completion and test restoration on a documented schedule.                                       | Must         |
| SEC-012 | Audit Export   | Only authorised roles may search/export audit logs; audit evidence must be protected from alteration.                                  | Must         |

#### 32.1 Minimum Audit Event Fields

- Event ID and timestamp

- Actor user/service and role

- Company and branch scope

- Action and affected module/entity

- Entity ID/reference

- Previous and new values for sensitive changes where appropriate

- Source IP/device/session correlation where lawful

- Outcome (success/failure) and failure reason

- Approval/override reason and linked evidence

- Integration correlation/reference when applicable

### 33. Analytics and Success Metrics

| **Metric Group** | **Representative Measures**                                                                                                      |
|------------------|----------------------------------------------------------------------------------------------------------------------------------|
| **Operational**  | On-time delivery rate, active load count, average dispatch time, load completion time, delays, issue rate and stop adherence.    |
| **Fleet**        | Vehicle utilisation, idle time, maintenance compliance, out-of-service time, average speed and telemetry coverage.               |
| **Driver**       | Compliance rate, document expiry risk, assignment utilisation, safety checklist completion and issue involvement.                |
| **Warehouse**    | Inventory accuracy, low-stock count, task cycle time, overdue tasks, stock turns and transfer accuracy.                          |
| **Commercial**   | Quote/load margin, rate override frequency, customer profitability, revenue by branch/type/customer and fuel surcharge recovery. |
| **Finance**      | Revenue, expenses, net profit, ageing, DSO, overdue exposure, cash position and invoice cycle time.                              |
| **Payroll**      | Timesheet approval rate, payroll correction rate, run completion time and export success.                                        |
| **Support**      | First response time, resolution time, SLA attainment, reopen rate and knowledge-base deflection.                                 |
| **Adoption**     | Active users, feature usage, report downloads, scheduled reports and completion of setup checklist.                              |
| **Quality**      | API error rate, integration sync failure, failed imports/exports, stale telemetry and security incidents.                        |

### 34. Release Scope and Prioritisation

#### 34.1 Must-Have Production Baseline

- Authentication, company/branch data isolation, RBAC and audit logging.

- Command Centre, Loads, Load Inbox review, Customers, Drivers, Vehicles and Branches.

- Live Tracking integration with freshness/alert handling.

- Safety Checklist trip blocking and Delivery Issue workflow.

- Documents and core compliance expiry tracking.

- Pricing, invoice/finance essentials and payroll run controls or validated external integrations.

- Warehouse core inventory transactions and task visibility.

- Messages, notifications and support tickets.

- Settings, integrations, backup/health visibility and export/import controls.

#### 34.2 Should-Have Enhancements

- AI extraction confidence, duplicate detection and driver/vehicle suggestions.

- Advanced warehouse utilisation, stock forecasting and scanner workflows.

- Custom report builder, report scheduling and AI insight explanations.

- Location history playback and advanced telemetry rules.

- Workflow rule builder and configurable approval chains.

- Customer and driver self-service enhancements.

#### 34.3 Future Opportunities

- Route optimisation and dynamic replanning.

- Predictive maintenance and parts forecasting.

- Automated proof-of-delivery validation and damage detection.

- Carbon/emissions reporting.

- Advanced mobile offline workflows.

- Marketplace/carrier partner integrations and inter-company load exchange.

### 35. QA, UAT and Definition of Done

#### 35.1 Test Coverage

- Unit tests for calculations, state transitions, permission checks and validation rules.

- API/integration tests for core services, webhooks, idempotency and error handling.

- End-to-end tests for major workflows defined in Section 27.

- Cross-role authorisation tests for allowed and forbidden actions.

- Cross-company/branch isolation tests including direct URL/API attempts.

- Import/export tests with valid, invalid, duplicate and large files.

- Accessibility, responsive layout and supported-browser tests.

- Performance/load tests for lists, dashboards, telemetry and reports.

- Security tests including OWASP controls, upload security and session management.

- Backup restoration and production rollback rehearsals.

#### 35.2 Definition of Done

- Functional requirement and acceptance criteria are implemented and demonstrably pass.

- Backend permissions and data isolation are tested; no reliance on UI-only restrictions.

- Error, empty, loading, offline/stale and permission-denied states are designed and implemented.

- Audit events exist for all identified sensitive actions.

- Automated tests pass and critical flows are covered by regression tests.

- No open critical/high severity defects for the release scope.

- Operational monitoring, alerts, backup and recovery steps are documented.

- User/admin guidance is updated and UAT sign-off is recorded.

- Production migration, rollback and integration credentials are controlled and reviewed.

### 36. Risks, Dependencies and Open Decisions

| **ID** | **Risk / Dependency**                                                                  | **Mitigation / Decision**                                                        |
|--------|----------------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| R-01   | Telemetry provider quality and frequency may vary, affecting “real-time” accuracy.     | Define freshness thresholds, offline state and provider SLA.                     |
| R-02   | Payroll/STP and finance rules carry regulatory and financial risk.                     | Use certified integrations or specialist validation; restrict and audit exports. |
| R-03   | Role and branch scope complexity can cause data leakage if implemented inconsistently. | Centralise authorisation and enforce tenant/branch filters server-side.          |
| R-04   | AI extraction may produce incorrect load details.                                      | Require review, field confidence, source comparison and validation.              |
| R-05   | Large telemetry, document and message volumes may increase cost/performance load.      | Define retention, tiered storage, indexing and asynchronous processing.          |
| R-06   | Mock screens contain inconsistent labels/status naming.                                | Adopt canonical status definitions in Appendix A and map display aliases.        |
| R-07   | Multi-country currency/tax/payroll treatment is not fully specified.                   | Confirm system of record and country-specific scope before build sign-off.       |
| R-08   | Warehouse scope may expand into full WMS complexity.                                   | Confirm SKU, lot, serial, bin, costing and barcode requirements.                 |
| R-09   | Integration outages can interrupt operations.                                          | Use queues, retry, idempotency, manual fallback and visible health status.       |
| R-10   | Sensitive personal, financial and location data increases privacy exposure.            | Implement data classification, least privilege, retention and monitoring.        |

#### 36.1 Open Decisions Requiring Stakeholder Confirmation

- Is the product strictly single-company or a SaaS multi-tenant platform managed by a Super Admin?

- Are depots separate entities under branches, or represented as branches/locations?

- Which accounting and payroll systems are the final systems of record?

- Which GPS/telematics and sensor providers will be supported at launch?

- Does the warehouse module require lot/serial tracking, barcode scanning and purchase-order management?

- What are the exact driver fatigue, dangerous-goods and safety compliance rules?

- What approvals are required for pricing changes, invoice issue, payroll, overrides and cancellations?

- What are the legal data retention periods by document/data category?

- Are Driver and Customer portals part of the same release and codebase?

- What is the final canonical status vocabulary shown in Appendix A?

### Appendix A. Canonical Status Definitions

| **Status**                         | **Definition**                                                                              |
|------------------------------------|---------------------------------------------------------------------------------------------|
| **Load - Draft**                   | Created but not ready for dispatch; may be incomplete or unassigned.                        |
| **Load - Planned / Assigned**      | Validated and scheduled; driver/vehicle may be assigned; trip not started.                  |
| **Load - Active**                  | Trip has started and is in progress, including En Route or At Stop.                         |
| **Load - Completed**               | Delivery obligations are complete and required evidence is available or exception-approved. |
| **Load - Cancelled**               | Load terminated with reason; operational execution stopped.                                 |
| **Driver - On Duty**               | Available or currently assigned within working rules.                                       |
| **Driver - Off Duty**              | Not currently working/assigned but not on approved leave.                                   |
| **Driver - On Leave**              | Unavailable due to approved leave.                                                          |
| **Driver - Unavailable**           | Unavailable for another reason such as medical restriction or suspension.                   |
| **Vehicle - Active**               | Operational and assignable subject to compliance/maintenance.                               |
| **Vehicle - In Maintenance**       | Temporarily unavailable while maintenance is in progress.                                   |
| **Vehicle - Out of Service**       | Blocked from operational use.                                                               |
| **Compliance - Compliant**         | All mandatory current requirements are valid.                                               |
| **Compliance - Expiring Soon**     | One or more requirements expire within the configured warning period.                       |
| **Compliance - Overdue / Expired** | At least one mandatory requirement is expired or overdue.                                   |
| **Support - Open**                 | Submitted and awaiting or undergoing initial handling.                                      |
| **Support - In Progress**          | Assigned and actively being worked.                                                         |
| **Support - Waiting**              | Blocked awaiting requester, third party or dependency.                                      |
| **Support - Resolved**             | Resolution provided; may transition to Closed after policy period.                          |
| **Issue - Acknowledged**           | Responsible user has accepted ownership/awareness.                                          |
| **Issue - Closed**                 | Resolution is complete and no further action remains.                                       |

### Appendix B. Permission Catalogue

The detailed permission list should be maintained as configuration, but the following actions form the baseline catalogue.

| **Module / Domain** | **Representative Permissions**                                                                        |
|---------------------|-------------------------------------------------------------------------------------------------------|
| **Common**          | show, view, create, edit, delete/archive, manage, export, import                                      |
| **Loads**           | assign driver, assign vehicle, dispatch, start override, complete, cancel, reprice, bulk action       |
| **Tracking**        | view current location, view history, acknowledge alert, manage geofences                              |
| **Drivers**         | manage personal data, manage compliance, manage availability, manage portal access                    |
| **Vehicles/Assets** | manage assignment, update odometer, manage maintenance, manage compliance                             |
| **Warehouse**       | manage stock, adjust inventory, create tasks, complete tasks, approve transfer                        |
| **Pricing**         | create rate, edit rate, approve rate, override price, import/export rates                             |
| **Payroll**         | view payroll, create run, approve run, complete run, generate ABA, generate STP, view payslip         |
| **Finance**         | create invoice, approve/issue invoice, record payment, credit/cancel, add transaction, export finance |
| **Documents**       | upload, download, verify, archive, manage access, view sensitive category                             |
| **Reports**         | run, export, schedule, manage recipients, create custom report                                        |
| **Messages**        | send, broadcast, manage templates, manage announcements, view analytics                               |
| **Support**         | create, view own, view company, assign, internal note, resolve, manage knowledge base                 |
| **Roles/Security**  | manage users, manage roles, grant permissions, view/export audit, manage security settings            |
| **Safety/Issues**   | manage checklist, enforce checklist, override block, acknowledge issue, assign issue, resolve issue   |
| **Settings**        | manage company, integrations, workflows, notifications, AI configuration, subscription and billing    |

### Appendix C. Screen Inventory

| **Module**            | **Required Screens / Views**                                                                                             |
|-----------------------|--------------------------------------------------------------------------------------------------------------------------|
| **Command Centre**    | Dashboard overview, KPI cards, quick actions, load status, messages, tickets, invoices, alerts, maintenance.             |
| **Loads**             | All Loads list, filters, columns/group/sort, bulk actions, overview and alerts.                                          |
| **Load Inbox**        | Inbox queue, source/confidence filters, draft review and dispatch.                                                       |
| **Customers**         | Customer list, profile, contacts, rates/contracts, loads, finance, documents and portal users.                           |
| **Live Tracking**     | Map, fleet list, telemetry card, load/route context and alerts.                                                          |
| **Drivers**           | Driver list, driver profile, documents/compliance, availability, assignments and insights.                               |
| **Vehicles**          | Vehicle list, profile, assignments, compliance and maintenance.                                                          |
| **Branches**          | Branch list, branch detail/setup, summary and location map.                                                              |
| **Assets**            | Asset list, asset profile, assignment, service, compliance and QR actions.                                               |
| **Warehouse**         | Warehouse dashboard/list, stock, movements, shipments, tasks and alerts.                                                 |
| **Pricing**           | Lane pricing, vehicle rates, customer rates, fuel surcharge and import/export.                                           |
| **Payroll**           | Payroll runs, pay breakdown, timesheets, rates/allowances and exports.                                                   |
| **Finance**           | Dashboard, invoices, transactions, receivables/payables and reports.                                                     |
| **Documents**         | Repository list, upload, view, verification, versioning and expiry.                                                      |
| **Reports**           | Dashboard, catalogue, run parameters, export centre, schedules and custom report.                                        |
| **Messages**          | Dashboard, inbox, conversation, announcements, templates, broadcast and analytics.                                       |
| **Support**           | My Tickets, Open Tickets, ticket detail, create ticket, KB home, category and article.                                   |
| **Roles**             | Role list, role detail, create/edit permission matrix and user assignment.                                               |
| **Settings**          | Dashboard, company, users, branches, integrations, financial, AI, communication, workflows, security, audit and billing. |
| **Safety Checklists** | Checklist list, builder, preview, applicability, enforcement and response history.                                       |
| **Delivery Issues**   | Issue list/feed, issue detail, status log, assignment and resolution.                                                    |

### Approval and Sign-Off

This PRD becomes the baseline for detailed UX specifications, technical architecture, estimates, sprint planning, QA test cases and UAT after stakeholder review and approval of open decisions.

| **Role**              | **Name / Signature** | **Date** |
|-----------------------|----------------------|----------|
| Product Owner         |                      |          |
| Operations Owner      |                      |          |
| Finance/Payroll Owner |                      |          |
| Engineering Lead      |                      |          |


---

## Part 4 — Dispatcher Portal Detailed Baseline

**Source classification:** Detailed stakeholder/uploaded Dispatcher Portal baseline, preserved in full.

### Product Requirements Document

#### Hero Logistics Dispatcher Portal

**Real-Time Load Planning, Dispatch, Fleet Coordination and Driver Communication Platform**

| **Document Version** | 1.0 |
|---|---|
| **Prepared For** | Hero Logistics Product, Operations, Design, Engineering and QA Teams |
| **Prepared Date** | 5 August 2026 |
| **Product Type** | Role-based multi-branch logistics dispatch web application |
| **Primary Role** | Dispatcher |
| **Document Status** | Baseline PRD for UX, development, API design, QA and UAT |

**CONFIDENTIAL**

---

### Document Control

| **Item** | **Details** |
|---|---|
| **Product Owner** | Hero Logistics / Authorised Company Representative |
| **Primary User** | Dispatcher / Senior Dispatcher |
| **Supporting Users** | Company Admin, Drivers, Yard Staff, Warehouse Staff, Fleet Team, Branch Managers and Support Staff |
| **Related Portals** | Company Admin Portal, Driver Portal and authorised Customer Portal workflows |
| **Source Material** | Dispatcher portal menus, dashboards, forms, tables, filters, maps, planning screens and sample data supplied by the stakeholder |
| **Decision Rule** | Where exact behaviour was not specified, this PRD records a recommended product rule and identifies items requiring confirmation |

> **Sample-data notice:** Names, dates, load IDs, routes, registration numbers, customers, financial values, counts and telemetry shown in the supplied screens are illustrative. The source material contains examples from 2025 and 2026. Production logic must use live data, the company time zone and the authenticated user's branch scope rather than hard-coded sample values.

#### Revision History

| **Version** | **Date** | **Owner** | **Change Summary** |
|---|---|---|---|
| 1.0 | 5 Aug 2026 | Product Team | Initial baseline covering the complete Dispatcher Portal supplied by the stakeholder |

---

### Contents

1. Executive Summary  
2. Product Vision and Objectives  
3. Scope and Assumptions  
4. User Role, Access and Permissions  
5. Information Architecture  
6. Global UX and Shared Behaviour  
7. Dispatch Dashboard  
8. Load Lifecycle and Status Model  
9. Loads List  
10. Create Load — Quick Form  
11. Create Load Console  
12. Active Loads and Load Details  
13. Planning Board  
14. Live GPS Map  
15. Drivers  
16. Vehicles and Trailers  
17. Customers  
18. Yard and Warehouse  
19. Workforce Availability  
20. Messages  
21. Reports and Analytics  
22. Dispatcher Profile  
23. Notifications, Alerts and Escalations  
24. End-to-End Operational Workflows  
25. Business Rules and Validations  
26. Data and Entity Model  
27. Integration and API Requirements  
28. Security, Privacy and Audit  
29. Non-Functional Requirements  
30. Analytics and Success Metrics  
31. Release Scope and Priorities  
32. QA, UAT and Definition of Done  
33. Risks, Dependencies and Open Decisions  
Appendix A. Status Definitions  
Appendix B. Dispatcher Permission Matrix  
Appendix C. Screen Inventory  
Appendix D. Acceptance Checklist

---

### 1. Executive Summary

The Hero Logistics Dispatcher Portal is the operational workspace used to create, plan, assign, monitor and complete transport loads across company branches. It provides dispatchers with real-time visibility of active and planned loads, driver availability, vehicle and trailer availability, live GPS locations, route progress, delivery risks, yard and warehouse activity, workforce scheduling and driver communication.

The portal must serve as the dispatcher's single source of truth during live operations. It must enable rapid decision-making while preventing invalid or unsafe assignments. Load activation must be blocked when mandatory route, item, driver, vehicle, compliance or safety requirements are incomplete.

The product must support:

- Quick load creation for simple operational cases.
- A full load console based on the principle **Load → Stops → Items → Resources → Activation**.
- Multi-stop and multi-item transport, including car-carrying workflows.
- Real-time planning and drag-and-drop load allocation.
- Driver, vehicle, trailer and workforce availability checks.
- GPS tracking, route history, ETA monitoring and location sharing.
- Chain of Responsibility proof photos with time and GPS evidence.
- Exception management for delays, missing documents, compliance failures and unavailable resources.
- Dispatcher-to-driver and internal team communication.
- Role- and branch-scoped reporting.

---

### 2. Product Vision and Objectives

#### 2.1 Vision

Provide dispatch teams with a fast, reliable and highly visible command environment that turns load demand into safe, compliant and traceable transport execution.

#### 2.2 Business Objectives

- Reduce time required to create and dispatch a valid load.
- Improve utilisation of available drivers, trucks and trailers.
- Reduce assignment conflicts and double-booking.
- Improve on-time pickup and delivery performance.
- Detect and escalate delays before service commitments are breached.
- Ensure all mandatory safety, compliance and proof requirements are completed.
- Provide accurate and timely communication between dispatch, drivers, yards and warehouses.
- Maintain complete operational audit trails for load changes and dispatch decisions.
- Allow branch-level dispatch operations while supporting authorised cross-branch visibility.

#### 2.3 Product Principles

- **Operations first:** critical live information must be visible without excessive navigation.
- **Exception first:** delayed, blocked, urgent and non-compliant work must be prioritised.
- **Safe assignment:** unavailable, expired, unqualified or conflicting resources cannot be assigned without authorised override.
- **One source of truth:** every load must have a single current status, responsible branch and active assignment record.
- **Human-controlled optimisation:** automated or AI recommendations assist dispatchers but do not silently activate or modify loads.
- **Traceability:** all operationally significant actions must record actor, time, previous value, new value and reason where applicable.

---

### 3. Scope and Assumptions

#### 3.1 In Scope

- Dispatcher authentication and branch-scoped access.
- Dispatch Dashboard.
- Quick search and global operational filters.
- Create Load quick form.
- Full Create Load Console.
- All Loads and Active Loads.
- Load details, route, stops, items, documents, photos, notes and assignment.
- Planning Board and load optimisation recommendations.
- Live GPS Map, GPS history, route status and location sharing.
- Driver list, compliance visibility and limited driver creation where permission is granted.
- Vehicle and trailer availability, assignment and compliance visibility.
- Customer lookup, creation and operational details where permission is granted.
- Yard and warehouse operational visibility.
- Workforce availability and shift assignment.
- Messaging with drivers and operational teams.
- Dispatcher-authorised operational, fleet and compliance reports.
- Dispatcher profile, security and device management.
- Notifications, alerts, escalation and audit logs.

#### 3.2 Out of Scope for the Dispatcher Role by Default

- Company-wide pricing configuration.
- Finance, payroll, accounts payable or accounts receivable management.
- Subscription and billing administration.
- Company settings and integration credentials.
- Role and permission administration.
- Tenant or company administration.
- Destructive deletion of completed loads or legal evidence.
- Unrestricted editing of driver payroll or bank details.
- Final compliance waiver approval unless a specific permission is granted.

#### 3.3 Assumptions

- The organisation supports multiple branches and may operate in different time zones.
- The authenticated dispatcher has a home branch and optional additional branch access.
- Drivers use a related Driver Portal or mobile application to accept loads, complete checklists, upload proof and share GPS.
- Vehicles and trailers are maintained as separate assignable resources.
- A load may have multiple pickup and drop-off stops.
- A load may contain one or more freight items or transported vehicles.
- The product supports load types including Car Carrying, General Freight and Dangerous Goods; additional types may be configured.
- GPS telemetry is received from a mobile application, telematics provider or both.
- All timestamps are stored in UTC and displayed in the applicable branch/user time zone.
- Dispatch recommendations may use rules or AI, but activation requires authorised confirmation.

---

### 4. User Role, Access and Permissions

#### 4.1 Primary Persona

##### Dispatcher / Senior Dispatcher

The dispatcher manages day-to-day movement of loads and resources. Typical responsibilities include:

- Creating and validating loads.
- Planning routes and schedules.
- Assigning drivers, trucks and trailers.
- Monitoring active operations and ETAs.
- Responding to delays and exceptions.
- Communicating with drivers, yards, warehouses and customers through authorised channels.
- Reviewing operational reports.

#### 4.2 Access Scope

Access must be calculated from all of the following:

1. Tenant/company membership.
2. Assigned role.
3. Explicit permissions.
4. Branch scope.
5. Record ownership or assignment where applicable.
6. Data sensitivity classification.

#### 4.3 Recommended Dispatcher Permissions

| **Module** | **Default Access** | **Notes** |
|---|---|---|
| Dispatch Dashboard | View | Branch-scoped operational metrics |
| Loads | View, Create, Edit, Assign, Activate | Cancellation and completion may require reason |
| Planning Board | View, Plan, Assign | Optimisation remains confirm-before-apply |
| Live GPS | View, Track, Send Location | GPS history access must be audited |
| Drivers | View | Create/edit only when explicitly granted |
| Vehicles / Trailers | View | Assignment allowed; master-data edits restricted |
| Customers | View | Create limited customer record when explicitly granted |
| Yard / Warehouse | View | Task creation only where operationally required |
| Workforce Availability | View, Assign Shift | Subject to branch and workforce permissions |
| Messages | View, Send | Communication retention applies |
| Reports | View, Export authorised reports | Financial and payroll reports hidden unless separately granted |
| Profile | View, Edit own profile | Role, branch and permissions are read-only |

#### 4.4 Permission Enforcement Requirements

- **DSP-PERM-001:** The server must enforce permissions; hiding UI controls alone is insufficient.
- **DSP-PERM-002:** A dispatcher must not retrieve out-of-scope branch records through query manipulation or direct API access.
- **DSP-PERM-003:** Sensitive driver fields such as bank, tax and full identity documents must be masked or unavailable unless separately authorised.
- **DSP-PERM-004:** Overrides must require a dedicated permission and a mandatory reason.
- **DSP-PERM-005:** Export permissions must be separate from view permissions.
- **DSP-PERM-006:** The system must record denied access attempts for security review.

---

### 5. Information Architecture

#### 5.1 Primary Navigation

1. Dispatch Dashboard
2. Create Load
3. Active Loads
4. Planning Board
5. Live GPS Map
6. Drivers
7. Vehicles / Trailers
8. Customers
9. Yard / Warehouse
10. Workforce Availability
11. Messages
12. Reports & Analytics
13. Profile

#### 5.2 Header

The common header should include:

- Company logo.
- Portal label: **Dispatcher Portal**.
- Current operational context: **Live Dispatch Operations**.
- Global quick search with keyboard shortcut `Ctrl+K` or `Cmd+K`.
- Notifications count.
- Unread messages count.
- Current branch or branch selector where permitted.
- User avatar, name and role.

#### 5.3 Routing and Deep Links

- Every list row and operational card must support a stable deep link.
- Browser refresh must preserve the active screen and record context.
- Filterable pages should store supported filters in the URL query string.
- Opening a load from the dashboard, map, planning board or messages must navigate to the same canonical load record.

---

### 6. Global UX and Shared Behaviour

#### 6.1 Responsive Behaviour

- Desktop is the primary dispatcher experience.
- Minimum supported operational viewport should be defined by the design team; 1366×768 should remain usable.
- Tables must support horizontal scrolling without hiding primary identifiers and actions.
- Planning Board and Live Map may use full-screen modes.
- Tablet support should preserve critical monitoring and messaging functions.

#### 6.2 Global Search

Global search should find authorised records by:

- Load ID or reference.
- Purchase order reference.
- Customer name.
- Driver name or employee ID.
- Vehicle registration or fleet ID.
- Trailer registration or asset ID.
- VIN or chassis number.
- Route, city or destination.
- Message participant.

**Acceptance criteria:**

- Results appear within 500 ms for indexed/common searches under normal load.
- Results are grouped by entity type.
- Results never expose records outside the user's permission or branch scope.
- Keyboard navigation and Enter-to-open are supported.

#### 6.3 Filters

Common filters include:

- Branch.
- Status.
- Driver.
- Customer.
- Destination/location.
- Required date/date range.
- Load/transport type.
- Vehicle/trailer.
- Available workers.

Filters must:

- Support reset.
- Show active filter count.
- Persist when navigating into a record and returning.
- Be reflected in exports.
- Use server-side filtering for large datasets.

#### 6.4 Tables

All major tables should support:

- Search.
- Sorting.
- Pagination.
- Configurable columns.
- Grouping where specified.
- Export where permitted.
- Empty, loading and error states.
- Row-level actions.
- Bulk actions only for compatible statuses.

#### 6.5 Date and Time

- Display dates in the configured company/user format, with `dd-mm-yyyy` recommended for the supplied Australian context.
- Display time zone on schedule-sensitive pages.
- Use local branch time for pickup, delivery and shift schedules.
- Preserve original time zone and UTC timestamps in the data model.
- Warn when a route crosses time zones.

#### 6.6 Status Presentation

- Status must never rely on colour alone.
- Each status requires a text label and, where useful, an icon.
- Status names must be consistent across dashboard, lists, map, board, messages and reports.

#### 6.7 Auto Refresh

- Live dashboard metrics: configurable, recommended 30–60 seconds.
- GPS telemetry: near real time based on provider capability.
- Standard lists: manual refresh or configurable interval.
- Reports: display data freshness timestamp.
- The interface must not overwrite an unsaved form during auto-refresh.

---

### 7. Dispatch Dashboard

#### 7.1 Purpose

Provide a real-time overview of workload, fleet capacity, active exceptions and immediate actions.

#### 7.2 KPI Cards

The dashboard should display:

- Total Loads.
- Active Loads.
- Planned Loads.
- Completed Today.
- Delayed Loads.
- Available Drivers.
- Available Trucks.
- Available Trailers.

Each KPI should show:

- Current value.
- Comparison or context where applicable.
- Click-through to a pre-filtered list.
- Last refreshed time.
- Branch scope.

#### 7.3 Dashboard Filters

The dashboard must support the common filters defined in Section 6.3. Changing filters must update metrics, load cards, planning data and driver summary consistently.

#### 7.4 Loads Panel

The Loads panel must support:

- Tabs: All, Active, Planned, Completed and On Hold.
- Search by load ID, customer, driver, registration, VIN or route.
- Summary cards showing ID, status, date, customer, origin, destination and vehicle.
- View all loads action.
- Direct open into load details.

#### 7.5 Planning Board Preview

The dashboard preview should show:

- Selected day.
- Depot/branch columns.
- Load cards with status, customer, route, date, driver, item count and worker count.
- Add Load action per authorised depot.
- Optimise Load action.
- Link to full Planning Board.

#### 7.6 Live GPS Preview

The map preview should include:

- Active vehicle markers.
- Status-based marker distinction.
- Zoom controls.
- Link to full map.
- GPS tools access.
- Clear telemetry freshness indicator.

#### 7.7 Driver Status Panel

Driver categories may include:

- All.
- On Duty.
- En Route.
- At Pickup.
- Break.
- Off Duty.
- Unavailable.

A driver card should show:

- Driver name.
- Duty/operational status.
- Assigned vehicle.
- Active load.
- Last known location.
- Telemetry summary.

#### 7.8 Requirements

- **DSP-DASH-001:** Dashboard counts must be derived from the same status rules used by load and resource lists.
- **DSP-DASH-002:** Clicking a KPI must open the corresponding filtered result.
- **DSP-DASH-003:** Delayed loads must be visually prioritised.
- **DSP-DASH-004:** Availability counts must exclude non-compliant, conflicting, off-duty and unavailable resources.
- **DSP-DASH-005:** Dashboard data must respect branch access.
- **DSP-DASH-006:** The system must show a stale-data warning when telemetry or operational data has not refreshed within a configurable threshold.

---

### 8. Load Lifecycle and Status Model

#### 8.1 Recommended High-Level Lifecycle

`Draft → Planned → Pending Dispatch → Assigned → Accepted → En Route to Pickup → At Pickup → Loaded → In Transit → At Delivery → Delivered → Completed`

Exception statuses:

- On Hold.
- Delayed.
- Cancelled.
- Rejected by Driver.
- Failed Delivery.
- Returned / Return in Progress.

#### 8.2 Status Rules

- Draft loads may be incomplete and must not appear as available driver work.
- Planned loads contain sufficient scheduling information but may be unassigned.
- Pending Dispatch means operationally prepared but awaiting final dispatch/acceptance.
- Active is an umbrella category, not necessarily a stored atomic status.
- Delivered indicates physical delivery evidence has been recorded.
- Completed indicates all required operational closure checks have passed.
- Cancelled records remain auditable and are not physically deleted.
- On Hold and Delayed require a reason and timestamp.

#### 8.3 Progress Calculation

Progress may be represented as:

- Workflow stages completed, e.g. `3/5`.
- Stops completed, e.g. `2/4`.
- Percentage for list views.

The UI must label the calculation basis to avoid ambiguity. The product team should confirm whether the canonical progress basis is workflow stage, stops, or a combined model.

#### 8.4 Valid Transition Enforcement

- **DSP-LOAD-001:** Only valid status transitions may be submitted.
- **DSP-LOAD-002:** The API must reject stale transitions when another user or system has already updated the load.
- **DSP-LOAD-003:** A reason is mandatory for cancellation, hold, delayed, transfer, failed delivery and manual completion override.
- **DSP-LOAD-004:** Completion must be blocked until mandatory delivery evidence is present.
- **DSP-LOAD-005:** Every status transition must be added to a timeline/audit history.

---

### 9. Loads List

#### 9.1 Purpose

Provide a searchable, filterable and exportable register of all authorised loads.

#### 9.2 Tabs and Counts

Recommended tabs:

- All Loads.
- Draft.
- Planned.
- Active.
- Completed.
- Cancelled.

Counts must update with the selected branch and date scope.

#### 9.3 Table Columns

- Load Reference.
- Status and operational sub-status.
- Load Type.
- Customer.
- Route and stop count.
- Driver.
- Truck and trailer.
- Pickup date/time.
- ETA or delivery date/time.
- Progress.
- Actions.

#### 9.4 Actions

Depending on status and permission:

- View.
- Edit.
- Duplicate.
- Assign resources.
- Activate/dispatch.
- Place on hold.
- Cancel.
- Export.
- Open tracking.
- Message driver.

#### 9.5 Bulk Actions

Bulk actions may include:

- Assign driver where valid.
- Mark selected records for planning.
- Cancel with reason.
- Export selected.

The system must validate every selected load individually and report partial failures clearly.

#### 9.6 Requirements

- **DSP-LIST-001:** Sorting and pagination must be server-side for production-scale datasets.
- **DSP-LIST-002:** Selected rows must be cleared when filters make them unavailable.
- **DSP-LIST-003:** Export must include active filters and user time zone.
- **DSP-LIST-004:** Draft records must be clearly distinguished from dispatch-ready records.
- **DSP-LIST-005:** The list must identify unassigned loads.
- **DSP-LIST-006:** The Actions menu must only show valid operations for the current status and user permission.

---

### 10. Create Load — Quick Form

#### 10.1 Purpose

Allow a dispatcher to create a straightforward load quickly from the dashboard or planning context.

#### 10.2 Fields

- Customer.
- Status or initial scheduling state.
- Pickup location.
- Delivery location.
- Assigned driver.
- Vehicle/trailer.
- Required date.
- Required time.

#### 10.3 Rules

- The quick form should create a draft or planned load, not silently bypass mandatory full-console requirements.
- If the dispatcher selects an active status, the system must validate all mandatory activation requirements or redirect to the full console.
- Customer, route, date and time are mandatory.
- Driver and asset assignment may be optional for planned loads.
- Assignment controls must show availability and compliance indicators.

#### 10.4 Outcomes

- **Create Load:** creates the record and opens its details or planning context.
- **Open Full Console:** transfers entered values into the detailed load console without data loss.
- **Cancel:** closes without creating a record.

#### 10.5 Acceptance Criteria

- Duplicate submission is prevented.
- A clear success confirmation displays the new load reference.
- Validation errors appear next to the relevant fields.
- Entered values remain after a correctable API error.

---

### 11. Create Load Console

#### 11.1 Operational Principle

The full load model follows:

**Load → Stops → Items → Proof Requirements → Truck/Trailer/Driver → Validation → Activation**

#### 11.2 Step 1 — Load Information

Fields should include:

- Booking customer, optional where permitted.
- Load type/service.
- Load reference.
- Priority.
- Load date.
- Branch/operating depot.
- Internal reference or purchase order number.
- Customer instructions.
- Optional pricing/rate reference visible only if permitted.

Dynamic behaviour:

- Fields may change by load type.
- Dangerous Goods must reveal regulatory and certification fields.
- Car Carrying must enable vehicle/item-specific attributes.
- General Freight must enable package, pallet, weight and dimension fields.

#### 11.3 Step 2 — Route Stops

Each stop should support:

- Stop type: Pickup, Drop-off, Depot, Yard, Inspection or Other configured type.
- Sequence number.
- Address and geocode.
- Contact name.
- Contact phone/email.
- Scheduled date and time window.
- Instructions.
- Proof requirements.
- Geofence radius.
- Status.

Rules:

- At least one pickup and one delivery/drop-off are required for activation.
- Stops may be drag-reordered before activation.
- Reordering after dispatch must trigger route recalculation and audit logging.
- Item pickup/drop-off mappings must remain valid after reordering.
- The system should warn, not silently fail, when pickup/drop-off ordering is operationally unusual.

#### 11.4 Step 3 — Items

For Car Carrying, each item should support:

- Customer/owner.
- Pickup stop.
- Drop-off stop.
- Registration.
- VIN/chassis number.
- Stock/reference number.
- Make.
- Model.
- Year.
- Colour.
- Length, width and height.
- Weight.
- Vehicle type.
- Keys available.
- Damage report required.
- Additional notes.

General requirements:

- Add item.
- Add another item.
- Bulk import.
- Duplicate item where appropriate.
- Remove item before activation.
- Validation of stop mapping.
- VIN/registration lookup where an authorised data provider exists.
- Auto-filled fields must be reviewable and editable.

#### 11.5 Proof Photos and Chain of Responsibility

Photo stages may include:

1. Pickup photos before loading.
2. Loading/restraint photos.
3. Delivery photos after unloading.

Each uploaded proof file must store:

- File ID and secure storage path.
- Load ID and item ID.
- Proof stage.
- Uploader.
- Capture/upload timestamp.
- GPS coordinates where available.
- Device metadata where permitted.
- Optional annotation/damage notes.
- Verification status.

Rules:

- Mandatory proof requirements are configurable by company, load type, customer and item.
- The system must not claim a photo is GPS-stamped when location data was unavailable.
- Missing mandatory proof must block the relevant workflow transition unless an authorised override is recorded.
- Evidence must not be silently replaced; superseded files remain auditable.

#### 11.6 Step 4 — Assign Truck, Trailer and Driver

Fields:

- Truck.
- Trailer, optional based on load type.
- Primary driver.
- Secondary driver/team where enabled.
- Driver-visible notes.

Assignment engine must evaluate:

- Duty status and shift availability.
- Existing schedule conflicts.
- Licence class.
- Dangerous Goods or other certification.
- Document compliance.
- Vehicle/trailer status.
- Vehicle/trailer compliance.
- Maintenance and out-of-service status.
- Capacity and item fit.
- Branch/location compatibility.
- Maximum working hours and required rest where configured.

#### 11.7 Save Draft and Activate Load

##### Save Draft

- Allows incomplete data.
- Must validate field formats but not all activation requirements.
- Must record creator and last editor.

##### Activate Load

Before activation, the system must run a readiness checklist covering:

- Required load fields.
- Valid pickup/drop-off structure.
- Item mapping.
- Required customer information.
- Driver eligibility.
- Truck and trailer availability.
- Compliance status.
- Schedule conflicts.
- Mandatory documents.
- Mandatory safety checklist configuration.

The result should show pass, warning or blocking failure for each check.

#### 11.8 Requirements

- **DSP-CREATE-001:** Draft saving must support incomplete records.
- **DSP-CREATE-002:** Activation must be atomic; partial activation is not allowed.
- **DSP-CREATE-003:** Resource conflicts must be rechecked at the exact moment of activation.
- **DSP-CREATE-004:** Bulk import must provide row-level validation errors.
- **DSP-CREATE-005:** The dispatcher must be warned about unsaved changes before leaving.
- **DSP-CREATE-006:** The system should autosave a recoverable draft at a configurable interval without creating duplicate records.
- **DSP-CREATE-007:** Customer-specific requirements must be displayed before activation.
- **DSP-CREATE-008:** Activation must generate a timeline event and notify the assigned driver according to workflow settings.

---

### 12. Active Loads and Load Details

#### 12.1 Active Loads List

Tabs may include:

- All Active.
- In Transit.
- En Route to Pickup.
- At Pickup.
- At Delivery.
- On Hold.

Columns:

- Load ID.
- Status.
- Driver/team.
- Route.
- Customer.
- Vehicle/trailer.
- Required date/time.
- Progress.
- Actions.

#### 12.2 Load Detail Header

Must show:

- Load ID/reference.
- Current status.
- Customer.
- Required date/time.
- Origin and destination.
- Branch.
- Priority.
- Exception indicators.

#### 12.3 Detail Tabs

- Overview.
- Stops.
- Items/Cars.
- Documents.
- Notes.
- Chain of Custody or Chain of Responsibility.
- Activity history, recommended.

#### 12.4 Assignment Summary

Show:

- Driver and duty status.
- Truck details.
- Trailer details.
- Registrations.
- Capacity.
- Compliance status.
- Contact actions.

#### 12.5 Progress Timeline

The timeline should show timestamped stages such as:

- Accepted.
- En Route.
- At Pickup.
- Loaded.
- In Transit.
- At Delivery.
- Delivered.
- Completed.

Each event should identify the source: driver, dispatcher, system, GPS/geofence or integration.

#### 12.6 Route and Tracking

Actions:

- View Live Map.
- Open Route.
- View GPS History.
- Send Location.
- Refresh GPS.

#### 12.7 Quick Actions

- Message Driver.
- Call Driver.
- View Instructions.
- Swap Trailer.
- Transfer Load.
- Add Note.
- Place on Hold.
- Record Delay.
- Escalate Issue.

#### 12.8 Transfer and Swap Rules

- A replacement resource must pass the same eligibility checks as a new assignment.
- The current driver must be notified where applicable.
- The load timeline must record old and new assignments.
- In-progress transfer requires location, custody and item condition confirmation.
- Trailer swap may require updated restraint/loading proof.

#### 12.9 Requirements

- **DSP-ACTIVE-001:** Load detail must display the latest committed state across all entry points.
- **DSP-ACTIVE-002:** Concurrent edits must be detected and handled safely.
- **DSP-ACTIVE-003:** Notes must identify whether they are internal or driver-visible.
- **DSP-ACTIVE-004:** Operational evidence and timeline events cannot be permanently deleted by a dispatcher.
- **DSP-ACTIVE-005:** The system must calculate and display late/at-risk indicators against scheduled commitments.

---

### 13. Planning Board

#### 13.1 Purpose

Provide a schedule-oriented workspace to allocate loads to drivers, trucks, trailers and time windows.

#### 13.2 Views and Filters

- Branch.
- Date.
- Day/Week view.
- Vehicle type.
- Driver.
- Vehicle/trailer.
- Status.
- List or board mode where supported.

#### 13.3 Board Structure

Recommended layout:

- Time axis across the selected day.
- Driver/resource rows.
- Driver duty and compliance indicator.
- Assigned truck and trailer.
- Load cards positioned by start/end time.
- Unassigned loads panel.
- Available time blocks.

#### 13.4 Load Card Information

- Load ID.
- Customer.
- Route.
- Scheduled time.
- Item/vehicle count.
- Priority/status.
- Conflict or delay warnings.

#### 13.5 Drag-and-Drop Assignment

Dragging a load to a driver/resource row must:

1. Create a proposed assignment.
2. Validate availability, conflicts, compliance, capacity and working-hour rules.
3. Show warnings/errors.
4. Require confirmation where specified.
5. Save the assignment atomically.
6. Update all relevant views.

#### 13.6 Optimise Board

Optimisation may recommend:

- Driver assignment.
- Vehicle/trailer assignment.
- Sequence changes.
- Load consolidation.
- Empty-leg reduction.
- Cross-branch resource rebalance.

Rules:

- Recommendations must include rationale and any constraints.
- No recommendation may be applied silently.
- The dispatcher must be able to accept individually or in bulk.
- Applied changes must be audited.
- The optimiser must not assign non-compliant or unavailable resources.

#### 13.7 Create Load from Board

The board form should capture:

- Customer.
- Load type.
- Pickup.
- Drop-off.
- Start time.
- End time.
- Optional driver.
- Internal notes.

New board loads should be created as Draft or Planned based on completeness and company configuration.

#### 13.8 Requirements

- **DSP-PLAN-001:** Overlapping assignments must be visually identified.
- **DSP-PLAN-002:** The board must support an unassigned-load queue.
- **DSP-PLAN-003:** Changes must be reversible before final confirmation.
- **DSP-PLAN-004:** Board updates must appear in active loads and driver schedules without manual data duplication.
- **DSP-PLAN-005:** The system must prevent assignment to unavailable periods.
- **DSP-PLAN-006:** Cross-time-zone routes must display schedule context clearly.

---

### 14. Live GPS Map

#### 14.1 Purpose

Track drivers and active loads, inspect route progress, identify delays and communicate location instructions.

#### 14.2 Filters

- Branch.
- Driver.
- Driver status.
- Load status.
- Search by driver, load ID, vehicle or registration.
- Additional filters for vehicle type, exception and telemetry freshness.

#### 14.3 Driver List

Each row/card should show:

- Driver.
- Active load.
- Operational status.
- Route.
- Last update age.
- Delay/exception indicator.

#### 14.4 Map Capabilities

- Map and satellite layers.
- Driver/vehicle markers.
- Marker clustering.
- Route line.
- Current stop and next stop.
- Traffic overlay where provider supports it.
- Geofences.
- Full-screen mode.
- Selected-driver focus.
- Manual refresh.

Weather may be shown only through a configured and licensed provider. Weather data must display source and timestamp.

#### 14.5 On-Road Summary

Columns:

- Load ID.
- Driver.
- Status.
- Route.
- Vehicle/trailer.
- Last update.
- ETA next stop.
- ETA delivery.
- Progress.
- Actions.

#### 14.6 Selected Driver Panel

Should show:

- Driver and status.
- Load and customer.
- Route.
- Speed.
- Heading.
- Last update.
- Distance to destination.
- Stops and completion state.
- Latest events.
- Vehicle, documents and notes tabs.

#### 14.7 GPS History

GPS history should support:

- Date/time range.
- Route playback.
- Stops and dwell time.
- Gaps in telemetry.
- Source/provider.
- Export only with explicit permission.

#### 14.8 Send Location to Driver

Fields:

- Target driver/load.
- Destination preset.
- Target address.
- Latitude and longitude.
- Driver instructions.
- Channel: Push + SMS, App Only, WhatsApp where configured, or broadcast where authorised.
- Attach navigation link.
- Require confirmation.

Rules:

- The dispatcher must confirm the intended target.
- Navigation links must be generated from validated coordinates.
- Message delivery status must be recorded.
- Broadcast requires elevated permission and recipient preview.
- Driver acknowledgement must be visible when confirmation is required.

#### 14.9 GPS Data Rules

- **DSP-GPS-001:** Last update time must always be displayed.
- **DSP-GPS-002:** Stale or offline markers must not appear as current without warning.
- **DSP-GPS-003:** Speed, heading and position must include telemetry timestamp.
- **DSP-GPS-004:** GPS access and export must be logged.
- **DSP-GPS-005:** The system must distinguish device-reported, telematics-reported and manually entered locations.
- **DSP-GPS-006:** Geofence events must not automatically complete delivery unless required evidence and workflow rules are satisfied.

---

### 15. Drivers

#### 15.1 Drivers List

Dashboard metrics may include:

- Total Drivers.
- On Duty.
- Off Duty.
- On Leave.
- Unavailable.
- Documents Expiring Soon.

Filters:

- Name, phone or licence search.
- Status.
- Licence type.
- Compliance.
- Branch.
- More filters.

Columns:

- Driver.
- Driver ID.
- Phone.
- Licence.
- Status.
- Branch.
- Current assignment.
- Compliance score/status.
- Actions.

#### 15.2 Dispatcher-Visible Driver Information

- Name and photo/avatar.
- Employee ID.
- Contact details needed for operations.
- Branch.
- Duty/availability status.
- Licence class and expiry status.
- Required operational certifications.
- Current assignment.
- Compliance summary.
- Skills and route preferences where used for assignment.

Sensitive payroll, banking, tax and background-check content must be restricted.

#### 15.3 AI/Rule-Based Driver Insights

Possible insights:

- Documents expiring soon.
- Suggested drivers for unassigned loads.
- Low compliance score.
- Schedule conflict risk.
- Route familiarity.

Recommendations must state the main factors and must not override hard compliance blocks.

#### 15.4 Add Driver

The supplied screen includes a full driver profile form. Dispatcher access to this form must be permission-controlled.

Sections:

1. Personal Information.
2. Employment Information.
3. Licence Information.
4. Compliance Documents.
5. Payroll Information.
6. Vehicle Preferences.
7. Availability.
8. Account Information.
9. Notes and Comments.

Recommended access rule:

- Dispatcher may create a draft operational driver profile if granted.
- Company Admin/HR must approve sensitive employment, payroll, identity and account fields.
- Dispatcher should not view or edit bank account, tax number or full background documents by default.

#### 15.5 Driver Availability Rules

A driver is considered assignable only when:

- Status is operationally available/on duty for the required period.
- No overlapping assignment exists.
- Required licence and certifications are valid.
- Mandatory compliance documents are valid.
- Applicable working-hour and rest rules pass configured checks.
- The driver belongs to an allowed branch or cross-branch assignment is authorised.

#### 15.6 Requirements

- **DSP-DRV-001:** Compliance status must be recalculated from current documents and requirements.
- **DSP-DRV-002:** Expiry warnings must use configurable thresholds.
- **DSP-DRV-003:** Assigning a driver must perform real-time eligibility checks.
- **DSP-DRV-004:** Sensitive information must be field-level permission controlled.
- **DSP-DRV-005:** Driver status changes must be audited and propagated to planning availability.

---

### 16. Vehicles and Trailers

#### 16.1 Vehicle List

Metrics:

- Total Vehicles.
- Active.
- In Maintenance.
- Out of Service.
- Compliance Due.

Tabs:

- All Vehicles.
- Active.
- In Maintenance.
- Out of Service.
- Sold/Inactive.

Columns:

- Vehicle/fleet ID and registration.
- Type, make and model.
- Year.
- Status.
- Current driver.
- Odometer.
- Compliance.
- Next service.
- Actions.

#### 16.2 Trailer Requirements

Trailers must be managed as separate assets with:

- Trailer ID.
- Registration.
- Type and capacity.
- Branch/location.
- Status.
- Assigned truck/load.
- Compliance.
- Service schedule.
- Configuration attributes, such as car capacity.

#### 16.3 Availability Rules

A vehicle/trailer is assignable only when:

- Status is Active/Available.
- It is not already assigned during the required period.
- It is not in maintenance or out of service.
- Required compliance is valid.
- Capacity and type meet load requirements.
- It is at a compatible branch/location or repositioning is planned.

#### 16.4 Compliance and Maintenance

The dispatcher may view:

- Registration status.
- Insurance status.
- Roadworthy status.
- Next service.
- Overdue service.
- Blocking defects.

The dispatcher must not be able to dismiss a maintenance or compliance block without appropriate override permission.

#### 16.5 Requirements

- **DSP-FLEET-001:** Truck and trailer availability must be checked independently.
- **DSP-FLEET-002:** Assignment must reserve the resource for the scheduled period.
- **DSP-FLEET-003:** Odometer and maintenance warnings must show the source and update time.
- **DSP-FLEET-004:** Out-of-service assets cannot be assigned.
- **DSP-FLEET-005:** Vehicle/trailer swaps must preserve assignment history.

---

### 17. Customers

#### 17.1 Purpose

Allow dispatchers to find customer operational information, create authorised customer records and view service requirements relevant to load execution.

#### 17.2 Customer List

Metrics may include:

- Total Customers.
- Active Customers.
- New This Month.
- Inactive Customers.
- Top Customer, only if authorised.

Filters:

- Name or ABN.
- Status.
- Customer type.
- Transport modules.
- Account manager.
- State.
- Created date.

Columns:

- Customer.
- Type.
- Primary operational contact.
- Transport modules.
- Billing terms, view-only if authorised.
- Account manager.
- Status.
- Actions.

#### 17.3 Add Customer — Quick Form

Fields:

- Company name.
- ABN/ACN.
- Customer type.

Recommended behaviour:

- Quick creation should produce a provisional customer record.
- Duplicate checks must compare name, ABN/ACN, email and phone.
- A Company Admin or Sales role may be required to complete commercial terms.
- Dispatcher may use the provisional customer for a load only if company rules permit.

#### 17.4 Customer Operational Rules

Customer records may define:

- Allowed load types.
- Required documents.
- Proof photo requirements.
- Site instructions.
- Contact and notification preferences.
- Time-window rules.
- Preferred depots/routes.
- Dangerous Goods requirements.

#### 17.5 Requirements

- **DSP-CUST-001:** Duplicate customer warnings must be shown before creation.
- **DSP-CUST-002:** Suspended/inactive customers must be blocked or warned according to company policy.
- **DSP-CUST-003:** Billing data must not be editable by dispatcher unless separately granted.
- **DSP-CUST-004:** Customer-specific load requirements must flow into the Create Load Console.

---

### 18. Yard and Warehouse

#### 18.1 Purpose

Give dispatchers operational visibility into warehouses, inventory, pick tasks, incoming/outgoing shipments and yard readiness.

#### 18.2 Warehouse Dashboard

Metrics:

- Total Warehouses.
- Total Inventory Value, only if authorised.
- Total Stock Items.
- Pending Pick Tasks.
- Incoming Shipments.
- Outgoing Shipments.

Warehouse list columns:

- Warehouse name and address.
- Code.
- Branch/location.
- Type.
- Status.
- Stock items.
- Inventory value, permission-controlled.
- Utilisation.
- Actions.

#### 18.3 Alerts

- Low stock.
- Expiring stock.
- Overdue pick tasks.
- Incoming shipment arrival.
- Yard congestion.
- Missing dispatch readiness.

#### 18.4 Dispatcher Actions

Depending on permission:

- View warehouse/yard status.
- View stock availability.
- View incoming/outgoing shipments.
- Create or request pick task.
- View task progress.
- Coordinate load arrival/departure.
- Message warehouse or yard team.

#### 18.5 Integration with Loads

- A load requiring stock or yard preparation must show readiness status.
- Activation or pickup may be blocked when a mandatory pick/yard task is incomplete.
- Arrival ETA should be visible to the relevant warehouse/yard team.
- Completion of loading tasks should update the load timeline.

#### 18.6 Requirements

- **DSP-WH-001:** Dispatcher visibility must be branch and permission scoped.
- **DSP-WH-002:** Inventory values must be hidden unless financial visibility is granted.
- **DSP-WH-003:** Load-linked tasks must display the load reference.
- **DSP-WH-004:** Warehouse task delays must generate operational alerts.

---

### 19. Workforce Availability

#### 19.1 Purpose

View workforce capacity, assign shifts and identify shortages affecting dispatch operations.

#### 19.2 Filters and Metrics

Filters:

- Branch.
- View: Day/Week.
- Workforce type.
- Role/position.
- Status.
- Date.

Metrics:

- Total Workforce.
- Available Today.
- On Shift.
- On Leave.
- Absent/Unavailable.

#### 19.3 Views

- Schedule View.
- List View.
- Unavailability.
- Leave Calendar.

Grouping options:

- Role.
- Branch.
- Team.
- Skill/certification, recommended.

#### 19.4 Schedule Grid

The weekly grid should show:

- Worker.
- Role.
- Certifications/skills.
- Daily state.
- Shift time.
- Leave reason where permitted.
- Available/unavailable periods.
- Assigned versus required counts for grouped teams.

#### 19.5 Selected Worker Panel

- Worker name.
- Status.
- Role.
- Employee ID.
- Mobile number.
- Overview.
- Skills and certifications.
- Shifts.
- Notes.
- Upcoming availability.
- Quick actions.

#### 19.6 Assign Shift

Fields:

- Date.
- Shift type.
- Start time.
- End time.
- Role/position.
- Notes.

Validation:

- End time must be after start time, accounting for overnight shifts.
- Overlapping shifts must be blocked or require authorised override.
- Leave/unavailability conflicts must be blocked.
- Working-hour rules must be checked.
- Assignment must notify the worker where configured.

#### 19.7 Auto Fill Shifts

Auto Fill may recommend shift assignments based on:

- Required headcount.
- Role and skills.
- Availability.
- Existing hours.
- Branch.
- Fair distribution.
- Cost constraints only if authorised.

Recommendations must require confirmation.

#### 19.8 Requirements

- **DSP-WF-001:** Availability changes must update planning resource availability.
- **DSP-WF-002:** Shift assignments must be audited.
- **DSP-WF-003:** Personal leave details must be minimised according to permission.
- **DSP-WF-004:** The schedule must clearly distinguish availability from confirmed shift assignment.
- **DSP-WF-005:** Auto Fill must never override hard conflicts.

---

### 20. Messages

#### 20.1 Purpose

Provide a central communication workspace for drivers, yard staff, warehouse staff and internal teams.

#### 20.2 Conversation List

Tabs/categories:

- All.
- Unread.
- Groups.
- Archived.

Each conversation should show:

- Participant/group.
- Last message preview.
- Time.
- Unread count.
- Related load and status where applicable.
- Participant type.

#### 20.3 Conversation Workspace

- Message history.
- Date separators.
- Sender identity.
- Timestamp.
- Delivery/read status.
- Attachments.
- Location attachments.
- Message input.
- Enter to send and Shift+Enter for new line.

#### 20.4 Conversation Details

- Participant details.
- Current load.
- Route.
- Required date.
- Vehicle/trailer.
- Progress.
- Contact information.
- Role, employee ID and licence summary where authorised.
- Actions: call, video where configured, view load, mute.

#### 20.5 New Message

Fields:

- Recipient.
- Optional subject.
- Priority.
- Message.
- Attach file.
- Attach location.

#### 20.6 Groups

Dispatchers may create operational groups when permitted, such as:

- Yard Team — Melbourne.
- Maintenance Team.
- Branch Dispatch Team.
- Load-specific conversation.

Group membership changes must be audited.

#### 20.7 Requirements

- **DSP-MSG-001:** Messages linked to a load must be accessible from the load timeline or communication tab.
- **DSP-MSG-002:** Read/unread counts must update consistently.
- **DSP-MSG-003:** Attachments must be virus-scanned and permission checked.
- **DSP-MSG-004:** Delivery failures must be visible with retry options where appropriate.
- **DSP-MSG-005:** Message retention must follow company policy.
- **DSP-MSG-006:** The system must distinguish internal messages from customer-visible communication.

---

### 21. Reports and Analytics

#### 21.1 Dispatcher Reporting Scope

The supplied Reports Dashboard includes operational, financial, compliance and analytics categories. For the Dispatcher role, the default scope should include:

- Loads performance.
- On-time pickup/delivery.
- Delay and exception reports.
- Driver utilisation and availability.
- Vehicle/trailer utilisation.
- Fleet compliance summary.
- Yard/warehouse operational reports.
- Route and depot performance.
- Message/response metrics where relevant.

Financial, payroll, profitability and accounts reports must be hidden unless separately granted.

#### 21.2 Dashboard Features

- Search reports.
- Category filter.
- Report type filter.
- Status filter.
- Date range.
- Recently viewed.
- Favourites.
- Scheduled reports.
- Downloads.
- Export Centre.
- Create Custom Report, permission-controlled.

#### 21.3 Scheduled Reports

A dispatcher with permission may schedule authorised reports by:

- Frequency.
- Date/time.
- Branch scope.
- Format.
- Recipients.

The system must validate recipient access and avoid sending unauthorised data.

#### 21.4 AI Insights

Operational insights may include:

- Delay trends.
- Under-utilised resources.
- Repeated route issues.
- Compliance expiry risk.
- Capacity shortage predictions.

Insights must show data period, source metrics and confidence or limitations where appropriate.

#### 21.5 Requirements

- **DSP-RPT-001:** Dispatcher must only see authorised report categories.
- **DSP-RPT-002:** Report exports must record actor, filters, row count and time.
- **DSP-RPT-003:** Scheduled recipients must be validated against access scope.
- **DSP-RPT-004:** Reports must display data freshness and time zone.
- **DSP-RPT-005:** Financial information must be excluded by default from dispatcher reporting.

---

### 22. Dispatcher Profile

#### 22.1 Profile Overview

Display:

- Name.
- Online/offline presence.
- Job title.
- Employee ID.
- Contact information.
- Address.
- Working hours.
- Preferences.
- Role and permissions.
- Branch and access level.
- Recent activity.
- Account and security.
- Active devices.
- Shortcuts.

#### 22.2 Editable Fields

A dispatcher may edit:

- Full name, subject to company policy.
- Mobile number.
- Date of birth, where policy permits.
- Email address, with verification.
- Address.
- Emergency contact.
- Notification preferences.
- Language.
- Time zone, subject to company policy.

Role, access level, branch and permissions must be read-only.

#### 22.3 Account and Security

- Username.
- Password change.
- Two-factor authentication status and management.
- Active devices/sessions.
- Revoke session.
- Login activity.

#### 22.4 Requirements

- **DSP-PROF-001:** Email and phone changes may require verification.
- **DSP-PROF-002:** Password changes must invalidate sessions according to security policy.
- **DSP-PROF-003:** Role and permissions cannot be self-modified.
- **DSP-PROF-004:** Recent activity must include security-sensitive actions.
- **DSP-PROF-005:** Session revocation must take effect promptly.

---

### 23. Notifications, Alerts and Escalations

#### 23.1 Notification Types

- New load assignment.
- Driver acceptance/rejection.
- Driver or vehicle becomes unavailable.
- Compliance expiry or block.
- Delayed load or ETA risk.
- Geofence arrival/departure.
- Missing proof/document.
- Driver break/rest alert.
- Yard/warehouse task delay.
- New message.
- GPS offline/stale.
- Delivery issue.
- Load completion.

#### 23.2 Severity

- Informational.
- Low.
- Medium.
- High.
- Critical.

Severity must be based on configurable rules.

#### 23.3 Escalation

Critical or unresolved alerts may escalate to:

- Senior Dispatcher.
- Branch Manager.
- Company Admin.
- Safety/Compliance role.
- Maintenance team.

Escalation rules should consider severity, elapsed time, branch and issue type.

#### 23.4 Requirements

- **DSP-ALERT-001:** Every alert must have source, entity, severity, creation time and status.
- **DSP-ALERT-002:** Acknowledgement must not equal resolution.
- **DSP-ALERT-003:** Critical alerts cannot be silently dismissed.
- **DSP-ALERT-004:** Notification preferences cannot disable mandatory safety alerts.
- **DSP-ALERT-005:** Duplicate alerts should be grouped to reduce noise while preserving event history.

---

### 24. End-to-End Operational Workflows

#### 24.1 Create and Activate a Load

1. Dispatcher opens Quick Create or Full Console.
2. Selects or creates authorised customer.
3. Selects load type and enters reference/priority/date.
4. Adds pickup and drop-off stops.
5. Adds items and maps them to stops.
6. Defines proof and document requirements.
7. Assigns driver, truck and trailer or leaves planned/unassigned.
8. System validates route, items, compliance, capacity, availability and conflicts.
9. Dispatcher saves Draft, saves Planned or selects Activate.
10. System revalidates resources atomically.
11. Load status changes to Pending Dispatch/Assigned according to configuration.
12. Driver receives assignment.
13. Timeline and audit records are created.

#### 24.2 Driver Accepts or Rejects

1. Driver receives load assignment.
2. Driver reviews instructions and required resources.
3. Driver accepts or rejects with reason.
4. Acceptance updates status and planning board.
5. Rejection returns load to unassigned/pending queue and alerts dispatcher.
6. Dispatcher reassigns or edits the load.

#### 24.3 Pickup and Loading

1. Driver starts trip after required safety checks.
2. GPS tracking begins or is confirmed active.
3. Driver arrives at pickup; geofence may suggest status.
4. Driver confirms arrival.
5. Required pickup condition photos are captured.
6. Items are loaded and restraint/loading proof is captured.
7. Dispatcher sees updated timeline and evidence status.
8. Load transitions to Loaded/In Transit.

#### 24.4 Delay Management

1. System or driver identifies a delay.
2. Delay alert shows load, reason, current location and ETA impact.
3. Dispatcher reviews route, driver status and customer commitment.
4. Dispatcher records action: reroute, update ETA, contact customer, swap resources, hold or escalate.
5. Affected participants receive authorised notifications.
6. Delay remains open until resolved or load completed.
7. Timeline stores cause, duration and resolution.

#### 24.5 Resource Swap

1. Dispatcher selects Swap Driver, Truck or Trailer.
2. System lists eligible replacements.
3. Dispatcher selects resource and effective time/location.
4. System checks conflicts, compliance and custody requirements.
5. Affected drivers/teams confirm where required.
6. Assignment changes atomically.
7. Old and new assignments remain in history.

#### 24.6 Delivery and Completion

1. Driver arrives at delivery location.
2. Delivery evidence and required photos are captured.
3. Recipient/POD details are recorded where required.
4. Failed/refused/damaged delivery creates an issue instead of normal completion.
5. When all stops and proof requirements pass, load becomes Delivered.
6. Final operational checks run.
7. Load becomes Completed automatically or after authorised review, based on configuration.

#### 24.7 Send Location/Instructions

1. Dispatcher selects driver/load.
2. Selects a preset or enters validated coordinates/address.
3. Adds instructions and communication channel.
4. Chooses whether confirmation is required.
5. System sends the message/navigation link.
6. Delivery and acknowledgement status are recorded.

#### 24.8 Workforce Shift Assignment

1. Dispatcher opens Workforce Availability.
2. Selects worker and date.
3. Enters shift time and role.
4. System checks leave, overlap, skills and working-hour constraints.
5. Dispatcher confirms assignment.
6. Worker and planning capacity are updated.

---

### 25. Business Rules and Validations

#### 25.1 Load Rules

- Load reference must be unique within configured company scope.
- Customer, load type, operating branch, pickup and delivery are mandatory for planned/active states.
- At least one item is required unless the load type explicitly allows item-less movement.
- Every item must map to valid pickup and drop-off stops.
- Completed or cancelled loads cannot be edited through normal edit actions.
- Material post-dispatch changes require reason and audit trail.

#### 25.2 Schedule Rules

- Pickup/delivery dates must follow logical sequence unless an overnight/time-zone condition explains the difference.
- Resource assignments cannot overlap.
- Required date/time must be stored with time zone.
- Schedule changes affecting an assigned driver must trigger notification.

#### 25.3 Driver Rules

- Licence class and certification must meet load requirements.
- Expired or missing mandatory documents create a hard block unless an authorised override policy exists.
- Driver must be available for the full assignment period plus configured buffer.
- Leave, unavailable or off-duty status blocks assignment unless status is changed through an authorised process.

#### 25.4 Vehicle and Trailer Rules

- Out-of-service and maintenance vehicles/trailers cannot be assigned.
- Capacity must meet item count, dimensions and weight rules.
- Trailer requirements are based on load type and configuration.
- Compliance must be valid through the planned completion date where policy requires.

#### 25.5 Evidence Rules

- Mandatory photo and document stages are configurable.
- Evidence deletion must be prohibited or tightly controlled.
- Evidence must retain capture/upload metadata.
- Completion must be blocked when mandatory evidence is missing.

#### 25.6 Communication Rules

- Messages must preserve sender and timestamp.
- Location sharing requires explicit target and channel.
- Broadcast communication requires additional permission.
- Customer-visible and internal communication must be separated.

#### 25.7 Error Handling

- Validation errors must be actionable and field-specific.
- API failures must not lose unsaved user input.
- Partial bulk-action failures must identify successful and failed records.
- Users must be told when data is stale or changed by another user.

---

### 26. Data and Entity Model

#### 26.1 Core Entities

##### Company/Tenant

- ID.
- Legal/display name.
- Time zone and currency settings.
- Feature configuration.
- Proof and compliance rules.

##### Branch

- ID.
- Code.
- Name.
- Address/geocode.
- Time zone.
- Status.

##### User

- ID.
- Name.
- Email/phone.
- Role.
- Branch scope.
- Status.
- Authentication and 2FA metadata.

##### Driver

- ID/employee ID.
- User/account link.
- Branch.
- Operational status.
- Licence classes.
- Certifications.
- Availability.
- Compliance summary.

##### Vehicle

- ID/fleet number.
- Registration.
- Type/make/model/year.
- Branch/location.
- Status.
- Capacity.
- Odometer.
- Compliance and service status.

##### Trailer

- ID.
- Registration.
- Type/capacity/configuration.
- Branch/location.
- Status.
- Compliance/service status.

##### Customer

- ID.
- Company name.
- ABN/ACN.
- Type.
- Status.
- Operational contacts.
- Customer-specific service rules.

##### Load

- ID and reference.
- Company and branch.
- Customer.
- Load type.
- Priority.
- Status/sub-status.
- Required date/time/time zone.
- Assigned driver, truck and trailer.
- Progress.
- Delay and exception flags.
- Creator and timestamps.

##### Load Stop

- ID.
- Load ID.
- Type.
- Sequence.
- Address/geocode.
- Contact.
- Scheduled/actual times.
- Status.
- Geofence.

##### Load Item

- ID.
- Load ID.
- Item type.
- Pickup/drop-off stop IDs.
- Vehicle/freight details.
- Dimensions and weight.
- Condition/damage requirements.

##### Assignment

- ID.
- Load ID.
- Driver/vehicle/trailer.
- Effective start/end.
- Status.
- Assignment source.
- Replaced assignment link.

##### Proof/Evidence

- ID.
- Load/item/stop.
- Stage/type.
- Secure file reference.
- Capture/upload metadata.
- GPS metadata.
- Verification status.

##### GPS Telemetry

- Driver/vehicle.
- Coordinates.
- Speed.
- Heading.
- Accuracy.
- Source.
- Recorded timestamp.
- Received timestamp.

##### Shift/Availability

- Worker.
- Date/time range.
- Status/type.
- Role.
- Notes.
- Source.

##### Message/Conversation

- Conversation ID.
- Participants.
- Related load.
- Visibility type.
- Messages and attachments.
- Delivery/read status.

##### Alert/Issue

- ID.
- Entity type and ID.
- Category.
- Severity.
- Status.
- Owner.
- Timeline.

##### Audit Event

- Actor.
- Action.
- Entity.
- Prior/new values or change summary.
- Timestamp.
- IP/device.
- Reason.

#### 26.2 Data Integrity

- Use immutable unique IDs in addition to human-readable references.
- Enforce tenant/company ID on all operational records.
- Use optimistic locking or version numbers for frequently edited records.
- Use soft deletion/archival where records require retention.
- Store money with currency code even where dispatcher cannot view financial values.
- Store times in UTC with source time zone.

---

### 27. Integration and API Requirements

#### 27.1 Required/Expected Integrations

- Driver mobile/web portal.
- GPS/telematics provider.
- Mapping, routing and geocoding provider.
- Push notification provider.
- SMS provider.
- Email provider.
- WhatsApp provider where contractually configured.
- Secure object storage for documents and proof photos.
- Warehouse/yard module.
- Vehicle compliance and maintenance module.
- Reporting/export service.

#### 27.2 API Principles

- REST or documented equivalent architecture.
- Versioned endpoints.
- Tenant and permission enforcement at service layer.
- Idempotency for create/activate/send actions where duplicate requests are harmful.
- Pagination and server-side filters.
- Standard error structure.
- Request correlation IDs.
- Audit context.
- Rate limiting.

#### 27.3 Key API Domains

- Authentication and profile.
- Dashboard metrics.
- Loads and status transitions.
- Stops and items.
- Assignments and availability.
- Drivers.
- Vehicles and trailers.
- Customers.
- Planning board.
- GPS telemetry/history.
- Warehouse/yard status.
- Workforce shifts.
- Conversations/messages.
- Reports and exports.
- Alerts and notifications.
- Evidence/document upload.

#### 27.4 Real-Time Updates

Use WebSocket, Server-Sent Events or an equivalent mechanism for:

- GPS updates.
- Load status changes.
- Driver availability.
- Planning assignment changes.
- New messages.
- Critical alerts.

The client must recover from connection loss and reconcile missed events from the server.

#### 27.5 File Upload

- Use signed upload URLs or secure streamed upload.
- Validate type, size and malware scan status.
- Store metadata separately from file binary.
- Prevent executable content from being served inline.
- Support upload retry.

---

### 28. Security, Privacy and Audit

#### 28.1 Authentication

- Secure username/email and password authentication.
- MFA/2FA support.
- Session expiration and refresh controls.
- Device/session visibility and revocation.
- Account lockout/rate limiting.

#### 28.2 Authorisation

- Role- and permission-based access.
- Branch and tenant data isolation.
- Field-level restrictions for sensitive driver/customer information.
- Export permissions.
- Override permissions.

#### 28.3 Data Protection

- TLS in transit.
- Encryption at rest for sensitive data.
- Secure secret management.
- Mask sensitive values in logs.
- Signed and expiring evidence/document URLs.
- Configurable retention policies.

#### 28.4 GPS Privacy

- GPS access is limited to authorised operational need.
- Off-duty tracking behaviour must follow company policy and applicable privacy requirements.
- GPS history access and exports are audited.
- The UI must show telemetry source and freshness.

#### 28.5 Audit Events

At minimum audit:

- Login/logout and failed authentication.
- Load create/edit/activate/cancel/complete.
- Status changes.
- Assignment and resource swap.
- Route/stop changes after activation.
- Evidence upload, supersede and verification.
- GPS history access/export.
- Shift assignment.
- Message broadcast.
- Report export.
- Profile/security changes.
- Override use.

#### 28.6 Audit Record Requirements

- Audit records must be tamper-resistant.
- Dispatchers cannot edit or delete audit entries.
- Sensitive values should be redacted while retaining meaningful change context.
- Audit search must support entity, actor, action and date range for authorised administrators.

---

### 29. Non-Functional Requirements

#### 29.1 Performance

- Standard page initial load target: under 3 seconds on a typical business connection.
- Common API read target: 95th percentile under 800 ms, excluding external provider latency.
- Search target: under 500 ms for indexed/common queries.
- Load activation target: under 3 seconds excluding large file uploads.
- Planning drag/drop validation target: under 1 second for common scenarios.
- GPS UI update should reflect provider data within the agreed telemetry SLA.

#### 29.2 Availability and Resilience

- Target service availability should be defined in the commercial SLA; recommended minimum for operational production is 99.9% excluding planned maintenance.
- Critical writes must be transactional.
- Retriable external calls must use safe retry and idempotency.
- Real-time connection loss must fall back to polling or show degraded mode.
- The UI must display service degradation clearly.

#### 29.3 Scalability

The architecture must support growth in:

- Branches.
- Concurrent dispatchers.
- Active drivers and vehicles.
- Daily loads.
- GPS events.
- Photos/documents.
- Messages.
- Report volume.

High-volume telemetry should be stored separately from core transactional queries where necessary.

#### 29.4 Accessibility

- Keyboard-operable forms and navigation.
- Visible focus states.
- Labels for controls.
- Status not conveyed by colour alone.
- Sufficient contrast.
- Screen-reader-friendly validation.
- Accessible table and modal structures.

#### 29.5 Browser Support

- Current supported versions of Chrome and Edge.
- Safari support where required by company devices.
- Browser support policy must be documented and tested.

#### 29.6 Observability

- Structured application logs.
- Error monitoring.
- API latency metrics.
- Real-time connection health.
- GPS ingestion health.
- Queue/notification delivery health.
- External integration status.
- Correlation IDs across services.

#### 29.7 Backup and Recovery

- Automated database backups.
- Secure evidence/document backup or durable storage policy.
- Defined Recovery Point Objective and Recovery Time Objective.
- Periodic restore testing.
- Audit retention independent of user deletion.

---

### 30. Analytics and Success Metrics

#### 30.1 Operational KPIs

- Loads created per dispatcher.
- Median load creation time.
- Planned-to-activated conversion time.
- Percentage of loads dispatched without manual rework.
- Driver acceptance rate.
- On-time pickup rate.
- On-time delivery rate.
- Delay frequency and average duration.
- Resource utilisation.
- Unassigned load ageing.
- Average time to resolve critical alerts.
- GPS coverage/freshness rate.
- Proof completion rate.
- Assignment conflict rate.

#### 30.2 Product Usage Metrics

- Dashboard usage.
- Planning Board usage.
- Quick Create versus Full Console usage.
- Search success.
- Filter usage.
- Message response time.
- Report views and exports.
- Optimisation recommendation acceptance rate.

#### 30.3 Quality Metrics

- Failed activation attempts by cause.
- Duplicate load rate.
- API error rate.
- GPS stale/offline incidents.
- File upload failure rate.
- Permission-denied incidents.
- UAT defect escape rate.

#### 30.4 Metric Rules

- Metrics must be defined consistently.
- Operational dashboards must identify date/time zone and branch scope.
- AI or recommendation metrics must not be used to penalise staff without validated governance.

---

### 31. Release Scope and Priorities

#### 31.1 Phase 1 — Core Dispatch MVP

**Must Have**

- Authentication, branch scope and role permissions.
- Dispatch Dashboard.
- Loads List.
- Quick Create and Full Create Load Console.
- Stops and item mapping.
- Driver, truck and trailer assignment.
- Active Loads and load details.
- Basic Planning Board.
- Driver and fleet availability checks.
- Messages.
- Basic alerts.
- Audit logs.

#### 31.2 Phase 2 — Live Operations

**Must/Should Have**

- Live GPS Map.
- GPS history.
- ETA and delay alerts.
- Location sharing.
- Proof photos and evidence workflow.
- Resource swap/transfer.
- Warehouse/yard readiness integration.
- Workforce Availability.
- Operational reports.

#### 31.3 Phase 3 — Optimisation and Advanced Automation

**Should/Could Have**

- Planning optimisation.
- Suggested driver/resource assignments.
- Route and utilisation insights.
- Predictive delay risk.
- Auto Fill Shifts.
- Advanced scheduled reports.
- Weather and traffic overlays through configured providers.

#### 31.4 Future Considerations

- Native mobile dispatcher experience.
- Voice-assisted dispatch commands.
- Customer live tracking share links.
- Advanced load consolidation.
- Automated customer ETA communication.
- Cross-company/inter-company load exchange.

---

### 32. QA, UAT and Definition of Done

#### 32.1 Test Coverage

Testing must include:

- Unit tests for business rules.
- API integration tests.
- Permission and tenant-isolation tests.
- Load lifecycle transition tests.
- Resource conflict and compliance tests.
- Planning Board interaction tests.
- GPS freshness and offline tests.
- File upload security tests.
- Message delivery tests.
- Report permission tests.
- Accessibility tests.
- Cross-browser tests.
- Performance/load tests.
- Backup/restore validation.

#### 32.2 Critical UAT Scenarios

1. Create a draft car-carrying load with multiple stops and items.
2. Validate item pickup/drop-off mapping.
3. Attempt activation without required proof configuration or compliant resource.
4. Assign an available driver/truck/trailer successfully.
5. Attempt double-booking and confirm rejection.
6. Activate and notify driver.
7. Driver accepts and begins trip.
8. GPS appears with correct freshness.
9. Dispatcher sends a destination and receives acknowledgement.
10. Record a delay and update ETA.
11. Swap trailer and confirm history.
12. Upload pickup/loading/delivery proof.
13. Complete load only after mandatory evidence.
14. Verify all events appear in timeline and audit log.
15. Confirm dispatcher cannot access unauthorised finance/payroll data.
16. Confirm branch-scoped user cannot access another branch through direct API or URL manipulation.
17. Assign a workforce shift and verify planning availability updates.
18. Export an authorised report and verify audit record.

#### 32.3 Definition of Done

A feature is complete only when:

- Approved UX is implemented.
- Functional requirements and acceptance criteria pass.
- Server-side permission enforcement is verified.
- Validation and error states are implemented.
- Audit events are present.
- Automated tests pass.
- Accessibility checks pass.
- Performance is within agreed targets.
- Product Owner/UAT approval is recorded.
- Operational documentation is updated.
- No unresolved critical or high-severity defects remain.

---

### 33. Risks, Dependencies and Open Decisions

#### 33.1 Key Risks

| **Risk** | **Impact** | **Mitigation** |
|---|---|---|
| GPS provider latency or outages | Incorrect live view and ETA decisions | Display freshness, provider health and degraded mode |
| Inconsistent load status names | Confusing dashboards and incorrect reporting | Approve one canonical status model |
| Resource data not updated | Invalid assignments | Real-time revalidation at activation and assignment |
| Excess dispatcher access | Privacy/security exposure | Least privilege and field-level permissions |
| Planning concurrency | Double-booking or overwritten assignments | Optimistic locking and transactional reservations |
| Large photo volume | Storage/performance cost | Direct secure upload, compression and lifecycle policy |
| AI/optimiser errors | Unsafe or inefficient assignments | Hard-rule validation and human confirmation |
| Mixed sample dates/time zones | Scheduling errors | UTC storage, branch time zone and explicit display |
| Financial reports visible to dispatcher | Data exposure | Category-level report permissions |
| Manual status changes | Broken operational truth | Transition rules, reason codes and audit history |

#### 33.2 Dependencies

- Approved Admin Portal role and permission framework.
- Driver Portal status and proof APIs.
- GPS/telematics provider selection.
- Mapping/routing provider selection.
- Vehicle, trailer and driver master data quality.
- Compliance and maintenance rules.
- Warehouse/yard module integration.
- SMS/push/email/WhatsApp provider configuration.
- Object storage and malware scanning.
- Approved load status taxonomy.

#### 33.3 Open Decisions Requiring Stakeholder Confirmation

1. Is the quick load form allowed to create an Active load, or only Draft/Planned?
2. What is the canonical progress calculation: stages, stops or combined?
3. Which load statuses are stored versus displayed as grouped categories?
4. Can dispatchers create full driver profiles, or only view operational data?
5. Can dispatchers create customers directly, or only provisional records?
6. Which proof photos are mandatory by load type and customer?
7. Does geofence arrival automatically suggest or update status?
8. Which GPS source is authoritative when mobile and vehicle telematics differ?
9. What working-hour/fatigue rules must the assignment engine enforce?
10. Can a dispatcher cancel or complete a load without supervisor approval?
11. Which report categories are available to dispatchers?
12. Is WhatsApp an approved communication channel?
13. What data retention applies to GPS history, messages and proof photos?
14. Are cross-branch assignments allowed, and who approves them?
15. What are the target GPS update interval and stale/offline thresholds?
16. Are route optimisation and Auto Fill features required for initial release?
17. Is the portal multi-company SaaS or a single-company deployment with multiple branches?
18. Which customer and driver fields are considered sensitive under company policy?

---

### Appendix A — Status Definitions

#### A.1 Load Statuses

| **Status** | **Definition** |
|---|---|
| Draft | Incomplete or unvalidated load not ready for dispatch |
| Planned | Scheduled load that may still require assignment or final validation |
| Pending Dispatch | Ready for assignment/acceptance or awaiting final release |
| Assigned | Driver/resources assigned; not yet accepted or started |
| Accepted | Driver has accepted the assignment |
| En Route to Pickup | Driver travelling to pickup |
| At Pickup | Driver arrived at pickup |
| Loaded | Required items loaded and relevant proof captured |
| In Transit | Load travelling between stops |
| At Delivery | Driver arrived at delivery location |
| Delivered | Delivery evidence recorded and physical delivery completed |
| Completed | Operational closure checks passed |
| Delayed | Schedule impact identified; may coexist as exception flag with active state |
| On Hold | Operationally paused with reason |
| Cancelled | Load cancelled and retained for audit |
| Failed Delivery | Delivery could not be completed and requires resolution |

#### A.2 Driver Statuses

- Available.
- On Duty.
- Assigned.
- En Route.
- At Pickup.
- At Delivery.
- Break.
- Off Duty.
- On Leave.
- Unavailable.
- Offline.

#### A.3 Vehicle/Trailer Statuses

- Available.
- Assigned.
- Active/In Use.
- In Maintenance.
- Out of Service.
- Compliance Blocked.
- Inactive/Sold.

#### A.4 Alert Statuses

- Open.
- Acknowledged.
- In Progress.
- Waiting.
- Resolved.
- Closed.

---

### Appendix B — Dispatcher Permission Matrix

| **Capability** | **Default** | **Elevated Permission** |
|---|---:|---:|
| View own authorised branches | Yes | No |
| View all company branches | No | Yes |
| Create load | Yes | No |
| Edit draft/planned load | Yes | No |
| Edit in-progress load | Limited | Yes for material changes |
| Activate/dispatch load | Yes | No |
| Cancel load | Limited | May require approval |
| Complete load manually | No | Yes |
| Assign driver/truck/trailer | Yes | No |
| Override compliance block | No | Yes |
| View GPS live | Yes | No |
| Export GPS history | No | Yes |
| Message driver/team | Yes | No |
| Broadcast message | No | Yes |
| View driver operational data | Yes | No |
| View driver payroll/bank/tax data | No | Yes, usually not dispatcher |
| Create driver | No | Yes |
| Edit vehicle master data | No | Yes |
| Create provisional customer | Configurable | Yes |
| Edit customer billing terms | No | Yes, usually Accounts/Sales |
| Assign workforce shift | Configurable | Yes |
| View operational reports | Yes | No |
| View financial/payroll reports | No | Yes |
| Export authorised reports | Configurable | Yes |
| Edit own profile | Yes | No |
| Edit own role/branch/permissions | No | Never self-service |

---

### Appendix C — Screen Inventory

| **Screen** | **Primary Purpose** |
|---|---|
| Dispatch Dashboard | Operational metrics, load cards, planning preview, GPS and driver status |
| Quick Create Load | Rapid simple load creation |
| All Loads | Search, filter, group, sort and manage loads |
| Create Load Console | Detailed multi-stop, multi-item and resource assignment workflow |
| Active Loads | Monitor current work and exceptions |
| Load Details | Review progress, route, items, evidence, assignments and actions |
| Planning Board | Schedule and assign loads to drivers/assets |
| Planning Quick Create | Create planned load from board context |
| Live GPS Map | Real-time map and on-road monitoring |
| Send Location | Send coordinates/navigation instructions to driver |
| Drivers List | Driver availability, assignment and compliance overview |
| Add Driver | Permission-controlled driver onboarding |
| Vehicles / Trailers | Fleet availability, assignment and compliance |
| Customers | Operational customer lookup and limited creation |
| Yard / Warehouse | Facility, stock and task readiness visibility |
| Workforce Availability | Shift, availability and resource capacity planning |
| Assign Shift | Create a worker shift |
| Messages | Driver/team conversations and load communication |
| New Message | Compose direct/group communication |
| Reports Dashboard | Authorised operational analytics and exports |
| Dispatcher Profile | Personal information, permissions, activity and security |
| Edit Profile | Update allowed personal fields |

---

### Appendix D — Acceptance Checklist

#### Authentication and Access

- [ ] Dispatcher signs in and sees only authorised branches.
- [ ] Direct API/URL access to another branch is rejected.
- [ ] Financial, payroll and settings modules are hidden by default.
- [ ] Role and permissions are read-only in the dispatcher profile.

#### Loads

- [ ] Dispatcher can create and save an incomplete draft.
- [ ] Dispatcher can add multiple stops and reorder them.
- [ ] Dispatcher can add multiple items and map each item to stops.
- [ ] Activation blocks missing mandatory information.
- [ ] Assignment blocks unavailable or non-compliant resources.
- [ ] Status transitions follow the approved lifecycle.
- [ ] Cancellation and hold require a reason.
- [ ] Completed/cancelled records remain auditable.

#### Planning

- [ ] Board shows resource schedule and unassigned loads.
- [ ] Drag-and-drop validates conflicts before saving.
- [ ] Optimisation suggestions require confirmation.
- [ ] Board updates appear in load and driver views.

#### GPS

- [ ] Live marker shows source and freshness.
- [ ] Offline/stale telemetry is clearly identified.
- [ ] GPS history is permission controlled and audited.
- [ ] Dispatcher can send validated location instructions.
- [ ] Driver acknowledgement is shown when required.

#### Drivers and Fleet

- [ ] Driver compliance and availability are visible.
- [ ] Sensitive driver data is masked/restricted.
- [ ] Vehicles and trailers are validated separately.
- [ ] Maintenance/out-of-service assets cannot be assigned.
- [ ] Resource swaps retain history.

#### Evidence

- [ ] Pickup, loading and delivery proof stages are configurable.
- [ ] Evidence stores time, uploader and available GPS metadata.
- [ ] Missing mandatory evidence blocks completion.
- [ ] Superseded evidence remains auditable.

#### Workforce and Warehouse

- [ ] Shift conflicts and leave conflicts are blocked.
- [ ] Shift assignments update resource availability.
- [ ] Load-linked warehouse/yard tasks are visible.
- [ ] Delayed readiness generates alerts.

#### Messages and Reports

- [ ] Load-linked messages are accessible from the load context.
- [ ] Message delivery/read state is visible.
- [ ] Dispatcher sees only authorised report categories.
- [ ] Exports reflect filters and create audit events.

#### Security and Quality

- [ ] MFA/2FA is supported.
- [ ] Sessions can be viewed and revoked.
- [ ] File uploads are validated and scanned.
- [ ] Critical actions are audited.
- [ ] Major pages have loading, empty and error states.
- [ ] Accessibility and keyboard navigation pass agreed checks.
- [ ] No unresolved critical or high-severity UAT defects remain.

---

### Sign-Off

| **Role** | **Name** | **Decision** | **Date** |
|---|---|---|---|
| Product Owner |  | Approved / Changes Required |  |
| Operations Lead |  | Approved / Changes Required |  |
| Dispatch Lead |  | Approved / Changes Required |  |
| Engineering Lead |  | Approved / Changes Required |  |
| QA/UAT Lead |  | Approved / Changes Required |  |
| Security/Compliance Representative |  | Approved / Changes Required |  |

---

**End of Document — Hero Logistics Dispatcher Portal PRD v1.0**


---

## Part 5 — Dispatcher Portal Supplemental Developer Specification

**Source classification:** Earlier generated Dispatcher Portal specification. This section is retained because it contains unique implementation, API, workflow and validation detail. Where it overlaps Part 4, both must be reconciled using the Requirement Precedence rules above.

### Hero Logistics — Dispatcher Portal Product Requirements Document (PRD)

**Document Version:** 1.0  
**Product Area:** Dispatcher Portal  
**Platform:** Hero Logistics Transport & Fleet Management System  
**Primary Role:** Dispatcher  
**Prepared Date:** 05 August 2026  
**Document Status:** Ready for Product, Design, Development, QA and UAT  
**Timezone Reference:** AEST / Australia-Sydney unless configured otherwise

---

#### 1. Document Purpose

This PRD defines the complete functional and non-functional requirements for the **Hero Logistics Dispatcher Portal**.

The portal is the operational workspace used by dispatchers to:

- create, schedule, assign and activate loads;
- monitor active deliveries;
- plan driver, truck and trailer allocation;
- track drivers and vehicles through live GPS;
- manage load stops, transported items and proof photos;
- review driver, vehicle and compliance availability;
- coordinate yard, warehouse and workforce resources;
- communicate with drivers and internal teams;
- access operational reports;
- manage their profile and security settings.

The UI values, names, counts, routes, dates and IDs shown in the supplied screens are sample data. The production system must use live tenant and branch data.

---

#### 2. Product Vision

Provide dispatchers with a single real-time command centre that reduces manual coordination, improves resource utilisation, prevents unsafe assignments and maintains traceability from load creation to delivery completion.

---

#### 3. Goals and Success Metrics

##### 3.1 Goals

1. Enable fast creation and activation of valid loads.
2. Give dispatchers clear visibility of active, planned and delayed operations.
3. Prevent assignments involving unavailable or non-compliant resources.
4. Provide real-time driver, truck, trailer and route tracking.
5. Centralise dispatcher-driver communication.
6. Support branch-level workforce and load planning.
7. Maintain complete operational and audit history.
8. Improve on-time delivery and reduce avoidable delays.

##### 3.2 Success Metrics

| Metric | Target |
|---|---:|
| Average time to create a standard load | Under 3 minutes |
| Average assignment time | Under 60 seconds |
| Invalid hard-rule assignments prevented | 100% |
| Critical delay alert delivery | Under 60 seconds after detection |
| Dispatcher portal availability | 99.9% monthly |
| Load activation with missing mandatory data | 0 |
| Unauthorised cross-branch access | 0 |
| Audit coverage for load-changing actions | 100% |
| Standard filtered list response | Under 2 seconds |

---

#### 4. Users and Access Scope

##### 4.1 Primary User — Dispatcher

The dispatcher coordinates daily transport operations for one or more authorised branches.

Main responsibilities:

- create and schedule loads;
- assign drivers, trucks and trailers;
- monitor active loads and exceptions;
- coordinate pickup and delivery windows;
- communicate with drivers;
- monitor GPS and delays;
- allocate available workforce;
- review operational reports;
- verify operational compliance before assignment.

##### 4.2 Supporting Roles

- Company Admin
- Operations Manager
- Driver
- Warehouse Manager
- Yard Staff
- Compliance Officer
- Maintenance Team
- Customer Contact

##### 4.3 Default Dispatcher Scope

The Dispatcher role is branch-scoped by default. A dispatcher may access only records linked to authorised branches unless multi-branch access is explicitly granted.

##### 4.4 Restricted Areas

A dispatcher must not automatically access:

- tenant or company management;
- role and permission administration;
- subscription and billing settings;
- company-wide finance;
- payroll processing;
- pricing administration;
- security settings for other users;
- destructive company-level settings.

Sensitive payroll, financial and commercial data must require explicit permission.

##### 4.5 Suggested Permission Keys

- `dispatch.dashboard.view`
- `dispatch.load.create`
- `dispatch.load.edit`
- `dispatch.load.activate`
- `dispatch.load.cancel`
- `dispatch.load.assign`
- `dispatch.load.transfer`
- `dispatch.load.export`
- `dispatch.planning.view`
- `dispatch.planning.optimise`
- `dispatch.gps.view`
- `dispatch.gps.send_location`
- `dispatch.driver.view`
- `dispatch.driver.create`
- `dispatch.driver.edit`
- `dispatch.vehicle.view`
- `dispatch.customer.view`
- `dispatch.customer.create`
- `dispatch.warehouse.view`
- `dispatch.workforce.view`
- `dispatch.workforce.assign_shift`
- `dispatch.message.send`
- `dispatch.report.view`
- `dispatch.report.export`
- `dispatch.profile.edit`

All backend endpoints must enforce permissions independently of frontend visibility.

---

#### 5. Portal Navigation

1. Dispatch Dashboard
2. Create Load
3. Active Loads
4. Planning Board
5. Live GPS Map
6. Drivers
7. Vehicles / Trailers
8. Customers
9. Yard / Warehouse
10. Workforce Availability
11. Messages
12. Reports & Analytics
13. Profile

##### 5.1 Shared Header

- company logo;
- portal name;
- user identity and role;
- notifications;
- unread messages;
- global quick search;
- `Ctrl + K` / `Cmd + K` shortcut;
- branch selector where authorised;
- timezone-aware date and time;
- account menu and logout.

##### 5.2 Global Search

Search must support authorised results for:

- load ID or reference;
- customer;
- driver;
- vehicle or trailer;
- registration number;
- VIN;
- route or destination;
- conversation;
- document.

Search must never expose data outside tenant or branch scope.

---

### 6. Functional Requirements

#### 6.1 Dispatch Dashboard

##### Purpose

Provide a real-time operational overview and quick access to critical dispatch actions.

##### KPI Cards

- Total Loads
- Active Loads
- Planned Loads
- Completed Today
- Delayed Loads
- Available Drivers
- Available Trucks
- Available Trailers

Each KPI should support count, comparison, trend, click-through and last refresh time.

##### Filters

- Branch
- Status
- Driver
- Customer
- Destination
- Required Date
- Load Type
- Vehicle / Trailer
- Available Workers
- Reset Filters

##### Dashboard Load List

Each card or row must show:

- load ID;
- status;
- date;
- customer;
- origin and destination;
- assigned driver;
- truck or trailer;
- delay state;
- action to open details.

##### Embedded Planning Board

The dashboard board must show branch/depot columns, load cards, customer, route, date, driver, stop count, item count and an Add Load action.

##### Embedded GPS and Driver Status

The dashboard must show active driver markers and driver cards with:

- driver name;
- duty status;
- vehicle;
- load ID;
- current location;
- latest telemetry;
- last GPS update.

##### Requirements

| ID | Requirement | Priority |
|---|---|---|
| DSP-DASH-001 | Show branch-scoped operational KPIs. | Must |
| DSP-DASH-002 | Filters update all compatible widgets. | Must |
| DSP-DASH-003 | KPI click opens the related filtered list. | Should |
| DSP-DASH-004 | Delayed and pending-dispatch loads are highlighted. | Must |
| DSP-DASH-005 | Resource availability is displayed. | Must |
| DSP-DASH-006 | Last refresh time is visible. | Must |
| DSP-DASH-007 | Auto-refresh interval is configurable. | Should |
| DSP-DASH-008 | Dashboard is responsive on desktop and tablet. | Must |

##### Acceptance Criteria

- Dispatcher sees live counts for active, planned, completed and delayed loads.
- Branch and status filters update the page.
- Delayed loads are visually distinguishable.
- Clicking a load opens load details.
- Data outside authorised branches is not visible.

---

#### 6.2 Quick Create Load

##### Fields

- Customer
- Status
- Pickup Location
- Delivery Location
- Assigned Driver
- Vehicle / Trailer
- Required Date
- Required Time

##### Actions

- Open Full Console
- Cancel
- Create Load

##### Business Rules

1. Customer, pickup, delivery, required date and time are mandatory.
2. Selected driver and assets must be available and compatible.
3. Driver must hold required licence and certifications.
4. Conflicts must block creation or require an authorised override.
5. Open Full Console must carry forward entered values.
6. Duplicate submissions must be prevented.

| ID | Requirement | Priority |
|---|---|---|
| DSP-QLOAD-001 | Support fast standard load creation. | Must |
| DSP-QLOAD-002 | Validate selected resources before save. | Must |
| DSP-QLOAD-003 | Preserve values when opening full console. | Must |
| DSP-QLOAD-004 | Show field-specific validation errors. | Must |
| DSP-QLOAD-005 | Prevent duplicate submission. | Must |

---

#### 6.3 Full Create Load Console

##### Operational Principle

**Load → Stops → Items**

A load contains an ordered route. Every transported item must link to one pickup stop and one drop-off stop.

##### Main Actions

- Save Draft
- Activate Load
- Add Stop
- Add Item
- Bulk Import
- Cancel / Exit

##### Section 1 — Load Information

Fields:

- Booking Customer
- Load Type / Service
- Load Reference
- Priority
- Load Date
- Branch
- Booking Channel
- Customer Purchase Order
- Special Handling Flag
- Dangerous Goods Flag
- Temperature-Controlled Flag

Initial load types:

- Car Carrying
- General Freight
- Dangerous Goods
- Warehousing Transfer
- Other configured types

The form must change dynamically by load type.

##### Section 2 — Route Stops

Each stop supports:

- sequence;
- type;
- address;
- suburb;
- state;
- postcode;
- country;
- latitude and longitude;
- contact name and phone;
- scheduled date;
- time window;
- instructions;
- notes;
- geofence radius;
- status.

Stop types:

- Pickup
- Drop-off
- Depot
- Warehouse
- Rest / Checkpoint
- Other

Functions:

- add;
- edit;
- delete;
- drag to reorder;
- duplicate;
- geocode;
- route validation;
- distance and ETA calculation.

##### Route Rules

1. Activation requires at least one pickup and one drop-off.
2. Pickup must occur before the linked drop-off.
3. A stop cannot be deleted while linked items remain assigned to it.
4. Reordering recalculates route and ETA.
5. Invalid addresses create a warning or block based on configuration.

##### Section 3 — Items

Common fields:

- item number;
- customer / owner;
- pickup stop;
- drop-off stop;
- reference;
- description;
- quantity;
- dimensions;
- weight;
- handling instructions;
- notes.

Car-carrying fields:

- registration number;
- VIN / chassis number;
- stock number;
- make;
- model;
- year;
- colour;
- length;
- width;
- height;
- weight;
- vehicle type;
- keys available;
- damage report required;
- operable / non-operable;
- special loading requirement.

##### Vehicle Lookup

When registration or VIN lookup is configured:

- returned data may auto-fill;
- values remain editable;
- the lookup response is logged;
- the user verifies data before activation;
- a failed lookup does not remove manually entered data.

##### Proof Photos

Photo stages:

1. Pickup Photos — before loading
2. Loading Photos — Chain of Responsibility
3. Delivery Photos — after unloading

Rules:

- photo requirements are configurable by load type;
- timestamp, uploader and GPS metadata are stored;
- unsupported or oversized files are rejected;
- delivery completion can be blocked when mandatory proof is missing.

##### Section 4 — Assign Truck and Driver

Fields:

- Truck
- Trailer
- Primary Driver
- Secondary Driver / Team
- Driver Instructions
- Dispatch Notes
- Required Certifications
- Required Vehicle Capabilities

##### Assignment Validation

Validate:

- driver status and availability;
- shift and leave;
- licence class;
- driver compliance;
- fatigue and hours-of-service limits;
- existing assignment conflicts;
- truck status and compliance;
- truck maintenance;
- trailer status and compliance;
- truck-trailer compatibility;
- trailer capacity;
- item capacity;
- branch access;
- route restrictions.

##### Draft vs Activation

**Save Draft** permits incomplete non-critical fields and does not notify the driver.

**Activate Load** must:

- enforce all mandatory data;
- validate resources;
- reserve assignments;
- create dispatch event;
- notify driver;
- add status history;
- create audit log;
- trigger required pre-trip checklist.

| ID | Requirement | Priority |
|---|---|---|
| DSP-LOAD-001 | Create and save load as draft. | Must |
| DSP-LOAD-002 | Activate a valid load. | Must |
| DSP-LOAD-003 | Reorder stops by drag and drop. | Must |
| DSP-LOAD-004 | Link every item to pickup and drop-off stops. | Must |
| DSP-LOAD-005 | Validate all assigned resources. | Must |
| DSP-LOAD-006 | Configure photo requirements by load type. | Must |
| DSP-LOAD-007 | Block configured milestones when proof is missing. | Must |
| DSP-LOAD-008 | Handle duplicate references. | Must |
| DSP-LOAD-009 | Support dynamic fields by load type. | Should |
| DSP-LOAD-010 | Show driver instructions in driver application. | Must |
| DSP-LOAD-011 | Audit every create, edit and activation. | Must |
| DSP-LOAD-012 | Bulk import returns row-level validation. | Should |

##### Activation Acceptance Criteria

A load can activate only when:

- reference and type are valid;
- route is valid;
- items are correctly mapped;
- customer and schedule are complete;
- selected resources pass hard checks;
- mandatory compliance is valid;
- overrides have permission and reason;
- duplicate booking policy is satisfied.

---

#### 6.4 All Loads

##### Status Tabs

- All Loads
- Draft
- Planned
- Active
- Completed
- Cancelled

##### Filters

- search;
- date from / to;
- status;
- type;
- customer;
- driver;
- vehicle;
- location;
- branch;
- more filters.

##### Table Columns

- selection;
- load reference;
- primary and operational status;
- type;
- customer;
- route and stops;
- driver;
- truck;
- pickup date;
- ETA / delivery;
- progress;
- actions.

##### Functions

- import;
- export;
- AI Loads / Inbox;
- new load;
- columns;
- group by;
- sort;
- pagination;
- page size;
- saved filters;
- bulk actions.

##### Bulk Actions

- assign driver;
- assign truck or trailer;
- mark completed;
- place on hold;
- cancel;
- transfer branch;
- export selected;
- notify driver.

Every bulk action must return success count, failure count and row-level reasons.

| ID | Requirement | Priority |
|---|---|---|
| DSP-LIST-001 | Support combined filters. | Must |
| DSP-LIST-002 | Allow per-user column configuration. | Should |
| DSP-LIST-003 | Search by load ID, customer, driver, rego and VIN. | Must |
| DSP-LIST-004 | Validate each selected row in bulk actions. | Must |
| DSP-LIST-005 | Exports respect filters and permissions. | Must |
| DSP-LIST-006 | Support configurable pagination. | Must |
| DSP-LIST-007 | Keep all results branch scoped. | Must |

---

#### 6.5 Active Loads

##### Operational Categories

- In Transit
- En Route to Pickup
- At Pickup
- At Delivery
- On Hold

##### Table

- Load ID
- Status
- Driver / Team
- Route
- Customer
- Vehicle / Trailer
- Required Date
- Progress
- Actions

##### Load Details

Header:

- load ID;
- current status;
- customer;
- required date;
- origin and destination.

Tabs:

- Overview
- Stops
- Items / Cars
- Documents
- Notes

Panels:

- assigned driver;
- assigned truck and trailer;
- compliance state;
- progress timeline;
- route tracking;
- latest GPS;
- quick actions.

##### Quick Actions

- Message Driver
- Call Driver
- View Instructions
- Swap Trailer
- Transfer Load
- Add Note
- View Live Map
- Open Route
- View GPS History
- Send Location
- Refresh GPS
- Place on Hold
- Resume Load
- Raise Delivery Issue

##### Suggested Milestones

1. Accepted
2. En Route
3. At Pickup
4. Loaded
5. In Transit
6. At Delivery
7. Delivered
8. Completed

| ID | Requirement | Priority |
|---|---|---|
| DSP-ACT-001 | Show only operationally active loads. | Must |
| DSP-ACT-002 | Show milestone progress. | Must |
| DSP-ACT-003 | Provide GPS, route and communication actions. | Must |
| DSP-ACT-004 | Validate trailer swap. | Must |
| DSP-ACT-005 | Preserve history during load transfer. | Must |
| DSP-ACT-006 | Store actor, time and location for status changes. | Must |

---

#### 6.6 Planning Board

##### Controls

- Branch
- Date
- Day / Week View
- Vehicle Type
- Driver
- Vehicle / Trailer
- Status
- Optimise Board
- Create Load
- Drivers & Assets / List View

##### Components

- unassigned load pool;
- resource rows;
- timeline;
- load cards;
- available blocks;
- shifts;
- capacity;
- conflict indicators.

##### Drag-and-Drop Actions

- unassigned load to driver;
- load between drivers;
- load to another time;
- load to another vehicle or trailer;
- load back to unassigned.

Before save, validate:

- time overlap;
- route feasibility;
- shift and leave;
- compliance;
- asset status;
- capacity;
- fatigue;
- branch access.

##### Optimise Board

Optimisation should consider:

- time windows;
- driver availability;
- shifts;
- licence and certification;
- vehicle capability;
- current location;
- load priority;
- capacity;
- maintenance and compliance;
- fatigue limits;
- empty kilometres;
- depot constraints.

Optimisation produces suggestions only until confirmed.

| ID | Requirement | Priority |
|---|---|---|
| DSP-PLAN-001 | Display assigned and unassigned loads. | Must |
| DSP-PLAN-002 | Allow drag-and-drop assignment. | Must |
| DSP-PLAN-003 | Block invalid assignments with reasons. | Must |
| DSP-PLAN-004 | Display shifts and availability. | Must |
| DSP-PLAN-005 | Explain optimisation recommendations. | Should |
| DSP-PLAN-006 | Never auto-apply without confirmation. | Must |
| DSP-PLAN-007 | Audit planning changes. | Must |
| DSP-PLAN-008 | Detect concurrent editing conflicts. | Must |

##### Concurrency

The system must prevent silent overwrite when multiple dispatchers edit the same plan. Use optimistic locking or record locking with a clear stale-data message.

---

#### 6.7 Live GPS Map

##### Filters

- Branch
- Driver
- Driver Status
- Load Status
- Search
- More Filters

##### Driver List

Display:

- driver;
- load ID;
- status;
- route;
- last update;
- delay;
- offline indicator.

##### Map Tools

- Track Driver
- View Live Map
- Open Route
- View History
- Refresh GPS
- Traffic Overlay
- Geofences
- Weather
- Full Screen
- Map / Satellite
- Send Location to Driver

##### Selected Driver Panel

- driver identity;
- status;
- current load;
- customer;
- route;
- speed;
- heading;
- last update;
- distance remaining;
- route stops;
- vehicle;
- documents;
- notes;
- latest events.

##### GPS Freshness

Suggested defaults:

- Live: within 2 minutes
- Recent: within 5 minutes
- Stale: 5–15 minutes
- Offline: more than 15 minutes

Thresholds must be configurable.

##### Route and Geofence Events

- departed depot;
- arrived at stop;
- departed stop;
- route deviation;
- extended stop;
- geofence entry or exit;
- speeding;
- device offline;
- ETA change.

##### Send Location to Driver

Fields:

- target driver;
- destination preset;
- address;
- latitude and longitude;
- instructions;
- channel;
- attach navigation link;
- require confirmation.

Channels:

- Push + SMS
- App Only
- WhatsApp where integrated
- Broadcast where authorised

Record sender, recipient, coordinates, channel, sent time, delivery state and confirmation.

| ID | Requirement | Priority |
|---|---|---|
| DSP-GPS-001 | Show authorised tracked drivers and assets. | Must |
| DSP-GPS-002 | Always show last update time. | Must |
| DSP-GPS-003 | Clearly identify stale and offline data. | Must |
| DSP-GPS-004 | Store route and geofence events. | Must |
| DSP-GPS-005 | Allow dispatcher to send destination. | Must |
| DSP-GPS-006 | Support required driver confirmation. | Should |
| DSP-GPS-007 | Permission-control GPS history. | Must |
| DSP-GPS-008 | Apply GPS retention policy. | Must |

---

#### 6.8 Drivers

##### Driver List

Summary cards:

- total drivers;
- on duty;
- off duty;
- on leave;
- unavailable;
- expiring documents.

Filters:

- search;
- status;
- licence type;
- compliance;
- branch;
- more filters.

Columns:

- driver;
- ID;
- phone;
- licence;
- status;
- branch;
- assignment;
- compliance;
- actions.

##### AI Driver Insights

Optional recommendations:

- expiring documents;
- suggested drivers;
- performance watch.

AI output must never bypass hard compliance rules.

##### Add Driver

###### Personal Information

- photo;
- first and last name;
- employee ID;
- date of birth;
- gender;
- nationality;
- phone and email;
- emergency contact;
- residential address.

###### Employment

- role;
- employment type;
- branch;
- manager;
- joining date;
- status;
- shift;
- category.

###### Licence

- type;
- number;
- state;
- issue date;
- expiry date;
- class;
- uploaded document.

###### Compliance Documents

- medical certificate;
- police verification;
- background check;
- drug and alcohol certificate;
- first aid;
- training;
- other.

###### Payroll Information

Only with permission:

- pay type and rate;
- bank;
- account number;
- BSB;
- tax number;
- superannuation fund.

Sensitive data must be encrypted and masked.

###### Vehicle Preferences

- preferred vehicle;
- routes;
- regions;
- maximum trip distance;
- dangerous goods certification;
- heavy vehicle certification.

###### Availability

- available from;
- preferred shift;
- weekly hours limit;
- maximum daily hours;
- rest days;
- working days.

###### Account

- username;
- secure invitation or password setup;
- send credentials option.

Passwords must never be stored or shown in plaintext.

##### Driver Details

Header and summary:

- identity and status;
- employee ID;
- personal and contact details;
- licence;
- branch;
- employment type;
- overall compliance;
- completed loads;
- on-time delivery;
- total distance;
- incidents and accidents.

Tabs:

- Overview
- Documents & Compliance
- Assignments & Availability
- Performance
- Payroll
- Activity Timeline

##### Driver Audit Trail

Categories:

- Assignments
- Safety
- Documents
- Payroll
- Compliance
- Leave
- Status Changes

Functions:

- search;
- date filters;
- category filters;
- manual note;
- export;
- print;
- view audit details.

Each entry must include title, state, category, exact date and time, description, performer, source and audit ID.

| ID | Requirement | Priority |
|---|---|---|
| DSP-DRV-001 | Show driver status, assignment and compliance. | Must |
| DSP-DRV-002 | Validate required fields and uniqueness on create. | Must |
| DSP-DRV-003 | Block assignment for expired mandatory documents. | Must |
| DSP-DRV-004 | Protect and mask payroll data. | Must |
| DSP-DRV-005 | Keep audit trail immutable to normal users. | Must |
| DSP-DRV-006 | Store author and time for manual notes. | Must |
| DSP-DRV-007 | Use secure account invitation. | Must |
| DSP-DRV-008 | AI suggestions cannot bypass compliance. | Must |

---

#### 6.9 Vehicles and Trailers

##### Vehicle List

Summary:

- total vehicles;
- active;
- maintenance;
- out of service;
- compliance due.

Tabs:

- All
- Active
- In Maintenance
- Out of Service
- Sold / Inactive

Columns:

- vehicle and registration;
- type, make and model;
- year;
- status;
- current driver;
- odometer;
- compliance;
- next service;
- actions.

##### Vehicle Compliance

- registration;
- insurance;
- roadworthy;
- accreditation;
- dangerous goods;
- maintenance;
- custom documents.

States:

- Compliant
- Expiring Soon
- Overdue
- Not Uploaded
- Under Review
- Not Applicable

##### Trailer Data

- trailer ID;
- registration;
- type;
- capacity;
- branch;
- status;
- current truck;
- current load;
- compliance;
- next service;
- dimensions;
- supported load types.

##### Assignment Rules

An asset cannot be assigned when:

- out of service;
- under maintenance;
- compliance expired;
- already assigned;
- incompatible;
- capacity insufficient;
- branch transfer incomplete;
- manually locked.

| ID | Requirement | Priority |
|---|---|---|
| DSP-VEH-001 | Show vehicle and trailer availability. | Must |
| DSP-VEH-002 | Use compliance in assignment eligibility. | Must |
| DSP-VEH-003 | Block maintenance and out-of-service assets. | Must |
| DSP-VEH-004 | Validate truck-trailer compatibility. | Must |
| DSP-VEH-005 | Show odometer and next service. | Should |
| DSP-VEH-006 | Retain assignment history. | Must |

---

#### 6.10 Customers

##### Customer List

Summary:

- total customers;
- active;
- new this month;
- inactive;
- top customer where permitted.

Filters:

- search;
- status;
- customer type;
- transport module;
- account manager;
- state;
- created date.

Columns:

- customer;
- type;
- contact;
- transport modules;
- billing terms;
- account manager;
- status;
- actions.

##### Add Customer

Minimum fields:

- company name;
- ABN / ACN;
- customer type.

Extended data may include contact, billing and operational locations, billing terms, status and enabled transport modules.

Dispatchers may view operational customer data and create a basic customer when permitted. Credit, pricing and financial terms require explicit access.

| ID | Requirement | Priority |
|---|---|---|
| DSP-CUS-001 | Search authorised customers. | Must |
| DSP-CUS-002 | Create basic customer when permitted. | Should |
| DSP-CUS-003 | Check duplicate ABN and company. | Must |
| DSP-CUS-004 | Permission-control restricted commercial fields. | Must |
| DSP-CUS-005 | Customer status affects load creation policy. | Must |

---

#### 6.11 Yard and Warehouse

##### Dashboard Metrics

- total warehouses;
- inventory value where permitted;
- stock items;
- pending pick tasks;
- incoming shipments;
- outgoing shipments.

##### Warehouse List

- warehouse name;
- code;
- branch and location;
- type;
- status;
- stock items;
- inventory value;
- utilisation;
- actions.

##### Alerts

- low stock;
- stock expiry;
- overdue pick tasks;
- incoming shipment;
- operational exception.

##### Dispatcher Actions

Depending on permission:

- view warehouse;
- view stock availability;
- create pick request;
- link warehouse task to load;
- coordinate outgoing shipment;
- view incoming load;
- initiate transfer request;
- message warehouse team.

| ID | Requirement | Priority |
|---|---|---|
| DSP-WH-001 | Show operational warehouse status. | Should |
| DSP-WH-002 | Link warehouse tasks to loads. | Should |
| DSP-WH-003 | Reflect task state in load context. | Should |
| DSP-WH-004 | Hide financial inventory values without permission. | Must |
| DSP-WH-005 | Keep warehouse data branch scoped. | Must |

---

#### 6.12 Workforce Availability

##### Filters

- Branch
- View
- Workforce Type
- Role / Position
- Status
- Date
- More Filters

##### Summary

- Total Workforce
- Available Today
- On Shift
- On Leave
- Absent / Unavailable

##### Views

- Schedule View
- List View
- Unavailability
- Leave Calendar

##### Workforce Groups

- Drivers
- Warehouse Staff
- Yard Crew
- Mechanics
- Administrators
- Configured groups

##### Schedule States

- On Shift
- Available
- Leave
- En Route
- Break / Off Duty
- Unavailable

##### Selected Worker Panel

- name and status;
- role;
- employee ID;
- mobile;
- skills and certifications;
- shifts;
- notes;
- upcoming availability;
- quick actions.

##### Assign Shift

Fields:

- date;
- shift type;
- start and end time;
- role;
- notes.

Validation:

- overlapping shift;
- approved leave;
- unavailable period;
- maximum working hours;
- minimum rest;
- qualification;
- branch;
- active load conflict.

##### Auto Fill Shifts

Auto Fill may suggest qualified available workers but must not apply without confirmation.

| ID | Requirement | Priority |
|---|---|---|
| DSP-WF-001 | Show weekly workforce availability. | Must |
| DSP-WF-002 | Assign a valid shift when permitted. | Must |
| DSP-WF-003 | Block shift conflicts. | Must |
| DSP-WF-004 | Reflect leave and unavailability immediately. | Must |
| DSP-WF-005 | Auto-fill provides suggestions only. | Should |
| DSP-WF-006 | Notify workers of shift changes. | Should |
| DSP-WF-007 | Audit every shift change. | Must |

---

#### 6.13 Messages

##### Conversation List

Tabs:

- All
- Unread
- Groups
- Archived

Each conversation shows participant or group, last message, time, unread count, linked load and operational state.

##### Chat Functions

- send text;
- attach file;
- attach location;
- link load;
- reply;
- mark read;
- mute;
- archive;
- search;
- call or video action where integrated.

##### New Message

Fields:

- recipient;
- subject;
- priority;
- message;
- attachment;
- location.

##### Delivery States

- Queued
- Sent
- Delivered
- Read
- Failed

| ID | Requirement | Priority |
|---|---|---|
| DSP-MSG-001 | Send direct messages. | Must |
| DSP-MSG-002 | Create authorised group conversations. | Should |
| DSP-MSG-003 | Link messages to a load. | Must |
| DSP-MSG-004 | Display delivery and read status where supported. | Should |
| DSP-MSG-005 | Scan and protect attachments. | Must |
| DSP-MSG-006 | Retain message history according to policy. | Must |
| DSP-MSG-007 | Search archived conversations. | Should |

---

#### 6.14 Reports and Analytics

##### Dashboard Metrics

- total reports;
- recently viewed;
- scheduled reports;
- favourites;
- downloads.

##### Categories

- Operations Reports
- Compliance Reports
- Analytics & Insights
- Financial Reports only when explicitly permitted

##### Recommended Dispatcher Reports

- Daily Load Activity
- Active Load Status
- Delayed Loads
- Load Performance Summary
- On-Time Delivery
- Driver Availability
- Driver Compliance Expiry
- Vehicle Availability
- Vehicle Compliance
- Trailer Utilisation
- Fleet Utilisation
- Empty Kilometres
- Route Performance
- Warehouse Dispatch Activity
- Unassigned Loads
- Cancelled Loads
- Dispatcher Activity
- Communication Response
- Delivery Issues
- Proof of Delivery Completion

##### Functions

- search;
- filters;
- date range;
- view;
- export;
- favourite;
- schedule;
- custom report where permitted.

##### Export Formats

- CSV
- XLSX
- PDF

Exports must include report name, generated by, generated time, timezone, branch scope and active filters.

| ID | Requirement | Priority |
|---|---|---|
| DSP-RPT-001 | Access authorised operational reports. | Should |
| DSP-RPT-002 | Respect branch and permission scope. | Must |
| DSP-RPT-003 | Export only filtered data. | Must |
| DSP-RPT-004 | Validate scheduled recipients. | Must |
| DSP-RPT-005 | Hide financial reports by default. | Must |
| DSP-RPT-006 | Audit report generation and exports. | Must |

---

#### 6.15 Dispatcher Profile

##### Profile Data

- full name;
- avatar;
- online status;
- job title;
- employee ID;
- mobile;
- email;
- address;
- working hours;
- break duration;
- language;
- timezone;
- emergency contact.

##### Role and Permissions

Display role, access level, branch and granted permissions. Permission data is read-only.

##### Recent Activity

- login;
- load creation;
- load update;
- assignment;
- message;
- export;
- security event.

##### Account and Security

- username;
- change password;
- 2FA state;
- active devices;
- revoke session;
- logout all devices.

Changing mobile or email should require verification.

| ID | Requirement | Priority |
|---|---|---|
| DSP-PRO-001 | View profile and access scope. | Must |
| DSP-PRO-002 | Edit permitted personal fields. | Must |
| DSP-PRO-003 | Verify email and phone changes. | Must |
| DSP-PRO-004 | View and revoke sessions. | Must |
| DSP-PRO-005 | Support 2FA. | Must |
| DSP-PRO-006 | Prevent permission editing from profile. | Must |

---

#### 6.16 AI Loads / Inbox

##### Sources

- Email
- Customer Portal
- File Upload
- Driver / Field Submission
- AI Extraction

##### Inbox Card

- draft ID;
- source;
- booking reference;
- urgency;
- confidence;
- received time;
- driver;
- vehicle;
- cargo;
- route;
- review action.

##### Workflow

1. Open draft.
2. Compare extracted data with source.
3. Review field-level confidence.
4. Correct low-confidence values.
5. check duplicates.
6. validate customer and route.
7. add stops and items.
8. assign resources.
9. save draft or activate.

##### AI Rules

- AI must not auto-activate without configured approval.
- Original source remains attached.
- Extracted and corrected values remain traceable.
- Confidence scores are stored.
- Dangerous goods, urgent and low-confidence drafts are highlighted.
- Normal activation rules always apply.

| ID | Requirement | Priority |
|---|---|---|
| DSP-AI-001 | Review AI-generated drafts. | Should |
| DSP-AI-002 | Show source and extracted values together. | Must |
| DSP-AI-003 | Highlight low-confidence fields. | Must |
| DSP-AI-004 | Apply normal activation validation. | Must |
| DSP-AI-005 | Prevent unapproved auto-dispatch. | Must |

---

### 7. End-to-End Workflows

#### 7.1 Standard Load Dispatch

1. Dispatcher creates a load.
2. Customer and load type are selected.
3. Route stops are added.
4. Items are entered or imported.
5. Each item is mapped to pickup and drop-off.
6. Driver, truck and trailer are selected.
7. System validates compliance and conflicts.
8. Dispatcher saves draft or activates.
9. On activation, resources are reserved and driver notified.
10. Driver accepts assignment.
11. Driver completes safety checklist.
12. GPS and milestone updates begin.
13. Dispatcher handles exceptions.
14. Driver uploads delivery proof.
15. Load is delivered and completed.

#### 7.2 Planning Board Assignment

1. Dispatcher opens branch and date.
2. System loads shifts, resources and loads.
3. Dispatcher reviews unassigned loads.
4. Load is dragged to a resource row.
5. System validates the assignment.
6. Dispatcher confirms.
7. Driver and asset assignment is updated.
8. Notifications and audit entries are generated.

#### 7.3 Delayed Load Management

1. System detects ETA breach, route deviation or manual delay.
2. Load is marked delayed.
3. Dashboard and GPS alert dispatcher.
4. Dispatcher contacts driver and records reason.
5. Dispatcher may update ETA, send route, contact customer, swap resource or raise issue.
6. All actions are recorded.
7. Delay is cleared only through valid resolution.

#### 7.4 Driver or Asset Swap

1. Dispatcher selects swap action.
2. System shows eligible replacements.
3. Selected replacement is validated.
4. Dispatcher enters reason.
5. Assignment updates.
6. Relevant users are notified.
7. Old and new assignments remain in history.

#### 7.5 Send GPS Destination

1. Dispatcher selects driver.
2. Destination preset or address is chosen.
3. Coordinates are resolved.
4. Instructions and channel are selected.
5. Confirmation may be required.
6. Driver receives navigation link.
7. Delivery and confirmation states are stored.

#### 7.6 Shift Assignment

1. Dispatcher selects worker.
2. Date and shift are entered.
3. Conflicts and qualifications are validated.
4. Shift is confirmed.
5. Worker is notified.
6. Audit entry is created.

---

### 8. Status Models

#### 8.1 Load Primary Status

- Draft
- Planned
- Active
- Completed
- Cancelled

#### 8.2 Load Operational Status

- Not Ready
- Ready
- Pending Dispatch
- Assigned
- Accepted
- En Route to Pickup
- At Pickup
- Loaded
- In Transit
- At Stop
- At Delivery
- Delivered
- On Hold
- Delayed
- Cancelled

Transitions must be enforced by a server-side state machine.

#### 8.3 Driver Status

- Available
- On Duty
- En Route
- At Pickup
- At Delivery
- Break
- Off Duty
- On Leave
- Unavailable
- Delayed
- Offline

#### 8.4 Vehicle / Trailer Status

- Available
- Active
- Assigned
- In Transit
- Maintenance
- Out of Service
- Sold
- Inactive

#### 8.5 Compliance Status

- Compliant
- Expiring Soon
- Overdue
- Not Uploaded
- Under Review
- Rejected
- Not Applicable

---

### 9. Business Rules

#### 9.1 Assignment Rules

1. Only available and compliant resources can be assigned.
2. Driver must hold the required licence.
3. Dangerous goods requires valid certification.
4. Drivers and assets cannot have overlapping assignments.
5. Maintenance and out-of-service assets cannot be assigned.
6. Truck-trailer compatibility is mandatory.
7. Capacity cannot be exceeded.
8. Rest and working-hour rules apply.
9. Hard-rule override requires permission, reason and audit.

#### 9.2 Load Rules

1. Reference uniqueness follows company policy.
2. Activation requires valid route, schedule and items.
3. Every item requires stop mapping.
4. Cancellation requires reason.
5. Completed loads require controlled correction workflow.
6. Status history cannot be deleted.
7. Required proof must exist before completion.
8. Branch must be within user access.

#### 9.3 Data Visibility

1. Branch users see authorised branches only.
2. Payroll and bank data are masked.
3. Financial reports are hidden by default.
4. GPS history is permission controlled.
5. Customer commercial terms require permission.
6. Exports follow the same access rules as screens.

#### 9.4 Dates and Timezones

1. Store timestamps in UTC.
2. Display in user or branch timezone.
3. Show timezone for operational schedules.
4. Support daylight-saving transitions.
5. Preserve exact timestamp even when relative time is displayed.

---

### 10. Notifications and Alerts

#### Dispatcher Alerts

- urgent unassigned load;
- delayed load;
- route deviation;
- driver offline;
- rejected assignment;
- resource conflict;
- compliance expiry;
- maintenance due;
- failed checklist;
- missed pickup or delivery window;
- missing proof;
- new message;
- delivery issue;
- shift shortage.

#### Driver Notifications

- new assignment;
- assignment change or cancellation;
- route change;
- location sent;
- dispatcher message;
- pickup or delivery instruction;
- safety checklist requirement;
- shift assignment or change.

Channels may include in-app, push, email, SMS and WhatsApp.

---

### 11. Audit Logging

Audit these events:

- login and logout;
- failed authentication;
- profile changes;
- load create, update, activate and cancel;
- status changes;
- assignments and swaps;
- planning board moves;
- overrides;
- GPS destinations sent;
- messages;
- file uploads;
- reports and exports;
- driver changes;
- shift assignments;
- session revocation.

Each audit record must include:

- event ID;
- tenant and branch;
- module and action;
- actor and role;
- target entity;
- before and after values where applicable;
- reason;
- IP and user agent;
- timestamp;
- correlation ID;
- source application.

Normal users cannot alter audit records.

---

### 12. Suggested Data Model

Core entities:

- Tenant
- Company
- Branch
- User
- Role
- Permission
- Customer
- Customer Contact
- Customer Location
- Load
- Load Stop
- Load Item
- Load Assignment
- Load Status History
- Load Note
- Load Document
- Load Photo
- Delivery Issue
- Driver
- Driver Licence
- Driver Document
- Driver Certification
- Driver Availability
- Driver Shift
- Driver Activity
- Vehicle
- Trailer
- Compliance Document
- Maintenance Record
- GPS Device
- GPS Position
- Geofence
- Geofence Event
- Route Event
- Conversation
- Message
- Message Attachment
- Warehouse
- Inventory Item
- Warehouse Task
- Workforce Member
- Unavailability
- Report Definition
- Report Schedule
- Notification
- Audit Log

Key relationships:

- Company has many branches.
- Branch has many loads, drivers, vehicles, trailers and warehouses.
- Load has many stops and items.
- Load has assignment and status history.
- Driver has shifts, documents and activity.
- Vehicle and trailer have compliance and maintenance records.
- GPS positions may link to driver, vehicle, load and device.
- Warehouse tasks may link to loads and stops.

---

### 13. API Requirements

Suggested API groups:

- `/api/dispatcher/dashboard`
- `/api/loads`
- `/api/loads/:id`
- `/api/loads/:id/stops`
- `/api/loads/:id/items`
- `/api/loads/:id/assignments`
- `/api/loads/:id/status`
- `/api/loads/:id/photos`
- `/api/loads/:id/documents`
- `/api/loads/:id/notes`
- `/api/planning-board`
- `/api/planning-board/optimise`
- `/api/gps/positions`
- `/api/gps/history`
- `/api/gps/send-location`
- `/api/drivers`
- `/api/drivers/:id`
- `/api/vehicles`
- `/api/trailers`
- `/api/customers`
- `/api/warehouses`
- `/api/workforce`
- `/api/workforce/shifts`
- `/api/messages`
- `/api/reports`
- `/api/profile`
- `/api/audit`

API standards:

- secure authentication;
- tenant and branch validation;
- permission enforcement;
- request schema validation;
- pagination, filtering and sorting;
- idempotency for create/activate actions;
- optimistic concurrency;
- standard error format;
- correlation IDs;
- audit hooks;
- rate limiting;
- secure file uploads.

---

### 14. Integrations

Potential integrations:

- GPS / telematics;
- map and geocoding;
- traffic;
- weather;
- SMS;
- email;
- WhatsApp Business;
- push notification;
- identity provider;
- document storage;
- malware scanning;
- registration or VIN lookup;
- accounting or payroll read access where authorised.

Integration failure must not silently discard data. The system must show actionable status, safely retry where possible and log all failures without exposing secrets.

---

### 15. Security Requirements

#### Authentication

- secure login;
- strong password policy;
- 2FA;
- session expiry;
- refresh-token rotation where JWT is used;
- session and device management;
- brute-force protection;
- login audit.

#### Authorisation

- server-side RBAC;
- tenant isolation;
- branch scoping;
- object-level access checks;
- action-level permissions;
- export permissions;
- sensitive-field masking.

#### Data Protection

- TLS in transit;
- encryption at rest;
- secret management;
- protected file URLs;
- malware scanning;
- secure backups;
- configurable retention;
- no plaintext passwords;
- bank and tax data encrypted and masked.

#### Application Security

- input validation;
- output encoding;
- CSRF protection where applicable;
- XSS and injection protection;
- secure headers;
- file validation;
- dependency scanning;
- audit monitoring.

---

### 16. Non-Functional Requirements

#### Performance

- dashboard initial load under 3 seconds;
- common filters under 2 seconds;
- load detail under 2 seconds;
- planning board under 4 seconds for normal branch volume;
- message acknowledgement under 2 seconds;
- GPS freshness within provider interval;
- large exports processed asynchronously.

#### Availability

- 99.9% monthly target;
- graceful degradation for GPS or messaging outage;
- health monitoring and alerts;
- backup and recovery procedures.

#### Scalability

Support multiple companies and branches, thousands of daily loads, hundreds of active drivers, high-frequency GPS events and concurrent dispatchers.

#### Accessibility

- keyboard navigation;
- visible focus;
- semantic labels;
- sufficient contrast;
- status not represented by colour only;
- accessible form errors.

#### Responsiveness

Desktop and tablet are mandatory. Mobile browser must support essential monitoring and messaging. Complex planning may use a mobile-optimised view.

#### Browser Support

Latest stable Chrome, Edge, Safari and Firefox.

---

### 17. UX Requirements

1. Keep primary dispatch actions visible.
2. Use consistent status labels.
3. Distinguish warnings from hard blocks.
4. Preserve filters when navigating back.
5. Confirm destructive actions.
6. Use drawers/modals for quick actions.
7. Use full pages for complex creation and planning.
8. Show exact assignment failure reasons.
9. Warn about unsaved changes.
10. Provide loading, empty and error states.
11. Show timezone for schedules.
12. Keep branch context visible.

---

### 18. Error Handling

Standard API error example:

```json
{
  "success": false,
  "code": "RESOURCE_CONFLICT",
  "message": "The selected driver already has an overlapping assignment.",
  "details": {
    "driverId": "DRV-0021",
    "conflictingLoadId": "LD-10583"
  },
  "correlationId": "COR-..."
}
```

Errors must explain the problem, show resolution steps, preserve form data, avoid exposing stack traces and provide safe retry actions.

---

### 19. Reporting Definitions

##### On-Time Delivery

A completed load is on time when delivery occurs on or before the approved delivery deadline, including authorised revisions.

##### Delayed Load

A load is delayed when ETA exceeds threshold, a milestone deadline is missed, a dispatcher or driver reports delay, or an exception rule is triggered.

##### Available Driver

A driver is available only when active, compliant, not on leave, within working-hour rules, not assigned to conflicting work and branch compatible.

##### Available Asset

A truck or trailer is available only when active, compliant, not assigned, not under maintenance, not out of service and operationally compatible.

---

### 20. Release Plan

#### Phase 1 — Core Dispatch

- authentication and RBAC;
- dashboard;
- create load;
- all and active loads;
- driver list;
- vehicle/trailer list;
- manual planning board;
- messages;
- profile;
- audit logs.

#### Phase 2 — Real-Time Operations

- live GPS;
- history;
- geofences;
- send location;
- ETA and delay alerts;
- driver confirmations;
- proof photo workflow.

#### Phase 3 — Workforce and Warehouse

- workforce scheduling;
- shift assignment;
- leave and unavailability;
- yard/warehouse visibility;
- linked warehouse tasks;
- customer enhancements.

#### Phase 4 — Optimisation and AI

- planning optimiser;
- AI Loads / Inbox;
- suggested drivers;
- delay prediction;
- utilisation insights;
- scheduled and custom reports.

---

### 21. Out of Scope for Initial Dispatcher Release

Unless separately approved:

- subscription management;
- full finance dashboard;
- payroll processing;
- pricing administration;
- tenant creation;
- role editing;
- company settings;
- accounting reconciliation;
- unrestricted HR data;
- AI auto-dispatch without human approval.

---

### 22. QA Coverage

#### Functional QA

- load create, draft and activation;
- stops and item mapping;
- photo upload;
- driver/truck/trailer assignment;
- conflicts;
- status transitions;
- planning drag and drop;
- GPS;
- location sending;
- messaging;
- shifts;
- filters;
- exports;
- profile updates.

#### Permission QA

Test allowed and denied actions, wrong branch, wrong tenant, direct API requests, hidden controls, exports and sensitive fields.

#### Negative QA

- duplicate reference;
- missing route;
- unmapped item;
- expired licence;
- driver on leave;
- vehicle maintenance;
- overlapping assignment;
- invalid file;
- stale record update;
- GPS outage;
- messaging failure;
- invalid transfer.

#### Security QA

- authentication bypass;
- cross-tenant or cross-branch access;
- IDOR;
- injection;
- XSS;
- malicious uploads;
- token replay;
- privilege escalation;
- sensitive data leakage.

---

### 23. UAT Scenarios

#### UAT-01 — Create Standard Load

Given an authorised dispatcher, when valid customer, route, item and assignment data are entered, then the load activates and the driver is notified.

#### UAT-02 — Block Expired Driver

Given a driver with expired mandatory licence, when assignment is attempted, then the system blocks it and displays the expiry reason.

#### UAT-03 — Planning Conflict

Given an overlapping driver assignment, when another load is dragged into the same time, then the board rejects it and identifies the conflicting load.

#### UAT-04 — Required Photos

Given delivery photos are mandatory, when completion is attempted without them, then completion is blocked.

#### UAT-05 — Delayed Load

Given ETA exceeds the threshold, when GPS updates, then the load becomes delayed and an alert appears.

#### UAT-06 — Send Location

Given an active driver, when the dispatcher sends a destination requiring confirmation, then delivery and confirmation states are shown.

#### UAT-07 — Branch Restriction

Given Sydney-only access, when a Melbourne-only load is requested directly, then access is denied.

#### UAT-08 — Shift Conflict

Given a worker has an overlapping shift, when another is assigned, then the assignment is blocked.

#### UAT-09 — Load Transfer

Given transfer permission, when a load is transferred to an eligible branch, then ownership updates and full history remains.

#### UAT-10 — Export

Given active filters, when loads are exported, then only authorised filtered records are included.

---

### 24. Definition of Done

A feature is complete only when:

- requirements are implemented;
- server-side permissions exist;
- validation is enforced;
- audit events are recorded;
- loading, empty and error states exist;
- responsive and accessible behaviour is complete;
- automated tests pass;
- security review passes;
- QA and UAT pass;
- API and user documentation are updated;
- monitoring and logs are available;
- no critical or high defects remain.

---

### 25. Open Product Decisions

1. Which load types are enabled at launch?
2. Can dispatchers create or edit drivers?
3. Can dispatchers view payroll information?
4. Which rules are hard blocks versus warnings?
5. Who can approve overrides?
6. Which GPS provider will be used?
7. What GPS update interval is required?
8. Is WhatsApp required?
9. Which photos are mandatory by load type?
10. Is AI Load Inbox in the first release?
11. Can dispatchers create customers?
12. Are cross-branch transfers allowed?
13. What GPS retention period applies?
14. Which reports can dispatchers schedule?
15. Is optimisation rules-based, AI-based or hybrid?
16. Is fatigue management required at launch?
17. Which compliance standards and policies apply?
18. Is offline driver-app operation required?
19. Which fields vary by load type?
20. What is the official timezone strategy?

---

### 26. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Incorrect assignment | Safety and operational failure | Hard validation and audit |
| Stale GPS shown as live | Wrong decisions | Freshness status and warnings |
| Cross-branch leakage | Security breach | Server-side scope checks |
| Concurrent planning edits | Conflicting assignments | Optimistic locking |
| AI extraction error | Incorrect load | Human review and validation |
| Payroll exposure | Privacy breach | Permissions and masking |
| GPS data volume | Cost and performance | Retention and aggregation |
| Missing proof photos | Dispute risk | Milestone blocking |
| Integration outage | Dispatch interruption | Retry and fallback |
| Unclear statuses | Operational confusion | Server-side state machine |

---

### 27. Suggested Dispatcher Permission Matrix

| Module / Action | Default |
|---|---|
| Dashboard View | Allow |
| Create Load | Allow |
| Edit Draft Load | Allow |
| Activate Load | Allow |
| Cancel Load | Conditional |
| Transfer Load | Conditional |
| Assign Driver | Allow |
| Assign Truck / Trailer | Allow |
| Override Compliance | Deny |
| View GPS | Allow |
| View GPS History | Conditional |
| Send Location | Allow |
| View Drivers | Allow |
| Create Driver | Conditional |
| Edit Driver | Conditional |
| View Driver Payroll | Deny |
| View Vehicles / Trailers | Allow |
| Edit Vehicle | Conditional |
| View Customers | Allow |
| Create Customer | Conditional |
| View Warehouse | Allow |
| Adjust Inventory | Deny |
| View Workforce | Allow |
| Assign Shift | Allow |
| Approve Leave | Deny |
| Send Messages | Allow |
| Export Operational Reports | Allow |
| View Financial Reports | Deny |
| Edit Own Profile | Allow |
| Manage Roles | Deny |
| Manage Company Settings | Deny |

---

### 28. Sample Validation Messages

- Pickup location is required.
- At least one drop-off stop is required.
- Item 3 does not have a pickup stop.
- Item 3 does not have a drop-off stop.
- Driver licence expired on 21 July 2026.
- Driver is unavailable during the selected time.
- Driver has a conflicting assignment: LD-10578.
- Truck T405 is currently in maintenance.
- Trailer TR-02 capacity is insufficient.
- Required pickup photos are missing.
- The selected driver is not certified for dangerous goods.
- You do not have access to the selected branch.
- This load was updated by another dispatcher. Refresh before saving.

---

### 29. Sign-Off

| Stakeholder | Name | Status | Date |
|---|---|---|---|
| Product Owner |  | Pending |  |
| Operations Lead |  | Pending |  |
| Dispatch Lead |  | Pending |  |
| Technical Lead |  | Pending |  |
| Security Reviewer |  | Pending |  |
| QA Lead |  | Pending |  |
| Client Representative |  | Pending |  |

---


---

## Part 6 — Warehouse Portal Detailed PRD

**Source classification:** Authoritative Warehouse Portal PRD; exact duplicate file copies were removed.

### Hero Logistics — Warehouse Portal Product Requirements Document (PRD)

**Document Version:** 1.0  
**Product Area:** Warehouse & Yard Operations  
**Portal:** Warehouse Portal  
**Primary Roles:** Warehouse Manager, Warehouse Supervisor, Warehouse Staff, Yard Staff, Forklift Operator  
**Prepared Date:** 05 August 2026  
**Document Status:** Ready for Product, Design, Development, QA and UAT  
**Default Timezone:** Australia/Sydney unless overridden by depot configuration

---

#### 1. Document Purpose

This Product Requirements Document defines the functional, operational, security and technical requirements for the **Hero Logistics Warehouse Portal**.

The portal will provide a central operational workspace for receiving stock, locating items, moving and transferring inventory, staging items, managing load lanes, preparing dispatches, tracking warehouse and yard capacity, printing labels and documents, scanning QR/barcodes, communicating with teams and reviewing warehouse performance.

The supplied screens contain sample names, dates, locations, counts, loads, vehicles, inventory values and statuses. These are illustrative and must be replaced with live tenant and depot data.

---

#### 2. Product Vision

Create a real-time warehouse and yard operating system that gives every authorised worker a reliable view of **what arrived, where it is, where it must move, what is staged, what is dispatch-ready and who performed every action**.

The system must reduce inventory location errors, shorten dock-to-dispatch time, improve yard utilisation, strengthen Chain of Responsibility evidence and maintain a complete audit trail for every item movement.

---

#### 3. Product Goals

1. Record inbound receipts accurately and quickly.
2. Make every stock item searchable by identifier, location, customer or load.
3. Prevent invalid, unsafe or unauthorised inventory movements.
4. Support configurable depot, warehouse, zone, row, bay, position and staging hierarchies.
5. Provide real-time staging and load-lane visibility.
6. Ensure only verified and complete loads are marked dispatch-ready.
7. Support barcode, QR and VIN-based workflows.
8. Provide reliable label and document printing.
9. Maintain immutable stock-movement history.
10. Support mobile, tablet and forklift-terminal usage.
11. Provide offline-safe receiving and scanning workflows where required.
12. Improve warehouse throughput, utilisation, accuracy and dwell time.

---

#### 4. Success Metrics

| Metric | Target |
|---|---:|
| Inventory location accuracy | 99.5% or higher |
| Inbound receiving accuracy | 99.5% or higher |
| Standard item lookup response | Under 2 seconds |
| Scan-to-item-result time | Under 1 second after decode |
| Dock-to-receipt completion | Configurable operational target |
| Stock-movement audit coverage | 100% |
| Invalid location moves blocked | 100% |
| Dispatch without mandatory checks | 0 |
| Duplicate VIN/barcode active records | 0 unless explicitly permitted |
| Portal monthly availability | 99.9% |
| Label print acknowledgement | Under 3 seconds on online printer |
| Cross-depot unauthorised access | 0 |

---

#### 5. User Roles

##### 5.1 Warehouse Manager

May supervise depot operations, receive stock, create moves, manage load lanes and staging areas, review dispatch readiness, view reports, manage authorised staff actions and handle exceptions.

##### 5.2 Warehouse Supervisor

May perform operational management within assigned warehouses, zones and shifts, with limited configuration rights.

##### 5.3 Warehouse Staff

May receive, scan, locate, stage, move and dispatch items according to assigned permissions.

##### 5.4 Yard Staff

May manage vehicle, container, trailer and equipment movements within yard locations.

##### 5.5 Forklift Operator

May receive movement tasks, scan items, confirm moves and report failures or damage.

##### 5.6 Read-Only Operations User

May view stock, locations, load lanes, reports and history without changing records.

---

#### 6. Access and Scope Principles

1. Users are tenant-scoped and depot/warehouse-scoped.
2. Access to another depot or branch requires explicit permission.
3. The backend must enforce permissions independently of frontend visibility.
4. Sensitive commercial, employee and customer fields must be masked when not operationally required.
5. Dangerous goods and restricted storage areas require additional permissions.
6. Inventory adjustments, cancellations and movement overrides require elevated permission.
7. All exports must respect the same access rules as on-screen data.

##### 6.1 Suggested Permission Keys

- `warehouse.dashboard.view`
- `warehouse.stock.find`
- `warehouse.inbound.create`
- `warehouse.inbound.edit`
- `warehouse.inbound.receive`
- `warehouse.movement.create`
- `warehouse.transfer.create`
- `warehouse.lane.view`
- `warehouse.lane.manage`
- `warehouse.dispatch.view`
- `warehouse.dispatch.confirm`
- `warehouse.staging.view`
- `warehouse.staging.manage`
- `warehouse.history.view`
- `warehouse.message.send`
- `warehouse.shift.view`
- `warehouse.map.view`
- `warehouse.report.view`
- `warehouse.report.export`
- `warehouse.label.print`
- `warehouse.document.print`
- `warehouse.scanner.use`
- `warehouse.import.execute`
- `warehouse.export.execute`
- `warehouse.batch_print.manage`
- `warehouse.profile.edit`
- `warehouse.override.location`
- `warehouse.override.dispatch`

---

#### 7. Portal Navigation

1. Dashboard
2. Find Stock
3. Receive (Inbound)
4. Move / Transfer
5. Load Lanes
6. Dispatch Ready
7. Stage (Holding Areas)
8. Movement History
9. Messages
10. My Shift
11. Warehouse & Yard Map
12. Reports & Analytics
13. Tools
    - Labels & Barcodes
    - Print Documents
    - QR Scanner
    - Import / Export
    - Batch Printing
14. Profile

##### 7.1 Shared Header

- company logo;
- portal title;
- logged-in user;
- role;
- notification count;
- unread message count;
- quick search;
- keyboard shortcut `Ctrl + K` / `Cmd + K`;
- current depot/warehouse context;
- online/offline state;
- last sync time;
- profile and logout menu.

---

### 8. Functional Requirements

#### 8.1 Warehouse Dashboard

##### 8.1.1 Purpose

Provide a real-time operational overview of inbound activity, yard stock, move tasks, load-lane progress, dispatch-ready loads, capacity, recent movements and alerts.

##### 8.1.2 KPI Cards

- Inbound — Awaiting Receive
- In Yard — Vehicles / Items
- To Move — Transfer Tasks
- Load Lanes — Loads in Progress
- Dispatch Ready
- Yard Capacity
- Available Capacity
- Optional damaged/on-hold items

Each KPI must support:

- current count;
- click-through;
- current depot filter;
- last refresh time;
- loading and error state.

##### 8.1.3 Dashboard Search

Search must support:

- receipt number;
- load number;
- load lane;
- VIN;
- registration number;
- barcode;
- SKU;
- container number;
- customer reference;
- warehouse location.

##### 8.1.4 Dashboard Sections

- Inbound Today
- Load Lanes Overview
- Recent Movements
- Quick Actions
- Yard Capacity
- Notifications

##### 8.1.5 Requirements

| ID | Requirement | Priority |
|---|---|---|
| WH-DASH-001 | Dashboard must show real-time depot-scoped operational KPIs. | Must |
| WH-DASH-002 | KPI cards must open filtered target pages. | Should |
| WH-DASH-003 | Dashboard must display last sync and connectivity status. | Must |
| WH-DASH-004 | Dashboard search must support all core identifiers. | Must |
| WH-DASH-005 | Recent movements must show item, action, location and time. | Must |
| WH-DASH-006 | Capacity utilisation must be visible by yard or warehouse. | Must |
| WH-DASH-007 | Dashboard must support tablet and forklift-terminal layouts. | Must |

##### 8.1.6 Acceptance Criteria

- A warehouse user can see current inbound, movement, staging and dispatch counts.
- Selecting a KPI opens the correct filtered page.
- Last sync and online/offline state are visible.
- Users cannot see data from unauthorised depots.

---

#### 8.2 Find Stock

##### 8.2.1 Purpose

Allow users to locate any authorised item, vehicle, pallet, container, freight item or equipment record.

##### 8.2.2 Search Identifiers

- VIN
- Registration / Plate
- Barcode
- QR Code
- SKU
- Item Number
- Load Number
- Job Number
- Receipt Number
- Customer Reference
- Container Number
- Description

##### 8.2.3 Filters

- Item Type
- Location
- Status
- Load / Job
- Customer
- Date Range
- Zone
- Row
- Bay
- Position
- Staging Area
- Load Lane
- Condition
- Depot / Warehouse

##### 8.2.4 Results Columns

- item / description;
- identifiers;
- item type;
- location;
- status;
- load/job;
- customer;
- updated time;
- action.

##### 8.2.5 Item Detail Panel

- item name;
- identifier;
- item type;
- status;
- current location;
- load/job;
- customer;
- received date;
- condition;
- notes;
- photos;
- documents;
- move/transfer action;
- view load;
- item history.

##### 8.2.6 Requirements

| ID | Requirement | Priority |
|---|---|---|
| WH-STOCK-001 | Users can search by all supported identifiers. | Must |
| WH-STOCK-002 | Results must display the current confirmed location. | Must |
| WH-STOCK-003 | Item details must show full movement history. | Must |
| WH-STOCK-004 | Search must support combined filters. | Must |
| WH-STOCK-005 | Barcode/QR scan must open the matching item when unique. | Must |
| WH-STOCK-006 | Multiple matches must display a selection list. | Must |
| WH-STOCK-007 | Restricted items and locations must follow permissions. | Must |

---

#### 8.3 Receive (Inbound)

##### 8.3.1 Purpose

Record incoming inventory, confirm condition and assign the first warehouse or yard location.

##### 8.3.2 Main Actions

- Cancel
- Save as Draft
- Receive Items
- Add Item
- Import Items
- Scan Barcode / QR
- Upload CSV
- Attach Documents
- Capture Photos

##### 8.3.3 Section 1 — Inbound Details

Fields:

- inbound type;
- inbound number;
- supplier/from;
- reference/delivery note;
- transport type;
- driver;
- vehicle/trailer;
- date/time;
- branch/depot;
- notes.

Suggested inbound types:

- Purchase / Supplier Delivery
- Customer Delivery
- Inter-Depot Transfer
- Return
- Driver Drop-off
- Port / Container Receipt
- Other configured type

##### 8.3.4 Section 2 — Location

Configurable hierarchy:

**Depot → Warehouse/Yard → Zone → Row → Bay → Position → Staging Area**

Rules:

1. Required hierarchy levels depend on company configuration.
2. Inactive, full, restricted or incompatible locations cannot be selected.
3. Dangerous goods must use compatible authorised locations.
4. Cold-chain goods must use temperature-compatible locations.
5. Location capacity must be checked before confirmation.
6. A human-readable location preview must be displayed.

##### 8.3.5 Section 3 — Item Entry

Entry methods:

- manual entry;
- barcode/QR scan;
- VIN/registration lookup;
- CSV/XLSX upload;
- select from expected inbound list.

Common item fields:

- item type;
- identifier;
- barcode;
- SKU;
- description;
- quantity;
- customer/owner;
- load/job;
- condition;
- weight;
- dimensions;
- notes;
- photos required;
- damage noted.

Vehicle fields:

- VIN;
- registration;
- make;
- model;
- year;
- colour;
- fuel type;
- operable status;
- keys received;
- damage status.

##### 8.3.6 Section 4 — Items to Receive

The item list must support:

- item sequence;
- item type;
- description;
- identifier;
- destination location;
- condition;
- damage;
- edit;
- remove;
- duplicate warning;
- validation state.

##### 8.3.7 Section 5 — Documents and Photos

Supported examples:

- delivery note;
- invoice;
- manifest;
- transfer docket;
- inspection document;
- item-condition photos;
- damage photos.

Requirements:

- PDF, JPG and PNG minimum support;
- configurable size limits;
- malware scanning;
- uploader and timestamp stored;
- photo metadata retained;
- damage photos mandatory when damage is noted.

##### 8.3.8 Receive Checklist

- item count verified;
- condition checked;
- documents verified;
- photos captured;
- location confirmed;
- restricted handling complete where applicable.

##### 8.3.9 Draft vs Receive

**Save as Draft:**

- allows incomplete data;
- does not increase available stock;
- does not create final confirmed locations;
- retains validation warnings.

**Receive Items:**

- validates required fields;
- creates receipt record;
- creates item records or links expected items;
- assigns locations;
- creates movement history;
- updates stock availability;
- triggers notifications;
- generates audit records.

##### 8.3.10 Offline Support

When enabled:

- drafts and scans may be stored in an encrypted local queue;
- offline records must carry device timestamp and temporary ID;
- conflicts must be resolved on sync;
- duplicate receipt protection is mandatory;
- users must see pending, synced and failed states.

##### 8.3.11 Requirements

| ID | Requirement | Priority |
|---|---|---|
| WH-IN-001 | User can save an inbound receipt as draft. | Must |
| WH-IN-002 | User can receive multiple items in one transaction. | Must |
| WH-IN-003 | Location capacity and compatibility must be validated. | Must |
| WH-IN-004 | Duplicate VIN/barcode/SKU rules must be enforced. | Must |
| WH-IN-005 | Damage requires evidence according to company rules. | Must |
| WH-IN-006 | Bulk import must provide row-level validation. | Must |
| WH-IN-007 | Receiving must create immutable movement history. | Must |
| WH-IN-008 | Offline queue support must prevent duplicate finalisation. | Should |
| WH-IN-009 | Every received item must have an authorised initial location. | Must |

---

#### 8.4 Move / Transfer

##### 8.4.1 Purpose

Move items within the same depot or transfer items to another depot, branch or warehouse.

##### 8.4.2 Movement Types

1. Move Within Depot
2. Transfer to Another Depot
3. Stage to Holding Area
4. Move to Load Lane
5. Return to Storage
6. Dispatch / Pickup
7. Quarantine / Hold
8. Damage / Inspection Move

##### 8.4.3 Movement Details

- reference number;
- date/time;
- reason;
- priority;
- notes;
- source depot;
- destination depot where applicable;
- assigned staff/equipment;
- required completion time.

##### 8.4.4 Item Selection

- scan item;
- search identifier;
- import from list;
- select from load;
- select from staging area;
- select from movement task.

##### 8.4.5 Item Movement Fields

- item;
- type;
- from location;
- to location;
- condition;
- quantity;
- handling equipment;
- action.

##### 8.4.6 Movement Validation

The system must validate:

- item exists;
- current location matches source;
- destination exists and is active;
- destination has capacity;
- item-location compatibility;
- item is not locked by another active task;
- restricted-area permission;
- dangerous goods compatibility;
- cold-chain compatibility;
- load or lane relationship;
- cross-depot permission;
- no duplicate item in the same movement.

##### 8.4.7 Internal Move

On completion:

- current location changes;
- movement event is recorded;
- capacity is adjusted;
- linked load/lane is updated;
- notifications are sent when configured.

##### 8.4.8 Inter-Depot Transfer

An inter-depot transfer must create a transfer job with statuses:

- Draft
- Awaiting Approval
- Approved
- In Transit
- Partially Received
- Received
- Cancelled
- Exception

Source stock should move to `In Transit` only after dispatch confirmation. Destination stock becomes available only after receipt confirmation.

##### 8.4.9 Confirmation

Users must confirm item correctness before creating or completing the movement.

##### 8.4.10 Requirements

| ID | Requirement | Priority |
|---|---|---|
| WH-MOVE-001 | User can move one or more items within a depot. | Must |
| WH-MOVE-002 | User can create an authorised inter-depot transfer. | Must |
| WH-MOVE-003 | Source location must match current system location. | Must |
| WH-MOVE-004 | Destination compatibility and capacity must be validated. | Must |
| WH-MOVE-005 | Movement must update capacity and item location atomically. | Must |
| WH-MOVE-006 | Failed partial updates must roll back safely. | Must |
| WH-MOVE-007 | Every movement must create an audit and movement record. | Must |
| WH-MOVE-008 | Cross-depot transfers must support receiving reconciliation. | Must |

---

#### 8.5 Load Lanes

##### 8.5.1 Purpose

Manage staging lanes used to consolidate cargo before dispatch.

##### 8.5.2 Lane Data

- lane ID;
- lane name;
- area;
- depot;
- supported load type;
- capacity;
- occupancy;
- status;
- current load;
- reference;
- truck;
- trailer;
- driver;
- estimated dispatch;
- restrictions;
- notes.

##### 8.5.3 Lane Statuses

- Empty
- Available
- Reserved
- Staging
- In Progress
- Ready to Dispatch
- Hold
- Full
- Restricted
- Maintenance
- Closed

##### 8.5.4 Lane Actions

- create lane;
- view lane;
- reserve lane;
- assign load;
- move items to lane;
- remove items;
- update driver/trailer;
- reorder load priority;
- mark ready;
- place on hold;
- release lane;
- print lane report;
- print labels.

##### 8.5.5 Lane Detail

- current status;
- estimated dispatch;
- staged loads;
- load reference;
- sub-reference;
- driver;
- vehicle/trailer;
- staged cargo;
- verification state;
- seal state;
- exceptions;
- print action.

##### 8.5.6 Lane Rules

1. Lane capacity cannot be exceeded without authorised override.
2. Restricted cargo must use compatible lanes.
3. A lane may be reserved for one or multiple loads depending on configuration.
4. A load cannot be ready until all mandatory items are present.
5. Removed items must receive a new valid location.
6. Lane status must reflect item and load state.
7. Emptying the lane must release capacity.

##### 8.5.7 Requirements

| ID | Requirement | Priority |
|---|---|---|
| WH-LANE-001 | Users can view current lane utilisation and load assignment. | Must |
| WH-LANE-002 | Users can move authorised items into a compatible lane. | Must |
| WH-LANE-003 | Lane capacity must be enforced. | Must |
| WH-LANE-004 | Lane status must update from operational events. | Must |
| WH-LANE-005 | Ready state requires configured verification checks. | Must |
| WH-LANE-006 | Lane actions must be fully audited. | Must |

---

#### 8.6 Dispatch Ready

##### 8.6.1 Purpose

Show staged loads that are ready or nearly ready for driver pickup and departure.

##### 8.6.2 Summary Metrics

- Ready to Dispatch
- Today’s Dispatch
- Awaiting Pickup
- Exceptions
- Hold

##### 8.6.3 Filters

- date;
- status;
- load lane;
- driver;
- trailer/vehicle;
- customer;
- load type;
- depot;
- exception state.

##### 8.6.4 List Columns

- load/reference;
- customer;
- truck/trailer;
- driver;
- load lane;
- ready since;
- status;
- actions.

##### 8.6.5 Dispatch Readiness Checklist

Configurable checks may include:

- all required items staged;
- item count verified;
- item condition accepted;
- load documents complete;
- labels applied;
- load secured;
- photos complete;
- driver assigned;
- truck assigned;
- trailer assigned;
- compliance valid;
- pre-start checklist passed;
- dangerous goods documentation complete;
- seal number recorded;
- hold/exception cleared.

##### 8.6.6 Actions

- view load;
- mark as dispatched;
- print dispatch docket;
- send to driver;
- move to lane;
- place on hold;
- resolve exception;
- export.

##### 8.6.7 Mark as Dispatched

On confirmation:

- dispatch timestamp stored;
- user/device stored;
- load and item statuses updated;
- load lane occupancy updated;
- driver and dispatch system notified;
- movement history created;
- documents generated where configured;
- GPS/route workflow initiated where applicable.

##### 8.6.8 Requirements

| ID | Requirement | Priority |
|---|---|---|
| WH-DIS-001 | Only staged loads may enter dispatch-ready workflow. | Must |
| WH-DIS-002 | Mandatory checks must block dispatch when incomplete. | Must |
| WH-DIS-003 | Holds must display a reason and resolver. | Must |
| WH-DIS-004 | Dispatch confirmation must update all linked items atomically. | Must |
| WH-DIS-005 | Dispatch must create movement and audit records. | Must |
| WH-DIS-006 | Dispatch docket printing must use current verified data. | Must |

---

#### 8.7 Stage / Holding Areas

##### 8.7.1 Purpose

Manage temporary holding areas used before moving items to load lanes or final storage.

##### 8.7.2 Staging Area Data

- area ID;
- name;
- depot;
- zone;
- next load lane;
- status;
- capacity;
- occupancy;
- staged item count;
- awaiting move count;
- oldest item age;
- restrictions;
- active/inactive.

##### 8.7.3 Tabs

- All Staging Areas
- By Zone
- By Load Lane
- Inactive Areas

##### 8.7.4 Actions

- add holding area;
- edit area;
- activate/deactivate;
- view items;
- move items;
- assign to load lane;
- print labels;
- export;
- refresh.

##### 8.7.5 Dwell-Time Rules

- configurable target dwell time;
- warning threshold;
- overdue threshold;
- alert recipients;
- escalation actions.

##### 8.7.6 Requirements

| ID | Requirement | Priority |
|---|---|---|
| WH-STAGE-001 | Users can view staging occupancy and item age. | Must |
| WH-STAGE-002 | Overdue staged items must be highlighted. | Must |
| WH-STAGE-003 | Movement to a lane must validate capacity and load mapping. | Must |
| WH-STAGE-004 | Inactive areas cannot receive new items. | Must |
| WH-STAGE-005 | Staging summary must support occupancy reporting. | Should |

---

#### 8.8 Movement History

##### 8.8.1 Purpose

Provide the complete audit trail of item and stock movement.

##### 8.8.2 Filters

- date range;
- movement type;
- source location;
- destination location;
- item type;
- item/stock;
- load/reference;
- driver/staff;
- movement reason;
- result;
- depot;
- device.

##### 8.8.3 Movement Types

- Receive
- Move Within Depot
- Transfer to Another Depot
- Stage
- Move to Load Lane
- Dispatch / Pickup
- Return / Outbound
- Quarantine
- Adjustment
- Cancelled Movement

##### 8.8.4 Result States

- Draft
- Pending
- In Progress
- Completed
- Failed
- Partially Completed
- Cancelled
- Reversed

##### 8.8.5 Movement Detail

- movement ID;
- date/time;
- item;
- identifiers;
- from location;
- to location;
- load/reference;
- logged by;
- role;
- device;
- reason;
- result;
- before/after state;
- failure reason;
- attachments;
- audit ID.

##### 8.8.6 Requirements

| ID | Requirement | Priority |
|---|---|---|
| WH-HIST-001 | Every confirmed stock movement must appear in history. | Must |
| WH-HIST-002 | History must be searchable and filterable. | Must |
| WH-HIST-003 | Normal users cannot delete or edit movement history. | Must |
| WH-HIST-004 | Failed and reversed movements must remain visible. | Must |
| WH-HIST-005 | Exports must include applied filters and timezone. | Must |
| WH-HIST-006 | Movement details must show actor and source device. | Must |

---

#### 8.9 Messages

##### 8.9.1 Purpose

Enable communication between warehouse teams, dispatch, drivers, branches, maintenance and customers where authorised.

##### 8.9.2 Features

- direct conversations;
- group conversations;
- team conversations;
- announcements;
- unread counts;
- attachments;
- load/item references;
- read receipts;
- online status;
- search;
- mute;
- archive;
- templates;
- scheduled messages;
- broadcast messages.

##### 8.9.3 Warehouse-Specific Message Links

Messages may link to:

- inbound receipt;
- stock item;
- movement task;
- load lane;
- dispatch load;
- safety issue;
- damaged item;
- printer failure.

##### 8.9.4 Requirements

| ID | Requirement | Priority |
|---|---|---|
| WH-MSG-001 | Users can send direct and team messages. | Must |
| WH-MSG-002 | Messages may link to operational records. | Must |
| WH-MSG-003 | Shared files must be access controlled and scanned. | Must |
| WH-MSG-004 | Urgent messages may trigger escalation. | Should |
| WH-MSG-005 | Message history must follow retention policy. | Must |

---

#### 8.10 My Shift

##### 8.10.1 Purpose

Show the logged-in worker’s current shift, assigned tasks, breaks, expected workload and safety obligations.

##### 8.10.2 Data

- shift start/end;
- break duration;
- supervisor;
- depot;
- role;
- assigned zone;
- receiving tasks;
- movement tasks;
- load-lane tasks;
- dispatch tasks;
- safety checklist;
- shift notes;
- completed task count;
- pending task count.

##### 8.10.3 Actions

- clock in/out where enabled;
- start break/end break;
- open task;
- report issue;
- message supervisor;
- complete safety checklist;
- request assistance.

##### 8.10.4 Requirements

| ID | Requirement | Priority |
|---|---|---|
| WH-SHIFT-001 | User can view current and upcoming shift information. | Must |
| WH-SHIFT-002 | Assigned operational tasks must be visible. | Must |
| WH-SHIFT-003 | Shift actions must be permission and policy controlled. | Must |
| WH-SHIFT-004 | Task completion must update operational dashboards. | Must |

---

#### 8.11 Safety Checklist and Defect Reporting

##### 8.11.1 Purpose

Support pre-start and operational safety checks for vehicles, forklifts, trailers and warehouse equipment.

##### 8.11.2 Checklist Response Types

- Yes / Pass
- No / Fail
- N/A
- Not Checked

##### 8.11.3 Features

- checklist progress;
- save draft;
- submit;
- upload photo;
- notes;
- report defect;
- message dispatch/supervisor;
- history;
- sync status;
- reminders.

##### 8.11.4 Safety Rules

1. Required items must be completed.
2. Failed safety items must create a defect or resolution workflow.
3. Equipment may be blocked from use when a critical defect exists.
4. Checklist submissions are immutable; corrections create a new revision.
5. Offline submissions must sync with device and server timestamps.

##### 8.11.5 Requirements

| ID | Requirement | Priority |
|---|---|---|
| WH-SAFE-001 | Required safety checks must be enforced before configured work. | Must |
| WH-SAFE-002 | Failed checks must create or link a defect. | Must |
| WH-SAFE-003 | Critical defects must block affected equipment. | Must |
| WH-SAFE-004 | Photos and notes must be supported. | Must |
| WH-SAFE-005 | Checklist history must be auditable. | Must |

---

#### 8.12 Warehouse & Yard Map

##### 8.12.1 Purpose

Provide an interactive real-time visual representation of warehouse and yard areas.

##### 8.12.2 Map Locations

- receiving area;
- quality inspection;
- staging areas;
- dispatch area;
- cold storage;
- warehouse zones;
- load lanes;
- hazmat storage;
- value storage;
- workshop;
- office;
- vehicle storage;
- container yard;
- equipment parking;
- empty trailer park;
- gates and roads.

##### 8.12.3 Location States

- Available
- In Use
- Staging
- On Hold
- Full
- Empty
- Maintenance
- Restricted

##### 8.12.4 Interactions

Clicking a location should show:

- location name;
- hierarchy;
- capacity;
- occupancy;
- restrictions;
- current items;
- current load;
- open tasks;
- alerts;
- move/create action where authorised.

##### 8.12.5 Requirements

| ID | Requirement | Priority |
|---|---|---|
| WH-MAP-001 | Map must display configured warehouse and yard locations. | Must |
| WH-MAP-002 | Capacity and status must use live operational data. | Must |
| WH-MAP-003 | Users can open location details from the map. | Must |
| WH-MAP-004 | Restricted areas must be clearly identified. | Must |
| WH-MAP-005 | Map must support large-screen and tablet use. | Must |

---

#### 8.13 Reports & Analytics

##### 8.13.1 Categories

- Overview
- Inventory
- Operations
- Productivity
- Dispatch
- Compliance

##### 8.13.2 KPI Examples

- Total Items Handled
- Received
- Dispatched
- Staged
- Average Dwell Time
- Accuracy Rate
- Items Received per Hour
- Items Moved per Hour
- Items Dispatched per Hour
- Staging Time per Item
- Dock-to-Dispatch Time
- Load-Lane Utilisation
- Inventory by Zone
- Damaged Items
- Failed Movements

##### 8.13.3 Report Shortcuts

- Inventory Summary
- Stock Aging
- Movement History
- Load Lane Utilisation
- Receiving Performance
- Dispatch Performance
- Accuracy & Audit
- Damaged Items
- Staging Dwell Time
- Yard Capacity
- Printer Activity
- Safety Compliance

##### 8.13.4 Filters

- date range;
- warehouse;
- zone;
- load lane;
- item type;
- customer;
- load type;
- worker;
- shift;
- movement type;
- status.

##### 8.13.5 Requirements

| ID | Requirement | Priority |
|---|---|---|
| WH-RPT-001 | Users can view authorised warehouse reports. | Should |
| WH-RPT-002 | Reports must respect depot and permission scope. | Must |
| WH-RPT-003 | Exported reports must show filters and generated time. | Must |
| WH-RPT-004 | Metric definitions must be consistent across reports. | Must |
| WH-RPT-005 | Alerts must link to supporting operational data. | Should |

---

#### 8.14 Labels & Barcodes

##### 8.14.1 Supported Label Targets

- Vehicle
- Pallet
- Container
- Item / Freight
- Load
- Location
- Holding Area
- Load Lane
- Custom

##### 8.14.2 Label Types

- VIN Label
- Pallet Label
- QR Code Label
- Container Label
- Load Label
- Location Label
- Holding Area Label
- Load Lane Label
- Custom Label

##### 8.14.3 Label Workflow

1. Select or scan item/location.
2. Select label type.
3. Review preview.
4. Edit permitted layout fields.
5. Select printer.
6. Select size and format.
7. Set copies and cut option.
8. Test print or print.
9. Record print event.

##### 8.14.4 Label Requirements

- unique readable identifier;
- barcode or QR validation;
- configurable templates;
- printer compatibility;
- print preview;
- reprint reason;
- recently printed history;
- batch printing support.

##### 8.14.5 Requirements

| ID | Requirement | Priority |
|---|---|---|
| WH-LBL-001 | Users can generate labels from live master data. | Must |
| WH-LBL-002 | Printed identifier must match selected record. | Must |
| WH-LBL-003 | Printer online state must be visible. | Must |
| WH-LBL-004 | Reprints must be logged. | Must |
| WH-LBL-005 | Label templates must be configurable by authorised admins. | Should |

---

#### 8.15 Print Documents

##### 8.15.1 Document Types

- Outbound Manifest
- Inbound Receipt
- Dispatch Docket
- Transfer Docket
- Put-Away Slip
- Pick List
- Load Lane Report
- Inventory Sheet
- Damage Report
- Safety Checklist
- Custom Template

##### 8.15.2 Document Generator

Fields may include:

- template;
- order/shipment reference;
- carrier;
- destination;
- operator notes;
- item summary;
- date/time;
- depot;
- generated by.

##### 8.15.3 Requirements

| ID | Requirement | Priority |
|---|---|---|
| WH-DOC-001 | Documents must use current verified system data. | Must |
| WH-DOC-002 | Users can preview before printing. | Must |
| WH-DOC-003 | Generated documents must be versioned and auditable. | Must |
| WH-DOC-004 | Templates and layouts require admin permission to edit. | Must |
| WH-DOC-005 | PDF download may be supported according to permission. | Should |

---

#### 8.16 QR / Barcode Scanner

##### 8.16.1 Purpose

Decode item and location identifiers from mobile devices, tablets, forklift terminals or dedicated scanners.

##### 8.16.2 Scan Results

- identifier;
- record type;
- stock state;
- item name/category;
- zone/bin;
- quantity;
- weight;
- dimensions;
- linked load;
- audit trail;
- available actions.

##### 8.16.3 Scan Actions

- view item;
- receive item;
- relocate stock;
- move to lane;
- verify load;
- print label;
- view history;
- report exception.

##### 8.16.4 Requirements

| ID | Requirement | Priority |
|---|---|---|
| WH-SCAN-001 | Scanner must support configured barcode and QR formats. | Must |
| WH-SCAN-002 | Invalid or unknown codes must show a clear error. | Must |
| WH-SCAN-003 | Duplicate matching records must require selection. | Must |
| WH-SCAN-004 | Scan actions must respect permissions. | Must |
| WH-SCAN-005 | Offline scans may queue where offline mode is enabled. | Should |

---

#### 8.17 Import / Export

##### 8.17.1 Import Targets

- Stock Inventory
- New Item Catalogue
- Inbound Items
- Transfer Instructions
- Location Master
- Load-Lane Assignments
- Barcode Master

##### 8.17.2 Import Workflow

1. Select target schema.
2. Download template.
3. Upload CSV/XLSX.
4. Parse file.
5. Show validation preview.
6. Correct mapping if allowed.
7. Confirm import.
8. Show success/failure summary.
9. Download rejected rows.

##### 8.17.3 Export Datasets

- Full Stock Catalogue
- Yard & Dock Occupancy
- Outbound Load-Lane Logs
- Safety Certification Records
- Movement History
- Inbound Receipts
- Dispatch Records
- Staging Inventory

##### 8.17.4 Requirements

| ID | Requirement | Priority |
|---|---|---|
| WH-IMP-001 | Import must provide schema validation. | Must |
| WH-IMP-002 | Invalid rows must not silently import. | Must |
| WH-IMP-003 | Large imports must run safely with progress state. | Must |
| WH-IMP-004 | Import and export events must be audited. | Must |
| WH-IMP-005 | Exports must respect active filters and scope. | Must |

---

#### 8.18 Batch Printing and Printer Management

##### 8.18.1 Print Queue

- job ID;
- job name;
- target printer;
- pages/labels;
- queue status;
- progress;
- action.

##### 8.18.2 Queue Statuses

- Draft
- Queued
- Printing
- Paused
- Completed
- Failed
- Cancelled

##### 8.18.3 Printer Data

- printer name;
- type;
- IP/connection;
- location;
- online state;
- queue length;
- supported sizes;
- last successful print;
- error.

##### 8.18.4 Actions

- pause spooler;
- resume spooler;
- clear completed;
- retry failed;
- cancel job;
- reassign printer;
- test print.

##### 8.18.5 Requirements

| ID | Requirement | Priority |
|---|---|---|
| WH-PRINT-001 | Users can view print queue status. | Must |
| WH-PRINT-002 | Failed jobs must show actionable errors. | Must |
| WH-PRINT-003 | Retrying a job must not create uncontrolled duplicates. | Must |
| WH-PRINT-004 | Print events and reprints must be logged. | Must |
| WH-PRINT-005 | Printer access must be limited by depot/network configuration. | Must |

---

#### 8.19 Profile

##### 8.19.1 Profile Data

- employee identity;
- role;
- shift state;
- employee ID;
- contact details;
- department;
- depot;
- reporting manager;
- joining date;
- preferences;
- address;
- emergency contact;
- documents and certifications;
- skills and competencies;
- permissions;
- account security.

##### 8.19.2 Security

- change password;
- two-factor authentication;
- active sessions;
- revoke session;
- logout all devices.

##### 8.19.3 Requirements

| ID | Requirement | Priority |
|---|---|---|
| WH-PRO-001 | User can view their profile and permissions. | Must |
| WH-PRO-002 | User can edit permitted contact and preference fields. | Must |
| WH-PRO-003 | Certification expiry must be visible. | Must |
| WH-PRO-004 | Active sessions can be viewed and revoked. | Must |
| WH-PRO-005 | Permission changes are read-only in the profile. | Must |

---

### 9. End-to-End Workflows

#### 9.1 Inbound Receiving Workflow

1. User opens Receive.
2. Selects inbound type and supplier/source.
3. Enters reference and transport details.
4. Selects receiving depot and location.
5. Scans, imports or manually adds items.
6. Records condition and damage.
7. Attaches documents and photos.
8. Completes checklist.
9. Saves draft or confirms receipt.
10. System creates receipt, item/location records and movement history.
11. Dashboard and stock search update.
12. Relevant teams are notified.

#### 9.2 Move Within Depot

1. User selects movement type.
2. Selects or scans items.
3. System confirms current locations.
4. User selects destination locations.
5. System validates capacity and compatibility.
6. User confirms movement.
7. System updates item locations and location capacity atomically.
8. Movement history and audit are created.

#### 9.3 Inter-Depot Transfer

1. Source user creates transfer.
2. Items are selected and destination depot assigned.
3. Approval occurs if required.
4. Items move to dispatch staging.
5. Source confirms dispatch.
6. Items become In Transit.
7. Destination receives transfer.
8. Destination reconciles expected and actual items.
9. Exceptions are recorded.
10. Transfer closes after complete receipt.

#### 9.4 Stage to Load Lane

1. User opens staged item or load.
2. Selects assigned load lane.
3. System validates lane and capacity.
4. User scans and moves items.
5. Lane progress updates.
6. Missing, extra or damaged item exceptions are shown.
7. When all checks pass, lane/load may be marked ready.

#### 9.5 Dispatch Workflow

1. Load appears in Dispatch Ready.
2. System verifies checklist.
3. Warehouse user confirms item count, documents and securement.
4. Driver arrival is recorded.
5. Required safety checklist is verified.
6. User marks load as dispatched.
7. Item and load statuses change.
8. Lane capacity is released.
9. Dispatch documents and movement history are generated.
10. Driver and dispatcher are notified.

#### 9.6 Damage Workflow

1. Damage is identified during receiving or movement.
2. User marks damage and adds photos/notes.
3. System creates exception/defect record.
4. Item may move to hold or inspection location.
5. Supervisor reviews.
6. Disposition is recorded: accepted, repaired, returned, quarantined or written off.
7. History remains linked to item and movement.

---

### 10. Status Models

#### 10.1 Item Status

- Expected
- Receiving
- Received
- In Storage
- To Move
- Moving
- Staged
- Ready
- On Hold
- Damaged
- Quarantined
- In Transit
- Dispatched
- Returned
- Cancelled
- Archived

#### 10.2 Receipt Status

- Draft
- Pending
- Receiving
- Partially Received
- Received
- Exception
- Cancelled

#### 10.3 Movement Status

- Draft
- Pending
- Assigned
- In Progress
- Partially Completed
- Completed
- Failed
- Cancelled
- Reversed

#### 10.4 Lane Status

- Empty
- Available
- Reserved
- Staging
- In Progress
- Ready to Dispatch
- Hold
- Full
- Restricted
- Maintenance
- Closed

#### 10.5 Dispatch Status

- Staging
- Verification Required
- Ready
- Awaiting Pickup
- Hold
- Dispatched
- Exception
- Cancelled

---

### 11. Core Business Rules

1. An item must have only one active current location.
2. A confirmed move must update item and location capacity in one transaction.
3. A destination cannot exceed capacity without authorised override.
4. Restricted goods must use compatible locations.
5. Dangerous goods cannot be staged in standard lanes unless explicitly allowed.
6. Damaged or quarantined items cannot become dispatch-ready without resolution.
7. Required documents and checks must block dispatch when incomplete.
8. Duplicate VINs, barcodes and container identifiers must follow company rules.
9. Confirmed history cannot be deleted by operational users.
10. Cross-depot actions require source and destination permissions.
11. Reversal must create a new movement; it must not erase the original movement.
12. Every manual override requires user, permission, reason and timestamp.
13. All timestamps are stored in UTC and displayed in local depot time.
14. Printed documents and labels must use the latest confirmed record version.

---

### 12. Notifications and Alerts

#### 12.1 Operational Alerts

- inbound arrival due;
- receiving overdue;
- item location conflict;
- duplicate item detected;
- movement task assigned;
- movement failed;
- staging dwell exceeded;
- load lane near capacity;
- load lane full;
- dispatch pickup due;
- driver not arrived;
- dispatch checklist incomplete;
- damaged item;
- restricted-location violation;
- printer offline;
- import failure;
- sync failure;
- safety checklist failed.

#### 12.2 Channels

- in-app;
- push;
- email;
- SMS;
- team message;
- supervisor escalation.

---

### 13. Audit Requirements

Audit events must include:

- login/logout;
- receipt create/update/finalise;
- item create/update;
- condition/damage change;
- movement create/start/complete/fail/cancel/reverse;
- location override;
- load-lane assignment;
- readiness confirmation;
- dispatch confirmation;
- safety checklist submission;
- label print/reprint;
- document generation/print;
- import/export;
- message send;
- profile/security change.

Each event must store:

- event ID;
- tenant;
- depot/warehouse;
- actor ID and role;
- entity type and ID;
- action;
- before/after values when appropriate;
- reason;
- timestamp;
- IP/device;
- correlation ID;
- source application.

---

### 14. Suggested Data Model

#### 14.1 Core Entities

- Tenant
- Company
- Branch
- Depot
- Warehouse
- WarehouseLocation
- Zone
- Row
- Bay
- Position
- StagingArea
- LoadLane
- User
- Role
- Permission
- Shift
- Item
- ItemIdentifier
- ItemCondition
- ItemPhoto
- ItemDocument
- Receipt
- ReceiptItem
- Movement
- MovementItem
- Transfer
- TransferItem
- Load
- LoadItem
- DispatchReadiness
- DispatchChecklist
- SafetyChecklist
- SafetyChecklistItem
- Defect
- Message
- Conversation
- LabelTemplate
- PrintJob
- Printer
- ImportJob
- ExportJob
- Notification
- AuditLog

#### 14.2 Key Relationships

- Depot has many warehouses, zones, staging areas and load lanes.
- Item has one current active location and many historical movements.
- Receipt has many receipt items.
- Movement has many movement items.
- Transfer links source and destination depots.
- Load has many items and may use one or more load lanes.
- Print jobs target a printer and one or more records.
- Safety defects may block equipment, items or dispatch.

---

### 15. API Requirements

Suggested API groups:

- `/api/warehouse/dashboard`
- `/api/warehouse/items`
- `/api/warehouse/items/:id`
- `/api/warehouse/items/:id/history`
- `/api/warehouse/receipts`
- `/api/warehouse/receipts/:id/receive`
- `/api/warehouse/movements`
- `/api/warehouse/transfers`
- `/api/warehouse/load-lanes`
- `/api/warehouse/staging-areas`
- `/api/warehouse/dispatch-ready`
- `/api/warehouse/dispatch/:id/confirm`
- `/api/warehouse/locations`
- `/api/warehouse/map`
- `/api/warehouse/scanner/decode`
- `/api/warehouse/labels`
- `/api/warehouse/documents`
- `/api/warehouse/print-jobs`
- `/api/warehouse/printers`
- `/api/warehouse/imports`
- `/api/warehouse/exports`
- `/api/warehouse/reports`
- `/api/warehouse/safety-checklists`
- `/api/warehouse/messages`
- `/api/profile`
- `/api/audit`

API requirements:

- secure authentication;
- tenant and depot checks;
- RBAC;
- validation;
- idempotency for receive, movement and dispatch operations;
- optimistic concurrency;
- pagination/filter/sort;
- transaction safety;
- standard errors;
- correlation IDs;
- audit hooks;
- secure file upload;
- rate limiting.

---

### 16. Integrations

Potential integrations:

- transport management system;
- dispatch portal;
- driver app;
- barcode/QR scanners;
- local thermal printers;
- network laser printers;
- document storage;
- virus scanning;
- VIN/registration lookup;
- GPS/telematics;
- email/SMS/push;
- accounting/ERP where required;
- label rendering service;
- identity provider.

Integration failures must show actionable status and must not silently lose operational records.

---

### 17. Security Requirements

#### 17.1 Authentication

- strong password rules;
- optional/required 2FA;
- secure session expiry;
- device/session management;
- brute-force protection;
- audit logging.

#### 17.2 Authorisation

- server-side RBAC;
- tenant isolation;
- depot/warehouse scope;
- restricted-zone permission;
- object-level access checks;
- export and printing permissions.

#### 17.3 Data Protection

- TLS in transit;
- encryption at rest;
- secure secrets;
- protected attachments;
- malware scanning;
- data retention;
- backup and restore;
- PII minimisation.

#### 17.4 Offline Security

- encrypted local storage;
- automatic expiry;
- logout wipe;
- device registration where required;
- conflict-safe sync;
- no sensitive unencrypted cache.

---

### 18. Non-Functional Requirements

#### 18.1 Performance

- common search under 2 seconds;
- scan result under 1 second after decode;
- movement confirmation under 2 seconds;
- dashboard load under 3 seconds;
- map load under 4 seconds;
- large exports processed asynchronously;
- print queue state updates near real time.

#### 18.2 Availability

- 99.9% monthly target;
- graceful degradation for printer/scanner integrations;
- retry-safe operations;
- health monitoring;
- backups and disaster recovery.

#### 18.3 Scalability

Support:

- multi-tenant companies;
- multiple depots;
- thousands of locations;
- millions of movement records;
- high scan frequency;
- concurrent mobile devices;
- large attachment storage;
- multiple print queues.

#### 18.4 Device Support

- desktop;
- standard tablet;
- rugged tablet;
- forklift terminal;
- mobile scanner browser;
- dedicated scanner integration where available.

#### 18.5 Accessibility

- keyboard navigation;
- visible focus;
- accessible labels;
- high contrast;
- status not based only on colour;
- large touch targets;
- screen-reader-friendly forms.

---

### 19. UX Requirements

1. Prioritise scan-first workflows.
2. Keep key actions visible on tablet and mobile.
3. Show exact current location prominently.
4. Distinguish warning, hold and hard-block states.
5. Preserve form entries after validation errors.
6. Provide clear offline, pending-sync and failed-sync states.
7. Use confirmation for dispatch, cancellation and reversal.
8. Display the depot timezone.
9. Use human-readable location breadcrumbs.
10. Prevent double submission.
11. Show item counts and progress continuously.
12. Support camera capture directly from mobile devices.

---

### 20. Error Handling

Example:

```json
{
  "success": false,
  "code": "LOCATION_CAPACITY_EXCEEDED",
  "message": "Zone B / Row 2 / Bay 05 does not have enough available capacity.",
  "details": {
    "locationId": "LOC-B-R2-B05",
    "availableCapacity": 2,
    "requestedItems": 3
  },
  "correlationId": "COR-..."
}
```

User-facing errors must:

- explain the issue;
- provide the resolution where possible;
- preserve entered data;
- avoid stack traces;
- support safe retry;
- show row-level import errors.

---

### 21. Metric Definitions

#### 21.1 Inventory Accuracy

Percentage of audited item records whose system location and quantity match the physical result.

#### 21.2 Dwell Time

Time from entry into a staging or holding location until movement out of that location.

#### 21.3 Dock-to-Dispatch Time

Time from receipt/check-in at the depot to confirmed dispatch.

#### 21.4 Lane Utilisation

Occupied lane capacity divided by configured lane capacity for the selected period.

#### 21.5 Receiving Accuracy

Percentage of received items matching expected identifiers, quantity and condition without correction.

---

### 22. Release Plan

#### Phase 1 — Core Warehouse Operations

- authentication and permissions;
- dashboard;
- find stock;
- inbound receiving;
- movement within depot;
- movement history;
- basic load lanes;
- dispatch-ready workflow;
- profile;
- audit logs.

#### Phase 2 — Mobile and Scanning

- QR/barcode scanner;
- VIN lookup;
- camera capture;
- rugged tablet layouts;
- offline queue;
- label printing;
- document printing.

#### Phase 3 — Advanced Yard and Staging

- interactive map;
- staging-area management;
- inter-depot transfers;
- printer spooler;
- batch printing;
- safety checklist and defects.

#### Phase 4 — Analytics and Optimisation

- productivity analytics;
- dwell alerts;
- lane balancing insights;
- advanced reports;
- automated task suggestions;
- predictive capacity alerts.

---

### 23. Out of Scope for Initial Warehouse Release

Unless separately approved:

- full accounting;
- payroll processing;
- tenant subscription administration;
- role/permission creation by warehouse staff;
- autonomous robot control;
- fully automatic dispatch without human confirmation;
- unrestricted inventory write-offs;
- company-wide pricing management.

---

### 24. QA Test Areas

#### 24.1 Functional

- search and filters;
- receive draft/finalise;
- manual item entry;
- scans;
- CSV import;
- damage evidence;
- internal move;
- inter-depot transfer;
- staging;
- load-lane assignment;
- dispatch confirmation;
- history;
- labels;
- documents;
- print queue;
- safety checklist;
- profile.

#### 24.2 Negative

- duplicate VIN;
- invalid barcode;
- inactive location;
- full location;
- restricted location;
- wrong source location;
- duplicate item in move;
- dispatch with missing item;
- damaged item dispatch;
- printer offline;
- invalid import schema;
- stale record update;
- offline duplicate sync.

#### 24.3 Permission

- wrong tenant;
- wrong depot;
- direct API access;
- restricted zone;
- dispatch override;
- data export;
- printer access;
- audit access.

#### 24.4 Security

- IDOR;
- injection;
- XSS;
- file upload abuse;
- privilege escalation;
- token replay;
- local offline storage inspection;
- cross-tenant leakage.

#### 24.5 Performance

- large inventory;
- rapid scanning;
- concurrent receiving;
- large movement history;
- high-volume imports;
- batch label printing;
- multiple printer queues.

---

### 25. UAT Scenarios

#### UAT-01 — Receive Vehicle

**Given** an authorised warehouse user  
**When** valid inbound, vehicle, condition and location data are entered  
**Then** the vehicle is received, located and visible in Find Stock with history.

#### UAT-02 — Block Duplicate VIN

**Given** an active item already uses the VIN  
**When** the user tries to receive it again  
**Then** the system blocks or routes to an approved duplicate workflow.

#### UAT-03 — Location Capacity

**Given** a bay has insufficient capacity  
**When** three items are moved into space for two  
**Then** movement is blocked with capacity details.

#### UAT-04 — Move by Scan

**Given** an item exists in Zone A  
**When** the user scans the item and destination location  
**Then** the item moves and both capacities update.

#### UAT-05 — Dispatch Hold

**Given** a required item or document is missing  
**When** dispatch is attempted  
**Then** the system blocks dispatch and displays the missing requirement.

#### UAT-06 — Restricted Goods

**Given** a dangerous-goods item  
**When** a user selects a standard lane  
**Then** the system blocks the move.

#### UAT-07 — Offline Receiving

**Given** the device is offline and offline mode is enabled  
**When** the user saves a receipt  
**Then** it is queued and safely synchronised without duplication.

#### UAT-08 — Print Label

**Given** a matching item and online printer  
**When** a VIN label is printed  
**Then** the print job is logged and the identifier matches the item.

#### UAT-09 — Cross-Depot Restriction

**Given** a Sydney-only user  
**When** they request a Melbourne transfer through the API  
**Then** access is denied.

#### UAT-10 — Movement History

**Given** an item has received, moved, staged and dispatched events  
**When** its history is opened  
**Then** all events appear chronologically with actor and location.

---

### 26. Definition of Done

A feature is done only when:

- requirements are implemented;
- server-side permissions exist;
- business rules are enforced;
- audit events are recorded;
- responsive layouts are complete;
- offline behaviour is tested where included;
- error, loading and empty states exist;
- accessibility checks pass;
- automated tests pass;
- security review passes;
- QA and UAT pass;
- API documentation is updated;
- user documentation exists;
- monitoring is configured;
- no critical or high-severity defects remain.

---

### 27. Open Product Decisions

1. Which item types are enabled at launch?
2. What is the final location hierarchy for each depot?
3. Are positions mandatory within bays?
4. What capacity unit is used: item count, volume, weight or mixed?
5. Which goods require restricted zones?
6. Is offline receiving required in Phase 1?
7. Which barcode and QR formats are supported?
8. Which scanner hardware is used?
9. Which printer models and protocols are supported?
10. Which inbound documents are mandatory?
11. Are item photos mandatory for every vehicle?
12. What damage workflow and approval roles apply?
13. Who may override location and dispatch blocks?
14. Which safety checklists are warehouse-specific?
15. How are inter-depot transfer discrepancies resolved?
16. Can one load use multiple load lanes?
17. Can one lane hold multiple loads?
18. What is the staging dwell threshold?
19. What inventory and GPS retention policies apply?
20. Which reports are required for initial launch?

---

### 28. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Wrong item location | Lost stock and delays | Scan confirmation and atomic moves |
| Duplicate inbound item | Inventory duplication | Unique identifier rules and idempotency |
| Capacity overrun | Unsafe operations | Hard capacity validation |
| Restricted cargo misplacement | Compliance breach | Compatibility and permission rules |
| Offline sync conflict | Duplicate or stale data | Encrypted queue and conflict resolution |
| Dispatch with missing cargo | Customer failure | Readiness checklist and scan verification |
| Printer duplication | Label/document confusion | Controlled retry and print audit |
| Cross-depot leakage | Security breach | Server-side tenant/depot scope |
| Unclear movement reversal | Audit weakness | Reversal as a new linked transaction |
| High-volume history slowdown | Poor performance | Partitioning, indexes and archiving |

---

### 29. Suggested Permission Matrix

| Action | Warehouse Manager | Supervisor | Staff | Read Only |
|---|---:|---:|---:|---:|
| View Dashboard | Yes | Yes | Yes | Yes |
| Find Stock | Yes | Yes | Yes | Yes |
| Create Inbound Draft | Yes | Yes | Yes | No |
| Confirm Receipt | Yes | Yes | Conditional | No |
| Move Within Depot | Yes | Yes | Yes | No |
| Inter-Depot Transfer | Yes | Conditional | No | No |
| Manage Load Lanes | Yes | Yes | Conditional | No |
| Confirm Dispatch | Yes | Yes | Conditional | No |
| Override Hold | Conditional | Conditional | No | No |
| View Movement History | Yes | Yes | Yes | Yes |
| Export History | Yes | Conditional | No | Conditional |
| Print Labels | Yes | Yes | Yes | Conditional |
| Manage Print Queue | Yes | Yes | Conditional | No |
| Run Imports | Yes | Conditional | No | No |
| View Reports | Yes | Yes | Conditional | Yes |
| Edit Own Profile | Yes | Yes | Yes | Yes |
| Manage Roles | No | No | No | No |

---

### 30. Sample Validation Messages

- “VIN already exists on active item ITEM-10234.”
- “The selected bay has capacity for only 2 additional items.”
- “This item is currently locked by movement MT-1045.”
- “Dangerous goods cannot be placed in Lane 2.”
- “The scanned source location does not match the system location.”
- “Delivery note is required before receiving this inbound type.”
- “Damage photos are required because damage was noted.”
- “Dispatch is blocked: 2 required items are missing.”
- “Printer Zebra ZD421 is offline.”
- “This receipt was already finalised from another device.”
- “You do not have access to Melbourne Depot.”
- “This record was updated by another user. Refresh and retry.”

---

### 31. Sample Movement Audit Event

```json
{
  "eventId": "AUD-WH-1004",
  "tenantId": "TEN-001",
  "depotId": "SYD-DEPOT",
  "module": "warehouse_movements",
  "action": "item_moved",
  "actorId": "WS-1007",
  "actorRole": "WAREHOUSE_STAFF",
  "movementId": "MT-1045",
  "itemId": "ITEM-ABC123",
  "before": {
    "locationId": "ZONE-A-R4-B12-P01",
    "status": "IN_STORAGE"
  },
  "after": {
    "locationId": "ZONE-B-R2-B05-P03",
    "status": "IN_STORAGE"
  },
  "reason": "Repositioning",
  "timestampUtc": "2026-07-21T01:35:00Z",
  "deviceId": "FORKLIFT-TAB-07",
  "correlationId": "COR-..."
}
```

---

### 32. Sign-Off

| Stakeholder | Name | Status | Date |
|---|---|---|---|
| Product Owner |  | Pending |  |
| Warehouse Operations Lead |  | Pending |  |
| Yard Operations Lead |  | Pending |  |
| Technical Lead |  | Pending |  |
| Security Reviewer |  | Pending |  |
| QA Lead |  | Pending |  |
| Client Representative |  | Pending |  |

---


---

## Part 7 — Yard Attendant Portal Detailed PRD

**Source classification:** Authoritative Yard Attendant Portal PRD; exact duplicate file copies were removed.

### Hero Logistics — Yard Attendant Portal Product Requirements Document (PRD)

**Document Version:** 1.0  
**Product Area:** Yard Attendant Portal  
**Platform:** Hero Logistics Transport, Warehouse & Yard Management System  
**Primary Role:** Yard Attendant  
**Prepared Date:** 05 August 2026  
**Document Status:** Ready for Product, Design, Development, QA and UAT  
**Default Timezone:** Australia/Sydney (AEST/AEDT), configurable by depot  

---

#### 1. Document Purpose

This Product Requirements Document defines the complete functional, operational, security and technical requirements for the **Hero Logistics Yard Attendant Portal**.

The portal is the daily operational workspace used by yard attendants to:

- start and finish work shifts;
- receive inbound vehicles, pallets, freight, containers and equipment;
- search and locate stock within yards and warehouses;
- move items between locations;
- stage inventory in holding areas;
- manage load lanes;
- verify outbound dispatch readiness;
- scan QR codes and barcodes;
- review yard and warehouse maps;
- view vehicle, location and load information;
- maintain a complete movement activity trail;
- print labels and barcodes;
- report safety, damage and missing-item issues;
- review role-scoped reports and analytics.

All names, dates, IDs, counts, locations and sample records shown in the supplied UI references are illustrative. Production screens must use live tenant and branch data.

---

#### 2. Product Vision

Provide yard attendants with a fast, mobile-friendly and scan-first operational system that keeps every item traceable from inbound receipt through movement, staging and outbound dispatch, while preventing unsafe, unauthorised or inaccurate stock movements.

---

#### 3. Product Goals

##### 3.1 Primary Goals

1. Reduce manual yard paperwork and duplicated data entry.
2. Allow stock to be received and located quickly.
3. Ensure every movement creates a traceable audit event.
4. Improve load-lane readiness and outbound turnaround time.
5. Prevent items from being moved into invalid, restricted or full locations.
6. Support barcode/QR-driven operations on handheld devices and yard tablets.
7. Provide reliable offline capture where yard connectivity is weak.
8. Make safety and damage reporting immediate and evidence-based.
9. Restrict attendants to assigned depots, locations and operational actions.

##### 3.2 Success Metrics

| Metric | Target |
|---|---:|
| Average inbound item processing time | Under 60 seconds per scanned item |
| Search-to-location time | Under 20 seconds |
| Movement records with complete source/destination data | 100% |
| Unauthorised location access | 0 |
| Duplicate item receipt prevention | 100% of detected duplicates blocked or reviewed |
| Dispatch-ready loads with missing mandatory checks | 0 |
| Barcode/QR scan success rate | At least 98% for supported labels |
| Offline action sync success | At least 99.5% |
| Critical issue notification time | Under 60 seconds |
| Inventory accuracy | At least 98% |
| Standard list response time | Under 2 seconds |

---

#### 4. Primary User Persona

##### 4.1 Yard Attendant

A yard attendant performs physical stock, vehicle, trailer, container and freight movements at an assigned depot or warehouse.

**Typical responsibilities:**

- clock in and clock out;
- receive inbound loads;
- inspect and record item condition;
- scan stock identifiers;
- locate stock;
- move stock within the depot;
- stage items for outbound loads;
- manage assigned load lanes;
- verify outbound pickups;
- print labels;
- report damage, defects and missing items;
- maintain safe and accurate yard records.

##### 4.2 Related Roles

| Role | Relationship to Yard Attendant |
|---|---|
| Warehouse Manager | Supervises operations and approves configured exceptions |
| Yard Supervisor | Assigns tasks, locations and lanes |
| Dispatcher | Coordinates load timing, driver and vehicle arrival |
| Driver | Delivers or collects items |
| Warehouse Staff | Supports storage, picking and staging |
| Compliance Officer | Reviews safety, damage and restricted-item records |
| Maintenance Team | Handles vehicle, trailer and equipment defects |
| Company Admin | Configures locations, permissions and company rules |

---

#### 5. Role Scope and Access Principles

##### 5.1 Default Scope

The Yard Attendant role is **depot-scoped and task-scoped by default**.

The user may access only:

- assigned company;
- assigned branch or depot;
- authorised yard, warehouse, zones, rows, bays and load lanes;
- assigned inbound, movement, staging and outbound work;
- permitted operational records and reports.

##### 5.2 Default Restrictions

A yard attendant must not automatically be allowed to:

- create or manage branches;
- create company-wide locations;
- change system settings;
- manage roles or permissions;
- view payroll or finance;
- edit customer billing data;
- approve compliance overrides;
- delete movement history;
- alter completed audit records;
- create unrestricted loads;
- edit vehicle compliance documents;
- access another depot without permission.

##### 5.3 Permission Examples

- `yard.shift.start`
- `yard.shift.finish`
- `yard.dashboard.view`
- `yard.inbound.view`
- `yard.inbound.create`
- `yard.inbound.draft`
- `yard.inbound.complete`
- `yard.stock.search`
- `yard.stock.view`
- `yard.stock.move`
- `yard.stock.transfer_request`
- `yard.staging.view`
- `yard.staging.assign`
- `yard.lane.view`
- `yard.lane.manage`
- `yard.vehicle.view`
- `yard.location.view`
- `yard.load.view`
- `yard.activity.view`
- `yard.scan.execute`
- `yard.dispatch.view`
- `yard.dispatch.confirm`
- `yard.label.view`
- `yard.label.print`
- `yard.report.view`
- `yard.issue.create`
- `yard.issue.view_own`

All permissions must be enforced server-side.

---

#### 6. Portal Navigation

1. Start Work / Finish Work
2. Dashboard
3. Receive (Inbound Intake)
4. Find & Search
5. Move
6. Stage Inventory
7. Load Lane Management
8. Vehicles
9. Locations
10. Loads
11. Activities
12. QR / Barcode Scan
13. Yard & Warehouse Map
14. Outbound Dispatch
15. Labels & Barcodes
16. Reports & Analytics
17. Report Issue
18. Profile / Account Menu

---

#### 7. Shared Header and Global Functions

##### 7.1 Header Elements

- company logo;
- portal name;
- current user;
- role label;
- current depot;
- online/offline state;
- notification count;
- quick search;
- keyboard shortcut `Ctrl + K` or `Cmd + K`;
- account menu;
- logout.

##### 7.2 Global Search

Search must support authorised matching for:

- VIN;
- registration number;
- barcode;
- QR code;
- SKU;
- item number;
- stock number;
- container number;
- trailer number;
- vehicle number;
- load number;
- receipt number;
- movement reference;
- customer reference;
- location;
- lane;
- staging area.

##### 7.3 Global Status Indicators

The portal should show:

- online;
- syncing;
- offline;
- sync failed;
- last successful sync time;
- local queued action count.

---

### 8. Functional Requirements

#### 8.1 Start Work / Finish Work

##### 8.1.1 Purpose

Track attendance and operational shift status for the yard attendant.

##### 8.1.2 Start Work

The system may capture:

- user ID;
- depot;
- timestamp;
- device;
- GPS location where permitted;
- assigned shift;
- selected role or work area;
- safety acknowledgement;
- equipment assignment;
- supervisor assignment.

##### 8.1.3 Finish Work

The system may require:

- outstanding task review;
- uncompleted movement review;
- unsynced action review;
- assigned equipment return;
- issue handover note;
- final confirmation.

##### 8.1.4 Business Rules

1. A user cannot start multiple overlapping shifts.
2. Starting outside the configured depot geofence may warn or block.
3. Required induction or certification expiry may block work start.
4. Finish Work must not silently discard unsynced actions.
5. Shift status must be available to supervisors.

##### 8.1.5 Requirements

| ID | Requirement | Priority |
|---|---|---|
| YARD-SHIFT-001 | Yard attendant can start an authorised shift. | Must |
| YARD-SHIFT-002 | Yard attendant can finish an active shift. | Must |
| YARD-SHIFT-003 | System must prevent overlapping active shifts. | Must |
| YARD-SHIFT-004 | Unsynced or incomplete work must be shown before finish. | Must |
| YARD-SHIFT-005 | Shift start and finish must be audited. | Must |

---

#### 8.2 Yard Dashboard

##### 8.2.1 Purpose

Provide a real-time operational overview of the assigned yard or depot.

##### 8.2.2 KPI Cards

- Inbound Awaiting Receive
- In Yard Vehicles / Items
- To Move Tasks
- Load Lanes in Progress
- Dispatch Ready
- Yard Capacity

Each KPI should support click-through to the relevant filtered page.

##### 8.2.3 Inbound Today

Columns:

- time;
- receipt number;
- supplier or source;
- item count;
- status.

##### 8.2.4 Load Lane Overview

Columns:

- lane;
- load;
- progress;
- status.

##### 8.2.5 Recent Movements

Columns:

- time;
- item;
- action;
- location.

##### 8.2.6 Quick Actions

- Receive Inbound
- Find Stock
- Move / Transfer
- Load Lanes
- Dispatch Ready
- Report Issue

##### 8.2.7 Notifications

Examples:

- load assigned to lane;
- item received;
- items ready to move;
- lane full;
- dispatch due;
- damage issue created;
- sync failed.

##### 8.2.8 Requirements

| ID | Requirement | Priority |
|---|---|---|
| YARD-DASH-001 | Dashboard must show depot-scoped operational KPIs. | Must |
| YARD-DASH-002 | KPI cards must link to filtered operational screens. | Should |
| YARD-DASH-003 | Dashboard must show last sync time. | Must |
| YARD-DASH-004 | Dashboard must show offline and pending-sync states. | Must |
| YARD-DASH-005 | Notifications must be role and location scoped. | Must |

---

#### 8.3 Receive — Inbound Intake

##### 8.3.1 Purpose

Record and confirm incoming vehicles, freight, pallets, containers, equipment and other inventory.

##### 8.3.2 Main Actions

- Cancel
- Save as Draft
- Receive Items
- Add Item
- Scan Barcode / QR
- Upload CSV
- Add Photos
- Add Documents

##### 8.3.3 Section 1 — Inbound Details

Fields:

- Inbound Type;
- Inbound Number;
- Supplier / From;
- Reference / Delivery Note;
- Transport Type;
- Driver;
- Vehicle / Trailer;
- Date / Time;
- Notes.

Supported inbound types may include:

- supplier delivery;
- customer delivery;
- branch transfer;
- return;
- port intake;
- driver handover;
- purchase receipt;
- other configured type.

##### 8.3.4 Section 2 — Location

Location hierarchy is configurable, with possible levels:

- company;
- branch;
- depot;
- warehouse or yard;
- zone;
- row or aisle;
- bay;
- position or slot;
- staging area.

The UI must show a full location preview.

##### 8.3.5 Section 3 — Item Entry

Entry methods:

- manual entry;
- barcode scan;
- QR scan;
- VIN or registration lookup;
- CSV import.

Supported item types:

- vehicle;
- pallet;
- carton;
- dangerous goods item;
- container;
- machinery;
- equipment;
- spare parts;
- custom item type.

##### 8.3.6 Vehicle Fields

- VIN;
- registration / plate;
- make;
- model;
- year;
- colour;
- condition;
- fuel type;
- damage noted;
- photos required;
- keys received;
- odometer where applicable.

##### 8.3.7 Generic Freight Fields

- SKU or item number;
- barcode;
- description;
- quantity;
- unit;
- weight;
- dimensions;
- batch or lot;
- expiry date;
- dangerous goods code;
- condition;
- damage noted.

##### 8.3.8 Items to Receive Table

Columns:

- sequence;
- item type;
- description;
- identifier;
- destination location;
- condition;
- damage;
- actions.

##### 8.3.9 Documents and Photos

Supported uploads:

- delivery note;
- invoice;
- manifest;
- transfer document;
- condition photo;
- damage photo;
- seal photo;
- other supporting document.

Rules:

- permitted formats configurable;
- default maximum file size 10 MB;
- uploader identity stored;
- timestamp stored;
- malware scan required;
- photo metadata retained where available.

##### 8.3.10 Receive Checklist

- item count verified;
- condition checked;
- documents verified;
- photos captured;
- location confirmed;
- dangerous goods checks completed where applicable.

##### 8.3.11 Inbound Business Rules

1. Mandatory fields must be completed before final receive.
2. Duplicate VIN, barcode, container or item identifier must trigger review.
3. Destination must be valid, active and not restricted.
4. Capacity rules must be checked.
5. Dangerous goods may only be placed in authorised locations.
6. Damaged items must require issue or damage evidence according to policy.
7. Completing receipt creates inventory records and movement history.
8. Draft receipts do not create final stock availability unless configured.
9. Offline receipts must queue safely and prevent duplicate sync.

##### 8.3.12 Requirements

| ID | Requirement | Priority |
|---|---|---|
| YARD-IN-001 | Yard attendant can create an inbound receipt. | Must |
| YARD-IN-002 | Yard attendant can save an incomplete receipt as draft. | Must |
| YARD-IN-003 | System must support manual and scan-based item entry. | Must |
| YARD-IN-004 | System must validate VIN and item identifiers. | Must |
| YARD-IN-005 | System must detect duplicate identifiers. | Must |
| YARD-IN-006 | Final receipt must create inventory and movement records. | Must |
| YARD-IN-007 | Damage evidence rules must be configurable. | Must |
| YARD-IN-008 | CSV import must provide row-level validation. | Should |
| YARD-IN-009 | Offline inbound capture must use an idempotent sync queue. | Must |

---

#### 8.4 Find & Search Stock

##### 8.4.1 Purpose

Locate vehicles, freight and inventory across authorised yard and warehouse locations.

##### 8.4.2 Search Inputs

- VIN;
- registration;
- barcode;
- QR code;
- SKU;
- item number;
- stock number;
- load number;
- customer reference;
- container number.

##### 8.4.3 Filters

- Item Type
- Location
- Status
- Load / Job
- Customer
- Date Range
- Zone
- Row
- Bay
- Staging Area

##### 8.4.4 Result Columns

- item / description;
- type;
- current location;
- status;
- load / job;
- customer;
- updated time;
- action.

##### 8.4.5 Item Details

Display:

- item name;
- identifier;
- VIN or barcode;
- type;
- current location;
- status;
- load / job;
- customer;
- received date;
- condition;
- notes;
- movement history.

Actions:

- Move / Transfer;
- View Load;
- View Item History;
- Report Issue;
- Print Label where permitted.

##### 8.4.6 Requirements

| ID | Requirement | Priority |
|---|---|---|
| YARD-SEARCH-001 | Search must support exact and partial identifiers. | Must |
| YARD-SEARCH-002 | Scan result must open the matching item quickly. | Must |
| YARD-SEARCH-003 | Results must show current authoritative location. | Must |
| YARD-SEARCH-004 | Search must be restricted to authorised locations. | Must |
| YARD-SEARCH-005 | Item details must show latest movement state. | Must |
| YARD-SEARCH-006 | Search filters must be combinable. | Must |

---

#### 8.5 Move

##### 8.5.1 Purpose

Move items within the depot or request transfer to another depot.

##### 8.5.2 Movement Types

- Move Within Depot
- Transfer to Another Depot
- Stage to Holding Area
- Move to Load Lane
- Return to Storage
- Move to Inspection
- Move to Maintenance / Hold

##### 8.5.3 Movement Details

Fields:

- reference number;
- date / time;
- reason;
- priority;
- notes;
- assigned equipment;
- assigned worker;
- source;
- destination.

##### 8.5.4 Items to Move

Entry methods:

- scan;
- manual identifier;
- import from list;
- selected search results.

Columns:

- item;
- type;
- current location;
- destination location;
- condition;
- actions.

##### 8.5.5 Special Instructions

- requires equipment;
- notify after move;
- fragile;
- dangerous goods;
- temperature-controlled;
- security escort;
- free-text instructions.

##### 8.5.6 Validation Rules

1. Item must exist and be accessible.
2. Current location must match server state.
3. Destination must be active and permitted.
4. Destination capacity must be sufficient.
5. Restricted categories must match destination rules.
6. Item cannot be in a conflicting active movement.
7. Move confirmation must create a movement event.
8. Transfer to another depot creates a transfer job, not an immediate final location update.
9. Failed movements must preserve reason and original state.

##### 8.5.7 Requirements

| ID | Requirement | Priority |
|---|---|---|
| YARD-MOVE-001 | Yard attendant can move authorised items within a depot. | Must |
| YARD-MOVE-002 | System must validate source and destination. | Must |
| YARD-MOVE-003 | Capacity and restriction rules must be enforced. | Must |
| YARD-MOVE-004 | Cross-depot movement must use transfer workflow. | Must |
| YARD-MOVE-005 | Bulk movement must validate every item individually. | Must |
| YARD-MOVE-006 | Every result must create an immutable movement record. | Must |
| YARD-MOVE-007 | Stale item location must block finalisation. | Must |

---

#### 8.6 Stage Inventory — Holding Areas

##### 8.6.1 Purpose

Manage temporary holding areas used before items are moved to load lanes or other destinations.

##### 8.6.2 Summary Metrics

- total staging areas;
- active and inactive areas;
- staged items;
- awaiting move;
- overdue items.

##### 8.6.3 Views

- All Staging Areas
- By Zone
- By Load Lane
- Inactive Areas

##### 8.6.4 Columns

- staging area;
- zone;
- next load lane;
- status;
- capacity;
- occupancy;
- staged items;
- awaiting move;
- oldest item;
- actions.

##### 8.6.5 Staging Statuses

- Active
- Inactive
- Available
- Near Capacity
- Full
- Restricted
- Maintenance

##### 8.6.6 Staged Item Statuses

- Staged
- Awaiting Move
- Ready for Lane
- On Hold
- Overdue
- Damaged
- Restricted

##### 8.6.7 Business Rules

1. Holding-area capacity must be enforced.
2. Dwell-time thresholds must be configurable.
3. Overdue items must generate alerts.
4. Dangerous goods must use authorised staging areas.
5. Items cannot be assigned to inactive areas.
6. Moving staged items must update occupancy in real time.
7. Yard attendants may not create a new holding area unless explicitly permitted.

##### 8.6.8 Requirements

| ID | Requirement | Priority |
|---|---|---|
| YARD-STAGE-001 | Staging areas must show capacity and occupancy. | Must |
| YARD-STAGE-002 | Yard attendant can assign eligible items to staging. | Must |
| YARD-STAGE-003 | Full or restricted staging areas must block movement. | Must |
| YARD-STAGE-004 | Dwell-time alerts must be generated. | Must |
| YARD-STAGE-005 | Staging assignment must create movement history. | Must |
| YARD-STAGE-006 | Staging actions must update load-lane readiness. | Should |

---

#### 8.7 Load Lane Management

##### 8.7.1 Purpose

Manage lanes where items are organised for outbound loading and dispatch.

##### 8.7.2 Summary Metrics

- total lanes;
- loads in progress;
- ready to dispatch;
- overdue / hold.

##### 8.7.3 Lane List Columns

- lane / area;
- status;
- load count;
- current load / reference;
- trailer / vehicle;
- driver;
- estimated dispatch;
- actions.

##### 8.7.4 Lane Statuses

- Empty
- Assigned
- Staging
- In Progress
- Ready to Dispatch
- Hold
- Full
- Closed
- Maintenance

##### 8.7.5 Lane Detail

Display:

- lane name;
- location;
- lane status;
- capacity;
- occupancy;
- assigned load;
- sub-reference;
- staged item count;
- item list;
- driver;
- vehicle / trailer;
- estimated dispatch;
- verification state;
- sealing state;
- notes.

Actions:

- Move Items to Lane;
- Assign / Update Driver;
- Print Lane Report;
- Print Labels;
- Place on Hold;
- Release Hold;
- Mark Ready;
- View Dispatch Ready.

##### 8.7.6 Business Rules

1. Lane capacity must be enforced.
2. Items must belong to the assigned load unless authorised exception exists.
3. Lane readiness requires all configured items and checks.
4. Hold reasons must be recorded.
5. Lane cannot be marked ready with unresolved mandatory issues.
6. Emptying a lane must preserve item movement history.
7. Creating or deleting lanes is supervisor-level by default.

##### 8.7.7 Requirements

| ID | Requirement | Priority |
|---|---|---|
| YARD-LANE-001 | Lane status and occupancy must update in real time. | Must |
| YARD-LANE-002 | Items can be moved into eligible lanes. | Must |
| YARD-LANE-003 | Wrong-load items must be blocked or require approved override. | Must |
| YARD-LANE-004 | Ready status must enforce configured checklist. | Must |
| YARD-LANE-005 | Hold and release actions must be audited. | Must |
| YARD-LANE-006 | Lane detail must show staged item list. | Must |

---

#### 8.8 Vehicles

##### 8.8.1 Purpose

Provide operational visibility into vehicles relevant to yard work.

##### 8.8.2 Summary

- total vehicles;
- active;
- in maintenance;
- out of service;
- compliance due.

##### 8.8.3 Columns

- vehicle / registration;
- type / make / model;
- year;
- status;
- current driver;
- odometer;
- compliance;
- next service;
- actions.

##### 8.8.4 Yard Attendant Access

Default actions:

- view vehicle;
- scan vehicle label;
- see current yard location;
- report defect;
- see operational status;
- link vehicle to inbound or outbound work.

Restricted by default:

- edit compliance documents;
- approve maintenance;
- add or delete vehicles;
- alter ownership or registration.

##### 8.8.5 Requirements

| ID | Requirement | Priority |
|---|---|---|
| YARD-VEH-001 | Yard attendant can view operational vehicle data. | Must |
| YARD-VEH-002 | Out-of-service vehicles must be clearly identified. | Must |
| YARD-VEH-003 | Vehicle location must match movement records. | Must |
| YARD-VEH-004 | Defect reporting must be available from vehicle details. | Must |

---

#### 8.9 Locations

##### 8.9.1 Purpose

Allow attendants to view authorised depot, yard, warehouse and location structure.

##### 8.9.2 Location Types

- branch;
- depot;
- warehouse;
- yard;
- receiving area;
- inspection area;
- zone;
- row;
- aisle;
- bay;
- position;
- staging area;
- load lane;
- container stack;
- hazardous storage;
- cold storage;
- dispatch area;
- maintenance area;
- restricted area.

##### 8.9.3 Required Data

- location ID;
- name;
- code;
- type;
- parent location;
- capacity;
- occupancy;
- status;
- restriction rules;
- item categories allowed;
- map coordinates;
- QR/barcode identifier.

##### 8.9.4 Default Access

The yard attendant may view locations and occupancy. Creation, deletion and configuration are supervisor or admin functions unless permission is granted.

##### 8.9.5 Requirements

| ID | Requirement | Priority |
|---|---|---|
| YARD-LOC-001 | Location hierarchy must be configurable. | Must |
| YARD-LOC-002 | Location occupancy must update after movements. | Must |
| YARD-LOC-003 | Restricted locations must show clear access rules. | Must |
| YARD-LOC-004 | Location QR codes must resolve to location details. | Must |
| YARD-LOC-005 | Yard attendant must not create branches by default. | Must |

---

#### 8.10 Loads

##### 8.10.1 Purpose

Provide read-focused access to loads relevant to receiving, staging, lanes and outbound dispatch.

##### 8.10.2 Filters

- date range;
- status;
- type;
- customer;
- driver;
- vehicle;
- location;
- branch;
- search.

##### 8.10.3 Columns

- load reference;
- status;
- load type;
- customer;
- route;
- driver / truck;
- pickup date;
- ETA / delivery;
- progress;
- actions.

##### 8.10.4 Yard Attendant Actions

Default permitted actions may include:

- view load;
- view assigned items;
- view pickup and dispatch instructions;
- view documents;
- stage items;
- move items to lane;
- mark physical milestones where assigned;
- report issue.

Restricted by default:

- create unrestricted load;
- change customer;
- alter pricing;
- assign driver;
- cancel load;
- modify route.

##### 8.10.5 Requirements

| ID | Requirement | Priority |
|---|---|---|
| YARD-LOAD-001 | Yard attendant can view authorised load data. | Must |
| YARD-LOAD-002 | Load detail must show expected and staged items. | Must |
| YARD-LOAD-003 | Physical milestone updates must be permission controlled. | Must |
| YARD-LOAD-004 | Yard actions must update dispatcher-visible load state. | Must |
| YARD-LOAD-005 | Load financial data must be hidden. | Must |

---

#### 8.11 Activities / Movement History

##### 8.11.1 Purpose

Provide a complete audit trail of physical stock and yard actions.

##### 8.11.2 Filters

- date range;
- movement type;
- from location;
- to location;
- item type;
- item;
- load / reference;
- driver / staff;
- reason;
- result.

##### 8.11.3 Columns

- date / time;
- movement type;
- item / description;
- from location;
- to location;
- load / reference;
- performed by;
- result;
- details.

##### 8.11.4 Movement Types

- Receive
- Move
- Transfer
- Stage
- Dispatch
- Pickup
- Return
- Inspection
- Hold
- Release Hold
- Adjustment

##### 8.11.5 Result States

- Completed
- Failed
- In Progress
- Cancelled
- Pending Sync

##### 8.11.6 Movement Detail

- movement ID;
- date / time;
- item;
- source;
- destination;
- load or receipt reference;
- performed by;
- device;
- reason;
- notes;
- result;
- sync state;
- evidence;
- audit reference.

##### 8.11.7 Requirements

| ID | Requirement | Priority |
|---|---|---|
| YARD-ACT-001 | All successful and failed movements must be recorded. | Must |
| YARD-ACT-002 | History must be immutable to normal users. | Must |
| YARD-ACT-003 | Activity filters must support audit investigation. | Must |
| YARD-ACT-004 | Offline actions must show pending and final sync states. | Must |
| YARD-ACT-005 | Export and print must require permission. | Must |

---

#### 8.12 QR / Barcode Scan

##### 8.12.1 Purpose

Support fast operational execution using handheld scanners, mobile cameras and forklift tablets.

##### 8.12.2 Supported Actions

- Scan In
- Scan Out
- Find Item
- Verify Item
- Receive Item
- Move Item
- Stage Item
- Assign to Lane
- Confirm Dispatch
- Scan Location
- Manual Entry

##### 8.12.3 Supported Identifiers

- VIN barcode;
- registration barcode;
- item barcode;
- QR code;
- SKU;
- pallet ID;
- container number;
- location code;
- load ID;
- lane ID.

##### 8.12.4 Device State

- connected;
- online;
- ready;
- scanning;
- disconnected;
- error;
- camera permission denied.

##### 8.12.5 Scan Workflow

1. User selects action or uses configured default.
2. Device captures code.
3. System decodes identifier.
4. System identifies entity.
5. System displays key data.
6. User confirms operation.
7. Server validates permission and state.
8. Inventory and movement record update.
9. Success or failure feedback appears.

##### 8.12.6 Scan Rules

- duplicate rapid scans must be debounced;
- unknown codes must not create records automatically unless permitted;
- wrong item or location combination must block;
- scan action must retain device and user metadata;
- offline scans must have idempotency keys;
- audible and visual feedback should be supported.

##### 8.12.7 Requirements

| ID | Requirement | Priority |
|---|---|---|
| YARD-SCAN-001 | Portal must support hardware scanner and camera input. | Must |
| YARD-SCAN-002 | Scan response must be optimised for fast use. | Must |
| YARD-SCAN-003 | Duplicate scan protection must be implemented. | Must |
| YARD-SCAN-004 | Unknown or conflicting codes must show clear errors. | Must |
| YARD-SCAN-005 | Scan actions must create audit and movement records. | Must |
| YARD-SCAN-006 | Offline scans must sync safely without duplication. | Must |

---

#### 8.13 Yard & Warehouse Map

##### 8.13.1 Purpose

Provide a visual representation of yard and warehouse capacity, inventory and operational status.

##### 8.13.2 Map Areas

- receiving;
- QC inspection;
- staging;
- dispatch;
- cold storage;
- zones;
- load lanes;
- hazardous storage;
- value storage;
- workshop;
- office;
- vehicle storage;
- container yard;
- equipment parking;
- empty trailer park;
- in gate;
- out gate;
- access road.

##### 8.13.3 Map Statuses

- Available
- In Use
- Staging
- On Hold
- Full
- Empty
- Maintenance
- Restricted

##### 8.13.4 Interactions

Clicking a map location should show:

- location name;
- code;
- capacity;
- occupancy;
- status;
- current items;
- pending work;
- restrictions;
- quick actions.

##### 8.13.5 Requirements

| ID | Requirement | Priority |
|---|---|---|
| YARD-MAP-001 | Map must reflect current location states. | Must |
| YARD-MAP-002 | Location drill-down must show current items. | Must |
| YARD-MAP-003 | Full and restricted areas must be visually distinct. | Must |
| YARD-MAP-004 | Map data must be depot scoped. | Must |
| YARD-MAP-005 | Refresh and last-updated time must be visible. | Must |

---

#### 8.14 Outbound Dispatch

##### 8.14.1 Purpose

Verify and record loads or items leaving the yard.

##### 8.14.2 Summary Metrics

- ready to dispatch;
- today’s dispatch;
- awaiting pickup;
- exceptions.

##### 8.14.3 Filters

- date;
- status;
- load lane;
- driver;
- trailer / vehicle;
- more filters.

##### 8.14.4 Columns

- load / reference;
- customer;
- trailer / vehicle;
- driver;
- load lane;
- ready since;
- status;
- actions.

##### 8.14.5 Statuses

- Ready
- Awaiting Pickup
- Driver Arrived
- Loading
- Hold
- Exception
- Dispatched
- Cancelled

##### 8.14.6 Dispatch Checklist

Possible configured checks:

- correct load;
- correct items;
- item count verified;
- condition verified;
- documents complete;
- labels complete;
- lane verified;
- vehicle and trailer verified;
- driver verified;
- seal recorded;
- safety check complete;
- hold cleared;
- departure time captured.

##### 8.14.7 Mark as Dispatched

The action must:

- confirm driver, vehicle and trailer;
- validate required documents;
- validate mandatory checks;
- update load status;
- update item status;
- clear or update lane occupancy;
- create movement records;
- capture departure timestamp;
- notify dispatch team;
- create audit event.

##### 8.14.8 Requirements

| ID | Requirement | Priority |
|---|---|---|
| YARD-OUT-001 | Only eligible staged loads may appear as dispatch ready. | Must |
| YARD-OUT-002 | Mandatory dispatch checks must block departure confirmation. | Must |
| YARD-OUT-003 | Marking dispatched must update load, items and lane. | Must |
| YARD-OUT-004 | Hold items must not be dispatched. | Must |
| YARD-OUT-005 | Departure confirmation must be audited. | Must |
| YARD-OUT-006 | Dispatch docket printing must be supported where permitted. | Should |

---

#### 8.15 Labels & Barcodes

##### 8.15.1 Purpose

Generate and print operational labels for stock and locations.

##### 8.15.2 Label Types

- Vehicle / VIN Label
- Pallet Label
- QR Code Label
- Container Label
- Load Label
- Location Label
- Holding Area Label
- Load Lane Label
- Custom Label

##### 8.15.3 Label Data

Depending on type:

- label ID;
- barcode or QR;
- VIN or item number;
- stock number;
- description;
- customer;
- asset type;
- location;
- load;
- lane;
- staging area;
- printed by;
- print time;
- copies;
- print status.

##### 8.15.4 Print Statuses

- Generated
- Pending
- Printing
- Printed
- Failed
- Reprinted
- Cancelled

##### 8.15.5 Print Functions

- print single;
- print all pending;
- reprint;
- select printer;
- select label size;
- test print;
- number of copies;
- preview.

##### 8.15.6 Business Rules

1. Reprint must be recorded.
2. Duplicate active tags must be prevented according to label type.
3. Failed print jobs must not mark a label printed.
4. Printer errors must show actionable detail.
5. Printed labels must link to the correct entity.

##### 8.15.7 Requirements

| ID | Requirement | Priority |
|---|---|---|
| YARD-LABEL-001 | Yard attendant can print authorised labels. | Must |
| YARD-LABEL-002 | Label preview must show encoded and readable data. | Must |
| YARD-LABEL-003 | Reprints must be audited. | Must |
| YARD-LABEL-004 | Printer state must be visible. | Should |
| YARD-LABEL-005 | Failed jobs must remain retryable. | Must |

---

#### 8.16 Reports & Analytics

##### 8.16.1 Purpose

Provide yard attendants and supervisors with operational metrics relevant to assigned depots.

##### 8.16.2 Tabs

- Overview
- Inventory
- Operations
- Productivity
- Dispatch
- Compliance

##### 8.16.3 KPI Examples

- total items handled;
- received inbound;
- dispatched outbound;
- staged items;
- average dwell time;
- accuracy rate.

##### 8.16.4 Report Filters

- date range;
- warehouse;
- zone;
- load lane;
- item type;
- status.

##### 8.16.5 Report Shortcuts

- Inventory Summary
- Stock Aging Report
- Movement History Report
- Load Lane Utilisation
- Receiving Performance
- Dispatch Performance
- Accuracy & Audit Report
- Damaged Items Report

##### 8.16.6 Yard Attendant Report Scope

Default:

- view assigned depot reports;
- view personal productivity where enabled;
- export only if permitted;
- no company-wide financial reporting.

##### 8.16.7 Requirements

| ID | Requirement | Priority |
|---|---|---|
| YARD-RPT-001 | Reports must respect depot and permission scope. | Must |
| YARD-RPT-002 | Metrics must use defined calculation rules. | Must |
| YARD-RPT-003 | Export must respect active filters. | Must |
| YARD-RPT-004 | Financial information must not be shown. | Must |
| YARD-RPT-005 | Report generation and export must be audited. | Must |

---

#### 8.17 Report Issue

##### 8.17.1 Purpose

Allow attendants to report safety, damage, defect, missing item and operational issues immediately.

##### 8.17.2 Issue Categories

- Vehicle Damage
- Trailer Damage
- Container Damage
- Freight Damage
- Missing Item
- Missing Equipment
- Location Hazard
- Safety Incident
- Spill / Leak
- Seal Issue
- Label Issue
- Scanner Issue
- Printer Issue
- Other

##### 8.17.3 Fields

- category;
- related entity ID;
- load or reference;
- location;
- title;
- description;
- severity;
- inspection checklist;
- photo evidence;
- document evidence;
- immediate action taken;
- person notified.

##### 8.17.4 Severity

- Low
- Medium
- High
- Critical

##### 8.17.5 Inspection Checklist Examples

- doors checked;
- tyres checked;
- lights checked;
- seals checked;
- brakes checked;
- item count checked;
- surrounding area made safe.

##### 8.17.6 Business Rules

1. High and critical issues must alert supervisors immediately.
2. Required evidence depends on category and severity.
3. Unsafe vehicles, trailers or locations may be placed on hold automatically.
4. Missing item reports must link to the last known movement.
5. Issue deletion is not allowed for normal users.
6. Resolution requires authorised role.

##### 8.17.7 Requirements

| ID | Requirement | Priority |
|---|---|---|
| YARD-ISSUE-001 | Yard attendant can report an issue. | Must |
| YARD-ISSUE-002 | Issue can be linked to item, vehicle, trailer, load or location. | Must |
| YARD-ISSUE-003 | High and critical issues must trigger escalation. | Must |
| YARD-ISSUE-004 | Evidence rules must be configurable. | Must |
| YARD-ISSUE-005 | Issue reporting must create an audit event. | Must |
| YARD-ISSUE-006 | Unsafe entities may be automatically placed on hold. | Must |

---

#### 8.18 Profile and Account Security

##### 8.18.1 Profile Data

- name;
- employee ID;
- email;
- phone;
- department;
- depot;
- role;
- reports to;
- joining date;
- language;
- timezone;
- date format;
- time format;
- address;
- emergency contact;
- certifications;
- skills;
- granted permissions.

##### 8.18.2 Security

- password change;
- two-factor authentication;
- active sessions;
- logout other devices;
- device history;
- recent activity.

##### 8.18.3 Requirements

| ID | Requirement | Priority |
|---|---|---|
| YARD-PRO-001 | User can view their profile and permissions. | Must |
| YARD-PRO-002 | User can update permitted preference fields. | Must |
| YARD-PRO-003 | User can manage password and 2FA. | Must |
| YARD-PRO-004 | User can view and revoke active sessions. | Must |
| YARD-PRO-005 | Certification expiry must be visible. | Must |

---

### 9. End-to-End Workflows

#### 9.1 Start Shift and Receive Inbound Vehicle

1. Yard attendant starts work.
2. System confirms depot, shift and user eligibility.
3. Attendant opens inbound receipt.
4. Attendant scans or enters delivery reference.
5. Supplier, driver and truck details are recorded.
6. Destination location is selected.
7. Vehicle VIN and registration are scanned.
8. System checks for duplicates.
9. Condition is recorded.
10. Photos and delivery note are attached.
11. Checklist is completed.
12. Receipt is confirmed.
13. Inventory record is created.
14. Vehicle location is updated.
15. Receive movement is logged.
16. Dashboard counts update.

---

#### 9.2 Search and Move Item

1. Attendant scans item or searches identifier.
2. System shows current location and status.
3. Attendant selects Move.
4. Destination location is scanned or selected.
5. System validates capacity, category and current state.
6. Attendant confirms move.
7. Item location updates.
8. Movement history is created.
9. Source and destination occupancy update.

---

#### 9.3 Stage Item to Holding Area

1. Attendant opens staging module.
2. Attendant selects or scans item.
3. System shows eligible staging areas.
4. Attendant selects destination.
5. Capacity and restriction checks run.
6. Item is moved.
7. Staged timestamp is recorded.
8. Dwell-time tracking begins.
9. Load-lane readiness updates if linked.

---

#### 9.4 Move Items to Load Lane

1. Attendant opens assigned load lane.
2. Attendant reviews expected load items.
3. Each item is scanned.
4. System verifies item-load-lane match.
5. Item is confirmed into lane.
6. Lane occupancy and progress update.
7. Incorrect items are blocked.
8. When all required items and checks are complete, lane can be marked ready.

---

#### 9.5 Outbound Dispatch

1. Driver arrives.
2. Attendant verifies driver, truck and trailer.
3. Load and item list are checked.
4. Required documents and seals are confirmed.
5. Safety and hold checks pass.
6. Attendant marks load dispatched.
7. Item statuses update to in transit.
8. Lane occupancy clears or reduces.
9. Departure time is recorded.
10. Dispatcher receives update.
11. Movement and audit records are created.

---

#### 9.6 Report Damage

1. Attendant opens Report Issue from item, vehicle or general menu.
2. Category and entity are selected.
3. Description and severity are entered.
4. Checklist is completed.
5. Evidence is uploaded.
6. System creates issue.
7. High severity triggers escalation.
8. Entity may be placed on hold.
9. Issue appears in active issue list.

---

#### 9.7 Offline Movement Sync

1. Device loses network connection.
2. Portal switches to offline mode.
3. User performs permitted offline action.
4. Action is stored with local ID and idempotency key.
5. UI shows pending sync.
6. Connection returns.
7. Server validates latest state.
8. Valid action syncs once.
9. Conflict action is flagged for review.
10. User receives result.

---

### 10. Status Models

#### 10.1 Item Status

- Expected
- Receiving
- Received
- In Storage
- To Move
- Moving
- Staged
- Ready
- On Hold
- Damaged
- Missing
- Dispatched
- In Transit
- Returned
- Cancelled

#### 10.2 Movement Status

- Draft
- Pending
- In Progress
- Completed
- Failed
- Cancelled
- Pending Sync
- Sync Conflict

#### 10.3 Location Status

- Active
- Available
- In Use
- Near Capacity
- Full
- Empty
- On Hold
- Maintenance
- Restricted
- Inactive

#### 10.4 Load Lane Status

- Empty
- Assigned
- Staging
- In Progress
- Ready to Dispatch
- Hold
- Full
- Closed
- Maintenance

#### 10.5 Issue Status

- Open
- Assigned
- In Progress
- Waiting
- Resolved
- Closed
- Rejected

#### 10.6 Shift Status

- Not Started
- On Shift
- Break
- Finished
- Absent
- Unavailable

---

### 11. Core Business Rules

#### 11.1 Inventory Rules

1. Each trackable item must have a unique identifier.
2. Current item location is derived from the latest valid completed movement.
3. A failed movement must not change current location.
4. A pending offline movement must not be treated as final server state.
5. Duplicate active records require review.
6. Damaged or hold items cannot be dispatched.
7. Restricted goods require compatible storage.

#### 11.2 Location Rules

1. Location must be active.
2. Capacity must not be exceeded.
3. Item category must be allowed.
4. User must have location access.
5. Dangerous goods and cold-storage rules must be enforced.
6. Source and destination cannot be identical unless action is a verification.

#### 11.3 Dispatch Rules

1. Only ready and verified loads can be dispatched.
2. Correct driver, truck and trailer must be confirmed.
3. Mandatory documentation must exist.
4. All required items must be present.
5. Open critical issues must block dispatch.
6. Departure action must be auditable.

#### 11.4 Date and Time Rules

1. Store timestamps in UTC.
2. Display in local depot timezone.
3. Exact timestamps must be retained.
4. Offline device timestamps must be stored with sync timestamps.
5. Daylight-saving changes must be supported.

---

### 12. Notifications and Alerts

#### 12.1 Yard Attendant Notifications

- inbound arrival assigned;
- move task assigned;
- item ready for lane;
- lane full;
- dispatch due;
- driver arrived;
- item mismatch;
- issue update;
- supervisor message;
- sync failed;
- certification expiring;
- shift ending.

#### 12.2 Supervisor Alerts

- critical issue;
- failed inbound validation;
- missing item;
- restricted location attempt;
- overdue staged item;
- lane over capacity;
- repeated failed scan;
- offline queue conflict;
- dispatch blocked.

---

### 13. Audit and Activity Logging

Events to log:

- login and logout;
- start and finish work;
- inbound draft creation;
- inbound completion;
- item creation;
- scan action;
- item move;
- transfer request;
- staging assignment;
- lane assignment;
- lane readiness change;
- outbound dispatch;
- label print;
- label reprint;
- issue creation;
- file upload;
- report view or export;
- offline sync;
- sync conflict;
- failed validation.

Each audit record must contain:

- event ID;
- tenant;
- branch;
- depot;
- module;
- action;
- actor;
- role;
- entity type;
- entity ID;
- source location;
- destination location;
- before value where appropriate;
- after value where appropriate;
- reason;
- timestamp;
- device;
- IP address where available;
- GPS where permitted;
- correlation ID;
- sync state.

---

### 14. Suggested Data Model

#### 14.1 Core Entities

- Tenant
- Company
- Branch
- Depot
- User
- Role
- Permission
- Shift
- WorkSession
- Warehouse
- Yard
- Location
- LocationType
- LocationRestriction
- LocationCapacity
- InventoryItem
- VehicleInventoryItem
- FreightInventoryItem
- ContainerInventoryItem
- InboundReceipt
- InboundReceiptItem
- Movement
- MovementItem
- TransferJob
- StagingArea
- StagingAssignment
- LoadLane
- LoadLaneAssignment
- Load
- LoadItem
- DispatchRecord
- ScanEvent
- BarcodeLabel
- PrintJob
- Printer
- Issue
- IssueEvidence
- Notification
- Attachment
- AuditLog
- OfflineQueueRecord

#### 14.2 Key Relationships

- Branch has many Depots.
- Depot has many Locations.
- Location belongs to a parent location.
- InventoryItem has one current authoritative location.
- InventoryItem has many Movements.
- InboundReceipt has many Receipt Items.
- StagingArea and LoadLane are specialised locations.
- Load has many expected items.
- DispatchRecord belongs to a Load.
- Issue may link to item, vehicle, trailer, load or location.
- ScanEvent may trigger a movement or verification.

---

### 15. API Requirements

Suggested endpoint groups:

- `/api/yard/shift/start`
- `/api/yard/shift/finish`
- `/api/yard/dashboard`
- `/api/inbound-receipts`
- `/api/inbound-receipts/:id`
- `/api/inbound-receipts/:id/items`
- `/api/inventory/search`
- `/api/inventory/:id`
- `/api/movements`
- `/api/movements/:id`
- `/api/staging-areas`
- `/api/staging-areas/:id/items`
- `/api/load-lanes`
- `/api/load-lanes/:id`
- `/api/load-lanes/:id/items`
- `/api/yard/vehicles`
- `/api/yard/locations`
- `/api/yard/loads`
- `/api/yard/activities`
- `/api/scans/resolve`
- `/api/scans/execute`
- `/api/yard/map`
- `/api/outbound-dispatch`
- `/api/labels`
- `/api/print-jobs`
- `/api/yard/reports`
- `/api/issues`
- `/api/offline/sync`

API requirements:

- secure authentication;
- tenant isolation;
- depot and location scope enforcement;
- RBAC;
- idempotency for scan, receive, move and dispatch actions;
- optimistic concurrency;
- request validation;
- pagination;
- filtering;
- sorting;
- standard errors;
- audit hooks;
- correlation IDs;
- file upload security;
- rate limiting;
- offline sync support.

---

### 16. Offline and Sync Requirements

##### 16.1 Offline-Capable Actions

Configured actions may include:

- scan lookup from cached data;
- receive draft;
- photo capture;
- movement draft;
- issue report;
- shift note;
- label request draft.

##### 16.2 Offline Queue Record

Must contain:

- local ID;
- idempotency key;
- action type;
- payload;
- user;
- depot;
- device;
- device timestamp;
- attachments;
- retry count;
- sync status.

##### 16.3 Conflict Handling

If server state changed:

- do not silently overwrite;
- show conflict reason;
- preserve local evidence;
- provide supervisor review where needed;
- mark final resolution.

##### 16.4 Security

- cached data encrypted;
- device session expires;
- logout clears sensitive cache;
- lost device sessions can be revoked;
- offline permissions use latest cached policy with safe limits.

---

### 17. Integrations

Potential integrations:

- handheld barcode scanners;
- mobile camera scanning;
- Zebra label printers;
- network print spooler;
- document storage;
- malware scanning;
- VIN or registration lookup;
- telematics or gate systems;
- weighbridge;
- SMS / push notifications;
- email;
- warehouse management system;
- transport management system;
- identity provider.

Integration failures must be visible, logged and safely retryable.

---

### 18. Security Requirements

#### 18.1 Authentication

- secure login;
- strong password policy;
- 2FA support;
- session timeout;
- device management;
- brute-force protection;
- login audit.

#### 18.2 Authorisation

- server-side RBAC;
- tenant isolation;
- depot scope;
- location scope;
- object-level checks;
- action permissions;
- export permissions.

#### 18.3 Data Protection

- TLS in transit;
- encryption at rest;
- encrypted offline cache;
- protected file URLs;
- malware scanning;
- secret management;
- secure backups;
- configurable retention.

#### 18.4 Application Security

- input validation;
- output encoding;
- SQL injection prevention;
- XSS prevention;
- CSRF protection where applicable;
- secure headers;
- file type validation;
- upload size limits;
- dependency scanning;
- audit monitoring.

---

### 19. Non-Functional Requirements

#### 19.1 Performance

- dashboard load under 3 seconds;
- search under 2 seconds;
- scan resolve target under 1 second on good network;
- movement confirmation under 2 seconds;
- inbound save under 3 seconds excluding uploads;
- map load under 4 seconds;
- background exports for large datasets.

#### 19.2 Availability

- target 99.9% monthly;
- graceful offline capability;
- health monitoring;
- operational alerting;
- backup and disaster recovery.

#### 19.3 Scalability

Support:

- multiple companies;
- multiple depots;
- thousands of inventory items per depot;
- high scan volume;
- many concurrent attendants;
- large photo storage;
- high movement-event volume.

#### 19.4 Responsiveness

Priority devices:

- rugged handheld scanner;
- mobile phone;
- forklift tablet;
- desktop terminal;
- standard tablet.

The portal must be touch-friendly and support large action targets.

#### 19.5 Accessibility

- keyboard support;
- visible focus;
- accessible forms;
- status not shown by colour alone;
- readable contrast;
- screen-reader labels;
- clear validation messages.

---

### 20. UX Requirements

1. Scan-first actions must require minimal taps.
2. Primary action buttons must remain visible.
3. Success and failure feedback must be immediate.
4. Use large touch targets for yard devices.
5. Preserve entered data after validation errors.
6. Clearly show current depot and location.
7. Show full location path.
8. Distinguish warnings from hard blocks.
9. Show offline and pending-sync state persistently.
10. Confirm destructive or irreversible actions.
11. Use simple language for operational errors.
12. Display exact item and location before confirmation.
13. Prevent accidental duplicate submissions.
14. Support camera capture directly inside relevant forms.

---

### 21. Error Handling

Standard response example:

```json
{
  "success": false,
  "code": "LOCATION_CAPACITY_EXCEEDED",
  "message": "Zone B / Row 2 / Bay 05 has no available capacity.",
  "details": {
    "locationId": "LOC-B-2-05",
    "capacity": 5,
    "occupied": 5
  },
  "correlationId": "COR-..."
}
```

Required user-facing errors:

- item not found;
- duplicate identifier;
- wrong current location;
- destination full;
- restricted destination;
- permission denied;
- load mismatch;
- item on hold;
- missing mandatory evidence;
- printer offline;
- scan failed;
- offline sync conflict;
- stale record.

---

### 22. Analytics Definitions

#### 22.1 Items Handled

Count of completed receive, move, stage or dispatch operations according to report configuration. Duplicate scans do not count.

#### 22.2 Inventory Accuracy

Percentage of audited items whose actual location and quantity match the system record.

#### 22.3 Dwell Time

Time between entering a staging or holding area and leaving that area.

#### 22.4 Dock-to-Dispatch Time

Time from completed inbound or load-ready milestone to recorded outbound departure, according to report configuration.

#### 22.5 Lane Utilisation

Occupied lane capacity divided by configured lane capacity over the selected period.

---

### 23. Release Plan

#### Phase 1 — Core Yard Operations

- authentication and RBAC;
- start / finish work;
- dashboard;
- inbound receiving;
- find and search;
- move within depot;
- movement history;
- basic locations;
- issue reporting;
- profile and audit logs.

#### Phase 2 — Staging and Dispatch

- staging areas;
- load lanes;
- load visibility;
- outbound dispatch;
- vehicle view;
- labels and barcode printing;
- yard map.

#### Phase 3 — Scan and Offline Operations

- hardware scanner support;
- camera scanning;
- offline queue;
- conflict resolution;
- advanced printer integration;
- batch operations.

#### Phase 4 — Analytics and Optimisation

- reports and analytics;
- dwell-time alerts;
- productivity metrics;
- occupancy insights;
- advanced supervisor workflows;
- automated gate and telematics integrations.

---

### 24. Out of Scope for Initial Yard Attendant Release

Unless separately approved:

- company or tenant administration;
- branch creation;
- location master configuration;
- pricing;
- invoicing;
- payroll;
- finance;
- role and permission management;
- compliance approval;
- unrestricted load creation;
- driver assignment;
- customer account management;
- issue closure approval;
- deletion of movement history.

---

### 25. QA Test Areas

#### 25.1 Functional QA

- shift start and finish;
- inbound draft and completion;
- manual item entry;
- scan item entry;
- duplicate validation;
- location selection;
- movement;
- staging;
- load lane assignment;
- dispatch confirmation;
- barcode scan;
- map drill-down;
- label print;
- issue report;
- report filtering;
- profile and session controls.

#### 25.2 Permission QA

Test:

- correct depot;
- wrong depot;
- correct location;
- restricted location;
- direct API access;
- hidden frontend action;
- report export;
- branch creation attempt;
- movement history deletion attempt.

#### 25.3 Negative QA

- duplicate VIN;
- unknown barcode;
- full destination;
- inactive location;
- wrong-load item;
- damaged item dispatch;
- offline duplicate sync;
- stale item location;
- missing required photo;
- printer offline;
- file too large;
- scanner disconnected;
- high-severity issue without evidence.

#### 25.4 Security QA

- cross-tenant access;
- cross-depot access;
- IDOR;
- privilege escalation;
- injection;
- XSS;
- malicious upload;
- session replay;
- offline cache extraction;
- unauthorised export.

#### 25.5 Performance QA

- rapid scan bursts;
- large inbound CSV;
- many movement records;
- high map item count;
- concurrent movements;
- large photo uploads;
- offline queue replay.

---

### 26. UAT Scenarios

#### UAT-01 — Start Work

**Given** an authorised yard attendant has an assigned shift  
**When** they start work at the correct depot  
**Then** an active work session is created.

#### UAT-02 — Receive Vehicle

**Given** a valid inbound delivery  
**When** VIN, condition, location and required evidence are entered  
**Then** the vehicle is received and appears at the selected location.

#### UAT-03 — Duplicate VIN

**Given** a vehicle VIN already exists as active inventory  
**When** the VIN is entered again  
**Then** final receipt is blocked or sent to configured review.

#### UAT-04 — Move to Full Location

**Given** a bay is at capacity  
**When** an item is moved to it  
**Then** the move is blocked with the capacity reason.

#### UAT-05 — Wrong Load Lane

**Given** an item belongs to Load A  
**When** it is scanned into Load B’s lane  
**Then** the assignment is blocked.

#### UAT-06 — Dispatch with Hold Issue

**Given** a load has an unresolved critical issue  
**When** the attendant marks it dispatched  
**Then** dispatch is blocked.

#### UAT-07 — Offline Movement

**Given** the device is offline  
**When** an authorised move is captured  
**Then** it is queued and synced once when connectivity returns.

#### UAT-08 — Sync Conflict

**Given** an item was moved by another user before offline sync  
**When** the queued move syncs  
**Then** the system creates a conflict instead of overwriting state.

#### UAT-09 — Critical Damage Report

**Given** a trailer has critical damage  
**When** the issue is submitted  
**Then** supervisors are alerted and the trailer is placed on hold according to policy.

#### UAT-10 — Label Reprint

**Given** an existing label is reprinted  
**When** print succeeds  
**Then** the reprint is recorded with user, printer and time.

#### UAT-11 — Depot Restriction

**Given** the attendant has Sydney Depot access only  
**When** they request Melbourne inventory via direct API  
**Then** access is denied.

#### UAT-12 — Finish Work with Pending Sync

**Given** unsynced actions exist  
**When** the attendant attempts to finish work  
**Then** the system warns and applies configured completion rules.

---

### 27. Definition of Done

A feature is complete only when:

- functional requirements are implemented;
- server-side permissions exist;
- location and capacity rules are enforced;
- offline and duplicate protections are tested;
- audit events are recorded;
- loading, empty and error states exist;
- responsive behaviour is complete;
- handheld usability is verified;
- accessibility checks pass;
- automated tests pass;
- security review passes;
- QA passes;
- UAT acceptance criteria pass;
- API documentation is updated;
- user guidance is updated;
- monitoring and logs are available;
- no critical or high-severity defects remain.

---

### 28. Open Product Decisions

1. Which item types are enabled at launch?
2. Which inbound types are required?
3. Which actions must work offline?
4. What is the maximum offline queue age?
5. Which scanners and printer models will be supported?
6. Are attendants allowed to create holding areas or load lanes?
7. Can attendants mark loads dispatched, or only prepare them?
8. Which issue categories automatically create holds?
9. Which evidence is mandatory by item type and severity?
10. What are the dwell-time thresholds?
11. Which dangerous-goods standards and storage rules apply?
12. Is geofenced shift start required?
13. Are attendants allowed to export reports?
14. Which identifiers are globally unique versus depot unique?
15. What is the official location hierarchy?
16. Is gate-system integration required?
17. Is weighbridge integration required?
18. Can users transfer inventory across depots directly or only request it?
19. What is the movement correction workflow?
20. What data retention applies to scans, movements and evidence?

---

### 29. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Wrong physical location recorded | Inventory inaccuracy | Scan location and server validation |
| Duplicate offline action | Duplicate movement | Idempotency keys and sync reconciliation |
| Item placed in restricted area | Safety/compliance risk | Location-category hard rules |
| Dispatch with missing item | Customer and operational failure | Item-level dispatch checklist |
| Scanner or printer outage | Operational delay | Manual fallback and retry queue |
| Cross-depot data leakage | Security breach | Server-side scope enforcement |
| Stale map occupancy | Wrong movement decision | Refresh state and authoritative validation |
| Incomplete damage evidence | Dispute risk | Configurable mandatory evidence |
| High volume movement history | Performance degradation | Partitioning, pagination and archiving |
| Untrained user performs restricted action | Safety risk | Certification checks and RBAC |

---

### 30. Suggested Yard Attendant Permission Matrix

| Module / Action | Yard Attendant Default |
|---|---|
| Start / Finish Work | Allow |
| View Dashboard | Allow |
| Create Inbound Receipt | Allow |
| Save Inbound Draft | Allow |
| Complete Inbound | Allow |
| Search Stock | Allow |
| View Item Details | Allow |
| Move Within Depot | Allow |
| Transfer to Another Depot | Request / Conditional |
| View Staging Areas | Allow |
| Assign Item to Staging | Allow |
| Create Holding Area | Deny |
| View Load Lanes | Allow |
| Move Item to Lane | Allow |
| Create Load Lane | Deny |
| Mark Lane Ready | Conditional |
| View Vehicles | Allow |
| Add Vehicle | Deny |
| Edit Vehicle Compliance | Deny |
| View Locations | Allow |
| Create Branch / Location | Deny |
| View Loads | Allow |
| Create Load | Deny |
| Change Driver Assignment | Deny |
| View Activities | Allow |
| Export Activities | Conditional |
| Scan In / Out | Allow |
| View Yard Map | Allow |
| Mark Dispatched | Conditional |
| Print Labels | Allow |
| View Reports | Allow |
| Export Reports | Conditional |
| Report Issue | Allow |
| Resolve Issue | Deny |
| Manage Roles | Deny |
| View Finance / Payroll | Deny |

---

### 31. Sample Validation Messages

- “VIN already exists in active inventory.”
- “This location is full.”
- “You do not have access to Zone D.”
- “Dangerous goods cannot be stored in this location.”
- “The item is currently recorded at another location. Refresh before moving.”
- “This item belongs to Load LD-3987 and cannot be added to Lane 2.”
- “Required condition photos are missing.”
- “This load has an unresolved critical issue.”
- “The selected trailer is on hold.”
- “Printer is offline. The job has been queued.”
- “Barcode could not be recognised.”
- “This offline action conflicts with a newer server movement.”
- “You cannot finish work while unsynced critical actions remain.”

---

### 32. Sample Movement Audit Event

```json
{
  "eventId": "MOV-100245",
  "tenantId": "TEN-001",
  "branchId": "SYD-HO",
  "depotId": "SYD-DEPOT",
  "action": "move_completed",
  "actorId": "YA-0017",
  "actorRole": "YARD_ATTENDANT",
  "itemId": "ITEM-ABC123",
  "fromLocationId": "YARD-A-R4-B12-P01",
  "toLocationId": "LANE-1",
  "loadId": "LD-3985",
  "reason": "Move to assigned load lane",
  "deviceId": "ZEBRA-TC52-019",
  "timestampUtc": "2026-08-05T09:45:00Z",
  "syncState": "synced",
  "correlationId": "COR-..."
}
```

---

### 33. Sign-Off

| Stakeholder | Name | Status | Date |
|---|---|---|---|
| Product Owner |  | Pending |  |
| Operations Lead |  | Pending |  |
| Yard Manager |  | Pending |  |
| Warehouse Manager |  | Pending |  |
| Technical Lead |  | Pending |  |
| Security Reviewer |  | Pending |  |
| QA Lead |  | Pending |  |
| Client Representative |  | Pending |  |

---


---

## Part 8 — Accounts Portal Detailed PRD

**Source classification:** Authoritative Accounts Portal PRD; exact duplicate file copies were removed.

### Hero Logistics — Accounts Portal Product Requirements Document (PRD)

**Document Version:** 1.0  
**Product Area:** Accounts Portal  
**Platform:** Hero Logistics Transport & Fleet Management System  
**Primary Role:** Accounts Manager / Accounts User  
**Prepared Date:** 05 August 2026  
**Document Status:** Ready for Product, Design, Development, QA and UAT  
**Primary Currency:** AUD  
**Primary Timezone:** Australia/Sydney unless overridden by company settings  

---

#### 1. Document Purpose

This Product Requirements Document defines the complete requirements for the **Hero Logistics Accounts Portal**.

The Accounts Portal is the financial operations workspace used to:

- review and approve invoices;
- send invoices to customers;
- record and allocate customer payments;
- process payroll;
- manage contractor payments;
- manage employee pay runs;
- review and reimburse expenses;
- track GST and PAYG obligations;
- view Profit & Loss reporting;
- analyse vehicle costs;
- generate and schedule reports;
- manage profile, security and preferences.

All customer names, invoice references, dates, amounts, payroll figures and sample values shown in UI references are illustrative and must be replaced with live data.

---

#### 2. Product Vision

Provide finance and accounts teams with a secure, auditable and highly accurate financial operations portal that connects billing, payments, payroll, expenses, tax obligations and profitability in one workflow-driven system.

The portal must reduce manual spreadsheet work, prevent duplicate or incorrect transactions, improve cash collection visibility and maintain complete financial auditability.

---

#### 3. Product Goals

##### 3.1 Primary Goals

1. Standardise invoice review and approval.
2. Improve visibility into sent, paid, part-paid and overdue invoices.
3. Enable reliable payment allocation and reconciliation.
4. Support controlled payroll and pay-run processing.
5. Separate contractor claims from employee payroll.
6. Streamline expense approval and reimbursement.
7. Track GST, PAYG and statutory obligations.
8. Provide real-time P&L and vehicle cost visibility.
9. Maintain strict financial permissions and audit logs.
10. Support export, reporting and scheduled delivery.

##### 3.2 Success Metrics

| Metric | Target |
|---|---:|
| Invoice approval error rate | Less than 0.5% |
| Duplicate invoice creation | 0 |
| Duplicate payment allocation | 0 |
| Payment allocation accuracy | 99.9% |
| Payroll calculation accuracy | 99.9% |
| Financial action audit coverage | 100% |
| Report generation success | 99.5% |
| Dashboard load time | Under 3 seconds |
| List filtering response | Under 2 seconds |
| Unauthorised financial access | 0 |
| Export accuracy | 100% against filtered data |
| Overdue invoice visibility | Real-time after due-date breach |

---

#### 4. User Roles

##### 4.1 Accounts Manager

Primary portal user with access to invoice review, payment allocation, payroll, expenses, tax and reports, subject to role permissions.

##### 4.2 Accounts Officer

Operational finance user who may:

- create or edit draft invoices;
- record payments;
- process expenses;
- prepare payroll;
- run reports.

Approval rights may be restricted.

##### 4.3 Payroll Officer

Focused role for:

- timesheet review;
- pay-run preparation;
- employee pay;
- contractor pay;
- PAYG and superannuation summaries.

##### 4.4 Finance Manager

Senior role with approval rights for:

- invoices;
- payment refunds;
- pay runs;
- contractor claims;
- tax lodgement;
- financial reports.

##### 4.5 Company Admin

May configure:

- users;
- roles;
- accounting integrations;
- tax settings;
- invoice settings;
- company details;
- payment accounts.

##### 4.6 Auditor / Read-Only

Read-only access to authorised financial records, reports and audit history.

---

#### 5. Role and Permission Model

Permissions must be enforced at frontend and backend.

Suggested permission keys:

- `accounts.dashboard.view`
- `accounts.invoice.create`
- `accounts.invoice.edit`
- `accounts.invoice.review`
- `accounts.invoice.approve`
- `accounts.invoice.send`
- `accounts.invoice.hold`
- `accounts.invoice.reject`
- `accounts.invoice.export`
- `accounts.payment.view`
- `accounts.payment.create`
- `accounts.payment.allocate`
- `accounts.payment.edit`
- `accounts.payment.refund`
- `accounts.payment.reconcile`
- `accounts.payroll.view`
- `accounts.payroll.create`
- `accounts.payroll.approve`
- `accounts.payroll.process`
- `accounts.payroll.cancel`
- `accounts.contractor.view`
- `accounts.contractor.create`
- `accounts.contractor.approve`
- `accounts.contractor.pay`
- `accounts.employee_pay.view`
- `accounts.employee_pay.create`
- `accounts.employee_pay.approve`
- `accounts.expense.view`
- `accounts.expense.create`
- `accounts.expense.approve`
- `accounts.expense.reject`
- `accounts.expense.reimburse`
- `accounts.tax.view`
- `accounts.tax.prepare`
- `accounts.tax.lodge`
- `accounts.tax.record_payment`
- `accounts.pnl.view`
- `accounts.vehicle_cost.view`
- `accounts.report.view`
- `accounts.report.export`
- `accounts.report.schedule`
- `accounts.profile.edit`

Sensitive actions must require higher privileges or approval.

---

#### 6. Portal Navigation

1. Accounts Dashboard
2. Invoice Review
3. Sent Invoices
4. Payments
5. Payroll
6. Contractor Pay
7. Employee Pay
8. Expenses
9. GST / PAYG
10. P&L
11. Vehicle Costs
12. Reports
13. Profile

Shared header:

- logo;
- portal name;
- quick search;
- notification count;
- unread messages count where enabled;
- user avatar;
- role label;
- account menu;
- logout;
- timezone display.

---

### 7. Functional Requirements

#### 7.1 Accounts Dashboard

##### 7.1.1 Purpose

Provide a real-time summary of receivables, payroll, expenses, cash flow and profitability.

##### 7.1.2 Dashboard Date Control

The dashboard must support:

- current period;
- comparison period;
- custom date range;
- weekly;
- monthly;
- quarterly;
- financial year;
- branch;
- company;
- currency where multi-currency is enabled.

##### 7.1.3 KPI Cards

Required KPIs:

- Draft Invoices
- In Review
- Sent Invoices
- Paid Invoices
- Overdue Invoices
- Payroll Due
- Expenses Pending
- Gross Margin

Each card should support:

- count or amount;
- comparison value;
- trend indicator;
- click-through;
- last updated time.

##### 7.1.4 Dashboard Sections

- Invoice Status Overview
- Invoices & Payments Trend
- Overdue Invoices
- Upcoming Payroll
- Expenses Summary
- Cash Flow Overview
- Profit & Loss Summary
- Recent Activity

##### 7.1.5 Dashboard Requirements

| ID | Requirement | Priority |
|---|---|---|
| ACC-DASH-001 | Dashboard must show current financial operational KPIs. | Must |
| ACC-DASH-002 | Date range must update all compatible widgets. | Must |
| ACC-DASH-003 | KPI click-through must open filtered module views. | Should |
| ACC-DASH-004 | Overdue invoices must be clearly highlighted. | Must |
| ACC-DASH-005 | Payroll due date and amount must be visible. | Must |
| ACC-DASH-006 | Dashboard values must reconcile with source modules. | Must |
| ACC-DASH-007 | Financial figures must display currency. | Must |
| ACC-DASH-008 | Last refresh time must be visible. | Must |

##### 7.1.6 Acceptance Criteria

- User can view invoice, payroll, expense and margin summary.
- Date range changes update dashboard values.
- Overdue invoice card opens the overdue invoices list.
- Figures match underlying records.
- Unauthorised financial data is hidden.

---

#### 7.2 Invoice Review

##### 7.2.1 Purpose

Review, verify and approve invoices before sending to customers.

##### 7.2.2 Invoice Statuses

- Draft
- In Review
- Ready to Send
- On Hold
- Rejected
- Sent
- Part Paid
- Paid
- Overdue
- Cancelled
- Voided

##### 7.2.3 Summary Cards

- Draft Invoices
- In Review
- Ready to Send
- On Hold
- Rejected
- Total In Review

##### 7.2.4 Filters

- invoice number;
- customer;
- load/reference;
- invoice type;
- status;
- invoice date;
- due date;
- branch;
- date range;
- amount range;
- created by.

##### 7.2.5 Invoice Table

Columns:

- selection checkbox;
- invoice number;
- customer;
- invoice date;
- due date;
- reference/load number;
- type;
- subtotal;
- GST;
- total;
- status;
- actions.

##### 7.2.6 Invoice Types

- Freight
- Accessorial
- Fuel Surcharge
- Storage
- Waiting Time
- Damage / Repair
- Other configured types

##### 7.2.7 Invoice Detail

Header:

- invoice number;
- status;
- customer;
- invoice date;
- due date;
- reference/load;
- subtotal;
- GST;
- total;
- invoice type.

Tabs:

- Items
- Attachments
- Notes
- History

##### 7.2.8 Invoice Items

Fields:

- description;
- quantity;
- unit rate;
- amount excluding GST;
- GST rate;
- GST amount;
- total including GST;
- account code;
- tax code;
- source reference.

##### 7.2.9 Invoice Actions

- Approve & Send
- Save & Mark Ready
- Hold Invoice
- Reject Invoice
- Edit Draft
- Duplicate
- Export PDF
- Download Attachments
- Add Note

##### 7.2.10 Invoice Validation

Before approval:

- customer must be active;
- customer billing details must exist;
- invoice number must be unique;
- invoice date must be valid;
- due date must be valid;
- at least one line item must exist;
- subtotal must equal line-item total;
- GST must match configured tax rules;
- total must reconcile;
- linked load/reference must be valid where required;
- mandatory documents must exist;
- duplicate billing check must pass.

##### 7.2.11 Approval Rules

1. Draft may be edited.
2. In Review requires reviewer action.
3. Ready to Send may be sent by authorised users.
4. On Hold requires reason.
5. Reject requires reason.
6. Sent invoices cannot be freely edited.
7. Correction after send must use credit note, void or controlled amendment.
8. Approval and sending must be audited.

##### 7.2.12 Requirements

| ID | Requirement | Priority |
|---|---|---|
| ACC-INV-001 | Users can create and edit draft invoices. | Must |
| ACC-INV-002 | Invoices must support review and approval workflow. | Must |
| ACC-INV-003 | GST calculations must be system validated. | Must |
| ACC-INV-004 | Duplicate invoice detection must run before save. | Must |
| ACC-INV-005 | Approved invoices can be sent electronically. | Must |
| ACC-INV-006 | Hold and reject actions require reason. | Must |
| ACC-INV-007 | Sent invoices must become controlled records. | Must |
| ACC-INV-008 | Invoice history must be immutable. | Must |
| ACC-INV-009 | Bulk actions must validate every selected invoice. | Should |
| ACC-INV-010 | PDF invoice must use configured company template. | Must |

---

#### 7.3 Sent Invoices

##### 7.3.1 Purpose

Manage all invoices sent to customers and monitor collection status.

##### 7.3.2 Summary Metrics

- Sent Invoices
- Paid Invoices
- Part Paid
- Overdue
- Average Days to Pay
- Collection Rate
- Total Including GST

##### 7.3.3 Filters

- invoice number;
- customer;
- reference;
- invoice type;
- status;
- date range;
- aging bucket;
- branch;
- amount range.

##### 7.3.4 Table Columns

- invoice number;
- customer;
- invoice date;
- due date;
- invoice amount;
- amount paid;
- outstanding amount;
- status;
- days outstanding;
- actions.

##### 7.3.5 Aging Buckets

- Current
- 0–30 Days
- 31–60 Days
- 61–90 Days
- 90+ Days

##### 7.3.6 Actions

- view invoice;
- resend invoice;
- send reminder;
- download PDF;
- view payment history;
- create statement;
- record dispute;
- place on hold;
- create credit note;
- export.

##### 7.3.7 Collection Rules

- invoice becomes overdue after due date if outstanding amount > 0;
- part-paid invoices remain open;
- full payment marks invoice paid;
- overpayment must not reduce invoice below zero;
- credit note allocation must be recorded;
- reminders follow configured schedule;
- customer communication must be logged.

##### 7.3.8 Requirements

| ID | Requirement | Priority |
|---|---|---|
| ACC-SENT-001 | Sent invoices must show payment and aging status. | Must |
| ACC-SENT-002 | Outstanding amount must update after allocation. | Must |
| ACC-SENT-003 | Reminder history must be stored. | Should |
| ACC-SENT-004 | Statements must use authorised invoice data only. | Must |
| ACC-SENT-005 | Aging summary must reconcile with invoice list. | Must |
| ACC-SENT-006 | Overdue days must calculate from due date. | Must |

---

#### 7.4 Payments

##### 7.4.1 Purpose

Track incoming customer payments, allocate funds and manage refunds.

##### 7.4.2 Payment Statuses

- Allocated
- Partially Allocated
- Unallocated
- Overpayment
- Refunded
- Partially Refunded
- Reversed
- Failed

##### 7.4.3 Summary Metrics

- Payments Received
- Unallocated Payments
- Overpayments
- Refunds
- Average Days to Pay
- Collection Rate

##### 7.4.4 Filters

- payment reference;
- customer;
- invoice number;
- payment method;
- status;
- date range;
- amount;
- bank account;
- branch.

##### 7.4.5 Table Columns

- payment date;
- payment reference;
- customer;
- invoices paid;
- payment method;
- amount received;
- allocated amount;
- unallocated amount;
- status;
- action.

##### 7.4.6 Payment Methods

- Bank Transfer
- EFT
- Credit Card
- Cash
- Cheque
- Direct Debit
- Other configured method

##### 7.4.7 Payment Details

- payment reference;
- customer;
- date;
- method;
- amount;
- notes;
- bank/account;
- created by;
- created on;
- allocated invoices;
- notes;
- history.

##### 7.4.8 Payment Allocation

The user may allocate one payment to:

- one invoice;
- multiple invoices;
- partial invoice amount;
- credit balance;
- customer account.

The system must validate:

- allocated total does not exceed payment amount;
- invoice belongs to the customer;
- invoice is open;
- duplicate allocation is prevented;
- allocation currency matches;
- closed financial period rules are respected.

##### 7.4.9 Refund Workflow

1. User selects refundable payment or credit.
2. System calculates available refundable amount.
3. User enters amount and reason.
4. User selects payment method/account.
5. Approval is required where configured.
6. Refund is processed or recorded.
7. Payment and invoice balances are updated.
8. Audit log is created.
9. Customer notification may be sent.

##### 7.4.10 Refund Rules

- cannot refund more than available amount;
- refund requires reason;
- processed refunds cannot be deleted;
- failed refunds must retain gateway or bank response;
- manual refund status requires proof or reference;
- high-value refunds may require dual approval.

##### 7.4.11 Reconciliation

Support:

- payment-to-invoice reconciliation;
- bank statement import;
- manual reconciliation;
- reconciliation status;
- unmatched transaction queue;
- duplicate bank transaction detection;
- reconciliation report.

##### 7.4.12 Requirements

| ID | Requirement | Priority |
|---|---|---|
| ACC-PAY-001 | Users can record incoming payments. | Must |
| ACC-PAY-002 | Payments can be allocated across invoices. | Must |
| ACC-PAY-003 | Unallocated amount must calculate automatically. | Must |
| ACC-PAY-004 | Overpayment must create customer credit. | Must |
| ACC-PAY-005 | Refunds must follow controlled approval. | Must |
| ACC-PAY-006 | Duplicate payment reference detection must run. | Must |
| ACC-PAY-007 | Reconciliation history must be retained. | Must |
| ACC-PAY-008 | Payment edits after reconciliation must be restricted. | Must |

---

#### 7.5 Payroll

##### 7.5.1 Purpose

Manage payroll periods, timesheets, deductions, approvals and payments.

##### 7.5.2 Payroll Statuses

- Draft
- Pending Approval
- Approved
- Processing
- Paid
- Failed
- Cancelled

##### 7.5.3 Summary Metrics

- Upcoming Payroll
- Employees Paid
- Total Payroll
- Taxes & Deductions
- Net Pay
- Payroll YTD

##### 7.5.4 Filters

- week ending;
- payroll type;
- pay group;
- employment type;
- status;
- branch;
- created by;
- date range.

##### 7.5.5 Payroll Table

- week ending;
- pay group/branch;
- payroll type;
- employees;
- gross pay;
- deductions;
- net pay;
- status;
- created by;
- created on;
- action.

##### 7.5.6 Payroll Components

- Base Pay
- Allowances
- Overtime
- Reimbursements
- Bonus
- Commission
- PAYG
- Superannuation
- Salary Sacrifice
- Other Deductions
- Net Pay

##### 7.5.7 Payroll Workflow

1. Create payroll period.
2. Import or retrieve timesheets.
3. Validate hours, rates and employment status.
4. Calculate gross pay.
5. Calculate deductions.
6. Calculate net pay.
7. Review exceptions.
8. Submit for approval.
9. Approve payroll.
10. Generate payment file.
11. Process payment.
12. Generate payslips.
13. Record PAYG and super liabilities.
14. Mark paid.
15. Lock payroll period.

##### 7.5.8 Payroll Validation

- employee active during period;
- pay rate exists;
- timesheet approved;
- duplicate timesheet not included;
- overtime policy applied;
- leave accounted for;
- deductions valid;
- bank details valid;
- negative net pay blocked unless explicitly allowed;
- payroll totals reconcile.

##### 7.5.9 Payroll Requirements

| ID | Requirement | Priority |
|---|---|---|
| ACC-PR-001 | Users can create payroll runs. | Must |
| ACC-PR-002 | Payroll must calculate gross, deductions and net pay. | Must |
| ACC-PR-003 | Approval must be separate from creation where configured. | Must |
| ACC-PR-004 | Paid payroll must be locked. | Must |
| ACC-PR-005 | Payslips must be generated per employee. | Must |
| ACC-PR-006 | Payment files must be generated securely. | Should |
| ACC-PR-007 | Payroll must maintain complete calculation history. | Must |
| ACC-PR-008 | Failed employee payments must be individually traceable. | Must |
| ACC-PR-009 | Payroll cancellation must require reason. | Must |
| ACC-PR-010 | Sensitive payroll fields must be masked. | Must |

---

#### 7.6 Contractor Pay

##### 7.6.1 Purpose

Review contractor claims, approve payments and track disbursements.

##### 7.6.2 Statuses

- Draft
- Pending Approval
- Approved
- Scheduled
- Paid
- Overdue
- Rejected
- Cancelled

##### 7.6.3 Summary Metrics

- Total Payable
- Approved
- Pending Approval
- Paid
- Overdue Payments
- Period Growth

##### 7.6.4 Table Columns

- claim number;
- contractor;
- load/reference;
- claim date;
- amount excluding GST;
- GST;
- total;
- status;
- payment method;
- action.

##### 7.6.5 Claim Details

- contractor;
- load/reference;
- claim date;
- payment method;
- bank name;
- masked account;
- line items;
- documents;
- notes;
- history.

##### 7.6.6 Claim Validation

- contractor must be active;
- ABN and payment details required;
- duplicate claim check;
- linked load must exist where required;
- line-item total must reconcile;
- GST rules must be applied;
- supporting document must exist where configured;
- bank details must be protected;
- approved claim cannot be edited without controlled reversal.

##### 7.6.7 Actions

- Approve Claim
- Edit Claim
- Reject Claim
- Schedule Payment
- Mark Paid
- Export
- Bulk Actions

##### 7.6.8 Requirements

| ID | Requirement | Priority |
|---|---|---|
| ACC-CON-001 | Users can create contractor claims. | Must |
| ACC-CON-002 | Claims must support approval workflow. | Must |
| ACC-CON-003 | GST must be calculated according to contractor tax setup. | Must |
| ACC-CON-004 | Duplicate claim detection must run. | Must |
| ACC-CON-005 | Paid claims must be locked. | Must |
| ACC-CON-006 | Contractor bank details must be encrypted and masked. | Must |
| ACC-CON-007 | Bulk payment preparation must support validation. | Should |

---

#### 7.7 Employee Pay

##### 7.7.1 Purpose

Manage employee pay runs, timesheets, deductions and employee payments.

##### 7.7.2 Summary Metrics

- Total Net Pay
- Upcoming Pay Run
- Employees Paid
- Taxes & Deductions
- Superannuation
- Payroll YTD

##### 7.7.3 Pay Run Table

- pay run number;
- pay period;
- frequency;
- employees;
- gross pay;
- deductions;
- net pay;
- status;
- created by;
- created on;
- action.

##### 7.7.4 Pay Run Detail

- pay run number;
- employee count;
- department;
- pay period;
- frequency;
- creator;
- summary;
- employees;
- deductions;
- payments;
- gross pay;
- net pay;
- super;
- line items.

##### 7.7.5 Actions

- Create Pay Run
- Import Timesheets
- Approve Pay Run
- Edit Pay Run
- Delete Draft
- Export
- Bulk Actions

##### 7.7.6 Requirements

| ID | Requirement | Priority |
|---|---|---|
| ACC-EMP-001 | Pay runs must be uniquely numbered. | Must |
| ACC-EMP-002 | Draft pay runs may be edited or deleted. | Must |
| ACC-EMP-003 | Approved pay runs require controlled reversal to change. | Must |
| ACC-EMP-004 | Employee-level calculations must be available. | Must |
| ACC-EMP-005 | Timesheet imports must provide row-level validation. | Must |
| ACC-EMP-006 | Pay-run totals must reconcile to employee totals. | Must |

---

#### 7.8 Expenses

##### 7.8.1 Purpose

Track, review, approve and reimburse expenses.

##### 7.8.2 Statuses

- Draft
- Pending Approval
- Approved
- Rejected
- Reimbursed
- Overdue
- Cancelled

##### 7.8.3 Payment Status

- Unpaid
- Scheduled
- Paid
- Reimbursed
- Failed

##### 7.8.4 Summary Metrics

- Total Expenses
- Pending Approval
- Approved
- Reimbursed
- Overdue
- Period Comparison

##### 7.8.5 Expense Table

- date;
- description;
- category;
- employee/contractor;
- reference/receipt;
- amount excluding GST;
- GST;
- total;
- approval status;
- payment status;
- action.

##### 7.8.6 Expense Categories

- Fuel
- Tolls
- Parking
- Repairs
- Maintenance
- Accommodation
- Meals
- Office
- Phone
- Insurance
- Other configured categories

##### 7.8.7 Receipt Capture

- JPG;
- PNG;
- PDF;
- maximum size configurable;
- malware scanning;
- OCR optional;
- original file retained;
- upload timestamp;
- uploader identity;
- receipt hash.

##### 7.8.8 Expense Workflow

1. Create expense.
2. Upload receipt.
3. Enter category and claimant.
4. Enter GST details.
5. Submit for approval.
6. Reviewer approves or rejects.
7. Approved expense enters reimbursement queue.
8. Payment is processed.
9. Expense marked reimbursed.
10. Audit and payment history stored.

##### 7.8.9 Expense Rules

- receipt mandatory above configured threshold;
- duplicate receipt detection;
- GST must be validated;
- claimant must be active;
- rejected expense requires reason;
- approval limits by role;
- self-approval may be blocked;
- paid expense cannot be deleted.

##### 7.8.10 Requirements

| ID | Requirement | Priority |
|---|---|---|
| ACC-EXP-001 | Users can create and submit expenses. | Must |
| ACC-EXP-002 | Receipt upload must be supported. | Must |
| ACC-EXP-003 | Approval limits must be configurable. | Must |
| ACC-EXP-004 | Duplicate receipt detection should be supported. | Should |
| ACC-EXP-005 | Reimbursement status must be tracked. | Must |
| ACC-EXP-006 | Paid expenses must be locked. | Must |
| ACC-EXP-007 | Bulk approval must validate permission and limits. | Should |

---

#### 7.9 GST / PAYG

##### 7.9.1 Purpose

Track GST liabilities, credits, PAYG withholding and lodgement obligations.

##### 7.9.2 Summary Metrics

- GST Collected
- GST Credits
- Net GST Payable
- PAYG Withholding
- Outstanding Liabilities
- YTD Net GST Payable

##### 7.9.3 Tabs

- GST Obligations
- PAYG Withholding
- Activity History

##### 7.9.4 Filters

- financial year;
- from date;
- to date;
- status;
- branch;
- entity.

##### 7.9.5 GST Obligation Table

- BAS period;
- period end;
- due date;
- GST collected;
- GST credits;
- net GST;
- status;
- lodgement date;
- action.

##### 7.9.6 Statuses

- Draft
- Preparing
- Ready
- Due Soon
- Lodged
- Paid
- Overdue
- Amended

##### 7.9.7 Actions

- Prepare BAS
- Lodge with ATO
- Record GST Payment
- PAYG Payment
- View
- Export

##### 7.9.8 Tax Rules

- calculations must be based on posted transactions only;
- GST codes must be configurable;
- locked periods cannot be edited without authorised adjustment;
- lodgement requires approval;
- ATO submission response must be stored;
- amendment must preserve original submission;
- tax payment reference must be retained.

##### 7.9.9 Requirements

| ID | Requirement | Priority |
|---|---|---|
| ACC-TAX-001 | GST collected and credits must derive from transactions. | Must |
| ACC-TAX-002 | Net GST must calculate automatically. | Must |
| ACC-TAX-003 | PAYG withholding must reconcile with payroll. | Must |
| ACC-TAX-004 | Lodgement workflow must be permission controlled. | Must |
| ACC-TAX-005 | Lodged periods must be locked. | Must |
| ACC-TAX-006 | Amendments must retain prior values. | Must |
| ACC-TAX-007 | Tax actions must be fully audited. | Must |

---

#### 7.10 Profit & Loss

##### 7.10.1 Purpose

Display business income, cost of sales, operating expenses and profitability.

##### 7.10.2 Summary Metrics

- Net Profit
- Total Revenue
- Total Expenses
- Gross Profit
- Gross Profit Margin

##### 7.10.3 Views

- P&L Statement
- Monthly Trend
- Comparison
- YTD Overview

##### 7.10.4 Controls

- financial year;
- period;
- comparison period;
- show percentage;
- branch;
- company;
- export.

##### 7.10.5 P&L Structure

###### Revenue

- Freight Income
- Surcharges & Fuel Recovery
- Storage Income
- Accessorial Income
- Other Income
- Total Revenue

###### Cost of Sales

- Driver Costs
- Fuel Costs
- Contractor Costs
- Vehicle Costs
- Tolls & Road Charges
- Other Direct Costs
- Total Cost of Sales

###### Gross Profit

- Gross Profit
- Gross Profit Margin

###### Operating Expenses

- Administration
- Marketing
- Depreciation
- Insurance
- Office
- Other Expenses
- Total Operating Expenses

###### Net Profit

- Net Profit
- Net Profit Margin

##### 7.10.6 Requirements

| ID | Requirement | Priority |
|---|---|---|
| ACC-PNL-001 | P&L must derive from posted financial transactions. | Must |
| ACC-PNL-002 | Current and comparison periods must be supported. | Must |
| ACC-PNL-003 | Users can drill down to source transactions. | Should |
| ACC-PNL-004 | Branch and consolidated views must be supported. | Should |
| ACC-PNL-005 | Export must match displayed values. | Must |
| ACC-PNL-006 | Closed-period values must remain stable. | Must |

---

#### 7.11 Vehicle Costs

##### 7.11.1 Purpose

Track operating costs for trucks, trailers and other assets.

##### 7.11.2 Summary Metrics

- Total Vehicle Costs
- Fuel Costs
- Maintenance & Repairs
- Tyres
- Insurance
- Other Costs

##### 7.11.3 Tabs

- Vehicle Summary
- Transactions
- Upcoming Costs
- Service History

##### 7.11.4 Filters

- vehicle;
- registration;
- vehicle type;
- date;
- branch;
- category;
- cost range.

##### 7.11.5 Vehicle Summary Columns

- vehicle;
- type;
- registration/ID;
- total cost excluding GST;
- total cost including GST;
- cost per kilometre;
- cost per day;
- comparison percentage;
- action.

##### 7.11.6 Cost Categories

- Fuel
- Maintenance
- Repairs
- Tyres
- Registration
- Insurance
- Tolls
- Cleaning
- Depreciation
- Finance
- Other

##### 7.11.7 Vehicle Cost Rules

- cost transaction may link to vehicle, trailer or asset;
- odometer may be required;
- duplicate supplier invoice must be detected;
- scheduled cost may become actual transaction;
- cost per km requires valid distance;
- cost allocations must be auditable;
- expenses and supplier bills may feed this module.

##### 7.11.8 Requirements

| ID | Requirement | Priority |
|---|---|---|
| ACC-VEH-001 | Vehicle costs must aggregate by asset and category. | Must |
| ACC-VEH-002 | Cost per km and cost per day must be calculated. | Should |
| ACC-VEH-003 | Upcoming costs must support due-date alerts. | Should |
| ACC-VEH-004 | Source transaction drill-down must be available. | Must |
| ACC-VEH-005 | Vehicle cost totals must reconcile to P&L accounts. | Must |
| ACC-VEH-006 | Trailer costs must be separately supported. | Must |

---

#### 7.12 Reports

##### 7.12.1 Purpose

Provide financial, payroll, compliance, vehicle and custom reports.

##### 7.12.2 Summary Metrics

- Reports Generated
- Scheduled Reports
- Last Report Run
- Exports
- Data Updated

##### 7.12.3 Categories

- Financial
- Compliance
- Operations
- Payroll
- Vehicle & Assets
- Custom

##### 7.12.4 Standard Reports

- Profit & Loss Statement
- Balance Sheet
- Cash Flow Statement
- Accounts Receivable Aging
- Accounts Payable Aging
- GST Summary
- PAYG Withholding
- Payroll Summary
- Employee Payroll Detail
- Contractor Payments
- Expense Summary
- Vehicle Cost
- Invoice Register
- Payment Reconciliation
- Customer Statement
- Cash Collection
- Refund Report
- Audit Report

##### 7.12.5 Report Functions

- run report;
- select period;
- apply filters;
- preview;
- export PDF;
- export Excel;
- save favourite;
- schedule;
- email;
- download;
- duplicate custom report.

##### 7.12.6 Scheduled Reports

Schedule fields:

- report;
- frequency;
- run time;
- timezone;
- date rule;
- recipients;
- output format;
- active/inactive;
- failure notification.

##### 7.12.7 Requirements

| ID | Requirement | Priority |
|---|---|---|
| ACC-RPT-001 | Users can run authorised reports. | Must |
| ACC-RPT-002 | Reports must respect role and branch scope. | Must |
| ACC-RPT-003 | PDF and Excel export must be supported. | Must |
| ACC-RPT-004 | Scheduled reports must validate recipients. | Must |
| ACC-RPT-005 | Report parameters must be stored in history. | Must |
| ACC-RPT-006 | Custom reports require explicit permission. | Should |
| ACC-RPT-007 | Generated reports must include timestamp and currency. | Must |

---

#### 7.13 Profile

##### 7.13.1 Tabs

- Personal Information
- Security
- Preferences
- Notifications

##### 7.13.2 Personal Information

- profile photo;
- full name;
- job title;
- email;
- phone;
- mobile;
- date of birth;
- preferred language;
- timezone;
- address.

##### 7.13.3 Company Information

Read-only by default:

- company name;
- verification status;
- ABN;
- ACN;
- industry;
- phone;
- email;
- website;
- address.

##### 7.13.4 Account Summary

- role;
- user ID;
- department;
- joined date;
- last login.

##### 7.13.5 Security

- change password;
- 2FA;
- active sessions;
- login history;
- revoke session;
- logout all devices.

##### 7.13.6 Requirements

| ID | Requirement | Priority |
|---|---|---|
| ACC-PRO-001 | User can edit permitted personal details. | Must |
| ACC-PRO-002 | Email and phone changes require verification. | Must |
| ACC-PRO-003 | User can manage password and 2FA. | Must |
| ACC-PRO-004 | User can view active sessions. | Must |
| ACC-PRO-005 | Company financial identity is read-only by default. | Must |
| ACC-PRO-006 | Profile changes must be audited. | Must |

---

### 8. End-to-End Workflows

#### 8.1 Invoice-to-Cash

1. Invoice created from load or manually.
2. Invoice saved as Draft.
3. Reviewer verifies line items, GST and customer details.
4. Invoice moves to In Review.
5. Invoice is approved.
6. Invoice marked Ready to Send.
7. Invoice PDF generated.
8. Invoice sent to customer.
9. Invoice status becomes Sent.
10. Payment received.
11. Payment allocated.
12. Invoice becomes Part Paid or Paid.
13. Unpaid invoice becomes Overdue after due date.
14. Reminder or statement may be sent.
15. Full history retained.

---

#### 8.2 Payment Reconciliation

1. Payment imported or manually recorded.
2. Customer is matched.
3. Candidate invoices are suggested.
4. User allocates payment.
5. System validates allocation.
6. Remaining amount becomes unallocated or customer credit.
7. Reconciliation completed.
8. Invoice balances update.
9. Audit and reconciliation history stored.

---

#### 8.3 Payroll Processing

1. Payroll run created.
2. Timesheets imported.
3. Employee data validated.
4. Gross and deductions calculated.
5. Exceptions reviewed.
6. Payroll submitted.
7. Approver approves.
8. Payment file generated.
9. Payments processed.
10. Payslips generated.
11. PAYG and super liabilities recorded.
12. Payroll marked Paid and locked.

---

#### 8.4 Contractor Claim

1. Claim created.
2. Load/reference linked.
3. Supporting documents uploaded.
4. GST calculated.
5. Claim submitted.
6. Reviewer approves or rejects.
7. Approved claim scheduled for payment.
8. Payment processed.
9. Claim marked Paid.
10. Audit trail retained.

---

#### 8.5 Expense Reimbursement

1. Employee submits expense.
2. Receipt uploaded.
3. Expense reviewed.
4. Approver approves or rejects.
5. Approved expense enters reimbursement queue.
6. Payment processed.
7. Expense marked Reimbursed.
8. Transaction flows to P&L and GST reports.

---

#### 8.6 BAS / PAYG Preparation

1. System aggregates posted transactions.
2. GST collected and credits calculated.
3. PAYG withholding reconciled.
4. Accounts user reviews exceptions.
5. BAS prepared.
6. Authorised user approves.
7. Lodgement sent or recorded.
8. ATO response stored.
9. Payment recorded.
10. Period locked.

---

### 9. Financial Business Rules

#### 9.1 Invoice Rules

1. Invoice number must be unique.
2. Invoice total must equal line items plus tax.
3. Sent invoices cannot be directly overwritten.
4. Credit notes must reference original invoice.
5. Rejected and held invoices require reason.
6. Duplicate load billing must be detected.
7. Currency must remain consistent per invoice.

#### 9.2 Payment Rules

1. Allocation cannot exceed received amount.
2. Allocation cannot exceed invoice outstanding amount.
3. Overpayment becomes customer credit.
4. Refund cannot exceed available balance.
5. Reconciled payments require elevated permission to modify.
6. Payment reversal must preserve original transaction.

#### 9.3 Payroll Rules

1. Approved timesheets only.
2. Employee must be active for pay period.
3. Pay rates must be effective for the period.
4. Approved payroll cannot be edited without reversal.
5. Paid payroll is locked.
6. Bank data must be encrypted.
7. Employee net pay cannot be negative unless policy allows.

#### 9.4 Tax Rules

1. Posted transactions only.
2. GST tax code required.
3. PAYG reconciles to payroll.
4. Lodged period is locked.
5. Amendment creates new version.
6. Tax submission and payment references are mandatory.

#### 9.5 Closed Financial Periods

- Transactions in closed periods cannot be edited.
- Adjustments must use authorised journal or correction workflow.
- Closed-period reports remain stable.
- Reopening requires high-level permission and audit reason.

---

### 10. Notifications and Alerts

#### 10.1 Accounts Alerts

- invoice awaiting review;
- invoice rejected;
- invoice ready to send;
- invoice overdue;
- payment unallocated;
- payment overpaid;
- refund awaiting approval;
- payroll due;
- payroll exception;
- contractor claim awaiting approval;
- expense awaiting approval;
- BAS due soon;
- PAYG due;
- scheduled report failed;
- accounting integration failed.

#### 10.2 Channels

- in-app;
- email;
- SMS where configured;
- push notification.

#### 10.3 Escalation

Configurable escalation for:

- overdue invoice days;
- unallocated payment age;
- payroll deadline;
- tax due date;
- high-value refund;
- high-value expense;
- failed bank or gateway transaction.

---

### 11. Audit Logging

Mandatory events:

- login;
- invoice creation;
- invoice edit;
- invoice approval;
- invoice send;
- invoice hold/reject;
- payment creation;
- payment allocation;
- reconciliation;
- refund;
- payroll creation;
- payroll approval;
- payroll payment;
- contractor claim action;
- expense action;
- tax preparation;
- tax lodgement;
- report generation;
- export;
- profile and security change.

Audit fields:

- event ID;
- company;
- branch;
- user;
- role;
- action;
- entity type;
- entity ID;
- before value;
- after value;
- reason;
- timestamp;
- IP;
- user agent;
- correlation ID.

Audit logs must be immutable for standard users.

---

### 12. Suggested Data Model

Core entities:

- Company
- Branch
- User
- Role
- Permission
- Customer
- CustomerContact
- Invoice
- InvoiceLine
- InvoiceAttachment
- InvoiceStatusHistory
- CreditNote
- Payment
- PaymentAllocation
- PaymentRefund
- BankTransaction
- Reconciliation
- PayrollRun
- PayrollEmployee
- PayrollEarning
- PayrollDeduction
- Payslip
- Contractor
- ContractorClaim
- ContractorClaimLine
- EmployeePayRun
- Expense
- ExpenseReceipt
- ExpenseApproval
- TaxPeriod
- GSTTransaction
- PAYGTransaction
- BASLodgement
- VehicleCost
- VehicleCostTransaction
- ReportDefinition
- ReportRun
- ReportSchedule
- Notification
- AuditLog
- FinancialPeriod
- AccountCode
- TaxCode
- Currency

---

### 13. API Requirements

Suggested endpoints:

- `/api/accounts/dashboard`
- `/api/invoices`
- `/api/invoices/:id`
- `/api/invoices/:id/review`
- `/api/invoices/:id/approve`
- `/api/invoices/:id/send`
- `/api/invoices/:id/hold`
- `/api/invoices/:id/reject`
- `/api/payments`
- `/api/payments/:id/allocate`
- `/api/payments/:id/refund`
- `/api/reconciliation`
- `/api/payroll`
- `/api/payroll/:id/approve`
- `/api/payroll/:id/process`
- `/api/contractor-claims`
- `/api/contractor-claims/:id/approve`
- `/api/employee-pay-runs`
- `/api/expenses`
- `/api/expenses/:id/approve`
- `/api/expenses/:id/reimburse`
- `/api/tax/gst`
- `/api/tax/payg`
- `/api/tax/bas`
- `/api/pnl`
- `/api/vehicle-costs`
- `/api/reports`
- `/api/profile`
- `/api/audit`

API standards:

- authentication;
- RBAC;
- branch/company scope;
- pagination;
- filtering;
- sorting;
- idempotency;
- optimistic concurrency;
- request validation;
- standard errors;
- audit hooks;
- secure uploads;
- correlation IDs;
- rate limits.

---

### 14. Integrations

Potential integrations:

- accounting software;
- payment gateway;
- bank feed;
- payroll provider;
- ATO lodgement service;
- email service;
- SMS service;
- document storage;
- PDF generation;
- antivirus scanning;
- fleet and vehicle system;
- HR and timesheet platform.

Integration requirements:

- failure visibility;
- retry handling;
- duplicate protection;
- idempotency;
- response logging;
- secure secret management;
- sync status;
- manual fallback.

---

### 15. Security Requirements

#### 15.1 Authentication

- secure password policy;
- 2FA;
- session timeout;
- refresh token rotation where used;
- brute-force protection;
- login audit;
- device/session controls.

#### 15.2 Financial Data Protection

- TLS in transit;
- encryption at rest;
- field-level encryption for bank and tax data;
- masked account numbers;
- restricted exports;
- signed document URLs;
- secure backups;
- retention policy;
- no plaintext secrets.

#### 15.3 Authorisation

- server-side RBAC;
- company isolation;
- branch scope;
- object-level permissions;
- approval limits;
- maker-checker separation;
- export permissions;
- refund permissions;
- tax permissions.

#### 15.4 Application Security

- input validation;
- SQL injection prevention;
- XSS protection;
- CSRF protection where applicable;
- secure headers;
- malware scanning;
- dependency scanning;
- audit monitoring;
- tamper detection for financial records.

---

### 16. Non-Functional Requirements

#### 16.1 Performance

- dashboard under 3 seconds;
- list filtering under 2 seconds;
- invoice detail under 2 seconds;
- payment allocation under 2 seconds;
- P&L report under 5 seconds for standard period;
- large exports processed asynchronously.

#### 16.2 Availability

- 99.9% monthly target;
- backup and restore;
- monitoring;
- integration health;
- graceful degradation.

#### 16.3 Scalability

Support:

- multiple companies;
- multiple branches;
- large invoice volumes;
- high payroll volumes;
- multi-year history;
- large report exports;
- concurrent accounts users.

#### 16.4 Accessibility

- keyboard navigation;
- semantic labels;
- accessible validation;
- colour contrast;
- focus states;
- screen-reader support;
- status not colour-only.

#### 16.5 Responsiveness

- desktop;
- tablet;
- limited mobile monitoring;
- horizontally scrollable financial tables on smaller screens;
- no data clipping;
- sticky headers where useful.

---

### 17. UX Requirements

1. Currency must always be visible.
2. GST-inclusive and GST-exclusive values must be clearly labelled.
3. Approval and destructive actions require confirmation.
4. Financial totals must reconcile visibly.
5. Validation errors must explain resolution.
6. Unsaved changes warning required.
7. Filters must persist during navigation.
8. Sensitive data must remain masked.
9. Closed-period records must show lock state.
10. Loading, empty and error states required.
11. Exported figures must match screen filters.
12. Status labels must be consistent across modules.

---

### 18. Error Handling

Standard error format:

```json
{
  "success": false,
  "code": "PAYMENT_ALLOCATION_EXCEEDS_BALANCE",
  "message": "Allocated amount exceeds the payment balance.",
  "details": {
    "paymentId": "PAY-1078",
    "availableAmount": 5280,
    "requestedAmount": 6000
  },
  "correlationId": "..."
}
```

User-facing errors must:

- explain the issue;
- preserve form data;
- show correction steps;
- never expose stack traces;
- provide retry when safe.

---

### 19. Reporting Definitions

#### 19.1 Collection Rate

`Total amount collected / Total amount due during the selected period × 100`

#### 19.2 Average Days to Pay

Average difference between invoice date and final payment date for fully paid invoices.

#### 19.3 Gross Margin

`Gross Profit / Total Revenue × 100`

#### 19.4 Net Profit Margin

`Net Profit / Total Revenue × 100`

#### 19.5 Outstanding Amount

`Invoice Total - Allocated Payments - Applied Credits`

#### 19.6 Cost per Kilometre

`Total Vehicle Cost / Distance Travelled`

---

### 20. Release Plan

#### Phase 1 — Core Accounts

- dashboard;
- invoice review;
- sent invoices;
- payments;
- payment allocation;
- expenses;
- basic reports;
- profile;
- RBAC;
- audit logs.

#### Phase 2 — Payroll and Payables

- payroll;
- employee pay;
- contractor pay;
- timesheet import;
- payslips;
- payment files;
- approval workflows.

#### Phase 3 — Compliance and Financial Reporting

- GST/PAYG;
- BAS preparation;
- P&L;
- vehicle costs;
- scheduled reports;
- reconciliation.

#### Phase 4 — Advanced Automation

- bank feeds;
- automated matching;
- reminder automation;
- OCR receipt capture;
- anomaly detection;
- cash-flow forecasting;
- advanced custom reports.

---

### 21. Out of Scope for Initial Release

Unless separately approved:

- full general ledger;
- advanced journal entry module;
- fixed asset register;
- inventory accounting;
- multi-entity consolidation;
- foreign exchange revaluation;
- statutory tax advice;
- direct banking without approval controls;
- automatic tax lodgement without authorised confirmation.

---

### 22. QA Test Areas

#### 22.1 Functional

- invoice creation;
- approval;
- sending;
- overdue calculation;
- payment allocation;
- partial payment;
- overpayment;
- refund;
- payroll calculation;
- contractor claim;
- expense approval;
- GST calculation;
- P&L totals;
- vehicle cost calculation;
- exports;
- scheduled reports.

#### 22.2 Negative Testing

- duplicate invoice;
- invalid GST;
- payment over-allocation;
- duplicate payment;
- excessive refund;
- payroll without rate;
- payroll with missing bank account;
- duplicate expense receipt;
- closed-period edit;
- unauthorised approval;
- invalid report recipient.

#### 22.3 Permission Testing

- direct URL access;
- direct API access;
- company isolation;
- branch restriction;
- hidden button bypass;
- export restriction;
- refund restriction;
- payroll restriction;
- tax lodgement restriction.

#### 22.4 Security Testing

- IDOR;
- injection;
- XSS;
- CSRF;
- session attacks;
- privilege escalation;
- insecure file upload;
- data leakage;
- sensitive logs;
- token replay.

#### 22.5 Performance Testing

- large invoice dataset;
- large payment import;
- payroll for many employees;
- large expense upload;
- multi-year P&L;
- large report export;
- concurrent approvals.

---

### 23. UAT Scenarios

#### UAT-01 — Invoice Approval

**Given** a valid invoice is In Review  
**When** an authorised user approves and sends it  
**Then** the invoice becomes Sent, PDF is generated and history is recorded.

#### UAT-02 — Duplicate Invoice

**Given** an invoice already exists for the same unique reference  
**When** another invoice is created  
**Then** the system warns or blocks according to policy.

#### UAT-03 — Partial Payment

**Given** an open invoice  
**When** a partial payment is allocated  
**Then** status becomes Part Paid and outstanding balance updates.

#### UAT-04 — Overpayment

**Given** payment exceeds invoice outstanding amount  
**When** allocation is completed  
**Then** excess becomes customer credit.

#### UAT-05 — Refund Control

**Given** a refundable payment exists  
**When** a user requests more than available  
**Then** refund is blocked.

#### UAT-06 — Payroll Approval

**Given** payroll is Draft  
**When** it is submitted and approved  
**Then** status becomes Approved and calculation history is retained.

#### UAT-07 — Closed Period

**Given** a financial period is closed  
**When** a user attempts to edit a transaction  
**Then** the action is blocked.

#### UAT-08 — Expense Approval

**Given** a pending expense with receipt  
**When** an authorised reviewer approves it  
**Then** it moves to reimbursement queue.

#### UAT-09 — BAS Lodgement

**Given** tax period is prepared and approved  
**When** authorised user lodges it  
**Then** lodgement response is stored and period locks.

#### UAT-10 — Report Export

**Given** filters are applied  
**When** report is exported  
**Then** exported totals match the filtered screen.

---

### 24. Definition of Done

A feature is complete only when:

- functional requirements are implemented;
- server-side permissions exist;
- financial calculations are tested;
- audit logs are written;
- loading, empty and error states exist;
- responsive design is complete;
- accessibility checks pass;
- automated tests pass;
- security review passes;
- QA passes;
- UAT passes;
- API documentation is updated;
- user documentation is available;
- monitoring is configured;
- no critical or high-severity defects remain.

---

### 25. Open Product Decisions

1. Which accounting platform will integrate?
2. Is Xero, MYOB or QuickBooks required?
3. Is direct ATO lodgement required?
4. Which payment gateway is used?
5. Is bank-feed integration required?
6. What approval limits apply?
7. Is dual approval required for refunds?
8. Which payroll engine is authoritative?
9. Is Single Touch Payroll required?
10. How are contractor tax rules configured?
11. Are financial periods manually closed?
12. Is multi-currency required?
13. Are customer statements automatic?
14. Are overdue reminders automatic?
15. What receipt threshold requires attachment?
16. Which users may view bank details?
17. Which users may export payroll data?
18. Are branch-level P&L reports required?
19. Which vehicle cost source systems are authoritative?
20. What retention period applies to financial records?

---

### 26. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Duplicate billing | Customer dispute | Duplicate detection |
| Incorrect GST | Compliance issue | Tax validation |
| Payment misallocation | Incorrect receivables | Controlled allocation |
| Payroll error | Employee impact | Validation and approval |
| Refund fraud | Financial loss | Dual approval and audit |
| Sensitive data exposure | Privacy breach | Encryption and masking |
| Closed-period changes | Reporting inconsistency | Period locking |
| Integration failure | Delayed processing | Retry and manual fallback |
| Incorrect P&L mapping | Bad decisions | Account-code validation |
| Unauthorised exports | Data leakage | Export permission controls |

---

### 27. Appendix A — Default Permission Matrix

| Action | Accounts Officer | Accounts Manager | Finance Manager | Auditor |
|---|---:|---:|---:|---:|
| View Dashboard | Yes | Yes | Yes | Yes |
| Create Invoice | Yes | Yes | Yes | No |
| Approve Invoice | No | Yes | Yes | No |
| Send Invoice | Conditional | Yes | Yes | No |
| Record Payment | Yes | Yes | Yes | No |
| Allocate Payment | Yes | Yes | Yes | No |
| Issue Refund | No | Conditional | Yes | No |
| Create Payroll | Conditional | Yes | Yes | No |
| Approve Payroll | No | Conditional | Yes | No |
| Create Contractor Claim | Yes | Yes | Yes | No |
| Approve Contractor Claim | No | Yes | Yes | No |
| Approve Expense | Conditional | Yes | Yes | No |
| Prepare BAS | No | Yes | Yes | No |
| Lodge BAS | No | No | Yes | No |
| View P&L | Conditional | Yes | Yes | Yes |
| Export Reports | Conditional | Yes | Yes | Conditional |
| View Audit Logs | No | Conditional | Yes | Yes |

---

### 28. Appendix B — Example Audit Event

```json
{
  "eventId": "AUD-ACC-10021",
  "companyId": "COMP-001",
  "branchId": "SYD-HO",
  "module": "payments",
  "action": "payment_refund_approved",
  "actorId": "USR-10024",
  "actorRole": "FINANCE_MANAGER",
  "entityType": "payment",
  "entityId": "PAY-1078",
  "before": {
    "refundedAmount": 0
  },
  "after": {
    "refundedAmount": 1250
  },
  "reason": "Duplicate customer payment",
  "timestampUtc": "2026-08-05T10:10:00Z",
  "ipAddress": "203.26.45.12",
  "correlationId": "COR-..."
}
```

---

### 29. Sign-Off

| Stakeholder | Name | Status | Date |
|---|---|---|---|
| Product Owner |  | Pending |  |
| Finance Lead |  | Pending |  |
| Accounts Lead |  | Pending |  |
| Payroll Lead |  | Pending |  |
| Technical Lead |  | Pending |  |
| Security Reviewer |  | Pending |  |
| QA Lead |  | Pending |  |
| Client Representative |  | Pending |  |

---
---

## Part 9 — Final Consolidated Implementation Governance

### 9.1 One-System Rule

All portals must operate on shared authoritative records rather than separate portal-specific copies. A load, customer, driver, vehicle, trailer, inventory item, invoice, payment or compliance record must retain the same canonical identity across every authorised portal.

### 9.2 Shared Backend Enforcement

Frontend role menus are not security controls. Every API must enforce:

- tenant/company scope;
- branch/depot scope;
- authenticated role;
- explicit action permission;
- record-level access;
- status-transition rules;
- data sensitivity and masking;
- audit requirements.

### 9.3 Cross-Portal Transaction Integrity

Actions that affect multiple domains must be transactional or use reliable event processing. Examples include:

- load activation and resource reservation;
- inbound receipt and first inventory location;
- movement completion and capacity adjustment;
- dispatch confirmation and active-load transition;
- completed load and invoice eligibility;
- payment allocation and invoice balance;
- payroll posting and PAYG/super liabilities.

### 9.4 Shared Naming and Status Registry

Engineering must maintain a canonical registry for:

- roles;
- permissions;
- load statuses;
- inventory statuses;
- movement statuses;
- lane and staging statuses;
- driver and asset statuses;
- compliance statuses;
- invoice and payment statuses;
- payroll and expense statuses.

Portal labels may differ for usability, but backend values and transition rules must remain consistent.

### 9.5 Final QA Requirement

The final release must include:

- portal-level functional tests;
- cross-portal integration tests;
- tenant and branch isolation tests;
- direct API permission tests;
- concurrent-edit tests;
- offline sync and idempotency tests where applicable;
- financial reconciliation tests;
- tax and payroll validation tests;
- audit completeness tests;
- responsive and accessibility tests;
- backup and recovery verification;
- performance and load testing;
- security assessment and remediation.

### 9.6 Final Sign-Off

| Stakeholder | Name | Status | Date |
|---|---|---|---|
| Product Owner |  | Pending |  |
| SaaS / Super Admin Lead |  | Pending |  |
| Company Administration Lead |  | Pending |  |
| Dispatch Operations Lead |  | Pending |  |
| Driver Operations Lead |  | Pending |  |
| Warehouse Operations Lead |  | Pending |  |
| Yard Operations Lead |  | Pending |  |
| Accounts / Finance Lead |  | Pending |  |
| Sales / CRM Lead |  | Pending |  |
| Customer Portal Lead |  | Pending |  |
| Technical Lead |  | Pending |  |
| Security Reviewer |  | Pending |  |
| QA Lead |  | Pending |  |
| Client Representative |  | Pending |  |

---

**END OF FINAL HERO LOGISTICS MASTER PRD**
