# Paddle Subscription Checkout

A complete subscription checkout system built with React, Node.js, Express, and MongoDB, integrated with Paddle for payment processing.

## 🚀 Tech Stack

### Frontend
- **React** (v19.2.0) - UI library
- **React Router DOM** (v7.9.4) - Routing
- **Axios** (v1.12.2) - HTTP client
- **@paddle/paddle-js** - Paddle checkout integration

### Backend
- **Node.js** - Runtime environment
- **Express** (v4.19.2) - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **Axios** (v1.7.7) - HTTP client
- **CORS** (v2.8.5) - Cross-origin requests
- **dotenv** (v16.4.5) - Environment variables

## 📁 Project Structure

```
PaddleSubscription/
├── backend/
│   ├── models/
│   │   └── Payment.js           # Payment schema
│   ├── server.js                 # Express server & routes
│   ├── package.json
│   ├── .env
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── App.js               # Main component
│   │   ├── App.css              # Styles
│   │   ├── Success.js           # Success page component
│   │   ├── index.js             # Entry point
│   │   └── index.css            # Global styles
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   ├── .env
│   └── README.md
└── README.md
```

## 🗂️ API Routes

### Backend Endpoints

#### Health Check
- **GET** `/`
  - Returns: API status and timestamp
  - Response: `{ message, environment, timestamp }`

#### Subscription Plans
- **GET** `/api/plans`
  - Fetches all products and prices from Paddle
  - Returns: `{ success, data: [...], count }`
  - Data includes: `product_id`, `name`, `description`, `prices[]`

#### Checkout
- **POST** `/api/checkout`
  - Creates a Paddle transaction
  - Body: `{ price_id }`
  - Returns: `{ success, data: { checkout_url, transaction_id } }`

#### Payments
- **POST** `/api/payments`
  - Save payment to database
  - Body: `{ transaction_id, price_id, customer_email, amount, currency, status, paddle_response }`
  - Returns: `{ success, message, data }`

- **GET** `/api/payments`
  - Get all stored payments
  - Returns: `{ success, count, data: [...] }`

- **GET** `/api/payments/:transaction_id`
  - Get specific payment
  - Returns: `{ success, data: {...} }`

#### Webhook
- **POST** `/api/paddle/webhook`
  - Receives Paddle payment notifications
  - Automatically saves completed transactions

### Frontend Routes

- `/` - Home page with subscription plans
- `/success` - Payment success page with save to database button
- `/cancel` - Payment cancelled page

##  Installation

### Prerequisites
- Node.js (v14+)
- MongoDB
- Paddle account (sandbox)

### Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PADDLE_API_KEY=your_paddle_api_key
MONGODB_URI=mongodb://localhost:27017/paddle_subscription
PORT=3000
NODE_ENV=development
```

Start backend:
```bash
npm start
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
REACT_APP_PADDLE_CLIENT_TOKEN=your_paddle_client_token
REACT_APP_API_URL=http://localhost:3000
```

Start frontend:
```bash
npm start
```

## 🔑 Getting API Keys

1. Go to [Paddle Sandbox](https://sandbox-vendors.paddle.com/)
2. Navigate to **Developer Tools → Authentication**
3. Copy:
   - **API Key** (for backend)
   - **Client Token** (for frontend)

## 🧪 Testing

### Test Payment Card
- **Number**: 4242 4242 4242 4242
- **Expiry**: Any future date
- **CVV**: 123
- **Name**: Test User

### Complete Payment Flow

1. **Start services:**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm start
   
   # Terminal 2 - Frontend
   cd frontend && npm start
   ```

2. **Make a test payment:**
   - Go to `http://localhost:3001`
   - Click "Select Plan" on any plan
   - Complete payment with test card
   - On success page, click "Save Payment to Database"

3. **Verify payment saved:**
   ```bash
   # Check backend logs
   # Should see: "Received payment data: ..."
   
   # Or query endpoint
   curl http://localhost:3000/api/payments
   ```

## ✅ Verification Steps

### 1. Check Backend is Running
```bash
curl http://localhost:3000/
```
Expected: `{ "message": "Welcome to the API", ... }`

### 2. Check Plans are Loading
```bash
curl http://localhost:3000/api/plans
```
Expected: Array of products with prices

### 3. Test Payment Endpoint
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "txn_test123",
    "price_id": "pri_test123",
    "customer_email": "test@example.com",
    "amount": 400,
    "currency": "USD",
    "status": "completed"
  }'
```
Expected: `{ "success": true, ... }`

### 4. Verify Payment in Database
```bash
curl http://localhost:3000/api/payments
```
Expected: Array with your saved payment

### 5. MongoDB Verification
```bash
# Connect to MongoDB
mongosh paddle_subscription

# Query payments
db.payments.find().pretty()
```

##  Database Schema

### Payment Model
```javascript
{
  transaction_id: String (unique, required),
  price_id: String (required),
  customer_email: String (required),
  amount: Number (required),
  currency: String (required),
  status: String (enum: 'completed', 'pending', 'failed'),
  paddle_response: Object,
  created_at: Date
}
```

## 🎯 Features

✅ Display subscription plans from Paddle  
✅ Paddle.js overlay checkout  
✅ Success & Cancel pages  
✅ Payment data saved to MongoDB  
✅ Manual payment save button  
✅ Debug info on success page  
✅ Responsive UI  
✅ Error handling  

## 📝 Development Commands

### Backend
```bash
cd backend
npm start          # Start server
```

### Frontend
```bash
cd frontend
npm start          # Start dev server
npm build          # Build for production
npm test           # Run tests
```

## 🌐 Production Deployment

1. Build frontend: `cd frontend && npm run build`
2. Set production environment variables
3. Configure MongoDB connection string
4. Set up Paddle webhooks
5. Deploy backend to cloud (Heroku, AWS, etc.)
6. Deploy frontend to static hosting (Netlify, Vercel)

## 📄 License

ISC

## 👨‍💻 Support

For issues or questions, check:
- [Paddle Documentation](https://developer.paddle.com/)
- [Paddle Billing Guide](https://developer.paddle.com/concepts/get-started)


## TODO: Implement payment confi`rmation logic and save subscription/payment details to the database