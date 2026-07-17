import React, { useState } from 'react';
import {
  Plus,
  Trash,
  Edit,
  Sparkles,
  Lightbulb,
  ThumbsUp,
  Tag,
  Briefcase,
  AlertTriangle,
  Award
} from 'lucide-react';
import { Ideia } from '../types';
import { aiService } from '../services/aiService';

interface IdeiasTabProps {
  ideias: Ideia[];
  onAdd: (item: any) => Promise<any>;
  onUpdate: (id: string, item: any) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
}

export default function IdeiasTab({ ideias, onAdd, onUpdate, onDelete }: IdeiasTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Ideia | null>(null);

  // AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiSegment, setAiSegment] = useState('Clínicas de Estética');

  // Form states
  const [formNome, setFormNome] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formSegmento, setFormSegmento] = useState('');
  const [formProblema, setFormProblema] = useState('');
  const [formSolucao, setFormSolucao] = useState('');
  const [formPotencial, setFormPotencial] = useState('');
  const [formDificuldade, setFormDificuldade] = useState<Ideia['dificuldade']>('Baixa');
  const [formPrioridade, setFormPrioridade] = useState<Ideia['prioridade']>('Média');
  const [formStatus, setFormStatus] = useState<string>('Pesquisa');
  const [formTags, setFormTags] = useState('');

  const openAddModal = () => {
    setEditingItem(null);
    setFormNome('');
    setFormDescricao('');
    setFormSegmento('');
    setFormProblema('');
    setFormSolucao('');
    setFormPotencial('');
    setFormDificuldade('Baixa');
    setFormPrioridade('Média');
    setFormStatus('Pesquisa');
    setFormTags('');
    setShowModal(true);
  };

  const openEditModal = (item: Ideia) => {
    setEditingItem(item);
    setFormNome(item.nome);
    setFormDescricao(item.descricao);
    setFormSegmento(item.segmento);
    setFormProblema(item.problema);
    setFormSolucao(item.solucao);
    setFormPotencial(item.potencialMercado);
    setFormDificuldade(item.dificuldade);
    setFormPrioridade(item.prioridade);
    setFormStatus(item.status);
    setFormTags(item.tags || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nome: formNome,
      descricao: formDescricao,
      segmento: formSegmento,
      problema: formProblema,
      solucao: formSolucao,
      potencialMercado: formPotencial,
      dificuldade: formDificuldade,
      prioridade: formPrioridade,
      status: formStatus,
      tags: formTags
    };

    try {
      if (editingItem) {
        await onUpdate(editingItem.id, payload);
      } else {
        await onAdd(payload);
      }
      setShowModal(false);
    } catch (err) {
      alert('Erro ao salvar ideia: ' + err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta ideia?')) {
      await onDelete(id);
    }
  };

  const triggerBrainstorm = async () => {
    setAiLoading(true);
    setAiResult('');
    try {
      const res = await aiService.suggestCustomSystems(
        aiSegment,
        'Gere 3 ideias de sistemas de iscas gratuitas ou SaaS de alta demanda para este setor.'
      );
      setAiResult(res);
    } catch (err: any) {
      setAiResult('Erro ao obter brainstorm da IA: ' + err.message);
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
            💡 Banco de Ideias & Brainstorming
          </h2>
          <p className="text-xs text-slate-400">
            Armazene e avalie ideias para novos sistemas personalizados, produtos digitais de atração de leads ou ferramentas SaaS de nicho.
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
            <Sparkles size={14} /> Brainstorm c/ IA
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white font-bold rounded-lg text-xs hover:bg-indigo-500 transition-all shadow-md"
          >
            <Plus size={14} /> Registrar Ideia
          </button>
        </div>
      </div>

      {/* Grid */}
      {ideias.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/40 text-slate-500 text-center space-y-3">
          <Lightbulb size={36} className="text-slate-600" />
          <div className="text-sm font-semibold">Sem ideias de produtos registradas</div>
          <p className="text-xs text-slate-500 max-w-xs">
            Mande gerar novas ideias ou registre seus insights técnicos aqui para amadurecer soluções para seus clientes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideias.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition-all flex flex-col justify-between group relative space-y-4"
            >
              <div className="space-y-3">
                {/* Header info */}
                <div className="flex items-start justify-between border-b border-slate-800/60 pb-2">
                  <div>
                    <span className="text-[10px] bg-slate-850 text-slate-400 font-extrabold px-2 py-0.5 rounded uppercase">
                      {item.segmento || 'Geral'}
                    </span>
                    <h3 className="text-sm font-black text-slate-100 mt-2">{item.nome}</h3>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(item)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                      <Edit size={12} />
                    </button>
                    <button onClick={() => handleDeleteItem(item.id)} className="p-1 hover:bg-red-500/10 rounded text-slate-500 hover:text-red-400">
                      <Trash size={12} />
                    </button>
                  </div>
                </div>

                {/* Desc */}
                <p className="text-xs text-slate-300 leading-relaxed font-medium">{item.descricao}</p>

                {/* Problema / Solucao */}
                <div className="space-y-1 bg-slate-950/40 p-2.5 rounded border border-slate-850 text-[11px]">
                  <div>
                    <span className="text-slate-500 font-bold block uppercase text-[8px]">Dor do Cliente:</span>
                    <p className="text-slate-400">{item.problema || 'Não informado'}</p>
                  </div>
                  <div className="pt-1.5 border-t border-slate-850/60 mt-1.5">
                    <span className="text-slate-500 font-bold block uppercase text-[8px]">Solução de Software:</span>
                    <p className="text-emerald-400 font-medium">{item.solucao || 'Não informado'}</p>
                  </div>
                </div>

                {item.tags && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.tags.split(',').map((tag, idx) => (
                      <span key={idx} className="bg-indigo-600/10 text-indigo-400 px-1.5 py-0.5 rounded text-[9px] font-mono">
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Status and priority row */}
              <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                  item.status === 'Favoritos'
                    ? 'bg-amber-500/15 text-amber-400'
                    : item.status === 'Arquivado'
                    ? 'bg-rose-500/15 text-rose-400'
                    : 'bg-slate-850 text-slate-400'
                }`}>
                  {item.status}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-600">Dificuldade:</span>
                  <span className={`font-black ${
                    item.dificuldade === 'Alta' ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {item.dificuldade}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BRAINSTORM IA POPUP */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="text-amber-400" size={20} />
                <h3 className="text-sm font-bold text-slate-100">Brainstorm de Sistemas Customizados c/ IA</h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded text-xs font-semibold"
              >
                Fechar
              </button>
            </div>

            {/* Config target */}
            <div className="bg-slate-950/40 p-3.5 rounded-lg border border-slate-800/60 mb-4 flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Qual nicho ou segmento focar?</label>
                <input
                  type="text"
                  value={aiSegment}
                  onChange={(e) => setAiSegment(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 outline-none"
                  placeholder="e.g. Clínicas Médicas, Imobiliárias, Restaurantes"
                />
              </div>
              <button
                disabled={aiLoading}
                onClick={triggerBrainstorm}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5"
              >
                <Sparkles size={13} /> {aiLoading ? 'Processando...' : 'Gerar Novas Ideias'}
              </button>
            </div>

            {/* Display screen */}
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-y-auto min-h-[250px]">
              {aiLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : aiResult ? (
                <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed select-all">
                  {aiResult}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-1.5 py-8 text-center">
                  <Lightbulb size={20} className="text-slate-600" />
                  <span className="text-[10px]">Escreva o nicho acima e mande a IA conceber softwares inovadores!</span>
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
                  📋 Copiar Ideias
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
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">
              {editingItem ? '✏️ Editar Ideia' : '💡 Cadastrar Nova Ideia de Sistema'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Título do Sistema / Nome *</label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="e.g. SisteNext para Clínicas"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nicho / Segmento *</label>
                  <input
                    type="text"
                    required
                    value={formSegmento}
                    onChange={(e) => setFormSegmento(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="e.g. Clínicas Médicas"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tags (separadas por vírgula)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="SaaS, CRM, Automação"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descrição Geral *</label>
                <textarea
                  required
                  rows={2}
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="Descreva a visão macro do produto..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Problema / Dor Resolvida *</label>
                  <input
                    type="text"
                    required
                    value={formProblema}
                    onChange={(e) => setFormProblema(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="e.g. Faltas de consultas por falta de confirmação"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Solução Oferecida *</label>
                  <input
                    type="text"
                    required
                    value={formSolucao}
                    onChange={(e) => setFormSolucao(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="e.g. Robô automático via Whatsapp"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Dificuldade</label>
                  <select
                    value={formDificuldade}
                    onChange={(e) => setFormDificuldade(e.target.value as Ideia['dificuldade'])}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Prioridade</label>
                  <select
                    value={formPrioridade}
                    onChange={(e) => setFormPrioridade(e.target.value as Ideia['prioridade'])}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  >
                    <option value="Pesquisa">Pesquisa</option>
                    <option value="Favoritos">Favoritos</option>
                    <option value="Rascunho">Rascunho</option>
                    <option value="Arquivado">Arquivado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Potencial de Mercado</label>
                <input
                  type="text"
                  value={formPotencial}
                  onChange={(e) => setFormPotencial(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="e.g. Alto - mais de 500 clínicas na região"
                />
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
                  Salvar Ideia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
