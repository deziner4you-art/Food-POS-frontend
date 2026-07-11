# ڈیجیٹل ریسٹورنٹ پی او ایس (POS) اور مینجمنٹ سسٹم - تفصیلی خاکہ (D4U)

یہ دستاویز اس جدید ترین ملٹی اسٹور (Multi-Store) فاسٹ فوڈ POS اور آن لائن آرڈرنگ سسٹم کا مکمل فہم (Understanding) آسان اردو میں فراہم کرتی ہے۔ اس سسٹم کا بنیادی مقصد 40 سے زائد برانچز کو ایک ہی کلاؤڈ سرور سے کنٹرول کرنا ہے۔

## 1. سسٹم کے بنیادی حصے اور ملٹی اسٹور مینجمنٹ
- **بیک اینڈ ایڈمن پینل (Backend Admin Panel):** کلاؤڈ پر موجود ایک مرکزی ڈیش بورڈ جہاں سے سپر ایڈمن تمام برانچز کا کنٹرول، سیلز، اور انوینٹری دیکھ سکتا ہے۔
- **نئی برانچ کا اضافہ (New Branch Creation):** جب ایڈمن پینل سے کوئی نئی برانچ شامل کی جائے گی، تو سسٹم دو آپشنز پوچھے گا:
  1. **"Same Menu Pricing" (ایک جیسی قیمتیں):** نئی برانچ مرکزی اسٹور والی قیمتیں اور ریسپی استعمال کرے گی۔
  2. **"Different Menu Pricing" (مختلف قیمتیں):** نئی برانچ کو اپنی قیمتیں اور ریسپی کاسٹ سیٹ کرنے کا اختیار ہو گا (کیونکہ مختلف علاقوں میں کرایہ یا خام مال کی قیمت مختلف ہو سکتی ہے)۔
- **لوکل پی او ایس (Local POS):** ہر برانچ پر کیشئیر کے لیے ویب یا ڈیسک ٹاپ سافٹ ویئر جو آف لائن (بغیر انٹرنیٹ) بھی چل سکتا ہے۔
- **کسٹمر ایپ (Flutter App) اور ویب سائٹ:** گاہکوں کے لیے ڈلیوری اور ٹیک اوے (Takeaway) کے آن لائن آرڈرز کے لیے۔
- **ڈلیوری رائیڈر ایپ (Rider App):** رائیڈرز کو آرڈر اسائن کرنے اور لائیو ٹریکنگ کے لیے۔

## 2. آف لائن موڈ اور شفٹ چینج کا نظام
- **آف لائن آپریشنز:** اگر کسی برانچ میں انٹرنیٹ بند ہو جائے، تو ریستوران کا کام نہیں رکے گا۔ لوکل POS پر واک اِن (Walk-in)، واٹس ایپ اور کال آرڈرز معمول کے مطابق چلتے رہیں گے۔ تاہم، سسٹم خودکار طور پر برانچ کو آن لائن ایپس پر "Offline" کر دے گا تاکہ گاہک آن لائن آرڈر نہ کر سکیں۔
- **آف لائن شفٹ چینج (Offline Shift Change):** اگر ایک کیشئیر کی شفٹ ختم ہو گئی ہے اور انٹرنیٹ نہیں ہے، تو وہ POS پر "OFFLINE SHIFT CHANGE" کا بٹن دبائے گا۔ نیا کیشئیر پرانے لاگ ان پر ہی کام جاری رکھے گا (کیونکہ بغیر انٹرنیٹ نیا لاگ ان کلاؤڈ سے وریفائی نہیں ہو سکتا)، لیکن سسٹم اندرونی طور پر ٹائم نوٹ کر لے گا۔ 
- **ڈیٹا سنک (Data Sync):** جیسے ہی انٹرنیٹ واپس آئے گا، سسٹم اسکرین پر بار بار میسج دے گا کہ اپنا اکاؤنٹ لاگ ان کریں۔ نئے کیشئیر کے لاگ ان کرتے ہی سارا آف لائن ڈیٹا کلاؤڈ پر اپ ڈیٹ ہو جائے گا۔ شفٹ چینج بٹن دبانے سے پہلے کا ڈیٹا پہلے کیشئیر کے کھاتے میں اور بعد کا ڈیٹا دوسرے کیشئیر کی شفٹ میں خود بخود تقسیم ہو جائے گا۔

## 3. ریسپی (Recipe) کاسٹنگ اور سیکیورٹی
- انوینٹری کو فائنل پروڈکٹ کی بجائے خام مال (Raw Material) مثلاً بن، چکن پیٹی، مائیونیز وغیرہ کی سطح پر مینج کیا جائے گا۔
- **آٹو کیلکولیشن:** سسٹم گودام میں آنے والے خام مال کی قیمت خرید (Purchase Price) کی بنیاد پر خود بخود فائنل پروڈکٹ (مثلاً برگر) کی کاسٹ پرائس نکال لے گا۔
- **سیکیورٹی اور پاس ورڈ:** کوئی بھی برانچ مینیجر یا کیشئیر اپنی مرضی سے اس کاسٹ پرائس کو تبدیل نہیں کر سکتا۔ اگر خام مال کی قیمت میں اتار چڑھاؤ کی وجہ سے کاسٹ پرائس کو مینوئل (Manual) تبدیل کرنا پڑے، تو سسٹم سپر ایڈمن کا پاس ورڈ اور تبدیلی کی وجہ (Reason) مانگے گا۔ اس سے سسٹم میں خرد برد اور مس یوز کو روکا جا سکے گا۔

## 4. آن لائن ڈائنامک ڈیل کیلکولیٹر (پرافٹ مارجن کی بنیاد پر)
ڈیلز کا حساب خام مال یا ریسپی لیول پر نہیں ہو گا، بلکہ فائنل پروڈکٹ کے پرافٹ مارجن کی بنیاد پر ہو گا تاکہ سیلز کو بوسٹ (Boost) کیا جا سکے۔
- **کام کا طریقہ:** ہر تیار پروڈکٹ پر ایک خالص منافع (Profit Margin) سیٹ ہوتا ہے (مثلاً 35%)۔ ہم اس پرافٹ مارجن کے ساتھ کھیل کر کسٹم ڈیلز آفر کریں گے۔
- **مثال کے طور پر:**
  - **برگر (پرافٹ مارجن 25%):** اگر گاہک 1 برگر لیتا ہے تو منافع میں سے 10% ڈسکاؤنٹ دے دیں۔ اگر 2 برگر لیتا ہے تو 15% آف کر دیں۔
  - **پیزا (پرافٹ مارجن 20%):** 1 پیزا پر 10% آف، اور 2 پیزا پر 15% آف۔
  - **شوارما (پرافٹ مارجن 30%):** اس کی ڈیلز بھی اسی طرح پرافٹ کے حساب سے بنیں گی۔
