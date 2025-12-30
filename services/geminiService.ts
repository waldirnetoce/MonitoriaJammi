
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult, ScorecardCriterion, NcgItem, RigorLevel, VoiceProfile, PodcastVoiceStyle } from "../types";

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

export const analyzeUserVoice = async (audioBase64: string): Promise<VoiceProfile> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-native-audio-preview-09-2025",
    contents: {
      parts: [
        { inlineData: { data: audioBase64, mimeType: 'audio/wav' } },
        { text: "Analise a tonalidade, energia e cadência desta voz. Determine se a voz soa mais como um locutor masculino ou feminino. Selecione qual destes nomes de voz pré-definidos soaria mais parecido em um podcast: Puck (juvenil/enérgico/masculino), Charon (profundo/calmo/masculino), Kore (feminino/claro), Fenrir (masculino/robusto), Zephyr (neutro/profissional). Retorne APENAS o nome e uma breve descrição do tom em formato JSON." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          voiceName: { type: Type.STRING },
          tonalityDescription: { type: Type.STRING }
        },
        required: ["voiceName", "tonalityDescription"]
      }
    }
  });

  const res = JSON.parse(response.text || '{"voiceName":"Zephyr", "tonalityDescription": "Profissional Padrão"}');
  return res as VoiceProfile;
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
    `ID:[${c.id}] | NOME:${c.name} | REGRA:${c.description} | PESO:${c.weight}pts`
  ).join('\n');

  const ncgText = ncgItems.map(n => `- ${n.name}: ${n.description}`).join('\n');

  const systemInstruction = `
### MOTOR DE AUDITORIA JAMMIN v12.0
Você é uma auditora sênior. Sua missão é analisar interações de suporte com base no scorecard abaixo.

### REGRAS PARA JUSTIFICATIVA (Obrigatório):
Para CADA item do scorecard, você deve fornecer uma observação que cite:
1. A regra original do scorecard.
2. O comportamento observado (exatamente o que o agente disse ou fez).
3. A razão técnica para a pontuação.

Exemplo: "No item 4.1 (Empatia), o agente foi CONFORME pois demonstrou interesse genuíno ao dizer 'Sinto muito pelo ocorrido' após o relato do cliente."

SCORECARD:
${scorecardText}

NCGs (Anulam score se ocorrerem):
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

export const generateAudioPodcastFeedback = async (
  result: AnalysisResult, 
  agentName: string, 
  monitorName: string,
  voiceStyle: PodcastVoiceStyle = 'INSTITUTIONAL'
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Mapping styles to Gemini prebuilt voices and acting prompts
  const styleConfig: Record<PodcastVoiceStyle, { voice: string, acting: string }> = {
    HOMER: { 
      voice: 'Charon', 
      acting: 'Dê um tom cômico, levemente preguiçoso, rouco e bem-humorado, como um personagem clássico de desenho animado.' 
    },
    WOLVERINE: { 
      voice: 'Fenrir', 
      acting: 'Dê um tom ríspido, grave, heróico, direto e um pouco selvagem, como um herói de ação durão.' 
    },
    INSTITUTIONAL: { 
      voice: 'Zephyr', 
      acting: 'Dê um tom formal, executivo, profissional, equilibrado e corporativo.' 
    },
    YOUNG: { 
      voice: 'Puck', 
      acting: 'Dê um tom entusiasmado, rápido, moderno, dinâmico e jovem.' 
    }
  };

  const config = styleConfig[voiceStyle];

  const prompt = `Gere o texto de locução em áudio seguindo estas instruções rigorosas:
1. Você é o(a) monitor(a) ${monitorName}.
2. Use os artigos definidos corretos em português (o/a) de acordo com o gênero do nome ${monitorName}. Se for Francisca, diga 'aqui é A Francisca'.
3. Estilo de interpretação: ${config.acting}.
4. Script: 'Fala pessoal, aqui é ${monitorName}! Acabei de analisar o atendimento do agente ${agentName}. O score final foi de ${result.totalScore} pontos. O principal ponto de melhoria ou destaque é: ${result.operatorFeedback}. É isso aí, vamos focar nos detalhes para a próxima. Valeu!'`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: config.voice }
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("A API de TTS não retornou dados de áudio.");
  }
  return base64Audio;
};
