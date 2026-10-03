import React from 'react';
import { AssetModuleView } from '../components/assets/AssetModuleView';

export const ElectricalLightingPage: React.FC = () => {
  return (
    <AssetModuleView
      category="electrical"
      moduleTitle="Electrical & Lighting Inventory"
      moduleDescription="Detailed register of installed LED lights, downlights, pendants, DB panels, switches, breakers, and wiring"
      supportedSubcategories={[
        'Architectural Downlights',
        'Decorative Pendants',
        'Track Spotlights',
        'Emergency Systems',
        'Electrical Distribution Board',
        'Breakers & Sockets',
        'Ventilation & Fans',
        'Transformers & UPS',
        'Backup Generators',
        'Other Electrical'
      ]}
      showWattage={true}
    />
  );
};
