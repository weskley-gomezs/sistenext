import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, onSnapshot, query, where, collection, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import {
  subscribeToCollection,
  addItem,
  updateItem,
  deleteItem,
  deleteItemWithJustification,
  setActiveUserEmail
} from './dbService';
import {
  Lead,
  Empresa,
  Cliente,
  Projeto,
  Proposta,
  Contrato,
  Financeiro,
  EventAgenda,
  Anotacao,
  Documento,
  FollowUp,
  MembroEquipe,
  Log,
  ClienteAssinatura
} from './types';

// Components
import Sidebar, { ActiveSection } from './components/Sidebar';
import { NotificationManager } from './components/NotificationManager';
import LoginView from './components/LoginView';
import PropertyLandingPage from './components/PropertyLandingPage';
import DashboardView from './components/DashboardView';
import LeadsView from './components/LeadsView';
import EmpresasView from './components/EmpresasView';
import ClientesView from './components/ClientesView';
import ProjetosView from './components/ProjetosView';
import ContratosView from './components/ContratosView';
import PropostasView from './components/PropostasView';
import FinanceiroView from './components/FinanceiroView';
import AgendaView from './components/AgendaView';
import RelatoriosView from './components/RelatoriosView';
import AnotacoesView from './components/AnotacoesView';
import DocumentosView from './components/DocumentosView';
import ConfiguracoesView from './components/ConfiguracoesView';
import EquipeView from './components/EquipeView';

// Simple Chronological Timeline of all Follow-ups across the system
import { History, CalendarClock, User } from 'lucide-react';
import { motion } from 'motion/react';

