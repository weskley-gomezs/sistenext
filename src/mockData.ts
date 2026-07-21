import {
  Lead,
  Empresa,
  Cliente,
  Projeto,
  Proposta,
  Contrato,
  Financeiro,
  EventAgenda,
  Anotacao,
  Documento,
  FollowUp,
  MembroEquipe,
  Oportunidade
} from './types';

export const mockLeads: Lead[] = [
  {
    id: 'l1',
    ownerId: 'demo-user-id',
    name: 'Roberto Silva',
    company: 'Tech Solutions Ltda',
    representative: 'Arquiteto de Software Sênior',
    phone: '(11) 98888-7777',
    whatsapp: '(11) 98888-7777',
    email: 'roberto@techsolutions.com',
    instagram: '@techsolutions',
    linkedin: 'linkedin.com/company/techsolutions',
    city: 'São Paulo',
    state: 'SP',
    site: 'www.techsolutions.com',
    segment: 'Tecnologia',
    employeeCount: 50,
    estimatedRevenue: 1000000,
    source: 'LinkedIn',
    entryDate: '2026-07-01',
    notes: 'Interessado em automação de processos.',
    status: 'Negociação',
    temperature: 'Quente',
    tags: ['SaaS', 'ERP'],
    estimatedValue: 5000,
    winProbability: 80,
    createdAt: '2026-07-01',
    createdBy: 'convidado@sistenext.com.br'
  },
  {
    id: 'l2',
    ownerId: 'demo-user-id',
    name: 'Ana Costa',
    company: 'Inova Design',
    representative: 'Arquiteto de Software Sênior',
    phone: '(21) 97777-6666',
    whatsapp: '(21) 97777-6666',
    email: 'ana@inovadesign.com',
    instagram: '@inovadesign',
    linkedin: 'linkedin.com/company/inovadesign',
    city: 'Rio de Janeiro',
    state: 'RJ',
    site: 'www.inovadesign.com',
    segment: 'Design',
    employeeCount: 15,
    estimatedRevenue: 500000,
    source: 'Indicação',
    entryDate: '2026-07-15',
    notes: 'Busca novo site institucional.',
    status: 'Novo Lead',
    temperature: 'Morno',
    tags: ['Web', 'UI/UX'],
    estimatedValue: 2500,
    winProbability: 50,
    createdAt: '2026-07-15',
    createdBy: 'convidado@sistenext.com.br'
  }
];

export const mockClientes: Cliente[] = [
  {
    id: 'c1',
    ownerId: 'demo-user-id',
    name: 'Carlos Oliveira',
    companyName: 'Oliveira & Associados',
    phone: '(31) 3333-4444',
    email: 'contato@oliveira.com',
    status: 'Ativo',
    createdAt: '2026-01-10'
  }
];

export const mockProjetos: Projeto[] = [
  {
    id: 'p1',
    ownerId: 'demo-user-id',
    clientId: 'c1',
    clientName: 'Oliveira & Associados',
    name: 'Implementação ERP',
    description: 'Projeto de implementação de sistema de gestão.',
    scope: 'Módulos financeiro e estoque.',
    value: 5000,
    status: 'Desenvolvimento',
    deadline: '2026-08-30',
    startDate: '2026-06-01',
    estimatedDelivery: '2026-08-30',
    owner: 'Arquiteto de Software Sênior',
    checklist: [
      { id: 'ch1', task: 'Configuração Banco de Dados', done: true },
      { id: 'ch2', task: 'Desenvolvimento Telas', done: false }
    ],
    files: []
  }
];

export const mockFinanceiro: Financeiro[] = [
  {
    id: 'f1',
    ownerId: 'demo-user-id',
    description: 'Mensalidade SaaS - Julho',
    type: 'Receber',
    category: 'Venda',
    value: 450,
    status: 'Recebido',
    date: '2026-07-05',
    clientName: 'Oliveira & Associados'
  }
];

export const mockAgenda: EventAgenda[] = [
  {
    id: 'e1',
    ownerId: 'demo-user-id',
    title: 'Reunião de Alinhamento',
    type: 'Reunião',
    date: '2026-07-22',
    time: '14:00',
    description: 'Discutir próximos passos do projeto ERP',
    status: 'Pendente'
  }
];

export const mockFollowUps: FollowUp[] = [
  {
    id: 'fw1',
    ownerId: 'demo-user-id',
    leadId: 'l1',
    date: '2026-07-10',
    time: '10:00',
    type: 'Ligação',
    description: 'Cliente demonstrou interesse no plano anual.',
    user: 'Arquiteto de Software Sênior'
  }
];

export const mockMembros: MembroEquipe[] = [
  {
    id: 'demo-user-id',
    ownerId: 'demo-user-id',
    name: 'Arquiteto de Software Sênior',
    email: 'convidado@sistenext.com.br',
    role: 'Administrador',
    phone: '(11) 99999-9999',
    status: 'Ativo',
    createdAt: '2026-01-01'
  }
];

export const mockOportunidades: Oportunidade[] = [
  {
    id: 'op1',
    ownerId: 'demo-user-id',
    name: 'Funil de Vendas Demo',
    columns: [
      { key: 'empresa', label: 'Empresa', type: 'text' },
      { key: 'valor', label: 'Valor', type: 'number' },
      { key: 'contato', label: 'Contato Realizado', type: 'boolean' }
    ],
    rows: [
      { id: 'r1', empresa: 'Tech Solutions Ltda', valor: 5000, contato: true, telefone: '(11) 98888-7777' }
    ],
    createdAt: '2026-07-05'
  }
];

export const mockEmpresas: Empresa[] = [
  {
    id: 'e1',
    ownerId: 'demo-user-id',
    cnpj: '00.000.000/0001-00',
    companyName: 'Tech Solutions Ltda',
    tradingName: 'Tech Solutions',
    address: 'Av. Paulista, 1000',
    city: 'São Paulo',
    state: 'SP',
    cep: '01310-100',
    phone: '(11) 3333-4444',
    email: 'contato@techsolutions.com',
    site: 'www.techsolutions.com',
    representative: 'Roberto Silva',
    segment: 'Tecnologia',
    employeeCount: 50,
    notes: 'Empresa em expansão.'
  }
];

export const mockPropostas: Proposta[] = [
  {
    id: 'pr1',
    ownerId: 'demo-user-id',
    number: 'PRO-2026-001',
    clientId: 'c1',
    clientName: 'Oliveira & Associados',
    value: 15000,
    validity: '2026-08-10',
    description: 'Proposta de serviços de consultoria.',
    services: [
      { name: 'Consultoria ERP', price: 10000 },
      { name: 'Treinamento', price: 5000 }
    ],
    discount: 0,
    status: 'Pendente',
    createdAt: '2026-07-10'
  }
];

export const mockContratos: Contrato[] = [
  {
    id: 'ct1',
    ownerId: 'demo-user-id',
    clientId: 'c1',
    clientName: 'Oliveira & Associados',
    title: 'Contrato de Prestação de Serviços',
    value: 15000,
    status: 'Assinado',
    date: '2026-01-01'
  }
];

export const mockAnotacoes: Anotacao[] = [
  {
    id: 'an1',
    ownerId: 'demo-user-id',
    title: 'Nota Fiscal',
    content: 'Reunião inicial muito produtiva. Cliente focado em automação.',
    createdAt: '2026-07-10',
    user: 'Arquiteto de Software Sênior'
  }
];

export const mockDocumentos: Documento[] = [];
