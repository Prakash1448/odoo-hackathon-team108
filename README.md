DealFlow360 — Intelligent, Self-Governing Sales Operations Platform

1. Project Overview

DealFlow360 is an end-to-end B2B Sales Operations Platform designed to go beyond a simple quote-to-invoice workflow.

The platform manages:

Multi-tier discount governance and automated approval routing

Live upsell and cross-sell recommendations

Multi-warehouse fulfillment splitting and backorder handling

Hybrid billing with one-time products and recurring subscriptions

Deal health monitoring and anomaly alerts

Customer-facing quotation negotiation

Sales configuration and reporting dashboards

The main objective is to create a self-governing deal engine that enforces pricing discipline, reacts to inventory availability, manages recurring and one-time billing together, and gives sales representatives and customers a live quotation experience.

2. Problem We Solve

Real-world B2B sales are more complex than simply creating a quotation and generating an invoice.

DealFlow360 handles practical situations such as:

A sales representative gives a discount above the allowed threshold.

The quotation must automatically move through the correct approval chain.

Different product categories can have different discount limits.

Products may be available across multiple warehouses.

One order may contain both physical one-time products and recurring subscriptions.

Customers may negotiate quotation lines directly through a secure portal.

Negotiation changes can trigger approval again.

Managers need visibility into stalled or risky deals.

Sales representatives need intelligent upsell and cross-sell recommendations while building a quotation.

3. Technology Stack

Frontend

React.js

JavaScript / JSX

HTML5

CSS3

Responsive UI

REST API integration

Role-based routing and protected views

Kanban-style sales pipeline

Customer portal

Backend

Python

FastAPI

RESTful APIs

JWT-based authentication

Role-based authorization

Pydantic validation

Business-rule/service layer

Automatic approval routing

Discount risk calculation

Warehouse allocation logic

Subscription/proration logic

Deal health and anomaly detection

Database

MySQL

Relational data model

Foreign-key relationships

Transactional consistency

Indexed search/filter fields

Audit/history storage

Architecture

                 ┌──────────────────────┐
                 │      React Frontend  │
                 │                      │
                 │ Rep Workspace        │
                 │ Manager Dashboard    │
                 │ Customer Portal      │
                 │ Admin Configuration  │
                 └──────────┬───────────┘
                            │ REST API / JSON
                            ▼
                 ┌──────────────────────┐
                 │   FastAPI Backend    │
                 │                      │
                 │ Auth & RBAC          │
                 │ Quotation Engine     │
                 │ Approval Engine      │
                 │ Recommendation Logic │
                 │ Fulfillment Engine   │
                 │ Billing Engine       │
                 │ Deal Health Engine   │
                 │ Reporting APIs       │
                 └──────────┬───────────┘
                            │ SQL / ORM
                            ▼
                 ┌──────────────────────┐
                 │       MySQL DB       │
                 │                      │
                 │ Users & Roles        │
                 │ Customers            │
                 │ Products             │
                 │ Quotations           │
                 │ Approvals            │
                 │ Warehouses            │
                 │ Inventory             │
                 │ Subscriptions        │
                 │ Payments & Invoices  │
                 │ Audit Logs           │
                 └──────────────────────┘

4. User Roles

Sales Representative

The Sales Representative can:

Log in

View customers

Create quotations

Add products

Change quantities

Apply line/order discounts

View live margin impact

Receive upsell/cross-sell suggestions

Track approval status

Track fulfillment

Respond to customer negotiations

Sales Manager / Approver

The Sales Manager can:

Review quotations requiring approval

Approve quotations

Reject quotations

Return quotations for revision

Configure discount tiers

Configure approval chains

Monitor deal health

Review risky or stalled deals

Finance / Operations User

The Finance / Operations user can:

Handle second-level approvals

Manage warehouse fulfillment splits

Handle backorders

Reconcile recurring billing

Handle credit-note/refund workflows

Customer / Portal User

The Customer has access only to the customer-facing portal and can:

View quotations

