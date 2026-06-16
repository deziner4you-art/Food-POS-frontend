import React from 'react';

export const PrintBill = ({ cart, subTotal, tax, grandTotal, cashGiven, returnAmount, time, orderType, orderId }: any) => (
  <div style={{ padding: '10px', width: '80mm', fontFamily: 'monospace', color: 'black', background: 'white' }}>
    <div style={{ textAlign: 'center', marginBottom: '15px' }}>
      <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>D4U POS</h2>
      <p style={{ margin: 0, fontSize: '0.9rem' }}>123 Food Street, City</p>
      <p style={{ margin: 0, fontSize: '0.9rem' }}>Phone: 0300-1234567</p>
    </div>
    
    <div style={{ borderBottom: '1px dashed black', paddingBottom: '10px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Order #{orderId}</span>
        <span>{orderType}</span>
      </div>
      <div>Date: {time}</div>
    </div>
    
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', fontWeight: 'bold', borderBottom: '1px dashed black', paddingBottom: '5px' }}>
        <span style={{ flex: 2 }}>Item</span>
        <span style={{ flex: 1, textAlign: 'center' }}>Qty</span>
        <span style={{ flex: 1, textAlign: 'right' }}>Price</span>
      </div>
      {cart.map((item: any, idx: number) => (
        <div key={idx} style={{ display: 'flex', marginTop: '5px', fontSize: '0.9rem' }}>
          <span style={{ flex: 2 }}>{item.name}</span>
          <span style={{ flex: 1, textAlign: 'center' }}>{item.qty}</span>
          <span style={{ flex: 1, textAlign: 'right' }}>{item.price * item.qty}</span>
        </div>
      ))}
    </div>
    
    <div style={{ borderTop: '1px dashed black', paddingTop: '10px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>Rs. {subTotal.toFixed(2)}</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax (10%)</span><span>Rs. {tax.toFixed(2)}</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '5px' }}>
        <span>GRAND TOTAL</span><span>Rs. {grandTotal.toFixed(2)}</span>
      </div>
    </div>
    
    <div style={{ borderTop: '1px dashed black', paddingTop: '10px', marginBottom: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cash Given</span><span>Rs. {cashGiven.toFixed(2)}</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>Change Return</span><span>Rs. {returnAmount.toFixed(2)}</span></div>
    </div>
    
    <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
      <p style={{ margin: 0 }}>Thank you for visiting!</p>
      <p style={{ margin: 0 }}>Software by Antigravity</p>
    </div>
  </div>
);

export const PrintKOT = ({ orderId, type, items, notes, time, isDuplicate }: any) => (
  <div style={{ padding: '20px', width: '80mm', fontFamily: 'monospace', color: 'black', background: 'white' }}>
    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
      <h2 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>*** KITCHEN ORDER TICKET ***</h2>
      {isDuplicate && <h3 style={{ margin: '0 0 5px 0', background: 'black', color: 'white', display: 'inline-block', padding: '2px 5px' }}>DUPLICATE REPRINT</h3>}
      <div style={{ fontSize: '1rem', color: '#333' }}>Order #{orderId}</div>
    </div>
    
    <div style={{ borderBottom: '1px dashed #999', margin: '15px 0' }}></div>
    
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', marginBottom: '15px' }}>
      <span>Type: {type}</span>
      <span>Time: {time.split(', ')[1] || time}</span>
    </div>
    
    <div style={{ borderBottom: '1px dashed #999', margin: '15px 0' }}></div>
    
    <div style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 'bold', lineHeight: '1.6' }}>
      {items.split(', ').map((item: string, idx: number) => {
        const parts = item.split('x ');
        const qty = parts[0];
        const name = parts[1];
        return (
          <div key={idx} style={{ marginBottom: '10px' }}>
            <div style={{ textTransform: 'uppercase' }}>- {name} x{qty}</div>
            {notes && idx === 0 && (
               <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: 'normal', marginLeft: '15px', marginTop: '3px' }}>
                 » {notes}
               </div>
            )}
          </div>
        );
      })}
    </div>
    
    <div style={{ borderBottom: '1px dashed #999', margin: '15px 0' }}></div>
    
    <div style={{ textAlign: 'center', fontSize: '1rem', marginTop: '15px' }}>
      -- END OF TICKET --
    </div>
  </div>
);
