// pre-purchase-page.tsx
// SECURITY: Validate URL parameters to prevent injection
import { useParams, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { Layout } from "../../components/layout/layout";
import "./pre-purchase-page.css";
import { Minus, Plus, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { TicketReceipt } from "../../components/ticket-receipt/ticket-receipt";
import { EventInfoCard } from "../../components/event-info-card/event-info-card";
import type { TicketType, EventDetailedInfo } from "../../types/types";
import { getTicketInfo, getEventDetailedInfo } from "../../controller/purchase-pages-controller";
import { validateSlug, validateBase64Id } from "../../utils/security";
import { useTranslation } from "react-i18next";
import { DEFAULT_VENUE_SLUG } from '../../config/venue';

export const PrePurchasePage = () => {
  const { t, i18n } = useTranslation('tickets');
  const { eventId: rawEventId, ticketTypeId: rawTicketTypeId, lang } = useParams<{ eventId: string; ticketTypeId: string; lang: string }>();
  const currentLang = lang || i18n.language || 'es';
  const buildUrl = (path: string) => `/${currentLang}${path}`;
  const navigate = useNavigate();

  // SECURITY: Validate URL parameters
  const eventId = useMemo(() => validateSlug(rawEventId), [rawEventId]);
  const ticketTypeId = useMemo(() => validateBase64Id(rawTicketTypeId), [rawTicketTypeId]);


  const [loading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const [ticketDetails, setTicketDetails] = useState<TicketType>({} as TicketType);
  const [eventInfo, setEventInfo] = useState<EventDetailedInfo | null>(null);

  useEffect(() => {
    if (!eventId || !ticketTypeId) {
      setError('invalidParams');
      setIsLoading(false);
      return;
    }

    Promise.all([
      getTicketInfo(eventId, ticketTypeId),
      getEventDetailedInfo(eventId)
    ])
      .then(([ticketData, eventData]) => {
        setTicketDetails(ticketData);
        setEventInfo(eventData);
        // Initialize quantity with min_quantity from ticket type
        if (ticketData.min_quantity && ticketData.min_quantity > 1) {
          setQuantity(ticketData.min_quantity);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setError('loadingFailed');
        setIsLoading(false);
      });
  }, [eventId, ticketTypeId]);

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    const minQuantity = ticketDetails.min_quantity || 1;
    const maxQuantity = ticketDetails.max_quantity || Math.min(3, ticketDetails.ticket_quantity || 3);
    if (newQuantity >= minQuantity && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleConfirm = () => {
    navigate(buildUrl(`/event/${eventId}/tickets/${ticketTypeId}/${quantity}`));
  };

  if (loading) {
    return (
      <Layout>
        <div className="pre-purchase-wrapper">
          <div className="pre-purchase-loading">
            <div className="pre-purchase-loading-spinner"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="pre-purchase-wrapper">
          <div className="pre-purchase-error">
            <h2>{t('errors.title')}</h2>
            <p>{t(`errors.${error}`)}</p>
            <button onClick={() => navigate(buildUrl(`/venues/${DEFAULT_VENUE_SLUG}/events`))} className="pre-purchase-error-button">
              {t('errors.backToEvents')}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const minQuantity = ticketDetails.min_quantity || 1;
  const maxQuantity = ticketDetails.max_quantity || Math.min(3, ticketDetails.ticket_quantity || 3);
  const currencySymbol = ticketDetails.currency === 'GTQ' ? 'Q' :
                        ticketDetails.currency === 'USD' ? '$' :
                        ticketDetails.currency === 'EUR' ? '€' :
                        ticketDetails.currency || 'Q';

  return (
    <Layout>
      <div className="pre-purchase-wrapper">
        {eventInfo?.event_img && (
          <>
            <div
              className="pre-purchase-bg-blur"
              style={{ backgroundImage: `url(${eventInfo.event_img})` }}
            />
            <div className="pre-purchase-bg-overlay" />
          </>
        )}

        <div className="pre-purchase-content">
          <div className="pre-purchase-container">
            <EventInfoCard eventInfo={eventInfo} />

            <div className="pre-purchase-grid">
              <div className="pre-purchase-left">
                <div className="pre-purchase-ticket-card">
                  <div className="pre-purchase-ticket-content">
                    <h3 className="pre-purchase-ticket-title">
                      {ticketDetails.ticket_name}
                    </h3>
                    <p className="pre-purchase-ticket-description">
                      {ticketDetails.ticket_description}
                    </p>
                  </div>

                  <div className="pre-purchase-ticket-price">
                    <span className="pre-purchase-price-amount">{currencySymbol}{ticketDetails.ticket_price?.toFixed(2)}</span>
                    <span className="pre-purchase-price-label">{t('purchase.perPerson')}</span>
                  </div>
                </div>

                <div className="pre-purchase-info-widget">
                  <Info size={16} />
                  <p>{t('purchase.groupNote', { min: minQuantity, max: maxQuantity })}</p>
                </div>

                <div className="pre-purchase-quantity-card">
                  <h3 className="pre-purchase-quantity-title">{t('prePurchase.selectQuantity')}</h3>

                  <div className="pre-purchase-quantity-controls">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= minQuantity}
                      className="pre-purchase-quantity-button"
                    >
                      <Minus />
                    </button>

                    <div className="pre-purchase-quantity-display">
                      <div className="pre-purchase-quantity-number">{quantity}</div>
                    </div>

                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity === maxQuantity}
                      className="pre-purchase-quantity-button pre-purchase-quantity-button-plus"
                    >
                      <Plus />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pre-purchase-right">
                <TicketReceipt
                  quantity={quantity}
                  ticketDetails={ticketDetails}
                  onConfirm={handleConfirm}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
