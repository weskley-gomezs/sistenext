import React, { useState } from 'react';
import {
  Sparkles,
  BarChart3,
  TrendingUp,
  Percent,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingDown,
  ChevronRight,
  Calculator,
  Info
} from 'lucide-react';
import { Prospeccao, Diagnostico } from '../types';
import { askGemini } from '../services/aiService';

interface RelatoriosTabProps {
  prospeccoes: Prospeccao[];
  diagnosticos: Diagnostico[];
}

export default function RelatoriosTab({ prospeccoes, diagnosticos }: RelatoriosTabProps) {
  // AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);

  // Stats calculation
  const totalLeads = prospeccoes.length;
  const statusCounts = {
    'Novo': prospeccoes.filter((p) => p.status === 'Novo').length,
    'Contato enviado': prospeccoes.filter((p) => p.status === 'Contato enviado').length,
    'Respondeu': prospeccoes.filter((p) => p.status === 'Respondeu').length,
    'Reunião marcada': prospeccoes.filter((p) => p.status === 'Reunião marcada').length,
    'Proposta enviada': prospeccoes.filter((p) => p.status === 'Proposta enviada').length,
    'Negociação': prospeccoes.filter((p) => p.status === 'Negociação').length,
    'Cliente': prospeccoes.filter((p) => p.status === 'Cliente').length,
    'Perdido': prospeccoes.filter((p) => p.status === 'Perdido').length
  };

  // Funnel progression percentages
  const getRate = (part: number, whole: number) => {
    if (!whole || whole <= 0) return 0;
    return Math.round((part / whole) * 100);
  };

  // Lost leads with reasons
  const lostLeads = prospeccoes.filter((p) => p.status === 'Perdido');

  // Pipeline financial potential
  const pipelineFinancial = diagnosticos.reduce((acc, curr) => acc + (curr.valorEstimado || 0), 0);

  const wonFinancial = diagnosticos
    .filter((d) => {
      // Find matching prospect which has status === 'Cliente'
      const match = prospeccoes.find((p) => p.nome.toLowerCase() === d.empresa.toLowerCase());
      return match?.status === 'Cliente';
    })
    .reduce((acc, curr) => acc + (curr.valorEstimado || 0), 0);

  const generateExecutiveReport = async () => {
    setAiLoading(true);
    setAiResult('');
    try {
      const funnelStats = `
        - Total Prospectos: ${totalLeads}
        - Novos: ${statusCounts['Novo']}
        - Contato Enviado: ${statusCounts['Contato enviado']}
        - Respondeu: ${statusCounts['Respondeu']}
        - Reunião Marcada: ${statusCounts['Reunião marcada']}
        - Proposta Enviada: ${statusCounts['Proposta enviada']}
        - Em Negociação: ${statusCounts['Negociação']}
        - Ganho (Clientes): ${statusCounts['Cliente']}
        - Perdido: ${statusCounts['Perdido']}
        - Potencial Financeiro em Diagnósticos: R$ ${pipelineFinancial.toLocaleString()}
        - Valor Contratado (Fechamentos): R$ ${wonFinancial.toLocaleString()}
      `;
      const prompt = `Você é o Diretor Comercial e Estrategista de Crescimento da nossa software house. Com base nas seguintes métricas do funil de prospecção ativa e marketing deste mês, escreva um relatório executivo analítico e motivacional com as seguintes seções:
1. Resumo do Desempenho do Funil (avaliando as conversões e os gargalos)
2. Análise da Saúde Financeira do Pipeline (R$ ${pipelineFinancial.toLocaleString()} em oportunidades de diagnóstico técnico)
3. 3 Recomendações Práticas e Próximos Passos Comerciais estratégicos para acelerar os fechamentos.

Métricas coletadas:
${funnelStats}`;
      
      const res = await askGemini(prompt);
      setAiResult(res);
    } catch (err: any) {
      setAiResult('Erro ao rodar relatório da IA: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            📊 Relatórios & Diagnósticos de Conversão
          </h2>
          <p className="text-xs text-slate-400">
            Análise do funil comercial, taxas de fechamento de propostas e motivos de perda.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAiModal(true);
            generateExecutiveReport();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-all shadow-md"
        >
          <Sparkles size={14} /> Elaborar Relatório Executivo c/ IA
        </button>
      </div>

      {/* Grid: Indicators Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Prospectos</span>
          <p className="text-2xl font-black text-slate-100 font-mono">{totalLeads}</p>
          <span className="text-[9px] text-slate-500 block">Empresas registradas no funil</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Taxa de Conversão Final</span>
          <p className="text-2xl font-black text-emerald-400 font-mono">
            {getRate(statusCounts['Cliente'], totalLeads)}%
          </p>
          <span className="text-[9px] text-slate-500 block">Do primeiro contato até o fechamento</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Pipeline Ativo</span>
          <p className="text-2xl font-black text-indigo-400 font-mono">
            R$ {pipelineFinancial.toLocaleString('pt-BR')}
          </p>
          <span className="text-[9px] text-slate-500 block">Valor somado de propostas/diagnósticos</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Valor Fechado</span>
          <p className="text-2xl font-black text-emerald-400 font-mono">
            R$ {wonFinancial.toLocaleString('pt-BR')}
          </p>
          <span className="text-[9px] text-slate-500 block">Soma de contratos do tipo Cliente</span>
        </div>
      </div>

      {/* Bento Grid: Funnel and Loss Reasons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Funnel Visualizer Card (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
              <BarChart3 size={16} className="text-indigo-400" /> Conversão Etapa por Etapa
            </h3>
            <p className="text-[10px] text-slate-500">Volume de leads em cada fase do funil CRM</p>
          </div>

          <div className="space-y-3 pt-3">
            {Object.entries(statusCounts).map(([stage, count]) => {
              const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
              return (
                <div key={stage} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-300">{stage}</span>
                    <span className="text-slate-500 font-mono">{count} leads ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        stage === 'Cliente'
                          ? 'bg-emerald-500'
                          : stage === 'Perdido'
                          ? 'bg-rose-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Loss Reasons Card (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
              <XCircle size={16} className="text-rose-400" /> Diagnóstico de Perdas
            </h3>
            <p className="text-[10px] text-slate-500">Motivos pelos quais os prospectos recusaram propostas</p>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto custom-scrollbar pt-2">
            {lostLeads.length === 0 ? (
              <div className="h-40 flex items-center justify-center border border-dashed border-slate-800 rounded-lg text-[10px] text-slate-600 text-center p-4">
                Nenhum lead perdido registrado até agora. Continue assim!
              </div>
            ) : (
              lostLeads.map((item) => (
                <div key={item.id} className="bg-slate-950/40 p-2.5 rounded border border-slate-850 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-300 truncate max-w-[120px]">{item.nome}</span>
                    <span className="text-rose-400 uppercase text-[8px] font-mono">{item.segmento}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 italic">
                    "{item.motivoDaPerda || 'Motivo não informado'}"
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* AI REPORT EXECUTIVE POPUP */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-indigo-400" size={20} />
                <h3 className="text-sm font-bold text-slate-100">
                  Relatório Comercial da Diretoria (IA Gemini)
                </h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded text-xs font-semibold"
              >
                Fechar
              </button>
            </div>

            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-y-auto min-h-[300px]">
              {aiLoading ? (
                <div className="h-full flex items-center justify-center flex-col gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  <span className="text-[10px] text-slate-500">O Gemini está compilando os dados e redigindo as recomendações...</span>
                </div>
              ) : (
                <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed select-all">
                  {aiResult}
                </div>
              )}
            </div>

            {aiResult && (
              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(aiResult);
                    alert('Copiado para a área de transferência!');
                  }}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-all"
                >
                  📋 Copiar Relatório Completo
                </button>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg text-xs"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
