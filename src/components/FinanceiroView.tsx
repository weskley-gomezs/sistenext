import React, { useState, useEffect } from 'react';
import { Plus, ArrowUpCircle, ArrowDownCircle, CircleDollarSign, Calendar, TrendingUp, AlertCircle, CheckCircle2, X, Trash2, BellRing, FileDown, MessageCircle, RefreshCw, Copy, ExternalLink, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Financeiro, Cliente, ClienteAssinatura } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { exportToPDF } from '../utils/pdfExport';

interface FinanceiroViewProps {
  financeiro: Financeiro[];
  clientes: Cliente[];
  assinaturasClientes?: ClienteAssinatura[];
  ownerId?: string;
  onAddFinanceiro: (item: Omit<Financeiro, 'id'>) => Promise<string>;
  onUpdateFinanceiro: (id: string, item: Partial<Financeiro>) => Promise<void>;
  onDeleteFinanceiro: (id: string, justification: string, data: Financeiro) => Promise<void>;
  customLogo?: string | null;
  companyName?: string | null;
}

export default function FinanceiroView({
  financeiro,
  clientes,
  assinaturasClientes = [],
  ownerId = '',
  onAddFinanceiro,
  onUpdateFinanceiro,
  onDeleteFinanceiro,
  customLogo,
  companyName
}: FinanceiroViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'caixa' | 'assinaturas'>('caixa');

  // Customer Subscription Form Fields
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [subClientId, setSubClientId] = useState('');
  const [subCycle, setSubCycle] = useState<'Mensal' | 'Anual'>('Mensal');
  const [subPaymentMethod, setSubPaymentMethod] = useState<'Pix' | 'Boleto' | 'Crédito'>('Pix');
  const [subValue, setSubValue] = useState(0);
  const [subDescription, setSubDescription] = useState('');
  const [isSubmittingSubscription, setIsSubmittingSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [isCancellingSubId, setIsCancellingSubId] = useState<string | null>(null);

  // Form Fields
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'Receber' | 'Pagar'>('Receber');
  const [category, setCategory] = useState<'Mensalidade' | 'Comissão' | 'Custo' | 'Venda' | 'Outro'>('Venda');
  const [value, setValue] = useState(0);
  const [status, setStatus] = useState<'Recebido' | 'Pendente' | 'Vencido'>('Pendente');
  const [date, setDate] = useState('');
  const [clientName, setClientName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Crédito' | 'Débito' | 'Boleto' | 'Dinheiro'>('Pix');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Calculations
  const revenues = financeiro.filter((f) => f.type === 'Receber');
  const expenses = financeiro.filter((f) => f.type === 'Pagar');

  const totalReceived = revenues
    .filter((f) => f.status === 'Recebido')
    .reduce((sum, f) => sum + f.value, 0);

  const totalPending = revenues
    .filter((f) => f.status === 'Pendente')
    .reduce((sum, f) => sum + f.value, 0);

  const totalOverdue = revenues
    .filter((f) => f.status === 'Vencido')
    .reduce((sum, f) => sum + f.value, 0);

  const totalCosts = expenses.reduce((sum, f) => sum + f.value, 0);

  // Logic for Recurring Reminders
  const today = new Date();
  const recurringReminders = clientes
    .filter(c => c.contractType === 'Recorrente' && c.status === 'Ativo' && (c.contractValue || 0) > 0)
    .map(client => {
      // Find latest monthly payment
      const clientMonthlyPayments = financeiro
        .filter(f => f.clientName === client.companyName && f.category === 'Mensalidade')
        .sort((a, b) => b.date.localeCompare(a.date));

      const lastPayment = clientMonthlyPayments[0];
      
      if (!lastPayment) {
        return { 
          client, 
          nextDate: new Date(), 
          daysRemaining: 0, 
          status: 'never_paid' as const 
        };
      }

      // Check if there's already a pending/overdue entry for the "future"
      const hasPendingNext = financeiro.some(f => 
        f.clientName === client.companyName && 
        f.category === 'Mensalidade' && 
        (f.status === 'Pendente' || f.status === 'Vencido')
      );

      const lastDate = new Date(lastPayment.date);
      const nextDate = new Date(lastDate);
      nextDate.setDate(lastDate.getDate() + 30);

      const diffTime = nextDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        client,
        lastPayment,
        nextDate,
        daysRemaining: diffDays,
        hasPendingNext,
        status: diffDays < 0 ? 'overdue' as const : diffDays <= 7 ? 'upcoming' as const : 'ok' as const
      };
    })
    .filter(r => (r.status === 'upcoming' || r.status === 'overdue' || r.status === 'never_paid') && !r.hasPendingNext)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Net Profit = Received - Costs
  const netProfit = totalReceived - totalCosts;

  const getWhatsAppBillingLink = (item: Financeiro) => {
    const linkedClient = clientes.find(c => c.companyName === item.clientName || c.name === item.clientName);
    const phone = linkedClient?.phone || '';
    const sanitizedPhone = phone.replace(/\D/g, '');
    
    const formattedVal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value);
    const formattedDate = item.date.split('-').reverse().join('/');
    
    const text = `Olá${linkedClient ? ' ' + linkedClient.name : ''}! Tudo bem? Passando para lembrar sobre o lançamento da fatura de "${item.description}" no valor de ${formattedVal} com vencimento em ${formattedDate}. Caso já tenha realizado o pagamento, desconsidere esta mensagem. Muito obrigado!`;
    
    return `https://wa.me/${sanitizedPhone ? '55' + sanitizedPhone : ''}?text=${encodeURIComponent(text)}`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload: Omit<Financeiro, 'id'> = {
      description,
      type,
      category,
      value,
      status,
      date,
      clientName: clientName || undefined,
      paymentMethod,
      paymentDate: status === 'Recebido' ? new Date().toISOString().split('T')[0] : undefined
    };

    try {
      await onAddFinanceiro(payload);
      setIsOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subClientId) return;
    
    const client = clientes.find(c => c.id === subClientId);
    if (!client) return;

    setIsSubmittingSubscription(true);
    setSubscriptionError(null);

    try {
      const response = await fetch('/api/asaas/criar-assinatura-cliente', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: client.id,
          clientName: client.companyName || client.name,
          email: client.email,
          cnpjCpf: client.cnpj || '',
          paymentMethod: subPaymentMethod,
          value: subValue,
          cycle: subCycle,
          description: subDescription,
          ownerId: ownerId || ''
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro desconhecido ao configurar assinatura');
      }

      setIsSubscriptionOpen(false);
      // Reset form
      setSubClientId('');
      setSubValue(0);
      setSubDescription('');
    } catch (err: any) {
      setSubscriptionError(err.message || 'Ocorreu um erro ao processar a requisição.');
    } finally {
      setIsSubmittingSubscription(false);
    }
  };

  const handleCancelSubscription = async (sub: ClienteAssinatura) => {
    if (!confirm(`Deseja realmente cancelar a assinatura recorrente de ${sub.clientName} no Asaas?`)) {
      return;
    }
    
    setIsCancellingSubId(sub.id);
    try {
      const response = await fetch('/api/asaas/cancelar-assinatura-cliente', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asaasSubscriptionId: sub.asaasSubscriptionId,
          id: sub.id,
          ownerId: ownerId || ''
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao cancelar assinatura no Asaas');
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao cancelar assinatura.');
    } finally {
      setIsCancellingSubId(null);
    }
  };

  const resetForm = () => {
    setDescription('');
    setType('Receber');
    setCategory('Venda');
    setValue(0);
    setStatus('Pendente');
    setDate('');
    setClientName('');
  };

  const handleToggleStatus = async (item: Financeiro) => {
    const nextStatus = item.status === 'Recebido' ? 'Pendente' : 'Recebido';
    try {
      await onUpdateFinanceiro(item.id, { status: nextStatus });
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
            Controle Financeiro & Caixa
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Controle mensalidades recorrentes, comissões comerciais, custos operacionais e margem líquida da sua agência.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'caixa' ? (
            <>
              <button
                onClick={() => {
                  const head = [['Data', 'Descrição', 'Cliente', 'Status', 'Valor']];
                  const body = financeiro
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((f) => [
                      f.date.split('-').reverse().join('/'),
                      f.description,
                      f.clientName || 'Geral',
                      f.status,
                      formatBRL(f.value)
                    ]);
                  const summary = [
                    { label: 'Recebido', value: formatBRL(totalReceived) },
                    { label: 'Pendente', value: formatBRL(totalPending) },
                    { label: 'Custos', value: formatBRL(totalCosts) },
                    { label: 'Lucro Líquido', value: formatBRL(netProfit) }
                  ];
                  exportToPDF({ 
                    title: 'LISTAGEM FINANCEIRA COMPLETA', 
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
                onClick={() => {
                  resetForm();
                  setIsOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 cursor-pointer"
              >
                <Plus size={14} /> Lançar Transação
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setSubscriptionError(null);
                setSubClientId('');
                setSubValue(0);
                setSubDescription('');
                setIsSubscriptionOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 cursor-pointer"
            >
              <Plus size={14} /> Configurar Assinatura
            </button>
          )}
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('caixa')}
          className={`pb-3 px-6 text-sm font-black transition-all ${
            activeTab === 'caixa'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          💰 Fluxo de Caixa
        </button>
        <button
          onClick={() => setActiveTab('assinaturas')}
          className={`pb-3 px-6 text-sm font-black transition-all flex items-center gap-2 ${
            activeTab === 'assinaturas'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          🔁 Assinaturas de Clientes (Asaas)
          <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] px-1.5 py-0.5 rounded-full font-black">
            {(assinaturasClientes || []).filter(s => s.status === 'Ativa').length} Ativas
          </span>
        </button>
      </div>

      {activeTab === 'caixa' ? (
        <>
          {/* Recurring Reminders Alert */}
          <AnimatePresence>
            {recurringReminders.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="bg-indigo-500 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
                    <BellRing size={18} className="animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                      Atenção: Renovação de Mensalidades
                      <span className="bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest font-black">
                        {recurringReminders.length} Pendentes
                      </span>
                    </h4>
                    <p className="text-[10px] text-indigo-700/70 dark:text-indigo-400/70 font-medium mt-0.5">
                      Os clientes abaixo possuem contratos recorrentes que precisam de novos lançamentos financeiros para este mês.
                    </p>
                  </div>
                  <div className="flex -space-x-2 overflow-hidden">
                    {recurringReminders.slice(0, 5).map((r, idx) => (
                      <div 
                        key={r.client.id} 
                        className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-50 dark:border-indigo-950 flex items-center justify-center text-[10px] font-black text-indigo-600 shadow-sm"
                        title={r.client.companyName}
                      >
                        {r.client.companyName.charAt(0)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                  {recurringReminders.map((reminder) => (
                    <div 
                      key={reminder.client.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between group hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-default"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          reminder.status === 'overdue' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'
                        }`}>
                          <Calendar size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[120px]">
                            {reminder.client.companyName}
                          </p>
                          <p className={`text-[9px] font-black uppercase ${
                            reminder.status === 'overdue' ? 'text-red-500' : 'text-amber-500'
                          }`}>
                            {reminder.status === 'overdue' 
                              ? `Vencido há ${Math.abs(reminder.daysRemaining)} dias` 
                              : reminder.status === 'never_paid'
                              ? 'Primeiro Lançamento'
                              : `Vence em ${reminder.daysRemaining} dias`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          resetForm();
                          setClientName(reminder.client.companyName);
                          setCategory('Mensalidade');
                          setValue(reminder.client.contractValue || 0);
                          setDescription(`Mensalidade - ${new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(reminder.nextDate)}`);
                          
                          // Calculate the exact next date string
                          const nextDate = reminder.nextDate;
                          const dateStr = nextDate.toISOString().split('T')[0];
                          setDate(dateStr);
                          
                          setIsOpen(true);
                        }}
                        className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-all"
                        title="Lançar mensalidade"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Financial Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Metric 1 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 p-4 rounded-2xl shadow-sm text-xs">
              <div className="flex justify-between items-center text-emerald-500">
                <span className="font-bold uppercase tracking-wider text-[9px] text-slate-400">Total Recebido</span>
                <ArrowUpCircle size={16} />
              </div>
              <h3 className="text-lg font-black font-mono text-emerald-500 mt-3">{formatBRL(totalReceived)}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Soma de receitas faturadas</p>
            </div>

            {/* Metric 2 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 p-4 rounded-2xl shadow-sm text-xs">
              <div className="flex justify-between items-center text-amber-500">
                <span className="font-bold uppercase tracking-wider text-[9px] text-slate-400">Total Pendente</span>
                <AlertCircle size={16} />
              </div>
              <h3 className="text-lg font-black font-mono text-amber-500 mt-3">{formatBRL(totalPending)}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Boletos / parcelas a vencer</p>
            </div>

            {/* Metric 3 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 p-4 rounded-2xl shadow-sm text-xs">
              <div className="flex justify-between items-center text-red-500">
                <span className="font-bold uppercase tracking-wider text-[9px] text-slate-400">Total Vencido</span>
                <AlertCircle size={16} className="animate-bounce" />
              </div>
              <h3 className="text-lg font-black font-mono text-red-500 mt-3">{formatBRL(totalOverdue)}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Cobranças atrasadas</p>
            </div>

            {/* Metric 4 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 p-4 rounded-2xl shadow-sm text-xs">
              <div className="flex justify-between items-center text-slate-500">
                <span className="font-bold uppercase tracking-wider text-[9px] text-slate-400">Total Custos</span>
                <ArrowDownCircle size={16} className="text-red-400" />
              </div>
              <h3 className="text-lg font-black font-mono text-red-400 mt-3">{formatBRL(totalCosts)}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Infra, comissões & custos</p>
            </div>

            {/* Metric 5 */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-4 rounded-2xl shadow-sm text-xs text-white">
              <div className="flex justify-between items-center text-indigo-400">
                <span className="font-bold uppercase tracking-wider text-[9px] text-slate-400">Lucro Líquido</span>
                <TrendingUp size={16} />
              </div>
              <h3 className="text-lg font-black font-mono text-indigo-400 mt-3">{formatBRL(netProfit)}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Recebido menos despesas</p>
            </div>
          </div>

          {/* Charts section & cash ledger */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Ledger List (8 columns) */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Fluxo de Caixa Ledger
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase font-black tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="p-3">Descrição / Cliente</th>
                      <th className="p-3">Categoria</th>
                      <th className="p-3">Vencimento</th>
                      <th className="p-3 text-right">Valor</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {financeiro.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 font-medium">
                          Nenhum lançamento financeiro registrado.
                        </td>
                      </tr>
                    ) : (
                      [...financeiro]
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition-colors">
                            <td className="p-3">
                              <div className="font-extrabold text-slate-900 dark:text-white flex items-center flex-wrap gap-1.5">
                                {item.description}
                              </div>
                              {item.clientName && (
                                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                                  <span>{item.clientName}</span>
                                </div>
                              )}
                            </td>
                            <td className="p-3 font-semibold uppercase text-[10px] text-slate-500">
                              {item.category}
                            </td>
                            <td className="p-3 font-mono">
                              {item.date.split('-').reverse().join('/')}
                            </td>
                            <td className="p-3 text-right">
                              <span className={`font-black font-mono ${
                                item.type === 'Receber' ? 'text-emerald-500' : 'text-red-400'
                              }`}>
                                {item.type === 'Receber' ? '+' : '-'} {formatBRL(item.value)}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleToggleStatus(item)}
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                  item.status === 'Recebido'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : item.status === 'Vencido'
                                    ? 'bg-red-500/10 text-red-500'
                                    : 'bg-amber-500/10 text-amber-500'
                                }`}
                              >
                                {item.status === 'Recebido' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                {item.status}
                              </button>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5 mx-auto w-fit">
                                {item.type === 'Receber' && item.status !== 'Recebido' && (
                                  <a
                                    href={getWhatsAppBillingLink(item)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 hover:bg-emerald-500/10 rounded-lg text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer flex items-center justify-center"
                                    title="Cobrar via WhatsApp"
                                  >
                                    <MessageCircle size={14} />
                                  </a>
                                )}
                                <button
                                  onClick={() => setItemToDelete(item.id)}
                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer flex items-center justify-center"
                                  title="Remover lançamento"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Categories Analysis (4 columns) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Distribuição de Custos
              </h3>
              <p className="text-xs text-slate-400">Distribuição percentual das despesas operacionais</p>

              <div className="my-6 flex justify-center relative">
                <svg width="120" height="120" viewBox="0 0 42 42" className="transform -rotate-90">
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(156, 163, 175, 0.1)" strokeWidth="4.5" />
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f43f5e" strokeWidth="4.5" strokeDasharray="60 40" strokeDashoffset="0" />
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="4.5" strokeDasharray="40 60" strokeDashoffset="-60" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">{formatBRL(totalCosts).split(',')[0]}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">Despesas</span>
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span>Comissões de Parceiros</span>
                  </div>
                  <span className="font-bold font-mono">60%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span>Infraestrutura Cloud / Servidores</span>
                  </div>
                  <span className="font-bold font-mono">40%</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="bg-indigo-500/10 dark:bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-2xl">
            <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin" /> Faturamento Automatizado via Asaas Sandbox
            </h4>
            <p className="text-[10px] text-slate-500 mt-1">
              Configure recorrências automáticas para seus clientes (Mensal ou Anual). O Asaas irá gerar e enviar cobranças de Cartão de Crédito, Pix ou Boleto periodicamente.
            </p>
          </div>

          {copiedText && (
            <div className="bg-emerald-500/10 text-emerald-500 p-2 text-center rounded-lg text-[10px] font-bold">
              ✓ Código copiado para a área de transferência!
            </div>
          )}

          {assinaturasClientes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 rounded-2xl text-center space-y-2">
              <RefreshCw size={24} className="text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhuma assinatura ativa</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Cadastre e vincule sua primeira assinatura recorrente a um cliente clicando no botão "Configurar Assinatura" acima.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assinaturasClientes.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-indigo-400/50 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-black uppercase bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                        {sub.cycle}
                      </span>
                      <h4 className="font-extrabold text-slate-900 dark:text-white mt-1.5 truncate max-w-[160px]" title={sub.clientName}>
                        {sub.clientName}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate max-w-[160px]">
                        {sub.clientEmail}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
                        {formatBRL(sub.value)}
                      </p>
                      <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                        sub.status === 'Ativa'
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600'
                          : sub.status === 'Cancelada'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-b border-slate-100 dark:border-slate-800 py-2 space-y-1 text-[10px] text-slate-500">
                    <div className="flex justify-between">
                      <span>Descrição:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{sub.description}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Forma de Cobrança:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{sub.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Próximo Vencimento:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {sub.nextDueDate ? sub.nextDueDate.split('-').reverse().join('/') : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-50 dark:border-slate-800/50">
                      <span>Asaas Sub ID:</span>
                      <button
                        onClick={() => copyToClipboard(sub.asaasSubscriptionId || '')}
                        className="text-[9px] font-mono text-slate-400 hover:text-indigo-500 flex items-center gap-1 transition-colors"
                      >
                        {sub.asaasSubscriptionId?.slice(0, 12)}... <Copy size={10} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {sub.invoiceUrl && (
                      <a
                        href={sub.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-center font-bold text-[10px] transition-all flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink size={11} /> Link de Pagamento
                      </a>
                    )}
                    {sub.status === 'Ativa' && (
                      <button
                        disabled={isCancellingSubId === sub.id}
                        onClick={() => handleCancelSubscription(sub)}
                        className="p-1.5 bg-red-50 dark:bg-red-950/20 text-red-500 hover:bg-red-100 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                        title="Cancelar Assinatura"
                      >
                        {isCancellingSubId === sub.id ? (
                          <RefreshCw size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DRAWER FORM */}
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
                  Lançar Transação Financeira
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
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Tipo de Lançamento</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setType('Receber')}
                      className={`py-1.5 font-bold rounded-md transition-all text-center cursor-pointer ${
                        type === 'Receber'
                          ? 'bg-white dark:bg-slate-800 text-emerald-500 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      🟢 Receita (Entrada)
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('Pagar')}
                      className={`py-1.5 font-bold rounded-md transition-all text-center cursor-pointer ${
                        type === 'Pagar'
                          ? 'bg-white dark:bg-slate-800 text-red-500 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      🔴 Despesa (Saída)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Descrição Comercial *</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Parcela 2/4 - Projeto Automação IA"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Valor (R$) *</label>
                    <input
                      type="number"
                      required
                      value={value}
                      onChange={(e) => setValue(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Vencimento *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Categoria</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-bold text-xs"
                    >
                      <option value="Venda">🤝 Venda de Projeto</option>
                      <option value="Mensalidade">🔁 Recorrência (SaaS)</option>
                      <option value="Comissão">💸 Comissão Comercial</option>
                      <option value="Custo">🏢 Custo de Operação / Infra</option>
                      <option value="Outro">📝 Outros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Status Inicial</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-bold text-xs"
                    >
                      <option value="Pendente">🟡 Pendente (A vencer)</option>
                      <option value="Recebido">🟢 Recebido / Pago</option>
                      <option value="Vencido">🔴 Vencido (Atrasado)</option>
                    </select>
                  </div>
                </div>

                {status === 'Recebido' && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-4 rounded-xl space-y-3">
                    <label className="block text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-400">Meio de Pagamento Recebido</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Pix', 'Crédito', 'Débito', 'Boleto', 'Dinheiro'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMethod(m as any)}
                          className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                            paymentMethod === m
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                              : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Cliente Ativo *</label>
                  <select
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-bold text-xs"
                  >
                    <option value="">Selecione um cliente...</option>
                    {clientes.filter(c => c.status === 'Ativo').map(cli => (
                      <option key={cli.id} value={cli.companyName}>
                        {cli.companyName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all shadow-md shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Registrar Lançamento</span>
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

      {/* SUBSCRIPTION DRAWER FORM */}
      <AnimatePresence>
        {isSubscriptionOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSubscriptionOpen(false)}
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
                <div>
                  <h3 className="text-md font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Configurar Assinatura Recorrente
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Criar nova cobrança recorrente automatizada via Asaas</p>
                </div>
                <button
                  onClick={() => setIsSubscriptionOpen(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {subscriptionError && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-3 rounded-lg text-red-500 font-semibold mb-4 text-[10px]">
                  ⚠️ {subscriptionError}
                </div>
              )}

              <form onSubmit={handleCreateSubscription} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Cliente Vinculado *</label>
                  <select
                    required
                    value={subClientId}
                    onChange={(e) => setSubClientId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-bold text-xs"
                  >
                    <option value="">Selecione o cliente de destino...</option>
                    {clientes.filter(c => c.status === 'Ativo').map(cli => (
                      <option key={cli.id} value={cli.id}>
                        {cli.companyName} ({cli.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Frequência / Recorrência *</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSubCycle('Mensal')}
                      className={`py-1.5 font-bold rounded-md transition-all text-center cursor-pointer ${
                        subCycle === 'Mensal'
                          ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      🔄 Mensal
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubCycle('Anual')}
                      className={`py-1.5 font-bold rounded-md transition-all text-center cursor-pointer ${
                        subCycle === 'Anual'
                          ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      📅 Anual
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Forma de Cobrança *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Pix', 'Boleto', 'Crédito'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSubPaymentMethod(m)}
                        className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                          subPaymentMethod === m
                            ? 'bg-indigo-500 text-white shadow-lg'
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  {subPaymentMethod === 'Crédito' && (
                    <p className="text-[9px] text-indigo-500 dark:text-indigo-400 mt-1 font-medium italic">
                      ℹ️ O cliente receberá o link para registrar seu cartão e as cobranças ocorrerão de forma totalmente automática.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Valor da Parcela (R$) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={subValue}
                    onChange={(e) => setSubValue(Number(e.target.value))}
                    placeholder="0,00"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-mono font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Descrição Comercial *</label>
                  <input
                    type="text"
                    required
                    value={subDescription}
                    onChange={(e) => setSubDescription(e.target.value)}
                    placeholder="Ex: Licença SaaS ERP - Plano Startup"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmittingSubscription}
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 text-white font-bold rounded-lg transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {isSubmittingSubscription ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Configurando no Asaas...</span>
                      </>
                    ) : (
                      <span>Ativar Assinatura Recorrente</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSubscriptionOpen(false)}
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
        isOpen={!!itemToDelete}
        title="Remover Lançamento"
        message="Deseja realmente remover este lançamento financeiro? Informe uma justificativa para prosseguir."
        onConfirm={async (justification) => {
          if (itemToDelete) {
            const item = financeiro.find(f => f.id === itemToDelete);
            if (item) {
              await onDeleteFinanceiro(itemToDelete, justification, item);
            }
            setItemToDelete(null);
          }
        }}
        onCancel={() => setItemToDelete(null)}
      />


    </div>
  );
}
