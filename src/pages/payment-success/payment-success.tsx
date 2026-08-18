// pages/payment-success-page.tsx
// SECURITY: Strict UUID validation and sanitization to prevent XSS/IDOR attacks
//
// NeoNet/Cybersource (18-ago-2026): aquí se aterriza DESPUÉS de que el backend
// haya cobrado o retenido en POST /orders/pay, así que el estado real ya está
// escrito. Los dos finales legítimos son:
//
//   PÚBLICO   `confirmed`          → cobrado, entradas emitidas.
//   PRIVADO   `payment_authorized` → importe RETENIDO, sin cobrar, esperando
//                                    la decisión del local. NO es "pagado" y
//                                    esta página no debe decir que lo está.
//
// **Aterrizar aquí NO significa por sí solo que haya pago**: se lee el estado
// real y cada uno tiene su mensaje. Se reintenta unas cuantas veces porque la
// escritura del estado puede ir un pelo por detrás de la respuesta del cobro
// (y porque las órdenes viejas de dLocal sí se confirmaban por webhook).
//
// Estados HISTÓRICOS de dLocal (`awaiting_approval`, `approved_unpaid`) siguen
// contemplados: hay órdenes reales con ellos y NO han pagado nada.
import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/layout/layout';
import { CheckCircle, Clock, ArrowRight, Copy, Check, AlertCircle, Home, Loader } from 'lucide-react';
import { getOrderDetails } from '../../controller/purchase-pages-controller';
import { classifyOrderStatus, type OrderStage } from '../../utils/orderStatus';
import './payment-success.css';

// SECURITY: Strict UUID v4 validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * SECURITY: Validates and sanitizes an order ID parameter
 * - Only accepts valid UUID v4 format
 * - Returns null for any invalid input (prevents XSS/injection)
 * - UUIDs have 122 bits of entropy (prevents IDOR enumeration)
 */
const validateOrderId = (rawInput: string | null): string | null => {
  if (!rawInput) return null;

  // Trim and lowercase for consistent validation
  const sanitized = rawInput.trim().toLowerCase();

  // Strict UUID v4 format check
  if (!UUID_REGEX.test(sanitized)) {
    console.warn('SECURITY: Invalid order_id format rejected');
    return null;
  }

  return sanitized;
};

// 10 intentos cada 3 s ≈ 30 s. Con el cobro síncrono de NeoNet basta y sobra;
// el margen es para las órdenes viejas de dLocal, que se confirmaban por
// webhook. Más tiempo sería dejar al comprador mirando un spinner eterno.
const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 10;

