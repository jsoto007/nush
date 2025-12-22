#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5001/api}"

echo "Using BASE_URL=${BASE_URL}"

curl -i -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Ava","email":"ava@example.com","password":"password123"}'

curl -i -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"ava@example.com","password":"password123"}'

curl -i "${BASE_URL}/restaurants?limit=5&offset=0"

curl -i -X POST "${BASE_URL}/cart" \
  -H "Content-Type: application/json" \
  -d '{"restaurant_id":"<restaurant_id>","order_type":"pickup"}'

curl -i -X POST "${BASE_URL}/cart/items" \
  -H "Content-Type: application/json" \
  -d '{"cart_id":"<cart_id>","menu_item_id":"<menu_item_id>","quantity":1}'

curl -i -X POST "${BASE_URL}/cart/apply-promo" \
  -H "Content-Type: application/json" \
  -d '{"cart_id":"<cart_id>","code":"WELCOME10"}'

curl -i -X POST "${BASE_URL}/checkout/confirm" \
  -H "Content-Type: application/json" \
  -d '{"cart_id":"<cart_id>","pickup_window":{"start":"2024-01-01T12:00:00+00:00","end":"2024-01-01T12:30:00+00:00"}}'

curl -i -X POST "${BASE_URL}/restaurant-admin/menus/<menu_id>/items" \
  -H "Content-Type: application/json" \
  -d '{"name":"Chicken Bowl","base_price_cents":1299,"category_id":"<category_id>"}'