اس سے گاہک اپنی پسند کی ڈیلز خود بنا سکے گا اور مالک کو نقصان بھی نہیں ہو گا کیونکہ سسٹم ڈسکاؤنٹ صرف پرافٹ مارجن کے اندر سے ہی دے گا۔

## 5. کے او ٹی (KOT) اور آرڈر ٹریکنگ سسٹم
- **تین پرنٹس:** کیشئیر کے آرڈر پنچ کرتے ہی تین رسیدیں نکلیں گی۔ ایک گاہک کے لیے، ایک کیشئیر کے اپنے ریکارڈ کے لیے، اور ایک کچن کے لیے (KOT)۔
- **ڈیجیٹل کچن اسکرین (LCD KOT):** کچن میں شیف کے سامنے ایک ٹچ اسکرین لگی ہو گی جس پر آرڈر کی تفصیل آ جائے گی۔ شیف اسکرین پر ٹچ کر کے بتائے گا کہ آرڈر کتنی دیر میں تیار ہو گا۔
- **لائیو ٹریکنگ:** شیف کا دیا گیا ٹائم کیشئیر کے POS اور گاہک کی موبائل ایپ پر اسی وقت شو ہو جائے گا۔
- **آرڈر کے مراحل (Order Status):** گاہک ایپ پر لائیو دیکھ سکے گا:
  1. *Order with Cashier* (آرڈر کیشئیر کے پاس ہے)
  2. *Order in Kitchen* (آرڈر کچن میں بن رہا ہے)
  3. *Order Ready for Delivery* (کھانا تیار ہے)
  4. *Order is on the way* (رائیڈر آرڈر لے کر نکل چکا ہے)

## 6. پیمنٹ گیٹ وے اور فال بیک (Payment Gateway Fallback)
- سسٹم میں ایک تھرڈ پارٹی پیمنٹ گیٹ وے API شامل ہو گی جو پاکستان اور پوری دنیا کے کارڈز اور آن لائن پیمنٹس کو سپورٹ کرے گی۔
- **پیمنٹ فال بیک لاجک (Payment Fallback):** اگر کسی بھی تکنیکی خرابی کی وجہ سے آن لائن پیمنٹ گیٹ وے کام کرنا چھوڑ دیتا ہے، تو آرڈر کینسل نہیں ہو گا۔
  - سسٹم خود بخود آرڈر کو **"Pay at Counter"** (ٹیک اوے/ڈائن ان کے لیے) اور **"COD"** (ڈلیوری کے لیے) میں تبدیل کر دے گا۔
  - گاہک کی ایپ پر فوراً میسج آ جائے گا: *"Due to technical issues online payment not available."*
  - بالکل یہی میسج برانچ کے کیشئیر کے POS پر بھی نظر آئے گا تاکہ کیشئیر کو صورتحال کا علم ہو اور وہ گاہک کو مناسب طریقے سے گائیڈ کر کے کیش وصول کر سکے۔

## 7. کسٹمر ایپ اور ویب سائٹ کی برانچ راؤٹنگ (Branch Routing & Banners)
- **لوکیشن پاپ اپ (Location Popup):** جب کوئی گاہک ایپ یا ویب سائٹ کھولے گا تو سب سے پہلے اسے ایک پاپ اپ (Popup) نظر آئے گا جس میں وہ 'Delivery' یا 'Pickup' منتخب کرے گا، اپنا شہر چنے گا اور متعلقہ برانچ سلیکٹ کرے گا۔
- **ایک جیسا ڈیزائن (Unified UI):** تمام برانچز کا ڈیزائن اور پیج لے آؤٹ بالکل ایک جیسا ہو گا۔ برانچ سلیکٹ کرنے کے بعد صرف اس برانچ کی مخصوص ڈیلز، آفرز اور مینو (Menu) بیک اینڈ سے لوڈ ہو کر نظر آئیں گے۔
- **ڈیلز اور بینرز کے سائز (Banner Sizes for Designers):**
  - **ویب سائٹ ڈیسک ٹاپ سلائیڈر (Desktop Slider):** 1920 x 800 پکسلز
  - **موبائل ایپ اور ویب موبائل سلائیڈر (Mobile Slider):** 1080 x 600 پکسلز
  - **اسکوائر ڈیل کارڈز (Square Offers):** 1080 x 1080 پکسلز

## 8. تھرڈ پارٹی ڈیلیوری انٹیگریشنز (Foodpanda وغیرہ)
- **مسئلہ:** عام طور پر کیشئیر کو فوڈ پانڈا یا دوسری ڈیلیوری ایپس کے آرڈرز مینوئل (Manual) طریقے سے POS میں فیڈ کرنے پڑتے ہیں، جس میں غلطی کا بہت چانس ہوتا ہے۔
- **API Gateway کا حل:** ہمارے سسٹم میں ایک خاص "API Gateway" ماڈیول ہو گا جو ان ایپس (جیسے Foodpanda) سے براہ راست جڑا ہو گا۔ 
- **خودکار نظام (Automation):** جیسے ہی وہاں کوئی آرڈر آئے گا، یہ گیٹ وے اسے فوراً خودکار طریقے سے برانچ کے POS پر بھیج دے گا اور کچن میں اس کا KOT پرنٹ ہو جائے گا۔ اس سے کیشئیر کی محنت اور غلطی کا چانس مکمل زیرو ہو جائے گا۔

