import React, { useState } from 'react';
import {
  Plus,
  Trash,
  Edit,
  Award,
  BookOpen,
  DollarSign,
  Calendar,
  CheckCircle,
  FileCheck,
  Video,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { ProjetoPromocional, CaseDeSucesso } from '../types';

interface PromocionaisTabProps {
  projetos: ProjetoPromocional[];
  cases: CaseDeSucesso[];
  onAddProjeto: (item: any) => Promise<any>;
  onUpdateProjeto: (id: string, item: any) => Promise<any>;
  onDeleteProjeto: (id: string) => Promise<any>;
  onAddCase: (item: any) => Promise<any>;
  onUpdateCase: (id: string, item: any) => Promise<any>;
  onDeleteCase: (id: string) => Promise<any>;
}

export default function PromocionaisTab({
  projetos,
  cases,
  onAddProjeto,
  onUpdateProjeto,
  onDeleteProjeto,
  onAddCase,
  onUpdateCase,
  onDeleteCase
}: PromocionaisTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'projetos' | 'cases'>('projetos');
  const [showProjetoModal, setShowProjetoModal] = useState(false);
  const [showCaseModal, setShowCaseModal] = useState(false);

  const [editingProjeto, setEditingProjeto] = useState<ProjetoPromocional | null>(null);
  const [editingCase, setEditingCase] = useState<CaseDeSucesso | null>(null);

  // Form States - Projetos
  const [projEmpresa, setProjEmpresa] = useState('');
  const [projProjeto, setProjProjeto] = useState('');
  const [projValorPromocional, setProjValorPromocional] = useState(1500);
  const [projValorNormal, setProjValorNormal] = useState(5000);
  const [projData, setProjData] = useState(new Date().toISOString().split('T')[0]);
  const [projPrazo, setProjPrazo] = useState('15 dias');
  const [projStatus, setProjStatus] = useState<ProjetoPromocional['status']>('Em andamento');
  const [projDepoimento, setProjDepoimento] = useState(false);
  const [projCasePublicado, setProjCasePublicado] = useState(false);

  // Form States - Cases
  const [caseEmpresa, setCaseEmpresa] = useState('');
  const [caseSistema, setCaseSistema] = useState('');
  const [caseProblema, setCaseProblema] = useState('');
  const [caseTempo, setCaseTempo] = useState('12 horas/semana');
  const [caseResultados, setCaseResultados] = useState('');
  const [caseDepoimento, setCaseDepoimento] = useState('');
  const [caseFotos, setCaseFotos] = useState('');
  const [caseVideos, setCaseVideos] = useState('');
  const [caseAntes, setCaseAntes] = useState('');
  const [caseDepois, setCaseDepois] = useState('');
  const [caseLink, setCaseLink] = useState('');

  // 1. PROJECT FUNCTIONS
  const openAddProjeto = () => {
    setEditingProjeto(null);
    setProjEmpresa('');
    setProjProjeto('');
    setProjValorPromocional(1500);
    setProjValorNormal(5000);
    setProjData(new Date().toISOString().split('T')[0]);
    setProjPrazo('15 dias');
    setProjStatus('Em andamento');
    setProjDepoimento(false);
    setProjCasePublicado(false);
    setShowProjetoModal(true);
  };

  const openEditProjeto = (item: ProjetoPromocional) => {
    setEditingProjeto(item);
    setProjEmpresa(item.empresa);
    setProjProjeto(item.projeto);
    setProjValorPromocional(item.valorPromocional || 0);
    setProjValorNormal(item.valorNormal || 0);
    setProjData(item.data);
    setProjPrazo(item.prazo);
    setProjStatus(item.status);
    setProjDepoimento(item.depoimentoRecebido);
    setProjCasePublicado(item.casePublicado);
    setShowProjetoModal(true);
  };

  const handleProjetoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      empresa: projEmpresa,
      projeto: projProjeto,
      valorPromocional: Number(projValorPromocional),
      valorNormal: Number(projValorNormal),
      data: projData,
      prazo: projPrazo,
      status: projStatus,
      depoimentoRecebido: projDepoimento,
      casePublicado: projCasePublicado
    };

    try {
      if (editingProjeto) {
        await onUpdateProjeto(editingProjeto.id, payload);
      } else {
        await onAddProjeto(payload);
      }
      setShowProjetoModal(false);
    } catch (err) {
      alert('Erro ao salvar projeto promocional: ' + err);
    }
  };

  const handleDeleteProjeto = async (id: string) => {
    if (confirm('Excluir este projeto promocional?')) {
      await onDeleteProjeto(id);
    }
  };

  // 2. CASE FUNCTIONS
  const openAddCase = () => {
    setEditingCase(null);
    setCaseEmpresa('');
    setCaseSistema('');
    setCaseProblema('');
    setCaseTempo('12 horas/semana');
    setCaseResultados('');
    setCaseDepoimento('');
    setCaseFotos('');
    setCaseVideos('');
    setCaseAntes('');
    setCaseDepois('');
    setCaseLink('');
    setShowCaseModal(true);
  };

  const openEditCase = (item: CaseDeSucesso) => {
    setEditingCase(item);
    setCaseEmpresa(item.empresa);
    setCaseSistema(item.sistemaCriado);
    setCaseProblema(item.problemaResolvido);
    setCaseTempo(item.tempoEconomizado);
    setCaseResultados(item.resultadosObtidos);
    setCaseDepoimento(item.depoimento);
    setCaseFotos(item.fotos || '');
    setCaseVideos(item.videos || '');
    setCaseAntes(item.antes || '');
    setCaseDepois(item.depois || '');
    setCaseLink(item.linkProjeto || '');
    setShowCaseModal(true);
  };

  const handleCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      empresa: caseEmpresa,
      sistemaCriado: caseSistema,
      problemaResolvido: caseProblema,
      tempoEconomizado: caseTempo,
      resultadosObtidos: caseResultados,
      depoimento: caseDepoimento,
      fotos: caseFotos,
      videos: caseVideos,
      antes: caseAntes,
      depois: caseDepois,
      linkProjeto: caseLink
    };

    try {
      if (editingCase) {
        await onUpdateCase(editingCase.id, payload);
      } else {
        await onAddCase(payload);
      }
      setShowCaseModal(false);
    } catch (err) {
      alert('Erro ao salvar case de sucesso: ' + err);
    }
  };

  const handleDeleteCase = async (id: string) => {
    if (confirm('Excluir este case de sucesso?')) {
      await onDeleteCase(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Header Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-2">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveSubTab('projetos')}
            className={`text-sm font-black pb-2 border-b-2 transition-all ${
              activeSubTab === 'projetos'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ⭐ Projetos Promocionais (Iscas)
          </button>
          <button
            onClick={() => setActiveSubTab('cases')}
            className={`text-sm font-black pb-2 border-b-2 transition-all ${
              activeSubTab === 'cases'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📖 Cases de Sucesso (Portfólio)
          </button>
        </div>

        <button
          onClick={activeSubTab === 'projetos' ? openAddProjeto : openAddCase}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg text-xs hover:bg-indigo-500 transition-all shadow-md"
        >
          <Plus size={14} /> {activeSubTab === 'projetos' ? 'Registrar Projeto' : 'Registrar Case'}
        </button>
      </div>

      {/* RENDER PROJECTS TAB */}
      {activeSubTab === 'projetos' && (
        <div className="space-y-4">
          <div className="bg-slate-950/20 border border-slate-850 p-4 rounded-xl text-xs text-slate-400 leading-relaxed flex items-start gap-3">
            <Info className="text-indigo-400 shrink-0 mt-0.5" size={16} />
            <p>
              Projetos promocionais são ferramentas criadas para clientes de forma gratuita ou com desconto agressivo em troca de depoimentos em vídeo, indicações ou parcerias estratégicas de co-marketing.
            </p>
          </div>

          {projetos.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/40 text-slate-500 text-center space-y-3">
              <Award size={36} className="text-slate-600" />
              <div className="text-sm font-semibold">Nenhum projeto promocional cadastrado</div>
              <p className="text-xs text-slate-500 max-w-xs">
                Registre os aplicativos isca ou sistemas pilotos que sua software house construiu de forma promocional.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projetos.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition-all flex flex-col justify-between group relative"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between border-b border-slate-800 pb-2">
                      <div>
                        <span className="text-[10px] bg-slate-850 text-slate-400 font-extrabold px-2 py-0.5 rounded uppercase">
                          {item.empresa}
                        </span>
                        <h4 className="text-sm font-black text-slate-100 mt-2">{item.projeto}</h4>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditProjeto(item)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                          <Edit size={12} />
                        </button>
                        <button onClick={() => handleDeleteProjeto(item.id)} className="p-1 hover:bg-red-500/10 rounded text-slate-500 hover:text-red-400">
                          <Trash size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[11px] pt-1.5">
                      <div className="bg-slate-950/40 p-2 rounded border border-slate-850">
                        <span className="text-slate-500 font-bold block uppercase text-[8px]">Preço Feito:</span>
                        <p className="text-emerald-400 font-bold font-mono">R$ {item.valorPromocional.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-950/40 p-2 rounded border border-slate-850">
                        <span className="text-slate-500 font-bold block uppercase text-[8px]">Valor Real:</span>
                        <p className="text-slate-400 font-bold font-mono line-through">R$ {item.valorNormal.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Prazo de Entrega:</span>
                        <span className="text-slate-300 font-bold">{item.prazo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Data Proposta:</span>
                        <span className="text-slate-300 font-mono">{item.data}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-850">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        item.depoimentoRecebido ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-850 text-slate-400'
                      }`}>
                        {item.depoimentoRecebido ? '✓ Depoimento Ok' : 'Pendente Depoimento'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        item.casePublicado ? 'bg-indigo-500/15 text-indigo-400' : 'bg-slate-850 text-slate-400'
                      }`}>
                        {item.casePublicado ? '✓ Case Ativo' : 'Rascunho Case'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-850/60 flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">Status:</span>
                    <span className={`font-black uppercase text-[9px] ${
                      item.status === 'Entregue'
                        ? 'text-emerald-400'
                        : item.status === 'Cancelado'
                        ? 'text-rose-400'
                        : 'text-amber-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RENDER CASES TAB */}
      {activeSubTab === 'cases' && (
        <div className="space-y-4">
          {cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/40 text-slate-500 text-center space-y-3">
              <BookOpen size={36} className="text-slate-600" />
              <div className="text-sm font-semibold">Sem cases de sucesso publicados</div>
              <p className="text-xs text-slate-500 max-w-xs">
                Registre os depoimentos, métricas de tempo economizado e impactos reais gerados pelos seus sistemas na rotina dos clientes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cases.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition-all flex flex-col justify-between group relative space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between border-b border-slate-800 pb-2">
                      <div>
                        <span className="text-[10px] bg-slate-850 text-slate-400 font-extrabold px-2 py-0.5 rounded uppercase">
                          {item.empresa}
                        </span>
                        <h4 className="text-sm font-black text-slate-100 mt-2">Sistema: {item.sistemaCriado}</h4>
                      </div>

                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditCase(item)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                          <Edit size={12} />
                        </button>
                        <button onClick={() => handleDeleteCase(item.id)} className="p-1 hover:bg-red-500/10 rounded text-slate-500 hover:text-red-400">
                          <Trash size={12} />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 font-medium italic">
                      "{item.depoimento || 'Nenhum depoimento textual cadastrado'}"
                    </p>

                    <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850 space-y-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 font-bold block uppercase text-[8px]">Dor superada:</span>
                        <p className="text-slate-400">{item.problemaResolvido}</p>
                      </div>
                      <div className="border-t border-slate-850/60 pt-2">
                        <span className="text-emerald-400 font-bold block uppercase text-[8px]">Resultados obtidos & Retorno:</span>
                        <p className="text-emerald-300 font-medium">{item.resultadosObtidos}</p>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 font-semibold flex justify-between">
                      <span>Tempo economizado p/ cliente:</span>
                      <span className="text-slate-400 font-bold">{item.tempoEconomizado}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROJETO MODAL */}
      {showProjetoModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">
              {editingProjeto ? '✏️ Editar Projeto Promocional' : '⭐ Registrar Projeto Promocional'}
            </h3>
            <form onSubmit={handleProjetoSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome da Empresa *</label>
                  <input
                    type="text"
                    required
                    value={projEmpresa}
                    onChange={(e) => setProjEmpresa(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="e.g. Mecânica do Zé"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome do Projeto / Isca *</label>
                  <input
                    type="text"
                    required
                    value={projProjeto}
                    onChange={(e) => setProjProjeto(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="e.g. Robô de Whatsapp Automático"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Preço Cobrado (Promocional) *</label>
                  <input
                    type="number"
                    required
                    value={projValorPromocional}
                    onChange={(e) => setProjValorPromocional(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Preço Oficial (Normal) *</label>
                  <input
                    type="number"
                    required
                    value={projValorNormal}
                    onChange={(e) => setProjValorNormal(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Prazo de Execução *</label>
                  <input
                    type="text"
                    required
                    value={projPrazo}
                    onChange={(e) => setProjPrazo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="e.g. 15 dias"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data Proposta *</label>
                  <input
                    type="date"
                    required
                    value={projData}
                    onChange={(e) => setProjData(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-950/45 p-3 rounded-lg border border-slate-855">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Status</label>
                  <select
                    value={projStatus}
                    onChange={(e) => setProjStatus(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200"
                  >
                    <option value="Em andamento">Em andamento</option>
                    <option value="Entregue">Entregue</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase cursor-pointer">
                    <input
                      type="checkbox"
                      checked={projDepoimento}
                      onChange={(e) => setProjDepoimento(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800"
                    />
                    Depoimento Ok?
                  </label>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase cursor-pointer">
                    <input
                      type="checkbox"
                      checked={projCasePublicado}
                      onChange={(e) => setProjCasePublicado(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800"
                    />
                    Publicar Case?
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProjetoModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-lg text-xs hover:bg-slate-75"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-xs hover:bg-indigo-500 transition-all shadow-md"
                >
                  Salvar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CASE MODAL */}
      {showCaseModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2">
              {editingCase ? '✏️ Editar Case de Sucesso' : '📖 Registrar Case de Sucesso'}
            </h3>
            <form onSubmit={handleCaseSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Empresa do Case *</label>
                  <input
                    type="text"
                    required
                    value={caseEmpresa}
                    onChange={(e) => setCaseEmpresa(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="e.g. Mecânica do Zé"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sistema Desenvolvido *</label>
                  <input
                    type="text"
                    required
                    value={caseSistema}
                    onChange={(e) => setCaseSistema(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="e.g. CRM de Atendimento"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dor Superada / Problema Resolvido *</label>
                  <input
                    type="text"
                    required
                    value={caseProblema}
                    onChange={(e) => setCaseProblema(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="e.g. Perda de 30% das ligações manuais"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tempo Economizado *</label>
                  <input
                    type="text"
                    required
                    value={caseTempo}
                    onChange={(e) => setCaseTempo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="e.g. 10 horas por semana por funcionário"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Depoimento do Cliente *</label>
                <textarea
                  required
                  rows={2}
                  value={caseDepoimento}
                  onChange={(e) => setCaseDepoimento(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="e.g. Com a SisteNext economizamos muito tempo..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Resultados Concretos & Retorno *</label>
                <input
                  type="text"
                  required
                  value={caseResultados}
                  onChange={(e) => setCaseResultados(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                  placeholder="e.g. Aumento de 25% de conversão de agendamentos"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Antes (Visão Crítica)</label>
                  <input
                    type="text"
                    value={caseAntes}
                    onChange={(e) => setCaseAntes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="e.g. Planilhas bagunçadas, esquecimentos"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Depois (Após o Software)</label>
                  <input
                    type="text"
                    value={caseDepois}
                    onChange={(e) => setCaseDepois(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    placeholder="e.g. Painel automatizado unificado"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCaseModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-lg text-xs hover:bg-slate-75"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-xs hover:bg-indigo-500 transition-all shadow-md"
                >
                  Salvar Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
