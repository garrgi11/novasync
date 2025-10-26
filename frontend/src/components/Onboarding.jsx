import React, { useState } from 'react';
import apiService from '../services/api';

const Onboarding = ({ walletAddress, onComplete }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('individual');
  const [meterId, setMeterId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !meterId.trim()) {
      setError('Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiService.onboardUser({
        name: name.trim(),
        email: email.trim(),
        walletAddress,
        userType,
        meterId: meterId.trim()
      });

      onComplete(response.user);
    } catch (error) {
      setError(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connect your wallet to a smart meter to get started
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-2">
                User Type
              </label>
              <select
                id="userType"
                name="userType"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
              >
                <option value="individual">Individual Consumer</option>
                <option value="power_supplier">Power Supplier</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Select whether you're an individual consumer or a power supplier
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="wallet" className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address
              </label>
              <input
                id="wallet"
                name="wallet"
                type="text"
                disabled
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 bg-gray-50 text-gray-500 text-sm"
                value={walletAddress}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="meter" className="block text-sm font-medium text-gray-700 mb-2">
                Smart Meter ID
              </label>
              <input
                id="meter"
                name="meter"
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your smart meter ID"
                value={meterId}
                onChange={(e) => setMeterId(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the unique identifier for your smart electricity meter
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {error}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Complete Setup'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                What happens next?
              </span>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Once you complete setup, you'll be able to:</p>
            <ul className="mt-2 space-y-1">
              <li>• View your meter balance in real-time</li>
              <li>• Purchase electricity tokens</li>
              <li>• Monitor your energy consumption</li>
              <li>• Access your transaction history</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding; 