import React from 'react';
import SociallyApproved from './components/SociallyApproved/SociallyApproved';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between">
      {/* Brand Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              DT
            </span>
            <span className="font-extrabold text-lg tracking-tight text-white uppercase">
              Drip<span className="text-zinc-500">Trip</span>
            </span>
          </div>
          
          <nav className="hidden md:flex gap-6 text-sm font-semibold uppercase tracking-wider text-zinc-300">
            <a href="#shop" className="hover:text-amber-400 transition-colors">Shop</a>
            <a href="#collections" className="hover:text-amber-400 transition-colors">Collections</a>
            <a href="#community" className="text-amber-500 font-bold border-b-2 border-amber-500 pb-0.5">Community</a>
            <a href="#support" className="hover:text-amber-400 transition-colors">Support</a>
          </nav>

          <button className="bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold uppercase tracking-wider px-5 py-2 rounded-full transition-all">
            Join the Crew
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex items-center justify-center py-6">
        <SociallyApproved />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 px-6 text-center text-zinc-500 text-xs uppercase tracking-widest">
        &copy; {new Date().getFullYear()} DripTrip Streetwear. All rights reserved.
      </footer>
    </div>
  );
};

export default App;
