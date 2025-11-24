import React, { useEffect, useState, useRef } from 'react';
import { Invoice, Client, Status, InvoiceItem, UserProfile } from '../types';
import { db } from '../services/mockData';
import Modal from '../components/Modal';
import { Trash2, Download, Check, Plus, FileText, Calendar, DollarSign, User, ArrowLeft, Edit, Mail, ChevronDown } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

const generateId = () => Math.random().toString(36).substr(2, 9);

interface InvoiceItemRowProps {
  item: InvoiceItem;
  jobTypes: {id: string, name: string, defaultRate: number}[];
  onUpdate: (id: string, field: keyof InvoiceItem, value: any) => void;
  onRemove: (id: string) => void;
}

const InvoiceItemRow: React.FC<InvoiceItemRowProps> = ({ item, jobTypes, onUpdate, onRemove }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (job: {name: string, defaultRate: number}) => {
    onUpdate(item.id, 'description', job.name);
    onUpdate(item.id, 'unitPrice', job.defaultRate);
    setShowDropdown(false);
  };

  return (
    <div className="flex items-start gap-2 bg-gray-50 p-2 rounded border border-gray-200 relative group">
        <div className="flex-1 space-y-2">
            <div className="relative" ref={wrapperRef}>
                <input 
                    type="text"
                    className="w-full text-sm border rounded p-1 pr-8 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => onUpdate(item.id, 'description', e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                />
                <button 
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowDropdown(!showDropdown)}
                    tabIndex={-1}
                >
                    <ChevronDown size={14} />
                </button>
                
                {showDropdown && (
                    <div className="absolute z-20 w-full bg-white border border-gray-200 rounded shadow-lg mt-1 max-h-48 overflow-y-auto">
                        {jobTypes.map(job => (
                            <button
                                key={job.id}
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between items-center text-gray-700 hover:text-primary-700 transition-colors"
                                onClick={() => handleSelect(job)}
                            >
                                <span className="font-medium">{job.name}</span>
                                <span className="text-gray-400 text-xs">${job.defaultRate}/hr</span>
                            </button>
                        ))}
                        {jobTypes.length === 0 && (
                             <div className="px-3 py-2 text-sm text-gray-400 italic">No services configured in settings.</div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <div className="w-1/3">
                    <label className="text-xs text-gray-500 block">Qty</label>
                    <input 
                        type="number" 
                        min="1" 
                        className="w-full text-sm border rounded p-1 focus:ring-2 focus:ring-primary-500 outline-none" 
                        value={item.quantity} 
                        onChange={e => onUpdate(item.id, 'quantity', parseFloat(e.target.value))} 
                    />
                </div>
                <div className="w-1/3">
                    <label className="text-xs text-gray-500 block">Price</label>
                    <input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        className="w-full text-sm border rounded p-1 focus:ring-2 focus:ring-primary-500 outline-none" 
                        value={item.unitPrice} 
                        onChange={e => onUpdate(item.id, 'unitPrice', parseFloat(e.target.value))} 
                    />
                </div>
                <div className="w-1/3">
                        <label className="text-xs text-gray-500 block">Total</label>
                        <div className="text-sm font-medium py-1 text-right px-1">${(item.quantity * item.unitPrice).toFixed(2)}</div>
                </div>
            </div>
        </div>
        <button type="button" onClick={() => onRemove(item.id)} className="text-gray-300 hover:text-red-500 p-1 mt-1">
            <Trash2 size={16} />
        </button>
    </div>
  );
};

const InvoicesView: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [jobTypes, setJobTypes] = useState<{id: string, name: string, defaultRate: number}[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Form State
  const emptyInvoice: Partial<Invoice> = {
      clientId: '',
      clientName: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      status: Status.Unpaid,
      items: [],
      notes: '',
      amount: 0
  };
  const [formData, setFormData] = useState<Partial<Invoice>>(emptyInvoice);
  const [paymentData, setPaymentData] = useState({ paymentMethod: 'Cash', paymentNotes: ''});

  useEffect(() => {
    fetchData();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
        let profile = await db.getSettings();
        
        if (!profile) {
            const savedProfile = localStorage.getItem('cleanswift_user_profile');
            if (savedProfile) profile = JSON.parse(savedProfile);
        }

        if (profile) {
            setUserProfile(profile);
            if (profile.jobTypes && Array.isArray(profile.jobTypes)) {
                setJobTypes(profile.jobTypes);
            }
        }
    } catch (e) {
        console.error("Failed to load settings", e);
    }
  };

  const fetchData = async () => {
    const [invData, clientData] = await Promise.all([
        db.getInvoices(),
        db.getClients()
    ]);
    setInvoices(invData);
    setClients(clientData);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
        // Calculate total just in case
        const totalAmount = (formData.items || []).reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

        const invoiceToSave: Invoice = {
            id: formData.id || '',
            clientId: formData.clientId || '',
            clientName: formData.clientName || 'Unknown',
            date: formData.date || '',
            dueDate: formData.dueDate || '',
            status: formData.status || Status.Unpaid,
            items: formData.items || [],
            notes: formData.notes || '',
            amount: totalAmount
        };

        if (invoiceToSave.id) {
            await db.updateInvoice(invoiceToSave);
        } else {
            await db.addInvoice(invoiceToSave);
        }

        setIsModalOpen(false);
        if (selectedInvoice) setSelectedInvoice(invoiceToSave); // Update detail view if open
        fetchData();
    } catch (error) {
        console.error("Error saving invoice:", error);
        alert("Failed to save invoice.");
    } finally {
        setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(confirm("Are you sure you want to delete this invoice?")) {
        await db.deleteInvoice(id);
        setSelectedInvoice(null);
        fetchData();
    }
  };

  const handleEdit = (inv: Invoice) => {
      setFormData(JSON.parse(JSON.stringify(inv))); // Deep copy
      setIsModalOpen(true);
  };

  const handleNew = () => {
      const defaultDesc = jobTypes.length > 0 ? jobTypes[0].name : 'Cleaning Services';
      const defaultPrice = jobTypes.length > 0 ? jobTypes[0].defaultRate : 0;

      setFormData({
          ...emptyInvoice,
          items: [{ id: generateId(), description: defaultDesc, quantity: 1, unitPrice: defaultPrice }]
      });
      setIsModalOpen(true);
  };

  const handleOpenPaymentModal = () => {
      setPaymentData({ paymentMethod: 'Cash', paymentNotes: '' });
      setIsPaymentModalOpen(true);
  };

  const handleMarkAsPaid = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedInvoice) return;

      const updatedInvoice = {
          ...selectedInvoice,
          status: Status.Paid,
          ...paymentData
      };

      await db.updateInvoice(updatedInvoice);
      setSelectedInvoice(updatedInvoice); // Update view immediately
      setIsPaymentModalOpen(false);
      fetchData(); // Re-fetch all to update list view
  };

  const handleClientSelect = (clientId: string) => {
      const client = clients.find(c => c.id === clientId);
      if (client) {
          setFormData(prev => ({ ...prev, clientId: client.id, clientName: client.name }));
      } else {
          setFormData(prev => ({ ...prev, clientId: '', clientName: '' }));
      }
  };

  const handleDownloadPDF = () => {
    if (!selectedInvoice) return;

    const doc = new jsPDF();
    const client = clients.find(c => c.id === selectedInvoice.clientId);

    // --- HEADER SECTION ---
    let yPos = 20;
    
    // Logo Logic
    if (userProfile?.showLogoOnInvoice && userProfile.avatar) {
        try {
            // Add image at top left. 
            // Syntax: addImage(imageData, format, x, y, width, height)
            doc.addImage(userProfile.avatar, 'JPEG', 14, 15, 30, 30); 
            // If logo is present, we push the company text to the right or below. 
            // Let's push text to the right of the logo.
            doc.setFontSize(20);
            doc.setTextColor(14, 165, 233);
            doc.text(userProfile.companyName || "CleanSwift", 50, 25);
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(userProfile.companyAddress || "Professional House Cleaning", 50, 31);

            yPos = 50; // Push down start of next section
        } catch (e) {
            console.error("Error adding logo to PDF", e);
            // Fallback to text only if image fails
            doc.setFontSize(20);
            doc.setTextColor(14, 165, 233);
            doc.text(userProfile?.companyName || "CleanSwift", 14, 22);
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(userProfile?.companyAddress || "Professional House Cleaning", 14, 28);
            yPos = 45;
        }
    } else {
        // No Logo - Standard Layout
        doc.setFontSize(20);
        doc.setTextColor(14, 165, 233);
        doc.text(userProfile?.companyName || "CleanSwift", 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(userProfile?.companyAddress || "Professional House Cleaning", 14, 28);
        yPos = 45;
    }

    // Invoice Label (Top Right)
    doc.setFontSize(24);
    doc.setTextColor(0);
    doc.text("INVOICE", 140, 22);

    doc.setFontSize(10);
    doc.text(`Invoice #: ${selectedInvoice.id}`, 140, 30);
    doc.text(`Date: ${selectedInvoice.date}`, 140, 35);
    doc.text(`Due Date: ${selectedInvoice.dueDate}`, 140, 40);
    doc.text(`Status: ${selectedInvoice.status}`, 140, 45);

    // Bill To Section
    doc.text("Bill To:", 14, yPos);
    yPos += 7;
    doc.setFontSize(12);
    doc.text(selectedInvoice.clientName, 14, yPos);
    yPos += 5;
    
    if (client) {
        doc.setFontSize(10);
        doc.setTextColor(80);
        const primaryContact = client.contacts.find(c => c.isPrimary);
        const primaryLoc = client.locations.find(l => l.isPrimary);
        
        if (primaryLoc) {
             doc.text(primaryLoc.address, 14, yPos);
             yPos += 5;
        }
        if (primaryContact) {
            doc.text(primaryContact.name, 14, yPos);
            if (primaryContact.email) {
                 doc.text(primaryContact.email, 14, yPos + 5);
            }
        }
    }
    
    // Table
    const tableColumn = ["Description", "Quantity", "Unit Price", "Total"];
    const tableRows: any[] = [];

    selectedInvoice.items.forEach(item => {
      const itemData = [
        item.description,
        item.quantity,
        `$${item.unitPrice.toFixed(2)}`,
        `$${(item.quantity * item.unitPrice).toFixed(2)}`
      ];
      tableRows.push(itemData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: yPos + 15, // Dynamic start based on header height
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233] },
      styles: { fontSize: 10 },
    });

    // Total
    const finalY = (doc as any).lastAutoTable?.finalY || 80;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Amount: $${selectedInvoice.amount.toFixed(2)}`, 140, finalY + 15);

    // Notes
    if (selectedInvoice.notes) {
        doc.setFontSize(10);
        doc.text("Notes:", 14, finalY + 15);
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(selectedInvoice.notes, 14, finalY + 20, { maxWidth: 100 });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Thank you for your business!", 105, 280, { align: "center" });

    doc.save(`invoice_${selectedInvoice.id}.pdf`);
  };

  // Item Form Helpers
  const addItem = () => {
      setFormData(prev => ({
          ...prev,
          items: [...(prev.items || []), { id: generateId(), description: '', quantity: 1, unitPrice: 0 }]
      }));
  };

  const removeItem = (id: string) => {
      setFormData(prev => ({
          ...prev,
          items: (prev.items || []).filter(i => i.id !== id)
      }));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
      setFormData(prev => ({
          ...prev,
          items: (prev.items || []).map(i => i.id === id ? { ...i, [field]: value } : i)
      }));
  };

  const statusColors = {
    [Status.Paid]: 'bg-green-100 text-green-800 border-green-200',
    [Status.Unpaid]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [Status.Overdue]: 'bg-red-100 text-red-800 border-red-200',
  };

  // --- RENDERERS ---

  const renderDetailView = () => {
    if (!selectedInvoice) return null;
    const client = clients.find(c => c.id === selectedInvoice.clientId);

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedInvoice(null)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Invoice #{selectedInvoice.id}</h2>
                        <p className="text-sm text-gray-500">Issued: {selectedInvoice.date}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm">
                         <Download size={16} /> PDF
                    </button>
                    <button onClick={() => handleEdit(selectedInvoice)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm">
                        <Edit size={16} /> Edit
                    </button>
                    <button onClick={() => handleDelete(selectedInvoice.id)} className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-red-600 hover:bg-red-100 shadow-sm">
                        <Trash2 size={16} /> Delete
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column: Summary & Client Info */}
                <div className="space-y-6">
                    
                    {/* Status Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-gray-800">Status</h3>
                            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full border ${statusColors[selectedInvoice.status] || 'bg-gray-100'}`}>
                                {selectedInvoice.status}
                            </span>
                         </div>
                         <div className="space-y-3 text-sm">
                             <div className="flex justify-between border-b border-gray-100 pb-2">
                                 <span className="text-gray-500">Issue Date</span>
                                 <span className="font-medium">{selectedInvoice.date}</span>
                             </div>
                             <div className="flex justify-between border-b border-gray-100 pb-2">
                                 <span className="text-gray-500">Due Date</span>
                                 <span className="font-medium">{selectedInvoice.dueDate}</span>
                             </div>
                             <div className="flex justify-between pt-2">
                                 <span className="text-gray-500">Total Amount</span>
                                 <span className="font-bold text-lg text-gray-900">${selectedInvoice.amount.toFixed(2)}</span>
                             </div>
                         </div>
                         {selectedInvoice.status !== Status.Paid ? (
                            <button onClick={handleOpenPaymentModal} className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                                <Check size={18}/> Mark as Paid
                            </button>
                         ) : (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                                <p className="font-semibold text-green-800">Paid</p>
                                <p className="text-green-700">Method: {selectedInvoice.paymentMethod || 'N/A'}</p>
                                {selectedInvoice.paymentNotes && <p className="text-green-700 text-xs mt-1">Notes: {selectedInvoice.paymentNotes}</p>}
                            </div>
                         )}
                    </div>

                    {/* Client Info Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                         <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2"><User size={18}/> Bill To</h3>
                        </div>
                        <div className="p-6">
                            <div className="text-lg font-medium text-gray-900 mb-1">{selectedInvoice.clientName}</div>
                            {client && (
                                <div className="text-sm text-gray-600 space-y-1">
                                    {client.contacts.filter(c => c.isPrimary).map(c => (
                                        <div key={c.id}>
                                            <div>{c.name}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                              <Mail size={12}/> 
                                              <a href={`mailto:${c.email}`} className="hover:text-primary-600 hover:underline">{c.email}</a>
                                            </div>
                                        </div>
                                    ))}
                                    {client.locations.filter(l => l.isPrimary).map(l => (
                                        <div key={l.id} className="mt-2 pt-2 border-t border-gray-100">
                                            <a href={`https://maps.google.com/?q=${encodeURIComponent(l.address)}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 hover:underline">
                                                {l.address}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes Card */}
                    {selectedInvoice.notes && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                             <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><FileText size={18}/> Notes</h3>
                             <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-100">
                                 {selectedInvoice.notes}
                             </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Line Items */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2"><DollarSign size={18}/> Invoice Items</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 w-1/2">Description</th>
                                        <th className="px-6 py-3 text-center">Qty</th>
                                        <th className="px-6 py-3 text-right">Unit Price</th>
                                        <th className="px-6 py-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {selectedInvoice.items.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.description}</td>
                                            <td className="px-6 py-4 text-center">{item.quantity}</td>
                                            <td className="px-6 py-4 text-right">${item.unitPrice.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-right font-medium">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 font-semibold text-gray-900">
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-right">Total</td>
                                        <td className="px-6 py-4 text-right text-lg">${selectedInvoice.amount.toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            </table>
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
            <h2 className="text-2xl font-bold text-gray-800">Invoices</h2>
            <button onClick={handleNew} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm">
                <Plus size={20} /> Create Invoice
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {invoices.map(inv => (
                <div 
                    key={inv.id} 
                    onClick={() => setSelectedInvoice(inv)}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-transparent hover:border-l-primary-500"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-lg text-gray-900">{inv.clientName}</h3>
                            <span className="text-sm text-gray-500">#{inv.id}</span>
                        </div>
                         <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${statusColors[inv.status] || 'bg-gray-100 text-gray-700'}`}>
                          {inv.status}
                        </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                         <div className="flex justify-between">
                             <span>Issued:</span>
                             <span className="font-medium">{inv.date}</span>
                         </div>
                         <div className="flex justify-between">
                             <span>Due:</span>
                             <span className={`font-medium ${new Date(inv.dueDate) < new Date() && inv.status !== Status.Paid ? 'text-red-600' : ''}`}>
                                 {inv.dueDate}
                             </span>
                         </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                        <div className="text-xs text-gray-400">{inv.items.length} Items</div>
                        <div className="text-xl font-bold text-gray-900">${inv.amount.toFixed(2)}</div>
                    </div>
                </div>
            ))}
            {invoices.length === 0 && <div className="col-span-full text-center p-8 text-gray-400 italic">No invoices found.</div>}
          </div>
      </div>
  );

  return (
    <>
        {selectedInvoice ? renderDetailView() : renderListView()}
        
        {/* Payment Modal */}
        <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Record Payment">
            <form onSubmit={handleMarkAsPaid} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                        value={paymentData.paymentMethod}
                        onChange={e => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 p-2"
                    >
                        <option>Cash</option>
                        <option>Check</option>
                        <option>Bank Transfer</option>
                        <option>Credit Card</option>
                        <option>Other</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Notes (Optional)</label>
                    <textarea
                        value={paymentData.paymentNotes}
                        onChange={e => setPaymentData({ ...paymentData, paymentNotes: e.target.value })}
                        rows={3}
                        className="block w-full rounded-lg border border-gray-300 p-2"
                        placeholder="Check number, transaction ID, etc."
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                        Confirm Payment
                    </button>
                </div>
            </form>
        </Modal>

        {/* Invoice Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Invoice" : "Create Invoice"}>
             <form onSubmit={handleSave} className="space-y-6">
                 {/* Client Select */}
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

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                        <input 
                            required type="date" 
                            className="block w-full rounded-lg border border-gray-300 p-2"
                            value={formData.date} 
                            onChange={e => setFormData({...formData, date: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                        <input 
                            required type="date" 
                            className="block w-full rounded-lg border border-gray-300 p-2"
                            value={formData.dueDate} 
                            onChange={e => setFormData({...formData, dueDate: e.target.value})} 
                        />
                    </div>
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select 
                        className="block w-full rounded-lg border border-gray-300 p-2"
                        value={formData.status} 
                        onChange={e => setFormData({...formData, status: e.target.value as Status})}
                    >
                        <option value={Status.Unpaid}>Unpaid</option>
                        <option value={Status.Paid}>Paid</option>
                        <option value={Status.Overdue}>Overdue</option>
                    </select>
                </div>

                {/* Items */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Line Items</label>
                        <button type="button" onClick={addItem} className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded hover:bg-primary-100">
                            + Add Item
                        </button>
                    </div>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {(formData.items || []).map(item => (
                            <InvoiceItemRow 
                                key={item.id}
                                item={item}
                                jobTypes={jobTypes}
                                onUpdate={updateItem}
                                onRemove={removeItem}
                            />
                        ))}
                    </div>
                    <div className="flex justify-end mt-2 pt-2 border-t border-gray-200">
                        <span className="text-sm font-bold text-gray-800">Total: ${(formData.items || []).reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}</span>
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea 
                        className="block w-full rounded-lg border border-gray-300 p-2"
                        rows={2}
                        value={formData.notes} 
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                        placeholder="Payment terms, thanks, etc."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200" disabled={submitting}>Cancel</button>
                    <button type="submit" disabled={submitting} className={`px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {submitting ? 'Saving...' : 'Save Invoice'}
                    </button>
                </div>
             </form>
        </Modal>
    </>
  );
};

export default InvoicesView;