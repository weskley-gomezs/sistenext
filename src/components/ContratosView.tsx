import React, { useState } from 'react';
import { Plus, FileText, CheckCircle2, AlertCircle, FileSignature, Calendar, User, DollarSign, X, Trash2, Printer, FileDown, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Contrato, Cliente } from '../types';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ConfirmModal } from './ConfirmModal';
import jsPDF from 'jspdf';
import { getLocalDateString } from '../utils/dateUtils';

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
  const [editingCont, setEditingCont] = useState<Contrato | null>(null);
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [value, setValue] = useState(0);
  const [status, setStatus] = useState<'Assinado' | 'Pendente'>('Pendente');
  const [date, setDate] = useState(getLocalDateString());
  const [fileName, setFileName] = useState('');
  const [content, setContent] = useState('');
  const [contToDelete, setContToDelete] = useState<string | null>(null);

  // New Contract Payment & Compliance Fields
  const [contractType, setContractType] = useState<'Fixo' | 'Recorrente'>('Fixo');
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [paymentDueDay, setPaymentDueDay] = useState<number>(15);
  const [paymentTerms, setPaymentTerms] = useState<'A vista' | '50/50' | 'Mensal' | 'Personalizado'>('A vista');
  const [hasFine, setHasFine] = useState(false);
  const [fineType, setFineType] = useState<'Dia' | 'Mes'>('Dia');
  const [fineValue, setFineValue] = useState(0);

  const handleExportPDF = (cont: Contrato) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxLineWidth = pageWidth - (2 * margin);

    // Title / Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text(cont.title.toUpperCase(), pageWidth / 2, 25, { align: 'center' });

    // Accent line
    doc.setDrawColor(79, 70, 229); // Indigo 600
    doc.setLineWidth(1);
    doc.line(margin, 32, pageWidth - margin, 32);

    // Content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85); // Slate 700
    
    const formattedContent = cont.content || '';
    const splitLines = doc.splitTextToSize(formattedContent, maxLineWidth);
    
    let cursorY = 42;
    const lineHeight = 6;

    splitLines.forEach((line: string) => {
      if (cursorY + lineHeight > pageHeight - 30) {
        doc.addPage();
        cursorY = 25;
      }
      doc.text(line, margin, cursorY);
      cursorY += lineHeight;
    });

    // Check if we need a new page for signatures
    if (cursorY + 45 > pageHeight - 20) {
      doc.addPage();
      cursorY = 25;
    } else {
      cursorY += 15;
    }

    // Signatures section
    doc.setDrawColor(203, 213, 225); // Slate 300
    doc.setLineWidth(0.5);
    
    const sigLineY = cursorY + 15;
    doc.line(margin, sigLineY, margin + 70, sigLineY);
    doc.line(pageWidth - margin - 70, sigLineY, pageWidth - margin, sigLineY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(companyInfo.companyName || 'CONTRATADA', margin, sigLineY + 5);
    doc.text(cont.clientName || 'CONTRATANTE', pageWidth - margin - 70, sigLineY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`CNPJ: ${companyInfo.cnpj || 'Não informado'}`, margin, sigLineY + 10);
    doc.text('CONTRATANTE', pageWidth - margin - 70, sigLineY + 10);

    // Save
    doc.save(`contrato-${cont.title.toLowerCase().replace(/\s+/g, '-')}-${cont.id}.pdf`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clientes.find((c) => c.id === clientId);
    if (!client) {
      alert('Selecione um cliente ativo.');
      return;
    }

    const payload: Omit<Contrato, 'id'> = {
      clientId,
      clientName: client.companyName || client.name,
      title,
      value,
      status,
      date,
      content,
      fileName: fileName || 'contrato_padrao_firmado.pdf',
      contractType,
      paymentDueDate: contractType === 'Fixo' ? paymentDueDate : '',
      paymentDueDay: contractType === 'Recorrente' ? paymentDueDay : undefined,
      paymentTerms,
      hasFine,
      fineType,
      fineValue
    };

    try {
      if (editingCont) {
        await onUpdateContrato(editingCont.id, payload);
        if ((window as any)._exportOnSave) {
          handleExportPDF({
            id: editingCont.id,
            ...payload
          });
        }
      } else {
        const newId = await onAddContrato(payload);
        
        if ((window as any)._exportOnSave) {
          handleExportPDF({
            id: newId,
            ...payload
          });
        }
      }

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

    const formatDateLong = (dateStr: string) => {
      if (!dateStr) return '___ de ______________ de 20___';
      try {
        const [year, month, day] = dateStr.split('-');
        const months = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        const monthName = months[parseInt(month, 10) - 1] || '______________';
        return `${parseInt(day, 10)} de ${monthName} de ${year}`;
      } catch {
        return '___ de ______________ de 20___';
      }
    };

    const valorExtenso = formatBRL(Number(value) || 0);

    let pagamentoClausulaText = '';
    if (contractType === 'Recorrente') {
      pagamentoClausulaText = `4.1. Pelos serviços objeto deste instrumento, a CONTRATANTE pagará à CONTRATADA o valor recorrente de ${valorExtenso} (${paymentTerms || 'Mensal'}), com vencimento todo dia ${paymentDueDay || 15} de cada mês.`;
    } else {
      pagamentoClausulaText = `4.1. Pelos serviços objeto deste instrumento, a CONTRATANTE pagará à CONTRATADA o valor fixo de ${valorExtenso} (${paymentTerms || 'A vista'}), com vencimento em ${formatDateLong(paymentDueDate)}.`;
    }

    let clauseIndex = 2;
    let multaClausulaText = '';
    if (hasFine) {
      multaClausulaText = `\n4.${clauseIndex}. Em caso de atraso injustificado nos pagamentos, incidirá multa moratória de ${fineValue}% sobre o valor em atraso, calculada ao ${fineType === 'Dia' ? 'dia' : 'mês'}.`;
      clauseIndex++;
    }

    const suspensaoClausulaText = `4.${clauseIndex}. O inadimplemento de qualquer parcela por período superior a 15 (quinze) dias confere à CONTRATADA o direito de suspender imediatamente a prestação de todos os serviços até a regularização do débito.`;

    const template = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS PROFISSIONAIS

Por este instrumento particular, de um lado:

CONTRATANTE: ${client.companyName}, inscrita no CNPJ sob nº ${client.cnpj || '00.000.000/0000-00'}, com sede em ${client.address || 'Endereço não informado'}.

CONTRATADA: ${companyInfo.companyName || 'Sua Empresa'}, inscrita no CNPJ sob nº ${companyInfo.cnpj || '00.000.000/0000-00'}.

As partes identificadas acima têm, entre si, justo e acertado o presente Contrato de Prestação de Serviços, que se regerá pelas seguintes cláusulas e condições:

CLÁUSULA PRIMEIRA – DO OBJETO
1.1. O presente contrato tem por objeto a prestação de serviços de "${title || 'Prestação de Serviços'}" pela CONTRATADA à CONTRATANTE, de forma independente, profissional e sem qualquer vínculo empregatício.
1.2. Os detalhes específicos e cronograma das entregas seguirão os parâmetros acordados em comum acordo pelas partes e documentados em anexo técnico ou proposta comercial aceita.

CLÁUSULA SEGUNDA – DAS OBRIGAÇÕES DA CONTRATADA
2.1. Executar os serviços contratados com a máxima diligência, perícia técnica e qualidade comercial aceitável, observando as melhores práticas do mercado.
2.2. Cumprir rigorosamente os prazos de entrega acordados no cronograma do projeto, salvo por atrasos causados diretamente por omissão ou atraso da CONTRATANTE.
2.3. Manter sigilo sobre quaisquer dados ou informações obtidos em razão deste instrumento.

CLÁUSULA TERCEIRA – DAS OBRIGAÇÕES DA CONTRATANTE
3.1. Efetuar o pagamento dos honorários ajustados em conformidade com as datas e termos previstos na Cláusula Quarta.
3.2. Fornecer de forma tempestiva e completa todas as informações, materiais, credenciais, logos e dados necessários para que a CONTRATADA possa dar início e continuidade aos serviços.
3.3. Responder com celeridade às solicitações de aprovação e validação das etapas apresentadas.

CLÁUSULA QUARTA – DO VALOR E CONDIÇÕES DE PAGAMENTO
${pagamentoClausulaText}${multaClausulaText}
${suspensaoClausulaText}

CLÁUSULA QUINTA – DA CONFIDENCIALIDADE E LGPD
5.1. Ambas as partes comprometem-se a proteger e tratar como confidenciais quaisquer segredos de negócios, informações técnicas, estratégicas ou de clientes trocadas durante este contrato.
5.2. As partes se comprometem a cumprir integralmente as disposições da Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/18 - LGPD), tratando quaisquer dados pessoais com exclusiva finalidade de execução deste contrato e dotando seus sistemas de medidas adequadas de segurança.

CLÁUSULA SEXTA – DA PROPRIEDADE INTELECTUAL
6.1. Todos os direitos de propriedade intelectual sobre os materiais de entrega criados especificamente para a CONTRATANTE no âmbito deste contrato serão cedidos de forma definitiva e automática após a quitação integral dos valores descritos na Cláusula Quarta.

CLÁUSULA SÉTIMA – DA VIGÊNCIA E RESCISÃO
7.1. Este contrato entra em vigor na data de sua assinatura por ambas as partes e vigorará até a conclusão satisfatória de todas as entregas dos serviços ora previstos.
7.2. Qualquer das partes poderá rescindir unilateralmente este instrumento, sem justa causa, mediante aviso prévio por escrito com antecedência mínima de 30 (trinta) dias.
7.3. O contrato poderá ser rescindido de imediato, por justo motivo, no caso de insolvência judicial declarada ou descumprimento imotivado de qualquer das cláusulas aqui estipuladas, desde que não sanado o vício em até 5 (cinco) dias úteis após notificação.

CLÁUSULA OITAVA – DO FORO
8.1. Para dirimir quaisquer dúvidas ou litígios decorrentes deste contrato, as partes elegem, de comum acordo, o Foro da Comarca da CONTRATADA, com exclusão de qualquer outro, por mais privilegiado que seja.

E, por estarem assim justas e contratadas, as partes firmam o presente instrumento em 02 (duas) vias de igual teor e forma para um só efeito legal.

Local e Data: Brasília - DF, ${formatDateLong(date || getLocalDateString())}
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
    setEditingCont(null);
    setClientId('');
    setTitle('');
    setValue(0);
    setStatus('Pendente');
    setDate(getLocalDateString());
    setFileName('');
    setContent('');
    setContractType('Fixo');
    setPaymentDueDate('');
    setPaymentDueDay(15);
    setPaymentTerms('A vista');
    setHasFine(false);
    setFineType('Dia');
    setFineValue(0);
  };

  const handleOpenEdit = (cont: Contrato) => {
    setEditingCont(cont);
    setClientId(cont.clientId);
    setTitle(cont.title);
    setValue(cont.value || 0);
    setStatus(cont.status || 'Pendente');
    setDate(cont.date || getLocalDateString());
    setFileName(cont.fileName || '');
    setContent(cont.content || '');
    setContractType(cont.contractType || 'Fixo');
    setPaymentDueDate(cont.paymentDueDate || '');
    setPaymentDueDay(cont.paymentDueDay || 15);
    setPaymentTerms(cont.paymentTerms || 'A vista');
    setHasFine(cont.hasFine || false);
    setFineType(cont.fineType || 'Dia');
    setFineValue(cont.fineValue || 0);
    setIsOpen(true);
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
                      onClick={() => handleOpenEdit(cont)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer"
                      title="Editar Contrato"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleExportPDF(cont)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer"
                      title="Exportar em PDF"
                    >
                      <FileDown size={13} />
                    </button>
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

                  {/* Payment Details */}
                  {(cont.contractType || cont.paymentDueDate || cont.paymentTerms) && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 space-y-1 text-[11px] text-slate-500">
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-400">Tipo de Cliente:</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{cont.contractType || 'Fixo'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-400">Vencimento:</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {cont.contractType === 'Recorrente'
                            ? `Todo dia ${cont.paymentDueDay || 15}`
                            : cont.paymentDueDate
                            ? cont.paymentDueDate.split('-').reverse().join('/')
                            : 'Não definido'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-400">Forma Pagto:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{cont.paymentTerms || 'A vista'}</span>
                      </div>
                      {cont.hasFine && (
                        <div className="flex justify-between text-amber-600 dark:text-amber-400">
                          <span className="font-semibold">Multa:</span>
                          <span className="font-bold">{cont.fineValue}% ao {cont.fineType === 'Dia' ? 'dia' : 'mês'}</span>
                        </div>
                      )}
                    </div>
                  )}
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
                    {clientes.filter((c) => c.status === 'Ativo').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName || c.name} ({c.name})
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

                {/* Billing Conditions & Fine configuration panel */}
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 p-3.5 rounded-xl space-y-3">
                  <h4 className="font-bold text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Condições de Faturamento e Cobrança
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Tipo de Cliente *</label>
                      <select
                        value={contractType}
                        onChange={(e) => setContractType(e.target.value as any)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none text-xs font-bold"
                      >
                        <option value="Fixo">Fixo</option>
                        <option value="Recorrente">Recorrente</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Forma de Pagamento *</label>
                      <select
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value as any)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none text-xs font-bold"
                      >
                        <option value="A vista">A vista</option>
                        <option value="50/50">50/50</option>
                        <option value="Mensal">Mensal</option>
                        <option value="Personalizado">Personalizado</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {contractType === 'Recorrente' ? (
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Dia do Vencimento (Mensal) *</label>
                        <select
                          value={paymentDueDay}
                          onChange={(e) => setPaymentDueDay(Number(e.target.value))}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none text-xs font-bold"
                        >
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                            <option key={d} value={d}>
                              Todo dia {d} de cada mês
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Data de Vencimento do Pagamento *</label>
                        <input
                          type="date"
                          required
                          value={paymentDueDate}
                          onChange={(e) => setPaymentDueDate(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none text-xs"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={hasFine}
                        onChange={(e) => setHasFine(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Aplicar Multa em Caso de Atraso?</span>
                    </label>
                  </div>

                  {hasFine && (
                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Frequência da Multa</label>
                        <select
                          value={fineType}
                          onChange={(e) => setFineType(e.target.value as any)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none text-xs font-bold"
                        >
                          <option value="Dia">Ao Dia</option>
                          <option value="Mes">Ao Mês</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Valor da Multa (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={fineValue}
                          onChange={(e) => setFineValue(Number(e.target.value))}
                          placeholder="Ex: 1"
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  )}
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

                <div className="pt-4 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      onClick={() => { (window as any)._exportOnSave = false; }}
                      className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all shadow-md shadow-indigo-500/10 cursor-pointer text-xs"
                    >
                      {editingCont ? 'Salvar Alterações' : 'Registrar'}
                    </button>
                    <button
                      type="submit"
                      onClick={() => { (window as any)._exportOnSave = true; }}
                      className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all shadow-md shadow-emerald-500/10 cursor-pointer text-xs flex items-center justify-center gap-1"
                    >
                      <FileDown size={14} /> {editingCont ? 'Salvar & Exportar PDF' : 'Registrar & PDF'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-all cursor-pointer text-xs"
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
