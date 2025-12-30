
import React, { useState } from 'react';
import { Employee, AttendanceRecord, ERPConfig, ViewType, Attachment } from '../types';
import { 
  Plus, Search, Mail, Phone, Briefcase, Calendar, DollarSign, Users, Clock, FileText, UserCheck, LogIn, LogOut, Trash2, AlertTriangle, X, UserPlus, Edit3, Save, Download, Printer, QrCode, AlertCircle, Calculator, FileSpreadsheet, Paperclip, File, FileSignature
} from 'lucide-react';
import * as XLSX from 'xlsx';
// Import AppLogoDoc from Invoicing component
import { AppLogoDoc } from './Invoicing';

interface Props {
  employees: Employee[];
  onUpdate: (employees: Employee[]) => void;
  attendance: AttendanceRecord[];
  onUpdateAttendance: (attendance: AttendanceRecord[]) => void;
  config: ERPConfig;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  userPermissions: ViewType[];
}

type HRTab = 'directory' | 'attendance';

const HR: React.FC<Props> = ({ employees, onUpdate, attendance, onUpdateAttendance, config, notify, userPermissions }) => {
  const [activeTab, setActiveTab] = useState<HRTab>('directory');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDept, setActiveDept] = useState<string>('Tous');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);
  const [selectedForPayslip, setSelectedForPayslip] = useState<Employee | null>(null);
  const [selectedForContract, setSelectedForContract] = useState<Employee | null>(null);

  const canEdit = userPermissions.includes('manage_hr');

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

  const handleOpenAddModal = () => {
    setEditingEmployee({ id: `E${Date.now().toString().slice(-4)}`, name: '', role: '', department: 'Cuisine', salary: 0, status: 'active', joinDate: new Date().toISOString().split('T')[0], isClockedIn: false, attachments: [] });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee({ ...emp, attachments: emp.attachments || [] });
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !editingEmployee) return;
    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAttachment: Attachment = {
          id: `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          url: event.target?.result as string
        };
        setEditingEmployee(prev => ({
          ...prev,
          attachments: [...(prev?.attachments || []), newAttachment]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    setEditingEmployee(prev => ({
      ...prev,
      attachments: prev?.attachments?.filter(a => a.id !== id)
    }));
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
      notify("Nouveau Collaborateur", `${empToSave.name} a rejoint l'équipe.`, 'success');
    }
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleExportPayrollReport = () => {
    const data = employees.map(e => ({ 'ID Employé': e.id, 'Nom Complet': e.name, 'Poste': e.role, 'Département': e.department, 'Salaire de Base': e.salary, 'Devise': config.currency, 'Statut Actuel': e.isClockedIn ? 'Présent' : 'Absent', 'Date Embauche': e.joinDate }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rapport de Paie");
    XLSX.writeFile(workbook, `Paie_Mensuelle_${new Date().getMonth() + 1}_${new Date().getFullYear()}.xlsx`);
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn pb-10">
      {selectedForPayslip && <PayslipModal employee={selectedForPayslip} config={config} onClose={() => setSelectedForPayslip(null)} />}
      {selectedForContract && <ContractModal employee={selectedForContract} config={config} onClose={() => setSelectedForContract(null)} />}

      {isModalOpen && editingEmployee && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn border border-slate-200 dark:border-slate-800">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-lg"><UserPlus size={20} /></div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{employees.find(e => e.id === editingEmployee.id) ? 'Modifier' : 'Nouveau'} Collaborateur</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiche signalétique RH</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500"><X size={24} /></button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom Complet</label>
                  <input type="text" required value={editingEmployee.name} onChange={e => setEditingEmployee({...editingEmployee, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Poste / Rôle</label>
                  <input type="text" required value={editingEmployee.role} onChange={e => setEditingEmployee({...editingEmployee, role: e.target.value})} className="w-full px-4 py-3 rounded-xl border dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Département</label>
                  <select value={editingEmployee.department} onChange={e => setEditingEmployee({...editingEmployee, department: e.target.value as any})} className="w-full px-4 py-3 rounded-xl border dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none">
                    {depts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Salaire ({config.currency})</label>
                  <input type="number" required value={editingEmployee.salary || ''} onChange={e => setEditingEmployee({...editingEmployee, salary: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 rounded-xl border dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date d'embauche</label>
                  <input type="date" required value={editingEmployee.joinDate} onChange={e => setEditingEmployee({...editingEmployee, joinDate: e.target.value})} className="w-full px-4 py-3 rounded-xl border dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <Paperclip size={14} className="mr-2" /> Documents (Contrats, CV, CNI)
                  </label>
                  <label className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-black text-purple-600 uppercase cursor-pointer hover:bg-purple-600 hover:text-white transition-all">
                    Ajouter un fichier
                    <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {editingEmployee.attachments?.map((file) => (
                    <div key={file.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between group">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <File size={16} className="text-purple-600 shrink-0" />
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold truncate hover:text-purple-600 transition-all">{file.name}</a>
                      </div>
                      <button type="button" onClick={() => removeAttachment(file.id)} className="p-1.5 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 uppercase text-[10px] tracking-widest">Annuler</button>
                <button type="submit" className="flex-[2] bg-purple-600 text-white py-3 rounded-xl font-black shadow-lg hover:bg-purple-700 transition-all uppercase text-[10px] tracking-widest flex items-center justify-center">
                  <Save size={16} className="mr-2" /> Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white uppercase">Ressources Humaines</h1><p className="text-sm text-slate-500 font-medium">Gestion du personnel et paies</p></div>
        <div className="flex items-center space-x-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl flex">
            <button onClick={() => setActiveTab('directory')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'directory' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Users size={14} className="inline mr-2" /> Annuaire</button>
            <button onClick={() => setActiveTab('attendance')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'attendance' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Clock size={14} className="inline mr-2" /> Présences</button>
          </div>
          <button onClick={handleExportPayrollReport} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-black uppercase tracking-widest hover:bg-emerald-700 flex items-center shadow-lg"><FileSpreadsheet size={18} className="mr-2" /> Rapport Paie</button>
          {canEdit && <button onClick={handleOpenAddModal} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center shadow-sm transition-all"><Plus size={18} className="mr-2" /> Nouveau</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatItem icon={Users} title="Effectif Total" value={`${employees.length} collaborateurs`} color="bg-blue-100 text-blue-600" />
        <StatItem icon={UserCheck} title="En Poste Actuellement" value={`${presentCount} / ${employees.length}`} color="bg-emerald-100 text-emerald-600" />
        <StatItem icon={DollarSign} title="Masse Salariale" value={`${totalPayroll.toLocaleString()} ${config.currency}`} color="bg-purple-100 text-purple-600" />
      </div>

      {activeTab === 'directory' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEmployees.map(emp => (
            <div key={emp.id} className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all group relative overflow-hidden ${emp.isClockedIn ? 'border-emerald-500' : 'border-slate-200 dark:border-slate-800'}`}>
              <div className="p-6 flex flex-col items-center text-center">
                <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-2xl font-black mb-4 ${emp.isClockedIn ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700'}`}>{emp.name.split(' ').map(n => n[0]).join('')}</div>
                <h3 className="font-bold text-slate-800 dark:text-white leading-tight mb-1">{emp.name}</h3>
                <p className="text-xs font-medium text-slate-500 mb-6">{emp.role}</p>
                <div className="w-full space-y-2 mb-6 text-left bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                  <div className="flex items-center text-[10px] text-slate-400 font-black uppercase"><Briefcase size={10} className="mr-2" /> {emp.department}</div>
                  <div className="flex items-center text-[10px] text-slate-400 font-black uppercase"><DollarSign size={10} className="mr-2" /> {emp.salary.toLocaleString()} {config.currency}</div>
                </div>
                <div className="w-full grid grid-cols-1 gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setSelectedForPayslip(emp)} className="bg-slate-900 text-white py-2.5 rounded-xl text-[9px] font-black uppercase flex items-center justify-center hover:bg-purple-600 transition-all shadow-sm"><FileText size={12} className="mr-1.5" /> Fiche Paie</button>
                    <button onClick={() => setSelectedForContract(emp)} className="bg-purple-600 text-white py-2.5 rounded-xl text-[9px] font-black uppercase flex items-center justify-center hover:bg-slate-900 transition-all shadow-sm"><FileSignature size={12} className="mr-1.5" /> Contrat</button>
                  </div>
                  {canEdit && <button onClick={() => handleOpenEditModal(emp)} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all"><Edit3 size={14} className="mr-2" /> Modifier Fiche</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <AttendanceTable attendance={attendance} />
      )}
    </div>
  );
};

const StatItem = ({ icon: Icon, title, value, color }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
    <div className={`p-3 rounded-lg ${color}`}><Icon size={24} /></div>
    <div><p className="text-sm font-medium text-slate-500">{title}</p><h4 className="text-xl font-bold dark:text-white">{value}</h4></div>
  </div>
);

const AttendanceTable = ({ attendance }: { attendance: AttendanceRecord[] }) => (
  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fadeIn">
    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
      <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center"><Clock className="mr-2 text-purple-600" size={18} /> Journal de Pointage</h3>
      <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-[10px] font-black">{attendance.length} pointages</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employé</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Arrivée</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Départ</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
          {attendance.map((rec) => (
            <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
              <td className="px-6 py-4 flex items-center space-x-3"><div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-400">{rec.employeeName.charAt(0)}</div><span className="text-sm font-bold text-slate-800 dark:text-slate-200">{rec.employeeName}</span></td>
              <td className="px-6 py-4"><span className="inline-flex items-center px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg text-xs font-black"><LogIn size={12} className="mr-1.5" /> {rec.checkIn}</span></td>
              <td className="px-6 py-4">{rec.checkOut ? <span className="inline-flex items-center px-2 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg text-xs font-black"><LogOut size={12} className="mr-1.5" /> {rec.checkOut}</span> : <span className="text-[10px] font-black text-emerald-500 animate-pulse tracking-widest uppercase">En poste</span>}</td>
              <td className="px-6 py-4 text-xs font-bold text-slate-500">{rec.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const PayslipModal = ({ employee, config, onClose }: any) => {
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 sm:p-10 animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-full border border-white/20">
         <div className="px-8 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-md no-print sticky top-0 z-10">
           <div className="flex items-center space-x-3">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Bulletin de Paie Mensuel</span>
             <span className="px-2.5 py-1 bg-slate-900 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">#{employee.id}</span>
           </div>
           <div className="flex items-center space-x-3">
             <button onClick={() => window.print()} className="bg-purple-600 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center shadow-xl hover:bg-purple-700 transition-all"><Printer size={16} className="mr-2" /> Imprimer</button>
             <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><X size={24} /></button>
           </div>
         </div>

         <div id="invoice-print-area" className="p-10 sm:p-12 overflow-y-auto bg-white flex-1 text-slate-950 scrollbar-hide relative">
            <div className="flex justify-between items-start mb-16">
              <div className="space-y-4">
                <AppLogoDoc className="w-16 h-16" />
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1">{config.companyName}</h2>
                  <p className="text-[9px] font-black text-purple-600 uppercase tracking-[0.3em]">Établissement Certifié</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-1">BULLETIN DE PAIE</h2>
                <p className="text-lg font-mono font-black text-purple-600 tracking-tighter">MAI 2025</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-10 mb-12 p-6 bg-slate-50 rounded-2xl border border-slate-100">
               <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Collaborateur</p>
                 <h4 className="text-xl font-black uppercase tracking-tighter">{employee.name}</h4>
                 <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">{employee.role}</p>
                 <p className="text-[9px] text-slate-500 font-medium mt-1">Matricule: {employee.id}</p>
               </div>
               <div className="text-right">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Période du service</p>
                 <p className="text-sm font-black">01/05 au 31/05/2025</p>
                 <p className="text-[9px] text-slate-500 font-medium mt-1">Département: {employee.department}</p>
               </div>
            </div>

            <div className="space-y-3 mb-12">
               <div className="flex justify-between p-5 bg-white border border-slate-100 rounded-2xl">
                 <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Désignation</span>
                 <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Montant Brut</span>
               </div>
               <div className="flex justify-between p-5 bg-slate-50/50 rounded-2xl">
                 <span className="font-bold text-xs uppercase tracking-tight">Salaire de Base Mensuel</span>
                 <span className="font-black text-sm">{employee.salary.toLocaleString()} {config.currency}</span>
               </div>
            </div>

            <div className="flex flex-col items-end mb-16">
               <div className="w-[280px] bg-slate-950 text-white p-8 rounded-[2rem] shadow-2xl flex flex-col items-center">
                 <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-4 opacity-40 text-center">NET À PAYER CE MOIS</p>
                 <div className="flex items-baseline">
                   <span className="text-5xl font-black font-mono tracking-tighter leading-none">{employee.salary.toLocaleString()}</span>
                   <span className="text-sm font-bold ml-2 text-purple-500 uppercase">{config.currency}</span>
                 </div>
               </div>
            </div>

            <div className="pt-12 border-t border-dashed border-slate-200 flex flex-col md:flex-row justify-between items-center gap-10 text-center md:text-left">
               <div className="flex items-center space-x-4">
                  <QrCode size={60} className="text-slate-900" />
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-widest">Certificat RH</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase leading-relaxed max-w-[150px]">Bulletin dématérialisé conforme à la gestion SamaCaisse Pro.</p>
                  </div>
               </div>
               <div className="space-y-4 text-center">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Signature & Cachet</p>
                  <div className="w-40 h-px bg-slate-900 mx-auto"></div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const ContractModal = ({ employee, config, onClose }: any) => {
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 sm:p-10 animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-full border border-white/20">
         <div className="px-8 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-md no-print sticky top-0 z-10">
           <div className="flex items-center space-x-3">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Contrat de Travail</span>
             <span className="px-2.5 py-1 bg-purple-600 text-white text-[9px] font-black rounded-lg uppercase tracking-widest shadow-lg">#{employee.id}</span>
           </div>
           <div className="flex items-center space-x-3">
             <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center shadow-xl hover:bg-black transition-all"><Printer size={16} className="mr-2" /> Imprimer Document</button>
             <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><X size={24} /></button>
           </div>
         </div>

         <div id="invoice-print-area" className="p-16 sm:p-20 overflow-y-auto bg-white flex-1 text-slate-950 scrollbar-hide relative text-justify">
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
              <span className="text-[10rem] font-black uppercase -rotate-45 tracking-[2rem]">CONTRAT</span>
            </div>

            <div className="relative z-10 space-y-12">
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <AppLogoDoc className="w-20 h-20" />
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1">{config.companyName}</h2>
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em]">Direction des Ressources Humaines</p>
                  </div>
                </div>
                <div className="text-right">
                  <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 mb-2">Contrat de Travail</h1>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Document Juridique Officiel</p>
                </div>
              </div>

              <div className="space-y-6 text-sm leading-relaxed border-l-4 border-purple-600 pl-8">
                 <p className="font-bold">ENTRE LES SOUSSIGNÉS :</p>
                 <p>
                   L'entreprise <span className="font-black uppercase">{config.companyName}</span>, dont le siège social est situé à <span className="font-bold">{config.address}</span>, immatriculée au RC sous le numéro <span className="font-bold">{config.registrationNumber}</span>, représentée par sa Direction Générale, ci-après dénommée "L'Employeur".
                 </p>
                 <p className="italic">ET :</p>
                 <p>
                   M./Mme <span className="font-black uppercase">{employee.name}</span>, demeurant à Nouakchott, ci-après dénommé(e) "Le Salarié".
                 </p>
              </div>

              <div className="space-y-8">
                 <section className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-purple-600 border-b pb-1">Article 1 : Fonctions et Qualifications</h3>
                    <p className="text-xs">
                      Le Salarié est engagé par l'Employeur en qualité de <span className="font-black uppercase">{employee.role}</span> au sein du département <span className="font-bold uppercase">{employee.department}</span>. Il exercera ses fonctions sous l'autorité de la direction.
                    </p>
                 </section>

                 <section className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-purple-600 border-b pb-1">Article 2 : Date d'Effet</h3>
                    <p className="text-xs">
                      Le présent contrat prend effet à compter du <span className="font-black">{employee.joinDate}</span> pour une durée indéterminée.
                    </p>
                 </section>

                 <section className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-purple-600 border-b pb-1">Article 3 : Rémunération</h3>
                    <p className="text-xs">
                      En contrepartie de son travail, le Salarié percevra un salaire mensuel brut de <span className="font-black text-sm">{employee.salary.toLocaleString()} {config.currency}</span>, payable à la fin de chaque mois civil après déduction des taxes en vigueur.
                    </p>
                 </section>

                 <section className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-purple-600 border-b pb-1">Article 4 : Obligations Professionnelles</h3>
                    <p className="text-xs italic">
                      Le Salarié s'engage à observer les horaires de travail fixés par l'établissement, à respecter le règlement intérieur et à faire preuve de discrétion absolue concernant les informations liées au savoir-faire de l'entreprise MYA D'OR.
                    </p>
                 </section>
              </div>

              <div className="pt-20 grid grid-cols-2 gap-20">
                 <div className="text-center space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Signature du Salarié</p>
                    <div className="h-24 border-2 border-dashed border-slate-200 rounded-2xl flex items-end justify-center pb-2">
                       <span className="text-[8px] text-slate-300 uppercase">Mention "Lu et approuvé"</span>
                    </div>
                 </div>
                 <div className="text-center space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cachet de l'Employeur</p>
                    <div className="h-24 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center relative overflow-hidden">
                       <div className="opacity-10 scale-150 rotate-12">
                          <AppLogoDoc className="w-16 h-16" />
                       </div>
                       <QrCode size={40} className="text-slate-100 absolute" />
                    </div>
                 </div>
              </div>

              <div className="pt-12 text-center">
                 <p className="text-[8px] text-slate-400 uppercase tracking-widest italic">Édité à Nouakchott, le {new Date().toLocaleDateString()} via SamaCaisse Pro RH System</p>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default HR;
