
import React, { useState, useRef, useMemo } from 'react';
import { Boleto, DigiSacConfig, OmieConfig } from '../types';
import { extractBoletoFromImage, personalizeMessage } from '../services/geminiService';
import { sendToDigiSac } from '../services/digisacService';
import { fetchOmieContasReceber } from '../services/omieService';

interface LogEntry {
  time: string;
  type: 'info' | 'success' | 'error';
  msg: string;
  isCORS?: boolean;
}

interface BoletoManagerProps {
  config: DigiSacConfig;
  omieConfig: OmieConfig;
  boletos: Boleto[];
  setBoletos: React.Dispatch<React.SetStateAction<Boleto[]>>;
}

const BoletoManager: React.FC<BoletoManagerProps> = ({ config, omieConfig, boletos, setBoletos }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (type: 'info' | 'success' | 'error', msg: string) => {
    const isCORS = msg.includes('CORS') || msg.includes('Conexão') || msg.includes('Rede');
    setLogs(prev => [{ time: new Date().toLocaleTimeString(), type, msg, isCORS }, ...prev].slice(0, 50));
  };

  const filteredBoletos = useMemo(() => {
    let list = [...boletos];
    if (filter === 'sent') list = list.filter(b => b.status === 'sent');
    if (filter === 'pending') list = list.filter(b => b.status !== 'sent');
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(b => 
        b.customerName.toLowerCase().includes(term) || 
        (b.vendedor && b.vendedor.toLowerCase().includes(term))
      );
    }
    return list;
  }, [boletos, filter, searchTerm]);

  const handleSyncOmie = async () => {
    setIsSyncing(true);
    addLog('info', 'Sincronizando com Omie ERP...');
    try {
      const omieBoletos = await fetchOmieContasReceber(omieConfig);
      const existingIds = new Set(boletos.map(b => b.id));
      const newBoletos = omieBoletos.filter(b => !existingIds.has(b.id)).map(b => ({
        ...b,
        serviceId: config.accountId,
        userId: config.userId
      }));
      
      if (newBoletos.length > 0) {
        addLog('success', `${newBoletos.length} novas faturas carregadas.`);
        setBoletos(prev => [...newBoletos, ...prev]);
      } else {
        addLog('info', 'Financeiro Omie já está atualizado.');
      }
    } catch (err) {
      addLog('error', `${(err as Error).message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateBoleto = (id: string, fields: Partial<Boleto>) => {
    setBoletos(prev => prev.map(b => b.id === id ? { ...b, ...fields } : b));
  };

  const handleSendSingle = async (id: string) => {
    const boleto = boletos.find(b => b.id === id);
    if (!boleto) return;
    
    if (!boleto.phone || boleto.phone.length < 8) {
      addLog('error', `Telefone incompleto: ${boleto.customerName}`);
      return;
    }

    setBoletos(prev => prev.map(b => b.id === id ? { ...b, status: 'processing', error: undefined } : b));
    
    try {
      const pMessage = await personalizeMessage(boleto, config.messageTemplate);
      const result = await sendToDigiSac(boleto, config, pMessage);
      
      if (result.success) {
        addLog('success', `Enviado para: ${boleto.customerName}`);
      } else {
        addLog('error', `Falha no disparo: ${result.error}`);
      }

      setBoletos(prev => prev.map(b => b.id === id ? { 
        ...b, 
        status: result.success ? 'sent' : 'failed',
        error: result.error 
      } : b));
    } catch (err) {
      addLog('error', `Erro de rede ou permissão.`);
      setBoletos(prev => prev.map(b => b.id === id ? { ...b, status: 'failed', error: 'Erro de Conexão' } : b));
    }
  };

  const handleDelete = (id: string) => {
    setBoletos(prev => prev.filter(b => b.id !== id));
  };

  const handleClearAll = () => {
    if (confirm("⚠️ CONFIRMAÇÃO: Limpar toda a fila?")) {
      setBoletos([]);
      addLog('info', 'Fila limpa.');
    }
  };

  const handleSendAll = async () => {
    const pending = filteredBoletos.filter(b => (b.status === 'pending' || b.status === 'failed') && b.phone && b.phone.length >= 8);
    if (pending.length === 0) return;
    setIsSending(true);
    for (const boleto of pending) {
      await handleSendSingle(boleto.id);
    }
    setIsSending(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between group">
            <div className="flex items-center gap-5">
               <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 text-xl border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-all">🏢</div>
               <div>
                  <h3 className="font-black text-white text-xs uppercase tracking-widest">Importar</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Omie ERP</p>
               </div>
            </div>
            <button
              onClick={handleSyncOmie}
              disabled={isSyncing}
              className="px-6 py-3.5 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-500 transition-all disabled:opacity-50 text-[10px] uppercase tracking-widest"
            >
              {isSyncing ? 'Buscando...' : 'Sincronizar'}
            </button>
          </div>

          <div className="bg-slate-900 p-8 rounded-2xl border-2 border-dashed border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
            <div className="flex flex-col items-center justify-center py-6">
              <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">📄</span>
              <h3 className="font-black text-white text-xs uppercase tracking-widest">Leitura por IA</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-2 text-center px-4">Análise ultrarápida com Gemini Flash</p>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                addLog('info', 'Analisando boleto...');
                const reader = new FileReader();
                reader.onload = async (event) => {
                  const base64 = (event.target?.result as string).split(',')[1];
                  const result = await extractBoletoFromImage(base64, file.type);
                  if (result) {
                    addLog('success', `Sucesso: ${result.customerName} - R$ ${result.amount}`);
                    setBoletos(prev => [{...result, serviceId: config.accountId, userId: config.userId}, ...prev]);
                  } else {
                    addLog('error', 'IA falhou ao ler dados do boleto.');
                  }
                };
                reader.readAsDataURL(file);
            }} />
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl shadow-xl border border-slate-900 h-[300px] flex flex-col">
            <h4 className="text-[10px] font-black text-slate-600 uppercase mb-4 tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span> Monitor em Tempo Real
            </h4>
            <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2 custom-scrollbar pr-2">
              {logs.map((log, i) => (
                <div key={i} className={`p-2 rounded-lg ${log.type === 'error' ? 'bg-rose-500/5 text-rose-400' : log.type === 'success' ? 'bg-emerald-500/5 text-emerald-400' : 'bg-slate-900/50 text-slate-400'}`}>
                  <span className="opacity-30 font-bold">[{log.time}]</span> {log.msg}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden h-[750px]">
          <div className="p-8 bg-slate-800/30 border-b border-slate-800 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-black text-white uppercase text-sm tracking-tight">Fila de Disparo</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{filteredBoletos.length} Registros</p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleClearAll} className="px-5 py-3 border border-rose-500/30 text-rose-500 text-[9px] font-black rounded-xl hover:bg-rose-500 hover:text-white uppercase tracking-widest transition-all">Limpar</button>
                <button onClick={handleSendAll} disabled={isSending} className="px-6 py-3 bg-indigo-600 text-white text-[9px] font-black rounded-xl hover:bg-indigo-500 uppercase tracking-widest transition-all disabled:opacity-50">
                  {isSending ? 'Processando...' : 'Iniciar Disparos'}
                </button>
              </div>
            </div>
            
            <input 
              type="text"
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-5 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          
          <div className="overflow-y-auto flex-1 p-6 custom-scrollbar space-y-4">
              {filteredBoletos.map((boleto) => (
                <div key={boleto.id} className="p-6 rounded-2xl border bg-slate-950 border-slate-800 hover:border-slate-700 shadow-lg">
                   <div className="flex justify-between items-start mb-5">
                      <div className="flex-1 min-w-0 pr-4">
                        <h4 className="font-black text-slate-100 text-sm truncate uppercase tracking-tight">{boleto.customerName}</h4>
                        <div className="flex gap-2 mt-2">
                           <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-lg font-black uppercase tracking-tighter">{boleto.vendedor || 'Geral'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-black text-lg">R$ {(Number(boleto.amount) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Vencimento: {boleto.dueDate}</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="space-y-1">
                        <label className="text-[8px] text-slate-500 font-black uppercase">Canal</label>
                        <select 
                          value={boleto.serviceId || config.accountId}
                          onChange={(e) => updateBoleto(boleto.id, { serviceId: e.target.value })}
                          className="w-full px-3 py-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-300"
                        >
                          <option value="">Selecione...</option>
                          {config.availableServices?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] text-slate-500 font-black uppercase">Atendente</label>
                        <select 
                          value={boleto.userId || config.userId}
                          onChange={(e) => updateBoleto(boleto.id, { userId: e.target.value })}
                          className="w-full px-3 py-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-300"
                        >
                          <option value="">Automático</option>
                          {config.availableUsers?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] text-slate-500 font-black uppercase">Telefone</label>
                        <input 
                          type="tel"
                          value={boleto.phone}
                          onChange={(e) => updateBoleto(boleto.id, { phone: e.target.value.replace(/\D/g, '') })}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-indigo-400 outline-none"
                        />
                      </div>
                   </div>

                   <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                      <div className="flex items-center gap-3">
                         <div className={`w-2.5 h-2.5 rounded-full ${boleto.status === 'sent' ? 'bg-emerald-500' : boleto.status === 'failed' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                         <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{boleto.status}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleDelete(boleto.id)} className="p-3 text-slate-600 hover:text-rose-500 transition-colors bg-slate-900 rounded-xl">🗑️</button>
                        <button onClick={() => handleSendSingle(boleto.id)} disabled={boleto.status === 'sent'} className="px-5 py-3 bg-slate-800 text-white text-[9px] font-black rounded-xl hover:bg-slate-700 transition-all disabled:opacity-30 uppercase tracking-widest">Enviar</button>
                      </div>
                   </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoletoManager;
