import React, { useState } from 'react';
import { Bell, Calendar, Clock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AgendaItem } from '../types';

interface NotificationBellProps {
  agenda: AgendaItem[];
  onNavigate: (section: string) => void;
}

export function NotificationBell({ agenda, onNavigate }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);

  const upcomingEvents = agenda
    .filter((item) => item.status === 'Pendente' || !item.status)
    .filter((item) => {
      const eventDate = new Date(item.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today;
    })
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .slice(0, 5);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors relative cursor-pointer"
      >
        <Bell size={18} />
        {upcomingEvents.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar size={14} className="text-indigo-500" /> Próximos Compromissos
                </h3>
                <span className="text-[10px] font-bold text-slate-400">{upcomingEvents.length} pendentes</span>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {upcomingEvents.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-xs font-medium">Nenhum compromisso próximo.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {upcomingEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => {
                          onNavigate('agenda');
                          setIsOpen(false);
                        }}
                        className="w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500">
                            {event.type}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock size={10} /> {event.time}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {event.title}
                        </h4>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </p>
                          <ChevronRight size={12} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  onNavigate('agenda');
                  setIsOpen(false);
                }}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors text-center tracking-widest"
              >
                Ver Agenda Completa
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
