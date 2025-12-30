
import React, { useState } from 'react';

const Help: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Adm*2@2026') {
      setIsUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-fadeIn">
      <section className="bg-white dark:bg-[#151D2C] p-10 rounded-[40px] shadow-sm border border-slate-100 dark:border-[#243144] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8">
           <span className="text-[10px] font-black bg-[#2cb638]/10 text-[#2cb638] px-4 py-2 rounded-full uppercase tracking-widest border border-[#2cb638]/20">v1.6.0 Stable</span>
        </div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase mb-4">Manual do Usuário</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-2xl">
          Bem-vindo à documentação oficial da <strong>Jammin QA</strong>. Aqui você encontrará os guias de operação e implantação técnica.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-xs font-black text-[#2cb638] uppercase tracking-[0.2em] ml-2">Fluxo Operacional</h3>
          <div className="bg-white dark:bg-[#151D2C] p-8 rounded-[32px] border border-slate-100 dark:border-[#243144] space-y-4 text-xs">
            <p className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-[#2cb638] rounded-full"></span> <span>Entrada de Transcrição ou Áudio.</span></p>
            <p className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-[#2cb638] rounded-full"></span> <span>Aplicação do Scorecard Jammin.</span></p>
            <p className="flex items-center space-x-2"><span className="w-1.5 h-1.5 bg-[#2cb638] rounded-full"></span> <span>Geração de Feedback v1.1.2025.</span></p>
          </div>
        </div>
        <div className="space-y-6">
          <h3 className="text-xs font-black text-[#124b94] uppercase tracking-[0.2em] ml-2">Tecnologia Studio AI</h3>
          <div className="bg-white dark:bg-[#151D2C] p-8 rounded-[32px] border border-slate-100 dark:border-[#243144] italic text-xs leading-relaxed text-slate-500">
            "Nosso motor Deep Dive utiliza análise semântica de última geração para garantir auditorias 100% imparciais e técnicas."
          </div>
        </div>
      </div>

      <section className="bg-[#042147] p-12 rounded-[56px] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.1] transition-all duration-700">
           <span className="text-[120px] font-black leading-none">SYS</span>
        </div>
        
        <div className="relative z-10">
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-10 flex items-center space-x-4">
            <span className="text-3xl">🛠️</span>
            <div>
              <span className="block">Área Técnica & Servidor</span>
              <span className="block text-[9px] text-white/40 font-black tracking-widest uppercase">Acesso Restrito ao Administrador</span>
            </div>
          </h3>

          {!isUnlocked ? (
            <div className="bg-white/5 backdrop-blur-md p-10 rounded-[44px] border border-white/10 flex flex-col items-center">
              <span className="text-4xl mb-6">🔒</span>
              <p className="text-xs font-bold text-white/60 mb-8 uppercase tracking-widest">Insira a credencial master</p>
              <form onSubmit={handleUnlock} className="flex w-full max-w-sm relative">
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Senha Administrativa..." 
                  className={`w-full bg-white/10 border ${error ? 'border-rose-500' : 'border-white/20'} rounded-full px-8 py-5 text-sm font-bold outline-none transition-all focus:border-[#2cb638]`} 
                />
                <button type="submit" className="absolute right-2 top-2 bottom-2 bg-[#2cb638] px-6 rounded-full font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all">OK</button>
              </form>
              {error && <p className="text-rose-500 text-[9px] font-black uppercase mt-4 tracking-widest animate-pulse">Acesso Negado</p>}
            </div>
          ) : (
            <div className="space-y-10 animate-fadeIn">
              <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 text-xs font-mono">
                <h4 className="text-[#2cb638] font-black uppercase mb-4 text-sm tracking-widest">Deploy Servidor</h4>
                <div className="space-y-4 text-white/70">
                  <p className="text-white/40"># Linux (Ubuntu/Debian)</p>
                  <p>sudo apt update && sudo apt install nodejs npm pm2 -y</p>
                  <p>npm run build && pm2 start npm --name "jammin-qa" -- start</p>
                  <p className="text-white/40 mt-4"># Windows Server</p>
                  <p>Instalar Node.js LTS, extrair arquivos e executar: npm install && npm run build</p>
                </div>
              </div>

              <div className="bg-white/5 p-8 rounded-[40px] border border-white/10">
                <h4 className="text-amber-400 font-black uppercase mb-4 text-sm tracking-widest">Banco de Dados (SQL/PostgreSQL)</h4>
                <div className="space-y-4">
                  <p className="text-[10px] text-white/50 uppercase font-black">Script de Inicialização:</p>
                  <div className="bg-black/30 p-6 rounded-2xl font-mono text-[10px] text-emerald-300 leading-relaxed overflow-x-auto">
                    <p>CREATE TABLE interactions (</p>
                    <p>&nbsp;&nbsp;id UUID PRIMARY KEY DEFAULT gen_random_uuid(),</p>
                    <p>&nbsp;&nbsp;agent_name VARCHAR(255) NOT NULL,</p>
                    <p>&nbsp;&nbsp;total_score INTEGER,</p>
                    <p>&nbsp;&nbsp;audit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,</p>
                    <p>&nbsp;&nbsp;transcript TEXT,</p>
                    <p>&nbsp;&nbsp;feedback TEXT</p>
                    <p>);</p>
                  </div>
                  <p className="text-[10px] text-white/50 mt-4 italic">Recomendamos PostgreSQL 15+ ou MySQL 8.0+ para melhor performance.</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-600/20 to-emerald-900/40 p-10 rounded-[40px] border border-emerald-500/20">
                <h4 className="text-emerald-400 font-black uppercase mb-4 text-sm tracking-widest">Gemini Free Integration</h4>
                <p className="text-xs text-white/70 leading-relaxed">
                  Para utilizar o motor Gemini em modo gratuito, configure sua <code>API_KEY</code> no arquivo <code>.env</code>. 
                  O sistema gerencia automaticamente os limites de 15 requisições por minuto.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="text-center pt-10">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">© 2025 Jammin QA System • monitoria.studio@suporte.com</p>
      </footer>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>
    </div>
  );
};

export default Help;
