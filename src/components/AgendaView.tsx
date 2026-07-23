import React, { useState } from 'react';
import { Plus, Calendar, Clock, Video, User, FileText, ChevronRight, X, Trash2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AgendaItem, Lead, Cliente } from '../types';
import { ConfirmModal } from './ConfirmModal';
import CalendarComponent from './CalendarComponent';

interface AgendaViewProps {
  agenda: AgendaItem[];
  leads: Lead[];
  clientes: Cliente[];
  onAddAgenda: (item: Omit<AgendaItem, 'id'>) => Promise<string>;
  onUpdateAgenda: (id: string, item: Partial<AgendaItem>) => Promise<void>;
  onDeleteAgenda: (id: string, justification: string, data: AgendaItem) => Promise<void>;
}

export default function AgendaView({
  agenda,
  leads,
  clientes,
  onAddAgenda,
  onUpdateAgenda,
  onDeleteAgenda
}: AgendaViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');

  // Form Fields
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<'Reunião' | 'Apresentação' | 'Follow-up' | 'Outro'>('Reunião');
  const [relatedEntity, setRelatedEntity] = useState('');
  const [linkedId, setLinkedId] = useState('');
  const [linkedType, setLinkedType] = useState<'lead' | 'client' | 'project' | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  const recipients = [
    ...leads
      .filter((l) => l.status !== 'Cliente')
      .map((l) => ({ id: l.id, name: `${l.company} (${l.name})`, type: 'Lead' })),
    ...clientes.map((c) => ({ id: c.id, name: `${c.companyName} (${c.name})`, type: 'Cliente' }))
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Omit<AgendaItem, 'id'> = {
      title,
      date,
      time,
      type,
      relatedEntity: relatedEntity || 'Geral',
      linkedId: linkedId || undefined,
      linkedType: linkedType || undefined,
      linkedName: relatedEntity || undefined,
      description: description || '',
      meetingUrl: meetingUrl?.trim() || null,
      status: 'Pendente'
    };

    try {
      await onAddAgenda(payload);
      setIsOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDate('');
    setTime('');
    setType('Reunião');
    setRelatedEntity('');
    setLinkedId('');
    setLinkedType(undefined);
    setDescription('');
    setMeetingUrl('');
  };

  const handleUpdateStatus = async (id: string, status: 'Concluído' | 'Cancelado' | 'Pendente') => {
    try {
      await onUpdateAgenda(id, { status });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEventDrop = async (eventId: string, start: Date, end: Date) => {
    const newDate = start.toISOString().split('T')[0];
    const newTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
    
    try {
      await onUpdateAgenda(eventId, { date: newDate, time: newTime });
    } catch (err) {
      console.error('Failed to update event via drag and drop:', err);
    }
  };

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const upcomingItems = agenda
    .filter((a) => (a.status === 'Pendente' || !a.status) && a.date >= todayStr)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  const historyItems = agenda
    .filter((a) => a.status === 'Concluído' || a.status === 'Cancelado' || a.date < todayStr)
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)); // Most recent history first

  const displayedItems = activeTab === 'upcoming' ? upcomingItems : historyItems;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Agenda Integrada de Compromissos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Planeje chamadas de diagnóstico, apresentações de protótipos de IA e reuniões gerais com links de videoconferência.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl flex items-center border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Calendar size={14} /> Calendário
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <FileText size={14} /> Lista
            </button>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 cursor-pointer"
          >
            <Plus size={14} /> Agendar Compromisso
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <CalendarComponent 
          events={agenda} 
          onEventDrop={handleEventDrop}
          onSelectEvent={(event) => {
            // Optional: open a details modal or edit form
            console.log('Event selected:', event);
          }}
        />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-2 px-1 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'upcoming'
              ? 'text-indigo-600 border-indigo-600'
              : 'text-slate-400 border-transparent hover:text-slate-600'
          }`}
        >
          Próximos ({upcomingItems.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2 px-1 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'history'
              ? 'text-indigo-600 border-indigo-600'
              : 'text-slate-400 border-transparent hover:text-slate-600'
          }`}
        >
          Histórico ({historyItems.length})
        </button>
      </div>

      {/* Grid: Day agenda view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Scheduled chronological agenda items (8 columns) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            {activeTab === 'upcoming' ? (
              <Calendar size={16} className="text-indigo-500" />
            ) : (
              <Clock size={16} className="text-slate-400" />
            )}
            {activeTab === 'upcoming' ? 'Próximos Compromissos' : 'Histórico de Atividades'}
          </h3>

          <div className="space-y-3.5 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
            {displayedItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium text-xs">
                {activeTab === 'upcoming' 
                  ? 'Nenhum compromisso pendente.' 
                  : 'Nenhum histórico registrado.'}
              </div>
            ) : (
              displayedItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 border rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-sm transition-all ${
                      item.status === 'Concluído'
                        ? 'bg-emerald-500/5 border-emerald-200/50 dark:border-emerald-900/30 opacity-80'
                        : item.status === 'Cancelado'
                        ? 'bg-rose-500/5 border-rose-200/50 dark:border-rose-900/30 opacity-60 grayscale-[0.5]'
                        : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50'
                    }`}
                  >
                    <div className="flex gap-4.5 items-start">
                      {/* Date Badge */}
                      <div className={`flex flex-col items-center justify-center bg-white dark:bg-slate-900 border w-14 h-14 rounded-2xl text-center shadow-sm shrink-0 ${
                        item.status === 'Concluído'
                          ? 'border-emerald-200 dark:border-emerald-900'
                          : item.status === 'Cancelado'
                          ? 'border-rose-200 dark:border-rose-900'
                          : 'border-slate-200/80 dark:border-slate-800/80'
                      }`}>
                        <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">
                          {new Date(item.date).toLocaleDateString('pt-BR', { month: 'short' }).slice(0, 3)}
                        </span>
                        <span className="text-lg font-black text-slate-900 dark:text-white leading-none mt-1">
                          {item.date.split('-')[2]}
                        </span>
                      </div>

                      {/* Details block */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            item.type === 'Reunião'
                              ? 'bg-indigo-500/10 text-indigo-500'
                              : item.type === 'Apresentação'
                              ? 'bg-purple-500/10 text-purple-500'
                              : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {item.type}
                          </span>
                          <span className="text-xs text-slate-400 font-mono flex items-center gap-1 font-semibold">
                            <Clock size={11} /> {item.time}
                          </span>
                          
                          {item.status && (
                            <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              item.status === 'Concluído'
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : item.status === 'Cancelado'
                                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                : 'bg-blue-500/10 text-blue-500'
                            }`}>
                              {item.status}
                            </span>
                          )}
                        </div>

                        <h4 className={`font-extrabold text-sm text-slate-900 dark:text-white leading-tight ${item.status === 'Concluído' ? 'line-through decoration-emerald-500/30' : item.status === 'Cancelado' ? 'line-through decoration-rose-500/30' : ''}`}>
                          {item.title}
                        </h4>

                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                          {item.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 pt-1">
                          <span className="flex items-center gap-1 font-semibold">
                            <User size={11} className="text-slate-400" /> Ref: {item.relatedEntity}
                          </span>
                          {item.meetingUrl && item.status === 'Pendente' && (
                            <a
                              href={item.meetingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-500 font-bold hover:underline flex items-center gap-0.5"
                            >
                              <Video size={11} /> Entrar na Sala Virtual
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        {item.status !== 'Concluído' && (
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'Concluído')}
                            className="p-1.5 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors cursor-pointer"
                            title="Marcar como concluído"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                        {item.status !== 'Cancelado' && (
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'Cancelado')}
                            className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Cancelar compromisso"
                          >
                            <X size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => setItemToDeleteId(item.id)}
                          className="p-1.5 hover:bg-slate-500/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="Remover permanentemente"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Mini Calendar card helper (4 columns) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Resumo de Eventos
          </h3>
          <p className="text-xs text-slate-400">Visão geral do desempenho e ocupação da agenda.</p>

          <div className="p-4 bg-indigo-500/5 dark:bg-indigo-500/5 rounded-2xl border border-indigo-500/10 space-y-3.5 text-xs">
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 font-semibold">
              <span>Total Agendado</span>
              <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">{agenda.length}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 font-semibold">
              <span>Concluídos</span>
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                {agenda.filter((a) => a.status === 'Concluído').length}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 font-semibold">
              <span>Pendentes</span>
              <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                {agenda.filter((a) => a.status === 'Pendente' || !a.status).length}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 font-semibold pt-2 border-t border-indigo-500/10">
              <span>Apresentações</span>
              <span className="font-mono font-black text-purple-600 dark:text-purple-400 text-sm">
                {agenda.filter((a) => a.type === 'Apresentação').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )}

      {/* DRAWER FORM */}
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
              className="relative w-full max-w-md bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col z-10 p-6 border-l border-slate-200 dark:border-slate-900 overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-900 mb-6">
                <h3 className="text-md font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Agendar Compromisso
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Título do Evento *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Apresentação Protótipo AI Chatbot"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Data *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Horário *</label>
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Tipo de Evento</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-bold text-xs"
                    >
                      <option value="Reunião">📞 Reunião Comercial</option>
                      <option value="Apresentação">💻 Apresentação Técnica</option>
                      <option value="Follow-up">🔁 Follow-up de Escopo</option>
                      <option value="Outro">📝 Outros compromissos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Empresa / Lead Vinculado</label>
                    <select
                      value={linkedId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLinkedId(val);
                        const found = recipients.find(r => r.id === val);
                        if (found) {
                          setRelatedEntity(found.name.split(' (')[0]);
                          setLinkedType(found.type.toLowerCase() as any);
                        } else {
                          setRelatedEntity('');
                          setLinkedType(undefined);
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-bold text-xs"
                    >
                      <option value="">Geral (Sem vínculo)</option>
                      {recipients.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Link da Sala Virtual (Google Meet, etc)</label>
                  <input
                    type="url"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="https://meet.google.com/abc-defg-hij"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Pauta / Detalhes</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição sumária dos pontos a serem abordados..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                  >
                    Agendar Evento
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
        title="Desmarcar Compromisso"
        message="Deseja realmente desmarcar este compromisso? Informe uma justificativa para prosseguir."
        onConfirm={async (justification) => {
          if (itemToDeleteId) {
            const item = agenda.find(a => a.id === itemToDeleteId);
            if (item) {
              await onDeleteAgenda(itemToDeleteId, justification, item);
            }
          }
          setItemToDeleteId(null);
        }}
        onCancel={() => setItemToDeleteId(null)}
      />
    </div>
  );
}
