import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Search,
  User,
  Calendar,
  X,
  Pencil,
  RotateCcw,
  RotateCw,
  Grid3X3,
  Eraser,
  Sparkles,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  CheckSquare,
  Quote,
  List,
  Paintbrush,
  ClipboardList,
  Highlighter,
  FileImage,
  MousePointer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Anotacao } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface AnotacoesViewProps {
  anotacoes: Anotacao[];
  onAddAnotacao: (note: Omit<Anotacao, 'id'>) => Promise<string>;
  onUpdateAnotacao?: (id: string, note: Partial<Anotacao>) => Promise<void>;
  onDeleteAnotacao: (id: string, justification: string, data: Anotacao) => Promise<void>;
  currentUser?: any;
}

export default function AnotacoesView({
  anotacoes,
  onAddAnotacao,
  onUpdateAnotacao,
  onDeleteAnotacao,
  currentUser
}: AnotacoesViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const [editingAnotacao, setEditingAnotacao] = useState<Anotacao | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  
  // Interactive tools
  const [drawingTool, setDrawingTool] = useState<'cursor' | 'pencil' | 'highlighter' | 'eraser'>('cursor');
  const [brushColor, setBrushColor] = useState('#6366f1');
  const [brushSize, setBrushSize] = useState(3);
  const [isGridEnabled, setIsGridEnabled] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Undo/Redo stack for Canvas
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // DOM Refs
  const editorRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);

  // Preset drawing colors
  const drawingColors = [
    { value: '#6366f1', name: 'Índigo' },
    { value: '#10b981', name: 'Esmeralda' },
    { value: '#f59e0b', name: 'Âmbar' },
    { value: '#f43f5e', name: 'Rose' },
    { value: '#a855f7', name: 'Roxo' },
    { value: '#0f172a', name: 'Slate' },
    { value: '#ffffff', name: 'Branco' }
  ];

  // Map mouse/touch events to standard 800x550 coordinates
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    return { x, y };
  };

  // Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (drawingTool === 'cursor') return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Choose style based on tool type
    if (drawingTool === 'eraser') {
      ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff';
      ctx.lineWidth = brushSize * 4;
    } else if (drawingTool === 'highlighter') {
      const r = parseInt(brushColor.slice(1, 3), 16);
      const g = parseInt(brushColor.slice(3, 5), 16);
      const b = parseInt(brushColor.slice(5, 7), 16);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.35)`;
      ctx.lineWidth = brushSize * 4;
    } else {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
    }
    
    isDrawingRef.current = true;
    lastXRef.current = coords.x;
    lastYRef.current = coords.y;
    setHasDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || drawingTool === 'cursor') return;
    e.preventDefault();
    
    const coords = getCanvasCoords(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastXRef.current, lastYRef.current);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastXRef.current = coords.x;
    lastYRef.current = coords.y;
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    saveHistoryState();
  };

  // History management for Undo/Redo
  const saveHistoryState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(dataUrl);
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[prevIndex];
    } else if (historyIndex === 0) {
      setHistoryIndex(-1);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawing(false);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[nextIndex];
      setHasDrawing(true);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
    
    // Save cleared state in history
    const dataUrl = canvas.toDataURL();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(dataUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Format action helpers using document.execCommand
  const triggerFormat = (command: string, value: string = '') => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
    }
  };

  // Insert interactive checkbox
  const insertCheckbox = () => {
    const html = `<div class="flex items-start gap-2 my-1.5"><input type="checkbox" class="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 mt-0.5 cursor-pointer" />&nbsp;<span>Tarefa</span></div>`;
    triggerFormat('insertHTML', html);
  };

  // File Upload to base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (editorRef.current) {
        editorRef.current.focus();
        const imgHtml = `<div class="my-3 block"><img src="${base64}" class="max-w-full max-h-[220px] rounded-2xl object-contain shadow-xs hover:shadow-md transition-shadow" referrerPolicy="no-referrer" /></div><p>&nbsp;</p>`;
        document.execCommand('insertHTML', false, imgHtml);
      }
    };
    reader.readAsDataURL(file);
  };

  // Intercept Paste for clipboard images
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const file = e.clipboardData.items[0]?.getAsFile();
    if (file && file.type.startsWith('image/')) {
      e.preventDefault();
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (editorRef.current) {
          editorRef.current.focus();
          const imgHtml = `<div class="my-3 block"><img src="${base64}" class="max-w-full max-h-[220px] rounded-2xl object-contain shadow-xs hover:shadow-md transition-shadow" referrerPolicy="no-referrer" /></div><p>&nbsp;</p>`;
          document.execCommand('insertHTML', false, imgHtml);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (editorRef.current) {
          editorRef.current.focus();
          const imgHtml = `<div class="my-3 block"><img src="${base64}" class="max-w-full max-h-[220px] rounded-2xl object-contain shadow-xs hover:shadow-md transition-shadow" referrerPolicy="no-referrer" /></div><p>&nbsp;</p>`;
          document.execCommand('insertHTML', false, imgHtml);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Persist checkbox toggle status in content HTML string
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
      const checkbox = target as HTMLInputElement;
      if (checkbox.checked) {
        checkbox.setAttribute('checked', 'true');
      } else {
        checkbox.removeAttribute('checked');
      }
    }
  };

  // Load editor content on open
  useEffect(() => {
    if (isOpen) {
      if (editingAnotacao) {
        setTitle(editingAnotacao.title);
        setHasDrawing(!!editingAnotacao.hasDrawing);
        setDrawingTool('cursor');
        
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.innerHTML = editingAnotacao.content || '';
          }
          
          const canvas = canvasRef.current;
          if (canvas && editingAnotacao.drawingData) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const img = new Image();
              img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                
                setHistory([canvas.toDataURL()]);
                setHistoryIndex(0);
              };
              img.src = editingAnotacao.drawingData;
            }
          }
        }, 150);
      } else {
        setTitle('');
        setHasDrawing(false);
        setDrawingTool('cursor');
        setHistory([]);
        setHistoryIndex(-1);
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.innerHTML = '<p>Comece a digitar sua pauta ou nota aqui...</p>';
          }
        }, 150);
      }
    }
  }, [isOpen, editingAnotacao]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalDrawingData = '';
    if (hasDrawing && canvasRef.current) {
      finalDrawingData = canvasRef.current.toDataURL('image/png');
    }

    const finalContent = editorRef.current ? editorRef.current.innerHTML : '';

    if (editingAnotacao) {
      if (onUpdateAnotacao) {
        try {
          await onUpdateAnotacao(editingAnotacao.id, {
            title,
            content: finalContent,
            hasDrawing,
            drawingData: finalDrawingData
          });
          setIsOpen(false);
          resetForm();
        } catch (err) {
          console.error(err);
        }
      }
    } else {
      const payload: Omit<Anotacao, 'id'> = {
        title,
        content: finalContent,
        hasDrawing,
        drawingData: finalDrawingData,
        createdAt: new Date().toISOString().split('T')[0],
        user: currentUser?.name || currentUser?.email || 'Consultor Sênior'
      };

      try {
        await onAddAnotacao(payload);
        setIsOpen(false);
        resetForm();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const resetForm = () => {
    setTitle('');
    setEditingAnotacao(null);
    setHasDrawing(false);
    setDrawingTool('cursor');
    setHistory([]);
    setHistoryIndex(-1);
  };

  const filtered = anotacoes.filter((n) => {
    const q = search.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      (n.entityName && n.entityName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans relative">
      {/* Inline styles for rich Notion-like editing outputs */}
      <style dangerouslySetInnerHTML={{ __html: `
        .notion-editor-sheet h1 {
          font-size: 1.4rem !important;
          font-weight: 900 !important;
          margin-top: 1.25rem !important;
          margin-bottom: 0.5rem !important;
          color: inherit;
        }
        .notion-editor-sheet h2 {
          font-size: 1.15rem !important;
          font-weight: 800 !important;
          margin-top: 1rem !important;
          margin-bottom: 0.35rem !important;
          color: inherit;
        }
        .notion-editor-sheet ul {
          list-style-type: disc !important;
          padding-left: 1.25rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .notion-editor-sheet blockquote {
          border-left: 3px solid #6366f1 !important;
          padding-left: 1rem !important;
          font-style: italic !important;
          background-color: rgba(99, 102, 241, 0.04) !important;
          margin: 0.75rem 0 !important;
          border-radius: 0 0.5rem 0.5rem 0;
        }
      `}} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="text-indigo-600" size={24} />
            Mural de Anotações & Whiteboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Anote insights, crie pautas estilo <strong>Notion</strong>, insira fotos, sublinhe ou rabisque diretamente sobre a nota.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 cursor-pointer transition-all"
        >
          <Plus size={14} /> Nova Nota Notion
        </button>
      </div>

      {/* Search Input */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm">
        <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Pesquisar notas por título, conteúdo ou cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border-0 rounded-2xl py-3 pl-11 pr-4 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
        />
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 font-medium text-xs border-2 border-dashed border-slate-200 dark:border-slate-800/60 rounded-3xl">
            Nenhuma nota registrada ainda. Clique em "Nova Nota Notion" para começar!
          </div>
        ) : (
          filtered.map((note) => {
            const isOwnNote = !currentUser || note.user === currentUser.name || note.user === currentUser.email || currentUser.role === 'Administrador';
            return (
              <div
                key={note.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/50 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-3">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      {isOwnNote && (
                        <button
                          onClick={() => {
                            setEditingAnotacao(note);
                            setTitle(note.title);
                            setHasDrawing(!!note.hasDrawing);
                            setIsOpen(true);
                          }}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => setItemToDeleteId(note.id)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {note.entityName && (
                    <span className="inline-block mt-2 text-[9px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-extrabold uppercase">
                      Vinculado: {note.entityName}
                    </span>
                  )}

                  {/* Aesthetic Paper + Sketch overlaid preview */}
                  <div 
                    onClick={() => {
                      setEditingAnotacao(note);
                      setTitle(note.title);
                      setHasDrawing(!!note.hasDrawing);
                      setIsOpen(true);
                    }}
                    className="relative mt-4 border border-slate-150 dark:border-slate-850 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 aspect-[8/5.5] group cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-900/50 transition-all shadow-inner"
                  >
                    {/* Visual paper layer with actual formatted content */}
                    <div className="absolute inset-0 p-5 overflow-hidden text-[10px] leading-relaxed select-none opacity-85 max-h-full notion-editor-sheet">
                      <div 
                        className="space-y-1.5 [&_img]:max-h-16 [&_img]:rounded-lg [&_img]:object-contain [&_input]:pointer-events-none"
                        dangerouslySetInnerHTML={{ __html: note.content }}
                      />
                    </div>
                    
                    {/* Draw layer overlaid on top */}
                    {note.hasDrawing && note.drawingData && (
                      <img
                        src={note.drawingData}
                        alt="Esboço"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none brightness-100 dark:brightness-95 contrast-105"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-900/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                      <span className="bg-slate-900/95 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow flex items-center gap-1.5 border border-slate-700/50">
                        <Paintbrush size={11} /> Abrir & Rabiscar Nota
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  <span className="flex items-center gap-1.5">
                    <User size={11} className="text-slate-400" /> {note.user}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={11} className="text-slate-400" /> {note.createdAt.split('-').reverse().join('/')}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT WYSIWYG NOTION WORKSPACE */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsOpen(false);
                resetForm();
              }}
              className="fixed inset-0 bg-black/80"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-5xl bg-slate-50 dark:bg-slate-950 h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 dark:border-slate-900"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-900 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-lg">
                    <Sparkles size={16} />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    {editingAnotacao ? 'Modificar Nota Notion' : 'Criar Nova Nota Notion & Rabiscos'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    resetForm();
                  }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-slate-400 cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Integrated Controls Toolbar */}
              <div className="px-6 py-3 border-b border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-900 flex flex-wrap justify-between items-center gap-4 shrink-0 shadow-xs">
                {/* 1. Mode Selector */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold text-slate-600">
                  <button
                    type="button"
                    onClick={() => setDrawingTool('cursor')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      drawingTool === 'cursor' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-xs' : 'hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <MousePointer size={13} /> Digitar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawingTool('pencil')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      drawingTool === 'pencil' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-xs' : 'hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Pencil size={13} /> Caneta
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawingTool('highlighter')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      drawingTool === 'highlighter' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-xs' : 'hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Highlighter size={13} /> Destacar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawingTool('eraser')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      drawingTool === 'eraser' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-xs' : 'hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Eraser size={13} /> Borracha
                  </button>
                </div>

                {/* 2. Format & Drawing Toolbar context controls */}
                <div className="flex items-center gap-3">
                  {drawingTool === 'cursor' ? (
                    /* Formatting commands */
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => triggerFormat('bold')}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                        title="Negrito"
                      >
                        <Bold size={14} />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => triggerFormat('italic')}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                        title="Itálico"
                      >
                        <Italic size={14} />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => triggerFormat('underline')}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                        title="Sublinhar"
                      >
                        <Underline size={14} />
                      </button>

                      <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => triggerFormat('formatBlock', '<h1>')}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                        title="Título Principal"
                      >
                        <Heading1 size={14} />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => triggerFormat('formatBlock', '<h2>')}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                        title="Subtítulo"
                      >
                        <Heading2 size={14} />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => triggerFormat('insertUnorderedList')}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                        title="Lista de Tópicos"
                      >
                        <List size={14} />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={insertCheckbox}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                        title="Inserir Checklist"
                      >
                        <CheckSquare size={14} />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => triggerFormat('formatBlock', '<blockquote>')}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                        title="Citação"
                      >
                        <Quote size={14} />
                      </button>

                      <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

                      <input 
                        type="file" 
                        id="image-upload-sheet-file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('image-upload-sheet-file')?.click()}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-900 text-indigo-600 dark:text-indigo-400 rounded-lg cursor-pointer transition-colors"
                        title="Upload de Imagem"
                      >
                        <FileImage size={14} />
                      </button>
                    </div>
                  ) : (
                    /* Drawing specific controls */
                    <div className="flex items-center gap-2 animate-fade-in bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                      {/* Undo / Redo */}
                      <button
                        type="button"
                        onClick={handleUndo}
                        disabled={historyIndex < 0}
                        className={`p-1.5 rounded-lg transition-colors ${
                          historyIndex >= 0 ? 'hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 cursor-pointer' : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                        }`}
                        title="Desfazer"
                      >
                        <RotateCcw size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={handleRedo}
                        disabled={historyIndex >= history.length - 1}
                        className={`p-1.5 rounded-lg transition-colors ${
                          historyIndex < history.length - 1 ? 'hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 cursor-pointer' : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                        }`}
                        title="Refazer"
                      >
                        <RotateCw size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-slate-400 cursor-pointer transition-colors"
                        title="Limpar Desenho"
                      >
                        <Trash2 size={13} />
                      </button>

                      <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

                      {/* Thickness Selector */}
                      {[2, 4, 8, 14].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setBrushSize(sz)}
                          className={`w-4 h-4 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                            brushSize === sz ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-400/30'
                          }`}
                        >
                          <span className="bg-white rounded-full" style={{ width: `${Math.max(1.5, sz / 2.5)}px`, height: `${Math.max(1.5, sz / 2.5)}px` }} />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Grid Toggle */}
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase">
                    <input
                      type="checkbox"
                      id="wysiwyg-grid"
                      checked={isGridEnabled}
                      onChange={(e) => setIsGridEnabled(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                    />
                    <label htmlFor="wysiwyg-grid" className="cursor-pointer flex items-center gap-1 select-none">
                      <Grid3X3 size={11} /> Grade
                    </label>
                  </div>
                </div>
              </div>

              {/* Work Area / Single Center Sheet Canvas */}
              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
                
                {/* 1. Title Input (Framed like Notion header) */}
                <div className="w-full max-w-4xl mb-4 shrink-0">
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Sem título (Nota do Notion)"
                    className="w-full bg-transparent border-0 border-b border-slate-200/50 dark:border-slate-800/50 pb-2 text-xl text-slate-900 dark:text-white font-extrabold focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* 2. Compound Notion Page Sheet with canvas overlay */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full max-w-4xl aspect-[8/5.5] relative bg-white dark:bg-slate-900 border ${
                    isDraggingFile ? 'border-dashed border-indigo-500 bg-indigo-50/5' : 'border-slate-200 dark:border-slate-800'
                  } rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[460px] max-h-[580px]`}
                >
                  {/* Rich Text Editor Layer (Behind) */}
                  <div
                    ref={editorRef}
                    contentEditable={drawingTool === 'cursor'}
                    onPaste={handlePaste}
                    onClick={handleEditorClick}
                    placeholder="Digite livremente na nota. Você pode colar imagens (Ctrl+V) ou arrastá-las aqui..."
                    className={`absolute inset-0 p-8 overflow-y-auto text-xs text-slate-800 dark:text-slate-100 outline-none leading-relaxed select-text notion-editor-sheet ${
                      drawingTool === 'cursor' ? 'pointer-events-auto z-0' : 'pointer-events-none z-0'
                    }`}
                  />

                  {/* Transparent Canvas Drawing Overlay (In front when tool is selected) */}
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={550}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className={`absolute inset-0 w-full h-full cursor-crosshair ${
                      drawingTool === 'cursor' ? 'pointer-events-none z-0' : 'pointer-events-auto z-10'
                    }`}
                    style={{
                      backgroundImage: isGridEnabled ? 'radial-gradient(circle, currentColor 1.2px, transparent 1.2px)' : 'none',
                      backgroundSize: '24px 24px',
                      color: document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
                    }}
                  />

                  {/* Drag Over Overlay Alert */}
                  {isDraggingFile && (
                    <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-xs rounded-2xl flex items-center justify-center pointer-events-none border-2 border-dashed border-indigo-500 z-30">
                      <span className="bg-white dark:bg-slate-900 text-indigo-600 text-xs font-bold px-4 py-2.5 rounded-xl shadow-md border border-slate-100">
                        Solte sua imagem para inseri-la 🖼️
                      </span>
                    </div>
                  )}

                  {/* Interactive Drawing visual indicator */}
                  {drawingTool !== 'cursor' && (
                    <div className="absolute bottom-3 left-3 bg-slate-900/95 dark:bg-slate-950/95 text-[10px] text-white font-bold px-3 py-1.5 rounded-xl border border-slate-800/80 shadow-md pointer-events-none z-20 flex items-center gap-1.5 select-none uppercase tracking-wide">
                      <Paintbrush size={11} className="text-indigo-400 animate-pulse" />
                      Caneta Ativa: Desenhe, sublinhe ou risque diretamente sobre o texto!
                    </div>
                  )}
                </div>

                {/* 3. Color Palette for Pen/Highlight tools */}
                {drawingTool !== 'cursor' && drawingTool !== 'eraser' && (
                  <div className="mt-4 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-2 shrink-0 shadow-xs animate-fade-in w-full max-w-4xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide mr-1">Paleta de Cores do Rabisco:</span>
                    {drawingColors.map((color) => {
                      const isDark = color.value === '#0f172a';
                      return (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setBrushColor(color.value)}
                          className={`w-6 h-6 rounded-full border cursor-pointer transition-all relative flex items-center justify-center ${
                            brushColor === color.value ? 'scale-115 ring-2 ring-indigo-500/40 border-indigo-600' : 'border-slate-300 dark:border-slate-700 hover:scale-105'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        >
                          {brushColor === color.value && (
                            <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-white' : 'bg-slate-900'} dark:bg-white`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Footer buttons */}
                <div className="w-full max-w-4xl flex gap-3 mt-6 shrink-0">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/10 cursor-pointer hover:shadow-indigo-500/25 active:scale-98"
                  >
                    {editingAnotacao ? 'Confirmar e Salvar Alterações' : 'Criar Nova Nota & Rabiscos'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      resetForm();
                    }}
                    className="py-3 px-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-2xl transition-all cursor-pointer"
                  >
                    Descartar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!itemToDeleteId}
        title="Excluir Anotação"
        message="Deseja realmente remover esta anotação? Informe uma justificativa para prosseguir."
        onConfirm={async (justification) => {
          if (itemToDeleteId) {
            const note = anotacoes.find(n => n.id === itemToDeleteId);
            if (note) {
              await onDeleteAnotacao(itemToDeleteId, justification, note);
            }
          }
          setItemToDeleteId(null);
        }}
        onCancel={() => setItemToDeleteId(null)}
      />
    </div>
  );
}
