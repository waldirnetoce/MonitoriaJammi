
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AnalysisTool from './components/AnalysisTool';
import AiConsultant from './components/AiConsultant';
import History from './components/History';
import ScorecardManager from './components/ScorecardManager';
import Help from './components/Help';
import { Interaction, AnalysisResult, ScorecardCriterion, NcgItem, VoiceProfile } from './types';
import { DEFAULT_SCORECARD } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [scorecard, setScorecard] = useState<ScorecardCriterion[]>([]);
  const [ncgItems, setNcgItems] = useState<NcgItem[]>([
    { id: 'ncg1', name: 'Desligamento Indevido', description: 'Cair a ligação propositalmente ou desligar sem motivo.' },
    { id: 'ncg2', name: 'Conduta Inadequada', description: 'Falta de respeito, deboche ou agressividade.' },
    { id: 'ncg3', name: 'Erro de Procedimento Crítico', description: 'Informação que gera risco de vida ou prejuízo financeiro grave.' }
  ]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('waldir_theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);

    const savedPhoto = localStorage.getItem('waldir_user_photo');
    if (savedPhoto) setUserPhoto(savedPhoto);

    const savedVoice = localStorage.getItem('waldir_voice_profile');
    if (savedVoice) setVoiceProfile(JSON.parse(savedVoice));

    const savedInteractions = localStorage.getItem('waldir_interactions');
    if (savedInteractions) setInteractions(JSON.parse(savedInteractions));

    const savedScorecard = localStorage.getItem('waldir_scorecard');
    setScorecard(savedScorecard ? JSON.parse(savedScorecard) : DEFAULT_SCORECARD);
  }, []);

  useEffect(() => {
    localStorage.setItem('waldir_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleVoiceCalibrated = (profile: VoiceProfile) => {
    setVoiceProfile(profile);
    localStorage.setItem('waldir_voice_profile', JSON.stringify(profile));
  };

  const handleUpdatePhoto = (base64: string) => {
    setUserPhoto(base64);
    localStorage.setItem('waldir_user_photo', base64);
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleSaveInteraction = (agentName: string, transcript: string, result: AnalysisResult) => {
    const newInteraction: Interaction = {
      id: crypto.randomUUID(),
      agentName,
      date: result.auditDate || new Date().toLocaleDateString('pt-BR'),
      transcript,
      result
    };
    const updated = [newInteraction, ...interactions];
    setInteractions(updated);
    localStorage.setItem('waldir_interactions', JSON.stringify(updated));
  };

  return (
    <div className={`flex min-h-screen font-sans transition-colors duration-700 ${theme === 'dark' ? 'bg-[#0f172a] text-white' : 'bg-[#f8fafc] text-[#334155]'}`}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        theme={theme} 
        toggleTheme={toggleTheme}
        userPhoto={userPhoto}
        onUpdatePhoto={handleUpdatePhoto}
        voiceProfile={voiceProfile}
        onVoiceCalibrated={handleVoiceCalibrated}
      />
      
      <main className="flex-1 ml-64 p-8 lg:p-12 max-w-7xl mx-auto w-full relative z-10">
        <header className="mb-14 flex justify-between items-end animate-fadeIn relative z-20">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-1 bg-[#2cb638] rounded-full shadow-[0_0_15px_rgba(44,182,56,0.3)]"></div>
              <p className="text-[#124b94] dark:text-[#2cb638] text-[10px] font-black uppercase tracking-[0.4em]">Jammin Studio v12.0</p>
            </div>
            <h2 className={`text-5xl font-black tracking-tighter uppercase leading-none ${theme === 'dark' ? 'text-white' : 'text-[#042147]'}`}>
              {activeTab === 'dashboard' && 'Visão Executiva'}
              {activeTab === 'analyze' && 'Nova Auditoria'}
              {activeTab === 'aiconsultant' && 'IA Responde'}
              {activeTab === 'history' && 'Histórico'}
              {activeTab === 'scorecard' && 'Ficha Receptivo v1.1.2025'}
              {activeTab === 'help' && 'Suporte'}
            </h2>
          </div>
          {voiceProfile && (
            <div className="px-4 py-2 bg-[#2cb638]/10 border border-[#2cb638]/20 rounded-2xl flex items-center">
              <span className="w-2 h-2 bg-[#2cb638] rounded-full mr-3 animate-pulse"></span>
              <p className="text-[9px] font-black text-[#2cb638] uppercase tracking-widest">Voz Calibrada: {voiceProfile.voiceName}</p>
            </div>
          )}
        </header>

        <div className="relative animate-slideUp z-20">
          {activeTab === 'dashboard' && <Dashboard interactions={interactions} scorecard={scorecard} />}
          {activeTab === 'analyze' && <AnalysisTool onSave={handleSaveInteraction} scorecard={scorecard} ncgItems={ncgItems} voiceProfile={voiceProfile} />}
          {activeTab === 'aiconsultant' && <AiConsultant scorecard={scorecard} />}
          {activeTab === 'history' && <History interactions={interactions} />}
          {activeTab === 'scorecard' && <ScorecardManager scorecard={scorecard} setScorecard={setScorecard} ncgItems={ncgItems} setNcgItems={setNcgItems} />}
          {activeTab === 'help' && <Help />}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
        .animate-slideUp { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default App;
