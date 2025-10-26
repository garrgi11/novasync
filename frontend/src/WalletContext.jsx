import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import apiService from './services/api';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState('0.0000');
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [isOnboarding, setIsOnboarding] = useState(false);

  // Check for existing connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Check if user was previously connected
        const wasConnected = localStorage.getItem('walletConnected') === 'true';
        const savedAccount = localStorage.getItem('walletAccount');
        
        if (wasConnected && savedAccount) {
          // Check if MetaMask still has the account connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0 && accounts[0].toLowerCase() === savedAccount.toLowerCase()) {
            // Reconnect with the saved account
            await connectWallet();
          } else {
            // MetaMask account changed or disconnected, clear local state
            localStorage.removeItem('walletConnected');
            localStorage.removeItem('walletAccount');
          }
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        setIsLoading(true);
        
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        
        // Create provider and signer
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        setAccount(account);
        setProvider(provider);
        setSigner(signer);
        setIsConnected(true);
        
        // Get initial balance
        const balanceWei = await provider.getBalance(account);
        const balanceEth = ethers.formatEther(balanceWei);
        setBalance(parseFloat(balanceEth).toFixed(4));
        
        // Save connection state to localStorage
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAccount', account);
        
        // Check if user exists in backend
        await checkUserInBackend(account);
        
                // Listen for account changes
        window.ethereum.on('accountsChanged', async (accounts) => {
          if (accounts.length === 0) {
            // User disconnected
            disconnectWallet();
          } else {
            // Account changed
            setAccount(accounts[0]);
            checkUserInBackend(accounts[0]);
            
            // Update balance for new account
            const balanceWei = await provider.getBalance(accounts[0]);
            const balanceEth = ethers.formatEther(balanceWei);
            setBalance(parseFloat(balanceEth).toFixed(4));
          }
        });

        // Listen for chain changes
        window.ethereum.on('chainChanged', () => {
          window.location.reload();
        });

      } catch (error) {
        console.error('Error connecting wallet:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      alert('Please install MetaMask to use this app!');
      setIsLoading(false);
    }
  };

  const checkUserInBackend = async (walletAddress) => {
    try {
      const response = await apiService.checkUser(walletAddress);
      
      if (response.exists) {
        // User exists, set user data
        setUserData(response.user);
        setIsOnboarding(false);
      } else {
        // User doesn't exist, show onboarding
        setUserData(null);
        setIsOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking user in backend:', error);
      // If backend is not available, still allow connection
      setUserData(null);
      setIsOnboarding(false);
    }
  };

  const completeOnboarding = (user) => {
    setUserData(user);
    setIsOnboarding(false);
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAccount('');
    setProvider(null);
    setSigner(null);
    setBalance('0.0000');
    setUserData(null);
    setIsOnboarding(false);
    
    // Clear connection state from localStorage
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAccount');
  };

  const value = {
    isConnected,
    account,
    provider,
    signer,
    balance,
    isLoading,
    userData,
    isOnboarding,
    connectWallet,
    disconnectWallet,
    completeOnboarding
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}; 