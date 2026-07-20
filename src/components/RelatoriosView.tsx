import React, { useState } from 'react';
import { FileDown, Filter, Calendar, Users, Building2, CircleDollarSign, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { Cliente, Projeto, Financeiro, Contrato } from '../types';
import { exportToPDF } from '../utils/pdfExport';

interface RelatoriosViewProps {
  clientes: Cliente[];
  projetos: Projeto[];
  financeiro: Financeiro[];
  contratos: Contrato[];
  customLogo?: string | null;
  companyName?: string | null;
}

export default function RelatoriosView({ clientes, projetos, financeiro, contratos, customLogo, companyName }: RelatoriosViewProps) {
  const [reportType, setReportType] = useState<'finance' | 'clients' | 'projects'>('finance');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contractFilter, setContractFilter] = useState('all');

  // Unified Filter Logic for UI and PDF
  const getFilteredData = () => {
    if (reportType === 'finance') {
      return financeiro.filter(f => {
        const matchesDate = (!dateStart || f.date >= dateStart) && (!dateEnd || f.date <= dateEnd);
        const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
        const client = clientes.find(c => c.companyName === f.clientName);
        const matchesContract = contractFilter === 'all' || (client && client.contractType === contractFilter);
        return matchesDate && matchesStatus && matchesContract;
      });
    } else if (reportType === 'clients') {
      return clientes.filter(c => {
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        const matchesContract = contractFilter === 'all' || c.contractType === contractFilter;
        return matchesStatus && matchesContract;
      });
    } else {
      return projetos.filter(p => {
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        const client = clientes.find(c => c.id === p.clientId);
        const matchesContract = contractFilter === 'all' || (client && client.contractType === contractFilter);
        return matchesStatus && matchesContract;
      });
    }
  };

  const filteredData = getFilteredData();

  const generatePDF = () => {
    if (reportType === 'finance') {
      const head = [['Data', 'Descrição', 'Cliente', 'Status', 'Valor']];
      const body = filteredData.map((f: any) => [
        f.date.split('-').reverse().join('/'),
        f.description,
        f.clientName || 'N/A',
        f.status,
        formatBRL(f.value)
      ]);
      const summary = [
        { label: 'Total Registros', value: filteredData.length },
        { label: 'Valor Total', value: formatBRL(filteredData.reduce((sum, f: any) => sum + f.value, 0)) },
        { label: 'Período', value: `${dateStart || 'Início'} até ${dateEnd || 'Hoje'}` }
      ];
      exportToPDF({ title: 'RELATÓRIO FINANCEIRO', head, body, summary, customLogo: customLogo || undefined, companyName: companyName || undefined });
    } else if (reportType === 'clients') {
      const head = [['Empresa', 'Responsável', 'Telefone', 'Status', 'Tipo', 'Valor Contrato']];
      const body = filteredData.map((c: Cliente) => {
        const clientContracts = contratos.filter(cont => cont.clientId === c.id);
        const activeCont = clientContracts.find(cont => cont.status === 'Assinado') || clientContracts[0];
        return [
          c.companyName,
          c.name,
          c.phone,
          c.status,
          activeCont ? (activeCont.contractType || 'Fixo') : (c.contractType || 'Fixo'),
          formatBRL(activeCont ? (activeCont.value || 0) : (c.contractValue || 0))
        ];
      });
      exportToPDF({ title: 'RELATÓRIO DE CLIENTES', head, body, customLogo: customLogo || undefined, companyName: companyName || undefined });
    } else if (reportType === 'projects') {
      const head = [['Projeto', 'Cliente', 'Status', 'Prazo', 'Valor']];
      const body = filteredData.map((p: any) => [
        p.name,
        p.clientName,
        p.status,
        p.deadline.split('-').reverse().join('/'),
        formatBRL(p.value)
      ]);
      exportToPDF({ title: 'RELATÓRIO DE PROJETOS', head, body, customLogo: customLogo || undefined, companyName: companyName || undefined });
    }
  };

  const formatBRL = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Centro de Relatórios</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure os filtros e visualize os dados antes da exportação.</p>
        </div>
        <button
          onClick={generatePDF}
          disabled={filteredData.length === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg ${
            filteredData.length === 0 
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
              : 'bg-indigo-600 text-white shadow-indigo-500/30 hover:bg-indigo-700 active:scale-95'
          }`}
        >
          <FileDown size={16} /> Exportar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
              <Filter size={14} /> Painel de Filtros
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase">Tipo de Relatório</label>
                <div className="flex flex-col gap-2">
                  {[
                    { id: 'finance', label: 'Financeiro', icon: CircleDollarSign },
                    { id: 'clients', label: 'Clientes', icon: Users },
                    { id: 'projects', label: 'Projetos', icon: Building2 }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setReportType(t.id as any)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${
                        reportType === t.id 
                          ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-600' 
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <t.icon size={16} /> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase">Período (De / Até)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-2 text-[10px] font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-2 text-[10px] font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="all">Todos os Status</option>
                  {reportType === 'finance' && (
                    <>
                      <option value="Recebido">Recebido</option>
                      <option value="Pendente">Pendente</option>
                      <option value="Vencido">Vencido</option>
                    </>
                  )}
                  {reportType === 'clients' && (
                    <>
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                      <option value="Lead">Lead</option>
                    </>
                  )}
                  {reportType === 'projects' && (
                    <>
                      <option value="Em Andamento">Em Andamento</option>
                      <option value="Concluído">Concluído</option>
                      <option value="Pendente">Pendente</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase">Tipo de Contrato</label>
                <select
                  value={contractFilter}
                  onChange={(e) => setContractFilter(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="Recorrente">Recorrente</option>
                  <option value="Projeto">Projeto</option>
                  <option value="Pontual">Pontual</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Data Visualization Preview */}
        <div className="lg:col-span-3 space-y-6">
          {/* Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[24px]">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Resultados Filtrados</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{filteredData.length}</h3>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">Registros localizados</p>
            </div>
            
            {reportType === 'finance' && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-5 rounded-[24px]">
                <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Valor Acumulado</p>
                <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                  {formatBRL(filteredData.reduce((sum: number, f: any) => sum + f.value, 0))}
                </h3>
                <p className="text-[10px] text-emerald-600/60 font-bold mt-0.5">Baseado nos filtros aplicados</p>
              </div>
            )}

            {reportType === 'clients' && (
              <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 p-5 rounded-[24px]">
                <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Ticket Médio</p>
                <h3 className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
                  {formatBRL(filteredData.reduce((sum: number, c: Cliente) => {
                    const clientContracts = contratos.filter(cont => cont.clientId === c.id);
                    const activeCont = clientContracts.find(cont => cont.status === 'Assinado') || clientContracts[0];
                    return sum + (activeCont ? (activeCont.value || 0) : (c.contractValue || 0));
                  }, 0) / (filteredData.length || 1))}
                </h3>
                <p className="text-[10px] text-indigo-600/60 font-bold mt-0.5">Faturamento por cliente</p>
              </div>
            )}

            {reportType === 'projects' && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 p-5 rounded-[24px]">
                <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Valor de Produção</p>
                <h3 className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
                  {formatBRL(filteredData.reduce((sum: number, p: any) => sum + p.value, 0))}
                </h3>
                <p className="text-[10px] text-amber-600/60 font-bold mt-0.5">Soma de todos projetos</p>
              </div>
            )}
          </div>

          {/* List Preview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <FileText size={14} className="text-indigo-500" /> Prévia dos Dados Selecionados
              </h3>
              <span className="text-[10px] font-black text-slate-400 italic">Exibindo até 10 registros</span>
            </div>
            
            <div className="overflow-x-auto">
              {filteredData.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300 mb-4">
                    <AlertCircle size={32} />
                  </div>
                  <p className="text-xs font-black text-slate-400">Nenhum dado encontrado para os filtros selecionados.</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Principal</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Referência</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredData.slice(0, 10).map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-[11px] font-black text-slate-900 dark:text-white">
                            {reportType === 'finance' ? item.description : reportType === 'clients' ? item.companyName : item.name}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">
                            {reportType === 'finance' ? (item.clientName || 'Geral') : item.name || item.clientName}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[10px] font-mono font-bold text-slate-500">
                            {(() => {
                              if (reportType === 'clients') {
                                return item.createdAt ? item.createdAt.split('-').reverse().join('/') : 'S/D';
                              }
                              return item.date || item.deadline || 'S/D';
                            })()}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            ['Recebido', 'Ativo', 'Concluído'].includes(item.status) 
                              ? 'bg-emerald-100 text-emerald-600' 
                              : ['Pendente', 'Em Andamento', 'Lead'].includes(item.status)
                                ? 'bg-amber-100 text-amber-600'
                                : 'bg-red-100 text-red-600'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-[11px] font-mono font-black text-slate-900 dark:text-white">
                            {(() => {
                              if (reportType === 'clients') {
                                const clientContracts = contratos.filter(cont => cont.clientId === item.id);
                                const activeCont = clientContracts.find(cont => cont.status === 'Assinado') || clientContracts[0];
                                return formatBRL(activeCont ? (activeCont.value || 0) : (item.contractValue || 0));
                              }
                              return formatBRL(item.value || item.contractValue || 0);
                            })()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
