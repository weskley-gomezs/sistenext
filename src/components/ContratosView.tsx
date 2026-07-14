import React, { useState } from 'react';
import { Plus, FileText, CheckCircle2, AlertCircle, FileSignature, Calendar, User, DollarSign, X, Trash2, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Contrato, Cliente } from '../types';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ConfirmModal } from './ConfirmModal';

interface ContratosViewProps {
  contratos: Contrato[];
  clientes: Cliente[];
  onAddContrato: (cont: Omit<Contrato, 'id'>) => Promise<string>;
  onUpdateContrato: (id: string, cont: Partial<Contrato>) => Promise<void>;
  onDeleteContrato: (id: string, justification: string, data: Contrato) => Promise<void>;
  config?: any;
}

export default function ContratosView({
  contratos,
  clientes,
  onAddContrato,
  onUpdateContrato,
  onDeleteContrato,
  config
}: ContratosViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const companyInfo = {
    companyName: config?.companyName || config?.tradingName || '',
    cnpj: config?.cnpj || '',
    logoUrl: config?.logoBase64 || config?.logoUrl || ''
  };

  // Form Fields
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [value, setValue] = useState(0);
  const [status, setStatus] = useState<'Assinado' | 'Pendente'>('Pendente');
  const [date, setDate] = useState('');
  const [fileName, setFileName] = useState('');
  const [content, setContent] = useState('');
  const [contToDelete, setContToDelete] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clientes.find((c) => c.id === clientId);
    if (!client) {
      alert('Selecione um cliente ativo.');
      return;
    }

    const payload: Omit<Contrato, 'id'> = {
      clientId,
      clientName: client.companyName,
      title,
      value,
      status,
      date,
      content,
      fileName: fileName || 'contrato_padrao_firmado.pdf'
    };

    try {
      await onAddContrato(payload);
      setIsOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const generateTemplate = () => {
    const client = clientes.find((c) => c.id === clientId);
    if (!client) {
      setContent('Por favor, selecione um Cliente Contratante acima primeiro para gerar o template.');
      return;
    }

    const template = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS

CONTRATANTE: ${client.companyName}, inscrita no CNPJ sob nº ${client.cnpj || '00.000.000/0000-00'}, com sede em ${client.address || 'Endereço não informado'}.

CONTRATADA: ${companyInfo.companyName || 'Sua Empresa'}, inscrita no CNPJ sob nº ${companyInfo.cnpj || '00.000.000/0000-00'}.

1. OBJETO DO CONTRATO
O presente instrumento tem como objeto a prestação de serviços pela CONTRATADA à CONTRATANTE, conforme especificado na proposta comercial vinculada a este contrato.

2. VALOR E CONDIÇÕES DE PAGAMENTO
Pela prestação dos serviços, a CONTRATANTE pagará à CONTRATADA o valor de R$ ${(Number(value) || 0).toFixed(2)}, nas condições preestabelecidas.

3. PRAZO E VIGÊNCIA
Este contrato entra em vigor na data de sua assinatura e terá validade por prazo indeterminado, ou até a entrega final dos serviços.

E, por estarem justas e contratadas, as partes assinam o presente instrumento em duas vias de igual teor.

Local e Data: _________________, ${(date || '').split('-').reverse().join('/') || '___/___/____'}
`;
    setContent(template);
  };

  const handlePrint = (cont: Contrato) => {
    const printWindow = window.open('', '', 'width=800,height=800');
    if (!printWindow) return;
    
    const formattedContent = (cont.content || 'Nenhum conteúdo definido.').replace(/\n/g, '<br/>');

    printWindow.document.write(`
      <html>
        <head>
          <title>Contrato - ${cont.title}</title>
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
            .header { text-align: center; margin-bottom: 40px; }
            .logo { max-height: 80px; margin-bottom: 20px; object-fit: contain; }
            .title { font-size: 18px; font-weight: bold; text-transform: uppercase; margin-bottom: 30px; }
            .content { font-size: 14px; text-align: justify; margin-bottom: 60px; }
            .signatures { margin-top: 80px; display: flex; justify-content: space-between; gap: 40px; }
            .sig-box { width: 45%; border-top: 1px solid #000; padding-top: 10px; text-align: center; font-size: 12px; }
            @media print {
              body { padding: 0; }
              @page { margin: 2cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${companyInfo.logoUrl ? `<img src="${companyInfo.logoUrl}" class="logo" />` : ''}
            <div class="title">${cont.title}</div>
          </div>
          <div class="content">${formattedContent}</div>
          <div class="signatures">
            <div class="sig-box">
              <strong>${companyInfo.companyName || 'CONTRATADA'}</strong><br/>
              CNPJ: ${companyInfo.cnpj || 'Não informado'}
            </div>
            <div class="sig-box">
              <strong>${cont.clientName}</strong><br/>
              CONTRATANTE
            </div>
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
    setTitle('');
    setValue(0);
    setStatus('Pendente');
    setDate('');
    setFileName('');
    setContent('');
  };

  const handleToggleStatus = async (cont: Contrato) => {
    const nextStatus = cont.status === 'Assinado' ? 'Pendente' : 'Assinado';
    try {
      await onUpdateContrato(cont.id, { status: nextStatus });
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
            Repositório de Contratos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Garantia jurídica e acompanhamento de assinaturas digitais de contratos corporativos.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 cursor-pointer"
        >
          <Plus size={14} /> Registrar Contrato
        </button>
      </div>

      {/* Contracts Grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {contratos.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs font-semibold">
            Nenhum contrato arquivado no momento.
          </div>
        ) : (
          contratos.map((cont) => (
            <div
              key={cont.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                      <FileSignature size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">{cont.clientName}</span>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5 leading-tight">
                        {cont.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => handlePrint(cont)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer"
                      title="Imprimir / PDF"
                    >
                      <Printer size={13} />
                    </button>
                    <button
                      onClick={() => {
                        if (cont.status === 'Assinado') {
                          alert('Contratos assinados não podem ser excluídos por segurança jurídica.');
                          return;
                        }
                        setContToDelete(cont.id);
                      }}
                      className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer ${
                        cont.status === 'Assinado' ? 'text-slate-200 dark:text-slate-700' : 'text-slate-400 hover:text-red-500'
                      }`}
                      title={cont.status === 'Assinado' ? 'Contrato assinado bloqueado' : 'Excluir contrato'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Info block */}
                <div className="mt-5 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-slate-400" />
                    <span>Vigência / Assinatura: {(cont.date || '').split('-').reverse().join('/')}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <FileText size={13} className="text-slate-400" />
                    <span className="truncate max-w-[200px]">{cont.fileName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign size={13} className="text-indigo-500" />
                    <span className="font-bold text-slate-800 dark:text-slate-300 font-mono">Valor Contratual: {formatBRL(cont.value)}</span>
                  </div>
                </div>
              </div>

              {/* Status and Action toggle */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className={`flex items-center gap-1 font-bold ${
                  cont.status === 'Assinado' ? 'text-emerald-500' : 'text-amber-500'
                }`}>
                  {cont.status === 'Assinado' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  Status: {cont.status}
                </span>

                <button
                  onClick={() => handleToggleStatus(cont)}
                  className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                >
                  Alternar Assinatura
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* REGISTER FORM */}
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
                  Registrar Contrato Jurídico
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
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Cliente Contratante *</label>
                  <select
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 focus:outline-none font-bold text-xs"
                  >
                    <option value="">Selecione o cliente ativo...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Título do Contrato *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Contrato de Desenvolvimento de Agente de Voz"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Data de Assinatura *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">Conteúdo do Contrato</label>
                    <button
                      type="button"
                      onClick={generateTemplate}
                      className="text-[10px] text-indigo-500 hover:text-indigo-600 font-bold"
                    >
                      Gerar Modelo Automático
                    </button>
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Digite o conteúdo do contrato ou clique em 'Gerar Modelo Automático'..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 focus:outline-none h-48 resize-y"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nome do Arquivo Logged</label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Ex: contrato_firmado_supermais_assinado.pdf"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Status da Assinatura</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-bold text-xs"
                  >
                    <option value="Pendente">🟡 Assinatura Pendente</option>
                    <option value="Assinado">🟢 Devidamente Assinado</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                  >
                    Registrar Contrato
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
        isOpen={!!contToDelete}
        title="Excluir Contrato"
        message="Deseja realmente excluir este contrato pendente? Informe uma justificativa para prosseguir."
        onConfirm={async (justification) => {
          if (contToDelete) {
            const cont = contratos.find(c => c.id === contToDelete);
            if (cont) {
              await onDeleteContrato(contToDelete, justification, cont);
            }
            setContToDelete(null);
          }
        }}
        onCancel={() => setContToDelete(null)}
      />
    </div>
  );
}
