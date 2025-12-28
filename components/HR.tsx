
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
  // Added missing LogIn and LogOut imports
  LogIn,
  LogOut
} from 'lucide-react';

interface Props {
  employees: Employee[];
  onUpdate: (employees: Employee[]) => void;
  attendance: AttendanceRecord[];
  config: ERPConfig;
}

type HRTab = 'directory' | 'attendance';

const HR: React.FC<Props> = ({ employees, onUpdate, attendance, config }) => {
  const [activeTab, setActiveTab] = useState<HRTab>('directory');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDept, setActiveDept] = useState<string>('Tous');

  const depts = ['Tous', 'Cuisine', 'Salle', 'Livraison', 'Administration'];

  const filteredEmployees = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = activeDept === 'Tous' || e.department === activeDept;
    return matchesSearch && matchesDept;
  });

  const totalPayroll = employees.reduce((acc, curr) => acc + curr.salary, 0);
  const presentCount = employees.filter(e => e.status === 'active' || e.isClockedIn).length;

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn pb-10">
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
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center shadow-sm">
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
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">En Poste Actuellement</p>
            <h4 className="text-xl font-bold dark:text-white">{presentCount} / {employees.length}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Masse Salariale</p>
            <h4 className="text-xl font-bold dark:text-white">{totalPayroll.toLocaleString()} {config.currency} / mois</h4>
          </div>
        </div>
      </div>

      {activeTab === 'directory' ? (
        <>
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
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
              <div key={emp.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                <div className="absolute top-4 right-4 flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-1.5 ${
                    emp.isClockedIn ? 'bg-emerald-500 animate-pulse' : 
                    emp.status === 'active' ? 'bg-blue-500' : 
                    emp.status === 'on-leave' ? 'bg-orange-500' : 'bg-slate-400'
                  }`}></span>
                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">
                    {emp.isClockedIn ? 'En Poste' : emp.status}
                  </span>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-purple-100 dark:border-slate-700 flex items-center justify-center text-xl font-black text-purple-600 dark:text-purple-400 mb-4">
                    {emp.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white leading-tight mb-1">{emp.name}</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">{emp.role}</p>
                  
                  <div className="w-full space-y-2 mb-6 text-left">
                    <div className="flex items-center text-[11px] text-slate-500 dark:text-slate-400">
                      <Briefcase size={12} className="mr-2 text-slate-400" />
                      <span>{emp.department}</span>
                    </div>
                    <div className="flex items-center text-[11px] text-slate-500 dark:text-slate-400">
                      <Calendar size={12} className="mr-2 text-slate-400" />
                      <span>Depuis le {new Date(emp.joinDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      <DollarSign size={12} className="mr-2 text-emerald-500" />
                      <span>{emp.salary.toLocaleString()} {config.currency}</span>
                    </div>
                  </div>

                  <div className="w-full flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-4">
                    <button className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"><Mail size={16} /></button>
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Phone size={16} /></button>
                    <button className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors"><MoreVertical size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fadeIn">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center">
              <Clock className="mr-2 text-purple-600" size={18} /> Journal de Pointage (Aujourd'hui)
            </h3>
            <button className="text-xs font-bold text-purple-600 hover:underline">Voir l'historique complet</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Employé</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Arrivée</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Départ</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Durée</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">Aucun pointage enregistré pour le moment.</td>
                  </tr>
                ) : (
                  attendance.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                            {rec.employeeName.charAt(0)}
                          </div>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{rec.employeeName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold">
                          <LogIn size={12} className="mr-1.5" /> {rec.checkIn}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {rec.checkOut ? (
                          <span className="inline-flex items-center px-2 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold">
                            <LogOut size={12} className="mr-1.5" /> {rec.checkOut}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">En cours...</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                        {rec.checkOut ? "8h 12min" : "--"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-purple-600 transition-colors"><FileText size={16} /></button>
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
