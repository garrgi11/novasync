import React, { useState, useEffect } from 'react'
import { useWallet } from '../WalletContext'
import ApiService from '../services/api'

const Activity = () => {
  const { isConnected, account } = useWallet()
  const [pendingOrders, setPendingOrders] = useState([])
  const [executedOrders, setExecutedOrders] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('pending')
  const [currentPage, setCurrentPage] = useState(1)
  const [ordersPerPage] = useState(10)
  const [isTWAPExpanded, setIsTWAPExpanded] = useState(false)
  const [isOtherOrdersExpanded, setIsOtherOrdersExpanded] = useState(false)
  const [expandedSeries, setExpandedSeries] = useState(new Set())

  useEffect(() => {
    if (isConnected && account) {
      fetchOrders()
    }
  }, [isConnected, account])

  const fetchOrders = async () => {
    if (!account) return
    
    setIsLoading(true)
    try {
      // Fetch pending orders
      const pendingResponse = await ApiService.getOrders(account, 'PENDING')
      const activeResponse = await ApiService.getOrders(account, 'ACTIVE')
      setPendingOrders([...pendingResponse.orders, ...activeResponse.orders])

      // Fetch executed orders
      const executedResponse = await ApiService.getOrders(account, 'FILLED')
      setExecutedOrders(executedResponse.orders)

      // Refresh dashboard balance when viewing orders
      if (window.refreshDashboardBalance) {
        window.refreshDashboardBalance()
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      // Set empty arrays if API fails
      setPendingOrders([])
      setExecutedOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING': { color: 'bg-gray-500', text: 'PENDING' },
      'ACTIVE': { color: 'bg-blue-500', text: 'ACTIVE' },
      'FILLED': { color: 'bg-green-500', text: 'FILLED' },
      'CANCELLED': { color: 'bg-red-500', text: 'CANCELLED' }
    }

    const config = statusConfig[status] || statusConfig['PENDING']
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Group orders by series for TWAP orders
  const groupOrdersBySeries = (orders) => {
    const grouped = {}
    orders.forEach(order => {
      if (order.order_type === 'TWAP' && order.series_id) {
        if (!grouped[order.series_id]) {
          grouped[order.series_id] = []
        }
        grouped[order.series_id].push(order)
      }
    })
    return grouped
  }

  // Get paginated orders
  const getPaginatedOrders = (orders) => {
    const startIndex = (currentPage - 1) * ordersPerPage
    const endIndex = startIndex + ordersPerPage
    return orders.slice(startIndex, endIndex)
  }

  // Get total pages
  const getTotalPages = (orders) => {
    return Math.ceil(orders.length / ordersPerPage)
  }

  const OrderTable = ({ orders, title }) => {
    const groupedOrders = groupOrdersBySeries(orders)
    const hasTWAPOrders = Object.keys(groupedOrders).length > 0
    const nonTWAPOrders = orders.filter(order => order.order_type !== 'TWAP')
    const paginatedOrders = getPaginatedOrders(nonTWAPOrders)
    const totalPages = getTotalPages(nonTWAPOrders)

    return (
      <div className="space-y-6">
        {/* TWAP Orders by Series */}
        {hasTWAPOrders && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-medium text-gray-900">TWAP Orders by Series</h3>
            </div>
            {Object.entries(groupedOrders).map(([seriesId, seriesOrders]) => {
              const totalAmount = seriesOrders.reduce((sum, order) => sum + order.sell_amount, 0)
              const filledCount = seriesOrders.filter(order => order.status === 'FILLED').length
              const activeCount = seriesOrders.filter(order => order.status === 'ACTIVE').length
              const pendingCount = seriesOrders.filter(order => order.status === 'PENDING').length
              const isSeriesExpanded = expandedSeries.has(seriesId)
              
              return (
                <div key={seriesId} className="border-b border-gray-100 last:border-b-0">
                  <div className="px-6 py-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 text-left">Series {seriesId.slice(-6)}</h4>
                        <p className="text-xs text-gray-500 text-left">
                          Total: {totalAmount.toFixed(4)} {seriesOrders[0].sell_currency} | 
                          Filled: {filledCount} | Active: {activeCount} | Pending: {pendingCount}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-xs text-gray-500">
                          {seriesOrders.length}/30 orders
                        </div>
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedSeries)
                            if (isSeriesExpanded) {
                              newExpanded.delete(seriesId)
                            } else {
                              newExpanded.add(seriesId)
                            }
                            setExpandedSeries(newExpanded)
                          }}
                          className="flex items-center text-sm text-orange-600 hover:text-orange-700 font-medium"
                        >
                          {isSeriesExpanded ? (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                              Collapse
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              Expand
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  {isSeriesExpanded && (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Day
                              </th>
                              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Buy (Est.)
                              </th>
                              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {seriesOrders.map((order) => (
                              <tr key={order.id} className="hover:bg-gray-50">
                                <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                  Day {order.schedule_day}
                                </td>
                                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {order.sell_amount.toFixed(4)} {order.sell_currency}
                                </td>
                                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                                  ~{(order.sell_amount*3395.24).toFixed(3)} USD
                                </td>
                                <td className="px-6 py-2 whitespace-nowrap">
                                  {getStatusBadge(order.status)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Other Orders */}
        {nonTWAPOrders.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-medium text-gray-900">Other Orders</h3>
              <button
                onClick={() => setIsOtherOrdersExpanded(!isOtherOrdersExpanded)}
                className="flex items-center text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                {isOtherOrdersExpanded ? (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Collapse
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Expand ({nonTWAPOrders.length} orders)
                  </>
                )}
              </button>
            </div>
            {isOtherOrdersExpanded && (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sell Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Buy Amount (Est.)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.order_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.sell_amount.toFixed(4)} {order.sell_currency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ~{order.sell_amount.toFixed(4)} USD
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(order.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Showing {((currentPage - 1) * ordersPerPage) + 1} to {Math.min(currentPage * ordersPerPage, nonTWAPOrders.length)} of {nonTWAPOrders.length} orders
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-700">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Empty State */}
        {orders.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500">No {title.toLowerCase()} orders found</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="px-[5vw] mt-[1vh]">
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
                <p>Please connect your wallet to view your order activity.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Orders ({pendingOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('executed')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'executed'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Executed Orders ({executedOrders.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <div>
          {activeTab === 'pending' && (
            <OrderTable 
              orders={pendingOrders} 
              title="Pending Daily (TWAP) Orders" 
            />
          )}
          {activeTab === 'executed' && (
            <OrderTable 
              orders={executedOrders} 
              title="Executed Orders" 
            />
          )}
        </div>
      )}
    </div>
  )
}

export default Activity

