-- Migration: Add Stripe payment fields to requests table
ALTER TABLE requests 
ADD COLUMN stripe_payment_intent_id VARCHAR(255),
ADD COLUMN stripe_session_id VARCHAR(255),
ADD COLUMN stripe_customer_id VARCHAR(255);

-- Add index for faster Stripe lookups
CREATE INDEX idx_requests_stripe_session_id ON requests(stripe_session_id);
CREATE INDEX idx_requests_stripe_payment_intent_id ON requests(stripe_payment_intent_id);

-- Update payment_id comment
COMMENT ON COLUMN requests.payment_id IS 'Stores payment ID or Stripe session ID';