import React from 'react';
import { AssetModuleView } from '../components/assets/AssetModuleView';

export const KitchenEquipmentPage: React.FC = () => {
  return (
    <AssetModuleView
      category="kitchen"
      moduleTitle="Commercial Kitchen Equipment"
      moduleDescription="Register of cooking ranges, deep fryers, combi ovens, upright chillers, exhaust canopies, and stainless steel fabrication"
      supportedSubcategories={[
        'Cooking Equipment',
        'Frying Equipment',
        'Refrigeration & Freezers',
        'Combi & Bakery Ovens',
        'Stainless Steel Fabrication',
        'Dishwashing & Sanitizing',
        'Food Prep Machines',
        'Coffee & Beverage Equipment',
        'Exhaust Hood & Canopies'
      ]}
      showKitchenFields={true}
    />
  );
};
