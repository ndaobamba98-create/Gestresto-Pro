
import React, { useState } from 'react';
import { Employee, AttendanceRecord, ERPConfig } from '../types';
import { 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MoreVertical, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  Users, 
  Clock, 
  FileText,
  UserCheck,
  ArrowRight,
  LogIn,
  LogOut,
  Trash2,
  AlertTriangle,
  X,
  UserPlus
} from 'lucide-react';

interface Props {
  employees: Employee[];
  onUpdate: (employees: Employee[]) => void;
  attendance: AttendanceRecord[];
  onUpdateAttendance: (attendance: AttendanceRecord[]) => void;
  config: ERPConfig;
}

type HRTab = 'directory' | 'attendance';

const HR: React.FC<Props> = ({ employees, onUpdate, attendance, onUpdateAttendance, config }) => {
  const [activeTab, setActiveTab] = useState<HRTab>('directory');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDept, setActiveDept] = useState<string>('Tous');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);

  const depts = ['Tous', 'Cuisine', 'Salle', 'Livraison', 'Administration'];

  const filteredEmployees = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = activeDept === 'Tous' || e.department === activeDept;
    return matchesSearch && matchesDept;
  });

  const totalPayroll = employees.reduce((acc, curr) => acc + curr.salary, 0);
  const presentCount = employees.filter(e => e.isClockedIn).length;

  const handleDelete = () => {
    if (deleteConfirm) {
      onUpdate(employees.filter(e => e.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    }
  };

  const handleClockIn = (emp: Employee) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('fr-FR');
    
    // 1. Créer l'enregistrement de présence
    const newRecord: AttendanceRecord = {
      id: `ATT-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      checkIn: timeStr,
      date: dateStr
    };
    
    onUpdateAttendance([newRecord, ...attendance]);
    
    // 2. Mettre à jour le statut de l'employé
    onUpdate(employees.map(e => 
      e.id === emp.id ? { ...e, isClockedIn: true } : e
    ));
  };

  const handleClockOut = (emp: Employee) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    // 1. Mettre à jour l'enregistrement existant le plus récent pour cet employé
    const updatedAttendance = attendance.map(rec => {
      if (rec.employeeId === emp.id && !rec.checkOut) {
        return { ...rec, checkOut: timeStr };
      }
      return rec;
    });
    
    onUpdateAttendance(updatedAttendance);
    
    // 2. Mettre à jour le statut de l'employé
    onUpdate(employees.map(e => 
      e.id === emp.id ? { ...e, isClockedIn: false } : e
    ));
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn pb-10">
      {/* Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-scaleIn border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 text-center">Suppression Employé</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-8">
              Êtes-vous sûr de vouloir supprimer <span className="font-bold text-slate-900 dark:text-slate-100">"{deleteConfirm.name}"</span> ? Ses données historiques seront conservées.
            </p>
            <div className="grid grid-cols-2 gap-3 w-full">
              <button onClick={() => setDeleteConfirm(null)} className="py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest">Annuler</button>
              <button onClick={handleDelete} className="py-3 px-4 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 shadow-lg shadow-rose-900/20 transition-all text-xs uppercase tracking-widest">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Ressources Humaines</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gérez vos équipes, présences et paies</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl flex">
            <button 
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'directory' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <Users size={14} className="inline mr-2" /> Annuaire
            </button>
            <button 
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'attendance' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <Clock size={14} className="inline mr-2" /> Présences
            </button>
          </div>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center shadow-sm transition-all">
            <Plus size={18} className="mr-2" /> Nouveau
          </button>
        </div>
      </div>

      {/* HR Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Effectif Total</p>
            <h4 className="text-xl font-bold dark:text-white">{employees.length} collaborateurs</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4 relative overflow-hidden">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">En Poste Actuellement</p>
            <h4 className="text-xl font-bold dark:text-white">{presentCount} / {employees.length}</h4>
          </div>
          {presentCount > 0 && <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-emerald-500/10 rounded-full blur-xl animate-pulse"></div>}
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Masse Salariale</p>
            <h4 className="text-xl font-bold dark:text-white">{totalPayroll.toLocaleString()} {config.currency}</h4>
          </div>
        </div>
      </div>

      {activeTab === 'directory' ? (
        <>
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {depts.map(dept => (
              <button
                key={dept}
                onClick={() => setActiveDept(dept)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  activeDept === dept 
                    ? 'bg-slate-800 dark:bg-purple-600 text-white shadow-sm' 
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pr-2">
            {filteredEmployees.map(emp => (
              <div key={emp.id} className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all group relative overflow-hidden ${emp.isClockedIn ? 'border-emerald-500 dark:border-emerald-600 shadow-lg shadow-emerald-500/5' : 'border-slate-200 dark:border-slate-800 shadow-sm'}`}>
                <div className="absolute top-4 right-4 flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-1.5 ${
                    emp.isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'
                  }`}></span>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${emp.isClockedIn ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {emp.isClockedIn ? 'En Poste' : 'Absent'}
                  </span>
                </div>

                <div className="p-6 flex flex-col items-center text-center">
                  <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-2xl font-black mb-4 transition-all ${emp.isClockedIn ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>
                    {emp.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white leading-tight mb-1">{emp.name}</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-6">{emp.role}</p>
                  
                  <div className="w-full space-y-2 mb-6 text-left">
                    <div className="flex items-center text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      <Briefcase size={10} className="mr-2" /> {emp.department}
                    </div>
                    <div className="flex items-center text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      <Calendar size={10} className="mr-2" /> Arrivé {new Date(emp.joinDate).getFullYear()}
                    </div>
                  </div>

                  {/* Boutons de Pointage */}
                  <div className="w-full grid grid-cols-1 gap-2">
                    {emp.isClockedIn ? (
                      <button 
                        onClick={() => handleClockOut(emp)}
                        className="w-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                      >
                        <LogOut size={14} className="mr-2" /> Pointer Départ
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleClockIn(emp)}
                        className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                      >
                        <LogIn size={14} className="mr-2" /> Pointer Arrivée
                      </button>
                    )}
                  </div>

                  <div className="w-full flex items-center justify-between mt-6 pt-4 border-t border-slate-50 dark:border-slate-800">
                    <button className="text-slate-400 hover:text-purple-600 transition-colors"><Mail size={16} /></button>
                    <button className="text-slate-400 hover:text-blue-600 transition-colors"><Phone size={16} /></button>
                    <button 
                      onClick={() => setDeleteConfirm({ id: emp.id, name: emp.name })}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fadeIn">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center">
              <Clock className="mr-2 text-purple-600" size={18} /> Journal de Pointage (Aujourd'hui)
            </h3>
            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-[10px] font-black">{attendance.length} pointages</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Employé</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Arrivée</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Départ</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Fiche</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Aucun pointage aujourd'hui.</td>
                  </tr>
                ) : (
                  attendance.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-400">
                            {rec.employeeName.charAt(0)}
                          </div>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{rec.employeeName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-black">
                          <LogIn size={12} className="mr-1.5" /> {rec.checkIn}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {rec.checkOut ? (
                          <span className="inline-flex items-center px-2 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-black">
                            <LogOut size={12} className="mr-1.5" /> {rec.checkOut}
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-emerald-500 animate-pulse tracking-widest uppercase bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">En poste</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">{rec.date}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-purple-600 transition-colors opacity-0 group-hover:opacity-100"><FileText size={16} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HR;
