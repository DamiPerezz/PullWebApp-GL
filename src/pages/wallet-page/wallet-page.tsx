import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../utils/axios';
import {
  Ticket,
  User,
  Calendar,
  MapPin,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  Store,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Wallet
} from 'lucide-react';
import type { PurchasedTicketInfo } from '../../types/types';
import { Footer } from '../../components/footer/footer';
import './wallet-page.css';

interface VenueSpending {
  id: string;
  venue: {
    id: string;
    name: string;
    image?: string;
    location?: string;
    currency?: string;
  };
  total_spent: number;
  total_tickets: number;
  last_purchase_at?: string;
}

// Constants
const TICKETS_PER_PAGE = 6; // 2 rows x 3 columns

// Helper function to convert currency code to symbol
const getCurrencySymbol = (currency?: string): string => {
  const symbols: Record<string, string> = {
    'GTQ': 'Q',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'MXN': '$',
  };
  return symbols[currency || 'GTQ'] || currency || 'Q';
};

export const WalletPage = () => {
  const { user, refreshProfile } = useAuth();
  const [tickets, setTickets] = useState<PurchasedTicketInfo[]>([]);
  const [venueSpending, setVenueSpending] = useState<VenueSpending[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'used'>('active');
  const [ticketPage, setTicketPage] = useState(0);

  useEffect(() => {
    loadTickets();
    loadVenueSpending();
    refreshProfile();
  }, []);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/tickets/my-tickets');
      setTickets(response.data.tickets || []);
    } catch {
      setError('Failed to load your tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVenueSpending = async () => {
    try {
      const response = await apiClient.get('/users/spending/venues');
      setVenueSpending(response.data.spending || []);
    } catch {
      // Silently handle error
    }
  };

  const downloadPDF = async (ticketId: string) => {
    try {
      const response = await apiClient.get(`/tickets/${ticketId}/download-pdf`);
      if (response.data.signed_url) {
        // Crear un link temporal para forzar la descarga
        const link = document.createElement('a');
        link.href = response.data.signed_url;
        link.download = `ticket-${ticketId}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      alert('Failed to download ticket PDF');
    }
  };

  // Active tickets = not validated yet (can still be used)
  const activeTickets = tickets.filter(ticket => !ticket.validated_at);

  // Used tickets = already validated (already used, no longer valid)
  const usedTickets = tickets.filter(ticket => ticket.validated_at);

  const displayTickets = activeTab === 'active' ? activeTickets : usedTickets;
  const totalPages = Math.ceil(displayTickets.length / TICKETS_PER_PAGE);
  const paginatedTickets = displayTickets.slice(
    ticketPage * TICKETS_PER_PAGE,
    (ticketPage + 1) * TICKETS_PER_PAGE
  );

  // Reset page when changing tabs
  useEffect(() => {
    setTicketPage(0);
  }, [activeTab]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  if (isLoading) {
    return (
      <>
        <div className="wallet-page">
          <div className="wallet-page-bg-blur" />
          <div className="wallet-page__loading">
            <Loader2 size={48} className="wallet-page__spinner" />
            <p>Loading your wallet...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
    <div className="wallet-page">
      <div className="wallet-page-bg-blur" />

      <div className="wallet-page__container">
        {/* Page Title */}
        <div className="wallet-page__header">
          <Wallet size={28} />
          <h1 className="wallet-page__title">My Wallet</h1>
        </div>

        {/* Profile Section */}
        <div className="wallet-page__profile">
          <div className="wallet-page__profile-header">
            <div className="wallet-page__profile-avatar">
              {user?.profile_image ? (
                <img src={user.profile_image} alt={user.name} />
              ) : (
                <User size={40} />
              )}
            </div>
            <div className="wallet-page__profile-info">
              <h1 className="wallet-page__profile-name">
                {user?.name} {user?.surname}
              </h1>
              <p className="wallet-page__profile-email">{user?.email}</p>
              <span className={`wallet-page__profile-tier wallet-page__profile-tier--${user?.tier}`}>
                {user?.tier === 'vip' ? '⭐ VIP Member' : '🎫 Regular Member'}
              </span>
            </div>
          </div>

          <div className="wallet-page__stats">
            <div className="wallet-page__stat">
              <div className="wallet-page__stat-icon wallet-page__stat-icon--purple">
                <Ticket size={20} />
              </div>
              <div className="wallet-page__stat-content">
                <p className="wallet-page__stat-label">Total Tickets</p>
                <p className="wallet-page__stat-value">{user?.stats?.total_tickets || 0}</p>
              </div>
            </div>

            <div className="wallet-page__stat">
              <div className="wallet-page__stat-icon wallet-page__stat-icon--green">
                <CheckCircle2 size={20} />
              </div>
              <div className="wallet-page__stat-content">
                <p className="wallet-page__stat-label">Validated</p>
                <p className="wallet-page__stat-value">{user?.stats?.validated_tickets || 0}</p>
              </div>
            </div>

            <div className="wallet-page__stat">
              <div className="wallet-page__stat-icon wallet-page__stat-icon--blue">
                <TrendingUp size={20} />
              </div>
              <div className="wallet-page__stat-content">
                <p className="wallet-page__stat-label">Total Spent</p>
                <p className="wallet-page__stat-value">{getCurrencySymbol('GTQ')}{user?.total_spent?.toFixed(2) || '0.00'}</p>
              </div>
            </div>

            <div className="wallet-page__stat">
              <div className="wallet-page__stat-icon wallet-page__stat-icon--orange">
                <Award size={20} />
              </div>
              <div className="wallet-page__stat-content">
                <p className="wallet-page__stat-label">Avg. Spend</p>
                <p className="wallet-page__stat-value">{getCurrencySymbol('GTQ')}{user?.average_spend?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>

          {user?.tags && user.tags.length > 0 && (
            <div className="wallet-page__tags">
              {user.tags.map((tag, index) => (
                <span key={index} className="wallet-page__tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Venue Spending Section */}
        {venueSpending.length > 0 && (
          <div className="wallet-page__venue-spending">
            <div className="wallet-page__section-header">
              <Store size={24} />
              <h3 className="wallet-page__section-title">Spending by Venue</h3>
            </div>
            <div className="wallet-page__spending-grid">
              {venueSpending.map((spending) => (
                <div key={spending.id} className="wallet-page__spending-card">
                  <div className="wallet-page__spending-venue">
                    {spending.venue.image ? (
                      <img src={spending.venue.image} alt={spending.venue.name} />
                    ) : (
                      <div className="wallet-page__spending-venue-placeholder">
                        <Store size={32} />
                      </div>
                    )}
                    <div className="wallet-page__spending-overlay">
                      <h4>{spending.venue.name}</h4>
                      {spending.venue.location && <p>{spending.venue.location}</p>}
                    </div>
                  </div>
                  <div className="wallet-page__spending-stats">
                    <div className="wallet-page__spending-stat">
                      <span className="label">Total Spent</span>
                      <span className="value">{getCurrencySymbol(spending.venue.currency)}{spending.total_spent.toFixed(2)}</span>
                    </div>
                    <div className="wallet-page__spending-stat">
                      <span className="label">Tickets</span>
                      <span className="value">{spending.total_tickets}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tickets Section */}
        <div className="wallet-page__tickets">
          <div className="wallet-page__tickets-header">
            <h2 className="wallet-page__tickets-title">My Tickets</h2>
            <div className="wallet-page__tabs">
              <button
                className={`wallet-page__tab ${activeTab === 'active' ? 'wallet-page__tab--active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                Active ({activeTickets.length})
              </button>
              <button
                className={`wallet-page__tab ${activeTab === 'used' ? 'wallet-page__tab--active' : ''}`}
                onClick={() => setActiveTab('used')}
              >
                Used ({usedTickets.length})
              </button>
            </div>
          </div>

          {error && (
            <div className="wallet-page__error">
              <XCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {displayTickets.length === 0 ? (
            <div className="wallet-page__empty">
              <Ticket size={64} />
              <h3>No tickets found</h3>
              <p>
                {activeTab === 'active'
                  ? "You don't have any active tickets"
                  : "You don't have any used tickets"}
              </p>
            </div>
          ) : (
            <>
              <div className="wallet-page__tickets-grid">
                {paginatedTickets.map((ticket) => (
                  <div key={ticket.id} className="wallet-page__ticket-card">
                    <div className="wallet-page__ticket-preview">
                      <img
                        src={ticket.events?.image || '/placeholder-event.jpg'}
                        alt={ticket.event_name}
                        className="wallet-page__ticket-image"
                      />
                      <div className="wallet-page__ticket-overlay">
                        <div className="wallet-page__ticket-qr-badge">
                          <QrCode size={18} />
                          <span>Ticket</span>
                        </div>
                      </div>
                      {ticket.validated_at && (
                        <div className="wallet-page__ticket-validated">
                          <CheckCircle2 size={12} />
                          <span>Validated</span>
                        </div>
                      )}
                    </div>

                    <div className="wallet-page__ticket-content">
                      <h3 className="wallet-page__ticket-event">{ticket.event_name}</h3>

                      <div className="wallet-page__ticket-details">
                        <div className="wallet-page__ticket-detail">
                          <Calendar size={12} />
                          <span>{formatDate(ticket.event_date)}</span>
                        </div>

                        <div className="wallet-page__ticket-detail">
                          <Clock size={12} />
                          <span>{formatTime(ticket.start_time)}</span>
                        </div>

                        {ticket.events?.venues?.location && (
                          <div className="wallet-page__ticket-detail">
                            <MapPin size={12} />
                            <span>{ticket.events.venues.location}</span>
                          </div>
                        )}
                      </div>

                      <div className="wallet-page__ticket-footer">
                        <span className="wallet-page__ticket-type">
                          {ticket.ticket_types?.name || 'General Admission'}
                        </span>
                        <div className="wallet-page__ticket-actions">
                          <button
                            onClick={() => downloadPDF(ticket.id)}
                            className="wallet-page__ticket-action wallet-page__ticket-action--download"
                            title="Download PDF"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="wallet-page__pagination">
                  <button
                    className="wallet-page__pagination-btn"
                    onClick={() => setTicketPage(p => Math.max(0, p - 1))}
                    disabled={ticketPage === 0}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="wallet-page__pagination-info">
                    {ticketPage + 1} / {totalPages}
                  </span>
                  <button
                    className="wallet-page__pagination-btn"
                    onClick={() => setTicketPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={ticketPage === totalPages - 1}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    <Footer />
  </>
  );
};