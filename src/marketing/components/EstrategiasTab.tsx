import React, { useState } from 'react';
import {
  Plus,
  Trash,
  Edit,
  Play,
  Pause,
  Compass,
  DollarSign,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Estrategia } from '../types';

interface EstrategiasTabProps {
  estrategias: Estrategia[];
  onAdd: (item: any) => Promise<any>;
  onUpdate: (id: string, item: any) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
}

export default function EstrategiasTab({ estrategias, onAdd, onUpdate, onDelete }: EstrategiasTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Estrategia | null>(null);

  // Form states
  const [formNome, setFormNome] = useState('');
  const [formObjetivo, setFormObjetivo] = useState('');
  const [formTipo, setFormTipo] = useState('Google Maps');
  const [formInvestimento, setFormInvestimento] = useState(0);
  const [formFrequencia, setFormFrequencia] = useState('Semanal');
  const [formDataInicial, setFormDataInicial] = useState(new Date().toISOString().split('T')[0]);
  const [formDataFinal, setFormDataFinal] = useState('');
  const [formResponsavel, setFormResponsavel] = useState('');
  const [formStatus, setFormStatus] = useState<Estrategia['status']>('Planejado');
  const [formResultado, setFormResultado] = useState('');

  const openAddModal = () => {
    setEditingItem(null);
    setFormNome('');
    setFormObjetivo('');
    setFormTipo('Google Maps');
    setFormInvestimento(0);
    setFormFrequencia('Semanal');
    setFormDataInicial(new Date().toISOString().split('T')[0]);
    setFormDataFinal('');
    setFormResponsavel('');
    setFormStatus('Planejado');
    setFormResultado('');
    setShowModal(true);
  };

  const openEditModal = (item: Estrategia) => {
    setEditingItem(item);
    setFormNome(item.nome);
    setFormObjetivo(item.objetivo);
    setFormTipo(item.tipo);
    setFormInvestimento(item.investimento);
    setFormFrequencia(item.frequencia);
    setFormDataInicial(item.dataInicial || '');
    setFormDataFinal(item.dataFinal || '');
    setFormResponsavel(item.responsavel);
    setFormStatus(item.status);
    setFormResultado(item.resultadoEsperado);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nome: formNome,
      objetivo: formObjetivo,
      tipo: formTipo,
      investimento: Number(formInvestimento),
      frequencia: formFrequencia,
      dataInicial: formDataInicial,
      dataFinal: formDataFinal,
      responsavel: formResponsavel,
      status: formStatus,
      resultadoEsperado: formResultado
    };

    try {
      if (editingItem) {
        await onUpdate(editingItem.id, payload);
      } else {
        await onAdd(payload);
      }
      setShowModal(false);
    } catch (err) {
      alert('Erro ao salvar estratégia: ' + err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta estratégia?')) {
      await onDelete(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            🧭 Estratégias & Campanhas de Aquisição
          </h2>
          <p className="text-xs text-slate-400">
            Defina e execute canais de aquisição de clientes como WhatsApp, Instagram Direct, Facebook Ads, indicações e cold calling.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-xs hover:bg-indigo-500 transition-all shadow-md"
        >
          <Plus size={16} /> Nova Estratégia
        </button>
      </div>

      {/* Grid */}
      {estrategias.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/40 text-slate-500 text-center space-y-3">
          <Compass size={36} className="text-slate-600" />
          <div className="text-sm font-semibold">Sem estratégias registradas</div>
          <p className="text-xs text-slate-500 max-w-xs">
            Adicione canais de prospecção e controle o orçamento de tráfego pago ou as metas diárias de cold calling.
          </p>
          <button
            onClick={openAddModal}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-bold transition-all"
          >
            Adicionar Estratégia
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {estrategias.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition-all flex flex-col justify-between group relative"
            >
              <div className="space-y-4">
                {/* Title */}
                <div className="flex items-start justify-between border-b border-slate-800/60 pb-3">
                  <div>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-extrabold px-2 py-0.5 rounded uppercase">
                      {item.tipo}
                    </span>
                    <h3 className="text-sm font-black text-slate-100 mt-2">{item.nome}</h3>
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

                {/* Info row */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/20 p-2.5 rounded-lg border border-slate-850">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Investimento</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      R$ {item.investimento ? item.investimento.toLocaleString('pt-BR') : '0,00'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Frequência</span>
                    <span className="font-bold text-slate-300">{item.frequencia}</span>
                  </div>
                </div>

                {/* Objectives */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Objetivo da Campanha</span>
                    <p className="text-slate-300 font-medium leading-relaxed">{item.objetivo}</p>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Resultado Esperado</span>
                    <p className="text-slate-400 leading-relaxed italic">{item.resultadoEsperado}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                  item.status === 'Ativo'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : item.status === 'Pausado'
                    ? 'bg-amber-500/15 text-amber-400'
                    : item.status === 'Concluído'
                    ? 'bg-indigo-500/15 text-indigo-400'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.status}
                </span>

                <span className="flex items-center gap-1">
                  <User size={12} /> {item.responsavel || 'Não atribuído'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">
              {editingItem ? '✏️ Editar Estratégia' : '🧭 Nova Estratégia de Captação'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome da Estratégia *</label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="e.g. Prospecção Ativa via Google Maps"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo de Canal *</label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  >
                    {['Google Maps', 'WhatsApp', 'Instagram', 'Facebook', 'Google Ads', 'Meta Ads', 'YouTube', 'TikTok', 'Indicação', 'Networking', 'Email', 'Cold Call', 'Eventos'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Frequência da Atividade</label>
                  <input
                    type="text"
                    value={formFrequencia}
                    onChange={(e) => setFormFrequencia(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="Semanal, Diário, Mensal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Objetivo da Campanha *</label>
                <textarea
                  required
                  rows={2}
                  value={formObjetivo}
                  onChange={(e) => setFormObjetivo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="e.g. Enviar mensagem de apresentação e diagnóstico para 20 empresas por dia no nicho selecionado."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Resultado Esperado *</label>
                <textarea
                  required
                  rows={2}
                  value={formResultado}
                  onChange={(e) => setFormResultado(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="e.g. Conseguir marcar pelo menos 3 reuniões de demonstração por semana."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Investimento Financeiro (R$)</label>
                  <input
                    type="number"
                    value={formInvestimento}
                    onChange={(e) => setFormInvestimento(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Responsável Interno</label>
                  <input
                    type="text"
                    value={formResponsavel}
                    onChange={(e) => setFormResponsavel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="João Vendedor"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as Estrategia['status'])}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  >
                    <option value="Planejado">Planejado</option>
                    <option value="Ativo">Ativo</option>
                    <option value="Pausado">Pausado</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data de Início</label>
                  <input
                    type="date"
                    value={formDataInicial}
                    onChange={(e) => setFormDataInicial(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data de Fim</label>
                  <input
                    type="date"
                    value={formDataFinal}
                    onChange={(e) => setFormDataFinal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
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
                  Gravar Estratégia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
