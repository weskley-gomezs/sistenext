import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Rocket, 
  Shield, 
  Activity, 
  TrendingUp, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  ChevronRight, 
  Zap, 
  DollarSign, 
  Users, 
  Award, 
  HelpCircle, 
  ArrowRight, 
  Layout, 
  MessageSquare, 
  Briefcase, 
  ChevronDown,
  Database,
  Lock,
  Globe,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const nexusErpLogo = 'https://i.imgur.com/BewcRiJ.png';

interface LandingPageViewProps {
  onEnterCRM: () => void;
}

export default function LandingPageView({ onEnterCRM }: LandingPageViewProps) {
  // Calculator States
  const [leadsCount, setLeadsCount] = useState<number>(150);
  const [conversionRate, setConversionRate] = useState<number>(3); // in %
  const [avgTicket, setAvgTicket] = useState<number>(2500); // in BRL

  // Interactive Tab for CRM Feature Preview
  const [activeTab, setActiveTab] = useState<'pipeline' | 'contracts' | 'finance' | 'team'>('pipeline');

  // Pricing Toggle State (not needed anymore, but we can keep a simpler version or remove it)
  // Let's use a countdown state to simulate high-tech scarcity
  const [promoTimeLeft, setPromoTimeLeft] = useState<string>("04h 21m 18s");

  // Accordion FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Decorative live stats (updates occasionally to feel high-tech and dynamic)
  const [liveUsers, setLiveUsers] = useState<number>(1420);
  const [proposalsSent, setProposalsSent] = useState<number>(28491);

  useEffect(() => {
    // Promo Timer Countdown
    const timer = setInterval(() => {
      const now = new Date();
      const hours = 23 - now.getHours();
      const minutes = 59 - now.getMinutes();
      const seconds = 59 - now.getSeconds();
      setPromoTimeLeft(
        `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
      );
    }, 1000);

    const interval = setInterval(() => {
      setLiveUsers(prev => prev + Math.floor(Math.random() * 3) - 1);
      setProposalsSent(prev => prev + (Math.random() > 0.7 ? 1 : 0));
    }, 4000);
    return () => {
      clearInterval(timer);
      clearInterval(interval);
    };
  }, []);

  // Calculate simulated outcomes
  const estimatedRevenue = leadsCount * (conversionRate / 100) * avgTicket;
  const hoursSaved = Math.round(leadsCount * 0.8 + (leadsCount * (conversionRate / 100) * 4));
  const estimatedROIMultiplier = Math.min(10000, Math.max(5, (estimatedRevenue / 29.90)));

  const handleToggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Dynamic Technological Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[800px] right-10 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[1200px] left-10 w-[450px] h-[450px] bg-blue-500/5 rounded-full blur-[110px] pointer-events-none" />

      {/* High-tech Header Navigation */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800 shadow-md">
              <img src={nexusErpLogo} alt="SisteNext Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <span className="text-lg font-black tracking-tight text-white">
              Siste<span className="text-indigo-400">Next</span> <span className="font-mono text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded ml-1 tracking-widest uppercase">CRM</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <a href="#features" className="hover:text-white transition-colors">Recursos</a>
            <a href="#simulator" className="hover:text-white transition-colors">Simulador</a>
            <a href="#pricing" className="hover:text-white transition-colors">Planos</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            {/* Live Counter (Tech Accent) */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-900/50 border border-slate-800 rounded-full font-mono text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              <span>{liveUsers} OPERAÇÕES ATIVAS AGORA</span>
            </div>

            <button 
              onClick={onEnterCRM}
              className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs tracking-wider uppercase transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 cursor-pointer"
            >
              Acessar CRM <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <section className="relative pt-20 pb-24 px-6 max-w-7xl mx-auto text-center">
        {/* Floating Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/5 border border-indigo-500/20 rounded-full mb-6">
          <Sparkles size={14} className="text-indigo-400" />
          <span className="text-[10px] font-mono tracking-widest text-indigo-300 uppercase font-black">Plataforma CRM de Nova Geração</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-tight md:leading-none">
          O Sistema de Vendas Mais <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            Avançado e Tecnológico
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-slate-400 text-sm md:text-lg max-w-3xl mx-auto mt-6 leading-relaxed">
          Gerencie leads, empresas, propostas comerciais dinâmicas, contratos digitais com conversão em cascata automatizada, fluxo de caixa e relatórios analíticos em uma interface de alta performance.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={onEnterCRM}
            className="w-full sm:w-auto py-4 px-8 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-sm transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer group"
          >
            Começar Agora <Zap size={16} className="group-hover:scale-110 transition-transform" />
          </button>
          <a 
            href="#simulator"
            className="w-full sm:w-auto py-4 px-8 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
          >
            Simular Retorno <Activity size={16} />
          </a>
        </div>

        {/* Real-time stats display */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl mx-auto">
          <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-xl backdrop-blur-sm">
            <span className="block font-mono text-2xl md:text-3xl font-black text-white">R$ 48M+</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1 block">Faturados via CRM</span>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-xl backdrop-blur-sm">
            <span className="block font-mono text-2xl md:text-3xl font-black text-indigo-400">
              {proposalsSent.toLocaleString('pt-BR')}
            </span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1 block">Propostas Emitidas</span>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-xl backdrop-blur-sm">
            <span className="block font-mono text-2xl md:text-3xl font-black text-emerald-400">99.8%</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1 block">Uptime do Motor Cloud</span>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-xl backdrop-blur-sm">
            <span className="block font-mono text-2xl md:text-3xl font-black text-purple-400">0%</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1 block">Perda de Histórico</span>
          </div>
        </div>
      </section>

      {/* Interactive Feature Preview Tabs Section */}
      <section id="features" className="py-20 bg-slate-950/60 border-y border-slate-900 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              Uma Suíte Completa de Alta Tecnologia
            </h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              Descubra por que o SisteNext é o CRM preferido para agências, consultorias e empresas de tecnologia modernas.
            </p>
          </div>

          {/* Interactive Switcher */}
          <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-slate-900/50 border border-slate-800 rounded-xl max-w-2xl mx-auto">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pipeline' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp size={14} /> Funil Inteligente
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'contracts' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText size={14} /> Contratos Digitais
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'finance' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign size={14} /> Financeiro Integrado
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'team' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users size={14} /> Gestão de Equipe
            </button>
          </div>

          {/* Tab Viewport - Simulated App Screen with high-tech details */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 md:p-8 rounded-2xl max-w-5xl mx-auto relative overflow-hidden backdrop-blur-md shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-10 bg-slate-900/80 border-b border-slate-800/80 px-4 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
              </div>
              <div className="mx-auto text-[9px] font-mono text-slate-500 bg-slate-950/50 px-4 py-0.5 rounded border border-slate-800">
                app.sistenext.com.br/crm/{activeTab}
              </div>
            </div>

            <div className="mt-6 min-h-[300px] flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 space-y-4">
                {activeTab === 'pipeline' && (
                  <div className="space-y-4 text-left">
                    <span className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded">
                      PIPELINE DE VENDAS
                    </span>
                    <h3 className="text-xl md:text-2xl font-black text-white">Funil Comercial Dinâmico</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Gerencie suas oportunidades comerciais sem esforço. Aloque cada lead em colunas como <span className="text-indigo-400">Contato</span>, <span className="text-indigo-400">Qualificado</span>, <span className="text-indigo-400">Proposta</span> e <span className="text-indigo-400">Negociação</span>. Adicione histórico de follow-ups direto no registro do lead com lembretes automáticos na agenda.
                    </p>
                    <div className="pt-2 grid grid-cols-2 gap-4">
                      <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/50">
                        <span className="text-[10px] text-slate-500 font-bold block">FLUIDEZ</span>
                        <span className="text-xs text-white font-medium">Fácil arrastar e soltar status</span>
                      </div>
                      <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/50">
                        <span className="text-[10px] text-slate-500 font-bold block">FOLLOW-UPS</span>
                        <span className="text-xs text-white font-medium">Anotação com data de próxima ação</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'contracts' && (
                  <div className="space-y-4 text-left">
                    <span className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded">
                      AUTOMATION ENGINE
                    </span>
                    <h3 className="text-xl md:text-2xl font-black text-white">Fluxo de Conversão em Cascata</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Quando uma proposta comercial é aceita pelo cliente, o SisteNext gera <span className="text-indigo-400 font-bold">em cascata</span> o contrato digital correspondente, o projeto operacional com checklist predefinido, a agenda de kick-off comercial e a entrada no fluxo de caixa (contas a receber). Tudo sem um único clique extra.
                    </p>
                    <div className="pt-2 grid grid-cols-2 gap-4">
                      <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/50">
                        <span className="text-[10px] text-slate-500 font-bold block">DIGITALIZAÇÃO</span>
                        <span className="text-xs text-white font-medium">Contratos elegantes prontos para PDF</span>
                      </div>
                      <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/50">
                        <span className="text-[10px] text-slate-500 font-bold block">INTEGRAÇÃO ASAAS</span>
                        <span className="text-xs text-white font-medium">Sincronização opcional com assinaturas</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'finance' && (
                  <div className="space-y-4 text-left">
                    <span className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded">
                      FINANCE MANAGER
                    </span>
                    <h3 className="text-xl md:text-2xl font-black text-white">Controle de Fluxo de Caixa</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Gerencie suas contas a pagar e a receber. O dashboard financeiro calcula o faturamento mensal esperado, a inadimplência, as receitas confirmadas e projeta os lucros com base nas propostas ganhas. Suporta múltiplas formas de pagamento (Pix, Boleto, Cartão de Crédito).
                    </p>
                    <div className="pt-2 grid grid-cols-2 gap-4">
                      <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/50">
                        <span className="text-[10px] text-slate-500 font-bold block">SAÚDE FINANCEIRA</span>
                        <span className="text-xs text-white font-medium">Lucratividade e margens em tempo real</span>
                      </div>
                      <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/50">
                        <span className="text-[10px] text-slate-500 font-bold block">CATEGORIAS</span>
                        <span className="text-xs text-white font-medium">Classificação dinâmica de gastos</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'team' && (
                  <div className="space-y-4 text-left">
                    <span className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded">
                      TEAM COLLABORATION
                    </span>
                    <h3 className="text-xl md:text-2xl font-black text-white">Controle e Auditoria por Membros</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Adicione vendedores e consultores à equipe. Atribua metas, controle permissões e acompanhe as atividades por meio de logs de auditoria automáticos em formato imutável. Vendedores enxergam apenas seus próprios leads, garantindo segurança corporativa total.
                    </p>
                    <div className="pt-2 grid grid-cols-2 gap-4">
                      <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/50">
                        <span className="text-[10px] text-slate-500 font-bold block">LGPD READY</span>
                        <span className="text-xs text-white font-medium">Vendedores isolados em seus dados</span>
                      </div>
                      <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/50">
                        <span className="text-[10px] text-slate-500 font-bold block">AUDIT TRAIL</span>
                        <span className="text-xs text-white font-medium">Justificativa obrigatória para exclusão</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Graphic Simulator Panel (Interactive UI Illustration) */}
              <div className="flex-1 w-full bg-slate-950/80 border border-slate-800 p-5 rounded-xl font-mono text-[11px] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="font-bold text-slate-200">Painel SisteNext Live</span>
                  </div>
                  <span className="text-slate-500 text-[9px]">Sincronizado: 2026/07/13</span>
                </div>

                {activeTab === 'pipeline' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded border border-slate-800/30">
                      <div>
                        <span className="text-slate-400 font-bold">🎯 Lead: Acme Corp</span>
                        <span className="block text-[10px] text-slate-500">Valor Estimado: R$ 12.000,00</span>
                      </div>
                      <span className="bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded text-[9px] uppercase font-bold">Proposta</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded border border-slate-800/30">
                      <div>
                        <span className="text-slate-400 font-bold">📞 Follow-up Registrado</span>
                        <span className="block text-[10px] text-slate-500">"Ligação para alinhar cronograma de entrega"</span>
                      </div>
                      <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded text-[9px] uppercase font-bold">FONE</span>
                    </div>
                    {/* Simulated pipeline columns indicators */}
                    <div className="grid grid-cols-4 gap-1 pt-1.5 text-center text-[9px]">
                      <div className="bg-slate-900 px-1 py-1 rounded text-slate-400">Contat. (4)</div>
                      <div className="bg-slate-900 px-1 py-1 rounded text-slate-400">Qualif. (2)</div>
                      <div className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-1 py-1 rounded">Propos. (1)</div>
                      <div className="bg-slate-900 px-1 py-1 rounded text-slate-400">Ganho (18)</div>
                    </div>
                  </div>
                )}

                {activeTab === 'contracts' && (
                  <div className="space-y-3">
                    <div className="bg-slate-900/40 p-2 rounded border border-slate-800/30 text-slate-400 space-y-1">
                      <div className="flex justify-between font-bold text-white text-[10px]">
                        <span>PROPOSTA #391</span>
                        <span className="text-emerald-400 uppercase">ACEITA</span>
                      </div>
                      <div>Serviço: Desenvolvimento SaaS Core</div>
                      <div>Valor: R$ 45.000,00</div>
                    </div>
                    <div className="text-[10px] space-y-1.5 text-slate-500">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 size={12} /> Contrato comercial auto-gerado e pronto para PDF
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 size={12} /> Projeto criado com 6 etapas de homologação
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 size={12} /> Fatura pendente de R$ 45.000 gerada no Financeiro
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'finance' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-900 p-2 rounded text-center">
                        <span className="text-[9px] text-slate-500 block">FATURADO</span>
                        <span className="text-white font-bold text-[10px]">R$ 84.190</span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded text-center">
                        <span className="text-[9px] text-slate-500 block">RECEITAS EST.</span>
                        <span className="text-indigo-400 font-bold text-[10px]">R$ 112.500</span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded text-center">
                        <span className="text-[9px] text-slate-500 block">GASTOS</span>
                        <span className="text-rose-400 font-bold text-[10px]">R$ 12.400</span>
                      </div>
                    </div>
                    {/* Simulated financial line */}
                    <div className="bg-slate-900/40 p-2 rounded border border-slate-800/30 flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-bold">Acme Corp - SaaS Core</span>
                      <span className="text-emerald-400 font-mono">+ R$ 45.000,00</span>
                    </div>
                    <div className="bg-slate-900/40 p-2 rounded border border-slate-800/30 flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-bold">Hospedagem Cloud Vercel</span>
                      <span className="text-rose-400 font-mono">- R$ 1.200,00</span>
                    </div>
                  </div>
                )}

                {activeTab === 'team' && (
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold text-slate-300">Auditoria Comercial Recente:</div>
                    <div className="space-y-2 text-[9px] text-slate-400">
                      <div className="p-1.5 bg-slate-900 rounded border border-slate-800/50">
                        <div className="flex justify-between text-[10px] font-bold text-slate-200">
                          <span>DELETE</span>
                          <span className="text-slate-500">Há 5m</span>
                        </div>
                        <div>Coleção: <strong className="text-slate-300">leads</strong> | Por: carla.sales@sistenext.com</div>
                        <div>Justificativa: <em className="text-indigo-400">"Lead duplicado criado incorretamente"</em></div>
                      </div>
                      <div className="p-1.5 bg-slate-900 rounded border border-slate-800/50">
                        <div className="flex justify-between text-[10px] font-bold text-slate-200">
                          <span>UPDATE</span>
                          <span className="text-slate-500">Há 1h</span>
                        </div>
                        <div>Coleção: <strong className="text-slate-300">propostas</strong> | Por: marcos.admin@sistenext.com</div>
                        <div>Alteração: <em className="text-indigo-400">Desconto de 10% aprovado pelo gestor</em></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Productivity Multiplier Calculator Section */}
      <section id="simulator" className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full font-mono text-[9px] uppercase font-bold tracking-wider">
              <Activity size={12} /> ROI CALCULATOR
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
              Calcule Seu Multiplicador de Eficiência Comercial
            </h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              Arraste os sliders para configurar as métricas atuais da sua empresa e veja como a automação em cascata do SisteNext economiza tempo e aumenta sua receita estimada de faturamento de forma instantânea.
            </p>
            <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-900 space-y-3">
              <div className="flex gap-3 text-xs">
                <CheckCircle2 size={16} className="text-indigo-400 shrink-0" />
                <span className="text-slate-300 font-medium">Processos comerciais estruturados sem planilhas soltas.</span>
              </div>
              <div className="flex gap-3 text-xs">
                <CheckCircle2 size={16} className="text-indigo-400 shrink-0" />
                <span className="text-slate-300 font-medium">Lembretes automáticos para zero esquecimento de follow-ups.</span>
              </div>
            </div>
          </div>

          {/* Right Interactive Card */}
          <div className="lg:col-span-7 bg-slate-900/40 border border-slate-900 p-6 md:p-8 rounded-2xl backdrop-blur-md shadow-xl space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap size={18} className="text-indigo-400" /> Parâmetros de Venda do seu Negócio
            </h3>

            {/* Sliders */}
            <div className="space-y-6">
              {/* Leads Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-semibold">Leads Gerados / Mês</span>
                  <span className="font-mono text-indigo-400 font-black">{leadsCount} leads</span>
                </div>
                <input 
                  type="range" 
                  min="20" 
                  max="1000" 
                  step="10"
                  value={leadsCount}
                  onChange={(e) => setLeadsCount(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Conversion Rate Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-semibold">Taxa de Conversão Comercial</span>
                  <span className="font-mono text-indigo-400 font-black">{conversionRate}%</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="30" 
                  step="1"
                  value={conversionRate}
                  onChange={(e) => setConversionRate(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Avg Ticket Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-semibold">Ticket Médio dos Projetos / Vendas</span>
                  <span className="font-mono text-indigo-400 font-black">R$ {avgTicket.toLocaleString('pt-BR')}</span>
                </div>
                <input 
                  type="range" 
                  min="500" 
                  max="20000" 
                  step="500"
                  value={avgTicket}
                  onChange={(e) => setAvgTicket(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Simulated Output Panel */}
            <div className="bg-slate-950 border border-slate-900 p-5 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center sm:text-left space-y-1">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Faturamento Estimado</span>
                <span className="font-mono text-lg font-black text-white">
                  R$ {estimatedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] text-indigo-400/80 block font-mono">Convertido via Funil</span>
              </div>
              <div className="text-center sm:text-left space-y-1">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Horas Economizadas / Mês</span>
                <span className="font-mono text-lg font-black text-emerald-400">
                  ~ {hoursSaved}h
                </span>
                <span className="text-[9px] text-slate-500 block">Eliminando cliques repetitivos</span>
              </div>
              <div className="text-center sm:text-left space-y-1">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Multiplicador ROI</span>
                <span className="font-mono text-lg font-black text-purple-400">
                  {estimatedROIMultiplier.toFixed(1)}x
                </span>
                <span className="text-[9px] text-slate-500 block">Retorno sob investimento</span>
              </div>
            </div>

            <div className="text-center">
              <button 
                onClick={onEnterCRM}
                className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-lg text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Acessar CRM & Começar a Escalar <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Matrix Section - High Tech Single Plan */}
      <section id="pricing" className="py-24 bg-slate-950 border-t border-slate-900 px-6 relative overflow-hidden">
        {/* Tech Background Accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-12 relative z-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest bg-indigo-500/5 border border-indigo-500/10 px-2.5 py-1 rounded">
              OFFER_PROTOCOL: SECURE_ACCESS
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              Acesso Total por um Preço Único
            </h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              Liberamos todas as funcionalidades de automação em cascata, CRM e financeiro em um único plano simplificado e altamente acessível.
            </p>

            {/* Scarcity Countdown Timer */}
            <div className="flex flex-col items-center gap-2 pt-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 border border-indigo-500/20 rounded-xl">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-black">Expira em:</span>
                <span className="text-sm font-mono text-indigo-400 font-black tracking-tighter">
                  {promoTimeLeft}
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-600 uppercase font-bold tracking-widest">Oferta de Lançamento Ativa</span>
            </div>
          </div>

          {/* Single High-Tech Plan Card */}
          <div className="max-w-md mx-auto">
            <div className="bg-slate-900 border-2 border-indigo-600 p-8 md:p-10 rounded-3xl space-y-8 transition-all relative shadow-2xl shadow-indigo-600/10 group">
              {/* Animated corner accents */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-indigo-400 rounded-tl-xl opacity-50" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-indigo-400 rounded-br-xl opacity-50" />

              <div className="space-y-6 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white rounded-full text-[9px] font-mono font-black uppercase tracking-widest">
                  <Star size={10} fill="currentColor" /> Full Experience
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white">Plano SisteNext Pro</h3>
                  <p className="text-xs text-slate-400">Toda a inteligência do sistema sem restrições de uso ou limites de leads.</p>
                </div>
                
                <div className="py-6 border-y border-slate-800 font-mono">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-slate-500 text-sm font-bold line-through">R$ 299,00</span>
                    <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">90% OFF</span>
                  </div>
                  <div className="flex items-center justify-center mt-1">
                    <span className="text-slate-400 text-lg font-bold">R$</span>
                    <span className="text-6xl font-black text-white mx-2">29,90</span>
                    <div className="text-left">
                      <span className="text-slate-500 text-[10px] uppercase block font-bold">por</span>
                      <span className="text-slate-500 text-[10px] uppercase block font-bold">mês</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 text-left">
                  {[
                    "Leads e Empresas Ilimitadas",
                    "Automação em Cascata (Contrato + Projeto)",
                    "Financeiro com Fluxo de Caixa Real",
                    "Relatórios Analíticos de Performance",
                    "Acesso para até 5 Membros da Equipe",
                    "Backup em Tempo Real em Nuvem",
                    "Suporte Prioritário 24/7"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs text-slate-300">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={12} className="text-indigo-400" />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={onEnterCRM}
                className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-sm transition-all tracking-wider uppercase cursor-pointer shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 group-hover:scale-[1.02]"
              >
                Ativar Minha Licença Pro <ArrowRight size={16} />
              </button>
              
              <p className="text-[10px] text-center text-slate-500 font-mono">
                Pagamento seguro via Stripe / Asaas. Cancele quando quiser.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions accordion section */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded">
            DÚVIDAS FREQUENTES
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white">Perguntas Respondidas</h2>
          <p className="text-xs md:text-sm text-slate-400">
            Confira as respostas das principais perguntas que recebemos dos nossos parceiros comerciais.
          </p>
        </div>

        <div className="space-y-3.5">
          {[
            {
              q: "O que é o fluxo de conversão em cascata automatizada?",
              a: "É uma tecnologia inovadora do SisteNext. Ao aprovar uma proposta comercial, o sistema automaticamente gera o Contrato Jurídico do cliente, o Projeto contendo as entregas organizadas por checklist, bloqueia a agenda de Kick-off e insere a pendência financeira de contas a receber no fluxo de caixa. Você economiza tempo e garante zero falhas no onboarding do cliente."
            },
            {
              q: "Como funciona a segurança de dados por equipe comercial?",
              a: "O SisteNext possui isolamento nativo. Os vendedores cadastrados só enxergam as informações e leads gerados por eles mesmos ou distribuídos especificamente para eles. Somente o perfil do Administrador possui visibilidade geral de faturamento, propostas e histórico unificado, garantindo total conformidade de informações."
            },
            {
              q: "Posso cancelar ou migrar meu plano a qualquer momento?",
              a: "Sim, absolutamente. Não há nenhum período de fidelidade ou multa rescisória. O cancelamento pode ser feito de forma instantânea diretamente pelas configurações da plataforma."
            },
            {
              q: "O SisteNext faz backup automático?",
              a: "Sim, todos os dados são sincronizados em tempo real no Firestore utilizando armazenamento em nuvem redundante. Você também pode exportar um backup geral consolidado em formato JSON diretamente do painel de Configurações a qualquer momento para segurança local."
            }
          ].map((faq, idx) => (
            <div 
              key={idx} 
              className="bg-slate-900/30 border border-slate-900 rounded-xl overflow-hidden transition-colors"
            >
              <button
                onClick={() => handleToggleFaq(idx)}
                className="w-full p-5 text-left flex justify-between items-center font-bold text-xs md:text-sm text-white hover:text-indigo-400 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown 
                  size={16} 
                  className={`text-slate-500 transition-transform ${openFaq === idx ? 'rotate-180 text-indigo-400' : ''}`} 
                />
              </button>

              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="p-5 pt-0 border-t border-slate-900/50 text-xs text-slate-400 leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Tech-accent Footer section */}
      <footer className="bg-slate-950 border-t border-slate-900/80 px-6 py-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border border-slate-900 shadow">
              <img src={nexusErpLogo} alt="SisteNext Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <span className="font-extrabold text-slate-300 block">SisteNext CRM</span>
              <span className="text-[10px] text-slate-500">© 2026 SisteNext. Todos os direitos reservados.</span>
            </div>
          </div>

          <div className="flex gap-6 font-semibold uppercase tracking-wider text-[10px]">
            <a href="#features" className="hover:text-slate-300 transition-colors">Funcionalidades</a>
            <a href="#simulator" className="hover:text-slate-300 transition-colors">Calculadora</a>
            <a href="#pricing" className="hover:text-slate-300 transition-colors">Assinatura</a>
          </div>

          <div className="flex items-center gap-2 text-[10px] bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            <Lock size={12} className="text-indigo-400" />
            <span className="font-mono text-slate-400 uppercase font-bold">DADOS SEGUROS SSL / AES-256</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
