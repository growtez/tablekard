// main.ts - Restaurant Dynamic Website Template - Fetch from Supabase
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sguegujmoawhtstzsdqs.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

document.addEventListener('DOMContentLoaded', async () => {
  // Parse query parameters
  const urlParams = new URLSearchParams(window.location.search);
  
  // Default fallbacks in case query or DB fails
  let name = 'TableKard Gourmet Bistro';
  let email = 'contact@gourmetbistro.com';
  let phone = '+91 98765 43210';
  let address = '123 Food Street, Culinary Zone, Bangalore, KA, 560001';

  // Read ID or Slug from URL
  const restaurantId = urlParams.get('restaurant_id') || urlParams.get('id');
  const restaurantSlug = urlParams.get('slug');

  if (restaurantId || restaurantSlug) {
    try {
      // Build query
      let query = supabase
        .from('restaurants')
        .select('name, contact_email, contact_phone, contact_address');
      
      if (restaurantId) {
        query = query.eq('id', restaurantId);
      } else if (restaurantSlug) {
        query = query.eq('slug', restaurantSlug);
      }

      const { data: restaurant, error } = await query.maybeSingle();

      if (error) {
        console.error('Supabase fetch error:', error);
      } else if (restaurant) {
        // Override with DB values
        name = restaurant.name || name;
        email = restaurant.contact_email || email;
        phone = restaurant.contact_phone || phone;
        address = restaurant.contact_address || address;
      }
    } catch (err) {
      console.error('Failed to query database:', err);
    }
  }

  // Current Year
  const currentYear = new Date().getFullYear().toString();

  // Populate dynamic placeholders on the page
  const navLogo = document.getElementById('nav-restaurant-logo');
  if (navLogo) navLogo.textContent = name;

  const heroName = document.getElementById('hero-restaurant-name');
  if (heroName) heroName.textContent = name;

  const contactEmailEl = document.getElementById('contact-email');
  if (contactEmailEl) {
    contactEmailEl.textContent = email;
    if (contactEmailEl.tagName === 'A') {
      (contactEmailEl as HTMLAnchorElement).href = `mailto:${email}`;
    }
  }

  const contactPhoneEl = document.getElementById('contact-phone');
  if (contactPhoneEl) {
    contactPhoneEl.textContent = phone;
    if (contactPhoneEl.tagName === 'A') {
      (contactPhoneEl as HTMLAnchorElement).href = `tel:${phone.replace(/\s+/g, '')}`;
    }
  }

  const contactAddressEl = document.getElementById('contact-address');
  if (contactAddressEl) contactAddressEl.textContent = address;

  // Terms page placeholders
  const legalNameEl = document.getElementById('legal-business-name');
  if (legalNameEl) legalNameEl.textContent = name;

  const operationalAddressEl = document.getElementById('operational-address');
  if (operationalAddressEl) operationalAddressEl.textContent = address;

  const footerYear = document.getElementById('footer-year');
  if (footerYear) footerYear.textContent = currentYear;

  const footerName = document.getElementById('footer-restaurant-name');
  if (footerName) footerName.textContent = name;
  
  // Persist URL parameters across link navigations (nav, buttons, footers)
  const navLinks = document.querySelectorAll('nav.main-nav a, .footer-links a, .hero-actions a');
  navLinks.forEach(link => {
    const anchor = link as HTMLAnchorElement;
    try {
      const url = new URL(anchor.href, window.location.origin);
      // Only append search params for internal links (excluding anchors/hashes on the same page)
      if (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname === '') {
        urlParams.forEach((value, key) => {
          url.searchParams.set(key, value);
        });
        anchor.href = url.pathname + url.search + url.hash;
      }
    } catch (e) {
      // Ignored for invalid or empty links
    }
  });
});
