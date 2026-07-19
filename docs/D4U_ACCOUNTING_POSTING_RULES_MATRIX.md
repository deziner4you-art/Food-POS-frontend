# D4U Enterprise Accounting Posting Rules Matrix

**Version**: 1.0
**Status**: BUSINESS RULES DESIGN
**Domain**: Accounting Posting Engine Logic

---

## SECTION 1: Posting Engine Philosophy

The Posting Engine is the automated financial brain of D4U ERP. It adheres strictly to the following principles:

1. **Event-Driven Accounting**: Operational modules (Sales, Inventory, HR) never write to the accounting tables directly. Instead, they emit global domain events (e.g., `ORDER_SETTLED`). The Accounting Engine listens to these events and translates them into Journal Entries asynchronously.
2. **Automatic Journal Generation**: 95% of all accounting entries are system-generated to eliminate human bookkeeping errors.
3. **Immutable Financial Records**: Once a `JournalEntry` achieves a 'Posted' status, its lines (`JournalEntryLine`) are frozen forever.
4. **Reversal Instead of Deletion**: If a cashier voids a settled order, the system DOES NOT delete the original Journal Entry. Instead, it generates a "Reverse Entry" that swaps the original debits and credits, nullifying the financial impact while preserving the audit trail.
5. **Transaction Safety**: A Journal Entry with its lines is always saved within a strict ACID database transaction. If the server crashes between debiting and crediting, the entire posting rolls back.

---

## SECTION 2: Sales Events

| Business Event | Trigger Event | Debit Account | Credit Account | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Cash Sale** | `ORDER_SETTLED_CASH` | Cash in Hand (Asset) | Sales Revenue (Income) | Standard cash payment. |
| **Card Sale** | `ORDER_SETTLED_CARD` | Card Receivables (Asset) | Sales Revenue (Income) | Payment via credit/debit card (awaiting bank settlement). |
| **Credit Sale** | `ORDER_SETTLED_CREDIT` | Accounts Receivable (Asset) | Sales Revenue (Income) | Sale made on credit (Invoice issued, payment pending). |
| **Split Payment** | `ORDER_SETTLED_SPLIT` | Cash (Asset) AND Card Receivables (Asset) | Sales Revenue (Income) | Split tender. Multiple Debits, one Credit. |
| **Discount** | `ORDER_SETTLED` | Discount Given (Expense/Contra) | Accounts Receivable / Cash (Asset) | Tracks promotional loss if recorded at gross value. |
| **Service Charge** | `ORDER_SETTLED` | Cash/AR (Asset) | Service Charge Revenue (Income/Liability) | Tips or mandatory service charges collected. |
| **Sales Tax** | `ORDER_SETTLED` | Cash/AR (Asset) | VAT/Sales Tax Payable (Liability) | Tax collected on behalf of the government. |
| **Customer Refund** | `ORDER_REFUNDED` | Sales Returns (Contra-Income) | Cash / AR (Asset) | Cash returned to customer. |
| **Sales Return** | `ORDER_RETURNED` | Inventory Asset | Cost of Goods Sold (Expense) | Reverses the cost side of a returned item. |
| **Gift Voucher Redemption** | `ORDER_SETTLED_VOUCHER` | Gift Voucher Liability | Sales Revenue (Income) | Revenue recognized when a pre-paid voucher is used. |

---

## SECTION 3: Inventory Events

| Business Event | Trigger Event | Debit Account | Credit Account | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Stock Purchase** | `INVENTORY_RECEIVED` | Inventory (Asset) | Accounts Payable (Liability) | Stock enters warehouse via Vendor PO. |
| **Goods Receipt** | `GRN_APPROVED` | Inventory (Asset) | GRN Clearing (Liability) | Temporary clearing before the final Vendor Invoice arrives. |
| **Inventory Consumption** | `ORDER_DISPATCHED` | Cost of Goods Sold (Expense) | Inventory (Asset) | Stock reduced because it was sold. |
| **Waste / Spoilage** | `STOCK_WASTED` | Spoilage / Waste (Expense) | Inventory (Asset) | Damaged or expired food/items thrown away. |
| **Damage** | `STOCK_DAMAGED` | Damage / Loss (Expense) | Inventory (Asset) | Items broken by staff or during transit. |
| **Stock Adjustment (Up)** | `STOCK_ADJUSTED_UP` | Inventory (Asset) | Stock Adjustment (Income/Equity) | Found more stock during physical audit. |
| **Stock Adjustment (Down)** | `STOCK_ADJUSTED_DOWN` | Stock Adjustment (Expense) | Inventory (Asset) | Missing stock found during physical audit. |
| **Inventory Transfer** | `STOCK_TRANSFERRED` | Inventory - Branch B (Asset) | Inventory - Branch A (Asset) | Moving stock between company warehouses. |
| **Opening Stock** | `OPENING_STOCK_POSTED` | Inventory (Asset) | Opening Balance Equity (Equity) | First-time stock entry when adopting D4U software. |
| **Closing Stock** | `MONTH_END_INVENTORY` | N/A (If Perpetual) | N/A | If using Periodic accounting, adjusting COGS and Stock. |

