import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Search, 
  Trash2, 
  Download, 
  Eye, 
  Tag, 
  FileSignature, 
  X, 
  Calendar, 
  DollarSign, 
  User, 
  Briefcase, 
  AlertCircle,
  TrendingUp,
  Layers,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Documento, Proposta, Contrato } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface DocumentosViewProps {
  documentos: Documento[];
  propostas: Proposta[];
  contratos: Contrato[];
  onAddDocumento: (doc: Omit<Documento, 'id'>) => Promise<string>;
  onDeleteDocumento: (id: string, justification: string, data: Documento) => Promise<void>;
}

export default function DocumentosView({
  documentos,
  propostas,
  contratos,
  onAddDocumento,
  onDeleteDocumento
}: DocumentosViewProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'upload' | 'proposal' | 'contract'>('all');
  const [dragActive, setDragActive] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<any | null>(null);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Combine real documents with generated proposals and signed contracts for a unified corporate storage experience!
  const unifiedDocs: {
    id: string;
    name: string;
    type: string;
    size: string;
    createdAt: string;
    source: string;
    tabType: 'all' | 'upload' | 'proposal' | 'contract';
    content?: string;
    originalItem?: any;
  }[] = [
    ...documentos.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      size: d.size || '340 KB',
      createdAt: d.uploadedAt,
      source: 'Upload',
      tabType: 'upload' as const,
      originalItem: d
    })),
    ...propostas.map((p) => ({
      id: p.id,
      name: `${p.number} - Proposta Comercial ${p.clientName}.pdf`,
      type: 'proposal' as const,
      size: '250 KB',
      createdAt: p.createdAt,
      source: 'Sistema',
      tabType: 'proposal' as const,
      originalItem: p
    })),
    ...contratos.map((c) => ({
      id: c.id,
      name: c.fileName || `${c.title}.pdf`,
      type: 'contract' as const,
      size: '1.2 MB',
      createdAt: c.date,
      source: 'Contratos',
      tabType: 'contract' as const,
      content: c.content,
      originalItem: c
    }))
  ];

  const filtered = unifiedDocs.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' || d.tabType === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const sizeFormatted = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;

      const payload: Omit<Documento, 'id'> = {
        name: file.name,
        type: file.name.endsWith('.pdf') ? 'contract' : 'other',
        fileUrl: '#',
        size: sizeFormatted,
        uploadedAt: new Date().toISOString().split('T')[0],
        category: 'Geral'
      };

      try {
        await onAddDocumento(payload);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeFormatted = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;

      const payload: Omit<Documento, 'id'> = {
        name: file.name,
        type: file.name.endsWith('.pdf') ? 'contract' : 'other',
        fileUrl: '#',
        size: sizeFormatted,
        uploadedAt: new Date().toISOString().split('T')[0],
        category: 'Geral'
      };

      try {
        await onAddDocumento(payload);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDownloadFile = (doc: any) => {
    let fileContent = '';
    let fileName = doc.name;
    
    if (doc.tabType === 'contract') {
      fileContent = doc.content || `CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\nContratante: ${doc.originalItem?.clientName}\nTítulo: ${doc.originalItem?.title}\nValor: ${formatBRL(doc.originalItem?.value || 0)}\nData: ${doc.originalItem?.date}`;
    } else if (doc.tabType === 'proposal') {
      const p = doc.originalItem;
      const servicesText = p?.services?.map((s: any) => `- ${s.name}: ${formatBRL(s.price)}`).join('\n') || '';
      fileContent = `PROPOSTA COMERCIAL ${p?.number || ''}\n\nCliente: ${p?.clientName}\nValor: ${formatBRL(p?.value || 0)}\nValidade: ${p?.validity || ''}\nDescrição: ${p?.description || ''}\n\nServiços:\n${servicesText}`;
    } else {
      fileContent = `DOCUMENTO CENTRAL GED\n\nNome do Arquivo: ${doc.name}\nTamanho: ${doc.size}\nData de Envio: ${doc.createdAt}\nFonte: ${doc.source}`;
    }

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.pdf') ? fileName.replace('.pdf', '.txt') : fileName + '.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans relative">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          GED - Gestão Eletrônica de Documentos
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Guarde, filtre e acesse propostas comerciais automáticas, contratos assinados e especificações técnicas de forma centralizada.
        </p>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all relative ${
          dragActive
            ? 'border-indigo-500 bg-indigo-500/5'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
        }`}
      >
        <input
          type="file"
          id="file-upload"
          multiple={false}
          onChange={handleFileInput}
          className="hidden"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center justify-center space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <UploadCloud size={24} />
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
              Arraste e solte arquivos aqui, ou clique para selecionar
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Suporta PDFs de propostas, escopos de homologação, apresentações ou mídias de reuniões (Max 10MB)
            </p>
          </div>
        </label>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Pesquisar documentos por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-0 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          />
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          {(['all', 'upload', 'proposal', 'contract'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab === 'all' ? 'Todos' : tab === 'upload' ? 'Arquivos' : tab === 'proposal' ? 'Propostas' : 'Contratos'}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 font-medium text-xs">
            Nenhum documento localizado.
          </div>
        ) : (
          filtered.map((doc, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                      {doc.type === 'contract' ? <FileSignature size={18} /> : <FileText size={18} />}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-extrabold uppercase">
                        {doc.source}
                      </span>
                    <h3 className="font-extrabold text-xs text-slate-900 dark:text-white mt-1 leading-tight truncate" title={doc.name}>
                      {doc.name}
                    </h3>
                    </div>
                  </div>

                  {doc.source === 'Upload' && (
                    <button
                      onClick={() => setItemToDeleteId(doc.id)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="mt-5 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span>Criado: {(doc.createdAt || '').split('-').reverse().join('/') || 'N/A'}</span>
                  <span>Tamanho: {doc.size}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs font-bold text-center">
                <button
                  onClick={() => setSelectedDocForPreview(doc)}
                  className="py-1.5 px-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Eye size={12} /> Visualizar
                </button>
                <button
                  onClick={() => handleDownloadFile(doc)}
                  className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download size={12} /> Baixar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={!!itemToDeleteId}
        title="Excluir Documento"
        message="Deseja realmente remover este documento? Informe uma justificativa para prosseguir."
        onConfirm={async (justification) => {
          if (itemToDeleteId) {
            const doc = documentos.find(d => d.id === itemToDeleteId);
            if (doc) {
              await onDeleteDocumento(itemToDeleteId, justification, doc);
            }
          }
          setItemToDeleteId(null);
        }}
        onCancel={() => setItemToDeleteId(null)}
      />

      {/* Visual Doc Preview Modal */}
      <AnimatePresence>
        {selectedDocForPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center gap-4 bg-slate-50 dark:bg-slate-950/40">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 bg-indigo-500/10 text-indigo-500 rounded-lg flex items-center justify-center shrink-0">
                    {selectedDocForPreview.tabType === 'contract' ? <FileSignature size={16} /> : <FileText size={16} />}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.2 rounded font-black uppercase">
                      {selectedDocForPreview.source}
                    </span>
                    <h2 className="text-xs font-black text-slate-900 dark:text-white truncate" title={selectedDocForPreview.name}>
                      {selectedDocForPreview.name}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadFile(selectedDocForPreview)}
                    className="p-2 bg-slate-200/60 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                    title="Baixar Arquivo"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">Baixar</span>
                  </button>
                  <button
                    onClick={() => setSelectedDocForPreview(null)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body / Viewer */}
              <div className="p-6 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-950">
                {selectedDocForPreview.tabType === 'contract' && (
                  <div className="bg-white text-slate-800 p-8 sm:p-12 shadow-sm border border-slate-200/60 rounded-xl max-w-3xl mx-auto font-serif text-xs sm:text-sm leading-relaxed whitespace-pre-line relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600" />
                    
                    <div className="text-center mb-8">
                      <h3 className="text-base sm:text-lg font-bold uppercase tracking-tight text-slate-950">
                        CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TECNOLOGIA
                      </h3>
                      <p className="text-[10px] text-slate-500 font-sans uppercase font-bold mt-1">
                        Sistenext Solutions & IA
                      </p>
                    </div>

                    {selectedDocForPreview.content ? (
                      <div className="font-serif leading-relaxed text-slate-800 text-justify">
                        {selectedDocForPreview.content}
                      </div>
                    ) : (
                      <div className="space-y-4 text-justify">
                        <p>
                          Pelo presente instrumento particular de contrato, de um lado como <strong>CONTRATADA</strong>, a empresa <strong>SISTENEXT SOLUTIONS LTDA</strong>, inscrita no CNPJ sob o nº 42.109.823/0001-90, e de outro lado como <strong>CONTRATANTE</strong>, a empresa identificada como <strong>{selectedDocForPreview.originalItem?.clientName || 'Cliente final'}</strong>.
                        </p>
                        <p>
                          <strong>CLÁUSULA PRIMEIRA - DO OBJETO:</strong> O presente contrato tem por objeto a prestação de serviços técnicos especializados de desenvolvimento de software, consultoria de processos de inteligência artificial e/ou manutenção de sistemas, de acordo com o escopo homologado em proposta comercial complementar.
                        </p>
                        <p>
                          <strong>CLÁUSULA SEGUNDA - DOS VALORES E CONDIÇÕES:</strong> Pelo objeto deste instrumento, a CONTRATANTE pagará à CONTRATADA o valor total de <strong>{formatBRL(selectedDocForPreview.originalItem?.value || 0)}</strong>, sob as condições de pagamento: <strong>{selectedDocForPreview.originalItem?.paymentTerms || 'A vista'}</strong>.
                        </p>
                        {selectedDocForPreview.originalItem?.contractType === 'Recorrente' ? (
                          <p>
                            Os pagamentos de recorrência (mensalidades) deverão ser quitados impreterivelmente todo dia <strong>{selectedDocForPreview.originalItem?.paymentDueDay || 15}</strong> de cada mês subsequente, sob pena de incidência de multa por atraso acordada entre as partes.
                          </p>
                        ) : (
                          <p>
                            O pagamento fixo acordado deverá ser liquidado até o dia de vencimento limite <strong>{selectedDocForPreview.originalItem?.paymentDueDate?.split('-').reverse().join('/') || 'definido em fatura'}</strong>.
                          </p>
                        )}
                        <p>
                          <strong>CLÁUSULA TERCEIRA - DA VIGÊNCIA:</strong> Este acordo inicia-se na data de assinatura digital do documento e possui vigência conforme especificado no projeto vinculativo.
                        </p>
                      </div>
                    )}

                    {/* Signatures */}
                    <div className="mt-16 pt-8 border-t border-slate-200/80 grid grid-cols-2 gap-8 text-center text-[10px] sm:text-xs font-sans">
                      <div>
                        <div className="w-full border-b border-slate-300 h-8" />
                        <span className="block font-bold text-slate-900 mt-2">SISTENEXT SOLUTIONS LTDA</span>
                        <span className="text-slate-500">CONTRATADA (CONTRATO ASSINADO DIGITALMENTE)</span>
                      </div>
                      <div>
                        <div className="w-full border-b border-slate-300 h-8" />
                        <span className="block font-bold text-slate-900 mt-2">
                          {selectedDocForPreview.originalItem?.clientName?.toUpperCase() || 'CONTRATANTE'}
                        </span>
                        <span className="text-slate-500">REPRESENTANTE LEGAL</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedDocForPreview.tabType === 'proposal' && (
                  (() => {
                    const prop = selectedDocForPreview.originalItem;
                    const subtotal = prop?.services?.reduce((sum: number, s: any) => sum + s.price, 0) || prop?.value || 0;
                    return (
                      <div className="bg-white text-slate-800 p-8 sm:p-12 shadow-sm border border-slate-200/60 rounded-xl max-w-3xl mx-auto font-sans text-xs sm:text-sm leading-relaxed relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />
                        
                        {/* Header */}
                        <div className="flex justify-between items-start gap-4 pb-6 border-b border-slate-100">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-indigo-600 font-black tracking-tighter text-sm">
                              <Sparkles size={14} className="text-indigo-500" />
                              <span>SISTENEXT SOLUTIONS</span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-none">Criação de Sistemas & Inteligência Artificial</p>
                            <p className="text-[9px] text-slate-400 font-mono">contato@sistenext.com.br | (11) 98765-4321</p>
                          </div>
                          <div className="text-right space-y-1">
                            <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              PROPOSTA COMERCIAL
                            </span>
                            <h3 className="text-xs sm:text-sm font-black font-mono text-slate-900">
                              Nº {prop?.number || 'N/A'}
                            </h3>
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div className="my-6 grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase font-bold block mb-0.5">CONTRATANTE</span>
                            <span className="font-extrabold text-slate-900">{prop?.clientName || 'Cliente'}</span>
                            <span className="text-[10px] text-slate-500 block mt-1">Status: {prop?.status || 'Pendente'}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block mb-0.5">CRONOGRAMA</span>
                            <span className="block">Emissão: <strong className="font-mono">{prop?.createdAt?.split('-').reverse().join('/') || 'N/A'}</strong></span>
                            <span className="block mt-0.5">Validade: <strong className="font-mono text-rose-500">{prop?.validity?.split('-').reverse().join('/') || 'N/A'}</strong></span>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="my-5">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">Visão Geral da Proposta</h4>
                          <p className="text-xs text-slate-600 leading-relaxed italic">
                            {prop?.description || 'Desenvolvimento e sustentação de solução de tecnologia conforme escopo homologado.'}
                          </p>
                        </div>

                        {/* Services List */}
                        <div className="my-6">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">Itens e Serviços Propostos</h4>
                          <div className="border border-slate-150 rounded-xl overflow-hidden text-xs">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black uppercase text-slate-500">
                                  <th className="p-3">Descrição do Serviço / Tecnologia</th>
                                  <th className="p-3 text-right">Valor Unitário</th>
                                </tr>
                              </thead>
                              <tbody>
                                {prop?.services && prop.services.length > 0 ? (
                                  prop.services.map((srv: any, i: number) => (
                                    <tr key={i} className="border-b border-slate-100 last:border-none">
                                      <td className="p-3 font-semibold text-slate-800">{srv.name}</td>
                                      <td className="p-3 text-right font-mono font-bold text-slate-900">{formatBRL(srv.price)}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td className="p-3 font-semibold text-slate-800">Desenvolvimento de Software / Consultoria IA</td>
                                    <td className="p-3 text-right font-mono font-bold text-slate-900">{formatBRL(subtotal)}</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Financial Conditions */}
                        <div className="my-6 grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">CONDIÇÕES COMERCIAIS</span>
                            <div className="space-y-1 text-xs">
                              <p>Modalidade: <strong className="bg-slate-100 px-1.5 py-0.2 rounded text-[10px] uppercase">{prop?.contractType || 'Fixo'}</strong></p>
                              <p>Pagamento: <strong>{prop?.paymentTerms || 'A vista'}</strong></p>
                            </div>
                          </div>
                          
                          <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl flex flex-col justify-center items-end text-right">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">VALOR TOTAL ACORDADO</span>
                            <span className="text-slate-500 text-[10px] line-through font-mono leading-none">
                              {prop?.discount && prop.discount > 0 ? formatBRL(subtotal) : ''}
                            </span>
                            <span className="text-base sm:text-lg font-black text-indigo-600 font-mono leading-tight">
                              {formatBRL(prop?.value || subtotal)}
                            </span>
                            {prop?.discount && prop.discount > 0 ? (
                              <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded-md mt-1">
                                Desconto Aplicado: {formatBRL(prop.discount)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}

                {selectedDocForPreview.tabType === 'upload' && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl max-w-2xl mx-auto flex flex-col items-center text-center space-y-6 shadow-sm">
                    <div className="w-16 h-16 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center">
                      <FileText size={32} />
                    </div>
                    
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Arquivo Central GED Guardado
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md italic">
                        "{selectedDocForPreview.name}" foi enviado com sucesso via upload externo e está armazenado de forma criptografada nos servidores da SisteNext.
                      </p>
                    </div>

                    <div className="w-full border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-2.5 text-xs text-left text-slate-600 dark:text-slate-400 font-mono">
                      <div className="flex justify-between">
                        <span>Extensão de Arquivo:</span>
                        <span className="font-bold text-slate-900 dark:text-white uppercase">{selectedDocForPreview.name.split('.').pop() || 'Desconhecido'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tamanho em Disco:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedDocForPreview.size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Data do Envio:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedDocForPreview.createdAt.split('-').reverse().join('/')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status de Segurança:</span>
                        <span className="font-bold text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Verificado & Limpo
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Criptografia GED:</span>
                        <span className="font-bold text-slate-900 dark:text-white">AES-256 GCM at Rest</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownloadFile(selectedDocForPreview)}
                      className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-indigo-500/10"
                    >
                      <Download size={14} /> Baixar Cópia Local
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

