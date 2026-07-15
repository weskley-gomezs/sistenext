import React from 'react';
import {
  TrendingUp,
  Users,
  Target,
  FolderLock,
  Wallet,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ExternalLink,
  ChevronRight,
  PieChart,
  BadgeDollarSign,
  Bell,
  BellRing,
  Video
} from 'lucide-react';
import { motion } from 'motion/react';
import { Lead, Cliente, Projeto, Proposta, Financeiro, EventAgenda, FollowUp, MembroEquipe } from '../types';
import { NotificationService } from '../utils/notificationService';

interface DashboardViewProps {
  leads: Lead[];
  clientes: Cliente[];
  projetos: Projeto[];
  propostas: Proposta[];
  financeiro: Financeiro[];
  agenda: EventAgenda[];
  followUps: FollowUp[];
  config?: any;
  membros?: MembroEquipe[];
  userEmail?: string;
  onNavigate: (section: any) => void;
}

export default function DashboardView({
  leads,
  clientes,
  projetos,
  propostas,
  financeiro,
  agenda,
  followUps,
  config,
  membros = [],
  userEmail,
  onNavigate
}: DashboardViewProps) {
  // 0. Real-time Clock
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [notificationPermission, setNotificationPermission] = React.useState<NotificationPermission>(
    NotificationService.permission
  );

  const requestPermission = async () => {
    const permission = await NotificationService.requestPermission();
    setNotificationPermission(permission);
  };

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const year = currentTime.getFullYear();
  const month = String(currentTime.getMonth() + 1).padStart(2, '0');
  const day = String(currentTime.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  const getEventMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const todayEvents = agenda
    .filter((event) => event.date === todayStr)
    .map((event) => {
      const eventMinutes = getEventMinutes(event.time);
      const diff = eventMinutes - currentMinutes;
      
      const isPending = event.status === 'Pendente' || !event.status;
      
      // An event is imminent if starts in next 30 mins, or started up to 15 mins ago
      const isImminent = isPending && diff >= -15 && diff <= 30;
      const isOngoing = isPending && diff >= -15 && diff < 0;

      return {
        ...event,
        diff,
        isImminent,
        isOngoing,
        eventMinutes,
        isPending
      };
    })
    .sort((a, b) => a.eventMinutes - b.eventMinutes);

  const hasImminent = todayEvents.some((e) => e.isImminent);

  // 1. Calculations & Metrics
  const totalLeads = leads.length;
  const activeClients = clientes.filter((c) => c.status === 'Ativo').length;
  const runningProjects = projetos.filter((p) => p.status !== 'Concluído').length;
  const pendingProposals = propostas.filter((p) => p.status === 'Pendente').length;

  // Valor em negociações (Status like Negociação, Proposta Enviada, Diagnóstico)
  const negotiationStatuses = ['Diagnóstico', 'Proposta Enviada', 'Negociação', 'Interessado', 'Reunião Marcada'];
  const valueInNegotiation = leads
    .filter((l) => negotiationStatuses.includes(l.status))
    .reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

  // Valor vendido no mês
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0'); // "07"
  const currentYear = String(now.getFullYear()); // "2026"

  const soldThisMonth = financeiro
    .filter((f) => f.type === 'Receber' && f.date.includes(`${currentYear}-${currentMonth}`))
    .reduce((sum, f) => sum + f.value, 0);

  // Valor vendido no ano
  const soldThisYear = financeiro
    .filter((f) => f.type === 'Receber' && f.date.startsWith(currentYear))
    .reduce((sum, f) => sum + f.value, 0);

  const phoneContactsThisMonth = followUps.filter(f => 
    f.type === 'Ligação' && 
    f.date.includes(`${currentYear}-${currentMonth}`)
  ).length;

  // Next reunions (Agenda events with type 'Reunião')
  const upcomingReunions = agenda
    .filter((a) => a.type === 'Reunião')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  // Next follow-ups (Agenda events or custom followups with nextAction date in the future)
  const upcomingFollowups = agenda
    .filter((a) => a.type === 'Follow-up' || a.type === 'Ligação')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  // Last contacts (Follow-ups list)
  const recentContacts = [...followUps]
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
    .slice(0, 4);

  // 2. Data for Sales Source (Origin)
  const originCounts = leads.reduce((acc: Record<string, number>, lead) => {
    const src = lead.source || 'Não especificada';
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});

  const origins = Object.entries(originCounts).map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / (totalLeads || 1)) * 100)
  })).sort((a, b) => b.count - a.count);

  // 3. Sales Funnel Pipeline Stage Counts
  const stagesList = [
    { name: 'Novo', status: 'Novo Lead', color: 'bg-indigo-500' },
    { name: 'Contato', status: 'Contato Feito', color: 'bg-blue-500' },
    { name: 'Reunião', status: 'Reunião Marcada', color: 'bg-emerald-500' },
    { name: 'Diagnóstico', status: 'Diagnóstico', color: 'bg-teal-500' },
    { name: 'Proposta', status: 'Proposta Enviada', color: 'bg-amber-500' },
    { name: 'Negociação', status: 'Negociação', color: 'bg-orange-500' },
    { name: 'Fechado', status: 'Cliente', color: 'bg-green-500' }
  ];

  const pipelineStages = stagesList.map((stg) => {
    const count = leads.filter((l) => l.status === stg.status).length;
    return { ...stg, count };
  });

  // 4. Custom SVG Chart Monthly Data Helper
  // We'll generate realistic monthly data for 6 months
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'];
  const monthlyValues = [15000, 28000, 42000, 35000, 65000, 95000, soldThisMonth];

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto font-sans"
    >
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Painel Executivo
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Métricas de desempenho em tempo real para Venda de Sistemas e IA.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 shadow-sm text-xs font-mono font-medium text-slate-600 dark:text-slate-400">
          <Clock size={14} className="text-indigo-500" />
          <span>Fuso Horário: GMT-3</span>
        </div>
      </div>

      {/* Banner de Permissão de Notificação */}
      {notificationPermission === 'default' && (
        <motion.div
          variants={itemVariants}
          className="bg-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-600/20 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <BellRing size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Ative as Notificações do Sistema</h3>
              <p className="text-xs text-indigo-100 italic">Receba alertas de compromissos importantes mesmo com o CRM em segundo plano.</p>
            </div>
          </div>
          <button
            onClick={requestPermission}
            className="px-6 py-2 bg-white text-indigo-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-50 transition-all cursor-pointer whitespace-nowrap shadow-sm"
          >
            Permitir Notificações
          </button>
        </motion.div>
      )}

      {/* Alertas e Lembretes da Agenda */}
      <motion.div
        variants={itemVariants}
        className={`border rounded-2xl p-5 shadow-sm transition-all ${
          hasImminent
            ? 'bg-amber-500/10 dark:bg-amber-500/5 border-amber-400 dark:border-amber-600 shadow-amber-500/5'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/60'
        }`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800/60 mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl flex items-center justify-center ${
              hasImminent 
                ? 'bg-amber-500 text-white animate-bounce' 
                : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
            }`}>
              {hasImminent ? <BellRing size={18} /> : <Bell size={18} />}
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Alertas e Lembretes da Agenda
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Compromissos sincronizados para o dia de hoje ({currentTime.toLocaleDateString('pt-BR')})
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('agenda')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer self-end sm:self-auto"
          >
            Acessar Agenda Completa <ChevronRight size={14} />
          </button>
        </div>

        {todayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              📅 Agenda livre para hoje!
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-md">
              Não há compromissos ou reuniões agendadas para este dia. Use este tempo para prospectar novos leads ou avançar em seus projetos ativos.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayEvents.map((event) => {
              // Gracefully handle both EventAgenda and AgendaItem types
              const referenceName = event.linkedName || (event as any).relatedEntity || null;
              const meetingLink = (() => {
                if ((event as any).meetingUrl) return (event as any).meetingUrl;
                if (event.description && event.description.includes('http')) {
                  const match = event.description.match(/https?:\/\/[^\s]+/g);
                  if (match) return match[0];
                }
                return null;
              })();

              return (
                <div
                  key={event.id}
                  className={`border rounded-xl p-4 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                    event.isImminent
                      ? 'bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border-amber-400/80 dark:border-amber-500/50 relative overflow-hidden shadow-inner'
                      : !event.isPending
                      ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60'
                      : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/60 hover:border-indigo-500/40'
                  }`}
                >
                  {event.isImminent && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                  )}
                  
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Clock size={12} className="text-indigo-500" />
                        {event.time}
                      </span>
                      
                      {event.isImminent ? (
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-800 dark:text-amber-300 bg-amber-400/35 dark:bg-amber-400/20 px-2 py-0.5 rounded-full animate-pulse">
                          {event.isOngoing ? 'Em Andamento' : 'Acontece em instantes'}
                        </span>
                      ) : !event.isPending ? (
                        <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          event.status === 'Concluído'
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15'
                            : 'text-rose-700 dark:text-rose-300 bg-rose-500/15'
                        }`}>
                          {event.status}
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-700 dark:text-indigo-300 bg-indigo-500/15 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">
                          Hoje mais tarde
                        </span>
                      )}

                      <span className="text-[9px] font-black uppercase tracking-widest bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">
                        {event.type}
                      </span>
                    </div>

                    <h3 className={`text-sm font-black text-slate-900 dark:text-white truncate ${!event.isPending ? 'line-through' : ''}`}>
                      {event.title}
                    </h3>

                    {event.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                    )}

                    {referenceName && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        <Users size={12} />
                        <span>Referência: {referenceName}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
                    {meetingLink && event.isPending && (
                      <a
                        href={meetingLink}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase transition-all shadow-md shadow-rose-600/15"
                      >
                        <Video size={12} />
                        Entrar na Reunião
                      </a>
                    )}
                    
                    <button
                      onClick={() => onNavigate('agenda')}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase transition-all"
                    >
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Grid Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <motion.div
          variants={itemVariants}
          onClick={() => onNavigate('leads')}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/5 text-blue-600 dark:text-blue-400 rounded-xl">
              <Target size={20} />
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full font-semibold">
              Pipeline
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono leading-none">
              {totalLeads}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium flex items-center gap-1">
              Total de Leads Cadastrados
              <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-indigo-500" />
            </p>
          </div>
        </motion.div>

        {/* Metric 2 */}
        <motion.div
          variants={itemVariants}
          onClick={() => onNavigate('clientes')}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Users size={20} />
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
              Ativos
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono leading-none">
              {activeClients}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium flex items-center gap-1">
              Clientes Recorrentes
              <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-indigo-500" />
            </p>
          </div>
        </motion.div>

        {/* Metric 3 */}
        <motion.div
          variants={itemVariants}
          onClick={() => onNavigate('projetos')}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-indigo-500/10 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <FolderLock size={20} />
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full font-semibold">
              Projetos
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono leading-none">
              {runningProjects}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium flex items-center gap-1">
              Projetos em Andamento
              <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-indigo-500" />
            </p>
          </div>
        </motion.div>

        {/* Metric 4 */}
        <motion.div
          variants={itemVariants}
          onClick={() => onNavigate('propostas')}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-amber-500/10 dark:bg-amber-500/5 text-amber-600 dark:text-amber-400 rounded-xl">
              <Layers size={20} />
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full font-semibold">
              Propostas
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono leading-none">
              {pendingProposals}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium flex items-center gap-1">
              Propostas Ativas Enviadas
              <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-indigo-500" />
            </p>
          </div>
        </motion.div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Negotiation Value Card */}
        <motion.div
          variants={itemVariants}
          onClick={() => onNavigate('leads')}
          className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 p-5 rounded-2xl shadow-md text-white hover:border-slate-700/80 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Negociações em Curso</span>
            <Wallet size={16} className="text-indigo-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black font-mono mt-4 text-indigo-400">
            {formatBRL(valueInNegotiation)}
          </h2>
          <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-400">
            <TrendingUp size={12} className="text-indigo-400" />
            <span>Valor estimado de leads ativos no pipeline</span>
          </div>
        </motion.div>

        {/* Sold Month Card */}
        <motion.div
          variants={itemVariants}
          onClick={() => onNavigate('financeiro')}
          className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 p-5 rounded-2xl shadow-md text-white hover:border-slate-700/80 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Faturamento no Mês</span>
            <BadgeDollarSign size={16} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black font-mono mt-4 text-emerald-400">
            {formatBRL(soldThisMonth)}
          </h2>
          <div className="mt-3 flex items-center gap-1 text-[11px] text-emerald-400">
            <ArrowUpRight size={14} />
            <span>Contratos ativos & faturados este mês</span>
          </div>
        </motion.div>

        {/* Sold Year Card */}
        <motion.div
          variants={itemVariants}
          onClick={() => onNavigate('financeiro')}
          className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 p-5 rounded-2xl shadow-md text-white hover:border-slate-700/80 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Faturamento Anual (YTD)</span>
            <TrendingUp size={16} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-black font-mono mt-4 text-blue-400">
            {formatBRL(soldThisYear)}
          </h2>
          <div className="mt-3 flex items-center gap-1 text-[11px] text-blue-400">
            <ArrowUpRight size={14} />
            <span>Acumulado de faturamento do ano de {currentYear}</span>
          </div>
        </motion.div>
      </div>

      {/* SEÇÃO DE METAS (GOALS SECTION) */}
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm space-y-4"
      >
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <TrendingUp size={16} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Metas de Vendas SisteNext
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Acompanhamento em tempo real das metas comerciais e individuais do mês.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-full">
            Mês Vigente
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company General Goal */}
          <div className="space-y-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 p-4 rounded-xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block mb-0.5">Faturamento</span>
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Meta de Vendas Geral</h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-bold">Objetivo</span>
                <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                  {config?.generalGoal ? formatBRL(config.generalGoal) : 'Não definida'}
                </span>
              </div>
            </div>

            {config?.generalGoal && config.generalGoal > 0 ? (
              <div className="space-y-2">
                <div className="flex justify-between items-end text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold">Realizado</span>
                    <span className="text-lg font-black text-emerald-500 font-mono">
                      {formatBRL(soldThisMonth)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-indigo-600 dark:text-indigo-400 font-black font-mono text-sm">
                      {Math.round((soldThisMonth / config.generalGoal) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.round((soldThisMonth / config.generalGoal) * 100))}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 italic text-center py-4 bg-slate-100/50 dark:bg-slate-900/40 rounded-xl">
                Meta Geral não cadastrada.
              </div>
            )}
          </div>

          {/* Phone Goal */}
          <div className="space-y-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 p-4 rounded-xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block mb-0.5">Atividade</span>
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Meta de Contatos (Fone)</h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-bold">Objetivo</span>
                <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                  {config?.phoneGoal ? `${config.phoneGoal} ligações` : 'Não definida'}
                </span>
              </div>
            </div>

            {config?.phoneGoal && config.phoneGoal > 0 ? (
              <div className="space-y-2">
                <div className="flex justify-between items-end text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold">Efetuado</span>
                    <span className="text-lg font-black text-indigo-500 font-mono">
                      {phoneContactsThisMonth}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-600 dark:text-emerald-400 font-black font-mono text-sm">
                      {Math.round((phoneContactsThisMonth / config.phoneGoal) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.round((phoneContactsThisMonth / config.phoneGoal) * 100))}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 italic text-center py-4 bg-slate-100/50 dark:bg-slate-900/40 rounded-xl">
                Meta de Fone não cadastrada.
              </div>
            )}
          </div>

          {/* Individual Sales Goals or Leaderboard */}
          <div className="space-y-4">
            <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-3 h-full">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block mb-0.5">Consultores</span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Metas Individuais</h4>
                </div>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Realizado vs Meta</span>
              </div>

              {(() => {
                const sellers = membros.filter(m => m.role === 'Vendedor');
                if (sellers.length === 0) {
                  return (
                    <div className="text-xs text-slate-400 italic text-center py-6">
                      Nenhum vendedor cadastrado na equipe.
                    </div>
                  );
                }

                return (
                  <div className="space-y-3.5 max-h-[180px] overflow-y-auto pr-1">
                    {sellers.map(m => {
                      const isCurrentUser = m.email?.toLowerCase() === userEmail?.toLowerCase();
                      const sellerPropostas = propostas.filter(p => p.createdBy === m.email && p.status === 'Aceita');
                      const sellerSales = sellerPropostas.reduce((sum, p) => sum + p.value, 0);
                      const goal = m.salesGoal || 0;
                      const percent = goal > 0 ? Math.round((sellerSales / goal) * 100) : 0;

                      return (
                        <div key={m.id} className={`space-y-1.5 p-2 rounded-xl transition-all ${
                          isCurrentUser 
                            ? 'bg-indigo-500/5 border border-indigo-500/20 dark:bg-indigo-500/10 dark:border-indigo-500/30 ring-1 ring-indigo-500/10' 
                            : 'hover:bg-slate-100/40 dark:hover:bg-slate-800/10'
                        }`}>
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                                isCurrentUser 
                                  ? 'bg-indigo-500 text-white' 
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}>
                                {m.name[0].toUpperCase()}
                              </div>
                              <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                {m.name}
                                {isCurrentUser && (
                                  <span className="bg-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider">
                                    Você
                                  </span>
                                )}
                                {m.status === 'Inativo' && (
                                  <span className="bg-slate-200 dark:bg-slate-800 text-slate-500 text-[8px] px-1.5 py-0.2 rounded-md font-medium">
                                    Inativo
                                  </span>
                                )}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="font-bold text-slate-900 dark:text-slate-200">{formatBRL(sellerSales)}</span>
                              <span className="text-slate-400 mx-1">/</span>
                              <span className="text-slate-400">{goal > 0 ? formatBRL(goal) : 'Sem Meta'}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-700 ${
                                  percent >= 100 
                                    ? 'bg-emerald-500' 
                                    : percent >= 75 
                                    ? 'bg-indigo-500' 
                                    : percent >= 50 
                                    ? 'bg-amber-500' 
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, percent)}%` }}
                              />
                            </div>
                            <span className={`text-[10px] font-black font-mono w-8 text-right ${
                              percent >= 100 
                                ? 'text-emerald-500' 
                                : percent >= 75 
                                  ? 'text-indigo-500' 
                                  : percent >= 50 
                                    ? 'text-amber-500' 
                                    : 'text-rose-500'
                            }`}>
                              {percent}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Chart (6 columns) */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Faturamento Mensal
              </h3>
              <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                +42% <ArrowUpRight size={12} />
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Histórico de vendas e receitas em {currentYear}</p>
          </div>

          {/* SVG Custom Area Chart */}
          <div className="h-64 w-full mt-6 relative flex items-end">
            <svg viewBox="0 0 600 240" className="w-full h-full overflow-visible">
              {/* Grid Lines */}
              <line x1="0" y1="40" x2="600" y2="40" stroke="rgba(156, 163, 175, 0.1)" strokeDasharray="4" />
              <line x1="0" y1="100" x2="600" y2="100" stroke="rgba(156, 163, 175, 0.1)" strokeDasharray="4" />
              <line x1="0" y1="160" x2="600" y2="160" stroke="rgba(156, 163, 175, 0.1)" strokeDasharray="4" />
              <line x1="0" y1="220" x2="600" y2="220" stroke="rgba(156, 163, 175, 0.2)" />

              {/* Area path */}
              <path
                d="M 10 220 L 90 190 L 180 170 L 270 185 L 360 130 L 450 80 L 540 100 L 540 220 Z"
                fill="url(#chart-gradient)"
                className="opacity-20 dark:opacity-30"
              />

              {/* Line path */}
              <path
                d="M 10 220 L 90 190 L 180 170 L 270 185 L 360 130 L 450 80 L 540 100"
                fill="none"
                stroke="url(#line-gradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Dots */}
              {[
                { x: 10, y: 220, val: 15000, m: 'Jan' },
                { x: 90, y: 190, val: 28000, m: 'Fev' },
                { x: 180, y: 170, val: 42000, m: 'Mar' },
                { x: 270, y: 185, val: 35000, m: 'Abr' },
                { x: 360, y: 130, val: 65000, m: 'Mai' },
                { x: 450, y: 80, val: 95000, m: 'Jun' },
                { x: 540, y: 100, val: soldThisMonth, m: 'Jul' }
              ].map((dot, idx) => (
                <g key={idx} className="group/dot cursor-pointer">
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r="6"
                    className="fill-indigo-500 stroke-white dark:stroke-slate-900 stroke-[3px]"
                  />
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r="12"
                    className="fill-indigo-500/20 opacity-0 group-hover/dot:opacity-100 transition-all"
                  />
                  {/* Tooltip on hover */}
                  <foreignObject x={dot.x - 45} y={dot.y - 45} width="90" height="35" className="opacity-0 group-hover/dot:opacity-100 transition-all pointer-events-none">
                    <div className="bg-slate-950 text-[10px] text-white font-mono rounded px-1.5 py-0.5 text-center font-bold border border-slate-800">
                      {formatBRL(dot.val).split(',')[0]}
                    </div>
                  </foreignObject>
                </g>
              ))}

              {/* Gradients */}
              <defs>
                <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 font-mono text-[10px] text-slate-500 dark:text-slate-400">
              {months.map((m, i) => (
                <span key={i}>{m}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Lead Origins (4 columns) */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Origem dos Leads
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Canais de aquisição de leads</p>
          </div>

          <div className="my-6 flex justify-center relative">
            {/* SVG Custom Donut Chart */}
            <svg width="150" height="150" viewBox="0 0 42 42" className="transform -rotate-90">
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(156, 163, 175, 0.1)" strokeWidth="4.5" />
              {/* We calculate cumulative stroke dasharrays for top 3 sources */}
              {/* Source 1 (Tráfego Pago): say 45% */}
              <circle
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke="#06b6d4"
                strokeWidth="4.5"
                strokeDasharray="45 55"
                strokeDashoffset="0"
              />
              {/* Source 2 (Outbound): say 30% */}
              <circle
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke="#3b82f6"
                strokeWidth="4.5"
                strokeDasharray="30 70"
                strokeDashoffset="-45"
              />
              {/* Source 3 (Others): 25% */}
              <circle
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke="#a855f7"
                strokeWidth="4.5"
                strokeDasharray="25 75"
                strokeDashoffset="-75"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">{totalLeads}</span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Leads</span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 mt-2">
            {origins.slice(0, 3).map((ori, idx) => {
              const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-purple-500', 'bg-slate-400'];
              const col = colors[idx] || colors[colors.length - 1];
              return (
                <div key={ori.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <span className={`w-2.5 h-2.5 rounded-full ${col}`}></span>
                    <span className="truncate max-w-[120px]">{ori.name}</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-300 font-mono">
                    {ori.count} ({ori.percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Sales Pipeline Stage Visualizer */}
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm"
      >
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Funil de Vendas Comercial
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Distribuição dos leads em cada estágio de conversão</p>
          </div>
          <button
            onClick={() => onNavigate('leads')}
            className="text-xs font-bold text-indigo-500 hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            Ver Kanban <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Funnel Blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {pipelineStages.map((stage, idx) => {
            // Find max count to set proportional height
            const maxCount = Math.max(...pipelineStages.map((s) => s.count), 1);
            const heightPercent = Math.max((stage.count / maxCount) * 100, 15);
            return (
              <div
                key={stage.name}
                className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 p-3 rounded-xl flex flex-col justify-between items-center min-h-[140px]"
              >
                <div className="w-full flex justify-between items-center text-[10px] text-slate-500 font-semibold mb-2">
                  <span className="truncate max-w-[80px]">{stage.name}</span>
                  <span className="bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold text-slate-700 dark:text-slate-300">
                    #{idx + 1}
                  </span>
                </div>

                {/* Vertical bar visualizer */}
                <div className="w-10 h-16 bg-slate-200/40 dark:bg-slate-900 rounded-lg flex items-end overflow-hidden">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ delay: idx * 0.05, duration: 0.5 }}
                    className={`w-full ${stage.color} opacity-80`}
                  />
                </div>

                <div className="text-center mt-2">
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">
                    {stage.count}
                  </span>
                  <p className="text-[9px] text-slate-400 mt-0.5 font-medium">leads</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Dynamic Operational Status Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next reunions & activities (Column 1) */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={16} className="text-indigo-500" /> Próximas Reuniões
            </h3>
            <button
              onClick={() => onNavigate('agenda')}
              className="text-xs text-indigo-500 hover:text-indigo-400 font-bold transition-all cursor-pointer"
            >
              Agenda
            </button>
          </div>

          <div className="space-y-3">
            {upcomingReunions.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                Nenhuma reunião agendada.
              </div>
            ) : (
              upcomingReunions.map((reun) => (
                <div
                  key={reun.id}
                  className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl hover:border-indigo-500/40 transition-all text-xs"
                >
                  <div className="flex justify-between items-start font-semibold text-slate-800 dark:text-slate-200">
                    <span className="truncate max-w-[170px]">{reun.title}</span>
                    <span className="bg-indigo-500/10 text-indigo-500 font-mono text-[10px] px-1.5 py-0.5 rounded">
                      {reun.time}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                    Data: {reun.date.split('-').reverse().join('/')}
                  </p>
                  {reun.linkedName && (
                    <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                      <Users size={10} />
                      <span>{reun.linkedName}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Follow-ups & Reminders (Column 2) */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={16} className="text-amber-500" /> Follow-ups Pendentes
            </h3>
            <button
              onClick={() => onNavigate('followup')}
              className="text-xs text-amber-500 hover:text-amber-400 font-bold transition-all cursor-pointer"
            >
              Histórico
            </button>
          </div>

          <div className="space-y-3">
            {upcomingFollowups.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                Nenhum follow-up para hoje.
              </div>
            ) : (
              upcomingFollowups.map((fol) => (
                <div
                  key={fol.id}
                  className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl hover:border-amber-500/40 transition-all text-xs"
                >
                  <div className="flex justify-between items-start font-semibold text-slate-800 dark:text-slate-200">
                    <span className="truncate max-w-[170px]">{fol.title}</span>
                    <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[10px] px-1.5 py-0.5 rounded">
                      {fol.type}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                    Previsto para: {fol.date.split('-').reverse().join('/')} às {fol.time}
                  </p>
                  {fol.linkedName && (
                    <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                      <Target size={10} />
                      <span>{fol.linkedName}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent Contacts Timeline (Column 3) */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={16} className="text-blue-500" /> Últimos Contatos
            </h3>
            <button
              onClick={() => onNavigate('leads')}
              className="text-xs text-blue-500 hover:text-blue-400 font-bold transition-all cursor-pointer"
            >
              Leads
            </button>
          </div>

          <div className="space-y-3 relative">
            {recentContacts.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                Nenhum contato registrado recentemente.
              </div>
            ) : (
              recentContacts.map((contact, idx) => (
                <div
                  key={contact.id}
                  className="flex gap-3 text-xs items-start border-l border-slate-200 dark:border-slate-800 pl-4 relative"
                >
                  {/* Timeline bullet */}
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900 absolute -left-[5.5px] top-1"></span>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono text-[10px] uppercase">
                        {contact.type}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {contact.date.split('-').reverse().slice(0, 2).join('/')} - {contact.time}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {contact.description}
                    </p>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-500 block mt-0.5">
                      Por: {contact.user}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
