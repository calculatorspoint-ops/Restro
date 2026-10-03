import React from 'react';
import { AssetModuleView } from '../components/assets/AssetModuleView';

export const FurniturePage: React.FC = () => {
  return (
    <AssetModuleView
      category="furniture"
      moduleTitle="Furniture & Fixtures Inventory"
      moduleDescription="Management of dining tables, upholstered chairs, banquette booths, billing counters, and storage millwork"
      supportedSubcategories={[
        'Dining Tables',
        'Dining Chairs',
        'Bar Seating',
        'Banquette Booths & Sofas',
        'Counter & Reception',
        'Service Stations & Waiter Credenza',
        'Storage Shelving & Cabinets',
        'Outdoor Furniture',
        'Decorative Millwork & Mirrors'
      ]}
      showFurnitureFields={true}
    />
  );
};
