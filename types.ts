
export interface DigiSacUser {
  id: string;
  name: string;
}

export interface Boleto {
  id: string;
  customerName: string;
  phone: string;
  amount: number;
  dueDate: string;
  boletoUrl: string;
  barcode?: string;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  error?: string;
  vendedor?: string;
  category?: string;
  serviceId?: string; // ID do canal DigiSac
  userId?: string;    // ID do usuário DigiSac que enviará
}

export interface DigiSacServiceItem {
  id: string;
  name: string;
  type: string;
}

export interface OmieConfig {
  appKey: string;
  appSecret: string;
  lastSync?: string;
  testMode?: boolean;
  corsProxy?: string;
}

export interface DigiSacConfig {
  apiUrl: string;
  apiToken: string;
  accountId: string; // Canal padrão
  userId?: string;    // Usuário padrão
  messageTemplate: string;
  testMode?: boolean;
  corsProxy?: string;
  availableServices?: DigiSacServiceItem[];
  availableUsers?: DigiSacUser[];
}

export interface DashboardStats {
  totalAmount: number;
  sentCount: number;
  pendingCount: number;
  failedCount: number;
}
