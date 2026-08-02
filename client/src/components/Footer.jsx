import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SUPABASE_URL } from '../config';
import { useI18n } from '../i18n/I18nContext';

const JUMP_LINKS = [
  { id: 'home', labelKey: 'footer.jumpHome' },
  { id: 'online-services', labelKey: 'footer.jumpOnlineServices' },
  { id: 'services', labelKey: 'footer.jumpServices' },
  { id: 'about', labelKey: 'footer.jumpAbout' },
  { id: 'testimonials', labelKey: 'footer.jumpTestimonials' },
];

const QUICK_LINKS = [
  { to: '/', labelKey: 'footer.home' },
  { to: '/about-us', labelKey: 'footer.aboutUs' },
  { to: '/services', labelKey: 'footer.ourServices' },
  { to: '/find-doctor', labelKey: 'footer.findADoctor' },
  { to: '/appointments', labelKey: 'footer.bookAppointment' },
  { to: '/faqs', labelKey: 'footer.contactUs' },
];

const SERVICE_LINKS = [
  { to: '/services', labelKey: 'footer.emergencyCare' },
  { to: '/services', labelKey: 'footer.generalMedicine' },
  { to: '/services', labelKey: 'footer.cardiology' },
  { to: '/services', labelKey: 'footer.orthopaedics' },
  { to: '/ambulance', labelKey: 'footer.ambulanceServices' },
  { to: '/services', labelKey: 'footer.diagnostics' },
];

const Footer = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  const scrollToSection = (id) => {
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: id } });
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        {/* Brand Section - Full Width */}
        <div className="footer-brand-section">
          <div style={styles.logoIcon}>
            <img
              src={`${SUPABASE_URL}/storage/v1/object/public/images/logo-footer.png`}
              alt="Rodab Medical"
              style={{ height: 24, width: 'auto' }}
            />
          </div>
          <div className="footer-brand-text">
            <h4>{t('nav.brand')}</h4>
            <div className="subtext">{t('footer.brandSub')}</div>
            <p>{t('footer.aboutText')}</p>
            <div className="footer-social-links">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="footer-social-icon" aria-label="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="footer-social-icon" aria-label="Twitter">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer-social-icon" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="footer-social-icon" aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Quick Jump - in-page section navigation */}
        <div style={styles.jumpSection}>
          <h4 style={styles.heading}>{t('footer.quickJump')}</h4>
          <div style={styles.jumpRow}>
            {JUMP_LINKS.map((jump) => (
              <button
                key={jump.id}
                type="button"
                onClick={() => scrollToSection(jump.id)}
                style={styles.jumpBtn}
              >
                {t(jump.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* 3-Column Grid */}
        <div className="footer-grid">
          {/* Quick Links */}
          <div style={styles.column}>
            <h4 style={styles.heading}>{t('footer.quickLinks')}</h4>
            <ul style={styles.linkList} aria-label={t('footer.quickLinks')}>
              {QUICK_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="footer-link">{t(link.labelKey)}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div style={styles.column}>
            <h4 style={styles.heading}>{t('footer.servicesHeading')}</h4>
            <ul style={styles.linkList} aria-label={t('footer.servicesHeading')}>
              {SERVICE_LINKS.map((link, index) => (
                <li key={`${link.to}-${index}`}>
                  <Link to={link.to} className="footer-link">{t(link.labelKey)}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div style={styles.column}>
            <h4 style={styles.heading}>{t('footer.contactHeading')}</h4>
            <div style={styles.contactList} role="list" aria-label={t('footer.contactHeading')}>
              <div style={styles.contactItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.contactIcon} aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{t('footer.location')}</span>
              </div>
              <div style={styles.contactItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.contactIcon} aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
                <a href="tel:+353831257105" style={styles.contactLink}>{t('footer.phoneNumber')}</a>
              </div>
              <div style={styles.contactItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.contactIcon} aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <a href="mailto:info@rodabmedical.com" style={styles.contactLink}>{t('footer.emailAddress')}</a>
              </div>
              <div style={styles.contactItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.contactIcon} aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{t('footer.emergencyHours')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <p style={styles.copyright}>
            &copy; {currentYear} {t('footer.copyright')}
          </p>
          <div style={styles.bottomLinks}>
            <Link to="/privacy-policy" style={styles.bottomLink}>{t('footer.privacyPolicy')}</Link>
            <Link to="/policies" style={styles.bottomLink}>{t('footer.termsOfService')}</Link>
            <Link to="/privacy-policy" style={styles.bottomLink}>{t('footer.cookiePolicy')}</Link>
          </div>
          <div />
        </div>
      </div>
    </footer>
  );
};

const styles = {
  footer: {
    backgroundColor: 'var(--brand-bg)',
    color: '#cbd5e1',
    paddingTop: '60px',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
  },
  column: {
    minWidth: 0,
  },
  heading: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    marginBottom: '20px',
    position: 'relative',
    paddingBottom: '10px',
  },
  jumpSection: {
    marginBottom: '40px',
  },
  jumpRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  jumpBtn: {
    padding: '10px 18px',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#e2e8f0',
    fontSize: '13.5px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
    minHeight: '44px',
  },
  linkList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  contactList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: '#94a3b8',
  },
  contactIcon: {
    flexShrink: 0,
    opacity: 0.7,
  },
  contactLink: {
    color: '#94a3b8',
    textDecoration: 'none',
  },
  copyright: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: 0,
  },
  bottomLinks: {
    display: 'flex',
    gap: '20px',
  },
  bottomLink: {
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '13px',
    transition: 'color 0.2s',
  },
  logoIcon: {
    width: '38px',
    height: '38px',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
};

export default Footer;
