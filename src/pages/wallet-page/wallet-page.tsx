import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
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
  Wallet,
  Mail,
  Phone,
  CalendarDays,
  Edit3,
  X,
  Save,
  Crown,
  Sparkles
} from 'lucide-react';
import type { PurchasedTicketInfo } from '../../types/types';
import { Footer } from '../../components/footer/footer';
import { PhonePrefixSelector } from '../../components/phone-prefix-selector/phone-prefix-selector';
import { BirthDatePicker } from '../../components/birth-date-picker/birth-date-picker';
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
const TICKETS_PER_PAGE = 6;

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
  const { t } = useTranslation('wallet');
  const { user, refreshProfile } = useAuth();
  const [tickets, setTickets] = useState<PurchasedTicketInfo[]>([]);
  const [venueSpending, setVenueSpending] = useState<VenueSpending[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'used'>('active');
  const [ticketPage, setTicketPage] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    surname: '',
    phone: '',
    phone_prefix: '+502',
    birth_date: '',
    gender: ''
  });

  useEffect(() => {
    loadTickets();
    loadVenueSpending();
    refreshProfile();
  }, []);

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        surname: user.surname || '',
        phone: user.phone || '',
        phone_prefix: user.phone_prefix || '+502',
        birth_date: user.birth_date || '',
        gender: user.gender || ''
      });
    }
  }, [user]);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/tickets/my-tickets');
      setTickets(response.data.tickets || []);
    } catch {
      setError(t('errors.loadTickets'));
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
        const link = document.createElement('a');
        link.href = response.data.signed_url;
        link.download = `ticket-${ticketId}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      alert(t('errors.downloadPdf'));
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const result = await authService.updateProfile(editForm);
      if (result.success) {
        await refreshProfile();
        setIsEditing(false);
      } else {
        alert(result.error || t('errors.updateProfile'));
      }
    } catch {
      alert(t('errors.updateProfile'));
    } finally {
      setIsSaving(false);
    }
  };

  const activeTickets = tickets.filter(ticket => !ticket.validated_at);
  const usedTickets = tickets.filter(ticket => ticket.validated_at);
  const displayTickets = activeTab === 'active' ? activeTickets : usedTickets;
  const totalPages = Math.ceil(displayTickets.length / TICKETS_PER_PAGE);
  const paginatedTickets = displayTickets.slice(
    ticketPage * TICKETS_PER_PAGE,
    (ticketPage + 1) * TICKETS_PER_PAGE
  );

  useEffect(() => {
    setTicketPage(0);
  }, [activeTab]);

  const getLocale = () => t('locale') === 'es' ? 'es-ES' : 'en-US';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(getLocale(), {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const formatMemberSince = (dateString?: string) => {
    if (!dateString) return t('profile.recentlyJoined');
    const date = new Date(dateString);
    return date.toLocaleDateString(getLocale(), {
      month: 'long',
      year: 'numeric'
    });
  };

  const formatBirthDate = (dateString?: string) => {
    if (!dateString) return t('details.notSet');
    const date = new Date(dateString);
    return date.toLocaleDateString(getLocale(), {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatGender = (gender?: string) => {
    const genderMap: Record<string, string> = {
      'male': t('gender.male'),
      'female': t('gender.female'),
      'other': t('gender.other'),
      'prefer_not_to_say': t('gender.preferNotToSay')
    };
    return genderMap[gender || ''] || t('details.notSet');
  };

  if (isLoading) {
    return (
      <>
        <div className="wallet-page">
          <div className="wallet-page-bg-blur" />
          <div className="wallet-page-bg-overlay" />
          <div className="wallet-page__loading">
            <Loader2 size={48} className="wallet-page__spinner" />
            <p>{t('loading')}</p>
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
      <div className="wallet-page-bg-overlay" />

      <div className="wallet-page__container">
        {/* Page Title */}
        <div className="wallet-page__header">
          <Wallet size={28} />
          <h1 className="wallet-page__title">{t('title')}</h1>
        </div>

        {/* Unified Profile Card with Tickets and Spending */}
        <div className="wallet-page__unified-card">
          {/* Profile Header Section */}
          <div className="wallet-page__profile-section">
            <div className="wallet-page__profile-header">
              <div className="wallet-page__profile-avatar-wrapper">
                <div className="wallet-page__profile-avatar">
                  {user?.profile_image ? (
                    <img src={user.profile_image} alt={user.name} />
                  ) : (
                    <User size={32} strokeWidth={1.5} />
                  )}
                </div>
                {user?.tier === 'vip' && (
                  <div className="wallet-page__profile-vip-badge">
                    <Crown size={12} />
                  </div>
                )}
              </div>

              <div className="wallet-page__profile-info">
                <div className="wallet-page__profile-name-row">
                  <h2 className="wallet-page__profile-name">
                    {user?.name} {user?.surname}
                  </h2>
                  <span className={`wallet-page__profile-tier-badge wallet-page__profile-tier-badge--${user?.tier}`}>
                    {user?.tier === 'vip' ? (
                      <>
                        <Sparkles size={10} />
                        {t('profile.vip')}
                      </>
                    ) : (
                      t('profile.member')
                    )}
                  </span>
                </div>
                <p className="wallet-page__profile-email">{user?.email}</p>
                <p className="wallet-page__profile-member-since">
                  <CalendarDays size={12} />
                  {t('profile.memberSince')} {formatMemberSince(user?.created_at)}
                </p>
              </div>

              <button
                className="wallet-page__profile-edit-btn"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 size={14} />
                <span>{t('buttons.edit')}</span>
              </button>
            </div>

            {/* Quick Stats */}
            <div className="wallet-page__quick-stats">
              <div className="wallet-page__quick-stat">
                <div className="wallet-page__quick-stat-icon wallet-page__quick-stat-icon--purple">
                  <Ticket size={16} />
                </div>
                <div className="wallet-page__quick-stat-content">
                  <span className="wallet-page__quick-stat-value">{user?.stats?.total_tickets || 0}</span>
                  <span className="wallet-page__quick-stat-label">{t('stats.tickets')}</span>
                </div>
              </div>

              <div className="wallet-page__quick-stat">
                <div className="wallet-page__quick-stat-icon wallet-page__quick-stat-icon--green">
                  <CheckCircle2 size={16} />
                </div>
                <div className="wallet-page__quick-stat-content">
                  <span className="wallet-page__quick-stat-value">{user?.stats?.validated_tickets || 0}</span>
                  <span className="wallet-page__quick-stat-label">{t('stats.attended')}</span>
                </div>
              </div>

              <div className="wallet-page__quick-stat">
                <div className="wallet-page__quick-stat-icon wallet-page__quick-stat-icon--blue">
                  <TrendingUp size={16} />
                </div>
                <div className="wallet-page__quick-stat-content">
                  <span className="wallet-page__quick-stat-value">{getCurrencySymbol('GTQ')}{user?.total_spent?.toFixed(0) || '0'}</span>
                  <span className="wallet-page__quick-stat-label">{t('stats.spent')}</span>
                </div>
              </div>

              <div className="wallet-page__quick-stat">
                <div className="wallet-page__quick-stat-icon wallet-page__quick-stat-icon--orange">
                  <Award size={16} />
                </div>
                <div className="wallet-page__quick-stat-content">
                  <span className="wallet-page__quick-stat-value">{getCurrencySymbol('GTQ')}{user?.average_spend?.toFixed(0) || '0'}</span>
                  <span className="wallet-page__quick-stat-label">{t('stats.avgPerEvent')}</span>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="wallet-page__profile-details">
              <div className="wallet-page__details-grid">
                <div className="wallet-page__detail-item">
                  <div className="wallet-page__detail-header">
                    <Mail size={14} className="wallet-page__detail-icon" />
                    <span className="wallet-page__detail-label">{t('details.email')}</span>
                  </div>
                  <span className="wallet-page__detail-value">{user?.email || t('details.notSet')}</span>
                </div>

                <div className="wallet-page__detail-item">
                  <div className="wallet-page__detail-header">
                    <Phone size={14} className="wallet-page__detail-icon" />
                    <span className="wallet-page__detail-label">{t('details.phone')}</span>
                  </div>
                  <span className="wallet-page__detail-value">
                    {user?.phone ? `${user.phone_prefix || '+502'} ${user.phone}` : t('details.notSet')}
                  </span>
                </div>

                <div className="wallet-page__detail-item">
                  <div className="wallet-page__detail-header">
                    <Calendar size={14} className="wallet-page__detail-icon" />
                    <span className="wallet-page__detail-label">{t('details.birthDate')}</span>
                  </div>
                  <span className="wallet-page__detail-value">{formatBirthDate(user?.birth_date)}</span>
                </div>

                <div className="wallet-page__detail-item">
                  <div className="wallet-page__detail-header">
                    <User size={14} className="wallet-page__detail-icon" />
                    <span className="wallet-page__detail-label">{t('details.gender')}</span>
                  </div>
                  <span className="wallet-page__detail-value">{formatGender(user?.gender)}</span>
                </div>
              </div>

              {user?.tags && user.tags.length > 0 && (
                <div className="wallet-page__tags-section">
                  <span className="wallet-page__tags-label">{t('details.interests')}</span>
                  <div className="wallet-page__tags">
                    {user.tags.map((tag, index) => (
                      <span key={index} className="wallet-page__tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tickets Section */}
          <div className="wallet-page__tickets-section">
            <div className="wallet-page__tickets-header">
              <div className="wallet-page__section-header">
                <Ticket size={20} />
                <h3 className="wallet-page__section-title">{t('tickets.title')}</h3>
              </div>
              <div className="wallet-page__tabs">
                <button
                  className={`wallet-page__tab ${activeTab === 'active' ? 'wallet-page__tab--active' : ''}`}
                  onClick={() => setActiveTab('active')}
                >
                  {t('tabs.active')} ({activeTickets.length})
                </button>
                <button
                  className={`wallet-page__tab ${activeTab === 'used' ? 'wallet-page__tab--active' : ''}`}
                  onClick={() => setActiveTab('used')}
                >
                  {t('tabs.used')} ({usedTickets.length})
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
              <div className="wallet-page__empty wallet-page__empty--compact">
                <Ticket size={48} />
                <h3>{t('noTickets')}</h3>
                <p>
                  {activeTab === 'active'
                    ? t('noActiveTickets')
                    : t('noUsedTickets')}
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
                            <span>{t('tickets.ticket')}</span>
                          </div>
                        </div>
                        {ticket.validated_at && (
                          <div className="wallet-page__ticket-validated">
                            <CheckCircle2 size={12} />
                            <span>{t('tickets.validated')}</span>
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
                            {ticket.ticket_types?.name || t('tickets.generalAdmission')}
                          </span>
                          <div className="wallet-page__ticket-actions">
                            <button
                              onClick={() => downloadPDF(ticket.id)}
                              className="wallet-page__ticket-action wallet-page__ticket-action--download"
                              title={t('tickets.download')}
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

          {/* Venue Spending Section */}
          {venueSpending.length > 0 && (
            <div className="wallet-page__spending-section">
              <div className="wallet-page__section-header">
                <Store size={20} />
                <h3 className="wallet-page__section-title">{t('spending.title')}</h3>
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
                        <span className="label">{t('spending.totalSpent')}</span>
                        <span className="value">{getCurrencySymbol(spending.venue.currency)}{spending.total_spent.toFixed(2)}</span>
                      </div>
                      <div className="wallet-page__spending-stat">
                        <span className="label">{t('spending.tickets')}</span>
                        <span className="value">{spending.total_tickets}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="wallet-page__modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="wallet-page__modal" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-page__modal-header">
              <h2 className="wallet-page__modal-title">{t('editProfile.title')}</h2>
              <button
                className="wallet-page__modal-close"
                onClick={() => setIsEditing(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="wallet-page__modal-content">
              {/* Name Row - 50/50 */}
              <div className="wallet-page__form-row wallet-page__form-row--names">
                <div className="wallet-page__form-group">
                  <label className="wallet-page__form-label">{t('editProfile.firstName')}</label>
                  <input
                    type="text"
                    className="wallet-page__form-input"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    placeholder={t('editProfile.firstNamePlaceholder')}
                  />
                </div>
                <div className="wallet-page__form-group">
                  <label className="wallet-page__form-label">{t('editProfile.lastName')}</label>
                  <input
                    type="text"
                    className="wallet-page__form-input"
                    value={editForm.surname}
                    onChange={(e) => setEditForm({...editForm, surname: e.target.value})}
                    placeholder={t('editProfile.lastNamePlaceholder')}
                  />
                </div>
              </div>

              {/* Phone Row */}
              <div className="wallet-page__form-group">
                <label className="wallet-page__form-label">{t('editProfile.phone')}</label>
                <div className="wallet-page__phone-input-container">
                  <PhonePrefixSelector
                    value={editForm.phone_prefix}
                    onChange={(value) => setEditForm({...editForm, phone_prefix: value})}
                  />
                  <input
                    type="tel"
                    className="wallet-page__form-input"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    placeholder={t('editProfile.phonePlaceholder')}
                  />
                </div>
              </div>

              {/* Birth Date */}
              <div className="wallet-page__form-group">
                <label className="wallet-page__form-label">{t('editProfile.birthDate')}</label>
                <BirthDatePicker
                  value={editForm.birth_date}
                  onChange={(value) => setEditForm({...editForm, birth_date: value})}
                  minAge={18}
                />
              </div>

              {/* Gender Selection */}
              <div className="wallet-page__form-group">
                <label className="wallet-page__form-label">{t('editProfile.gender')}</label>
                <div className="wallet-page__gender-selection">
                  <div className="wallet-page__gender-option">
                    <input
                      type="radio"
                      id="gender-male"
                      name="gender"
                      value="male"
                      checked={editForm.gender === 'male'}
                      onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                    />
                    <label htmlFor="gender-male" className="wallet-page__gender-label">
                      {t('editProfile.male')}
                    </label>
                  </div>
                  <div className="wallet-page__gender-option">
                    <input
                      type="radio"
                      id="gender-female"
                      name="gender"
                      value="female"
                      checked={editForm.gender === 'female'}
                      onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                    />
                    <label htmlFor="gender-female" className="wallet-page__gender-label">
                      {t('editProfile.female')}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="wallet-page__modal-actions">
              <button
                className="wallet-page__modal-cancel"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                {t('buttons.cancel')}
              </button>
              <button
                className="wallet-page__modal-save"
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 size={16} className="wallet-page__spinner" />
                ) : (
                  <>
                    <Save size={16} />
                    {t('buttons.saveChanges')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    <Footer />
  </>
  );
};
