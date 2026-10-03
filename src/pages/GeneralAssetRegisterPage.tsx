import React from 'react';
import { AssetModuleView } from '../components/assets/AssetModuleView';

export const GeneralAssetRegisterPage: React.FC = () => {
  return (
    <AssetModuleView
      category="all"
      moduleTitle="Centralized Asset Register"
      moduleDescription="Comprehensive master registry indexing all physical restaurant assets across Electrical, HVAC, Furniture, Kitchen, IT/POS, and General equipment"
      supportedSubcategories={[
        'Architectural Downlights',
        'Cassette AC',
        'Dining Tables',
        'Dining Chairs',
        'Cooking Equipment',
        'Refrigeration',
        'POS Terminals',
        'Security Surveillance',
        'General Assets'
      ]}
      showWattage={true}
      showHvacFields={true}
      showFurnitureFields={true}
      showItFields={true}
    />
  );
};