View quotation status

Comment on quotation lines

Request changes

Counter a discount

Submit negotiation requests

Confirm final quotation terms

The customer must not have access to internal sales/admin screens.

Admin

The Admin can:

Manage products

Manage price lists

Configure discount tiers

Configure approval chains

Manage warehouses

Manage stock settings

Configure subscription plans

Configure upsell/cross-sell rules

View platform-wide analytics and reports

5. Major Modules

Module 1 — Authentication & Role-Based Access

Frontend

Login page

Signup page for internal users

Customer portal login

Protected routes

Role-specific navigation

Session/logout handling

Backend

User registration

Login API

Password hashing

JWT token generation/validation

Role-based authorization middleware/dependencies

Customer portal authorization

Internal-user authorization

Database

Main entities:

users

roles

customers

user/customer relationships

6. Sales Backend / Configuration

6.1 Product & Price List Management

Product information

Each product can contain:

Name

Category

Price

Unit

Tax

Description

Product attributes/variants

Product variants

Support:

Attributes

Attribute values

Extra prices

Price lists

Support:

Customer-tier pricing

Currency-specific pricing rules

Suggested tables

products
product_categories
product_variants
price_lists
price_list_items
taxes

7. Discount Governance & Approval Engine

This is one of the core business-logic components of DealFlow360.

Discount Configuration

The system supports:

Customer-tier discount ceilings

Category-specific discount ceilings

Approval levels

Approval chains

Example:

Bronze Customer → 5%
Silver Customer → 10%
Gold Customer   → 15%

A category can have a stricter limit.

Example:

Hardware → 15%
Services → 10%

Blended Discount Risk Score

The system does not only check the overall quotation discount.

Every quotation line is checked against its applicable limit.

Example:

Gold Customer
Allowed customer discount = 15%

Laptop / Hardware
Discount = 12%
Allowed = 15%
Result = OK

Setup Service / Service
Discount = 18%
Allowed = 10%
Result = 8% over limit

The quotation therefore requires approval.

The system also considers the combined pattern of smaller violations across multiple lines so that several small exceptions cannot silently create a large margin loss.

Approval Flow

Quotation Created
       │
       ▼
Calculate Discount Risk
       │
       ├── Within Limits ───────► Continue
       │
       └── Above Limits
               │
               ▼
        Sales Manager Approval
               │
        ┌──────┴──────┐
        ▼             ▼
     Approved       Rejected
        │
        ▼
Finance Approval
(if required)
        │
        ▼
    Fulfillment

Audit Trail

Every approval-related action records:

User

Timestamp

Action

Reason

Previous state

New state

Suggested tables:

discount_tiers
category_discount_rules
approval_chains
approval_requests
approval_actions
audit_logs

8. Sales Representative Workspace

Quotation List

The frontend displays quotations as cards containing:

Customer

Quotation amount

Stage/status

Example:

Acme Corp
Draft

Beta Industries
Pending Approval

Selecting a quotation opens the quotation builder.

Pipeline

A Kanban-style pipeline can display stages such as:

Draft
   ↓
Pending Approval
   ↓
Approved
   ↓
Sent
   ↓
Under Negotiation
   ↓
Confirmed
   ↓
Fulfillment
   ↓
Billing
   ↓
Completed

9. Quotation Builder

The quotation builder is the central sales workspace.

Frontend Features

Sales representative can:

Select customer

Select products

Change quantity

Apply line discount

Apply order discount

View totals

View live margin

See upsell/cross-sell suggestions

Submit quotation for approval

Move directly to fulfillment when approval is not required

Backend Responsibilities

The backend calculates:

Product price

Customer-tier price

Discount

Tax

Line total

Order total

Margin

Discount risk

Approval requirement

Important: Pricing and approval rules are calculated in the backend and are not trusted from frontend input.

10. Upsell & Cross-Sell Engine

While building a quotation, the system provides ranked recommendations.

Recommendations can be based on:

Historical co-purchase data

Active promotions

Minimum margin threshold

