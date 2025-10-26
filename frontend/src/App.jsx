import { useState, useEffect } from 'react'
import { Chart } from 'chart.js/auto'
import './App.css'
import Diagram from './diagram';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import { useWallet } from './WalletContext';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const { 
    isConnected, 
    account, 
    provider, 
    signer, 
    userData,
    isOnboarding,
    connectWallet, 
    disconnectWallet, 
    completeOnboarding,
    isLoading 
  } = useWallet();

  // Chart initialization effect
  useEffect(() => {
    const ctx = document.getElementById('stakeholderChart');
    let chartInstance = null;
    
    if (ctx) {
      Chart.getChart(ctx)?.destroy();
      
      chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Households', 'Utility Providers', 'Mobile Money', 'Bridge Partners'],
          datasets: [{
            data: [55, 20, 15, 10],
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(107, 114, 128, 0.8)'
            ],
            borderColor: [
              'rgba(59, 130, 246, 1)',
              'rgba(16, 185, 129, 1)',
              'rgba(245, 158, 11, 1)',
              'rgba(107, 114, 128, 1)'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true
              }
            }
          }
        }
      });
    }
    
    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, []);

  // Navigation effects
  useEffect(() => {
    const navLinks = document.querySelectorAll('.nav-link, #mobile-menu a');
    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
        setMobileMenuOpen(false);
      });
    });

    const sections = document.querySelectorAll('section');
    const navLinksDesktop = document.querySelectorAll('.nav-link');

    const handleScroll = () => {
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 120) {
          current = section.getAttribute('id');
        }
      });

      navLinksDesktop.forEach(link => {
        link.classList.remove('text-blue-600', 'border-blue-600');
        link.classList.add('text-gray-600', 'border-transparent');
        if (link.getAttribute('href').includes(current)) {
          link.classList.remove('text-gray-600', 'border-transparent');
          link.classList.add('text-blue-600', 'border-blue-600');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tabContent = {
    '1': {
      title: 'Conditional Orders',
      content: 'Custom on-chain electricity orders with predicate checks tied to mobile money payments, ensuring atomicity between real-world payments and token transfers.'
    },
    '2': {
      title: 'TWAP-like Budgeting',
      content: 'Automated time-weighted purchases allowing users to set recurring budgets for electricity, creating a series of small, automated limit orders for steady power supply.'
    },
    '3': {
      title: 'Dynamic Pricing',
      content: 'Real-time pricing using oracles to fetch forex rates and utility tariffs, ensuring users get accurate and transparent conversions for fiat-to-ElectricityToken swaps.'
    },
    '4': {
      title: 'Gasless Execution',
      content: 'Backend resolvers monitor signed orders and fulfill them while paying all gas fees, providing a completely gasless experience for end-users.'
    },
    '5': {
      title: 'Order Aggregation',
      content: 'Multi-source aggregation finding the most efficient routes for fiat-to-crypto conversion by checking different bridge partners for optimal rates.'
    }
  };

  // Show loading state while checking connection
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking wallet connection...</p>
        </div>
      </div>
    );
  }

  // If connected but onboarding, show onboarding
  if (isConnected && isOnboarding) {
    return (
      <Onboarding 
        walletAddress={account}
        onComplete={completeOnboarding}
      />
    );
  }

  // If connected and user data exists, show dashboard
  if (isConnected && userData) {
    return <Layout />;
  }

  // Landing page with connect wallet button
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Gridsync
              </h1>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#overview" className="nav-link text-gray-600 hover:text-blue-600 font-medium border-b-2 border-transparent hover:border-blue-600 transition-colors duration-200">
                Overview
              </a>
              <a href="#workflow" className="nav-link text-gray-600 hover:text-blue-600 font-medium border-b-2 border-transparent hover:border-blue-600 transition-colors duration-200">
                How It Works
              </a>
              <a href="#tech" className="nav-link text-gray-600 hover:text-blue-600 font-medium border-b-2 border-transparent hover:border-blue-600 transition-colors duration-200">
                Technology
              </a>
              <button
                onClick={connectWallet}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                Connect Wallet
              </button>
            </div>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </nav>
        
        {/* Mobile menu */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden border-t border-gray-200`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            <a href="#overview" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md">
              Overview
            </a>
            <a href="#workflow" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md">
              How It Works
            </a>
            <a href="#tech" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md">
              Technology
            </a>
            <button
              onClick={connectWallet}
              className="w-full text-left px-3 py-2 text-base font-medium text-blue-600 hover:bg-blue-50 rounded-md"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section id="overview" className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              A New Paradigm for Energy Access
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Gridsync leverages DeFi principles to solve real-world energy challenges in East Africa, 
              making electricity access seamless, programmable, and inclusive.
            </p>
            <div className="mt-8">
              <button
                onClick={connectWallet}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 text-lg"
              >
                Connect Wallet to Get Started
              </button>
            </div>
          </div>

                     <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
             <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
               <div className="flex justify-center mb-6">
                 <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                 </svg>
               </div>
               <h3 className="text-xl font-semibold text-gray-900 mb-4">Executive Summary</h3>
               <p className="text-gray-600 leading-relaxed">
                 Innovative dApp providing seamless electricity access in East Africa through utility tokenization 
                 and mobile money integration.
               </p>
             </div>

             <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
               <div className="flex justify-center mb-6">
                 <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
               </div>
               <h3 className="text-xl font-semibold text-gray-900 mb-4">The Problem</h3>
               <p className="text-gray-600 leading-relaxed">
                 Current prepaid electricity systems are manual, fragmented, and inefficient, 
                 creating significant hurdles for users in rural areas.
               </p>
             </div>

             <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
               <div className="flex justify-center mb-6">
                 <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
               </div>
               <h3 className="text-xl font-semibold text-gray-900 mb-4">The Solution</h3>
               <p className="text-gray-600 leading-relaxed">
                 Unified mobile-first platform connecting mobile money directly to smart meters 
                 via custom blockchain system with gasless experience.
               </p>
             </div>

             <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
               <div className="flex justify-center mb-6">
                 <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                 </svg>
               </div>
               <h3 className="text-xl font-semibold text-gray-900 mb-4">Stakeholders</h3>
               <p className="text-gray-600 leading-relaxed">
                 End-users in East African households, utility providers like KPLC, 
                 and mobile money platforms creating a multi-faceted partnership.
               </p>
             </div>
           </div>
        </section>

        {/* Workflow Section */}
        <section id="workflow" className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From mobile payment to instant electricity access - the automated journey of a Gridsync transaction.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { step: '1', title: 'Payment Initiation', desc: 'User initiates payment through mobile app using M-Pesa' },
              { step: '2', title: 'On-Chain Order', desc: 'Creates conditional order tied to payment confirmation' },
              { step: '3', title: 'Automated Resolution', desc: 'Resolver triggers fulfillment upon payment confirmation' },
              { step: '4', title: 'Token Delivery', desc: 'Fiat converted to ElectricityToken and sent to wallet' },
              { step: '5', title: 'Instant Access', desc: 'User receives notification and power continues uninterrupted' }
            ].map((item, index) => (
              <div key={item.step} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mb-4">
                  {item.step}
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">{item.title}</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                {index < 4 && (
                  <div className="hidden lg:block absolute top-8 -right-3 w-6 h-0.5 bg-gray-200"></div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Technology Section */}
        <section id="tech">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Technical Deep Dive
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore the technology stack and innovative extensions of the 1inch Limit Order Protocol.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Tech Stack */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-2xl font-semibold text-gray-900 mb-8">Technology Stack</h3>
                <div className="space-y-4">
                  {[
                    { category: 'Frontend', tech: 'React Native' },
                    { category: 'Backend & Resolver', tech: 'Node.js / FastAPI' },
                    { category: 'Blockchain', tech: 'Solidity & Hardhat on L2' },
                    { category: 'Integrations', tech: 'M-Pesa, EVC, KPLC APIs' }
                  ].map((item, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-xl">
                      <p className="font-semibold text-gray-900 text-sm">{item.category}</p>
                      <p className="text-gray-600 text-sm">{item.tech}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Market Overview</h3>
                  <div className="w-full h-64">
                    <canvas id="stakeholderChart"></canvas>
                  </div>
                </div>
              </div>
            </div>

            {/* 1inch LOP Features */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-2xl font-semibold text-gray-900 mb-8">Extending the 1inch LOP</h3>
                
                <div className="flex flex-wrap gap-3 mb-8">
                  {[
                    { id: '1', label: 'Conditional Orders' },
                    { id: '2', label: 'TWAP-like Budgeting' },
                    { id: '3', label: 'Dynamic Pricing' },
                    { id: '4', label: 'Gasless Execution' },
                    { id: '5', label: 'Order Aggregation' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-xl font-semibold text-blue-600 mb-4">
                    {tabContent[activeTab].title}
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {tabContent[activeTab].content}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Diagram></Diagram>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2025 Gridsync. A conceptual project exploring the future of decentralized utilities.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
