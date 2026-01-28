
import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord, ERPConfig, ViewType, Attachment, Payslip, ContractType, Expense } from '../types';
// Added IdCard to lucide-react imports
import { 
  Plus, Search, Mail, Phone, Briefcase, Calendar, DollarSign, Users, Clock, FileText, IdCard, 
  Trash2, X, Edit3, Save, Printer, QrCode, Paperclip, FileSignature, Eye, Camera, 
  ArrowLeft, FileDown, CheckCircle2, Ban, Landmark, MapPin, Building, CreditCard, ChevronRight, BadgeCheck, Check, AlertTriangle, UserCheck, Scissors, History, Hash
} from 'lucide-react';
import { AppLogoDoc } from './Invoicing';

interface Props {
  employees: Employee[];
  onUpdate: (employees: Employee[]) => void;
  attendance: AttendanceRecord[];
  onUpdateAttendance: (attendance: AttendanceRecord[]) => void;
  config: ERPConfig;
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  userPermissions: ViewType[];
}

const HR: React.FC<Props> = ({ employees, onUpdate, attendance, config, expenses, onAddExpense, notify, userPermissions }) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'attendance' | 'payroll'>('directory');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);
  const [selectedForContract, setSelectedForContract] = useState<Employee | null>(null);
  const [selectedForPayslip, setSelectedForPayslip] = useState<Employee | null>(null);
  const [viewerDoc, setViewerDoc] = useState<{name: string, attachments: Attachment[]} | null>(null);

  const canEdit = userPermissions.includes('manage_hr');
  const departments = ['Cuisine', 'Salle', 'Livraison', 'Administration', 'Maintenance'];
  const contractTypes: ContractType[] = ['CDI', 'CDD', 'Stage', 'Interim'];

  const currentMonthName = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  // Calcul des retenues par employé pour le mois en cours
  const calculatePayrollData = (employee: Employee) => {
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    
    // Filtrer les présences du mois
    const monthAttendance = attendance.filter(a => {
        const d = new Date(a.date.split('/').reverse().join('-'));
        return d.getMonth() === month && d.getFullYear() === year && a.employeeId === employee.id;
    });

    const workDaysInMonth = 26; // Standard
    const dailyRate = employee.salary / workDaysInMonth;
    const hourlyRate = dailyRate / 8;

    // Calcul Absences (Jours non travaillés)
    const daysWorked = new Set(monthAttendance.map(a => a.date)).size;
    const absenceDays = Math.max(0, workDaysInMonth - daysWorked);
    const absenceDeduction = absenceDays * dailyRate;

    // Calcul Retards (Arrivée après 08:30)
    let lateMinutes = 0;
    monthAttendance.forEach(a => {
        const [h, m] = a.checkIn.split(':').map(Number);
        const totalMins = h * 60 + m;
        const limitMins = 8 * 60 + 30; // 08h30 limite
        if (totalMins > limitMins) {
            lateMinutes += (totalMins - limitMins);
        }
    });
    const lateDeduction = (lateMinutes / 60) * hourlyRate;

    const netSalary = Math.max(0, employee.salary - absenceDeduction - lateDeduction);
    
    // Vérifier si déjà payé dans les dépenses
    const isPaid = expenses.some(exp => 
        exp.category === 'Salaires' && 
        exp.description.includes(employee.name) && 
        exp.description.includes(currentMonthName)
    );

    return { 
        absenceDays, 
        absenceDeduction, 
        lateMinutes, 
        lateDeduction, 
        netSalary, 
        isPaid 
    };
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const handlePaySalary = (employee: Employee) => {
    const payroll = calculatePayrollData(employee);
    if (payroll.isPaid) {
        notify("Action impossible", "Ce salaire a déjà été réglé pour ce mois.", "warning");
        return;
    }

    if (confirm(`Confirmer le paiement NET de ${payroll.netSalary.toLocaleString()} ${config.currency} pour ${employee.name} ?\n(Après déduction de ${payroll.absenceDeduction + payroll.lateDeduction} pour retards/absences)`)) {
      // Fix: Changed typo 'const new Expense' to 'const newExpense'
      const newExpense: Expense = {
        id: `SAL-${Date.now()}`,
        description: `Salaire - ${employee.name} - ${currentMonthName}`,
        amount: payroll.netSalary,
        date: new Date().toISOString().split('T')[0],
        category: 'Salaires',
        paymentMethod: 'Especes',
        status: 'paid'
      };
      onAddExpense(newExpense);
      notify("Paiement Validé", `Le salaire de ${employee.name} a été enregistré.`, "success");
    }
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !editingEmployee.name) return;
    const empToSave = editingEmployee as Employee;
    const exists = employees.find(e => e.id === empToSave.id);
    if (exists) {
      onUpdate(employees.map(e => e.id === empToSave.id ? empToSave : e));
    } else {
      onUpdate([...employees, { 
        ...empToSave, 
        attachments: empToSave.attachments || [], 
        status: 'active', 
        isClockedIn: false,
        contractType: empToSave.contractType || 'CDI'
      }]);
    }
    setIsModalOpen(false);
    setEditingEmployee(null);
    notify("Succès", "Fiche collaborateur mise à jour.", "success");
  };

  if (selectedForContract) {
    return <ContractView employee={selectedForContract} config={config} onBack={() => setSelectedForContract(null)} notify={notify} />;
  }

  if (selectedForPayslip) {
    const payroll = calculatePayrollData(selectedForPayslip);
    return <PayslipView employee={selectedForPayslip} payroll={payroll} config={config} onBack={() => setSelectedForPayslip(null)} notify={notify} />;
  }

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn pb-10 pr-2 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
           {/* Fixed IdCard usage */}
           <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl"><IdCard size={32}/></div>
           <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Ressources Humaines</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Gestion de la masse salariale & pointages</p>
           </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-1 rounded-2xl flex shadow-sm">
            {[
              { id: 'directory', label: 'Annuaire', icon: Users },
              { id: 'attendance', label: 'Présences', icon: Clock },
              { id: 'payroll', label: 'Paie & Masse', icon: DollarSign }
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
              onClick={() => { setEditingEmployee({ id: `E${Date.now()}`, name: '', role: '', salary: 0, department: 'Salle', joinDate: new Date().toISOString().split('T')[0], contractType: 'CDI' }); setIsModalOpen(true); }}
              className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-xl hover:bg-black transition-all"
            >
              <Plus size={18} className="mr-2" /> Nouveau Contrat
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-6">
        {activeTab === 'directory' && (
          <>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center">
              <Search className="text-slate-400 ml-4" size={20} />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Chercher par nom, poste ou département..." className="flex-1 px-4 py-2 bg-transparent outline-none font-bold text-sm" />
            </div>
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
          </>
        )}
        
        {activeTab === 'attendance' && <AttendanceTable attendance={attendance} />}
        
        {activeTab === 'payroll' && (
           <div className="space-y-8 animate-fadeIn">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Masse Salariale Totale</p>
                   <div className="flex items-center justify-between">
                     <h3 className="text-3xl font-black text-purple-600">{employees.reduce((a,b)=>a+b.salary, 0).toLocaleString()} <span className="text-sm opacity-40 font-bold">{config.currency}</span></h3>
                     {/* Fixed UsersIcon -> Users */}
                     <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><Users size={24}/></div>
                   </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Mois en cours</p>
                   <div className="flex items-center justify-between">
                     <h3 className="text-xl font-black uppercase text-slate-800 dark:text-white">{currentMonthName}</h3>
                     <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Calendar size={24}/></div>
                   </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Seuil Retard</p>
                   <div className="flex items-center justify-between">
                     <h3 className="text-xl font-black text-rose-600">08:30 AM</h3>
                     <div className="p-3 bg-rose-50 rounded-xl text-rose-600"><Clock size={24}/></div>
                   </div>
                </div>
             </div>
             <PayrollTable employees={employees} config={config} onGenerate={(emp: any) => setSelectedForPayslip(emp)} onPay={handlePaySalary} calculatePayroll={calculatePayrollData} />
           </div>
        )}
      </div>

      {isModalOpen && editingEmployee && (
        <EmployeeModal 
          employee={editingEmployee} 
          setEmployee={setEditingEmployee} 
          onSave={handleSaveEmployee} 
          onClose={() => setIsModalOpen(false)}
          departments={departments}
          contractTypes={contractTypes}
        />
      )}
    </div>
  );
};