## 9. شفٹ مینجمنٹ اور آرڈر کینسلشن کنٹرول (Loss Prevention)
- **شفٹ مینجمنٹ:** سسٹم میں ایک سخت شفٹ مینجمنٹ ماڈیول ہو گا جس میں Opening Float (شروع کا کیش)، Blind Drop اور Shift Closing شامل ہوں گے۔
- **ڈسکاؤنٹ اور کینسل کی پابندی:** کیشئیر اپنی مرضی سے کسی آرڈر پر ڈسکاؤنٹ نہیں دے سکتا اور نہ ہی پنچ ہونے کے بعد آرڈر کو کینسل (Void) کر سکتا ہے۔ ایسا کرنے کے لیے **برانچ مینیجر کا خفیہ پن (PIN) یا انگوٹھا** لازمی ہو گا۔
- **انوینٹری کی واپسی:** اگر مینیجر کا پن لگا کر کوئی آرڈر کینسل کیا جائے گا، تو سسٹم خود بخود اس آرڈر کا خام مال (Inventory) واپس کھاتے میں شامل کر دے گا۔
- **ہیڈ آفس آڈٹ (Negative Spots):** کینسل کیے گئے آرڈرز سسٹم سے غائب نہیں ہوں گے، بلکہ یہ برانچ کے کھاتے میں "Negative Spots" کے طور پر ہیڈ آفس کو بھیجے جائیں گے۔ ہیڈ آفس یا اونر (Owner) ڈیش بورڈ پر ان کینسل شدہ آرڈرز کی تفتیش کرے گا اور پھر انہیں خود ریزولو (Resolve/Close) کرے گا، تاکہ چوری یا غفلت کو روکا جا سکے۔

## 10. وینڈر اور پرچیز آرڈر مینجمنٹ (Supply Chain)
- **وینڈر پورٹل (Vendor Login):** ہر وینڈر (سپلائر) کو اپنا ایک لاگ ان دیا جائے گا جو وہ موبائل یا لیپ ٹاپ پر استعمال کر سکے گا۔
- **پرچیز آرڈر (PO):** گودام (Warehouse) سے وینڈر کو براہ راست پرچیز آرڈر بھیجا جائے گا۔
- **ڈلیوری اور پیمنٹ:** وینڈر مال پہنچانے کے بعد اپنے موبائل سے اسے "Delivered" مارک کرے گا اور ساتھ ہی بتائے گا کہ بل کی ادائیگی ہو گئی ہے (Paid) یا ادھار ہے (Unpaid)۔
- **ٹرانزٹ لاس (Transit Loss):** اگر وینڈر یا گودام سے 50 کلو چکن بھیجا گیا اور برانچ تک 48 کلو پہنچا، تو برانچ مینجر صرف 48 کلو ہی ریسیو کرے گا۔ سسٹم خود بخود باقی 2 کلو کو "Transit Loss" (راستے کا نقصان) کے طور پر ریکارڈ کر لے گا تاکہ ہر گرام کا حساب موجود رہے۔

## 11. کسٹمر لائلٹی والٹ (CRM & Loyalty Engine)
- **کیش بیک اور والٹ (Cashback Points):** کسٹمر کو ہر آرڈر پر کچھ پوائنٹس یا کیش بیک ملے گا جو ان کے فون نمبر سے منسلک "ڈیجیٹل والٹ" (Digital Wallet) میں جمع ہوتا رہے گا۔
- **ریٹینشن (Retention):** اس کا سب سے بڑا فائدہ یہ ہے کہ کسٹمر اگلی بار جب بھی آرڈر کرے گا، وہ اپنے پوائنٹس استعمال کر سکے گا۔ اس سے گاہک بار بار آپ ہی کی ایپ پر واپس آئے گا (Repeat Customer)۔

## 12. انوینٹری کے زمینی حقائق (Negative Inventory / Soft Block)
- **مسئلہ:** عام سسٹمز میں جب انوینٹری زیرو ہو جاتی ہے تو آرڈر پنچ ہونا بند ہو جاتا ہے۔ لیکن رئیلٹی (Reality) میں اکثر برانچ مینجر ایمرجنسی میں ساتھ والی دکان سے ٹماٹر یا کوئی اور چیز خرید لاتا ہے اور سسٹم میں انٹری کرنا بھول جاتا ہے۔ اگر سسٹم آرڈر روک دے تو سیلز کا نقصان ہوتا ہے۔
- **Soft Block کا حل:** ہمارے سسٹم میں **"Negative Inventory"** کی سہولت ہو گی۔ اگر کوئی چیز زیرو بھی ہو جائے تو سسٹم کیشئیر کو آرڈر پنچ کرنے دے گا، تاکہ سیل نہ رکے۔
- **Red Alert:** بیک اینڈ پر اس چیز کا بیلنس مائنس (Negative) میں چلا جائے گا اور برانچ مینجر کی اسکرین پر "Red Alert" آنا شروع ہو جائے گا کہ اپنا سٹاک اپ ڈیٹ کریں۔ جیسے ہی مینجر اپنی لوکل پرچیز (Local Purchase) کی انٹری کرے گا، مائنس والا بیلنس خود ہی ایڈجسٹ ہو جائے گا۔

## 13. کسٹمر کی ڈیمانڈ اور کسٹمائزیشن (Special Instructions & Voice KOT)
- **مقامی رحجان (Local Behavior):** پاکستان میں کسٹمرز اکثر "مایونیز زیادہ" یا "پیاز مت ڈالنا" جیسی فرمائشیں کرتے ہیں۔ اس کے لیے کیشئیر کو لمبی سیٹنگز میں جانے کے بجائے POS پر ایک سیدھا "Special Instructions" کا ٹیکسٹ باکس ملے گا۔
- **پرنٹ اور اسکرین الرٹ:** یہ ہدایات کچن کی رسید (KOT) پر بہت نمایاں اور بڑے حروف میں پرنٹ ہوں گی تاکہ شیف سے غلطی نہ ہو۔
- **وائس ریمائنڈر (Voice Reminder):** کچن میں لگی ڈیجیٹل اسکرین (LCD) پر نہ صرف یہ ہدایات نظر آئیں گی، بلکہ سسٹم بول کر بھی بتائے گا (مثلاً: "آرڈر نمبر 410 میں برگر میں مایونیز زیادہ ڈالنی ہے")۔ کچن کا عملہ جب چاہے اسکرین سے اس آواز (Voice) کو سائلنٹ (Silent) بھی کر سکتا ہے۔

