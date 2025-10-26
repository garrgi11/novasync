import { ethers } from 'ethers';
import { 
  CONTRACT_ADDRESSES, 
  TIMEHOOK_ABI, 
  PRICE_PREDICATE_ABI, 
  CHAINLINK_PRICE_FEED_ABI,
  CHAINLINK_FEEDS 
} from '../constants/contracts';

class ContractService {
  constructor(provider, signer) {
    this.provider = provider;
    this.signer = signer;
    
    // Initialize contract instances
    if (signer) {
      this.timeHookContract = new ethers.Contract(
        CONTRACT_ADDRESSES.TIMEHOOK,
        TIMEHOOK_ABI,
        signer
      );
      
      this.pricePredicateContract = new ethers.Contract(
        CONTRACT_ADDRESSES.PRICE_PREDICATE,
        PRICE_PREDICATE_ABI,
        signer
      );
    }
  }

  // TimeHook Contract Methods
  async registerOrderSeries(seriesId) {
    try {
      const tx = await this.timeHookContract.registerOrderSeries(seriesId);
      const receipt = await tx.wait();
      return {
        success: true,
        transactionHash: receipt.hash,
        events: receipt.logs
      };
    } catch (error) {
      console.error('Error registering order series:', error);
      throw error;
    }
  }

  async checkTime(seriesId) {
    try {
      const canExecute = await this.timeHookContract.checkTime(seriesId);
      return canExecute;
    } catch (error) {
      console.error('Error checking time condition:', error);
      throw error;
    }
  }

  async getLastExecutionTime(seriesId) {
    try {
      const lastTime = await this.timeHookContract.lastExecutionTime(seriesId);
      return lastTime;
    } catch (error) {
      console.error('Error getting last execution time:', error);
      throw error;
    }
  }

  async getTimeInterval() {
    try {
      const interval = await this.timeHookContract.TIME_INTERVAL();
      return interval;
    } catch (error) {
      console.error('Error getting time interval:', error);
      throw error;
    }
  }

  // PricePredicate Contract Methods
  async checkPrice(oracleAddress, maxPrice) {
    try {
      const priceConditionMet = await this.pricePredicateContract.checkPrice(oracleAddress, maxPrice);
      return priceConditionMet;
    } catch (error) {
      console.error('Error checking price condition:', error);
      throw error;
    }
  }

  // Chainlink Price Feed Methods
  async getCurrentPrice(oracleAddress) {
    try {
      const priceFeed = new ethers.Contract(
        oracleAddress,
        CHAINLINK_PRICE_FEED_ABI,
        this.provider
      );
      
      const roundData = await priceFeed.latestRoundData();
      return {
        price: roundData.answer,
        roundId: roundData.roundId,
        startedAt: roundData.startedAt,
        updatedAt: roundData.updatedAt
      };
    } catch (error) {
      console.error('Error getting current price:', error);
      throw error;
    }
  }

  // Utility Methods
  generateSeriesId(userAddress, strategy, timestamp) {
    // Create a unique series ID based on user address, strategy, and timestamp
    const data = ethers.solidityPacked(
      ['address', 'string', 'uint256'],
      [userAddress, strategy, timestamp]
    );
    return ethers.keccak256(data);
  }

  // Energy Credits specific methods
  async createEnergyCreditOrder(params) {
    const {
      userAddress,
      amount,
      strategy,
      maxPrice = null,
      oracleAddress = CHAINLINK_FEEDS.ETH_USD
    } = params;

    try {
      // Generate unique series ID
      const seriesId = this.generateSeriesId(userAddress, strategy, Date.now());
      
      // Register order series with TimeHook
      await this.registerOrderSeries(seriesId);
      
      // Check if price condition is met (if applicable)
      let priceConditionMet = true;
      if (maxPrice && strategy === 'limit') {
        priceConditionMet = await this.checkPrice(oracleAddress, maxPrice);
      }
      
      // Check if time condition is met
      const timeConditionMet = await this.checkTime(seriesId);
      
      return {
        success: true,
        seriesId,
        priceConditionMet,
        timeConditionMet,
        canExecute: priceConditionMet && timeConditionMet
      };
    } catch (error) {
      console.error('Error creating energy credit order:', error);
      throw error;
    }
  }

  // Get order status
  async getOrderStatus(seriesId, oracleAddress = CHAINLINK_FEEDS.ETH_USD, maxPrice = null) {
    try {
      const [timeConditionMet, lastExecutionTime, timeInterval] = await Promise.all([
        this.checkTime(seriesId),
        this.getLastExecutionTime(seriesId),
        this.getTimeInterval()
      ]);

      let priceConditionMet = true;
      if (maxPrice) {
        priceConditionMet = await this.checkPrice(oracleAddress, maxPrice);
      }

      const currentPrice = await this.getCurrentPrice(oracleAddress);

      return {
        seriesId,
        timeConditionMet,
        priceConditionMet,
        canExecute: timeConditionMet && priceConditionMet,
        lastExecutionTime: lastExecutionTime.toString(),
        timeInterval: timeInterval.toString(),
        currentPrice: currentPrice.price.toString(),
        nextExecutionTime: lastExecutionTime > 0 
          ? (BigInt(lastExecutionTime) + BigInt(timeInterval)).toString()
          : '0'
      };
    } catch (error) {
      console.error('Error getting order status:', error);
      throw error;
    }
  }
}

export default ContractService; 