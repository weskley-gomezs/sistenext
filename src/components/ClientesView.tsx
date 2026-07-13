import React, { useState } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  FolderLock,
  DollarSign,
  History,
  ClipboardList,
  ChevronRight,
  MessageCircle,
  FolderOpen,
  Plus, 
  Edit2, 
  Save,
  X,
  FileCheck2,
  CalendarCheck2,
  FileText,
  Briefcase,
  AlertCircle,
  Eye,
  ArrowLeft,
  User,
  Trash2,
  FileSignature,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCNPJ, formatPhone } from '../utils/masks';
import { Cliente, Projeto, Financeiro, FollowUp, Anotacao, Documento, Proposta, Contrato } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { exportToPDF } from '../utils/pdfExport';

interface ClientesViewProps {
  clientes: Cliente[];
  projetos: Projeto[];
  financeiro: Financeiro[];
  contratos: Contrato[];
  followUps: FollowUp[];
  anotacoes: Anotacao[];
  propostas: Proposta[];
  documentos: Documento[];
  onAddAnotacao: (note: Omit<Anotacao, 'id'>) => Promise<string>;
  onUpdateCliente: (id: string, cli: Partial<Cliente>) => Promise<void>;
  onDeleteCliente: (id: string, justification: string, data: Cliente) => Promise<void>;
  onUpdateFinanceiro: (id: string, fin: Partial<Financeiro>) => Promise<void>;
  onUpdateContrato: (id: string, cont: Partial<Contrato>) => Promise<void>;
  onDeleteFinanceiro: (id: string, justification: string, data: Financeiro) => Promise<void>;
  onDeleteContrato: (id: string, justification: string, data: Contrato) => Promise<void>;
  onDeleteAnotacao: (id: string, justification: string, data: Anotacao) => Promise<void>;
  customLogo?: string | null;
  companyName?: string | null;
}

type ClientTab = 'overview' | 'projects' | 'finance' | 'contracts' | 'documents' | 'proposals' | 'notes';

