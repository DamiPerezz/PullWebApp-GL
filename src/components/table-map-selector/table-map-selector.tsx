// table-map-selector.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { VIPTable } from '../../types/types';
import { ZoneMarker } from '../zone-marker/zone-marker';
import mapImage from '../../assets/map.png';
import './table-map-selector.css';

interface TableMapSelectorProps {
  tables: VIPTable[];
  selectedTable: VIPTable | null;
  onSelect: (table: VIPTable) => void;
}

interface ZoneData {
  zone: string;
  zoneType: 'vip-premium' | 'vip' | 'standard';
  tables: VIPTable[];
  availableCount: number;
  totalCapacity: number;
  minSpend: number;
  position: { left: string; top: string };
}

// Posiciones fijas para cada zona
const ZONE_POSITIONS: Record<string, { left: string; top: string }> = {
  'VIP Premium': { left: '10%', top: '55%' },
  'VIP': { left: '90%', top: '47%' },
  'Standard': { left: '55%', top: '47%' },
};

// Función para determinar el tipo de zona basándose en el nombre
const getZoneTypeFromName = (zoneName: string): 'vip-premium' | 'vip' | 'standard' => {
  const lowerName = zoneName.toLowerCase();

  if (lowerName.includes('premium')) {
    return 'vip-premium';
  } else if (lowerName.includes('vip')) {
    return 'vip';
  } else {
    return 'standard';
  }
};

export const TableMapSelector = ({ tables, selectedTable, onSelect }: TableMapSelectorProps) => {
  const { t } = useTranslation('common');
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // Agrupar mesas por zona
  const zones: ZoneData[] = Array.from(new Set(tables.map(t => t.zone))).map(zoneName => {
    const zoneTables = tables.filter(t => t.zone === zoneName);
    const availableTables = zoneTables.filter(t => t.is_available);

    const position = ZONE_POSITIONS[zoneName] || { left: '50%', top: '50%' };

    // Determinar el tipo desde el nombre de la zona
    const zoneType = getZoneTypeFromName(zoneName);

    return {
      zone: zoneName,
      zoneType: zoneType,
      tables: zoneTables,
      availableCount: availableTables.length,
      totalCapacity: zoneTables.reduce((sum, t) => sum + t.capacity, 0),
      minSpend: Math.min(...zoneTables.map(t => t.min_spend)),
      position
    };
  });

  const handleZoneClick = (zoneData: ZoneData) => {
    const availableTable = zoneData.tables.find(t => t.is_available);
    if (availableTable) {
      onSelect(availableTable);
    }
  };

  return (
    <div className="table-map-container">
      <div className="table-map-visual">
        <img
          src={mapImage}
          alt="Venue Map"
          className="table-map-background"
        />
        <div className="table-map-overlay" />

        {zones.map((zoneData) => {
          const isSelected = selectedTable && zoneData.tables.some(t => t.id === selectedTable.id);
          const isAvailable = zoneData.availableCount > 0;

          return (
            <ZoneMarker
              key={zoneData.zone}
              zoneName={zoneData.zone}
              availableCount={zoneData.availableCount}
              totalTables={zoneData.tables.length}
              totalCapacity={zoneData.totalCapacity}
              minSpend={zoneData.minSpend}
              isSelected={!!isSelected}
              isAvailable={isAvailable}
              isHovered={hoveredZone === zoneData.zone}
              zoneType={zoneData.zoneType}
              position={zoneData.position}
              onClick={() => handleZoneClick(zoneData)}
              onMouseEnter={() => setHoveredZone(zoneData.zone)}
              onMouseLeave={() => setHoveredZone(null)}
            />
          );
        })}
      </div>

      <div className="table-map-legend">
        <div className="table-map-legend-item">
          <div className="table-map-legend-color vip-premium"></div>
          <span>{t('zones.vipPremium')}</span>
        </div>
        <div className="table-map-legend-item">
          <div className="table-map-legend-color vip"></div>
          <span>{t('zones.vip')}</span>
        </div>
        <div className="table-map-legend-item">
          <div className="table-map-legend-color standard"></div>
          <span>{t('zones.standard')}</span>
        </div>
      </div>
    </div>
  );
};
