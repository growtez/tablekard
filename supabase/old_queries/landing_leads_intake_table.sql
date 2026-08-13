CREATE TABLE IF NOT EXISTS public.landing_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    country TEXT NOT NULL,
    state TEXT,
    district TEXT,
    phone_number TEXT NOT NULL,
    email TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.landing_leads ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (since the landing page is public and unauthenticated)
CREATE POLICY "Public can insert leads" ON public.landing_leads FOR INSERT WITH CHECK (true);

-- Only super_admin can view/manage leads
CREATE POLICY "Super admins can manage leads" ON public.landing_leads FOR ALL USING (public.is_super_admin());