---

## SECTION 4: Purchasing Events

| Business Event | Trigger Event | Debit Account | Credit Account | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Purchase Order Approval** | `PO_APPROVED` | *No Entry* | *No Entry* | A PO is a commitment, not a financial transaction until goods arrive. |
| **Vendor Invoice** | `VENDOR_INVOICE_RCVD` | Inventory / Expense (Asset/Exp) | Accounts Payable (Liability) | Acknowledging the debt owed to a supplier. |
| **Vendor Payment** | `VENDOR_PAYMENT_MADE` | Accounts Payable (Liability) | Cash / Bank (Asset) | Paying off the supplier debt. |
| **Purchase Return** | `PO_RETURNED` | Accounts Payable (Liability) | Inventory (Asset) | Sending defective goods back to the vendor. |
| **Advance Payment** | `VENDOR_ADVANCE_PAID` | Advances to Vendors (Asset) | Cash / Bank (Asset) | Paying a supplier before goods are received. |

---

## SECTION 5: Cash & Banking

| Business Event | Trigger Event | Debit Account | Credit Account | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Cash Deposit** | `CASH_DEPOSITED` | Bank Account (Asset) | Cash in Hand (Asset) | Manager deposits store cash into the bank (Contra Entry). |
| **Cash Withdrawal** | `CASH_WITHDRAWN` | Cash in Hand (Asset) | Bank Account (Asset) | Withdrawing cash for petty cash operations (Contra Entry). |
| **Bank Transfer** | `BANK_TRANSFERRED` | Bank Account B (Asset) | Bank Account A (Asset) | Moving funds between company accounts. |
| **Cheque Payment** | `CHEQUE_ISSUED` | Accounts Payable (Liability) | Bank Account (Asset) | Paying a vendor via Cheque. |
| **Cheque Receipt** | `CHEQUE_RECEIVED` | Uncleared Cheques (Asset) | Accounts Receivable (Asset) | Receiving a cheque from a B2B client. |
| **Bank Charges** | `BANK_CHARGE_RECORDED` | Bank Charges (Expense) | Bank Account (Asset) | Monthly fee or transaction fee deducted by the bank. |
| **Interest Income** | `INTEREST_RECEIVED` | Bank Account (Asset) | Interest Income (Revenue) | Interest accrued on business savings accounts. |

---

## SECTION 6: Payroll

| Business Event | Trigger Event | Debit Account | Credit Account | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Salary Processing** | `PAYROLL_GENERATED` | Salary Expense (Expense) | Salaries Payable (Liability) | End of month payroll generated, but not yet disbursed. |
| **Salary Payment** | `SALARY_DISBURSED` | Salaries Payable (Liability) | Bank / Cash (Asset) | Actual transfer of funds to employees. |
| **Advance Salary** | `ADVANCE_GIVEN` | Employee Advances (Asset) | Bank / Cash (Asset) | Giving an employee an advance loan. |
| **Loan Recovery** | `PAYROLL_GENERATED` | Salaries Payable (Liability) | Employee Advances (Asset) | Deducting loan installment from monthly salary. |
| **Bonus** | `BONUS_DECLARED` | Bonus Expense (Expense) | Salaries Payable / Cash | End of year or performance bonus. |

---

## SECTION 7: Subscription & SaaS (D4U Corporate / Enterprise B2B)

