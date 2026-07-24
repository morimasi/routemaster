import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, FileUp, X, Download, Eye, Trash2, Search,
  FileSpreadsheet, FileImage, File, CheckCircle2,
  Upload, RefreshCw
} from 'lucide-react';
import { DocumentApiService } from './api';
import type { DocumentItem } from './types';

const typeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />,
  image: <FileImage className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />,
  spreadsheet: <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />,
  other: <File className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />,
};

const statusConfig: Record<string, { label: string; color: string }> = {
  processed: { label: 'İşlenmiş', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' },
  processing: { label: 'İşleniyor', color: 'text-blue-400 bg-blue-950/60 border-blue-500/30' },
  pending: { label: 'Bekliyor', color: 'text-amber-400 bg-amber-950/60 border-amber-500/30' },
  error: { label: 'Hata', color: 'text-red-400 bg-red-950/60 border-red-500/30' },
};

interface DocumentModuleProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentModule: React.FC<DocumentModuleProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'processed' | 'processing' | 'error'>('all');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    const docs = await DocumentApiService.getDocuments('t-1001');
    setDocuments(docs);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) loadDocs();
  }, [isOpen, loadDocs]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    await DocumentApiService.uploadDocument('t-1001', file);
    setIsUploading(false);
    loadDocs();
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDelete = async (doc: DocumentItem) => {
    await DocumentApiService.deleteDocument('t-1001', doc.id);
    setSelectedDoc(null);
    loadDocs();
  };

  const filteredDocs = documents.filter((doc) => {
    const matchSearch = doc.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || doc.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: documents.length,
    processed: documents.filter((d) => d.status === 'processed').length,
    processing: documents.filter((d) => d.status === 'processing').length,
    error: documents.filter((d) => d.status === 'error').length,
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl text-white relative"
        >
          <div className="p-3 sm:p-6 border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600/30 to-emerald-600/30 border border-blue-500/40 rounded-xl sm:rounded-2xl flex items-center justify-center text-blue-400 flex-shrink-0">
                  <FileText className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-display font-bold">Belgeler</h2>
                  <p className="text-[9px] sm:text-xs text-slate-400">Rota listeleri ve dökümanlar</p>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 sm:p-2 rounded-full hover:bg-slate-800/50">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-3 sm:mt-4">
              {[
                { label: 'Toplam', value: stats.total, color: 'text-blue-400' },
                { label: 'İşlenmiş', value: stats.processed, color: 'text-emerald-400' },
                { label: 'İşleniyor', value: stats.processing, color: 'text-amber-400' },
                { label: 'Hata', value: stats.error, color: 'text-red-400' },
              ].map((s) => (
                <div key={s.label} className="bg-slate-950 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 text-center border border-slate-800">
                  <span className={`text-sm sm:text-xl font-black font-display ${s.color}`}>{s.value}</span>
                  <p className="text-[7px] sm:text-[9px] text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 sm:p-6 flex-1 overflow-y-auto space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 sm:left-3 top-2 sm:top-2.5" />
                <input type="text" placeholder="Belge ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white text-[10px] sm:text-xs rounded-xl pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2.5 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex gap-1 bg-slate-900/80 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-slate-800 text-[8px] sm:text-[10px] font-bold flex-shrink-0 overflow-x-auto">
                {(['all', 'processed', 'processing', 'error'] as const).map((f) => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg transition-colors whitespace-nowrap ${filter === f ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                    {f === 'all' ? 'Tümü' : f === 'processed' ? 'İşlenmiş' : f === 'processing' ? 'İşleniyor' : 'Hata'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => fileRef.current?.click()} disabled={isUploading} className="flex-1 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-600/20 to-emerald-600/20 border border-blue-500/40 hover:border-blue-500 text-blue-300 text-[9px] sm:text-xs font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all">
                <Upload className={`w-3 h-3 sm:w-4 sm:h-4 ${isUploading ? 'animate-bounce' : ''}`} />
                <span>{isUploading ? 'Yükleniyor...' : 'Yükle'}</span>
              </button>
              <button onClick={loadDocs} disabled={loading} className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] sm:text-xs font-bold flex items-center gap-1.5 transition-all">
                <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <input ref={fileRef} type="file" onChange={handleUpload} className="hidden" accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.doc,.docx" />

            <div className="space-y-1.5 sm:space-y-2">
              {loading ? (
                <div className="text-center py-6">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-[10px] sm:text-xs">Belge bulunamadı</div>
              ) : filteredDocs.map((doc) => (
                <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-2 sm:p-3 bg-slate-950 rounded-lg sm:rounded-xl border border-slate-800 flex items-center gap-2 sm:gap-3 group hover:border-slate-700 transition-colors cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                  <div className="flex-shrink-0">{typeIcons[doc.type] || typeIcons.other}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs font-bold text-white truncate">{doc.name}</p>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[7px] sm:text-[9px] text-slate-500 mt-0.5">
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span>{doc.date}</span>
                      {doc.pages && <><span>•</span><span>{doc.pages} sf</span></>}
                    </div>
                  </div>
                  <span className={`text-[7px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border ${statusConfig[doc.status]?.color || 'text-slate-400 bg-slate-950/60'} flex-shrink-0`}>
                    {statusConfig[doc.status]?.label || doc.status}
                  </span>
                  <button className="p-1 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"><Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></button>
                </motion.div>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {selectedDoc && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl text-white relative">
                  <button onClick={() => setSelectedDoc(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="p-2 sm:p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">{typeIcons[selectedDoc.type] || typeIcons.other}</div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm sm:text-base truncate">{selectedDoc.name}</h3>
                      <p className="text-[9px] sm:text-xs text-slate-400">{selectedDoc.size} • {selectedDoc.date}</p>
                    </div>
                  </div>
                  <div className="space-y-2 sm:space-y-3 text-[10px] sm:text-xs">
                    <div className="flex justify-between p-2.5 sm:p-3 bg-slate-950 rounded-xl border border-slate-800"><span className="text-slate-400">Tür</span><span className="font-bold text-white">{selectedDoc.type.toUpperCase()}</span></div>
                    <div className="flex justify-between p-2.5 sm:p-3 bg-slate-950 rounded-xl border border-slate-800"><span className="text-slate-400">Durum</span><span className={`font-bold ${statusConfig[selectedDoc.status]?.color.split(' ')[0] || 'text-slate-400'}`}>{statusConfig[selectedDoc.status]?.label || selectedDoc.status}</span></div>
                    {selectedDoc.pages && <div className="flex justify-between p-2.5 sm:p-3 bg-slate-950 rounded-xl border border-slate-800"><span className="text-slate-400">Sayfa</span><span className="font-bold text-white">{selectedDoc.pages}</span></div>}
                  </div>
                  <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                    <button onClick={() => setSelectedDoc(null)} className="flex-1 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[9px] sm:text-xs font-bold">Kapat</button>
                    <button onClick={() => handleDelete(selectedDoc)} className="flex-1 py-2 sm:py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-300 text-[9px] sm:text-xs font-bold flex items-center justify-center gap-1.5"><Trash2 className="w-3 h-3" /> Sil</button>
                    <button className="flex-1 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-[9px] sm:text-xs font-bold flex items-center justify-center gap-1.5"><Eye className="w-3 h-3" /> Gör</button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
