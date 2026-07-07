import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wine, Sparkles, TrendingUp, Gift, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { RouletteBottle } from '../../controller/vip-list-controller';
import './bottle-roulette.css';

interface BottleRouletteProps {
  isOpen: boolean;
  onClose: () => void;
  bottles: RouletteBottle[];
  currentBudget: number;
  maxBudget: number;
  currency: string;
  currencySymbol: string;
}

export const BottleRoulette = ({
  isOpen,
  onClose,
  bottles,
  currentBudget,
  maxBudget,
  currency: _currency,
  currencySymbol
}: BottleRouletteProps) => {
  // _currency is available for future use if needed
  const { t } = useTranslation('viplist');
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [winningBottle, setWinningBottle] = useState<RouletteBottle | null>(null);
  const [nextBottle, setNextBottle] = useState<RouletteBottle | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rotationDegree, setRotationDegree] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Calculate the most expensive bottle they can afford
  const getAffordableBottle = useCallback((budget: number): RouletteBottle | null => {
    const sortedByPrice = [...bottles].sort((a, b) => b.price - a.price);
    return sortedByPrice.find(b => b.price <= budget) || null;
  }, [bottles]);

  // Calculate the next tier bottle they could unlock
  const getNextTierBottle = useCallback((budget: number): RouletteBottle | null => {
    const sortedByPrice = [...bottles].sort((a, b) => a.price - b.price);
    return sortedByPrice.find(b => b.price > budget) || null;
  }, [bottles]);

  useEffect(() => {
    if (isOpen && bottles.length > 0) {
      const affordable = getAffordableBottle(currentBudget);
      const next = getNextTierBottle(currentBudget);
      setWinningBottle(affordable);
      setNextBottle(next);
      setShowResult(false);
      setIsSpinning(false);
      setShowConfetti(false);
      setRotationDegree(0);
    }
  }, [isOpen, currentBudget, bottles, getAffordableBottle, getNextTierBottle]);

  const spinWheel = () => {
    if (isSpinning || !winningBottle) return;

    setIsSpinning(true);
    setShowResult(false);
    setShowConfetti(false);

    // Calculate which segment the winning bottle is in
    const winningIndex = bottles.findIndex(b => b.id === winningBottle.id);
    const segmentAngle = 360 / bottles.length;

    // Calculate target angle (we want the winning segment at the top/pointer)
    // Add multiple full rotations for effect
    const fullRotations = 5 + Math.floor(Math.random() * 3); // 5-7 full spins
    const targetAngle = (fullRotations * 360) + (360 - (winningIndex * segmentAngle) - (segmentAngle / 2));

    setRotationDegree(targetAngle);

    // Show result after animation
    setTimeout(() => {
      setIsSpinning(false);
      setShowResult(true);
      setShowConfetti(true);

      // Auto-hide confetti after a while
      setTimeout(() => setShowConfetti(false), 5000);
    }, 4500);
  };

  const getSegmentColor = (index: number, _total: number): string => {
    const colors = [
      'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
      'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
      'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
      'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
      'linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)',
    ];
    return colors[index % colors.length];
  };

  const amountNeededForNext = nextBottle ? nextBottle.price - currentBudget : 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="roulette-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Confetti Effect */}
        {showConfetti && (
          <div className="roulette-confetti-container">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="roulette-confetti-piece"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -20,
                  rotate: 0,
                  scale: Math.random() * 0.5 + 0.5,
                }}
                animate={{
                  y: window.innerHeight + 100,
                  rotate: Math.random() * 720 - 360,
                  x: Math.random() * window.innerWidth,
                }}
                transition={{
                  duration: Math.random() * 2 + 2,
                  ease: 'linear',
                  delay: Math.random() * 0.5,
                }}
                style={{
                  backgroundColor: ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'][Math.floor(Math.random() * 6)],
                }}
              />
            ))}
          </div>
        )}

        <motion.div
          className="roulette-modal"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button className="roulette-close" onClick={onClose}>
            <X size={24} />
          </button>

          {/* Header */}
          <div className="roulette-header">
            <div className="roulette-header-icon">
              <Wine size={28} />
              <Sparkles className="roulette-sparkle" size={16} />
            </div>
            <h2 className="roulette-title">{t('roulette.title', '¿A qué botella puedes aspirar?')}</h2>
            <p className="roulette-subtitle">
              {t('roulette.subtitle', 'Descubre qué botella premium podrías conseguir')}
            </p>
          </div>

          {/* Budget Display */}
          <div className="roulette-budget">
            <div className="roulette-budget-current">
              <span className="roulette-budget-label">{t('roulette.currentBudget', 'Consumibles actuales')}</span>
              <span className="roulette-budget-amount">{currencySymbol}{currentBudget.toFixed(0)}</span>
            </div>
            <div className="roulette-budget-bar">
              <div
                className="roulette-budget-fill"
                style={{ width: `${Math.min((currentBudget / maxBudget) * 100, 100)}%` }}
              />
            </div>
            <div className="roulette-budget-max">
              <span>{t('roulette.potential', 'Potencial')}: {currencySymbol}{maxBudget.toFixed(0)}</span>
            </div>
          </div>

          {/* Roulette Wheel */}
          {bottles.length > 0 && !showResult && (
            <div className="roulette-wheel-container">
              <div className="roulette-pointer">
                <Gift size={20} />
              </div>
              <motion.div
                ref={wheelRef}
                className="roulette-wheel"
                animate={{ rotate: rotationDegree }}
                transition={{
                  duration: isSpinning ? 4.5 : 0,
                  ease: [0.2, 0.8, 0.2, 1],
                }}
              >
                {bottles.map((bottle, index) => {
                  const angle = (360 / bottles.length) * index;
                  const isAffordable = bottle.price <= currentBudget;
                  return (
                    <div
                      key={bottle.id}
                      className={`roulette-segment ${isAffordable ? 'affordable' : 'locked'}`}
                      style={{
                        transform: `rotate(${angle}deg)`,
                        background: getSegmentColor(index, bottles.length),
                        clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.tan(Math.PI / bottles.length)}% 0%)`,
                      }}
                    >
                      <div
                        className="roulette-segment-content"
                        style={{ transform: `rotate(${180 / bottles.length}deg)` }}
                      >
                        {bottle.image ? (
                          <img src={bottle.image} alt={bottle.name} className="roulette-bottle-img" />
                        ) : (
                          <Wine size={20} />
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="roulette-center">
                  <Wine size={24} />
                </div>
              </motion.div>

              {/* Spin Button */}
              <motion.button
                className="roulette-spin-btn"
                onClick={spinWheel}
                disabled={isSpinning || !winningBottle}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isSpinning ? (
                  <div className="roulette-spinning-text">
                    <Sparkles size={18} className="spin-icon" />
                    {t('roulette.spinning', 'Girando...')}
                  </div>
                ) : (
                  <>
                    <Gift size={18} />
                    {t('roulette.spin', '¡GIRAR!')}
                  </>
                )}
              </motion.button>
            </div>
          )}

          {/* Result Display */}
          {showResult && winningBottle && (
            <motion.div
              className="roulette-result"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
              <div className="roulette-result-header">
                <Trophy size={32} className="roulette-trophy" />
                <h3>{t('roulette.youCouldWin', '¡Puedes conseguir!')}</h3>
              </div>

              <div className="roulette-winning-bottle">
                {winningBottle.image ? (
                  <img src={winningBottle.image} alt={winningBottle.name} />
                ) : (
                  <div className="roulette-bottle-placeholder">
                    <Wine size={48} />
                  </div>
                )}
              </div>

              <div className="roulette-winning-info">
                <span className="roulette-winning-brand">{winningBottle.brand}</span>
                <span className="roulette-winning-name">{winningBottle.name}</span>
                <span className="roulette-winning-price">{currencySymbol}{winningBottle.price.toFixed(0)}</span>
              </div>

              {/* Incentive to add more people */}
              {nextBottle && (
                <motion.div
                  className="roulette-next-tier"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <TrendingUp size={18} />
                  <div className="roulette-next-tier-content">
                    <span className="roulette-next-tier-title">
                      {t('roulette.unlockNext', '¡Desbloquea algo mejor!')}
                    </span>
                    <span className="roulette-next-tier-text">
                      {t('roulette.addMore', 'Añade más amigos para alcanzar')} <strong>{nextBottle.brand} {nextBottle.name}</strong>
                    </span>
                    <span className="roulette-next-tier-amount">
                      {t('roulette.needMore', 'Solo necesitas')} <strong>{currencySymbol}{amountNeededForNext.toFixed(0)}</strong> {t('roulette.more', 'más')}
                    </span>
                  </div>
                </motion.div>
              )}

              <button className="roulette-spin-again" onClick={() => {
                setShowResult(false);
                setShowConfetti(false);
                setRotationDegree(0);
              }}>
                {t('roulette.spinAgain', 'Girar de nuevo')}
              </button>
            </motion.div>
          )}

          {/* No bottles available */}
          {bottles.length === 0 && (
            <div className="roulette-empty">
              <Wine size={48} />
              <p>{t('roulette.noBottles', 'No hay botellas disponibles en este momento')}</p>
            </div>
          )}

          {/* No affordable bottle */}
          {bottles.length > 0 && !winningBottle && !isSpinning && (
            <div className="roulette-not-enough">
              <Gift size={48} />
              <h3>{t('roulette.notEnough', '¡Añade más amigos!')}</h3>
              <p>{t('roulette.notEnoughDesc', 'Necesitas más consumibles para desbloquear tu primera botella')}</p>
              {nextBottle && (
                <div className="roulette-first-unlock">
                  <span>{t('roulette.firstBottle', 'Primera botella disponible')}:</span>
                  <strong>{nextBottle.brand} {nextBottle.name}</strong>
                  <span className="roulette-first-unlock-price">
                    {t('roulette.needMore', 'Solo necesitas')} {currencySymbol}{(nextBottle.price - currentBudget).toFixed(0)} {t('roulette.more', 'más')}
                  </span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
