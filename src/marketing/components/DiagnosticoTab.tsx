import React, { useState } from 'react';
import {
  Plus,
  Trash,
  Edit,
  Sparkles,
  ClipboardCheck,
  TrendingDown,
  Coins,
  ArrowRight,
  Info
} from 'lucide-react';
import { Diagnostico } from '../types';
import { aiService } from '../services/aiService';

interface DiagnosticoTabProps {
  diagnosticos: Diagnostico[];
  onAdd: (item: any) => Promise<any>;
  onUpdate: (id: string, item: any) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
}

export default function DiagnosticoTab({ diagnosticos, onAdd, onUpdate, onDelete }: DiagnosticoTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Diagnostico | null>(null);

  // AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiModal, setAiModal] = useState<Diagnostico | null>(null);

  // Form states
  const [formEmpresa, setFormEmpresa] = useState('');
  const [formData, setFormData] = useState(new Date().toISOString().split('T')[0]);
  const [formProblemas, setFormProblemas] = useState('');
  const [formProcessosManuais, setFormProcessosManuais] = useState('');
  const [formTempoPerdido, setFormTempoPerdido] = useState('');
  const [formFuncionarios, setFormFuncionarios] = useState(1);
  const [formFerramentas, setFormFerramentas] = useState('');
  const [formSistemasAtuais, setFormSistemasAtuais] = useState('');
  const [formNecessidades, setFormNecessidades] = useState('');
  const [formSolucoes, setFormSolucoes] = useState('');
  const [formModulos, setFormModulos] = useState('');
  const [formIa, setFormIa] = useState('');
  const [formValor, setFormValor] = useState(0);
  const [formProbabilidade, setFormProbabilidade] = useState(50);
  const [formProximaReuniao, setFormProximaReuniao] = useState('');

  const openAddModal = () => {
    setEditingItem(null);
    setFormEmpresa('');
    setFormData(new Date().toISOString().split('T')[0]);
    setFormProblemas('');
    setFormProcessosManuais('');
    setFormTempoPerdido('');
    setFormFuncionarios(1);
    setFormFerramentas('');
    setFormSistemasAtuais('');
    setFormNecessidades('');
    setFormSolucoes('');
    setFormModulos('');
    setFormIa('');
    setFormValor(0);
    setFormProbabilidade(50);
    setFormProximaReuniao('');
    setShowModal(true);
  };

  const openEditModal = (item: Diagnostico) => {
    setEditingItem(item);
    setFormEmpresa(item.empresa);
    setFormData(item.data || '');
    setFormProblemas(item.problemasEncontrados);
    setFormProcessosManuais(item.processosManuais);
    setFormTempoPerdido(item.tempoPerdido);
    setFormFuncionarios(item.funcionariosEnvolvidos || 1);
    setFormFerramentas(item.ferramentasUtilizadas || '');
    setFormSistemasAtuais(item.sistemasAtuais || '');
    setFormNecessidades(item.necessidades);
    setFormSolucoes(item.solucoesPropostas || '');
    setFormModulos(item.modulosSugeridos || '');
    setFormIa(item.iaAplicada || '');
    setFormValor(item.valorEstimado || 0);
    setFormProbabilidade(item.probabilidadeFechamento || 50);
    setFormProximaReuniao(item.proximaReuniao || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      empresa: formEmpresa,
      data: formData,
      problemasEncontrados: formProblemas,
      processosManuais: formProcessosManuais,
      tempoPerdido: formTempoPerdido,
      funcionariosEnvolvidos: Number(formFuncionarios),
      ferramentasUtilizadas: formFerramentas,
      sistemasAtuais: formSistemasAtuais,
      necessidades: formNecessidades,
      solucoesPropostas: formSolucoes,
      modulosSugeridos: formModulos,
      iaAplicada: formIa,
      valorEstimado: Number(formValor),
      probabilidadeFechamento: Number(formProbabilidade),
      proximaReuniao: formProximaReuniao
    };

    try {
      if (editingItem) {
        await onUpdate(editingItem.id, payload);
      } else {
        await onAdd(payload);
      }
      setShowModal(false);
    } catch (err) {
      alert('Erro ao salvar diagnóstico: ' + err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Deseja excluir este relatório de diagnóstico?')) {
      await onDelete(id);
    }
  };

  const triggerAnalyze = async (item: Diagnostico) => {
    setAiModal(item);
    setAiLoading(true);
    setAiResult('');
    try {
      const result = await aiService.analyzeBottlenecks(
        item.processosManuais,
        item.tempoPerdido,
        item.sistemasAtuais
      );
      setAiResult(result);
    } catch (err: any) {
      setAiResult('Erro ao rodar auditoria com IA: ' + err.message);
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
            📋 Diagnósticos Técnicos & Comerciais
          </h2>
          <p className="text-xs text-slate-400">
            Ficha de levantamento de requisitos com clientes em negociação. Estime o impacto financeiro de processos manuais.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-xs hover:bg-indigo-500 transition-all shadow-md"
        >
          <Plus size={16} /> Novo Diagnóstico
        </button>
      </div>

      {/* Grid */}
      {diagnosticos.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/40 text-slate-500 text-center space-y-3">
          <ClipboardCheck size={36} className="text-slate-600" />
          <div className="text-sm font-semibold">Sem diagnósticos de requisitos</div>
          <p className="text-xs text-slate-500 max-w-xs">
            Crie o escopo de levantamento operacional de seus leads para demonstrar autoridade e fundamentar propostas caras.
          </p>
          <button
            onClick={openAddModal}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-bold transition-all"
          >
            Começar Nova Ficha
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {diagnosticos.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 p-5 rounded-xl transition-all space-y-4 group relative"
            >
              {/* Top row */}
              <div className="flex items-start justify-between border-b border-slate-800/60 pb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-bold">
                      Ficha: {new Date(item.data).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 font-extrabold px-1.5 py-0.5 rounded uppercase">
                      Proba: {item.probabilidadeFechamento}%
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-100 mt-2">{item.empresa}</h3>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>

              {/* Gaps / Metrics columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 flex items-start gap-2">
                  <TrendingDown className="text-rose-400 shrink-0 mt-0.5" size={14} />
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Tempo Perdido</span>
                    <p className="text-slate-200 font-bold mt-0.5">{item.tempoPerdido}</p>
                    <span className="text-[8px] text-slate-500 block">({item.funcionariosEnvolvidos} funcionários envolvidos)</span>
                  </div>
                </div>

                <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 flex items-start gap-2">
                  <ClipboardCheck className="text-sky-400 shrink-0 mt-0.5" size={14} />
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Processos Manuais</span>
                    <p className="text-slate-300 font-medium leading-relaxed truncate mt-0.5">{item.processosManuais}</p>
                  </div>
                </div>

                <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 flex items-start gap-2">
                  <Coins className="text-emerald-400 shrink-0 mt-0.5" size={14} />
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Valor Estimado</span>
                    <p className="text-emerald-400 font-bold mt-0.5">
                      R$ {item.valorEstimado ? item.valorEstimado.toLocaleString('pt-BR') : 'A definir'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Proposed Solution / Needs */}
              <div className="space-y-3 bg-slate-950/15 p-3.5 rounded-lg border border-slate-800/60 text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase block">Necessidades do Cliente</span>
                  <p className="text-slate-300 font-medium leading-relaxed mt-0.5">{item.necessidades}</p>
                </div>

                {(item.solucoesPropostas || item.modulosSugeridos) && (
                  <div className="pt-2 border-t border-slate-800/60 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {item.solucoesPropostas && (
                      <div>
                        <span className="text-[9px] text-teal-400 font-bold uppercase block">Solução Recomendada</span>
                        <p className="text-slate-300 mt-0.5">{item.solucoesPropostas}</p>
                      </div>
                    )}
                    {item.modulosSugeridos && (
                      <div>
                        <span className="text-[9px] text-indigo-400 font-bold uppercase block">Módulos do Sistema</span>
                        <p className="text-slate-300 mt-0.5">{item.modulosSugeridos}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* IA Audit trigger and Next Action */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-800/40">
                <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5">
                  <ArrowRight size={12} className="text-indigo-400" />
                  <span>Próximo Passo / Reunião: <strong className="text-slate-300">{item.proximaReuniao || 'Agendar'}</strong></span>
                </div>

                <button
                  onClick={() => triggerAnalyze(item)}
                  className="px-3 py-1 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-transparent rounded-lg font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sparkles size={11} /> Auditoria de Processos c/ IA
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI BOTTLENECK MODAL */}
      {aiModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-indigo-400" size={20} />
                <h3 className="text-sm font-bold text-slate-100">
                  Auditoria Operacional & ROI - {aiModal.empresa}
                </h3>
              </div>
              <button
                onClick={() => setAiModal(null)}
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
                  📋 Copiar Relatório de ROI
                </button>
                <button
                  onClick={() => setAiModal(null)}
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
              {editingItem ? '✏️ Editar Diagnóstico' : '📋 Nova Ficha de Diagnóstico'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome da Empresa *</label>
                  <input
                    type="text"
                    required
                    value={formEmpresa}
                    onChange={(e) => setFormEmpresa(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="Auto Silva Peças"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data do Levantamento *</label>
                  <input
                    type="date"
                    required
                    value={formData}
                    onChange={(e) => setFormData(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-950/30 p-3 rounded-lg border border-slate-850">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Processos Manuais Realizados *</label>
                  <textarea
                    required
                    rows={2}
                    value={formProcessosManuais}
                    onChange={(e) => setFormProcessosManuais(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="e.g. Registro de entrada de estoque anotado em papel de rascunho e digitado no Excel uma vez por semana."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tempo Estimado Perdido / Mês *</label>
                  <input
                    type="text"
                    required
                    value={formTempoPerdido}
                    onChange={(e) => setFormTempoPerdido(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="e.g. 40 horas mensais"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qtd de Funcionários Envolvidos</label>
                  <input
                    type="number"
                    min="1"
                    value={formFuncionarios}
                    onChange={(e) => setFormFuncionarios(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ferramentas Que Quebram Galho</label>
                  <input
                    type="text"
                    value={formFerramentas}
                    onChange={(e) => setFormFerramentas(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="Excel, WhatsApp Web pessoal"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sistemas Legados Atuais</label>
                  <input
                    type="text"
                    value={formSistemasAtuais}
                    onChange={(e) => setFormSistemasAtuais(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="e.g. Omie (muito caro / complexo)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dores Gerais e Gargalos Principais *</label>
                <textarea
                  required
                  rows={2}
                  value={formProblemas}
                  onChange={(e) => setFormProblemas(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="e.g. Perda de mercadoria sem faturamento, reclamações sobre lentidão do caixa."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Necessidades / Desejos Manifestados *</label>
                <textarea
                  required
                  rows={2}
                  value={formNecessidades}
                  onChange={(e) => setFormNecessidades(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="e.g. Ter controle absoluto do faturamento e vendas direto do celular em tempo real."
                />
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-950/20 rounded-lg border border-slate-850">
                <div>
                  <label className="block text-[10px] font-bold text-teal-400 uppercase mb-1">Nossa Solução Proposta</label>
                  <input
                    type="text"
                    value={formSolucoes}
                    onChange={(e) => setFormSolucoes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-teal-300 focus:border-indigo-500 outline-none"
                    placeholder="SaaS de Gestão de Estoque e Caixa Integrado"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-teal-400 uppercase mb-1">Módulos Sugeridos</label>
                  <input
                    type="text"
                    value={formModulos}
                    onChange={(e) => setFormModulos(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-teal-300 focus:border-indigo-500 outline-none"
                    placeholder="Estoque, Frente de Caixa, Financeiro"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-1">Recursos de IA Aplicada no Software</label>
                  <input
                    type="text"
                    value={formIa}
                    onChange={(e) => setFormIa(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-indigo-300 focus:border-indigo-500 outline-none"
                    placeholder="e.g. Predição inteligente de necessidade de compra de estoque com base em sazonalidade."
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Valor Estimado (R$)</label>
                  <input
                    type="number"
                    value={formValor}
                    onChange={(e) => setFormValor(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Probabilidade (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formProbabilidade}
                    onChange={(e) => setFormProbabilidade(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Próxima Reunião</label>
                  <input
                    type="text"
                    value={formProximaReuniao}
                    onChange={(e) => setFormProximaReuniao(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="25/07 às 14h00"
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
                  Salvar Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
