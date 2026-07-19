# D4U Enterprise Accounting API Contract & Event Architecture

**Version**: 1.0
**Status**: ARCHITECTURE DESIGN
**Domain**: Accounting API & Internal Event Engine

---

## SECTION 1: Architecture Overview

The Accounting Engine sits at the foundation of the D4U ERP Monolith. It uses a hybrid communication strategy:
1. **API Layer**: Exposes synchronous REST endpoints for frontend clients (e.g., creating accounts, viewing balance sheets, posting manual journals).
2. **Accounting Service**: The core domain logic that validates debits/credits, enforces period locks, and saves ledgers via ACID transactions.
3. **Posting Engine**: A specialized background worker that translates arbitrary business events into strict accounting debits and credits using the `SystemAccountMapping`.
4. **Event Bus**: Powered by `EventEmitter2` (synchronous in-memory) or `BullMQ` (asynchronous durable queues). The central nervous system where other modules broadcast that something happened.
5. **Reporting Layer**: Read-optimized services that aggregate millions of ledger lines into structured financial statements (P&L, Trial Balance).

---

## SECTION 2: REST API Contract

All endpoints are prefixed with `/api/v1/accounting/`.

### Chart of Accounts
- `GET /accounts`: List all accounts (supports tree view, filtering by active status).
- `GET /accounts/:id`: Get a specific account and its opening balance.
- `POST /accounts`: Create a new leaf account or account group.
- `PATCH /accounts/:id`: Update name/code. Cannot change the root type.
- `DELETE /accounts/:id`: Soft delete an account. **Fails 422 Unprocessable Entity** if any Journal Entry Lines exist against it.

### Journal Entries
- `GET /journals`: List all journals (Sales, Purchase, General).
- `GET /journal-entries`: List entries with pagination and filtering by date/reference.
- `POST /journal-entries`: Post a **Manual Journal Entry** (e.g., depreciation, accruals). Payload requires at least two lines where debit = credit.
- `POST /journal-entries/:id/reverse`: Generates a reversal entry for a posted journal.

### Core Configuration
- `GET /fiscal-years` | `POST /fiscal-years`
- `GET /accounting-periods` | `PATCH /accounting-periods/:id/close`
- `GET /currencies` | `POST /currencies`
- `GET /exchange-rates` | `POST /exchange-rates`
- `GET /cost-centers` | `POST /cost-centers`
- `GET /profit-centers` | `POST /profit-centers`

### System Account Mappings
- `GET /system-accounts`: View current bindings.
- `PUT /system-accounts`: Update mapping (e.g., map `SALES_REVENUE_ACCOUNT` to Account ID `4010`).

### Financial Reports
- `GET /reports/trial-balance`: Returns debit/credit totals per account.
- `GET /reports/balance-sheet`: Returns hierarchical Asset = Liability + Equity.
- `GET /reports/profit-and-loss`: Returns Revenue minus Expenses.
- `GET /reports/cash-flow`: Returns movements partitioned by Operating, Investing, Financing.
- `GET /reports/general-ledger`: Detailed chronological ledger lines for a specific `account_id` and date range.

---

## SECTION 3: Internal Events

The Event Bus acts as the bridge between operational modules and the Accounting Engine.

- `ORDER_COMPLETED`: POS/Online checkout finalized.
- `ORDER_CANCELLED`: An order was voided.
- `PAYMENT_RECEIVED`: Customer pays an outstanding invoice.
- `PAYMENT_REFUNDED`: Customer receives money back.
- `PURCHASE_RECEIVED`: Inventory physically arrives via PO.
- `PURCHASE_RETURNED`: Inventory returned to vendor.
- `INVENTORY_ADJUSTED`: Stock count audits (surplus/missing).
- `PAYROLL_PROCESSED`: Salary generation finalized.
- `SUBSCRIPTION_RENEWED`: SaaS B2B billing cycle hits.
- `SUBSCRIPTION_CANCELLED`: SaaS B2B termination.
- `BANK_RECONCILED`: Bank statement uploaded and matched.
- `FISCAL_YEAR_CLOSED`: Triggering automated closing entries.

---

## SECTION 4: Event Payload Contract

To ensure the Posting Engine can reliably process events, every broadcast must strictly adhere to this payload contract:

- **Required Fields**:
  - `tenantId`: The `store_id` or `brand_id`.
  - `amount`: The total monetary value of the transaction.
  - `currencyId`: To handle foreign exchanges.
- **Optional Fields**:
  - `costCenterId`, `profitCenterId`: For advanced tracking.
  - `partyId`, `partyType`: To map to a Customer/Vendor/Employee.
- **Reference IDs**:
  - `referenceId`: The ID of the operational record (e.g., `order_id = 554`).
  - `referenceType`: The string literal (e.g., `'Order'`).
- **Timestamp**:
  - `occurredAt`: ISO-8601 string of when the event actually happened, dictating the `posting_date`.
