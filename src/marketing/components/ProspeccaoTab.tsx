import React, { useState } from 'react';
import {
  Plus,
  Trash,
  Edit,
  ArrowRight,
  ArrowLeft,
  Phone,
  MessageSquare,
  MapPin,
  Sparkles,
  ExternalLink,
  Globe,
  Star,
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Prospeccao } from '../types';
import { aiService } from '../services/aiService';

interface ProspeccaoTabProps {
  prospeccoes: Prospeccao[];
  onAdd: (item: any) => Promise<any>;
  onUpdate: (id: string, item: any) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
}

const COLUMNS: Array<Prospeccao['status']> = [
  'Novo',
  'Contato enviado',
  'Respondeu',
  'Reunião marcada',
  'Proposta enviada',
  'Negociação',
  'Cliente',
  'Perdido'
];

const COLUMN_COLORS: Record<Prospeccao['status'], string> = {
  'Novo': 'border-t-sky-500 bg-sky-500/5',
  'Contato enviado': 'border-t-indigo-500 bg-indigo-500/5',
  'Respondeu': 'border-t-purple-500 bg-purple-500/5',
  'Reunião marcada': 'border-t-amber-500 bg-amber-500/5',
  'Proposta enviada': 'border-t-pink-500 bg-pink-500/5',
  'Negociação': 'border-t-orange-500 bg-orange-500/5',
  'Cliente': 'border-t-emerald-500 bg-emerald-500/5',
  'Perdido': 'border-t-rose-500 bg-rose-500/5'
};

const COLUMN_BADGES: Record<Prospeccao['status'], string> = {
  'Novo': 'bg-sky-500/10 text-sky-400',
  'Contato enviado': 'bg-indigo-500/10 text-indigo-400',
  'Respondeu': 'bg-purple-500/10 text-purple-400',
  'Reunião marcada': 'bg-amber-500/10 text-amber-400',
  'Proposta enviada': 'bg-pink-500/10 text-pink-400',
  'Negociação': 'bg-orange-500/10 text-orange-400',
  'Cliente': 'bg-emerald-500/10 text-emerald-400',
  'Perdido': 'bg-rose-500/10 text-rose-400'
};

