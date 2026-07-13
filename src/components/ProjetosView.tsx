import React, { useState } from 'react';
import { Plus, CheckSquare, Square, FolderKanban, Calendar, User, DollarSign, Edit2, Trash2, X, ClipboardList, AlertCircle, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Projeto, Cliente, ChecklistItem } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { exportToPDF } from '../utils/pdfExport';

interface ProjetosViewProps {
  projetos: Projeto[];
  clientes: Cliente[];
  onAddProjeto: (proj: Omit<Projeto, 'id'>) => Promise<string>;
  onUpdateProjeto: (id: string, proj: Partial<Projeto>) => Promise<void>;
  onDeleteProjeto: (id: string, justification: string, data: Projeto) => Promise<void>;
  customLogo?: string | null;
  companyName?: string | null;
}

export default function ProjetosView({
  projetos,
  clientes,
  onAddProjeto,
  onUpdateProjeto,
  onDeleteProjeto,
  customLogo,
  companyName
}: ProjetosViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingProj, setEditingProj] = useState<Projeto | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState('');
  const [value, setValue] = useState(0);
  const [status, setStatus] = useState<any>('Levantamento');
  const [deadline, setDeadline] = useState('');
  const [startDate, setStartDate] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [owner, setOwner] = useState('');
  const [rawChecklist, setRawChecklist] = useState<string>('');
  const [projToDelete, setProjToDelete] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setClientId('');
    setDescription('');
    setScope('');
    setValue(0);
    setStatus('Levantamento');
    setDeadline('');
    setStartDate('');
    setEstimatedDelivery('');
    setOwner('');
    setRawChecklist('Levantamento\nProtótipo\nBanco de dados\nLogin\nDashboard\nTestes\nCorreções\nEntrega\nTreinamento');
    setEditingProj(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleOpenEdit = (proj: Projeto) => {
    setEditingProj(proj);
    setName(proj.name);
    setClientId(proj.clientId);
    setDescription(proj.description);
    setScope(proj.scope);
    setValue(proj.value);
    setStatus(proj.status);
    setDeadline(proj.deadline);
    setStartDate(proj.startDate);
    setEstimatedDelivery(proj.estimatedDelivery);
    setOwner(proj.owner);
    setRawChecklist(proj.checklist.map((c) => c.task).join('\n'));
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCli = clientes.find((c) => c.id === clientId);
    if (!selectedCli) {
      alert('Por favor, selecione um cliente válido.');
      return;
    }

    // Process Checklist lines
    const checklistItems: ChecklistItem[] = rawChecklist
      .split('\n')
      .map((line, idx) => ({
        id: String(idx + 1),
        task: line.trim(),
        done: editingProj
          ? editingProj.checklist.find((c) => c.task === line.trim())?.done || false
          : false
      }))
      .filter((c) => c.task);

    const payload: Omit<Projeto, 'id'> = {
      clientId,
      clientName: selectedCli.companyName,
      name,
      description,
      scope,
      value,
      status,
      deadline,
      startDate,
      estimatedDelivery,
      owner,
      checklist: checklistItems,
      files: editingProj ? editingProj.files : []
    };

    try {
      if (editingProj) {
        await onUpdateProjeto(editingProj.id, payload);
      } else {
        await onAddProjeto(payload);
      }
      setIsOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleChecklistItem = async (proj: Projeto, itemId: string) => {
    const updatedChecklist = proj.checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );

    try {
      await onUpdateProjeto(proj.id, { checklist: updatedChecklist });
    } catch (err) {
      console.error(err);
    }
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Gestão de Projetos & SLA
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Planeje sprints de desenvolvimento, controle checklists e garanta a entrega pontual de SaaS & IA.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const head = [['Projeto', 'Cliente', 'Status', 'Prazo', 'Progresso', 'Valor']];
              const body = projetos.map((p) => {
                const completed = p.checklist.filter((c) => c.done).length;
                const total = p.checklist.length || 1;
                const progress = Math.round((completed / total) * 100);
                return [
                  p.name,
                  p.clientName,
                  p.status,
                  p.deadline.split('-').reverse().join('/'),
                  `${progress}%`,
                  formatBRL(p.value)
                ];
              });
              const summary = [
                { label: 'Total Projetos', value: projetos.length },
                { label: 'Valor em Produção', value: formatBRL(projetos.reduce((sum, p) => sum + p.value, 0)) }
              ];
              exportToPDF({ 
                title: 'LISTAGEM DE PROJETOS ATIVOS', 
                head, 
                body, 
                summary, 
                customLogo: customLogo || undefined,
                companyName: companyName || undefined 
              });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <FileDown size={14} /> Exportar
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 cursor-pointer"
          >
            <Plus size={14} /> Novo Projeto
          </button>
        </div>
      </div>

      {/* Grid of Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projetos.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs font-semibold">
            Nenhum projeto registrado no momento.
          </div>
        ) : (
          projetos.map((proj) => {
            const completedCount = proj.checklist.filter((c) => c.done).length;
            const totalCount = proj.checklist.length || 1;
            const progress = Math.round((completedCount / totalCount) * 100);

            return (
              <div
                key={proj.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">{proj.clientName}</span>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight mt-1">{proj.name}</h3>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenEdit(proj)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setProjToDelete(proj.id)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">{proj.description}</p>

                  {proj.scope && (
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/40 dark:border-slate-800/40 text-xs">
                      <span className="font-extrabold text-[10px] text-indigo-500 uppercase tracking-widest block mb-1">Escopo Técnico</span>
                      <span className="text-slate-600 dark:text-slate-300 block">{proj.scope}</span>
                    </div>
                  )}

                  {/* Metadata labels */}
                  <div className="grid grid-cols-2 gap-4 mt-5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      <span>Prazo final: {proj.deadline.split('-').reverse().join('/')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User size={13} className="text-slate-400" />
                      <span>Dono: {proj.owner}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign size={13} className="text-indigo-500" />
                      <span className="font-bold text-slate-800 dark:text-slate-300 font-mono">Valor: {formatBRL(proj.value)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <AlertCircle size={13} className="text-indigo-500 animate-pulse" />
                      <span className="uppercase tracking-wider font-extrabold text-[10px] text-indigo-600 dark:text-indigo-400">{proj.status}</span>
                    </div>
                  </div>

                  {/* Checklist Section */}
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="font-extrabold text-[10px] text-slate-500 uppercase tracking-widest flex justify-between items-center mb-3">
                      <span>Checklist de Desenvolvimento</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[9px]">{progress}%</span>
                    </h4>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
                      <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {proj.checklist.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleChecklistItem(proj, item.id)}
                          className="flex items-center gap-2 py-1 px-1.5 hover:bg-slate-50 dark:hover:bg-slate-950/60 rounded-lg cursor-pointer text-slate-600 dark:text-slate-300 transition-all select-none"
                        >
                          {item.done ? (
                            <CheckSquare size={15} className="text-indigo-500 shrink-0" />
                          ) : (
                            <Square size={15} className="text-slate-400 shrink-0" />
                          )}
                          <span className={item.done ? 'line-through text-slate-400 dark:text-slate-500' : 'font-medium'}>
                            {item.task}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE/EDIT FORM */}
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
              className="relative w-full max-w-lg bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col z-10 p-6 border-l border-slate-200 dark:border-slate-900 overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-900 mb-6">
                <h3 className="text-md font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {editingProj ? 'Editar Projeto' : 'Criar Novo Projeto'}
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
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Cliente Vinculado *</label>
                  <select
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 focus:outline-none font-bold text-xs"
                  >
                    <option value="">Selecione um cliente...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nome do Projeto *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Motor de Inteligência Artificial"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Valor Contratual (R$) *</label>
                    <input
                      type="number"
                      required
                      value={value}
                      onChange={(e) => setValue(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Descrição</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição sumária do projeto..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Escopo Técnico Detalhado</label>
                  <textarea
                    rows={2}
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    placeholder="Ex: API em Node.js com TensorFlow, UI em React, DB PostgreSQL"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Responsável Interno</label>
                    <input
                      type="text"
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      placeholder="Ex: Arquiteto Sênior"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Status do Desenvolvimento</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-bold"
                    >
                      <option value="Levantamento">Levantamento</option>
                      <option value="Protótipo">Protótipo</option>
                      <option value="Banco de dados">Banco de dados</option>
                      <option value="Login">Login</option>
                      <option value="Dashboard">Dashboard</option>
                      <option value="Testes">Testes</option>
                      <option value="Correções">Correções</option>
                      <option value="Entrega">Entrega</option>
                      <option value="Treinamento">Treinamento</option>
                      <option value="Concluído">Concluído</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Início</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Previsão</label>
                    <input
                      type="date"
                      value={estimatedDelivery}
                      onChange={(e) => setEstimatedDelivery(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Prazo SLA</label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Checklist de Tarefas (uma por linha)</label>
                  <textarea
                    rows={4}
                    value={rawChecklist}
                    onChange={(e) => setRawChecklist(e.target.value)}
                    placeholder="Levantamento de Requisitos&#10;Modelagem de Dados&#10;Desenvolvimento Frontend&#10;Integração API"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-mono text-xs"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all shadow-md shadow-indigo-500/10 cursor-pointer text-center"
                  >
                    Salvar Projeto
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
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={!!projToDelete}
        title="Excluir Projeto"
        message="Deseja realmente remover este projeto permanentemente? Informe uma justificativa para prosseguir."
        onConfirm={async (justification) => {
          if (projToDelete) {
            const proj = projetos.find(p => p.id === projToDelete);
            if (proj) {
              await onDeleteProjeto(projToDelete, justification, proj);
            }
            setProjToDelete(null);
          }
        }}
        onCancel={() => setProjToDelete(null)}
      />
    </div>
  );
}
