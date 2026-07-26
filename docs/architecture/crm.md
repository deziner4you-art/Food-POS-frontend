# CRM Architecture Review: Customer Entity Scoping

## Current State
Currently, the `Customer` entity is natively scoped at the **Brand-level** (`brand_id`). Branch-level scoping is achieved dynamically through relational filtering (e.g., querying if a customer has an `Order` at a specific `store_id`).

## Target State Recommendation
**Recommendation: Customers MUST remain Brand-level entities forever.**

In modern Enterprise ERP/POS architectures (e.g., Starbucks, McDonald's), the Customer Identity is universally bound to the Brand. Branch-level siloing of customers is an architectural anti-pattern that severely degrades the end-user experience and complicates data integrity. 

If a specific business requires strict isolation between its branches, those branches should be provisioned as separate Brands entirely.

## Impact Analysis (Brand-Level vs. Branch-Level)

### 1. CRM
- **Brand-Level (Recommended)**: A unified "Golden Record". A customer registers once and is recognized at any branch. Support staff have a 360-degree view of the customer's lifetime value (CLTV).
- **Branch-Level**: Fragmented identities. If John visits Branch A and Branch B, he exists as two disconnected database records, heavily inflating database size and causing duplicate entries.

### 2. Loyalty
- **Brand-Level (Recommended)**: Points earned at Branch A can seamlessly be redeemed at Branch B. This drives cross-branch footfall and maximizes loyalty program engagement.
- **Branch-Level**: Severe friction. Customers become frustrated when they realize their 5,000 points are locked to a branch they no longer visit.

### 3. Wallet
- **Brand-Level (Recommended)**: A unified digital ledger. A $100 top-up is universally available across the franchise. 
- **Branch-Level**: Wallets become siloed, causing accounting nightmares and legal liabilities (e.g., unused funds stranded in inactive branches). 

### 4. Coupons
- **Brand-Level (Recommended)**: Marketing can generate global coupons (e.g., "SUMMER50") redeemable anywhere, while still retaining the ability to restrict specific coupons to specific `store_ids` dynamically during checkout.
- **Branch-Level**: Coupons must be manually duplicated for every single branch database, increasing operational overhead exponentially.

### 5. Membership
- **Brand-Level (Recommended)**: Unified tier progression. A customer spends $500 across 3 branches to achieve "Gold Status" globally.
- **Branch-Level**: Tier progression resets per branch, destroying the psychological incentive of the membership system.

### 6. Order History
- **Brand-Level (Recommended)**: The customer’s app/receipts show a continuous, consolidated timeline of their interactions with the Brand.
- **Branch-Level**: Support staff cannot resolve refunds or historical inquiries if the customer calls the wrong branch or HQ.

### 7. Marketing
- **Brand-Level (Recommended)**: Centralized opt-outs and duplicate prevention. If a customer unsubscribes from SMS, they are unsubscribed globally. 
- **Branch-Level**: Customers receive duplicate SMS blasts from every branch they ever visited, leading to spam complaints and brand damage.

### 8. Affiliate Promotions
- **Brand-Level (Recommended)**: A single unique referral code (e.g., `REF-JOHN-123`).
- **Branch-Level**: Affiliates would have to generate and manage different referral links for different branches, killing the viral loop of the affiliate engine.

## Conclusion
Migrating the `Customer` entity to the Branch-level would cripple the CRM's enterprise capabilities. The current architecture (Brand-level identity with dynamic Branch-level relational filtering via transactions) is strictly correct and should be permanently frozen as the core paradigm.