export default function ProspeccaoTab({ prospeccoes, onAdd, onUpdate, onDelete }: ProspeccaoTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Prospeccao | null>(null);
  const [aiModal, setAiModal] = useState<Prospeccao | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiType, setAiType] = useState<'message' | 'followup' | 'objection'>('message');
  const [aiChannel, setAiChannel] = useState('WhatsApp');
  const [aiObjection, setAiObjection] = useState('Está muito caro');

  // Form states
  const [formName, setFormName] = useState('');
  const [formSegment, setFormSegment] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formInstagram, setFormInstagram] = useState('');
  const [formSite, setFormSite] = useState('');
  const [formGoogleMaps, setFormGoogleMaps] = useState('');
  const [formRatingCount, setFormRatingCount] = useState(0);
  const [formRatingVal, setFormRatingVal] = useState(5);
  const [formHasSite, setFormHasSite] = useState(false);
  const [formHasSys, setFormHasSys] = useState(false);
  const [formSysName, setFormSysName] = useState('');
  const [formRep, setFormRep] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<Prospeccao['status']>('Novo');
  const [formLossReason, setFormLossReason] = useState('');

  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormSegment('');
    setFormCity('');
    setFormState('');
    setFormPhone('');
    setFormWhatsapp('');
    setFormEmail('');
    setFormInstagram('');
    setFormSite('');
    setFormGoogleMaps('');
    setFormRatingCount(0);
    setFormRatingVal(5);
    setFormHasSite(false);
    setFormHasSys(false);
    setFormSysName('');
    setFormRep('');
    setFormNotes('');
    setFormStatus('Novo');
    setFormLossReason('');
    setShowModal(true);
  };

  const openEditModal = (item: Prospeccao) => {
    setEditingItem(item);
    setFormName(item.nome);
    setFormSegment(item.segmento);
    setFormCity(item.cidade || '');
    setFormState(item.estado || '');
    setFormPhone(item.telefone || '');
    setFormWhatsapp(item.whatsapp || '');
    setFormEmail(item.email || '');
    setFormInstagram(item.instagram || '');
    setFormSite(item.site || '');
    setFormGoogleMaps(item.googleMaps || '');
    setFormRatingCount(item.quantidadeAvaliacoes || 0);
    setFormRatingVal(item.notaMedia || 5);
    setFormHasSite(item.possuiSite || false);
    setFormHasSys(item.possuiSistema || false);
    setFormSysName(item.sistemaUtilizado || '');
    setFormRep(item.responsavel || '');
    setFormNotes(item.observacoes || '');
    setFormStatus(item.status);
    setFormLossReason(item.motivoDaPerda || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nome: formName,
      segmento: formSegment,
      cidade: formCity,
      estado: formState,
      telefone: formPhone,
      whatsapp: formWhatsapp,
      email: formEmail,
      instagram: formInstagram,
      site: formSite,
      googleMaps: formGoogleMaps,
      quantidadeAvaliacoes: Number(formRatingCount),
      notaMedia: Number(formRatingVal),
      possuiSite: formHasSite,
      possuiSistema: formHasSys,
      sistemaUtilizado: formSysName,
      responsavel: formRep,
      status: formStatus,
      motivoDaPerda: formStatus === 'Perdido' ? formLossReason : '',
      observacoes: formNotes
    };

    try {
      if (editingItem) {
        await onUpdate(editingItem.id, payload);
      } else {
        await onAdd(payload);
      }
      setShowModal(false);
    } catch (err) {
      alert('Erro ao salvar registro: ' + err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta prospecção?')) {
      await onDelete(id);
    }
  };

  const moveCard = async (item: Prospeccao, direction: 'left' | 'right') => {
    const currentIndex = COLUMNS.indexOf(item.status);
    let newIndex = currentIndex;
    if (direction === 'left' && currentIndex > 0) newIndex--;
    if (direction === 'right' && currentIndex < COLUMNS.length - 1) newIndex++;

    if (newIndex !== currentIndex) {
      await onUpdate(item.id, { status: COLUMNS[newIndex] });
    }
  };

  const generateAiContent = async () => {
    if (!aiModal) return;
    setAiLoading(true);
    setAiResult('');
    try {
      let result = '';
      if (aiType === 'message') {
        result = await aiService.generateOutreachMessage(
          aiModal.nome,
          aiModal.segmento,
          aiModal.observacoes,
          aiChannel
        );
      } else if (aiType === 'followup') {
        result = await aiService.generateFollowUp(
          aiModal.nome,
          'Apresentamos a proposta comercial e aguardamos o retorno técnico.',
          aiModal.status
        );
      } else {
        result = await aiService.generateObjectionHandlers(
          aiObjection,
          `Sistema personalizado sob medida de alta performance para ${aiModal.segmento}`
        );
      }
      setAiResult(result);
    } catch (err: any) {
      setAiResult('Erro ao gerar com IA: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            📊 Funil de Prospecção & CRM
          </h2>
          <p className="text-xs text-slate-400">
            Gerencie o pipeline de vendas da sua software house. Mova leads pelas etapas do funil de vendas.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-xs hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/15"
        >
          <Plus size={16} /> Add Prospecto
        </button>
      </div>

      {/* Kanban Board Container */}
      <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-800">
        <div className="flex gap-4 min-w-[1600px] h-[calc(100vh-280px)] min-h-[500px]">
          {COLUMNS.map((colName) => {
            const cardsInCol = prospeccoes.filter((p) => p.status === colName);
            return (
              <div
                key={colName}
                className="w-80 flex flex-col bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden shadow-inner"
              >
                {/* Column Title Header */}
                <div className={`p-3 border-t-4 border-b border-slate-800 ${COLUMN_COLORS[colName]} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${COLUMN_BADGES[colName]}`}>
                      {colName}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {cardsInCol.length} {cardsInCol.length === 1 ? 'card' : 'cards'}
                  </span>
                </div>

                {/* Cards Scrolling Body */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-3 custom-scrollbar">
                  {cardsInCol.length === 0 ? (
                    <div className="h-28 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-lg text-[10px] text-slate-600">
                      Nenhum prospecto aqui
                    </div>
                  ) : (
                    cardsInCol.map((item) => (
                      <motion.div
                        layout
                        key={item.id}
                        className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-3 rounded-lg shadow-sm hover:shadow-md transition-all space-y-3 group relative"
                      >
                        {/* Title and Edit/Delete */}
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-100 truncate" title={item.nome}>
                              {item.nome}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-medium truncate">
                              {item.segmento}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                              title="Editar"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1 hover:bg-red-500/10 rounded text-slate-500 hover:text-red-400"
                              title="Excluir"
                            >
                              <Trash size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Location and Metadata */}
                        <div className="space-y-1.5 text-[10px]">
                          {(item.cidade || item.estado) && (
                            <div className="flex items-center gap-1 text-slate-500">
                              <MapPin size={10} />
                              <span>{item.cidade} - {item.estado}</span>
                            </div>
                          )}

                          {/* Contact buttons */}
                          <div className="flex items-center gap-2 mt-2">
                            {item.whatsapp && (
                              <a
                                href={`https://wa.me/${item.whatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                              >
                                <MessageSquare size={10} /> WhatsApp
                              </a>
                            )}
                            {item.telefone && (
                              <a
                                href={`tel:${item.telefone}`}
                                className="flex items-center gap-1 text-sky-400 hover:text-sky-300"
                              >
                                <Phone size={10} /> Ligar
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Ratings or Site Details */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/60 text-[9px]">
                          {item.notaMedia > 0 && (
                            <span className="flex items-center gap-0.5 text-amber-400 bg-amber-400/5 px-1 py-0.2 rounded">
                              <Star size={8} fill="currentColor" /> {item.notaMedia} ({item.quantidadeAvaliacoes})
                            </span>
                          )}
                          {item.possuiSite ? (
                            <span className="flex items-center gap-0.5 text-teal-400 bg-teal-400/5 px-1 py-0.2 rounded">
                              <Globe size={8} /> Site Ativo
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5 text-rose-400 bg-rose-400/5 px-1 py-0.2 rounded">
                              Sem Site 🚨
                            </span>
                          )}
                          {item.possuiSistema ? (
                            <span className="text-indigo-400 bg-indigo-500/5 px-1 py-0.2 rounded truncate max-w-[120px]">
                              Sist: {item.sistemaUtilizado || 'Sim'}
                            </span>
                          ) : (
                            <span className="text-amber-400 bg-amber-500/5 px-1 py-0.2 rounded">
                              Sem Sistema ⚠️
                            </span>
                          )}
                        </div>

                        {/* Gemini Copilot Action Button */}
                        <button
                          onClick={() => {
                            setAiModal(item);
                            setAiResult('');
                            setAiType('message');
                            setAiLoading(false);
                          }}
                          className="w-full py-1 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-transparent rounded font-bold text-[9px] flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Sparkles size={10} /> Copilot IA Prospectar
                        </button>

                        {/* Manual Move controls */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/40">
                          <button
                            disabled={COLUMNS.indexOf(item.status) === 0}
                            onClick={() => moveCard(item, 'left')}
                            className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-500 hover:text-slate-200"
                          >
                            <ArrowLeft size={10} />
                          </button>
                          <span className="text-[8px] font-mono font-bold text-slate-600 uppercase tracking-widest">
                            Mover
                          </span>
                          <button
                            disabled={COLUMNS.indexOf(item.status) === COLUMNS.length - 1}
                            onClick={() => moveCard(item, 'right')}
                            className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-500 hover:text-slate-200"
                          >
                            <ArrowRight size={10} />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">
              {editingItem ? '✏️ Editar Prospecto' : '🚀 Novo Prospecto'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome da Empresa *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="Auto Mecânica Silva"
                  />
                </div>

                {/* Segmento */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Segmento *</label>
                  <input
                    type="text"
                    required
                    value={formSegment}
                    onChange={(e) => setFormSegment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="Mecânica, Clínicas, Supermercado"
                  />
                </div>

                {/* Cidade */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cidade</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="São Paulo"
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="SP"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Telefone / Fixo</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="(11) 3333-3333"
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">WhatsApp de Prospecção</label>
                  <input
                    type="text"
                    value={formWhatsapp}
                    onChange={(e) => setFormWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="11999999999"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="contato@empresa.com"
                  />
                </div>

                {/* Instagram */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Instagram (@)</label>
                  <input
                    type="text"
                    value={formInstagram}
                    onChange={(e) => setFormInstagram(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="@mecanicasilva"
                  />
                </div>

                {/* Site */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">URL do Site</label>
                  <input
                    type="text"
                    value={formSite}
                    onChange={(e) => setFormSite(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="https://empresa.com.br"
                  />
                </div>

                {/* Google Maps link */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Link do Google Maps</label>
                  <input
                    type="text"
                    value={formGoogleMaps}
                    onChange={(e) => setFormGoogleMaps(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="https://maps.google.com/..."
                  />
                </div>

                {/* Google Ratings Count */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qtd de Avaliações (G-Maps)</label>
                  <input
                    type="number"
                    value={formRatingCount}
                    onChange={(e) => setFormRatingCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="35"
                  />
                </div>

                {/* Average Rating Value */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nota Média (G-Maps)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formRatingVal}
                    onChange={(e) => setFormRatingVal(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="4.8"
                  />
                </div>
              </div>

              {/* Checkboxes for Presence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasSite"
                    checked={formHasSite}
                    onChange={(e) => setFormHasSite(e.target.checked)}
                    className="rounded border-slate-800 text-indigo-600 bg-slate-950"
                  />
                  <label htmlFor="hasSite" className="text-xs font-semibold text-slate-300">Possui Site Web Ativo?</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasSys"
                    checked={formHasSys}
                    onChange={(e) => setFormHasSys(e.target.checked)}
                    className="rounded border-slate-800 text-indigo-600 bg-slate-950"
                  />
                  <label htmlFor="hasSys" className="text-xs font-semibold text-slate-300">Já possui sistema de gestão?</label>
                </div>

                {formHasSys && (
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qual sistema de gestão é utilizado?</label>
                    <input
                      type="text"
                      value={formSysName}
                      onChange={(e) => setFormSysName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                      placeholder="e.g. Alterdata, Omie, ERP interno"
                    />
                  </div>
                )}
              </div>

              {/* Status and Loss Reason */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status do Funil *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as Prospeccao['status'])}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  >
                    {COLUMNS.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Responsável Comercial</label>
                  <input
                    type="text"
                    value={formRep}
                    onChange={(e) => setFormRep(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="João Silva"
                  />
                </div>

                {formStatus === 'Perdido' && (
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Motivo da Perda</label>
                    <input
                      type="text"
                      value={formLossReason}
                      onChange={(e) => setFormLossReason(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                      placeholder="Preço alto, Sem tempo para implementar, Já fechou com concorrente"
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dores do Cliente / Observações</label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="Anotar problemas que encontrou no Maps ou ao ligar. e.g. Reclamações de clientes sobre demora no faturamento."
                />
              </div>

              {/* Submit / Cancel */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-lg text-xs hover:bg-slate-750 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-xs hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/15"
                >
                  Salvar Prospecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GEMINI AI COPILOT MODAL */}
      <AnimatePresence>
        {aiModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-indigo-400" size={20} />
                  <div>
                    <h3 className="text-md font-bold text-slate-100">Copilot IA - Assistente de Prospecção</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Empresa: {aiModal.nome} ({aiModal.segmento})</p>
                  </div>
                </div>
                <button
                  onClick={() => setAiModal(null)}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                >
                  <Check size={18} />
                </button>
              </div>

              {/* Utility Type Selection */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={() => setAiType('message')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                    aiType === 'message'
                      ? 'bg-indigo-600 border-transparent text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  💬 Mensagem Fria
                </button>
                <button
                  onClick={() => setAiType('followup')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                    aiType === 'followup'
                      ? 'bg-indigo-600 border-transparent text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🔄 Follow-up Sutil
                </button>
                <button
                  onClick={() => setAiType('objection')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                    aiType === 'objection'
                      ? 'bg-indigo-600 border-transparent text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🛡️ Contornar Objeções
                </button>
              </div>

              {/* Context Options */}
              <div className="space-y-3 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60 mb-4 text-xs">
                {aiType === 'message' && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Canal de Envio</span>
                    <select
                      value={aiChannel}
                      onChange={(e) => setAiChannel(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 outline-none"
                    >
                      <option value="WhatsApp">WhatsApp Direct</option>
                      <option value="Instagram Direct">Instagram Direct</option>
                      <option value="LinkedIn">LinkedIn InMail</option>
                      <option value="Cold Email">E-mail Comercial</option>
                    </select>
                  </div>
                )}

                {aiType === 'objection' && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Selecione a Objeção Comercial</span>
                    <select
                      value={aiObjection}
                      onChange={(e) => setAiObjection(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 outline-none"
                    >
                      <option value="Está muito caro">"Está muito caro, nosso orçamento está apertado"</option>
                      <option value="Já temos planilhas Excel">"Já controlamos tudo por planilhas Excel muito bem"</option>
                      <option value="Não temos tempo para implantar agora">"Estamos sem tempo para treinar a equipe e implantar agora"</option>
                      <option value="Já temos outro sistema">"Já temos outro sistema contratado, mesmo que seja limitado"</option>
                    </select>
                  </div>
                )}

                <div className="text-[10px] text-slate-500">
                  A IA usará o segmento e observações salvas do prospecto para gerar argumentos imbatíveis de marketing.
                </div>
              </div>

              {/* Generate button */}
              <button
                disabled={aiLoading}
                onClick={generateAiContent}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {aiLoading ? (
                  <>Processando no Gemini...</>
                ) : (
                  <>
                    <Sparkles size={14} /> Gerar Roteiro / Conteúdo Personalizado
                  </>
                )}
              </button>

              {/* Output Content */}
              <div className="flex-1 mt-4 overflow-y-auto min-h-[180px] bg-slate-950 border border-slate-800/80 rounded-lg p-3.5 relative">
                {aiLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  </div>
                ) : aiResult ? (
                  <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed select-all">
                    {aiResult}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-1.5 py-6">
                    <Info size={18} />
                    <span className="text-[10px]">O conteúdo gerado pela inteligência artificial aparecerá aqui.</span>
                  </div>
                )}
              </div>

              {/* Actions: Copy or Close */}
              {aiResult && (
                <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(aiResult);
                      alert('Copiado para a área de transferência!');
                    }}
                    className="px-4 py-1.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white font-semibold rounded-lg text-xs transition-all border border-emerald-500/20"
                  >
                    📋 Copiar Texto
                  </button>
                  <button
                    onClick={() => setAiModal(null)}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg text-xs transition-all"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
