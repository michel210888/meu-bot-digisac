
import { DigiSacConfig, Boleto, DigiSacUser } from "../types";

const getCleanBaseUrl = (url: string) => {
  if (!url) return '';
  let cleaned = url.trim();
  cleaned = cleaned.replace(/\/v1\/.*$/, '').replace(/\/v1$/, '').replace(/\/+$/, '');
  if (!cleaned.startsWith('http')) {
    cleaned = 'https://' + cleaned;
  }
  return cleaned;
};

const buildProxyUrl = (config: DigiSacConfig, endpoint: string) => {
  const target = getCleanBaseUrl(config.apiUrl);
  if (!target) return { url: '', headers: {} };
  const url = `${window.location.origin}/proxy/digisac${endpoint}`;
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${config.apiToken.trim()}`,
    'Accept': 'application/json',
    'x-target-url': target,
    'X-Requested-With': 'XMLHttpRequest'
  };
  return { url, headers };
};

export const fetchDigiSacServices = async (config: DigiSacConfig): Promise<any[]> => {
  try {
    const { url, headers } = buildProxyUrl(config, `/v1/services?limit=100`);
    const response = await fetch(url, { headers });
    const data = await response.json();
    return data.data || data.services || (Array.isArray(data) ? data : []);
  } catch (error) {
    return [];
  }
};

export const fetchDigiSacUsers = async (config: DigiSacConfig): Promise<DigiSacUser[]> => {
  let allUsers: DigiSacUser[] = [];
  let page = 1;
  let hasMore = true;

  try {
    // Loop para percorrer as páginas da API do DigiSac (limite de 100 por página)
    while (hasMore && page <= 10) { 
      const { url, headers } = buildProxyUrl(config, `/v1/users?limit=100&page=${page}`);
      const response = await fetch(url, { headers });
      
      if (!response.ok) break;
      
      const data = await response.json();
      const list = data.data || data.users || [];
      
      if (list.length === 0) {
        hasMore = false;
      } else {
        const mapped = list
          .filter((u: any) => u.active !== false)
          .map((u: any) => ({ id: u.id, name: u.name || u.username }));
        
        allUsers = [...allUsers, ...mapped];
        
        // Se a quantidade retornada for menor que o limite, não há mais páginas
        if (list.length < 100) hasMore = false;
        else page++;
      }
    }
    // Remove duplicados e ordena por nome
    return allUsers
      .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Erro DigiSac Users:", error);
    return [];
  }
};

export const sendToDigiSac = async (
  boleto: Boleto, 
  config: DigiSacConfig, 
  personalizedMessage: string
): Promise<{ success: boolean; error?: string }> => {
  if (config.testMode) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  }

  const { url, headers } = buildProxyUrl(config, '/v1/messages');
  let sanitizedPhone = boleto.phone.replace(/\D/g, '');
  if (sanitizedPhone.length > 0 && !sanitizedPhone.startsWith('55')) sanitizedPhone = '55' + sanitizedPhone;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
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
    return { success: false, error: "Falha de conexão." };
  }
};
