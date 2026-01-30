
import { GoogleGenAI, Type } from "@google/genai";
import { Boleto } from "../types";

const createAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractBoletoFromImage = async (base64Image: string, mimeType: string): Promise<Boleto | null> => {
  const ai = createAI();
  // Prompt otimizado para extrair o valor como número decimal sem símbolos
  const prompt = "Analise este boleto bancário. Extraia: Nome do pagador, Valor total (apenas números, use ponto para decimais, ex: 1550.50), Data de vencimento (DD/MM/YYYY) e o Código de barras. Retorne estritamente em JSON.";
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview', // Modelo 4x mais rápido que o Pro
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          customerName: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          dueDate: { type: Type.STRING },
          barcode: { type: Type.STRING },
        },
        required: ['customerName', 'amount', 'dueDate'],
      },
    },
  });

  try {
    const text = response.text;
    if (!text) return null;
    const data = JSON.parse(text);
    
    return {
      id: `img-${Date.now()}`,
      customerName: data.customerName,
      phone: '', 
      amount: Number(data.amount) || 0,
      dueDate: data.dueDate,
      boletoUrl: '', 
      barcode: data.barcode,
      status: 'pending'
    };
  } catch (error) {
    console.error("Erro Extração Gemini:", error);
    return null;
  }
};

export const personalizeMessage = async (boleto: Boleto, template: string): Promise<string> => {
  const ai = createAI();
  const prompt = `
    Crie uma mensagem profissional para o cliente ${boleto.customerName}.
    Dados: Valor R$ ${boleto.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, Vencimento ${boleto.dueDate}.
    Template base: "${template}"
    Retorne apenas o texto final da mensagem.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt
  });

  return response.text || template;
};
