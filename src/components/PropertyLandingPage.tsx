import React, { useState } from 'react';
import { 
  Home, 
  MapPin, 
  Maximize2, 
  Bed, 
  Bath, 
  Car, 
  CheckCircle2, 
  Send,
  MessageSquare,
  Phone,
  Mail,
  User,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PropertyLandingPageProps {
  onEnterCRM: () => void;
}

export default function PropertyLandingPage({ onEnterCRM }: PropertyLandingPageProps) {
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const imovelInfo = {
    id: "123",
    titulo: "Casa Alphaville",
    valor: 3500000,
    localizacao: "Alphaville, Santana de Parnaíba - SP",
    area: "450m²",
    quartos: 4,
    banheiros: 5,
    vagas: 4,
    descricao: "Belíssima residência com arquitetura moderna, acabamento de alto padrão, área gourmet integrada e piscina privativa. Localizada em um dos condomínios mais exclusivos da região.",
    caracteristicas: [
      "Piscina Aquecida",
      "Espaço Gourmet",
      "Automação Residencial",
      "Ar Condicionado",
      "Energia Solar",
      "Segurança 24h"
    ]
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const payload = {
      nome: formData.nome,
      telefone: formData.telefone,
      email: formData.email,
      origem: "Site Imobiliária",
      dados: {
        imovelId: imovelInfo.id,
        titulo: imovelInfo.titulo,
        valor: imovelInfo.valor
      }
    };

    try {
      const response = await fetch('https://sistenext.vercel.app/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Lead enviado com sucesso.' });
        setFormData({ nome: '', telefone: '', email: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao enviar lead.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Falha na conexão com o servidor.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="text-indigo-600" />
            <span className="text-xl font-bold tracking-tight">Imóveis<span className="text-indigo-600">Prime</span></span>
          </div>
          <button 
            onClick={onEnterCRM}
            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest"
          >
            Acesso Restrito
          </button>
        </div>
      </header>

      <main className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Property Info */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Disponível para Venda
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                {imovelInfo.titulo}
              </h1>
              <div className="flex items-center gap-2 text-slate-500">
                <MapPin size={18} />
                <span>{imovelInfo.localizacao}</span>
              </div>
            </div>

            {/* Gallery Placeholder */}
            <div className="aspect-video bg-slate-100 rounded-3xl overflow-hidden relative group">
              <img 
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200" 
                alt="Property" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-6 left-6 flex gap-3">
                <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg">
                  <Maximize2 size={16} className="text-indigo-600" />
                  <span className="text-sm font-bold">{imovelInfo.area}</span>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center gap-1">
                <Bed className="text-indigo-600 mb-1" />
                <span className="text-lg font-bold">{imovelInfo.quartos}</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Suítes</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center gap-1">
                <Bath className="text-indigo-600 mb-1" />
                <span className="text-lg font-bold">{imovelInfo.banheiros}</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Banheiros</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center gap-1">
                <Car className="text-indigo-600 mb-1" />
                <span className="text-lg font-bold">{imovelInfo.vagas}</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Vagas</span>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">Sobre o Imóvel</h2>
              <p className="text-slate-600 leading-relaxed">
                {imovelInfo.descricao}
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">Diferenciais</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {imovelInfo.caracteristicas.map((char, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span>{char}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form Card */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 bg-white border border-slate-200 p-8 rounded-3xl shadow-xl shadow-slate-200/50 space-y-6">
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-500">Valor do Investimento</span>
                <div className="text-3xl font-black text-slate-900">
                  R$ {imovelInfo.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <MessageSquare size={18} className="text-indigo-600" />
                  Tenho Interesse
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Preencha os dados abaixo para receber o catálogo completo e agendar uma visita exclusiva.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: João Silva"
                      value={formData.nome}
                      onChange={e => setFormData({...formData, nome: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Telefone / WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      required
                      type="tel" 
                      placeholder="Ex: 61999999999"
                      value={formData.telefone}
                      onChange={e => setFormData({...formData, telefone: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      required
                      type="email" 
                      placeholder="joao@email.com"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Enviando...' : (
                    <>
                      Enviar Interesse <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <AnimatePresence>
                {message && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`p-4 rounded-xl text-sm font-medium ${
                      message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}
                  >
                    {message.text}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-4 border-t border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Atendimento Exclusivo</p>
                <div className="flex items-center justify-center gap-4 mt-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <User size={20} className="text-slate-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900">Consultor Imobiliário</p>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Online Agora</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-slate-50 border-t border-slate-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-slate-400 text-xs">
          <p>© 2026 Imóveis Prime. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-indigo-600">Privacidade</a>
            <a href="#" className="hover:text-indigo-600">Termos de Uso</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
