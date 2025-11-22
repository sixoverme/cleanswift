import React, { useEffect, useState } from 'react';
import { db } from '../services/mockData';
import { Users, Calendar, AlertCircle, DollarSign, TrendingUp, Clock, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { Status, Appointment, InventoryItem } from '../types';

const DashboardView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  
  const [stats, setStats] = useState({
    weekEarnings: 0,
    todayPotential: 0,
    weekPotential: 0
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [appointments, inventory] = await Promise.all([
        db.getAppointments(),
        db.getInventory()
      ]);

      // Date Helpers
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
      endOfWeek.setHours(23, 59, 59, 999);

      // 1. Filter Today's Appointments
      const todays = appointments.filter(a => a.date === todayStr).sort((a, b) => a.time.localeCompare(b.time));
      setTodayAppointments(todays);

      // 2. Filter Low Stock
      const lowStock = inventory.filter(i => i.status === Status.LowStock);
      setLowStockItems(lowStock);

      // 3. Calculate Financials
      let earnedSoFar = 0;
      let potentialToday = 0;
      let potentialWeek = 0;

      appointments.forEach(apt => {
        const aptDate = new Date(apt.date);
        const revenue = apt.rate * apt.estimatedHours;

        // Is in current week?
        const isThisWeek = aptDate >= startOfWeek && aptDate <= endOfWeek;

        if (isThisWeek) {
            potentialWeek += revenue;
            if (apt.status === Status.Completed || apt.status === Status.Paid) {
                earnedSoFar += revenue;
            }
        }

        if (apt.date === todayStr) {
            potentialToday += revenue;
        }
      });

      setStats({
        weekEarnings: earnedSoFar,
        todayPotential: potentialToday,
        weekPotential: potentialWeek
      });

      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>
      
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
             <p className="text-sm font-medium text-gray-500 mb-1">Week So Far</p>
             <h3 className="text-2xl font-bold text-green-600">${stats.weekEarnings.toFixed(2)}</h3>
             <p className="text-xs text-gray-400 mt-1">Realized Earnings</p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-full">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
             <p className="text-sm font-medium text-gray-500 mb-1">Today's Potential</p>
             <h3 className="text-2xl font-bold text-blue-600">${stats.todayPotential.toFixed(2)}</h3>
             <p className="text-xs text-gray-400 mt-1">{todayAppointments.length} Jobs Scheduled</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
             <p className="text-sm font-medium text-gray-500 mb-1">Week's Potential</p>
             <h3 className="text-2xl font-bold text-purple-600">${stats.weekPotential.toFixed(2)}</h3>
             <p className="text-xs text-gray-400 mt-1">Total Forecast</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
            <Calendar size={24} />
          </div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Today's Schedule (2/3 Width) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                <Calendar size={20} className="text-primary-600" /> 
                Today's Schedule
            </h3>
            
            <div className="space-y-4">
                {todayAppointments.length > 0 ? (
                    todayAppointments.map(apt => (
                        <div key={apt.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center hover:shadow-md transition-shadow">
                            <div className="mb-3 sm:mb-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="bg-primary-50 text-primary-700 font-bold px-2 py-1 rounded text-sm border border-primary-100">
                                        {apt.time}
                                    </span>
                                    <h4 className="font-bold text-gray-900 text-lg">{apt.clientName}</h4>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500 ml-1">
                                    <span className="flex items-center gap-1"><Clock size={14}/> {apt.estimatedHours} hrs</span>
                                    <span className="flex items-center gap-1">
                                        <MapPin size={14}/> 
                                        <a 
                                            href={`https://maps.google.com/?q=${encodeURIComponent(apt.address)}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="hover:text-primary-600 hover:underline transition-colors"
                                        >
                                            {apt.address}
                                        </a>
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                <span className="font-medium text-gray-900 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                    ${(apt.rate * apt.estimatedHours).toFixed(0)}
                                </span>
                                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full border ${
                                    apt.status === Status.Completed ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                }`}>
                                    {apt.status}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white border-dashed border-2 border-gray-200 rounded-xl p-12 text-center text-gray-400">
                        <div className="flex justify-center mb-4"><CheckCircle size={48} className="text-gray-200"/></div>
                        <p className="text-lg font-medium">No appointments scheduled for today.</p>
                        <p className="text-sm">Enjoy your day off!</p>
                    </div>
                )}
            </div>
          </div>

          {/* Low Stock Alerts (1/3 Width) */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                <AlertTriangle size={20} className="text-amber-500" /> 
                Low Stock Alerts
            </h3>
            
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {lowStockItems.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {lowStockItems.map(item => (
                            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="font-medium text-gray-900">{item.itemName}</p>
                                    <p className="text-xs text-red-500 font-medium mt-0.5">
                                        Only {item.quantity} {item.unit} left
                                    </p>
                                </div>
                                <button className="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md shadow-sm transition-colors">
                                    Restock
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-400">
                        <div className="flex justify-center mb-2"><CheckCircle size={32} className="text-green-100"/></div>
                        <p className="text-sm">Inventory is healthy.</p>
                    </div>
                )}
                <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
                    <button className="text-sm text-primary-600 font-medium hover:text-primary-700">View All Inventory</button>
                </div>
            </div>
          </div>

      </div>
    </div>
  );
};

export default DashboardView;