Each suggestion displays:

Product

Margin delta

Promotion indicator

Actions:

[ Add to Quote ]
[ Dismiss ]

After adding an item:

Quotation
   ↓
Order Total recalculated
   ↓
Margin recalculated
   ↓
Discount/Risk recalculated if required

Suggested tables:

product_relationships
promotions
recommendation_rules

11. Multi-Warehouse Fulfillment

After quotation approval, the system checks inventory across warehouses.

Example:

Order requires: 100 units

Main Warehouse → 60
East Depot     → 40

Total          → 100

The system recommends a warehouse split based on:

Available stock

Shipment count

Shipping cost weighting

Frontend

Display:

Warehouse

Quantity

Shipment count

Estimated shipping cost

Actions:

[ Accept Suggested Split ]
[ Manual Override ]

Backorder

If the required quantity cannot be fulfilled immediately:

Available Stock
       ↓
Fulfill Available Quantity
       ↓
Remaining Quantity
       ↓
Backorder

When stock becomes available, the system can prompt:

Consolidate Remaining Backorder

Suggested tables:

warehouses
inventory
warehouse_stock
warehouse_rules
fulfillment_orders
fulfillment_lines
backorders

12. Hybrid Billing & Subscriptions

One order can contain both:

One-time products

Laptop
Installation Hardware

Recurring products

Monthly Support
Annual Subscription

The system keeps both within the same order while maintaining separate billing behavior.

Subscription Plans

Support:

Monthly

Quarterly

Yearly

The system also supports:

Mid-cycle quantity changes

Plan changes

Proration

Cancellation

Partial refund

Credit-note trigger

Billing Flow

Order
 ├── One-Time Lines
 │       ↓
 │   One-Time Invoice
 │
 └── Recurring Lines
         ↓
    Subscription
         ↓
    Billing Schedule

Suggested tables:

subscription_plans
subscriptions
subscription_lines
billing_schedules
invoices
invoice_lines
payments
credit_notes

13. Customer Portal Negotiation

The customer receives a separate customer-facing quotation portal.

The portal displays:

Quotation details

Current status

Line items

Comments

Change requests

Counter discount field

Possible status:

Sent
Under Negotiation
Confirmed

Negotiation Flow

Sales Rep sends quotation
          ↓
Customer opens portal
          ↓
Customer requests change
          ↓
Customer counters discount
          ↓
System recalculates risk
          │
          ├── Within threshold → Continue
          │
          └── Above threshold
                    ↓
             Approval Flow
                    ↓
              Manager/Finance

If the final negotiated terms exceed the configured thresholds, the quotation automatically re-enters the approval process.

If no additional approval is required, the order moves directly to fulfillment.

14. Deal Health & Anomaly Dashboard

Managers receive real-time visibility into risky deals.

Stalled Deal Detection

A quotation becomes stalled when it has been inactive for more than the configured number of days.

Example:

Quote inactive > configured threshold
                 ↓
             STALLED
                 ↓
          Manager Alert

Discount Anomaly Detection

The system can identify a discount significantly above a sales representative's historical average.

Example:

Rep historical average = 7%
Current discount        = 18%

→ Discount Anomaly

Delivery Promise Slippage

The dashboard identifies orders where expected delivery may be delayed.

Alert Actions

Managers can:

Open related quotation

Review risk

Trigger automated nudge

Trigger escalation

15. Reporting

The backend provides reporting and dashboard APIs.

Filters include:

Period

Sales Team

Sales Representative

Approval Status

Product

Category

Example:

Period:
Today / Week / Custom

Approval:
Pending / Approved / Rejected

Product:
Product / Category

Sales:
Team / Representative

Export requirements:

PDF

XLS

16. MySQL Database Design

The database is designed around the complete sales lifecycle.

Core Entities

