import { Footer } from '../../components/footer/footer';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, Eye, Database, Users, Globe, Mail, Building2, ChevronRight, FileText, Smartphone, Server } from 'lucide-react';
import fondoImage from '../../assets/fondo.png';
import '../cookie-policy-page/cookie-policy-page.css';
import { SEO } from '../../components/seo/seo';

export const PrivacyPolicyPage = () => {
  const { t, i18n } = useTranslation('legal');
  const { lang } = useParams<{ lang: string }>();
  const currentLang = lang || i18n.language || 'es';

  // Helper function to build language-prefixed URLs
  const buildUrl = (path: string) => `/${currentLang}${path}`;

  return (
    <div className="cookie-policy-page">
      <SEO
        title={t('privacyPolicy.title')}
        description={currentLang === 'es'
          ? "Política de privacidad de Pull Events. Conoce cómo protegemos y manejamos tus datos personales en nuestra plataforma de eventos en Guatemala."
          : "Pull Events Privacy Policy. Learn how we protect and handle your personal data on our event platform in Guatemala."
        }
        keywords={currentLang === 'es'
          ? "privacidad, política de privacidad, protección de datos, pull events, guatemala, GDPR"
          : "privacy, privacy policy, data protection, pull events, guatemala, GDPR"
        }
        noIndex={false}
      />
      {/* Background with blur */}
      <div
        className="legal-page-background"
        style={{ backgroundImage: `url(${fondoImage})` }}
      />
      <div className="legal-page-overlay" />

      <div className="cookie-policy-container">
        {/* Header */}
        <header className="cookie-policy-header">
          <div className="cookie-policy-icon">
            <Shield size={48} />
          </div>
          <h1>Privacy Policy</h1>
          <p className="cookie-policy-subtitle">
            Last updated: December 2024
          </p>
        </header>

        {/* Table of Contents */}
        <nav className="cookie-policy-toc">
          <h2>Contents</h2>
          <ul>
            <li><a href="#introduction"><ChevronRight size={16} /> Introduction</a></li>
            <li><a href="#controller"><ChevronRight size={16} /> Data controller</a></li>
            <li><a href="#data-collected"><ChevronRight size={16} /> Data we collect</a></li>
            <li><a href="#purposes"><ChevronRight size={16} /> Processing purposes</a></li>
            <li><a href="#legal-basis"><ChevronRight size={16} /> Legal basis</a></li>
            <li><a href="#sharing"><ChevronRight size={16} /> Who we share your data with</a></li>
            <li><a href="#security"><ChevronRight size={16} /> Data security</a></li>
            <li><a href="#rights"><ChevronRight size={16} /> Your rights</a></li>
            <li><a href="#contact"><ChevronRight size={16} /> Contact</a></li>
          </ul>
        </nav>

        {/* Content */}
        <main className="cookie-policy-content">

          {/* Company Info Banner */}
          <div className="company-info-banner">
            <Building2 size={24} />
            <div>
              <strong>Pull Capital S.A.</strong>
              <span>Tax ID: 120513684</span>
              <span>4ta avenida 41-25 zona 12, Monte Maria 3, Guatemala, Guatemala</span>
            </div>
          </div>

          {/* Section 1: Introduction */}
          <section id="introduction" className="policy-section">
            <div className="section-header">
              <Shield size={24} />
              <h2>1. Introduction</h2>
            </div>
            <div className="section-content">
              <p>
                At Pull Capital S.A. ("Pull", "we", "our"), we are committed to protecting
                your privacy and treating your personal data with the utmost care and transparency.
                This Privacy Policy describes how we collect, use, store, and
                protect your personal information when you use our ticket purchasing and
                event reservation platform.
              </p>
              <p>
                By using Pull's services, whether through our web or mobile application,
                you accept the practices described in this policy. We recommend reading it carefully
                and contacting us if you have any questions.
              </p>
              <div className="info-box">
                <strong>This policy applies to:</strong>
                <ul>
                  <li>Users who purchase tickets or make reservations</li>
                  <li>Event organizers and venues that use our platform</li>
                  <li>Venue staff who operate with Pull</li>
                  <li>Visitors to our website</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2: Data Controller */}
          <section id="controller" className="policy-section">
            <div className="section-header">
              <Building2 size={24} />
              <h2>2. Data controller</h2>
            </div>
            <div className="section-content">
              <p>
                The data controller for your personal data is:
              </p>
              <div className="contact-info-card">
                <div className="contact-item">
                  <Building2 size={20} />
                  <div>
                    <strong>Company name</strong>
                    <span>Pull Capital S.A.</span>
                  </div>
                </div>
                <div className="contact-item">
                  <FileText size={20} />
                  <div>
                    <strong>Tax ID</strong>
                    <span>120513684</span>
                  </div>
                </div>
                <div className="contact-item">
                  <Globe size={20} />
                  <div>
                    <strong>Address</strong>
                    <span>4ta avenida 41-25 zona 12, Monte Maria 3</span>
                    <span>Guatemala, Guatemala</span>
                  </div>
                </div>
                <div className="contact-item">
                  <Mail size={20} />
                  <div>
                    <strong>Privacy contact</strong>
                    <a href="mailto:info@pullgt.com">info@pullgt.com</a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Data We Collect */}
          <section id="data-collected" className="policy-section">
            <div className="section-header">
              <Database size={24} />
              <h2>3. Data we collect</h2>
            </div>
            <div className="section-content">
              <h3>3.1 Data you provide to us</h3>
              <ul className="detailed-list">
                <li>
                  <strong>Identification data:</strong> Name, surname, date of birth,
                  gender, ID number (identification document).
                </li>
                <li>
                  <strong>Contact data:</strong> Email address, phone number
                  (including country prefix).
                </li>
                <li>
                  <strong>Payment data:</strong> Credit/debit card information processed
                  securely through Stripe (we do not store complete card numbers).
                </li>
                <li>
                  <strong>Profile picture:</strong> Photo you can voluntarily upload to your account.
                </li>
              </ul>

              <h3>3.2 Data we collect automatically</h3>
              <ul className="detailed-list">
                <li>
                  <strong>Usage data:</strong> Events visited, tickets purchased, reservation
                  history, preferences.
                </li>
                <li>
                  <strong>Technical data:</strong> IP address, browser type, operating system,
                  device used.
                </li>
                <li>
                  <strong>Location data:</strong> Only if you authorize us, to show you nearby
                  events.
                </li>
                <li>
                  <strong>Cookies and similar technologies:</strong> See our{' '}
                  <Link to={buildUrl("/cookie-policy")}>Cookie Policy</Link> for more information.
                </li>
              </ul>

              <h3>3.3 Derived and calculated data</h3>
              <ul className="detailed-list">
                <li>
                  <strong>Behavioral metrics:</strong> Total spending, average spending, purchase
                  frequency (used to categorize users as regular or VIP).
                </li>
                <li>
                  <strong>Tags and segmentation:</strong> Internal categories to personalize
                  your experience (e.g., "electronic music lover").
                </li>
              </ul>

              <div className="info-box warning">
                <strong>Sensitive data:</strong> We do not intentionally collect sensitive data
                such as ethnic origin, religious beliefs, sexual orientation, or health data.
                If we detect that we have received this type of information by mistake, we will delete it.
              </div>
            </div>
          </section>

          {/* Section 4: Purposes */}
          <section id="purposes" className="policy-section">
            <div className="section-header">
              <Eye size={24} />
              <h2>4. Processing purposes</h2>
            </div>
            <div className="section-content">
              <p>We use your personal data for the following purposes:</p>

              <div className="cookie-types-grid">
                <div className="cookie-type-card necessary">
                  <div className="cookie-type-icon">
                    <Lock size={32} />
                  </div>
                  <h3>Service provision</h3>
                  <p>
                    Process ticket purchases, manage reservations, verify identity
                    at event entry, send confirmations and electronic tickets.
                  </p>
                </div>

                <div className="cookie-type-card analytics">
                  <div className="cookie-type-icon">
                    <Users size={32} />
                  </div>
                  <h3>Account management</h3>
                  <p>
                    Create and maintain your user account, manage your digital wallet,
                    display purchase history and active tickets.
                  </p>
                </div>

                <div className="cookie-type-card marketing">
                  <div className="cookie-type-icon">
                    <Mail size={32} />
                  </div>
                  <h3>Communications</h3>
                  <p>
                    Send you updates about your purchases, event information,
                    and marketing communications (only with your consent).
                  </p>
                </div>
              </div>

              <h3>Other purposes:</h3>
              <ul className="detailed-list">
                <li>
                  <strong>Security and fraud prevention:</strong> Protect the platform and
                  our users against fraudulent activities or abuse.
                </li>
                <li>
                  <strong>Service improvement:</strong> Analyze platform usage to
                  improve features and user experience.
                </li>
                <li>
                  <strong>Legal compliance:</strong> Comply with applicable tax, accounting,
                  and legal obligations in Guatemala.
                </li>
                <li>
                  <strong>Customer support:</strong> Respond to your inquiries, complaints, or
                  support requests.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 5: Legal Basis */}
          <section id="legal-basis" className="policy-section">
            <div className="section-header">
              <FileText size={24} />
              <h2>5. Legal basis for processing</h2>
            </div>
            <div className="section-content">
              <div className="legal-basis-grid">
                <div className="legal-basis-card">
                  <h4>Contract execution</h4>
                  <p>
                    We process your data when necessary to fulfill the ticket
                    purchase or reservation contract you establish with us.
                  </p>
                </div>

                <div className="legal-basis-card">
                  <h4>Consent</h4>
                  <p>
                    For marketing communications, non-essential cookies, and other optional
                    processing, we request your explicit consent.
                  </p>
                </div>

                <div className="legal-basis-card">
                  <h4>Legitimate interest</h4>
                  <p>
                    To improve our services, prevent fraud, and ensure the security
                    of the platform and its users.
                  </p>
                </div>

                <div className="legal-basis-card">
                  <h4>Legal obligation</h4>
                  <p>
                    To comply with tax, accounting, and other applicable legal
                    requirements in Guatemala.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Data Sharing */}
          <section id="sharing" className="policy-section">
            <div className="section-header">
              <Users size={24} />
              <h2>6. Who we share your data with</h2>
            </div>
            <div className="section-content">
              <p>
                We only share your personal data in the following circumstances:
              </p>

              <ul className="detailed-list">
                <li>
                  <strong>Venues and organizers:</strong> We share name, photo, and ticket
                  information with the venue where you will attend the event, to verify your entry.
                </li>
                <li>
                  <strong>Payment processors (Stripe):</strong> Your payment information is processed
                  securely through Stripe, complying with PCI-DSS standards.
                </li>
                <li>
                  <strong>Infrastructure providers (Supabase):</strong> We store data
                  on secure servers with encryption at rest and in transit.
                </li>
                <li>
                  <strong>Communication services (Resend):</strong> To send transactional
                  and marketing emails.
                </li>
                <li>
                  <strong>Analytics (Google Analytics):</strong> Only if you give consent,
                  with anonymized data.
                </li>
                <li>
                  <strong>Competent authorities:</strong> When required by law or
                  court order.
                </li>
              </ul>

              <div className="info-box">
                <strong>Important:</strong> We never sell your personal data to third parties.
                All our providers are contractually obligated to protect your
                information and use it only for the specified purposes.
              </div>
            </div>
          </section>

          {/* Section 7: Security */}
          <section id="security" className="policy-section">
            <div className="section-header">
              <Lock size={24} />
              <h2>7. Data security</h2>
            </div>
            <div className="section-content">
              <p>
                We implement technical and organizational measures to protect your data:
              </p>

              <div className="cookie-types-grid">
                <div className="cookie-type-card necessary">
                  <div className="cookie-type-icon">
                    <Lock size={32} />
                  </div>
                  <h3>Encryption</h3>
                  <p>
                    All communications are protected with HTTPS/TLS. Sensitive
                    data is encrypted at rest and in transit.
                  </p>
                </div>

                <div className="cookie-type-card analytics">
                  <div className="cookie-type-icon">
                    <Server size={32} />
                  </div>
                  <h3>Secure authentication</h3>
                  <p>
                    We use HttpOnly cookies, signed JWT tokens, and identity
                    verification with one-time codes.
                  </p>
                </div>

                <div className="cookie-type-card marketing">
                  <div className="cookie-type-icon">
                    <Smartphone size={32} />
                  </div>
                  <h3>Secure storage</h3>
                  <p>
                    On mobile devices, tokens are stored in the Keychain (iOS)
                    or Keystore (Android) with hardware encryption.
                  </p>
                </div>
              </div>

              <h3>Other security measures:</h3>
              <ul>
                <li>Restricted access to personal data (principle of least privilege)</li>
                <li>Continuous monitoring of suspicious activities</li>
                <li>Regular backups and recovery plan</li>
                <li>Periodic staff training in data protection</li>
              </ul>
            </div>
          </section>

          {/* Section 8: Your Rights */}
          <section id="rights" className="policy-section">
            <div className="section-header">
              <Eye size={24} />
              <h2>8. Your rights</h2>
            </div>
            <div className="section-content">
              <p>
                You have the following rights regarding your personal data:
              </p>

              <ul className="detailed-list">
                <li>
                  <strong>Access:</strong> Request a copy of the personal data we
                  hold about you.
                </li>
                <li>
                  <strong>Rectification:</strong> Correct inaccurate or incomplete data.
                  You can update many details directly from your profile.
                </li>
                <li>
                  <strong>Deletion:</strong> Request that we delete your personal data,
                  subject to legal retention obligations.
                </li>
                <li>
                  <strong>Objection:</strong> Object to the processing of your data for
                  certain purposes, such as direct marketing.
                </li>
                <li>
                  <strong>Portability:</strong> Receive your data in a structured
                  and commonly used format.
                </li>
                <li>
                  <strong>Withdrawal of consent:</strong> Withdraw your consent at
                  any time for consent-based processing.
                </li>
              </ul>

              <div className="info-box">
                <strong>How to exercise your rights:</strong>
                <p>
                  Send an email to <a href="mailto:info@pullgt.com">info@pullgt.com</a> with
                  the subject "Privacy rights request" clearly indicating your
                  request. We will respond within a maximum of 30 days.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Contact */}
          <section id="contact" className="policy-section">
            <div className="section-header">
              <Mail size={24} />
              <h2>9. Contact</h2>
            </div>
            <div className="section-content">
              <p>
                For any questions, comments, or requests related to this
                Privacy Policy, you can contact us:
              </p>

              <div className="contact-info-card">
                <div className="contact-item">
                  <Mail size={20} />
                  <div>
                    <strong>Email</strong>
                    <a href="mailto:info@pullgt.com">info@pullgt.com</a>
                  </div>
                </div>
                <div className="contact-item">
                  <Building2 size={20} />
                  <div>
                    <strong>Postal address</strong>
                    <span>Pull Capital S.A.</span>
                    <span>4ta avenida 41-25 zona 12, Monte Maria 3</span>
                    <span>Guatemala, Guatemala</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Notice */}
          <div className="policy-footer-notice">
            <p>
              This Privacy Policy was last updated in <strong>December 2024</strong>.
              We reserve the right to modify it to adapt to legislative changes or
              new features. We will notify you of any relevant changes.
            </p>
            <Link to={buildUrl("/venues/aurora-hall/events")} className="back-home-link">
              {currentLang === 'es' ? 'Volver a la página principal' : 'Back to home page'}
            </Link>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};
