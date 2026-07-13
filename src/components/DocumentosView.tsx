import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, Search, Trash2, Download, Eye, Tag, FileSignature } from 'lucide-react';
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
  }[] = [
    ...documentos.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      size: d.size || '340 KB',
      createdAt: d.uploadedAt,
      source: 'Upload',
      tabType: 'upload' as const
    })),
    ...propostas.map((p) => ({
      id: p.id,
      name: `${p.number} - Proposta Comercial ${p.clientName}.pdf`,
      type: 'proposal' as const,
      size: '250 KB',
      createdAt: p.createdAt,
      source: 'Sistema',
      tabType: 'proposal' as const
    })),
    ...contratos.map((c) => ({
      id: c.id,
      name: c.fileName || `${c.title}.pdf`,
      type: 'contract' as const,
      size: '1.2 MB',
      createdAt: c.date,
      source: 'Contratos',
      tabType: 'contract' as const,
      content: c.content
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
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                      {doc.type === 'contract' ? <FileSignature size={18} /> : <FileText size={18} />}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-extrabold uppercase">
                        {doc.source}
                      </span>
                      <h3 className="font-extrabold text-xs text-slate-900 dark:text-white mt-1 leading-tight truncate">
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
                  onClick={() => {
                    if (doc.tabType === 'contract' && doc.content) {
                      alert(`--- CONTEÚDO DO CONTRATO ---\n\n${doc.content.substring(0, 500)}${doc.content.length > 500 ? '...' : ''}`);
                    } else {
                      alert('Simulando abertura do arquivo corporativo em nova aba.');
                    }
                  }}
                  className="py-1.5 px-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Eye size={12} /> Visualizar
                </button>
                <button
                  onClick={() => alert('Download do arquivo simulado com sucesso.')}
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
    </div>
  );
}
