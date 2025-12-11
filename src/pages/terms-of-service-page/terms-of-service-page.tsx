import { Footer } from '../../components/footer/footer';
import { Link } from 'react-router-dom';
import { FileText, CreditCard, AlertTriangle, Scale, Ban, RefreshCw, Mail, Building2, ChevronRight, Users, Ticket, Clock, CheckCircle } from 'lucide-react';
import fondoImage from '../../assets/fondo.png';
import '../cookie-policy-page/cookie-policy-page.css';
import { SEO } from '../../components/seo/seo';

export const TermsOfServicePage = () => {
  return (
    <div className="cookie-policy-page">
      <SEO
        title="Términos y Condiciones"
        description="Términos y condiciones de uso de Pull Events. Lee las condiciones para comprar entradas y reservar en eventos en Guatemala."
        keywords="términos y condiciones, términos de servicio, condiciones de uso, pull events, guatemala, entradas"
        canonicalUrl="https://web.pullevents.com/terms"
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
            <FileText size={48} />
          </div>
          <h1>Terms and Conditions</h1>
          <p className="cookie-policy-subtitle">
            Last updated: December 2024
          </p>
        </header>

        {/* Table of Contents */}
        <nav className="cookie-policy-toc">
          <h2>Contents</h2>
          <ul>
            <li><a href="#introduction"><ChevronRight size={16} /> Introduction</a></li>
            <li><a href="#definitions"><ChevronRight size={16} /> Definitions</a></li>
            <li><a href="#account"><ChevronRight size={16} /> User account</a></li>
            <li><a href="#purchases"><ChevronRight size={16} /> Ticket purchases</a></li>
            <li><a href="#reservations"><ChevronRight size={16} /> VIP and group reservations</a></li>
            <li><a href="#payments"><ChevronRight size={16} /> Payments and billing</a></li>
            <li><a href="#cancellations"><ChevronRight size={16} /> Cancellations and refunds</a></li>
            <li><a href="#conduct"><ChevronRight size={16} /> User conduct</a></li>
            <li><a href="#liability"><ChevronRight size={16} /> Limitation of liability</a></li>
            <li><a href="#modifications"><ChevronRight size={16} /> Modifications</a></li>
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
              <FileText size={24} />
              <h2>1. Introduction</h2>
            </div>
            <div className="section-content">
              <p>
                Welcome to Pull. These Terms and Conditions ("Terms") constitute a binding legal
                agreement between you ("User", "you") and Pull Capital S.A. ("Pull", "we",
                "our") that governs the use of our ticket purchasing and reservation platform
                for events.
              </p>
              <p>
                By accessing or using Pull, whether through our web or mobile application, you accept
                these Terms in their entirety. If you do not agree with any part of these
                Terms, you should not use our services.
              </p>
              <div className="info-box">
                <strong>Related documents:</strong>
                <ul>
                  <li><Link to="/privacy">Privacy Policy</Link> - How we handle your data</li>
                  <li><Link to="/cookie-policy">Cookie Policy</Link> - Use of cookies and similar technologies</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2: Definitions */}
          <section id="definitions" className="policy-section">
            <div className="section-header">
              <Scale size={24} />
              <h2>2. Definitions</h2>
            </div>
            <div className="section-content">
              <ul className="detailed-list">
                <li>
                  <strong>"Platform":</strong> The Pull website and mobile applications,
                  including all their features.
                </li>
                <li>
                  <strong>"Event":</strong> Any happening (concert, party, festival,
                  experience) for which tickets can be purchased through Pull.
                </li>
                <li>
                  <strong>"Venue":</strong> The establishment or physical location where an Event takes place.
                </li>
                <li>
                  <strong>"Ticket":</strong> The right of entry to an Event, in digital format,
                  purchased through Pull.
                </li>
                <li>
                  <strong>"VIP Reservation":</strong> A reservation that includes a table, bottle service,
                  and additional benefits at an Event.
                </li>
                <li>
                  <strong>"Group Reservation":</strong> A reservation for groups of people that may
                  optionally include bottle service.
                </li>
                <li>
                  <strong>"Wallet":</strong> The section of the Platform where the User can view
                  their active tickets and purchase history.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3: User Account */}
          <section id="account" className="policy-section">
            <div className="section-header">
              <Users size={24} />
              <h2>3. User account</h2>
            </div>
            <div className="section-content">
              <h3>3.1 Registration</h3>
              <p>
                To use certain features of Pull, you may create an account by providing
                accurate and up-to-date information. You are responsible for maintaining the confidentiality
                of your login credentials.
              </p>

              <h3>3.2 Age requirements</h3>
              <p>
                You must be at least 18 years old to create an account on Pull. Some events
                may have additional age restrictions established by the Venue or organizer.
              </p>

              <h3>3.3 Account security</h3>
              <ul>
                <li>You are responsible for all activities performed from your account</li>
                <li>You must notify us immediately if you detect unauthorized use</li>
                <li>You must not share your login credentials with third parties</li>
              </ul>

              <h3>3.4 Suspension or termination</h3>
              <p>
                We reserve the right to suspend or cancel your account if:
              </p>
              <ul>
                <li>You provide false or misleading information</li>
                <li>You violate these Terms or Venue policies</li>
                <li>You use the Platform for fraudulent activities</li>
                <li>Your conduct negatively affects other users or Pull</li>
              </ul>
            </div>
          </section>

          {/* Section 4: Ticket Purchases */}
          <section id="purchases" className="policy-section">
            <div className="section-header">
              <Ticket size={24} />
              <h2>4. Ticket purchases</h2>
            </div>
            <div className="section-content">
              <h3>4.1 Purchase process</h3>
              <div className="cookie-types-grid">
                <div className="cookie-type-card necessary">
                  <div className="cookie-type-icon">
                    <CheckCircle size={32} />
                  </div>
                  <h3>Selection</h3>
                  <p>
                    Select the event, ticket type, and quantity. Review the details
                    before proceeding to payment.
                  </p>
                </div>

                <div className="cookie-type-card analytics">
                  <div className="cookie-type-icon">
                    <CreditCard size={32} />
                  </div>
                  <h3>Payment</h3>
                  <p>
                    Complete payment securely through our gateway (Stripe).
                    We accept credit and debit cards.
                  </p>
                </div>

                <div className="cookie-type-card marketing">
                  <div className="cookie-type-icon">
                    <Ticket size={32} />
                  </div>
                  <h3>Confirmation</h3>
                  <p>
                    You will receive a confirmation email and your tickets will be available
                    in your Wallet.
                  </p>
                </div>
              </div>

              <h3>4.2 Purchase limit</h3>
              <p>
                For individual purchases, the limit is 3 tickets per transaction. For groups
                of 4 or more people, you must use the Group Reservation option.
              </p>

              <h3>4.3 Digital tickets</h3>
              <ul>
                <li>Tickets are digital and displayed in the app with a unique QR code</li>
                <li>The QR code is dynamic and changes periodically for security</li>
                <li>You must present the ticket from your device at the event entrance</li>
                <li>Each ticket is for single use and is invalidated after scanning</li>
              </ul>

              <div className="info-box warning">
                <strong>Important:</strong> Pull acts as an intermediary between the User and the
                Venue/organizer. Tickets are subject to availability and to the specific
                conditions of each event.
              </div>
            </div>
          </section>

          {/* Section 5: VIP and Group Reservations */}
          <section id="reservations" className="policy-section">
            <div className="section-header">
              <Users size={24} />
              <h2>5. VIP and group reservations</h2>
            </div>
            <div className="section-content">
              <h3>5.1 VIP Reservations</h3>
              <p>
                VIP reservations include a reserved table, bottle service, and additional
                benefits depending on the event. The process includes:
              </p>
              <ul>
                <li>Selection of zone/table and bottle configuration</li>
                <li>Initial payment or deposit according to event conditions</li>
                <li>Confirmation pending Venue approval</li>
                <li>Guest management through shared payment link</li>
              </ul>

              <h3>5.2 Group reservations</h3>
              <p>
                For groups of 4 to 30 people, with the option to include bottle service:
              </p>
              <ul>
                <li>The organizer creates the reservation and invites participants</li>
                <li>Each participant can pay their share individually</li>
                <li>The reservation is confirmed when the Venue approves and required payments are completed</li>
              </ul>

              <h3>5.3 Special conditions</h3>
              <ul className="detailed-list">
                <li>
                  <strong>Venue approval:</strong> VIP and group reservations require
                  Venue approval before being confirmed.
                </li>
                <li>
                  <strong>Minimum spend:</strong> Some reservations may require a
                  minimum spend on bottles or drinks.
                </li>
                <li>
                  <strong>Organizer responsibility:</strong> The organizer is responsible
                  for coordinating with guests and meeting requirements.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 6: Payments */}
          <section id="payments" className="policy-section">
            <div className="section-header">
              <CreditCard size={24} />
              <h2>6. Payments and billing</h2>
            </div>
            <div className="section-content">
              <h3>6.1 Prices</h3>
              <p>
                Prices displayed on Pull include applicable taxes and service fees,
                unless otherwise indicated. Prices may vary depending on ticket type
                and purchase date.
              </p>

              <h3>6.2 Payment methods</h3>
              <p>
                We accept credit and debit cards through Stripe. Payment processing
                complies with PCI-DSS security standards.
              </p>

              <h3>6.3 Currency</h3>
              <p>
                All prices are expressed in Guatemalan Quetzales (GTQ), unless
                another currency is indicated.
              </p>

              <h3>6.4 Invoicing</h3>
              <p>
                If you require a tax invoice, contact us at{' '}
                <a href="mailto:info@pullgt.com">info@pullgt.com</a> with your purchase details.
              </p>
            </div>
          </section>

          {/* Section 7: Cancellations and Refunds */}
          <section id="cancellations" className="policy-section">
            <div className="section-header">
              <RefreshCw size={24} />
              <h2>7. Cancellations and refunds</h2>
            </div>
            <div className="section-content">
              <div className="info-box warning">
                <strong>General policy:</strong> Ticket purchases are final and non-refundable,
                except in the specific cases described below.
              </div>

              <h3>7.1 Event cancellation</h3>
              <p>
                If an event is canceled by the organizer or Venue, you are entitled to a full
                refund of the ticket value. The refund will be processed automatically to the original
                payment method within 5-10 business days.
              </p>

              <h3>7.2 Date change</h3>
              <p>
                If an event changes its date, your tickets will be valid for the new date. If you
                cannot attend on the new date, you can request a refund within 7 days
                following the change announcement.
              </p>

              <h3>7.3 VIP and group reservations</h3>
              <ul>
                <li>Cancellations more than 72 hours in advance: 80% refund</li>
                <li>Cancellations 24-72 hours in advance: 50% refund</li>
                <li>Cancellations less than 24 hours: no refund</li>
              </ul>

              <h3>7.4 Exclusions</h3>
              <p>Refunds are not granted in the following cases:</p>
              <ul>
                <li>Change of plans by the User</li>
                <li>Failure to attend the event</li>
                <li>Denial of entry for non-compliance with Venue rules</li>
                <li>Errors in ticket selection by the User</li>
              </ul>
            </div>
          </section>

          {/* Section 8: User Conduct */}
          <section id="conduct" className="policy-section">
            <div className="section-header">
              <Ban size={24} />
              <h2>8. User conduct</h2>
            </div>
            <div className="section-content">
              <h3>8.1 Acceptable use</h3>
              <p>By using Pull, you agree to:</p>
              <ul>
                <li>Provide accurate and up-to-date information</li>
                <li>Not use the Platform for illegal purposes</li>
                <li>Not attempt to circumvent security measures</li>
                <li>Not resell tickets at prices higher than original</li>
                <li>Respect the rules and policies of Venues</li>
              </ul>

              <h3>8.2 Prohibitions</h3>
              <p>The following is strictly prohibited:</p>
              <ul className="detailed-list">
                <li>
                  <strong>Fraud:</strong> Using stolen credit cards or making
                  fraudulent chargebacks.
                </li>
                <li>
                  <strong>Counterfeiting:</strong> Attempting to duplicate, counterfeit, or manipulate tickets.
                </li>
                <li>
                  <strong>Abuse:</strong> Creating multiple accounts to evade purchase limits.
                </li>
                <li>
                  <strong>Interference:</strong> Attempting to interfere with the operation of
                  the Platform.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 9: Limitation of Liability */}
          <section id="liability" className="policy-section">
            <div className="section-header">
              <AlertTriangle size={24} />
              <h2>9. Limitation of liability</h2>
            </div>
            <div className="section-content">
              <h3>9.1 Role of Pull</h3>
              <p>
                Pull acts as an intermediary platform between Users and Venues/organizers.
                We are not responsible for:
              </p>
              <ul>
                <li>The quality, safety, or development of events</li>
                <li>Changes in programming or artist lineup</li>
                <li>Weather conditions or force majeure</li>
                <li>Incidents occurring during events</li>
              </ul>

              <h3>9.2 Service availability</h3>
              <p>
                We do not guarantee that the Platform will be available uninterruptedly.
                We may perform maintenance that temporarily limits access.
              </p>

              <h3>9.3 Liability limit</h3>
              <p>
                To the maximum extent permitted by law, Pull's liability is limited
                to the amount paid by the User for the ticket or service in question.
              </p>
            </div>
          </section>

          {/* Section 10: Modifications */}
          <section id="modifications" className="policy-section">
            <div className="section-header">
              <Clock size={24} />
              <h2>10. Modifications</h2>
            </div>
            <div className="section-content">
              <p>
                We reserve the right to modify these Terms at any time.
                Modifications will take effect when published on the Platform.
              </p>
              <p>
                We recommend reviewing this page periodically. Continued use of the
                Platform after any modification constitutes your acceptance of the
                new Terms.
              </p>
              <p>
                For significant changes, we will notify you by email or through
                a prominent notice on the Platform.
              </p>
            </div>
          </section>

          {/* Section 11: Contact */}
          <section id="contact" className="policy-section">
            <div className="section-header">
              <Mail size={24} />
              <h2>11. Contact</h2>
            </div>
            <div className="section-content">
              <p>
                For any questions or concerns about these Terms:
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

              <div className="info-box">
                <strong>Applicable law:</strong> These Terms are governed by the laws of the
                Republic of Guatemala. Any dispute shall be submitted to the jurisdiction
                of the competent courts of Guatemala City.
              </div>
            </div>
          </section>

          {/* Footer Notice */}
          <div className="policy-footer-notice">
            <p>
              These Terms and Conditions were last updated in <strong>December 2024</strong>.
              By using Pull, you confirm that you have read, understood, and accepted these Terms.
            </p>
            <Link to="/" className="back-home-link">
              Back to home page
            </Link>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};
