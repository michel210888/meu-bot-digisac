
import { GoogleGenAI, Type } from "@google/genai";
import { Boleto } from "../types";

// Always use the process.env.API_KEY directly for initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractBoletoFromImage = async (base64Image: string, mimeType: string): Promise<Boleto | null> => {
  const prompt = "Analise este boleto bancário e extraia: Nome do pagador/cliente, Valor total, Data de vencimento e o Código de barras (linha digitável). Retorne estritamente em JSON.";
  
  // Structured contents with parts for image and text input
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
    // response.text is a property, not a method
    const data = JSON.parse(response.text || '{}');
    if (!data.customerName) return null;
    
    return {
      id: `img-${Date.now()}`,
      customerName: data.customerName,
      phone: '', // Usuário preenche depois
      amount: data.amount,
      dueDate: data.dueDate,
      boletoUrl: '', // Imagem local não tem URL
      barcode: data.barcode,
      status: 'pending'
    };
  } catch (error) {
    console.error("Erro Vision Gemini:", error);
    return null;
  }
};

export const personalizeMessage = async (boleto: Boleto, template: string): Promise<string> => {
  const prompt = `
    Crie uma mensagem curta e profissional para enviar via WhatsApp para o cliente ${boleto.customerName}.
    Dados:
    - Valor: R$ ${boleto.amount}
    - Vencimento: ${boleto.dueDate}
    - Link: ${boleto.boletoUrl || 'Anexo'}
    - Linha Digitável: ${boleto.barcode || 'Não informada'}
    
    Use o template como guia: "${template}"
    Substitua {nome}, {valor}, {data}, {link}, {barcode} se existirem no template.
    Facilite o "copia e cola" do código de barras colocando-o em uma linha separada.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: "Você é um assistente de faturamento educado e direto. Use Português do Brasil.",
    }
  });

  return response.text || template;
};
