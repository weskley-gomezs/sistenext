import React, { useState } from 'react';
import { Plus, FileText, CheckCircle, XCircle, Printer, Download, X, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Proposta, Cliente, Lead, PropostaServico } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { getLocalDateString } from '../utils/dateUtils';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const parseDescription = (desc: string) => {
  const sections = {
    objetivo: '',
    escopo: '',
    prazos: '',
    termos: ''
  };

  if (!desc) return sections;

  const parts = desc.split(/\[(OBJETIVO|ESCOPO|PRAZOS|TERMOS)\]/i);
  if (parts.length < 2) {
    // Legacy single text description
    sections.objetivo = desc;
    return sections;
  }

  for (let i = 1; i < parts.length; i += 2) {
    const key = parts[i].toLowerCase() as 'objetivo' | 'escopo' | 'prazos' | 'termos';
    const val = parts[i + 1] ? parts[i + 1].trim() : '';
    if (key in sections) {
      sections[key] = val;
    }
  }

  return sections;
};

interface PropostasViewProps {
  propostas: Proposta[];
  clientes: Cliente[];
  leads: Lead[];
  onAddProposta: (prop: Omit<Proposta, 'id'>) => Promise<string>;
  onUpdateProposta: (id: string, prop: Partial<Proposta>) => Promise<void>;
  onDeleteProposta: (id: string, justification: string, data: Proposta) => Promise<void>;
  config?: any;
}

