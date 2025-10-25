# Backend API

## Testing Paddle Sandbox API in Postman

### 1. Get Products with Prices

**Method:** `GET`

**URL:**
```
https://sandbox-api.paddle.com/products?include=prices
```

**Headers:**
- `Authorization`: `Bearer YOUR_SANDBOX_API_KEY`
- `Content-Type`: `application/json`

**Query Parameters:**
- `include`: `prices` (to include related prices in the response)

---

## Local Development

### Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the `backend` directory:
```env
PADDLE_API_KEY=your_paddle_sandbox_api_key_here
PORT=3000
NODE_ENV=development
```

3. Start the server:
```bash
npm start
```

### API Endpoints

#### `GET /`
Welcome endpoint.

#### `GET /api/plans`
Fetch all Paddle products with their prices.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "product_id": "pro_xxx",
      "name": "Product Name",
      "description": "Product Description",
      "prices": [
        {
          "price_id": "pri_xxx",
          "amount": "1000",
          "interval": "month",
          "currency": "USD"
        }
      ]
    }
  ],
  "count": 1
}
```
