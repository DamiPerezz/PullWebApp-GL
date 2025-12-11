// zone-marker.tsx
import type { ZoneType } from '../../types/types';

interface ZoneMarkerProps {
  zoneName: string;
  availableCount: number;
  totalTables: number;
  totalCapacity: number;
  minSpend: number;
  isSelected: boolean;
  isAvailable: boolean;
  isHovered: boolean;
  zoneType: ZoneType;
  position: { left: string; top: string };
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const ZoneMarker = ({
  zoneName,
  availableCount,
  totalTables,
  minSpend,
  isSelected,
  isAvailable,
  isHovered,
  zoneType,
  position,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: ZoneMarkerProps) => {
  const getZoneColor = () => {
    switch (zoneType) {
      case 'vip-premium':
        return { border: 'rgb(236, 72, 153)', background: 'rgba(236, 72, 153, 0.2)' };
      case 'vip':
        return { border: 'rgb(139, 92, 246)', background: 'rgba(139, 92, 246, 0.2)' };
      default:
        return { border: 'rgb(59, 130, 246)', background: 'rgba(59, 130, 246, 0.2)' };
    }
  };

  const colors = getZoneColor();

  return (
    <div
      className={`zone-marker ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${!isAvailable ? 'unavailable' : ''}`}
      style={{
        position: 'absolute',
        left: position.left,
        top: position.top,
        transform: 'translate(-50%, -50%)',
        padding: '12px 16px',
        borderRadius: '12px',
        border: `2px solid ${colors.border}`,
        backgroundColor: colors.background,
        cursor: isAvailable ? 'pointer' : 'not-allowed',
        opacity: isAvailable ? 1 : 0.5,
        transition: 'all 0.2s ease',
      }}
      onClick={isAvailable ? onClick : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div style={{ fontWeight: 'bold', color: 'white', fontSize: '14px' }}>{zoneName}</div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
        {availableCount}/{totalTables} available
      </div>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
        Min: Q{minSpend}
      </div>
    </div>
  );
};
