import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { Cpu, Mail, Lock, ShieldCheck, UserPlus, LogIn, Key, Sparkles, ArrowRight, Building, Fingerprint, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
const nexusErpLogo = 'https://i.imgur.com/BewcRiJ.png';

interface LoginViewProps {
  onLoginSuccess: (user: any) => void;
  onBackToLanding?: () => void;
}

export default function LoginView({ onLoginSuccess, onBackToLanding }: LoginViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (isForgotPassword) {
      if (!email) {
        setError('Por favor, informe seu e-mail.');
        setLoading(false);
        return;
      }
      try {
        await sendPasswordResetEmail(auth, email);
        setMessage('E-mail de recuperação de senha enviado com sucesso!');
      } catch (err: any) {
        console.error(err);
        setError(translateFirebaseError(err.code) || 'Erro ao enviar e-mail de recuperação.');
      }
      setLoading(false);
      return;
    }

    if (isSignUp) {
      if (!companyName.trim()) {
        setError('Por favor, informe o nome da sua empresa.');
        setLoading(false);
        return;
      }
      if (!taxId.trim()) {
        setError('Por favor, informe seu CPF ou CNPJ.');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        setLoading(false);
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Store extra info in Firestore
        await setDoc(doc(db, 'user_profiles', userCredential.user.uid), {
          email: email.trim().toLowerCase(),
          companyName: companyName.trim(),
          taxId: taxId.trim(),
          role: 'Administrador',
          ownerId: userCredential.user.uid, // Admin is their own owner
          createdAt: new Date().toISOString()
        });

        onLoginSuccess({
          ...userCredential.user,
          role: 'Administrador',
          ownerId: userCredential.user.uid,
          companyName: companyName.trim(),
          taxId: taxId.trim()
        });
      } catch (err: any) {
        console.error(err);
        setError(translateFirebaseError(err.code) || 'Erro ao criar conta.');
      }
    } else {
      try {
        // 1. Check if there is a team member with this email and password in Firestore
        const teamRef = collection(db, 'equipe');
        const q = query(
          teamRef,
          where('email', '==', email.trim().toLowerCase()),
          where('password', '==', password)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const membroData = docSnap.data();

          if (membroData.status === 'Inativo') {
            setError('Esta conta de vendedor está inativa. Entre em contato com o administrador.');
            setLoading(false);
            return;
          }

          // Successful Team Login!
          onLoginSuccess({
            email: membroData.email,
            uid: membroData.id,
            displayName: membroData.name,
            role: membroData.role,
            isMembro: true
          });
          setLoading(false);
          return;
        }

        // 2. Fall back to standard Firebase Authentication
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onLoginSuccess(userCredential.user);
      } catch (err: any) {
        console.error(err);
        setError(translateFirebaseError(err.code) || 'Credenciais inválidas ou e-mail/senha incorretos.');
      }
    }
    setLoading(false);
  };

  const handleDemoLogin = () => {
    // Quick Demo Mode for immediate testing
    onLoginSuccess({
      email: 'demo@sistenext.com.br',
      uid: 'demo-user-id',
      displayName: 'Arquiteto de Software Sênior',
      isDemo: true
    });
  };

  const translateFirebaseError = (code: string) => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Endereço de e-mail inválido.';
      case 'auth/user-disabled':
        return 'Este usuário foi desabilitado.';
      case 'auth/user-not-found':
        return 'Nenhum usuário encontrado com este e-mail.';
      case 'auth/wrong-password':
        return 'Senha incorreta.';
      case 'auth/email-already-in-use':
        return 'O e-mail informado já está em uso.';
      case 'auth/weak-password':
        return 'A senha deve possuir no mínimo 6 caracteres.';
      case 'auth/invalid-credential':
        return 'E-mail ou senha incorretos.';
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Absolute back arrow */}
      {onBackToLanding && (
        <button
          onClick={onBackToLanding}
          className="absolute top-6 left-6 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
        >
          <ChevronLeft size={16} /> Voltar ao Início
        </button>
      )}

      {/* Premium Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800/80 p-8 rounded-2xl shadow-2xl backdrop-blur-xl relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-indigo-500/10 mb-3 border border-slate-700">
            <img src={nexusErpLogo} alt="Logo" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
            Siste<span className="text-indigo-400">Next</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            CRM Completo para sua empresa
          </p>
        </div>

        {/* Title Context */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-white">
            {isForgotPassword
              ? 'Recuperar Senha'
              : isSignUp
              ? 'Criar Conta Premium'
              : 'Bem-vindo de volta'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isForgotPassword
              ? 'Insira seu e-mail para receber as instruções'
              : isSignUp
              ? 'Comece a escalar suas vendas com IA integrada'
              : 'Faça login para gerenciar sua operação SaaS'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg text-center font-medium">
            {message}
          </div>
        )}

        <form onSubmit={handleAuthAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              E-mail Corporativo
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.nome@empresa.com"
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 text-white rounded-lg py-2 pl-10 pr-4 text-sm transition-all outline-none"
              />
            </div>
          </div>

          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nome da Empresa
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Building size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Sua Agência / Empresa"
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 text-white rounded-lg py-2 pl-10 pr-4 text-sm transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  CNPJ ou CPF
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Fingerprint size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 text-white rounded-lg py-2 pl-10 pr-4 text-sm transition-all outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {!isForgotPassword && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Senha
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError('');
                      setMessage('');
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                  >
                    Esqueceu?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 text-white rounded-lg py-2 pl-10 pr-4 text-sm transition-all outline-none"
                />
              </div>
            </div>
          )}

          {isSignUp && !isForgotPassword && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirmar Senha
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <ShieldCheck size={16} />
                </span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="******"
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 text-white rounded-lg py-2 pl-10 pr-4 text-sm transition-all outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-sm transition-all shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : isForgotPassword ? (
              <>
                <Key size={16} /> Enviar E-mail
              </>
            ) : isSignUp ? (
              <>
                <UserPlus size={16} /> Criar Conta Premium
              </>
            ) : (
              <>
                <LogIn size={16} /> Acessar Sistema
              </>
            )}
          </button>
        </form>

        {/* Footer Switches */}
        <div className="mt-6 flex flex-col items-center gap-3">
          {isForgotPassword ? (
            <button
              onClick={() => {
                setIsForgotPassword(false);
                setError('');
                setMessage('');
              }}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Voltar para o Login
            </button>
          ) : (
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setMessage('');
              }}
              className="text-xs text-slate-400 hover:text-white transition-colors font-medium"
            >
              {isSignUp ? 'Já tem uma conta? Entre agora' : 'Não tem conta? Cadastre-se'}
            </button>
          )}

          {/* Quick Demo Access Divider */}
          <div className="w-full flex items-center gap-2 my-1">
            <div className="h-px bg-slate-800 flex-1"></div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Test Drive Instantâneo</span>
            <div className="h-px bg-slate-800 flex-1"></div>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2 px-4 bg-slate-950 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 text-indigo-400 font-medium rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <Sparkles size={14} className="text-indigo-400 group-hover:animate-pulse" />
            Entrar como Convidado (Sem Registro)
            <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
