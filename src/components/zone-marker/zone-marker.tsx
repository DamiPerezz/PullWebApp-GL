// zone-marker.tsx
import './zone-marker.css';

interface ZoneMarkerProps {
  zoneName: string;
  availableCount: number;
  totalTables: number;
  totalCapacity: number;
  minSpend: number;
  isSelected: boolean;
  isAvailable: boolean;
  isHovered: boolean;
  zoneType: 'vip-premium' | 'vip' | 'standard';
  position: { left: string; top: string };
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

// Icono de mesa más realista y minimalista
const TableIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className="zone-marker-icon"
  >
    {/* Superficie de la mesa (elipse superior) */}
    <ellipse cx="12" cy="8" rx="9" ry="4" />
    {/* Patas de la mesa */}
    <line x1="6" y1="8" x2="6" y2="20" />
    <line x1="18" y1="8" x2="18" y2="20" />
    {/* Base de las patas */}
    <line x1="5" y1="20" x2="7" y2="20" />
    <line x1="17" y1="20" x2="19" y2="20" />
  </svg>
);

export const ZoneMarker = ({
  zoneName,
  availableCount,
  totalTables,
  totalCapacity,
  minSpend,
  isSelected,
  isAvailable,
  isHovered,
  zoneType,
  position,
  onClick,
  onMouseEnter,
  onMouseLeave
}: ZoneMarkerProps) => {
  return (
    <button
      className={`zone-marker zone-marker-${zoneType} ${
        isSelected ? 'selected' : ''
      } ${!isAvailable ? 'unavailable' : ''}`}
      style={position}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={!isAvailable}
    >
      <div className="zone-marker-circle">
        <TableIcon />
        <div className="zone-marker-label">{zoneName}</div>
      </div>
      
      {(isHovered || isSelected) && (
        <div className="zone-marker-tooltip">
          <div className="zone-marker-tooltip-content">
            <div className="zone-marker-tooltip-title">
              {zoneName}
            </div>
            <div className="zone-marker-tooltip-info">
              <span>Available: {availableCount} / {totalTables} tables</span>
              <span>Capacity: {totalCapacity} people</span>
              <span>From: €{minSpend}</span>
              <span className={isAvailable ? 'status-available' : 'status-full'}>
                {isAvailable ? '● Available' : '● Full'}
              </span>
            </div>
          </div>
        </div>
      )}
    </button>
  );
};