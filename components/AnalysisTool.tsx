
import React, { useState, useRef, useEffect } from 'react';
import { analyzeInteraction, generateAudioPodcastFeedback } from '../services/geminiService';
import { AnalysisResult, ScorecardCriterion, NcgItem, RigorLevel } from '../types';

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface AnalysisToolProps {
  onSave: (agentName: string, transcript: string, result: AnalysisResult) => void;
  scorecard: ScorecardCriterion[];
  ncgItems: NcgItem[];
}

const loadingSteps = [
  "Iniciando auditoria sincronizada...",
  "Neo está consolidando a pontuação técnica...",
  "Jammin está revisando as nuanças do script...",
  "Aplicando travas da Ficha v1.1.2025...",
  "Preparando estúdio Neo & Jammin para o Deep Dive..."
];

const studioSteps = [
  "Neo está aquecendo as cordas vocais...",
  "Jammin revisando o roteiro técnico...",
  "Ajustando ganho do microfone no estúdio...",
  "Equalizando frequências de feedback...",
  "Sincronizando diálogo entre os hosts...",
  "Renderizando áudio em 24kHz..."
];

const AnalysisTool: React.FC<AnalysisToolProps> = ({ onSave, scorecard, ncgItems }) => {
  const [transcript, setTranscript] = useState('');
  const [agentName, setAgentName] = useState('');
  const [monitorName, setMonitorName] = useState('');
  const [monitorId, setMonitorId] = useState('');
  const [company, setCompany] = useState('');
  const [rigor, setRigor] = useState<RigorLevel>('MEDIUM');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isShredding, setIsShredding] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [studioStepIdx, setStudioStepIdx] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let interval: number;
    if (isAnalyzing) {
      interval = window.setInterval(() => {
        setLoadingStepIdx((prev) => (prev + 1) % loadingSteps.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  useEffect(() => {
    let interval: number;
    if (isGeneratingAudio) {
      interval = window.setInterval(() => {
        setStudioStepIdx((prev) => (prev + 1) % studioSteps.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isGeneratingAudio]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const playPodcast = async () => {
    if (!audioBase64 || isPlaying) return;
    try {
      setIsPlaying(true);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;
      const decoded = decode(audioBase64);
      const buffer = await decodeAudioData(decoded, audioCtx, 24000, 1);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
    } catch (err) {
      setError("Falha na reprodução.");
      setIsPlaying(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedAudioFile(file);
      setAudioBase64(null);
      setError(null);
    }
  };

  const handleNewAudit = () => {
    setIsShredding(true);
    setTimeout(() => {
      setTranscript('');
      setAgentName('');
      setMonitorId('');
      setCompany('');
      setResult(null);
      setAudioBase64(null);
      setSelectedAudioFile(null);
      setError(null);
      setIsShredding(false);
    }, 2500);
  };

  const handleGeneratePodcast = async () => {
    if (!result) return;
    setIsGeneratingAudio(true);
    setError(null);
    try {
      const b64 = await generateAudioPodcastFeedback(result, agentName, monitorName || "Auditor");
      setAudioBase64(b64);
    } catch (err: any) {
      setError(`Erro no estúdio Neo & Jammin: ${err.message}`);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleAnalyze = async () => {
    if (!agentName || !company || !monitorId || !monitorName) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setAudioBase64(null);

    try {
      let audioDataParam = undefined;
      if (selectedAudioFile) {
        const b64 = await fileToBase64(selectedAudioFile);
        audioDataParam = { data: b64, mimeType: selectedAudioFile.type };
      }

      const data = await analyzeInteraction(
        transcript, monitorName, company, scorecard, ncgItems,
        { monitorId, agentName, auditDate: new Date().toISOString().split('T')[0] },
        rigor,
        audioDataParam
      );
      setResult(data);
      onSave(agentName, transcript, data);
    } catch (err: any) {
      setError(`Erro na auditoria: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn relative z-10">
      {isGeneratingAudio && (
        <div className="fixed inset-0 z-[150] bg-[#042147]/95 backdrop-blur-2xl flex flex-col items-center justify-center text-white overflow-hidden">
          <div className="absolute top-12 flex flex-col items-center">
             <div className="bg-red-600 px-8 py-2 rounded-lg border-2 border-red-400 shadow-[0_0_40px_rgba(220,38,38,0.6)] animate-pulse mb-2">
                <span className="text-[10px] font-black tracking-[0.5em] text-white">ON AIR</span>
             </div>
             <p className="text-[9px] font-black uppercase text-white/30 tracking-widest">Neo & Jammin • Deep Dive Studio</p>
          </div>
          <div className="relative mb-16">
            <div className="absolute inset-0 bg-[#2cb638]/20 blur-[120px] rounded-full animate-pulse-slow"></div>
            <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center border border-white/10 relative z-10">
               <span className="text-6xl animate-bounce-slow">🎙️</span>
            </div>
            <div className="absolute inset-0 border-2 border-[#2cb638]/40 rounded-full animate-ping-slow"></div>
            <div className="absolute inset-[-20px] border border-[#2cb638]/20 rounded-full animate-ping-slower"></div>
          </div>
          <div className="flex items-end space-x-1.5 h-20 mb-12">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className="w-1.5 bg-gradient-to-t from-[#2cb638] to-[#71c8ff] rounded-full animate-audio-bar"
                style={{ 
                  animationDelay: `${i * 0.1}s`,
                  height: `${20 + Math.random() * 80}%`
                }}
              ></div>
            ))}
          </div>
          <div className="text-center max-w-sm px-10">
            <h4 className="text-xl font-black uppercase tracking-tighter mb-4 text-[#71c8ff]">{studioSteps[studioStepIdx]}</h4>
          </div>
        </div>
      )}

      {isShredding && (
        <div className="fixed inset-0 z-[120] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center text-white overflow-hidden">
          <div className="relative w-64 h-80 mb-10 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-white rounded-lg animate-shredder">
               <div className="flex w-full h-full">
                 {[...Array(12)].map((_, i) => (
                   <div key={i} className={`flex-1 h-full bg-slate-200 border-x border-slate-300 animate-strip-fall`} style={{animationDelay: `${i * 0.1}s`}}></div>
                 ))}
               </div>
            </div>
            <div className="absolute top-1/2 left-[-10%] right-[-10%] h-4 bg-slate-700 shadow-2xl z-10"></div>
          </div>
          <div className="max-w-md text-center px-10">
            <h4 className="text-xl font-black uppercase tracking-tighter mb-4 text-[#2cb638]">Nova Monitoria</h4>
            <p className="text-sm font-medium leading-relaxed opacity-80">Reiniciando o motor Neo & Jammin para uma nova análise...</p>
          </div>
        </div>
      )}

      {isAnalyzing && (
        <div className="fixed inset-0 z-[100] bg-[#042147]/95 backdrop-blur-2xl flex flex-col items-center justify-center text-white">
          <div className="relative mb-10">
            <div className="w-32 h-32 border-4 border-[#2cb638] border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center font-black text-[#2cb638] text-sm animate-pulse">STUDIO</div>
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#2cb638] max-w-xs text-center">
            {loadingSteps[loadingStepIdx]}
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-white/5 p-12 rounded-[56px] shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden relative">
        <div className="flex justify-between items-center mb-10 relative z-10">
          <div className="flex items-center space-x-3 bg-emerald-50 dark:bg-emerald-500/10 px-6 py-3 rounded-full border border-emerald-100 dark:border-emerald-500/20 w-fit">
             <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
             <p className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">Sincronizado: Ficha v1.1.2025 (Receptivo)</p>
          </div>
          <button onClick={handleNewAudit} className="bg-slate-900 text-white px-6 py-3 rounded-full font-black uppercase text-[9px] tracking-[0.2em] shadow-xl hover:bg-rose-600 transition-all">
            🗑️ Nova Monitoria
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 relative z-10">
          <input type="text" value={monitorName} onChange={e => setMonitorName(e.target.value)} placeholder="Monitor" className="bg-slate-50 dark:bg-black/20 p-5 rounded-3xl border border-slate-200 dark:border-white/5 outline-none font-bold" />
          <input type="text" value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="Agente" className="bg-slate-50 dark:bg-black/20 p-5 rounded-3xl border border-slate-200 dark:border-white/5 outline-none font-bold" />
          <input type="text" value={monitorId} onChange={e => setMonitorId(e.target.value)} placeholder="ID" className="bg-slate-50 dark:bg-black/20 p-5 rounded-3xl border border-slate-200 dark:border-white/5 outline-none font-bold" />
          <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Operação" className="bg-slate-50 dark:bg-black/20 p-5 rounded-3xl border border-slate-200 dark:border-white/5 outline-none font-bold" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 relative z-10">
          <textarea value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Transcrição..." className="w-full h-72 bg-slate-50 dark:bg-black/20 p-8 rounded-[40px] border border-slate-200 dark:border-white/5 outline-none font-medium resize-none" />
          <div onClick={() => audioInputRef.current?.click()} className={`w-full h-72 border-2 border-dashed rounded-[40px] flex flex-col items-center justify-center cursor-pointer transition-all ${selectedAudioFile ? 'bg-emerald-500/5 border-emerald-500/40' : 'bg-slate-50 dark:bg-black/20 border-slate-200'}`}>
            <input type="file" ref={audioInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
            <p className="text-xs font-black uppercase text-slate-400">{selectedAudioFile ? selectedAudioFile.name : 'Upload de Áudio'}</p>
          </div>
        </div>
        
        <button onClick={handleAnalyze} className="w-full bg-gradient-to-r from-[#2cb638] to-[#259b30] text-white p-6 rounded-[32px] font-black uppercase text-xs tracking-[0.3em] shadow-xl hover:scale-[1.01] transition-transform">
          Auditar com Neo & Jammin AI
        </button>
      </div>

      {result && (
        <div className="space-y-12 animate-slideUp">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-[#042147] p-12 rounded-[56px] text-white shadow-2xl border border-white/5 relative overflow-hidden">
              <p className="text-[10px] font-black text-[#2cb638] uppercase tracking-[0.4em] mb-4">Score Final</p>
              <h3 className="text-[140px] font-black leading-none tracking-tighter">{result.totalScore}</h3>
            </div>
            <div className="bg-gradient-to-br from-[#124b94] to-[#042147] p-12 rounded-[56px] text-white shadow-2xl relative border border-white/10">
              <p className="text-[10px] font-black text-[#71c8ff] uppercase tracking-[0.4em] mb-6">Neo & Jammin Studio</p>
              {!audioBase64 ? (
                <button onClick={handleGeneratePodcast} className="w-full bg-white text-[#124b94] px-10 py-6 rounded-[32px] font-black uppercase text-xs tracking-[0.3em] shadow-2xl">Gravar Podcast Neo & Jammin</button>
              ) : (
                <button onClick={playPodcast} className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl shadow-2xl bg-[#2cb638] ${isPlaying ? 'animate-pulse' : ''}`}>{isPlaying ? '📻' : '▶️'}</button>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes shred { 0% { transform: scaleY(1); opacity: 1; } 100% { transform: scaleY(0); opacity: 0; } }
        @keyframes strip-fall { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(300px); opacity: 0; } }
        @keyframes audio-bar { 0%, 100% { height: 20%; } 50% { height: 100%; } }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.2; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.1); } }
        @keyframes ping-slow { 0% { transform: scale(1); opacity: 1; } 70%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes ping-slower { 0% { transform: scale(1); opacity: 0.8; } 80%, 100% { transform: scale(3); opacity: 0; } }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-audio-bar { animation: audio-bar 0.8s infinite ease-in-out; }
        .animate-pulse-slow { animation: pulse-slow 3s infinite ease-in-out; }
        .animate-ping-slow { animation: ping-slow 2.5s infinite ease-out; }
        .animate-ping-slower { animation: ping-slower 4s infinite ease-out; }
        .animate-bounce-slow { animation: bounce-slow 2s infinite ease-in-out; }
        .animate-shredder { animation: shred 1.5s forwards ease-in; transform-origin: top; }
        .animate-strip-fall { animation: strip-fall 1.2s forwards ease-in; }
      `}</style>
    </div>
  );
};

export default AnalysisTool;
