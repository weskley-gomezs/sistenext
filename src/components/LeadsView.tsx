import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  X,
  Flame,
  AlertCircle,
  MoreVertical,
  Edit2,
  Trash2,
  History,
  Phone,
  MessageSquare,
  Mail,
  Instagram,
  Linkedin,
  MapPin,
  Building,
  DollarSign,
  Briefcase,
  ChevronRight,
  Eye,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Lead, LeadStatus, LeadTemperature, FollowUp, FollowUpType } from '../types';
import { addItem, updateItem, deleteItem } from '../dbService';
import { formatPhone, formatCNPJ } from '../utils/masks';
import { ConfirmModal } from './ConfirmModal';

interface LeadsViewProps {
  leads: Lead[];
  followUps: FollowUp[];
  onAddLead: (lead: Omit<Lead, 'id'>) => Promise<string>;
  onUpdateLead: (id: string, lead: Partial<Lead>) => Promise<void>;
  onDeleteLead: (id: string, justification: string, data: Lead) => Promise<void>;
  onAddFollowUp: (followUp: Omit<FollowUp, 'id'>) => Promise<string>;
  onConvertLeadToClient: (lead: Lead) => void;
}

export default function LeadsView({
  leads,
  followUps,
  onAddLead,
  onUpdateLead,
  onDeleteLead,
  onAddFollowUp,
  onConvertLeadToClient
}: LeadsViewProps) {
  // Navigation tabs inside Leads view
  const [viewTab, setViewTab] = useState<'kanban' | 'list'>('kanban');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSegment, setFilterSegment] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTemp, setFilterTemp] = useState('');
  const [filterMinVal, setFilterMinVal] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Form Drawer State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

  // Follow up slideover
  const [activeFollowUpLead, setActiveFollowUpLead] = useState<Lead | null>(null);
  const [followUpType, setFollowUpType] = useState<FollowUpType>('Mensagem');
  const [followUpDesc, setFollowUpDesc] = useState('');
  const [followUpNextAction, setFollowUpNextAction] = useState('');
  const [followUpNextDate, setFollowUpNextDate] = useState('');

  // View details modal
  const [detailedLead, setDetailedLead] = useState<Lead | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    representative: '',
    phone: '',
    whatsapp: '',
    email: '',
    instagram: '',
    linkedin: '',
    city: '',
    state: '',
    site: '',
    segment: '',
    employeeCount: 0,
    estimatedRevenue: 0,
    source: '',
    notes: '',
    cnpj: '',
    address: '',
    status: 'Novo Lead' as LeadStatus,
    temperature: 'Morno' as LeadTemperature,
    tags: '',
    estimatedValue: 0,
    winProbability: 50
  });

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      representative: '',
      phone: '',
      whatsapp: '',
      email: '',
      instagram: '',
      linkedin: '',
      city: '',
      state: '',
      site: '',
      segment: '',
      employeeCount: 0,
      estimatedRevenue: 0,
      source: '',
      notes: '',
      cnpj: '',
      address: '',
      status: 'Novo Lead',
      temperature: 'Morno',
      tags: '',
      estimatedValue: 0,
      winProbability: 50
    });
    setEditingLead(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      company: lead.company,
      representative: lead.representative,
      phone: lead.phone,
      whatsapp: lead.whatsapp,
      email: lead.email,
      instagram: lead.instagram,
      linkedin: lead.linkedin,
      city: lead.city,
      state: lead.state,
      site: lead.site,
      segment: lead.segment,
      employeeCount: lead.employeeCount,
      estimatedRevenue: lead.estimatedRevenue,
      source: lead.source,
      notes: lead.notes,
      cnpj: lead.cnpj || '',
      address: lead.address || '',
      status: lead.status,
      temperature: lead.temperature,
      tags: lead.tags.join(', '),
      estimatedValue: lead.estimatedValue,
      winProbability: lead.winProbability
    });
    setIsFormOpen(true);
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedTags = formData.tags
      ? formData.tags.split(',').map((t) => t.trim()).filter((t) => t)
      : [];

    const leadPayload: Omit<Lead, 'id'> = {
      ...formData,
      tags: formattedTags,
      entryDate: editingLead ? editingLead.entryDate : new Date().toISOString().split('T')[0]
    };

    try {
      if (editingLead) {
        await onUpdateLead(editingLead.id, leadPayload);
      } else {
        await onAddLead(leadPayload);
      }
      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFollowUpLead) return;

    const followUpPayload: Omit<FollowUp, 'id'> = {
      leadId: activeFollowUpLead.id,
      type: followUpType,
      description: followUpDesc,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      user: 'Consultor SisteNext',
      nextAction: followUpNextAction || undefined,
      nextActionDate: followUpNextDate || undefined
    };

    try {
      await onAddFollowUp(followUpPayload);
      
      // Update Lead timeline / note trigger if next action is defined
      if (followUpNextAction) {
        await onUpdateLead(activeFollowUpLead.id, {
          notes: activeFollowUpLead.notes + `\n[Follow-up Next Action]: ${followUpNextAction} (Previsto para ${followUpNextDate})`
        });
      }

      setFollowUpDesc('');
      setFollowUpNextAction('');
      setFollowUpNextDate('');
      setActiveFollowUpLead(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveKanban = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await onUpdateLead(leadId, { status: newStatus });
      // If converting to client, fire callback
      if (newStatus === 'Cliente') {
        const leadObj = leads.find((l) => l.id === leadId);
        if (leadObj) {
          onConvertLeadToClient(leadObj);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter and Search Evaluation
  const filteredLeads = leads.filter((lead) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      lead.name.toLowerCase().includes(q) ||
      lead.company.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      lead.representative.toLowerCase().includes(q) ||
      lead.phone.includes(q) ||
      lead.city.toLowerCase().includes(q);

    const matchesSegment = !filterSegment || lead.segment.toLowerCase() === filterSegment.toLowerCase();
    const matchesCity = !filterCity || lead.city.toLowerCase() === filterCity.toLowerCase();
    const matchesState = !filterState || lead.state.toLowerCase() === filterState.toLowerCase();
    const matchesStatus = !filterStatus || lead.status === filterStatus;
    const matchesTemp = !filterTemp || lead.temperature === filterTemp;
    const matchesSource = !filterSource || lead.source.toLowerCase() === filterSource.toLowerCase();
    const matchesValue = !filterMinVal || lead.estimatedValue >= Number(filterMinVal);

    return (
      lead.status !== 'Cliente' &&
      matchesSearch &&
      matchesSegment &&
      matchesCity &&
      matchesState &&
      matchesStatus &&
      matchesTemp &&
      matchesSource &&
      matchesValue
    );
  });

  // Kanban Stage Setup
  const kanbanStages: { label: string; value: LeadStatus; color: string }[] = [
    { label: 'Novo Lead', value: 'Novo Lead', color: 'border-t-indigo-500 bg-indigo-500/5' },
    { label: 'Contato Feito', value: 'Contato Feito', color: 'border-t-blue-500 bg-blue-500/5' },
    { label: 'Reunião Marcada', value: 'Reunião Marcada', color: 'border-t-emerald-500 bg-emerald-500/5' },
    { label: 'Diagnóstico', value: 'Diagnóstico', color: 'border-t-teal-500 bg-teal-500/5' },
    { label: 'Proposta Enviada', value: 'Proposta Enviada', color: 'border-t-amber-500 bg-amber-500/5' },
    { label: 'Negociação', value: 'Negociação', color: 'border-t-orange-500 bg-orange-500/5' },
    { label: 'Fechado/Cliente', value: 'Cliente', color: 'border-t-green-500 bg-green-500/5' },
    { label: 'Perdido', value: 'Perdido', color: 'border-t-red-500 bg-red-500/5' }
  ];

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getDaysSinceLastContact = (lead: Lead) => {
    const leadFollowUps = followUps.filter(f => f.leadId === lead.id);
    if (leadFollowUps.length === 0) {
      if (!lead.entryDate) return 0;
      const entry = new Date(lead.entryDate);
      const today = new Date();
      const diffTime = today.getTime() - entry.getTime();
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }
    
    const dates = leadFollowUps.map(f => {
      try {
        return new Date(`${f.date}T${f.time || '00:00:00'}`);
      } catch (e) {
        return new Date(f.date);
      }
    });
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const today = new Date();
    const diffTime = today.getTime() - maxDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans relative">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Gestão Comercial de Leads
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Qualifique leads, acompanhe follow-ups e gerencie o fluxo de conversão.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Navigation Tab Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <button
              onClick={() => setViewTab('kanban')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                viewTab === 'kanban'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Pipeline Kanban
            </button>
            <button
              onClick={() => setViewTab('list')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                viewTab === 'list'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Lista Detalhada
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 cursor-pointer"
          >
            <Plus size={14} /> Novo Lead
          </button>
        </div>
      </div>

      {/* Control Search and Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Pesquisar por empresa, responsável, email, telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3.5 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              showFilters || filterSegment || filterCity || filterState || filterStatus || filterTemp || filterSource || filterMinVal
                ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            <Filter size={14} /> Filtros {showFilters ? 'Ativos' : ''}
          </button>
        </div>

        {/* Detailed Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100 dark:border-slate-800/60 pt-4"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {/* Segmento */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Segmento</label>
                  <select
                    value={filterSegment}
                    onChange={(e) => setFilterSegment(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="">Todos</option>
                    <option value="Tecnologia & SaaS">Tecnologia & SaaS</option>
                    <option value="Alimentos e Bebidas">Alimentos e Bebidas</option>
                    <option value="Saúde & Estética">Saúde & Estética</option>
                    <option value="Transportes & Logística">Transportes & Logística</option>
                    <option value="Varejo & E-commerce">Varejo & E-commerce</option>
                    <option value="Serviços Jurídicos">Serviços Jurídicos</option>
                  </select>
                </div>

                {/* Cidade */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Cidade</label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo"
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Estado</label>
                  <input
                    type="text"
                    placeholder="Ex: SP"
                    value={filterState}
                    onChange={(e) => setFilterState(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="">Todos</option>
                    <option value="Novo Lead">Novo Lead</option>
                    <option value="Contato Feito">Contato Feito</option>
                    <option value="Reunião Marcada">Reunião Marcada</option>
                    <option value="Diagnóstico">Diagnóstico</option>
                    <option value="Proposta Enviada">Proposta Enviada</option>
                    <option value="Negociação">Negociação</option>
                    <option value="Cliente">Cliente</option>
                    <option value="Perdido">Perdido</option>
                  </select>
                </div>

                {/* Temperatura */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Temperatura</label>
                  <select
                    value={filterTemp}
                    onChange={(e) => setFilterTemp(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="">Todos</option>
                    <option value="Quente">🔥 Quente</option>
                    <option value="Morno">🟡 Morno</option>
                    <option value="Frio">🔵 Frio</option>
                  </select>
                </div>

                {/* Origem */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Origem</label>
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="">Todas</option>
                    <option value="Tráfego Pago">Tráfego Pago</option>
                    <option value="Indicação">Indicação</option>
                    <option value="Outbound">Outbound</option>
                    <option value="Google Organic">Google Organic</option>
                  </select>
                </div>

                {/* Valor Estimado Mínimo */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Valor Mínimo</label>
                  <input
                    type="number"
                    placeholder="Min: R$"
                    value={filterMinVal}
                    onChange={(e) => setFilterMinVal(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Reset Filters button */}
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => {
                    setFilterSegment('');
                    setFilterCity('');
                    setFilterState('');
                    setFilterStatus('');
                    setFilterTemp('');
                    setFilterSource('');
                    setFilterMinVal('');
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                >
                  Limpar Filtros
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* KANBAN PIPELINE VIEW */}
      {viewTab === 'kanban' && (
        <div className="overflow-x-auto pb-4 -mx-6 px-6">
          <div className="flex gap-4 min-w-[1200px] h-[calc(100vh-280px)]">
            {kanbanStages.map((stage) => {
              const stageLeads = filteredLeads.filter((l) => l.status === stage.value);
              const stageValueSum = stageLeads.reduce((s, l) => s + (l.estimatedValue || 0), 0);

              return (
                <div
                  key={stage.value}
                  className="flex-1 min-w-[280px] bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl flex flex-col h-full"
                >
                  {/* Stage Header */}
                  <div className={`p-4 border-t-4 border-b border-slate-200/50 dark:border-slate-800/50 rounded-t-2xl flex flex-col gap-1 ${stage.color}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                        {stage.label}
                      </span>
                      <span className="bg-slate-200 dark:bg-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono text-slate-700 dark:text-slate-300">
                        {stageLeads.length}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 font-mono">
                      {formatBRL(stageValueSum)}
                    </span>
                  </div>

                  {/* Cards container */}
                  <div
                    className="flex-1 overflow-y-auto p-3 space-y-3"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const leadId = e.dataTransfer.getData('text/plain');
                      if (leadId) {
                        handleMoveKanban(leadId, stage.value);
                      }
                    }}
                  >
                    {stageLeads.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800/60 rounded-xl p-4">
                        Arraste ou crie leads aqui
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', lead.id);
                          }}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 p-4 rounded-xl shadow-sm hover:shadow-md transition-all group flex flex-col justify-between cursor-grab active:cursor-grabbing"
                        >
                          <div>
                            {/* Temperature Tag */}
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
                                {lead.company}
                              </span>
                              <span className="text-xs">
                                {lead.temperature === 'Quente' ? '🔥' : lead.temperature === 'Morno' ? '🟡' : '🔵'}
                              </span>
                            </div>

                            {/* Name */}
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-2.5 truncate">
                              {lead.name}
                            </h4>

                            {(() => {
                              const days = getDaysSinceLastContact(lead);
                              if (lead.status !== 'Cliente' && lead.status !== 'Perdido' && days >= 3) {
                                return (
                                  <div className="mt-1.5 flex items-center gap-1 text-[9px] bg-red-500/10 text-red-500 dark:bg-red-500/20 px-2 py-0.5 rounded font-extrabold w-fit animate-pulse">
                                    <AlertCircle size={10} className="shrink-0" />
                                    Sem contato há {days} dias
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            {/* Estimated Value */}
                            <div className="mt-2 text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">
                              {formatBRL(lead.estimatedValue)}
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1 mt-3">
                              {lead.tags.slice(0, 2).map((tag, i) => (
                                <span
                                  key={i}
                                  className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-medium"
                                >
                                  {tag}
                                </span>
                              ))}
                              {lead.tags.length > 2 && (
                                <span className="text-[9px] text-slate-400 font-medium">+{lead.tags.length - 2}</span>
                              )}
                            </div>
                          </div>

                          {/* Quick Actions Panel */}
                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenEdit(lead)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-900 transition-colors"
                                title="Editar lead"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => setActiveFollowUpLead(lead)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-indigo-500 transition-colors"
                                title="Registrar Follow-up"
                              >
                                <History size={12} />
                              </button>
                              <button
                                onClick={() => setDetailedLead(lead)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-blue-500 transition-colors"
                                title="Ver Ficha Completa"
                              >
                                <Eye size={12} />
                              </button>
                              <button
                                onClick={() => setLeadToDelete(lead.id)}
                                className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-slate-500 hover:text-red-500 transition-colors"
                                title="Excluir lead"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>

                            {/* Stage Shifter Dropdown/Selector */}
                            <select
                              value={lead.status}
                              onChange={(e) => handleMoveKanban(lead.id, e.target.value as LeadStatus)}
                              className="text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 p-0.5 rounded outline-none font-bold max-w-[90px]"
                            >
                              <option value="Novo Lead">Novo</option>
                              <option value="Contato Feito">Contato</option>
                              <option value="Reunião Marcada">Reunião</option>
                              <option value="Diagnóstico">Diagnóstico</option>
                              <option value="Proposta Enviada">Proposta</option>
                              <option value="Negociação">Negociação</option>
                              <option value="Cliente">Fechado</option>
                              <option value="Perdido">Perdido</option>
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DETAILED LIST VIEW */}
      {viewTab === 'list' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider border-b border-slate-200/60 dark:border-slate-800/60">
                  <th className="p-4">Lead / Responsável</th>
                  <th className="p-4">Empresa / Segmento</th>
                  <th className="p-4">Localização</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Temperatura</th>
                  <th className="p-4 text-right">Valor Est.</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                      Nenhum lead encontrado com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition-all">
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900 dark:text-white text-sm">{lead.name}</div>
                        <div className="text-slate-500 dark:text-slate-400 mt-0.5">{lead.representative}</div>
                        {(() => {
                          const days = getDaysSinceLastContact(lead);
                          if (lead.status !== 'Cliente' && lead.status !== 'Perdido' && days >= 3) {
                            return (
                              <div className="mt-1 flex items-center gap-1 text-[9px] bg-red-500/10 text-red-500 dark:bg-red-500/20 px-1.5 py-0.5 rounded font-extrabold w-fit animate-pulse">
                                <AlertCircle size={10} className="shrink-0" />
                                Sem contato há {days} dias
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold">{lead.company}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{lead.segment}</div>
                      </td>
                      <td className="p-4">
                        <div>{lead.city} - {lead.state}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{lead.site || 'Sem site'}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase">
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          lead.temperature === 'Quente'
                            ? 'bg-red-500/10 text-red-500'
                            : lead.temperature === 'Morno'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {lead.temperature === 'Quente' ? '🔥 Quente' : lead.temperature === 'Morno' ? '🟡 Morno' : '🔵 Frio'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-black font-mono text-slate-900 dark:text-white">
                        {formatBRL(lead.estimatedValue)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setDetailedLead(lead)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
                            title="Ficha completa"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(lead)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setActiveFollowUpLead(lead)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-500 transition-all cursor-pointer"
                            title="Registrar Follow-up"
                          >
                            <History size={14} />
                          </button>
                          <button
                            onClick={() => setLeadToDelete(lead.id)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-500 transition-all cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LEAD CREATION / EDITION FORM DRAWER SLIDE PANEL */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="fixed inset-0 bg-black/80"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col z-10 p-6 border-l border-slate-200 dark:border-slate-900 overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-900 mb-6">
                <h3 className="text-md font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {editingLead ? 'Editar Lead' : 'Cadastrar Novo Lead'}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveLead} className="space-y-4 text-xs">
                {/* Section: Básicos */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-[10px] text-indigo-500 uppercase tracking-widest">Informações Básicas</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nome do Lead *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Carlos Alberto"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nome da Empresa *</label>
                      <input
                        type="text"
                        required
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Ex: Vanguard S.A."
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Responsável de Vendas</label>
                      <input
                        type="text"
                        value={formData.representative}
                        onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
                        placeholder="Ex: Carlos Sênior"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Segmento</label>
                      <input
                        type="text"
                        value={formData.segment}
                        onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                        placeholder="Ex: Tecnologia, Varejo"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Contato */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-extrabold text-[10px] text-indigo-500 uppercase tracking-widest">Informações de Contato</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Telefone</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                        placeholder="Ex: (11) 99999-9999"
                        maxLength={15}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">WhatsApp</label>
                      <input
                        type="text"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: formatPhone(e.target.value) })}
                        placeholder="Ex: (11) 99999-9999"
                        maxLength={15}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">E-mail Corporativo</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="nome@empresa.com"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Site</label>
                      <input
                        type="text"
                        value={formData.site}
                        onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                        placeholder="www.empresa.com.br"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Instagram</label>
                      <input
                        type="text"
                        value={formData.instagram}
                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                        placeholder="@empresa"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">LinkedIn</label>
                      <input
                        type="text"
                        value={formData.linkedin}
                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                        placeholder="linkedin.com/company/empresa"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Localização */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-extrabold text-[10px] text-indigo-500 uppercase tracking-widest">Localização</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Cidade</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Ex: São Paulo"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Estado (UF)</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="Ex: SP"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Qualificação e Valores */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-extrabold text-[10px] text-indigo-500 uppercase tracking-widest">Metas e Valores</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Valor Estimado do Projeto (R$)</label>
                      <input
                        type="number"
                        value={formData.estimatedValue}
                        onChange={(e) => setFormData({ ...formData, estimatedValue: Number(e.target.value) })}
                        placeholder="Valor do fechamento"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Probabilidade de Fechamento (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.winProbability}
                        onChange={(e) => setFormData({ ...formData, winProbability: Number(e.target.value) })}
                        placeholder="0 a 100"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Temperatura</label>
                      <select
                        value={formData.temperature}
                        onChange={(e) => setFormData({ ...formData, temperature: e.target.value as LeadTemperature })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-bold"
                      >
                        <option value="Quente">🔥 Quente</option>
                        <option value="Morno">🟡 Morno</option>
                        <option value="Frio">🔵 Frio</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-bold"
                      >
                        <option value="Novo Lead">Novo Lead</option>
                        <option value="Contato Feito">Contato Feito</option>
                        <option value="Reunião Marcada">Reunião Marcada</option>
                        <option value="Diagnóstico">Diagnóstico</option>
                        <option value="Proposta Enviada">Proposta Enviada</option>
                        <option value="Negociação">Negociação</option>
                        <option value="Cliente">Cliente (Ganho)</option>
                        <option value="Perdido">Perdido (Perda)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Origem do Lead</label>
                      <select
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      >
                        <option value="Tráfego Pago">Tráfego Pago</option>
                        <option value="Indicação">Indicação</option>
                        <option value="Outbound">Outbound</option>
                        <option value="Google Organic">Google Organic</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Qtd. Funcionários</label>
                      <input
                        type="number"
                        value={formData.employeeCount}
                        onChange={(e) => setFormData({ ...formData, employeeCount: Number(e.target.value) })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Faturamento Estimado</label>
                      <input
                        type="number"
                        value={formData.estimatedRevenue}
                        onChange={(e) => setFormData({ ...formData, estimatedRevenue: Number(e.target.value) })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Tags (separadas por vírgula)</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="Ex: WhatsApp IA, SaaS, Chatbot"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">CNPJ</label>
                      <input
                        type="text"
                        value={formData.cnpj}
                        onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Endereço Completo</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Rua, Número, Bairro, Cidade - UF"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Observações Internas</label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Observações importantes coletadas no primeiro diagnóstico..."
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all shadow-md shadow-indigo-500/10 cursor-pointer text-center"
                  >
                    Salvar Dados do Lead
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
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

      {/* DETAILED LEAD MODAL VIEW */}
      <AnimatePresence>
        {detailedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailedLead(null)}
              className="fixed inset-0 bg-black/80"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto z-10"
            >
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">
                      {detailedLead.name}
                    </h2>
                    <span className="text-xs">
                      {detailedLead.temperature === 'Quente' ? '🔥 Quente' : detailedLead.temperature === 'Morno' ? '🟡 Morno' : '🔵 Frio'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                    {detailedLead.company} | Representante: {detailedLead.representative}
                  </p>
                </div>
                <button
                  onClick={() => setDetailedLead(null)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700 dark:text-slate-300">
                <div className="space-y-2">
                  <h4 className="font-extrabold text-[10px] text-indigo-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-1">Contatos & Canais</h4>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" />
                    <span>{detailedLead.phone || 'Sem Telefone'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-emerald-500" />
                    <span>{detailedLead.whatsapp || 'Sem WhatsApp'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" />
                    <span>{detailedLead.email || 'Sem E-mail'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Instagram size={14} className="text-pink-500" />
                    <span>{detailedLead.instagram || 'Sem Instagram'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Linkedin size={14} className="text-blue-500" />
                    <span>{detailedLead.linkedin || 'Sem LinkedIn'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-extrabold text-[10px] text-indigo-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-1">Metas de Negócio</h4>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[9px] block">Valor Estimado do Projeto</span>
                    <span className="text-md font-bold text-indigo-600 dark:text-indigo-400 font-mono">{formatBRL(detailedLead.estimatedValue)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[9px] block">Faturamento Estimado da Empresa</span>
                    <span className="font-bold font-mono">{formatBRL(detailedLead.estimatedRevenue)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[9px] block">Origem do Lead</span>
                    <span className="font-bold">{detailedLead.source}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[9px] block">Chance de Conversão</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full"
                          style={{ width: `${detailedLead.winProbability}%` }}
                        />
                      </div>
                      <span className="font-bold font-mono text-[10px]">{detailedLead.winProbability}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* History Followups */}
              <div className="mt-6">
                <h4 className="font-extrabold text-[10px] text-indigo-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-1 mb-3">Linha do Tempo de Interações (Follow-ups)</h4>
                <div className="space-y-3">
                  {followUps.filter((f) => f.leadId === detailedLead.id).length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">Nenhuma interação registrada para este lead.</p>
                  ) : (
                    followUps
                      .filter((f) => f.leadId === detailedLead.id)
                      .map((f) => (
                        <div key={f.id} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 rounded-xl text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-slate-950 dark:text-white uppercase tracking-wider">{f.type}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{f.date} às {f.time}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{f.description}</p>
                          {f.nextAction && (
                            <div className="mt-2 pt-2 border-t border-slate-200/40 dark:border-slate-800/40 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                              Próxima Ação: {f.nextAction} (Previsto para {f.nextActionDate})
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-semibold uppercase text-[9px] block mb-1">Observações Gerais</span>
                <p className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/40 dark:border-slate-800/40 text-xs italic">
                  {detailedLead.notes || 'Nenhuma observação interna adicional registrada.'}
                </p>
              </div>

              {/* Action converting */}
              <div className="mt-6 flex justify-end gap-3">
                {detailedLead.status !== 'Cliente' && (
                  <button
                    onClick={() => {
                      handleMoveKanban(detailedLead.id, 'Cliente');
                      setDetailedLead(null);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    <UserCheck size={14} /> Fechar Negócio (Ganho)
                  </button>
                )}
                <button
                  onClick={() => setDetailedLead(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Fechar Janela
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUICK FOLLOW-UP FORM DRAWER SLIDE PANEL */}
      <AnimatePresence>
        {activeFollowUpLead && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveFollowUpLead(null)}
              className="fixed inset-0 bg-black/80"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col z-10 p-6 border-l border-slate-200 dark:border-slate-900"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-900 mb-6">
                <div>
                  <h3 className="text-md font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Registrar Follow-Up
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-semibold">{activeFollowUpLead.company}</p>
                </div>
                <button
                  onClick={() => setActiveFollowUpLead(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveFollowUp} className="space-y-4 text-xs flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Meio de Contato</label>
                    <select
                      value={followUpType}
                      onChange={(e) => setFollowUpType(e.target.value as FollowUpType)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-bold text-xs"
                    >
                      <option value="Ligação">📞 Ligação</option>
                      <option value="Mensagem">💬 Mensagem de WhatsApp</option>
                      <option value="Email">📧 E-mail</option>
                      <option value="Reunião">👥 Reunião Presencial/Online</option>
                      <option value="Visita">🏡 Visita Técnica</option>
                      <option value="Arquivo enviado">📂 Arquivo enviado</option>
                      <option value="Proposta enviada">📃 Proposta enviada</option>
                      <option value="Observação">📝 Observação Geral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Detalhamento da Interação *</label>
                    <textarea
                      required
                      rows={5}
                      value={followUpDesc}
                      onChange={(e) => setFollowUpDesc(e.target.value)}
                      placeholder="Descreva resumidamente o que foi conversado ou realizado..."
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none text-xs"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/40 dark:border-slate-800/40 space-y-3">
                    <h5 className="font-bold text-[10px] text-indigo-500 uppercase tracking-wider">Agendar Próxima Ação</h5>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Próxima Ação Planejada</label>
                      <input
                        type="text"
                        value={followUpNextAction}
                        onChange={(e) => setFollowUpNextAction(e.target.value)}
                        placeholder="Ex: Telefonar para fechar, enviar briefing"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Data Prevista para Próxima Ação</label>
                      <input
                        type="date"
                        value={followUpNextDate}
                        onChange={(e) => setFollowUpNextDate(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all shadow-md shadow-indigo-500/10 cursor-pointer text-center"
                  >
                    Salvar Interação
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFollowUpLead(null)}
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
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={!!leadToDelete}
        title="Excluir Lead"
        message="Tem certeza que deseja excluir este lead? Informe uma justificativa para prosseguir."
        onConfirm={async (justification) => {
          if (leadToDelete) {
            const lead = leads.find(l => l.id === leadToDelete);
            if (lead) {
              await onDeleteLead(leadToDelete, justification, lead);
            }
            setLeadToDelete(null);
          }
        }}
        onCancel={() => setLeadToDelete(null)}
      />

    </div>
  );
}
