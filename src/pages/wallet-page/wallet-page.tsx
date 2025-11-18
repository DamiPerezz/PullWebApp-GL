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
  Loader2
} from 'lucide-react';
import { PurchasedTicketInfo } from '../../types/types';
import './wallet-page.css';

export const WalletPage = () => {
  const { user, refreshProfile } = useAuth();
  const [tickets, setTickets] = useState<PurchasedTicketInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    loadTickets();
    refreshProfile();
  }, []);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/tickets/my-tickets');
      setTickets(response.data.tickets || []);
    } catch (err: any) {
      console.error('Error loading tickets:', err);
      setError('Failed to load your tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const upcomingTickets = tickets.filter(ticket => {
    const eventDate = new Date(ticket.event_date);
    return eventDate >= new Date();
  });

  const pastTickets = tickets.filter(ticket => {
    const eventDate = new Date(ticket.event_date);
    return eventDate < new Date();
  });

  const displayTickets = activeTab === 'upcoming' ? upcomingTickets : pastTickets;

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
      <div className="wallet-page">
        <div className="wallet-page-bg-blur" />
        <div className="wallet-page__loading">
          <Loader2 size={48} className="wallet-page__spinner" />
          <p>Loading your wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-page">
      <div className="wallet-page-bg-blur" />
      <div className="wallet-page__container">
        
        {/* User Profile Section */}
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

          {/* Stats Grid */}
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
                <p className="wallet-page__stat-value">€{user?.total_spent?.toFixed(2) || '0.00'}</p>
              </div>
            </div>

            <div className="wallet-page__stat">
              <div className="wallet-page__stat-icon wallet-page__stat-icon--orange">
                <Award size={20} />
              </div>
              <div className="wallet-page__stat-content">
                <p className="wallet-page__stat-label">Avg. Spend</p>
                <p className="wallet-page__stat-value">€{user?.average_spend?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>

          {/* User Tags */}
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

        {/* Tickets Section */}
        <div className="wallet-page__tickets">
          <div className="wallet-page__tickets-header">
            <h2 className="wallet-page__tickets-title">My Tickets</h2>
            <div className="wallet-page__tabs">
              <button
                className={`wallet-page__tab ${activeTab === 'upcoming' ? 'wallet-page__tab--active' : ''}`}
                onClick={() => setActiveTab('upcoming')}
              >
                Upcoming ({upcomingTickets.length})
              </button>
              <button
                className={`wallet-page__tab ${activeTab === 'past' ? 'wallet-page__tab--active' : ''}`}
                onClick={() => setActiveTab('past')}
              >
                Past ({pastTickets.length})
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
                {activeTab === 'upcoming' 
                  ? "You don't have any upcoming tickets" 
                  : "You don't have any past tickets"}
              </p>
            </div>
          ) : (
            <div className="wallet-page__tickets-grid">
              {displayTickets.map((ticket) => (
                <div key={ticket.id} className="wallet-page__ticket-card">
                  <div className="wallet-page__ticket-image">
                    <img 
                      src={ticket.events?.image || '/placeholder-event.jpg'} 
                      alt={ticket.event_name} 
                    />
                    {ticket.validated_at && (
                      <div className="wallet-page__ticket-validated">
                        <CheckCircle2 size={16} />
                        <span>Validated</span>
                      </div>
                    )}
                  </div>

                  <div className="wallet-page__ticket-content">
                    <h3 className="wallet-page__ticket-event">{ticket.event_name}</h3>
                    
                    <div className="wallet-page__ticket-details">
                      <div className="wallet-page__ticket-detail">
                        <Calendar size={16} />
                        <span>{formatDate(ticket.event_date)}</span>
                      </div>
                      
                      <div className="wallet-page__ticket-detail">
                        <Clock size={16} />
                        <span>{formatTime(ticket.start_time)}</span>
                      </div>

                      {ticket.events?.venues?.location && (
                        <div className="wallet-page__ticket-detail">
                          <MapPin size={16} />
                          <span>{ticket.events.venues.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="wallet-page__ticket-footer">
                      <span className="wallet-page__ticket-type">
                        {ticket.ticket_types?.name || 'General Admission'}
                      </span>
                      <button className="wallet-page__ticket-view">
                        View QR
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};