export default function ClientesView({
  clientes,
  projetos,
  financeiro,
  contratos,
  followUps,
  anotacoes,
  propostas,
  documentos,
  onAddAnotacao,
  onUpdateCliente,
  onDeleteCliente,
  onUpdateFinanceiro,
  onUpdateContrato,
  onDeleteFinanceiro,
  onDeleteContrato,
  onDeleteAnotacao,
  customLogo,
  companyName
}: ClientesViewProps) {
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [activeTab, setActiveTab] = useState<ClientTab>('overview');

  // Edit states
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Cliente>>({});

  // Note states
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isNoteFormOpen, setIsNoteFormOpen] = useState(false);
  // Finance confirmation states
  const [confirmingFinanceId, setConfirmingFinanceId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'Pix' | 'Crédito' | 'Débito' | 'Boleto' | 'Dinheiro'>('Pix');
  const [deleteType, setDeleteType] = useState<'financeiro' | 'contrato' | 'anotacao' | 'cliente' | null>(null);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  const handleConfirmPayment = async (finId: string) => {
    try {
      await onUpdateFinanceiro(finId, {
        status: 'Recebido',
        paymentMethod: selectedPaymentMethod,
        paymentDate: new Date().toISOString().split('T')[0]
      });
      setConfirmingFinanceId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = clientes.filter((cli) => {
    const q = search.toLowerCase();
    return (
      cli.name.toLowerCase().includes(q) ||
      cli.companyName.toLowerCase().includes(q) ||
      cli.email.toLowerCase().includes(q) ||
      cli.phone.includes(q)
    );
  });

  const handleSelectClient = (cli: Cliente) => {
    setSelectedClient(cli);
    setIsEditingClient(false);
    setEditFormData(cli);
    setActiveTab('overview');
  };

  const handleSaveClientInfo = async () => {
    if (!selectedClient) return;
    try {
      await onUpdateCliente(selectedClient.id, editFormData);
      setSelectedClient({ ...selectedClient, ...editFormData } as Cliente);
      setIsEditingClient(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    const payload: Omit<Anotacao, 'id'> = {
      title: noteTitle,
      content: noteContent,
      entityId: selectedClient.id,
      entityName: selectedClient.companyName,
      entityType: 'client',
      createdAt: new Date().toISOString().split('T')[0],
      user: 'Arquiteto Sênior'
    };

    try {
      await onAddAnotacao(payload);
      setNoteTitle('');
      setNoteContent('');
      setIsNoteFormOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const clientProjects = projetos.filter(p => p.clientId === selectedClient?.id);
  const clientFinance = financeiro.filter(f => f.clientName === selectedClient?.companyName);
  const clientContracts = contratos.filter(c => c.clientId === selectedClient?.id);
  const clientNotes = anotacoes.filter(n => n.entityId === selectedClient?.id);
  const clientProposals = propostas.filter(p => p.clientName === selectedClient?.companyName || p.id === selectedClient?.leadId);
  const clientDocs = documentos.filter(d => d.entityId === selectedClient?.id || d.entityId === selectedClient?.leadId);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Carteira de Clientes Ativos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestão completa 360° do cliente: projetos, finanças, documentos e propostas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Buscar cliente ou empresa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500/40"
              />
            </div>
            <button
              onClick={() => {
                const head = [['Empresa', 'Responsável', 'Telefone', 'Status', 'Faturamento Total']];
                const body = filtered.map((c) => {
                  const total = financeiro
                    .filter((f) => f.clientName === c.companyName)
                    .reduce((sum, f) => sum + f.value, 0);
                  return [
                    c.companyName,
                    c.name,
                    c.phone,
                    c.status,
                    formatBRL(total)
                  ];
                });
                const summary = [
                  { label: 'Total Clientes', value: filtered.length },
                  { label: 'Faturamento Total Carteira', value: formatBRL(financeiro.reduce((sum, f) => sum + f.value, 0)) }
                ];
                exportToPDF({ 
                  title: 'LISTAGEM DE CLIENTES', 
                  head, 
                  body, 
                  summary, 
                  customLogo: customLogo || undefined,
                  companyName: companyName || undefined 
                });
              }}
              className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-xl transition-all border border-slate-200 dark:border-slate-800"
              title="Exportar Lista"
            >
              <FileDown size={18} />
            </button>
          </div>

          <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filtered.map((cli) => {
              const isSelected = selectedClient?.id === cli.id;
              return (
                <div
                  key={cli.id}
                  onClick={() => handleSelectClient(cli)}
                  className={`p-4 border rounded-2xl shadow-sm transition-all cursor-pointer flex justify-between items-center group ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-500/10 to-blue-500/5 border-indigo-500/60 dark:border-indigo-500/40 shadow-md'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/60 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex gap-3 items-center min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      cli.status === 'Inativo' ? 'bg-slate-100 text-slate-400' : 'bg-indigo-500/10 text-indigo-600'
                    }`}>
                      {cli.companyName[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight truncate">
                        {cli.companyName}
                      </h4>
                      <p className={`text-[10px] font-bold ${cli.status === 'Inativo' ? 'text-red-500' : 'text-emerald-500'}`}>
                        {cli.status}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={14} className={`text-slate-400 group-hover:translate-x-1 transition-transform ${isSelected ? 'text-indigo-500 translate-x-1' : ''}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail */}
        <div className="lg:col-span-8">
          {selectedClient ? (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-black text-slate-900 dark:text-white">{selectedClient.companyName}</h2>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                        selectedClient.status === 'Ativo' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {selectedClient.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-bold flex items-center gap-2">
                      <User size={12} /> {selectedClient.name} | {selectedClient.phone}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">{selectedClient.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setDeleteType('cliente');
                        setItemToDeleteId(selectedClient.id);
                      }}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-xl transition-all border border-red-100 dark:border-red-900/40"
                      title="Excluir Cliente"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button 
                      onClick={() => setIsEditingClient(!isEditingClient)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-indigo-500 transition-all border border-slate-100 dark:border-slate-800"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Edit Form */}
                <AnimatePresence>
                  {isEditingClient && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Razão Social</label>
                        <input 
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-xs"
                          value={editFormData.companyName || ''}
                          onChange={e => setEditFormData({...editFormData, companyName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Nome Responsável</label>
                        <input 
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-xs"
                          value={editFormData.name || ''}
                          onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">E-mail Corporativo</label>
                        <input 
                          type="email"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-xs"
                          value={editFormData.email || ''}
                          onChange={e => setEditFormData({...editFormData, email: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">CNPJ</label>
                        <input 
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-xs font-mono"
                          value={editFormData.cnpj || ''}
                          onChange={e => setEditFormData({...editFormData, cnpj: formatCNPJ(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Telefone</label>
                        <input 
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-xs"
                          value={editFormData.phone || ''}
                          onChange={e => setEditFormData({...editFormData, phone: formatPhone(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Valor do Contrato</label>
                        <input 
                          type="number"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-xs font-mono"
                          value={editFormData.contractValue || ''}
                          onChange={e => setEditFormData({...editFormData, contractValue: Number(e.target.value)})}
                          placeholder="0,00"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Tipo de Contrato</label>
                        <select 
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-xs font-bold"
                          value={editFormData.contractType || 'Fixo'}
                          onChange={e => setEditFormData({...editFormData, contractType: e.target.value as 'Fixo' | 'Recorrente'})}
                        >
                          <option value="Fixo">Fixo</option>
                          <option value="Recorrente">Recorrente</option>
                        </select>
                      </div>
                      <div className="space-y-1 flex flex-col justify-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-1">Possui Manutenção?</label>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <input 
                              type="radio" 
                              checked={editFormData.hasMaintenance === true}
                              onChange={() => setEditFormData({...editFormData, hasMaintenance: true})}
                            /> Sim
                          </label>
                          <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <input 
                              type="radio" 
                              checked={editFormData.hasMaintenance === false}
                              onChange={() => setEditFormData({...editFormData, hasMaintenance: false})}
                            /> Não
                          </label>
                        </div>
                      </div>
                      {editFormData.hasMaintenance && (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Período de Manutenção</label>
                            <input 
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-xs"
                              value={editFormData.maintenancePeriod || ''}
                              onChange={e => setEditFormData({...editFormData, maintenancePeriod: e.target.value})}
                              placeholder="Ex: Mensal, Bimestral"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Data Última Manutenção</label>
                            <input 
                              type="date"
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-xs font-mono"
                              value={editFormData.lastMaintenanceDate || ''}
                              onChange={e => setEditFormData({...editFormData, lastMaintenanceDate: e.target.value})}
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase">O que foi feito na última manutenção</label>
                            <textarea 
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-xs"
                              rows={2}
                              value={editFormData.lastMaintenanceNotes || ''}
                              onChange={e => setEditFormData({...editFormData, lastMaintenanceNotes: e.target.value})}
                              placeholder="Descreva as atividades realizadas..."
                            />
                          </div>
                        </>
                      )}
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Endereço</label>
                        <input 
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-xs"
                          value={editFormData.address || ''}
                          onChange={e => setEditFormData({...editFormData, address: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Status do Cliente</label>
                        <select 
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-xs font-bold"
                          value={editFormData.status || 'Ativo'}
                          onChange={e => setEditFormData({...editFormData, status: e.target.value as 'Ativo' | 'Inativo'})}
                        >
                          <option value="Ativo">🟢 Ativo</option>
                          <option value="Inativo">🔴 Inativo</option>
                        </select>
                      </div>
                      {editFormData.status === 'Inativo' && (
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-black text-red-400 uppercase">Causa da Inatividade</label>
                          <textarea 
                            className="w-full bg-red-50/20 dark:bg-red-900/10 border border-red-200 dark:border-red-900/40 p-2 rounded-lg text-xs"
                            placeholder="Descreva o motivo pelo qual o cliente foi desativado..."
                            value={editFormData.inactiveReason || ''}
                            onChange={e => setEditFormData({...editFormData, inactiveReason: e.target.value})}
                          />
                        </div>
                      )}
                      <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                        <button 
                          onClick={() => setIsEditingClient(false)}
                          className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={handleSaveClientInfo}
                          className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                        >
                          <Save size={14} /> Salvar Alterações
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tabs Navigation */}
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
                {[
                  { id: 'overview', label: 'Resumo', icon: Briefcase },
                  { id: 'projects', label: 'Projetos', icon: FolderLock },
                  { id: 'finance', label: 'Financeiro', icon: DollarSign },
                  { id: 'contracts', label: 'Contratos', icon: FileSignature },
                  { id: 'proposals', label: 'Propostas', icon: FileText },
                  { id: 'documents', label: 'Documentos', icon: FolderOpen },
                  { id: 'notes', label: 'Anotações', icon: ClipboardList },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ClientTab)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all whitespace-nowrap shrink-0 ${
                      activeTab === tab.id 
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <tab.icon size={12} /> {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3">Contrato e Manutenção</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 uppercase">Valor Contrato</span>
                            <span className="text-xs font-black font-mono">{formatBRL(selectedClient.contractValue || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 uppercase">Tipo</span>
                            <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{selectedClient.contractType || 'Fixo'}</span>
                          </div>
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 mb-2">
                              {selectedClient.hasMaintenance ? (
                                <div className="flex items-center gap-1.5 text-emerald-500 font-black text-[9px] uppercase">
                                  <CheckCircle2 size={12} /> Com Manutenção
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-slate-400 font-black text-[9px] uppercase">
                                  <X size={12} /> Sem Manutenção
                                </div>
                              )}
                            </div>
                            {selectedClient.hasMaintenance && (
                              <div className="space-y-2 bg-slate-50 dark:bg-slate-950/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between">
                                  <span className="text-[9px] text-slate-400">Período</span>
                                  <span className="text-[10px] font-bold">{selectedClient.maintenancePeriod || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[9px] text-slate-400">Última em</span>
                                  <span className="text-[10px] font-mono font-bold">{selectedClient.lastMaintenanceDate?.split('-').reverse().join('/') || 'N/A'}</span>
                                </div>
                                <div className="pt-1">
                                  <span className="text-[9px] text-slate-400 block mb-0.5">Atividades Recentes:</span>
                                  <p className="text-[10px] text-slate-600 dark:text-slate-400 italic leading-tight">
                                    {selectedClient.lastMaintenanceNotes || 'Nenhum registro de atividade.'}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between">
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3">Informações Fiscais</h4>
                          <div className="space-y-2">
                            <div>
                              <span className="text-[9px] text-slate-400 block">CNPJ</span>
                              <span className="text-xs font-mono font-bold">{selectedClient.cnpj || 'Não Informado'}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 block">Endereço</span>
                              <span className="text-xs font-bold leading-relaxed">{selectedClient.address || 'Não Informado'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">Resumo da Conta</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-[9px] text-slate-400 block">Projetos Ativos</span>
                              <span className="text-lg font-black text-indigo-500">{clientProjects.length}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 block">Faturamento</span>
                              <span className="text-lg font-black text-emerald-500">
                                {formatBRL(clientFinance.reduce((acc, f) => acc + f.value, 0))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {selectedClient.status === 'Inativo' && (
                      <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-black text-[10px] uppercase mb-1">
                          <AlertCircle size={14} /> Motivo da Inatividade
                        </div>
                        <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed italic">
                          {selectedClient.inactiveReason || 'Nenhuma causa detalhada registrada.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'projects' && (
                  <div className="space-y-3">
                    {clientProjects.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                        <p className="text-xs text-slate-400 font-bold">Nenhum projeto registrado.</p>
                      </div>
                    ) : (
                      clientProjects.map(proj => {
                        const progress = Math.round((proj.checklist.filter(c => c.done).length / (proj.checklist.length || 1)) * 100);
                        return (
                          <div key={proj.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center group">
                            <div className="space-y-1">
                              <h4 className="text-xs font-black text-slate-900 dark:text-white">{proj.name}</h4>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="bg-indigo-500 h-full" style={{ width: `${progress}%` }} />
                                </div>
                                <span className="text-[9px] font-black text-slate-400">{progress}%</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-slate-900 dark:text-white font-mono">{formatBRL(proj.value)}</p>
                              <span className="text-[10px] font-bold text-indigo-500 uppercase">{proj.status}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {activeTab === 'finance' && (
                  <div className="space-y-4">
                    {clientFinance.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs font-bold">Sem movimentações financeiras.</div>
                    ) : (
                      clientFinance.map(fin => (
                        <div key={fin.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs font-black text-slate-900 dark:text-white">{fin.description}</p>
                              <span className="text-[10px] text-slate-400 font-mono">{fin.date.split('-').reverse().join('/')}</span>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <div>
                                <p className="text-sm font-black font-mono text-slate-900 dark:text-white">{formatBRL(fin.value)}</p>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${
                                  fin.status === 'Recebido' ? 'bg-emerald-100 text-emerald-600' : 
                                  fin.status === 'Vencido' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                                }`}>
                                  {fin.status}
                                </span>
                              </div>
                              <button 
                                onClick={() => {
                                  setDeleteType('financeiro');
                                  setItemToDeleteId(fin.id);
                                }}
                                className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-300 hover:text-red-500 rounded-lg transition-all"
                                title="Excluir lançamento"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {fin.status === 'Recebido' ? (
                            <div className="pt-3 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                              <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500" /> Pago via {fin.paymentMethod}</span>
                              <span>Em: {fin.paymentDate?.split('-').reverse().join('/') || fin.date.split('-').reverse().join('/')}</span>
                            </div>
                          ) : (
                            <div className="pt-3 border-t border-slate-50 dark:border-slate-800">
                              {confirmingFinanceId === fin.id ? (
                                <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                                  <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase">Forma de Pagamento</label>
                                    <div className="grid grid-cols-3 gap-2">
                                      {['Pix', 'Crédito', 'Débito', 'Boleto', 'Dinheiro'].map((m) => (
                                        <button
                                          key={m}
                                          onClick={() => setSelectedPaymentMethod(m as any)}
                                          className={`py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                                            selectedPaymentMethod === m
                                              ? 'bg-indigo-600 text-white shadow-md'
                                              : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'
                                          }`}
                                        >
                                          {m}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => setConfirmingFinanceId(null)}
                                      className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-500"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      onClick={() => handleConfirmPayment(fin.id)}
                                      className="px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-emerald-500/20"
                                    >
                                      Confirmar Recebimento
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setConfirmingFinanceId(fin.id);
                                    setSelectedPaymentMethod('Pix');
                                  }}
                                  className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100 dark:border-indigo-900/40"
                                >
                                  Marcar como Recebido
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'contracts' && (
                  <div className="space-y-4">
                    {clientContracts.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs font-bold italic">Nenhum contrato assinado ou pendente.</div>
                    ) : (
                      clientContracts.map(cont => (
                        <div key={cont.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center group">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${cont.status === 'Assinado' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                              <FileSignature size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900 dark:text-white">{cont.title}</p>
                              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase">
                                <span>{cont.date.split('-').reverse().join('/')}</span>
                                <span>•</span>
                                <span className={cont.status === 'Assinado' ? 'text-emerald-500' : 'text-amber-500'}>{cont.status}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black font-mono mr-2">{formatBRL(cont.value)}</span>
                            <button 
                              onClick={() => {
                                if (cont.status === 'Assinado') {
                                  alert('Contratos assinados não podem ser excluídos por segurança jurídica.');
                                  return;
                                }
                                setDeleteType('contrato');
                                setItemToDeleteId(cont.id);
                              }}
                              className={`p-2 rounded-lg transition-all ${cont.status === 'Assinado' ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed' : 'text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'}`}
                              disabled={cont.status === 'Assinado'}
                              title={cont.status === 'Assinado' ? 'Bloqueado' : 'Excluir'}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'proposals' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {clientProposals.length === 0 ? (
                      <div className="md:col-span-2 text-center py-12 text-slate-400 text-xs font-bold italic">Nenhuma proposta vinculada a este cliente.</div>
                    ) : (
                      clientProposals.map(prop => (
                        <div key={prop.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 relative group">
                          <div className="flex justify-between items-start">
                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                              <FileText size={16} />
                            </div>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                              prop.status === 'Aceita' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                            }`}>
                              {prop.status}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-xs font-black truncate">{prop.description || 'Proposta Comercial'}</h4>
                            <p className="text-[10px] text-slate-400">Enviada em: {prop.createdAt}</p>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-xs font-black font-mono text-slate-900 dark:text-white">{formatBRL(prop.value)}</span>
                            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-indigo-500">
                              <Eye size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {clientDocs.length === 0 ? (
                      <div className="md:col-span-2 text-center py-12 text-slate-400 text-xs font-bold italic">Nenhum documento anexado.</div>
                    ) : (
                      clientDocs.map(doc => (
                        <div key={doc.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                              <FolderOpen size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-bold truncate max-w-[120px]">{doc.name}</p>
                              <span className="text-[10px] text-slate-400">{doc.uploadedAt} • {doc.size || '340 KB'}</span>
                            </div>
                          </div>
                          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-500">
                            <Eye size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    <button
                      onClick={() => setIsNoteFormOpen(!isNoteFormOpen)}
                      className="w-full py-3 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-black text-slate-400 hover:text-indigo-500 hover:border-indigo-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={14} /> Adicionar Nova Nota Privada
                    </button>

                    <AnimatePresence>
                      {isNoteFormOpen && (
                        <motion.form
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          onSubmit={handleAddNote}
                          className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3"
                        >
                          <input
                            required
                            placeholder="Título da nota..."
                            value={noteTitle}
                            onChange={e => setNoteTitle(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-xs rounded-lg font-bold"
                          />
                          <textarea
                            required
                            rows={3}
                            placeholder="Conteúdo da nota..."
                            value={noteContent}
                            onChange={e => setNoteContent(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-xs rounded-lg"
                          />
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setIsNoteFormOpen(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500">Cancelar</button>
                            <button type="submit" className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-bold">Salvar Nota</button>
                          </div>
                        </motion.form>
                      )}
                    </AnimatePresence>

                    <div className="space-y-3">
                      {clientNotes.map(note => (
                        <div key={note.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl relative group">
                          <button 
                            onClick={() => {
                              setDeleteType('anotacao');
                              setItemToDeleteId(note.id);
                            }}
                            className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 transition-all"
                          >
                            <X size={14} />
                          </button>
                          <h4 className="text-xs font-black mb-1">{note.title}</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{note.content}</p>
                          <div className="mt-3 flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                            <span>{note.createdAt}</span>
                            <span>Por: {note.user}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-slate-800 p-12 rounded-3xl text-center flex flex-col items-center justify-center h-[500px]">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-700">
                <Users size={32} />
              </div>
              <h3 className="font-black text-slate-700 dark:text-slate-300 text-lg tracking-tight">Painel Executivo do Cliente</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
                Selecione uma conta na lista lateral para gerenciar projetos, propostas, faturamento e documentação técnica consolidada.
              </p>
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={!!deleteType}
        title={
          deleteType === 'financeiro' ? 'Excluir Lançamento' : 
          deleteType === 'contrato' ? 'Excluir Contrato' : 
          deleteType === 'cliente' ? 'Excluir Cliente' :
          'Excluir Anotação'
        }
        message={
          deleteType === 'cliente' 
            ? `Deseja realmente excluir o cliente "${selectedClient?.companyName}"? Informe uma justificativa para prosseguir.`
            : "Deseja realmente remover este item? Informe uma justificativa para prosseguir."
        }
        onConfirm={async (justification) => {
          if (itemToDeleteId) {
            if (deleteType === 'financeiro') {
              const item = financeiro.find(f => f.id === itemToDeleteId);
              if (item) await onDeleteFinanceiro(itemToDeleteId, justification, item);
            } else if (deleteType === 'contrato') {
              const item = contratos.find(c => c.id === itemToDeleteId);
              if (item) await onDeleteContrato(itemToDeleteId, justification, item);
            } else if (deleteType === 'anotacao') {
              const item = anotacoes.find(a => a.id === itemToDeleteId);
              if (item) await onDeleteAnotacao(itemToDeleteId, justification, item);
            } else if (deleteType === 'cliente') {
              const item = clientes.find(c => c.id === itemToDeleteId);
              if (item) {
                await onDeleteCliente(itemToDeleteId, justification, item);
                setSelectedClient(null);
              }
            }
          }
          setDeleteType(null);
          setItemToDeleteId(null);
        }}
        onCancel={() => {
          setDeleteType(null);
          setItemToDeleteId(null);
        }}
      />
    </div>
  );
}