## 14. کیش مینجمنٹ اور شفٹ کلوزنگ (Cash Reconciliation)
- **مسئلہ:** شفٹ کے اختتام پر اکثر کیش پورا نہیں ہوتا، اور کیشئیرز سسٹم کی پیچیدگی کا بہانہ بناتے ہیں۔
- **چیک لسٹ شفٹ کلوزنگ:** شفٹ کلوز کرنے کا طریقہ انتہائی آسان اور ایک چیک لسٹ کی طرح ہو گا۔ سسٹم کیشئیر کو واضح سمری دے گا (مثال کے طور پر: "آج آپ نے 50 آرڈرز کیے، ٹوٹل سیل 50,000 ہے، کینسلیشنز 2000 کی تھیں")۔
- **کیش کا فرق (Discrepancy):** اس کے بعد سسٹم کیشئیر سے کہے گا کہ "اب دراز (Drawer) کا کیش درج کریں"۔ اگر سسٹم کے کیش اور دراز کے کیش میں فرق آیا، تو کیشئیر کو وہیں پر لازمی ایک "وجہ (Reason)" درج کرنی ہو گی۔ یہ الرٹ سیدھا ہیڈ آفس پہنچ جائے گا تاکہ اسی وقت حساب ہو سکے۔

## 15. بزنس ڈے (Day Start / Day Close) کی لاجک
- **رات 12 بجے کا مسئلہ:** ریسٹورنٹس اکثر رات گئے تک کھلتے ہیں۔ اگر شفٹ 14 تاریخ کو شروع ہوئی اور رات 3 بجے ختم ہوئی، تو کیلنڈر میں تو 15 تاریخ ہو چکی ہوتی ہے۔
- **Day Start بٹن:** کیشئیر صبح آ کر "Day Start" کا بٹن دبائے گا، جس سے سسٹم کی تاریخ لاک (Lock) ہو جائے گی۔ اب رات 3 بجے تک کے سارے آرڈرز 14 تاریخ کی سیلز (Sales) میں ہی لکھے جائیں گے۔ 
- **Day Close کا طریقہ:** رات کو کیشئیر "Day Close" کا بٹن دبائے گا تو دن ختم ہو گا۔ اگر لائٹ جانے سے سسٹم بند ہو گیا اور ڈے کلوز نہ ہو سکا، تو اگلے دن صبح کیشئیر کو نیا دن شروع کرنے سے پہلے پرانا "Day Close" لازمی کرنا ہو گا۔ یہ کام موبائل یا ہیڈ آفس سے بھی کیا جا سکتا ہے۔

## 16. لیٹ نائٹ ڈیلیوری اور بقایا کیش (Pending Rider Cash)
- **ڈیلیوری ٹائم کٹ آف (Cut-off):** سسٹم کلوزنگ ٹائم سے بالکل 30 منٹ پہلے آن لائن ڈیلیوری کے آرڈرز لینا خود بخود بند کر دے گا۔
- **رائیڈر بقایا کیش:** اگر کوئی آرڈر بالکل آخری وقت پر کچن سے نکلا ہے اور مینیجر نے رائیڈر کو آرڈر دے کر سیدھا گھر بھیج دیا ہے، تو کیشئیر کے پاس کیش کم ہو گا۔ ایسی صورت میں سسٹم کیشئیر کو "Pending Rider Cash" کا آپشن دے گا تاکہ وہ اپنی کلوزنگ کر کے گھر جا سکے۔
- **اگلے دن وصولی:** سسٹم کو یاد رہے گا کہ پچھلے دن کا کتنا کیش رائیڈر کے پاس تھا۔ اگلے دن جو بھی کیشئیر سب سے پہلے لاگ ان کرے گا، اسے فوراً ایک پاپ اپ (Popup) آئے گا کہ کل کے فلاں رائیڈر کی اتنی رقم بقایا ہے۔ وہ رقم وصول کر کے سسٹم کو نارمل (Normalize) کر دے گا۔

## 17. رول بیسڈ ایکسس کنٹرول اور ہیرارکی (RBAC & Hierarchy)
یہ سسٹم مختلف درجوں (Tiers) کی بنیاد پر ایکسس کنٹرول کرتا ہے، جس سے ہر بندے کو صرف اپنے کام سے متعلقہ اسکرینز ہی نظر آتی ہیں:
- **لیول 1 (Super Admin):** اسے تمام برانچز اور برانڈز پر مکمل کنٹرول حاصل ہے۔ یہ نئے ہیڈ آفس ایڈمن بنا سکتا ہے اور گلوبل سیٹنگز کر سکتا ہے۔
- **لیول 2 (Brand / Head Office Level):**
  - **ہیڈ آفس ایڈمن:** مخصوص برانڈ کی آپریشنز، سینٹرل مینو پرائسنگ اور گودام کو کنٹرول کرتا ہے۔
  - **برانڈ اونر / اوورسیز انویسٹر (Investor App):** جو مالکان باہر ملک ہوتے ہیں، انہیں ایک خاص موبائل ایپ دی جائے گی جس پر وہ لائیو سیلز (Live Sales)، پرافٹ اور لاس (P&L) دیکھ سکیں گے، مگر سسٹم میں تبدیلی نہیں کر سکیں گے۔
- **لیول 3 (Branch Level):**
  - **برانچ اونر / فرنچائزی:** اپنی برانچ کی تمام تفصیلات (سیلز، انوینٹری) دیکھ سکتا ہے۔
  - **برانچ مینجر:** برانچ کو چلاتا ہے، کینسل کیے گئے آرڈرز پر پن (PIN) لگاتا ہے اور ایمرجنسی میں نیگیٹو انوینٹری کو کنٹرول کرتا ہے۔
  - **اکاؤنٹس:** صرف کھاتوں اور وینڈر پیمنٹس تک رسائی رکھتا ہے۔ مینو یا ریسپی کو نہیں چھیڑ سکتا۔
- **لیول 4 (Operational Floor Level):**
  - **کیشئیر:** صرف ڈے سٹارٹ/کلوز، اور آرڈر پنچ کر سکتا ہے۔ اسے پرافٹ اور کاسٹ پرائس نظر نہیں آئے گی۔
  - **رائیڈرز (Riders):** صرف موبائل ایپ پر ڈلیوری لوکیشن اور اپنا کیش دیکھ سکتے ہیں۔

