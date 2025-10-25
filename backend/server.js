require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');
const Payment = require('./models/Payment');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/paddle_subscription')
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true
}));

// Middleware
app.use(express.json());

// Simple GET route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Paddle API route to fetch all products and prices
app.get('/api/plans', async (req, res) => {
  try {
    const paddleApiKey = process.env.PADDLE_API_KEY;
    
    if (!paddleApiKey) {
      return res.status(500).json({ 
        error: 'Paddle API key is not configured' 
      });
    }

    // Fetch products with prices included from Paddle Sandbox API
    const productsUrl = 'https://sandbox-api.paddle.com/products?include=prices';
    const productsResponse = await axios.get(productsUrl, {
      headers: {
        'Authorization': `Bearer ${paddleApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const products = productsResponse.data.data;

    // Map products with their prices
    const plans = products.map(product => ({
      product_id: product.id,
      name: product.name,
      description: product.description || '',
      prices: product.prices ? product.prices.map(price => ({
        price_id: price.id,
        amount: price.unit_price?.amount || 0,
        interval: price.billing_cycle?.interval || null,
        currency: price.unit_price?.currency_code || 'USD'
      })) : []
    }));

    res.json({
      success: true,
      data: plans,
      count: plans.length
    });

  } catch (error) {
    console.error('Error fetching Paddle plans:', error.message);
    
    if (error.response) {
      // Paddle API error response
      return res.status(error.response.status).json({
        error: 'Failed to fetch Paddle products',
        details: error.response.data
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Create checkout session with Paddle
app.post('/api/checkout', async (req, res) => {
  try {
    const paddleApiKey = process.env.PADDLE_API_KEY;
    
    if (!paddleApiKey) {
      return res.status(500).json({ 
        error: 'Paddle API key is not configured' 
      });
    }

    const { price_id, success_url } = req.body;

    if (!price_id) {
      return res.status(400).json({ 
        error: 'Price ID is required' 
      });
    }

    // Create a transaction - Paddle will auto-create checkout URL
    const transactionUrl = 'https://sandbox-api.paddle.com/transactions';
    
    const transactionPayload = {
      items: [
        {
          price_id: price_id,
          quantity: 1
        }
      ]
    };

    const transactionResponse = await axios.post(transactionUrl, transactionPayload, {
      headers: {
        'Authorization': `Bearer ${paddleApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const transactionData = transactionResponse.data.data;
    const transactionId = transactionData.id;
    
    // Paddle returns checkout URL in the transaction response
    // For localhost, you need to manually visit the URL
    const checkoutUrl = transactionData.checkout?.url;
    
    if (!checkoutUrl) {
      return res.status(500).json({
        error: 'No checkout URL returned',
        message: 'Please configure Paddle Dashboard URLs'
      });
    }
    
    console.log('Transaction ID:', transactionId);
    console.log('Checkout URL from Paddle:', checkoutUrl);

    res.json({
      success: true,
      data: {
        checkout_url: checkoutUrl,
        transaction_id: transactionId
      }
    });

  } catch (error) {
    console.error('Error creating checkout session:', error.message);
    console.error('Error details:', error.response?.data);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: 'Failed to create checkout session',
        details: error.response.data,
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Paddle webhook endpoint to receive payment notifications
app.post('/api/paddle/webhook', async (req, res) => {
  try {
    const event = req.body;
    
    console.log('Paddle webhook received:', event);
    
    // Handle transaction completed event
    if (event.event_type === 'transaction.completed') {
      const transactionData = event.data;
      
      // Extract payment information
      const paymentData = {
        transaction_id: transactionData.id,
        price_id: transactionData.items[0]?.price_id || '',
        customer_email: transactionData.customer_email || 'unknown@example.com',
        amount: transactionData.details?.totals?.total || 0,
        currency: transactionData.details?.totals?.currency_code || 'USD',
        status: 'completed',
        paddle_response: transactionData
      };
      
      try {
        // Save to database
        const payment = new Payment(paymentData);
        await payment.save();
        
        console.log('Payment saved successfully:', paymentData.transaction_id);
      } catch (error) {
        // If it's a duplicate, just log it
        if (error.code === 11000) {
          console.log('Payment already exists:', paymentData.transaction_id);
        } else {
          throw error;
        }
      }
    }
    
    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Still return 200 so Paddle doesn't retry
    res.status(200).json({ error: error.message });
  }
});

// Endpoint to manually store successful payment
app.post('/api/payments', async (req, res) => {
  try {
    const { 
      transaction_id, 
      price_id, 
      customer_email, 
      amount, 
      currency,
      status = 'completed',
      paddle_response = {}
    } = req.body;

    // Validate required fields
    if (!transaction_id || !price_id || !customer_email || !amount || !currency) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['transaction_id', 'price_id', 'customer_email', 'amount', 'currency']
      });
    }

    // Create new payment record
    const payment = new Payment({
      transaction_id,
      price_id,
      customer_email,
      amount,
      currency,
      status,
      paddle_response
    });

    await payment.save();

    res.status(201).json({
      success: true,
      message: 'Payment data saved successfully',
      data: payment
    });

  } catch (error) {
    console.error('Error saving payment:', error);
    
    // Handle duplicate transaction_id
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Payment with this transaction ID already exists'
      });
    }

    res.status(500).json({
      error: 'Failed to save payment data',
      message: error.message
    });
  }
});

// Get all payments
app.get('/api/payments', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ created_at: -1 });
    
    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      error: 'Failed to fetch payments',
      message: error.message
    });
  }
});

// Get payment by transaction ID
app.get('/api/payments/:transaction_id', async (req, res) => {
  try {
    const { transaction_id } = req.params;
    const payment = await Payment.findOne({ transaction_id });
    
    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found'
      });
    }
    
    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      error: 'Failed to fetch payment',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
