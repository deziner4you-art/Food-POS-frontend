const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const buttonHtml = `<button onClick={() => { db.kots.clear().then(() => alert('Orders Cleared! Refreshing...')).then(() => window.location.reload()) }} style={{ position: 'fixed', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 99999, background: 'red', color: 'white', padding: '15px 30px', fontSize: '20px', fontWeight: 'bold', borderRadius: '10px', cursor: 'pointer', border: '2px solid white' }}>FORCE CLEAR TERMINAL ORDERS</button>`;

if (!content.includes('FORCE CLEAR TERMINAL ORDERS')) {
  content = content.replace('<div className="pos-layout" onClick={() => showMoreMenu && setShowMoreMenu(false)}>', '<div className="pos-layout" onClick={() => showMoreMenu && setShowMoreMenu(false)}>' + buttonHtml);
  fs.writeFileSync('src/App.tsx', content);
  console.log('Injected button');
} else {
  console.log('Button already exists');
}
