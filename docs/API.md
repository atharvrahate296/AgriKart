# API Documentation

## Base URL
- Development: `http://localhost:3001/api`
- Production: `https://api.agrikart.com/api`

---

## Products Endpoints

### Get All Products
```
GET /products?category=Seeds&sortBy=price_low
```

**Query Parameters:**
- `category` (string): Filter by category
- `search` (string): Search term
- `sortBy` (string): `newest`, `price_low`, `price_high`, `rating`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Premium Seeds",
      "price": 450.00,
      "stock_quantity": 100,
      "rating": 4.5
    }
  ],
  "count": 150
}
```

### Get Product Details
```
GET /products/:id
```

### Search Products
```
GET /search?q=fertilizer
```

---

## Orders Endpoints

### Create Order
```
POST /orders
```

**Request Body:**
```json
{
  "items": [{"product_id": "uuid", "quantity": 5}],
  "delivery_address": "123 Farm Lane"
}
```

---

## Messages Endpoints

### Send Message
```
POST /messages
```

**Request Body:**
```json
{
  "receiver_id": "uuid",
  "product_id": "uuid",
  "message": "Is this in bulk?"
}
```

---

## WebSocket Events

### Send Message
```javascript
socket.emit('send_message', {
  sender_id: 'uuid',
  receiver_id: 'uuid',
  message: 'Your message'
});
```

### Receive Message
```javascript
socket.on('receive_message', (data) => {
  console.log(data);
});
```

---

For complete API details, visit our full documentation portal.
