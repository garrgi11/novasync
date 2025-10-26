import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Dashboard from '../Dashboard';
import { useWallet } from '../WalletContext';
import Buy from './Buy';
import Activity from './Activity';

const Layout = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const { account, balance, disconnectWallet, userData } = useWallet();

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'buy-electricity':
        return <Buy/>;
      case 'activity':
        return <Activity/>;
      case 'wallet':
        return <div className="p-8">Wallet Page - Coming Soon</div>;
      case 'analytics':
        return <div className="p-8">Usage Analytics Page - Coming Soon</div>;
      case 'settings':
        return <div className="p-8">Settings Page - Coming Soon</div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="text-left px-[5vw] py-[3vw]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[42px] font-semibold text-gray-900">
                {activePage === 'dashboard' && `Welcome back, ${userData?.name || 'User'}!`}
                {activePage === 'buy-electricity' && 'Buy Electricity'}
                {activePage === 'activity' && 'Activity'}
                {activePage === 'wallet' && 'Wallet Management'}
                {activePage === 'analytics' && 'Usage Analytics'}
                {activePage === 'settings' && 'Settings'}
              </h2>
              {activePage === 'dashboard' && (
                <p className="text-gray-600 mt-1">
                  Here's what's happening with your energy today.
                </p>
              )}
            </div>
            
            {/* Wallet Connection Status */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  {balance || '0.0000'} ETH
                </span>
              </div>
              <button
                onClick={disconnectWallet}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default Layout; 