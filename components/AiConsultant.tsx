
import React, { useState, useRef, useEffect } from 'react';
import { askAiQuestion } from '../services/geminiService';
import { ScorecardCriterion } from '../types';

interface AiConsultantProps {
  scorecard: ScorecardCriterion[];
}

const AiConsultant: React.FC<AiConsultantProps> = ({ scorecard }) => {
  const [query, setQuery] = useState('');
  const [chat, setChat] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMsg = query;
    setQuery('');
    setChat(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await askAiQuestion(userMsg, scorecard);
      setChat(prev => [...prev, { role: 'ai', text: response }]);
    } catch (err) {
      setChat(prev => [...prev, { role: 'ai', text: "Ocorreu um erro ao consultar a Jammin. Verifique sua conexão." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[75vh] flex flex-col animate-fadeIn bg-white dark:bg-[#151D2C] rounded-[48px] shadow-2xl border border-slate-100 dark:border-[#243144] overflow-hidden">
      <div className="p-8 border-b border-slate-100 dark:border-[#243144] flex items-center justify-between bg-slate-50 dark:bg-black/10">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2cb638] to-[#124b94] flex items-center justify-center text-white text-2xl shadow-lg">🤖</div>
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Consultoria IA (Jammin)</h3>
          </div>
        </div>
        <div className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase">Online</div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-6 bg-slate-50/50 dark:bg-transparent">
        {chat.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <span className="text-6xl mb-4">💬</span>
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">Olá! Eu sou a Jammin.<br/>Como posso ajudar na sua monitoria hoje?</p>
          </div>
        )}
        {chat.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slideUp`}>
            <div className={`max-w-[80%] p-6 rounded-[32px] text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-[#124b94] text-white rounded-tr-none' 
                : 'bg-white dark:bg-white/5 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-white/5 rounded-tl-none italic'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white dark:bg-white/5 p-4 rounded-full border border-slate-100 dark:border-white/5">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleAsk} className="p-8 border-t border-slate-100 dark:border-[#243144] bg-white dark:bg-black/10">
        <div className="relative">
          <input 
            type="text" 
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Pergunte à Jammin sobre o Scorecard..."
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-8 py-5 text-sm font-medium outline-none focus:border-[#2cb638] focus:ring-4 focus:ring-[#2cb638]/5 transition-all pr-20"
          />
          <button 
            type="submit"
            disabled={!query.trim() || isLoading}
            className="absolute right-2 top-2 bottom-2 bg-[#2cb638] text-white px-6 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-[#259b30] transition-all disabled:opacity-30"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
};

export default AiConsultant;
