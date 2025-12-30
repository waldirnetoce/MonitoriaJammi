
import React, { useMemo } from 'react';
import { 
  Tooltip, ResponsiveContainer, Cell, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  RadialBarChart, RadialBar, ComposedChart, CartesianGrid, XAxis, YAxis, Bar, Line, PolarRadiusAxis
} from 'recharts';
import { Interaction, ScorecardCriterion } from '../types';

// Defining DashboardProps interface to fix missing type error
interface DashboardProps {
  interactions: Interaction[];
  scorecard: ScorecardCriterion[];
}

const CustomTooltip = ({ active, payload, label, theme }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`p-6 rounded-[32px] border shadow-2xl backdrop-blur-2xl ${theme === 'dark' ? 'bg-[#1a2333]/90 border-white/10 text-white' : 'bg-white/90 border-[#2cb638]/10 text-[#042147]'}`}>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3">{label}</p>
        {payload.map((p: any, index: number) => (
          <p key={index} className="text-sm font-bold flex items-center mb-1">
            <span className="w-2.5 h-2.5 rounded-full mr-3" style={{ backgroundColor: p.color || p.fill }}></span>
            {p.name}: <span className="ml-2 text-[#2cb638] font-black">{p.value}{p.name.includes('%') || p.name === 'Performance' ? '%' : ''}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ interactions, scorecard }) => {
  const stats = useMemo(() => {
    const total = interactions.length;
    const avgScore = total > 0 ? Math.round(interactions.reduce((acc, curr) => acc + (curr.result?.totalScore || 0), 0) / total) : 0;
    
    const radialData = [{ name: 'Score', value: avgScore, fill: avgScore >= 90 ? '#2cb638' : avgScore >= 75 ? '#124b94' : '#f43f5e' }];

    const categoryMap: Record<string, { total: number; max: number; count: number }> = {};
    interactions.forEach(i => {
      i.result?.criteriaScores.forEach(cs => {
        const criterion = scorecard.find(s => s.id === cs.criterionId);
        if (criterion) {
          if (!categoryMap[criterion.category]) {
            categoryMap[criterion.category] = { total: 0, max: 0, count: 0 };
          }
          categoryMap[criterion.category].total += cs.pointsEarned;
          categoryMap[criterion.category].max += criterion.weight;
          categoryMap[criterion.category].count += 1;
        }
      });
    });

    const radarData = Object.entries(categoryMap).map(([name, data]) => ({
      subject: name.replace(/^\d\.\s/, ''),
      A: Math.round((data.total / data.max) * 100),
      fullMark: 100
    }));

    const failureMap: Record<string, { count: number; name: string }> = {};
    interactions.forEach(interaction => {
      interaction.result?.criteriaScores.forEach(score => {
        if (score.status !== 'CONFORME') {
          if (!failureMap[score.criterionId]) {
            const criterion = scorecard.find(s => s.id === score.criterionId);
            failureMap[score.criterionId] = { count: 0, name: criterion?.name || `Item ${score.criterionId}` };
          }
          failureMap[score.criterionId].count += 1;
        }
      });
    });

    const failureList = Object.entries(failureMap)
      .map(([id, data]) => ({ id, name: data.name, ocorrencias: data.count }))
      .sort((a, b) => b.ocorrencias - a.ocorrencias);

    const totalFailures = failureList.reduce((acc, curr) => acc + curr.ocorrencias, 0);
    let cumulative = 0;
    const paretoData = failureList.map(item => {
      cumulative += item.ocorrencias;
      return {
        ...item,
        percentualAcumulado: totalFailures > 0 ? Math.round((cumulative / totalFailures) * 100) : 0,
        isVital: (cumulative - item.ocorrencias) / totalFailures < 0.8
      };
    });

    return { total, avgScore, radialData, radarData, paretoData };
  }, [interactions, scorecard]);

  return (
    <div className="space-y-12 animate-fadeIn relative z-10 pb-20">
      {/* SEÇÃO 1: HIGHLIGHTS RÁPIDOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-white dark:bg-[#1a2333] p-10 rounded-[48px] shadow-sm border border-slate-100 dark:border-white/5 relative flex flex-col items-center">
          <p className="text-[#2cb638] text-[10px] font-black uppercase tracking-[0.3em] mb-4">Média de Qualidade</p>
          <div className="h-[240px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={24} data={stats.radialData} startAngle={180} endAngle={-180}>
                <RadialBar background dataKey="value" cornerRadius={12} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-7xl font-black text-slate-800 dark:text-white tracking-tighter">{stats.avgScore}</span>
              <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">Global Score</span>
            </div>
          </div>
        </div>
        
        <div className="bg-[#042147] p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center items-center text-center">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#2cb638]/10 blur-3xl rounded-full"></div>
          <div className="relative z-10">
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Volume de Auditorias</p>
            <h3 className="text-[100px] font-black mt-2 tracking-tighter leading-none">{stats.total}</h3>
            <div className="flex items-center justify-center space-x-2 mt-6">
              <span className="w-2 h-2 bg-[#2cb638] rounded-full animate-pulse"></span>
              <p className="text-[9px] font-black uppercase text-[#2cb638] tracking-widest">Base Ativa e Sincronizada</p>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: MAPEAMENTO DE COMPETÊNCIAS (PROEMINENTE) */}
      <div className="bg-white dark:bg-[#1a2333] p-12 rounded-[56px] shadow-2xl border border-slate-100 dark:border-white/5 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div>
            <h4 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Mapeamento de Competências</h4>
            <p className="text-[10px] font-black text-[#124b94] dark:text-[#2cb638] uppercase tracking-[0.3em] mt-3">Análise de Radar por Dimensão Operacional</p>
          </div>
          <div className="mt-4 md:mt-0 px-6 py-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Visualização Técnica v12.0</span>
          </div>
        </div>
        
        <div className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats.radarData}>
              <PolarGrid stroke="#e2e8f0" strokeOpacity={0.2} />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b', letterSpacing: '0.1em' }} 
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar 
                name="Performance" 
                dataKey="A" 
                stroke="#2cb638" 
                strokeWidth={3}
                fill="#2cb638" 
                fillOpacity={0.2} 
              />
              <Tooltip content={<CustomTooltip theme="light" />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
           {stats.radarData.map((item, idx) => (
             <div key={idx} className="p-4 rounded-3xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{item.subject}</p>
                <p className="text-xl font-black text-[#124b94] dark:text-[#2cb638]">{item.A}%</p>
             </div>
           ))}
        </div>
      </div>

      {/* SEÇÃO 3: PARETO DE FALHAS */}
      <div className="bg-[#1a2333] p-12 rounded-[56px] shadow-2xl border border-white/5 relative overflow-hidden">
        <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-12">Análise de Pontos de Fricção (Pareto)</h4>
        <div className="h-[400px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={stats.paretoData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" strokeOpacity={0.03} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 700, fill: '#64748b' }} angle={-25} textAnchor="end" interval={0} height={80} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#475569' }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#2cb638' }} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip theme="dark" />} />
              <Bar yAxisId="left" dataKey="ocorrencias" radius={[12, 12, 0, 0]} name="Falhas">
                {stats.paretoData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isVital ? '#f43f5e' : '#334155'} />
                ))}
              </Bar>
              <Line yAxisId="right" type="monotone" dataKey="percentualAcumulado" stroke="#2cb638" strokeWidth={4} dot={{ r: 5, fill: '#2cb638' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
