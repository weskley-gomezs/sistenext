import React, { useState } from 'react';
import {
  Plus,
  Trash,
  Edit,
  Target,
  Calendar,
  CheckCircle,
  TrendingUp,
  Percent,
  Video,
  FileText
} from 'lucide-react';
import { MetaMensal } from '../types';

interface MetasTabProps {
  metas: MetaMensal[];
  onAdd: (item: any) => Promise<any>;
  onUpdate: (id: string, item: any) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
}

export default function MetasTab({ metas, onAdd, onUpdate, onDelete }: MetasTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MetaMensal | null>(null);

  // Form states
  const [formMes, setFormMes] = useState('Julho');
  const [formAno, setFormAno] = useState(new Date().getFullYear());
  const [formContatadas, setFormContatadas] = useState(100);
  const [formRespostas, setFormRespostas] = useState(25);
  const [formReunioes, setFormReunioes] = useState(10);
  const [formPropostas, setFormPropostas] = useState(5);
  const [formClientes, setFormClientes] = useState(2);
  const [formVendas, setFormVendas] = useState(20000);
  const [formLucro, setFormLucro] = useState(15000);
  const [formVideos, setFormVideos] = useState(8);
  const [formConteudos, setFormConteudos] = useState(12);

  const openAddModal = () => {
    setEditingItem(null);
    setFormMes('Julho');
    setFormAno(new Date().getFullYear());
    setFormContatadas(100);
    setFormRespostas(25);
    setFormReunioes(10);
    setFormPropostas(5);
    setFormClientes(2);
    setFormVendas(20000);
    setFormLucro(15000);
    setFormVideos(8);
    setFormConteudos(12);
    setShowModal(true);
  };

  const openEditModal = (item: MetaMensal) => {
    setEditingItem(item);
    setFormMes(item.mes);
    setFormAno(Number(item.ano));
    setFormContatadas(item.empresasContatadasMeta || 0);
    setFormRespostas(item.respostasMeta || 0);
    setFormReunioes(item.reunioesMeta || 0);
    setFormPropostas(item.propostasMeta || 0);
    setFormClientes(item.clientesMeta || 0);
    setFormVendas(item.vendasMeta || 0);
    setFormLucro(item.lucroMeta || 0);
    setFormVideos(item.videosPublicadosMeta || 0);
    setFormConteudos(item.conteudosCriadosMeta || 0);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      mes: formMes,
      ano: Number(formAno),
      empresasContatadasMeta: Number(formContatadas),
      respostasMeta: Number(formRespostas),
      reunioesMeta: Number(formReunioes),
      propostasMeta: Number(formPropostas),
      clientesMeta: Number(formClientes),
      vendasMeta: Number(formVendas),
      lucroMeta: Number(formLucro),
      videosPublicadosMeta: Number(formVideos),
      conteudosCriadosMeta: Number(formConteudos)
    };

    try {
      if (editingItem) {
        await onUpdate(editingItem.id, payload);
      } else {
        await onAdd(payload);
      }
      setShowModal(false);
    } catch (err) {
      alert('Erro ao salvar meta mensal: ' + err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta meta mensal?')) {
      await onDelete(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            🏆 Objetivos & Metas Estratégicas Mensais
          </h2>
          <p className="text-xs text-slate-400">
            Defina metas quantitativas mensais para o comercial (contatos, reuniões, propostas, vendas) e marketing (vídeos, posts).
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-xs hover:bg-indigo-500 transition-all shadow-md"
        >
          <Plus size={16} /> Atribuir Meta Mensal
        </button>
      </div>

      {/* Grid */}
      {metas.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/40 text-slate-500 text-center space-y-3">
          <Target size={36} className="text-slate-600" />
          <div className="text-sm font-semibold">Sem metas mensais definidas</div>
          <p className="text-xs text-slate-500 max-w-xs">
            Planeje os números-chave de crescimento de cada mês e acompanhe-os com facilidade.
          </p>
          <button
            onClick={openAddModal}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-bold transition-all"
          >
            Configurar Meta do Mês
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metas.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 p-5 rounded-xl transition-all space-y-4 group relative"
            >
              {/* Card Title info */}
              <div className="flex items-start justify-between border-b border-slate-800/60 pb-3">
                <div>
                  <span className="text-[10px] bg-indigo-600/10 text-indigo-400 font-bold px-2 py-0.5 rounded font-mono uppercase">
                    Ano: {item.ano}
                  </span>
                  <h3 className="text-sm font-black text-slate-100 mt-2">Mês: {item.mes}</h3>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal(item)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400">
                    <Trash size={14} />
                  </button>
                </div>
              </div>

              {/* Progress bars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850 space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Empresas a Contatar</span>
                  <p className="text-sm font-black text-slate-100">{item.empresasContatadasMeta} contatos</p>
                </div>

                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850 space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Meta de Respostas</span>
                  <p className="text-sm font-black text-indigo-400">{item.respostasMeta} respostas</p>
                </div>

                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850 space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Reuniões</span>
                  <p className="text-sm font-black text-sky-400">{item.reunioesMeta} reuniões</p>
                </div>

                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850 space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Propostas</span>
                  <p className="text-sm font-black text-pink-400">{item.propostasMeta} propostas</p>
                </div>

                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850 space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Novos Clientes</span>
                  <p className="text-sm font-black text-emerald-400">{item.clientesMeta} fechamentos</p>
                </div>

                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850 space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Meta Faturamento</span>
                  <p className="text-sm font-black text-emerald-300">R$ {(item.vendasMeta || 0).toLocaleString()}</p>
                </div>

                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850 space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Vídeos Publicados</span>
                  <p className="text-sm font-black text-purple-400">{item.videosPublicadosMeta} vídeos</p>
                </div>

                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850 space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Posts / Conteúdos</span>
                  <p className="text-sm font-black text-indigo-300">{item.conteudosCriadosMeta} posts</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">
              {editingItem ? '✏️ Editar Meta Mensal' : '🏆 Criar Planejamento de Metas'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mês *</label>
                  <input
                    type="text"
                    required
                    value={formMes}
                    onChange={(e) => setFormMes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="e.g. Julho"
                  />
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

              {/* Targets detail */}
              <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-850 space-y-4">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Metas Numéricas</span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Contatos Frios</label>
                    <input
                      type="number"
                      value={formContatadas}
                      onChange={(e) => setFormContatadas(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Respostas Esperadas</label>
                    <input
                      type="number"
                      value={formRespostas}
                      onChange={(e) => setFormRespostas(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Reuniões</label>
                    <input
                      type="number"
                      value={formReunioes}
                      onChange={(e) => setFormReunioes(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Propostas</label>
                    <input
                      type="number"
                      value={formPropostas}
                      onChange={(e) => setFormPropostas(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Fechamentos</label>
                    <input
                      type="number"
                      value={formClientes}
                      onChange={(e) => setFormClientes(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Vídeos</label>
                    <input
                      type="number"
                      value={formVideos}
                      onChange={(e) => setFormVideos(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Posts Redes</label>
                    <input
                      type="number"
                      value={formConteudos}
                      onChange={(e) => setFormConteudos(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-emerald-400 uppercase mb-1">Faturamento (R$)</label>
                    <input
                      type="number"
                      value={formVendas}
                      onChange={(e) => setFormVendas(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-emerald-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-indigo-400 uppercase mb-1">Lucro Estimado (R$)</label>
                    <input
                      type="number"
                      value={formLucro}
                      onChange={(e) => setFormLucro(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-indigo-300 outline-none"
                    />
                  </div>
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
                  Salvar Metas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
