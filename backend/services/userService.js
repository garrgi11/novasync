const { runQuery, runQuerySingle, runQueryExecute } = require('../database');

class UserService {
  // Check if user exists by wallet address
  async getUserByWalletAddress(walletAddress) {
    try {
      const user = await runQuerySingle(
        `SELECT u.*, m.balance_usd, m.balance_watts 
         FROM users u 
         LEFT JOIN meters m ON u.meter_id = m.meter_id 
         WHERE u.wallet_address = ?`,
        [walletAddress]
      );
      return user;
    } catch (error) {
      console.error('Error getting user by wallet address:', error);
      throw error;
    }
  }

  // Create new user (onboarding)
  async createUser(userData) {
    try {
      const { name, email, walletAddress, userType, meterId } = userData;
      
      // Check if meter is already assigned to another user
      const existingUser = await runQuerySingle(
        'SELECT * FROM users WHERE meter_id = ?',
        [meterId]
      );

      if (existingUser) {
        throw new Error('Meter is already assigned to another user');
      }

      // Create meter record if it doesn't exist
      await runQueryExecute(
        `INSERT OR IGNORE INTO meters (meter_id, balance_usd, balance_watts) 
         VALUES (?, 0.0, 0.0)`,
        [meterId]
      );

      // Create user
      const result = await runQueryExecute(
        `INSERT INTO users (name, email, wallet_address, user_type, meter_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [name, email, walletAddress, userType, meterId]
      );

      // Get the created user with meter data
      const newUser = await this.getUserByWalletAddress(walletAddress);
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }



  // Update user meter balance
  async updateMeterBalance(meterId, balanceUsd, balanceWatts) {
    try {
      const result = await runQueryExecute(
        `UPDATE meters 
         SET balance_usd = ?, balance_watts = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE meter_id = ?`,
        [balanceUsd, balanceWatts, meterId]
      );
      return result;
    } catch (error) {
      console.error('Error updating meter balance:', error);
      throw error;
    }
  }

  // Update user balance
  async updateUserBalance(walletAddress, balanceData) {
    try {
      const { balanceUsd, balanceWatts } = balanceData;
      
      // Get user to find meter ID
      const user = await this.getUserByWalletAddress(walletAddress);
      if (!user) {
        throw new Error('User not found');
      }

      // Update meter balance
      await this.updateMeterBalance(user.meter_id, balanceUsd, balanceWatts);
      
      // Return updated user data
      return await this.getUserByWalletAddress(walletAddress);
    } catch (error) {
      console.error('Error updating user balance:', error);
      throw error;
    }
  }

  // Get user's meter data
  async getUserMeterData(walletAddress) {
    try {
      const meterData = await runQuerySingle(
        `SELECT m.meter_id, m.balance_usd, m.balance_watts, m.updated_at
         FROM meters m 
         JOIN users u ON m.meter_id = u.meter_id 
         WHERE u.wallet_address = ?`,
        [walletAddress]
      );
      return meterData;
    } catch (error) {
      console.error('Error getting user meter data:', error);
      throw error;
    }
  }

  // Get all users with their meter data
  async getAllUsers() {
    try {
      const users = await runQuery(
        `SELECT u.*, m.balance_usd, m.balance_watts 
         FROM users u 
         LEFT JOIN meters m ON u.meter_id = m.meter_id`
      );
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }
}

module.exports = new UserService(); 