import React, { useState } from 'react';
import {
  Plus,
  Trash,
  Edit,
  Sparkles,
  Search,
  Building,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { Nicho } from '../types';
import { aiService } from '../services/aiService';

interface NichosTabProps {
  nichos: Nicho[];
  onAdd: (item: any) => Promise<any>;
  onUpdate: (id: string, item: any) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
}

export default function NichosTab({ nichos, onAdd, onUpdate, onDelete }: NichosTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Nicho | null>(null);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNicho, setAiNicho] = useState<Nicho | null>(null);

  // Form states
  const [formNome, setFormNome] = useState('');
  const [formQtd, setFormQtd] = useState(0);
  const [formProblemas, setFormProblemas] = useState('');
  const [formSolucoes, setFormSolucoes] = useState('');
  const [formSistemaIdeal, setFormSistemaIdeal] = useState('');
  const [formStatus, setFormStatus] = useState<Nicho['status']>('Em Pesquisa');
  const [formPrioridade, setFormPrioridade] = useState<Nicho['prioridade']>('Média');
  const [formObs, setFormObs] = useState('');

  const openAddModal = () => {
    setEditingItem(null);
    setFormNome('');
    setFormQtd(0);
    setFormProblemas('');
    setFormSolucoes('');
    setFormSistemaIdeal('');
    setFormStatus('Em Pesquisa');
    setFormPrioridade('Média');
    setFormObs('');
    setShowModal(true);
  };

  const openEditModal = (item: Nicho) => {
    setEditingItem(item);
    setFormNome(item.nome);
    setFormQtd(item.quantidadeEmpresas);
    setFormProblemas(item.problemasEncontrados);
    setFormSolucoes(item.solucoesPossiveis);
    setFormSistemaIdeal(item.sistemaIdeal);
    setFormStatus(item.status);
    setFormPrioridade(item.prioridade);
    setFormObs(item.observacoes || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nome: formNome,
      quantidadeEmpresas: Number(formQtd),
      problemasEncontrados: formProblemas,
      solucoesPossiveis: formSolucoes,
      sistemaIdeal: formSistemaIdeal,
      status: formStatus,
      prioridade: formPrioridade,
      observacoes: formObs
    };

    try {
      if (editingItem) {
        await onUpdate(editingItem.id, payload);
      } else {
        await onAdd(payload);
      }
      setShowModal(false);
    } catch (err) {
      alert('Erro ao salvar nicho: ' + err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Deseja excluir este mapeamento de nicho?')) {
      await onDelete(id);
    }
  };

  const triggerSuggestSystem = async (nicho: Nicho) => {
    setAiNicho(nicho);
    setAiLoading(true);
    setAiResult('');
    try {
      const result = await aiService.suggestCustomSystems(
        nicho.nome,
        nicho.problemasEncontrados || 'Dificuldade de controle de estoque, agenda de clientes desorganizada, falta de controle financeiro.'
      );
      setAiResult(result);
    } catch (err: any) {
      setAiResult('Erro ao sugerir sistema: ' + err.message);
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
            🎯 Nichos de Mercado Mapeados
          </h2>
          <p className="text-xs text-slate-400">
            Cadastre segmentos de mercado que a sua software house pretende prospectar. Identifique as dores e a solução ideal.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-xs hover:bg-indigo-500 transition-all shadow-md"
        >
          <Plus size={16} /> Mapear Nicho
        </button>
      </div>

      {/* Grid */}
      {nichos.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/40 text-slate-500 text-center space-y-3">
          <Building size={36} className="text-slate-600" />
          <div className="text-sm font-semibold">Sem nichos mapeados</div>
          <p className="text-xs text-slate-500 max-w-xs">
            Registre setores da economia como Auto Peças, Dentistas ou Academias para planejar suas campanhas de vendas.
          </p>
          <button
            onClick={openAddModal}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-bold transition-all"
          >
            Começar Mapeamento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nichos.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-all group relative"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-800/60 pb-3">
                  <div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      item.status === 'Ativo'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : item.status === 'Em Pesquisa'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {item.status}
                    </span>
                    <h3 className="text-sm font-black text-slate-100 mt-2">{item.nome}</h3>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  <div className="flex justify-between">
                    <span className="text-slate-500">Empresas estimadas:</span>
                    <span className="font-bold text-slate-300 font-mono">{item.quantidadeEmpresas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Prioridade de foco:</span>
                    <span className={`font-semibold ${
                      item.prioridade === 'Alta' ? 'text-rose-400' : item.prioridade === 'Média' ? 'text-amber-400' : 'text-slate-400'
                    }`}>{item.prioridade}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-800/40">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase block mb-1">Dores Principais</span>
                    <p className="text-slate-300 font-medium leading-relaxed truncate-2-lines">{item.problemasEncontrados}</p>
                  </div>

                  {item.sistemaIdeal && (
                    <div className="pt-2 border-t border-slate-800/40">
                      <span className="text-[10px] font-bold text-teal-400 uppercase block mb-1">Solução / Produto Proposto</span>
                      <p className="text-slate-300 font-medium leading-relaxed truncate-2-lines">{item.sistemaIdeal}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action AI button */}
              <div className="mt-5 pt-3 border-t border-slate-800/60">
                <button
                  onClick={() => triggerSuggestSystem(item)}
                  className="w-full py-1.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/25 hover:border-transparent rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sparkles size={12} /> Projetar Software c/ IA
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI SYSTEM PREVIEW POPUP */}
      {aiNicho && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-indigo-400" size={20} />
                <h3 className="text-sm font-bold text-slate-100">
                  Arquitetura de Software Ideal para: {aiNicho.nome}
                </h3>
              </div>
              <button
                onClick={() => setAiNicho(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded text-xs font-semibold"
              >
                Fechar
              </button>
            </div>

            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-y-auto min-h-[300px]">
              {aiLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : (
                <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-all">
                  {aiResult}
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
                  📋 Copiar Arquitetura de Pitch
                </button>
                <button
                  onClick={() => setAiNicho(null)}
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
              {editingItem ? '✏️ Editar Nicho' : '🎯 Novo Mapeamento de Nicho'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome do Nicho/Setor *</label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="e.g. Clínicas de Odontologia"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qtd Estimada de Empresas</label>
                  <input
                    type="number"
                    value={formQtd}
                    onChange={(e) => setFormQtd(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Prioridade Comercial</label>
                  <select
                    value={formPrioridade}
                    onChange={(e) => setFormPrioridade(e.target.value as Nicho['prioridade'])}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  >
                    <option value="Alta">Alta (Urguência)</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dores e Problemas Encontrados *</label>
                <textarea
                  required
                  rows={2}
                  value={formProblemas}
                  onChange={(e) => setFormProblemas(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="e.g. Perda de prontuários, falta de acompanhamento de faltas de pacientes."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Soluções Possíveis</label>
                <textarea
                  rows={2}
                  value={formSolucoes}
                  onChange={(e) => setFormSolucoes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="e.g. Dashboard de confirmação via SMS/WhatsApp, agenda drag and drop."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sistema Ideal (Pitacos Iniciais)</label>
                <input
                  type="text"
                  value={formSistemaIdeal}
                  onChange={(e) => setFormSistemaIdeal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="e.g. DentNext - SaaS Odonto"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as Nicho['status'])}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  >
                    <option value="Em Pesquisa">Em Pesquisa</option>
                    <option value="Ativo">Ativo</option>
                    <option value="Descartado">Descartado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Anotações Internas</label>
                  <input
                    type="text"
                    value={formObs}
                    onChange={(e) => setFormObs(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="e.g. Ótima recepção comercial ao ligar."
                  />
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
                  Mapear Nicho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
