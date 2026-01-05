
import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord, ERPConfig, ViewType, Attachment, LeaveRequest, Payslip } from '../types';
import { 
  Plus, Search, Mail, Phone, Briefcase, Calendar, DollarSign, Users, Clock, FileText, 
  Trash2, X, Edit3, Save, Printer, QrCode, Paperclip, FileSignature, Eye, Camera, 
  ArrowLeft, FileDown, CheckCircle2, Ban, Landmark, MapPin, Building, CreditCard
} from 'lucide-react';
import * as XLSX from 'xlsx';
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

const HR: React.FC<Props> = ({ employees, onUpdate, attendance, config, notify, userPermissions }) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'attendance' | 'leaves' | 'payroll'>('directory');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);
  const [selectedForContract, setSelectedForContract] = useState<Employee | null>(null);
  const [selectedForPayslip, setSelectedForPayslip] = useState<Employee | null>(null);
  const [viewerDoc, setViewerDoc] = useState<{name: string, attachments: Attachment[]} | null>(null);

  // Simulation de données pour les congés et la paie (pour démo)
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);

  const canEdit = userPermissions.includes('manage_hr');
  const departments = ['Cuisine', 'Salle', 'Livraison', 'Administration', 'Maintenance'];

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingEmployee) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditingEmployee(prev => ({ ...prev, photo: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !editingEmployee.name) return;
    const empToSave = editingEmployee as Employee;
    const exists = employees.find(e => e.id === empToSave.id);
    if (exists) {
      onUpdate(employees.map(e => e.id === empToSave.id ? empToSave : e));
    } else {
      onUpdate([...employees, { ...empToSave, attachments: empToSave.attachments || [], status: 'active', isClockedIn: false }]);
    }
    setIsModalOpen(false);
    setEditingEmployee(null);
    notify("Succès", "Fiche agent mise à jour.", "success");
  };

  if (selectedForContract) {
    return <ContractView employee={selectedForContract} config={config} onBack={() => setSelectedForContract(null)} notify={notify} />;
  }

  if (selectedForPayslip) {
    return <PayslipView employee={selectedForPayslip} config={config} onBack={() => setSelectedForPayslip(null)} notify={notify} />;
  }

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn pb-10 pr-2 overflow-hidden">
      
      {/* HEADER RH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Gestion Humaine</h1>
          <p className="text-sm text-slate-500 font-medium">Administration du personnel & paie</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-1 rounded-2xl flex shadow-sm">
            {[
              { id: 'directory', label: 'Annuaire', icon: Users },
              { id: 'attendance', label: 'Présences', icon: Clock },
              { id: 'leaves', label: 'Congés', icon: Ban },
              { id: 'payroll', label: 'Paie', icon: DollarSign }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <tab.icon size={14} className="mr-2" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>
          {canEdit && (
            <button 
              onClick={() => { setEditingEmployee({ id: `E${Date.now()}`, name: '', role: '', salary: 0, department: 'Salle', joinDate: new Date().toISOString().split('T')[0] }); setIsModalOpen(true); }}
              className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-xl hover:bg-black transition-all"
            >
              <Plus size={18} className="mr-2" /> Recruter
            </button>
          )}
        </div>
      </div>

      {/* RECHERCHE */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center">
        <Search className="text-slate-400 ml-4" size={20} />
        <input 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Rechercher par nom, poste ou département..."
          className="flex-1 px-4 py-2 bg-transparent outline-none font-bold text-sm"
        />
      </div>

      {/* CONTENU ONGLET */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {activeTab === 'directory' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEmployees.map(emp => (
              <EmployeeCard 
                key={emp.id} 
                employee={emp} 
                onEdit={() => { setEditingEmployee(emp); setIsModalOpen(true); }}
                onContract={() => setSelectedForContract(emp)}
                onPayslip={() => setSelectedForPayslip(emp)}
                onViewDocs={() => setViewerDoc({ name: emp.name, attachments: emp.attachments || [] })}
              />
            ))}
          </div>
        )}

        {activeTab === 'attendance' && <AttendanceTable attendance={attendance} />}

        {activeTab === 'leaves' && <LeavesTable leaves={leaves} employees={employees} onAdd={() => notify("Info", "Module de demande de congé en cours d'activation", "info")} />}

        {activeTab === 'payroll' && <PayrollTable employees={employees} config={config} onGenerate={(emp) => setSelectedForPayslip(emp)} />}
      </div>

      {/* MODAL ÉDITION EMPLOYE */}
      {isModalOpen && editingEmployee && (
        <EmployeeModal 
          employee={editingEmployee} 
          setEmployee={setEditingEmployee} 
          onSave={handleSaveEmployee} 
          onClose={() => setIsModalOpen(false)}
          onPhotoUpload={handlePhotoUpload}
          departments={departments}
        />
      )}

      {/* VISIONNEUSE DOCUMENTS */}
      {viewerDoc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10">
            <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-lg font-black uppercase tracking-tight">Dossier de {viewerDoc.name}</h3>
              <button onClick={() => setViewerDoc(null)}><X size={24}/></button>
            </div>
            <div className="p-8 space-y-3 max-h-[50vh] overflow-y-auto">
              {viewerDoc.attachments.map(att => (
                <div key={att.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border">
                  <span className="text-xs font-bold truncate pr-4">{att.name}</span>
                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-purple-600 text-white rounded-lg"><Eye size={16}/></a>
                </div>
              ))}
              {viewerDoc.attachments.length === 0 && <p className="text-center py-10 text-slate-400 font-black uppercase text-[10px]">Aucun document</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// COMPOSANTS INTERNES RH

const EmployeeCard = ({ employee, onEdit, onContract, onPayslip, onViewDocs }: any) => (
  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-800 p-6 flex flex-col items-center text-center group hover:shadow-2xl hover:border-purple-200 transition-all relative">
    <div className="relative mb-4">
      <div className={`w-24 h-24 rounded-[2.5rem] border-4 overflow-hidden shadow-xl ${employee.isClockedIn ? 'border-emerald-500' : 'border-slate-200'}`}>
        {employee.photo ? (
          <img src={employee.photo} alt={employee.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-3xl font-black text-slate-300">{employee.name[0]}</div>
        )}
      </div>
      {employee.isClockedIn && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900 animate-pulse"></div>}
    </div>
    
    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-md leading-tight">{employee.name}</h3>
    <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mt-1 mb-4">{employee.role}</p>
    
    <div className="w-full grid grid-cols-4 gap-2 border-t pt-4 border-slate-50 dark:border-slate-800">
      <button onClick={onViewDocs} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-purple-600 transition-all" title="Dossier"><Paperclip size={16} /></button>
      <button onClick={onContract} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-blue-600 transition-all" title="Contrat"><FileSignature size={16} /></button>
      <button onClick={onPayslip} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-emerald-600 transition-all" title="Bulletin"><DollarSign size={16} /></button>
      <button onClick={onEdit} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-900 transition-all" title="Modifier"><Edit3 size={16} /></button>
    </div>
  </div>
);

const EmployeeModal = ({ employee, setEmployee, onSave, onClose, onPhotoUpload, departments }: any) => (
  <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn border border-slate-200">
      <div className="p-8 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
        <h3 className="text-lg font-black uppercase tracking-tight">Fiche Collaborateur Odoo</h3>
        <button onClick={onClose}><X size={24} /></button>
      </div>
      <form onSubmit={onSave} className="p-10 space-y-8 max-h-[80vh] overflow-y-auto scrollbar-hide">
        <div className="flex flex-col md:flex-row gap-10">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center">
                {employee.photo ? <img src={employee.photo} alt="Profil" className="w-full h-full object-cover" /> : <Camera size={32} className="text-slate-300" />}
              </div>
              <label className="absolute bottom-0 right-0 bg-purple-600 text-white p-2.5 rounded-2xl shadow-lg cursor-pointer hover:scale-110 transition-all">
                <Plus size={16} />
                <input type="file" className="hidden" accept="image/*" onChange={onPhotoUpload} />
              </label>
            </div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Format Carré recommandé</span>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom Complet de l'agent</label>
              <input required value={employee.name} onChange={e => setEmployee({...employee, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-purple-500 font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Poste occupé</label>
              <input required value={employee.role} onChange={e => setEmployee({...employee, role: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-purple-500 font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Département</label>
              <select value={employee.department} onChange={e => setEmployee({...employee, department: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-purple-500 font-bold">
                {departments.map((d: any) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Salaire Mensuel Brut</label>
              <input type="number" required value={employee.salary || ''} onChange={e => setEmployee({...employee, salary: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-purple-500 font-black text-purple-600" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Téléphonique</label>
              <div className="flex">
                <div className="px-3 py-3 bg-slate-200 dark:bg-slate-700 rounded-l-xl flex items-center"><Phone size={14}/></div>
                <input value={employee.phone || ''} onChange={e => setEmployee({...employee, phone: e.target.value})} className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-r-xl border-none outline-none focus:ring-2 focus:ring-purple-500 font-bold" />
              </div>
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Coordonnées Bancaires (RIB / IBAN)</label>
              <div className="flex">
                <div className="px-3 py-3 bg-slate-200 dark:bg-slate-700 rounded-l-xl flex items-center"><Landmark size={14}/></div>
                <input value={employee.bankAccount || ''} onChange={e => setEmployee({...employee, bankAccount: e.target.value})} className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-r-xl border-none outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs font-bold" placeholder="Entrez le RIB de l'agent..." />
              </div>
            </div>
          </div>
        </div>
        <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-black transition-all">Enregistrer le profil RH</button>
      </form>
    </div>
  </div>
);

const PayslipView = ({ employee, config, onBack, notify }: any) => {
  const handleDownload = () => {
    const element = document.getElementById('payslip-area');
    if (!element) return;
    const opt = { margin: 0, filename: `Bulletin_${employee.name}.pdf`, jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' } };
    // @ts-ignore
    window.html2pdf().set(opt).from(element).save();
    notify("Succès", "Bulletin de paie généré.", "success");
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between no-print bg-white p-4 rounded-3xl border">
        <button onClick={onBack} className="p-3 bg-slate-100 rounded-xl"><ArrowLeft/></button>
        <h2 className="text-xl font-black uppercase">Bulletin de Salaire</h2>
        <button onClick={handleDownload} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center"><FileDown size={18} className="mr-2"/> Exporter A5</button>
      </div>
      <div className="flex-1 flex justify-center py-4 overflow-y-auto scrollbar-hide">
        <div id="payslip-area" className="bg-white text-slate-950 p-[10mm] flex flex-col border border-slate-100 shadow-xl" style={{ width: '148mm', height: '210mm' }}>
           <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
              <div className="space-y-1">
                 <h1 className="text-xl font-black uppercase leading-none">{config.companyName}</h1>
                 <p className="text-[8px] font-bold text-slate-500 uppercase">{config.address}</p>
              </div>
              <div className="text-right">
                 <h2 className="text-xl font-black uppercase text-slate-900 leading-none">Bulletin de Paie</h2>
                 <p className="text-[9px] font-bold text-slate-400 mt-1">PÉRIODE : {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Employé(e)</p>
                 <h3 className="text-md font-black uppercase">{employee.name}</h3>
                 <p className="text-[9px] font-bold text-slate-600 uppercase">{employee.role}</p>
                 <p className="text-[9px] font-bold text-slate-600 uppercase">{employee.department}</p>
              </div>
              <div className="p-4 space-y-2 text-right">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Coordonnées Bancaires</p>
                 <p className="text-[9px] font-mono font-bold">{employee.bankAccount || 'Règlement par Espèces'}</p>
              </div>
           </div>

           <div className="flex-1">
              <table className="w-full text-left text-[10px]">
                 <thead className="bg-slate-900 text-white font-black uppercase">
                    <tr>
                       <th className="px-4 py-2">Désignation</th>
                       <th className="px-2 py-2 text-center">Base</th>
                       <th className="px-4 py-2 text-right">Gains</th>
                       <th className="px-4 py-2 text-right">Retenues</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y border-b">
                    <tr><td className="px-4 py-3 font-bold uppercase">Salaire de Base</td><td className="px-2 py-3 text-center">1.00</td><td className="px-4 py-3 text-right">{employee.salary.toLocaleString()}</td><td className="px-4 py-3 text-right">-</td></tr>
                    <tr><td className="px-4 py-3 font-bold uppercase">Prime de Transport</td><td className="px-2 py-3 text-center">-</td><td className="px-4 py-3 text-right">0</td><td className="px-4 py-3 text-right">-</td></tr>
                    <tr className="bg-slate-50"><td className="px-4 py-3 font-bold uppercase">Cotisations Sociales</td><td className="px-2 py-3 text-center">-</td><td className="px-4 py-3 text-right">-</td><td className="px-4 py-3 text-right text-rose-600">0</td></tr>
                 </tbody>
              </table>
           </div>

           <div className="mt-auto border-t-4 border-slate-900 pt-6">
              <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl">
                 <span className="text-sm font-black uppercase tracking-widest">NET À PAYER</span>
                 <span className="text-3xl font-black font-mono tracking-tighter">{employee.salary.toLocaleString()} {config.currency}</span>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-10 text-center">
                 <div className="space-y-12"><p className="text-[8px] font-black uppercase text-slate-400">Signature Salarié</p><div className="h-px bg-slate-200"></div></div>
                 <div className="space-y-12"><p className="text-[8px] font-black uppercase text-slate-400">Cachet Direction</p><div className="h-px bg-slate-200"></div></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const AttendanceTable = ({ attendance }: { attendance: AttendanceRecord[] }) => (
  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-800 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-900 text-white">
          <tr className="text-[10px] font-black uppercase tracking-widest">
            <th className="px-10 py-5">Collaborateur</th>
            <th className="px-10 py-5 text-center">Arrivée</th>
            <th className="px-10 py-5 text-center">Départ</th>
            <th className="px-10 py-5 text-right">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
          {attendance.map((rec) => (
            <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <td className="px-10 py-6 font-black uppercase text-xs">{rec.employeeName}</td>
              <td className="px-10 py-6 text-center"><span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-black text-[10px]">{rec.checkIn}</span></td>
              <td className="px-10 py-6 text-center"><span className={`px-3 py-1 rounded-lg font-black text-[10px] ${rec.checkOut ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>{rec.checkOut || '--:--'}</span></td>
              <td className="px-10 py-6 text-right text-xs font-bold text-slate-400">{rec.date}</td>
            </tr>
          ))}
          {attendance.length === 0 && <tr><td colSpan={4} className="py-20 text-center opacity-20"><Clock size={48} className="mx-auto mb-4" /><p className="font-black uppercase text-xs tracking-widest">Aucun log</p></td></tr>}
        </tbody>
      </table>
    </div>
  </div>
);

const LeavesTable = ({ leaves }: any) => (
  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-800 shadow-sm overflow-hidden">
    <table className="w-full text-left">
      <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
        <tr><th className="px-10 py-5">Agent</th><th className="px-10 py-5">Type</th><th className="px-10 py-5 text-center">Dates</th><th className="px-10 py-5 text-right">Statut</th></tr>
      </thead>
      <tbody>
        {leaves.length === 0 && <tr><td colSpan={4} className="py-20 text-center opacity-20"><Ban size={48} className="mx-auto mb-4" /><p className="font-black uppercase text-xs tracking-widest">Aucune demande de congé</p></td></tr>}
      </tbody>
    </table>
  </div>
);

const PayrollTable = ({ employees, config, onGenerate }: any) => (
  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-800 shadow-sm overflow-hidden">
    <table className="w-full text-left">
      <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
        <tr><th className="px-10 py-5">Collaborateur</th><th className="px-10 py-5">Salaire Net</th><th className="px-10 py-5 text-center">RIB</th><th className="px-10 py-5 text-right">Actions</th></tr>
      </thead>
      <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
        {employees.map((emp: any) => (
          <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
            <td className="px-10 py-6 font-black uppercase text-xs">{emp.name}</td>
            <td className="px-10 py-6 font-black text-purple-600">{emp.salary.toLocaleString()} {config.currency}</td>
            <td className="px-10 py-6 text-center text-[10px] font-mono opacity-50">{emp.bankAccount ? 'Configuré' : 'Non défini'}</td>
            <td className="px-10 py-6 text-right">
               <button onClick={() => onGenerate(emp)} className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all flex items-center justify-center space-x-2 ml-auto shadow-md">
                 <Printer size={16} />
                 <span className="text-[10px] font-black uppercase">Générer Bulletin</span>
               </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ContractView = ({ employee, config, onBack, notify }: any) => {
  const handleDownload = () => {
    const element = document.getElementById('contract-area');
    if (!element) return;
    const opt = { margin: 0, filename: `Contrat_${employee.name}.pdf`, jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' } };
    // @ts-ignore
    window.html2pdf().set(opt).from(element).save();
    notify("Succès", "Contrat généré avec succès.", "success");
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between no-print bg-white p-4 rounded-3xl border">
        <button onClick={onBack} className="p-3 bg-slate-100 rounded-xl"><ArrowLeft/></button>
        <h2 className="text-xl font-black uppercase tracking-tighter">Contrat de Travail</h2>
        <button onClick={handleDownload} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center shadow-lg"><FileDown size={18} className="mr-2"/> Exporter PDF</button>
      </div>
      <div className="flex-1 flex justify-center py-4 overflow-y-auto scrollbar-hide">
        <div id="contract-area" className="bg-white text-slate-950 p-[12mm] flex flex-col border border-slate-100" style={{ width: '148mm', height: '210mm' }}>
           <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
              <div className="space-y-1">
                 <h1 className="text-xl font-black uppercase">{config.companyName}</h1>
                 <p className="text-[8px] font-bold text-slate-500">{config.address}</p>
              </div>
              <div className="text-right">
                 <h2 className="text-2xl font-black uppercase text-slate-900 leading-none">Contrat</h2>
                 <p className="text-[9px] font-black text-purple-600 mt-2 tracking-widest">RH/CID/{employee.id.slice(-6)}</p>
              </div>
           </div>
           
           <div className="flex gap-6 mb-8">
              <div className="w-24 h-32 bg-slate-50 border-2 rounded-xl overflow-hidden shrink-0">
                 {employee.photo ? <img src={employee.photo} alt="Agent" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Camera size={24} className="text-slate-200"/></div>}
              </div>
              <div className="flex-1 space-y-3 pt-1">
                 <div><p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Agent Employé</p><h3 className="text-lg font-black uppercase">{employee.name}</h3></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Poste</p><p className="text-[10px] font-black uppercase">{employee.role}</p></div>
                    <div><p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Département</p><p className="text-[10px] font-black uppercase">{employee.department}</p></div>
                 </div>
              </div>
           </div>

           <div className="flex-1 text-[9px] leading-relaxed text-slate-800 space-y-4">
              <p className="font-black uppercase border-b pb-1">Conditions de travail</p>
              <p>Ce contrat est conclu à durée déterminée entre {config.companyName} et Monsieur/Madame {employee.name}.</p>
              <p>L'employé percevra une rémunération nette de {employee.salary.toLocaleString()} {config.currency} par mois.</p>
              <p>Le règlement intérieur de l'établissement s'applique intégralement au présent contrat.</p>
           </div>

           <div className="mt-auto grid grid-cols-2 gap-10 pt-10 text-center">
              <div className="space-y-10"><p className="text-[7px] font-black uppercase text-slate-400">Signature de l'Employé</p><div className="h-px bg-slate-300"></div></div>
              <div className="space-y-10"><p className="text-[7px] font-black uppercase text-slate-400">Cachet Direction</p><div className="h-px bg-slate-300"></div></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default HR;
