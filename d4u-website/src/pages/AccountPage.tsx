import { useEffect, useState } from 'react';
import { LogOut, User } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { BACKEND_URL } from '../hooks/useStoreData';

export default function AccountPage() {
  const { loggedInUser, loginOrRegister, logout } = useStore();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [needsName, setNeedsName] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!loggedInUser) return;
    fetch(`${BACKEND_URL}/online-orders/auth/history/${loggedInUser.phone}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const all = [...(data.orders || []), ...(data.onlineOrders || [])];
          all.sort((a, b) => b.id - a.id);
          setHistory(all);
        }
      })
      .catch(() => {});
  }, [loggedInUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await loginOrRegister(phone, needsName ? name : undefined);
    setLoading(false);
    if (!result.success) {
      if (result.needsName) setNeedsName(true);
      else setError(result.message || 'Something went wrong.');
    }
  };

  if (!loggedInUser) {
    return (
      <div className="max-w-sm mx-auto px-4 py-10">
        <div className="bg-stitch-panel border border-stitch-border rounded-3xl p-6">
          <h3 className="text-xl font-black text-stitch-ink flex items-center gap-2 mb-1">
            <User className="text-stitch-accent w-5 h-5" /> {needsName ? 'Create Account' : 'Welcome Back'}
          </h3>
          <p className="text-sm text-stitch-muted mb-6">
            {needsName ? 'Looks like you are new! Enter your name to continue.' : 'Enter your phone number to login or create an account.'}
          </p>
          {error && <div className="p-3 mb-4 bg-stitch-danger/10 border border-stitch-danger/30 text-stitch-danger text-sm rounded-lg text-center">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {needsName && (
              <div>
                <label className="block text-xs font-bold text-stitch-muted mb-1 uppercase tracking-wider">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-stitch-surface text-stitch-ink rounded-xl px-4 py-3 border border-stitch-border focus:border-stitch-accent outline-none transition" placeholder="John Doe" />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-stitch-muted mb-1 uppercase tracking-wider">Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required disabled={needsName} className="w-full bg-stitch-surface text-stitch-ink rounded-xl px-4 py-3 border border-stitch-border focus:border-stitch-accent outline-none transition disabled:opacity-50" placeholder="0300..." />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-stitch-accent hover:bg-stitch-accent-hover text-stitch-accent-ink font-black py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50">
              {loading ? 'Loading...' : needsName ? 'Create Account' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="bg-stitch-panel border border-stitch-border rounded-3xl p-6 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-stitch-ink flex items-center gap-3">
            <User className="text-stitch-accent w-6 h-6" /> {loggedInUser.name}
          </h3>
          <p className="text-sm text-stitch-accent font-bold mt-1">{loggedInUser.loyalty_points || 0} Loyalty Points</p>
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 text-xs font-bold text-stitch-danger hover:opacity-80 px-3 py-1.5 border border-stitch-danger/30 rounded-lg hover:bg-stitch-danger/10 transition">
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </div>

      <div>
        <h4 className="text-lg font-bold text-stitch-ink mb-4">Past Orders</h4>
        {history.length === 0 ? (
          <div className="text-center p-10 text-stitch-muted bg-stitch-panel border border-stitch-border rounded-2xl">No orders found.</div>
        ) : (
          <div className="space-y-3">
            {history.map((order: any, idx) => (
              <div key={idx} className="bg-stitch-surface border border-stitch-border rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black bg-stitch-panel text-stitch-ink px-2 py-0.5 rounded uppercase">
                      {order.type || (order.source === 'Website' ? 'Online' : 'POS')}
                    </span>
                    <span className="text-stitch-ink font-bold text-sm">Order #{order.id || order.orderId}</span>
                  </div>
                  <p className="text-xs text-stitch-muted">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right flex flex-col justify-between">
                  <span className="text-stitch-accent font-black">Rs {order.totalAmount || order.total}</span>
                  <span className="text-xs font-bold text-stitch-muted">{order.status || 'COMPLETED'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
