const { sequelize } = require('../src/config/database');
const logger = require('../src/utils/logger');

async function addStripeFields() {
  try {
    // Add Stripe payment fields
    await sequelize.query(`
      ALTER TABLE requests 
      ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
    `);

    // Create indexes
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_requests_stripe_session_id ON requests(stripe_session_id);
      CREATE INDEX IF NOT EXISTS idx_requests_stripe_payment_intent_id ON requests(stripe_payment_intent_id);
    `);

    console.log('✅ Stripe fields added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addStripeFields();
