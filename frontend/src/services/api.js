const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  // Check if user exists by wallet address
  async checkUser(walletAddress) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to check user');
      }

      return data;
    } catch (error) {
      console.error('Error checking user:', error);
      throw error;
    }
  }

  // Create new user (onboarding)
  async onboardUser(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to onboard user');
      }

      return data;
    } catch (error) {
      console.error('Error onboarding user:', error);
      throw error;
    }
  }

  // Get user data by wallet address
  async getUserData(walletAddress) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/user/${walletAddress}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get user data');
      }

      return data;
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  // Update user balance
  async updateUserBalance(walletAddress, balanceData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/user/${walletAddress}/balance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(balanceData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user balance');
      }

      return data;
    } catch (error) {
      console.error('Error updating user balance:', error);
      throw error;
    }
  }



  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Backend health check failed');
      }

      return data;
    } catch (error) {
      console.error('Error checking backend health:', error);
      throw error;
    }
  }

  // Orders API methods
  async getOrders(userAddress, status = null) {
    try {
      let url = `${API_BASE_URL}/orders/user/${userAddress}`;
      if (status) {
        url += `?status=${status}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders');
      }

      return data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  async createOrder(orderData) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create order');
      }

      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId, statusData) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statusData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update order status');
      }

      return data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  async deleteOrder(orderId) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete order');
      }

      return data;
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }
}

export default new ApiService(); 