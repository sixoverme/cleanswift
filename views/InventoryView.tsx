import React, { useEffect, useState } from 'react';
import { InventoryItem, Status } from '../types';
import { db } from '../services/mockData';
import Modal from '../components/Modal';
import { Plus, AlertTriangle, ArrowLeft, Edit, Trash2, Package, DollarSign, ShoppingCart, FileText, CheckCircle } from 'lucide-react';

const InventoryView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  const emptyItem: Partial<InventoryItem> = { 
      itemName: '', 
      quantity: 0, 
      unit: 'pcs', 
      minThreshold: 5,
      supplier: '',
      cost: 0,
      notes: ''
  };
  
  const [formData, setFormData] = useState<Partial<InventoryItem>>(emptyItem);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setItems(await db.getInventory());
  };

  const handleQuantityChange = async (id: string, newQty: number, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent card click
      if (newQty < 0) return;
      await db.updateInventoryQuantity(id, newQty);
      
      // Update local state immediately for better UX
      setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: newQty, status: newQty <= i.minThreshold ? Status.LowStock : Status.InStock } : i));
      if (selectedItem && selectedItem.id === id) {
          setSelectedItem(prev => prev ? { ...prev, quantity: newQty, status: newQty <= prev.minThreshold ? Status.LowStock : Status.InStock } : null);
      }
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      const itemToSave = {
          ...formData,
          id: formData.id || '', // ID handled by service if empty
          status: (formData.quantity || 0) <= (formData.minThreshold || 0) ? Status.LowStock : Status.InStock
      } as InventoryItem;

      if (itemToSave.id) {
          await db.updateInventoryItem(itemToSave);
      } else {
          await db.addInventoryItem(itemToSave);
      }
      
      setIsModalOpen(false);
      setFormData(emptyItem);
      loadInventory();
      if (selectedItem && selectedItem.id === itemToSave.id) {
          setSelectedItem(itemToSave);
      }
  };

  const handleEdit = (item: InventoryItem, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setFormData({ ...item });
      setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (confirm("Are you sure you want to delete this item?")) {
          await db.deleteInventoryItem(id);
          setSelectedItem(null);
          loadInventory();
      }
  };

  const handleAddNew = () => {
      setFormData(emptyItem);
      setIsModalOpen(true);
  };

  const renderDetailView = () => {
      if (!selectedItem) return null;

      return (
        <div className="p-6">
             {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedItem(null)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{selectedItem.itemName}</h2>
                        <p className="text-sm text-gray-500">Inventory Details</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={(e) => handleEdit(selectedItem, e)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm">
                        <Edit size={16} /> Edit
                    </button>
                    <button onClick={(e) => handleDelete(selectedItem.id, e)} className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-red-600 hover:bg-red-100 shadow-sm">
                        <Trash2 size={16} /> Delete
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Status & Basic Info */}
                <div className="space-y-6">
                    
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Package size={18}/> Stock Level</h3>
                            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full flex items-center gap-1 ${selectedItem.status === Status.LowStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {selectedItem.status === Status.LowStock ? <AlertTriangle size={12}/> : <CheckCircle size={12}/>}
                                {selectedItem.status}
                            </span>
                        </div>
                        
                        <div className="flex items-center justify-center py-4 mb-4 bg-gray-50 rounded-lg">
                             <div className="text-center">
                                <div className="text-sm text-gray-500 mb-2">Current Quantity</div>
                                <div className="flex items-center gap-4">
                                    <button onClick={(e) => handleQuantityChange(selectedItem.id, selectedItem.quantity - 1, e)} className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 shadow-sm">-</button>
                                    <span className="text-4xl font-bold text-gray-900">{selectedItem.quantity}</span>
                                    <button onClick={(e) => handleQuantityChange(selectedItem.id, selectedItem.quantity + 1, e)} className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 shadow-sm">+</button>
                                </div>
                                <div className="text-xs text-gray-400 mt-2">{selectedItem.unit}</div>
                             </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-sm">
                            <span className="text-gray-600">Low Stock Threshold:</span>
                            <span className="font-medium text-gray-900">{selectedItem.minThreshold} {selectedItem.unit}</span>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><FileText size={18}/> Notes</h3>
                        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 text-sm text-gray-700">
                             {selectedItem.notes || "No notes available."}
                        </div>
                    </div>

                </div>

                {/* Right Column: Purchasing Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2"><ShoppingCart size={18}/> Purchasing Details</h3>
                        
                        <div className="space-y-4">
                             <div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Supplier / Store</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <ShoppingCart size={16} className="text-primary-500" />
                                    <p className="text-lg font-medium text-gray-900">{selectedItem.supplier || "Unknown Supplier"}</p>
                                </div>
                             </div>

                             <div className="pt-4 border-t border-gray-100">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cost per Unit</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <DollarSign size={16} className="text-primary-500" />
                                    <p className="text-lg font-medium text-gray-900">${selectedItem.cost?.toFixed(2) || "0.00"}</p>
                                </div>
                             </div>

                             <div className="pt-4 border-t border-gray-100">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Estimated Total Value</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <DollarSign size={16} className="text-green-600" />
                                    <p className="text-lg font-bold text-green-600">${((selectedItem.cost || 0) * selectedItem.quantity).toFixed(2)}</p>
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
            <h2 className="text-2xl font-bold text-gray-800">Inventory</h2>
            <button onClick={handleAddNew} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
                <Plus size={20} /> Add Item
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
                <div 
                    key={item.id} 
                    onClick={() => setSelectedItem(item)}
                    className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-transparent hover:border-l-primary-500"
                >
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-lg text-gray-800">{item.itemName}</h3>
                        {item.status === Status.LowStock && (
                            <AlertTriangle className="text-red-500" size={20} />
                        )}
                    </div>
                    
                    <div className="flex items-end justify-between">
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Quantity ({item.unit})</div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={(e) => handleQuantityChange(item.id, item.quantity - 1, e)} 
                                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                                >-</button>
                                <span className="text-xl font-mono font-semibold w-8 text-center">{item.quantity}</span>
                                <button 
                                    onClick={(e) => handleQuantityChange(item.id, item.quantity + 1, e)} 
                                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                                >+</button>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-400">Min: {item.minThreshold}</div>
                            <div className={`text-sm font-medium ${item.status === Status.LowStock ? 'text-red-600' : 'text-green-600'}`}>
                                {item.status}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            {items.length === 0 && <div className="col-span-full text-center p-8 text-gray-400 italic">No inventory items found.</div>}
        </div>
    </div>
  );

  return (
    <>
      {selectedItem ? renderDetailView() : renderListView()}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Supply Item" : "Add Supply Item"}>
          <form onSubmit={handleSave} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                  <input required className="w-full border border-gray-300 rounded-lg p-2" value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input type="number" min="0" required className="w-full border border-gray-300 rounded-lg p-2" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input required className="w-full border border-gray-300 rounded-lg p-2" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="e.g. box" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                      <input type="number" min="0" required className="w-full border border-gray-300 rounded-lg p-2" value={formData.minThreshold} onChange={e => setFormData({...formData, minThreshold: parseInt(e.target.value)})} />
                  </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit</label>
                      <div className="relative">
                        <input type="number" min="0" step="0.01" className="w-full border border-gray-300 rounded-lg p-2 pl-6" value={formData.cost} onChange={e => setFormData({...formData, cost: parseFloat(e.target.value)})} />
                        <span className="absolute left-2 top-2 text-gray-400">$</span>
                      </div>
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier / Store</label>
                  <input className="w-full border border-gray-300 rounded-lg p-2" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} placeholder="e.g. Amazon, Costco" />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea className="w-full border border-gray-300 rounded-lg p-2" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Brand preference, etc." />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                  <button className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 text-sm font-medium">Save Item</button>
              </div>
          </form>
      </Modal>
    </>
  );
};

export default InventoryView;