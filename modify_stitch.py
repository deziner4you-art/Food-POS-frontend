import re

file_path = r'g:\RESTAURANT_POS_WITH_BACKEND\d4u-website\src\components\StitchLanding.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove CATEGORIES and PRODUCTS constants from the top
content = re.sub(r'const CATEGORIES = \[.*?\];', '', content, flags=re.DOTALL)
content = re.sub(r'const PRODUCTS: Product\[\] = \[.*?\];\n', '', content, flags=re.DOTALL)

# 2. Modify component signature and inject dynamic PRODUCTS / CATEGORIES
signature_replacement = '''
export default function StitchLanding({ 
  storeId, storeName, stores, foodItems, cart: globalCart, onAddToCart: globalAddToCart, 
  onRemoveFromCart, onDecreaseQuantity, onIncreaseQuantity, onClearCart, 
  banners, campaigns 
}: any) {
  const BACKEND_URL = 'http://' + (typeof window !== 'undefined' ? window.location.hostname : 'localhost') + ':3001';
  
  const PRODUCTS = (foodItems || []).map((fi: any) => ({
    id: fi.id,
    store_id: storeId || 1,
    name: fi.name,
    price: fi.priceUSD || fi.priceRs,
    priceRs: fi.priceRs,
    is_active: true,
    image_url: fi.image && fi.image.startsWith('http') ? fi.image : ${BACKEND_URL},
    category: fi.category,
    description: fi.description
  }));

  const CATEGORIES = Array.from(new Set(PRODUCTS.map((p: any) => p.category)));
'''
content = content.replace('export default function App() {', signature_replacement)

# 3. Replace submitOrder logic
submit_order_logic = '''
    setIsSubmittingOrder(true);
    
    const payload = {
        store_id: storeId || 1,
        customer: customerName || 'Online Guest',
        customerPhone: customerPhone || '',
        customerAddress: customerAddress || 'No Address',
        items: JSON.stringify(cart.map((c: any) => ({
          id: c.product.id,
          name: c.product.name,
          qty: c.quantity,
          price: c.product.price
        }))),
        totalAmount: (cart.reduce((sum: number, item: any) => sum + item.product.price * item.quantity, 0) * 1.08).toFixed(2),
        source: 'Website',
        notes: '',
    };

    fetch(${BACKEND_URL}/online-orders, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(res => res.json()).then(data => {
      const trackingId = data.order?.id || D4U-;
      setOrderTracking({
        id: trackingId.toString(),
        status: "PENDING",
        eta: 25
      });
      setIsSubmittingOrder(false);
      setIsCheckoutOpen(false);
      setCart([]);
      setRedeemedPointsDiscount(0);
      setAppliedCoupon(null);
      triggerToast("Order placed successfully!", "success");
    }).catch(e => {
      console.error(e);
      triggerToast("Failed to place order.", "error");
      setIsSubmittingOrder(false);
    });
  };
'''

content = re.sub(
    r'setIsSubmittingOrder\(true\);\s*// Simulate multi-stage.*?\}\, 2000\);\s*\};', 
    submit_order_logic, 
    content, 
    flags=re.DOTALL
)

# 4. Modify branch dropdown mapping. In Stitch, it's BRANCHES_BY_CITY.
# We will leave the branches UI as is for now, or just map them. I will leave it as is, and the user can select whatever.

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done modifications to StitchLanding.tsx")
