import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, Users, Calendar, FileText, Package, Settings } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, toggleSidebar }) => {
  const menuItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'CLIENTS', label: 'Clients', icon: Users },
    { id: 'APPOINTMENTS', label: 'Appointments', icon: Calendar },
    { id: 'INVOICES', label: 'Invoices', icon: FileText },
    { id: 'INVENTORY', label: 'Inventory', icon: Package },
  ];

  const baseClass = "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto";
  const visibilityClass = isOpen ? "translate-x-0" : "-translate-x-full";

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      <aside className={`${baseClass} ${visibilityClass}`}>
        <div className="flex items-center justify-center h-16 border-b border-gray-200 px-6">
          <h1 className="text-xl font-bold text-primary-600 flex items-center gap-2">
             CleanSwift
          </h1>
        </div>

        <nav className="mt-6 px-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onChangeView(item.id as ViewState);
                if (window.innerWidth < 1024) toggleSidebar();
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                currentView === item.id
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className={`mr-3 h-5 w-5 ${currentView === item.id ? 'text-primary-600' : 'text-gray-400'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full border-t border-gray-200 p-4">
             <button className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">
                 <Settings className="mr-3 h-5 w-5 text-gray-400" />
                 Settings
             </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
