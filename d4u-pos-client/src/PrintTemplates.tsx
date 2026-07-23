import React from 'react';

export const PrintBill = ({ cart, subTotal, tax, grandTotal, cashGiven, returnAmount, time, orderType, orderId, paymentMethod, cashOutAmount, promoDiscount, manualDiscount }: any) => (
  <div style={{ padding: '10px', width: '80mm', fontFamily: 'monospace', color: 'black', background: 'white', letterSpacing: '-0.5px' }}>
    <div style={{ textAlign: 'center', marginBottom: '15px' }}>
      <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', textTransform: 'uppercase' }}>D4U POS</h2>
      <p style={{ margin: '2px 0', fontSize: '0.9rem', fontWeight: 'bold' }}>123 Food Street, City</p>
      <p style={{ margin: '2px 0', fontSize: '0.9rem', fontWeight: 'bold' }}>TEL: 0300-1234567</p>
    </div>
    
    <div style={{ borderBottom: '2px dashed black', paddingBottom: '5px', marginBottom: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
        <span>ORDER: {orderId}</span>
        <span style={{ textTransform: 'uppercase' }}>{orderType}</span>
      </div>
      <div style={{ fontWeight: 'bold' }}>DATE: {time}</div>
    </div>
    
    <div style={{ marginBottom: '5px' }}>
      {orderType === 'Cash Out Receipt' ? (
        <div style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', margin: '20px 0' }}>
          CASH OUT AMOUNT<br />
          Rs. {cashOutAmount?.toFixed?.(2) || cashOutAmount}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', fontWeight: '900', borderBottom: '2px dashed black', paddingBottom: '5px', marginBottom: '5px' }}>
            <span style={{ flex: 2 }}>ITEM</span>
            <span style={{ flex: 1, textAlign: 'center' }}>QTY</span>
            <span style={{ flex: 1, textAlign: 'right' }}>AMT</span>
          </div>
          {(cart || []).map((item: any, idx: number) => (
            <div key={idx} style={{ marginTop: '3px', fontSize: '0.95rem', fontWeight: 'bold' }}>
              <div style={{ display: 'flex' }}>
                <span style={{ flex: 2, textTransform: 'uppercase' }}>{item.name}</span>
                <span style={{ flex: 1, textAlign: 'center' }}>{item.qty}</span>
                <span style={{ flex: 1, textAlign: 'right' }}>{item.price * item.qty}</span>
              </div>
              {item.promoPct > 0 && (
                <div style={{ display: 'flex', fontSize: '0.8rem' }}>
                  <span style={{ flex: 2 }}>{item.promoPct}% OFF (Rs. {item.discountedPrice})</span>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
    
    {orderType !== 'Cash Out Receipt' && (
      <>
        <div style={{ borderTop: '2px dashed black', paddingTop: '5px', marginBottom: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>SUBTOTAL</span><span>{subTotal?.toFixed(2)}</span></div>
          {promoDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>PROMO DISCOUNTS</span><span>-{promoDiscount?.toFixed(2)}</span></div>
          )}
          {manualDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>DISCOUNT</span><span>-{manualDiscount?.toFixed(2)}</span></div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>TAX (10%)</span><span>{tax?.toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '1.3rem', marginTop: '5px' }}>
            <span>TOTAL</span><span>{grandTotal?.toFixed(2)}</span>
          </div>
        </div>
        
        <div style={{ borderTop: '2px dashed black', paddingTop: '5px', marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span style={{ textTransform: 'uppercase' }}>PAID VIA ({paymentMethod || 'CASH'})</span>
            <span>{cashGiven?.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900' }}><span>CHANGE</span><span>{returnAmount?.toFixed(2)}</span></div>
        </div>
      </>
    )}
    
    <div style={{ textAlign: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
      <p style={{ margin: '2px 0' }}>*** THANK YOU ***</p>
      <p style={{ margin: '2px 0' }}>POWERED BY ANTIGRAVITY</p>
    </div>
  </div>
);

export const PrintKOT = ({ orderId, type, items, notes, time, isDuplicate }: any) => (
  <div style={{ padding: '10px', width: '80mm', fontFamily: 'monospace', color: 'black', background: 'white', letterSpacing: '-0.5px' }}>
    <div style={{ textAlign: 'center', marginBottom: '5px' }}>
      <h2 style={{ margin: '0 0 5px 0', fontSize: '1.4rem', fontWeight: '900' }}>-- KITCHEN TICKET --</h2>
      {isDuplicate && <h3 style={{ margin: '0 0 5px 0', background: 'black', color: 'white', display: 'inline-block', padding: '2px 5px' }}>DUPLICATE REPRINT</h3>}
      <div style={{ fontSize: '1.2rem', fontWeight: '900' }}>ORDER: {orderId}</div>
    </div>
    
    <div style={{ borderBottom: '2px dashed black', margin: '5px 0' }}></div>
    
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '5px' }}>
      <span style={{ textTransform: 'uppercase' }}>{type}</span>
      <span>{time.split(', ')[1] || time}</span>
    </div>
    
    <div style={{ borderBottom: '2px dashed black', margin: '5px 0 10px 0' }}></div>
    
    <div style={{ marginBottom: '10px', fontSize: '1.2rem', fontWeight: '900', lineHeight: '1.4' }}>
      {items.split(', ').map((item: string, idx: number) => {
        const parts = item.split('x ');
        const qty = parts[0];
        const name = parts[1];
        return (
          <div key={idx} style={{ marginBottom: '8px' }}>
            <div style={{ textTransform: 'uppercase', display: 'flex', gap: '8px' }}>
              <span style={{ border: '2px solid black', padding: '0 4px' }}>x{qty}</span>
              <span>{name}</span>
            </div>
            {notes && idx === 0 && (
               <div style={{ fontSize: '1rem', fontWeight: 'bold', marginLeft: '35px', marginTop: '2px', border: '1px solid black', padding: '2px 5px', display: 'inline-block' }}>
                 NOTE: {notes}
               </div>
            )}
          </div>
        );
      })}
    </div>
    
    <div style={{ borderBottom: '2px dashed black', margin: '10px 0' }}></div>
    
    <div style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 'bold', marginTop: '5px' }}>
      -- END OF TICKET --
    </div>
  </div>
);

export const PrintShiftCloseReceipt = ({
  storeName,
  cashierName,
  managerName,
  time,
  dayId,
  openingFloat,
  totalOrders,
  cashSales,
  cardSales,
  onlineSales,
  totalNetSales,
  cashOutAmount,
  expectedCash,
  countedCash,
  variance,
  denominations
}: any) => {
  const denList = [5000, 1000, 500, 100, 50, 20, 10, 5, 2, 1];
  return (
    <div style={{ padding: '10px', width: '80mm', fontFamily: 'monospace', color: 'black', background: 'white', letterSpacing: '-0.5px' }}>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', textTransform: 'uppercase' }}>{storeName || 'D4U POS'}</h2>
        <h3 style={{ margin: '4px 0', fontSize: '1.05rem', fontWeight: '900', border: '1px solid black', display: 'inline-block', padding: '2px 8px' }}>
          SHIFT / DAY CLOSE & HANDOVER
        </h3>
        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginTop: '4px' }}>DATE: {time || new Date().toLocaleString()}</div>
        {dayId && <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>DAY SESSION #: {dayId}</div>}
      </div>

      <div style={{ borderBottom: '2px dashed black', margin: '8px 0' }}></div>

      <div style={{ fontSize: '0.88rem', fontWeight: 'bold', lineHeight: '1.4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>CASHIER:</span><span>{cashierName || 'N/A'}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>HANDOVER TO:</span><span>{managerName || 'Manager'}</span></div>
      </div>

      <div style={{ borderBottom: '2px dashed black', margin: '8px 0' }}></div>

      <div style={{ fontSize: '0.88rem', fontWeight: 'bold', lineHeight: '1.4' }}>
        <div style={{ textTransform: 'uppercase', marginBottom: '4px', textDecoration: 'underline' }}>SALES SUMMARY</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>OPENING FLOAT:</span><span>Rs. {Number(openingFloat || 0).toFixed(2)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>TOTAL ORDERS:</span><span>{totalOrders || 0}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>CASH SALES:</span><span>Rs. {Number(cashSales || 0).toFixed(2)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>CARD SALES:</span><span>Rs. {Number(cardSales || 0).toFixed(2)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ONLINE/OTHER:</span><span>Rs. {Number(onlineSales || 0).toFixed(2)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '0.95rem', marginTop: '2px' }}>
          <span>TOTAL NET SALES:</span><span>Rs. {Number(totalNetSales || 0).toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>CASH OUT/EXPENSES:</span><span>Rs. {Number(cashOutAmount || 0).toFixed(2)}</span></div>
      </div>

      <div style={{ borderBottom: '2px dashed black', margin: '8px 0' }}></div>

      <div style={{ fontSize: '0.88rem', fontWeight: 'bold' }}>
        <div style={{ textTransform: 'uppercase', marginBottom: '4px', textDecoration: 'underline' }}>DENOMINATION TALLY</div>
        <div style={{ display: 'flex', borderBottom: '1px solid black', paddingBottom: '2px', marginBottom: '4px', fontSize: '0.8rem' }}>
          <span style={{ flex: 1.5 }}>DENOM</span>
          <span style={{ flex: 1, textAlign: 'center' }}>QTY</span>
          <span style={{ flex: 1.5, textAlign: 'right' }}>SUBTOTAL</span>
        </div>
        {denList.map(denom => {
          const count = denominations?.[denom] || 0;
          return (
            <div key={denom} style={{ display: 'flex', fontSize: '0.85rem' }}>
              <span style={{ flex: 1.5 }}>{denom >= 10 ? `Rs ${denom}` : `Rs ${denom} Coin`}</span>
              <span style={{ flex: 1, textAlign: 'center' }}>x {count}</span>
              <span style={{ flex: 1.5, textAlign: 'right' }}>Rs {(denom * count).toFixed(0)}</span>
            </div>
          );
        })}
      </div>

      <div style={{ borderBottom: '2px dashed black', margin: '8px 0' }}></div>

      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', lineHeight: '1.5' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>EXPECTED CASH:</span><span>Rs. {Number(expectedCash || 0).toFixed(2)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: '900' }}><span>COUNTED CASH:</span><span>Rs. {Number(countedCash || 0).toFixed(2)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: variance < 0 ? 'red' : (variance > 0 ? 'blue' : 'black') }}>
          <span>VARIANCE:</span>
          <span>{variance === 0 ? '0.00 (BALANCED)' : `${variance > 0 ? '+' : ''}${Number(variance || 0).toFixed(2)}`}</span>
        </div>
      </div>

      <div style={{ borderBottom: '2px dashed black', margin: '15px 0' }}></div>

      <div style={{ marginTop: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
        <div style={{ marginBottom: '25px' }}>Cashier Signature: __________________</div>
        <div style={{ marginBottom: '15px' }}>Manager Signature: __________________</div>
      </div>

      <div style={{ borderBottom: '2px dashed black', margin: '10px 0' }}></div>

      <div style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
        <p style={{ margin: '2px 0' }}>*** END OF SHIFT REPORT ***</p>
        <p style={{ margin: '2px 0' }}>POWERED BY D4U POS</p>
      </div>
    </div>
  );
};

