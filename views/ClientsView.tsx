import React, { useEffect, useState } from 'react';
import { Client, Contact, Location, Child, Pet, ChecklistTemplate, ChecklistItem } from '../types';
import { db } from '../services/mockData';
import Modal from '../components/Modal';
import { Plus, Edit, Trash2, Phone, Mail, MapPin, User, Home, PawPrint, Smile, ArrowLeft, MessageSquare, CheckSquare } from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);

const ClientsView: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);
  
  // Form State
  const emptyClient: Omit<Client, 'id'> = {
    name: '',
    contacts: [],
    locations: [],
    children: [],
    pets: [],
    houseNotes: '',
    generalNotes: '',
    checklist: []
  };

  const [formData, setFormData] = useState<Client>({ ...emptyClient, id: '' } as Client);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
      setLoading(true);
      const [clientsData, settings] = await Promise.all([
          db.getClients(),
          db.getSettings()
      ]);
      setClients(clientsData);
      if (settings?.checklistTemplates) {
          setChecklistTemplates(settings.checklistTemplates);
      }
      setLoading(false);
  };

  const fetchClients = async () => {
    const data = await db.getClients();
    setClients(data);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if(window.confirm("Are you sure you want to delete this client?")) {
      try {
        await db.deleteClient(id);
        if (selectedClient && selectedClient.id === id) {
          setSelectedClient(null);
        }
        await fetchClients();
      } catch (error) {
        console.error("Delete failed:", error);
        alert("Failed to delete client. Please try again.");
      }
    }
  };

  const handleEdit = (client: Client, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFormData(JSON.parse(JSON.stringify(client))); // Deep copy
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setFormData({ ...emptyClient, id: '' } as Client);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    
    try {
      let savedClient: Client;
      // Service Update Logic
      if (formData.id && clients.some(c => c.id === formData.id)) {
          savedClient = await db.updateClient(formData);
      } else {
          savedClient = await db.addClient(formData);
      }
      
      await fetchClients();
      setIsModalOpen(false);

      // If editing the currently viewed client, update the view with new data
      if (selectedClient && (selectedClient.id === savedClient.id)) {
          setSelectedClient(savedClient);
      }
    } catch (err) {
      console.error("Failed to save client", err);
      alert("Error saving client. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Form Helpers
  const addContact = () => setFormData(prev => ({...prev, contacts: [...prev.contacts, { id: generateId(), name: '', relation: '', phone: '', email: '', isPrimary: prev.contacts.length === 0 }]}));
  const removeContact = (id: string) => setFormData(prev => ({ ...prev, contacts: prev.contacts.filter(c => c.id !== id) }));
  const updateContact = (id: string, field: keyof Contact, value: any) => setFormData(prev => ({...prev, contacts: prev.contacts.map(c => c.id === id ? { ...c, [field]: value } : c)}));

  const addLocation = () => setFormData(prev => ({...prev, locations: [...prev.locations, { id: generateId(), address: '', type: 'Home', notes: '', isPrimary: prev.locations.length === 0 }]}));
  const removeLocation = (id: string) => setFormData(prev => ({ ...prev, locations: prev.locations.filter(l => l.id !== id) }));
  const updateLocation = (id: string, field: keyof Location, value: any) => setFormData(prev => ({...prev, locations: prev.locations.map(l => l.id === id ? { ...l, [field]: value } : l)}));

  const addChild = () => setFormData(prev => ({...prev, children: [...prev.children, { id: generateId(), name: '', age: '', notes: '' }]}));
  const removeChild = (id: string) => setFormData(prev => ({ ...prev, children: prev.children.filter(c => c.id !== id) }));
  const updateChild = (id: string, field: keyof Child, value: any) => setFormData(prev => ({...prev, children: prev.children.map(c => c.id === id ? { ...c, [field]: value } : c)}));

  const addPet = () => setFormData(prev => ({...prev, pets: [...prev.pets, { id: generateId(), name: '', type: '', notes: '' }]}));
  const removePet = (id: string) => setFormData(prev => ({ ...prev, pets: prev.pets.filter(p => p.id !== id) }));
  const updatePet = (id: string, field: keyof Pet, value: any) => setFormData(prev => ({...prev, pets: prev.pets.map(p => p.id === id ? { ...p, [field]: value } : p)}));

  // Checklist Form Helpers
  const handleApplyTemplate = (templateId: string) => {
      const template = checklistTemplates.find(t => t.id === templateId);
      if (!template) return;

      const newItems: ChecklistItem[] = template.items.map(item => ({
          ...item,
          id: generateId(), // Ensure unique ID for each client's item
          completed: false
      }));

      setFormData(prev => ({ ...prev, checklist: newItems }));
  };

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

  if (loading) return <div className="p-8 text-center">Loading Clients...</div>;

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
        <label className="block text-sm font-medium text-gray-700">Client / File Name</label>
        <input required type="text" placeholder="e.g. The Smith Family" className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
        />
        </div>

        {/* Contacts */}
        <div>
        <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2"><User size={16}/> Contacts</h4>
            <button type="button" onClick={addContact} className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded hover:bg-primary-100">+ Add Contact</button>
        </div>
        {formData.contacts.map((contact) => (
            <div key={contact.id} className="border border-gray-200 rounded-md p-3 mb-3 relative group">
                <button type="button" onClick={() => removeContact(contact.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <input placeholder="Name" className="border p-1 rounded text-sm" value={contact.name} onChange={e => updateContact(contact.id, 'name', e.target.value)} />
                    <input placeholder="Relation" className="border p-1 rounded text-sm" value={contact.relation} onChange={e => updateContact(contact.id, 'relation', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                        <input placeholder="Phone" className="border p-1 rounded text-sm" value={contact.phone} onChange={e => updateContact(contact.id, 'phone', e.target.value)} />
                        <input placeholder="Email" className="border p-1 rounded text-sm" value={contact.email} onChange={e => updateContact(contact.id, 'email', e.target.value)} />
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" checked={contact.isPrimary} onChange={e => updateContact(contact.id, 'isPrimary', e.target.checked)} />
                    Primary Contact
                </label>
            </div>
        ))}
        {formData.contacts.length === 0 && <div className="text-sm text-gray-400 italic">No contacts added yet.</div>}
        </div>

        {/* Locations */}
        <div>
        <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2"><Home size={16}/> Locations</h4>
            <button type="button" onClick={addLocation} className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded hover:bg-primary-100">+ Add Location</button>
        </div>
        {formData.locations.map((loc) => (
            <div key={loc.id} className="border border-gray-200 rounded-md p-3 mb-3 relative">
                <button type="button" onClick={() => removeLocation(loc.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                <div className="mb-2">
                    <input placeholder="Address" className="w-full border p-1 rounded text-sm" value={loc.address} onChange={e => updateLocation(loc.id, 'address', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <input placeholder="Type (e.g. Home)" className="border p-1 rounded text-sm" value={loc.type} onChange={e => updateLocation(loc.id, 'type', e.target.value)} />
                        <input placeholder="Notes" className="border p-1 rounded text-sm" value={loc.notes} onChange={e => updateLocation(loc.id, 'notes', e.target.value)} />
                </div>
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" checked={loc.isPrimary} onChange={e => updateLocation(loc.id, 'isPrimary', e.target.checked)} />
                    Primary Location
                </label>
            </div>
        ))}
        </div>

        {/* Household (Kids & Pets) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2"><Smile size={16}/> Children</h4>
                <button type="button" onClick={addChild} className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded hover:bg-primary-100">Add</button>
            </div>
            {formData.children.map(child => (
                <div key={child.id} className="border border-gray-200 rounded p-2 mb-2 text-sm relative">
                    <button type="button" onClick={() => removeChild(child.id)} className="absolute top-1 right-1 text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
                    <input placeholder="Name" className="w-full mb-1 border-b pb-1" value={child.name} onChange={e => updateChild(child.id, 'name', e.target.value)} />
                    <div className="flex gap-2">
                            <input placeholder="Age" className="w-1/3 border rounded p-1" value={child.age} onChange={e => updateChild(child.id, 'age', e.target.value)} />
                            <input placeholder="Notes" className="w-2/3 border rounded p-1" value={child.notes} onChange={e => updateChild(child.id, 'notes', e.target.value)} />
                    </div>
                </div>
            ))}
            </div>
            <div>
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2"><PawPrint size={16}/> Pets</h4>
                <button type="button" onClick={addPet} className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded hover:bg-primary-100">Add</button>
            </div>
            {formData.pets.map(pet => (
                <div key={pet.id} className="border border-gray-200 rounded p-2 mb-2 text-sm relative">
                        <button type="button" onClick={() => removePet(pet.id)} className="absolute top-1 right-1 text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
                        <input placeholder="Name" className="w-full mb-1 border-b pb-1" value={pet.name} onChange={e => updatePet(pet.id, 'name', e.target.value)} />
                        <div className="flex gap-2">
                            <input placeholder="Type" className="w-1/3 border rounded p-1" value={pet.type} onChange={e => updatePet(pet.id, 'type', e.target.value)} />
                            <input placeholder="Notes" className="w-2/3 border rounded p-1" value={pet.notes} onChange={e => updatePet(pet.id, 'notes', e.target.value)} />
                    </div>
                </div>
            ))}
            </div>
        </div>

        {/* Notes */}
        <div className="space-y-3">
            <div>
            <label className="block text-sm font-medium text-gray-700">House Notes</label>
            <textarea className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm" rows={2}
                placeholder="Entry instructions, alarm codes, cleaning focus areas..."
                value={formData.houseNotes} onChange={e => setFormData({...formData, houseNotes: e.target.value})}
            />
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700">General Notes</label>
            <textarea className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm" rows={2}
                placeholder="Communication preferences, payment details..."
                value={formData.generalNotes} onChange={e => setFormData({...formData, generalNotes: e.target.value})}
            />
            </div>
        </div>

        {/* Checklist */}
        <div>
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2"><CheckSquare size={16}/> Default Cleaning Checklist</h4>
                <div className="flex items-center gap-2">
                    <select
                        onChange={(e) => handleApplyTemplate(e.target.value)}
                        className="text-xs bg-white border border-gray-300 px-2 py-1 rounded"
                        defaultValue=""
                    >
                        <option value="" disabled>Apply a Template</option>
                        {checklistTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <button type="button" onClick={addChecklistItem} className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded hover:bg-primary-100">+ Add Custom Task</button>
                </div>
            </div>
            <div className="border border-gray-200 rounded-md p-3 space-y-2 max-h-60 overflow-y-auto">
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
                {(formData.checklist || []).length === 0 && <div className="text-sm text-gray-400 italic">No checklist items defined for this client.</div>}
            </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200" disabled={submitting}>Cancel</button>
        <button type="submit" disabled={submitting} className={`px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {submitting ? 'Saving...' : 'Save Client'}
        </button>
        </div>
    </form>
  );

  const renderDetailView = () => {
    if (!selectedClient) return null;

    return (
      <div className="p-6">
        {/* Header / Nav */}
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <button onClick={() => setSelectedClient(null)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedClient.name}</h2>
                    <p className="text-sm text-gray-500">Client Details</p>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={(e) => handleEdit(selectedClient, e)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm">
                    <Edit size={16} /> Edit
                </button>
                <button onClick={(e) => handleDelete(selectedClient.id, e)} className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-red-600 hover:bg-red-100 shadow-sm">
                    <Trash2 size={16} /> Delete
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column: Contact Info & Locations */}
            <div className="space-y-6 xl:col-span-2">
                
                {/* Contacts Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2"><User size={18}/> Contacts</h3>
                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">{selectedClient.contacts.length}</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {selectedClient.contacts.map(contact => (
                            <div key={contact.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900">{contact.name}</span>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{contact.relation}</span>
                                        {contact.isPrimary && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">Primary</span>}
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 text-sm text-gray-600">
                                    {contact.phone && (
                                        <a href={`tel:${contact.phone}`} className="flex items-center gap-2 hover:text-primary-600 transition-colors">
                                            <Phone size={14} /> {contact.phone}
                                        </a>
                                    )}
                                    {contact.email && (
                                        <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-primary-600 transition-colors">
                                            <Mail size={14} /> {contact.email}
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                        {selectedClient.contacts.length === 0 && <div className="p-6 text-center text-gray-400 italic">No contacts listed</div>}
                    </div>
                </div>

                {/* Locations Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2"><MapPin size={18}/> Locations</h3>
                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">{selectedClient.locations.length}</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {selectedClient.locations.map(loc => (
                            <div key={loc.id} className="p-4">
                                <div className="flex items-start justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <a 
                                          href={`https://maps.google.com/?q=${encodeURIComponent(loc.address)}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="font-medium text-gray-900 hover:text-primary-600 hover:underline transition-colors"
                                        >
                                            {loc.address}
                                        </a>
                                        {loc.isPrimary && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">Primary</span>}
                                    </div>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{loc.type}</span>
                                </div>
                                {loc.notes && (
                                    <div className="mt-2 text-sm text-gray-600 bg-yellow-50 border border-yellow-100 p-2 rounded flex items-start gap-2">
                                        <MessageSquare size={14} className="mt-1 text-yellow-600 shrink-0" />
                                        <span>{loc.notes}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                         {selectedClient.locations.length === 0 && <div className="p-6 text-center text-gray-400 italic">No locations listed</div>}
                    </div>
                </div>
            </div>

            {/* Right Column: Family & Notes */}
            <div className="space-y-6">
                
                {/* Notes Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><MessageSquare size={18}/> Important Notes</h3>
                    
                    <div className="mb-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">House Notes</span>
                        <p className="mt-1 text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100">
                            {selectedClient.houseNotes || "No house notes."}
                        </p>
                    </div>
                    
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">General Notes</span>
                         <p className="mt-1 text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100">
                            {selectedClient.generalNotes || "No general notes."}
                        </p>
                    </div>
                </div>

                 {/* Checklist Card */}
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2"><CheckSquare size={18}/> Cleaning Checklist</h3>
                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">{(selectedClient.checklist || []).length} items</span>
                    </div>
                    <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
                        {(selectedClient.checklist || []).length > 0 ? selectedClient.checklist?.map(item => (
                            <div key={item.id} className="text-sm flex items-center justify-between bg-gray-50 p-2 rounded">
                                <span className="font-medium">{item.task}</span>
                                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">{item.frequency}</span>
                            </div>
                        )) : <div className="text-sm text-center text-gray-400 italic p-4">No checklist assigned.</div>}
                    </div>
                 </div>

                 {/* Household */}
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                         <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Home size={18}/> Household</h3>
                    </div>
                    <div className="p-4 space-y-4">
                        {/* Children */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Smile size={12}/> Children</h4>
                            <div className="space-y-2">
                                {selectedClient.children.length > 0 ? selectedClient.children.map(child => (
                                    <div key={child.id} className="text-sm flex items-center justify-between bg-gray-50 p-2 rounded">
                                        <span className="font-medium">{child.name} <span className="text-gray-500 font-normal">({child.age})</span></span>
                                        {child.notes && <span className="text-xs text-gray-500 italic">{child.notes}</span>}
                                    </div>
                                )) : <div className="text-sm text-gray-400 italic">No children listed</div>}
                            </div>
                        </div>
                        
                        {/* Pets */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><PawPrint size={12}/> Pets</h4>
                            <div className="space-y-2">
                                {selectedClient.pets.length > 0 ? selectedClient.pets.map(pet => (
                                    <div key={pet.id} className="text-sm flex items-center justify-between bg-gray-50 p-2 rounded">
                                        <span className="font-medium">{pet.name} <span className="text-gray-500 font-normal">({pet.type})</span></span>
                                        {pet.notes && <span className="text-xs text-gray-500 italic">{pet.notes}</span>}
                                    </div>
                                )) : <div className="text-sm text-gray-400 italic">No pets listed</div>}
                            </div>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
      </div>
    );
  };

  const renderListView = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Clients</h2>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} /> Add Client
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {clients.map(client => {
          const primaryContact = client.contacts.find(c => c.isPrimary) || client.contacts[0];
          const primaryLocation = client.locations.find(l => l.isPrimary) || client.locations[0];

          return (
            <div 
                key={client.id} 
                onClick={() => setSelectedClient(client)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-transparent hover:border-l-primary-500"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                   <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xl group-hover:bg-primary-600 group-hover:text-white transition-colors">
                    {client.name.charAt(0)}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => handleEdit(client, e)} className="p-2 text-gray-400 hover:text-primary-600 rounded-full hover:bg-gray-50">
                    <Edit size={18} />
                  </button>
                  <button onClick={(e) => handleDelete(client.id, e)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-50">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3 mt-4 text-sm text-gray-600">
                {primaryContact ? (
                  <>
                    <div className="flex items-center gap-3">
                      <User size={16} className="text-gray-400" />
                      <span className="font-medium">{primaryContact.name} ({primaryContact.relation})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-gray-400" />
                      <a href={`mailto:${primaryContact.email}`} onClick={e => e.stopPropagation()} className="truncate hover:text-primary-600 hover:underline">{primaryContact.email || 'No email'}</a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-gray-400" />
                      <a href={`tel:${primaryContact.phone}`} onClick={e => e.stopPropagation()} className="hover:text-primary-600 hover:underline">{primaryContact.phone || 'No phone'}</a>
                    </div>
                  </>
                ) : (
                    <div className="text-gray-400 italic">No contacts added</div>
                )}

                {primaryLocation ? (
                    <div className="flex items-start gap-3 pt-2 border-t border-gray-100">
                        <MapPin size={16} className="text-gray-400 mt-1" />
                        <a 
                            href={`https://maps.google.com/?q=${encodeURIComponent(primaryLocation.address)}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="truncate hover:text-primary-600 hover:underline"
                        >
                            {primaryLocation.address}
                        </a>
                        <span className="text-xs text-gray-400 mt-0.5">({primaryLocation.type})</span>
                    </div>
                ) : (
                    <div className="text-gray-400 italic pt-2 border-t border-gray-100">No location added</div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
                 <div className="flex items-center gap-1">
                    <Smile size={14} /> {client.children.length} Kids
                 </div>
                 <div className="flex items-center gap-1">
                    <PawPrint size={14} /> {client.pets.length} Pets
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
        {selectedClient ? renderDetailView() : renderListView()}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Client" : "Add New Client"}>
            {renderForm()}
        </Modal>
    </>
  );
};

export default ClientsView;