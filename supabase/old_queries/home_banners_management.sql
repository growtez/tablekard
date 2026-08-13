CREATE TABLE home_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  link_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE home_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Banners are publicly visible"
  ON home_banners FOR SELECT USING (true);

CREATE POLICY "Restaurant staff can manage banners"
  ON home_banners FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_users WHERE profile_id = auth.uid() AND active = true
    )
  );
