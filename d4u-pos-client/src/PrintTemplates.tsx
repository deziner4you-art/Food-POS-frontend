import React from 'react';

export const PrintBill = ({ cart, subTotal, tax, grandTotal, cashGiven, returnAmount, time, orderType, orderId, paymentMethod }: any) => (
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
      <div style={{ display: 'flex', fontWeight: '900', borderBottom: '2px dashed black', paddingBottom: '5px', marginBottom: '5px' }}>
        <span style={{ flex: 2 }}>ITEM</span>
        <span style={{ flex: 1, textAlign: 'center' }}>QTY</span>
        <span style={{ flex: 1, textAlign: 'right' }}>AMT</span>
      </div>
      {cart.map((item: any, idx: number) => (
        <div key={idx} style={{ display: 'flex', marginTop: '3px', fontSize: '0.95rem', fontWeight: 'bold' }}>
          <span style={{ flex: 2, textTransform: 'uppercase' }}>{item.name}</span>
          <span style={{ flex: 1, textAlign: 'center' }}>{item.qty}</span>
          <span style={{ flex: 1, textAlign: 'right' }}>{item.price * item.qty}</span>
        </div>
      ))}
    </div>
    
    <div style={{ borderTop: '2px dashed black', paddingTop: '5px', marginBottom: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>SUBTOTAL</span><span>{subTotal.toFixed(2)}</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>TAX (10%)</span><span>{tax.toFixed(2)}</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '1.3rem', marginTop: '5px' }}>
        <span>TOTAL</span><span>{grandTotal.toFixed(2)}</span>
      </div>
    </div>
    
    <div style={{ borderTop: '2px dashed black', paddingTop: '5px', marginBottom: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
        <span style={{ textTransform: 'uppercase' }}>PAID VIA ({paymentMethod || 'CASH'})</span>
        <span>{cashGiven.toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900' }}><span>CHANGE</span><span>{returnAmount.toFixed(2)}</span></div>
    </div>
    
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
