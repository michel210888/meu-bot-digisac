
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Painel', icon: '📊' },
    { id: 'send', label: 'Fila de Envio', icon: '📩' },
    { id: 'settings', label: 'Configurações', icon: '⚙️' },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col shadow-2xl">
        <div className="p-8">
          <h1 className="text-xl font-black text-white flex items-center gap-3 tracking-tighter">
            <span className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">⚡</span> 
            <div>
              DIGISAC
              <span className="block text-[10px] text-indigo-400 font-bold tracking-widest leading-none">BOLETO FLOW</span>
            </div>
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-3.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-inner'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="text-lg opacity-80">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">M</div>
             <div>
               <p className="text-[10px] font-black text-white">USUÁRIO ADM</p>
               <p className="text-[9px] text-slate-500 font-bold uppercase">Conectado</p>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-auto">
        <header className="h-20 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-10 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{navItems.find(i => i.id === activeTab)?.icon}</span>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Servidor Online</span>
             </div>
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
      
      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around p-3 z-40 backdrop-blur-lg">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === item.id ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-bold uppercase">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
