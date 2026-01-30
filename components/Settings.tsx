import React, { useState } from 'react';
import { DigiSacConfig, OmieConfig, DigiSacUser } from '../types';
import { fetchDigiSacServices, fetchDigiSacUsers, DigiSacServiceItem } from '../services/digisacService';

interface SettingsProps {
  config: DigiSacConfig;
  setConfig: React.Dispatch<React.SetStateAction<DigiSacConfig>>;
  omieConfig: OmieConfig;
  setOmieConfig: React.Dispatch<React.SetStateAction<OmieConfig>>;
}

const Settings: React.FC<SettingsProps> = ({ config, setConfig, omieConfig, setOmieConfig }) => {
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');

  const handleDigiSacChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleOmieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOmieConfig(prev => ({ ...prev, [name]: value }));
  };

  const syncDigiSacMetadata = async () => {
    if (!config.apiUrl || !config.apiToken) {
      setError("Informe URL e Token primeiro.");
      return;
    }
    setIsFetching(true);
    setError('');
    try {
      const services = await fetchDigiSacServices(config);
      const users = await fetchDigiSacUsers(config);
      
      setConfig(prev => ({ 
        ...prev, 
        availableServices: services, 
        availableUsers: users 
      }));
      
      if (users.length === 0) {
        setError("Atenção: A API não retornou usuários ativos.");
      } else {
        alert(`Sucesso! ${users.length} atendentes e ${services.length} canais carregados.`);
      }
    } catch (err: any) {
      setError(err.message || "Erro de conexão. Verifique os dados ou o Proxy.");
    } finally {
      setIsFetching(false);
    }
  };

  const exportBackup = () => {
    const backupData = { config, omieConfig };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `digisac_flow_backup_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`;
    a.click();
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.config) setConfig(data.config);
        if (data.omieConfig) setOmieConfig(data.omieConfig);
        alert("Configurações restauradas!");
      } catch (err) {
        alert("Arquivo de backup inválido.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl space-y-10 pb-32 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg shadow-emerald-600/30">💾</div>
          <div>
            <h4 className="font-black text-white uppercase text-sm tracking-tight">Backup e Portabilidade</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Exporte seus dados para não perdê-los ao trocar de computador.</p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
           <button onClick={exportBackup} className="flex-1 md:flex-none px-6 py-4 bg-slate-800 text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700">Baixar Backup</button>
           <label className="flex-1 md:flex-none px-6 py-4 bg-emerald-600/10 text-emerald-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600/20 transition-all border border-emerald-500/20 cursor-pointer text-center">
              Restaurar
              <input type="file" className="hidden" accept=".json" onChange={importBackup} />
           </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-8">
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-black text-white uppercase tracking-tighter">DigiSac API</h3>
              <button onClick={syncDigiSacMetadata} disabled={isFetching} className="text-[9px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest disabled:opacity-30">
                {isFetching ? '⏳ Sincronizando...' : '🔄 Sincronizar Canais'}
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-2 block">Domínio DigiSac</label>
                <input type="text" name="apiUrl" value={config.apiUrl} onChange={handleDigiSacChange} placeholder="ex: empresa.digisac.app" className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-2 block">Token de API</label>
                <input type="password" name="apiToken" value={config.apiToken} onChange={handleDigiSacChange} className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 outline-none focus:border-indigo-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-2 block">Canal Padrão</label>
                  <select name="accountId" value={config.accountId} onChange={handleDigiSacChange} className="w-full px-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] font-bold text-slate-300 outline-none">
                    <option value="">Selecione...</option>
                    {config.availableServices?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-2 block">Atendente Padrão</label>
                  <select name="userId" value={config.userId} onChange={handleDigiSacChange} className="w-full px-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] font-bold text-slate-300 outline-none">
                    <option value="">Automático (Fila)</option>
                    {config.availableUsers?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              {error && <p className="text-[9px] text-rose-500 font-bold uppercase bg-rose-500/10 p-4 rounded-xl text-center leading-relaxed">{error}</p>}
            </div>
          </div>
          
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl">
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Template da Mensagem</h3>
            <textarea name="messageTemplate" value={config.messageTemplate} onChange={handleDigiSacChange} className="w-full h-48 px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-medium text-slate-300 outline-none resize-none focus:border-indigo-500" />
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl">
            <h3 className="text-sm font-black text-blue-400 uppercase tracking-tighter mb-8">Omie ERP</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-2 block">App Key</label>
                <input type="text" name="appKey" value={omieConfig.appKey} onChange={handleOmieChange} className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-2 block">App Secret</label>
                <input type="password" name="appSecret" value={omieConfig.appSecret} onChange={handleOmieChange} className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>

          <div className={`p-8 rounded-3xl border-2 transition-all flex items-center justify-between shadow-xl ${config.testMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-slate-950 border-slate-800'}`}>
            <div>
              <p className="font-black text-white text-xs uppercase tracking-tight">Modo Simulação</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Nenhum dado real será enviado</p>
            </div>
            <button 
              onClick={() => {
                const ns = !config.testMode;
                setConfig(prev => ({ ...prev, testMode: ns }));
                setOmieConfig(prev => ({ ...prev, testMode: ns }));
              }}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors outline-none ${config.testMode ? 'bg-amber-500' : 'bg-slate-700'}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${config.testMode ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;