function FollowUpsTimeline({ followUps, leads }: { followUps: FollowUp[]; leads: Lead[] }) {
  const getLeadName = (id: string) => {
    return leads.find((l) => l.id === id)?.name || 'Lead desconhecido';
  };

  const getLeadCompany = (id: string) => {
    return leads.find((l) => l.id === id)?.company || 'Empresa desconhecida';
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto font-sans text-xs">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Histórico Global de Follow-ups
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Linha do tempo consolidada contendo todas as interações comerciais realizadas pelos consultores.
        </p>
      </div>

      <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-6 py-2">
        {followUps.length === 0 ? (
          <p className="text-slate-400 text-center py-6">Nenhum follow-up cadastrado ainda.</p>
        ) : (
          followUps
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((item) => (
              <div key={item.id} className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 bg-indigo-500 rounded-full border-4 border-white dark:border-slate-950 group-hover:scale-125 transition-transform shrink-0" />

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded font-extrabold uppercase">
                        {item.type}
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {getLeadName(item.leadId)}
                      </span>
                      <span className="text-slate-400">({getLeadCompany(item.leadId)})</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.date.split('-').reverse().join('/')} às {item.time}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                    {item.description}
                  </p>

                  {(item.nextAction || item.nextActionDate) && (
                    <div className="bg-slate-50 dark:bg-slate-950/60 p-2 rounded border border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-[10px] text-slate-500">
                      <CalendarClock size={12} className="text-indigo-500 shrink-0" />
                      <span>
                        Próxima Ação: <strong className="text-slate-700 dark:text-slate-300">{item.nextAction || 'Não especificada'}</strong> 
                        {item.nextActionDate && ` (Previsão: ${item.nextActionDate.split('-').reverse().join('/')})`}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-end text-[9px] text-slate-400 font-medium">
                    Registrado por: {item.user}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [showLogin, setShowLogin] = useState(false);

  // CRM Global Realtime States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [financeiro, setFinanceiro] = useState<Financeiro[]>([]);
  const [agenda, setAgenda] = useState<EventAgenda[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [membros, setMembros] = useState<MembroEquipe[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [assinaturasClientes, setAssinaturasClientes] = useState<ClienteAssinatura[]>([]);

  const currentUserEmail = user?.email?.toLowerCase() || '';
  const currentMember = membros.find(m => m.email?.toLowerCase() === currentUserEmail);
  const userRole = user?.role || currentMember?.role;
  const isVendedor = userRole === 'Vendedor';
  const isAdmin = !isVendedor; // Anyone who is not a Vendedor has total Admin control and sees everything

  // Filtration logic: each salesperson has their own sections/records, only the admin can see everything
  const filteredLeads = isAdmin 
    ? leads 
    : leads.filter(l => 
        l.createdBy?.toLowerCase() === currentUserEmail ||
        l.representative?.toLowerCase() === currentUserEmail ||
        (currentMember?.name && l.representative?.toLowerCase() === currentMember.name.toLowerCase())
      );

  const myLeadIds = new Set(filteredLeads.map(l => l.id));

  const filteredClientes = isAdmin
    ? clientes
    : clientes.filter(c => 
        c.createdBy?.toLowerCase() === currentUserEmail ||
        (c.leadId && myLeadIds.has(c.leadId))
      );

  const myClientIds = new Set(filteredClientes.map(c => c.id));
  const myClientNames = new Set(filteredClientes.map(c => c.name?.toLowerCase()));
  const myClientCompanyNames = new Set(filteredClientes.map(c => c.companyName?.toLowerCase()));

  const filteredPropostas = isAdmin
    ? propostas
    : propostas.filter(p => 
        p.createdBy?.toLowerCase() === currentUserEmail ||
        (p.clientId && (myClientIds.has(p.clientId) || myLeadIds.has(p.clientId)))
      );

  const filteredContratos = isAdmin
    ? contratos
    : contratos.filter(c => 
        c.createdBy?.toLowerCase() === currentUserEmail ||
        (c.clientId && myClientIds.has(c.clientId))
      );

  const filteredProjetos = isAdmin
    ? projetos
    : projetos.filter(p => 
        p.createdBy?.toLowerCase() === currentUserEmail ||
        (p.clientId && myClientIds.has(p.clientId)) ||
        p.owner?.toLowerCase() === currentUserEmail ||
        (currentMember?.name && p.owner?.toLowerCase() === currentMember.name.toLowerCase())
      );

  const myProjectIds = new Set(filteredProjetos.map(p => p.id));

  const filteredFinanceiro = isAdmin
    ? financeiro
    : financeiro.filter(f => 
        f.createdBy?.toLowerCase() === currentUserEmail ||
        (f.clientName && (myClientNames.has(f.clientName.toLowerCase()) || myClientCompanyNames.has(f.clientName.toLowerCase())))
      );

  const filteredAgenda = isAdmin
    ? agenda
    : agenda.filter(a => 
        a.createdBy?.toLowerCase() === currentUserEmail ||
        (a.linkedId && (myClientIds.has(a.linkedId) || myLeadIds.has(a.linkedId) || myProjectIds.has(a.linkedId)))
      );

  const filteredFollowUps = isAdmin
    ? followUps
    : followUps.filter(f => 
        f.createdBy?.toLowerCase() === currentUserEmail ||
        f.user?.toLowerCase() === currentUserEmail ||
        (currentMember?.name && f.user?.toLowerCase() === currentMember.name.toLowerCase()) ||
        (f.leadId && myLeadIds.has(f.leadId))
      );

  const filteredAnotacoes = isAdmin
    ? anotacoes
    : anotacoes.filter(a => 
        a.createdBy?.toLowerCase() === currentUserEmail ||
        a.user?.toLowerCase() === currentUserEmail ||
        (currentMember?.name && a.user?.toLowerCase() === currentMember.name.toLowerCase()) ||
        (a.entityId && (myClientIds.has(a.entityId) || myLeadIds.has(a.entityId) || myProjectIds.has(a.entityId)))
      );

  const filteredDocumentos = isAdmin
    ? documentos
    : documentos.filter(d => 
        d.createdBy?.toLowerCase() === currentUserEmail ||
        (d.entityId && (myClientIds.has(d.entityId) || myLeadIds.has(d.entityId) || d.entityId && myProjectIds.has(d.entityId)))
      );

  const filteredMembros = React.useMemo(() => {
    if (!user) return [];

    // 1. Get members from the database that belong to this owner
    let list = membros.filter(m => m.ownerId === user.ownerId);
    
    // 2. Identify if the current user (owner) already has a record in the list
    // We check both by email and by ID to be thorough
    const ownerRecordInList = list.find(m => 
      m.email?.toLowerCase() === user.email?.toLowerCase() || 
      m.id === 'owner-' + user.uid ||
      (user.ownerId === user.uid && m.role === 'Administrador')
    );

    // 3. Create/Update the "Owner" representation
    const ownerMember: MembroEquipe = {
      id: 'owner-' + user.uid,
      ownerId: user.ownerId,
      name: user.name || 'Administrador',
      email: user.email || '',
      role: 'Administrador',
      status: 'Ativo',
      createdAt: user.metadata?.creationTime || new Date().toISOString(),
      phone: user.phone || ''
    };

    if (user.ownerId === user.uid) {
      // If the current user is the root Admin/Owner
      if (ownerRecordInList) {
        // If there's an existing record that looks like the owner, we "merge" it 
        // ensuring the email and name come from the actual Auth/Profile state
        const otherMembers = list.filter(m => m.id !== ownerRecordInList.id);
        return [ownerMember, ...otherMembers];
      } else {
        return [ownerMember, ...list];
      }
    }
    
    return list;
  }, [membros, user]);

  useEffect(() => {
    const restrictedSections = [
      'configuracoes',
      'equipe',
      'relatorios',
      'anotacoes',
      'financeiro',
      'empresas'
    ];
    if (isVendedor && restrictedSections.includes(activeSection)) {
      setActiveSection('dashboard');
    }
  }, [isVendedor, activeSection]);

  // Sync the active user email with dbService
  useEffect(() => {
    setActiveUserEmail(user?.email || null);
  }, [user]);

  // Toggle theme visually
  const handleToggleTheme = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auth Status check
  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Subscribe to user profile
        const profileRef = doc(db, 'user_profiles', firebaseUser.uid);
        profileUnsub = onSnapshot(profileRef, async (snap) => {
          if (snap.exists()) {
            const profileData = snap.data();
            setUser({
              ...firebaseUser,
              role: profileData.role || 'Administrador',
              ownerId: profileData.ownerId || firebaseUser.uid,
              name: profileData.name || firebaseUser.displayName || 'Usuário',
              phone: profileData.phone,
              taxId: profileData.taxId,
              companyName: profileData.companyName
            });
          } else {
            // If profile doesn't exist, check if user was invited as a team member
            try {
              const q = query(collection(db, 'equipe'), where('email', '==', firebaseUser.email));
              const querySnap = await getDocs(q);
              
              if (!querySnap.empty) {
                const memberData = querySnap.docs[0].data();
                const ownerId = memberData.ownerId;
                
                // Automatically create a profile for the recognized member
                const newProfile = {
                  email: firebaseUser.email,
                  name: memberData.name || firebaseUser.displayName || 'Membro',
                  role: memberData.role || 'Vendedor',
                  ownerId: ownerId,
                  phone: memberData.phone || '',
                  createdAt: new Date().toISOString()
                };
                
                await setDoc(doc(db, 'user_profiles', firebaseUser.uid), newProfile);
                // The snapshot will trigger and set the user state
              } else {
                // Default for fresh signup/unknown users (assumed Admin)
                const newAdminProfile = {
                  email: firebaseUser.email,
                  name: firebaseUser.displayName || 'Administrador',
                  role: 'Administrador',
                  ownerId: firebaseUser.uid,
                  createdAt: new Date().toISOString()
                };
                
                await setDoc(doc(db, 'user_profiles', firebaseUser.uid), newAdminProfile);
                // The snapshot will trigger and set the user state
              }
            } catch (searchErr) {
              console.error("Error searching for member record:", searchErr);
              setUser({
                ...firebaseUser,
                ownerId: firebaseUser.uid
              });
            }
          }
        }, (err) => {
          console.error("Profile subscription error:", err);
          setUser({
            ...firebaseUser,
            ownerId: firebaseUser.uid
          });
        });
      } else {
        setUser(null);
        if (profileUnsub) {
          profileUnsub();
          profileUnsub = null;
        }
      }
      setAuthChecking(false);
    });

    return () => {
      unsub();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  // Real-time Database Collection Subscriptions
  useEffect(() => {
    if (!user || !user.ownerId) return;

    const ownerId = user.ownerId;

    const unsubs = [
      subscribeToCollection<Lead>('leads', ownerId, setLeads),
      subscribeToCollection<Empresa>('empresas', ownerId, setEmpresas),
      subscribeToCollection<Cliente>('clientes', ownerId, setClientes),
      subscribeToCollection<Projeto>('projetos', ownerId, setProjetos),
      subscribeToCollection<Proposta>('propostas', ownerId, setPropostas),
      subscribeToCollection<Contrato>('contratos', ownerId, setContratos),
      subscribeToCollection<Financeiro>('financeiro', ownerId, setFinanceiro),
      subscribeToCollection<EventAgenda>('agenda', ownerId, setAgenda),
      subscribeToCollection<FollowUp>('follow_ups', ownerId, setFollowUps),
      subscribeToCollection<Anotacao>('anotacoes', ownerId, setAnotacoes),
      subscribeToCollection<Documento>('documentos', ownerId, setDocumentos),
      subscribeToCollection<MembroEquipe>('equipe', ownerId, setMembros),
      subscribeToCollection<Log>('logs', ownerId, setLogs),
      subscribeToCollection<ClienteAssinatura>('assinaturas_clientes', ownerId, setAssinaturasClientes),
      onSnapshot(doc(db, 'configuracoes', ownerId), (snapshot) => {
        if (snapshot.exists()) {
          setConfig(snapshot.data() as any);
        }
      })
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [user]);

  const customLogo = config?.logoBase64 || config?.logoUrl || null;
  const companyName = config?.companyName || config?.tradingName || user?.companyName || null;

  const handleLogout = async () => {
    if (user?.isDemo || user?.isMembro) {
      setUser(null);
    } else {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.error("Erro ao deslogar:", err);
      }
      setUser(null);
    }
    setActiveSection('dashboard');
  };

  const handleConvertLeadToClient = async (lead: Lead) => {
    if (!user?.ownerId) return;
    const clientPayload: Omit<Cliente, 'id'> = {
      ownerId: user.ownerId,
      leadId: lead.id,
      name: lead.name,
      companyName: lead.company,
      phone: lead.phone,
      email: lead.email,
      cnpj: lead.cnpj,
      address: lead.address,
      status: 'Ativo',
      createdAt: new Date().toISOString().split('T')[0]
    };
    try {
      await addItem<Cliente>('clientes', clientPayload, user.ownerId);
      await updateItem<Lead>('leads', lead.id, { status: 'Cliente' }, user.ownerId);
    } catch (err) {
      console.error('Error converting lead to client:', err);
    }
  };

  const handleUpdateProposalAndCascade = async (id: string, payload: Partial<Proposta>) => {
    if (!user?.ownerId) return;
    try {
      await updateItem<Proposta>('propostas', id, payload, user.ownerId);

      if (payload.status === 'Aceita') {
        const proposal = propostas.find((p) => p.id === id);
        if (!proposal) return;

        let linkedClientId = proposal.clientId;
        let finalClientName = proposal.clientName;

        const associatedLead = leads.find((l) => l.id === proposal.clientId);
        if (associatedLead) {
          const clientPayload: Omit<Cliente, 'id'> = {
            ownerId: user.ownerId,
            leadId: associatedLead.id,
            name: associatedLead.name,
            companyName: associatedLead.company,
            phone: associatedLead.phone,
            email: associatedLead.email,
            cnpj: associatedLead.cnpj,
            address: associatedLead.address,
            status: 'Ativo',
            createdAt: new Date().toISOString().split('T')[0]
          };
          try {
            const newClientId = await addItem<Cliente>('clientes', clientPayload, user.ownerId);
            linkedClientId = newClientId;
            finalClientName = associatedLead.company || associatedLead.name;
            await updateItem<Lead>('leads', associatedLead.id, { status: 'Cliente' }, user.ownerId);
          } catch (err) {
            console.error('Error auto-converting lead in proposal cascade:', err);
          }
        }

        try {
          const contractPayload: Omit<Contrato, 'id'> = {
            ownerId: user.ownerId,
            clientId: linkedClientId,
            clientName: finalClientName,
            title: `Contrato Ref: ${proposal.number}`,
            value: proposal.value,
            status: 'Pendente',
            date: new Date().toISOString().split('T')[0],
            content: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\nCONTRATANTE: ${finalClientName}\nCONTRATADO: SisteNext\n\nOBJETO DO CONTRATO:\nPrestação de serviços descritos na proposta comercial ${proposal.number}:\n${proposal.services.map((s) => `- ${s.name}: R$ ${s.price.toFixed(2)}`).join('\n')}\n\nVALOR E CONDIÇÕES:\nO valor total deste contrato é de R$ ${proposal.value.toFixed(2)}, conforme proposta comercial vinculada.`
          };
          await addItem<Contrato>('contratos', contractPayload, user.ownerId);
        } catch (err) {
          console.error('Error auto-creating contract in proposal cascade:', err);
        }

        try {
          const projectPayload: Omit<Projeto, 'id'> = {
            ownerId: user.ownerId,
            clientId: linkedClientId,
            clientName: finalClientName,
            name: `Projeto - ${proposal.description || 'Prestação de Serviços'}`,
            description: `Projeto gerado automaticamente a partir da proposta ${proposal.number}.`,
            scope: proposal.services.map((s) => `- ${s.name}`).join('\n'),
            value: proposal.value,
            status: 'Levantamento',
            startDate: new Date().toISOString().split('T')[0],
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            estimatedDelivery: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            owner: 'Arquiteto Sênior',
            checklist: [
              { id: '1', task: 'Kick-off com o cliente', done: false },
              { id: '2', task: 'Levantamento de requisitos detalhado', done: false },
              { id: '3', task: 'Desenho de protótipo inicial', done: false },
              { id: '4', task: 'Aprovação do layout', done: false },
              { id: '5', task: 'Homologação e Testes', done: false },
              { id: '6', task: 'Entrega e Treinamento', done: false }
            ],
            files: []
          };
          await addItem<Projeto>('projetos', projectPayload, user.ownerId);
        } catch (err) {
          console.error('Error auto-creating project in proposal cascade:', err);
        }

        try {
          const financeiroPayload: Omit<Financeiro, 'id'> = {
            ownerId: user.ownerId,
            description: `Faturamento Proposta ${proposal.number}`,
            type: 'Receber',
            category: 'Venda',
            value: proposal.value,
            status: 'Pendente',
            date: new Date().toISOString().split('T')[0],
            clientName: finalClientName,
            projectName: `Projeto - ${proposal.description || 'Prestação de Serviços'}`,
            paymentMethod: 'Pix'
          };
          await addItem<Financeiro>('financeiro', financeiroPayload, user.ownerId);
        } catch (err) {
          console.error('Error auto-creating finance entry in proposal cascade:', err);
        }

        try {
          const agendaPayload: Omit<EventAgenda, 'id'> = {
            ownerId: user.ownerId,
            title: `Kick-off - ${finalClientName}`,
            type: 'Reunião',
            date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: '14:00',
            description: `Reunião de alinhamento e kick-off com base na proposta aceita ${proposal.number}.`,
            linkedId: linkedClientId,
            linkedName: finalClientName,
            linkedType: 'client',
            status: 'Pendente'
          };
          await addItem<EventAgenda>('agenda', agendaPayload, user.ownerId);
        } catch (err) {
          console.error('Error auto-creating agenda event in proposal cascade:', err);
        }
      }
    } catch (err) {
      console.error('Error in handleUpdateProposalAndCascade:', err);
    }
  };

  // Loader
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-4">Iniciando SisteNext...</p>
      </div>
    );
  }

  // Not logged in -> Show Auth View or Landing Page
  if (!user) {
    if (showLogin) {
      return (
        <LoginView 
          onLoginSuccess={(u) => {
            setUser(u);
            setShowLogin(false);
          }} 
          onBackToLanding={() => setShowLogin(false)} 
        />
      );
    }
    return <PropertyLandingPage onEnterCRM={() => setShowLogin(true)} />;
  }

  // Render correct Active Section View Component dynamically
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <DashboardView
            leads={filteredLeads}
            clientes={filteredClientes}
            projetos={filteredProjetos}
            propostas={filteredPropostas}
            financeiro={filteredFinanceiro}
            agenda={filteredAgenda}
            followUps={filteredFollowUps}
            config={config}
            membros={membros}
            userEmail={user?.email}
            onNavigate={(sec) => setActiveSection(sec)}
          />
        );
      case 'leads':
        return (
          <LeadsView
            leads={filteredLeads}
            followUps={filteredFollowUps}
            onAddLead={(payload) => {
              if (!user?.ownerId) return Promise.reject('No ownerId');
              const enriched = {
                ...payload,
                ownerId: user.ownerId,
                createdBy: currentUserEmail || (payload as any).createdBy,
                representative: payload.representative || currentMember?.name || currentUserEmail || (payload as any).representative
              };
              return addItem('leads', enriched, user.ownerId);
            }}
            onUpdateLead={(id, payload) => {
              if (!user?.ownerId) return Promise.resolve();
              return updateItem('leads', id, payload, user.ownerId);
            }}
            onDeleteLead={(id, justification, data) => {
              if (!user?.ownerId) return Promise.resolve();
              return deleteItemWithJustification('leads', id, data, justification, user.ownerId);
            }}
            onAddFollowUp={(payload) => {
              if (!user?.ownerId) return Promise.reject('No ownerId');
              return addItem('follow_ups', { ...payload, ownerId: user.ownerId }, user.ownerId);
            }}
            onConvertLeadToClient={handleConvertLeadToClient}
          />
        );
      case 'empresas':
        return (
          <EmpresasView
            empresas={empresas}
            onAddEmpresa={(payload) => {
              if (!user?.ownerId) return Promise.reject('No ownerId');
              return addItem('empresas', { ...payload, ownerId: user.ownerId }, user.ownerId);
            }}
            onUpdateEmpresa={(id, payload) => {
              if (!user?.ownerId) return Promise.resolve();
              return updateItem('empresas', id, payload, user.ownerId);
            }}
            onDeleteEmpresa={(id, justification, data) => {
              if (!user?.ownerId) return Promise.resolve();
              return deleteItemWithJustification('empresas', id, data, justification, user.ownerId);
            }}
          />
        );
      case 'clientes':
        return (
          <ClientesView
            clientes={filteredClientes}
            projetos={filteredProjetos}
            financeiro={filteredFinanceiro}
            contratos={filteredContratos}
            followUps={filteredFollowUps}
            anotacoes={filteredAnotacoes}
            propostas={filteredPropostas}
            documentos={filteredDocumentos}
            onAddAnotacao={(payload) => {
              if (!user?.ownerId) return Promise.reject('No ownerId');
              return addItem('anotacoes', { ...payload, ownerId: user.ownerId }, user.ownerId);
            }}
            onUpdateCliente={(id, payload) => {
              if (!user?.ownerId) return Promise.resolve();
              return updateItem("clientes", id, payload, user.ownerId);
            }}
            onDeleteCliente={(id, justification, data) => {
              if (!user?.ownerId) return Promise.resolve();
              return deleteItemWithJustification('clientes', id, data, justification, user.ownerId);
            }}
            onUpdateFinanceiro={(id, payload) => {
              if (!user?.ownerId) return Promise.resolve();
              return updateItem("financeiro", id, payload, user.ownerId);
            }}
            onUpdateContrato={(id, payload) => {
              if (!user?.ownerId) return Promise.resolve();
              return updateItem('contratos', id, payload, user.ownerId);
            }}
            onDeleteFinanceiro={(id, justification, data) => {
              if (!user?.ownerId) return Promise.resolve();
              return deleteItemWithJustification('financeiro', id, data, justification, user.ownerId);
            }}
            onDeleteContrato={(id, justification, data) => {
              if (!user?.ownerId) return Promise.resolve();
              return deleteItemWithJustification('contratos', id, data, justification, user.ownerId);
            }}
            onDeleteAnotacao={(id, justification, data) => {
              if (!user?.ownerId) return Promise.resolve();
              return deleteItemWithJustification('anotacoes', id, data, justification, user.ownerId);
            }}
            customLogo={customLogo}
            companyName={companyName}
          />
        );
      case 'propostas':
        return (
          <PropostasView
            propostas={filteredPropostas}
            clientes={filteredClientes}
            leads={filteredLeads}
            onAddProposta={(payload) => {
              if (!user?.ownerId) return Promise.reject('No ownerId');
              return addItem('propostas', { ...payload, ownerId: user.ownerId }, user.ownerId);
            }}
            onUpdateProposta={handleUpdateProposalAndCascade}
            onDeleteProposta={(id, justification, data) => {
              if (!user?.ownerId) return Promise.resolve();
              return deleteItemWithJustification('propostas', id, data, justification, user.ownerId);
            }}
            config={config}
          />
        );
      case 'projetos':
        return (
          <ProjetosView
            projetos={filteredProjetos}
            clientes={filteredClientes}
            onAddProjeto={(payload) => {
              if (!user?.ownerId) return Promise.reject('No ownerId');
              return addItem('projetos', { ...payload, ownerId: user.ownerId }, user.ownerId);
            }}
            onUpdateProjeto={(id, payload) => {
              if (!user?.ownerId) return Promise.resolve();
              return updateItem('projetos', id, payload, user.ownerId);
            }}
            onDeleteProjeto={(id, justification, data) => {
              if (!user?.ownerId) return Promise.resolve();
              return deleteItemWithJustification('projetos', id, data, justification, user.ownerId);
            }}
            customLogo={customLogo}
            companyName={companyName}
          />
        );
      case 'contratos':
        return (
          <ContratosView
            contratos={filteredContratos}
            clientes={filteredClientes}
            onAddContrato={(payload) => {
              if (!user?.ownerId) return Promise.reject('No ownerId');
              return addItem('contratos', { ...payload, ownerId: user.ownerId }, user.ownerId);
            }}
            onUpdateContrato={(id, payload) => {
              if (!user?.ownerId) return Promise.resolve();
              return updateItem('contratos', id, payload, user.ownerId);
            }}
            onDeleteContrato={(id, justification, data) => {
              if (!user?.ownerId) return Promise.resolve();
              return deleteItemWithJustification('contratos', id, data, justification, user.ownerId);
            }}
            config={config}
          />
        );
      case 'financeiro':
        return (
          <FinanceiroView
            financeiro={filteredFinanceiro}
            clientes={filteredClientes}
            assinaturasClientes={assinaturasClientes}
            ownerId={user?.ownerId || ''}
            onAddFinanceiro={(payload) => {
              if (!user?.ownerId) return Promise.reject('No ownerId');
              return addItem('financeiro', { ...payload, ownerId: user.ownerId }, user.ownerId);
            }}
            onUpdateFinanceiro={(id, payload) => {
              if (!user?.ownerId) return Promise.resolve();
              return updateItem('financeiro', id, payload, user.ownerId);
            }}
            onDeleteFinanceiro={(id, justification, data) => {
              if (!user?.ownerId) return Promise.resolve();
              return deleteItemWithJustification('financeiro', id, data, justification, user.ownerId);
            }}
            customLogo={customLogo}
            companyName={companyName}
          />
        );
      case 'agenda':
        return (
          <AgendaView
            agenda={filteredAgenda}
            leads={filteredLeads}
            clientes={filteredClientes}
            onAddAgenda={(payload) => {
              if (!user?.ownerId) return Promise.reject('No ownerId');
              return addItem('agenda', { ...payload, ownerId: user.ownerId }, user.ownerId);
            }}
            onUpdateAgenda={(id, payload) => {
              if (!user?.ownerId) return Promise.resolve();
              return updateItem('agenda', id, payload, user.ownerId);
            }}
            onDeleteAgenda={(id, justification, data) => {
              if (!user?.ownerId) return Promise.resolve();
              return deleteItemWithJustification('agenda', id, data, justification, user.ownerId);
            }}
          />
        );
      case 'followup':
        return <FollowUpsTimeline followUps={filteredFollowUps} leads={filteredLeads} />;
      case 'anotacoes':
        return (
          <AnotacoesView
            anotacoes={filteredAnotacoes}
            onAddAnotacao={(payload) => {
              if (!user?.ownerId) return Promise.reject('No ownerId');
              return addItem('anotacoes', { ...payload, ownerId: user.ownerId }, user.ownerId);
            }}
            onDeleteAnotacao={(id, justification, data) => {
              if (!user?.ownerId) return Promise.resolve();
              return deleteItemWithJustification('anotacoes', id, data, justification, user.ownerId);
            }}
          />
        );
      case 'documentos':
        return (
          <DocumentosView
            documentos={filteredDocumentos}
            propostas={filteredPropostas}
            contratos={filteredContratos}
            onAddDocumento={(payload) => {
              if (!user?.ownerId) return Promise.reject('No ownerId');
              return addItem('documentos', { ...payload, ownerId: user.ownerId }, user.ownerId);
            }}
            onDeleteDocumento={(id, justification, data) => {
              if (!user?.ownerId) return Promise.resolve();
              return deleteItemWithJustification('documentos', id, data, justification, user.ownerId);
            }}
          />
        );
      case 'relatorios':
        return (
          <RelatoriosView
            clientes={filteredClientes}
            projetos={filteredProjetos}
            financeiro={filteredFinanceiro}
            customLogo={customLogo}
            companyName={companyName}
          />
        );
      case 'equipe':
        return (
          <EquipeView
            membros={filteredMembros}
            logs={logs}
            leads={leads}
            propostas={propostas}
            clientes={clientes}
            financeiro={financeiro}
            onAddMembro={(payload) => {
              if (!user?.ownerId) return Promise.reject('No ownerId');
              return addItem('equipe', { ...payload, ownerId: user.ownerId }, user.ownerId);
            }}
            onUpdateMembro={async (id, payload) => {
              if (!user?.ownerId) return Promise.reject('No ownerId');
              if (id.startsWith('owner-')) {
                // Update owner's own profile instead of the team list
                await updateDoc(doc(db, 'user_profiles', user.uid), payload);
                
                // Write audit log entry
                const logRef = doc(collection(db, 'logs'));
                await setDoc(logRef, {
                  id: logRef.id,
                  ownerId: user.ownerId,
                  operation: 'UPDATE',
                  collection: 'user_profiles',
                  recordId: user.uid,
                  justification: 'Atualizou seu próprio perfil de Administrador',
                  timestamp: new Date().toISOString(),
                  user: user.email || 'Sistema',
                  data: payload
                });
                return;
              }
              return updateItem('equipe', id, payload, user.ownerId);
            }}
            onDeleteMembro={(id, justification, data) => {
              if (id.startsWith('owner-')) {
                return Promise.reject('O proprietário não pode ser excluído.');
              }
              if (!user?.ownerId) return Promise.resolve();
              return deleteItemWithJustification('equipe', id, data, justification, user.ownerId);
            }}
            currentUserEmail={user?.email || 'Vendedor'}
          />
        );
      case 'configuracoes':
        return (
          <ConfiguracoesView
            currentTheme={darkMode ? 'dark' : 'light'}
            onToggleTheme={handleToggleTheme}
            ownerId={user?.ownerId || ''}
            membros={filteredMembros}
            dbData={{
              leads,
              clientes,
              empresas,
              projetos,
              propostas,
              contratos,
              financeiro,
              agenda,
              anotacoes,
              documentos
            }}
          />
        );
      default:
        return (
          <div className="p-8 text-center text-slate-400">
            Módulo em desenvolvimento...
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onLogout={handleLogout}
        user={user}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isVendedor={isVendedor}
        activeSubscription={config?.activeSubscription}
      />

      <NotificationManager agenda={agenda} />
      
      {/* View Stage */}
      <main className="flex-1 overflow-y-auto max-h-screen relative flex flex-col">
        {/* Global Premium TopBar */}
        {(companyName || isVendedor) && (
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/60 px-6 py-3 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Organização:
              </span>
              <div className="flex items-center gap-1.5 bg-indigo-500/5 dark:bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/10">
                {customLogo ? (
                  <img src={customLogo} alt={companyName || 'SisteNext'} className="w-4 h-4 rounded object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                )}
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight uppercase">
                  {companyName || 'SisteNext CRM'}
                </span>
              </div>
            </div>
            
            {isVendedor && (
              <div className="flex items-center gap-1.5 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                Painel do Consultor
              </div>
            )}
          </div>
        )}
        <div className="flex-1">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
