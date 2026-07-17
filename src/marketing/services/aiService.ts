import { auth } from '../../firebase';

export async function askGemini(prompt: string, systemInstruction?: string): Promise<string> {
  try {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch('/api/chat-gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        prompt,
        systemInstruction: systemInstruction || "Você é um Arquiteto de Software Sênior, UX/UI Designer e Especialista em Marketing Digital e Comercial para Software Houses."
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || "Erro ao consultar a Inteligência Artificial.");
    }

    const data = await response.json();
    return data.text || "Sem resposta.";
  } catch (error: any) {
    console.error("AI Service Error:", error);
    throw error;
  }
}

export const aiService = {
  // 1. Mensagens de prospecção
  generateOutreachMessage: async (empresa: string, segmento: string, nichoDores: string, canal: string) => {
    const prompt = `Gere uma mensagem de prospecção comercial altamente persuasiva, amigável e profissional para a empresa "${empresa}", que atua no segmento de "${segmento}".
Dores do nicho: ${nichoDores || 'Sistemas lentos, falta de processos digitais automatizados, controle de vendas ineficiente.'}
Canal de envio: ${canal} (Ex: WhatsApp, Instagram Direct, Email, LinkedIn).

A mensagem deve ser personalizada para o canal, curta, com um tom de ajuda (consultivo, e não panfletagem de venda) e incluir uma chamada para ação (CTA) sutil para agendar uma conversa rápida de 15 minutos.`;
    return askGemini(prompt);
  },

  // 2. Scripts para reuniões
  generateMeetingScript: async (empresa: string, problemas: string, necessidades: string) => {
    const prompt = `Crie um roteiro/script completo para conduzir uma reunião comercial de diagnóstico com a empresa "${empresa}".
Problemas identificados: ${problemas || 'Processos manuais, perda de dados, falta de controle financeiro.'}
Necessidades da empresa: ${necessidades || 'Automatizar vendas, centralizar informações, relatórios em tempo real.'}

O script deve conter:
1. Quebra-gelo (Rapport)
2. Perguntas de Implicação (S.P.I.N. Selling) para aprofundar a dor
3. Apresentação da solução personalizada
4. Lidando com objeções de preço e prazo
5. Próximo passo e fechamento da reunião.`;
    return askGemini(prompt);
  },

  // 3. Gerar propostas comerciais
  generateProposal: async (empresa: string, solucao: string, modulos: string, valorEstimado: number) => {
    const prompt = `Gere uma proposta comercial estruturada e altamente profissional para a empresa "${empresa}".
Solução personalizada proposta: ${solucao}
Módulos sugeridos: ${modulos}
Valor estimado: R$ ${valorEstimado ? valorEstimado.toLocaleString('pt-BR') : 'A calcular'}

A proposta deve conter:
- Escopo macro do projeto
- Tecnologias e benefícios principais
- Cronograma estimado de entregas
- Investimento detalhado e condições de pagamento sugeridas
- Termos de garantia e suporte da software house.`;
    return askGemini(prompt);
  },

  // 4. Criar conteúdos para Instagram
  generateInstagramContent: async (nicho: string, tema: string) => {
    const prompt = `Gere uma ideia completa de post/carrossel para o Instagram direcionado para o nicho de "${nicho}".
Tema sugerido: ${tema || 'Como a automatização de processos aumenta o lucro'}

Forneça:
1. Título chamativo (Gancho)
2. Conteúdo detalhado para cada slide (Slide 1 a 5)
3. Legenda cativante com CTA (Call to Action)
4. Hashtags estratégicas para o nicho de tecnologia/SaaS.`;
    return askGemini(prompt);
  },

  // 5. Roteiros para vídeos (Reels/Shorts/TikTok)
  generateVideoScript: async (titulo: string, objetivo: string) => {
    const prompt = `Crie um roteiro detalhado de vídeo rápido (Reels/TikTok/Shorts, até 60 segundos) sobre o tema "${titulo}".
Objetivo do conteúdo: ${objetivo}

O roteiro deve incluir:
- Gancho inicial nos primeiros 3 segundos (O que falar e o que mostrar na tela)
- Desenvolvimento do conteúdo (Dividido em falas e sugestões de elementos visuais)
- Chamada de Ação (CTA) final forte.`;
    return askGemini(prompt);
  },

  // 6. Analisar gargalos das empresas
  analyzeBottlenecks: async (processosManuais: string, tempoPerdido: string, sistemasAtuais: string) => {
    const prompt = `Analise os seguintes gargalos operacionais relatados por uma empresa de tecnologia/comercial:
Processos manuais relatados: ${processosManuais}
Tempo estimado perdido: ${tempoPerdido}
Sistemas em uso atualmente: ${sistemasAtuais || 'Nenhum / Planilhas de Excel'}

Gere um diagnóstico de engenharia e negócios:
1. Impacto financeiro e de produtividade estimado destes gargalos no ano
2. Principais pontos críticos de falha humana e segurança de dados
3. Solução recomendada com arquitetura modular.`;
    return askGemini(prompt);
  },

  // 7. Sugerir sistemas personalizados
  suggestCustomSystems: async (segmento: string, dores: string) => {
    const prompt = `Sugira um sistema personalizado ideal (SaaS / Web App) para o nicho/segmento de "${segmento}".
Dores e rotinas identificadas: ${dores}

O retorno deve descrever:
1. Nome sugerido para o produto/sistema
2. Lista detalhada de módulos obrigatórios (com funcionalidades chave de cada um)
3. Diferenciais competitivos e tecnologias de ponta sugeridas (ex: recursos de IA integrados, automações de alertas).`;
    return askGemini(prompt);
  },

  // 8. Estimar valor de projetos
  estimateProjectValue: async (modulos: string, complexidade: string) => {
    const prompt = `Forneça uma estimativa de preço de desenvolvimento para um software sob medida.
Módulos a desenvolver: ${modulos}
Nível de complexidade estimado: ${complexidade} (Alta, Média ou Baixa)

Gere uma estimativa detalhada contendo:
1. Horas estimadas de desenvolvimento por perfil (UX Designer, Dev Frontend, Dev Backend, QA)
2. Custo operacional interno estimado da software house
3. Preço sugerido de venda para o cliente final (Margem de lucro recomendada)
4. Sugestão de recorrência (mensalidade de suporte/cloud).`;
    return askGemini(prompt);
  },

  // 9. Gerar follow-ups automáticos
  generateFollowUp: async (empresa: string, ultimoContato: string, statusAtual: string) => {
    const prompt = `Gere uma mensagem sutil e inteligente de Follow-up (acompanhamento) para a empresa "${empresa}".
Último contato realizado: ${ultimoContato}
Status da negociação: ${statusAtual}

A mensagem deve ser educada, amigável, livre de pressão agressiva, reaquecer a conversa de forma inteligente (agregando algum valor ou curiosidade rápida) e instigar o retorno do cliente potencial.`;
    return askGemini(prompt);
  },

  // 10. Criar argumentos comerciais (lidar com objeções)
  generateObjectionHandlers: async (objecao: string, solucaoOferecida: string) => {
    const prompt = `Crie uma lista de argumentos comerciais imbatíveis para lidar com a seguinte objeção de venda de software sob medida:
Objeção relatada: "${objecao}" (Ex: 'Está muito caro', 'Já temos planilhas', 'Não tenho tempo para implantar agora')
Solução que estamos oferecendo: ${solucaoOferecida}

Gere:
1. 3 abordagens de contorno de objeção baseadas em gatilhos mentais (Reciprocidade, Prova Social, Escassez/Urgência)
2. Exemplos práticos de frases de contorno de objeção prontas para o vendedor utilizar.`;
    return askGemini(prompt);
  },

  // 11. Sugerir nichos promissores
  suggestPromisingNiches: async (regiao: string, especialidadeTecnica: string) => {
    const prompt = `Com base nas tendências atuais de mercado e transformação digital, sugira 3 nichos extremamente promissores para prospecção de software sob medida.
Região/Foco: ${regiao || 'Geral (Nacional)'}
Especialidade técnica da software house: ${especialidadeTecnica || 'Sistemas web personalizados, integrações de APIs e aplicativos móveis'}

Para cada nicho sugerido, forneça:
1. Motivo do alto potencial (Dores crescentes no nicho)
2. O que eles precisam com máxima urgência (O produto ideal)
3. Ticket médio sugerido de implantação e recorrência.`;
    return askGemini(prompt);
  }
};
