# API Examples

Base URL: `http://localhost:5001/api` (alias: `/api/v1`)

## Auth

```bash
curl -i -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ava","email":"ava@example.com","password":"password123"}'
```

```bash
curl -i -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ava@example.com","password":"password123"}'
```

```bash
curl -i http://localhost:5001/api/auth/me \
  -H "Content-Type: application/json"
```

## Restaurants + Menu

```bash
curl -i "http://localhost:5001/api/restaurants?limit=10&offset=0"
```

```bash
curl -i http://localhost:5001/api/restaurants/<restaurant_id>
```

```bash
curl -i http://localhost:5001/api/restaurants/<restaurant_id>/menu
```

## Cart + Items

```bash
curl -i -X POST http://localhost:5001/api/cart \
  -H "Content-Type: application/json" \
  -d '{"restaurant_id":"<restaurant_id>","order_type":"pickup"}'
```

```bash
curl -i -X POST http://localhost:5001/api/cart/items \
  -H "Content-Type: application/json" \
  -d '{"cart_id":"<cart_id>","menu_item_id":"<menu_item_id>","quantity":2}'
```

```bash
curl -i -X POST http://localhost:5001/api/cart/apply-promo \
  -H "Content-Type: application/json" \
  -d '{"cart_id":"<cart_id>","code":"WELCOME10"}'
```

## Checkout

```bash
curl -i -X POST http://localhost:5001/api/checkout/confirm \
  -H "Content-Type: application/json" \
  -d '{"cart_id":"<cart_id>","pickup_window":{"start":"2024-01-01T12:00:00+00:00","end":"2024-01-01T12:30:00+00:00"}}'
```

## Restaurant Admin: Create Item

```bash
curl -i -X POST http://localhost:5001/api/restaurant-admin/menus/<menu_id>/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Chicken Bowl","base_price_cents":1299,"category_id":"<category_id>"}'
```
