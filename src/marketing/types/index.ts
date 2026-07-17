export interface BaseMarketingEntity {
  id: string;
  ownerId: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Planejamento extends BaseMarketingEntity {
  nome: string;
  mes: string;
  ano: number | string;
  objetivoPrincipal: string;
  metaFaturamento: number;
  metaReunioes: number;
  metaPropostas: number;
  metaClientes: number;
  responsavel: string;
  status: 'Planejado' | 'Em Andamento' | 'Concluído' | 'Cancelado';
  observacoes: string;
}

export interface Nicho extends BaseMarketingEntity {
  nome: string;
  quantidadeEmpresas: number;
  problemasEncontrados: string;
  solucoesPossiveis: string;
  sistemaIdeal: string;
  status: 'Ativo' | 'Em Pesquisa' | 'Descartado';
  prioridade: 'Alta' | 'Média' | 'Baixa';
  observacoes: string;
}

export interface Estrategia extends BaseMarketingEntity {
  nome: string;
  objetivo: string;
  tipo: 'WhatsApp' | 'Google Maps' | 'Instagram' | 'Facebook' | 'Google Ads' | 'Meta Ads' | 'YouTube' | 'TikTok' | 'Indicação' | 'Networking' | 'Email' | 'Cold Call' | 'Eventos' | string;
  investimento: number;
  frequencia: string;
  dataInicial: string;
  dataFinal: string;
  responsavel: string;
  status: 'Ativo' | 'Pausado' | 'Planejado' | 'Concluído';
  resultadoEsperado: string;
}

export interface Conteudo extends BaseMarketingEntity {
  titulo: string;
  tipo: 'Reels' | 'Vídeo' | 'Carrossel' | 'Story' | 'Post' | 'Artigo' | 'Short' | string;
  objetivo: string;
  data: string;
  status: 'Publicado' | 'Agendado' | 'Rascunho' | string;
  canal: 'Instagram' | 'TikTok' | 'Facebook' | 'YouTube' | 'LinkedIn' | 'Threads' | 'Site' | string;
  hashtags: string;
  cta: string;
  roteiro: string;
  linkArte: string;
  linkVideo: string;
}

export interface Prospeccao extends BaseMarketingEntity {
  nome: string;
  segmento: string;
  cidade: string;
  estado: string;
  telefone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  site: string;
  googleMaps: string;
  quantidadeAvaliacoes: number;
  notaMedia: number;
  possuiSite: boolean;
  possuiSistema: boolean;
  sistemaUtilizado: string;
  responsavel: string;
  status: 'Novo' | 'Contato enviado' | 'Respondeu' | 'Reunião marcada' | 'Proposta enviada' | 'Negociação' | 'Cliente' | 'Perdido';
  motivoDaPerda: string;
  observacoes: string;
}

export interface Diagnostico extends BaseMarketingEntity {
  empresa: string;
  data: string;
  problemasEncontrados: string;
  processosManuais: string;
  tempoPerdido: string;
  funcionariosEnvolvidos: number;
  ferramentasUtilizadas: string;
  sistemasAtuais: string;
  necessidades: string;
  solucoesPropostas: string;
  modulosSugeridos: string;
  iaAplicada: string;
  valorEstimado: number;
  probabilidadeFechamento: number; // 0 to 100
  proximaReuniao: string;
}

export interface ProjetoPromocional extends BaseMarketingEntity {
  empresa: string;
  projeto: string;
  valorPromocional: number;
  valorNormal: number;
  data: string;
  prazo: string;
  status: 'Entregue' | 'Em andamento' | 'Cancelado';
  depoimentoRecebido: boolean;
  casePublicado: boolean;
}

export interface CaseDeSucesso extends BaseMarketingEntity {
  empresa: string;
  sistemaCriado: string;
  problemaResolvido: string;
  tempoEconomizado: string;
  resultadosObtidos: string;
  depoimento: string;
  fotos: string;
  videos: string;
  antes: string;
  depois: string;
  linkProjeto: string;
}

export interface Ideia extends BaseMarketingEntity {
  nome: string;
  descricao: string;
  segmento: string;
  problema: string;
  solucao: string;
  potencialMercado: string;
  dificuldade: 'Alta' | 'Média' | 'Baixa';
  prioridade: 'Alta' | 'Média' | 'Baixa';
  status: 'Pesquisa' | 'Favoritos' | 'Rascunho' | 'Arquivado' | string;
  tags: string;
}

export interface SnapshotRelatorio extends BaseMarketingEntity {
  mesReferencia: string;
  anoReferencia: number;
  empresasProspectadas: number;
  mensagensEnviadas: number;
  respostas: number;
  reunioes: number;
  propostas: number;
  fechamentos: number;
  valorVendido: number;
  receitaPrevista: number;
  receitaRecebida: number;
  lucro: number;
  roi: number;
  tempoMedioFechamento: number; // days
  melhorNicho: string;
  melhorEstrategia: string;
  melhorCanal: string;
  observacoes?: string;
}

export interface MetaMensal extends BaseMarketingEntity {
  mes: string;
  ano: number | string;
  empresasContatadasMeta: number;
  respostasMeta: number;
  reunioesMeta: number;
  propostasMeta: number;
  clientesMeta: number;
  vendasMeta: number;
  lucroMeta: number;
  videosPublicadosMeta: number;
  conteudosCriadosMeta: number;
}
