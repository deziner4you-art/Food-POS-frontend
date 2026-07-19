# D4U Enterprise Accounting Blueprint

**Version**: 1.0
**Status**: DRAFT (Architecture Design)
**Domain**: Enterprise Core Accounting Engine

---

## SECTION 1: Business Goals

The D4U Enterprise Accounting Engine serves as the ultimate source of financial truth for the entire platform. Its primary business goals are:

1. **Universal Financial Core**: Provide a robust, generic accounting backbone that supports Restaurant, Retail, Workshop, Salon, Clinic, School, and Future Manufacturing verticals out-of-the-box without hardcoding industry-specific logic.
2. **Automated Reconciliation**: Drastically reduce manual book-keeping by automatically generating journal entries from operational events (Sales, POs, Inventory Consumption).
3. **Enterprise Compliance**: Maintain strict financial compliance via immutable ledgers, preventing tampering or unauthorized retroactive modifications.
4. **Real-time Financial Insight**: Offer instant, real-time access to P&L, Balance Sheets, and Cash Flow statements.
5. **Scale Across Borders**: Support Multi-Currency transactions, Multi-Branch consolidation, and dynamic Fiscal Years to cater to international enterprise franchises.

---

## SECTION 2: Accounting Principles

The accounting engine strictly adheres to international financial reporting standards (IFRS/GAAP):

- **Double Entry Accounting**: Every transaction requires at least two equal and opposing entries (Debit and Credit). The fundamental equation `Assets = Liabilities + Equity` must always balance.
- **Accrual Basis**: Revenue and expenses are recorded when they are earned or incurred, regardless of when the cash actually exchanges hands. (e.g., Recording a vendor invoice as Account Payable before the payment is made).
- **Fiscal Year**: The 12-month accounting period defined by the tenant (e.g., Jan 1 - Dec 31, or Jul 1 - Jun 30).
- **Accounting Periods**: Typically monthly sub-divisions within a Fiscal Year. Periods can be "Open" (accepting postings) or "Closed" (locked to prevent historical tampering).
- **Multi-Tenant Design**: Every account, ledger, and transaction is rigidly scoped to a `tenant_id` (Brand/Store) to guarantee data isolation in the SaaS monolith.

---

## SECTION 3: Chart of Accounts (CoA)

The Chart of Accounts is the hierarchical tree classifying all financial transactions. The numbering strategy ensures room for growth and easy logical grouping.

### Numbering Strategy
- **1000 - 1999**: Assets
- **2000 - 2999**: Liabilities
- **3000 - 3999**: Equity
- **4000 - 4999**: Revenue
- **5000 - 5999**: Cost of Sales (CoGS)
- **6000 - 6999**: Operating Expenses
- **7000 - 7999**: Other Income
- **8000 - 8999**: Other Expenses / Taxes

### Example Hierarchy
- **1000 Assets**
  - **1100 Current Assets**
    - 1110 Cash in Hand
    - 1120 Bank Accounts
    - 1130 Accounts Receivable (A/R)
    - 1140 Inventory Assets
  - **1500 Fixed Assets**
    - 1510 Machinery & Equipment
- **2000 Liabilities**
  - **2100 Current Liabilities**
    - 2110 Accounts Payable (A/P)
    - 2120 Accrued Taxes (VAT/GST Payable)
- **3000 Equity**
  - 3110 Owner's Capital
  - 3210 Retained Earnings
- **4000 Revenue**
  - 4110 Sales Revenue (Products)
  - 4120 Service Revenue (Consultations/Repair)
- **5000 Cost of Sales**
  - 5110 Cost of Goods Sold (Raw Materials)
- **6000 Expenses**
  - 6110 Payroll / Salaries
  - 6120 Rent & Utilities

---

## SECTION 4: Core Entities

- **Account**: A node in the Chart of Accounts (e.g., "Cash in Hand"). Contains properties like Account Type, Account Code, and Parent Account ID.
- **Journal**: A logical grouping of transactions (e.g., "Sales Journal", "Purchase Journal", "General Journal").
- **Journal Entry**: An immutable record of a financial event containing a Date, Reference ID, and Description.
- **Ledger (Journal Entry Line)**: The granular Debit or Credit line attached to a Journal Entry. A valid Entry must have lines where `Sum(Debits) == Sum(Credits)`.
- **Voucher**: A physical or digital document authorizing a transaction (e.g., Payment Voucher, Receipt Voucher, Contra Voucher).
- **Fiscal Year**: Defines the start and end dates of the financial year for a tenant.
- **Accounting Period**: A locked or unlocked timeframe (usually a month) governing whether postings are allowed.
- **Currency**: Definition of the currency, symbol, and precision.
- **Exchange Rate**: Time-stamped multiplier used to convert foreign currency transactions to the base currency.
- **Cost Center**: An operational department (e.g., "Marketing Department", "Maintenance") used to track specific expenses.
- **Profit Center**: A revenue-generating department (e.g., "Dine-in Branch 1", "Delivery Fleet").

---

## SECTION 5: Posting Engine

- **Automatic Posting**: Triggered asynchronously via Event Driven Architecture. When `ORDER_COMPLETED` is emitted, the engine automatically debits Cash/AR and credits Sales Revenue & VAT Payable. When `PO_RECEIVED` is emitted, it debits Inventory Asset and credits Accounts Payable.
- **Manual Journal**: Admin screens allowing accountants to input manual adjustments (e.g., Depreciation, Accruals) directly into the General Journal.
- **Voucher Posting**: Workflows for Cashiers/Managers to process Cash Receipts (Debiting Cash, Crediting A/R) or Payments (Crediting Cash, Debiting A/P).
- **Reverse Entries**: Immutability rule: Once an entry is posted, it **cannot be deleted or modified**. If an error occurs, a Reverse Entry is automatically generated, flipping the exact Debits and Credits of the original entry with a reference to the cancellation.
- **Opening Balance**: Special journal entries made at the start of a new software adoption to load existing asset and liability balances into the new system.
- **Closing Entries**: Automated year-end entries that zero out Revenue and Expense accounts, transferring the net profit/loss into the Equity (Retained Earnings) account to prepare for the new Fiscal Year.

