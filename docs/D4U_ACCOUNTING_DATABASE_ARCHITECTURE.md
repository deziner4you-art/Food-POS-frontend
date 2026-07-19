# D4U Enterprise Accounting Database Architecture

**Version**: 1.0
**Status**: ARCHITECTURE DESIGN
**Domain**: Accounting Database Schema

---

## SECTION 1: Entity Relationship Overview

The Accounting Engine sits at the heart of the D4U ERP. The architecture centers around an immutable double-entry ledger system.

1. **Hierarchy & Organization**: `AccountGroup` acts as the structural tree (Assets, Liabilities) holding individual `Account` ledgers. `SystemAccountMapping` binds hardcoded operational events (e.g., POS Sales) to dynamic tenant accounts without hardcoding IDs.
2. **Time & Validity**: `FiscalYear` contains multiple `AccountingPeriod` records. Postings are only allowed if the mapped period is OPEN.
3. **Core Transaction Loop**: A business event creates a `Voucher`, which generates a `JournalEntry` (header), which strictly owns two or more `JournalEntryLine` records (debits and credits). The `JournalEntryLine` affects the specific `Account`.
4. **Context & Currency**: Every `JournalEntryLine` can optionally link to a `CostCenter` or `ProfitCenter`. Foreign transactions link to a `Currency` and use a specific `ExchangeRate`.

---

## SECTION 2 & 3: Core Tables

For each table, the standard **Audit Fields** (`created_at`, `updated_at`, `created_by`, `updated_by`) and **Tenant Isolation** (`store_id`, `brand_id`) apply.

### 1. `AccountGroup`
- **Purpose**: Defines the Chart of Accounts folder structure (e.g., "Current Assets", "Direct Expenses").
- **Primary Key**: `id` (Integer/UUID)
- **Business Fields**: `name`, `code`, `parent_group_id` (self-referencing), `root_type` (Asset/Liability/Equity/Revenue/Expense).
- **Tenant Isolation**: `store_id`
- **Indexes**: `store_id`, `code`
- **Foreign Keys**: `parent_group_id` -> `AccountGroup.id`
- **Soft Delete**: `deleted_at` flag. Only allowed if no child accounts exist.
- **Status**: `is_active`

### 2. `Account`
- **Purpose**: The actual ledger where debits and credits are posted (e.g., "Cash Register 1", "Stripe Receivables").
- **Primary Key**: `id`
- **Business Fields**: `name`, `code`, `account_group_id`, `currency_id`, `opening_balance`.
- **Tenant Isolation**: `store_id`
- **Unique Constraints**: `(store_id, code)`
- **Indexes**: `store_id`, `account_group_id`
- **Foreign Keys**: `account_group_id` -> `AccountGroup.id`
- **Soft Delete**: `deleted_at`. **Strictly forbidden** if any `JournalEntryLine` exists against it.
- **Status**: `is_active`

### 3. `Journal`
- **Purpose**: Categorizes transactions (e.g., "Sales Journal", "Cash Journal", "General Journal").
- **Primary Key**: `id`
- **Business Fields**: `name`, `prefix` (e.g., 'SLS', 'GEN').
- **Tenant Isolation**: `store_id`

### 4. `JournalEntry`
- **Purpose**: The immutable transaction header ensuring balancing of debits/credits.
- **Primary Key**: `id`
- **Business Fields**: `journal_id`, `posting_date`, `accounting_period_id`, `reference_type` (e.g., 'Order', 'PO'), `reference_id`, `total_amount`, `description`.
- **Tenant Isolation**: `store_id`
- **Indexes**: `store_id`, `posting_date`, `reference_type_id`
- **Soft Delete**: **NO SOFT DELETE ALLOWED.** Immutability rule applies.
- **Status**: `status` (Draft, Posted, Reversed)

### 5. `JournalEntryLine`
- **Purpose**: The granular debit or credit applied to a specific account.
- **Primary Key**: `id`
- **Business Fields**: `journal_entry_id`, `account_id`, `debit_amount`, `credit_amount`, `description`, `cost_center_id`, `profit_center_id`, `party_type` (Customer/Vendor/Employee), `party_id`.
- **Tenant Isolation**: `store_id`
- **Indexes**: `account_id`, `journal_entry_id`
- **Soft Delete**: **NO SOFT DELETE ALLOWED.**

### 6. `Voucher` & `VoucherType`
- **Purpose**: Document authorizing financial movement (Receipt, Payment, Journal).
- **Business Fields**: `voucher_type_id`, `voucher_number`, `date`, `amount`, `notes`.

### 7. `FiscalYear` & `AccountingPeriod`
- **Purpose**: Time-bounding financials.
- **Fields**: `start_date`, `end_date`, `is_closed`. `AccountingPeriod` has `month`, `year`, `status` (Open, Closed).

### 8. `Currency` & `ExchangeRate`
- **Purpose**: Multi-currency support.
- **Fields**: `currency_code` (e.g., USD, PKR). `ExchangeRate` tracks `base_currency_id`, `target_currency_id`, `rate`, `effective_date`.

### 9. `CostCenter` & `ProfitCenter`
- **Purpose**: Tracking expenses/revenue by department or physical location without duplicating the Chart of Accounts.
- **Fields**: `name`, `code`.

