import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, FileUp, CheckCircle2, X, MapPin, Trash2, 
  Camera, Image, Route
} from 'lucide-react';
import { PhotoRouteApiService } from './api';
import type { DocumentAINode } from './types';

interface PhotoRouteModuleProps {
  isOpen: boolean;
  onClose: () => void;
  onNodesImported?: (nodes: DocumentAINode[]) => void;
}

type UploadMode = 'camera' | 'gallery' | 'file';

export const PhotoRouteModule: React.FC<PhotoRouteModuleProps> = ({ isOpen, onClose, onNodesImported }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedNodes, setExtractedNodes] = useState<DocumentAINode[]>([]);
  const [minConfidence, setMinConfidence] = useState(0.85);
  const [uploadMode, setUploadMode] = useState<UploadMode | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleSimulateUpload = useCallback(async () => {
    setIsAnalyzing(true);
    setExtractedNodes([]);
    try {
      const nodes = await PhotoRouteApiService.analyzeImage('t-1001', '');
      setExtractedNodes(nodes);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    handleSimulateUpload();
  }, [handleSimulateUpload]);

  const handleRemoveNode = (id: number | string) => {
    setExtractedNodes((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNodes = extractedNodes.filter((n) => n.confidence >= minConfidence);

  const handleConfirmImport = () => {
    if (filteredNodes.length > 0) {
      onNodesImported?.(filteredNodes);
    }
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setExtractedNodes([]);
    setPreviewUrl(null);
    setUploadMode(null);
    setIsAnalyzing(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl text-white relative"
        >
          <button onClick={handleClose} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-white z-10 p-2 rounded-full hover:bg-slate-800/50">
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border border-purple-500/40 rounded-2xl flex items-center justify-center text-purple-400 flex-shrink-0">
              <Route className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-display font-bold">Fotoğraftan Rota</h2>
              <p className="text-[10px] sm:text-xs text-slate-400">Fotoğraf, liste veya kağıttan otomatik durak çıkarımı</p>
            </div>
          </div>

          {!uploadMode && !previewUrl && extractedNodes.length === 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => { setUploadMode('camera'); setTimeout(() => cameraInputRef.current?.click(), 100); }}
                className="flex flex-col items-center gap-2 p-4 sm:p-5 rounded-2xl border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 bg-purple-950/10 hover:bg-purple-950/20 transition-all"
              >
                <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" />
                <span className="text-[10px] sm:text-xs font-bold text-purple-300">Kamera</span>
              </button>
              <button
                onClick={() => { setUploadMode('gallery'); setTimeout(() => fileInputRef.current?.click(), 100); }}
                className="flex flex-col items-center gap-2 p-4 sm:p-5 rounded-2xl border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 bg-purple-950/10 hover:bg-purple-950/20 transition-all"
              >
                <Image className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" />
                <span className="text-[10px] sm:text-xs font-bold text-purple-300">Galeri</span>
              </button>
              <button
                onClick={() => { setUploadMode('file'); handleSimulateUpload(); }}
                className="flex flex-col items-center gap-2 p-4 sm:p-5 rounded-2xl border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 bg-purple-950/10 hover:bg-purple-950/20 transition-all"
              >
                <FileUp className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" />
                <span className="text-[10px] sm:text-xs font-bold text-purple-300">Dosya</span>
              </button>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />

          {previewUrl && (
            <div className="relative mb-4 rounded-2xl overflow-hidden border border-slate-800">
              <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
              <button onClick={() => { setPreviewUrl(null); setUploadMode(null); }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center py-6 sm:py-8 space-y-3">
              <div className="relative w-12 h-12 mx-auto">
                <Sparkles className="w-12 h-12 text-purple-400 animate-spin-slow" />
                <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-purple-300">AI Görsel Analiz Ediliyor...</p>
              <p className="text-[10px] text-slate-500">OCR + Geocoding koordinat eşleme</p>
            </div>
          )}

          {extractedNodes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300">DURAKLAR ({filteredNodes.length})</h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span>Min: %{Math.round(minConfidence * 100)}</span>
                  <input
                    type="range"
                    min="0.5"
                    max="0.99"
                    step="0.05"
                    value={minConfidence}
                    onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                    className="w-20 accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1 scroll-smooth-mobile">
                {filteredNodes.map((node) => (
                  <div key={node.id} className="glass-panel p-3 flex items-center justify-between border-slate-800">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="font-bold text-white text-xs flex items-center gap-2">
                        <span className="truncate">{node.student}</span>
                        <span className="text-[9px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 flex-shrink-0">
                          %{Math.round(node.confidence * 100)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-purple-400 flex-shrink-0" />
                        <span className="truncate">{node.address}</span>
                      </p>
                    </div>
                    <button onClick={() => handleRemoveNode(node.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors ml-2 flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                <button onClick={handleClose} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold w-full sm:w-auto">
                  İptal
                </button>
                <button onClick={handleConfirmImport} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 w-full sm:w-auto">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Rotaya Ekle ({filteredNodes.length})</span>
                </button>
              </div>
            </div>
          )}

          {!isAnalyzing && extractedNodes.length === 0 && previewUrl === null && uploadMode === null && (
            <div className="text-center py-4">
              <p className="text-[10px] text-slate-500">Görüntü yükleyin, AI otomatik durak çıkarımı yapsın</p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
