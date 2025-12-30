
import React, { useRef, useState } from 'react';
import { analyzeUserVoice } from '../services/geminiService';
import { VoiceProfile } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  userPhoto: string | null;
  onUpdatePhoto: (base64: string) => void;
  voiceProfile: VoiceProfile | null;
  onVoiceCalibrated: (profile: VoiceProfile) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, setActiveTab, theme, toggleTheme, userPhoto, onUpdatePhoto, voiceProfile, onVoiceCalibrated 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdatePhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startCalibration = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        setIsCalibrating(true);
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const profile = await analyzeUserVoice(base64);
          onVoiceCalibrated(profile);
          setIsCalibrating(false);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setTimeout(() => {
        recorder.stop();
        setIsRecording(false);
      }, 5000);
    } catch (err) {
      alert("Erro ao acessar microfone.");
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'analyze', label: 'Nova Auditoria', icon: '🔍' },
    { id: 'aiconsultant', label: 'IA Responde', icon: '🤖' },
    { id: 'history', label: 'Histórico', icon: '📜' },
    { id: 'scorecard', label: 'Scorecard', icon: '📝' },
  ];

  return (
    <div className={`w-64 fixed left-0 top-0 h-screen flex flex-col p-6 transition-all duration-700 z-50 shadow-[20px_0_40px_rgba(0,0,0,0.02)] ${theme === 'dark' ? 'bg-[#0f172a]/95 border-r border-white/5' : 'bg-[#042147] text-white'}`}>
      
      <div className="mb-10 flex flex-col items-center relative z-10 group mt-4">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        <div onClick={handlePhotoClick} className="relative w-28 h-28 cursor-pointer mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#2cb638] to-[#124b94] animate-pulse blur-lg opacity-30 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative w-full h-full rounded-full border-4 border-white/20 overflow-hidden bg-slate-800 flex items-center justify-center transition-transform hover:scale-105 shadow-2xl">
            {userPhoto ? <img src={userPhoto} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-4xl">👤</span>}
          </div>
        </div>
        
        {/* Voice Calibration Button */}
        <button 
          onClick={startCalibration}
          disabled={isCalibrating}
          className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all mb-4 ${
            isRecording ? 'bg-rose-500 animate-pulse' : 
            voiceProfile ? 'bg-[#2cb638]/20 text-[#2cb638] border border-[#2cb638]/40' : 
            'bg-white/10 text-white/40 hover:bg-white/20'
          }`}
        >
          {isCalibrating ? 'Sincronizando...' : isRecording ? 'Falando...' : voiceProfile ? `Voz: ${voiceProfile.voiceName}` : 'Calibrar Voz'}
        </button>

        <div className="text-center">
          <h1 className="text-sm font-black tracking-[0.2em] text-white uppercase">Jammin</h1>
          <p className="text-[8px] text-[#2cb638] uppercase font-black tracking-[0.3em] mt-2">Nível Supervisor</p>
        </div>
      </div>
      
      <nav className="flex-1 space-y-2 relative z-10">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-500 ${
              activeTab === item.id 
                ? 'bg-gradient-to-r from-[#2cb638] to-[#259b30] text-white shadow-lg' 
                : 'text-white/40 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-bold text-xs tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-4 pt-8 border-t border-white/5 relative z-10">
        <button onClick={toggleTheme} className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-white/5 text-[9px] font-black uppercase text-white/30 tracking-[0.3em]">
          <span>{theme === 'dark' ? 'DARK' : 'LIGHT'}</span>
          <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
