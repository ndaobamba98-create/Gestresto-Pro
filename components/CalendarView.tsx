
import React, { useState, useMemo } from 'react';
import { ERPConfig } from '../types';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, Users, Coffee, Utensils, Zap } from 'lucide-react';

interface Props {
  config: ERPConfig;
  t: (key: any) => string;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  type: 'meeting' | 'delivery' | 'maintenance' | 'service';
  color: string;
  icon: any;
}

const CalendarView: React.FC<Props> = ({ config, t, notify }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    
    // Remplissage des jours du mois précédent pour aligner le début
    const firstDayIndex = (date.getDay() + 6) % 7; // Ajusté pour commencer lundi
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentDate]);

  // Simulation d'événements
  const events: Record<number, CalendarEvent[]> = {
    5: [{ id: '1', title: 'Livraison Viande', time: '08:00', type: 'delivery', color: 'bg-orange-500', icon: Zap }],
    12: [{ id: '2', title: 'Réunion Staff', time: '15:30', type: 'meeting', color: 'bg-purple-600', icon: Users }],
    15: [{ id: '3', title: 'Maintenance Clim', time: '10:00', type: 'maintenance', color: 'bg-blue-500', icon: Coffee }],
    22: [{ id: '4', title: 'Inventaire Mensuel', time: '18:00', type: 'service', color: 'bg-emerald-600', icon: Utensils }],
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-6">
          <h2 className="text-3xl font-black text-accent uppercase tracking-tighter drop-shadow-sm">
            {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button onClick={prevMonth} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm text-slate-500 hover:text-accent"><ChevronLeft size={20}/></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-white dark:bg-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:text-accent">Aujourd'hui</button>
            <button onClick={nextMonth} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm text-slate-500 hover:text-accent"><ChevronRight size={20}/></button>
          </div>
        </div>
        <button 
          onClick={() => notify("Action", "Ajout d'événement bientôt disponible.", "info")}
          className="bg-accent text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-accent/20 flex items-center hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={16} className="mr-2" /> Créer
        </button>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-950 rounded-[3rem] border-2 border-slate-50 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="grid grid-cols-7 border-b dark:border-slate-800">
          {weekDays.map(day => (
            <div key={day} className="py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{day}</div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 auto-rows-fr">
          {daysInMonth.map((day, idx) => {
            const isToday = day && day.toDateString() === new Date().toDateString();
            const dayEvents = day ? events[day.getDate()] : null;

            return (
              <div 
                key={idx} 
                className={`min-h-[120px] p-4 border-r border-b dark:border-slate-800 last:border-r-0 transition-colors ${day ? 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30' : 'bg-slate-50/20 dark:bg-slate-900/10'}`}
              >
                {day && (
                  <div className="h-full flex flex-col space-y-2">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${isToday ? 'bg-accent text-white shadow-lg shadow-accent/40 scale-110' : 'text-slate-400'}`}>
                      {day.getDate()}
                    </span>
                    <div className="flex-1 space-y-1.5 overflow-y-auto scrollbar-hide">
                      {dayEvents?.map(event => (
                        <div key={event.id} className={`${event.color} p-2 rounded-xl text-white shadow-sm flex flex-col space-y-1 cursor-pointer hover:scale-105 transition-transform`}>
                          <div className="flex items-center justify-between">
                             <span className="text-[8px] font-black uppercase tracking-tighter truncate leading-none">{event.title}</span>
                             <event.icon size={10} className="opacity-50" />
                          </div>
                          <span className="text-[7px] font-bold opacity-80">{event.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
