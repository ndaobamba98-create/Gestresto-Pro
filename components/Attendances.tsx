
import React, { useState, useEffect, useMemo } from 'react';
import { Employee, AttendanceRecord, User } from '../types';
import { Clock, LogIn, LogOut, CheckCircle2, History, Timer, UserCheck } from 'lucide-react';

interface Props {
  employees: Employee[];
  onUpdateEmployees: (employees: Employee[]) => void;
  attendance: AttendanceRecord[];
  onUpdateAttendance: (attendance: AttendanceRecord[]) => void;
  currentUser: User;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

const Attendances: React.FC<Props> = ({ employees, onUpdateEmployees, attendance, onUpdateAttendance, currentUser, notify }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Trouver l'employé correspondant à l'utilisateur connecté
  const currentEmployee = useMemo(() => 
    employees.find(e => e.name === currentUser.name) || employees[0]
  , [employees, currentUser.name]);

  const handleClockIn = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('fr-FR');
    
    const newRecord: AttendanceRecord = {
      id: `ATT-${Date.now()}`,
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      checkIn: timeStr,
      date: dateStr
    };
    
    onUpdateAttendance([newRecord, ...attendance]);
    onUpdateEmployees(employees.map(e => e.id === currentEmployee.id ? { ...e, isClockedIn: true, status: 'active' } : e));
    notify("Pointage Entrée", `Bienvenue ${currentEmployee.name} !`, 'success');
  };

  const handleClockOut = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    const updatedAttendance = attendance.map(rec => {
      if (rec.employeeId === currentEmployee.id && !rec.checkOut) {
        return { ...rec, checkOut: timeStr };
      }
      return rec;
    });
    
    onUpdateAttendance(updatedAttendance);
    onUpdateEmployees(employees.map(e => e.id === currentEmployee.id ? { ...e, isClockedIn: false, status: 'absent' } : e));
    notify("Pointage Départ", `Au revoir ${currentEmployee.name}, bonne fin de journée !`, 'warning');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn pb-10">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Gestion des Présences</h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Mode Pointage Rapide</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* CARTE DE POINTAGE (STYLE KIOSK) */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-10 flex flex-col items-center justify-between min-h-[500px] relative overflow-hidden transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500"></div>
          
          <div className="text-center space-y-4">
            <div className="text-5xl font-black text-slate-800 dark:text-white font-mono tracking-tighter">
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <div className="flex flex-col items-center space-y-6">
            <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center text-white text-3xl font-black shadow-2xl transform transition-transform duration-700 ${currentEmployee.isClockedIn ? 'bg-emerald-500 rotate-12' : 'bg-slate-300 dark:bg-slate-800 scale-95'}`}>
              {currentEmployee.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="text-center">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase">{currentEmployee.name}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{currentEmployee.role}</p>
            </div>
          </div>

          <div className="w-full">
            {currentEmployee.isClockedIn ? (
              <button 
                onClick={handleClockOut}
                className="w-full group relative py-6 bg-rose-600 hover:bg-rose-700 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-4 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12"></div>
                <LogOut size={24} className="relative z-10" />
                <span className="text-lg relative z-10">Pointer Départ</span>
              </button>
            ) : (
              <button 
                onClick={handleClockIn}
                className="w-full group relative py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-4 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 -skew-x-12"></div>
                <LogIn size={24} className="relative z-10" />
                <span className="text-lg relative z-10">Pointer Entrée</span>
              </button>
            )}
          </div>

          {currentEmployee.isClockedIn && (
            <div className="mt-6 flex items-center space-x-2 text-emerald-500 font-black animate-pulse">
              <Timer size={16} />
              <span className="text-[10px] uppercase tracking-widest">Travail en cours...</span>
            </div>
          )}
        </div>

        {/* HISTORIQUE PERSONNEL */}
        <div className="flex flex-col space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"><History size={18}/></div>
                <h3 className="text-sm font-black uppercase tracking-tight">Derniers Pointages</h3>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">{attendance.filter(a => a.employeeId === currentEmployee.id).length} Logs</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide max-h-[400px]">
              {attendance.filter(a => a.employeeId === currentEmployee.id).slice(0, 10).map((log) => (
                <div key={log.id} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl flex items-center justify-between transition-all hover:border-purple-200 dark:hover:border-purple-900 group">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{log.date}</span>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-xs font-black text-emerald-500 flex items-center"><LogIn size={10} className="mr-1"/> {log.checkIn}</span>
                        {log.checkOut && <span className="text-xs font-black text-rose-500 flex items-center"><LogOut size={10} className="mr-1"/> {log.checkOut}</span>}
                      </div>
                    </div>
                  </div>
                  {log.checkOut ? (
                    <div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-slate-300 group-hover:text-emerald-500 transition-colors">
                      <CheckCircle2 size={16} />
                    </div>
                  ) : (
                    <div className="p-2 bg-emerald-500 text-white rounded-lg animate-pulse shadow-lg shadow-emerald-500/20">
                      <Timer size={16} />
                    </div>
                  )}
                </div>
              ))}
              {attendance.filter(a => a.employeeId === currentEmployee.id).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4 py-10">
                  <Clock size={40} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Aucun historique de pointage</p>
                </div>
              )}
            </div>
          </div>

          {/* RÉSUMÉ ÉTAT ÉQUIPE (SI ADMIN/MANAGER) */}
          {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
            <div className="bg-slate-900 text-white rounded-[2rem] p-8 shadow-xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut Équipe</p>
                <h4 className="text-xl font-black">{employees.filter(e => e.isClockedIn).length} en poste</h4>
              </div>
              <div className="flex -space-x-3">
                {employees.filter(e => e.isClockedIn).slice(0, 3).map((e, idx) => (
                  <div key={idx} className={`w-10 h-10 rounded-xl border-4 border-slate-900 bg-purple-600 flex items-center justify-center text-[10px] font-black shadow-lg`}>
                    {e.name[0]}
                  </div>
                ))}
                {employees.filter(e => e.isClockedIn).length > 3 && (
                  <div className="w-10 h-10 rounded-xl border-4 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-black">
                    +{employees.filter(e => e.isClockedIn).length - 3}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendances;
