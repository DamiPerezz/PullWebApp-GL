import type { VIPBottle } from '../../types/types';
import { Wine, ChevronDown } from 'lucide-react';
import './bottle-selector.css';

interface BottleSelectorProps {
  bottles: VIPBottle[];
  selectedBottle: VIPBottle | null;
  onSelect: (bottle: VIPBottle) => void;
}

export const BottleSelector = ({ bottles, selectedBottle, onSelect }: BottleSelectorProps) => {
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bottleId = e.target.value;
    const bottle = bottles.find(b => b.id === bottleId);
    if (bottle) {
      onSelect(bottle);
    }
  };

  return (
    <div className="bottle-selector-container">
      <div className="bottle-selector-dropdown-wrapper">
        <label className="bottle-selector-label">
          <Wine />
          Included Bottle
        </label>
        <div className="bottle-selector-dropdown">
          <select 
            value={selectedBottle?.id || ''} 
            onChange={handleSelectChange}
            className="bottle-selector-select"
          >
            {!selectedBottle && <option value="">Choose a bottle...</option>}
            {bottles.map((bottle) => (
              <option key={bottle.id} value={bottle.id}>
                {bottle.name} {bottle.brand ? `- ${bottle.brand}` : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="bottle-selector-dropdown-icon" />
        </div>
      </div>

      {selectedBottle && (
        <div className="bottle-selector-card-display">
          <div className="bottle-selector-card-compact">
            {selectedBottle.image ? (
              <div className="bottle-selector-image-compact">
                <img src={selectedBottle.image} alt={selectedBottle.name} />
              </div>
            ) : (
              <div className="bottle-selector-icon-compact">
                <Wine />
              </div>
            )}

            <div className="bottle-selector-info-compact">
              <h4 className="bottle-selector-name-compact">{selectedBottle.name}</h4>
              {selectedBottle.brand && (
                <p className="bottle-selector-brand-compact">{selectedBottle.brand}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};