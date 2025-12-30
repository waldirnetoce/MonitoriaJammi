
import { ScorecardCriterion } from './types';

export const DEFAULT_SCORECARD: ScorecardCriterion[] = [
  // 1. Abertura (14 pts)
  { id: '1.1', category: '1. Abertura', name: '1.1 Script e Personalização', description: 'Iniciou em até 5s, seguiu script e personalizou.', weight: 3 },
  { id: '1.2', category: '1. Abertura', name: '1.2 Receptividade', description: 'Abertura positiva e perguntou como gostaria de ser chamado.', weight: 2 },
  { id: '1.3', category: '1. Abertura', name: '1.3 Proatividade', description: 'Perguntou como ajudar antes de pedir dados.', weight: 2 },
  { id: '1.4', category: '1. Abertura', name: '1.4 Segurança LGPD', description: 'Confirmação de dados conforme script de segurança.', weight: 3 },
  { id: '1.5', category: '1. Abertura', name: '1.5 Sondagem Sistêmica', description: 'Verificou histórico para evitar repetição.', weight: 4 },

  // 2. Atualização Cadastral (14 pts)
  { id: '2.1', category: '2. Atualização Cadastral', name: '2.1 Titularidade', description: 'Confirmou nome do titular/abriu SS se necessário.', weight: 3 },
  { id: '2.2', category: '2. Atualização Cadastral', name: '2.2 Endereço UC', description: 'Confirmou endereço/abriu SS se necessário.', weight: 3 },
  { id: '2.3', category: '2. Atualização Cadastral', name: '2.3 Inclusão de RG', weight: 3, description: 'Atualizou RG quando necessário.' },
  { id: '2.4', category: '2. Atualização Cadastral', name: '2.4 Data de Nascimento', weight: 5, description: 'Atualizou data de nascimento no cadastro.' },

  // 4. Diálogo (35 pts)
  { id: '4.1', category: '4. Diálogo', name: '4.1 Empatia e Cordialidade', description: 'Interesse, paciência e equilíbrio emocional.', weight: 7 },
  { id: '4.2', category: '4. Diálogo', name: '4.2 Personalização Contínua', description: 'Chamou pelo nome preferido durante o atendimento.', weight: 3 },
  { id: '4.3', category: '4. Diálogo', name: '4.3 Concentração', description: 'Atenção ao relato sem pedir repetição.', weight: 4 },
  { id: '4.4', category: '4. Diálogo', name: '4.4 Norma Culta e Registro', description: 'Escrita/fala sem gírias e registro completo.', weight: 3 },
  { id: '4.5', category: '4. Diálogo', name: '4.5 Gestão de Espera', description: 'Som ambiente ou mudo correto (retorno < 1min).', weight: 5 },
  { id: '4.6', category: '4. Diálogo', name: '4.6 Ritmo de Fala', description: 'Sem pressa ou interrupções.', weight: 3 },
  { id: '4.7', category: '4. Diálogo', name: '4.7 Protocolo', description: 'Informou protocolo pausadamente (mesmo se recusado).', weight: 3 },
  { id: '4.8', category: '4. Diálogo', name: '4.8 Script Ocorrência Técnica', description: 'Seguiu script para evitar DSES.', weight: 7 },

  // 5. Conhecimento (20 pts)
  { id: '5.1', category: '5. Conhecimento', name: '5.1 Conhecimento Técnico', description: 'Demonstrou domínio dos procedimentos.', weight: 5 },
  { id: '5.2', category: '5. Conhecimento', name: '5.2 Resolutividade', description: 'Atendimento completo e esclarecedor.', weight: 5 },
  { id: '5.3', category: '5. Conhecimento', name: '5.3 Tipologia Correta', description: 'Registrou a demanda na categoria correta.', weight: 3 },
  { id: '5.5', category: '5. Conhecimento', name: '5.5 Argumentação de Reclamação', description: 'Argumentou para evitar abertura de reclamação.', weight: 4 },
  { id: '5.6', category: '5. Conhecimento', name: '5.6 Resolução 1000', description: 'Deixou claro se era informação ou reclamação.', weight: 3 },

  // 6. Finalização (8 pts)
  { id: '6.1', category: '6. Finalização', name: '6.1 Canais Digitais', description: 'Orientou sobre canais digitais.', weight: 3 },
  { id: '6.2', category: '6. Finalização', name: '6.2 Ajuda Adicional', description: 'Perguntou se podia ajudar com algo mais.', weight: 2 },
  { id: '6.3', category: '6. Finalização', name: '6.3 Script Positivo', description: 'Encerramento prazeroso e educado.', weight: 2 },
  { id: '6.4', category: '6. Finalização', name: '6.4 Pesquisa de Satisfação', description: 'Direcionou para a pesquisa.', weight: 1 },

  // Bônus Automático (9 pts)
  { id: 'BONUS', category: 'Sistema', name: 'Bônus Operacional Automático', description: 'Pontuação atribuída automaticamente a todas as monitorias.', weight: 9 }
];
