
import React, { useState } from 'react';
import { Employee, AttendanceRecord, ERPConfig } from '../types';
import { 
  Plus, Search, Mail, Phone, MoreVertical, Briefcase, Calendar, DollarSign, Users, Clock, FileText, UserCheck, ArrowRight, LogIn, LogOut, Trash2, AlertTriangle, X, UserPlus, Edit3, Save, ChevronRight, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  employees: Employee[];
  onUpdate: (employees: Employee[]) => void;
  attendance: AttendanceRecord[];
  onUpdateAttendance: (attendance: AttendanceRecord[]) => void;
  config: ERPConfig;
  userRole: string;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

type HRTab = 'directory' | 'attendance';

const HR: React.FC<Props> = ({ employees, onUpdate, attendance, onUpdateAttendance, config, userRole, notify }) => {
  const [activeTab, setActiveTab] = useState<HRTab>('directory');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDept, setActiveDept] = useState<string>('Tous');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);

  const canEdit = userRole === 'admin' || userRole === 'manager';

  const depts: Employee['department'][] = ['Cuisine', 'Salle', 'Livraison', 'Administration'];
  const allDepts = ['Tous', ...depts];

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
      notify("Employé Supprimé", `${deleteConfirm.name} ne fait plus partie des effectifs.`, 'warning');
      setDeleteConfirm(null);
    }
  };

  const handleClockIn = (emp: Employee) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('fr-FR');
    
    const newRecord: AttendanceRecord = {
      id: `ATT-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      checkIn: timeStr,
      date: dateStr
    };
    
    onUpdateAttendance([newRecord, ...attendance]);
    onUpdate(employees.map(e => e.id === emp.id ? { ...e, isClockedIn: true } : e));
    notify("Pointage Entrée", `${emp.name} est arrivé à ${timeStr}`, 'info');
  };

  const handleClockOut = (emp: Employee) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    const updatedAttendance = attendance.map(rec => {
      if (rec.employeeId === emp.id && !rec.checkOut) {
        return { ...rec, checkOut: timeStr };
      }
      return rec;
    });
    
    onUpdateAttendance(updatedAttendance);
    onUpdate(employees.map(e => e.id === emp.id ? { ...e, isClockedIn: false } : e));
    notify("Pointage Départ", `${emp.name} est parti à ${timeStr}`, 'info');
  };

  const handleOpenAddModal = () => {
    setEditingEmployee({
      id: `E${Date.now().toString().slice(-4)}`,
      name: '',
      role: '',
      department: 'Cuisine',
      salary: 0,
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0],
      isClockedIn: false
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsModalOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !editingEmployee.name) return;

    const empToSave = editingEmployee as Employee;
    const exists = employees.find(e => e.id === empToSave.id);

    if (exists) {
      onUpdate(employees.map(e => e.id === empToSave.id ? empToSave : e));
      notify("Fiche mise à jour", `Les informations de ${empToSave.name} ont été actualisées.`, 'success');
    } else {
      onUpdate([...employees, empToSave]);
      notify("Nouveau Collaborateur", `${empToSave.name} a rejoint l'équipe de FAST FOOD MYA D'OR.`, 'success');
    }
    
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleExportExcel = () => {
    let dataToExport = [];
    let fileName = '';
    let wscols = [];

    if (activeTab === 'directory') {
      dataToExport = employees.map(e => ({
        'ID': e.id,
        'Nom Complet': e.name,
        'Rôle': e.role,
        'Département': e.department,
        'Salaire Mensuel': e.salary,
        'Devise': config.currency,
        'Date Embauche': e.joinDate,
        'Statut': e.isClockedIn ? 'En Poste' : 'Absent'
      }));
      fileName = `RH_Employes_MYA_DOR_${new Date().toISOString().split('T')[0]}.xlsx`;
      wscols = [{ wch: 10 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }];
    } else {
      dataToExport = attendance.map(a => ({
        'Employé': a.employeeName,
        'Date': a.date,
        'Heure Arrivée': a.checkIn,
        'Heure Départ': a.checkOut || 'En poste',
        'ID Employé': a.employeeId
      }));
      fileName = `RH_Presences_MYA_DOR_${new Date().toISOString().split('T')[0]}.xlsx`;
      wscols = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeTab === 'directory' ? "Employés" : "Présences");
    worksheet['!cols'] = wscols;
    XLSX.writeFile(workbook, fileName);
    notify("Export Réussi", `Le fichier Excel a été généré avec succès.`, 'success');
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn pb-10">
      {/* Modal Formulaire Employé */}
      {isModalOpen && editingEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn border border-slate-200 dark:border-slate-800">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-900/20">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
                    {employees.find(e => e.id === editingEmployee.id) ? 'Modifier' : 'Nouveau'} Collaborateur
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiche signalétique RH</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom Complet</label>
                  <input 
                    type="text" 
                    required 
                    autoFocus
                    value={editingEmployee.name} 
                    onChange={e => setEditingEmployee({...editingEmployee, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    placeholder="Prénom et Nom"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Poste / Rôle</label>
                  <input 
                    type="text" 
                    required 
                    value={editingEmployee.role} 
                    onChange={e => setEditingEmployee({...editingEmployee, role: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    placeholder="Ex: Cuisinier"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Département</label>
                  <select 
                    value={editingEmployee.department} 
                    onChange={e => setEditingEmployee({...editingEmployee, department: e.target.value as any})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all appearance-none"
                  >
                    {depts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Salaire ({config.currency})</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="number" 
                      required 
                      value={editingEmployee.salary || ''} 
                      onChange={e => setEditingEmployee({...editingEmployee, salary: parseFloat(e.target.value) || 0})}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date d'embauche</label>
                  <input 
                    type="date" 
                    required 
                    value={editingEmployee.joinDate} 
                    onChange={e => setEditingEmployee({...editingEmployee, joinDate: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase text-[10px] tracking-widest">Annuler</button>
                <button type="submit" className="flex-[2] bg-purple-600 text-white py-3 rounded-xl font-black shadow-lg shadow-purple-900/20 hover:bg-purple-700 transition-all uppercase text-[10px] tracking-widest flex items-center justify-center">
                  <Save size={16} className="mr-2" /> Enregistrer la fiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-[2rem] shadow-2xl overflow-hidden animate-scaleIn border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 text-center">Suppression Employé</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-8">
              Êtes-vous sûr de vouloir supprimer <span className="font-bold text-slate-900 dark:text-slate-100">"{deleteConfirm.name}"</span> ? Cette action retirera l'employé de la liste active.
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
          <button 
            onClick={handleExportExcel}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center shadow-sm transition-all"
          >
            <Download size={18} className="mr-2" /> Exporter Excel
          </button>
          {canEdit && (
            <button onClick={handleOpenAddModal} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center shadow-sm transition-all active:scale-95">
              <Plus size={18} className="mr-2" /> Nouveau
            </button>
          )}
        </div>
      </div>

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
            {allDepts.map(dept => (
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
                    <div className="flex items-center text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      <DollarSign size={10} className="mr-2" /> {emp.salary.toLocaleString()} {config.currency}
                    </div>
                  </div>

                  {/* Boutons de Pointage */}
                  <div className="w-full grid grid-cols-1 gap-2">
                    {emp.isClockedIn ? (
                      <button 
                        onClick={() => handleClockOut(emp)}
                        className="w-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95"
                      >
                        <LogOut size={14} className="mr-2" /> Pointer Départ
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleClockIn(emp)}
                        className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                      >
                        <LogIn size={14} className="mr-2" /> Pointer Arrivée
                      </button>
                    )}
                  </div>

                  <div className="w-full flex items-center justify-between mt-6 pt-4 border-t border-slate-50 dark:border-slate-800">
                    <div className="flex space-x-2">
                      {canEdit && (
                        <>
                          <button onClick={() => handleOpenEditModal(emp)} className="p-2 text-slate-400 hover:text-purple-600 transition-colors bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => setDeleteConfirm({ id: emp.id, name: emp.name })} className="p-2 text-slate-400 hover:text-rose-600 transition-colors bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Mail size={14} /></button>
                      <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Phone size={14} /></button>
                    </div>
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
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic font-medium">Aucun pointage aujourd'hui.</td>
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