Users
Roles
Customers
Products
Categories
Product Variants
Price Lists
Discount Tiers
Approval Chains
Quotations
Quotation Lines
Approval Requests
Approval Actions
Warehouses
Inventory
Fulfillment Orders
Backorders
Subscription Plans
Subscriptions
Billing Schedules
Invoices
Payments
Credit Notes
Negotiations
Comments
Promotions
Product Relationships
Audit Logs
Deal Alerts

High-Level Relationships

User ─────────────── Customer
 │
 └── Role

Customer ─────────── Quotations
                         │
                         └── Quotation Lines
                                  │
                                  └── Products
                                         │
                                         └── Categories

Quotation ─────────── Approval Requests
                         │
                         └── Approval Actions

Quotation ─────────── Fulfillment
                         │
                         ├── Warehouse
                         ├── Inventory
                         └── Backorder

Quotation ─────────── Subscription
                         │
                         └── Billing Schedule

Quotation ─────────── Invoice
                         │
                         └── Payment

Quotation ─────────── Negotiation
                         │
                         └── Comments

Quotation ─────────── Deal Alerts

17. Backend Project Structure

Recommended FastAPI structure:

backend/
│
├── app/
│   ├── main.py
│   │
│   ├── api/
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── customers.py
│   │   ├── products.py
│   │   ├── quotations.py
│   │   ├── approvals.py
│   │   ├── recommendations.py
│   │   ├── warehouses.py
│   │   ├── fulfillment.py
│   │   ├── subscriptions.py
│   │   ├── billing.py
│   │   ├── negotiations.py
│   │   ├── dashboard.py
│   │   └── reports.py
│   │
│   ├── models/
│   ├── schemas/
│   ├── services/
│   │   ├── pricing_service.py
│   │   ├── discount_service.py
│   │   ├── approval_service.py
│   │   ├── recommendation_service.py
│   │   ├── fulfillment_service.py
│   │   ├── subscription_service.py
│   │   ├── billing_service.py
│   │   └── deal_health_service.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── permissions.py
│   │
│   └── database/
│       ├── connection.py
│       └── migrations/
│
├── tests/
├── requirements.txt
└── README.md

18. Frontend Project Structure

Recommended React structure:

frontend/
│
├── src/
│   ├── components/
│   ├── pages/
│   │   ├── Login/
│   │   ├── Dashboard/
│   │   ├── Quotations/
│   │   ├── QuotationBuilder/
│   │   ├── Approvals/
│   │   ├── Fulfillment/
│   │   ├── Subscriptions/
│   │   ├── Billing/
│   │   ├── Negotiation/
│   │   ├── Customers/
│   │   ├── Products/
│   │   └── Reports/
│   │
│   ├── services/
│   │   └── api.js
│   │
│   ├── context/
│   ├── hooks/
│   ├── routes/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
│
├── package.json
└── README.md

19. API Design

The frontend communicates with FastAPI through REST APIs.

Authentication

POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout

Customers

GET  /api/customers
GET  /api/customers/{id}
POST /api/customers
PUT  /api/customers/{id}

Products

GET  /api/products
GET  /api/products/{id}
POST /api/products
PUT  /api/products/{id}

Quotations

GET  /api/quotations
GET  /api/quotations/{id}
POST /api/quotations
PUT  /api/quotations/{id}
POST /api/quotations/{id}/submit
POST /api/quotations/{id}/confirm

Approval

GET  /api/approvals/pending
GET  /api/approvals/{id}
POST /api/approvals/{id}/approve
POST /api/approvals/{id}/reject
POST /api/approvals/{id}/return

Recommendations

GET /api/quotations/{id}/recommendations
POST /api/quotations/{id}/recommendations/{product_id}/accept

Fulfillment

GET  /api/orders/{id}/warehouse-split
POST /api/orders/{id}/warehouse-split/accept
POST /api/orders/{id}/warehouse-split/override

Negotiation

GET  /api/portal/quotations/{id}
POST /api/portal/quotations/{id}/request-change
POST /api/portal/quotations/{id}/counter-discount
POST /api/portal/quotations/{id}/confirm

Dashboard

