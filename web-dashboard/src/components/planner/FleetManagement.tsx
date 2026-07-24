import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CarFront, Phone, ShieldCheck, UserCheck, Search, Plus, X, Star, Fuel } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import type { Vehicle } from '../../types';

export const FleetManagement: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ON_ROUTE' | 'STANDBY' | 'MAINTENANCE'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [fleet, setFleet] = useState<Vehicle[]>([
    { id: 'v1', plate: '34 AB 1234', model: 'Mercedes-Benz Sprinter 2024', driver: 'Mehmet Şahin', phone: '0532 111 2233', status: 'ON_ROUTE', capacity: '16 Yolcu', fuelLevel: 85, rating: 4.9 },
    { id: 'v2', plate: '34 CD 5678', model: 'Volkswagen Crafter 2023', driver: 'Ali Yılmaz', phone: '0533 222 3344', status: 'WARNING', capacity: '19 Yolcu', fuelLevel: 42, rating: 4.7 },
    { id: 'v3', plate: '34 EF 9012', model: 'Ford Transit 2024', driver: 'Hasan Kaya', phone: '0535 333 4455', status: 'STANDBY', capacity: '16 Yolcu', fuelLevel: 95, rating: 5.0 },
    { id: 'v4', plate: '34 GH 3456', model: 'Otokar Sultan Maxi 2023', driver: 'Burak Demir', phone: '0536 444 5566', status: 'MAINTENANCE', capacity: '29 Yolcu', fuelLevel: 15, rating: 4.6 }
  ]);

  // Form State for Add Vehicle
  const [newPlate, setNewPlate] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newDriver, setNewDriver] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCapacity, setNewCapacity] = useState('16 Yolcu');

  const filteredFleet = fleet.filter((v) => {
    const matchesSearch = v.plate.toLowerCase().includes(search.toLowerCase()) || v.driver.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || v.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate || !newDriver) return;

    const newVehicle: Vehicle = {
      id: `v-${Date.now()}`,
      plate: newPlate.toUpperCase(),
      model: newModel || 'Servis Aracı 2024',
      driver: newDriver,
      phone: newPhone || '0530 000 0000',
      status: 'STANDBY',
      capacity: newCapacity,
      fuelLevel: 100,
      rating: 5.0,
    };

    setFleet([newVehicle, ...fleet]);
    setNewPlate('');
    setNewModel('');
    setNewDriver('');
    setNewPhone('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Filo ve Sürücü Yönetimi</h2>
          <p className="text-xs text-slate-400">Toplam {fleet.length} araç kaydedildi</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Plaka veya sürücü ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900/80 border border-slate-800 text-white text-xs rounded-xl pl-9 pr-4 py-2.5 w-60 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filter Status Tabs */}
          <div className="flex gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${filter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilter('ON_ROUTE')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${filter === 'ON_ROUTE' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
            >
              Yolda
            </button>
            <button
              onClick={() => setFilter('MAINTENANCE')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${filter === 'MAINTENANCE' ? 'bg-red-600 text-white' : 'text-slate-400'}`}
            >
              Bakımda
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Araç Ekle</span>
          </button>
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredFleet.map((vehicle, idx) => (
          <motion.div
            key={vehicle.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
          >
            <GlassCard hoverEffect={false} className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
                    <CarFront className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{vehicle.plate}</h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{vehicle.model}</p>
                  </div>
                </div>
                <Badge
                  label={
                    vehicle.status === 'ON_ROUTE'
                      ? 'Yolda'
                      : vehicle.status === 'WARNING'
                      ? 'Dikkat'
                      : vehicle.status === 'MAINTENANCE'
                      ? 'Bakımda'
                      : 'Beklemede'
                  }
                  variant={
                    vehicle.status === 'ON_ROUTE'
                      ? 'success'
                      : vehicle.status === 'WARNING'
                      ? 'warning'
                      : vehicle.status === 'MAINTENANCE'
                      ? 'alert'
                      : 'neutral'
                  }
                />
              </div>

              {/* Fuel Level Indicator */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                  <span className="flex items-center gap-1">
                    <Fuel className="w-3 h-3 text-amber-400" /> Yakıt / Şarj
                  </span>
                  <span className="text-white">%{vehicle.fuelLevel}</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      vehicle.fuelLevel > 50 ? 'bg-emerald-500' : vehicle.fuelLevel > 20 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${vehicle.fuelLevel}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-400" /> Sürücü:
                  </span>
                  <span className="font-bold text-white">{vehicle.driver}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> Telefon:
                  </span>
                  <span className="font-medium text-slate-200">{vehicle.phone}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Puan:
                  </span>
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" /> {vehicle.rating}
                  </span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* ADD NEW VEHICLE MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-white relative"
            >
              <button onClick={() => setIsAddModalOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
                  <CarFront className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Yeni Filo Aracı Ekle</h3>
                  <p className="text-xs text-slate-400">Araç ve sürücü zimmet kaydı</p>
                </div>
              </div>

              <form onSubmit={handleAddVehicle} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Plaka</label>
                  <input
                    type="text"
                    required
                    placeholder="34 ABC 123"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Araç Marka / Model</label>
                  <input
                    type="text"
                    placeholder="Mercedes-Benz Sprinter 2024"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Sürücü Ad Soyad</label>
                    <input
                      type="text"
                      required
                      placeholder="Ahmet Yılmaz"
                      value={newDriver}
                      onChange={(e) => setNewDriver(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Telefon</label>
                    <input
                      type="text"
                      placeholder="0532 000 0000"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Kapasite</label>
                  <select
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="16 Yolcu">16 Yolcu (Minibüs)</option>
                    <option value="19 Yolcu">19 Yolcu (Panelvan)</option>
                    <option value="29 Yolcu">29 Yolcu (Midibüs)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-lg shadow-blue-600/30"
                  >
                    Aracı Kaydet
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