export const PaymentSuccessPage = () => {
  const { t, i18n } = useTranslation('payment');
  const { lang } = useParams<{ lang: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentLang = lang || i18n.language || 'es';
  const buildUrl = (path: string) => `/${currentLang}${path}`;

  // SECURITY: Validate and sanitize order_id immediately
  const orderId = useMemo(() => {
    return validateOrderId(searchParams.get('order_id'));
  }, [searchParams]);

  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  // true cuando se agotaron los reintentos y la orden sigue sin confirmar:
  // no es un error, pero hay que decirle al comprador que NO vuelva a pagar.
  const [waitTimedOut, setWaitTimedOut] = useState(false);
  const attemptsRef = useRef(0);

  useEffect(() => {
    // SECURITY: Only make API call with validated UUID
    if (!orderId) {
      setLoading(false);
      return;
    }

    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = () => {
      // SECURITY: orderId is already validated as UUID, safe to use in URL
      getOrderDetails(orderId)
        .then((data) => {
          if (!alive) return;
          setOrderData(data);
          setLoading(false);

          // Mientras la orden siga sin resolverse (ni cobrada, ni retenida, ni
          // muerta) se vuelve a preguntar: `payment_authorized` cuenta como
          // resuelta, es el final legítimo del flujo privado.
          const stage = classifyOrderStatus(data?.order?.status);
          const settled = stage !== 'processing' && stage !== 'payable';
          if (settled) return;

          attemptsRef.current += 1;
          if (attemptsRef.current >= POLL_MAX_ATTEMPTS) {
            setWaitTimedOut(true);
            return;
          }
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        })
        .catch(() => {
          if (alive) setLoading(false);
        });
    };

    poll();

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [orderId]);

  const handleCopyReference = () => {
    // SECURITY: Prefer server-provided order_number, fallback to validated UUID prefix
    const reference = orderData?.order?.order_number || (orderId ? orderId.slice(0, 8).toUpperCase() : '');
    if (reference) {
      navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="payment-success-wrapper">
          <div className="payment-success-loading">
            <div className="payment-success-spinner"></div>
            <p>{t('loading.order')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  // SECURITY: Show error for missing or invalid order_id
  if (!orderId) {
    return (
      <Layout>
        <div className="payment-success-wrapper">
          <div className="payment-error-bg-overlay" />
          <div className="payment-success-content">
            <div className="payment-success-container">
              <div className="payment-error-card">
                <div className="payment-error-icon-wrapper">
                  <AlertCircle className="payment-error-icon" />
                </div>
                <h1 className="payment-error-title">{t('error.orderNotFound')}</h1>
                <p className="payment-error-description">
                  {t('error.orderNotFoundDesc')}
                </p>
                <button onClick={() => navigate(buildUrl('/'))} className="payment-success-button payment-success-button-primary">
                  <Home />
                  {t('error.returnToHome')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // SECURITY: Use only server-provided data for display, with validated orderId as fallback
  const orderNumber = orderData?.order?.order_number;
  const eventImage = orderData?.event?.image;
  const venueSlug = orderData?.event?.venue_slug || orderData?.venue?.slug;

  // SECURITY: Display reference - prefer server data, fallback to validated UUID prefix
  const displayReference = orderNumber || orderId.slice(0, 8).toUpperCase();

  const stage: OrderStage = classifyOrderStatus(orderData?.order?.status);

  // `approved_unpaid` cae en 'payable' (se puede pagar), pero aquí merece su
  // propio mensaje: la solicitud está aprobada y NO se ha pagado. Si el
  // comprador aterriza aquí en ese estado, volvió sin completar el pago.
  const rawStatus = String(orderData?.order?.status || '').toLowerCase();
  const isApprovedUnpaid = rawStatus === 'approved_unpaid';

  // Cada estado dice LA VERDAD sobre si hay dinero cobrado y qué falta.
  const copyFor = (): { title: string; description: string; cardTitle: string; cardBody: string } => {
    if (isApprovedUnpaid) {
      return {
        title: t('success.approvedUnpaid.title'),
        description: t('success.approvedUnpaid.description'),
        cardTitle: t('success.approvedUnpaid.cardTitle'),
        cardBody: t('success.approvedUnpaid.cardBody'),
      };
    }
    switch (stage) {
      case 'confirmed':
        return {
          title: t('success.confirmedTitle'),
          description: t('success.confirmedDescription'),
          cardTitle: t('success.ticketsSentTitle'),
          cardBody: t('success.ticketsSentBody'),
        };
      case 'awaitingApproval':
        return {
          title: t('success.awaiting.title'),
          description: t('success.awaiting.description'),
          cardTitle: t('success.awaiting.cardTitle'),
          cardBody: t('success.awaiting.cardBody'),
        };
      // PRIVADO con retención: hay dinero BLOQUEADO pero no cobrado. El copy
      // de estas claves lo dice explícitamente — no es "¡pagado!".
      case 'authorizedHold':
        return {
          title: t('success.title'),
          description: t('success.description'),
          cardTitle: t('success.pendingApproval'),
          cardBody: t('success.pendingDescription'),
        };
      case 'dead':
        return {
          title: t('success.failed.title'),
          description: t('success.failed.description'),
          cardTitle: t('success.failed.cardTitle'),
          cardBody: t('success.failed.cardBody'),
        };
      // processing | payable | unknown → esperando la confirmación del webhook
      default:
        return {
          title: t('success.confirming.title'),
          description: t('success.confirming.description'),
          cardTitle: t('success.confirming.cardTitle'),
          cardBody: waitTimedOut ? t('success.confirming.slow') : t('success.confirming.cardBody'),
        };
    }
  };

  const current = copyFor();

  const isConfirmed = stage === 'confirmed';
  const isWaiting = !isApprovedUnpaid && (stage === 'processing' || stage === 'payable' || stage === 'unknown');
  const isProblem = stage === 'dead';
  // Flujo privado vigente: importe retenido, pendiente de decisión.
  const isHold = stage === 'authorizedHold';

  const HeaderIcon = isConfirmed ? CheckCircle : isProblem ? AlertCircle : isWaiting ? Loader : Clock;

  return (
    <Layout>
      <div className="payment-success-wrapper">
        {eventImage && (
          <>
            <div
              className="payment-success-bg-blur"
              style={{ backgroundImage: `url(${eventImage})` }}
            />
            <div className="payment-success-bg-overlay-dark" />
          </>
        )}
        {!eventImage && <div className="payment-success-bg-overlay" />}

        <div className="payment-success-content">
          <div className="payment-success-container">
            {/* Header Section */}
            <div className="payment-success-header">
              <div className="payment-success-icon-wrapper">
                <HeaderIcon className="payment-success-icon" />
              </div>
              <h1 className="payment-success-title">{current.title}</h1>
              <div className="payment-success-description">
                <p>{current.description}</p>
              </div>
            </div>

            {/* Two Column Grid */}
            <div className="payment-success-grid">
              {/* Left Column - tarjeta de estado */}
              <div className="payment-success-grid-left">
                <div className="payment-status-card">
                  <div className="payment-status-header">
                    {isConfirmed ? <CheckCircle /> : isProblem ? <AlertCircle /> : <Clock />}
                    <span>{current.cardTitle}</span>
                  </div>
                  <div className="payment-status-body">
                    <p>{current.cardBody}</p>

                    {/* La línea de tiempo solo tiene sentido en los flujos que
                        esperan una decisión o una confirmación. El tercer paso
                        NO es el mismo en los dos: con retención se cobra solo,
                        sin enlace; en el histórico de dLocal el comprador tenía
                        que pagar con un enlace del correo. Poner "enlace de
                        pago" en una retención haría esperar un correo que
                        nunca llega. */}
                    {(isHold || isApprovedUnpaid || stage === 'awaitingApproval') && (
                      <div className="payment-status-timeline">
                        <div className="timeline-step timeline-step-completed">
                          <div className="timeline-dot"></div>
                          <div className="timeline-content">
                            <h4>{t('success.timeline.requestSent')}</h4>
                            <p>{isHold
                              ? t('success.timeline.requestSentHoldDesc')
                              : t('success.timeline.requestSentDesc')}</p>
                          </div>
                        </div>
                        <div className={`timeline-step ${isApprovedUnpaid ? 'timeline-step-completed' : 'timeline-step-current'}`}>
                          <div className="timeline-dot"></div>
                          <div className="timeline-content">
                            <h4>{t('success.timeline.staffReview')}</h4>
                            <p>{t('success.timeline.staffReviewDesc')}</p>
                          </div>
                        </div>
                        <div className={`timeline-step ${isApprovedUnpaid ? 'timeline-step-current' : 'timeline-step-pending'}`}>
                          <div className="timeline-dot"></div>
                          <div className="timeline-content">
                            <h4>{isHold
                              ? t('success.timeline.holdCharge')
                              : t('success.timeline.payLink')}</h4>
                            <p>{isHold
                              ? t('success.timeline.holdChargeDesc')
                              : t('success.timeline.payLinkDesc')}</p>
                          </div>
                        </div>
                        <div className="timeline-step timeline-step-pending">
                          <div className="timeline-dot"></div>
                          <div className="timeline-content">
                            <h4>{t('success.timeline.ticketsSent')}</h4>
                            <p>{t('success.timeline.ticketsSentDesc')}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Order Reference & Important Info */}
              <div className="payment-success-grid-right">
                {/* Order Reference Card */}
                <div className="payment-order-reference">
                  <p className="payment-order-reference-label">{t('success.orderReference')}</p>
                  <div className="payment-order-reference-content">
                    <p className="payment-order-reference-number">
                      {displayReference}
                    </p>
                    <button
                      onClick={handleCopyReference}
                      className={`payment-order-reference-copy ${copied ? 'copied' : ''}`}
                    >
                      {copied ? (
                        <>
                          <Check />
                          {t('success.copied')}
                        </>
                      ) : (
                        <>
                          <Copy />
                          {t('success.copyReference')}
                        </>
                      )}
                    </button>
                  </div>
                  <p className="payment-order-reference-hint">
                    {t('success.referenceHint')}
                  </p>
                </div>

                {/* Important Information */}
                <div className="payment-info-box payment-info-box-blue">
                  <h3>{t('success.importantInfo')}</h3>
                  {isHold ? (
                    <ul>
                      <li dangerouslySetInnerHTML={{ __html: t('success.infoList.authorized') }} />
                      <li>{t('success.infoList.staffReview')}</li>
                      <li>{t('success.infoList.approved')}</li>
                      <li>{t('success.infoList.rejected')}</li>
                      <li>{t('success.infoList.emailUpdates')}</li>
                    </ul>
                  ) : stage === 'awaitingApproval' ? (
                    <ul>
                      <li>{t('success.awaiting.infoNoCharge')}</li>
                      <li>{t('success.infoList.staffReview')}</li>
                      <li>{t('success.awaiting.infoPayLink')}</li>
                      <li>{t('success.awaiting.infoRejected')}</li>
                      <li>{t('success.infoList.emailUpdates')}</li>
                    </ul>
                  ) : isApprovedUnpaid ? (
                    <ul>
                      <li>{t('success.approvedUnpaid.infoNotPaid')}</li>
                      <li>{t('success.approvedUnpaid.infoUseLink')}</li>
                      <li>{t('success.approvedUnpaid.infoDeadline')}</li>
                    </ul>
                  ) : isWaiting ? (
                    <ul>
                      <li>{t('success.confirming.infoWebhook')}</li>
                      <li>{t('success.confirming.infoNoRetry')}</li>
                      <li>{t('success.infoList.emailUpdates')}</li>
                    </ul>
                  ) : isProblem ? (
                    <ul>
                      <li>{t('success.failed.infoNoCharge')}</li>
                      <li>{t('success.failed.infoRetry')}</li>
                    </ul>
                  ) : (
                    <ul>
                      <li>{t('success.ticketsSentBody')}</li>
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="payment-success-actions">
              <button
                onClick={() => navigate(buildUrl(venueSlug ? `/venues/${venueSlug}/events` : '/'))}
                className="payment-success-button payment-success-button-primary"
              >
                {t('success.returnToVenue')}
                <ArrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
