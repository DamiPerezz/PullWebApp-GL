// pages/post-payment/post-payment.tsx
// SECURITY: Strict parameter validation to prevent XSS/IDOR attacks
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Layout } from "../../components/layout/layout";
import "./post-payment.css";
import { useEffect, useState, useMemo } from "react";
import { getTicketsByOrderId } from "../../controller/post-purchase-controller";
import { getEventDetailedInfo } from "../../controller/purchase-pages-controller";
import type { PurchasedTicketInfo, EventDetailedInfo } from "../../types/types";
import { CheckCircle, Download, ChevronLeft, Loader } from "lucide-react";
import { TicketCard } from "../../components/ticket-card/ticket-card";
import { validateUUID, validateSlug } from "../../utils/security";

export const PostPaymentPage = () => {
  const { t, i18n } = useTranslation('payment');
  const { lang, orderId: rawOrderId, eventSlug: rawEventSlug } = useParams<{ lang: string; orderId: string; eventSlug: string }>();
  const navigate = useNavigate();

  const currentLang = lang || i18n.language || 'es';
  const buildUrl = (path: string) => `/${currentLang}${path}`;

  // SECURITY: Validate and sanitize URL parameters
  const validatedOrderId = useMemo(() => validateUUID(rawOrderId), [rawOrderId]);
  const validatedEventSlug = useMemo(() => validateSlug(rawEventSlug), [rawEventSlug]);

  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<PurchasedTicketInfo[]>([]);
  const [eventInfo, setEventInfo] = useState<EventDetailedInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // SECURITY: Only proceed with validated parameters
    if (!validatedOrderId) {
      setError(t('postPayment.invalidOrderReference'));
      setLoading(false);
      return;
    }

    // SECURITY: Use validated orderId for API call
    getTicketsByOrderId(validatedOrderId)
      .then((ticketsData) => {
        if (ticketsData?.tickets) {
          setTickets(ticketsData.tickets);
        }

        // SECURITY: Use validated eventSlug for API call
        if (validatedEventSlug) {
          return getEventDetailedInfo(validatedEventSlug);
        }
        return null;
      })
      .then((eventData) => {
        if (eventData) {
          setEventInfo(eventData);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(t('postPayment.failedToLoad'));
        setLoading(false);
      });
  }, [validatedOrderId, validatedEventSlug, t]);

  const handleBack = () => {
    navigate(buildUrl('/'));
  };

  const handleDownloadAll = () => {
    // TODO: Implement download all tickets functionality
  };

  if (loading) {
    return (
      <Layout>
        <div className="post-payment-wrapper">
          <div className="post-payment-bg-gradient" />
          <div className="post-payment-loading">
            <div className="post-payment-loading-card">
              <div className="post-payment-loading-spinner-wrapper">
                <Loader className="post-payment-loading-spinner" />
              </div>
              <h2 className="post-payment-loading-title">{t('postPayment.loadingTickets')}</h2>
              <p className="post-payment-loading-text">{t('postPayment.pleaseWait')}</p>
              <div className="post-payment-loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="post-payment-wrapper">
          <div className="post-payment-bg-gradient" />
          <div className="post-payment-content">
            <div className="post-payment-container">
              <button onClick={handleBack} className="post-payment-back-button">
                <ChevronLeft />
                {t('postPayment.backToHome')}
              </button>
              <div className="post-payment-error">
                <p className="post-payment-error-text">{error}</p>
                <button onClick={handleBack} className="post-payment-button">
                  {t('postPayment.returnToHome')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="post-payment-wrapper">
        {eventInfo?.event_img ? (
          <>
            <div 
              className="post-payment-bg-blur"
              style={{ backgroundImage: `url(${eventInfo.event_img})` }}
            />
            <div className="post-payment-bg-overlay" />
          </>
        ) : (
          <div className="post-payment-bg-gradient" />
        )}

        <div className="post-payment-content">
          <div className="post-payment-container">
            <button onClick={handleBack} className="post-payment-back-button">
              <ChevronLeft />
              {t('postPayment.backToHome')}
            </button>

            <div className="post-payment-success-banner">
              <div className="post-payment-success-icon">
                <CheckCircle />
              </div>
              <div className="post-payment-success-content">
                <h1 className="post-payment-success-title">{t('postPayment.paymentSuccessful')}</h1>
                <p className="post-payment-success-message">
                  {t('postPayment.ticketsSentEmail')}
                </p>
              </div>
              <button onClick={handleDownloadAll} className="post-payment-download-button">
                <Download />
                {t('postPayment.downloadAll')}
              </button>
            </div>

            <div className="post-payment-tickets-section">
              <div className="post-payment-tickets-header">
                <h2 className="post-payment-tickets-title">{t('postPayment.yourTickets')}</h2>
                <span className="post-payment-tickets-count">
                  {tickets.length} {tickets.length === 1 ? t('postPayment.ticket') : t('postPayment.tickets')}
                </span>
              </div>

              {tickets.length > 0 ? (
                <div className="post-payment-tickets-grid">
                  {tickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))}
                </div>
              ) : (
                <div className="post-payment-no-tickets">
                  <p>{t('postPayment.noTicketsFound')}</p>
                </div>
              )}
            </div>

            <div className="post-payment-instructions">
              <h3 className="post-payment-instructions-title">{t('postPayment.nextSteps')}</h3>
              <ul className="post-payment-instructions-list">
                <li>{t('postPayment.ticketsSentToEmail')}</li>
                <li>{t('postPayment.presentQRCode')}</li>
                <li>{t('postPayment.singleUseOnly')}</li>
                <li>{t('postPayment.arriveEarly')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};