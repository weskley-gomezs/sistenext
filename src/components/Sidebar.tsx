import React, { useState } from 'react';
import {
  LayoutDashboard,
  Target,
  Building2,
  Users,
  FolderKanban,
  FileText,
  FileSignature,
  CircleDollarSign,
  CalendarDays,
  History,
  MessageCircle,
  Cpu,
  ClipboardList,
  FolderOpen,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  CheckCircle2,
  ChevronsLeft,
  ChevronsRight,
  FileDown,
  Grid,
  Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
const nexusErpLogo = 'https://i.imgur.com/BewcRiJ.png';

export type ActiveSection =
  | 'dashboard'
  | 'leads'
  | 'marketing'
  | 'empresas'
  | 'clientes'
  | 'projetos'
  | 'propostas'
  | 'contratos'
  | 'financeiro'
  | 'agenda'
  | 'followup'
  | 'anotacoes'
  | 'documentos'
  | 'relatorios'
  | 'equipe'
  | 'configuracoes'
  | 'oportunidade';

interface SidebarProps {
  activeSection: ActiveSection;
  setActiveSection: (section: ActiveSection) => void;
  onLogout: () => void;
  user: any;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  isVendedor?: boolean;
  activeSubscription?: any;
  pendingOportunidadesCount?: number;
}

export default function Sidebar({
  activeSection,
  setActiveSection,
  onLogout,
  user,
  darkMode,
  setDarkMode,
  isVendedor = false,
  activeSubscription,
  pendingOportunidadesCount = 0
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isSubscribed = activeSubscription && ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(activeSubscription.status);

  interface MenuItem {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
  }

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads (Pipeline)', icon: Target },
    { id: 'marketing', label: 'Marketing', icon: Megaphone },
    { id: 'oportunidade', label: 'Oportunidades', icon: Grid },
    { id: 'empresas', label: 'Empresas', icon: Building2 },
    { id: 'clientes', label: 'Clientes Ativos', icon: Users },
    { id: 'propostas', label: 'Propostas', icon: FileText },
    { id: 'projetos', label: 'Projetos', icon: FolderKanban },
    { id: 'contratos', label: 'Contratos', icon: FileSignature },
    { id: 'financeiro', label: 'Financeiro', icon: CircleDollarSign },
    { id: 'agenda', label: 'Agenda & Reuniões', icon: CalendarDays },
    { id: 'followup', label: 'Follow-ups', icon: History },
    { id: 'anotacoes', label: 'Notas Privadas', icon: ClipboardList },
    { id: 'documentos', label: 'Documentos (GED)', icon: FolderOpen },
    { id: 'relatorios', label: 'Relatórios', icon: FileDown },
    { id: 'equipe', label: 'Equipe & Auditoria', icon: ShieldCheck },
    { id: 'configuracoes', label: 'Configurações', icon: Settings }
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    if (isVendedor) {
      const restricted = [
        'configuracoes',
        'equipe',
        'relatorios',
        'anotacoes',
        'financeiro',
        'empresas'
      ];
      return !restricted.includes(item.id);
    }
    return true;
  });

  const handleSelectSection = (id: ActiveSection) => {
    setActiveSection(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-white w-full sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-slate-700">
            <img src={nexusErpLogo} alt="Logo" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-md text-white">SisteNext</span>
            {isSubscribed && (
              <span className="text-[7px] bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded font-extrabold uppercase font-mono tracking-wider w-fit">
                ATIVO
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/80"
            />

            {/* Content Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-72 max-w-sm bg-slate-900 border-r border-slate-800 h-full flex flex-col z-10"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-slate-700">
                    <img src={nexusErpLogo} alt="Logo" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold tracking-tight text-white">SisteNext</span>
                    {isSubscribed && (
                      <span className="text-[7px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-extrabold uppercase font-mono tracking-wider w-fit">
                        ATIVO (PRO)
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
                {filteredMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectSection(item.id as ActiveSection)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600/10 border-l-2 border-indigo-500 text-indigo-400 shadow-sm shadow-indigo-500/5'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
                          {item.id === 'oportunidade' && pendingOportunidadesCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-extrabold text-white shadow-sm ring-2 ring-slate-900">
                              {pendingOportunidadesCount}
                            </span>
                          )}
                        </div>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] bg-indigo-600/20 text-indigo-400 px-1.5 py-0.5 rounded font-extrabold font-mono tracking-wider">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* User Profile Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/60">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {user?.email ? user.email[0].toUpperCase() : 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {user?.displayName || 'Arquiteto Sênior'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {user?.email || 'saas@sistenext.com.br'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-medium rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut size={14} />
                  Sair do SisteNext
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Left-Side persistent) */}
      <div
        className={`hidden md:flex flex-col h-screen bg-slate-900 border-r border-slate-800 text-slate-400 transition-all duration-300 sticky top-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between relative">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/10 border border-slate-700">
              <img src={nexusErpLogo} alt="Logo" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-black text-white text-md tracking-tight leading-none">
                  SisteNext
                </span>
                {isSubscribed ? (
                  <span className="text-[7px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 px-1.5 py-0.5 rounded font-extrabold uppercase font-mono tracking-wider mt-1 w-fit">
                    ATIVO (PRO)
                  </span>
                ) : (
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 mt-1">SaaS & AI CRM</span>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition-colors absolute -right-3 top-5 bg-slate-900 border border-slate-800"
          >
            {isCollapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectSection(item.id as ActiveSection)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
                    {item.id === 'oportunidade' && pendingOportunidadesCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-extrabold text-white shadow-sm ring-2 ring-slate-900">
                        {pendingOportunidadesCount}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!isCollapsed && item.badge && (
                  <span className="text-[9px] bg-indigo-600/20 text-indigo-400 px-1.5 py-0.5 rounded font-extrabold font-mono tracking-wider">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer controls & Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-inner">
              {user?.email ? user.email[0].toUpperCase() : 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {user?.displayName || 'Arquiteto Sênior'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {user?.email || 'saas@crmiapro.com.br'}
                </p>
              </div>
            )}
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all"
              title="Sair do SisteNext"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