| Business Event | Trigger Event | Debit Account | Credit Account | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Subscription Purchase** | `SUBSCRIPTION_BOUGHT` | Accounts Receivable (Asset) | Deferred SaaS Revenue (Liability) | Client signs 1-year contract and is invoiced. |
| **Subscription Renewal** | `SUBSCRIPTION_RENEWED`| Accounts Receivable (Asset) | Deferred SaaS Revenue (Liability) | Annual renewal invoice generated. |
| **Invoice Generation** | `INVOICE_GENERATED` | AR | Deferred Revenue | Document sent. |
| **Deferred Revenue (Monthly)** | `MONTH_END_RECOGNITION`| Deferred SaaS Revenue (Liab) | SaaS Revenue (Income) | Recognizing 1 month of revenue out of a 12-month pre-paid contract. |
| **Subscription Cancellation** | `SUBSCRIPTION_CANCELLED`| Deferred SaaS Revenue (Liab) | Accounts Receivable (Asset) | Client cancels before paying. Reversing the unearned debt. |

---

## SECTION 8: Fixed Assets

| Business Event | Trigger Event | Debit Account | Credit Account | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Asset Purchase** | `ASSET_PURCHASED` | Fixed Assets (Asset) | Bank / Accounts Payable | Buying an Oven or Delivery Bike. |
| **Depreciation** | `DEPRECIATION_POSTED` | Depreciation (Expense) | Accumulated Depreciation (Contra-Asset)| Monthly reduction in asset value. |
| **Asset Disposal (Sale)** | `ASSET_SOLD` | Bank / Cash (Asset) | Fixed Assets (Asset) | Selling off old equipment. |
| **Asset Revaluation** | `ASSET_REVALUED` | Fixed Assets (Asset) | Revaluation Reserve (Equity) | Appraising an asset to a higher market value. |

---

## SECTION 9: Period Closing

| Business Event | Trigger Event | Debit Account | Credit Account | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Month End** | `PERIOD_CLOSED` | *N/A* | *N/A* | Locks the accounting period preventing new entries. |
| **Year End** | `YEAR_CLOSED` | *N/A* | *N/A* | Triggers the Closing Entries process. |
| **Opening Balance** | `YEAR_OPENED` | Asset/Liability Accounts | Opening Balance Equity | Setting up the new year's starting balances. |
| **Closing Entries** | `YEAR_CLOSED` | Revenue Accounts | Income Summary (Equity) | Zeroing out Income for the year. |
| **Retained Earnings** | `YEAR_CLOSED` | Income Summary | Retained Earnings (Equity) | Zeroing out Expenses and pushing Net Profit to Equity. |

---

## SECTION 10: Validation Rules

The Posting Engine will intercept and **reject** any posting that fails these rules:

1. **Balance Equation**: `Total Debit == Total Credit`. Variance must be strictly `0`.
2. **Closed Periods**: If the `posting_date` falls within a closed Accounting Period, the entry is rejected.
3. **Missing System Accounts**: If an automated event (e.g., `ORDER_SETTLED`) fires, but the tenant has not mapped a `SALES_REVENUE_ACCOUNT` in `SystemAccountMapping`, the entry fails safely.
4. **Duplicate Events**: Implemented via Idempotency Keys (e.g., `event_id` or `reference_id`) to ensure a network retry doesn't post the same Sales Revenue twice.
5. **Chart of Account Boundaries**: You cannot post directly to an `AccountGroup` (folder). You can only post to an active leaf `Account`.

---

## SECTION 11: Error Handling

1. **Posting Rollback**: If a multi-line journal entry fails midway (e.g., DB connection drops), the database transaction aborts. Neither side of the entry is saved.
2. **Retry Strategy**: BullMQ automatically retries failed background posting events with exponential backoff.
3. **Failed Posting Queue**: If an entry repeatedly fails (e.g., due to missing account mappings), it is moved to a Dead Letter Queue (DLQ) and an alert is shown on the Admin Dashboard for manual resolution.
4. **Audit Trail**: Any manual entries, or interventions to fix failed automated entries, trigger an immutable log recording the user ID and timestamp.

---

## SECTION 12: Future Extensions

1. **Budget Control**: A pre-posting hook that checks if an Expense debit will cause the account balance to exceed the monthly budget. If so, it requires managerial override.
2. **Manufacturing Costing**: Automated entries combining Raw Material Inventory (Credit) + Labor Expense (Credit) -> Finished Goods Inventory (Debit).
3. **Project Accounting**: Adding a `project_id` column to Journal Lines to isolate the P&L of a specific catering event or construction job.
4. **Branch Consolidation**: Allowing HQ to run a single General Ledger query across multiple `store_ids` without physically merging their databases.
5. **Multi-Currency Revaluation**: End-of-month automated entries that adjust the base-currency value of foreign Accounts Receivable/Payable based on the latest exchange rates, booking the difference to an Unrealized Forex Gain/Loss account.
