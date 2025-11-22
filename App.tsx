import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './views/DashboardView';
import ClientsView from './views/ClientsView';
import AppointmentsView from './views/AppointmentsView';
import InvoicesView from './views/InvoicesView';
import InventoryView from './views/InventoryView';
import WelcomeScreen from './components/WelcomeScreen';
import { db } from './services/mockData';
import { ViewState } from './types';
import { Menu, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLoginSuccess = async (token: string) => {
    setIsInitializing(true);
    try {
      await db.initGoogleMode(token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Failed to initialize DB:", error);
      alert("Failed to connect to Google Sheets. Please try again.");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDemoMode = () => {
    db.setMockMode();
    setIsAuthenticated(true);
  };

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD': return <DashboardView />;
      case 'CLIENTS': return <ClientsView />;
      case 'APPOINTMENTS': return <AppointmentsView />;
      case 'INVOICES': return <InvoicesView />;
      case 'INVENTORY': return <InventoryView />;
      default: return <DashboardView />;
    }
  };

  if (!isAuthenticated) {
    if (isInitializing) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-50 text-primary-600 gap-4">
           <Loader2 className="w-12 h-12 animate-spin" />
           <p className="text-gray-600 font-medium">Connecting to Google Sheets...</p>
           <p className="text-xs text-gray-400">Setting up your CleanSwift dashboard.</p>
        </div>
      );
    }
    return <WelcomeScreen onLoginSuccess={handleLoginSuccess} onDemoMode={handleDemoMode} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 lg:hidden flex items-center p-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <Menu size={24} />
          </button>
          <h1 className="ml-4 text-lg font-semibold text-gray-800">CleanSwift Manager</h1>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-scroll">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;