## 18. شفٹ ہینڈ اوور اور پنکچوئلٹی پوائنٹس (Shift Mapping)
- **ٹائم لاکنگ (Time Locking):** کیشئیرز کی شفٹس سسٹم کے ٹائم کے ساتھ لاک ہوں گی۔ مارننگ شفٹ والا کیشئیر اس وقت تک کلوزنگ نہیں کر سکے گا جب تک ایوننگ شفٹ والا آ کر سسٹم میں اپنا لاگ ان نہ کرے۔
- **پوائنٹ سسٹم (Reward & Penalty):** اگر ایوننگ والا کیشئیر دیر سے آتا ہے، تو سسٹم اس کا ریکارڈ رکھے گا۔ جو کیشئیر دیر سے آیا ہے اسے نیگیٹو (Negative) پوائنٹس ملیں گے، اور جس کیشئیر کو اس کی وجہ سے زیادہ ٹائم دینا پڑا (Overtime)، سسٹم اسے پازیٹو (Positive) پوائنٹس اور ریوارڈ دے گا۔

## 19. مارکیٹنگ اور گروتھ انجن (Marketing & Growth Engine)
مارکیٹنگ کو دو باقاعدہ حصوں میں تقسیم کیا گیا ہے تاکہ ہر سیل (Sale) اور ہر خرچے کا حساب رکھا جا سکے:

### 1. ڈیجیٹل مارکیٹنگ (SLA اور ٹارگٹ کی بنیاد پر):
- **SLA اور ٹارگٹ میٹر:** مارکیٹنگ ایجنسی کے لیے مہینے کا ایک ٹارگٹ (مثلاً 1000 آن لائن آرڈرز) لاک کر دیا جاتا ہے۔
- **بونس اور جرمانہ (Bonus & Penalty):** اگر آرڈرز ٹارگٹ سے زیادہ ہوں تو ایجنسی کو اضافی کمیشن ملے گا، اور اگر کم ہوں تو ان کی فیس میں سے جرمانہ (Penalty) کٹے گا۔
- **شفاف ٹریکنگ (Attribution):** اس ٹارگٹ میں صرف وہ آرڈرز گنے جائیں گے جو مخصوص لنکس یا پرومو کوڈز کے ذریعے آئیں گے۔ ڈائریکٹ یا واک اِن (Walk-in) آرڈرز کو اس میں شامل نہیں کیا جائے گا تاکہ ایجنسی دھوکہ نہ کر سکے۔

### 2. ایفیلیٹ مارکیٹنگ (کمیشن بیسڈ سسٹم):
یہ ایک خودکار (Automated) انجن ہے جس میں لوگوں کے "Affiliate Wallet" میں کمیشن جمع ہوتا ہے۔ اس کے 4 ماڈل ہیں:
- **ماڈل A (انفلوئنسرز/ویلاگرز):** ہر انفلوئنسر کا اپنا QR اور لنک ہو گا۔ یہ کوڈ صرف آن لائن ایپ یا ویب سائٹ پر چلے گا تاکہ کیشئیر فراڈ نہ کر سکے۔ سیل ہونے پر انفلوئنسر کو کمیشن ملے گا۔
- **ماڈل B (رائیڈر پروموٹرز):** ڈیلیوری رائیڈرز کی ایپ میں ایک "Promoter QR" ہو گا۔ رائیڈر راستے میں دکانداروں یا دوستوں کو ایپ ڈاؤن لوڈ کروا کر کمیشن کما سکتا ہے۔
- **ماڈل C (Refer-a-Friend):** پرانے کسٹمرز اپنے دوستوں کو لنک بھیجیں گے۔ دوست کو پہلے آرڈر پر ڈسکاؤنٹ ملے گا اور پرانے کسٹمر کو کیش بیک ملے گا (وہ بھی تب، جب نئے کسٹمر کا آرڈر کامیابی سے ڈیلیور ہو جائے تاکہ فیک اکاؤنٹس کا فراڈ نہ ہو)۔
- **ماڈل D (B2B پارٹنرشپ):** جم (Gyms)، سیلونز یا دفاتر میں آپ کے QR والے اسٹینڈیز (Standees) رکھے جائیں گے۔ وہاں سے ہونے والے ہر آرڈر کا کمیشن اس دکان کے مالک کے کارپوریٹ والٹ میں جائے گا۔

### End-to-End Online Order, KDS aur Rider Delivery Tracking

**Naya System Workflow:**

1. **POS me Order aana aur Cart Price (Item Prices):**
   Pehle jab aap Online Order ko POS me accept karte thay, tou items ki price `0` aati thi kyun ke order data sirf text mein tha (jaise "1x Zinger Burger"). 
   - **Fix:** Ab system automatically POS ki local `db.products` list ko search karta hai aur original item prices nikal kar POS Cart mein daal deta hai, taa ke bill ka total bilkul theek banay.

2. **Online Tab aur KDS Timers (Live Countdown):**
   Jab Cashier "Accept & Send to KDS" dabata hai:
   - Order ka KDS Status "Pending Chef" ho jata hai.
   - Jese hi KDS mein Chef "Accept Order" karta hai aur apna timer lagata hai (e.g. 15 mins), POS ki Online Tab mein automatically "Accepted by Chef (Dispatched)" likha aa jata hai aur **Chef ka live timer** wahan bhi chalna shuru ho jata hai.
   - Sath hi wahan **Print Button** aa jata hai taa ke cashier asani se customer ya rider ke liye slip print nikal sakay.

3. **Rider App aur Auto-Dispatch:**
   - Jese hi Chef KDS mein order accept karta hai, POS system us order ko automatically **Rider App** par dispatch kar deta hai.
   - Rider ko ab apni app mein wahi **Chef wala Timer** (e.g. `Chef Prep: 10m 20s`) chalta hua nazar aayega. Is tarah rider ko pata hoga ke kitni der mein pickup point per pohanchna hai.

4. **Live Map Tracking (GPS Tracking):**
   - Jab Rider order pick kar ke nikalta hai, uski app har 3 second baad apna GPS Coordinates (latitude/longitude) Bridge server ko bhejti rehti hai.
   - POS mein **Delivery Tab** ka map in coordinates ko live poll karta hai aur Rider ka Marker map par ghoomta hua (animate hota hua) nazar aata hai, jisay Cashier (aur customer) dekh saktay hain.

