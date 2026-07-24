import React from 'react';
import { motion } from 'framer-motion';
import { CarFront, Phone, ShieldCheck, UserCheck } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';

export const FleetManagement: React.FC = () => {
  const fleet = [
    { plate: '34 AB 1234', model: 'Mercedes-Benz Sprinter 2024', driver: 'Mehmet Şahin', phone: '0532 111 2233', status: 'ON_ROUTE', capacity: '16 Yolcu' },
    { plate: '34 CD 5678', model: 'Volkswagen Crafter 2023', driver: 'Ali Yılmaz', phone: '0533 222 3344', status: 'WARNING', capacity: '19 Yolcu' },
    { plate: '34 EF 9012', model: 'Ford Transit 2024', driver: 'Hasan Kaya', phone: '0535 333 4455', status: 'STANDBY', capacity: '16 Yolcu' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold text-white">Filo ve Sürücü Yönetimi</h2>
        <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors">
          + Yeni Araç Ekle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fleet.map((vehicle, idx) => (
          <motion.div
            key={vehicle.plate}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <GlassCard hoverEffect={false} className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
                    <CarFront className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{vehicle.plate}</h3>
                    <p className="text-xs text-slate-400">{vehicle.model}</p>
                  </div>
                </div>
                <Badge
                  label={vehicle.status === 'ON_ROUTE' ? 'Yolda' : vehicle.status === 'WARNING' ? 'Dikkat' : 'Beklemede'}
                  variant={vehicle.status === 'ON_ROUTE' ? 'success' : vehicle.status === 'WARNING' ? 'warning' : 'neutral'}
                />
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-400" /> Sürücü:
                  </span>
                  <span className="font-bold text-white">{vehicle.driver}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> İletişim:
                  </span>
                  <span className="font-medium text-slate-200">{vehicle.phone}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Kapasite:
                  </span>
                  <span className="font-medium text-slate-200">{vehicle.capacity}</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
