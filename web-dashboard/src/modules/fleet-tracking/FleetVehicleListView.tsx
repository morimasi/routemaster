import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CarFront, UserCheck, Search, Plus, X, Star,
  Fuel, Sparkles, Truck
} from 'lucide-react';

interface Vehicle {
  id: string; plate: string; model: string; driver: string; phone: string;
  status: string; capacity: string; fuelLevel: number; rating: number; totalKm: number;
}

interface Driver {
  id: string; name: string; phone: string; rating: number; totalTrips: number; status: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const FleetVehicleListView: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ON_ROUTE' | 'STANDBY' | 'MAINTENANCE'>('ALL');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers'>('vehicles');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newDriver, setNewDriver] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    Promise.all([
      (async () => { try { return await post(`${API_BASE}/api/v5/fleet`, { tenant_id: 't-1001' }); } catch { return []; } })(),
      (async () => { try { return await post(`${API_BASE}/api/v5/fleet/drivers`, { tenant_id: 't-1001' }); } catch { return []; } })(),
    ]).then(([v, d]) => {
      setVehicles((v as Vehicle[]).length ? v as Vehicle[] : [
        { id: 'v1', plate: '34 AB 1234', model: 'Mercedes Sprinter 2024', driver: 'Mehmet Şahin', phone: '0532 111 2233', status: 'ON_ROUTE', capacity: '16 Yolcu', fuelLevel: 85, rating: 4.9, totalKm: 45230 },
        { id: 'v2', plate: '34 CD 5678', model: 'VW Crafter 2023', driver: 'Ali Yılmaz', phone: '0533 222 3344', status: 'WARNING', capacity: '19 Yolcu', fuelLevel: 42, rating: 4.7, totalKm: 38100 },
        { id: 'v3', plate: '34 EF 9012', model: 'Ford Transit 2024', driver: 'Hasan Kaya', phone: '0535 333 4455', status: 'STANDBY', capacity: '16 Yolcu', fuelLevel: 95, rating: 5.0, totalKm: 12400 },
        { id: 'v4', plate: '34 GH 3456', model: 'Otokar Sultan 2023', driver: 'Burak Demir', phone: '0536 444 5566', status: 'MAINTENANCE', capacity: '29 Yolcu', fuelLevel: 15, rating: 4.6, totalKm: 67800 },
      ]);
      setDrivers((d as Driver[]).length ? d as Driver[] : [
        { id: 'd1', name: 'Mehmet Şahin', phone: '0532 111 2233', rating: 4.9, totalTrips: 1240, status: 'ACTIVE' },
        { id: 'd2', name: 'Ali Yılmaz', phone: '0533 222 3344', rating: 4.7, totalTrips: 980, status: 'ACTIVE' },
        { id: 'd3', name: 'Hasan Kaya', phone: '0535 333 4455', rating: 5.0, totalTrips: 1560, status: 'ACTIVE' },
        { id: 'd4', name: 'Burak Demir', phone: '0536 444 5566', rating: 4.6, totalTrips: 670, status: 'ON_LEAVE' },
      ]);
      setLoading(false);
    });
  }, []);

  const filteredVehicles = vehicles.filter(v => {
    const ms = v.plate.toLowerCase().includes(search.toLowerCase()) || v.driver.toLowerCase().includes(search.toLowerCase());
    const mf = filter === 'ALL' || v.status === filter;
    return ms && mf;
  });

  const handleAIAssign = async (vehicleId: string) => {
    setAssigning(vehicleId);
    try { await post(`${API_BASE}/api/v5/fleet/ai-assign`, { tenant_id: 't-1001', vehicle_id: vehicleId }); } catch { /* ignore */ }
    setAssigning(null);
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate || !newDriver) return;
    try {
      await post(`${API_BASE}/api/v5/fleet/vehicle`, { tenant_id: 't-1001', plate: newPlate.toUpperCase(), model: newModel, driver: newDriver, phone: newPhone });
      const fresh = await post(`${API_BASE}/api/v5/fleet`, { tenant_id: 't-1001' });
      setVehicles(fresh as Vehicle[]);
    } catch { /* ignore */ }
    setNewPlate(''); setNewModel(''); setNewDriver(''); setNewPhone(''); setShowAddModal(false);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'ON_ROUTE': return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30';
      case 'WARNING': return 'text-amber-400 bg-amber-950/60 border-amber-500/30';
      case 'MAINTENANCE': return 'text-red-400 bg-red-950/60 border-red-500/30';
      default: return 'text-slate-400 bg-slate-950/60 border-slate-700/30';
    }
  };
  const statusLabel = (s: string) => s === 'ON_ROUTE' ? 'Yolda' : s === 'WARNING' ? 'Dikkat' : s === 'MAINTENANCE' ? 'Bakımda' : 'Beklemede';

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/50 text-[9px] font-bold">
          <button onClick={() => setActiveTab('vehicles')} className={`px-2.5 py-1.5 rounded-md flex items-center gap-1 transition-all ${activeTab === 'vehicles' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}><Truck className="w-3 h-3" />Araçlar</button>
          <button onClick={() => setActiveTab('drivers')} className={`px-2.5 py-1.5 rounded-md flex items-center gap-1 transition-all ${activeTab === 'drivers' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}><UserCheck className="w-3 h-3" />Sürücüler</button>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Ara..." value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-900/80 border border-slate-800 text-white text-[9px] rounded-lg pl-7 pr-2 py-1.5 w-28 focus:outline-none focus:border-blue-500" />
          </div>
          {activeTab === 'vehicles' && (
            <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[9px] px-2 py-1.5 rounded-lg transition-all flex items-center gap-1">
              <Plus className="w-3 h-3" />Ekle
            </button>
          )}
        </div>
      </div>

      {activeTab === 'vehicles' && (
        <>
          <div className="flex gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/50 text-[9px] font-bold w-fit">
            {(['ALL', 'ON_ROUTE', 'STANDBY', 'MAINTENANCE'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-2 py-1 rounded-md transition-all ${filter === f ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                {f === 'ALL' ? 'Tümü' : f === 'ON_ROUTE' ? 'Yolda' : f === 'STANDBY' ? 'Beklemede' : 'Bakım'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredVehicles.length === 0 ? (
              <div className="col-span-full text-center py-6 text-slate-500 text-[10px]">Araç bulunamadı</div>
            ) : filteredVehicles.map((v, i) => (
              <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-blue-500/30 transition-all space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400"><CarFront className="w-4 h-4" /></div>
                    <div className="min-w-0"><h3 className="font-bold text-xs truncate">{v.plate}</h3><p className="text-[9px] text-slate-400 truncate">{v.model}</p></div>
                  </div>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${statusColor(v.status)}`}>{statusLabel(v.status)}</span>
                </div>
                <div>
                  <div className="flex justify-between text-[8px] text-slate-400 font-bold mb-0.5">
                    <span className="flex items-center gap-1"><Fuel className="w-2.5 h-2.5 text-amber-400" />Yakıt</span>
                    <span>%{v.fuelLevel}</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${v.fuelLevel > 50 ? 'bg-emerald-500' : v.fuelLevel > 20 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${v.fuelLevel}%` }} />
                  </div>
                </div>
                <div className="pt-1.5 border-t border-slate-800/80 space-y-1 text-[9px] text-slate-300">
                  <div className="flex justify-between"><span className="text-slate-500">Sürücü:</span><span className="font-bold text-white truncate ml-2">{v.driver}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Tel:</span><span className="text-slate-200">{v.phone}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Puan:</span><span className="font-bold text-amber-400 flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-amber-400" />{v.rating}</span></div>
                </div>
                <button onClick={() => handleAIAssign(v.id)} disabled={assigning === v.id}
                  className="w-full py-1.5 rounded-lg bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 text-purple-300 text-[9px] font-bold flex items-center justify-center gap-1.5 hover:border-purple-500 transition-all disabled:opacity-50">
                  <Sparkles className="w-3 h-3" />AI Sürücü Ata
                </button>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'drivers' && (
        <div className="space-y-1.5">
          {drivers.filter(d => d.name.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-[10px]">Sürücü bulunamadı</div>
          ) : drivers.filter(d => d.name.toLowerCase().includes(search.toLowerCase())).map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs">{d.name.charAt(0)}</div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{d.name}</p>
                  <p className="text-[9px] text-slate-400">{d.phone}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[8px] text-slate-500">
                    <span className="flex items-center gap-0.5"><Star className="w-2 h-2 text-amber-400" />{d.rating}</span><span>•</span><span>{d.totalTrips} sefer</span>
                    <span className={`px-1 py-0.5 rounded-full border text-[8px] font-bold ${d.status === 'ACTIVE' ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' : 'text-amber-400 bg-amber-950/60 border-amber-500/30'}`}>
                      {d.status === 'ACTIVE' ? 'Aktif' : 'İzinli'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-4 shadow-2xl space-y-3 text-white relative"
            >
              <button onClick={() => setShowAddModal(false)} className="absolute top-3 right-3 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
              <div className="flex items-center gap-2"><div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400"><CarFront className="w-4 h-4" /></div><div><h3 className="font-bold text-sm">Araç Ekle</h3><p className="text-[10px] text-slate-400">Yeni araç ve sürücü kaydı</p></div></div>
              <form onSubmit={handleAddVehicle} className="space-y-2.5 text-[10px]">
                <input type="text" required placeholder="Plaka" value={newPlate} onChange={e => setNewPlate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
                <input type="text" placeholder="Model" value={newModel} onChange={e => setNewModel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
                <input type="text" required placeholder="Sürücü Adı" value={newDriver} onChange={e => setNewDriver(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
                <input type="text" placeholder="Telefon" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold text-[10px]">İptal</button>
                  <button type="submit" className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-white text-[10px] shadow-lg shadow-blue-600/30">Kaydet</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
