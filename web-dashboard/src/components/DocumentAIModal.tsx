import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUp, Sparkles, CheckCircle2, X, MapPin } from 'lucide-react';
import { ShuttleXApiService } from '../services/api';
import { DocumentAINode } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNodesImported?: (nodes: DocumentAINode[]) => void;
}

export const DocumentAIModal: React.FC<Props> = ({ isOpen, onClose, onNodesImported }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedNodes, setExtractedNodes] = useState<DocumentAINode[]>([]);

  const handleSimulateUpload = async () => {
    setIsAnalyzing(true);
    setExtractedNodes([]);

    try {
      const nodes = await ShuttleXApiService.ingestDocumentAI();
      setExtractedNodes(nodes);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmImport = () => {
    if (extractedNodes.length > 0) {
      onNodesImported?.(extractedNodes);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 text-white relative"
        >
          {/* Close Button */}
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600/20 border border-purple-500/40 rounded-2xl flex items-center justify-center text-purple-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold">Document AI (Vision-LLM OCR)</h2>
              <p className="text-xs text-slate-400">Fotoğraf, WhatsApp listesi veya kağıttan otomatik durak çıkarımı</p>
            </div>
          </div>

          {/* Upload Area */}
          <div
            onClick={handleSimulateUpload}
            className="border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 bg-purple-950/10 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3"
          >
            <FileUp className="w-12 h-12 text-purple-400 mx-auto" />
            <div>
              <p className="font-bold text-sm">Görüntü / Kağıt Listesi Yükleyin veya Sürükleyin</p>
              <p className="text-xs text-slate-400 mt-1">JPEG, PNG, PDF (Vision AI NER Motoru ile saniyeler içinde çözümlenir)</p>
            </div>
          </div>

          {/* Loading Animation */}
          {isAnalyzing && (
            <div className="text-center py-6 space-y-3">
              <Sparkles className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-purple-300">Yapay Zeka Görseli Analiz Ediyor & Geocoding Koordinatları Eşliyor...</p>
            </div>
          )}

          {/* Results List */}
          {extractedNodes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-300 flex items-center justify-between">
                <span>ÇIKARILAN ROTA DÜĞÜMLERİ ({extractedNodes.length})</span>
                <span className="text-xs text-emerald-400 font-medium">POST /api/v5/routes/ingest-document</span>
              </h3>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {extractedNodes.map((node) => (
                  <div key={node.id} className="glass-panel p-3.5 flex items-center justify-between text-xs border-slate-800">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{node.student}</span>
                        <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                          Güven: %{Math.round(node.confidence * 100)}
                        </span>
                      </div>
                      <p className="text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-purple-400" />
                        <span>{node.address}</span>
                      </p>
                    </div>

                    <div className="text-right text-[10px] text-slate-500">
                      <span>GPS: {node.geo}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold">
                  İptal
                </button>
                <button onClick={handleConfirmImport} className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/30 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Düğümleri Rotaya Ekle ({extractedNodes.length})</span>
                </button>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
