import React, { useState } from 'react';
import {
  UserPlus,
  Users,
  ShieldCheck,
  Activity,
  Calendar,
  TrendingUp,
  Coins,
  Trash2,
  Search,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Briefcase,
  Layers,
  Sparkles,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MembroEquipe, Log, Lead, Proposta, Cliente, Financeiro } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface EquipeViewProps {
  membros: MembroEquipe[];
  logs: Log[];
  leads: Lead[];
  propostas: Proposta[];
  clientes: Cliente[];
  financeiro: Financeiro[];
  onAddMembro: (membro: Omit<MembroEquipe, 'id'>) => Promise<string>;
  onUpdateMembro: (id: string, payload: Partial<MembroEquipe>) => Promise<void>;
  onDeleteMembro: (id: string, justification: string, data: MembroEquipe) => Promise<void>;
  currentUserEmail: string;
}

export default function EquipeView({
  membros,
  logs,
  leads,
  propostas,
  clientes,
  financeiro,
  onAddMembro,
  onUpdateMembro,
  onDeleteMembro,
  currentUserEmail
}: EquipeViewProps) {
  const [activeTab, setActiveTab] = useState<'membros' | 'performance' | 'auditoria'>('membros');
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Search states
  const [membrosSearch, setMembrosSearch] = useState('');
  const [logsSearch, setLogsSearch] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState<string>('ALL');

  // Deletion state
  const [itemToDelete, setItemToDelete] = useState<MembroEquipe | null>(null);

  // Form Fields
  const [editingMembro, setEditingMembro] = useState<MembroEquipe | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Administrador' | 'Gerente' | 'Vendedor'>('Vendedor');
  const [phone, setPhone] = useState('');
  const [commissionRate, setCommissionRate] = useState<number>(5);
  const [salesGoal, setSalesGoal] = useState<number>(0);
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo');

  const getRegistrationTime = (createdAtString: string) => {
    if (!createdAtString) return 'Data indefinida';
    const created = new Date(createdAtString);
    const now = new Date();
    const diffTime = Math.max(0, now.getTime() - created.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Cadastrado hoje';
    }

    if (diffDays >= 365) {
      const years = Math.floor(diffDays / 365);
      const remainingDays = diffDays % 365;
      const months = Math.floor(remainingDays / 30);
      if (months > 0) {
        return `Cadastrado há ${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`;
      }
      return `Cadastrado há ${years} ${years === 1 ? 'ano' : 'anos'}`;
    }

    if (diffDays >= 30) {
      const months = Math.floor(diffDays / 30);
      const remainingDays = diffDays % 30;
      if (remainingDays > 0) {
        return `Cadastrado há ${months} ${months === 1 ? 'mês' : 'meses'} e ${remainingDays} ${remainingDays === 1 ? 'dia' : 'dias'}`;
      }
      return `Cadastrado há ${months} ${months === 1 ? 'mês' : 'meses'}`;
    }

    return `Cadastrado há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    try {
      if (editingMembro) {
        const payload: Partial<MembroEquipe> = {
          name,
          email: email.trim().toLowerCase(),
          password: password || undefined,
          role,
          phone,
          status,
          commissionRate,
          salesGoal: salesGoal || 0
        };
        await onUpdateMembro(editingMembro.id, payload);
      } else {
        const payload: Omit<MembroEquipe, 'id'> = {
          name,
          email: email.trim().toLowerCase(),
          password,
          role,
          phone,
          status,
          commissionRate,
          salesGoal: salesGoal || 0,
          createdAt: new Date().toISOString()
        };
        await onAddMembro(payload);
      }
      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setEditingMembro(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('Vendedor');
    setPhone('');
    setCommissionRate(5);
    setSalesGoal(0);
    setStatus('Ativo');
  };

  const handleEditMembro = (membro: MembroEquipe) => {
    setEditingMembro(membro);
    setName(membro.name);
    setEmail(membro.email);
    setPassword(membro.password || '');
    setRole(membro.role);
    setPhone(membro.phone || '');
    setCommissionRate(membro.commissionRate || 0);
    setSalesGoal(membro.salesGoal || 0);
    setStatus(membro.status);
    setIsFormOpen(true);
  };

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Calculate metrics per seller
  const getSellerMetrics = (sellerEmail: string) => {
    const sellerLeads = leads.filter(
      (l) => l.createdBy === sellerEmail || (l as any).representative === sellerEmail
    );
    const sellerPropostas = propostas.filter((p) => p.createdBy === sellerEmail);
    const approvedPropostas = sellerPropostas.filter((p) => p.status === 'Aceita');
    const totalSales = approvedPropostas.reduce((sum, p) => sum + p.value, 0);

    const member = membros.find((m) => m.email === sellerEmail);
    const commissionRateVal = member?.commissionRate || 0;
    const estimatedCommission = (commissionRateVal / 100) * totalSales;

    return {
      leadsCount: sellerLeads.length,
      propostasCount: sellerPropostas.length,
      approvedCount: approvedPropostas.length,
      totalSales,
      estimatedCommission
    };
  };

  const filteredMembros = membros.filter((m) => {
    const q = membrosSearch.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.phone.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q)
    );
  });

  const getCollectionLabel = (col: string) => {
    switch (col) {
      case 'leads': return 'Lead';
      case 'empresas': return 'Empresa';
      case 'clientes': return 'Cliente';
      case 'propostas': return 'Proposta';
      case 'projetos': return 'Projeto';
      case 'contratos': return 'Contrato';
      case 'financeiro': return 'Financeiro';
      case 'agenda': return 'Agenda';
      case 'follow_ups': return 'Follow-up';
      case 'anotacoes': return 'Anotação';
      case 'documentos': return 'Documento';
      case 'equipe': return 'Membro de Equipe';
      case 'configuracoes': return 'Configurações do Sistema';
      case 'user_profiles': return 'Perfil do Administrador';
      default: return col;
    }
  };

  const getLogExplanation = (log: Log) => {
    const entityName = log.data?.name || log.data?.companyName || log.data?.description || log.data?.title || log.recordId;
    const colLabel = getCollectionLabel(log.collection);

    switch (log.operation) {
      case 'CREATE':
        return (
          <span>
            Criou um novo registro de <strong className="text-slate-800 dark:text-slate-200">{colLabel}</strong>: <span className="font-mono text-indigo-500">{entityName}</span>
          </span>
        );
      case 'UPDATE':
        return (
          <span>
            Atualizou o registro de <strong className="text-slate-800 dark:text-slate-200">{colLabel}</strong> <span className="font-mono text-indigo-500">({entityName})</span>
          </span>
        );
      case 'DELETE':
        return (
          <span>
            Excluiu o registro de <strong className="text-slate-800 dark:text-slate-200">{colLabel}</strong> <span className="font-mono text-rose-500">({entityName})</span>
            {log.justification && (
              <span className="block mt-1 text-[10px] text-slate-400 font-mono italic">
                Motivo: "{log.justification}"
              </span>
            )}
          </span>
        );
      default:
        return <span>Realizou uma operação de {log.operation} em {colLabel}</span>;
    }
  };

  const filteredLogs = logs
    .filter((log) => {
      const q = logsSearch.toLowerCase();
      const matchesSearch =
        log.user.toLowerCase().includes(q) ||
        log.collection.toLowerCase().includes(q) ||
        (log.justification && log.justification.toLowerCase().includes(q)) ||
        log.operation.toLowerCase().includes(q);

      const matchesType = logTypeFilter === 'ALL' || log.operation === logTypeFilter;

      return matchesSearch && matchesType;
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="text-indigo-500" size={24} /> Gestão de Equipe & Auditoria
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cadastre consultores, acompanhe metas de vendas e monitore logs de alteração em tempo real.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 cursor-pointer"
        >
          <UserPlus size={14} /> Novo Membro
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1">
        {[
          { id: 'membros', label: 'Lista de Consultores', icon: Users },
          { id: 'performance', label: 'Desempenho Comercial', icon: TrendingUp },
          { id: 'auditoria', label: 'Log de Atividades (Auditoria)', icon: Activity }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-extrabold transition-all uppercase tracking-wider ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* MAIN SECTIONS */}
      <div className="mt-6">
        {activeTab === 'membros' && (
          <div className="space-y-6">
            {/* Search filter */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Pesquisar consultores por nome, e-mail ou cargo..."
                value={membrosSearch}
                onChange={(e) => setMembrosSearch(e.target.value)}
                className="w-full bg-transparent border-0 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            {/* Members List */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-4">Nome</th>
                      <th className="p-4">E-mail</th>
                      <th className="p-4">Cargo</th>
                      <th className="p-4">Telefone</th>
                      <th className="p-4">Comissão</th>
                      <th className="p-4">Meta de Vendas</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembros.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-slate-400 font-medium">
                          Nenhum membro da equipe cadastrado ou encontrado.
                        </td>
                      </tr>
                    ) : (
                      filteredMembros.map((membro) => {
                        const metrics = getSellerMetrics(membro.email);
                        return (
                          <tr
                            key={membro.id}
                            className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black">
                                  {membro.name[0].toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-extrabold text-slate-950 dark:text-white block">
                                    {membro.name}
                                  </span>
                                  <div className="flex flex-col gap-0.5 mt-0.5">
                                    <span className="text-[10px] text-slate-400">
                                      Cadastrado em {new Date(membro.createdAt).toLocaleDateString('pt-BR')}
                                    </span>
                                    <span className="text-[10px] text-indigo-500 font-bold">
                                      {getRegistrationTime(membro.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                              {membro.email}
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                membro.role === 'Administrador'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
                                  : membro.role === 'Gerente'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                                  : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                              }`}>
                                {membro.role}
                              </span>
                            </td>
                            <td className="p-4 text-slate-600 dark:text-slate-300">
                              {membro.phone || 'Sem telefone'}
                            </td>
                            <td className="p-4 text-slate-700 dark:text-slate-200 font-extrabold">
                              {membro.commissionRate}%
                            </td>
                            <td className="p-4 text-slate-700 dark:text-slate-200 font-extrabold font-mono">
                              {formatBRL(membro.salesGoal || 0)}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() =>
                                  onUpdateMembro(membro.id, {
                                    status: membro.status === 'Ativo' ? 'Inativo' : 'Ativo'
                                  })
                                }
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase cursor-pointer ${
                                  membro.status === 'Ativo'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                              >
                                {membro.status}
                              </button>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-1">
                                <button
                                  onClick={() => handleEditMembro(membro)}
                                  className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all cursor-pointer"
                                  title="Editar consultor"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setItemToDelete(membro)}
                                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                                  title="Excluir membro"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {membros.map((membro) => {
                const metrics = getSellerMetrics(membro.email);
                return (
                  <div
                    key={membro.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black text-sm">
                          {membro.name[0].toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {membro.name}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {membro.email}
                          </span>
                          <span className="text-[10px] text-indigo-500 font-bold block mt-1">
                            {getRegistrationTime(membro.createdAt)}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full uppercase">
                        {membro.status}
                      </span>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Leads Registrados</span>
                        <div className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Briefcase size={14} className="text-slate-400" />
                          {metrics.leadsCount}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Propostas Enviadas</span>
                        <div className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <FileText size={14} className="text-slate-400" />
                          {metrics.propostasCount}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Vendas Fechadas</span>
                        <div className="text-lg font-black text-emerald-500 flex items-center gap-1.5">
                          <CheckCircle size={14} />
                          {metrics.approvedCount}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Taxa de Conversão</span>
                        <div className="text-lg font-black text-indigo-500">
                          {metrics.propostasCount > 0
                            ? `${Math.round((metrics.approvedCount / metrics.propostasCount) * 100)}%`
                            : '0%'}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3">
                      {membro.salesGoal && membro.salesGoal > 0 ? (
                        <div className="space-y-1.5 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/40 dark:border-indigo-950/40 rounded-2xl">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase">Atingimento da Meta</span>
                            <span className="font-bold text-indigo-500 dark:text-indigo-300 font-mono">
                              {Math.round((metrics.totalSales / membro.salesGoal) * 100)}% de {formatBRL(membro.salesGoal)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200/60 dark:bg-slate-800/80 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, Math.round((metrics.totalSales / membro.salesGoal) * 100))}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic text-center p-2 bg-slate-50 dark:bg-slate-950/10 rounded-2xl">
                          Nenhuma meta individual definida.
                        </div>
                      )}

                      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl">
                        <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                          <TrendingUp size={12} className="text-emerald-500" /> Total Vendido
                        </span>
                        <span className="text-sm font-black text-emerald-500 font-mono">
                          {formatBRL(metrics.totalSales)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl">
                        <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                          <Coins size={12} className="text-yellow-500" /> Comissões ({membro.commissionRate}%)
                        </span>
                        <span className="text-sm font-black text-yellow-500 font-mono">
                          {formatBRL(metrics.estimatedCommission)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'auditoria' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              {/* Search */}
              <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Pesquisar por usuário, motivo, coleção ou operação..."
                  value={logsSearch}
                  onChange={(e) => setLogsSearch(e.target.value)}
                  className="w-full bg-transparent border-0 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              {/* Type Filter Buttons */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[10px] font-black uppercase">
                {['ALL', 'CREATE', 'UPDATE', 'DELETE'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setLogTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-lg transition-all uppercase cursor-pointer ${
                      logTypeFilter === type
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                  >
                    {type === 'ALL' ? 'Todos' : type}
                  </button>
                ))}
              </div>
            </div>

            {/* Logs Timeline */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
              <div className="flow-root">
                <ul className="-mb-8">
                  {filteredLogs.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 font-medium">
                      Nenhum registro de auditoria encontrado.
                    </div>
                  ) : (
                    filteredLogs.map((log, logIdx) => (
                      <li key={log.id}>
                        <div className="relative pb-8">
                          {logIdx !== filteredLogs.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-slate-900 ${
                                log.operation === 'CREATE'
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : log.operation === 'UPDATE'
                                  ? 'bg-amber-500/10 text-amber-500'
                                  : 'bg-rose-500/10 text-rose-500'
                              }`}>
                                {log.operation === 'CREATE' ? (
                                  <CheckCircle size={15} />
                                ) : log.operation === 'UPDATE' ? (
                                  <Clock size={15} />
                                ) : (
                                  <AlertTriangle size={15} />
                                )}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 pt-1.5">
                              <p className="text-slate-500 dark:text-slate-400">
                                <strong className="text-slate-900 dark:text-white font-black">{log.user}</strong>{' '}
                                {getLogExplanation(log)}
                              </p>
                              <div className="text-right text-[10px] whitespace-nowrap text-slate-400 mt-0.5 font-mono">
                                <time dateTime={log.timestamp}>
                                  {new Date(log.timestamp).toLocaleDateString('pt-BR')} às {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                                </time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MEMBER MODAL */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <UserPlus className="text-indigo-500" size={18} /> {editingMembro ? 'Editar Consultor' : 'Novo Consultor'}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">E-mail de Acesso</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: joao@sistenext.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Cargo</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none font-bold"
                    >
                      <option value="Vendedor">Vendedor</option>
                      <option value="Gerente">Gerente</option>
                      <option value="Administrador">Administrador</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Comissão (%)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Telefone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: (11) 99999-9999"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Meta de Vendas (R$)</label>
                    <input
                      type="number"
                      min={0}
                      value={salesGoal}
                      onChange={(e) => setSalesGoal(Number(e.target.value))}
                      placeholder="Ex: 50000"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none font-mono font-bold text-indigo-600 dark:text-indigo-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Senha de Acesso</label>
                  <input
                    type="password"
                    required={!editingMembro}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingMembro ? "Deixe em branco para manter a atual" : "Defina uma senha de acesso"}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Status Inicial</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-bold">
                      <input
                        type="radio"
                        name="status"
                        checked={status === 'Ativo'}
                        onChange={() => setStatus('Ativo')}
                        className="text-indigo-600"
                      />
                      Ativo
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-bold">
                      <input
                        type="radio"
                        name="status"
                        checked={status === 'Inativo'}
                        onChange={() => setStatus('Inativo')}
                        className="text-indigo-600"
                      />
                      Inativo
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10"
                  >
                    {editingMembro ? 'Salvar Alterações' : 'Salvar Consultor'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETION CONFIRM MODAL */}
      {itemToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Excluir Membro da Equipe"
          message={`Tem certeza que deseja excluir o membro "${itemToDelete.name}"? Esta operação registrará um log de auditoria permanente.`}
          onConfirm={async (justification) => {
            try {
              await onDeleteMembro(itemToDelete.id, justification, itemToDelete);
              setItemToDelete(null);
            } catch (err) {
              console.error(err);
            }
          }}
          onCancel={() => setItemToDelete(null)}
          requireJustification={true}
        />
      )}
    </div>
  );
}
