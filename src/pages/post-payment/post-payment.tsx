import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "../../components/layout/layout";
import "./post-payment.css";
import { QrCard } from "../../components/qr-card/qr-card";
import { useEffect, useState } from "react";
import type { PurchasedTicketInfo } from "../../types/types";
import { getTicketsByOrderId } from "../../controller/post-purchase-controller";
import { getEventDetailedInfo } from "../../controller/purchase-pages-controller";
import { CheckCircle, Download, ChevronLeft, Loader } from "lucide-react";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import html2canvas from "html2canvas";

interface EventInfo {
  event_name: string;
  event_img: string;
  date: string;
  open_time: string;
  close_time: string;
  location: string;
}

/**
 * Acortar el order ID
 */
const shortenOrderId = (orderId: string): string => {
  if (orderId.length <= 16) return orderId;
  return `${orderId.slice(0, 8)}...${orderId.slice(-8)}`;
};

/**
 * Obtener el nombre completo del titular
 */
const getOwnerFullName = (ticket: any): string => {
  if (ticket.owner_full_name) return ticket.owner_full_name;
  if (ticket.public_users) {
    const name = ticket.public_users.name || '';
    const surname = ticket.public_users.surname || '';
    return `${name} ${surname}`.trim() || 'Unknown';
  }
  return 'Unknown';
};

/**
 * Obtener el email del titular
 */
const getOwnerEmail = (ticket: any): string => {
  if (ticket.owner_email) return ticket.owner_email;
  if (ticket.public_users?.email) return ticket.public_users.email;
  return 'No email';
};

/**
 * Obtener el tipo de ticket
 */
const getTicketType = (ticket: any): string => {
  if (ticket.ticket_type) return ticket.ticket_type;
  if (ticket.ticket_types?.name) return ticket.ticket_types.name;
  return 'General Admission';
};

/**
 * Normalizar ticket para asegurar que tiene todos los campos
 */
const normalizeTicket = (ticket: any, eventInfo: EventInfo | null): PurchasedTicketInfo => {
  return {
    qr_token: ticket.qr_token,
    owner_full_name: getOwnerFullName(ticket),
    owner_email: getOwnerEmail(ticket),
    event_name: ticket.event_name || eventInfo?.event_name || 'Event',
    event_date: ticket.event_date || eventInfo?.date || '',
    start_time: ticket.start_time || eventInfo?.open_time || '',
    location: ticket.location || eventInfo?.location || '',
    ticket_type: getTicketType(ticket),
    benefits: ticket.benefits || ticket.ticket_types?.benefits || '',
    public_users: ticket.public_users,
    ticket_types: ticket.ticket_types,
    orders: ticket.orders,
  };
};

