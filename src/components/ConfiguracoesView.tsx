import React, { useState, useEffect } from 'react';
import { Save, User, Shield, KeyRound, Download, RefreshCw, Upload, Sparkles, Bell, BellRing, CreditCard, Check, ExternalLink, Copy, QrCode, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { formatCNPJ, formatPhone } from '../utils/masks';
import { NotificationService } from '../utils/notificationService';
import { setAppConfig, getAppConfig } from '../dbService';
import { MembroEquipe } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { getLocalDateString } from '../utils/dateUtils';

interface ConfiguracoesViewProps {
  currentTheme: 'light' | 'dark';
  onToggleTheme: () => void;
  ownerId: string;
  membros: MembroEquipe[];
  // Let's pass the database structure to enable JSON backup download!
  dbData: {
    leads: any[];
    clientes: any[];
    empresas: any[];
    projetos: any[];
    propostas: any[];
    contratos: any[];
    financeiro: any[];
    agenda: any[];
    anotacoes: any[];
    documentos: any[];
  };
}

export default function ConfiguracoesView({
  currentTheme,
  onToggleTheme,
  ownerId,
  dbData,
  membros
}: ConfiguracoesViewProps) {
  const [formData, setFormData] = useState({
    companyName: '',
    tradingName: '',
    cnpj: '',
    supportEmail: '',
    phone: '',
    address: '',
    logoUrl: '',
    logoBase64: '',
    generalGoal: 0,
    phoneGoal: 0,
    commissionRate: 0
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(
    NotificationService.permission
  );

  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [subName, setSubName] = useState('');
  const [subEmail, setSubEmail] = useState('');
  const [subPhone, setSubPhone] = useState('');
  const [subCnpjCpf, setSubCnpjCpf] = useState('');
  const [subPaymentMethod, setSubPaymentMethod] = useState<'Pix' | 'Boleto' | 'Crédito'>('Crédito');
  const [subscribing, setSubscribing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [syncingSub, setSyncingSub] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [asaasStatus, setAsaasStatus] = useState<{ configured: boolean; environment: string } | null>(null);

  // No expiration or timer is needed anymore. We keep the subscription pending until it's synced (paid) or cancelled.

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  useEffect(() => {
    if (formData.companyName) setSubName(formData.companyName);
    if (formData.supportEmail) setSubEmail(formData.supportEmail);
    if (formData.phone) setSubPhone(formData.phone);
    if (formData.cnpj) setSubCnpjCpf(formData.cnpj);
  }, [formData]);

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerId) return;
    setSubscribing(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/asaas/assinar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          clientName: subName,
          email: subEmail,
          phone: subPhone,
          cnpjCpf: subCnpjCpf,
          paymentMethod: subPaymentMethod
        })
      });

      const responseText = await response.text();
      let resData: any;
      
      try {
        resData = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('Erro ao parsear resposta do servidor:', responseText);
        throw new Error(`Resposta do servidor não é um JSON válido. Status: ${response.status}. Corpo: ${responseText.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(resData.error || resData.message || 'Erro na integração com Asaas');
      }

      if (resData.success && resData.activeSubscription) {
        setActiveSubscription(resData.activeSubscription);
        NotificationService.send('Assinatura Gerada', { body: 'Assinatura criada com sucesso! Efetue o pagamento para ativar.' });
      }
    } catch (err: any) {
      console.error(err);
      NotificationService.send('Erro na Assinatura', { body: err.message });
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!activeSubscription || !ownerId) return;
    
    setCancelling(true);
    try {
      if (activeSubscription.subscriptionId) {
        // Try to cancel via API (if available/configured)
        try {
          const token = await auth.currentUser?.getIdToken();
          const response = await fetch('/api/asaas/cancelar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              subscriptionId: activeSubscription.subscriptionId
            })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.warn('[Asaas API] Falha ao cancelar no Asaas:', errData);
          }
        } catch (apiErr) {
          console.warn('[Asaas API] Erro ao chamar rota de cancelamento:', apiErr);
        }
      }

      // ALWAYS clear the subscription in the shared Firestore database so the user is never stuck!
      await setDoc(doc(db, 'configuracoes', ownerId), { activeSubscription: null }, { merge: true });
      setActiveSubscription(null);
      NotificationService.send('Assinatura Cancelada', { body: 'Sua cobrança foi removida com sucesso.' });
    } catch (err: any) {
      console.error(err);
      NotificationService.send('Erro no Cancelamento', { body: err.message });
    } finally {
      setCancelling(false);
    }
  };

  const handleSyncSubscriptionStatus = async () => {
    if (!activeSubscription || !activeSubscription.paymentId || !ownerId) {
      console.warn('[Config] Sincronização abortada: sem ID de pagamento', { activeSubscription });
      return;
    }
    setSyncingSub(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/asaas/status/${activeSubscription.paymentId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Falha ao sincronizar status');
      }

      const resData = await response.json();
      if (resData.success) {
        setActiveSubscription(prev => {
          if (!prev) return null;
          const updated = { ...prev, status: resData.status };
          if (resData.paymentDate) {
            updated.paymentDate = resData.paymentDate;
          }
          return updated;
        });
        NotificationService.send('Status Sincronizado', { body: `Novo status: ${resData.status}` });
      }
    } catch (err: any) {
      console.error(err);
      NotificationService.send('Erro na Sincronização', { body: err.message });
    } finally {
      setSyncingSub(false);
    }
  };

  const handleRequestNotificationPermission = async () => {
    const permission = await NotificationService.requestPermission();
    setNotificationStatus(permission);
    if (permission === 'granted') {
      NotificationService.send('Notificações Ativadas', {
        body: 'Você receberá alertas de compromissos a partir de agora.',
      });
    }
  };

  const handleTestNotification = () => {
    NotificationService.send('Teste de Notificação', {
      body: 'Este é um alerta de teste do sistema SisteNext.',
    });
  };

  useEffect(() => {
    async function loadConfig() {
      if (!ownerId) return;
      try {
        const data = await getAppConfig(ownerId);
        if (data) {
          const configObj = {
            companyName: data.companyName || '',
            tradingName: data.tradingName || '',
            cnpj: formatCNPJ(data.cnpj || ''),
            supportEmail: data.supportEmail || '',
            phone: formatPhone(data.phone || ''),
            address: data.address || '',
            logoUrl: data.logoUrl || '',
            logoBase64: data.logoBase64 || '',
            generalGoal: Number(data.generalGoal || 0),
            phoneGoal: Number(data.phoneGoal || 0),
            commissionRate: Number(data.commissionRate || 0)
          };
          setFormData(configObj);
          if (data.activeSubscription) {
            setActiveSubscription(data.activeSubscription);
          } else {
            setActiveSubscription(null);
          }
        }
        
        // Fetch Asaas config status from our custom route
        const token = await auth.currentUser?.getIdToken();
        const asaasRes = await fetch('/api/asaas/config-status', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (asaasRes.ok) {
          const asaasData = await asaasRes.json();
          setAsaasStatus(asaasData);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [ownerId]);





  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Firestore has a 1MB limit per document. Base64 adds ~33% overhead.
      // 800KB is a safe limit to stay under 1MB total document size.
      if (file.size > 800 * 1024) {
        NotificationService.send('Arquivo Muito Grande', { body: 'A logo deve ter no máximo 800KB para persistência.' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoBase64: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerId) return;
    setSaving(true);
    try {
      await setAppConfig(ownerId, formData);
      NotificationService.send('Configurações Salvas', { body: 'Suas alterações foram aplicadas com sucesso.' });
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      if (error.code === 'permission-denied') {
        NotificationService.send('Acesso Negado', { body: 'Permissão negada ao salvar no banco de dados.' });
      } else if (formData.logoBase64 && formData.logoBase64.length > 1000000) {
        NotificationService.send('Imagem Grande', { body: 'A logo é muito grande. Tente uma imagem menor.' });
      } else {
        NotificationService.send('Erro ao Salvar', { body: 'Ocorreu um erro. Tente novamente.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    const dataStr = JSON.stringify(dbData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `sistenext_backup_${getLocalDateString()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto font-sans text-xs">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Configurações do Sistema
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Gerencie o cadastro institucional, configurações de visualização de marca, segurança de acesso e backup dos seus dados comerciais.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Institucional Settings Form (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
            Dados Institucionais da Empresa (Emitente)
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Razão Social</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nome Fantasia</label>
                <input
                  type="text"
                  value={formData.tradingName}
                  onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">CNPJ</label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-mono"
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Telefone Comercial</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">E-mail Comercial de Contato</label>
              <input
                type="email"
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Endereço Físico</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Identidade Visual (Logo da Empresa)</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
                  {formData.logoBase64 ? (
                    <img src={formData.logoBase64} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <Upload size={24} className="text-slate-300" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-[10px] text-slate-500 font-medium">Faça upload de uma imagem PNG ou JPG. Tamanho recomendado: 500x500px.</p>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer py-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-black uppercase hover:bg-slate-50 transition-all flex items-center gap-2">
                      <Upload size={12} /> Selecionar Arquivo
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </label>
                    {formData.logoBase64 && (
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, logoBase64: '' })}
                        className="py-1.5 px-3 text-red-500 text-[10px] font-black uppercase hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Meta de Vendas Geral (R$)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.generalGoal || ''}
                  onChange={(e) => setFormData({ ...formData, generalGoal: Number(e.target.value) })}
                  placeholder="Ex: 50000"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-mono font-bold text-indigo-600 dark:text-indigo-400"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Meta de Contatos (Telefone)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.phoneGoal || ''}
                  onChange={(e) => setFormData({ ...formData, phoneGoal: Number(e.target.value) })}
                  placeholder="Ex: 100"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-mono font-bold text-emerald-600 dark:text-emerald-400"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Comissão Padrão (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.commissionRate || ''}
                  onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                  placeholder="Ex: 10"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-mono font-bold text-amber-600 dark:text-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">URL da Logo (Alternativa ou Remota)</label>
              <input
                type="text"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://sua-logo.com/logo.png"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="py-2 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white font-bold rounded-lg transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Save size={13} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>

        {/* Administration/Backup (1 col) */}
        <div className="space-y-6">

          {/* Notificações do Navegador */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm space-y-3.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Bell size={14} className="text-indigo-500" /> Notificações do Sistema
            </h3>
            <p className="text-xs text-slate-400">Gerencie a permissão do seu navegador para receber alertas visuais de compromissos.</p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleRequestNotificationPermission}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {notificationStatus === 'granted' ? (
                  <span className="flex items-center gap-2">
                    <BellRing size={13} className="text-green-500" /> Permissão Concedida
                  </span>
                ) : (
                  'Solicitar Permissão'
                )}
              </button>
              
              {notificationStatus === 'granted' && (
                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Enviar Notificação de Teste
                </button>
              )}
            </div>
            
            {notificationStatus === 'denied' && (
              <p className="text-[10px] text-red-500 font-bold italic">
                As notificações estão bloqueadas no seu navegador. Você precisará reativá-las nas configurações do site (ícone de cadeado na barra de endereços).
              </p>
            )}
          </div>

          {/* Backup Database */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm space-y-3.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Segurança & Backup de Dados
            </h3>
            <p className="text-xs text-slate-400">Baixe todo o conteúdo das tabelas e coleções locais em um único arquivo de backup seguro.</p>

            <button
              onClick={handleDownloadBackup}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all shadow-md shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-2"
            >
              <Download size={13} /> Exportar Backup (JSON)
            </button>
          </div>

          {/* Admin Team Members list */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm space-y-3.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Equipe do Sistema
            </h3>
            <div className="space-y-3">
              {membros.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">Nenhum membro cadastrado.</p>
              ) : (
                membros.slice(0, 5).map((membro) => (
                  <div key={membro.id} className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-950 dark:text-white block">{membro.name}</span>
                      <span className="text-[10px] text-slate-400">{membro.email}</span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                      membro.role === 'Administrador' 
                        ? 'bg-indigo-500/10 text-indigo-500' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                      {membro.role}
                    </span>
                  </div>
                ))
              )}
              {membros.length > 5 && (
                <p className="text-[9px] text-indigo-500 font-bold text-center pt-2">
                  + {membros.length - 5} outros membros
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={showCancelConfirm}
        title="Cancelar Assinatura"
        message="Tem certeza de que deseja cancelar sua assinatura mensal de R$ 29,90? O acesso a alguns recursos poderá ser suspenso."
        confirmText="Sim, Cancelar"
        requireJustification={false}
        onConfirm={async () => {
          setShowCancelConfirm(false);
          await handleCancelSubscription();
        }}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </div>
  );
}
