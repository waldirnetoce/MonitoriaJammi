
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

const loadingSteps = ["Sincronizando checklists...", "Jammin analisando tom de voz...", "Validando script v1.1.2025...", "Gerando justificativas técnicas..."];

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
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const playPodcast = async () => {
    if (!audioBase64 || isPlaying) return;
    setIsPlaying(true);
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const buffer = await decodeAudioData(decode(audioBase64), audioCtx, 24000, 1);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.onended = () => setIsPlaying(false);
    source.start();
  };

  const handleAnalyze = async () => {
    if (!agentName || !company || !monitorId) {
      setError("Campos obrigatorios: Agente, ID e Operação.");
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    try {
      let audioData = undefined;
      if (selectedAudioFile) {
        audioData = { data: await fileToBase64(selectedAudioFile), mimeType: selectedAudioFile.type };
      }
      const data = await analyzeInteraction(transcript, monitorName, company, scorecard, ncgItems, { monitorId, agentName, auditDate: new Date().toLocaleDateString() }, rigor, audioData);
      setResult(data);
      onSave(agentName, transcript, data);
    } catch (err: any) {
      setError(`Erro na auditoria Jammin: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-12 animate-fadeIn pb-24">
      {isAnalyzing && (
        <div className="fixed inset-0 z-[100] bg-[#042147]/95 backdrop-blur-3xl flex flex-col items-center justify-center text-white">
          <div className="w-24 h-24 border-4 border-[#2cb638] border-t-transparent rounded-full animate-spin mb-8"></div>
          <p className="text-xs font-black uppercase tracking-[0.5em] text-[#2cb638]">{loadingSteps[loadingStepIdx]}</p>
        </div>
      )}

      {/* PAINEL DE ENTRADA */}
      <div className="bg-white dark:bg-[#1a2333] p-10 rounded-[48px] shadow-2xl border border-slate-100 dark:border-white/5">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xl font-black uppercase tracking-tighter text-[#124b94] dark:text-[#2cb638]">Nova Auditoria Jammin</h3>
          <button onClick={() => { setResult(null); setTranscript(''); }} className="text-[10px] font-black uppercase text-rose-500 tracking-widest">Resetar</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <input type="text" placeholder="Agente" value={agentName} onChange={e => setAgentName(e.target.value)} className="bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5 outline-none font-bold text-sm" />
          <input type="text" placeholder="ID Monitoria" value={monitorId} onChange={e => setMonitorId(e.target.value)} className="bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5 outline-none font-bold text-sm" />
          <input type="text" placeholder="Operação" value={company} onChange={e => setCompany(e.target.value)} className="bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5 outline-none font-bold text-sm" />
          <select value={rigor} onChange={e => setRigor(e.target.value as RigorLevel)} className="bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5 outline-none font-bold text-sm">
            <option value="LIGHT">Rigor Light</option>
            <option value="MEDIUM">Rigor Medium</option>
            <option value="EXPERT">Rigor Expert</option>
          </select>
        </div>

        <textarea placeholder="Cole a transcrição aqui..." value={transcript} onChange={e => setTranscript(e.target.value)} className="w-full h-64 bg-slate-50 dark:bg-black/20 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 outline-none mb-6 font-medium text-sm" />
        
        <button onClick={handleAnalyze} className="w-full bg-[#2cb638] text-white p-6 rounded-[32px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.01] transition-transform">Executar Auditoria</button>
      </div>

      {result && (
        <div className="space-y-12 animate-slideUp">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#042147] p-12 rounded-[56px] text-white flex flex-col items-center justify-center shadow-2xl">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#2cb638] mb-4">Score Final</span>
              <h4 className="text-[140px] font-black leading-none tracking-tighter">{result.totalScore}</h4>
            </div>
            <div className="bg-white dark:bg-[#1a2333] p-12 rounded-[56px] shadow-2xl border border-slate-100 dark:border-white/5 flex flex-col justify-center">
               <h5 className="text-[10px] font-black uppercase text-slate-400 mb-2">Motivo Detectado</h5>
               <p className="text-xl font-bold text-[#124b94] dark:text-[#2cb638] mb-6">{result.reasonForCall}</p>
               <div className="p-6 bg-slate-50 dark:bg-black/20 rounded-[32px] border border-slate-100 dark:border-white/5">
                 <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Resumo Executivo</p>
                 <p className="text-sm font-medium italic opacity-80 leading-relaxed">"{result.summary}"</p>
               </div>
            </div>
          </div>

          {/* FICHA DETALHADA - O QUE FOI PEDIDO */}
          <div className="bg-white dark:bg-[#1a2333] p-12 rounded-[56px] shadow-2xl border border-slate-100 dark:border-white/5">
            <h4 className="text-2xl font-black uppercase tracking-tighter mb-10 text-slate-800 dark:text-white">Detalhamento por Item</h4>
            <div className="space-y-6">
              {result.criteriaScores.map((score) => {
                const criterion = scorecard.find(s => s.id === score.criterionId);
                const conforme = score.status === 'CONFORME';
                return (
                  <div key={score.criterionId} className={`p-8 rounded-[40px] border transition-all ${conforme ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-[10px] font-black bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full uppercase text-slate-400">ID {score.criterionId}</span>
                          <span className="text-[10px] font-black text-[#124b94] dark:text-[#2cb638] uppercase tracking-widest">{criterion?.category}</span>
                        </div>
                        <h5 className="text-lg font-black tracking-tight">{criterion?.name}</h5>
                      </div>
                      <div className="flex items-center space-x-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${conforme ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>{score.status}</span>
                        <div className="text-center w-16">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pontos</p>
                          <p className="text-2xl font-black">{score.pointsEarned}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-black/20 p-6 rounded-[24px] border border-slate-100 dark:border-white/5">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Justificativa Jammin AI:</p>
                       <p className="text-sm font-medium italic opacity-90 leading-relaxed text-slate-700 dark:text-slate-300">"{score.observation}"</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisTool;
