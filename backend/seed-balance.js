const { runQueryExecute } = require('./database');

const seedBalance = async () => {
  try {
    // Update meter balance for existing users
    const updateQueries = [
      {
        sql: `UPDATE meters SET balance_usd = 150.00, balance_watts = 1000.00 WHERE meter_id = '665656556'`,
        description: 'Updated balance for meter 665656556'
      },
      {
        sql: `UPDATE meters SET balance_usd = 75.50, balance_watts = 500.00 WHERE meter_id = '123456789'`,
        description: 'Updated balance for meter 123456789'
      },
      {
        sql: `UPDATE meters SET balance_usd = 200.00, balance_watts = 1500.00 WHERE meter_id = '987654321'`,
        description: 'Updated balance for meter 987654321'
      }
    ];

    for (const query of updateQueries) {
      await runQueryExecute(query.sql);
      console.log(`✅ ${query.description}`);
    }

    console.log('✅ User balances seeded successfully!');
    console.log('📊 Updated balances:');
    console.log('   - Meter 665656556: $150.00 USD, 1000.00 kWh');
    console.log('   - Meter 123456789: $75.50 USD, 500.00 kWh');
    console.log('   - Meter 987654321: $200.00 USD, 1500.00 kWh');
  } catch (error) {
    console.error('❌ Error seeding balances:', error);
  }
};

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedBalance();
}

module.exports = { seedBalance }; 