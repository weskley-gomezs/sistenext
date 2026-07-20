import React, { useState } from 'react';
import { Sparkles, Send, Copy, Bot, BrainCircuit, UserPlus, FileText, Award } from 'lucide-react';
import { aiService, askGemini } from '../services/aiService';

export default function IaTab() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const PRESETS = [
    {
      title: '📝 Roteiro de Reunião de Fechamento',
      prompt: 'Escreva um roteiro passo-a-passo para guiar uma reunião comercial de fechamento de software sob medida para um cliente do setor de mecânicas automotivas. Inclua gatilhos de urgência e contorno de preço alto.'
    },
    {
      title: '🎯 Pitch de Elevador (30 segundos)',
      prompt: 'Crie 3 variações de pitch comercial de 30 segundos de uma software house especialista em automatizar processos internos para indústrias de pequeno porte.'
    },
    {
      title: '✉️ Sequência de E-mails Frios',
      prompt: 'Escreva uma sequência de 3 e-mails frios curtos e persuasivos para mandar para clínicas odontológicas oferecendo uma ferramenta gratuita de confirmação de consultas.'
    },
    {
      title: '🛡️ Argumentos de ROI',
      prompt: 'Crie uma lista de argumentos matemáticos de ROI (Retorno sobre Investimento) para convencer um empresário tradicional a gastar R$ 50 mil em um sistema sob medida em vez de continuar usando planilhas.'
    }
  ];

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || query;
    if (!promptToSend.trim()) return;

    setLoading(true);
    setResult('');
    if (!customPrompt) {
      setQuery('');
    }

    try {
      // Use direct askGemini for better flexibility in the IA Copilot tab
      const res = await askGemini(promptToSend);
      setResult(res);
    } catch (err: any) {
      setResult('Erro ao conversar com o Gemini: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          🤖 Hub Central de Copilot IA - SisteNext
        </h2>
        <p className="text-xs text-slate-400">
          Utilize o poder da Inteligência Artificial do Google Gemini para elaborar e-mails, analisar objeções, simular negociações comerciais e criar pautas de marketing completas.
        </p>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Presets and options (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BrainCircuit size={14} className="text-indigo-400" /> Modelos Comerciais Prontos
            </h3>

            <div className="space-y-2">
              {PRESETS.map((p) => (
                <button
                  key={p.title}
                  disabled={loading}
                  onClick={() => handleSend(p.prompt)}
                  className="w-full text-left p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-all block"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat / Result console (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col h-[500px] justify-between shadow-lg">
          {/* Output panel */}
          <div className="flex-1 overflow-y-auto bg-slate-950 border border-slate-850 p-4 rounded-lg relative min-h-[300px]">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                <span className="text-[10px] text-slate-500">O Gemini está analisando e escrevendo seu documento...</span>
              </div>
            ) : result ? (
              <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed select-all">
                {result}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 text-center p-6">
                <Bot size={32} className="text-slate-700" />
                <span className="text-xs font-semibold text-slate-500">Assistente de Marketing e Vendas Ativo</span>
                <p className="text-[10px] text-slate-600 max-w-sm">
                  Selecione um dos modelos prontos ao lado ou digite qualquer instrução customizada abaixo (e.g. "Escreva uma proposta técnica para o Dr. Dentista").
                </p>
              </div>
            )}
          </div>

          {/* Action copy row */}
          {result && !loading && (
            <div className="flex justify-end gap-2 my-2 pt-1">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result);
                  alert('Copiado para a área de transferência!');
                }}
                className="px-3 py-1 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded border border-indigo-500/20 text-xs font-bold transition-all flex items-center gap-1"
              >
                <Copy size={12} /> Copiar Texto
              </button>
            </div>
          )}

          {/* Input control */}
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite sua dúvida comercial ou pauta estratégica..."
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-indigo-500 outline-none placeholder-slate-600"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !query.trim()}
              className="px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-lg text-xs font-bold transition-all flex items-center justify-center shadow-md shadow-indigo-600/10"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
