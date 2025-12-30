
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult, ScorecardCriterion, NcgItem, RigorLevel } from "../types";

export const askAiQuestion = async (question: string, scorecard: ScorecardCriterion[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const scorecardText = scorecard.map(c => `- ${c.name}: ${c.description} (${c.weight}pts)`).join('\n');

  const systemInstruction = `Você é Neo, o consultor sênior de qualidade da operação Neo & Jammin QA.
Seu objetivo é auxiliar analistas e monitores em dúvidas sobre procedimentos, regras do Scorecard v1.1.2025 e melhores práticas de atendimento.
Contexto do Scorecard atual:
${scorecardText}

Responda de forma executiva, profissional e encorajadora. Se a dúvida for sobre uma nota específica, explique a lógica por trás da Ficha de Monitoria (Receptivo) v1.1.2025.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: question }] }],
    config: {
      systemInstruction,
      temperature: 0.7,
    }
  });

  return response.text || "Desculpe, Neo e Jammin estão ocupados no estúdio no momento. Tente novamente em breve.";
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
### 🚨 MOTOR DE AUDITORIA v11.5 - OPERAÇÃO NEO & JAMMIN 🚨
Você é um auditor sênior. Sua análise DEVE seguir rigorosamente os pesos e critérios da Ficha fornecida abaixo.

### MONITOR RESPONSÁVEL:
Nome: ${monitorName}

### CRITÉRIOS DE AVALIAÇÃO (SCORECARD):
${scorecardText}

### REGRAS DE TOLERÂNCIA ZERO (NCGs):
${ncgText}

### REGRAS PARA O RESULTADO:
1. "totalScore": Calcule a soma baseada nos pontos ganhos de cada item. Se um NCG for detectado, o score é obrigatoriamente 0.
2. "criteriaScores": Para cada item que não atingiu a pontuação máxima, escreva uma justificativa técnica clara no campo "observation", citando o que o agente deixou de cumprir conforme a regra da Ficha v1.1.2025.
3. Responda apenas com JSON.`;

  const parts: any[] = [
    { text: `TRANSCRIPÇÃO PARA ANÁLISE:\n${transcript || "Analise pelo áudio fornecido."}\nOPERAÇÃO: ${company}\nAGENTE: ${metadata.agentName}\nRIGOR APLICADO: ${rigor}` }
  ];

  if (audioData) {
    parts.push({ inlineData: { data: audioData.data, mimeType: audioData.mimeType } });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
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
  
  const prompt = `Gere um diálogo profissional em português para o podcast "Deep Dive: Neo & Jammin".
  Personagens: Neo (Voz Masculina), Jammin (Voz Feminina).
  
  Neo (Voice Kore): Fala galera! Neo aqui começando mais um episódio do Deep Dive Podcast junto com a minha parceira Jammin. Hoje vamos dissecar a monitoria que o monitor ${monitorName} preparou para o atendimento do agente ${agentName}. Jammin, o monitor ${monitorName} deu uma nota de ${result.totalScore} pontos. O que você achou dos pontos de atenção?
  Jammin (Voice Puck): Oi Neo! Prazer falar desse caso com você. Olha, analisando o que o ${monitorName} pontuou, fica muito claro que o ${agentName} precisa focar no seguinte ponto: "${result.operatorFeedback}". 
  Neo: Perfeito, Jammin. É uma análise técnica muito bem feita pelo ${monitorName}. O ${agentName} tem agora um PDI claro para seguir e melhorar essa performance.
  Jammin: Com certeza, Neo. O monitor ${monitorName} deu o caminho. Agora é aplicar as melhorias e buscar o 100 na próxima! Valeu pessoal!
  Neo: Valeu Jammin, valeu galera! Até a próxima!`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: 'Neo',
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            },
            {
              speaker: 'Jammin',
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
            }
          ]
        }
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Falha no estúdio Neo & Jammin.");
  return base64Audio;
};