// --- COMPOSANTS INTERNES ---

const EmployeeCard = ({ employee, onEdit, onContract, onPayslip, onViewDocs }: any) => (
  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-800 p-6 flex flex-col items-center text-center group hover:shadow-2xl hover:border-purple-200 transition-all relative overflow-hidden">
    <div className="absolute top-4 right-4">
      <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${employee.contractType === 'CDI' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
        {employee.contractType || 'CDI'}
      </span>
    </div>
    <div className="relative mb-4">
      <div className={`w-24 h-24 rounded-[2.5rem] border-4 overflow-hidden shadow-xl ${employee.isClockedIn ? 'border-emerald-500' : 'border-slate-100'}`}>
        {employee.photo ? (
          <img src={employee.photo} alt={employee.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-slate-50 flex items-center justify-center text-3xl font-black text-slate-300 uppercase">{employee.name[0]}</div>
        )}
      </div>
    </div>
    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-md leading-tight">{employee.name}</h3>
    <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mt-1 mb-6">{employee.role}</p>
    <div className="w-full grid grid-cols-4 gap-2 border-t pt-4 border-slate-100 dark:border-slate-800">
      <button onClick={onViewDocs} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-purple-600 transition-all" title="Dossier"><Paperclip size={16} /></button>
      <button onClick={onContract} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-blue-600 transition-all" title="Contrat"><FileSignature size={16} /></button>
      <button onClick={onPayslip} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-emerald-600 transition-all" title="Bulletin"><DollarSign size={16} /></button>
      <button onClick={onEdit} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-900 transition-all" title="Modifier"><Edit3 size={16} /></button>
    </div>
  </div>
);

const AttendanceTable = ({ attendance }: { attendance: AttendanceRecord[] }) => (
  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border shadow-sm overflow-hidden border-slate-100 dark:border-slate-800">
    <table className="w-full text-left">
      <thead className="bg-slate-900 text-white">
        <tr className="text-[10px] font-black uppercase tracking-widest">
          <th className="px-10 py-5">Collaborateur</th>
          <th className="px-10 py-5 text-center">Heure Arrivée</th>
          <th className="px-10 py-5 text-center">Heure Départ</th>
          <th className="px-10 py-5 text-right">Date</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {attendance.map((rec) => (
          <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-10 py-6 font-black uppercase text-xs text-slate-800 dark:text-slate-100">{rec.employeeName}</td>
            <td className="px-10 py-6 text-center">
              <span className={`px-3 py-1 rounded-lg font-black text-[10px] ${rec.checkIn > '08:30' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                {rec.checkIn}
                {rec.checkIn > '08:30' && ' (Retard)'}
              </span>
            </td>
            <td className="px-10 py-6 text-center"><span className={`px-3 py-1 rounded-lg font-black text-[10px] ${rec.checkOut ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-300'}`}>{rec.checkOut || '--:--'}</span></td>
            <td className="px-10 py-6 text-right text-xs font-bold text-slate-400">{rec.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
    {attendance.length === 0 && (
      <div className="py-20 text-center opacity-30 flex flex-col items-center">
        <History size={48} className="mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest">Aucun pointage enregistré</p>
      </div>
    )}
  </div>
);

const PayrollTable = ({ employees, config, onGenerate, onPay, calculatePayroll }: any) => (
  <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
    <table className="w-full text-left">
      <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
        <tr>
          <th className="px-10 py-6">Agent</th>
          <th className="px-10 py-6">Base</th>
          <th className="px-10 py-6 text-center">Retards/Absences</th>
          <th className="px-10 py-6 text-center">NET À PAYER</th>
          <th className="px-10 py-6 text-center">Statut</th>
          <th className="px-10 py-6 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {employees.map((emp: any) => {
          const payroll = calculatePayroll(emp);
          return (
            <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all group">
              <td className="px-10 py-6">
                <div className="flex flex-col">
                  <span className="font-black uppercase text-xs text-slate-800 dark:text-white">{emp.name}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{emp.role}</span>
                </div>
              </td>
              <td className="px-10 py-6 font-bold text-xs text-slate-500">{emp.salary.toLocaleString()}</td>
              <td className="px-10 py-6 text-center">
                <div className="flex flex-col items-center">
                  <span className="text-rose-500 font-black text-xs">-{Math.round(payroll.absenceDeduction + payroll.lateDeduction).toLocaleString()}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">{payroll.absenceDays} abs / {payroll.lateMinutes} min</span>
                </div>
              </td>
              <td className="px-10 py-6 text-center">
                <span className="text-base font-black text-purple-600">{Math.round(payroll.netSalary).toLocaleString()} <span className="text-[10px]">{config.currency}</span></span>
              </td>
              <td className="px-10 py-6 text-center">
                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 ${payroll.isPaid ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600 animate-pulse'}`}>
                  {payroll.isPaid ? 'Payé' : 'À Régler'}
                </span>
              </td>
              <td className="px-10 py-6 text-right">
                <div className="flex justify-end space-x-2">
                  {!payroll.isPaid && (
                    <button onClick={() => onPay(emp)} className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase flex items-center hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition-all">
                      <Check size={14} className="mr-1.5"/> Payer
                    </button>
                  )}
                  <button onClick={() => onGenerate(emp)} className="p-2.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-400 hover:text-purple-600 rounded-xl transition-all shadow-sm">
                    <Printer size={18} />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const EmployeeModal = ({ employee, setEmployee, onSave, onClose, departments, contractTypes }: any) => (
  <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-scaleIn">
      <div className="p-8 border-b bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
        <div className="flex items-center space-x-4">
           <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg"><FileSignature size={24}/></div>
           <h3 className="text-xl font-black uppercase tracking-tighter">Contrat de Travail</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-all"><X size={28} /></button>
      </div>
      <form onSubmit={onSave} className="p-10 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 space-y-1">
             <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Identité Complète</label>
             <input required value={employee.name} onChange={e => setEmployee({...employee, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black border-2 border-transparent focus:border-purple-500 outline-none transition-all uppercase" placeholder="NOM DE L'AGENT" />
          </div>
          <div className="space-y-1">
             <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Poste occupé</label>
             <input required value={employee.role} onChange={e => setEmployee({...employee, role: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black border-2 border-transparent focus:border-purple-500 outline-none transition-all uppercase" placeholder="EX: CHEF CUISINIER" />
          </div>
          <div className="space-y-1">
             <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Salaire de Base Brut</label>
             <input type="number" required value={employee.salary} onChange={e => setEmployee({...employee, salary: parseFloat(e.target.value) || 0})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black text-purple-600 border-2 border-transparent focus:border-purple-500 outline-none transition-all" />
          </div>
          <div className="space-y-1">
             <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Type Contrat</label>
             <select value={employee.contractType} onChange={e => setEmployee({...employee, contractType: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black text-[10px] uppercase outline-none">
               {contractTypes.map((t:any) => <option key={t} value={t}>{t}</option>)}
             </select>
          </div>
          <div className="space-y-1">
             <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Département</label>
             <select value={employee.department} onChange={e => setEmployee({...employee, department: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black text-[10px] uppercase outline-none">
               {departments.map((d:any) => <option key={d} value={d}>{d}</option>)}
             </select>
          </div>
        </div>
        <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all">Enregistrer & Générer le dossier</button>
      </form>
    </div>
  </div>
);

// --- VUES IMPRIMABLES ---

const ContractView = ({ employee, config, onBack, notify }: any) => {
  const handlePrint = () => {
    const element = document.getElementById('contract-print-area');
    if (!element) return;
    const opt = { margin: 15, filename: `Contrat_${employee.name.replace(' ','_')}.pdf`, image: { type: 'jpeg', quality: 1 }, html2canvas: { scale: 3 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    // @ts-ignore
    window.html2pdf().set(opt).from(element).save();
    notify("Contrat", "Export PDF généré avec succès.", "success");
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn pb-10">
      <div className="flex items-center justify-between no-print bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <button onClick={onBack} className="p-4 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all"><ArrowLeft/></button>
        <h2 className="text-xl font-black uppercase tracking-tighter">Édition Contrat : {employee.name}</h2>
        <button onClick={handlePrint} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center"><Printer size={18} className="mr-2"/> Imprimer Contrat A4</button>
      </div>

      <div className="flex-1 flex justify-center overflow-y-auto scrollbar-hide py-10 bg-slate-50 dark:bg-slate-950">
        <div id="contract-print-area" className="bg-white text-slate-900 p-[30mm] shadow-2xl w-[210mm] min-h-[297mm] font-serif leading-relaxed">
           <div className="flex justify-between items-start border-b-2 border-slate-900 pb-10 mb-10">
              <div className="space-y-2">
                 <h1 className="text-3xl font-black uppercase">{config.companyName}</h1>
                 <p className="text-xs italic uppercase opacity-60">{config.companySlogan}</p>
              </div>
              <div className="text-right text-[10px] uppercase font-bold text-slate-500">
                 <p>{config.address}</p>
                 <p>{config.phone}</p>
                 <p>{config.email}</p>
              </div>
           </div>

           <h2 className="text-center text-2xl font-black underline uppercase mb-16">CONTRAT DE TRAVAIL À DURÉE {employee.contractType === 'CDD' ? 'DÉTERMINÉE' : 'INDÉTERMINÉE'}</h2>

           <div className="space-y-8 text-sm">
              <p>Entre les soussignés :</p>
              <p className="font-bold">1. La société {config.companyName}, dont le siège social est situé à {config.address}, représentée par M. Bamba Ndao, ci-après dénommée "L'Employeur".</p>
              <p className="font-bold">2. M./Mme {employee.name.toUpperCase()}, domicilié(e) à Nouakchott, ci-après dénommé(e) "Le Collaborateur".</p>
              
              <div className="space-y-4 pt-10">
                <p><strong>ARTICLE 1 - OBJET ET QUALIFICATION :</strong> Le Collaborateur est engagé en qualité de <strong>{employee.role.toUpperCase()}</strong> au sein du département {employee.department}.</p>
                <p><strong>ARTICLE 2 - RÉMUNÉRATION :</strong> En contrepartie de ses services, le Collaborateur percevra une rémunération brute mensuelle de <strong>{employee.salary.toLocaleString()} {config.currency}</strong>.</p>
                <p><strong>ARTICLE 3 - DISCIPLINE ET PONCTUALITÉ :</strong> Le Collaborateur s'engage à respecter les horaires de l'établissement. Tout retard de plus de 15 minutes sans justificatif pourra entraîner des retenues sur salaire proportionnelles au temps perdu.</p>
                <p><strong>ARTICLE 4 - CONFIDENTIALITÉ :</strong> Le Collaborateur s'interdit de divulguer les méthodes de production et secrets commerciaux de {config.companyName}.</p>
              </div>

              <div className="grid grid-cols-2 gap-20 pt-32">
                 <div className="border-t border-slate-900 pt-4 flex flex-col items-center">
                    <p className="text-[10px] font-black uppercase mb-20">L'EMPLOYEUR</p>
                    <p className="text-[8px] italic">(Signature précédée de "Lu et approuvé")</p>
                 </div>
                 <div className="border-t border-slate-900 pt-4 flex flex-col items-center">
                    <p className="text-[10px] font-black uppercase mb-20">LE COLLABORATEUR</p>
                    <p className="text-[8px] italic">(Signature précédée de "Lu et approuvé")</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const PayslipView = ({ employee, payroll, config, onBack, notify }: any) => {
  const handlePrint = () => {
    const element = document.getElementById('payslip-print-area');
    if (!element) return;
    const opt = { margin: 10, filename: `Bulletin_${employee.name.replace(' ','_')}.pdf`, image: { type: 'jpeg', quality: 1 }, html2canvas: { scale: 3 }, jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' } };
    // @ts-ignore
    window.html2pdf().set(opt).from(element).save();
    notify("Bulletin", "Bulletin PDF généré.", "success");
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn pb-10">
      <div className="flex items-center justify-between no-print bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <button onClick={onBack} className="p-4 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all"><ArrowLeft/></button>
        <h2 className="text-xl font-black uppercase tracking-tighter">Bulletin de Paie : {employee.name}</h2>
        <button onClick={handlePrint} className="bg-purple-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-purple-700 transition-all"><Printer size={18} className="mr-2"/> Exporter A5 PDF</button>
      </div>

      <div className="flex-1 flex justify-center overflow-y-auto scrollbar-hide py-10 bg-slate-50 dark:bg-slate-950">
        <div id="payslip-print-area" className="bg-white text-slate-900 p-[10mm] shadow-2xl w-[148mm] min-h-[210mm] flex flex-col font-sans border border-slate-200">
           <div className="flex justify-between items-start mb-6">
              <AppLogoDoc className="w-12 h-12" />
              <div className="text-right">
                 <h1 className="text-lg font-black uppercase leading-tight">{config.companyName}</h1>
                 <p className="text-[7px] font-bold text-slate-400 uppercase">{config.address}</p>
                 <p className="text-[7px] font-bold text-slate-400 uppercase">NIF: {config.registrationNumber}</p>
              </div>
           </div>

           <div className="bg-slate-900 text-white p-3 text-center rounded-lg mb-6">
              <h2 className="text-xs font-black uppercase tracking-widest">BULLETIN DE PAIE - {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase()}</h2>
           </div>

           <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                 <p className="text-[6px] font-black text-slate-400 uppercase mb-1">Employé</p>
                 <p className="text-[10px] font-black uppercase">{employee.name}</p>
                 <p className="text-[8px] font-bold text-slate-500 uppercase">{employee.role}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-right">
                 <p className="text-[6px] font-black text-slate-400 uppercase mb-1">Période de Paie</p>
                 <p className="text-[8px] font-black">Du 01 au 30 du mois</p>
                 <p className="text-[8px] font-black uppercase text-purple-600">ID: {employee.id}</p>
              </div>
           </div>

           <table className="w-full text-left text-[9px] border-collapse flex-1">
              <thead>
                <tr className="border-b-2 border-slate-900">
                   <th className="py-2 px-1 uppercase font-black">Libellé</th>
                   <th className="py-2 px-1 text-center uppercase font-black">Nombre</th>
                   <th className="py-2 px-1 text-right uppercase font-black">Gains</th>
                   <th className="py-2 px-1 text-right uppercase font-black">Retenues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                   <td className="py-3 px-1 font-bold uppercase">Salaire de base brut</td>
                   <td className="py-3 px-1 text-center">26 jours</td>
                   <td className="py-3 px-1 text-right font-black">{employee.salary.toLocaleString()}</td>
                   <td className="py-3 px-1 text-right">-</td>
                </tr>
                {payroll.absenceDays > 0 && (
                  <tr>
                    <td className="py-3 px-1 text-rose-600 font-bold uppercase">Retenue Absence non justifiée</td>
                    <td className="py-3 px-1 text-center text-rose-600">{payroll.absenceDays} j</td>
                    <td className="py-3 px-1 text-right">-</td>
                    <td className="py-3 px-1 text-right font-black text-rose-600">{Math.round(payroll.absenceDeduction).toLocaleString()}</td>
                  </tr>
                )}
                {payroll.lateMinutes > 0 && (
                  <tr>
                    <td className="py-3 px-1 text-rose-600 font-bold uppercase">Pénalité Retards cumulés</td>
                    <td className="py-3 px-1 text-center text-rose-600">{payroll.lateMinutes} min</td>
                    <td className="py-3 px-1 text-right">-</td>
                    <td className="py-3 px-1 text-right font-black text-rose-600">{Math.round(payroll.lateDeduction).toLocaleString()}</td>
                  </tr>
                )}
                {/* Lignes vides pour remplissage */}
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="border-none"><td colSpan={4} className="h-6"></td></tr>
                ))}
              </tbody>
           </table>

           <div className="border-t-2 border-slate-900 pt-4 mt-auto">
              <div className="flex justify-between items-end">
                 <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                       <div className="p-1 border border-slate-900 rounded"><QrCode size={40}/></div>
                       <div>
                          <p className="text-[6px] font-black uppercase">Vérifié par TerraPOS+</p>
                          <p className="text-[5px] font-bold text-slate-400">Émis numériquement le {new Date().toLocaleDateString()}</p>
                       </div>
                    </div>
                    <div className="flex flex-col items-center">
                       <p className="text-[6px] font-black uppercase mb-8">Cachet de l'Entreprise</p>
                       <div className="w-20 h-px bg-slate-300"></div>
                    </div>
                 </div>

                 <div className="text-right">
                    <div className="bg-slate-900 text-white p-4 rounded-2xl">
                       <p className="text-[7px] font-black uppercase tracking-[0.2em] mb-1 text-purple-400">NET À PAYER ({config.currency})</p>
                       <p className="text-3xl font-black font-mono tracking-tighter">
                          {Math.round(payroll.netSalary).toLocaleString()}
                       </p>
                    </div>
                    <p className="text-[6px] font-bold text-slate-400 mt-2 uppercase italic">Pour valoir ce que de droit</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default HR;