5. **Cash Settlement (COD Ledger Settle Karna):**
   - Jab Rider app mein order ko "Payment Collected & Complete" kar deta hai, toh usko ek "Pending Settle at POS" ka banner nazar aane lagta hai.
   - Cashier jab wapas POS mein Delivery tab میں آ کر **"Settle Cash"** dabata hai (Rider se cash le kar), toh order POS ledger se clear ho jata hai aur `SETTLED` mark ho jata hai.
   - Rider ki app ko fauran yeh update mil jati hai aur uski app mein automatically Green color ka **"Settled by Cashier"** badge aa jata hai. Is tarah clear rehta hai ke kis order ka cash submit ho gaya.

## 20. ڈیلز اور ڈسکاؤنٹ کی منظوری
- **منظوری کی شرط (Approval Required):** مارکیٹنگ ٹیم یا آپریشنز والے جو بھی نئی ڈیل، ڈسکاؤنٹ یا آفر سسٹم میں بنائیں گے، وہ فوراً لائیو (Live) نہیں ہو گی۔ 
- **اتھارٹی (Authority):** وہ ڈیل پہلے سسٹم میں "Pending Approval" کے اسٹیٹس میں جائے گی۔ جب تک ہیڈ آفس (Head Office)، برانڈ اونر (Owner)، یا منظور شدہ مینجر اسے چیک کر کے "Approve" نہیں کرے گا، وہ ڈیل کسٹمرز کو شو نہیں ہو گی۔ اس سے غلط یا نقصان دہ ڈیلز لگنے کا خطرہ زیرو ہو جائے گا۔

## 21. ڈیٹا بیس اور ٹیکنیکل اصول (Database Principles)
- **ملٹی ٹینینٹ کی (store_id):** ہر ٹیبل میں `store_id` کا ہونا لازمی ہے تاکہ ڈیٹا مکس نہ ہو۔
- **آف لائن سنک (Event Sourcing):** جب انٹرنیٹ آئے گا تو پرانا ڈیٹا اوور رائٹ (Overwrite) نہیں ہو گا، بلکہ پلس/مائنس (+10, -5) کے حساب سے نیا بیلنس اپ ڈیٹ ہو گا۔
- **لوکل کیشنگ (Local Credential Caching):** آف لائن ہونے کے باوجود کیشئیرز کے پن (PINs) سسٹم میں محفوظ رہیں گے تاکہ بغیر انٹرنیٹ کے بھی شفٹ تبدیل (Shift Handover) ہو سکے۔
- **آڈٹ ٹریل (Audit Trail):** ہر ڈسکاؤنٹ اور کینسل ہونے والے آرڈر کے ساتھ یہ درج ہو گا کہ کس نے کیا (`changed_by`)، کیوں کیا (`reason`) اور کس نے منظور کیا (`approved_by`)۔

## 22. تھرڈ پارٹی ایپس اور بلیک ہول الرٹ (Aggregator Logic)
- **آف لائن بلیک ہول (Offline Blackhole):** کلاؤڈ سسٹم مسلسل برانچ کے POS کا "ہارٹ بیٹ" (Heartbeat) چیک کرتا رہے گا۔ اگر انٹرنیٹ 3 منٹ سے زیادہ بند رہا، تو کلاؤڈ خودکار طریقے سے Foodpanda پر برانچ کو پاز (Pause) کر دے گا تاکہ آرڈرز ضائع نہ ہوں اور ریٹنگ نہ گرے۔

## 23. ڈیلز میں مارجن پروٹیکشن (Margin Protection)
- **سیفٹی تھریشولڈ (Safety Threshold):** اگر ہیڈ آفس کسی خام مال (مثلاً چکن) کی قیمت بڑھاتا ہے، تو سسٹم لائیو ڈیلز کا مارجن خود چیک کرے گا۔ اگر ڈیل کا پرافٹ مارجن 10% سے کم ہو جائے، تو سسٹم اس ڈیل کو آٹو-سسپنڈ (Auto-suspend) کر کے مارکیٹنگ ایڈمن کو الرٹ بھیج دے گا۔
- **سلاٹ بیسڈ میلز (Combo Builders):** کسٹمرز اپنی مرضی کے کومبوز (Mains, Sides, Upsells) بنا سکیں گے۔

## 24. کچن پرنٹنگ اور فال بیک (KOT Fallback)
- **ٹارگٹڈ پرنٹ (Triple Print):** کسٹمر رسید، کیشئیر کاپی، اور کچن KOT۔
- **فال بیک (Fallback):** اگر کچن کی ڈیجیٹل اسکرین (KDS) کا نیٹ ورک فیل ہو جائے، تو سسٹم خودکار طور پر ڈیجیٹل آرڈر کو کچن کے تھرمل پرنٹر پر پرنٹ (Auto-route) کر دے گا تاکہ کچن نہ رکے۔
- **وائس الرٹ:** اردو/انگلش میں باقاعدہ وائس اناؤنسمنٹ ہو گی اور اسپیشل ہدایات (Special Instructions) موٹے حروف میں نمایاں ہوں گی۔

## 25. اے آئی ڈویلپمنٹ اور پرامپٹ کی ہدایات (AI Prompt Instructions)
یہ سسٹم مختلف AI (جیسے کلاڈ، جیمنائی) کے ذریعے کوڈ کروانے کے لیے ڈیزائن کیا گیا ہے۔ لہذا کوڈ جنریٹ کرتے وقت ان اصولوں پر سختی سے عمل ہو گا:
1. **Store ID لازمی:** ہر ڈیٹا بیس کیوری (Query) میں `store_id` لازمی چیک ہو گا تاکہ ڈیٹا مکس نہ ہو۔
2. **Concurrency Safety:** انوینٹری اور والٹس کے بیلنس کے لیے اٹامک (Atomic) ٹرانزیکشنز استعمال ہوں گی تاکہ ایک ہی وقت میں دو آرڈرز پنچ ہونے پر بیلنس خراب نہ ہو۔
3. **آف لائن سنک (Offline Sync):** ڈیٹا سنک کرنے والی APIs اپینڈ-اونلی (Append-only) لاجک پر چلیں گی۔
4. **ویلیڈیشن (Validation):** ڈسکاؤنٹس اور کینسلیشن کی ہر API پر `manager_pin` اور `reason` کی ویلیڈیشن لازمی ہو گی۔
5. **اردو سپورٹ (UTF-8):** ڈیٹا بیس کے ٹیبلز میں اردو زبان کو محفوظ کرنے کے لیے `utf8mb4` فارمیٹ استعمال کیا جائے گا۔

