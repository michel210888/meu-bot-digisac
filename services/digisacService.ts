
import { DigiSacConfig, Boleto, DigiSacUser } from "../types";

export interface DigiSacServiceItem {
  id: string;
  name: string;
  type: string;
}

// Limpa a URL para garantir que o proxy receba apenas o domínio base com protocolo
const getCleanBaseUrl = (url: string) => {
  if (!url) return '';
  let cleaned = url.trim();
  // Remove caminhos comuns caso o usuário tenha colado a URL completa
  cleaned = cleaned.replace(/\/v1\/.*$/, '').replace(/\/v1$/, '').replace(/\/+$/, '');
  // Garante o protocolo https
  if (!cleaned.startsWith('http')) {
    cleaned = 'https://' + cleaned;
  }
  return cleaned;
};

const buildProxyUrl = (config: DigiSacConfig, endpoint: string) => {
  const target = getCleanBaseUrl(config.apiUrl);
  if (!target) return { url: '', headers: {} };

  // Sempre usamos o proxy do nosso próprio servidor para evitar CORS e 404
  const url = `${window.location.origin}/proxy/digisac${endpoint}`;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${config.apiToken.trim()}`,
    'Accept': 'application/json',
    'x-target-url': target, // Informa ao nosso servidor para onde enviar a requisição
    'X-Requested-With': 'XMLHttpRequest'
  };

  return { url, headers };
};

export const fetchDigiSacServices = async (config: DigiSacConfig): Promise<DigiSacServiceItem[]> => {
  let allServices: DigiSacServiceItem[] = [];
  let page = 1;
  const limit = 50;
  let hasMore = true;

  try {
    while (hasMore) {
      const { url, headers } = buildProxyUrl(config, `/v1/services?limit=${limit}&page=${page}`);
      if (!url) break;

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.message || `Erro ${response.status} ao buscar canais.`);
      }
      
      const data = await response.json();
      const rawList = data.data || data.services || (Array.isArray(data) ? data : []);
      
      if (rawList.length === 0) {
        hasMore = false;
      } else {
        allServices = [...allServices, ...rawList];
        if (rawList.length < limit) hasMore = false;
        page++;
      }
      if (page > 10) break; 
    }
    return allServices;
  } catch (error) {
    console.error("Erro DigiSac Services:", error);
    throw error;
  }
};

export const fetchDigiSacUsers = async (config: DigiSacConfig): Promise<DigiSacUser[]> => {
  let allUsersRaw: any[] = [];
  let page = 1;
  const limit = 100; 
  let hasMore = true;

  try {
    while (hasMore) {
      const { url, headers } = buildProxyUrl(config, `/v1/users?limit=${limit}&page=${page}`);
      if (!url) break;

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.message || `Erro ${response.status} na API de Usuários.`);
      }
      
      const data = await response.json();
      const rawList = data.data || data.users || (Array.isArray(data) ? data : []);
      
      if (rawList.length === 0) {
        hasMore = false;
      } else {
        allUsersRaw = [...allUsersRaw, ...rawList];
        if (rawList.length < limit) {
          hasMore = false;
        } else {
          page++;
        }
      }
      if (page > 30) break; 
    }

    // Filtragem para garantir que encontramos a Alessandra e outros ativos
    return allUsersRaw
      .filter((u: any) => u.active !== false)
      .map((u: any) => ({ 
        id: u.id, 
        name: u.name || u.username || 'Sem Nome' 
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Erro DigiSac Users:", error);
    throw error;
  }
};

export const sendToDigiSac = async (
  boleto: Boleto, 
  config: DigiSacConfig, 
  personalizedMessage: string
): Promise<{ success: boolean; error?: string }> => {
  if (config.testMode) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true };
  }

  const { url, headers } = buildProxyUrl(config, '/v1/messages');
  if (!url) return { success: false, error: "Configuração incompleta." };

  let sanitizedPhone = boleto.phone.replace(/\D/g, '');
  if (sanitizedPhone.length > 0 && !sanitizedPhone.startsWith('55')) sanitizedPhone = '55' + sanitizedPhone;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: sanitizedPhone,
        serviceId: (boleto.serviceId || config.accountId || '').trim(),
        userId: (boleto.userId || config.userId || '').trim(),
        text: personalizedMessage,
        dontOpenTicket: true
      })
    });

    if (response.ok) return { success: true };
    const errorData = await response.json().catch(() => ({}));
    return { success: false, error: errorData.message || `Erro ${response.status}` };
  } catch (err) {
    return { success: false, error: "Falha na conexão segura com o servidor." };
  }
};
