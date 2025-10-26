import React, { useState, useEffect } from 'react'
import { useWallet } from '../WalletContext'
import ContractService from '../services/contractService'
import ApiService from '../services/api'
import { ethers } from 'ethers'
import { CHAINLINK_FEEDS } from '../constants/contracts'

const Buy = () => {
  const { isConnected, account, provider, signer } = useWallet()
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('ETH')
  const [strategy, setStrategy] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [contractService, setContractService] = useState(null)
  const [orderStatus, setOrderStatus] = useState(null)
  const [maxPrice, setMaxPrice] = useState('')
  const [currentPrice, setCurrentPrice] = useState(null)
  const [popup, setPopup] = useState({ show: false, type: '', title: '', message: '', details: null })

  // Mock exchange rates (in real app, these would come from an API)
  const exchangeRates = {
    ETH: 3485.14,
    USD: 0.00029 
  }

  // Mock energy market data
  const energyData = {
    currentPrice: 0.12, // $0.12 per kWh
    priceChange24h: -1.2,
    gridDemand: 85.6, // GW
    renewablePercentage: 67.3,
    totalSupply: 120.4, // GW
    carbonIntensity: 245, // gCO2/kWh
    energyCreditsPrice: 0.15, // $0.15 per credit
    creditsAvailable: 1250000,
    totalCreditsIssued: 5000000
  }

  const buyingStrategies = [
    { value: 'dca', label: 'TWAP' },
    { value: 'hybrid', label: 'Hybrid TWAP' },
    { value: 'automatic', label: 'Automatic Buy' }
  ]

  // Initialize contract service when wallet is connected
  useEffect(() => {
    if (isConnected && provider && signer) {
      const service = new ContractService(provider, signer)
      setContractService(service)
      fetchCurrentPrice()
    }
  }, [isConnected, provider, signer])

  // Fetch current ETH price from Chainlink
  const fetchCurrentPrice = async () => {
    if (!contractService) return
    
    try {
      const priceData = await contractService.getCurrentPrice(CHAINLINK_FEEDS.ETH_USD)
      // Chainlink prices are typically in 8 decimals, convert to USD
      const priceInUSD = Number(priceData.price) / 100000000
      setCurrentPrice(priceInUSD)
    } catch (error) {
      console.error('Error fetching current price:', error)
    }
  }

  const getConvertedAmount = () => {
    if (!amount || isNaN(amount) || amount <= 0) return null
    
    const numAmount = parseFloat(amount)
    if (currency === 'ETH') {
      return (numAmount * exchangeRates.ETH).toFixed(2)
    } else {
      return (numAmount * exchangeRates.USD).toFixed(6)
    }
  }

  const handleBuy = async () => {
    if (!isConnected) {
      showPopup('warning', 'Wallet Required', 'Please connect your wallet first to use smart contract features.')
      return
    }

    if (!amount || !strategy) {
      showPopup('warning', 'Missing Information', 'Please fill in all required fields to proceed with your order.')
      return
    }

    if (strategy === 'limit' && !maxPrice) {
      showPopup('warning', 'Price Required', 'Please enter a maximum price for limit orders.')
      return
    }

    setIsLoading(true)
    try {
      // Convert amount to wei if needed
      const amountInWei = currency === 'ETH' 
        ? ethers.parseEther(amount)
        : ethers.parseUnits(amount, 6) // USDC has 6 decimals

      // Convert max price to the format expected by Chainlink (8 decimals)
      const maxPriceInChainlinkFormat = maxPrice 
        ? ethers.parseUnits(maxPrice.toString(), 8)
        : null

      // Create energy credit order using smart contracts
      const orderResult = await contractService.createEnergyCreditOrder({
        userAddress: account,
        amount: amountInWei,
        strategy,
        maxPrice: maxPriceInChainlinkFormat,
        oracleAddress: CHAINLINK_FEEDS.ETH_USD
      })

      if (orderResult.success) {
        // Get order status
        const status = await contractService.getOrderStatus(
          orderResult.seriesId,
          CHAINLINK_FEEDS.ETH_USD,
          maxPriceInChainlinkFormat
        )
        setOrderStatus(status)

        // Save order to database
        try {
          if (strategy === 'dca') {
            // For TWAP strategy, create 30 separate orders
            const totalAmount = parseFloat(amount)
            const amountPerOrder = totalAmount / 30
            const buyAmountPerOrder = currency === 'ETH' ? amountPerOrder * 0.00029 : amountPerOrder / 3485.14
            
            for (let day = 1; day <= 30; day++) {
              const orderData = {
                user_address: account,
                order_type: 'TWAP',
                strategy: 'Dollar Cost Average (TWAP)',
                sell_amount: amountPerOrder,
                sell_currency: currency,
                buy_amount_estimated: buyAmountPerOrder,
                buy_currency: currency === 'ETH' ? 'USD' : 'ETH',
                max_price: maxPrice ? parseFloat(maxPrice) : null,
                schedule_day: day,
                series_id: orderResult.seriesId,
                status: day === 1 ? 'ACTIVE' : 'PENDING' // First day is active, rest are pending
              }

              await ApiService.createOrder(orderData)
            }
          } else {
            // For non-TWAP strategies, create single order
            const orderData = {
              user_address: account,
              order_type: strategy.toUpperCase(),
              strategy: buyingStrategies.find(s => s.value === strategy)?.label || strategy,
              sell_amount: parseFloat(amount),
              sell_currency: currency,
              buy_amount_estimated: currency === 'ETH' ? parseFloat(amount) * 0.00029 : parseFloat(amount) / 3485.14,
              buy_currency: currency === 'ETH' ? 'USD' : 'ETH',
              max_price: maxPrice ? parseFloat(maxPrice) : null,
              schedule_day: null,
              series_id: orderResult.seriesId
            }

            await ApiService.createOrder(orderData)
          }

          // Update user balance after order creation
          try {
            // Calculate new balance (for demo purposes, we'll add some energy credits)
            const currentBalance = await ApiService.getUserData(account)
            if (currentBalance.success && currentBalance.user) {
              const currentUsd = parseFloat(currentBalance.user.balanceUsd || 0)
              const currentWatts = parseFloat(currentBalance.user.balanceWatts || 0)
              
              // Add energy credits based on the order amount (simplified calculation)
              const energyCreditsEarned = parseFloat(amount) * 0.15 // $0.15 per credit
              const newUsdBalance = currentUsd + energyCreditsEarned
              const newWattsBalance = currentWatts + (energyCreditsEarned * 6.67) // Convert to kWh
              
              await ApiService.updateUserBalance(account, {
                balanceUsd: newUsdBalance.toFixed(2),
                balanceWatts: newWattsBalance.toFixed(2)
              })

              // Refresh dashboard balance
              if (window.refreshDashboardBalance) {
                window.refreshDashboardBalance()
              }
            }
          } catch (balanceError) {
            console.error('Failed to update balance:', balanceError)
            // Continue even if balance update fails
          }
        } catch (dbError) {
          console.error('Failed to save order to database:', dbError)
          // Continue even if database save fails
        }

        showPopup('success', 'Order Created Successfully!', 'Your energy credit order has been created and is now active on the Wattlink network.', {
          seriesId: orderResult.seriesId,
          canExecute: orderResult.canExecute,
          amount: `${amount} ${currency}`,
          strategy: buyingStrategies.find(s => s.value === strategy)?.label || strategy
        })
      }
    } catch (error) {
      console.error('Purchase failed:', error)
      showPopup('error', 'Purchase Failed', `Your order could not be processed. Please try again or contact support if the problem persists.`, {
        error: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  const convertedAmount = getConvertedAmount()

  // Popup helper functions
  const showPopup = (type, title, message, details = null) => {
    setPopup({ show: true, type, title, message, details })
  }

  const hidePopup = () => {
    setPopup({ show: false, type: '', title: '', message: '', details: null })
  }

  // Popup Component
  const Popup = ({ show, type, title, message, details, onClose }) => {
    if (!show) return null

    const isSuccess = type === 'success'
    const isError = type === 'error'
    const isWarning = type === 'warning'

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
          {/* Header */}
          <div className={`px-6 py-4 rounded-t-2xl ${isSuccess ? 'bg-green-500' : isError ? 'bg-red-500' : 'bg-yellow-500'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSuccess ? 'bg-green-600' : isError ? 'bg-red-600' : 'bg-yellow-600'}`}>
                  {isSuccess && (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isError && (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  {isWarning && (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-white">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <p className="text-gray-700 text-base mb-4">{message}</p>
            
            {details && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="space-y-2 text-sm">
                  {details.seriesId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Series ID:</span>
                      <span className="font-mono text-gray-800">{details.seriesId.slice(0, 10)}...</span>
                    </div>
                  )}
                  {details.canExecute !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Can Execute:</span>
                      <span className={`font-medium ${details.canExecute ? 'text-green-600' : 'text-red-600'}`}>
                        {details.canExecute ? 'Yes' : 'No'}
                      </span>
                    </div>
                  )}
                  {details.amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium text-gray-800">{details.amount}</span>
                    </div>
                  )}
                  {details.strategy && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Strategy:</span>
                      <span className="font-medium text-gray-800">{details.strategy}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isSuccess 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : isError 
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                }`}
              >
                {isSuccess ? 'Continue' : 'Close'}
              </button>
              {isSuccess && (
                <button
                  onClick={() => {
                    onClose()
                    // Reset form
                    setAmount('')
                    setStrategy('')
                    setMaxPrice('')
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  New Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-[5vw] mt-[1vh]">
      {/* Popup Component */}
      <Popup 
        show={popup.show}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        details={popup.details}
        onClose={hidePopup}
      />
      {/* Wallet Connection Check */}
      {!isConnected && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Wallet Not Connected
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Please connect your wallet to use smart contract features.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    
<div className="flex gap-[2vw]">
      {/* Buy Form Section */}
      <div className="h-full flex flex-col justify-center">
      <div className="h-fit mt-[5vh] pr-[2vw]">
        
        <div className="flex mb-6 w-full gap-[2vw]">
            <div className="h-[48px] flex flex-col justify-center">
        <label className=" text-[24px] font-light text-gray-400 leading-[1em] ">
          Amount
        </label></div>
        <div className="w-full flex flex-col">
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:border-[2px] focus-within:border-orange-500">
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 px-4 py-3 border-none outline-none text-base bg-transparent text-[20px]"
              disabled={isLoading}
            />
            <div className="flex border-l border-gray-300 bg-gray-50 px-[8px]">
              <button
                type="button"
                onClick={() => setCurrency('ETH')}
                className={`px-4 py-2 text-sm font-medium transition-colors rounded-[3px] ${
                  currency === 'ETH' 
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                disabled={isLoading}
              >
                ETH
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-4 py-2 text-sm font-medium transition-colors rounded-[3px] ${
                  currency === 'USD' 
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                disabled={isLoading}
              >
                USD
              </button>
            </div>
          </div>
          <div className="h-[40px]">
          {convertedAmount && (
            <div className="mt-2 text-[20px] text-left text-gray-500">
              ≈ {convertedAmount} {currency === 'ETH' ? 'USD' : 'ETH'}
            </div>
          )}
          </div>
        </div>
        </div>
        <div className="flex mb-6 w-full gap-[2vw]">
        <div className="h-[48px] flex flex-col justify-center">
          <label className=" text-[24px] font-light text-gray-400 leading-[1em] text-nowrap ">
            Buying strategy
          </label></div>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="w-full px-4 py-3 text-[20px] border border-gray-300 rounded-lg text-base bg-white text-gray-900 outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            disabled={isLoading}
          >
            <option value="">Select a strategy</option>
            {buyingStrategies.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Max Price Input for Limit Orders */}
        {strategy === 'limit' && (
          <div className="flex mb-6 w-full gap-[2vw]">
            <div className="h-[48px] flex flex-col justify-center">
              <label className=" text-[24px] font-light text-gray-400 leading-[1em] text-nowrap ">
                Max Price (USD)
              </label>
            </div>
            <div className="w-full flex flex-col">
              <input
                type="number"
                placeholder="Enter maximum price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-4 py-3 text-[20px] border border-gray-300 rounded-lg text-base bg-white text-gray-900 outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                disabled={isLoading}
              />
              {currentPrice && (
                <div className="mt-2 text-[16px] text-gray-500">
                  Current ETH Price: ${currentPrice.toFixed(2)} USD
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleBuy}
          disabled={isLoading || !amount || !strategy}
          className="w-full px-4 py-3 bg-orange-500 text-white font-semibold rounded-lg transition-all hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-[18px]"
        >
          {isLoading ? 'Processing...' : `Buy Energy Credits with ${currency}`}
        </button>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
              <p>Network Fee: ~0.002 ETH</p>
              <p>Processing Time: ~2-5 minutes</p>
          </div>
        </div>

        {/* Order Status Display */}
        {orderStatus && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[18px] font-medium text-gray-900">Order Status</h3>
              <button
                onClick={async () => {
                  try {
                    const status = await contractService.getOrderStatus(
                      orderStatus.seriesId,
                      CHAINLINK_FEEDS.ETH_USD,
                      maxPrice ? ethers.parseUnits(maxPrice.toString(), 8) : null
                    )
                    setOrderStatus(status)
                  } catch (error) {
                    console.error('Error refreshing order status:', error)
                  }
                }}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Refresh
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Series ID:</span>
                <span className="font-mono text-gray-800">{orderStatus.seriesId.slice(0, 10)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time Condition:</span>
                <span className={`font-medium ${orderStatus.timeConditionMet ? 'text-green-600' : 'text-red-600'}`}>
                  {orderStatus.timeConditionMet ? 'Met' : 'Not Met'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price Condition:</span>
                <span className={`font-medium ${orderStatus.priceConditionMet ? 'text-green-600' : 'text-red-600'}`}>
                  {orderStatus.priceConditionMet ? 'Met' : 'Not Met'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Can Execute:</span>
                <span className={`font-medium ${orderStatus.canExecute ? 'text-green-600' : 'text-red-600'}`}>
                  {orderStatus.canExecute ? 'Yes' : 'No'}
                </span>
              </div>
              {orderStatus.lastExecutionTime !== '0' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Execution:</span>
                  <span className="text-gray-800">
                    {new Date(Number(orderStatus.lastExecutionTime) * 1000).toLocaleString()}
                  </span>
                </div>
              )}
              {orderStatus.nextExecutionTime !== '0' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Next Execution:</span>
                  <span className="text-gray-800">
                    {new Date(Number(orderStatus.nextExecutionTime) * 1000).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
            {/* Energy Market Overview Section */}
<div className=" bg-white rounded-xl p-10 shadow-lg border border-gray-100 w-[50%]">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">⚡</span>
          </div>
          <div>
            <h1 className="text-[32px] font-light text-gray-900">Energy Credits</h1>
            <p className="text-[16px] text-gray-500">Wattlink Network</p>
          </div>
        </div>
        
        <div className="flex items-baseline gap-3 mb-6">
          <span className="text-[48px] font-light text-gray-900">${energyData.energyCreditsPrice}</span>
          <span className="text-[20px] text-gray-500">per credit</span>
          <span className={`text-[20px] font-medium ${energyData.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {energyData.priceChange24h >= 0 ? '+' : ''}{energyData.priceChange24h}%
          </span>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div>
            <p className="text-[14px] text-gray-500 mb-1">Grid Demand</p>
            <p className="text-[16px] font-medium text-gray-900">{energyData.gridDemand} GW</p>
          </div>

          <div>
            <p className="text-[14px] text-gray-500 mb-1">Carbon Intensity</p>
            <p className="text-[16px] font-medium text-gray-900">{energyData.carbonIntensity} gCO₂/kWh</p>
          </div>
          <div>
            <p className="text-[14px] text-gray-500 mb-1">Credits Available</p>
            <p className="text-[16px] font-medium text-gray-900">{energyData.creditsAvailable.toLocaleString()}</p>
          </div>
        </div>
      </div>
      {/* Recent Energy Transactions */}

      </div>
      </div>
    </div>
  )
}

export default Buy