## 26. ٹیکنالوجی کا انتخاب (Technology Stack)
- **بیک اینڈ (Backend):** Node.js (NestJS) یا PHP (Laravel 11) + PostgreSQL
- **لوکل پی او ایس (Local POS):** Electron / React PWA اور Local SQLite ڈیٹا بیس
- **موبائل ایپس:** Flutter (Customer + Rider Apps کے لیے)
- **ریئل ٹائم:** Socket.io (کچن کی سکرین اور آرڈر ٹریکنگ کے لیے)

## 27. ماڈیولر سسٹم اور فیچر ٹوگلنگ (SaaS Feature Toggling)
- **ضرورت کے مطابق فیچرز:** اس سسٹم کو ایک ماڈیولر (Modular) طریقے سے ڈیزائن کیا جائے گا۔ اس کا مطلب یہ ہے کہ کلائنٹ جتنے فیچرز کے پیسے دے گا یا جو استعمال کرنا چاہے گا، سپر ایڈمن (Super Admin) صرف وہی فیچرز آن (ON) کرے گا۔
- **آن/آف کنٹرول:** مثال کے طور پر، اگر کلائنٹ کو صرف POS چاہیے، تو باقی سب آف رہے گا۔ اگر اسے POS + Online Ordering + Vendor System چاہیے، تو وہ آن کر دیے جائیں گے۔ کسی بھی فیچر کو کسی بھی وقت آن یا آف کیا جا سکے گا اور اس سے باقی سسٹم پر کوئی اثر نہیں پڑے گا۔

---
یہ تفصیلی خاکہ آپ کے بتائے گئے فرائی چکس (Frichicks) کے 7 سالہ تجربے کو مدنظر رکھ کر بنایا گیا ہے تاکہ مستقبل میں یہ سسٹم ایک مکمل فاسٹ فوڈ چین کے لیے بلا تعطل کام کر سکے۔

## 28. Kitchen Display System (KOT)
- **Dedicated Screen:** KOT (Kitchen Order Ticket) POS ke andar nahi balkay ek bilkul alag (standalone) screen par show hoga (e.g., /kitchen route).
- **Extra Notes / Special Instructions:** Cashier POS aur Online Customer dono order ke sath extra notes (jaise 'Extra Cheese') likh saktay hain jo barah-e-raast Kitchen Chef ki screen par Urgent label aur red blink ke sath nazar ayenge.
- **Cross-Tab/Device Sync:** Dexie.js (IndexedDB) aur useLiveQuery ko istemal kar ke POS aur Kitchen screen ke darmiyan real-time connection banaya gaya hai. Jab bhi order create ho, wo automatic KOT table mein chala jayega aur jab Chef 'Accept' ya 'MARK READY' kare ga, tou status update Cashier aur Rider/Customer flow ko foran mil jayega.
- **Cashier KOT Monitoring (Read-Only):** Cashier POS ke KOT tab mein ab asal kichen wali screen (KitchenView) lagai gayi hai jisme 'readOnly=true' pass kiya gaya hai. Is ka maqsad ye hai ke cashier exactly wohi cards aur live timer dekh sakay jo Chef dekh raha hai, lekin wo kisi action button (jaise MARK READY) par click na kar sakay.


### 29. Phase 9: Settings, Payment Checkout, aur Print Formatting
- **Settings System**: POS ke andar ab `localStorage` ki madad se device-specific settings mehfooz ki jati hain (Printer Name, Bill/KOT Print Qty, KOT Mode: PRINT/SCREEN, Till Lock Enable/Disable, aur Duplicate KOT allow/disallow).
- **Payment Window**: Jab Cashier 'Pay' par click karta hai, toh ek bada Payment Modal khulta hai. Yahan Invoice total nazar aata hai aur Cashier customer ki di hui raqam (Cash Given) likh sakta hai. System khud Return Change calculate karta hai.
- **Till Lock Mechanism**: 'Print Bill & Open Draw' click karne ke baad system ka UI puri tarah lock ho jata hai (Ek bara lal parda aa jata hai "Lock Your Till First") jab tak Cashier Till lock karke button nahi dabata. Ye security feature settings se on/off kiya ja sakta hai.
- **Duplicate KOT Protection**: Agar Cashier kisi KOT ko dubara print karne ki koshish kare, aur `duplicateKOTEnabled` true ho, toh system Manager PIN (e.g. 1234) mangta hai. Uske baad hi duplicate KOT nikalta hai.
- **Print Templates**: KOT aur Bill ko thermal printer (80mm) ke hisaab se format kiya gaya hai aur `@media print` ki madad se hidden components se window.print() fire kiya jata hai.

---

## ابتک کیا کام ہوا — لائیو POS کی موجودہ حالت (جون 2026)

یہ حصہ اس بات کا ریکارڈ ہے کہ ابتک کوڈ میں کیا کیا تبدیلیاں کی جا چکی ہیں تاکہ اگلا AI سیشن یا ڈویلپر بغیر دوبارہ پوچھے کام شروع کر سکے۔

### موجودہ ٹیکنالوجی (چل رہی ہے)
- **Frontend:** React + Vite 8 (Rolldown bundler)
- **Local DB:** Dexie.js (IndexedDB) — tables: kots, products, categories, transactions, users
- **Ports:** Frontend `localhost:5173` | Backend NestJS `localhost:3000`
- **Main File:** `d4u-pos-client/src/App.tsx` (~1480 لائنیں)

### ضروری تکنیکی بات — Vite 8 کا فرق
Vite 8 نے Rolldown (Rust-based) bundler استعمال کرنا شروع کیا۔ یہ TypeScript کے `interface` اور `type` imports کے بارے میں بہت سخت ہے:
- ہر جگہ جہاں صرف TypeScript type یا interface import ہو، وہاں `import type { ... }` لکھنا لازمی ہے
- عام `import { SomeType }` لکھنے پر `MISSING_EXPORT` error آتی ہے اور سکرین سفید (white screen) ہو جاتی ہے
- **یہ fix ہو چکا ہے:** StitchKDS.tsx، KitchenView.tsx، NewOrderOverlay.tsx، SettingsView.tsx، DashboardView.tsx، OrdersView.tsx، Sidebar.tsx، InventoryView.tsx

