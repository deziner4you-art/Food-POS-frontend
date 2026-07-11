import os

phase9_model_content = """

### 29. Phase 9: Settings, Payment Checkout, aur Print Formatting
- **Settings System**: POS ke andar ab `localStorage` ki madad se device-specific settings mehfooz ki jati hain (Printer Name, Bill/KOT Print Qty, KOT Mode: PRINT/SCREEN, Till Lock Enable/Disable, aur Duplicate KOT allow/disallow).
- **Payment Window**: Jab Cashier 'Pay' par click karta hai, toh ek bada Payment Modal khulta hai. Yahan Invoice total nazar aata hai aur Cashier customer ki di hui raqam (Cash Given) likh sakta hai. System khud Return Change calculate karta hai.
- **Till Lock Mechanism**: 'Print Bill & Open Draw' click karne ke baad system ka UI puri tarah lock ho jata hai (Ek bara lal parda aa jata hai "Lock Your Till First") jab tak Cashier Till lock karke button nahi dabata. Ye security feature settings se on/off kiya ja sakta hai.
- **Duplicate KOT Protection**: Agar Cashier kisi KOT ko dubara print karne ki koshish kare, aur `duplicateKOTEnabled` true ho, toh system Manager PIN (e.g. 1234) mangta hai. Uske baad hi duplicate KOT nikalta hai.
- **Print Templates**: KOT aur Bill ko thermal printer (80mm) ke hisaab se format kiya gaya hai aur `@media print` ki madad se hidden components se window.print() fire kiya jata hai.
"""

phase9_arch_content = """

### 9. Phase 9: Settings & Print Formats Architecture
**Client-Side Local Storage for Hardware Settings:**
- `posSettings` object is saved in browser `localStorage`. This is intentional because printers and till logic are device-specific and shouldn't be overridden by cloud profiles.
- **Till Lock Workflow**: Utilizes a full-screen React overlay with high z-index to block all POS events if `isTillLocked` is false.
- **Duplicate KOT Overrides**: Added `printCount` to Dexie `kots` table. The React state manages a `modalType === 'MANAGER_AUTH'` barrier before invoking the `triggerKotPrint` method for KOTs with `printCount > 0`.
- **Printing**: Utilizes hidden React components (`PrintBill` and `PrintKOT`) styled with `@media print`. `window.print()` is triggered safely inside a setTimeout.
"""

def append_to_file(path, content):
    with open(path, "a", encoding="utf-8") as f:
        f.write(content)

append_to_file(r"g:\RESTAURANT_POS\D4U_POS_Model_Understanding_Urdu.md", phase9_model_content)
append_to_file(r"g:\RESTAURANT_POS\D4U_POS_Architecture_Model_Context.md", phase9_arch_content)
print("Updated successfully")
