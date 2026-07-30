import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MapPin, ShoppingCart, User } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function Header({ onOpenCart }: { onOpenCart: () => void }) {
  const { storeName, changeBranch, cart, loggedInUser, kioskMode } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      onClick={() => setIsMobileNavOpen(false)}
      className={`px-1 py-2 text-sm font-bold tracking-wider transition ${
        location.pathname === to ? 'text-stitch-accent border-b-2 border-stitch-accent' : 'text-stitch-muted hover:text-stitch-ink'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-stitch-bg/95 border-b border-stitch-border backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex-shrink-0">
            <Link to="/" className="text-lg sm:text-2xl font-black tracking-tight text-stitch-ink hover:text-stitch-accent transition">
              {storeName || 'D4U Restaurant'}
            </Link>
          </div>

          {!kioskMode && (
            <nav className="hidden md:flex space-x-8">
              {navLink('/', 'HOME')}
              {navLink('/menu', 'MENU')}
              {navLink('/promotions', 'PROMOTIONS')}
              {navLink('/about', 'ABOUT')}
              {navLink('/contact', 'CONTACT')}
            </nav>
          )}

          <div className="flex items-center space-x-3 sm:space-x-5">
            <button
              onClick={changeBranch}
              className="flex items-center text-stitch-accent hover:text-stitch-accent-hover text-xs sm:text-sm font-bold tracking-wider uppercase border border-stitch-accent/30 px-3 py-1.5 rounded-full bg-stitch-accent/5 hover:bg-stitch-accent/10 transition gap-1"
            >
              <MapPin className="w-4 h-4 animate-pulse" />
              {storeName || 'Select Location'}
              <span className="text-[10px] text-stitch-accent/60 font-medium normal-case tracking-normal border-l border-stitch-accent/30 pl-2 ml-1">Change Branch</span>
            </button>

            {!kioskMode && (
              <button
                onClick={() => navigate('/account')}
                className="p-2.5 rounded-full text-stitch-muted hover:text-stitch-ink hover:bg-stitch-surface transition"
                aria-label="Account"
              >
                <User className="w-5 h-5" />
                {loggedInUser && <span className="sr-only">{loggedInUser.name}</span>}
              </button>
            )}

            <button
              onClick={onOpenCart}
              className="relative p-2.5 rounded-full text-stitch-muted hover:text-stitch-ink hover:bg-stitch-surface transition"
              aria-label="View Cart"
            >
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-stitch-danger text-white text-[10px] sm:text-xs font-black w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-stitch-bg animate-pulse">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {!kioskMode && (
        <div className="md:hidden flex justify-around border-t border-stitch-border py-2.5 bg-stitch-bg/95">
          <Link to="/" className={`text-xs font-bold px-3 py-1 rounded-full ${location.pathname === '/' ? 'bg-stitch-accent text-stitch-accent-ink' : 'text-stitch-muted'}`}>HOME</Link>
          <Link to="/menu" className={`text-xs font-bold px-3 py-1 rounded-full ${location.pathname === '/menu' ? 'bg-stitch-accent text-stitch-accent-ink' : 'text-stitch-muted'}`}>MENU</Link>
          <Link to="/promotions" className={`text-xs font-bold px-3 py-1 rounded-full ${location.pathname === '/promotions' ? 'bg-stitch-accent text-stitch-accent-ink' : 'text-stitch-muted'}`}>DEALS</Link>
          <Link to="/account" className={`text-xs font-bold px-3 py-1 rounded-full ${location.pathname === '/account' ? 'bg-stitch-accent text-stitch-accent-ink' : 'text-stitch-muted'}`}>ACCOUNT</Link>
        </div>
      )}
    </header>
  );
}
