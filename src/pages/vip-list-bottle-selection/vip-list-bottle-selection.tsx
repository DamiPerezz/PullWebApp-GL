import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wine,
  Wallet,
  Check,
  Plus,
  Minus,
  Calendar,
  MapPin,
  Star,
  AlertCircle,
  XCircle,
  CheckCircle,
  PartyPopper,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Layout } from '../../components/layout/layout';
import {
  getVIPListBottleSelectionData,
  saveVIPListBottleSelection,
  type VIPListBottleSelectionData,
  type VIPBottle
} from '../../controller/vip-list-controller';
import './vip-list-bottle-selection.css';

interface SelectedBottle {
  bottle_id: string;
  quantity: number;
  price: number;
  name: string;
  brand: string;
}

export const VIPListBottleSelectionPage = () => {
  const { token } = useParams<{ token: string }>();
  const { t, i18n } = useTranslation('viplist');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<VIPListBottleSelectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBottles, setSelectedBottles] = useState<SelectedBottle[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Validate token format (basic alphanumeric check)
  const validToken = useMemo(() => {
    if (!token) return null;
    // Token should be alphanumeric with dots and dashes
    const tokenRegex = /^[a-zA-Z0-9._-]+$/;
    return tokenRegex.test(token) ? token : null;
  }, [token]);

  useEffect(() => {
    if (!validToken) {
      setError(t('bottleSelection.errors.invalidToken'));
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await getVIPListBottleSelectionData(validToken);
        setData(response);

        // If bottles are already selected, show success state
        if (response.bottles_already_selected) {
          setSuccess(true);
        }
        setLoading(false);
      } catch (err: unknown) {
        const apiError = err as { response?: { data?: { error?: string } } };
        setError(apiError.response?.data?.error || t('bottleSelection.errors.loadFailed'));
        setLoading(false);
      }
    };

    fetchData();
  }, [validToken, t]);

  // Get unique categories from bottles
  const categories = useMemo(() => {
    if (!data?.bottles) return [];
    const cats = new Set<string>();
    data.bottles.forEach(bottle => {
      if (bottle.category) cats.add(bottle.category);
    });
    return Array.from(cats).sort();
  }, [data?.bottles]);

  // Filter bottles by category
  const filteredBottles = useMemo(() => {
    if (!data?.bottles) return [];
    if (selectedCategory === 'all') return data.bottles;
    return data.bottles.filter(b => b.category === selectedCategory);
  }, [data?.bottles, selectedCategory]);

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      'EUR': '\u20ac',
      'USD': '$',
      'GTQ': 'Q',
      'MXN': '$',
      'GBP': '\u00a3'
    };
    return symbols[currency] || currency || 'Q';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(i18n.language, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate totals
  const totalSelected = useMemo(() => {
    return selectedBottles.reduce((sum, b) => sum + (b.price * b.quantity), 0);
  }, [selectedBottles]);

  const budget = data?.budget || 0;
  const remaining = budget - totalSelected;
  const currencySymbol = data ? getCurrencySymbol(data.currency) : 'Q';

  const handleAddBottle = (bottle: VIPBottle) => {
    const newTotal = totalSelected + bottle.price;
    if (newTotal > budget) return; // Can't exceed budget

    const existing = selectedBottles.find(b => b.bottle_id === bottle.id);
    if (existing) {
      setSelectedBottles(prev => prev.map(b =>
        b.bottle_id === bottle.id
          ? { ...b, quantity: b.quantity + 1 }
          : b
      ));
    } else {
      setSelectedBottles(prev => [...prev, {
        bottle_id: bottle.id,
        quantity: 1,
        price: bottle.price,
        name: bottle.name,
        brand: bottle.brand
      }]);
    }
  };

  const handleRemoveBottle = (bottleId: string) => {
    const existing = selectedBottles.find(b => b.bottle_id === bottleId);
    if (!existing) return;

    if (existing.quantity === 1) {
      setSelectedBottles(prev => prev.filter(b => b.bottle_id !== bottleId));
    } else {
      setSelectedBottles(prev => prev.map(b =>
        b.bottle_id === bottleId
          ? { ...b, quantity: b.quantity - 1 }
          : b
      ));
    }
  };

  const getBottleQuantity = (bottleId: string) => {
    const bottle = selectedBottles.find(b => b.bottle_id === bottleId);
    return bottle?.quantity || 0;
  };

  const canAddBottle = (bottle: VIPBottle) => {
    return totalSelected + bottle.price <= budget;
  };

  const handleSubmit = async () => {
    if (!validToken || selectedBottles.length === 0) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const bottles = selectedBottles.map(b => ({
        bottle_id: b.bottle_id,
        quantity: b.quantity,
        name: b.name,
        brand: b.brand,
        price: b.price
      }));

      await saveVIPListBottleSelection(validToken, bottles);
      setSuccess(true);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { error?: string } } };
      setSubmitError(apiError.response?.data?.error || t('bottleSelection.errors.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  // Scroll handlers
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="vipbottle-wrapper">
          <div className="vipbottle-bg-blur" />
          <div className="vipbottle-bg-overlay" />
          <div className="vipbottle-content">
            <div className="vipbottle-loading">
              <div className="vipbottle-loading-spinner" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="vipbottle-wrapper">
          <div className="vipbottle-bg-blur" />
          <div className="vipbottle-bg-overlay" />
          <div className="vipbottle-content">
            <div className="vipbottle-error">
              <XCircle size={48} />
              <h2>{error || t('bottleSelection.errors.notFound')}</h2>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Success state
  if (success) {
    return (
      <Layout>
        <div className="vipbottle-wrapper">
          <div
            className="vipbottle-bg-blur"
            style={data.event_image ? { backgroundImage: `url(${data.event_image})` } : undefined}
          />
          <div className="vipbottle-bg-overlay" />
          <div className="vipbottle-content">
            <div className="vipbottle-success">
              <div className="vipbottle-success-confetti">
                <span>🍾</span>
                <span>🥂</span>
                <span>✨</span>
                <span>🎉</span>
              </div>
              <div className="vipbottle-success-icon">
                <PartyPopper size={48} />
              </div>
              <h2>{t('bottleSelection.success.title')}</h2>
              <p>{t('bottleSelection.success.message')}</p>

              {selectedBottles.length > 0 && (
                <div className="vipbottle-success-summary">
                  <h3>{t('bottleSelection.success.yourSelection')}</h3>
                  <div className="vipbottle-success-list">
                    {selectedBottles.map(bottle => (
                      <div key={bottle.bottle_id} className="vipbottle-success-item">
                        <span className="vipbottle-success-qty">{bottle.quantity}x</span>
                        <span className="vipbottle-success-name">{bottle.name}</span>
                        <span className="vipbottle-success-price">
                          {currencySymbol}{(bottle.price * bottle.quantity).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="vipbottle-success-total">
                    <span>{t('bottleSelection.total')}</span>
                    <span>{currencySymbol}{totalSelected.toFixed(0)}</span>
                  </div>
                </div>
              )}

              <div className="vipbottle-success-note">
                <CheckCircle size={16} />
                <span>{t('bottleSelection.success.emailSent')}</span>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="vipbottle-wrapper">
        <div
          className="vipbottle-bg-blur"
          style={data.event_image ? { backgroundImage: `url(${data.event_image})` } : undefined}
        />
        <div className="vipbottle-bg-overlay" />

        <div className="vipbottle-content">
          <div className="vipbottle-container">

            {/* Header - matching viptrack style */}
            <header className="vipbottle-header">
              <div className="vipbottle-header-content">
                {data.event_image && (
                  <div className="vipbottle-event-image">
                    <img src={data.event_image} alt={data.event_name} />
                  </div>
                )}
                <div className="vipbottle-header-text">
                  <div className="vipbottle-header-top">
                    <div className="vipbottle-vip-badge">
                      <Star size={12} />
                      <span>VIP</span>
                    </div>
                  </div>
                  <h1 className="vipbottle-title">{t('bottleSelection.title')}</h1>
                  <p className="vipbottle-event-name">{data.event_name}</p>
                  <div className="vipbottle-event-details">
                    <span className="vipbottle-detail-item">
                      <Calendar size={14} />
                      {formatDate(data.event_date)}
                    </span>
                    {data.venue_name && (
                      <span className="vipbottle-detail-item">
                        <MapPin size={14} />
                        {data.venue_name}
                      </span>
                    )}
                  </div>
                  <p className="vipbottle-host-info">
                    {t('bottleSelection.hostGreeting', { name: data.host_name })}
                  </p>
                </div>
              </div>
            </header>

            {/* Budget Widget */}
            <motion.div
              className="vipbottle-budget-widget"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="vipbottle-budget-header">
                <Wallet size={20} />
                <h2>{t('bottleSelection.budget')}</h2>
              </div>
              <div className="vipbottle-budget-amounts">
                <div className="vipbottle-budget-item">
                  <span className="vipbottle-budget-label">{t('bottleSelection.available')}</span>
                  <span className="vipbottle-budget-value">{currencySymbol}{budget.toFixed(0)}</span>
                </div>
                <div className="vipbottle-budget-item">
                  <span className="vipbottle-budget-label">{t('bottleSelection.selected')}</span>
                  <span className="vipbottle-budget-value vipbottle-budget-selected">
                    {currencySymbol}{totalSelected.toFixed(0)}
                  </span>
                </div>
                <div className="vipbottle-budget-item vipbottle-budget-remaining">
                  <span className="vipbottle-budget-label">{t('bottleSelection.remaining')}</span>
                  <motion.span
                    key={remaining}
                    className={`vipbottle-budget-value ${remaining < 0 ? 'negative' : ''}`}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    {currencySymbol}{remaining.toFixed(0)}
                  </motion.span>
                </div>
              </div>
              <div className="vipbottle-budget-progress">
                <div
                  className="vipbottle-budget-progress-fill"
                  style={{ width: `${Math.min((totalSelected / budget) * 100, 100)}%` }}
                />
              </div>
            </motion.div>

            {/* Bottles Section */}
            <div className="vipbottle-section">
              <div className="vipbottle-section-header">
                <Wine size={20} />
                <h2>{t('bottleSelection.availableBottles')}</h2>
              </div>

              {/* Category Filter */}
              {categories.length > 1 && (
                <div className="vipbottle-filter-section">
                  <div className="vipbottle-filter-header">
                    <Filter size={16} />
                    <span>{t('bottleSelection.filterByType')}</span>
                  </div>
                  <div className="vipbottle-filter-pills">
                    <button
                      className={`vipbottle-filter-pill ${selectedCategory === 'all' ? 'active' : ''}`}
                      onClick={() => setSelectedCategory('all')}
                    >
                      {t('bottleSelection.allTypes')}
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        className={`vipbottle-filter-pill ${selectedCategory === cat ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Horizontal Scrolling Bottles */}
              <div className="vipbottle-carousel-wrapper">
                <button className="vipbottle-carousel-btn vipbottle-carousel-btn-left" onClick={scrollLeft}>
                  <ChevronLeft size={24} />
                </button>

                <div className="vipbottle-carousel" ref={scrollContainerRef}>
                  {filteredBottles.map((bottle) => {
                    const quantity = getBottleQuantity(bottle.id);
                    const canAdd = canAddBottle(bottle);
                    const isSelected = quantity > 0;

                    return (
                      <motion.div
                        key={bottle.id}
                        className={`vipbottle-card ${isSelected ? 'selected' : ''}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="vipbottle-card-image">
                          {bottle.image_url ? (
                            <img src={bottle.image_url} alt={bottle.name} />
                          ) : (
                            <div className="vipbottle-card-placeholder">
                              <Wine size={32} />
                            </div>
                          )}
                          {isSelected && (
                            <div className="vipbottle-card-selected-badge">
                              <Check size={14} />
                              <span>{quantity}</span>
                            </div>
                          )}
                        </div>

                        <div className="vipbottle-card-info">
                          <span className="vipbottle-card-brand">{bottle.brand}</span>
                          <h3 className="vipbottle-card-name">{bottle.name}</h3>
                          {bottle.size_ml && (
                            <span className="vipbottle-card-size">{bottle.size_ml}ml</span>
                          )}
                          <span className="vipbottle-card-price">
                            {currencySymbol}{bottle.price.toFixed(0)}
                          </span>
                        </div>

                        <div className="vipbottle-card-actions">
                          {isSelected ? (
                            <div className="vipbottle-quantity-controls">
                              <button
                                className="vipbottle-qty-btn"
                                onClick={() => handleRemoveBottle(bottle.id)}
                              >
                                <Minus size={16} />
                              </button>
                              <span className="vipbottle-qty-value">{quantity}</span>
                              <button
                                className="vipbottle-qty-btn"
                                onClick={() => handleAddBottle(bottle)}
                                disabled={!canAdd}
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          ) : (
                            <button
                              className="vipbottle-add-btn"
                              onClick={() => handleAddBottle(bottle)}
                              disabled={!canAdd}
                            >
                              <Plus size={16} />
                              {t('bottleSelection.add')}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <button className="vipbottle-carousel-btn vipbottle-carousel-btn-right" onClick={scrollRight}>
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>

            {/* Selected Bottles Summary */}
            <AnimatePresence>
              {selectedBottles.length > 0 && (
                <motion.div
                  className="vipbottle-summary"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="vipbottle-summary-header">
                    <Wine size={18} />
                    <h3>{t('bottleSelection.yourSelection')}</h3>
                  </div>
                  <div className="vipbottle-summary-list">
                    {selectedBottles.map(bottle => (
                      <div key={bottle.bottle_id} className="vipbottle-summary-item">
                        <span className="vipbottle-summary-qty">{bottle.quantity}x</span>
                        <span className="vipbottle-summary-name">{bottle.name}</span>
                        <span className="vipbottle-summary-price">
                          {currencySymbol}{(bottle.price * bottle.quantity).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="vipbottle-summary-breakdown">
                    <div className="vipbottle-summary-row">
                      <span>{t('bottleSelection.consumableSpent')}</span>
                      <span>- {currencySymbol}{totalSelected.toFixed(0)}</span>
                    </div>
                    <div className="vipbottle-summary-row vipbottle-summary-remaining">
                      <span>{t('bottleSelection.remainingCredit')}</span>
                      <span>{currencySymbol}{remaining.toFixed(0)}</span>
                    </div>
                  </div>
                  {remaining > 0 && (
                    <div className="vipbottle-summary-note">
                      {t('bottleSelection.remainingCreditNote')}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Error */}
            {submitError && (
              <div className="vipbottle-error-message">
                <AlertCircle size={16} />
                {submitError}
              </div>
            )}

            {/* Submit Button */}
            <div className="vipbottle-submit-section">
              <button
                className="vipbottle-submit-btn"
                onClick={handleSubmit}
                disabled={submitting || selectedBottles.length === 0}
              >
                {submitting ? (
                  <div className="vipbottle-btn-spinner" />
                ) : (
                  <>
                    <Check size={20} />
                    {t('bottleSelection.confirm')}
                  </>
                )}
              </button>
              <p className="vipbottle-submit-note">
                <Clock size={14} />
                {t('bottleSelection.confirmNote')}
              </p>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};
