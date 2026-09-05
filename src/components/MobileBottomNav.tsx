import React from 'react';
import { ShoppingBag, Ticket, Plus, Heart, Headphones, ShieldCheck } from 'lucide-react';

interface MobileBottomNavProps {
  activeView: string;
  onNavigate: (view: 'feed' | 'subscriptions' | 'sell' | 'favorites' | 'support' | 'admin') => void;
  favoritesCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onNavigate,
  favoritesCount,
}) => {
  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E0E0D5] px-1 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.4rem)] shadow-lg"
    >
      <div className="grid grid-cols-6 items-end max-w-md mx-auto w-full">
        {/* Feed */}
        <button
          onClick={() => onNavigate('feed')}
          className={`flex flex-col items-center justify-center py-1 transition ${
            activeView === 'feed'
              ? 'text-[#5A5A40] font-bold'
              : 'text-[#7A7A6A] hover:text-[#2D2D2A]'
          }`}
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 leading-tight whitespace-nowrap">Market</span>
        </button>

        {/* Student Subscriptions */}
        <button
          onClick={() => onNavigate('subscriptions')}
          className={`flex flex-col items-center justify-center py-1 transition ${
            activeView === 'subscriptions'
              ? 'text-[#5A5A40] font-bold'
              : 'text-[#7A7A6A] hover:text-[#2D2D2A]'
          }`}
        >
          <Ticket className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 leading-tight whitespace-nowrap">Subs</span>
        </button>

        {/* Sell Button - Elevated Center */}
        <button
          onClick={() => onNavigate('sell')}
          className="flex flex-col items-center justify-center -mt-5 transition group"
        >
          <div className="w-11 h-11 rounded-full bg-[#5A5A40] text-white flex items-center justify-center shadow-md group-active:scale-95 transition border-2 border-white">
            <Plus className="h-5 w-5 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-[#2D2D2A] mt-0.5 leading-tight whitespace-nowrap">Sell</span>
        </button>

        {/* Favorites */}
        <button
          onClick={() => onNavigate('favorites')}
          className={`relative flex flex-col items-center justify-center py-1 transition ${
            activeView === 'favorites'
              ? 'text-[#5A5A40] font-bold'
              : 'text-[#7A7A6A] hover:text-[#2D2D2A]'
          }`}
        >
          <Heart className={`h-5 w-5 ${activeView === 'favorites' ? 'fill-[#5A5A40]' : ''}`} />
          <span className="text-[10px] mt-0.5 leading-tight whitespace-nowrap">Saved</span>
          {favoritesCount > 0 && (
            <span className="absolute top-0.5 right-2 bg-[#5A5A40] text-white text-[9px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center">
              {favoritesCount}
            </span>
          )}
        </button>

        {/* Support */}
        <button
          onClick={() => onNavigate('support')}
          className={`flex flex-col items-center justify-center py-1 transition ${
            activeView === 'support'
              ? 'text-[#5A5A40] font-bold'
              : 'text-[#7A7A6A] hover:text-[#2D2D2A]'
          }`}
        >
          <Headphones className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 leading-tight whitespace-nowrap">Support</span>
        </button>

        {/* Admin Desk */}
        <button
          onClick={() => onNavigate('admin')}
          className={`flex flex-col items-center justify-center py-1 transition ${
            activeView === 'admin'
              ? 'text-[#5A5A40] font-bold'
              : 'text-[#7A7A6A] hover:text-[#2D2D2A]'
          }`}
        >
          <ShieldCheck className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 leading-tight whitespace-nowrap">Admin</span>
        </button>
      </div>
    </nav>
  );
};
