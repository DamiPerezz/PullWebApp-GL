import { Footer } from '../../components/footer/footer';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Cookie, Shield, BarChart3, Target, Settings, Mail, Building2, ChevronRight } from 'lucide-react';
import { CookieSettingsButton } from '../../components/cookie-banner/cookie-banner';
import fondoImage from '../../assets/fondo.png';
import './cookie-policy-page.css';
import { SEO } from '../../components/seo/seo';

export const CookiePolicyPage = () => {
  const { t, i18n } = useTranslation('legal');
  const { lang } = useParams<{ lang: string }>();
  const currentLang = lang || i18n.language || 'es';

  // Helper function to build language-prefixed URLs
  const buildUrl = (path: string) => `/${currentLang}${path}`;

  return (
    <div className="cookie-policy-page">
      <SEO
        title={t('cookiePolicy.title')}
        description={currentLang === 'es'
          ? "Política de cookies de Pull Events. Conoce cómo usamos cookies para mejorar tu experiencia en nuestra plataforma de eventos en Guatemala."
          : "Pull Events Cookie Policy. Learn how we use cookies to improve your experience on our event platform in Guatemala."
        }
        keywords={currentLang === 'es'
          ? "cookies, política de cookies, pull events, privacidad, guatemala"
          : "cookies, cookie policy, pull events, privacy, guatemala"
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
            <Cookie size={48} />
          </div>
          <h1>Cookie Policy</h1>
          <p className="cookie-policy-subtitle">
            Last updated: December 2024
          </p>
        </header>

        {/* Table of Contents */}
        <nav className="cookie-policy-toc">
          <h2>Contents</h2>
          <ul>
            <li><a href="#what-are"><ChevronRight size={16} /> What are cookies</a></li>
            <li><a href="#types"><ChevronRight size={16} /> Types of cookies we use</a></li>
            <li><a href="#detail"><ChevronRight size={16} /> Detail of each category</a></li>
            <li><a href="#table"><ChevronRight size={16} /> Cookie table</a></li>
            <li><a href="#legal-basis"><ChevronRight size={16} /> Legal basis</a></li>
            <li><a href="#configure"><ChevronRight size={16} /> How to configure or reject cookies</a></li>
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

          {/* Section 1: What are cookies */}
          <section id="what-are" className="policy-section">
            <div className="section-header">
              <Cookie size={24} />
              <h2>1. What are cookies</h2>
            </div>
            <div className="section-content">
              <p>
                Cookies are small text files that are stored on your device (computer,
                tablet, or mobile phone) when you visit a website. These files allow the site
                to remember your actions and preferences over a period of time, so you don't have to
                reconfigure them every time you return or navigate between different pages.
              </p>
              <p>
                Cookies are a standard technology used by virtually all modern websites.
                They are not executable programs and do not contain viruses; they simply store information
                that helps improve your browsing experience.
              </p>
              <div className="info-box">
                <strong>At Pull, we use cookies to:</strong>
                <ul>
                  <li>Keep your session active while you browse</li>
                  <li>Remember items in your shopping cart</li>
                  <li>Understand how you use our platform to improve it</li>
                  <li>Personalize content and ads you see (with your consent)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2: Types of cookies */}
          <section id="types" className="policy-section">
            <div className="section-header">
              <Settings size={24} />
              <h2>2. Types of cookies we use</h2>
            </div>
            <div className="section-content">
              <p>
                At Pull, we classify cookies into three main categories, according to their purpose:
              </p>

              <div className="cookie-types-grid">
                <div className="cookie-type-card necessary">
                  <div className="cookie-type-icon">
                    <Shield size={32} />
                  </div>
                  <h3>Necessary Cookies</h3>
                  <span className="cookie-type-badge">Always active</span>
                  <p>
                    Essential for basic site functionality. Without them,
                    you couldn't browse, log in, or complete purchases. They don't require
                    your consent because they are essential to provide the service.
                  </p>
                </div>

                <div className="cookie-type-card analytics">
                  <div className="cookie-type-icon">
                    <BarChart3 size={32} />
                  </div>
                  <h3>Analytics Cookies</h3>
                  <span className="cookie-type-badge optional">Require consent</span>
                  <p>
                    Help us understand how users interact with Pull: which pages
                    they visit, how long they stay, where they come from. This information
                    is anonymous and allows us to continuously improve the platform.
                  </p>
                </div>

                <div className="cookie-type-card marketing">
                  <div className="cookie-type-icon">
                    <Target size={32} />
                  </div>
                  <h3>Marketing Cookies</h3>
                  <span className="cookie-type-badge optional">Require consent</span>
                  <p>
                    Allow us to show you relevant ads on other platforms (such as social
                    networks) based on your activity on Pull. They are only activated if you give us
                    your explicit permission.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Detail by category */}
          <section id="detail" className="policy-section">
            <div className="section-header">
              <Shield size={24} />
              <h2>3. Detail of each category</h2>
            </div>
            <div className="section-content">

              <h3>3.1 Technical / Necessary Cookies</h3>
              <p>These cookies are fundamental for Pull to work correctly:</p>
              <ul className="detailed-list">
                <li>
                  <strong>Session management:</strong> Keep your session active after
                  logging in, so you don't have to identify yourself again on each page.
                </li>
                <li>
                  <strong>Secure authentication:</strong> We use HttpOnly cookies to
                  protect your session against security attacks (XSS).
                </li>
                <li>
                  <strong>Shopping cart:</strong> Remember the tickets or reservations
                  you have selected during the purchase process.
                </li>
                <li>
                  <strong>Basic preferences:</strong> Store settings such as preferred language
                  or time zone.
                </li>
                <li>
                  <strong>Cookie consent:</strong> Store your preferences about
                  cookie usage so we don't ask you repeatedly.
                </li>
              </ul>

              <h3>3.2 Analytics Cookies</h3>
              <p>
                We use analytics tools to better understand how users
                use Pull. This allows us to identify issues, optimize the experience,
                and develop new features.
              </p>
              <ul className="detailed-list">
                <li>
                  <strong>Google Analytics 4:</strong> Collects aggregated and anonymized data
                  about site traffic, most visited pages, time on site,
                  and visitor origin.
                </li>
                <li>
                  <strong>Performance metrics:</strong> We measure load times and errors
                  to ensure the platform works optimally.
                </li>
              </ul>
              <div className="info-box warning">
                <strong>Important:</strong> Analytics cookies are only activated if you
                give us your explicit consent. You can change your decision at any time
                from the cookie settings panel.
              </div>

              <h3>3.3 Marketing Cookies (Future)</h3>
              <p>
                In the future, we may use marketing cookies to offer you more
                relevant advertising. These cookies allow:
              </p>
              <ul className="detailed-list">
                <li>
                  <strong>Remarketing:</strong> Show you Pull ads on other platforms
                  (Meta, TikTok, Google) based on your previous activity.
                </li>
                <li>
                  <strong>Campaign measurement:</strong> Evaluate the effectiveness of our
                  advertising campaigns.
                </li>
                <li>
                  <strong>Personalization:</strong> Adapt promotional content to your
                  interests.
                </li>
              </ul>
              <div className="info-box warning">
                <strong>Important:</strong> Marketing cookies will only be installed if
                you give your explicit consent. They will never be activated automatically.
              </div>
            </div>
          </section>

          {/* Section 4: Cookie Table */}
          <section id="table" className="policy-section">
            <div className="section-header">
              <Cookie size={24} />
              <h2>4. Cookie table</h2>
            </div>
            <div className="section-content">
              <p>
                Below, we detail the specific cookies we use at Pull:
              </p>

              <div className="cookie-table-wrapper">
                <table className="cookie-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Provider</th>
                      <th>Purpose</th>
                      <th>Duration</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Necessary Cookies */}
                    <tr className="category-header">
                      <td colSpan={5}><Shield size={16} /> Necessary Cookies</td>
                    </tr>
                    <tr>
                      <td><code>pull_session</code></td>
                      <td>Pull</td>
                      <td>Maintains the authenticated user session</td>
                      <td>30 days</td>
                      <td><span className="badge necessary">Necessary</span></td>
                    </tr>
                    <tr>
                      <td><code>pull_staff_session</code></td>
                      <td>Pull</td>
                      <td>Session for venue staff</td>
                      <td>8 hours</td>
                      <td><span className="badge necessary">Necessary</span></td>
                    </tr>
                    <tr>
                      <td><code>pull_cookie_consent</code></td>
                      <td>Pull</td>
                      <td>Stores your cookie preferences</td>
                      <td>1 year</td>
                      <td><span className="badge necessary">Necessary</span></td>
                    </tr>
                    <tr>
                      <td><code>pull_cart</code></td>
                      <td>Pull</td>
                      <td>Temporarily stores the shopping cart</td>
                      <td>Session</td>
                      <td><span className="badge necessary">Necessary</span></td>
                    </tr>

                    {/* Analytics Cookies */}
                    <tr className="category-header">
                      <td colSpan={5}><BarChart3 size={16} /> Analytics Cookies</td>
                    </tr>
                    <tr>
                      <td><code>_ga</code></td>
                      <td>Google</td>
                      <td>Distinguishes unique users in Google Analytics</td>
                      <td>2 years</td>
                      <td><span className="badge analytics">Analytics</span></td>
                    </tr>
                    <tr>
                      <td><code>_ga_*</code></td>
                      <td>Google</td>
                      <td>Maintains session state in GA4</td>
                      <td>2 years</td>
                      <td><span className="badge analytics">Analytics</span></td>
                    </tr>
                    <tr>
                      <td><code>_gid</code></td>
                      <td>Google</td>
                      <td>Distinguishes users for 24 hours</td>
                      <td>24 hours</td>
                      <td><span className="badge analytics">Analytics</span></td>
                    </tr>

                    {/* Marketing Cookies */}
                    <tr className="category-header">
                      <td colSpan={5}><Target size={16} /> Marketing Cookies (future)</td>
                    </tr>
                    <tr>
                      <td><code>_fbp</code></td>
                      <td>Meta</td>
                      <td>Facebook/Instagram conversion tracking</td>
                      <td>3 months</td>
                      <td><span className="badge marketing">Marketing</span></td>
                    </tr>
                    <tr>
                      <td><code>_ttp</code></td>
                      <td>TikTok</td>
                      <td>TikTok conversion tracking</td>
                      <td>13 months</td>
                      <td><span className="badge marketing">Marketing</span></td>
                    </tr>
                    <tr>
                      <td><code>_gcl_au</code></td>
                      <td>Google</td>
                      <td>Google Ads conversion tracking</td>
                      <td>3 months</td>
                      <td><span className="badge marketing">Marketing</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="table-note">
                <em>
                  Note: This table may be updated periodically. Analytics
                  and marketing cookies are only installed if you have given your consent.
                </em>
              </p>
            </div>
          </section>

          {/* Section 5: Legal Basis */}
          <section id="legal-basis" className="policy-section">
            <div className="section-header">
              <Shield size={24} />
              <h2>5. Legal basis for cookie usage</h2>
            </div>
            <div className="section-content">
              <p>
                The use of cookies at Pull is based on the following legal grounds:
              </p>

              <div className="legal-basis-grid">
                <div className="legal-basis-card">
                  <h4>Necessary Cookies</h4>
                  <p><strong>Legal basis:</strong> Legitimate interest and contract execution</p>
                  <p>
                    These cookies are essential to provide you with the service you have
                    requested (ticket purchase, reservations, account access).
                    Without them, we couldn't operate the platform securely.
                  </p>
                </div>

                <div className="legal-basis-card">
                  <h4>Analytics Cookies</h4>
                  <p><strong>Legal basis:</strong> Explicit consent</p>
                  <p>
                    We only collect analytical data if you explicitly authorize us.
                    You can withdraw your consent at any time without this
                    affecting the lawfulness of prior processing.
                  </p>
                </div>

                <div className="legal-basis-card">
                  <h4>Marketing Cookies</h4>
                  <p><strong>Legal basis:</strong> Explicit consent</p>
                  <p>
                    Personalized advertising requires your prior authorization.
                    We will never install these cookies without your permission and you can
                    disable them whenever you wish.
                  </p>
                </div>
              </div>

              <div className="info-box">
                <strong>Applicable regulatory framework:</strong>
                <ul>
                  <li>Guatemala's Law on Access to Public Information (Decree 57-2008)</li>
                  <li>Internationally recognized personal data protection principles</li>
                  <li>Best practices inspired by the European Union's General Data Protection Regulation (GDPR)</li>
                  <li>European Union ePrivacy Directive (for future expansion)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 6: How to configure */}
          <section id="configure" className="policy-section">
            <div className="section-header">
              <Settings size={24} />
              <h2>6. How to configure or reject cookies</h2>
            </div>
            <div className="section-content">
              <h3>6.1 Through our preferences panel</h3>
              <p>
                The easiest way to manage your cookie preferences is through
                our settings panel:
              </p>

              <div className="cookie-settings-action">
                <CookieSettingsButton />
              </div>

              <p>
                In the panel, you can enable or disable analytics and marketing cookies
                independently. Necessary cookies cannot be disabled because
                they are essential for the site to function.
              </p>

              <h3>6.2 Through your browser</h3>
              <p>
                You can also manage cookies directly from your browser settings.
                Please note that blocking all cookies may affect
                how Pull and other websites function.
              </p>

              <div className="browser-links">
                <h4>Browser settings links:</h4>
                <ul>
                  <li>
                    <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
                      Google Chrome
                    </a>
                  </li>
                  <li>
                    <a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer">
                      Mozilla Firefox
                    </a>
                  </li>
                  <li>
                    <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer">
                      Safari
                    </a>
                  </li>
                  <li>
                    <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">
                      Microsoft Edge
                    </a>
                  </li>
                </ul>
              </div>

              <h3>6.3 Third-party tools</h3>
              <p>
                For third-party cookies (such as Google Analytics), you can also use
                specific tools:
              </p>
              <ul>
                <li>
                  <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
                    Google Analytics opt-out browser add-on
                  </a>
                </li>
                <li>
                  <a href="https://www.youronlinechoices.com/" target="_blank" rel="noopener noreferrer">
                    Your Online Choices (interest-based advertising)
                  </a>
                </li>
              </ul>

              <div className="info-box">
                <strong>Remember:</strong> You can change your cookie preferences at
                any time. Your decision will be respected immediately and we will remember it
                for future visits.
              </div>
            </div>
          </section>

          {/* Section 7: Contact */}
          <section id="contact" className="policy-section">
            <div className="section-header">
              <Mail size={24} />
              <h2>7. Contact for privacy matters</h2>
            </div>
            <div className="section-content">
              <p>
                If you have questions about our cookie policy or wish to exercise
                your data protection rights, you can contact us:
              </p>

              <div className="contact-info-card">
                <div className="contact-item">
                  <Building2 size={20} />
                  <div>
                    <strong>Data controller</strong>
                    <span>Pull Capital S.A.</span>
                  </div>
                </div>
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
                    <span>4ta avenida 41-25 zona 12, Monte Maria 3</span>
                    <span>Guatemala, Guatemala</span>
                  </div>
                </div>
                <div className="contact-item">
                  <Shield size={20} />
                  <div>
                    <strong>Tax ID</strong>
                    <span>120513684</span>
                  </div>
                </div>
              </div>

              <div className="registration-notice">
                <strong>Commercial Registry registration data:</strong>
                <p>[To be completed once available]</p>
              </div>

              <h3>Your rights</h3>
              <p>Regarding your personal data, you have the right to:</p>
              <ul>
                <li>Access the data we hold about you</li>
                <li>Request rectification of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to the processing of your data</li>
                <li>Request portability of your data</li>
                <li>Withdraw your consent at any time</li>
              </ul>
              <p>
                To exercise any of these rights, send us an email to{' '}
                <a href="mailto:info@pullgt.com">info@pullgt.com</a> clearly indicating
                your request.
              </p>
            </div>
          </section>

          {/* Footer Notice */}
          <div className="policy-footer-notice">
            <p>
              This cookie policy was last updated in <strong>December 2024</strong>.
              We reserve the right to modify it to adapt to legislative changes or
              new platform features. We will notify you of any relevant changes
              through the website.
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