### 30. لاگ ان اسکرین (Login Screen)
- **POS کھلتے ہی** سب سے پہلے لاگ ان اسکرین آتی ہے
- **کیشئیر** اپنا ای میل اور پاس ورڈ ڈالتا ہے
- **ابھی کے لیے** تین یوزر hardcoded ہیں App.tsx میں USERS array میں:
  - Cashier: `cashier@d4u.com` / `1234`
  - Manager: `manager@d4u.com` / `manager123`
  - Admin: `admin@d4u.com` / `admin`
- **مستقبل میں:** Dexie db.users table سے چیک ہو گا + bcrypt hash + role-based access
- **UI:** گہرا (dark) رنگ، CSS variables سے بنا ہوا، loading state اور error message سمیت

### 31. ڈے سٹارٹ پیج (Day Start Page) — بزنس ڈے ورک فلو
لاگ ان کے بعد، POS کھلنے سے پہلے، کیشئیر کو **Day Start** کرنا لازمی ہے۔

**اسکرین کا لے آؤٹ:**
- **بائیں پینل:** لاگ ان کیشئیر کا نام، پچھلے دن کی بند ہونے کا وقت (Last Closed Time)، اور سبز **Day Start** بٹن
- **دائیں پینل:** تاریخ کا جدول (History Table):
  - کالم: ID | Day Start | Day Close | action بٹن
  - پہلی بار: demo ڈیٹا دکھتا ہے
  - بعد میں: `localStorage` کی key `d4u_day_history` سے اصل history آتی ہے

**Day Start دبانے پر:**
- موجودہ وقت اور تاریخ localStorage میں محفوظ ہوتی ہے
- POS کھل جاتا ہے
- **POS کے header میں** وہی وقت دکھتا ہے جب Day Start دبایا گیا تھا (real-time clock نہیں) — یہ logical business day کا anchor ہے

- **مستقبل میں:** Dexie db.businessDays table میں ریکارڈ جائے گا + cloud sync ہو گا

### 31.1 کیش اِن (Cash In) سکرین اور کیش آؤٹ (Cash Out) ورک فلو
ڈے سٹارٹ کرنے کے فوراً بعد مین POS سکرین نہیں کھلے گی بلکہ کیشئیر کو **Cash In** سکرین نظر آئے گی۔
- **بائیں پینل:** کیشئیر کا نام, 'Cash in amount' اور 'Comment' درج کرنے کی جگہ اور ایک سبز Cash in کا بٹن۔
- **دائیں پینل:** کیش ان اور کیش آؤٹ ہسٹری کا ٹیبل (ID | Cashin at | Cash in amount | Cashout date | Cashout amount | Action) جس میں پرنٹ اور ویو کے بٹن موجود ہیں۔
- **ورک فلو:** جب کیشئیر اپنا اوپننگ کیش (Opening Cash) درج کر کے بٹن دبائے گا تو ہی مین POS کھلے گا۔
- **آٹو پرنٹ (Auto Print):** جب کیشئیر ہیڈر بار سے "Cash Out" کرے گا, تو سسٹم خود بخود اس کا ریکارڈ ہسٹری میں اپڈیٹ کرے گا اور کیش آؤٹ رسید کا تھرمل پرنٹ نکالے گا۔

### 32. سائڈ بار — نیویگیشن (موجودہ ترتیب)
```
Home        ← POS selling اسکرین
KOT         ← کچن آرڈر ٹکٹس
Online      ← آن لائن آرڈرز
Delivery    ← رائیڈر / ڈلیوری
CRM         ← کسٹمر لائلٹی
WhatsApp    ← واٹس ایپ آرڈرز
Dashboard   ← سیلز رپورٹ
Settings    ← ڈیوائس سیٹنگز (سیدھا سائڈ بار میں)
Garage      ← اندرونی ٹولز (سب سے نیچے)
```
> پہلے "More" کا popup بٹن تھا — وہ ہٹا دیا گیا۔ Settings اور Garage اب براہ راست sidebar میں ہیں۔

### 33. ہیڈر بار — بٹنز کی ترتیب
ہیڈر میں بائیں سے دائیں:
1. **اسٹور کا نام + Day Start کا وقت**
2. **Cash In / Out** بٹن ← CASH_OUT modal کھلتا ہے
3. **Day Close** بٹن ← DAY_CLOSE modal کھلتا ہے
4. **Global Search** input باکس

> پہلے Cash In/Out اور Day Close "More" کے چھپے ہوئے menu میں تھے۔ اب ہمیشہ نظر آتے ہیں۔

### 34. CRM ویو — کارڈ گرڈ لے آؤٹ
- **3 کالم** کا responsive card grid
- ہر کارڈ: Patron ID، نام، فون، پوائنٹس بیج، آخری وزٹ، **ATTACH TICKET** بٹن
- **NEW CUSTOMER** modal: نیا گاہک شامل کرنے کا فارم
- پرانا ڈیزائن (فون نمبر سے search) ہٹا دیا گیا، اب browsable grid ہے

### 35. گیراج ویو (Garage View)
- نیا sidebar section
- اندرونی ٹولز، ٹیسٹنگ اور ایڈمن utilities کے لیے
- صرف ڈویلپر / Super Admin کے لیے (production میں RBAC gate لگے گا)

---

### اگلے AI سیشن کے لیے ہدایات
اگر اگلی بار کوئی AI (Claude یا کوئی اور) اس پروجیکٹ پر کام کرے تو:
1. `d4u-pos-client/src/App.tsx` پڑھو — یہی مرکزی فائل ہے
2. Vite 8 کا `import type` rule یاد رکھو
3. لاگ ان → Day Start → POS کا flow توڑنا نہیں
4. `dayStartTime` prop POSApp تک جانا ضروری ہے — header اسے دکھاتا ہے
5. `localStorage` key `d4u_day_history` میں Day Start/Close records ہیں