export default function PropostasView({
  propostas,
  clientes,
  leads,
  onAddProposta,
  onUpdateProposta,
  onDeleteProposta,
  config
}: PropostasViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [selectedProposalForPrint, setSelectedProposalForPrint] = useState<Proposta | null>(null);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  
  const companyInfo = {
    companyName: config?.companyName || config?.tradingName || '',
    cnpj: config?.cnpj || '',
    logoUrl: config?.logoBase64 || config?.logoUrl || ''
  };

  // Form Fields
  const [clientId, setClientId] = useState('');
  const [validity, setValidity] = useState('');
  const [discount, setDiscount] = useState(0);
  const [contractType, setContractType] = useState<'Fixo' | 'Recorrente'>('Fixo');
  const [paymentTerms, setPaymentTerms] = useState<'A vista' | '50/50' | 'Mensal' | 'Personalizado'>('A vista');

  // Structured fields for Organized proposal creation
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [objetivo, setObjetivo] = useState('');
  const [escopo, setEscopo] = useState('');
  const [prazos, setPrazos] = useState('');
  const [termos, setTermos] = useState('');

  // Premium Custom PDF settings
  const [pdfThemeColor, setPdfThemeColor] = useState('#4f46e5'); // default Indigo
  const [pdfTitle, setPdfTitle] = useState('PROPOSTA COMERCIAL');
  const [pdfIncludeSignatures, setPdfIncludeSignatures] = useState(true);
  const [pdfIncludeSections, setPdfIncludeSections] = useState(true);

  // Dynamic services adder in form
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState(0);
  const [services, setServices] = useState<PropostaServico[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // List of potential recipients (can be leads or active clients!)
  const recipients = [
    ...leads.map((l) => ({ id: l.id, name: `${l.company || l.name} (${l.name})`, type: 'Lead' })),
    ...clientes.map((c) => ({ id: c.id, name: `${c.companyName || c.name} (${c.name})`, type: 'Cliente' }))
  ];

  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    switch (templateKey) {
      case 'software':
        setObjetivo("Desenvolvimento, implantação e homologação de uma plataforma web de gestão corporativa integrada (ERP/CRM) de alta performance, sob demanda, visando automatizar o fluxo operacional, integrar canais de atendimento, centralizar dados financeiros e otimizar a tomada de decisões estratégicas por meio de dashboards gerenciais em tempo real.");
        setEscopo("1. MÓDULO FINANCEIRO AVANÇADO:\n- Controle de Fluxo de Caixa Diário (entradas, saídas, provisões);\n- Conciliação Bancária Automática (importação de arquivos OFX/retorno);\n- Emissão Automatizada de Notas Fiscais (NF-e, NFS-e) e Boletos integrados (Gateway de Pagamento);\n- Relatórios Gerenciais (DRE, Fluxo de Caixa Projetado).\n\n2. MÓDULO DE VENDAS & CRM:\n- Funil de Vendas Visual Kanban com arrastar-e-soltar personalizável;\n- Cadastro detalhado de Leads, Clientes e histórico de interações;\n- Registro e monitoramento automatizado de metas da equipe comercial;\n- Integração de formulários do site institucional para captação direta de leads.\n\n3. PAINEL ADMINISTRATIVO & SEGURANÇA:\n- Controle de permissões granular por papel de usuário (RBAC);\n- Auditoria interna de logs (registro de quem criou, editou ou excluiu registros);\n- Segurança SSL/TLS de ponta-a-ponta com banco de dados criptografado.\n\n4. INTEGRAÇÃO E NOTIFICAÇÕES:\n- Disparos automáticos de notificações por WhatsApp API e E-mail (avisos de vencimento, cobrança, confirmações);\n- Painel de Business Intelligence (BI) com indicadores gráficos interativos para diretoria.");
        setPrazos("O projeto será executado sob a metodologia ágil Scrum, estruturado em sprints quinzenais de entrega contínua. Cronograma total de 90 dias úteis:\n\n- Etapa 01 (15 dias úteis): Alinhamento estratégico, prototipagem navegável de alta fidelidade e arquitetura de banco de dados.\n- Etapa 02 (35 dias úteis): Desenvolvimento do Módulo Financeiro Integrado e Vendas/CRM.\n- Etapa 03 (25 dias úteis): Integração de APIs de Notificação, Dashboard BI e disparos automatizados por WhatsApp.\n- Etapa 04 (15 dias úteis): Período de homologação assistida, testes de estresse/segurança, treinamento prático de equipe e publicação final.");
        setTermos("- Licenciamento vitalício do código-fonte desenvolvido, sem cobrança de royalties ou mensalidades obrigatórias de licença;\n- Garantia incondicional de 90 dias pós-entrega contra bugs, defeitos de codificação ou incompatibilidades operacionais;\n- Faturamento estruturado em 4 parcelas iguais vinculadas ao início de cada etapa descrita no cronograma;\n- Prazo de pagamento de até 5 dias úteis após a aprovação de cada marco de entrega assistida.");
        setServices([
          { name: "Fase de Prototipagem & Arquitetura de Software", price: 4500.00 },
          { name: "Módulo de Vendas, CRM e Funil de Vendas", price: 8500.00 },
          { name: "Módulo Financeiro Integrado, Cobranças & NF-e", price: 12000.00 },
          { name: "Dashboard de BI, Relatórios & Integração WhatsApp API", price: 6500.00 },
          { name: "Implantação Cloud, Homologação & Treinamento Técnico", price: 3500.00 }
        ]);
        break;
      case 'consulting':
        setObjetivo("Prestação de serviços especializados de consultoria empresarial de alta gestão e assessoria operacional estratégica, focando no diagnóstico organizacional completo, otimização de gargalos de produtividade, reestruturação financeira e mentoria de lideranças comerciais para maximizar a escala e lucratividade do negócio.");
        setEscopo("1. DIAGNÓSTICO E MAPEAMENTO OPERACIONAL:\n- Realização de entrevistas individuais com lideranças chaves de cada setor;\n- Auditoria de processos atuais e identificação de gargalos operacionais;\n- Mapeamento detalhado do fluxo de caixa e estrutura de margem de lucro por produto/serviço.\n\n2. REESTRUTURAÇÃO COMERCIAL E DE VENDAS:\n- Análise do processo de aquisição de clientes (ICP, canais de aquisição, funil);\n- Criação de novos Playbooks de Vendas, roteiros de abordagem e contorno de objeções personalizados;\n- Implantação e customização completa do funil de vendas dentro do sistema CRM atual.\n\n3. MODELAGEM FINANCEIRA E PROJEÇÃO:\n- Criação de Planilhas de Precificação Precisa com base em custos fixos e variáveis;\n- Criação de plano de metas financeiras com projeção para os próximos 12 e 24 meses;\n- Elaboração de plano estratégico de redução de custos improdutivos em até 15%.\n\n4. CAPACITAÇÃO E MENTORIA DE EXECUTIVOS:\n- Realização de workshops semanais coletivos focado em fechamento de novos negócios;\n- Sessões individuais de mentoria de liderança para os diretores comerciais e operacionais.");
        setPrazos("A consultoria terá duração estimada de 12 semanas consecutivas (3 meses), dividida nos seguintes ciclos estratégicos:\n\n- Semanas 01 a 03: Diagnóstico Situacional Completo e entrega do Relatório de Maturidade Empresarial.\n- Semanas 04 a 08: Implantação prática dos novos processos, playbooks comerciais e precificação estratégica.\n- Semanas 09 a 12: Acompanhamento assistido, auditoria de aplicação prática dos times, refinamento de KPIs e entrega do Plano de Expansão Anual.");
        setTermos("- Acordo estrito de confidencialidade de dados comerciais (NDA assinado no dia zero das atividades);\n- Todo material didático, planilhas gerenciais de precificação e playbooks desenvolvidos serão propriedade intelectual exclusiva da contratante;\n- O pagamento será realizado em parcelas mensais fixas e consecutivas de igual valor;\n- Prazo para faturamento mensal no dia 05 de cada mês de vigência das atividades.");
        setServices([
          { name: "Diagnóstico de Gargalos Organizacionais e Financeiros", price: 3200.00 },
          { name: "Mapeamento de Processos, Playbook de Vendas e CRM", price: 5800.00 },
          { name: "Workshops, Capacitação Comercial e Mentoria Individual", price: 4500.00 },
          { name: "Relatório Final de Performance e KPIs Estratégicos", price: 2000.00 }
        ]);
        break;
      case 'marketing':
        setObjetivo("Planejamento, criação e operacionalização de campanhas estratégicas de marketing digital de performance com foco na atração e captação diária de leads qualificados (B2B/B2C), melhoria do posicionamento de marca orgânico (SEO) nos motores de busca e otimização contínua de taxa de conversão (CRO) para acelerar as vendas da contratante.");
        setEscopo("1. GESTÃO DE MÍDIA PAGA (TRÁFEGO PAGO):\n- Planejamento, configuração e veiculação de anúncios patrocinados nas plataformas Google Ads (Busca, Display, YouTube) e Meta Ads (Instagram, Facebook);\n- Estruturação de públicos personalizados, públicos semelhantes (lookalike) e remarketing dinâmico;\n- Otimização diária de orçamentos visando a redução constante do Custo por Lead (CPL).\n\n2. ENGENHARIA DE CONVERSÃO (LANDING PAGES & CRO):\n- Criação, redação persuasiva (copywriting) e design de até 02 Landing Pages de alta conversão para captura de leads;\n- Integração com ferramentas de Analytics e CRM da contratante;\n- Implementação de testes A/B contínuos para elevar a taxa de conversão em vendas.\n\n3. OTIMIZAÇÃO ORGÂNICA (SEO & SEO LOCAL):\n- Auditoria técnica de SEO no site corporativo da contratante;\n- Estudo e mapeamento de palavras-chaves de alta intenção comercial;\n- Otimização completa do perfil comercial Google Meu Negócio para atração de tráfego local.\n\n4. INTELIGÊNCIA DE DADOS (BI & RELATÓRIOS):\n- Configuração do Google Analytics 4 e pixels de rastreamento com tags avançadas (GTM);\n- Elaboração e apresentação mensal de dashboard interativo de resultados (CPA, CTR, Leads Gerados, ROI).");
        setPrazos("Contrato de prestação de serviços continuados com prazo inicial mínimo recomendado de 6 meses para maturação das campanhas e algoritmos. Cronograma inicial:\n\n- Fase 01 (Semanas 1 e 2): Setup estratégico, instalação de tags/pixels, criação do design de Landing Pages e redação de anúncios.\n- Fase 02 (Semanas 3 em diante): Início da veiculação de anúncios, otimizações semanais de público/orçamento.\n- Mensal: Reunião mensal de alinhamento com apresentação formal do dashboard de performance corporativa.");
        setTermos("- A verba de investimento em anúncios digitais (paga diretamente ao Google e Meta Ads) é de responsabilidade única e exclusiva da contratante, não estando embutida nos honorários da agência;\n- Todas as contas de anúncios, domínios e landing pages desenvolvidas pertencerão 100% à contratante;\n- Pagamento faturado de forma mensal recorrente antecipada;\n- Aviso prévio mínimo de 30 dias para solicitação de encerramento do contrato.");
        setServices([
          { name: "Setup de Contas, Configuração GA4/GTM e Planejamento", price: 1500.00 },
          { name: "Criação de Landing Pages de Alta Conversão (Design & Copy)", price: 2800.00 },
          { name: "Gestão Mensal de Campanhas Google Ads e Meta Ads (Mídia Paga)", price: 2500.00 },
          { name: "Consultoria de SEO, SEO Local & Relatórios Mensais de BI", price: 1200.00 }
        ]);
        break;
      case 'support':
        setObjetivo("Prestação de serviços contínuos de suporte de TI corporativo, administração preventiva e corretiva de servidores em nuvem (AWS/GCP), gestão de rotinas de segurança da informação, auditoria contra vulnerabilidades, conformidade com a LGPD e suporte helpdesk especializado para equipe interna.");
        setEscopo("1. MONITORAMENTO E ADMINISTRAÇÃO DE SERVIDORES EM NUVEM:\n- Monitoramento em tempo real (24/7/365) da integridade, uso de memória, CPU e conexões de rede dos servidores operacionais;\n- Otimização de performance de banco de dados e balanceamento de carga de conexões em horários de pico.\n\n2. ROTINAS DE BACKUP E PLANO DE RECUPERAÇÃO DE DESASTRES:\n- Configuração e automatização de backups diários e incrementais redundantes em nuvem criptografada offsite;\n- Testes periódicos mensais de restauração de backup (Disaster Recovery Plan) para garantir integridade absoluta.\n\n3. SEGURANÇA DIGITAL E LGPD:\n- Auditoria trimestral contra possíveis falhas de segurança e injeções maliciosas de código;\n- Implementação de barreiras de proteção WAF (Web Application Firewall) e criptografia de ponta-a-ponta;\n- Assessoria técnica de TI para conformidade da infraestrutura operacional com a LGPD (Lei Geral de Proteção de Dados).\n\n4. HELPDESK & SUPORTE DE SEGUNDO NÍVEL:\n- Atendimento rápido a chamados técnicos de infraestrutura por canal exclusivo de WhatsApp/E-mail com Acordo de Nível de Serviço (SLA) de até 4 horas úteis;\n- Suporte focado em correções de bugs de sistema e configurações técnicas de rede corporativa.");
        setPrazos("O presente contrato de suporte técnico contínuo possui vigência anual (12 meses), com renovação automática por períodos iguais, estabelecendo os seguintes SLAs de resposta de acordo com a criticidade:\n\n- Crítico (Inoperabilidade do Sistema principal): SLA de resposta de até 1 hora útil.\n- Alto (Impacto parcial em funções chaves): SLA de resposta de até 4 horas úteis.\n- Médio/Baixo (Dúvidas de uso, pequenas correções): SLA de resposta de até 12 horas úteis.");
        setTermos("- O suporte técnico não cobre o desenvolvimento de novos módulos de software ou novas funcionalidades não listadas em escopo comercial;\n- O faturamento é realizado de maneira mensal fixa e pós-paga, com vencimento programado no dia 10 de cada mês subsequente;\n- Multa de rescisão contratual equivalente a 01 mensalidade em caso de quebra antes do período mínimo estipulado sem justa causa documental.");
        setServices([
          { name: "Monitoramento 24/7 e Gestão de Servidores Cloud", price: 1800.00 },
          { name: "Backup Diário Redundante e Plano Disaster Recovery", price: 900.00 },
          { name: "Implementação de Segurança WAF, Criptografia e Firewall", price: 1200.00 },
          { name: "SLA Suporte Técnico Helpdesk & Manutenção Preventiva", price: 1500.00 }
        ]);
        break;
      case 'crm_training':
        setObjetivo("Estruturação completa e implantação do ecossistema de vendas através de CRM (Customer Relationship Management) e treinamento comercial especializado da equipe, visando padronizar o processo de captação de leads, funil de vendas, acompanhamento de propostas, qualificação por SLA e conversão em clientes.");
        setEscopo("1. PARAMETRIZAÇÃO E CONFIGURAÇÃO TÉCNICA DO CRM:\n- Cadastro de usuários com hierarquias e permissões de acesso comercial;\n- Criação de funis de vendas personalizados adaptados ao processo da empresa;\n- Automação de campos obrigatórios por etapa do funil comercial.\n\n2. PLAYBOOK DE PROSPECÇÃO E ROTEIROS DE ABORDAGEM:\n- Desenvolvimento do Guia Prático de Prospecção Ativa (Outbound) e Passiva (Inbound);\n- Roteiros específicos para vendas consultivas pelo WhatsApp e telefone;\n- Framework de Qualificação de Leads (Metodologia BANT/GPCT).\n\n3. TREINAMENTO PRÁTICO PARA TIME COMERCIAL:\n- Treinamento ao vivo (remoto ou presencial) focado no uso diário do CRM e gestão de tarefas;\n- Mentoria prática com simulação real de fechamento de negócios no sistema;\n- Testes e simulações com feedbacks individuais de abordagem comercial.\n\n4. DASHBOARDS DE MÉTRICAS E KPIs:\n- Configuração de relatórios automáticos de conversão de funil, tempo médio em etapa e produtividade por vendedor;\n- Configuração de alertas para negócios estagnados no funil.");
        setPrazos("O programa de implantação de CRM e capacitação de vendas será realizado em 4 semanas de cronograma guiado:\n\n- Semana 01: Auditoria do processo comercial atual e parametrização técnica completa do CRM.\n- Semana 02: Redação do Playbook de abordagem e criação das regras de transição de etapas.\n- Semana 03: Sessões práticas presenciais/remotas de treinamento com simulações de vendas.\n- Semana 04: Acompanhamento de uso em tempo real do time comercial para sanar dúvidas pós-implantação.");
        setTermos("- Todos os materiais pedagógicos e playbooks de prospecção serão entregues de forma digital e editável para futuras capacitações da contratante;\n- Requisitos mínimos: a contratante deve disponibilizar computador com acesso à internet para todos os participantes;\n- Faturamento em 2 parcelas iguais, sendo 50% no aceite e 50% no encerramento do projeto comercial;\n- Os custos de licenças de terceiros do CRM não estão inclusos neste pacote.");
        setServices([
          { name: "Parametrização Completa, Automações e Setup de CRM", price: 2200.00 },
          { name: "Desenvolvimento de Roteiros, Abordagens e Playbook de Vendas", price: 2500.00 },
          { name: "Capacitação ao Vivo do Time de Vendas (Simulações Clínicas)", price: 3200.00 },
          { name: "Relatório Final de Métricas Comerciais e Performance de Equipe", price: 1100.00 }
        ]);
        break;
      case 'branding':
        setObjetivo("Criação completa de nova identidade de marca institucional (Branding) para a empresa contratante, incluindo o desenvolvimento de logotipo, paleta de cores cromática, tipografia corporativa institucional, design de papelaria digital e física, além do manual completo de diretrizes de marca (Brand Guidelines) para comunicação omnicanal uniforme.");
        setEscopo("1. IMERSÃO E PESQUISA ESTRATÉGICA (DESIGN THINKING):\n- Alinhamento de valores corporativos através de briefing imersivo e questionário de branding;\n- Pesquisa concorrencial profunda e mapeamento de nicho de mercado;\n- Definição do arquétipo de marca, tom de voz oficial e direcionamento visual.\n\n2. DESENVOLVIMENTO DE MARCA E LOGOTIPO:\n- Criação de até 03 propostas de conceitos visuais (logos) exclusivos;\n- Refinamento geométrico do logotipo escolhido pela contratante;\n- Versões do logotipo: horizontal, vertical, redução para mídias sociais (ícones), positivo/negativo.\n\n3. SISTEMA DE IDENTIDADE VISUAL COMPLEMENTAR:\n- Paleta cromática corporativa com códigos oficiais (RGB, CMYK, PANTONE, HEX);\n- Manual de tipografia corporativa principal e de suporte;\n- Elementos auxiliares de design (texturas, grafismos, patterns exclusivos).\n\n4. PAPELARIA CORPORATIVA E BRAND BOOK:\n- Design de cartão de visitas digital interativo, papel timbrado (Word/Docs) e assinatura de e-mail;\n- Design de slides e apresentação corporativa institucional em formato editável;\n- Entrega de Brand Guidelines completo documentando a correta aplicação da marca em canais digitais e físicos.");
        setPrazos("O projeto de Branding será executado em 35 dias consecutivos, respeitando o seguinte cronograma de aprovações:\n\n- Etapa 01 (10 dias): Entrega do Relatório de Direcionamento Estratégico (Briefing consolidado e Painel Semântico);\n- Etapa 02 (15 dias): Apresentação dos 3 conceitos visuais de marca com aplicações reais e simulações de mockup;\n- Etapa 03 (10 dias): Refinamentos com base nos feedbacks, design dos itens de papelaria e entrega do Manual de Marca consolidado com arquivos originais de vetor.");
        setTermos("- Todos os arquivos finais serão entregues em formatos abertos editáveis (Adobe Illustrator, PDF/X-1a, SVG) e em formatos de imagem de alta definição (PNG e JPEG);\n- Os direitos de propriedade intelectual patrimonial sobre a marca escolhida e aprovada serão transferidos integralmente e de forma definitiva à contratante;\n- Faturamento em 3 parcelas consecutivas: 40% na contratação, 30% na apresentação de conceitos de marca e 30% na entrega final.");
        setServices([
          { name: "Imersão, Briefing Estratégico e Tom de Voz da Marca", price: 1800.00 },
          { name: "Criação do Logotipo e Paleta de Cores Oficial", price: 3500.00 },
          { name: "Design de Papelaria Corporativa e Templates de Slides", price: 1600.00 },
          { name: "Manual de Diretrizes de Marca (Brand Guidelines) e Vetores", price: 1100.00 }
        ]);
        break;
      default:
        setObjetivo('');
        setEscopo('');
        setPrazos('');
        setTermos('');
        setServices([]);
        break;
    }
  };

  const handleAddService = () => {
    if (!serviceName || servicePrice <= 0) return;
    setServices([...services, { name: serviceName, price: servicePrice }]);
    setServiceName('');
    setServicePrice(0);
  };

  const handleRemoveService = (idx: number) => {
    setServices(services.filter((_, i) => i !== idx));
  };

  const handleEdit = (prop: Proposta) => {
    setEditingProposalId(prop.id);
    setClientId(prop.clientId);
    setValidity(prop.validity);
    setDiscount(prop.discount);
    setContractType(prop.contractType || 'Fixo');
    setPaymentTerms(prop.paymentTerms || 'A vista');
    setServices(prop.services);
    
    const sections = parseDescription(prop.description);
    setObjetivo(sections.objetivo);
    setEscopo(sections.escopo);
    setPrazos(sections.prazos);
    setTermos(sections.termos);
    
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const recipient = recipients.find((r) => r.id === clientId);
    if (!recipient) {
      setErrorMsg('Selecione um cliente destinatário válido.');
      return;
    }
    if (services.length === 0) {
      setErrorMsg('Insira ao menos um serviço na proposta.');
      return;
    }

    const servicesTotal = services.reduce((s, srv) => s + srv.price, 0);
    const finalValue = Math.max(servicesTotal - discount, 0);

    // Auto-sequence number
    const sequenceNumber = `PROP-2026-${String(propostas.length + 1).padStart(4, '0')}`;

    // Combine structured sections with specific tags for clean parsing
    const combinedDescription = `[OBJETIVO]\n${objetivo}\n\n[ESCOPO]\n${escopo}\n\n[PRAZOS]\n${prazos}\n\n[TERMOS]\n${termos}`;

    try {
      if (editingProposalId) {
        await onUpdateProposta(editingProposalId, {
          clientId,
          clientName: recipient.name.split(' (')[0],
          value: finalValue,
          validity,
          description: combinedDescription,
          services,
          discount,
          contractType,
          paymentTerms
        });
      } else {
        const payload: Omit<Proposta, 'id'> = {
          number: sequenceNumber,
          clientId,
          clientName: recipient.name.split(' (')[0],
          value: finalValue,
          validity,
          description: combinedDescription,
          services,
          discount,
          status: 'Pendente',
          contractType,
          paymentTerms,
          createdAt: getLocalDateString()
        };
        await onAddProposta(payload);
      }
      setIsOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    if (!selectedProposalForPrint) return;
    const prop = selectedProposalForPrint;
    
    const printWindow = window.open('', '', 'width=800,height=800');
    if (!printWindow) return;

    let servicesHtml = prop.services.map(s => `
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
        <span>${s.name}</span>
        <strong>R$ ${s.price.toFixed(2).replace('.', ',')}</strong>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Proposta - ${prop.number}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { 
              font-family: 'Inter', sans-serif; 
              padding: 40px; 
              color: #1e293b; 
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
            }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #f1f5f9; }
            .logo { max-height: 60px; object-fit: contain; }
            .title-area { text-align: right; }
            .title-area h2 { margin: 0; font-size: 18px; color: #0f172a; text-transform: uppercase; }
            .title-area span { display: inline-block; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-top: 4px; color: #64748b; font-weight: bold; }
            .info-grid { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 12px; }
            .info-col strong { display: block; color: #64748b; text-transform: uppercase; font-size: 10px; margin-bottom: 4px; }
            .description { background: #f8fafc; padding: 16px; border-left: 4px solid #4f46e5; font-size: 13px; font-style: italic; margin-bottom: 30px; }
            .services { margin-bottom: 30px; font-size: 13px; }
            .services h4 { font-size: 10px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 10px; }
            .totals { border-top: 1px solid #e2e8f0; padding-top: 15px; margin-left: auto; width: 300px; font-size: 13px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total-final { display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 16px; font-weight: bold; }
            .signatures { margin-top: 80px; display: flex; justify-content: space-between; gap: 40px; }
            .sig-box { width: 45%; border-top: 1px solid #000; padding-top: 10px; text-align: center; font-size: 10px; color: #64748b; }
            @media print {
              body { padding: 0; }
              @page { margin: 2cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              ${companyInfo.logoUrl ? `<img src="${companyInfo.logoUrl}" class="logo" />` : `<strong>${companyInfo.companyName || 'Sua Empresa'}</strong>`}
            </div>
            <div class="title-area">
              <h2>PROPOSTA COMERCIAL</h2>
              <span>${prop.number}</span>
            </div>
          </div>
          
          <div class="info-grid">
            <div class="info-col">
              <strong>Emitido Para:</strong>
              <span style="font-size: 14px; color: #0f172a; font-weight: bold;">${prop.clientName}</span><br/>
              Destinatário Corporativo
            </div>
            <div class="info-col" style="text-align: right;">
              <strong>Datas de Emissão:</strong>
              Emitido em: ${prop.createdAt.split('-').reverse().join('/')}<br/>
              <span style="color: #4f46e5; font-weight: bold;">Válido até: ${prop.validity.split('-').reverse().join('/')}</span>
            </div>
          </div>

          <div class="description">
            ${prop.description}
          </div>

          <div class="services">
            <h4>Descritivo de Serviços</h4>
            ${servicesHtml}
          </div>

          <div class="totals">
            <div class="total-row">
              <span>Soma dos Serviços:</span>
              <strong>R$ ${prop.services.reduce((s, x) => s + x.price, 0).toFixed(2).replace('.', ',')}</strong>
            </div>
            ${prop.discount > 0 ? `
              <div class="total-row" style="color: #ef4444;">
                <span>Desconto Concedido:</span>
                <strong>- R$ ${prop.discount.toFixed(2).replace('.', ',')}</strong>
              </div>
            ` : ''}
            <div class="total-final">
              <span>Valor Líquido:</span>
              <span style="color: #4f46e5;">R$ ${prop.value.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          <div class="signatures">
            <div class="sig-box">Assinatura do Consultor Comercial</div>
            <div class="sig-box">Assinatura do Destinatário (Aceitante)</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const resetForm = () => {
    setClientId('');
    setValidity('');
    setDiscount(0);
    setServices([]);
    setServiceName('');
    setServicePrice(0);
    setContractType('Fixo');
    setPaymentTerms('A vista');
    setEditingProposalId(null);
    setSelectedTemplate('custom');
    setObjetivo('');
    setEscopo('');
    setPrazos('');
    setTermos('');
  };

  const generatePremiumPDF = (prop: Proposta) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const hexToRgb = (hex: string) => {
      const match = hex.replace('#', '').match(/.{1,2}/g);
      return match ? match.map(x => parseInt(x, 16)) : [79, 70, 229];
    };
    const rgbColor = hexToRgb(pdfThemeColor);

    // Header Background Bar (accent color)
    doc.setFillColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    doc.rect(0, 0, pageWidth, 12, 'F');

    let currentY = 25;

    // Logo / Company Name
    const finalCompanyName = companyInfo.companyName || 'Sua Empresa';
    if (companyInfo.logoUrl) {
      try {
        const format = companyInfo.logoUrl.includes('png') || companyInfo.logoUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(companyInfo.logoUrl, format, 14, currentY, 35, 15);
        currentY += 20;
      } catch (err) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2]);
        doc.text(finalCompanyName.toUpperCase(), 14, currentY + 8);
        currentY += 18;
      }
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2]);
      doc.text(finalCompanyName.toUpperCase(), 14, currentY + 8);
      currentY += 18;
    }

    // Title of the Document
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(51, 65, 85);
    doc.text(pdfTitle.toUpperCase(), pageWidth - 14, 30, { align: 'right' });
    
    // Number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`NÚMERO: ${prop.number}`, pageWidth - 14, 36, { align: 'right' });

    // Draw horizontal separator line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 10;

    // Recipient details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('EMITIDO PARA:', 14, currentY);
    doc.text('INFORMAÇÕES GERAIS:', pageWidth - 14, currentY, { align: 'right' });

    currentY += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(prop.clientName.toUpperCase(), 14, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`Emitido em: ${prop.createdAt.split('-').reverse().join('/')}`, pageWidth - 14, currentY, { align: 'right' });

    currentY += 5;
    
    if (companyInfo.cnpj) {
      doc.text(`CNPJ do Emitente: ${companyInfo.cnpj}`, 14, currentY);
    } else {
      doc.text('Destinatário Cadastrado no CRM', 14, currentY);
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    doc.text(`Válido até: ${prop.validity.split('-').reverse().join('/')}`, pageWidth - 14, currentY, { align: 'right' });

    currentY += 12;

    // Render structured sections
    if (pdfIncludeSections) {
      const sections = parseDescription(prop.description);
      const isLegacy = !sections.escopo && !sections.prazos && !sections.termos;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2]);

      if (isLegacy) {
        doc.text('OBJETIVO & ESCOPO GERAL:', 14, currentY);
        currentY += 5;
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        
        const splitText = doc.splitTextToSize(sections.objetivo || prop.description || '', pageWidth - 28);
        doc.text(splitText, 14, currentY);
        currentY += (splitText.length * 4.2) + 8;
      } else {
        const drawSection = (title: string, content: string) => {
          if (!content || currentY > pageHeight - 40) return;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2]);
          doc.text(title.toUpperCase(), 14, currentY);
          currentY += 4.5;
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);
          const lines = doc.splitTextToSize(content, pageWidth - 28);
          doc.text(lines, 14, currentY);
          currentY += (lines.length * 4) + 6;
        };

        drawSection('1. Objetivo da Proposta', sections.objetivo);
        drawSection('2. Escopo do Trabalho e Entregáveis', sections.escopo);
        drawSection('3. Cronograma e Prazos', sections.prazos);
        drawSection('4. Termos e Condições Comerciais', sections.termos);
        currentY += 4;
      }
    } else {
      if (prop.description) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2]);
        doc.text('RESUMO DO ESCOPO:', 14, currentY);
        currentY += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        const splitText = doc.splitTextToSize(prop.description, pageWidth - 28);
        doc.text(splitText, 14, currentY);
        currentY += (splitText.length * 4) + 8;
      }
    }

    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = 25;
      doc.setFillColor(rgbColor[0], rgbColor[1], rgbColor[2]);
      doc.rect(0, 0, pageWidth, 8, 'F');
    }

    // Services Table
    const tableHeaders = [['Item / Módulo de Serviço', 'Valor Unitário']];
    const tableRows = prop.services.map(s => [
      s.name,
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.price)
    ]);

    autoTable(doc, {
      startY: currentY,
      head: tableHeaders,
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [rgbColor[0], rgbColor[1], rgbColor[2]],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'left'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85]
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 45, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        currentY = data.cursor ? data.cursor.y : currentY;
      }
    });

    currentY += 8;

    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 25;
      doc.setFillColor(rgbColor[0], rgbColor[1], rgbColor[2]);
      doc.rect(0, 0, pageWidth, 8, 'F');
    }

    // Totals Panel
    const totalsX = pageWidth - 14 - 70;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Soma dos Serviços:', totalsX, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prop.services.reduce((s, x) => s + x.price, 0)), pageWidth - 14, currentY, { align: 'right' });

    currentY += 5;

    if (prop.discount > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(239, 68, 68);
      doc.text('Desconto:', totalsX, currentY);
      doc.setFont('helvetica', 'bold');
      doc.text(`- ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prop.discount)}`, pageWidth - 14, currentY, { align: 'right' });
      currentY += 5;
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(totalsX, currentY, pageWidth - 14, currentY);
    currentY += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    doc.text('VALOR LÍQUIDO:', totalsX, currentY);
    doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prop.value), pageWidth - 14, currentY, { align: 'right' });

    currentY += 15;

    if (pdfIncludeSignatures) {
      if (currentY > pageHeight - 40) {
        doc.addPage();
        currentY = 30;
        doc.setFillColor(rgbColor[0], rgbColor[1], rgbColor[2]);
        doc.rect(0, 0, pageWidth, 8, 'F');
      }

      currentY += 10;
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.5);

      doc.line(20, currentY, 90, currentY);
      doc.line(pageWidth - 90, currentY, pageWidth - 20, currentY);

      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Assinatura do Consultor', 55, currentY, { align: 'center' });
      doc.text('Assinatura do Cliente / Aceitante', pageWidth - 55, currentY, { align: 'center' });
    }

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`${finalCompanyName.toUpperCase()} - PROPOSTA COMERCIAL GERADA VIA CRM IA PRO`, pageWidth / 2, pageHeight - 8, { align: 'center' });
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
    }

    doc.save(`proposta-${prop.number.toLowerCase()}-${prop.clientName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  const handleUpdateStatus = async (propId: string, newStatus: Proposta['status']) => {
    try {
      await onUpdateProposta(propId, { status: newStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Gerador de Propostas Comerciais
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gere orçamentos e propostas premium com precificação estruturada e descontos para clientes corporativos.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 cursor-pointer"
        >
          <Plus size={14} /> Nova Proposta
        </button>
      </div>

      {/* Grid List of proposals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {propostas.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs font-semibold">
            Nenhuma proposta comercial gerada ainda.
          </div>
        ) : (
          propostas.map((prop) => (
            <div
              key={prop.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold font-mono">
                      {prop.number}
                    </span>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mt-2 leading-tight">
                      {prop.clientName}
                    </h3>
                  </div>

                  <div className="flex gap-1">
                    {prop.status === 'Pendente' && (
                      <button
                        onClick={() => handleEdit(prop)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer"
                        title="Editar Proposta"
                      >
                        <Edit2 size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedProposalForPrint(prop)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer"
                      title="Imprimir / Detalhes"
                    >
                      <Printer size={13} />
                    </button>
                    <button
                      onClick={() => setItemToDeleteId(prop.id)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                  {prop.description}
                </p>

                {/* Pricing summary */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Valor Líquido</span>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                        prop.contractType === 'Recorrente' 
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {prop.contractType || 'Fixo'}
                      </span>
                    </div>
                    <span className="text-md font-black text-indigo-600 dark:text-indigo-400 font-mono">
                      {formatBRL(prop.value)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 block font-semibold">Validade: {prop.validity.split('-').reverse().slice(0, 2).join('/')}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${
                      prop.status === 'Aceita'
                        ? 'bg-green-500/10 text-green-500'
                        : prop.status === 'Recusada'
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {prop.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action shift */}
              {prop.status === 'Pendente' && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(prop.id, 'Aceita')}
                    className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <CheckCircle size={10} /> Aceitar Proposta
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(prop.id, 'Recusada')}
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-lg text-[10px] transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <XCircle size={10} /> Recusar Proposta
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* DETAILED PRINT MODAL SCREEN */}
      <AnimatePresence>
        {selectedProposalForPrint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProposalForPrint(null)}
              className="fixed inset-0 bg-black/80"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-5xl bg-slate-100 dark:bg-slate-950 text-slate-900 p-6 rounded-3xl shadow-2xl max-h-[95vh] overflow-hidden z-10 grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* LEFT SIDE: Paper Preview (2 cols) */}
              <div className="md:col-span-2 bg-white text-slate-900 p-8 rounded-2xl border border-slate-200/80 shadow-sm overflow-y-auto max-h-[80vh] space-y-6">
                {/* Sheet header */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-5">
                  <div>
                    {companyInfo.logoUrl ? (
                      <img src={companyInfo.logoUrl} alt="Logo" className="h-10 object-contain mb-2" referrerPolicy="no-referrer" />
                    ) : (
                      <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1">
                        CRM <span style={{ color: pdfThemeColor }}>IA PRO</span>
                      </h2>
                    )}
                    <p className="text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">{companyInfo.companyName || 'Sua Empresa comercial'}</p>
                  </div>

                  <div className="text-right">
                    <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest" style={{ color: pdfThemeColor }}>{pdfTitle}</h3>
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded block mt-1">
                      {selectedProposalForPrint.number}
                    </span>
                  </div>
                </div>

                {/* Client Info */}
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-700">
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">Emitido Para:</span>
                    <p className="font-extrabold text-sm text-slate-900 mt-1">{selectedProposalForPrint.clientName}</p>
                    <p className="mt-0.5 text-slate-400">Destinatário Comercial Ativo</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">Datas de Emissão:</span>
                    <p className="mt-1">Emitido em: {selectedProposalForPrint.createdAt.split('-').reverse().join('/')}</p>
                    <p className="font-bold mt-0.5" style={{ color: pdfThemeColor }}>Válido até: {selectedProposalForPrint.validity.split('-').reverse().join('/')}</p>
                  </div>
                </div>

                {/* Structured Sections Description */}
                {pdfIncludeSections ? (
                  <div className="space-y-4 my-6">
                    {(() => {
                      const sections = parseDescription(selectedProposalForPrint.description);
                      const isLegacy = !sections.escopo && !sections.prazos && !sections.termos;

                      if (isLegacy) {
                        return (
                          <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 leading-relaxed italic border-l-4 whitespace-pre-wrap" style={{ borderLeftColor: pdfThemeColor }}>
                            {sections.objetivo}
                          </div>
                        );
                      }

                      return (
                        <>
                          {sections.objetivo && (
                            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                              <span className="font-extrabold text-[9px] uppercase tracking-widest block mb-1.5" style={{ color: pdfThemeColor }}>1. Objetivo da Proposta</span>
                              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{sections.objetivo}</p>
                            </div>
                          )}
                          {sections.escopo && (
                            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                              <span className="font-extrabold text-[9px] uppercase tracking-widest block mb-1.5" style={{ color: pdfThemeColor }}>2. Escopo do Trabalho e Entregáveis</span>
                              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{sections.escopo}</p>
                            </div>
                          )}
                          {sections.prazos && (
                            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                              <span className="font-extrabold text-[9px] uppercase tracking-widest block mb-1.5" style={{ color: pdfThemeColor }}>3. Cronograma & Metodologia</span>
                              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{sections.prazos}</p>
                            </div>
                          )}
                          {sections.termos && (
                            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                              <span className="font-extrabold text-[9px] uppercase tracking-widest block mb-1.5" style={{ color: pdfThemeColor }}>4. Condições e Acordo Comercial</span>
                              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{sections.termos}</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  selectedProposalForPrint.description && (
                    <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 leading-relaxed italic border-l-4 whitespace-pre-wrap" style={{ borderLeftColor: pdfThemeColor }}>
                      {selectedProposalForPrint.description.replace(/\[(OBJETIVO|ESCOPO|PRAZOS|TERMOS)\]/gi, '')}
                    </div>
                  )
                )}

                {/* Services Table list */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-[9px] text-slate-400 uppercase tracking-widest border-b pb-1">Descritivo de Valores</h4>
                  <div className="divide-y divide-slate-100 text-xs">
                    {selectedProposalForPrint.services.map((srv, i) => (
                      <div key={i} className="py-2 flex justify-between items-center">
                        <span className="font-bold text-slate-800">{srv.name}</span>
                        <span className="font-extrabold font-mono text-slate-950">{formatBRL(srv.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calculation Summary */}
                <div className="my-6 border-t pt-4 text-xs flex flex-col items-end space-y-1.5 text-slate-700">
                  <div className="flex justify-between w-64">
                    <span>Soma dos Serviços:</span>
                    <span className="font-mono font-bold">{formatBRL(selectedProposalForPrint.services.reduce((s, x) => s + x.price, 0))}</span>
                  </div>
                  {selectedProposalForPrint.discount > 0 && (
                    <div className="flex justify-between w-64 text-red-500 font-semibold">
                      <span>Desconto Concedido:</span>
                      <span className="font-mono">- {formatBRL(selectedProposalForPrint.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between w-64 border-t pt-2 text-md font-black text-slate-900">
                    <span>Valor Líquido:</span>
                    <span className="font-mono text-lg font-black" style={{ color: pdfThemeColor }}>{formatBRL(selectedProposalForPrint.value)}</span>
                  </div>
                </div>

                {/* Signature lines */}
                {pdfIncludeSignatures && (
                  <div className="grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-dashed text-[10px] text-center text-slate-500">
                    <div className="space-y-1">
                      <div className="border-b w-full h-8"></div>
                      <span>Assinatura do Consultor Comercial</span>
                    </div>
                    <div className="space-y-1">
                      <div className="border-b w-full h-8"></div>
                      <span>Assinatura do Destinatário (Aceitante)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT SIDE: CUSTOMIZATION DASHBOARD PANEL (1 col) */}
              <div className="md:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between max-h-[80vh] overflow-y-auto">
                <div className="space-y-5">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                      Personalizar PDF Premium
                    </h4>
                    <p className="text-[10px] text-slate-400">Configure o design visual do documento comercial para exportação imediata.</p>
                  </div>

                  {/* Theme Color Picker Selector */}
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Cor de Destaque da Marca</label>
                    <div className="flex gap-2">
                      {[
                        { hex: '#4f46e5', label: 'Índigo' },
                        { hex: '#10b981', label: 'Esmeralda' },
                        { hex: '#3b82f6', label: 'Corporativo' },
                        { hex: '#ef4444', label: 'Rubi' },
                        { hex: '#475569', label: 'Slate' }
                      ].map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setPdfThemeColor(c.hex)}
                          className="w-7 h-7 rounded-full border-2 transition-transform cursor-pointer hover:scale-110 flex items-center justify-center"
                          style={{
                            backgroundColor: c.hex,
                            borderColor: pdfThemeColor === c.hex ? '#000000' : 'transparent'
                          }}
                          title={c.label}
                        >
                          {pdfThemeColor === c.hex && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Document Title input */}
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Título do Documento</label>
                    <input
                      type="text"
                      value={pdfTitle}
                      onChange={(e) => setPdfTitle(e.target.value)}
                      placeholder="PROPOSTA COMERCIAL"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs focus:outline-none"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Incluir Assinaturas</span>
                      <input
                        type="checkbox"
                        checked={pdfIncludeSignatures}
                        onChange={(e) => setPdfIncludeSignatures(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Exibir Seções do Escopo</span>
                      <input
                        type="checkbox"
                        checked={pdfIncludeSections}
                        onChange={(e) => setPdfIncludeSections(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Final download / close actions */}
                <div className="space-y-2 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => generatePremiumPDF(selectedProposalForPrint)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-extrabold text-xs transition-colors cursor-pointer shadow-lg shadow-indigo-500/10"
                    style={{ backgroundColor: pdfThemeColor }}
                  >
                    <Download size={14} /> Download PDF Exportado
                  </button>

                  <button
                    onClick={handlePrint}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-4 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    <Printer size={13} /> Imprimir Cópia Rápida
                  </button>

                  <button
                    onClick={() => setSelectedProposalForPrint(null)}
                    className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer text-center"
                  >
                    Fechar Visualizador
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE FORM */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col z-10 p-6 border-l border-slate-200 dark:border-slate-900 overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-900 mb-6">
                <h3 className="text-md font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {editingProposalId ? 'Editar Proposta Comercial' : 'Gerar Proposta Comercial'}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                {errorMsg && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 rounded-lg flex items-center gap-2">
                    <ShieldAlert size={14} />
                    <span>{errorMsg}</span>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Destinatário da Proposta *</label>
                  <select
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 focus:outline-none font-bold text-xs"
                  >
                    <option value="">Selecione um lead ou cliente...</option>
                    {recipients.map((r) => (
                      <option key={r.id} value={r.id}>
                        [{r.type}] {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Validade da Proposta</label>
                    <input
                      type="date"
                      required
                      value={validity}
                      onChange={(e) => setValidity(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Desconto Concedido (R$)</label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Tipo de Contrato</label>
                    <select
                      value={contractType}
                      onChange={(e) => setContractType(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-bold text-xs"
                    >
                      <option value="Fixo">Fixo (Projeto Único)</option>
                      <option value="Recorrente">Recorrente (Mensalidade)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Condições de Pagamento</label>
                    <select
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-bold text-xs"
                    >
                      <option value="A vista">À Vista (100%)</option>
                      <option value="50/50">50% Início / 50% Entrega</option>
                      <option value="Mensal">Mensal (Recorrência)</option>
                      <option value="Personalizado">Personalizado (Ver Descrição)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 p-3 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                  <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
                    <label className="block text-[10px] uppercase font-extrabold text-indigo-600 dark:text-indigo-400">Modelo Predefinido</label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-2 py-1 text-[10px] focus:outline-none font-bold animate-pulse-once"
                    >
                      <option value="custom">✏️ Personalizado (Em Branco)</option>
                      <option value="software">💻 Tecnologia / Desenvolvimento Software</option>
                      <option value="consulting">📊 Consultoria & Assessoria</option>
                      <option value="marketing">🎯 Marketing Digital / Gestão Tráfego</option>
                      <option value="support">🛠️ Suporte Técnico / Backup Mensal</option>
                      <option value="crm_training">🎓 Implantação de CRM & Treinamento Comercial</option>
                      <option value="branding">🎨 Branding, Identidade Visual & Brand Guidelines</option>
                    </select>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">1. Objetivo Geral / Introdução *</label>
                      <textarea
                        rows={2}
                        required
                        value={objetivo}
                        onChange={(e) => setObjetivo(e.target.value)}
                        placeholder="Descreva o propósito da proposta de maneira clara..."
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">2. Escopo e Entregáveis *</label>
                      <textarea
                        rows={2}
                        required
                        value={escopo}
                        onChange={(e) => setEscopo(e.target.value)}
                        placeholder="Liste detalhadamente os módulos ou entregas incluídos..."
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">3. Metodologia e Prazos</label>
                      <textarea
                        rows={2}
                        value={prazos}
                        onChange={(e) => setPrazos(e.target.value)}
                        placeholder="Ex: Entrega total em 60 dias dividido em 2 etapas..."
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">4. Termos e Condições Comerciais</label>
                      <textarea
                        rows={2}
                        value={termos}
                        onChange={(e) => setTermos(e.target.value)}
                        placeholder="Ex: Faturamento pós-entrega ou 50% de entrada..."
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Services Add Section */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/40 dark:border-slate-800/40 space-y-3">
                  <h4 className="font-extrabold text-[10px] text-indigo-500 uppercase tracking-widest">Incluir Serviços / Módulos</h4>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Nome do Módulo/Serviço</label>
                      <input
                        type="text"
                        placeholder="Ex: Integração de WhatsApp API"
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Preço (R$)</label>
                      <input
                        type="number"
                        placeholder="2500"
                        value={servicePrice}
                        onChange={(e) => setServicePrice(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddService}
                    className="w-full py-1.5 px-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                  >
                    Adicionar Serviço ao Orçamento
                  </button>

                  {/* List of services currently in form */}
                  <div className="divide-y divide-slate-200/40 dark:divide-slate-800/40 text-[11px] font-semibold pt-2">
                    {services.map((srv, idx) => (
                      <div key={idx} className="py-2 flex justify-between items-center text-slate-600 dark:text-slate-300">
                        <span className="truncate max-w-[250px]">{srv.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-900 dark:text-white">{formatBRL(srv.price)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveService(idx)}
                            className="text-red-500 hover:underline text-[9px]"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                  >
                    Salvar e Gerar Proposta
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="py-2.5 px-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!itemToDeleteId}
        title="Excluir Proposta"
        message="Deseja realmente remover esta proposta comercial? Informe uma justificativa para prosseguir."
        onConfirm={async (justification) => {
          if (itemToDeleteId) {
            const prop = propostas.find(p => p.id === itemToDeleteId);
            if (prop) {
              await onDeleteProposta(itemToDeleteId, justification, prop);
            }
          }
          setItemToDeleteId(null);
        }}
        onCancel={() => setItemToDeleteId(null)}
      />
    </div>
  );
}
