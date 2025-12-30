
import React, { useState } from 'react';
import { ScorecardCriterion, NcgItem } from '../types';

interface ScorecardManagerProps {
  scorecard: ScorecardCriterion[];
  setScorecard: React.Dispatch<React.SetStateAction<ScorecardCriterion[]>>;
  ncgItems: NcgItem[];
  setNcgItems: React.Dispatch<React.SetStateAction<NcgItem[]>>;
}

const ScorecardManager: React.FC<ScorecardManagerProps> = ({ scorecard, setScorecard, ncgItems, setNcgItems }) => {
  const [isAddingNcg, setIsAddingNcg] = useState(false);
  const [newNcg, setNewNcg] = useState({ name: '', description: '' });

  const totalPoints = scorecard.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  const isInvalidTotal = totalPoints !== 100;

  const updateWeight = (id: string, weight: string) => {
    const val = weight === '' ? 0 : parseInt(weight);
    setScorecard(prev => prev.map(item => item.id === id ? { ...item, weight: val } : item));
  };

  const handleAddNcg = () => {
    if (newNcg.name.trim() && newNcg.description.trim()) {
      setNcgItems(prev => [...prev, { 
        id: `ncg-${Date.now()}`, 
        name: newNcg.name, 
        description: newNcg.description 
      }]);
      setNewNcg({ name: '', description: '' });
      setIsAddingNcg(false);
    }
  };

  const removeNcg = (id: string) => {
    if (confirm("Deseja remover este item de tolerância zero?")) {
      setNcgItems(prev => prev.filter(n => n.id !== id));
    }
  };

  const grouped = scorecard.reduce((acc: any, curr) => {
    if (!acc[curr.category]) acc[curr.category] = [];
    acc[curr.category].push(curr);
    return acc;
  }, {});

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* Sticky Total Indicator */}
      <div className={`fixed bottom-10 right-10 z-50 p-6 rounded-[32px] shadow-2xl border flex flex-col items-center transition-all ${isInvalidTotal ? 'bg-rose-600 border-rose-400 animate-pulse text-white' : 'bg-emerald-600 border-emerald-400 text-white'}`}>
        <span className="text-[10px] font-black uppercase tracking-widest mb-1">Total de Pontos</span>
        <span className="text-4xl font-black">{totalPoints}</span>
        {isInvalidTotal && <span className="text-[9px] font-bold mt-2 uppercase text-center max-w-[120px]">Ajuste para 100 pontos para garantir precisão</span>}
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-10">
        <div className="flex justify-between items-center mb-10 pb-8 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Ficha de Monitoria (Receptivo) v1.1.2025</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Personalize os pesos e critérios da monitoria.</p>
          </div>
          <button 
            onClick={() => setScorecard(prev => [...prev, { id: `custom-${Date.now()}`, name: 'Novo Item de Avaliação', description: 'Descreva detalhadamente o que deve ser observado...', weight: 0, category: 'Novos Critérios' }])}
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-900/10"
          >
            + Adicionar Critério
          </button>
        </div>

        <div className="space-y-12">
          {Object.keys(grouped).map(category => (
            <div key={category} className="space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 pl-4 border-l-2 border-l-blue-500">{category}</h3>
              <div className="grid grid-cols-1 gap-3">
                {grouped[category].map((item: ScorecardCriterion) => (
                  <div key={item.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group transition-all duration-300 hover:bg-white hover:shadow-md">
                    <div className="flex-1 pr-6">
                      <input 
                        className="font-bold text-slate-800 text-sm tracking-tight bg-transparent border-none focus:ring-0 w-full p-0 mb-1"
                        placeholder="Nome do Critério"
                        value={item.name}
                        onChange={(e) => setScorecard(prev => prev.map(i => i.id === item.id ? { ...i, name: e.target.value } : i))}
                      />
                      <textarea 
                        className="text-xs text-slate-500 bg-transparent border-none focus:ring-0 w-full p-0 resize-none leading-relaxed opacity-80"
                        placeholder="Instruções para a IA..."
                        value={item.description}
                        rows={2}
                        onChange={(e) => setScorecard(prev => prev.map(i => i.id === item.id ? { ...i, description: e.target.value } : i))}
                      />
                    </div>
                    <div className="ml-8 flex items-center space-x-2">
                       <div className="relative">
                          <input 
                            type="number"
                            value={item.weight}
                            onChange={(e) => updateWeight(item.id, e.target.value)}
                            className="w-20 px-3 py-3 bg-white rounded-2xl border border-slate-200 text-center font-black text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                          />
                          <span className="absolute -top-2 -right-2 bg-slate-100 text-[8px] font-black px-1.5 py-0.5 rounded-full text-slate-400 uppercase">pts</span>
                       </div>
                      <button 
                        onClick={() => setScorecard(prev => prev.filter(i => i.id !== item.id))}
                        className="w-10 h-10 rounded-xl bg-rose-50 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-rose-500 hover:text-white"
                        title="Remover critério"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NCG Section */}
      <div className="bg-slate-900 rounded-[40px] shadow-2xl p-10 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500 opacity-5 blur-[100px] -mr-32 -mt-32"></div>
        
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div>
            <h3 className="text-2xl font-black tracking-tighter uppercase">Itens de Tolerância Zero (NCG)</h3>
            <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">Falhas Graves que anulam o score total</p>
          </div>
          {!isAddingNcg && (
            <button 
              onClick={() => setIsAddingNcg(true)}
              className="bg-rose-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all shadow-lg shadow-rose-900/40"
            >
              + Adicionar Regra NCG
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {isAddingNcg && (
            <div className="p-8 bg-white/10 border border-white/20 rounded-[32px] animate-fadeIn md:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Título da Falha</label>
                  <input 
                    autoFocus
                    value={newNcg.name}
                    onChange={(e) => setNewNcg({...newNcg, name: e.target.value})}
                    placeholder="Ex: Desligamento Indevido"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-rose-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Descrição da Regra</label>
                  <input 
                    value={newNcg.description}
                    onChange={(e) => setNewNcg({...newNcg, description: e.target.value})}
                    placeholder="Ex: Quando o operador encerra a chamada sem autorização..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-rose-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button 
                  onClick={() => { setIsAddingNcg(false); setNewNcg({ name: '', description: '' }); }}
                  className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddNcg}
                  disabled={!newNcg.name.trim() || !newNcg.description.trim()}
                  className="bg-rose-600 px-8 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-rose-500 transition-all disabled:opacity-30"
                >
                  Confirmar e Salvar
                </button>
              </div>
            </div>
          )}

          {ncgItems.map(ncg => (
            <div key={ncg.id} className="p-6 bg-white/5 border border-white/10 rounded-3xl group flex justify-between items-start hover:bg-white/10 transition-colors">
              <div className="pr-4">
                <h4 className="font-bold text-rose-400 text-sm uppercase mb-1 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2"></span>
                  {ncg.name}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed italic opacity-80">{ncg.description}</p>
              </div>
              <button 
                onClick={() => removeNcg(ncg.id)}
                className="text-white/20 hover:text-rose-500 transition-all font-black text-[10px] uppercase p-2 hover:bg-rose-500/10 rounded-xl"
              >
                Excluir
              </button>
            </div>
          ))}
        </div>
        
        {ncgItems.length === 0 && !isAddingNcg && (
          <div className="py-12 text-center border-2 border-dashed border-white/10 rounded-[32px]">
            <p className="text-slate-500 text-sm font-medium">Nenhuma regra de Tolerância Zero cadastrada.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScorecardManager;
