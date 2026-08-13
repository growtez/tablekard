import React from 'react';
import { Mail, Phone, MessageSquare, HeadphonesIcon, Globe, MapPin, ExternalLink, ArrowRight } from 'lucide-react';

const ContactPage: React.FC = () => {
  const contactMethods = [
    {
      title: 'Email Support',
      description: 'Get help with your account, billing, or technical issues via email.',
      icon: <Mail className="text-blue-500" size={24} />,
      value: 'support@tablekard.com',
      action: 'mailto:support@tablekard.com',
      actionLabel: 'Send an email',
      color: 'blue'
    },
    {
      title: 'Phone Support',
      description: 'Speak directly with our customer success team for urgent matters.',
      icon: <Phone className="text-green-500" size={24} />,
      value: '+91 90000 00000',
      action: 'tel:+919000000000',
      actionLabel: 'Call now',
      color: 'green'
    },
    {
      title: 'WhatsApp Chat',
      description: 'Quick answers and support through our WhatsApp business channel.',
      icon: <MessageSquare className="text-emerald-500" size={24} />,
      value: 'WhatsApp Support',
      action: 'https://wa.me/919000000000',
      actionLabel: 'Message us',
      color: 'emerald'
    }
  ];

  return (
    <div className="w-full h-full min-h-[calc(100vh-80px)] font-['Outfit',sans-serif]">
      {/* Header */}
      <div className="sticky top-0 z-[60] bg-white/80 dark:bg-tk-bg-surface backdrop-blur-2xl pt-6 -mt-6 -mx-6 px-8 mb-8 border-b border-[#E2E8F0] dark:border-tk-border shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative">
          <div className="flex-1 w-full flex justify-start pb-4 sm:pb-5">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-tk-burgundy to-[#1A202C] dark:from-white dark:to-tk-text-secondary bg-clip-text text-transparent tracking-tight">
              Contact Tablekard
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Intro */}
        <div className="bg-white dark:bg-tk-bg-card border border-[#E2E8F0] dark:border-tk-border rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-tk-burgundy/10 flex items-center justify-center shrink-0">
              <HeadphonesIcon className="text-tk-burgundy" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1A202C] dark:text-tk-text mb-2">We're here to help</h2>
              <p className="text-[#4A5568] dark:text-tk-text-secondary text-sm sm:text-base leading-relaxed max-w-2xl">
                Have a question about your subscription, need help managing your restaurant profile, or want to suggest a new feature? Reach out to our dedicated support team using any of the methods below.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {contactMethods.map((method, idx) => (
            <div key={idx} className="bg-white dark:bg-tk-bg-card border border-[#E2E8F0] dark:border-tk-border rounded-2xl p-6 hover:shadow-md transition-shadow group flex flex-col h-full">
              <div className="mb-4">
                <div className={`w-12 h-12 rounded-xl bg-${method.color}-500/10 dark:bg-${method.color}-500/20 flex items-center justify-center mb-4`}>
                  {method.icon}
                </div>
                <h3 className="text-lg font-bold text-[#1A202C] dark:text-tk-text mb-2">{method.title}</h3>
                <p className="text-[13px] text-[#718096] dark:text-tk-text-muted leading-relaxed">
                  {method.description}
                </p>
              </div>
              <div className="mt-auto pt-4 border-t border-[#E2E8F0] dark:border-tk-border">
                <a 
                  href={method.action} 
                  target={method.action.startsWith('http') ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="flex items-center justify-between group-hover:text-tk-burgundy text-[#4A5568] dark:text-tk-text-secondary transition-colors"
                >
                  <span className="font-semibold text-sm">{method.actionLabel}</span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-tk-bg-hover flex items-center justify-center group-hover:bg-tk-burgundy/10 transition-colors">
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Office Location */}
        <div className="bg-white dark:bg-tk-bg-card border border-[#E2E8F0] dark:border-tk-border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-tk-bg-surface flex items-center justify-center shrink-0">
            <MapPin className="text-[#4A5568] dark:text-tk-text-secondary" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-bold text-[#1A202C] dark:text-tk-text mb-1">Tablekard Headquarters</h3>
            <p className="text-[14px] text-[#4A5568] dark:text-tk-text-secondary">
              123 Innovation Drive, Tech Park<br />
              Bangalore, Karnataka 560001, India
            </p>
          </div>
          <a 
            href="https://tablekard.com" 
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl border border-[#CBD5E0] dark:border-tk-border hover:bg-slate-50 dark:hover:bg-tk-bg-hover text-[#4A5568] dark:text-tk-text-secondary text-sm font-semibold transition-colors flex items-center gap-2 w-full sm:w-auto justify-center shrink-0"
          >
            <Globe size={16} />
            Visit Website
          </a>
        </div>
        
      </div>
    </div>
  );
};

export default ContactPage;
