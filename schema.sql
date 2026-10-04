CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code TEXT NOT NULL UNIQUE,
  mercado_pago_order_id TEXT,
  mercado_pago_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  status_detail TEXT,
  payment_method TEXT,
  installments INTEGER DEFAULT 1,
  customer_first_name TEXT,
  customer_last_name TEXT,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_cep TEXT,
  shipping_state TEXT,
  shipping_city TEXT,
  shipping_district TEXT,
  shipping_street TEXT,
  shipping_number TEXT,
  shipping_complement TEXT,
  coupon_code TEXT,
  subtotal REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  shipping_amount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  fragrance TEXT,
  size TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  total_price REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orders_email
ON orders(customer_email);

CREATE INDEX IF NOT EXISTS idx_orders_status
ON orders(status);

CREATE INDEX IF NOT EXISTS idx_orders_created_at
ON orders(created_at);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
ON order_items(order_id);
