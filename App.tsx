
import React, { useState, useEffect, useRef } from 'react';
import { Boleto, DigiSacConfig, OmieConfig } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import BoletoManager from './components/boletomanager';
import Settings from './components/Settings';

const DEFAULT_CONFIG: DigiSacConfig = {
  apiUrl: '',
  apiToken: '',
  accountId: '',
  messageTemplate: 'Olá {nome}, seu boleto de R$ {valor} vence em {data}. Segue o link para pagamento: {link}\n\nCód. Barras: {barcode}',
  corsProxy: 'https://cors-anywhere.herokuapp.com/'
};

const DEFAULT_OMIE: OmieConfig = {
  appKey: '',
  appSecret: '',
  corsProxy: 'https://cors-anywhere.herokuapp.com/'
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [config, setConfig] = useState<DigiSacConfig>(DEFAULT_CONFIG);
  const [omieConfig, setOmieConfig] = useState<OmieConfig>(DEFAULT_OMIE);
  const [isLoaded, setIsLoaded] = useState(false);
  const initialLoadDone = useRef(false);

  // Carregamento Inicial
  useEffect(() => {
    if (initialLoadDone.current) return;

    const savedConfig = localStorage.getItem('digisac_config');
    const savedOmie = localStorage.getItem('omie_config');
    const savedBoletos = localStorage.getItem('digisac_boletos');

    if (savedConfig) {
      try { setConfig(JSON.parse(savedConfig)); } catch (e) { }
    }
    if (savedOmie) {
      try { setOmieConfig(JSON.parse(savedOmie)); } catch (e) { }
    }
    if (savedBoletos) {
      try { 
        const parsed = JSON.parse(savedBoletos);
        if (Array.isArray(parsed)) setBoletos(parsed);
      } catch (e) { }
    }
    
    initialLoadDone.current = true;
    setIsLoaded(true);
  }, []);

  // Salvamento Automático Geral
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('digisac_config', JSON.stringify(config));
    }
  }, [config, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('omie_config', JSON.stringify(omieConfig));
    }
  }, [omieConfig, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('digisac_boletos', JSON.stringify(boletos));
    }
  }, [boletos, isLoaded]);

  if (!isLoaded) {
    return (
      <div className="bg-slate-950 h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-indigo-400 font-black text-xs uppercase tracking-widest animate-pulse">Iniciando Sistema...</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard boletos={boletos} />;
      case 'send':
        return (
          <BoletoManager 
            config={config} 
            omieConfig={omieConfig}
            boletos={boletos} 
            setBoletos={setBoletos} 
          />
        );
      case 'settings':
        return (
          <Settings 
            config={config} 
            setConfig={setConfig} 
            omieConfig={omieConfig}
            setOmieConfig={setOmieConfig}
          />
        );
      default:
        return <Dashboard boletos={boletos} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
