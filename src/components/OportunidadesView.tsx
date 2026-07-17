import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Download,
  Search,
  Grid,
  Save,
  X,
  PlusCircle,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Oportunidade, OportunidadeColumn, OportunidadeRow, MembroEquipe } from '../types';
import { exportToPDF } from '../utils/pdfExport';
import { ConfirmModal } from './ConfirmModal';

interface OportunidadesViewProps {
  oportunidades: Oportunidade[];
  membros: MembroEquipe[];
  config: any;
  user: any;
  onAddOportunidade: (payload: Omit<Oportunidade, 'id'>) => Promise<string>;
  onUpdateOportunidade: (id: string, payload: Partial<Oportunidade>) => Promise<void>;
  onDeleteOportunidade: (id: string, justification: string, data: Oportunidade) => Promise<void>;
}

export default function OportunidadesView({
  oportunidades,
  membros,
  config,
  user,
  onAddOportunidade,
  onUpdateOportunidade,
  onDeleteOportunidade
}: OportunidadesViewProps) {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [localRows, setLocalRows] = useState<OportunidadeRow[]>([]);
  const [localColumns, setLocalColumns] = useState<OportunidadeColumn[]>([]);
  const [tableName, setTableName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const getHref = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };
  
  // Modals & Forms states
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  
  const [isAddColOpen, setIsAddColOpen] = useState(false);
  const [newColLabel, setNewColLabel] = useState('');
  const [newColType, setNewColType] = useState<'text' | 'number' | 'boolean' | 'link'>('text');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Saving state
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Helper to check if a row has any meaningful data
  const isRowNotEmpty = (r: OportunidadeRow) => {
    return Object.entries(r).some(([key, value]) => {
      if (key === 'id' || key === 'contato') return false;
      if (typeof value === 'string') return value.trim() !== '';
      if (typeof value === 'number') return true;
      return value !== null && value !== undefined && value !== false;
    });
  };

  // Load initial spreadsheet
  useEffect(() => {
    if (oportunidades.length > 0) {
      if (!selectedTableId) {
        // Default to the first sheet if none selected yet
        const first = oportunidades[0];
        setSelectedTableId(first.id);
        setLocalRows(first.rows || []);
        setLocalColumns(first.columns || []);
        setTableName(first.name);
        setHasChanges(false);
      } else {
        const current = oportunidades.find(o => o.id === selectedTableId);
        if (current) {
          if (!hasChanges) {
            setLocalRows(current.rows || []);
            setLocalColumns(current.columns || []);
            setTableName(current.name);
          }
        }
      }
    } else {
      setSelectedTableId(null);
      setLocalRows([]);
      setLocalColumns([]);
      setTableName('');
      setHasChanges(false);
    }
  }, [oportunidades, selectedTableId, hasChanges]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!selectedTableId || !hasChanges) return;

    // Capture the exact table ID that this effect run is responsible for saving
    const tableIdForThisEffect = selectedTableId;

    const delayDebounceFn = setTimeout(() => {
      const autoSave = async () => {
        // Filter out completely empty rows
        const validRows = localRows.filter(isRowNotEmpty);

        try {
          setIsSaving(true);
          await onUpdateOportunidade(tableIdForThisEffect, {
            name: tableName,
            columns: localColumns,
            rows: validRows
          });

          // CRITICAL: Only update the local React state and clear the dirty flag if the user
          // is still viewing/editing the SAME spreadsheet that we just saved!
          setSelectedTableId(currentId => {
            if (currentId === tableIdForThisEffect) {
              setLocalRows(validRows);
              setHasChanges(false);
              setSaveSuccess(true);
              setTimeout(() => setSaveSuccess(false), 3000);
            }
            return currentId;
          });
        } catch (err) {
          console.error('Erro no salvamento automático:', err);
        } finally {
          setIsSaving(false);
        }
      };

      autoSave();
    }, 1500); // Wait for 1.5 seconds of inactivity before auto-saving

    return () => clearTimeout(delayDebounceFn);
  }, [localRows, localColumns, tableName, selectedTableId, hasChanges]);

  // Handle switching spreadsheets
  const handleSelectTable = (id: string) => {
    if (hasChanges) {
      if (!window.confirm('Você tem alterações não salvas nesta planilha. Deseja trocar de planilha mesmo assim e descartar as alterações?')) {
        return;
      }
    }
    const table = oportunidades.find(o => o.id === id);
    if (table) {
      setSelectedTableId(id);
      setLocalRows(table.rows || []);
      setLocalColumns(table.columns || []);
      setTableName(table.name);
      setHasChanges(false);
    }
  };

  // Create a new spreadsheet/table
  const handleCreateSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSheetName.trim()) return;

    const initialColumns: OportunidadeColumn[] = [
      { key: 'empresa', label: 'Nome da Empresa', type: 'text' },
      { key: 'telefone', label: 'Telefone', type: 'text' },
      { key: 'contato', label: 'Entrou em Contato', type: 'boolean' }
    ];

    const newSheet: Omit<Oportunidade, 'id'> = {
      ownerId: user?.ownerId || '',
      name: newSheetName.trim(),
      columns: initialColumns,
      rows: [
        { id: '1', empresa: 'Empresa Exemplo Ltda', telefone: '(11) 98765-4321', contato: false }
      ],
      createdAt: new Date().toISOString()
    };

    try {
      setIsSaving(true);
      const newId = await onAddOportunidade(newSheet);
      
      // Update local state immediately to prevent race conditions
      setLocalRows(newSheet.rows);
      setLocalColumns(newSheet.columns);
      setTableName(newSheet.name);
      setSelectedTableId(newId);
      setNewSheetName('');
      setIsCreateSheetOpen(false);
      setHasChanges(false);
    } catch (err) {
      console.error('Erro ao criar planilha:', err);
      alert('Erro ao criar planilha.');
    } finally {
      setIsSaving(false);
    }
  };

  // Import an external spreadsheet from CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const defaultSheetName = file.name.replace(/\.[^/.]+$/, "");
    const reader = new FileReader();

    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length < 2) {
        alert('O arquivo selecionado está vazio ou não possui registros suficientes.');
        return;
      }

      // Parse fields with support for quoted strings
      const parseCSVLine = (lineStr: string, delim: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < lineStr.length; i++) {
          const char = lineStr[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === delim && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        
        return result.map(field => {
          if (field.startsWith('"') && field.endsWith('"')) {
            return field.slice(1, -1).trim();
          }
          return field;
        });
      };

      // Detect separator (; or ,) based on frequency in first line
      const firstLine = lines[0];
      const countSemicolon = (firstLine.match(/;/g) || []).length;
      const countComma = (firstLine.match(/,/g) || []).length;
      const delimiter = countSemicolon >= countComma ? ';' : ',';

      const rawHeaders = parseCSVLine(firstLine, delimiter);
      
      const columns: OportunidadeColumn[] = [];
      const headerMapping: { [headerIdx: number]: { key: string, type: 'text' | 'number' | 'boolean' } } = {};

      const normalizeStr = (str: string) => 
        str.toLowerCase()
           .trim()
           .normalize('NFD')
           .replace(/[\u0300-\u036f]/g, '')
           .replace(/['"]/g, '');

      rawHeaders.forEach((header, idx) => {
        const normalized = normalizeStr(header);
        
        if (normalized === '#' || normalized === 'id' || normalized === 'codigo') {
          return;
        }

        if (normalized === 'nome da empresa' || normalized === 'empresa' || normalized === 'nome') {
          columns.push({ key: 'empresa', label: header || 'Nome da Empresa', type: 'text' });
          headerMapping[idx] = { key: 'empresa', type: 'text' };
        } else if (normalized === 'telefone' || normalized === 'tel' || normalized === 'celular' || normalized === 'contato telefone') {
          columns.push({ key: 'telefone', label: header || 'Telefone', type: 'text' });
          headerMapping[idx] = { key: 'telefone', type: 'text' };
        } else if (normalized === 'entrou em contato' || normalized === 'contato' || normalized === 'contatado' || normalized === 'ja contatado') {
          columns.push({ key: 'contato', label: header || 'Entrou em Contato', type: 'boolean' });
          headerMapping[idx] = { key: 'contato', type: 'boolean' };
        } else {
          // Slugify and sanitize custom column keys
          const key = `custom_${normalized.replace(/[^a-z0-9]/g, '_')}_${idx}`;
          columns.push({ key, label: header || `Coluna ${idx + 1}`, type: 'text' });
          headerMapping[idx] = { key, type: 'text' };
        }
      });

      // Guarantee standard columns exist
      if (!columns.some(c => c.key === 'empresa')) {
        columns.unshift({ key: 'empresa', label: 'Nome da Empresa', type: 'text' });
      }
      if (!columns.some(c => c.key === 'telefone')) {
        const empIdx = columns.findIndex(c => c.key === 'empresa');
        columns.splice(empIdx + 1, 0, { key: 'telefone', label: 'Telefone', type: 'text' });
      }
      if (!columns.some(c => c.key === 'contato')) {
        columns.push({ key: 'contato', label: 'Entrou em Contato', type: 'boolean' });
      }

      const rows: OportunidadeRow[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const cells = parseCSVLine(line, delimiter);
        
        if (cells.length === 0 || cells.every(c => !c)) continue;

        const row: any = {
          id: `imp-${Date.now()}-${i}`,
          empresa: '',
          telefone: '',
          contato: false
        };

        // Seed empty values for custom columns
        columns.forEach(col => {
          if (col.key !== 'empresa' && col.key !== 'telefone' && col.key !== 'contato') {
            row[col.key] = '';
          }
        });

        cells.forEach((val, cellIdx) => {
          const mapping = headerMapping[cellIdx];
          if (!mapping) return;

          if (mapping.type === 'boolean') {
            const cleanVal = val.toLowerCase().trim();
            const isTrue = ['sim', 's', 'yes', 'y', 'true', '1', 'contatado', 'contato'].includes(cleanVal);
            row[mapping.key] = isTrue;
          } else {
            row[mapping.key] = val;
          }
        });

        // Add if there is any data in the row
        if (isRowNotEmpty(row)) {
          rows.push(row);
        }
      }

      if (rows.length === 0) {
        alert('Nenhum registro válido foi encontrado na planilha. Verifique se as linhas possuem dados preenchidos.');
        return;
      }

      const finalSheetName = window.prompt('Confirme o nome da nova planilha importada:', defaultSheetName) || defaultSheetName;

      const newSheet: Omit<Oportunidade, 'id'> = {
        ownerId: user?.ownerId || '',
        name: finalSheetName.trim(),
        columns,
        rows,
        createdAt: new Date().toISOString()
      };

      try {
        setIsSaving(true);
        const newId = await onAddOportunidade(newSheet);
        
        setLocalRows(newSheet.rows);
        setLocalColumns(newSheet.columns);
        setTableName(newSheet.name);
        setSelectedTableId(newId);
        setHasChanges(false);
        
        alert(`Planilha "${finalSheetName}" importada com sucesso! ${rows.length} registros carregados.`);
      } catch (err) {
        console.error('Erro ao importar planilha:', err);
        alert('Erro ao importar planilha.');
      } finally {
        setIsSaving(false);
        e.target.value = ''; // Reset file input
      }
    };

    reader.readAsText(file, 'UTF-8');
  };

  // Delete the current spreadsheet
  const handleDeleteCurrentSheet = () => {
    if (!selectedTableId) return;
    setIsDeleteModalOpen(true);
  };

  // Add custom column to the sheet
  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColLabel.trim()) return;

    // Generate a unique slug key
    const key = `custom_${newColLabel.trim().toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}_${Date.now()}`;
    const newCol: OportunidadeColumn = {
      key,
      label: newColLabel.trim(),
      type: newColType
    };

    const updatedCols = [...localColumns, newCol];
    
    // Add default values to existing rows
    const updatedRows = localRows.map(row => ({
      ...row,
      [key]: newColType === 'boolean' ? false : ''
    }));

    setLocalColumns(updatedCols);
    setLocalRows(updatedRows);
    setHasChanges(true);
    setNewColLabel('');
    setNewColType('text');
    setIsAddColOpen(false);
  };

  // Remove a custom column
  const handleRemoveColumn = (colKey: string) => {
    if (['empresa', 'telefone', 'contato'].includes(colKey)) {
      alert('As colunas obrigatórias não podem ser removidas.');
      return;
    }

    const col = localColumns.find(c => c.key === colKey);
    if (!col) return;

    if (!window.confirm(`Tem certeza que deseja remover a coluna personalizada "${col.label}"? Todos os dados salvos nesta coluna serão removidos.`)) {
      return;
    }

    const updatedCols = localColumns.filter(c => c.key !== colKey);
    const updatedRows = localRows.map(row => {
      const copy = { ...row };
      delete copy[colKey];
      return copy;
    });

    setLocalColumns(updatedCols);
    setLocalRows(updatedRows);
    setHasChanges(true);
  };

  // Add a blank row
  const handleAddRow = () => {
    const newId = Date.now().toString();
    const newRow: OportunidadeRow = {
      id: newId,
      empresa: '',
      telefone: '',
      contato: false
    };

    // Populate default value for custom columns
    localColumns.forEach(col => {
      if (!['empresa', 'telefone', 'contato'].includes(col.key)) {
        newRow[col.key] = col.type === 'boolean' ? false : '';
      }
    });

    setLocalRows([...localRows, newRow]);
    setHasChanges(true);
  };

  // Remove a row
  const handleRemoveRow = (rowId: string) => {
    const updatedRows = localRows.filter(r => r.id !== rowId);
    setLocalRows(updatedRows);
    setHasChanges(true);
  };

  // Inline grid cell modification
  const handleCellChange = (rowId: string, colKey: string, val: any) => {
    const updatedRows = localRows.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          [colKey]: val
        };
      }
      return row;
    });
    setLocalRows(updatedRows);
    setHasChanges(true);
  };

  // Save the spreadsheet changes to Firestore
  const handleSaveSpreadsheet = async () => {
    if (!selectedTableId) return;

    const tableIdForSave = selectedTableId;

    // Filter out completely empty rows
    const validRows = localRows.filter(isRowNotEmpty);

    // Validate that remaining rows have at least a name, or warn the user
    const rowsWithoutCompany = validRows.filter(r => !(r.empresa || '').trim());
    if (rowsWithoutCompany.length > 0) {
      const confirmSave = window.confirm(
        `Atenção: ${rowsWithoutCompany.length} linha(s) estão sem o "Nome da Empresa". Elas serão salvas, mas recomendamos preencher este campo para melhor organização. Deseja continuar?`
      );
      if (!confirmSave) {
        setIsSaving(false);
        return;
      }
    }

    try {
      setIsSaving(true);
      await onUpdateOportunidade(tableIdForSave, {
        name: tableName,
        columns: localColumns,
        rows: validRows
      });

      // CRITICAL: Only update React state if the user is still on the same sheet
      setSelectedTableId(currentId => {
        if (currentId === tableIdForSave) {
          setLocalRows(validRows); // Sync local state with the filtered rows
          setHasChanges(false);
          setSaveSuccess(true);
        }
        return currentId;
      });
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar dados:', err);
      alert('Erro ao sincronizar com o banco de dados.');
    } finally {
      setIsSaving(false);
    }
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (!selectedTableId) return;
    const currentTable = oportunidades.find(o => o.id === selectedTableId);
    if (!currentTable) return;

    // Construct headers
    const head = [localColumns.map(col => col.label)];
    
    // Construct body data
    const body = localRows.map(row => 
      localColumns.map(col => {
        if (col.key === 'contato') {
          return row.contato ? 'Sim' : 'Não';
        }
        return String(row[col.key] || '');
      })
    );

    // Dynamic Summary Stats
    const totalCount = localRows.length;
    const contactedCount = localRows.filter(r => r.contato).length;
    const pendingCount = totalCount - contactedCount;

    const summary = [
      { label: 'Total de Oportunidades', value: totalCount },
      { label: 'Entrou em Contato', value: `${contactedCount} (${totalCount ? Math.round((contactedCount / totalCount) * 100) : 0}%)` },
      { label: 'Aguardando Contato', value: `${pendingCount} (${totalCount ? Math.round((pendingCount / totalCount) * 100) : 0}%)` },
      { label: 'Gerado por', value: user?.displayName || user?.email || 'Vendedor' }
    ];

    exportToPDF({
      title: `Planilha Oportunidades - ${tableName}`,
      subtitle: `CRM SisteNext - Controle de contatos e prospecção de vendas`,
      head,
      body,
      summary,
      companyName: config?.companyName || 'SisteNext ERP'
    });
  };

  // Filter rows based on search
  const filteredRows = localRows.filter(row => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    // Check default fields
    if (row.empresa.toLowerCase().includes(query)) return true;
    if (row.telefone.toLowerCase().includes(query)) return true;

    // Check custom fields values
    return Object.keys(row).some(key => {
      if (['id', 'empresa', 'telefone', 'contato'].includes(key)) return false;
      return String(row[key] || '').toLowerCase().includes(query);
    });
  });

  return (
    <div className="flex flex-col flex-1 p-4 md:p-6 space-y-6 overflow-hidden">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Grid size={24} />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Oportunidades
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gerencie listas e planilhas dinâmicas de leads frios e controle os contatos no estilo Excel.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".csv"
            id="csv-import-file-input"
            onChange={handleImportCSV}
            className="hidden"
          />
          <label
            htmlFor="csv-import-file-input"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs md:text-sm px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet size={16} />
            Importar Planilha (.CSV)
          </label>

          <button
            onClick={() => setIsCreateSheetOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs md:text-sm px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            Nova Planilha
          </button>

          {selectedTableId && (
            <button
              onClick={handleDeleteCurrentSheet}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-medium text-xs md:text-sm px-3 py-2.5 rounded-xl transition-all cursor-pointer"
              title="Excluir planilha atual"
            >
              <Trash2 size={16} />
              Excluir Planilha
            </button>
          )}
        </div>
      </div>

      {/* Spreadsheet Select / Switcher bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-2">
          <Layers size={14} /> Planilhas:
        </span>
        {oportunidades.length === 0 ? (
          <span className="text-xs text-slate-500 italic">Nenhuma planilha criada.</span>
        ) : (
          oportunidades.map((sheet) => {
            const isActive = sheet.id === selectedTableId;
            return (
              <button
                key={sheet.id}
                onClick={() => handleSelectTable(sheet.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                {sheet.name}
              </button>
            );
          })
        )}
      </div>

      {/* Empty State / Active Sheet View */}
      {!selectedTableId ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl min-h-[350px]">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-850 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800 text-slate-400 mb-4 animate-pulse">
            <FileSpreadsheet size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
            Nenhuma Planilha Ativa
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm text-center mb-6">
            Você ainda não selecionou ou criou nenhuma planilha de oportunidades. Crie uma nova planilha para começar a preencher registros de contatos.
          </p>
          <button
            onClick={() => setIsCreateSheetOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            Criar Minha Primeira Planilha
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-sm">
          {/* Spreadsheet Header / Utility Bar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
              {/* Sheet Title Rename Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => {
                    setTableName(e.target.value);
                    setHasChanges(true);
                  }}
                  className="font-bold text-lg text-slate-800 dark:text-white bg-transparent border-b border-transparent hover:border-indigo-400 focus:border-indigo-500 focus:outline-none px-1"
                  title="Clique para renomear a planilha"
                />
              </div>

              {/* Status Indicators */}
              <div className="flex items-center gap-2">
                {isSaving ? (
                  <span className="flex items-center gap-1 text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full animate-pulse border border-indigo-200 dark:border-indigo-950">
                    <AlertCircle size={10} /> Salvando automaticamente...
                  </span>
                ) : hasChanges ? (
                  <span className="flex items-center gap-1 text-[10px] bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400 font-bold px-2 py-0.5 rounded-full border border-yellow-200 dark:border-yellow-950 animate-pulse">
                    <AlertCircle size={10} /> Alterações pendentes (auto-salvando...)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-950">
                    <CheckCircle2 size={10} /> Sincronizado
                  </span>
                )}
                
                {saveSuccess && (
                  <span className="text-[10px] text-emerald-500 font-bold animate-pulse">
                    Salvo com sucesso!
                  </span>
                )}
              </div>
            </div>

            {/* Utility Grid Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative w-full sm:w-64 shrink-0">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Pesquisar registros..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>

              {/* Dynamic Column button */}
              <button
                onClick={() => setIsAddColOpen(true)}
                className="flex items-center gap-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-semibold text-xs px-3 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <PlusCircle size={14} className="text-indigo-500" />
                Adicionar Coluna
              </button>

              {/* PDF Download Button */}
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-indigo-600 dark:text-indigo-400 font-semibold text-xs px-3 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <Download size={14} />
                Exportar PDF
              </button>

              {/* Save Spreadsheet Button */}
              <button
                onClick={handleSaveSpreadsheet}
                disabled={!hasChanges || isSaving}
                className={`flex items-center gap-1.5 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                  hasChanges
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10'
                    : 'bg-slate-100 dark:bg-slate-850 text-slate-400 border border-slate-200 dark:border-slate-800 cursor-not-allowed'
                }`}
              >
                <Save size={14} />
                {isSaving ? 'Sincronizando...' : 'Salvar Planilha'}
              </button>
            </div>
          </div>

          {/* Excel Grid Container */}
          <div className="overflow-x-auto w-full border-b border-slate-200 dark:border-slate-800 max-h-[500px]">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-semibold tracking-wider uppercase border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-800 text-center w-12">#</th>
                  
                  {/* Map columns with custom handles */}
                  {localColumns.map((col) => {
                    const isMandatory = ['empresa', 'telefone', 'contato'].includes(col.key);
                    return (
                      <th
                        key={col.key}
                        className="px-4 py-3 border-r border-slate-200 dark:border-slate-800 relative group min-w-[180px]"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold">{col.label}</span>
                          {!isMandatory && (
                            <button
                              onClick={() => handleRemoveColumn(col.key)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 text-red-500 rounded transition-opacity cursor-pointer"
                              title="Excluir coluna"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  
                  <th className="px-4 py-3 text-center w-20">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={localColumns.length + 2} className="px-4 py-8 text-center text-slate-400 italic">
                      {searchQuery ? 'Nenhum registro corresponde à sua busca.' : 'Planilha vazia. Adicione uma linha para começar.'}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors"
                    >
                      {/* Numbering */}
                      <td className="px-4 py-2 text-center text-slate-400 border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 font-mono text-xs">
                        {index + 1}
                      </td>

                      {/* Map columns in each row */}
                      {localColumns.map((col) => {
                        return (
                          <td
                            key={col.key}
                            className="p-1 border-r border-slate-200 dark:border-slate-800"
                          >
                            {col.key === 'contato' ? (
                              // Beautiful switch button for Contact Status (Sim/Não)
                              <div className="flex items-center justify-center p-1">
                                <button
                                  onClick={() => handleCellChange(row.id, 'contato', !row.contato)}
                                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all w-full flex items-center justify-center gap-1 cursor-pointer select-none ${
                                    row.contato
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${row.contato ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                  {row.contato ? 'Sim (Contatado)' : 'Não (Aguardando)'}
                                </button>
                              </div>
                            ) : (
                              // Transparent input fields styled as cells
                              <div className="flex items-center w-full">
                                <input
                                  type={col.type === 'number' ? 'number' : 'text'}
                                  value={row[col.key] || ''}
                                  onChange={(e) => handleCellChange(row.id, col.key, e.target.value)}
                                  className="flex-1 min-w-0 bg-transparent px-3 py-2 text-slate-800 dark:text-slate-100 text-xs placeholder-slate-300 dark:placeholder-slate-700 focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded-lg transition-all"
                                  placeholder={col.key === 'empresa' ? 'Nome da Empresa...' : col.key === 'telefone' ? '(00) 00000-0000...' : col.type === 'link' ? 'Insira um link...' : 'Preencha...'}
                                />
                                {col.type === 'link' && row[col.key] && (
                                  <a
                                    href={getHref(row[col.key])}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded transition-colors mr-1 flex items-center shrink-0"
                                    title="Abrir link em nova guia"
                                  >
                                    <ExternalLink size={14} />
                                  </a>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Delete Action */}
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleRemoveRow(row.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                          title="Excluir linha"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add Row Button at footer of Excel Table */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center text-xs text-slate-500">
            <button
              onClick={handleAddRow}
              className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-800 transition-colors p-1 rounded cursor-pointer"
            >
              <Plus size={14} />
              Adicionar Nova Linha
            </button>
            <div className="flex gap-4 font-mono text-[10px]">
              <span>Registros: <strong>{localRows.length}</strong></span>
              <span>Contatados: <strong className="text-emerald-600 dark:text-emerald-400">{localRows.filter(r => r.contato).length}</strong></span>
              <span>Aguardando: <strong className="text-rose-500">{localRows.filter(r => !r.contato).length}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW SPREADSHEET MODAL */}
      <AnimatePresence>
        {isCreateSheetOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateSheetOpen(false)}
              className="absolute inset-0 bg-black"
            />
            
            {/* Content Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative w-full max-w-md z-10"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                  Criar Nova Planilha
                </h3>
                <button
                  onClick={() => setIsCreateSheetOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSheet} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nome da Planilha
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Oportunidades Q3, Prospecção Outbound"
                    value={newSheetName}
                    onChange={(e) => setNewSheetName(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Por padrão, ela será criada com as colunas: Empresa (obrigatória), Telefone e Entrou em Contato.
                  </span>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateSheetOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-1.5"
                  >
                    Criar Planilha
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD CUSTOM COLUMN MODAL */}
      <AnimatePresence>
        {isAddColOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddColOpen(false)}
              className="absolute inset-0 bg-black"
            />

            {/* Content Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative w-full max-w-md z-10"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                  Adicionar Coluna Personalizada
                </h3>
                <button
                  onClick={() => setIsAddColOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddColumn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nome/Rótulo da Coluna
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: E-mail, Responsável, Valor Estimado"
                    value={newColLabel}
                    onChange={(e) => setNewColLabel(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Tipo de Dado
                  </label>
                  <div className="relative">
                    <select
                      value={newColType}
                      onChange={(e: any) => setNewColType(e.target.value)}
                      className="w-full text-sm px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="text">Texto (Ex: Observações, Segmento)</option>
                      <option value="number">Número (Ex: Valor, Nota)</option>
                      <option value="boolean">Verdadeiro / Falso (Checkbox)</option>
                      <option value="link">Link / URL (Ex: Site, Redes Sociais)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={14} />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddColOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-1.5"
                  >
                    Adicionar Coluna
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Modal for spreadsheet deletion with justification */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Excluir Planilha de Oportunidades"
        message={`Tem certeza que deseja excluir permanentemente a planilha "${tableName}" e todos os seus registros? Por favor, informe uma justificativa.`}
        onConfirm={async (justification) => {
          if (!selectedTableId) return;
          const current = oportunidades.find(o => o.id === selectedTableId);
          if (current) {
            try {
              setIsSaving(true);
              await onDeleteOportunidade(selectedTableId, justification, current);
              setSelectedTableId(null);
              setHasChanges(false);
            } catch (err) {
              console.error('Erro ao excluir planilha:', err);
              alert('Erro ao excluir planilha.');
            } finally {
              setIsSaving(false);
              setIsDeleteModalOpen(false);
            }
          }
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
