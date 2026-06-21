import React from 'react';
import { Menu, Bell, MapPin, Navigation, X } from 'lucide-react';
import { DeliveryOrder, DeliveryStatus } from '../types';

interface ActiveRideViewProps {
  status: DeliveryStatus;
  activeOrder: DeliveryOrder | null;
  onAccept: () => void;
  onDecline: () => void;
  onArriveRest: () => void;
  onPickedUp: () => void;
  onDelivered: () => void;
  onSettle: (tip: number) => void;
  driverCoords: { x: number; y: number } | null;
  activePath: { x: number; y: number }[];
}

export default function ActiveRideView({
  status,
  activeOrder,
  onAccept,
  onDecline,
  onArriveRest,
  onPickedUp,
  onDelivered,
  onSettle,
  driverCoords,
  activePath
}: ActiveRideViewProps) {

  const [prepTimeLeft, setPrepTimeLeft] = React.useState<string>('');
  
  React.useEffect(() => {
    if (!activeOrder?.estimatedReadyAt) {
      setPrepTimeLeft('');
      return;
    }
    const target = new Date(activeOrder.estimatedReadyAt).getTime();
    const tick = () => {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) {
        setPrepTimeLeft('Ready for Pickup!');
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setPrepTimeLeft(`Chef Prep: ${m}m ${s}s`);
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [activeOrder?.estimatedReadyAt]);

  // A generic map background component
  const MapBackground = () => (
    <div className="absolute inset-0 bg-slate-200 z-0 overflow-hidden">
      {/* Simulated Map Graphic overlay */}
      <div 
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB4ORcXKAWIWgtj2E1hpwpSHvRx0gNJmzNZugakh7LO1tlgyH3m25la9DOeiyE7MtUD0szG9kalFoXFQuscFjOn-KmDLqHMp7YNTorGhn7g03yIU1y1Aw1zXX4lirRTHFvvqRqd5VnD5_3EdxD_BzR1W9nTzMMYOwWCJEwCmgIY0IFgFMFIcf0JeRdjQxM4cLrrededV0Ln-YZhPu1VDjCY-HOLarr09Wt4fUqR5WQJpO_KZr7j-9lDlKpIfRH_lnf2t3OMJhfotwQ")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(100%) sepia(30%) hue-rotate(220deg) brightness(1.1)'
        }}
      />
      
      {/* Render route path if driving */}
      {activePath && activePath.length > 0 && (
        <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none">
          <polyline
            points={activePath.map(p => `${p.x}%,${p.y}%`).join(' ')}
            fill="none"
            stroke="#8b3dff"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* Driver Marker */}
      {driverCoords && (
        <div 
          className="absolute z-20 w-8 h-8 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all duration-300"
          style={{ top: `calc(${driverCoords.y}% - 16px)`, left: `calc(${driverCoords.x}% - 16px)` }}
        >
          <Navigation size={14} className="text-slate-900 transform rotate-45" />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full relative bg-slate-950">
      
      {/* Header Area */}
      <div className="bg-primary text-slate-900 p-4 pt-6 pb-6 flex items-center justify-between z-30 shadow-md">
        <Menu size={24} />
        <div className="flex items-center gap-2 font-display font-bold text-lg tracking-tight">
          <MapPin size={20} className="fill-white/20" />
          DineDash
        </div>
        <Bell size={24} />
      </div>

      {/* Map Area */}
      <div className="flex-1 relative z-0">
        <MapBackground />

        {/* Floating Top Nav Direction Box (Only when driving) */}
        {(status === 'ACCEPTED' || status === 'PICKED_UP') && (
          <div className="absolute top-4 left-4 right-4 bg-primary text-slate-900 rounded-xl shadow-xl flex items-center p-4 z-30">
            <div className="mr-4 border-r border-white/20 pr-4 text-center">
              <Navigation size={24} className="mx-auto mb-1 transform -rotate-45" />
              <span className="text-xs font-semibold">400m</span>
            </div>
            <div>
              <h3 className="font-bold">
                {status === 'ACCEPTED' ? 'Go to Restaurant' : 'Go to Customer'}
              </h3>
              <p className="text-sm opacity-90 truncate">
                {status === 'ACCEPTED' ? activeOrder?.restaurantName : activeOrder?.customerAddress}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sheet Card */}
      <div className="bg-slate-900 rounded-t-3xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-30 relative mt-[-20px]">
        {/* Notch */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />

        {!activeOrder || status === 'SEARCHING' || status === 'OFFLINE' ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin size={30} className="text-primary animate-bounce" />
            </div>
            <h2 className="font-display text-xl font-bold text-slate-100">Looking for Orders</h2>
            <p className="text-slate-400 text-sm mt-2">Make sure you are online to receive dispatch pings.</p>
          </div>
        ) : status === 'OFFERED' ? (
          <div>
            <h3 className="text-center text-primary font-bold mb-6">New Order</h3>
            
            <div className="flex justify-between items-start mb-6">
              <span className="text-primary font-semibold text-sm">5 minutes to pickup point</span>
              <span className="bg-primary text-slate-900 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                ${activeOrder.earnings.toFixed(2)}
              </span>
            </div>

            <div className="relative border-l-2 border-dashed border-primary-light ml-3 pl-6 pb-6 mb-2">
              <div className="absolute w-4 h-4 bg-primary rounded-full left-[-9px] top-0 border-2 border-white" />
              <p className="text-xs text-slate-400">Pickup</p>
              <p className="font-bold text-slate-100">{activeOrder.restaurantName}</p>
              
              <div className="absolute w-4 h-4 bg-primary rounded-full left-[-9px] bottom-0 border-2 border-white flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
              </div>
              <div className="absolute bottom-[-4px] left-[15px]">
                <p className="text-xs text-slate-400">Drop off</p>
                <p className="font-bold text-slate-100">{activeOrder.customerAddress}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-10">
              <button 
                onClick={onAccept}
                className="w-full bg-primary text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-primary/30 active:scale-[0.98] transition-all"
              >
                Accept Order
              </button>
              <button 
                onClick={onDecline}
                className="w-full text-primary font-bold py-4 rounded-xl active:bg-slate-800 transition-all"
              >
                Decline
              </button>
            </div>
          </div>
        ) : (
          /* En-route Driving UI */
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-display font-bold text-xl text-slate-100">
                  {status === 'ACCEPTED' ? 'En route to Pickup' : 'En route to Drop off'}
                </h3>
                <p className="text-slate-400 text-sm mb-2">
                  {status === 'ACCEPTED' ? '5 min • 1.7 km' : '8 min • 3.2 km'}
                </p>
                {status === 'ACCEPTED' && prepTimeLeft && (
                  <div className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${prepTimeLeft === 'Ready for Pickup!' ? 'bg-accent-green text-slate-900' : 'bg-primary/20 text-primary border border-primary/30'}`}>
                    {prepTimeLeft}
                  </div>
                )}
              </div>
              <button className="w-10 h-10 bg-slate-950 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200">
                <X size={20} />
              </button>
            </div>

            {status === 'ARRIVED_REST' && (
              <button 
                onClick={onPickedUp}
                className="w-full bg-primary text-slate-900 font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all"
              >
                Confirm Picked Up
              </button>
            )}

            {status === 'DELIVERED' && (
              <div className="flex flex-col gap-3">
                <div className="bg-slate-800 p-4 rounded-xl mb-2 border border-slate-100">
                  <p className="text-sm text-slate-400 mb-1">Collect Cash on Delivery (COD)</p>
                  <p className="text-2xl font-bold text-slate-100">Rs. {activeOrder?.earnings || 0}</p>
                </div>
                {activeOrder?.bridgeStatus === 'SETTLED' ? (
                  <div className="w-full bg-accent-green text-slate-900 font-bold py-4 rounded-xl shadow-lg text-center flex items-center justify-center gap-2">
                    Settled by Cashier
                  </div>
                ) : (
                  <div className="w-full bg-slate-950 text-slate-400 font-bold py-4 rounded-xl shadow-inner text-center border border-slate-100/50">
                    Pending Settle at POS
                  </div>
                )}
                
                <button 
                  onClick={() => activeOrder?.bridgeStatus === 'SETTLED' && onSettle(0)}
                  disabled={activeOrder?.bridgeStatus !== 'SETTLED'}
                  className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all mt-4 ${activeOrder?.bridgeStatus === 'SETTLED' ? 'bg-primary text-slate-900 active:scale-[0.98]' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}`}
                >
                  {activeOrder?.bridgeStatus === 'SETTLED' ? 'Close Order' : 'Waiting for Cashier to Settle'}
                </button>
              </div>
            )}
            
            {status === 'ACCEPTED' && (
              <button onClick={onArriveRest} className="w-full bg-slate-200 text-slate-700 font-bold py-4 rounded-xl opacity-50 text-sm">
                (Simulate Arrive Pickup)
              </button>
            )}
            {status === 'PICKED_UP' && (
              <button onClick={onDelivered} className="w-full bg-slate-200 text-slate-700 font-bold py-4 rounded-xl opacity-50 text-sm">
                (Simulate Arrive Dropoff)
              </button>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
