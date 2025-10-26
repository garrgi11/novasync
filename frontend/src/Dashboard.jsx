import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './WalletContext';
import EnergyChart from './components/EnergyChart';
import ApiService from './services/api';

const Dashboard = () => {
  const { account, provider, userData } = useWallet();
  const [balance, setBalance] = useState('0.0000');
  const [isLoading, setIsLoading] = useState(true);
  const [userBalance, setUserBalance] = useState({
    balanceUsd: '0.00',
    balanceWatts: '0.00'
  });

  useEffect(() => {
    const fetchAccountInfo = async () => {
      if (provider && account) {
        try {
          const balanceWei = await provider.getBalance(account);
          const balanceEth = ethers.formatEther(balanceWei);
          setBalance(parseFloat(balanceEth).toFixed(4));
        } catch (error) {
          console.error('Error fetching account info:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchAccountInfo();
  }, [provider, account]);

  // Fetch user balance from backend
  useEffect(() => {
    const fetchUserBalance = async () => {
      if (account) {
        try {
          const response = await ApiService.getUserData(account);
          if (response.success && response.user) {
            setUserBalance({
              balanceUsd: (response.user.balanceUsd*3395.24).toFixed(3) || '0.00',
              balanceWatts: response.user.balanceWatts || '0.00'
            });
          }
        } catch (error) {
          console.error('Error fetching user balance:', error);
          // Use fallback data from userData if available
          if (userData) {
            setUserBalance({
              balanceUsd: userData.balanceUsd || '0.00',
              balanceWatts: userData.balanceWatts || '0.00'
            });
          }
        }
      }
    };

    fetchUserBalance();
  }, [account, userData]);

  // Function to refresh balance (can be called from other components)
  const refreshBalance = async () => {
    if (account) {
      try {
        const response = await ApiService.getUserData(account);
        if (response.success && response.user) {
          setUserBalance({
            balanceUsd: response.user.balanceUsd || '0.00',
            balanceWatts: response.user.balanceWatts || '0.00'
          });
        }
      } catch (error) {
        console.error('Error refreshing balance:', error);
      }
    }
  };

  // Expose refreshBalance to window for other components to use
  useEffect(() => {
    window.refreshDashboardBalance = refreshBalance;
    return () => {
      delete window.refreshDashboardBalance;
    };
  }, [account]);

  const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="px-[5vw] bg-gray-50 min-h-full ">
      {/* Key Information Cards */}
      <div className="flex justify-between mb-4 bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-left">
        {/* Meter ID Card */}
        <div className="">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Meter ID: {userData?.meterId}
          </h3>
          <p className="text-sm text-gray-600">
            Wallet: {shortenAddress(account)}
          </p>
        </div>

<div className="flex">
        {/* Meter Balance Card */}
        <div className="px-[20px] border-r-[1px] border-r-gray-200">
          <h3 className="text-[14px] font-light text-gray-400 mb-2">
            Meter Balance
          </h3>
          <p className="text-3xl font-medium text-gray-900">
            ${userBalance.balanceUsd}
          </p>
        </div>

        {/* Available Power Card */}
        <div className="px-[20px]">
            <h3 className="text-[14px] font-light text-gray-400 mb-2">
              Available Power
            </h3>

          <p className="text-3xl font-medium text-green-600">
            {userBalance.balanceWatts} kWh
          </p>
        </div>

        </div>
      </div>



      {/* Energy Usage Overview */}

        <EnergyChart />
    </div>
  );
};

export default Dashboard; 