GET /api/dashboard/deal-health
GET /api/dashboard/anomalies
GET /api/dashboard/stalled-deals

20. Security & Access Control

DealFlow360 follows a strict role-based access model.

Internal Users

Sales Representatives, Sales Managers, Finance/Operations users, and Admins receive access according to their responsibilities.

Customer

The Customer has a separate restricted portal.

The customer cannot access:

Internal configuration

Internal dashboards

Approval screens

Warehouse administration

Internal reports

Other customers' quotations

Backend authorization is enforced on APIs, not only through frontend route hiding.

21. End-to-End Business Flow

1. User Login
      ↓
2. Admin Configuration
      ↓
3. Sales Rep Creates Quotation
      ↓
4. Add Products
      ↓
5. Apply Discounts
      ↓
6. Calculate Margin
      ↓
7. Generate Upsell/Cross-Sell Suggestions
      ↓
8. Calculate Discount Risk
      ↓
9. Approval Required?
      │
      ├── NO ──────────────┐
      │                    │
      └── YES              │
           ↓               │
      Sales Manager        │
           ↓               │
      Finance if needed    │
           ↓               │
           └───────────────┘
                    ↓
10. Warehouse Allocation
                    ↓
11. Split / Backorder
                    ↓
12. Subscription Billing Schedule
                    ↓
13. Customer Negotiation
                    ↓
14. Recalculate Approval if terms changed
                    ↓
15. Customer Confirmation
                    ↓
16. Fulfillment
                    ↓
17. Invoice / Subscription Billing
                    ↓
18. Payment
                    ↓
19. Deal Health & Reporting

22. Quick Demo Flow

The implementation is designed to demonstrate the complete core logic.

Flow 1 — Discount Approval

Login as Sales Representative.

Create quotation.

Add a product.

Apply a discount above the allowed threshold.

Submit quotation.

System automatically creates the required approval.

Login as Sales Manager.

Approve/reject the quotation.

Audit trail records the action.

Flow 2 — Upsell + Fulfillment + Billing

Create quotation.

Add one-time product.

View upsell recommendation.

Add recommended product.

Verify margin and total update.

Approve quotation.

View warehouse split.

Accept split across warehouses.

Add recurring subscription line.

Confirm billing schedule.

Complete fulfillment/billing.

Flow 3 — Customer Negotiation

Send quotation to customer.

Login through customer portal.

Customer requests line-level change.

Customer proposes higher discount.

System recalculates risk.

If threshold is exceeded, quotation automatically returns to approval.

Sales Manager reviews.

Customer confirms final quotation.

23. Seed Data

The application should include sample data so the complete workflow can be demonstrated immediately.

Example:

Customers

Acme Corp       → Gold
Beta Industries → Silver

Products

Laptop              → Hardware
Setup Service       → Service
Monthly Support     → Subscription

Discount Rules

Bronze → 5%
Silver → 10%
Gold   → 15%

Hardware → 15%
Service  → 10%

Warehouses

Main Warehouse
East Depot

Subscription Plans

Monthly
Quarterly
Yearly

24. Business Rules Are Implemented in the Backend

The core rules are implemented as application logic rather than being faked for the demo.

Important rules include:

Discount ceiling calculation

Category-specific discount limits

Blended discount risk

Automatic approval routing

Approval escalation

Audit logging

Customer negotiation re-approval

Warehouse stock allocation

Warehouse split optimization

Backorder handling

Subscription billing schedule

Proration

Refund/credit-note triggers

Margin calculation

Deal health detection

Discount anomaly detection

25. Testing Strategy

Testing focuses on both APIs and business logic.

Unit Tests

Test:

Discount calculations

Risk score

Approval routing

Margin calculation

Warehouse allocation

Subscription proration

Anomaly detection

API Tests

Test:

Authentication

Role authorization

Quotation APIs

Approval APIs

Fulfillment APIs

Billing APIs

Customer portal APIs

End-to-End Tests

Verify:

