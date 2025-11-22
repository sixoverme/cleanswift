import React, { useEffect, useState } from 'react';
import { Appointment, Client, Status } from '../types';
import { db } from '../services/mockData';
import Modal from '../components/Modal';
import { Plus, Trash2, Calendar, Grid, Clock, MapPin, User, DollarSign, Briefcase, FileText, ArrowLeft, CheckCircle, Edit, Phone, Mail } from 'lucide-react';

type ViewMode = 'CARDS' | 'CALENDAR';

const AppointmentsView: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('CARDS');
  
  // State for Detail View
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  // State for Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const emptyForm: Partial<Appointment> = {
      clientId: '',
      clientName: '',
      date: '',
      time: '',
      serviceType: 'Standard Clean',
      address: '',
      rate: 0,
      estimatedHours: 0,
      notes: '',
      status: Status.Pending
  };
  const [formData, setFormData] = useState<Partial<Appointment>>(emptyForm);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [apptData, clientData] = await Promise.all([
        db.getAppointments(),
        db.getClients()
    ]);
    setAppointments(apptData);
    setClients(clientData);
    setLoading(false);
  };

  const handleClientSelect = (clientId: string) => {
      const client = clients.find(c => c.id === clientId);
      if (client) {
          const primaryLocation = client.locations.find(l => l.isPrimary) || client.locations[0];
          setFormData(prev => ({
              ...prev,
              clientId: client.id,
              clientName: client.name,
              address: primaryLocation ? primaryLocation.address : '',
              notes: client.houseNotes // Auto-populate notes with house notes initially
          }));
      } else {
        setFormData(prev => ({ ...prev, clientId: '', clientName: '', address: '' }));
      }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const apptToSave: Appointment = {
        id: formData.id || '', // ID is generated in service if empty
        clientId: formData.clientId || '',
        clientName: formData.clientName || 'Unknown',
        date: formData.date || '',
        time: formData.time || '',
        serviceType: formData.serviceType || 'Standard Clean',
        status: formData.status || Status.Pending,
        address: formData.address || '',
        rate: Number(formData.rate) || 0,
        estimatedHours: Number(formData.estimatedHours) || 0,
        notes: formData.notes || ''
    };

    if (apptToSave.id) {
        await db.updateAppointment(apptToSave);
    } else {
        await db.addAppointment(apptToSave);
    }
    
    setIsModalOpen(false);
    setSelectedAppt(null);
    fetchData();
  };

  const handleDelete = async (id: string) => {
      if(confirm('Are you sure you want to delete this appointment?')) {
          await db.deleteAppointment(id);
          setSelectedAppt(null);
          fetchData();
      }
  };

  const handleEdit = (appt: Appointment) => {
      setFormData({ ...appt });
      setIsModalOpen(true);
  };

  const handleNew = () => {
      setFormData(emptyForm);
      setIsModalOpen(true);
  };

  const statusColors = {
    [Status.Pending]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [Status.Completed]: 'bg-green-100 text-green-800 border-green-200',
    [Status.Active]: 'bg-blue-100 text-blue-800',
    [Status.Inactive]: 'bg-gray-100 text-gray-800',
    [Status.Paid]: 'bg-green-100 text-green-800',
    [Status.Unpaid]: 'bg-red-100 text-red-800',
    [Status.Overdue]: 'bg-red-100 text-red-800',
    [Status.LowStock]: 'bg-red-100 text-red-800',
    [Status.InStock]: 'bg-green-100 text-green-800',
  };

  // --- RENDER HELPERS ---

  const renderCalendarView = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days = [];
    // Padding for previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
        // Use bg-gray-50 for padding days, no borders on cells (handled by grid gap)
        days.push(<div key={`pad-${i}`} className="h-32 bg-gray-50"></div>);
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayAppts = appointments.filter(a => a.date === dateStr);

        days.push(
            <div key={d} className="h-32 bg-white p-2 hover:bg-gray-50 transition-colors overflow-y-auto">
                <div className="text-right text-xs font-bold text-gray-500 mb-1">{d}</div>
                <div className="space-y-1">
                    {dayAppts.map(apt => (
                        <div 
                            key={apt.id} 
                            onClick={() => setSelectedAppt(apt)}
                            className={`text-xs p-1 rounded cursor-pointer truncate border-l-2 ${apt.status === Status.Completed ? 'bg-green-50 border-green-500 text-green-700' : 'bg-blue-50 border-blue-500 text-blue-700'}`}
                        >
                            {apt.time} - {apt.clientName}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 flex justify-between items-center bg-gray-50 border-b border-gray-200">
                <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-2 hover:bg-gray-200 rounded-full">←</button>
                <h3 className="font-bold text-lg">{monthNames[month]} {year}</h3>
                <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-2 hover:bg-gray-200 rounded-full">→</button>
            </div>
            
            {/* Day Headers - No vertical borders, handled by container gap logic */}
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-500 bg-gray-100 border-b border-gray-200">
                <div className="py-2">SUN</div>
                <div className="py-2">MON</div>
                <div className="py-2">TUE</div>
                <div className="py-2">WED</div>
                <div className="py-2">THU</div>
                <div className="py-2">FRI</div>
                <div className="py-2">SAT</div>
            </div>
            
            {/* Calendar Grid - Using gap-px for clean 1px borders */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 border-b border-gray-200">
                {days}
            </div>
        </div>
    );
  };

  const renderCardView = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {appointments.map(apt => (
              <div 
                key={apt.id} 
                onClick={() => setSelectedAppt(apt)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-transparent hover:border-l-primary-500"
              >
                  <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-lg">{apt.clientName}</span>
                          <span className="text-sm text-gray-500">{apt.serviceType}</span>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${statusColors[apt.status]}`}>
                          {apt.status}
                      </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 my-4">
                      <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-primary-500" />
                          <span className="font-medium">{new Date(apt.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <Clock size={16} className="text-primary-500" />
                          <span>{apt.time} ({apt.estimatedHours} hrs)</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-primary-500" />
                          <a 
                            href={`https://maps.google.com/?q=${encodeURIComponent(apt.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="truncate hover:text-primary-600 hover:underline"
                          >
                              {apt.address}
                          </a>
                      </div>
                  </div>
                  
                  {/* Mini Footer */}
                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <DollarSign size={14}/> Rate: ${apt.rate}/hr
                      </div>
                      {apt.notes && <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded">Has Notes</span>}
                  </div>
              </div>
          ))}
          {appointments.length === 0 && <div className="col-span-full text-center p-8 text-gray-400 italic">No appointments found.</div>}
      </div>
  );

  const renderDetailView = () => {
    if (!selectedAppt) return null;
    
    // Find associated client for extra info if needed
    const client = clients.find(c => c.id === selectedAppt.clientId);

    return (
      <div className="p-6">
        {/* Header / Nav - Matching ClientsView */}
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <button onClick={() => setSelectedAppt(null)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedAppt.clientName}</h2>
                    <p className="text-sm text-gray-500">Appointment Details</p>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => handleEdit(selectedAppt)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm">
                    <Edit size={16} /> Edit
                </button>
                <button onClick={() => handleDelete(selectedAppt.id)} className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-red-600 hover:bg-red-100 shadow-sm">
                    <Trash2 size={16} /> Delete
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6 xl:col-span-2">
                
                {/* General Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Calendar size={18}/> Schedule & Location</h3>
                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full border ${statusColors[selectedAppt.status]}`}>
                            {selectedAppt.status}
                        </span>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Date & Time</h4>
                             <div className="flex items-center gap-3 mb-2">
                                <Calendar size={18} className="text-primary-500" />
                                <span className="text-gray-900 font-medium">{selectedAppt.date}</span>
                             </div>
                             <div className="flex items-center gap-3">
                                <Clock size={18} className="text-primary-500" />
                                <span className="text-gray-900 font-medium">{selectedAppt.time} <span className="text-gray-500 text-sm">({selectedAppt.estimatedHours} hrs)</span></span>
                             </div>
                        </div>
                        <div>
                             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Location</h4>
                             <div className="flex items-start gap-3">
                                <MapPin size={18} className="text-primary-500 mt-1" />
                                <a 
                                  href={`https://maps.google.com/?q=${encodeURIComponent(selectedAppt.address)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-900 font-medium leading-tight hover:text-primary-600 hover:underline"
                                >
                                    {selectedAppt.address}
                                </a>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Client Contact Quick View (if client exists) */}
                 {client && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                         <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2"><User size={18}/> Client Contact Info</h3>
                        </div>
                        <div className="p-6">
                            {client.contacts.filter(c => c.isPrimary).map(contact => (
                                <div key={contact.id} className="flex items-center gap-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <User size={16} className="text-gray-400"/>
                                        <span className="font-medium text-gray-900">{contact.name}</span>
                                    </div>
                                     <div className="flex items-center gap-2">
                                        <Phone size={16} className="text-gray-400"/>
                                        <a href={`tel:${contact.phone}`} className="text-gray-700 hover:text-primary-600 hover:underline">{contact.phone}</a>
                                    </div>
                                     <div className="flex items-center gap-2">
                                        <Mail size={16} className="text-gray-400"/>
                                        <a href={`mailto:${contact.email}`} className="text-gray-700 hover:text-primary-600 hover:underline">{contact.email}</a>
                                    </div>
                                </div>
                            ))}
                            {client.contacts.length === 0 && <div className="text-gray-400 italic">No contacts found for this client.</div>}
                        </div>
                    </div>
                 )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
                {/* Job Details / Financials */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Briefcase size={18}/> Job Details</h3>
                    
                    <div className="mb-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Service Type</span>
                        <p className="mt-1 text-lg font-medium text-gray-900">{selectedAppt.serviceType}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-gray-100">
                         <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rate</span>
                            <p className="mt-1 text-gray-900">${selectedAppt.rate}/hr</p>
                        </div>
                         <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Est. Hours</span>
                            <p className="mt-1 text-gray-900">{selectedAppt.estimatedHours}</p>
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-700">Total Estimated</span>
                            <span className="text-xl font-bold text-primary-600">${(selectedAppt.rate * selectedAppt.estimatedHours).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                     <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><FileText size={18}/> Job Notes</h3>
                     <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 text-sm text-gray-700 min-h-[100px]">
                        {selectedAppt.notes || <span className="italic text-gray-400">No notes provided for this appointment.</span>}
                     </div>
                </div>
            </div>
        </div>
      </div>
    );
  };

  if (selectedAppt) return renderDetailView();

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Appointments</h2>
        
        <div className="flex items-center bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            <button 
                onClick={() => setViewMode('CARDS')}
                className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${viewMode === 'CARDS' ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <Grid size={18} /> Cards
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <button 
                onClick={() => setViewMode('CALENDAR')}
                className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${viewMode === 'CALENDAR' ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <Calendar size={18} /> Calendar
            </button>
        </div>

        <button 
          onClick={handleNew}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={20} /> New Appointment
        </button>
      </div>

      {viewMode === 'CARDS' ? renderCardView() : renderCalendarView()}

      {/* ADD/EDIT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Appointment" : "New Appointment"}>
        <form onSubmit={handleSave} className="space-y-4">
            
            {/* Client Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <div className="relative">
                    <select 
                        required
                        className="block w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500 appearance-none"
                        value={formData.clientId}
                        onChange={(e) => handleClientSelect(e.target.value)}
                    >
                        <option value="">Select a Client...</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User size={18} className="text-gray-400" />
                    </div>
                </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input 
                        required type="date" 
                        className="block w-full rounded-lg border border-gray-300 p-2"
                        value={formData.date} 
                        onChange={e => setFormData({...formData, date: e.target.value})} 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input 
                        required type="time" 
                        className="block w-full rounded-lg border border-gray-300 p-2"
                        value={formData.time} 
                        onChange={e => setFormData({...formData, time: e.target.value})} 
                    />
                </div>
            </div>

            {/* Service & Status */}
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                    <select 
                        className="block w-full rounded-lg border border-gray-300 p-2"
                        value={formData.serviceType} 
                        onChange={e => setFormData({...formData, serviceType: e.target.value})}
                    >
                        <option value="Standard Clean">Standard Clean</option>
                        <option value="Deep Clean">Deep Clean</option>
                        <option value="Move-In/Out">Move-In/Out</option>
                        <option value="Organization">Organization</option>
                    </select>
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                     <select 
                        className="block w-full rounded-lg border border-gray-300 p-2"
                        value={formData.status} 
                        onChange={e => setFormData({...formData, status: e.target.value as Status})}
                    >
                        <option value={Status.Pending}>Pending</option>
                        <option value={Status.Completed}>Completed</option>
                        <option value={Status.Paid}>Paid</option>
                        <option value={Status.Unpaid}>Unpaid</option>
                    </select>
                </div>
            </div>

            {/* Rate & Hours */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rate ($/hr)</label>
                    <div className="relative">
                         <input 
                            type="number" min="0" step="0.01"
                            className="block w-full pl-7 rounded-lg border border-gray-300 p-2"
                            value={formData.rate} 
                            onChange={e => setFormData({...formData, rate: parseFloat(e.target.value)})} 
                        />
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">$</span>
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Est. Hours</label>
                    <input 
                        type="number" min="0" step="0.5"
                        className="block w-full rounded-lg border border-gray-300 p-2"
                        value={formData.estimatedHours} 
                        onChange={e => setFormData({...formData, estimatedHours: parseFloat(e.target.value)})} 
                    />
                </div>
            </div>

            {/* Location (Autofilled) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <div className="relative">
                    <input 
                        type="text" 
                        className="block w-full pl-10 rounded-lg border border-gray-300 p-2 bg-gray-50"
                        value={formData.address} 
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        placeholder="Autofills from Client..." 
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <MapPin size={18} className="text-gray-400" />
                    </div>
                </div>
            </div>

             {/* Notes */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Notes</label>
                <textarea 
                    className="block w-full rounded-lg border border-gray-300 p-2"
                    rows={3}
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    placeholder="Entry instructions, focus areas, etc."
                />
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">Save Appointment</button>
            </div>
        </form>
      </Modal>
    </div>
  );
};

export default AppointmentsView;