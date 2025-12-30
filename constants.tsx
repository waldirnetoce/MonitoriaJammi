
import { ScorecardCriterion } from './types';

export const DEFAULT_SCORECARD: ScorecardCriterion[] = [
  // 1. Abertura (14 pts)
  { id: '1.1', category: '1. Abertura', name: '1.1 Script e Personalização', description: 'Iniciou em até 5s, seguiu script e personalizou.', weight: 3 },
  { id: '1.2', category: '1. Abertura', name: '1.2 Receptividade', description: 'Abertura positiva e perguntou como gostaria de ser chamado.', weight: 2 },
  { id: '1.3', category: '1. Abertura', name: '1.3 Proatividade', description: 'Perguntou como ajudar antes de pedir dados.', weight: 2 },
  { id: '1.4', category: '1. Abertura', name: '1.4 Segurança LGPD', description: 'Confirmação de dados conforme script de segurança.', weight: 3 },
  { id: '1.5', category: '1. Abertura', name: '1.5 Sondagem Sistêmica', description: 'Verificou histórico para evitar repetição.', weight: 4 },

  // 4. Diálogo (35 pts)
  { id: '4.1', category: '4. Diálogo', name: '4.1 Empatia e Cordialidade', description: 'Demonstrou interesse genuíno, paciência e equilíbrio emocional durante o contato.', weight: 7 },
  { id: '4.2', category: '4. Diálogo', name: '4.2 Personalização Contínua', description: 'Chamou o cliente pelo nome preferido durante o atendimento.', weight: 3 },
  { id: '4.3', category: '4. Diálogo', name: '4.3 Concentração', description: 'Atenção ao relato sem pedir repetição desnecessária.', weight: 4 },
  { id: '4.4', category: '4. Diálogo', name: '4.4 Norma Culta', description: 'Utilização correta da língua, sem gírias ou vícios de linguagem.', weight: 3 },
  
  // 5. Conhecimento (20 pts)
  { id: '5.1', category: '5. Conhecimento', name: '5.1 Conhecimento Técnico', description: 'Demonstrou domínio pleno dos procedimentos e ferramentas.', weight: 10 },
  { id: '5.2', category: '5. Conhecimento', name: '5.2 Resolutividade', description: 'Entregou a solução completa ou o próximo passo correto.', weight: 10 },

  // Bônus Automático (46 pts para fechar 100 ou ajustar conforme necessidade)
  { id: 'BONUS', category: 'Sistema', name: 'Bônus Operacional', description: 'Pontuação automática de performance.', weight: 46 }
];
