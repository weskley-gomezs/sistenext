import React, { useState } from 'react';
import { Plus, FileText, CheckCircle, XCircle, Printer, Download, X, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Proposta, Cliente, Lead, PropostaServico } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface PropostasViewProps {
  propostas: Proposta[];
  clientes: Cliente[];
  leads: Lead[];
  onAddProposta: (prop: Omit<Proposta, 'id'>) => Promise<string>;
  onUpdateProposta: (id: string, prop: Partial<Proposta>) => Promise<void>;
  onDeleteProposta: (id: string, justification: string, data: Proposta) => Promise<void>;
}

export default function PropostasView({
  propostas,
  clientes,
  leads,
  onAddProposta,
  onUpdateProposta,
  onDeleteProposta
}: PropostasViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProposalForPrint, setSelectedProposalForPrint] = useState<Proposta | null>(null);
  const [companyInfo, setCompanyInfo] = useState({ companyName: '', cnpj: '', logoUrl: '' });
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  
  React.useEffect(() => {
    async function loadCompanyInfo() {
      try {
        const docRef = doc(db, 'configuracoes', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCompanyInfo({
            companyName: data.companyName || '',
            cnpj: data.cnpj || '',
            logoUrl: data.logoUrl || ''
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadCompanyInfo();
  }, []);

  // Form Fields
  const [clientId, setClientId] = useState('');
  const [description, setDescription] = useState('');
  const [validity, setValidity] = useState('');
  const [discount, setDiscount] = useState(0);

  // Dynamic services adder in form
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState(0);
  const [services, setServices] = useState<PropostaServico[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // List of potential recipients (can be leads or active clients!)
  const recipients = [
    ...leads.map((l) => ({ id: l.id, name: `${l.company} (${l.name})`, type: 'Lead' })),
    ...clientes.map((c) => ({ id: c.id, name: `${c.companyName} (${c.name})`, type: 'Cliente' }))
  ];

  const handleAddService = () => {
    if (!serviceName || servicePrice <= 0) return;
    setServices([...services, { name: serviceName, price: servicePrice }]);
    setServiceName('');
    setServicePrice(0);
  };

  const handleRemoveService = (idx: number) => {
    setServices(services.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const recipient = recipients.find((r) => r.id === clientId);
    if (!recipient) {
      setErrorMsg('Selecione um cliente destinatário válido.');
      return;
    }
    if (services.length === 0) {
      setErrorMsg('Insira ao menos um serviço na proposta.');
      return;
    }

    const servicesTotal = services.reduce((s, srv) => s + srv.price, 0);
    const finalValue = Math.max(servicesTotal - discount, 0);

    // Auto-sequence number
    const sequenceNumber = `PROP-2026-${String(propostas.length + 1).padStart(4, '0')}`;

    const payload: Omit<Proposta, 'id'> = {
      number: sequenceNumber,
      clientId,
      clientName: recipient.name.split(' (')[0],
      value: finalValue,
      validity,
      description,
      services,
      discount,
      status: 'Pendente',
      createdAt: new Date().toISOString().split('T')[0]
    };

    try {
      await onAddProposta(payload);
      setIsOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    if (!selectedProposalForPrint) return;
    const prop = selectedProposalForPrint;
    
    const printWindow = window.open('', '', 'width=800,height=800');
    if (!printWindow) return;

    let servicesHtml = prop.services.map(s => `
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
        <span>${s.name}</span>
        <strong>R$ ${s.price.toFixed(2).replace('.', ',')}</strong>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Proposta - ${prop.number}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { 
              font-family: 'Inter', sans-serif; 
              padding: 40px; 
              color: #1e293b; 
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
            }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #f1f5f9; }
            .logo { max-height: 60px; object-fit: contain; }
            .title-area { text-align: right; }
            .title-area h2 { margin: 0; font-size: 18px; color: #0f172a; text-transform: uppercase; }
            .title-area span { display: inline-block; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-top: 4px; color: #64748b; font-weight: bold; }
            .info-grid { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 12px; }
            .info-col strong { display: block; color: #64748b; text-transform: uppercase; font-size: 10px; margin-bottom: 4px; }
            .description { background: #f8fafc; padding: 16px; border-left: 4px solid #4f46e5; font-size: 13px; font-style: italic; margin-bottom: 30px; }
            .services { margin-bottom: 30px; font-size: 13px; }
            .services h4 { font-size: 10px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 10px; }
            .totals { border-top: 1px solid #e2e8f0; padding-top: 15px; margin-left: auto; width: 300px; font-size: 13px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total-final { display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 16px; font-weight: bold; }
            .signatures { margin-top: 80px; display: flex; justify-content: space-between; gap: 40px; }
            .sig-box { width: 45%; border-top: 1px solid #000; padding-top: 10px; text-align: center; font-size: 10px; color: #64748b; }
            @media print {
              body { padding: 0; }
              @page { margin: 2cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              ${companyInfo.logoUrl ? `<img src="${companyInfo.logoUrl}" class="logo" />` : `<strong>${companyInfo.companyName || 'Sua Empresa'}</strong>`}
            </div>
            <div class="title-area">
              <h2>PROPOSTA COMERCIAL</h2>
              <span>${prop.number}</span>
            </div>
          </div>
          
          <div class="info-grid">
            <div class="info-col">
              <strong>Emitido Para:</strong>
              <span style="font-size: 14px; color: #0f172a; font-weight: bold;">${prop.clientName}</span><br/>
              Destinatário Corporativo
            </div>
            <div class="info-col" style="text-align: right;">
              <strong>Datas de Emissão:</strong>
              Emitido em: ${prop.createdAt.split('-').reverse().join('/')}<br/>
              <span style="color: #4f46e5; font-weight: bold;">Válido até: ${prop.validity.split('-').reverse().join('/')}</span>
            </div>
          </div>

          <div class="description">
            ${prop.description}
          </div>

          <div class="services">
            <h4>Descritivo de Serviços</h4>
            ${servicesHtml}
          </div>

          <div class="totals">
            <div class="total-row">
              <span>Soma dos Serviços:</span>
              <strong>R$ ${prop.services.reduce((s, x) => s + x.price, 0).toFixed(2).replace('.', ',')}</strong>
            </div>
            ${prop.discount > 0 ? `
              <div class="total-row" style="color: #ef4444;">
                <span>Desconto Concedido:</span>
                <strong>- R$ ${prop.discount.toFixed(2).replace('.', ',')}</strong>
              </div>
            ` : ''}
            <div class="total-final">
              <span>Valor Líquido:</span>
              <span style="color: #4f46e5;">R$ ${prop.value.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          <div class="signatures">
            <div class="sig-box">Assinatura do Consultor Comercial</div>
            <div class="sig-box">Assinatura do Destinatário (Aceitante)</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const resetForm = () => {
    setClientId('');
    setDescription('');
    setValidity('');
    setDiscount(0);
    setServices([]);
    setServiceName('');
    setServicePrice(0);
  };

  const handleUpdateStatus = async (propId: string, newStatus: Proposta['status']) => {
    try {
      await onUpdateProposta(propId, { status: newStatus });
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
            Gerador de Propostas Comerciais
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gere orçamentos e propostas premium com precificação estruturada e descontos para clientes corporativos.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 cursor-pointer"
        >
          <Plus size={14} /> Nova Proposta
        </button>
      </div>

      {/* Grid List of proposals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {propostas.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs font-semibold">
            Nenhuma proposta comercial gerada ainda.
          </div>
        ) : (
          propostas.map((prop) => (
            <div
              key={prop.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold font-mono">
                      {prop.number}
                    </span>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mt-2 leading-tight">
                      {prop.clientName}
                    </h3>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => setSelectedProposalForPrint(prop)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer"
                      title="Imprimir / Detalhes"
                    >
                      <Printer size={13} />
                    </button>
                    <button
                      onClick={() => setItemToDeleteId(prop.id)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                  {prop.description}
                </p>

                {/* Pricing summary */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Valor Líquido</span>
                    <span className="text-md font-black text-indigo-600 dark:text-indigo-400 font-mono">
                      {formatBRL(prop.value)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 block font-semibold">Validade: {prop.validity.split('-').reverse().slice(0, 2).join('/')}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${
                      prop.status === 'Aceita'
                        ? 'bg-green-500/10 text-green-500'
                        : prop.status === 'Recusada'
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {prop.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action shift */}
              {prop.status === 'Pendente' && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(prop.id, 'Aceita')}
                    className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <CheckCircle size={10} /> Aceitar Proposta
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(prop.id, 'Recusada')}
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-lg text-[10px] transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <XCircle size={10} /> Recusar Proposta
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* DETAILED PRINT MODAL SCREEN */}
      <AnimatePresence>
        {selectedProposalForPrint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProposalForPrint(null)}
              className="fixed inset-0 bg-black/80"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white text-slate-900 p-8 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto z-10"
            >
              {/* Sheet header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1">
                    CRM <span className="text-indigo-600">IA PRO</span>
                  </h2>
                  <p className="text-[10px] uppercase text-slate-500 font-bold mt-1">Sistemas S/A & Inteligência Artificial</p>
                </div>

                <div className="text-right">
                  <h3 className="font-extrabold text-sm text-slate-800">PROPOSTA COMERCIAL</h3>
                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded block mt-1">
                    {selectedProposalForPrint.number}
                  </span>
                </div>
              </div>

              {/* Client Info */}
              <div className="grid grid-cols-2 gap-4 my-6 text-xs text-slate-700">
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[9px] block">Emitido Para:</span>
                  <p className="font-extrabold text-sm text-slate-900 mt-1">{selectedProposalForPrint.clientName}</p>
                  <p className="mt-0.5">Destinatário Corporativo Cadastrado</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-400 uppercase text-[9px] block">Datas de Emissão:</span>
                  <p className="mt-1">Emitido em: {selectedProposalForPrint.createdAt.split('-').reverse().join('/')}</p>
                  <p className="font-semibold text-indigo-600 mt-0.5">Válido até: {selectedProposalForPrint.validity.split('-').reverse().join('/')}</p>
                </div>
              </div>

              {/* Summary Description */}
              <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 leading-relaxed italic mb-6 border-l-4 border-indigo-500">
                {selectedProposalForPrint.description}
              </div>

              {/* Services Table list */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest border-b pb-1">Descritivo de Serviços</h4>
                <div className="divide-y divide-slate-100 text-xs">
                  {selectedProposalForPrint.services.map((srv, i) => (
                    <div key={i} className="py-2.5 flex justify-between items-center">
                      <span className="font-bold text-slate-800">{srv.name}</span>
                      <span className="font-bold font-mono text-slate-900">{formatBRL(srv.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculation Summary */}
              <div className="my-6 border-t pt-4 text-xs flex flex-col items-end space-y-1.5 text-slate-700">
                <div className="flex justify-between w-64">
                  <span>Soma dos Serviços:</span>
                  <span className="font-mono font-bold">{formatBRL(selectedProposalForPrint.services.reduce((s, x) => s + x.price, 0))}</span>
                </div>
                {selectedProposalForPrint.discount > 0 && (
                  <div className="flex justify-between w-64 text-red-500 font-semibold">
                    <span>Desconto Concedido:</span>
                    <span className="font-mono">- {formatBRL(selectedProposalForPrint.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between w-64 border-t pt-2 text-md font-black text-slate-900">
                  <span>Valor Líquido:</span>
                  <span className="font-mono text-indigo-600">{formatBRL(selectedProposalForPrint.value)}</span>
                </div>
              </div>

              {/* Signature lines */}
              <div className="grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-dashed text-[10px] text-center text-slate-500">
                <div className="space-y-1">
                  <div className="border-b w-full h-8"></div>
                  <span>Assinatura do Consultor Comercial</span>
                </div>
                <div className="space-y-1">
                  <div className="border-b w-full h-8"></div>
                  <span>Assinatura do Destinatário (Aceitante)</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex justify-end gap-3 text-xs font-bold no-print">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg cursor-pointer"
                >
                  <Printer size={13} /> Imprimir / Salvar PDF
                </button>
                <button
                  onClick={() => setSelectedProposalForPrint(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer"
                >
                  Fechar Janela
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              className="relative w-full max-w-lg bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col z-10 p-6 border-l border-slate-200 dark:border-slate-900 overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-900 mb-6">
                <h3 className="text-md font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Gerar Proposta Comercial
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                {errorMsg && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 rounded-lg flex items-center gap-2">
                    <ShieldAlert size={14} />
                    <span>{errorMsg}</span>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Destinatário da Proposta *</label>
                  <select
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 focus:outline-none font-bold text-xs"
                  >
                    <option value="">Selecione um lead ou cliente...</option>
                    {recipients.map((r) => (
                      <option key={r.id} value={r.id}>
                        [{r.type}] {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Validade da Proposta</label>
                    <input
                      type="date"
                      required
                      value={validity}
                      onChange={(e) => setValidity(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Desconto Concedido (R$)</label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Descrição do Escopo Contratual</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Resuma os objetivos, metas e acordos gerais que compõem a proposta..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                  />
                </div>

                {/* Services Add Section */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/40 dark:border-slate-800/40 space-y-3">
                  <h4 className="font-extrabold text-[10px] text-indigo-500 uppercase tracking-widest">Incluir Serviços / Módulos</h4>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Nome do Módulo/Serviço</label>
                      <input
                        type="text"
                        placeholder="Ex: Integração de WhatsApp API"
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Preço (R$)</label>
                      <input
                        type="number"
                        placeholder="2500"
                        value={servicePrice}
                        onChange={(e) => setServicePrice(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddService}
                    className="w-full py-1.5 px-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                  >
                    Adicionar Serviço ao Orçamento
                  </button>

                  {/* List of services currently in form */}
                  <div className="divide-y divide-slate-200/40 dark:divide-slate-800/40 text-[11px] font-semibold pt-2">
                    {services.map((srv, idx) => (
                      <div key={idx} className="py-2 flex justify-between items-center text-slate-600 dark:text-slate-300">
                        <span className="truncate max-w-[250px]">{srv.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-900 dark:text-white">{formatBRL(srv.price)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveService(idx)}
                            className="text-red-500 hover:underline text-[9px]"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                  >
                    Salvar e Gerar Proposta
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
        title="Excluir Proposta"
        message="Deseja realmente remover esta proposta comercial? Informe uma justificativa para prosseguir."
        onConfirm={async (justification) => {
          if (itemToDeleteId) {
            const prop = propostas.find(p => p.id === itemToDeleteId);
            if (prop) {
              await onDeleteProposta(itemToDeleteId, justification, prop);
            }
          }
          setItemToDeleteId(null);
        }}
        onCancel={() => setItemToDeleteId(null)}
      />
    </div>
  );
}
