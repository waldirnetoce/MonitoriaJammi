
import React, { useState, useRef, useEffect } from 'react';
import { analyzeInteraction, generateAudioPodcastFeedback } from '../services/geminiService';
import { AnalysisResult, ScorecardCriterion, NcgItem, RigorLevel, VoiceProfile } from '../types';

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
  voiceProfile: VoiceProfile | null;
}

const loadingSteps = ["Sincronizando checklists...", "Jammin analisando tom de voz...", "Validando script v1.1.2025...", "Gerando justificativas técnicas..."];

const AnalysisTool: React.FC<AnalysisToolProps> = ({ onSave, scorecard, ncgItems, voiceProfile }) => {
  const [transcript, setTranscript] = useState('');
  const [agentName, setAgentName] = useState('');
  const [monitorName, setMonitorName] = useState('');
  const [monitorId, setMonitorId] = useState('');
  const [company, setCompany] = useState('');
  const [rigor, setRigor] = useState<RigorLevel>('MEDIUM');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);

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

  const handleAnalyze = async () => {
    if (!agentName || !company || !monitorId) {
      setError("Campos obrigatorios: Agente, ID e Operação.");
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setAudioBase64(null);

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

  const handleGeneratePodcast = async () => {
    if (!result) return;
    setIsGeneratingAudio(true);
    setError(null);
    try {
      const b64 = await generateAudioPodcastFeedback(result, agentName, monitorName || "Monitor", voiceProfile || undefined);
      setAudioBase64(b64);
    } catch (err: any) {
      setError(`Falha ao gerar podcast: ${err.message}`);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const playPodcast = async () => {
    if (!audioBase64 || isPlaying) return;
    try {
      setIsPlaying(true);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const decoded = decode(audioBase64);
      const buffer = await decodeAudioData(decoded, audioCtx, 24000, 1);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
    } catch (err) {
      setIsPlaying(false);
      setError("Erro ao reproduzir o áudio.");
    }
  };

  return (
    <div className="space-y-12 animate-fadeIn pb-24">
      {(isAnalyzing || isGeneratingAudio) && (
        <div className="fixed inset-0 z-[100] bg-[#042147]/95 backdrop-blur-3xl flex flex-col items-center justify-center text-white">
          <div className="relative mb-8">
            <div className="w-24 h-24 border-4 border-[#2cb638] border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl animate-pulse">🎙️</span>
            </div>
          </div>
          <p className="text-xs font-black uppercase tracking-[0.5em] text-[#2cb638]">
            {isGeneratingAudio ? "Jammin Studio: Gravando Feedback..." : loadingSteps[loadingStepIdx]}
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-[#1a2333] p-10 rounded-[48px] shadow-2xl border border-slate-100 dark:border-white/5">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xl font-black uppercase tracking-tighter text-[#124b94] dark:text-[#2cb638]">Nova Auditoria Jammin</h3>
          <button onClick={() => { setResult(null); setTranscript(''); setAudioBase64(null); }} className="text-[10px] font-black uppercase text-rose-500 tracking-widest">Resetar</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <input type="text" placeholder="Nome do Monitor" value={monitorName} onChange={e => setMonitorName(e.target.value)} className="bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5 outline-none font-bold text-sm" />
          <input type="text" placeholder="Agente" value={agentName} onChange={e => setAgentName(e.target.value)} className="bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5 outline-none font-bold text-sm" />
          <input type="text" placeholder="ID Monitoria" value={monitorId} onChange={e => setMonitorId(e.target.value)} className="bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5 outline-none font-bold text-sm" />
          <input type="text" placeholder="Operação" value={company} onChange={e => setCompany(e.target.value)} className="bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5 outline-none font-bold text-sm" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <textarea placeholder="Cole a transcrição aqui..." value={transcript} onChange={e => setTranscript(e.target.value)} className="w-full h-64 bg-slate-50 dark:bg-black/20 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 outline-none font-medium text-sm" />
          <div onClick={() => audioInputRef.current?.click()} className="w-full h-64 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[32px] flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
            <input type="file" ref={audioInputRef} onChange={e => setSelectedAudioFile(e.target.files?.[0] || null)} className="hidden" accept="audio/*" />
            <span className="text-4xl mb-2">🎙️</span>
            <p className="text-[10px] font-black uppercase text-slate-400">{selectedAudioFile ? selectedAudioFile.name : 'Upload de Áudio (Opcional)'}</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">Nível de Rigor</label>
             <select value={rigor} onChange={e => setRigor(e.target.value as RigorLevel)} className="w-full bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5 outline-none font-bold text-sm">
              <option value="LIGHT">Rigor Light (Análise Rápida)</option>
              <option value="MEDIUM">Rigor Medium (Padrão)</option>
              <option value="EXPERT">Rigor Expert (Auditores Sêniores)</option>
            </select>
          </div>
          <button onClick={handleAnalyze} className="md:w-64 bg-[#2cb638] text-white p-6 rounded-[32px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.01] transition-transform self-end">Executar Auditoria</button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-100 border border-rose-200 text-rose-700 px-6 py-4 rounded-3xl font-bold animate-fadeIn">
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div className="space-y-12 animate-slideUp">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#042147] p-12 rounded-[56px] text-white flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <span className={`text-[10px] font-black px-3 py-1 rounded-full ${result.isNcgDetected ? 'bg-rose-600' : 'bg-[#2cb638]'}`}>{result.evaluationStatus}</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#2cb638] mb-4">Score Final</span>
              <h4 className="text-[140px] font-black leading-none tracking-tighter">{result.totalScore}</h4>
            </div>
            
            <div className="bg-gradient-to-br from-[#124b94] to-[#042147] p-12 rounded-[56px] text-white flex flex-col items-center justify-center shadow-2xl border border-white/10">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#71c8ff] mb-8">Deep Dive Podcast</span>
              {!audioBase64 ? (
                <button 
                  onClick={handleGeneratePodcast} 
                  disabled={isGeneratingAudio}
                  className="bg-white text-[#124b94] px-10 py-5 rounded-full font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform disabled:opacity-50"
                >
                  {isGeneratingAudio ? "Gravando..." : "Gerar Feedback em Áudio"}
                </button>
              ) : (
                <div className="flex flex-col items-center">
                  <button onClick={playPodcast} className={`w-24 h-24 rounded-full flex items-center justify-center bg-[#2cb638] text-white text-4xl shadow-2xl transition-all ${isPlaying ? 'animate-pulse scale-110' : 'hover:scale-110'}`}>
                    {isPlaying ? '📻' : '▶️'}
                  </button>
                  <p className="mt-4 text-[9px] font-black uppercase text-white/60 tracking-widest">Feedback Disponível</p>
                </div>
              )}
              {voiceProfile && <p className="mt-6 text-[8px] font-black uppercase text-white/40 tracking-[0.2em] max-w-xs text-center">Clonagem de Tom: {voiceProfile.tonalityDescription}</p>}
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a2333] p-12 rounded-[56px] shadow-2xl border border-slate-100 dark:border-white/5">
            <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-100 dark:border-white/5">
              <h4 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">Relatório Técnico</h4>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assunto Principal</p>
                <p className="font-bold text-[#124b94] dark:text-[#2cb638]">{result.reasonForCall}</p>
              </div>
            </div>

            <div className="space-y-6">
              {result.criteriaScores.map((score) => {
                const criterion = scorecard.find(s => s.id === score.criterionId);
                const conforme = score.status === 'CONFORME';
                return (
                  <div key={score.criterionId} className={`p-8 rounded-[40px] border transition-all ${conforme ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-[10px] font-black bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full uppercase text-slate-400">Item {score.criterionId}</span>
                          <span className="text-[10px] font-black text-[#124b94] dark:text-[#2cb638] uppercase tracking-widest">{criterion?.category}</span>
                        </div>
                        <h5 className="text-lg font-black tracking-tight">{criterion?.name}</h5>
                      </div>
                      <div className="flex items-center space-x-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${conforme ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>{score.status}</span>
                        <div className="text-center w-20">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pontos</p>
                          <p className={`text-2xl font-black ${conforme ? 'text-emerald-500' : 'text-rose-500'}`}>{score.pointsEarned} / {criterion?.weight}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-5 bg-white/50 dark:bg-black/10 rounded-3xl border border-slate-100 dark:border-white/5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Requisito do Scorecard:</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{criterion?.description}</p>
                      </div>
                      <div className="p-5 bg-[#124b94]/5 dark:bg-[#2cb638]/5 rounded-3xl border border-[#124b94]/10 dark:border-[#2cb638]/10">
                        <p className="text-[9px] font-black text-[#124b94] dark:text-[#2cb638] uppercase tracking-widest mb-2">Justificativa da Jammin:</p>
                        <p className="text-xs font-bold italic leading-relaxed text-slate-800 dark:text-slate-200">"{score.observation}"</p>
                      </div>
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
