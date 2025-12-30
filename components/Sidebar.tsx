
import React, { useRef } from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  userPhoto: string | null;
  onUpdatePhoto: (base64: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, theme, toggleTheme, userPhoto, onUpdatePhoto }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdatePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'analyze', label: 'Nova Auditoria', icon: '🔍' },
    { id: 'aiconsultant', label: 'IA Responde', icon: '🤖' },
    { id: 'history', label: 'Histórico', icon: '📜' },
    { id: 'scorecard', label: 'Scorecard', icon: '📝' },
    { id: 'help', label: 'Ajuda', icon: '❓' },
  ];

  return (
    <div className={`w-64 fixed left-0 top-0 h-screen flex flex-col p-6 transition-all duration-700 z-50 shadow-[20px_0_40px_rgba(0,0,0,0.02)] ${theme === 'dark' ? 'bg-[#0f172a]/95 border-r border-white/5' : 'bg-[#042147] text-white'}`}>
      
      <div className="mb-14 flex flex-col items-center relative z-10 group mt-4">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />
        <div 
          onClick={handlePhotoClick}
          className="relative w-28 h-28 cursor-pointer mb-6"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#2cb638] to-[#124b94] animate-pulse blur-lg opacity-30 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="relative w-full h-full rounded-full border-4 border-white/20 overflow-hidden bg-slate-800 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-2xl">
            {userPhoto ? (
              <img src={userPhoto} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-4xl mb-1">👤</span>
                <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Sua Foto</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
              <span className="text-[9px] font-black uppercase text-white tracking-[0.2em] text-center px-2">Trocar Foto</span>
            </div>
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-sm font-black tracking-[0.2em] text-white uppercase">Neo & Jammin</h1>
          <p className="text-[8px] text-[#2cb638] uppercase font-black tracking-[0.3em] leading-none mt-2">Nível Supervisor</p>
        </div>
      </div>
      
      <nav className="flex-1 space-y-2 relative z-10">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-500 group relative overflow-hidden ${
              activeTab === item.id 
                ? 'bg-gradient-to-r from-[#2cb638] to-[#259b30] text-white shadow-[0_12px_24px_-8px_rgba(44,182,56,0.5)] scale-[1.02]' 
                : 'text-white/40 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className={`text-xl transition-all duration-500 ${activeTab === item.id ? 'scale-110 drop-shadow-md' : 'group-hover:scale-110 opacity-50'}`}>{item.icon}</span>
            <span className="font-bold text-xs tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-4 pt-8 border-t border-white/5 relative z-10">
        <button 
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-[9px] font-black uppercase text-white/30 tracking-[0.3em]"
        >
          <span>{theme === 'dark' ? 'DARK MODE' : 'LIGHT MODE'}</span>
          <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
