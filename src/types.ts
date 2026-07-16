export type LeadStatus =
  | 'Novo Lead'
  | 'Contato Feito'
  | 'Sem Resposta'
  | 'Interessado'
  | 'Reunião Marcada'
  | 'Diagnóstico'
  | 'Proposta Enviada'
  | 'Negociação'
  | 'Fechado'
  | 'Perdido'
  | 'Cliente';

export type LeadTemperature = 'Quente' | 'Morno' | 'Frio';

export interface Lead {
  id: string;
  ownerId?: string;
  name: string;
  company: string;
  representative: string;
  phone: string;
  whatsapp: string;
  cnpj?: string;
  address?: string;
  email: string;
  instagram: string;
  linkedin: string;
  city: string;
  state: string;
  site: string;
  segment: string;
  employeeCount: number;
  estimatedRevenue: number;
  source: string;
  entryDate: string;
  notes: string;
  status: LeadStatus;
  temperature: LeadTemperature;
  tags: string[];
  estimatedValue: number;
  winProbability: number; // 0 to 100
  deletionJustification?: string;
  createdBy?: string;
  createdAt?: string;
}

export type FollowUpType =
  | 'Ligação'
  | 'Mensagem'
  | 'Email'
  | 'Reunião'
  | 'Visita'
  | 'Observação'
  | 'Arquivo enviado'
  | 'Proposta enviada';

export interface FollowUp {
  id: string;
  ownerId?: string;
  leadId: string;
  type: FollowUpType;
  description: string;
  date: string;
  time: string;
  user: string;
  nextAction?: string;
  nextActionDate?: string;
  deletionJustification?: string;
}

export interface Empresa {
  id: string;
  ownerId?: string;
  cnpj: string;
  companyName: string; // Razão Social
  tradingName: string; // Nome Fantasia
  address: string;
  city: string;
  state: string;
  cep: string;
  phone: string;
  email: string;
  site: string;
  representative: string;
  segment: string;
  employeeCount: number;
  notes: string;
}

export interface Cliente {
  id: string;
  ownerId?: string;
  leadId?: string;
  companyId?: string;
  name: string;
  companyName: string;
  phone: string;
  cnpj?: string;
  address?: string;
  email: string;
  status: 'Ativo' | 'Inativo';
  inactiveReason?: string;
  createdAt: string;
  contractValue?: number;
  contractType?: 'Fixo' | 'Recorrente';
  hasMaintenance?: boolean;
  maintenancePeriod?: string;
  lastMaintenanceDate?: string;
  lastMaintenanceNotes?: string;
  deletionJustification?: string;
}

export interface ChecklistItem {
  id: string;
  task: string;
  done: boolean;
}

export interface Projeto {
  id: string;
  ownerId?: string;
  clientId: string;
  clientName: string;
  name: string;
  description: string;
  scope: string;
  value: number;
  status:
    | 'Levantamento'
    | 'Protótipo'
    | 'Desenvolvimento'
    | 'Banco de dados'
    | 'Login'
    | 'Dashboard'
    | 'Testes'
    | 'Correções'
    | 'Entrega'
    | 'Treinamento'
    | 'Concluído';
  deadline: string;
  startDate: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  owner: string;
  checklist: ChecklistItem[];
  files: string[];
  deletionJustification?: string;
}

export interface PropostaServico {
  name: string;
  price: number;
}

export interface Proposta {
  id: string;
  ownerId?: string;
  number: string;
  clientId: string;
  clientName: string;
  value: number;
  validity: string;
  description: string;
  services: PropostaServico[];
  discount: number;
  status: 'Pendente' | 'Aceita' | 'Recusada' | 'Expirada';
  createdAt: string;
  deletionJustification?: string;
  createdBy?: string;
}

export interface Contrato {
  id: string;
  ownerId?: string;
  clientId: string;
  clientName: string;
  title: string;
  value: number;
  status: 'Assinado' | 'Pendente';
  date: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  deletionJustification?: string;
}

