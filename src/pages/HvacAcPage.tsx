import React from 'react';
import { AssetModuleView } from '../components/assets/AssetModuleView';

export const HvacAcPage: React.FC = () => {
  return (
    <AssetModuleView
      category="hvac"
      moduleTitle="HVAC & Air Conditioning Management"
      moduleDescription="Track commercial cassette units, inverter splits, chillers, fresh air ducts, tonnage, and scheduled maintenance"
      supportedSubcategories={[
        'Cassette AC',
        'Inverter Split AC',
        'Floor Standing AC',
        'Ducted Fresh Air System',
        'Exhaust Extraction System',
        'Air Curtain',
        'Evaporative Cooler'
      ]}
      showHvacFields={true}
    />
  );
};
