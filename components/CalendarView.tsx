
import React, { useState, useMemo } from 'react';
import { ERPConfig, CalendarEvent } from '../types';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, Users, Coffee, Utensils, Zap, X, Trash2, Save, Bell } from 'lucide-react';

interface Props {
  config: ERPConfig;
  t: (key: any) => string;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  events: CalendarEvent[];
  onUpdateEvents: (events: CalendarEvent[]) => void;
}

const CalendarView: React.FC<Props> = ({ config, t, notify, events, onUpdateEvents }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<CalendarEvent> | null>(null);

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    
    const firstDayIndex = (date.getDay() + 6) % 7; 
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentDate]);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const handleCreateEvent = (dateStr: string) => {
    setEditingEvent({
      id: `EV-${Date.now()}`,
      title: '',
      date: dateStr,
      time: '12:00',
      type: 'meeting',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent?.title || !editingEvent?.date || !editingEvent?.time) return;

    const newEvent = editingEvent as CalendarEvent;
    const exists = events.find(ev => ev.id === newEvent.id);

    if (exists) {
      onUpdateEvents(events.map(ev => ev.id === newEvent.id ? newEvent : ev));
    } else {
      onUpdateEvents([...events, newEvent]);
    }
    
    setIsModalOpen(false);
    setEditingEvent(null);
    notify("Agenda", "Événement planifié avec alerte active.", "success");
  };

  const handleDeleteEvent = (id: string) => {
    if (confirm("Supprimer ce rendez-vous ?")) {
      onUpdateEvents(events.filter(ev => ev.id !== id));
      setIsModalOpen(false);
      setEditingEvent(null);
    }
  };

  const getEventIcon = (type: string) => {
    switch(type) {
      case 'delivery': return Zap;
      case 'meeting': return Users;
      case 'maintenance': return Coffee;
      case 'service': return Utensils;
      default: return Bell;
    }
  };

  const getEventColor = (type: string) => {
    switch(type) {
      case 'delivery': return 'bg-orange-500';
      case 'meeting': return 'bg-blue-600';
      case 'maintenance': return 'bg-indigo-500';
      case 'service': return 'bg-emerald-600';
      default: return 'bg-slate-600';
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-6">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter drop-shadow-sm">
            {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all text-slate-500 hover:text-blue-600"><ChevronLeft size={20}/></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-blue-600 transition-colors">Aujourd'hui</button>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all text-slate-500 hover:text-blue-600"><ChevronRight size={20}/></button>
          </div>
        </div>
        <button 
          onClick={() => handleCreateEvent(new Date().toISOString().split('T')[0])}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-600/20 flex items-center hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={16} className="mr-2" /> Planifier
        </button>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-950 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="grid grid-cols-7 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {weekDays.map(day => (
            <div key={day} className="py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{day}</div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto scrollbar-hide">
          {daysInMonth.map((day, idx) => {
            const isToday = day && day.toDateString() === new Date().toDateString();
            const dateISO = day?.toISOString().split('T')[0];
            const dayEvents = day ? events.filter(e => e.date === dateISO) : [];

            return (
              <div 
                key={idx} 
                className={`min-h-[140px] p-4 border-r border-b dark:border-slate-800 last:border-r-0 transition-colors cursor-pointer group/cell ${day ? 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30' : 'bg-slate-50/20 dark:bg-slate-900/10'}`}
                onClick={() => day && handleCreateEvent(dateISO!)}
              >
                {day && (
                  <div className="h-full flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                       <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 scale-110' : 'text-slate-400'}`}>
                         {day.getDate()}
                       </span>
                       <Plus size={12} className="text-slate-200 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {dayEvents.sort((a,b) => a.time.localeCompare(b.time)).map(event => {
                        const Icon = getEventIcon(event.type);
                        return (
                          <div 
                            key={event.id} 
                            className={`${getEventColor(event.type)} p-2 rounded-xl text-white shadow-sm flex flex-col space-y-1 cursor-pointer hover:brightness-110 transition-all`}
                            onClick={(e) => { e.stopPropagation(); setEditingEvent(event); setIsModalOpen(true); }}
                          >
                            <div className="flex items-center justify-between">
                               <span className="text-[8px] font-black uppercase tracking-tighter truncate leading-none">{event.title}</span>
                               <Icon size={10} className="opacity-50" />
                            </div>
                            <span className="text-[7px] font-bold opacity-80">{event.time}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODALE DE PLANIFICATION */}
      {isModalOpen && editingEvent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[500] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 animate-scaleIn">
              <div className="p-8 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                 <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><Bell size={24}/></div>
                    <div>
                       <h3 className="text-xl font-black uppercase tracking-tighter">Rendez-vous & Alarme</h3>
                       <p className="text-[10px] font-black uppercase opacity-60">Planification opérationnelle</p>
                    </div>
                 </div>
                 <button onClick={() => setIsModalOpen(false)}><X size={28} className="text-slate-400 hover:text-rose-500"/></button>
              </div>

              <form onSubmit={handleSaveEvent} className="p-10 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Objet du rendez-vous</label>
                    <input required autoFocus value={editingEvent.title || ''} onChange={e => setEditingEvent({...editingEvent, title: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-2xl font-black outline-none transition-all uppercase" placeholder="Titre..." />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Date</label>
                       <input type="date" required value={editingEvent.date || ''} onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-2xl font-black outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Heure de l'alarme</label>
                       <input type="time" required value={editingEvent.time || ''} onChange={e => setEditingEvent({...editingEvent, time: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-2xl font-black outline-none" />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Type d'événement</label>
                    <div className="grid grid-cols-2 gap-3">
                       {['meeting', 'delivery', 'maintenance', 'service'].map(type => (
                         <button 
                            key={type} 
                            type="button"
                            onClick={() => setEditingEvent({...editingEvent, type: type as any})}
                            className={`p-4 rounded-2xl border-2 font-black uppercase text-[9px] transition-all flex items-center justify-between ${editingEvent.type === type ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'}`}
                         >
                            {type}
                            {React.createElement(getEventIcon(type), { size: 14 })}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="pt-6 flex gap-3 border-t dark:border-slate-800">
                    {events.find(ev => ev.id === editingEvent.id) && (
                      <button type="button" onClick={() => handleDeleteEvent(editingEvent.id!)} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={24}/></button>
                    )}
                    <button type="submit" className="flex-1 py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center space-x-3">
                       <Save size={18} />
                       <span>Enregistrer & Activer Alerte</span>
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
