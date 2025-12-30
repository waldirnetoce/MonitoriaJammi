
import React, { useState } from 'react';
import { Interaction } from '../types';

interface HistoryProps {
  interactions: Interaction[];
}

const History: React.FC<HistoryProps> = ({ interactions }) => {
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);

  const copyFeedback = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Feedback copiado!');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Registro de Monitorias Reais</h2>
          <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase">
            {interactions.length} Históricos
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4">Agente / Operador</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4 text-center">Score</th>
                <th className="px-6 py-4">Avaliação Final</th>
                <th className="px-6 py-4">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {interactions.length > 0 ? (
                interactions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{item.agentName}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">ID: {item.id.split('-')[0]}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{item.date}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-black ${item.result?.totalScore && item.result.totalScore >= 90 ? 'text-emerald-500' : 'text-slate-700'}`}>
                        {item.result?.totalScore || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[9px] font-black tracking-tight uppercase ${
                        item.result?.evaluationStatus === 'CONFORME' ? 'bg-emerald-100 text-emerald-700' : 
                        item.result?.evaluationStatus === 'FALHA GRAVE (NCG)' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.result?.evaluationStatus || 'PENDENTE'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setSelectedInteraction(item)}
                        className="text-blue-600 text-[10px] font-black uppercase hover:underline"
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium text-sm">
                    Nenhuma monitoria registrada no histórico.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInteraction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-slideUp">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-none">Detalhes da Monitoria</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{selectedInteraction.agentName} • {selectedInteraction.date}</p>
              </div>
              <button 
                onClick={() => setSelectedInteraction(null)}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Resumo do AI</h4>
                  <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 h-full">
                    <p className="text-blue-900 font-bold mb-2">Motivo: {selectedInteraction.result?.reasonForCall}</p>
                    <p className="text-xs text-blue-700 leading-relaxed italic">"{selectedInteraction.result?.summary}"</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Lançamento</h4>
                  <div className="bg-slate-900 text-white p-6 rounded-3xl font-mono text-[10px] leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-40">
                    {selectedInteraction.result?.systemReadyText}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Feedback</h4>
                    <button 
                        onClick={() => copyFeedback(selectedInteraction.result?.operatorFeedback || '')}
                        className="text-[9px] font-black uppercase text-emerald-600 hover:underline"
                    >
                        Copiar
                    </button>
                  </div>
                  <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 h-full text-[10px] leading-relaxed italic text-emerald-900">
                    {selectedInteraction.result?.operatorFeedback}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Avaliação por Itens</h4>
                 <div className="grid grid-cols-1 gap-2">
                    {selectedInteraction.result?.criteriaScores.map(score => (
                      <div key={score.criterionId} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex-1 pr-4">
                          <p className="text-xs font-bold text-slate-800">Item {score.criterionId}</p>
                          <p className="text-[10px] text-slate-500">{score.observation}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                           <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                             score.status === 'CONFORME' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                           }`}>
                             {score.status}
                           </span>
                           <span className="text-sm font-black text-slate-700">{score.pointsEarned} pts</span>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default History;
