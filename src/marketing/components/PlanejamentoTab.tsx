import React, { useState } from 'react';
import {
  Plus,
  Trash,
  Edit,
  TrendingUp,
  Target,
  FileText,
  Users,
  Award,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Planejamento } from '../types';

interface PlanejamentoTabProps {
  planejamentos: Planejamento[];
  onAdd: (item: any) => Promise<any>;
  onUpdate: (id: string, item: any) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
}

export default function PlanejamentoTab({ planejamentos, onAdd, onUpdate, onDelete }: PlanejamentoTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Planejamento | null>(null);

  // Form states
  const [formNome, setFormNome] = useState('');
  const [formMes, setFormMes] = useState('Janeiro');
  const [formAno, setFormAno] = useState(new Date().getFullYear());
  const [formObjetivo, setFormObjetivo] = useState('');
  const [formMetaFaturamento, setFormMetaFaturamento] = useState(0);
  const [formMetaReunioes, setFormMetaReunioes] = useState(0);
  const [formMetaPropostas, setFormMetaPropostas] = useState(0);
  const [formMetaClientes, setFormMetaClientes] = useState(0);
  const [formResponsavel, setFormResponsavel] = useState('');
  const [formStatus, setFormStatus] = useState<Planejamento['status']>('Planejado');
  const [formObservacoes, setFormObservacoes] = useState('');

  const openAddModal = () => {
    setEditingItem(null);
    setFormNome('');
    setFormMes('Janeiro');
    setFormAno(new Date().getFullYear());
    setFormObjetivo('');
    setFormMetaFaturamento(0);
    setFormMetaReunioes(0);
    setFormMetaPropostas(0);
    setFormMetaClientes(0);
    setFormResponsavel('');
    setFormStatus('Planejado');
    setFormObservacoes('');
    setShowModal(true);
  };

  const openEditModal = (item: Planejamento) => {
    setEditingItem(item);
    setFormNome(item.nome);
    setFormMes(item.mes);
    setFormAno(Number(item.ano));
    setFormObjetivo(item.objetivoPrincipal);
    setFormMetaFaturamento(item.metaFaturamento);
    setFormMetaReunioes(item.metaReunioes);
    setFormMetaPropostas(item.metaPropostas);
    setFormMetaClientes(item.metaClientes);
    setFormResponsavel(item.responsavel);
    setFormStatus(item.status);
    setFormObservacoes(item.observacoes || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nome: formNome,
      mes: formMes,
      ano: formAno,
      objetivoPrincipal: formObjetivo,
      metaFaturamento: Number(formMetaFaturamento),
      metaReunioes: Number(formMetaReunioes),
      metaPropostas: Number(formMetaPropostas),
      metaClientes: Number(formMetaClientes),
      responsavel: formResponsavel,
      status: formStatus,
      observacoes: formObservacoes
    };

    try {
      if (editingItem) {
        await onUpdate(editingItem.id, payload);
      } else {
        await onAdd(payload);
      }
      setShowModal(false);
    } catch (err) {
      alert('Erro ao salvar planejamento: ' + err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este planejamento?')) {
      await onDelete(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            📅 Planejamento Mensal de Crescimento
          </h2>
          <p className="text-xs text-slate-400">
            Defina as metas macro, objetivos de faturamento e focos comerciais de cada mês do ano.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-xs hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/15"
        >
          <Plus size={16} /> Novo Planejamento
        </button>
      </div>

      {/* Grid of Plans */}
      {planejamentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/40 text-slate-500 text-center space-y-3">
          <Target size={36} className="text-slate-600" />
          <div className="text-sm font-semibold">Sem planejamentos cadastrados</div>
          <p className="text-xs text-slate-500 max-w-xs">
            Crie seu primeiro plano de negócios mensal para acompanhar faturamento e conversões de leads.
          </p>
          <button
            onClick={openAddModal}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-bold transition-all"
          >
            Cadastrar Planejamento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {planejamentos.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 p-5 rounded-xl shadow-md transition-all space-y-4"
            >
              {/* Header card info */}
              <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-indigo-600/10 text-indigo-400 font-bold px-2 py-0.5 rounded">
                      {item.mes} / {item.ano}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      item.status === 'Concluído'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : item.status === 'Em Andamento'
                        ? 'bg-amber-500/10 text-amber-400'
                        : item.status === 'Cancelado'
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-100 mt-1.5">{item.nome}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>

              {/* Goal highlights row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-950/40 border border-slate-800/40 p-2.5 rounded-lg flex items-center gap-2.5">
                  <TrendingUp size={16} className="text-emerald-400" />
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Faturamento</span>
                    <p className="text-[11px] font-extrabold text-slate-100">
                      R$ {item.metaFaturamento ? item.metaFaturamento.toLocaleString('pt-BR') : '0'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-slate-800/40 p-2.5 rounded-lg flex items-center gap-2.5">
                  <Users size={16} className="text-sky-400" />
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Reuniões</span>
                    <p className="text-[11px] font-extrabold text-slate-100">{item.metaReunioes} agendadas</p>
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-slate-800/40 p-2.5 rounded-lg flex items-center gap-2.5">
                  <FileText size={16} className="text-pink-400" />
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Propostas</span>
                    <p className="text-[11px] font-extrabold text-slate-100">{item.metaPropostas} enviadas</p>
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-slate-800/40 p-2.5 rounded-lg flex items-center gap-2.5">
                  <Award size={16} className="text-purple-400" />
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Fechamentos</span>
                    <p className="text-[11px] font-extrabold text-slate-100">{item.metaClientes} novos</p>
                  </div>
                </div>
              </div>

              {/* Core Goal & Responsibility */}
              <div className="space-y-2 text-xs bg-slate-950/20 p-3 rounded-lg border border-slate-800/50">
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Objetivo Principal do Mês</span>
                  <p className="text-slate-300 font-medium leading-relaxed">{item.objetivoPrincipal}</p>
                </div>

                {item.observacoes && (
                  <div className="pt-2 border-t border-slate-800/60">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Observações Técnicas</span>
                    <p className="text-slate-400 italic leading-relaxed">{item.observacoes}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>Lançado em: {new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div>
                    <span>Responsável: <strong>{item.responsavel || 'Não definido'}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">
              {editingItem ? '✏️ Editar Planejamento' : '📅 Novo Planejamento Mensal'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome do Planejamento *</label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="e.g. Expansão Sul - Prospecção Ativa"
                />
              </div>

              {/* Mes & Ano */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mês *</label>
                  <select
                    value={formMes}
                    onChange={(e) => setFormMes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  >
                    {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ano *</label>
                  <input
                    type="number"
                    required
                    value={formAno}
                    onChange={(e) => setFormAno(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Objetivo Principal */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Objetivo Principal do Mês *</label>
                <textarea
                  required
                  rows={2}
                  value={formObjetivo}
                  onChange={(e) => setFormObjetivo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="e.g. Alcançar R$ 50k de MRR fechando contratos de desenvolvimento customizado com mecânicas."
                />
              </div>

              {/* Metas quantitativas */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-950/30 rounded-lg border border-slate-850">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Meta Faturamento (R$)</label>
                  <input
                    type="number"
                    value={formMetaFaturamento}
                    onChange={(e) => setFormMetaFaturamento(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Meta Reuniões Marcadas</label>
                  <input
                    type="number"
                    value={formMetaReunioes}
                    onChange={(e) => setFormMetaReunioes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Meta Propostas Enviadas</label>
                  <input
                    type="number"
                    value={formMetaPropostas}
                    onChange={(e) => setFormMetaPropostas(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Meta Novos Clientes</label>
                  <input
                    type="number"
                    value={formMetaClientes}
                    onChange={(e) => setFormMetaClientes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Status & Responsavel */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as Planejamento['status'])}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  >
                    <option value="Planejado">Planejado</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Coordenador do Mês</label>
                  <input
                    type="text"
                    value={formResponsavel}
                    onChange={(e) => setFormResponsavel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="e.g. CEO SisteNext"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Observações Técnicas / Observações</label>
                <textarea
                  rows={2}
                  value={formObservacoes}
                  onChange={(e) => setFormObservacoes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="Direcionamento estratégico da equipe"
                />
              </div>

              {/* Submit buttons */}
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
                  Confirmar Planejamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
