
import { OmieConfig, Boleto } from "../types";

const callOmie = async (endpoint: string, call: string, config: OmieConfig, param: any) => {
  const body = {
    call,
    app_key: config.appKey,
    app_secret: config.appSecret,
    param: [param]
  };

  const url = `${window.location.origin}/proxy/omie${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.faultstring || `Erro Omie: ${response.status}`);
    }
    
    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || "Falha ao conectar com Omie ERP.");
  }
};

export const fetchOmieContasReceber = async (config: OmieConfig): Promise<Boleto[]> => {
  if (config.testMode) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
      {
        id: `omie-test-1`,
        customerName: "CLIENTE TESTE SA",
        phone: "5511999998888",
        amount: 150.00,
        dueDate: "10/02/2026",
        boletoUrl: "",
        barcode: "00190500954014481606906809350314337370000000100",
        status: 'pending',
        category: "Vendas",
        vendedor: "VENDEDOR TESTE"
      }
    ];
  }

  if (!config.appKey || !config.appSecret) throw new Error("Configure as chaves da Omie.");

  const contasData = await callOmie("/financas/contareceber/", "ListarContasReceber", config, {
    pagina: 1,
    registros_por_pagina: 100,
    apenas_importado_api: "N",
    filtrar_por_status: "EMABERTO",
    ordenar_por: "DATA_VENCIMENTO"
  });

  const cadastros = contasData.conta_receber_cadastro || [];
  const boletosParaProcessar: Boleto[] = [];

  for (const item of cadastros) {
    const hasBoleto = item.boletos && item.boletos.length > 0;
    
    try {
      const clienteData = await callOmie("/geral/clientes/", "ConsultarCliente", config, {
        codigo_cliente_omie: item.codigo_cliente_fornecedor
      });

      const ddd = String(clienteData.telefone1_ddd || clienteData.celular_ddd || "").replace(/\D/g, '');
      const num = String(clienteData.telefone1_numero || clienteData.celular_numero || "").replace(/\D/g, '');
      let phone = (ddd && num) ? `55${ddd}${num}` : "";

      boletosParaProcessar.push({
        id: `omie-${item.codigo_lancamento}`,
        customerName: item.nome_cliente || clienteData.nome_fantasia || "Cliente",
        phone: phone,
        amount: Number(item.valor_liquido) || 0,
        dueDate: item.data_vencimento,
        boletoUrl: hasBoleto ? item.boletos[0].cLinkBoleto : "",
        barcode: hasBoleto ? item.boletos[0].cCodBarra : "",
        status: 'pending',
        category: item.descricao_categoria || "",
        vendedor: item.vendedor_nome || ""
      });
    } catch (e) {
      console.warn(`Erro cliente ${item.codigo_lancamento}`, e);
    }
  }

  return boletosParaProcessar;
};
