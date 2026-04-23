CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  clerk_organization_id varchar NOT NULL UNIQUE,
  business_type varchar NOT NULL DEFAULT 'generic',
  features_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  plan varchar DEFAULT 'starter',
  polar_customer_id varchar,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  color varchar(7),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  description varchar(500),
  sku varchar(100),
  barcode varchar(100),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  stock_quantity integer NOT NULL DEFAULT 0,
  min_stock integer DEFAULT 0,
  cost_price numeric(10,2),
  sale_price numeric(10,2),
  tracking_mode varchar DEFAULT 'sku',
  image_url varchar,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  type varchar NOT NULL,
  reason varchar,
  quantity integer NOT NULL,
  quantity_before integer NOT NULL,
  quantity_after integer NOT NULL,
  notes text,
  clerk_user_id varchar NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  clerk_user_id varchar NOT NULL,
  action varchar NOT NULL,
  entity_type varchar NOT NULL,
  entity_id varchar,
  diff jsonb,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  clerk_user_id varchar NOT NULL,
  type varchar NOT NULL,
  title varchar NOT NULL,
  body text,
  payload jsonb,
  read_at timestamp,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_tenant_id ON categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_movements_tenant_id ON movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