---

## SECTION 6: Integration Matrix

The accounting engine is the silent observer of all ERP activities:

- **POS / Sales**: Credits Revenue, Credits Tax Payable, Debits Cash/Bank or A/R.
- **Inventory**: Credits Inventory Asset, Debits Cost of Goods Sold (COGS) upon item consumption. Debits Inventory Asset upon receiving stock.
- **Purchasing**: Debits Inventory/Expense, Credits Accounts Payable (A/P).
- **CRM**: Ties A/R ledgers directly to Customer profiles for statement generation and credit limits.
- **HR & Payroll**: Debits Salary Expense, Credits Cash/Bank (or Accrued Payroll Liability) when pay-slips are generated.
- **Subscriptions**: Debits A/R, Credits Deferred Revenue or SaaS Revenue.
- **Billing**: Automates generation of tax invoices based on service usage.
- **Banking**: Integrates with Bank Reconciliations to match internal Cash Book entries against imported Bank Statements.

---

## SECTION 7: Financial Reports

- **Trial Balance**: A list of all active accounts and their closing balances. Ensures total debits equal total credits.
- **General Ledger**: A detailed chronological list of every transaction that affected a specific account over a date range.
- **Cash Book**: A specialized ledger showing all cash and bank inflows/outflows.
- **Bank Book**: Specialized tracking of specific bank accounts for reconciliation purposes.
- **Profit & Loss (Income Statement)**: Calculates net income over a period by subtracting Expenses and COGS from Revenue.
- **Balance Sheet**: A snapshot of the company's financial position at an exact date, showing Assets = Liabilities + Equity.
- **Cash Flow Statement**: Tracks the actual movement of cash in Operating, Investing, and Financing activities.
- **Aging Reports**: "A/R Aging" shows how long customers have owed money (0-30 days, 31-60 days). "A/P Aging" tracks vendor debt.

---

## SECTION 8: Database Proposal (High-Level Schema)

*Note: Strict pseudo-schema modeling.*

1. `Account` (id, code, name, type, parent_id, is_group, tenant_id)
2. `FiscalYear` (id, start_date, end_date, status, tenant_id)
3. `AccountingPeriod` (id, fiscal_year_id, month, status)
4. `Journal` (id, name, type, tenant_id)
5. `JournalEntry` (id, journal_id, date, reference_type, reference_id, total_amount, status, created_by)
6. `LedgerEntry` (id, journal_entry_id, account_id, debit, credit, cost_center_id)
7. `Voucher` (id, voucher_type, date, amount, party_id, party_type, status)
8. `CostCenter` (id, name, code, tenant_id)
9. `Currency` (id, code, symbol)

---

## SECTION 9: REST API Proposal

*Note: Core routing namespaces proposed for future controllers.*

- `GET /accounting/chart-of-accounts`
- `POST /accounting/accounts`
- `POST /accounting/journal-entries` (Manual Entry)
- `POST /accounting/journal-entries/:id/reverse`
- `GET /accounting/ledgers/:account_id`
- `POST /accounting/vouchers/receipt`
- `POST /accounting/vouchers/payment`
- `GET /accounting/reports/trial-balance`
- `GET /accounting/reports/profit-and-loss`
- `GET /accounting/reports/balance-sheet`
- `POST /accounting/fiscal-years/close`

---

## SECTION 10: Future Enterprise Features

- **Budgeting**: Setting monthly limits on specific Expense accounts and triggering warnings if POs exceed the budget.
- **Asset Management**: Tracking fixed assets (Ovens, Chairs, Machinery).
- **Depreciation**: Automatically generating monthly journal entries to reduce Asset value and increase Depreciation Expense based on straight-line or declining-balance formulas.
- **Manufacturing Costing**: Absorbing overhead costs (electricity, labor) into the value of manufactured Inventory Assets.
- **Project Accounting**: Tracking Revenue and Expenses strictly scoped to a specific project (e.g., "Branch 3 Fit-out") instead of the whole company.
- **Branch Consolidation**: Merging the Trial Balances of multiple `store_ids` under a parent `brand_id` to generate a unified HQ Profit & Loss statement.

---

## SECTION 11: Risks (Accounting Mistakes to Avoid)

1. **Allowing Deletion**: Never allow a `DELETE` operation on `JournalEntry` or `LedgerEntry`. It destroys auditability. Only Reverse Entries are permitted.
2. **Precision Loss**: Storing monetary values as standard floating-point numbers (`float`/`double`) leads to rounding errors (`0.1 + 0.2 = 0.30000000000000004`). Always use `Decimal` database types or integer logic (storing cents).
3. **Missing Period Locks**: Failing to implement Accounting Period locks allows a manager to backdate an invoice into a previous year, ruining already-filed tax returns.
4. **Hardcoding Account IDs**: Never hardcode Account IDs (like `account_id = 5` for Cash). Always use dynamic mapping tables or System Account flags, as different tenants will have completely different Chart of Accounts structures.
5. **Single-Sided Entries**: A transaction that debits an account but fails to record the corresponding credit due to a code crash will permanently unbalance the system. Database Transactions (`$transaction`) are mandatory for all posting logic.
