import React, { useState } from 'react';
import { useMarketingData } from '../hooks/useMarketingData';
import {
  CalendarDays,
  Target,
  Compass,
  FileEdit,
  ClipboardList,
  Sparkles,
  Award,
  Lightbulb,
  ShieldCheck,
  TrendingUp,
  Settings,
  HelpCircle
} from 'lucide-react';

// Import our modular tab components
import PlanejamentoTab from '../components/PlanejamentoTab';
import NichosTab from '../components/NichosTab';
import EstrategiasTab from '../components/EstrategiasTab';
import ConteudoTab from '../components/ConteudoTab';
import DiagnosticoTab from '../components/DiagnosticoTab';
import PromocionaisTab from '../components/PromocionaisTab';
import IdeiasTab from '../components/IdeiasTab';
import MetasTab from '../components/MetasTab';
import RelatoriosTab from '../components/RelatoriosTab';
import IaTab from '../components/IaTab';

type TabId =
  | 'planejamento'
  | 'nichos'
  | 'estrategias'
  | 'conteudos'
  | 'diagnosticos'
  | 'promocionais'
  | 'ideias'
  | 'metas'
  | 'relatorios'
  | 'ia';

interface MarketingViewProps {
  user: any;
}

export default function MarketingView({ user }: MarketingViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('planejamento'); // Default to Planning

  const {
    planejamentos,
    addPlanejamento,
    updatePlanejamento,
    deletePlanejamento,

    nichos,
    addNicho,
    updateNicho,
    deleteNicho,

    estrategias,
    addEstrategia,
    updateEstrategia,
    deleteEstrategia,

    conteudos,
    addConteudo,
    updateConteudo,
    deleteConteudo,

    prospeccoes,

    diagnosticos,
    addDiagnostico,
    updateDiagnostico,
    deleteDiagnostico,

    projetosPromocionais,
    addProjetoPromocional,
    updateProjetoPromocional,
    deleteProjetoPromocional,

    cases,
    addCaseDeSucesso,
    updateCaseDeSucesso,
    deleteCaseDeSucesso,

    ideias,
    addIdeia,
    updateIdeia,
    deleteIdeia,

    metas,
    addMetaMensal,
    updateMetaMensal,
    deleteMetaMensal,

    loading
  } = useMarketingData(user?.ownerId);

  // Tab definitions for the sub-menu layout
  const tabs: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
    { id: 'planejamento', label: 'Planejamento', icon: CalendarDays },
    { id: 'nichos', label: 'Nichos', icon: Target },
    { id: 'estrategias', label: 'Estratégias', icon: Compass },
    { id: 'conteudos', label: 'Conteúdos', icon: FileEdit },
    { id: 'diagnosticos', label: 'Diagnósticos', icon: ClipboardList },
    { id: 'promocionais', label: 'Portfólio & Iscas', icon: Award },
    { id: 'ideias', label: 'Ideias', icon: Lightbulb },
    { id: 'metas', label: 'Metas Equipe', icon: ShieldCheck },
    { id: 'relatorios', label: 'Relatórios', icon: TrendingUp },
    { id: 'ia', label: 'IA Copilot', icon: Sparkles }
  ];

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
        <span className="text-xs text-slate-400 font-medium font-mono">Sincronizando Módulo de Vendas offline-first...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      {/* Top Welcome Title Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-slate-900/40 p-6 rounded-2xl border border-indigo-500/10 flex items-center justify-between flex-col md:flex-row gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-600/20 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-500/20">
            MÓDULO DE CRESCIMENTO ATIVO
          </span>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight mt-2 flex items-center gap-2">
            Marketing
          </h1>
          <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-2xl mt-1">
            Planeje suas pautas de conteúdo, organize contatos frios no Kanban CRM, calcule gargalos em diagnósticos técnicos e acione a inteligência artificial para obter pitches e responder objeções.
          </p>
        </div>

        <div className="px-3 py-1.5 bg-indigo-600/10 border border-indigo-500/20 rounded-lg text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider">
          ⚡ Sincronização Local Ativa
        </div>
      </div>

      {/* Scrolling Tab selector */}
      <div className="border-b border-slate-850 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
        <div className="flex gap-1 min-w-[950px]">
          {tabs.map((t) => {
            const IconComp = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-lg transition-all border-b-2 ${
                  isActive
                    ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <IconComp size={14} />
                <span>{t.label}</span>
                {t.id === 'ia' && (
                  <span className="bg-indigo-500 text-[8px] text-white px-1 rounded-full animate-pulse">
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab body renderer */}
      <div className="bg-slate-900/25 border border-slate-900/60 p-4 rounded-2xl min-h-[500px]">
        {activeTab === 'planejamento' && (
          <PlanejamentoTab
            planejamentos={planejamentos}
            onAdd={addPlanejamento}
            onUpdate={updatePlanejamento}
            onDelete={deletePlanejamento}
          />
        )}

        {activeTab === 'nichos' && (
          <NichosTab
            nichos={nichos}
            onAdd={addNicho}
            onUpdate={updateNicho}
            onDelete={deleteNicho}
          />
        )}

        {activeTab === 'estrategias' && (
          <EstrategiasTab
            estrategias={estrategias}
            onAdd={addEstrategia}
            onUpdate={updateEstrategia}
            onDelete={deleteEstrategia}
          />
        )}

        {activeTab === 'conteudos' && (
          <ConteudoTab
            conteudos={conteudos}
            onAdd={addConteudo}
            onUpdate={updateConteudo}
            onDelete={deleteConteudo}
          />
        )}

        {activeTab === 'diagnosticos' && (
          <DiagnosticoTab
            diagnosticos={diagnosticos}
            onAdd={addDiagnostico}
            onUpdate={updateDiagnostico}
            onDelete={deleteDiagnostico}
          />
        )}

        {activeTab === 'promocionais' && (
          <PromocionaisTab
            projetos={projetosPromocionais}
            cases={cases}
            onAddProjeto={addProjetoPromocional}
            onUpdateProjeto={updateProjetoPromocional}
            onDeleteProjeto={deleteProjetoPromocional}
            onAddCase={addCaseDeSucesso}
            onUpdateCase={updateCaseDeSucesso}
            onDeleteCase={deleteCaseDeSucesso}
          />
        )}

        {activeTab === 'ideias' && (
          <IdeiasTab
            ideias={ideias}
            onAdd={addIdeia}
            onUpdate={updateIdeia}
            onDelete={deleteIdeia}
          />
        )}

        {activeTab === 'metas' && (
          <MetasTab
            metas={metas}
            onAdd={addMetaMensal}
            onUpdate={updateMetaMensal}
            onDelete={deleteMetaMensal}
          />
        )}

        {activeTab === 'relatorios' && (
          <RelatoriosTab
            prospeccoes={prospeccoes}
            diagnosticos={diagnosticos}
          />
        )}

        {activeTab === 'ia' && (
          <IaTab />
        )}
      </div>
    </div>
  );
}
