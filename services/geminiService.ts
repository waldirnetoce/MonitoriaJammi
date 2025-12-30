
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult, ScorecardCriterion, NcgItem, RigorLevel } from "../types";

export const askAiQuestion = async (question: string, scorecard: ScorecardCriterion[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const scorecardText = scorecard.map(c => `- ${c.name}: ${c.description} (${c.weight}pts)`).join('\n');

  const systemInstruction = `Você é Jammin, a consultora sênior de qualidade da operação Jammin QA.
Seu objetivo é auxiliar analistas e monitores em dúvidas sobre procedimentos, regras do Scorecard v1.1.2025 e melhores práticas de atendimento.
Contexto do Scorecard atual:
${scorecardText}

Responda de forma executiva, profissional e encorajadora.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: question }] }],
    config: {
      systemInstruction,
      temperature: 0.7,
    }
  });

  return response.text || "Jammin está indisponível no momento.";
};

export const analyzeInteraction = async (
  transcript: string,
  monitorName: string,
  company: string,
  scorecard: ScorecardCriterion[],
  ncgItems: NcgItem[],
  metadata: { monitorId: string; agentName: string; auditDate: string },
  rigor: RigorLevel = 'MEDIUM',
  audioData?: { data: string; mimeType: string }
): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const scorecardText = scorecard.map(c => 
    `ID:[${c.id}] | CATEGORIA:${c.category} | NOME:${c.name} | PESO:${c.weight}pts | REGRA:${c.description}`
  ).join('\n');

  const ncgText = ncgItems.map(n => `- ${n.name}: ${n.description}`).join('\n');

  const systemInstruction = `
### 🚨 MOTOR DE AUDITORIA JAMMIN v11.5 🚨
Você é uma auditora sênior imparcial. Sua missão é analisar interações de suporte e aplicar a Ficha de Monitoria v1.1.2025.

### REGRAS DE OURO:
1. "criteriaScores": Você DEVE avaliar individualmente CADA ID do SCORECARD.
2. "observation": Para CADA item, escreva uma justificativa técnica (Ex: "O agente demonstrou empatia ao validar o sentimento do cliente no minuto X" ou "Não houve saudação conforme script").
3. Se um NCG (Tolerância Zero) ocorrer, o "totalScore" deve ser 0 obrigatoriamente.

SCORECARD:
${scorecardText}

NCGs:
${ncgText}

Responda EXCLUSIVAMENTE em JSON.`;

  const parts: any[] = [
    { text: `ANÁLISE PARA: ${metadata.agentName}\nOPERAÇÃO: ${company}\nTRANSCRIPÇÃO:\n${transcript}` }
  ];

  if (audioData) {
    parts.push({ inlineData: { data: audioData.data, mimeType: audioData.mimeType } });
  }

  const response = await ai.models.generateContent({
    model: rigor === 'EXPERT' ? "gemini-3-pro-preview" : "gemini-3-flash-preview",
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          evaluationStatus: { type: Type.STRING },
          totalScore: { type: Type.NUMBER },
          reasonForCall: { type: Type.STRING },
          isNcgDetected: { type: Type.BOOLEAN },
          criteriaScores: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                criterionId: { type: Type.STRING },
                status: { type: Type.STRING },
                pointsEarned: { type: Type.NUMBER },
                observation: { type: Type.STRING }
              }
            }
          },
          summary: { type: Type.STRING },
          systemReadyText: { type: Type.STRING },
          operatorFeedback: { type: Type.STRING }
        },
        required: ["evaluationStatus", "totalScore", "reasonForCall", "criteriaScores", "summary", "systemReadyText", "operatorFeedback", "isNcgDetected"]
      },
      temperature: 0.1,
    }
  });

  return {
    ...JSON.parse(response.text || "{}"),
    monitorId: metadata.monitorId,
    auditDate: metadata.auditDate,
    rigorApplied: rigor
  };
};

export const generateAudioPodcastFeedback = async (result: AnalysisResult, agentName: string, monitorName: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Jammin (Voice Puck): Fala galera! Jammin aqui. Vamos analisar o atendimento do(a) ${agentName} auditado por ${monitorName}. Nota final: ${result.totalScore}. Destaque: ${result.operatorFeedback}.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};
