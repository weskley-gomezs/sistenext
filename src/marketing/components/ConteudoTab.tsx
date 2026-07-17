import React, { useState } from 'react';
import {
  Plus,
  Trash,
  Edit,
  Sparkles,
  Video,
  Instagram,
  FileText,
  Calendar,
  CheckCircle,
  ExternalLink,
  Copy,
  Info
} from 'lucide-react';
import { Conteudo } from '../types';
import { aiService } from '../services/aiService';

interface ConteudoTabProps {
  conteudos: Conteudo[];
  onAdd: (item: any) => Promise<any>;
  onUpdate: (id: string, item: any) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
}

export default function ConteudoTab({ conteudos, onAdd, onUpdate, onDelete }: ConteudoTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Conteudo | null>(null);

  // AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiNicho, setAiNicho] = useState('Dono de Auto Center');
  const [aiTopic, setAiTopic] = useState('Como um sistema reduz erros de faturamento');

  // Form states
  const [formTitulo, setFormTitulo] = useState('');
  const [formTipo, setFormTipo] = useState('Reels');
  const [formObjetivo, setFormObjetivo] = useState('');
  const [formData, setFormData] = useState(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState('Rascunho');
  const [formCanal, setFormCanal] = useState('Instagram');
  const [formHashtags, setFormHashtags] = useState('');
  const [formCta, setFormCta] = useState('');
  const [formRoteiro, setFormRoteiro] = useState('');
  const [formLinkArte, setFormLinkArte] = useState('');
  const [formLinkVideo, setFormLinkVideo] = useState('');

  const openAddModal = () => {
    setEditingItem(null);
    setFormTitulo('');
    setFormTipo('Reels');
    setFormObjetivo('');
    setFormData(new Date().toISOString().split('T')[0]);
    setFormStatus('Rascunho');
    setFormCanal('Instagram');
    setFormHashtags('');
    setFormCta('');
    setFormRoteiro('');
    setFormLinkArte('');
    setFormLinkVideo('');
    setShowModal(true);
  };

  const openEditModal = (item: Conteudo) => {
    setEditingItem(item);
    setFormTitulo(item.titulo);
    setFormTipo(item.tipo);
    setFormObjetivo(item.objetivo || '');
    setFormData(item.data || '');
    setFormStatus(item.status);
    setFormCanal(item.canal);
    setFormHashtags(item.hashtags || '');
    setFormCta(item.cta || '');
    setFormRoteiro(item.roteiro || '');
    setFormLinkArte(item.linkArte || '');
    setFormLinkVideo(item.linkVideo || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      titulo: formTitulo,
      tipo: formTipo,
      objetivo: formObjetivo,
      data: formData,
      status: formStatus,
      canal: formCanal,
      hashtags: formHashtags,
      cta: formCta,
      roteiro: formRoteiro,
      linkArte: formLinkArte,
      linkVideo: formLinkVideo
    };

    try {
      if (editingItem) {
        await onUpdate(editingItem.id, payload);
      } else {
        await onAdd(payload);
      }
      setShowModal(false);
    } catch (err) {
      alert('Erro ao salvar conteúdo: ' + err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta pauta de conteúdo?')) {
      await onDelete(id);
    }
  };

  const handleGenerateScript = async () => {
    setAiLoading(true);
    setAiResult('');
    try {
      const res = await aiService.generateVideoScript(aiTopic, `Engajar o nicho de ${aiNicho} e fazê-los querer um software sob medida.`);
      setAiResult(res);
    } catch (err: any) {
      setAiResult('Erro ao gerar com IA: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateCarousel = async () => {
    setAiLoading(true);
    setAiResult('');
    try {
      const res = await aiService.generateInstagramContent(aiNicho, aiTopic);
      setAiResult(res);
    } catch (err: any) {
      setAiResult('Erro ao gerar com IA: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            ✍️ Cronograma de Produção de Conteúdo
          </h2>
          <p className="text-xs text-slate-400">
            Pauta editorial de redes sociais e artigos da software house para educar e capturar novos leads.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setAiResult('');
              setShowAiModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/20 hover:border-transparent rounded-lg text-xs font-bold transition-all"
          >
            <Sparkles size={14} /> Redator IA de Posts
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white font-bold rounded-lg text-xs hover:bg-indigo-500 transition-all shadow-md"
          >
            <Plus size={14} /> Criar Pauta
          </button>
        </div>
      </div>

      {/* Grid */}
      {conteudos.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/40 text-slate-500 text-center space-y-3">
          <Instagram size={36} className="text-slate-600" />
          <div className="text-sm font-semibold">Sem conteúdos planejados</div>
          <p className="text-xs text-slate-500 max-w-xs">
            Crie roteiros de vídeos ou carrosséis para atrair empresas no Instagram, YouTube ou LinkedIn.
          </p>
          <button
            onClick={openAddModal}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-bold transition-all"
          >
            Criar Nova Pauta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {conteudos.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition-all flex flex-col justify-between group relative"
            >
              <div className="space-y-4">
                {/* Title */}
                <div className="flex items-start justify-between border-b border-slate-800/60 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] bg-indigo-500/15 text-indigo-400 font-extrabold px-2 py-0.5 rounded">
                        {item.tipo}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase font-bold">
                        {item.canal}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-slate-100 mt-2">{item.titulo}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 hover:bg-red-500/10 rounded text-slate-500 hover:text-red-400"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs">
                  {item.objetivo && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Objetivo:</span>
                      <span className="font-semibold text-slate-300 truncate max-w-[180px]">{item.objetivo}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-slate-500">Data de veiculação:</span>
                    <span className="font-mono text-slate-400 font-bold">
                      {new Date(item.data).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  {item.cta && (
                    <div className="bg-slate-950/20 p-2 rounded border border-slate-850">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block mb-0.5">CTA da legenda</span>
                      <p className="text-slate-300 italic">{item.cta}</p>
                    </div>
                  )}

                  {item.roteiro && (
                    <div className="pt-2 border-t border-slate-800/40">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block mb-0.5">Roteiro / Ideia</span>
                      <p className="text-slate-400 truncate-2-lines">{item.roteiro}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                  item.status === 'Publicado'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : item.status === 'Agendado'
                    ? 'bg-sky-500/15 text-sky-400'
                    : 'bg-amber-500/15 text-amber-400'
                }`}>
                  {item.status}
                </span>

                <div className="flex items-center gap-2">
                  {item.linkArte && (
                    <a href={item.linkArte} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
                      Arte <ExternalLink size={10} />
                    </a>
                  )}
                  {item.linkVideo && (
                    <a href={item.linkVideo} target="_blank" rel="noreferrer" className="text-rose-400 hover:text-rose-300 flex items-center gap-0.5">
                      Vídeo <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REDATOR IA POPUP */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-indigo-400" size={20} />
                <h3 className="text-sm font-bold text-slate-100">Redator Editorial IA - Gemini</h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded text-xs font-semibold"
              >
                Fechar
              </button>
            </div>

            {/* AI Customization fields */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-3.5 rounded-lg border border-slate-800/60 mb-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Nicho / Persona de Foco</label>
                <input
                  type="text"
                  value={aiNicho}
                  onChange={(e) => setAiNicho(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 outline-none"
                  placeholder="e.g. Dentistas, Auto Mecânicas"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Tema / Dor Central</label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 outline-none"
                  placeholder="e.g. Por que planilhas geram rombo financeiro"
                />
              </div>

              <div className="col-span-2 grid grid-cols-2 gap-2 pt-2">
                <button
                  disabled={aiLoading}
                  onClick={handleGenerateScript}
                  className="py-2 bg-indigo-600 text-white hover:bg-indigo-500 rounded font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-45"
                >
                  <Video size={14} /> Roteiro de Vídeo (Reels)
                </button>
                <button
                  disabled={aiLoading}
                  onClick={handleGenerateCarousel}
                  className="py-2 bg-purple-600 text-white hover:bg-purple-500 rounded font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-45"
                >
                  <Instagram size={14} /> Carrossel Instagram
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-y-auto min-h-[220px]">
              {aiLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : aiResult ? (
                <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed select-all">
                  {aiResult}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-1 text-center">
                  <Info size={16} />
                  <span className="text-[10px]">Defina o nicho e tema acima, escolha o formato e mande gerar!</span>
                </div>
              )}
            </div>

            {aiResult && (
              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(aiResult);
                    alert('Copiado para a área de transferência!');
                  }}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-all"
                >
                  📋 Copiar Rascunho de Conteúdo
                </button>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg text-xs"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">
              {editingItem ? '✏️ Editar Pauta' : '✍️ Nova Pauta Editorial'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Título / Assunto Central *</label>
                <input
                  type="text"
                  required
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="e.g. 5 Dores que mostram que sua clínica precisa de um ERP"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo de Conteúdo</label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  >
                    {['Reels', 'Vídeo', 'Carrossel', 'Story', 'Post', 'Artigo', 'Short'].map((tp) => (
                      <option key={tp} value={tp}>{tp}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rede / Canal</label>
                  <select
                    value={formCanal}
                    onChange={(e) => setFormCanal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  >
                    {['Instagram', 'TikTok', 'Facebook', 'YouTube', 'LinkedIn', 'Threads', 'Site'].map((cn) => (
                      <option key={cn} value={cn}>{cn}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Objetivo Editorial</label>
                  <input
                    type="text"
                    value={formObjetivo}
                    onChange={(e) => setFormObjetivo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="e.g. Autoridade, Vendas, Atração"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data da Postagem *</label>
                  <input
                    type="date"
                    required
                    value={formData}
                    onChange={(e) => setFormData(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Chamada para Ação (CTA)</label>
                  <input
                    type="text"
                    value={formCta}
                    onChange={(e) => setFormCta(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="e.g. Comente QUERO para receber um diagnóstico gratuito"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Hashtags Recomendadas</label>
                  <input
                    type="text"
                    value={formHashtags}
                    onChange={(e) => setFormHashtags(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="#erp #odontologia #softwaresobmedida"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Roteiro / Texto da Legenda</label>
                <textarea
                  rows={4}
                  value={formRoteiro}
                  onChange={(e) => setFormRoteiro(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="Escreva o roteiro de fala ou a legenda completa do post..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Link do Arquivo da Arte (Canva/Figma)</label>
                  <input
                    type="text"
                    value={formLinkArte}
                    onChange={(e) => setFormLinkArte(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="https://canva.com/..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Link do Vídeo Finalizado (Drive/YouTube)</label>
                  <input
                    type="text"
                    value={formLinkVideo}
                    onChange={(e) => setFormLinkVideo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status da Pauta</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  >
                    <option value="Rascunho">Rascunho</option>
                    <option value="Agendado">Agendado</option>
                    <option value="Publicado">Publicado</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-lg text-xs hover:bg-slate-75"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-xs hover:bg-indigo-500 transition-all shadow-md"
                >
                  Salvar Pauta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
