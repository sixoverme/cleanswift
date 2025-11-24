import React, { useEffect, useState } from 'react';
import { Appointment, Client, Status, ChecklistItem } from '../types';
import { db } from '../services/mockData';
import Modal from '../components/Modal';
import { Plus, Trash2, Calendar, Grid, Clock, MapPin, User, DollarSign, Briefcase, FileText, ArrowLeft, CheckCircle, Edit, Phone, Mail, CheckSquare, PlayCircle, PauseCircle, StopCircle } from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);
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
  const [submitting, setSubmitting] = useState(false);
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
      status: Status.Pending,
      recurrence: undefined,
      seriesId: undefined,
      checklist: []
  };
  const [formData, setFormData] = useState<Partial<Appointment>>(emptyForm);

  // User Settings
  const [jobTypes, setJobTypes] = useState<{id: string, name: string, defaultRate: number}[]>([]);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Job Timer State
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    fetchData();
    loadSettings();
  }, []);

  const loadSettings = async () => {
      try {
          let profile = await db.getSettings();
          
          // Fallback to local storage if DB returns null (e.g. offline or not set yet)
          if (!profile) {
               const savedProfile = localStorage.getItem('cleanswift_user_profile');
               if (savedProfile) profile = JSON.parse(savedProfile);
          }

          if (profile && profile.jobTypes && Array.isArray(profile.jobTypes)) {
              setJobTypes(profile.jobTypes);
          } else {
              // Default Fallback
              setJobTypes([
                { id: 'def1', name: 'Standard Clean', defaultRate: 45 },
                { id: 'def2', name: 'Deep Clean', defaultRate: 60 },
                { id: 'def3', name: 'Move-In/Out', defaultRate: 55 },
                { id: 'def4', name: 'Organization', defaultRate: 50 }
            ]);
          }
      } catch (e) {
          console.error("Failed to load settings", e);
      }
  };

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
          const clientChecklist = client.checklist ? JSON.parse(JSON.stringify(client.checklist)) : [];

          setFormData(prev => ({
              ...prev,
              clientId: client.id,
              clientName: client.name,
              address: primaryLocation ? primaryLocation.address : '',
              notes: client.houseNotes, // Auto-populate notes with house notes initially
              checklist: clientChecklist
          }));
      } else {
        setFormData(prev => ({ ...prev, clientId: '', clientName: '', address: '', checklist: [] }));
      }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    
    try {
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
            notes: formData.notes || '',
            recurrence: formData.recurrence,
            seriesId: formData.seriesId,
            checklist: formData.checklist || []
        };

        if (apptToSave.id) {
            await db.updateAppointment(apptToSave);
        } else {
            await db.addAppointment(apptToSave);
        }
        
        setIsModalOpen(false);
        setSelectedAppt(null);
        fetchData();
    } catch (error) {
        console.error("Error saving appointment:", error);
        alert("Failed to save appointment.");
    } finally {
        setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
      if(confirm('Are you sure you want to delete this appointment?')) {
          await db.deleteAppointment(id);
          setSelectedAppt(null);
          fetchData();
      }
  };

  const handleStopRecurring = async () => {
      if (!selectedAppt || !selectedAppt.seriesId) return;
      
      if (confirm('Take this client off rotation? This will delete this appointment and all future recurring appointments in this series.')) {
          setLoading(true);
          // 1. Find all future appointments in this series
          const futureAppts = appointments.filter(a => 
              a.seriesId === selectedAppt.seriesId && 
              (a.date > selectedAppt.date || (a.date === selectedAppt.date && a.time >= selectedAppt.time))
          );
          
          const idsToDelete = futureAppts.map(a => a.id);
          
          // 2. Delete them
          await db.deleteAppointments(idsToDelete);
          
          setSelectedAppt(null);
          fetchData(); // setAppointments will handle the UI update
      }
  };

  // --- JOB TRACKING ---
  const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
      const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
      const s = (Math.floor(seconds) % 60).toString().padStart(2, '0');
      return `${h}:${m}:${s}`;
  };

  useEffect(() => {
    const jobLog = selectedAppt?.jobLog;
    if (!jobLog || !jobLog.startTime || jobLog.endTime) {
        if (elapsedTime > 0) setElapsedTime(0);
        return;
    }

    const isPaused = jobLog.breaks.length > 0 && !jobLog.breaks[jobLog.breaks.length - 1].endTime;

    const start = new Date(jobLog.startTime).getTime();
    let breakDuration = 0;
    jobLog.breaks.forEach(b => {
        if (b.endTime) {
            breakDuration += new Date(b.endTime).getTime() - new Date(b.startTime).getTime();
        }
    });

    if (isPaused) {
        const lastBreakStartTime = new Date(jobLog.breaks[jobLog.breaks.length - 1].startTime).getTime();
        setElapsedTime((lastBreakStartTime - start - breakDuration) / 1000);
    } else {
        const interval = setInterval(() => {
            const currentElapsed = (new Date().getTime() - start - breakDuration) / 1000;
            setElapsedTime(currentElapsed);
        }, 1000);
        return () => clearInterval(interval);
    }
  }, [selectedAppt]);


  const startTimer = () => {
      if (!selectedAppt) return;
      const now = new Date().toISOString();
      let updatedAppt = { ...selectedAppt };

      if (!updatedAppt.jobLog) {
          updatedAppt.jobLog = { startTime: now, breaks: [], totalHours: 0 };
          updatedAppt.status = Status.Active;
      } else {
          const lastBreak = updatedAppt.jobLog.breaks[updatedAppt.jobLog.breaks.length - 1];
          if (lastBreak && !lastBreak.endTime) {
              lastBreak.endTime = now;
          }
      }
      setSelectedAppt(updatedAppt);
  };

  const pauseTimer = () => {
      if (selectedAppt?.jobLog) {
          const now = new Date().toISOString();
          const updatedAppt = { ...selectedAppt };
          const lastBreak = updatedAppt.jobLog.breaks[updatedAppt.jobLog.breaks.length - 1];
          if (!lastBreak || lastBreak.endTime) {
              updatedAppt.jobLog.breaks.push({ startTime: now });
              setSelectedAppt(updatedAppt);
          }
      }
  };

  const stopTimer = async () => {
      if (!selectedAppt || !selectedAppt.jobLog) return;

      const now = new Date().toISOString();
      let updatedAppt = { ...selectedAppt };

      const lastBreak = updatedAppt.jobLog.breaks[updatedAppt.jobLog.breaks.length - 1];
      if (lastBreak && !lastBreak.endTime) {
          lastBreak.endTime = now;
      }

      const start = new Date(updatedAppt.jobLog.startTime).getTime();
      let breakDuration = 0;
      updatedAppt.jobLog.breaks.forEach(b => {
          if (b.endTime) {
              breakDuration += new Date(b.endTime).getTime() - new Date(b.startTime).getTime();
          }
      });

      const totalMillis = new Date(now).getTime() - start - breakDuration;
      const totalHours = totalMillis / (1000 * 60 * 60);

      updatedAppt = {
          ...updatedAppt,
          jobLog: { ...updatedAppt.jobLog, endTime: now, totalHours },
          status: Status.Completed
      };

      const incompleteTasks = (updatedAppt.checklist || []).filter(item => !item.completed);
      if (incompleteTasks.length > 0) {
          const notes = prompt(`You have ${incompleteTasks.length} incomplete tasks. Please leave a note explaining why.`);
          if (notes) {
              updatedAppt.notes = (updatedAppt.notes ? updatedAppt.notes + '\n\n' : '') + `Job Completion Notes: ${notes}`;
          }
      }

      setSelectedAppt(updatedAppt);

      await db.updateAppointment(updatedAppt);

      const invoices = await db.getInvoices();
      const relatedInvoice = invoices.find(inv => inv.appointmentId === updatedAppt.id);

      if (relatedInvoice) {
          const newAmount = updatedAppt.rate * totalHours;
          const updatedInvoice = {
              ...relatedInvoice,
              amount: newAmount,
              items: [{
                  ...relatedInvoice.items[0],
                  description: `${updatedAppt.serviceType} (${totalHours.toFixed(2)} hrs)`,
                  quantity: totalHours,
                  unitPrice: updatedAppt.rate
              }]
          };
          await db.updateInvoice(updatedInvoice);
      }

      await fetchData();
  };

  const handleChecklistItemToggle = (itemId: string) => {
      if (!selectedAppt) return;

      const updatedChecklist = (selectedAppt.checklist || []).map(item =>
          item.id === itemId ? { ...item, completed: !item.completed } : item
      );

      setSelectedAppt({ ...selectedAppt, checklist: updatedChecklist });
  };

  const handleEdit = (appt: Appointment) => {
      setFormData({ ...appt });
      setIsModalOpen(true);
  };

  const handleNew = () => {
      const defaultService = jobTypes.length > 0 ? jobTypes[0] : { name: 'Standard Clean', defaultRate: 0 };
      setFormData({
          ...emptyForm,
          serviceType: defaultService.name,
          rate: defaultService.defaultRate
      });
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

  // Checklist Form Helpers
  const addChecklistItem = () => {
      const newItem: ChecklistItem = {
          id: generateId(),
          task: '',
          frequency: 'Every Time',
          completed: false
      };
      setFormData(prev => ({ ...prev, checklist: [...(prev.checklist || []), newItem] }));
  };

  const removeChecklistItem = (id: string) => {
      setFormData(prev => ({ ...prev, checklist: (prev.checklist || []).filter(i => i.id !== id) }));
  };

  const updateChecklistItem = (id: string, field: keyof ChecklistItem, value: any) => {
      setFormData(prev => ({
          ...prev,
          checklist: (prev.checklist || []).map(i => i.id === id ? { ...i, [field]: value } : i)
      }));
  };

  const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'});
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
                          <span className="font-medium">{formatDate(apt.date)}</span>
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
      <>
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
                {selectedAppt.seriesId && (
                    <button onClick={handleStopRecurring} className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-100 rounded-lg text-orange-600 hover:bg-orange-100 shadow-sm">
                         <Briefcase size={16} /> Stop Recurring
                    </button>
                )}
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

                {/* Job Tracker */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Clock size={18}/> Job Tracker
                    </h3>
                    <div className="flex flex-col md:flex-row items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="text-center md:text-left mb-4 md:mb-0">
                            <p className="text-sm font-medium text-gray-500">Elapsed Time</p>
                            <p className="text-4xl font-bold text-gray-800 tabular-nums">{formatTime(elapsedTime)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {selectedAppt.jobLog?.endTime ? (
                                <p className="text-green-600 font-semibold">Job Completed</p>
                            ) : (
                                <>
                                    {!selectedAppt.jobLog || (selectedAppt.jobLog.breaks.length > 0 && selectedAppt.jobLog.breaks[selectedAppt.jobLog.breaks.length-1].endTime === undefined) ? (
                                        <button onClick={startTimer} className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-md transition-colors">
                                            <PlayCircle size={20}/>
                                            {selectedAppt.jobLog ? 'Resume' : 'Start Job'}
                                        </button>
                                    ) : (
                                        <button onClick={pauseTimer} className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow-md transition-colors">
                                            <PauseCircle size={20}/> Pause Break
                                        </button>
                                    )}
                                    <button onClick={stopTimer} disabled={!selectedAppt.jobLog} className={`flex items-center gap-2 px-6 py-3 rounded-lg shadow-md transition-colors ${!selectedAppt.jobLog ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white font-semibold'}`}>
                                        <StopCircle size={20}/> End Job
                                    </button>
                                </>
                            )}
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
                            {client.contacts && client.contacts.filter(c => c.isPrimary).map(contact => (
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
                            {(!client.contacts || client.contacts.length === 0) && <div className="text-gray-400 italic">No contacts found for this client.</div>}
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

                {/* Checklist Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2"><CheckSquare size={18}/> Job Checklist</h3>
                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">{(selectedAppt.checklist || []).length} items</span>
                    </div>
                    <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                        {(selectedAppt.checklist || []).length > 0 ? selectedAppt.checklist?.map(item => (
                            <label
                                key={item.id}
                                className={`text-sm flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${item.completed ? 'bg-green-50 text-gray-500 line-through' : 'bg-gray-50 hover:bg-gray-100'}`}
                            >
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={item.completed}
                                        onChange={() => handleChecklistItemToggle(item.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-3"
                                    />
                                    <span className="font-medium text-gray-800">{item.task}</span>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full border ${item.completed ? 'bg-white text-gray-400' : 'bg-white text-gray-500'}`}>{item.frequency}</span>
                            </label>
                        )) : <div className="text-sm text-center text-gray-400 italic p-4">No checklist for this job.</div>}
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
      </>
    );
  };

  return (
    <div className="p-6">
      {selectedAppt ? renderDetailView() : (
      <>
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
      </>
      )}

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

            {/* Recurrence (New) */}
            {!formData.id && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                        <input 
                            type="checkbox" 
                            id="isRecurring"
                            className="rounded text-primary-600 focus:ring-primary-500"
                            checked={!!formData.recurrence}
                            onChange={(e) => setFormData({...formData, recurrence: e.target.checked ? 'Weekly' : undefined})}
                        />
                        <label htmlFor="isRecurring" className="text-sm font-medium text-blue-900">Recurring Appointment?</label>
                    </div>
                    
                    {formData.recurrence && (
                        <div>
                            <label className="block text-xs font-medium text-blue-800 mb-1">Frequency</label>
                            <select 
                                className="block w-full rounded-md border-blue-200 text-sm p-2"
                                value={formData.recurrence}
                                onChange={(e) => setFormData({...formData, recurrence: e.target.value as any})}
                            >
                                <option value="Weekly">Weekly</option>
                                <option value="Biweekly">Bi-weekly (Every 2 weeks)</option>
                                <option value="Monthly">Monthly</option>
                            </select>
                            <p className="text-xs text-blue-600 mt-1">
                                * Auto-generates appointments for the next 6 months.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Service & Status */}
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                    <select 
                        className="block w-full rounded-lg border border-gray-300 p-2"
                        value={formData.serviceType} 
                        onChange={e => {
                            const newService = e.target.value;
                            const matchedJob = jobTypes.find(j => j.name === newService);
                            setFormData({
                                ...formData, 
                                serviceType: newService,
                                rate: matchedJob ? matchedJob.defaultRate : formData.rate
                            });
                        }}
                    >
                        <option value="">Select Service...</option>
                        {jobTypes.map(job => (
                            <option key={job.id} value={job.name}>{job.name}</option>
                        ))}
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

            {/* Checklist Editor */}
            <div>
                <div className="flex justify-between items-center mb-1">
                     <label className="text-sm font-medium text-gray-700">Job Checklist</label>
                     <button type="button" onClick={addChecklistItem} className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded hover:bg-primary-100">+ Add Task</button>
                </div>
                 <div className="border border-gray-200 rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                    {(formData.checklist || []).map(item => (
                        <div key={item.id} className="flex items-center gap-2">
                            <input
                                placeholder="Task description..."
                                className="flex-grow border p-1 rounded text-sm"
                                value={item.task}
                                onChange={e => updateChecklistItem(item.id, 'task', e.target.value)}
                            />
                            <select
                                className="border p-1 rounded text-sm bg-white"
                                value={item.frequency}
                                onChange={e => updateChecklistItem(item.id, 'frequency', e.target.value as ChecklistItem['frequency'])}
                            >
                                <option>Every Time</option>
                                <option>Every Other Time</option>
                                <option>Monthly</option>
                            </select>
                            <button type="button" onClick={() => removeChecklistItem(item.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                    ))}
                    {(formData.checklist || []).length === 0 && <div className="text-sm text-gray-400 italic">Starts with client's default checklist.</div>}
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200" disabled={submitting}>Cancel</button>
                <button type="submit" disabled={submitting} className={`px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {submitting ? 'Saving...' : 'Save Appointment'}
                </button>
            </div>
        </form>
      </Modal>
    </div>
  );
};

export default AppointmentsView;