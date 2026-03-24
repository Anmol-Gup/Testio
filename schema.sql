-- Testio Database Schema for Supabase

-- 1. Profiles (Extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro')),
  stripe_customer_id TEXT,
  customer_count_this_month INTEGER DEFAULT 0,
  last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  website_url TEXT,
  slug TEXT UNIQUE NOT NULL,
  testimonial_question TEXT DEFAULT 'How was your experience with our product?',
  widget_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Customers (Upgraded customers)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  upgrade_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'initial_sent', 'reminder_sent', 'responded')),
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Prevent duplicate customer rows per product (case-insensitive email)
CREATE UNIQUE INDEX IF NOT EXISTS customers_product_email_unique_idx
ON customers (product_id, lower(email));

-- 4. Testimonials
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  company TEXT,
  rating INTEGER,
  source TEXT DEFAULT 'direct', -- 'email' or 'direct'
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Policies for Profiles: Users can only read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for Products: Users can only manage their own products
CREATE POLICY "Users can view own products" ON products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON products FOR DELETE USING (auth.uid() = user_id);

-- Policies for Customers: Users can manage customers for their products
CREATE POLICY "Users can manage customers" ON customers FOR ALL USING (
  EXISTS (SELECT 1 FROM products WHERE products.id = customers.product_id AND products.user_id = auth.uid())
);

-- Policies for Testimonials: Users can manage their product testimonials
CREATE POLICY "Users can manage testimonials" ON testimonials FOR ALL USING (
  EXISTS (SELECT 1 FROM products WHERE products.id = testimonials.product_id AND products.user_id = auth.uid())
);

-- Public Policy for Testimonial Submission (anyone can insert)
CREATE POLICY "Public can submit testimonials" ON testimonials FOR INSERT WITH CHECK (true);

-- Public Policy for Widget (anyone can read approved testimonials)
CREATE POLICY "Public can view approved testimonials" ON testimonials FOR SELECT USING (status = 'approved');
