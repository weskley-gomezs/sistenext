import React, { useState } from 'react';
import { Plus, Search, Building2, MapPin, Phone, Mail, Link2, Users2, FileText, X, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Empresa } from '../types';
import { formatCNPJ, formatPhone } from '../utils/masks';
import { ConfirmModal } from './ConfirmModal';

interface EmpresasViewProps {
  empresas: Empresa[];
  onAddEmpresa: (emp: Omit<Empresa, 'id'>) => Promise<string>;
  onUpdateEmpresa: (id: string, emp: Partial<Empresa>) => Promise<void>;
  onDeleteEmpresa: (id: string, justification: string, data: Empresa) => Promise<void>;
}

export default function EmpresasView({
  empresas,
  onAddEmpresa,
  onUpdateEmpresa,
  onDeleteEmpresa
}: EmpresasViewProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Empresa | null>(null);
  const [empToDelete, setEmpToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    cnpj: '',
    companyName: '',
    tradingName: '',
    address: '',
    city: '',
    state: '',
    cep: '',
    phone: '',
    email: '',
    site: '',
    representative: '',
    segment: '',
    employeeCount: 0,
    notes: ''
  });

  const resetForm = () => {
    setFormData({
      cnpj: '',
      companyName: '',
      tradingName: '',
      address: '',
      city: '',
      state: '',
      cep: '',
      phone: '',
      email: '',
      site: '',
      representative: '',
      segment: '',
      employeeCount: 0,
      notes: ''
    });
    setEditingEmp(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleOpenEdit = (emp: Empresa) => {
    setEditingEmp(emp);
    setFormData({
      cnpj: emp.cnpj,
      companyName: emp.companyName,
      tradingName: emp.tradingName,
      address: emp.address,
      city: emp.city,
      state: emp.state,
      cep: emp.cep,
      phone: emp.phone,
      email: emp.email,
      site: emp.site,
      representative: emp.representative,
      segment: emp.segment,
      employeeCount: emp.employeeCount,
      notes: emp.notes
    });
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmp) {
        await onUpdateEmpresa(editingEmp.id, formData);
      } else {
        await onAddEmpresa(formData);
      }
      setIsOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = empresas.filter((emp) => {
    const q = search.toLowerCase();
    return (
      emp.tradingName.toLowerCase().includes(q) ||
      emp.companyName.toLowerCase().includes(q) ||
      emp.cnpj.includes(q) ||
      emp.city.toLowerCase().includes(q) ||
      emp.representative.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Empresas Parceiras
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mantenha o cadastro unificado das pessoas jurídicas, faturamento e contas corporativas.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 cursor-pointer"
        >
          <Plus size={14} /> Nova Empresa
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm">
        <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Pesquisar por razão, fantasia, CNPJ, responsável..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border-0 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-0"
        />
      </div>

      {/* Card Grid of Companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 font-medium text-xs">
            Nenhuma empresa cadastrada ou correspondente à busca.
          </div>
        ) : (
          filtered.map((emp) => (
            <div
              key={emp.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-none">
                        {emp.tradingName}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                        CNPJ: {emp.cnpj}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenEdit(emp)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => setEmpToDelete(emp.id)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-slate-400" />
                    <span>{emp.city} - {emp.state} {emp.address ? `, ${emp.address}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-slate-400" />
                    <span>{emp.phone || 'Sem Telefone'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-slate-400" />
                    <span>{emp.email || 'Sem E-mail'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link2 size={13} className="text-slate-400" />
                    <span className="truncate hover:underline cursor-pointer">{emp.site || 'Sem Site'}</span>
                  </div>
                </div>

                {/* Tags or details */}
                <div className="mt-5 flex gap-4 border-t border-slate-100 dark:border-slate-800 pt-3 text-[11px] font-semibold text-slate-500">
                  <div className="flex items-center gap-1">
                    <Users2 size={12} className="text-indigo-500" />
                    <span>{emp.employeeCount || '0'} funcs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText size={12} className="text-indigo-500" />
                    <span className="truncate max-w-[120px]">{emp.segment || 'Geral'}</span>
                  </div>
                </div>
              </div>

              {emp.notes && (
                <div className="mt-4 p-2 bg-slate-50 dark:bg-slate-950/60 rounded-lg text-[11px] italic text-slate-400 border border-slate-200/20">
                  {emp.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* DRAWER FORM */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col z-10 p-6 border-l border-slate-200 dark:border-slate-900 overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-900 mb-6">
                <h3 className="text-md font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {editingEmp ? 'Editar Empresa' : 'Cadastrar Empresa'}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div className="space-y-3">
                  <h4 className="font-extrabold text-[10px] text-indigo-500 uppercase tracking-widest">Cadastro Jurídico</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">CNPJ *</label>
                      <input
                        type="text"
                        required
                        value={formData.cnpj}
                        onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                        placeholder="Ex: 00.000.000/0001-00"
                        maxLength={18}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nome Fantasia *</label>
                      <input
                        type="text"
                        required
                        value={formData.tradingName}
                        onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Razão Social *</label>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="font-extrabold text-[10px] text-indigo-500 uppercase tracking-widest">Endereço & Contato</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Logradouro / Número</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">CEP</label>
                      <input
                        type="text"
                        value={formData.cep}
                        onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Cidade</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Estado (UF)</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Telefone</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                        placeholder="Ex: (11) 99999-9999"
                        maxLength={15}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Email Geral</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Ex: contato@empresa.com"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="font-extrabold text-[10px] text-indigo-500 uppercase tracking-widest">Atributos & Porte</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Site</label>
                      <input
                        type="text"
                        value={formData.site}
                        onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Responsável Interno</label>
                      <input
                        type="text"
                        value={formData.representative}
                        onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Segmento</label>
                      <input
                        type="text"
                        value={formData.segment}
                        onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Qtd. de Funcionários</label>
                      <input
                        type="number"
                        value={formData.employeeCount}
                        onChange={(e) => setFormData({ ...formData, employeeCount: Number(e.target.value) })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Observações Jurídicas</label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                  >
                    Salvar Empresa
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="py-2.5 px-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={!!empToDelete}
        title="Excluir Empresa"
        message="Deseja realmente remover esta empresa permanentemente? Informe uma justificativa para prosseguir."
        onConfirm={async (justification) => {
          if (empToDelete) {
            const emp = empresas.find(e => e.id === empToDelete);
            if (emp) {
              await onDeleteEmpresa(empToDelete, justification, emp);
            }
            setEmpToDelete(null);
          }
        }}
        onCancel={() => setEmpToDelete(null)}
      />
    </div>
  );
}