### 10. `BankAccount` & `PaymentMethod`
- **Purpose**: Dedicated accounts for reconciliation.
- **Fields**: `account_number`, `bank_name`, `linked_gl_account_id`.

### 11. `TaxCode`
- **Purpose**: Tracking VAT/GST variations.
- **Fields**: `name`, `rate`, `linked_tax_account_id`.

### 12. `SystemAccountMapping`
- **Purpose**: Binds generic operational triggers to dynamic tenant accounts.
- **Fields**: `mapping_type` (e.g., 'CASH_ACCOUNT', 'SALES_REVENUE'), `account_id`.

---

## SECTION 4: Relationship Diagram

- **One-to-Many**: 
  - `AccountGroup` to `Account`
  - `Journal` to `JournalEntry`
  - `JournalEntry` to `JournalEntryLine` (Crucial: 1 header -> N lines)
  - `FiscalYear` to `AccountingPeriod`
- **Many-to-One**: 
  - `JournalEntryLine` to `Account`
  - `JournalEntryLine` to `CostCenter`
  - `Account` to `Currency`
- **One-to-One**: 
  - `BankAccount` to `Account`
  - `TaxCode` to `Account`

---

## SECTION 5: Posting Integrity Rules

1. **Balance Check**: `SUM(debit_amount)` MUST EQUAL `SUM(credit_amount)` for any given `JournalEntry`. The database transaction must fail if variance != 0.
2. **Minimum Lines**: Every `JournalEntry` must own at least two `JournalEntryLine` rows.
3. **Immutability**: Once `JournalEntry.status = 'Posted'`, neither the header nor its lines can be UPDATE'd or DELETE'd.
4. **Reversals**: Fixing a mistake requires inserting a new `JournalEntry` that flips the debits and credits of the original, linking back via `reference_id`.
5. **Period Lock**: The system must check `AccountingPeriod.status`. If the period spanning `posting_date` is 'Closed', the database transaction aborts.

---

## SECTION 6: System Accounts Strategy

To make the engine multi-tenant and multi-industry, we **NEVER** hardcode Account IDs. 
Instead, we use the `SystemAccountMapping` table.

**Example Mappings**:
- `DEFAULT_CASH_ACCOUNT`
- `DEFAULT_AR_ACCOUNT`
- `DEFAULT_AP_ACCOUNT`
- `INVENTORY_ASSET_ACCOUNT`
- `COGS_ACCOUNT`
- `SALES_REVENUE_ACCOUNT`
- `VAT_PAYABLE_ACCOUNT`

**Workflow**:
When the POS finalizes an order, the `OrdersService` asks the `AccountingService` for the ID mapped to `SALES_REVENUE_ACCOUNT` for Tenant X. It uses this dynamic ID to create the `JournalEntryLine`.

---

## SECTION 7: Performance Strategy

- **Indexes**: Crucial indexes on `(store_id, account_id, posting_date)` to allow instant calculation of closing balances.
- **Partitioning**: Given the hyper-growth of `JournalEntryLine`, the table should be natively partitioned in PostgreSQL by `posting_date` (e.g., monthly partitions) to keep query times flat.
- **Historical Data / Archiving**: Old fiscal years can be rolled up into a single "Opening Balance" entry for active queries, and the granular lines moved to cold storage (S3/Redshift) after 5 years.
- **Reporting Optimization**: Implement a Materialized View for `TrialBalance` that refreshes nightly, preventing heavy SUM() operations during daytime operating hours.

---

## SECTION 8: Security Strategy

- **Tenant Isolation**: Every query reading or writing to accounting tables must strictly append `where store_id = X`. Failure to do so exposes corporate financial data.
- **Auditability**: All manual journal entries must log the `created_by` User ID.
- **Database Transactions**: Financial postings (`JournalEntry` + `JournalEntryLine`) MUST be wrapped in a strict ACID database transaction. If the server crashes between writing the debit and the credit, the entire transaction rolls back.

---

## SECTION 9: Future Scalability

- **Multi-company / Branch Consolidation**: The `brand_id` and `store_id` hierarchy allows HQ to run a `SUM()` across all stores under a brand to generate a consolidated P&L.
- **Multi-currency**: Storing `currency_id` and `exchange_rate_id` on the `JournalEntry` allows the UI to display reports in the tenant's base currency while tracking foreign AP/AR accurately.
- **Manufacturing Costing**: `CostCenter` integration allows absorption of electricity and labor into the `Inventory` asset value rather than treating it immediately as an expense.
- **Project Accounting**: Linking `JournalEntryLine` to a specific `project_id` (via polymorphic `reference_id`) allows isolating profitability for specific long-term contracts.

---

## SECTION 10: Risks & Mistakes to Avoid

1. **Floating Point Math**: Do NOT use standard `float` data types. Use `Decimal(15,4)` in the database to prevent decimal rounding anomalies.
2. **Soft Deleting Posted Entries**: Providing a "Delete" button for posted entries destroys financial compliance. It must always be "Reverse".
3. **Lack of Period Locking**: Failing to enforce accounting periods means a user could accidentally date an invoice to 2010, altering historical tax reports.
4. **Single-Sided Failures**: Writing a Debit successfully but crashing before the Credit writes. Use strict ACID database transactions.
5. **Chart of Account Chaos**: Allowing regular users to modify root Account Groups (like changing Assets to Liabilities) will break reporting formulas. Restrict CoA modifications to Super Admins.
