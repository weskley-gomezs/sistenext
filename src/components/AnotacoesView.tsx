import React, { useState } from 'react';
import { Plus, ClipboardList, Trash2, Search, User, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Anotacao } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface AnotacoesViewProps {
  anotacoes: Anotacao[];
  onAddAnotacao: (note: Omit<Anotacao, 'id'>) => Promise<string>;
  onDeleteAnotacao: (id: string, justification: string, data: Anotacao) => Promise<void>;
}

export default function AnotacoesView({
  anotacoes,
  onAddAnotacao,
  onDeleteAnotacao
}: AnotacoesViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Omit<Anotacao, 'id'> = {
      title,
      content,
      createdAt: new Date().toISOString().split('T')[0],
      user: 'Consultor Sênior'
    };

    try {
      await onAddAnotacao(payload);
      setIsOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
  };

  const filtered = anotacoes.filter((n) => {
    const q = search.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      (n.entityName && n.entityName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Mural de Anotações & Scratchpad
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Anote insights, atas de reuniões, rascunhos de propostas ou lembretes rápidos de negociação.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 cursor-pointer"
        >
          <Plus size={14} /> Nova Anotação
        </button>
      </div>

      {/* Search Input */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm">
        <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Pesquisar anotações por palavra-chave ou empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border-0 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
        />
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 font-medium text-xs">
            Nenhuma anotação registrada ainda.
          </div>
        ) : (
          filtered.map((note) => (
            <div
              key={note.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                    {note.title}
                  </h3>
                  <button
                    onClick={() => setItemToDeleteId(note.id)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {note.entityName && (
                  <span className="inline-block mt-1.5 text-[9px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-extrabold uppercase">
                    Vinculado: {note.entityName}
                  </span>
                )}

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-4 leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <User size={11} /> {note.user}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={11} /> {note.createdAt.split('-').reverse().join('/')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE FORM */}
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
                  Criar Anotação / Scratchpad
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
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Título da Anotação *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Ata de Reunião - Rede SuperMais"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Conteúdo da Anotação *</label>
                  <textarea
                    rows={8}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Escreva livremente as observações do cliente, dores comerciais, escopo preliminar..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none text-xs"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                  >
                    Salvar Anotação
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
        title="Excluir Anotação"
        message="Deseja realmente remover esta anotação? Informe uma justificativa para prosseguir."
        onConfirm={async (justification) => {
          if (itemToDeleteId) {
            const note = anotacoes.find(n => n.id === itemToDeleteId);
            if (note) {
              await onDeleteAnotacao(itemToDeleteId, justification, note);
            }
          }
          setItemToDeleteId(null);
        }}
        onCancel={() => setItemToDeleteId(null)}
      />
    </div>
  );
}