- **Source Module**:
  - `source`: String literal representing the emitting module (e.g., `'POS_ORDERS'`).
- **Correlation ID**:
  - `correlationId`: A unique UUID used to trace the event across microservices/logs.
- **Idempotency Key**:
  - `idempotencyKey`: A unique string (e.g., `ORDER_COMPLETED_554_PAYMENT_1`) preventing the Posting Engine from double-processing the same event if retried.

---

## SECTION 5: Posting Flow

1. **Business Event**: A cashier hits "Settle" on the POS. The `PosOrdersService` updates the DB and returns the receipt.
2. **Event Bus**: Immediately before returning the API response, `PosOrdersService` emits `ORDER_COMPLETED` with the standard payload.
3. **Posting Engine**: The `AccountingListener` catches the event asynchronously. It looks up the tenant's `SystemAccountMappings` for Cash and Sales Revenue.
4. **Journal Entry**: The engine constructs a `JournalEntry` header with the order reference.
5. **Ledger Lines**: It attaches two `JournalEntryLine` records (Debit Cash, Credit Revenue).
6. **Persistence**: It saves the header and lines inside a `$transaction`.
7. **Financial Reports**: The instant the transaction commits, the tenant's Trial Balance updates in real-time.

---

## SECTION 6: Permissions

The Accounting module requires strict RBAC.

- `accounting.accounts.read`
- `accounting.accounts.create`
- `accounting.accounts.update`
- `accounting.accounts.delete`
- `accounting.journals.read`
- `accounting.journals.post` (Allows manual entry creation)
- `accounting.journals.reverse` (Allows reversing existing entries)
- `accounting.period.close` (High privilege)
- `accounting.reports.view` (Allows viewing P&L, Balance Sheet)
- `accounting.settings.manage` (Mapping System Accounts)

---

## SECTION 7: Integration Contract

The Accounting module is intentionally isolated. Other modules do not import `AccountingService`. They only emit events.

- **POS**: Emits sales, voids, and end-of-day shift floats.
- **Inventory**: Emits stock receipts, wastages, and adjustments.
- **Purchasing**: Emits vendor invoices and vendor payments.
- **CRM**: Emits customer payments against outstanding tabs/credits.
- **HR & Payroll**: Emits salary generation and disbursement.
- **Subscriptions & Billing**: Emits invoice generation and deferred revenue realization.
- **Workshop, Salon, Clinic, School**: All future vertical modules will simply emit standard `ORDER_COMPLETED` or `INVOICE_GENERATED` events. The Accounting Engine doesn't need to know if the invoice was for a "Haircut", an "Oil Change", or a "Math Class". It just sees Revenue.

---

## SECTION 8: Error Strategy

- **Duplicate Events**: The `idempotencyKey` is checked against existing `JournalEntry.reference_id` + `reference_type`. If a match is found, the event is silently ignored.
- **Retries**: If a posting fails (e.g., database lock timeout), BullMQ will retry it 5 times with exponential backoff (2s, 4s, 8s, 16s, 32s).
- **Dead Letter Queue (DLQ)**: If all retries fail (e.g., the tenant forgot to map `SALES_REVENUE_ACCOUNT`), the event is parked in a DLQ. An alert is sent to the tenant admin to map the account, after which they can click "Re-process".
- **Rollback Rules**: Handled natively by Prisma `$transaction`. Partial ledger postings are impossible.
- **Idempotency**: Every consumer logic block must be written such that running it 100 times yields the same database state as running it once.

---

## SECTION 9: Versioning Strategy

- **API Versioning**: Standard URI versioning (`/api/v1/accounting/...`). Changes to DTO structures require moving to `v2`.
- **Event Versioning**: The event payload has an implicit `version` field. If the required fields change drastically, the event name must change (e.g., `ORDER_COMPLETED_V2`).
- **Backward Compatibility**: New optional fields can be added to the payload without breaking older consumers. Removing required fields is strictly forbidden.
- **Deprecation Policy**: Minimum 6 months notice before dropping an old event listener, allowing operational modules time to migrate to the new event structure.

---

## SECTION 10: Implementation Order

To build the Accounting Engine safely alongside an active ERP:

- **Phase 1: Core Accounting**:
  - Build `AccountGroup`, `Account`, `FiscalYear`, `AccountingPeriod`.
  - Build Chart of Accounts REST APIs.
- **Phase 2: Posting Engine**:
  - Build `JournalEntry` and `JournalEntryLine` logic.
  - Implement `SystemAccountMapping`.
  - Expose Manual Journal Posting APIs.
- **Phase 3: Event Listeners (Automation)**:
  - Wire up `EventEmitter2` listeners for Sales and Purchasing.
  - Test idempotency and DLQ workflows.
- **Phase 4: Reports**:
  - Build the aggregation queries for Trial Balance and P&L.
- **Phase 5: Advanced Finance**:
  - Multi-Currency, Cost Centers, Budgeting, and Branch Consolidation.
