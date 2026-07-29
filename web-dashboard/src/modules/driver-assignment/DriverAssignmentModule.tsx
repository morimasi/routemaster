import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck, Truck, Sparkles, RefreshCw,
  CheckCircle, Activity, Clock
} from 'lucide-react';
import { DriverAssignmentApiService } from './api';
import type { AssignResult } from './api';

interface Vehicle { id: string; plate: string; brand: string; model: string; year: number; capacity: number; status: string; }
interface Driver { id: string; name: string; phone: string; email: string; licenseNumber: string; rating: number; totalTrips: number; status: string; }

export const DriverAssignmentModule: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [results, setResults] = useState<Map<string, AssignResult>>(new Map());
  const [activeTab, setActiveTab] = useState<'assign' | 'history'>('assign');

  useEffect(() => {
    Promise.all([
      DriverAssignmentApiService.getVehicles('t-1001'),
      DriverAssignmentApiService.getDrivers('t-1001'),
    ]).then(([v, d]) => {
      setVehicles(Array.isArray(v) ? v as Vehicle[] : []);
      setDrivers(Array.isArray(d) ? d as Driver[] : []);
      setLoading(false);
    });
  }, []);

  const handleAssign = useCallback(async (vehicleId: string) => {
    setAssigning(vehicleId);
    try {
      const result = await DriverAssignmentApiService.assignDriverAI('t-1001', vehicleId);
      setResults(prev => new Map(prev).set(vehicleId, result));
    } finally {
      setAssigning(null);
    }
  }, []);

  const bestDriver = (): Driver | null => {
    if (!Array.isArray(drivers) || drivers.length === 0) return null;
    return drivers.filter(d => d.status === 'ACTIVE').sort((a, b) => b.rating - a.rating)[0] || null;
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'ON_ROUTE': return 'text-emerald-400 bg-emerald-500/10';
      case 'STANDBY': return 'text-slate-400 bg-slate-500/10';
      case 'WARNING': return 'text-amber-400 bg-amber-500/10';
      case 'IDLE': return 'text-yellow-400 bg-yellow-500/10';
      case 'MAINTENANCE': return 'text-red-400 bg-red-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
          <p className="text-xs text-slate-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const unassignedVehicles = vehicles.filter(v => v.status === 'STANDBY' || v.status === 'IDLE');
  const assignedResults = Array.from(results.entries());

  return (
    <div className="space-y-3 sm:space-y-4 p-2 sm:p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-600/30 to-orange-600/30 border border-amber-500/30 rounded-lg flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Sürücü Atama</h2>
            <p className="text-[9px] text-slate-500">AI Destekli Eşleştirme</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setActiveTab('assign')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'assign' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
          <Truck className="w-3 h-3 inline mr-1" />Ataç
        </button>
        <button onClick={() => setActiveTab('history')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
          <Activity className="w-3 h-3 inline mr-1" />Geçmiş
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'assign' ? (
          <motion.div key="assign" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {unassignedVehicles.length === 0 ? (
              <div className="text-center py-8 bg-slate-900/50 rounded-xl border border-slate-800/60">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Atanmayı bekleyen araç yok</p>
              </div>
            ) : unassignedVehicles.map((vehicle, i) => {
              const result = results.get(vehicle.id);
              const driver = bestDriver();
              return (
                <motion.div key={vehicle.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold">{vehicle.plate}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${statusColor(vehicle.status)}`}>
                        {vehicle.status === 'STANDBY' ? 'Beklemede' : 'Rölanti'}
                      </span>
                    </div>
                    {!result ? (
                      <button
                        onClick={() => handleAssign(vehicle.id)}
                        disabled={assigning === vehicle.id}
                        className="px-2.5 py-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all"
                      >
                        {assigning === vehicle.id
                          ? <RefreshCw className="w-3 h-3 animate-spin" />
                          : <Sparkles className="w-3 h-3" />}
                        AI Ata
                      </button>
                    ) : (
                      <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />Atandı
                      </span>
                    )}
                  </div>
                  {result ? (
                    <div className="bg-slate-950/60 rounded-lg p-2 border border-emerald-800/40">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                          {driver?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-white">{driver?.name || 'Bilinmiyor'}</p>
                          <p className="text-[8px] text-slate-500">{driver?.phone}</p>
                        </div>
                        <div className="ml-auto text-right">
                          <p className="text-[9px] text-emerald-400 font-bold">%{Math.round(result.confidence * 100)} eşleşme</p>
                          <p className="text-[8px] text-slate-500">★ {driver?.rating}</p>
                        </div>
                      </div>
                      <p className="text-[8px] text-slate-400 italic">{result.reason}</p>
                    </div>
                  ) : driver && (
                    <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                          {driver.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold">{driver.name}</p>
                          <p className="text-[8px] text-slate-500">{driver.totalTrips} sefer • ★ {driver.rating}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {assignedResults.length === 0 ? (
              <div className="text-center py-8 bg-slate-900/50 rounded-xl border border-slate-800/60">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Henüz atama yapılmadı</p>
              </div>
            ) : assignedResults.map(([vehicleId, result]) => {
              const v = (Array.isArray(vehicles) ? vehicles : []).find(v => v.id === vehicleId);
              const d = (Array.isArray(drivers) ? drivers : []).find(d => d.id === result.driver_id);
              return (
                <div key={vehicleId} className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-[10px] font-bold">{v?.plate || vehicleId}</p>
                      <p className="text-[8px] text-slate-500">{d?.name || 'Bilinmiyor'}</p>
                    </div>
                  </div>
                  <span className="text-[9px] text-emerald-400 font-bold">%{Math.round(result.confidence * 100)}</span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
