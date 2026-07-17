import { useState, useEffect } from 'react';
import { subscribeToCollection, addItem, updateItem, deleteItem } from '../../dbService';
import {
  Planejamento,
  Nicho,
  Estrategia,
  Conteudo,
  Prospeccao,
  Diagnostico,
  ProjetoPromocional,
  CaseDeSucesso,
  Ideia,
  SnapshotRelatorio,
  MetaMensal
} from '../types';

export function useMarketingData(ownerId: string | undefined) {
  const [planejamentos, setPlanejamentos] = useState<Planejamento[]>([]);
  const [nichos, setNichos] = useState<Nicho[]>([]);
  const [estrategias, setEstrategias] = useState<Estrategia[]>([]);
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [prospeccoes, setProspeccoes] = useState<Prospeccao[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [projetosPromocionais, setProjetosPromocionais] = useState<ProjetoPromocional[]>([]);
  const [cases, setCases] = useState<CaseDeSucesso[]>([]);
  const [ideias, setIdeias] = useState<Ideia[]>([]);
  const [relatorios, setRelatorios] = useState<SnapshotRelatorio[]>([]);
  const [metas, setMetas] = useState<MetaMensal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) return;

    setLoading(true);

    const unsubPlanejamentos = subscribeToCollection<Planejamento>('planejamentos', ownerId, (data) => {
      setPlanejamentos(data);
    });

    const unsubNichos = subscribeToCollection<Nicho>('nichos', ownerId, (data) => {
      setNichos(data);
    });

    const unsubEstrategias = subscribeToCollection<Estrategia>('estrategias', ownerId, (data) => {
      setEstrategias(data);
    });

    const unsubConteudos = subscribeToCollection<Conteudo>('conteudos', ownerId, (data) => {
      setConteudos(data);
    });

    const unsubProspeccoes = subscribeToCollection<Prospeccao>('prospeccoes', ownerId, (data) => {
      setProspeccoes(data);
    });

    const unsubDiagnosticos = subscribeToCollection<Diagnostico>('diagnosticos', ownerId, (data) => {
      setDiagnosticos(data);
    });

    const unsubProjetosPromocionais = subscribeToCollection<ProjetoPromocional>('projetosPromocionais', ownerId, (data) => {
      setProjetosPromocionais(data);
    });

    const unsubCases = subscribeToCollection<CaseDeSucesso>('cases', ownerId, (data) => {
      setCases(data);
    });

    const unsubIdeias = subscribeToCollection<Ideia>('ideias', ownerId, (data) => {
      setIdeias(data);
    });

    const unsubRelatorios = subscribeToCollection<SnapshotRelatorio>('relatorios', ownerId, (data) => {
      setRelatorios(data);
    });

    const unsubMetas = subscribeToCollection<MetaMensal>('metas', ownerId, (data) => {
      setMetas(data);
      setLoading(false);
    });

    return () => {
      unsubPlanejamentos();
      unsubNichos();
      unsubEstrategias();
      unsubConteudos();
      unsubProspeccoes();
      unsubDiagnosticos();
      unsubProjetosPromocionais();
      unsubCases();
      unsubIdeias();
      unsubRelatorios();
      unsubMetas();
    };
  }, [ownerId]);

  // CRUD functions wrapping the generic dbService functions
  const handleAdd = async (colName: string, item: any) => {
    if (!ownerId) throw new Error('Tenant ID (ownerId) não disponível.');
    return addItem(colName, item, ownerId);
  };

  const handleUpdate = async (colName: string, id: string, item: any) => {
    if (!ownerId) throw new Error('Tenant ID (ownerId) não disponível.');
    return updateItem(colName, id, item, ownerId);
  };

  const handleDelete = async (colName: string, id: string) => {
    if (!ownerId) throw new Error('Tenant ID (ownerId) não disponível.');
    return deleteItem(colName, id, ownerId);
  };

  return {
    planejamentos,
    nichos,
    estrategias,
    conteudos,
    prospeccoes,
    diagnosticos,
    projetosPromocionais,
    cases,
    ideias,
    relatorios,
    metas,
    loading,

    // Operations
    addPlanejamento: (item: Omit<Planejamento, 'id' | 'ownerId' | 'createdBy' | 'createdAt'>) => handleAdd('planejamentos', item),
    updatePlanejamento: (id: string, item: Partial<Planejamento>) => handleUpdate('planejamentos', id, item),
    deletePlanejamento: (id: string) => handleDelete('planejamentos', id),

    addNicho: (item: Omit<Nicho, 'id' | 'ownerId' | 'createdBy' | 'createdAt'>) => handleAdd('nichos', item),
    updateNicho: (id: string, item: Partial<Nicho>) => handleUpdate('nichos', id, item),
    deleteNicho: (id: string) => handleDelete('nichos', id),

    addEstrategia: (item: Omit<Estrategia, 'id' | 'ownerId' | 'createdBy' | 'createdAt'>) => handleAdd('estrategias', item),
    updateEstrategia: (id: string, item: Partial<Estrategia>) => handleUpdate('estrategias', id, item),
    deleteEstrategia: (id: string) => handleDelete('estrategias', id),

    addConteudo: (item: Omit<Conteudo, 'id' | 'ownerId' | 'createdBy' | 'createdAt'>) => handleAdd('conteudos', item),
    updateConteudo: (id: string, item: Partial<Conteudo>) => handleUpdate('conteudos', id, item),
    deleteConteudo: (id: string) => handleDelete('conteudos', id),

    addProspeccao: (item: Omit<Prospeccao, 'id' | 'ownerId' | 'createdBy' | 'createdAt'>) => handleAdd('prospeccoes', item),
    updateProspeccao: (id: string, item: Partial<Prospeccao>) => handleUpdate('prospeccoes', id, item),
    deleteProspeccao: (id: string) => handleDelete('prospeccoes', id),

    addDiagnostico: (item: Omit<Diagnostico, 'id' | 'ownerId' | 'createdBy' | 'createdAt'>) => handleAdd('diagnosticos', item),
    updateDiagnostico: (id: string, item: Partial<Diagnostico>) => handleUpdate('diagnosticos', id, item),
    deleteDiagnostico: (id: string) => handleDelete('diagnosticos', id),

    addProjetoPromocional: (item: Omit<ProjetoPromocional, 'id' | 'ownerId' | 'createdBy' | 'createdAt'>) => handleAdd('projetosPromocionais', item),
    updateProjetoPromocional: (id: string, item: Partial<ProjetoPromocional>) => handleUpdate('projetosPromocionais', id, item),
    deleteProjetoPromocional: (id: string) => handleDelete('projetosPromocionais', id),

    addCaseDeSucesso: (item: Omit<CaseDeSucesso, 'id' | 'ownerId' | 'createdBy' | 'createdAt'>) => handleAdd('cases', item),
    updateCaseDeSucesso: (id: string, item: Partial<CaseDeSucesso>) => handleUpdate('cases', id, item),
    deleteCaseDeSucesso: (id: string) => handleDelete('cases', id),

    addIdeia: (item: Omit<Ideia, 'id' | 'ownerId' | 'createdBy' | 'createdAt'>) => handleAdd('ideias', item),
    updateIdeia: (id: string, item: Partial<Ideia>) => handleUpdate('ideias', id, item),
    deleteIdeia: (id: string) => handleDelete('ideias', id),

    addSnapshotRelatorio: (item: Omit<SnapshotRelatorio, 'id' | 'ownerId' | 'createdBy' | 'createdAt'>) => handleAdd('relatorios', item),
    updateSnapshotRelatorio: (id: string, item: Partial<SnapshotRelatorio>) => handleUpdate('relatorios', id, item),
    deleteSnapshotRelatorio: (id: string) => handleDelete('relatorios', id),

    addMetaMensal: (item: Omit<MetaMensal, 'id' | 'ownerId' | 'createdBy' | 'createdAt'>) => handleAdd('metas', item),
    updateMetaMensal: (id: string, item: Partial<MetaMensal>) => handleUpdate('metas', id, item),
    deleteMetaMensal: (id: string) => handleDelete('metas', id)
  };
}