Login
→ Quotation
→ Discount
→ Approval
→ Fulfillment
→ Billing
→ Customer Negotiation
→ Re-approval
→ Confirmation

26. Installation

Backend

cd backend

python -m venv venv

Windows

venv\Scripts\activate

Linux/macOS

source venv/bin/activate

Install dependencies:

pip install -r requirements.txt

Configure environment variables:

DATABASE_URL=mysql+pymysql://USER:PASSWORD@localhost/dealflow360
SECRET_KEY=your-secret-key

Run the API:

uvicorn app.main:app --reload

27. Frontend

cd frontend
npm install
npm run dev

The React application communicates with the FastAPI backend through REST APIs.

28. MySQL Setup

Create the database:

CREATE DATABASE dealflow360;

Configure the backend connection using environment variables.

Run migrations or initialize the schema according to the backend migration setup.

Load seed data for:

Customers

Products

Price lists

Discount tiers

Approval chains

Warehouses

Inventory

Subscription plans

Sample quotations

29. Project Deliverables

DealFlow360 provides the major deliverables expected from the problem:

Working frontend

Working backend

MySQL relational database

Sample seed data

Role-based access control

Quotation workflow

Automated discount approval

Upsell/cross-sell recommendations

Warehouse fulfillment splitting

Backorder handling

Hybrid billing

Subscription/proration logic

Customer negotiation portal

Deal health dashboard

Reporting

Audit trail

Architecture documentation

End-to-end demo flows

30. Why DealFlow360 Is Different

DealFlow360 is not just a quotation management UI.

It acts as a self-governing sales engine.

Instead of allowing users to manually handle every business decision, the system automatically reacts to the state of the deal.

Discount too high?
        ↓
Automatic approval

Stock split across warehouses?
        ↓
Automatic fulfillment recommendation

Customer negotiates?
        ↓
Risk recalculated

Negotiated discount too high?
        ↓
Approval triggered again

Subscription quantity changes?
        ↓
Proration calculated

Deal becomes inactive?
        ↓
Health alert

Unusual discount?
        ↓
Anomaly alert

This makes the system closer to a real production B2B sales operation than a simple CRUD quotation application.

31. Future Enhancements

With additional development time, the platform can be extended with:

Multi-company support

Multi-currency support

Advanced machine-learning recommendation models

More sophisticated sales forecasting

Advanced anomaly detection

Email/notification integrations

Real payment gateway integration

Advanced analytics

Mobile sales application

Real-time WebSocket notifications

Advanced customer communication

More intelligent inventory forecasting

32. Final Architecture Summary

                         DEALFLOW360
                              │
              ┌───────────────┴───────────────┐
              │                               │
       INTERNAL USERS                    CUSTOMER
              │                               │
     ┌────────┴────────┐              ┌───────┴───────┐
     │                 │              │               │
 Sales Rep          Manager       Portal Login   Negotiation
     │                 │              │               │
     └────────┬────────┘              └───────┬───────┘
              │                               │
              └──────────────┬────────────────┘
                             │
                        React Frontend
                             │
                         REST / JSON
                             │
                        FastAPI Backend
                             │
       ┌──────────┬──────────┼──────────┬───────────┐
       │          │          │          │           │
    Pricing   Approval   Fulfillment  Billing   Analytics
       │          │          │          │           │
       └──────────┴──────────┼──────────┴───────────┘
                             │
                           MySQL
                             │
       ┌──────────┬──────────┼──────────┬───────────┐
       │          │          │          │           │
    Sales      Inventory  Approvals  Billing     Audit
    Data                                  Data      Logs

33. Conclusion

DealFlow360 provides a complete B2B sales lifecycle:

Quotation → Discount Governance → Approval → Upsell/Cross-Sell → Fulfillment → Subscription Billing → Customer Negotiation → Re-Approval → Payment → Deal Health → Reporting

The solution focuses on the most important part of the challenge: correct business logic and end-to-end workflow, supported by a React frontend, FastAPI backend, and MySQL database.

License

This project is developed as part of the Odoo Hackathon.