export interface Financeiro {
  id: string;
  ownerId?: string;
  description: string;
  type: 'Receber' | 'Pagar';
  category: 'Mensalidade' | 'Comissão' | 'Custo' | 'Venda' | 'Outro';
  value: number;
  status: 'Recebido' | 'Pendente' | 'Vencido';
  date: string;
  clientName?: string;
  projectName?: string;
  paymentMethod?: 'Pix' | 'Crédito' | 'Débito' | 'Boleto' | 'Dinheiro';
  paymentDate?: string;
  deletionJustification?: string;
  createdBy?: string;
  createdAt?: string;
  // Asaas Integrations
  asaasId?: string;
  asaasPaymentUrl?: string;
  asaasPixQrCode?: string;
  asaasPixCopyPaste?: string;
  asaasBoletoBarCode?: string;
  asaasBoletoIdentificationField?: string;
}

export interface ClienteAssinatura {
  id: string;
  ownerId?: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  value: number;
  cycle: 'Mensal' | 'Anual';
  paymentMethod: 'Pix' | 'Boleto' | 'Crédito';
  status: 'Pendente' | 'Ativa' | 'Vencida' | 'Cancelada';
  description: string;
  asaasSubscriptionId?: string;
  asaasCustomerId?: string;
  invoiceUrl?: string;
  createdAt: string;
  nextDueDate?: string;
  paymentId?: string;
}

export interface EventAgenda {
  id: string;
  ownerId?: string;
  title: string;
  type: 'Reunião' | 'Ligação' | 'Visita' | 'Entrega' | 'Follow-up' | 'Apresentação' | 'Outro';
  date: string;
  time: string;
  description: string;
  linkedId?: string;
  linkedName?: string;
  linkedType?: 'lead' | 'client' | 'project';
  relatedEntity?: string;
  meetingUrl?: string;
  status?: 'Pendente' | 'Concluído' | 'Cancelado';
  deletionJustification?: string;
}

export type AgendaItem = EventAgenda;

export interface Documento {
  id: string;
  ownerId?: string;
  name: string;
  type: 'pdf' | 'image' | 'video' | 'audio' | 'contract' | 'proposal' | 'other';
  size: string;
  fileUrl: string;
  uploadedAt: string;
  category: string;
  entityId?: string;
  entityType?: 'client' | 'lead' | 'project';
  deletionJustification?: string;
}

export interface Anotacao {
  id: string;
  ownerId?: string;
  title: string;
  content: string;
  entityId?: string;
  entityName?: string;
  entityType?: 'client' | 'lead' | 'project';
  createdAt: string;
  user: string;
  deletionJustification?: string;
}

export interface AppConfig {
  ownerId: string;
  companyName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  backupEnabled: boolean;
  generalGoal?: number;
  phoneGoal?: number;
  commissionRate?: number;
  activeSubscription?: any;
  tradingName?: string;
  cnpj?: string;
  supportEmail?: string;
  phone?: string;
  address?: string;
  logoBase64?: string;
}

export interface Log {
  id: string;
  ownerId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  collection: string;
  recordId: string;
  justification: string;
  timestamp: string;
  user: string;
  data?: any;
}

export interface MembroEquipe {
  id: string;
  ownerId?: string;
  name: string;
  email: string;
  password?: string;
  role: 'Administrador' | 'Gerente' | 'Vendedor';
  phone: string;
  status: 'Ativo' | 'Inativo';
  commissionRate?: number;
  salesGoal?: number;
  phoneGoal?: number;
  createdAt: string;
}

export interface OportunidadeColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'link';
}

export interface OportunidadeRow {
  id: string;
  empresa: string;
  telefone: string;
  contato: boolean;
  [key: string]: any;
}

export interface Oportunidade {
  id: string;
  ownerId: string;
  name: string;
  columns: OportunidadeColumn[];
  rows: OportunidadeRow[];
  createdAt: string;
}


