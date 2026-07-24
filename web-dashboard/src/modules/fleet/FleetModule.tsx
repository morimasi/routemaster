import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CarFront, Phone, ShieldCheck, UserCheck, Search, Plus, X, Star,
  Fuel, Wrench, Sparkles, Users, Truck, BarChart3
} from 'lucide-react';
import { useWindowSize } from '../../hooks/useWindowSize';
import { FleetApiService } from './api';
import type { FleetVehicle, FleetDriver } from './types';

type FleetTab = 'vehicles' | 'drivers';

export const FleetModule: React.FC = () => {
  const { isMobile } = useWindowSize();
  const [activeTab, setActiveTab] = useState<FleetTab>('vehicles');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ON_ROUTE' | 'STANDBY' | 'MAINTENANCE'>('ALL');
  const [fleet, setFleet] = useState<FleetVehicle[]>([]);
  const [drivers, setDrivers] = useState<FleetDriver[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newPlate, setNewPlate] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newDriver, setNewDriver] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    Promise.all([
      FleetApiService.getFleet('t-1001'),
      FleetApiService.getDrivers('t-1001'),
    ]).then(([v, d]) => {
      setFleet(v);
      setDrivers(d);
      setLoading(false);
    });
  }, []);

  const filteredFleet = fleet.filter((v) => {
    const matchSearch = v.plate.toLowerCase().includes(search.toLowerCase()) || v.driver.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || v.status === filter;
    return matchSearch && matchFilter;
  });

  const filteredDrivers = drivers.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) || d.phone.includes(search)
  );

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate || !newDriver) return;
    const result = await FleetApiService.addVehicle('t-1001', { plate: newPlate.toUpperCase(), model: newModel, driver: newDriver, phone: newPhone });
    if (result.status === 'CREATED') {
      const fresh = await FleetApiService.getFleet('t-1001');
      setFleet(fresh);
    }
    setNewPlate(''); setNewModel(''); setNewDriver(''); setNewPhone('');
    setIsAddModalOpen(false);
  };

  const handleAIAssign = async (vehicleId: string) => {
    const result = await FleetApiService.assignDriverAI('t-1001', vehicleId);
    if (result.status === 'ASSIGNED') {
      const fresh = await FleetApiService.getFleet('t-1001');
      setFleet(fresh);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Filo yükleniyor...</p>
        </div>
      </div>
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'ON_ROUTE': return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30';
      case 'WARNING': return 'text-amber-400 bg-amber-950/60 border-amber-500/30';
      case 'MAINTENANCE': return 'text-red-400 bg-red-950/60 border-red-500/30';
      default: return 'text-slate-400 bg-slate-950/60 border-slate-700/30';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'ON_ROUTE': return 'Yolda';
      case 'WARNING': return 'Dikkat';
      case 'MAINTENANCE': return 'Bakımda';
      case 'OFFLINE': return 'Çevrimdışı';
      default: return 'Beklemede';
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 px-0.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-white">Filo Yönetimi</h2>
          <div className="flex gap-1 bg-slate-900/80 p-0.5 rounded-xl border border-slate-800 text-[9px] sm:text-xs font-bold">
            <button onClick={() => setActiveTab('vehicles')} className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${activeTab === 'vehicles' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
              <Truck className="w-3 h-3" /> Araçlar
            </button>
            <button onClick={() => setActiveTab('drivers')} className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${activeTab === 'drivers' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
              <Users className="w-3 h-3" /> Sürücüler
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input type="text" placeholder="Ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-slate-900/80 border border-slate-800 text-white text-[10px] sm:text-xs rounded-xl pl-8 pr-3 py-2 w-32 sm:w-48 focus:outline-none focus:border-blue-500" />
          </div>
          {activeTab === 'vehicles' && (
            <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] sm:text-xs px-3 py-2 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              {isMobile ? '' : 'Araç Ekle'}
            </button>
          )}
        </div>
      </div>

      {activeTab === 'vehicles' && (
        <>
          <div className="flex gap-1 bg-slate-900/80 p-0.5 rounded-xl border border-slate-800 text-[9px] sm:text-[10px] font-bold w-fit">
            <button onClick={() => setFilter('ALL')} className={`px-2 py-1 rounded-lg ${filter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Tümü</button>
            <button onClick={() => setFilter('ON_ROUTE')} className={`px-2 py-1 rounded-lg ${filter === 'ON_ROUTE' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Yolda</button>
            <button onClick={() => setFilter('STANDBY')} className={`px-2 py-1 rounded-lg ${filter === 'STANDBY' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}>Beklemede</button>
            <button onClick={() => setFilter('MAINTENANCE')} className={`px-2 py-1 rounded-lg ${filter === 'MAINTENANCE' ? 'bg-red-600 text-white' : 'text-slate-400'}`}>Bakım</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredFleet.length === 0 ? (
              <div className="col-span-full text-center py-6 text-slate-500 text-xs">Araç bulunamadı</div>
            ) : filteredFleet.map((v, i) => (
              <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="p-3 sm:p-4 bg-slate-900/60 border border-slate-800 rounded-xl sm:rounded-2xl hover:border-blue-500/30 transition-all space-y-3 group">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 flex-shrink-0">
                        <CarFront className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-xs sm:text-sm truncate">{v.plate}</h3>
                        <p className="text-[8px] sm:text-[10px] text-slate-400 truncate">{v.model}</p>
                      </div>
                    </div>
                    <span className={`text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border ${statusColor(v.status)} flex-shrink-0`}>
                      {statusLabel(v.status)}
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between text-[8px] sm:text-[10px] text-slate-400 font-bold mb-0.5">
                      <span className="flex items-center gap-1"><Fuel className="w-2.5 h-2.5 text-amber-400" /> Yakıt</span>
                      <span>%{v.fuelLevel}</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${v.fuelLevel > 50 ? 'bg-emerald-500' : v.fuelLevel > 20 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${v.fuelLevel}%` }} />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[8px] sm:text-[10px] text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1"><UserCheck className="w-2.5 h-2.5 text-blue-400" /> Sürücü:</span>
                      <span className="font-bold text-white truncate ml-2">{v.driver}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1"><Phone className="w-2.5 h-2.5 text-emerald-400" /> Tel:</span>
                      <span className="font-medium text-slate-200">{v.phone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1"><ShieldCheck className="w-2.5 h-2.5 text-purple-400" /> Puan:</span>
                      <span className="font-bold text-amber-400 flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-amber-400" /> {v.rating}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAIAssign(v.id)}
                    className="w-full py-1.5 px-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 text-purple-300 text-[9px] font-bold flex items-center justify-center gap-1.5 hover:border-purple-500 transition-all"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>AI Sürücü Ata</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'drivers' && (
        <div className="space-y-2">
          {filteredDrivers.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">Sürücü bulunamadı</div>
          ) : filteredDrivers.map((d, i) => (
            <motion.div
              key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="p-3 sm:p-4 bg-slate-900/60 border border-slate-800 rounded-xl sm:rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {d.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-white truncate">{d.name}</p>
                  <p className="text-[9px] sm:text-xs text-slate-400">{d.phone} • {d.licenseNumber}</p>
                  <div className="flex items-center gap-2 mt-1 text-[8px] sm:text-[10px] text-slate-500">
                    <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 text-amber-400" /> {d.rating}</span>
                    <span>•</span>
                    <span>{d.totalTrips} sefer</span>
                    <span className={`px-1.5 py-0.5 rounded-full border text-[8px] font-bold ${
                      d.status === 'ACTIVE' ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' : 'text-amber-400 bg-amber-950/60 border-amber-500/30'
                    }`}>
                      {d.status === 'ACTIVE' ? 'Aktif' : 'İzinli'}
                    </span>
                  </div>
                </div>
              </div>
              <button className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors">
                <Wrench className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4 text-white relative"
            >
              <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400"><CarFront className="w-5 h-5" /></div>
                <div><h3 className="font-bold text-base">Araç Ekle</h3><p className="text-[10px] text-slate-400">Yeni araç ve sürücü kaydı</p></div>
              </div>
              <form onSubmit={handleAddVehicle} className="space-y-3 text-[10px] sm:text-xs">
                <div><label className="block text-slate-400 mb-1 font-semibold">Plaka</label><input type="text" required placeholder="34 ABC 123" value={newPlate} onChange={(e) => setNewPlate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500" /></div>
                <div><label className="block text-slate-400 mb-1 font-semibold">Model</label><input type="text" placeholder="Mercedes Sprinter 2024" value={newModel} onChange={(e) => setNewModel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500" /></div>
                <div><label className="block text-slate-400 mb-1 font-semibold">Sürücü</label><input type="text" required placeholder="Ad Soyad" value={newDriver} onChange={(e) => setNewDriver(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500" /></div>
                <div><label className="block text-slate-400 mb-1 font-semibold">Telefon</label><input type="text" placeholder="0532 000 0000" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500" /></div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold">İptal</button>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-lg shadow-blue-600/30">Kaydet</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