export function PostPaymentPage() {
  // ✅ CAMBIO: Cambiado eventId a eventSlug
  const { orderId, eventSlug } = useParams<{ orderId: string; eventSlug: string }>();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<PurchasedTicketInfo[]>([]);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);

  useEffect(() => {
    // ✅ CAMBIO: Usar eventSlug en lugar de eventId
    if (!eventSlug || !orderId) {
      setError("Incomplete order information");
      setLoading(false);
      return;
    }

    console.log('🔍 Loading post-payment data:', { eventSlug, orderId });

    // ✅ CAMBIO: Usar eventSlug en ambas llamadas
    Promise.all([
      getEventDetailedInfo(eventSlug),
      getTicketsByOrderId(orderId, eventSlug)
    ])
      .then(([eventData, ticketsData]) => {
        console.log('✅ Event data loaded:', eventData);
        console.log('✅ Tickets data loaded:', ticketsData);
        
        if (eventData) {
          setEventInfo(eventData);
        }
        
        // ✅ DEDUPLICAR tickets por qr_token único
        const uniqueTicketsMap = new Map<string, any>();
        
        ticketsData.tickets.forEach((ticket: any) => {
          if (!uniqueTicketsMap.has(ticket.qr_token)) {
            uniqueTicketsMap.set(ticket.qr_token, ticket);
          }
        });
        
        const uniqueTickets = Array.from(uniqueTicketsMap.values());
        console.log(`📊 Tickets: ${ticketsData.tickets.length} received, ${uniqueTickets.length} unique`);
        
        // Normalizar tickets
        const normalizedTickets = uniqueTickets.map(t => normalizeTicket(t, eventData));
        
        setTickets(normalizedTickets);
        setLoading(false);
      })
      .catch((error) => {
        console.error("❌ Error fetching data:", error);
        setError("Error loading tickets");
        setLoading(false);
      });
  }, [orderId, eventSlug]); // ✅ CAMBIO: Actualizada la dependencia

  /**
   * Genera un PDF individual para un ticket
   */
  const generateSingleTicketPDF = async (ticket: PurchasedTicketInfo) => {
    try {
      setIsGeneratingPDF(true);

      const shortOrderId = shortenOrderId(orderId || '');

      // 1. Generar QR como base64
      const qrDataUrl = await QRCode.toDataURL(ticket.qr_token, {
        errorCorrectionLevel: "H",
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        scale: 8,
      });

      // 2. Crear contenedor temporal
      const wrapper = document.createElement("div");
      wrapper.style.width = "800px";
      wrapper.style.minHeight = "1200px";
      wrapper.style.position = "fixed";
      wrapper.style.left = "-9999px";
      wrapper.style.top = "0";
      wrapper.style.zIndex = "99999";
      wrapper.style.background = "#000";
      wrapper.style.padding = "0";
      wrapper.style.margin = "0";
      wrapper.style.display = "block";
      wrapper.style.fontFamily = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial";

      // 3. Crear HTML del ticket con fondo blur
      const eventDate = ticket.event_date 
        ? new Date(ticket.event_date).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "Date TBD";

      wrapper.innerHTML = `
        <div id="ticket-pdf" style="
          width:800px;
          min-height:1200px;
          position:relative;
          color:#fff;
        ">
          ${eventInfo?.event_img ? `
            <div style="
              position:absolute;
              inset:0;
              background-image:url('${eventInfo.event_img}');
              background-size:cover;
              background-position:center;
              filter:blur(16px) brightness(0.3);
              transform:scale(1.1);
            "></div>
          ` : `
            <div style="
              position:absolute;
              inset:0;
              background:linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
            "></div>
          `}

          <div style="
            position:absolute;
            inset:0;
            background:radial-gradient(circle at 50% 25%, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.9) 100%);
          "></div>

          <div style="
            position:relative;
            z-index:2;
            display:flex;
            flex-direction:column;
            padding:32px;
            row-gap:24px;
          ">
            <div style="display:flex; flex-direction:column; gap:8px; text-align:left;">
              <div style="display:flex; align-items:center; gap:8px; font-size:13px; color:rgba(255,255,255,0.7);">
                <div style="width:10px; height:10px; border-radius:2px; background:linear-gradient(90deg,#8B5CF6,#D946EF);"></div>
                <div>PULL EVENTS</div>
              </div>
              <div style="font-size:32px; font-weight:600; color:#fff;">
                ${ticket.event_name}
              </div>
              <div style="font-size:15px; color:rgba(255,255,255,0.9);">
                ${eventDate} • ${ticket.start_time?.slice(0, 5) || "TBD"}
              </div>
            </div>

            <div style="align-self:center; background:rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.2); border-radius:16px; padding:24px; display:flex; flex-direction:column; align-items:center; row-gap:16px; max-width:320px; width:100%;">
              <div style="font-size:13px; font-weight:500; color:#fff;">ENTRY QR CODE</div>
              <div style="background:#000; border-radius:12px; padding:16px;">
                <img src="${qrDataUrl}" style="width:220px; height:220px; display:block;" alt="QR" />
              </div>
              <div style="font-size:11px; color:rgba(255,255,255,0.6); text-align:center; max-width:240px;">
                Scan this code at the entrance. Each code is personal and valid once.
              </div>
              <div style="font-size:12px; color:#fff; font-weight:500; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.18); border-radius:8px; padding:6px 10px;">
                ${ticket.owner_full_name} • Valid
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; grid-row-gap:20px; grid-column-gap:16px; background:rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.2); border-radius:16px; padding:24px; max-width:600px; width:100%; margin:0 auto;">
              <div style="display:flex; flex-direction:column;">
                <div style="font-size:12px; color:rgba(255,255,255,0.6); margin-bottom:4px;">Holder Name</div>
                <div style="font-size:15px; color:#fff; font-weight:500;">${ticket.owner_full_name}</div>
              </div>
              <div style="display:flex; flex-direction:column;">
                <div style="font-size:12px; color:rgba(255,255,255,0.6); margin-bottom:4px;">Email</div>
                <div style="font-size:15px; color:#fff; font-weight:500;">${ticket.owner_email}</div>
              </div>
              <div style="display:flex; flex-direction:column;">
                <div style="font-size:12px; color:rgba(255,255,255,0.6); margin-bottom:4px;">Ticket Type</div>
                <div style="font-size:15px; color:#fff; font-weight:500;">${ticket.ticket_type}</div>
              </div>
              <div style="display:flex; flex-direction:column;">
                <div style="font-size:12px; color:rgba(255,255,255,0.6); margin-bottom:4px;">Location</div>
                <div style="font-size:15px; color:#fff; font-weight:500;">${ticket.location || "Venue"}</div>
              </div>
              ${ticket.benefits ? `
                <div style="display:flex; flex-direction:column; grid-column:1 / -1;">
                  <div style="font-size:12px; color:rgba(255,255,255,0.6); margin-bottom:4px;">Benefits</div>
                  <div style="font-size:15px; color:#fff; font-weight:500;">${ticket.benefits}</div>
                </div>
              ` : ''}
              <div style="display:flex; flex-direction:column;">
                <div style="font-size:12px; color:rgba(255,255,255,0.6); margin-bottom:4px;">Order ID</div>
                <div style="font-size:13px; color:#fff; font-weight:500; font-family:monospace;">${shortOrderId}</div>
              </div>
              <div style="display:flex; flex-direction:column;">
                <div style="font-size:12px; color:rgba(255,255,255,0.6); margin-bottom:4px;">Admit One</div>
                <div style="font-size:15px; color:#fff; font-weight:500;">1 Person Only</div>
              </div>
            </div>

            <div style="font-size:11px; color:rgba(255,255,255,0.55); line-height:1.5; text-align:center; max-width:600px; margin:16px auto 0 auto;">
              Please arrive 30 minutes before start to avoid queues. This ticket is non-transferable and non-refundable.
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(wrapper);

      const node = wrapper.querySelector("#ticket-pdf") as HTMLElement;
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#000000",
        allowTaint: true,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "p",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);

      const safeName = ticket.owner_full_name.replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `ticket_${safeName}_${shortOrderId.replace(/\./g, '')}.pdf`;
      pdf.save(filename);

      wrapper.remove();
      setIsGeneratingPDF(false);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Error generating PDF. Please try again.");
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadAll = async () => {
    if (isGeneratingPDF) return;
    setIsGeneratingPDF(true);
    for (const ticket of tickets) {
      await generateSingleTicketPDF(ticket);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    setIsGeneratingPDF(false);
  };

  const handleBack = () => {
    navigate('/venues');
  };

  if (loading) {
    return (
      <Layout>
        <div className="post-payment-wrapper">
          <div className="post-payment-bg-gradient" />
          <div className="post-payment-content">
            <div className="post-payment-loading">
              <div className="post-payment-loading-card">
                <div className="post-payment-loading-spinner-wrapper">
                  <Loader className="post-payment-loading-spinner" />
                </div>
                <h2 className="post-payment-loading-title">Loading your tickets</h2>
                <p className="post-payment-loading-text">Please wait while we retrieve your purchase...</p>
                <div className="post-payment-loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
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
              <div className="post-payment-error">
                <p className="post-payment-error-text">{error}</p>
                <button onClick={handleBack} className="post-payment-button">Back to home</button>
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
            <div className="post-payment-bg-blur" style={{ backgroundImage: `url(${eventInfo.event_img})` }} />
            <div className="post-payment-bg-overlay" />
          </>
        ) : (
          <div className="post-payment-bg-gradient" />
        )}

        <div className="post-payment-content">
          <div className="post-payment-container">
            <button onClick={handleBack} className="post-payment-back-button">
              <ChevronLeft />
              Back to venues
            </button>

            <div className="post-payment-steps">
              <div className="post-payment-step post-payment-step-completed">
                <div className="post-payment-step-number"><CheckCircle size={14} /></div>
                <div className="post-payment-step-label">Select Tickets</div>
              </div>
              <div className="post-payment-step-line post-payment-step-line-completed"></div>
              <div className="post-payment-step post-payment-step-completed">
                <div className="post-payment-step-number"><CheckCircle size={14} /></div>
                <div className="post-payment-step-label">Enter Data</div>
              </div>
              <div className="post-payment-step-line post-payment-step-line-completed"></div>
              <div className="post-payment-step post-payment-step-completed">
                <div className="post-payment-step-number"><CheckCircle size={14} /></div>
                <div className="post-payment-step-label">Payment</div>
              </div>
            </div>

            <div className="post-payment-success-banner">
              <div className="post-payment-success-icon"><CheckCircle /></div>
              <div className="post-payment-success-content">
                <h1 className="post-payment-success-title">Purchase successful!</h1>
                <p className="post-payment-success-message">
                  Your tickets have been generated successfully. You'll receive a copy via email.
                </p>
              </div>
              <button onClick={handleDownloadAll} className="post-payment-download-button" disabled={isGeneratingPDF}>
                <Download />
                <span>{isGeneratingPDF ? "Generating..." : "Download All PDFs"}</span>
              </button>
            </div>

            <div className="post-payment-tickets-section">
              <div className="post-payment-tickets-header">
                <h2 className="post-payment-tickets-title">Your Tickets</h2>
                <span className="post-payment-tickets-count">
                  {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
                </span>
              </div>

              <div className="post-payment-tickets-grid">
                {tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <QrCard key={ticket.qr_token} info={ticket} onDownload={() => generateSingleTicketPDF(ticket)} />
                  ))
                ) : (
                  <div className="post-payment-no-tickets">
                    <p>No tickets found for this order.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="post-payment-instructions">
              <h3 className="post-payment-instructions-title">Important Instructions</h3>
              <ul className="post-payment-instructions-list">
                <li>Present your QR ticket at the event entrance</li>
                <li>Bring valid ID matching the name on the ticket</li>
                <li>Tickets are non-transferable</li>
                <li>Keep this QR code safe and accessible</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}