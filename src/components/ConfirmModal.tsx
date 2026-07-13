import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (justification: string) => void;
  onCancel: () => void;
  confirmText?: string;
  requireJustification?: boolean;
}

export function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = 'Excluir',
  requireJustification = true
}: ConfirmModalProps) {
  const [justification, setJustification] = React.useState('');

  React.useEffect(() => {
    if (isOpen) setJustification('');
  }, [isOpen]);

  const handleConfirm = () => {
    if (requireJustification && !justification.trim()) {
      alert('Por favor, informe uma justificativa.');
      return;
    }
    onConfirm(justification);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-sm"
          >
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertTriangle size={24} />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">{title}</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{message}</p>
            
            {requireJustification && (
              <div className="mb-6">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 ml-1">
                  Justificativa da Exclusão *
                </label>
                <textarea
                  autoFocus
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Explique o motivo da exclusão..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all resize-none h-24"
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={requireJustification && !justification.trim()}
                className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition-all cursor-pointer ${
                  requireJustification && !justification.trim()
                    ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
