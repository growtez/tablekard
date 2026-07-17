// main.ts - Restaurant Dynamic Website Template - Razorpay Verification Vouching

document.addEventListener('DOMContentLoaded', () => {
  // Parse query parameters
  const urlParams = new URLSearchParams(window.location.search);
  
  // Dynamic variables with default template fallbacks
  const name = urlParams.get('restaurant_name') || urlParams.get('name') || 'TableKard Gourmet Bistro';
  const email = urlParams.get('email') || 'contact@gourmetbistro.com';
  const phone = urlParams.get('phone') || '+91 98765 43210';
  const address = urlParams.get('address') || '123 Food Street, Culinary Zone, Bangalore, KA, 560001';
  
  // Current Year
  const currentYear = new Date().getFullYear().toString();

  // Populate dynamic placeholders
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

  // Terms specific elements
  const legalNameEl = document.getElementById('legal-business-name');
  if (legalNameEl) legalNameEl.textContent = name;

  const operationalAddressEl = document.getElementById('operational-address');
  if (operationalAddressEl) operationalAddressEl.textContent = address;

  const footerYear = document.getElementById('footer-year');
  if (footerYear) footerYear.textContent = currentYear;

  const footerName = document.getElementById('footer-restaurant-name');
  if (footerName) footerName.textContent = name;
  
  // Persist URL query parameters to links to maintain dynamic context between pages
  const navLinks = document.querySelectorAll('nav.main-nav a, .footer-links a');
  navLinks.forEach(link => {
    const anchor = link as HTMLAnchorElement;
    const url = new URL(anchor.href, window.location.origin);
    
    // Only append parameters for internal pages (.html)
    if (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname === '') {
      urlParams.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
      anchor.href = url.pathname + url.search + url.hash;
    }
  });
});
