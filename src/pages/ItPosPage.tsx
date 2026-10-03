import React from 'react';
import { AssetModuleView } from '../components/assets/AssetModuleView';

export const ItPosPage: React.FC = () => {
  return (
    <AssetModuleView
      category="it_pos"
      moduleTitle="IT & POS Equipment Registry"
      moduleDescription="Management of touch POS billing terminals, thermal receipt printers, cash drawers, CCTV surveillance, routers, and network switches"
      supportedSubcategories={[
        'POS Terminals',
        'Printers & KOT Hardware',
        'Cash Drawers & Scanners',
        'Security Surveillance',
        'Networking & Wi-Fi',
        'Office Computers & Tablets',
        'Sound & Audio System',
        'UPS & Power Backup'
      ]}
      showItFields={true}
    />
  );
};
