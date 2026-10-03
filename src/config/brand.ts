/**
 * Centralized Brand Configuration for MK Innovexa & RestoSetup ERP
 * 
 * Hierarchy:
 * MK Innovexa (Parent Company)
 *  └── RestoSetup ERP (Product / Application)
 */

export interface BrandConfig {
  companyName: string;
  companyLegalName: string;
  companyWebsite: string;
  companyTagline: string;
  productName: string;
  productShortName: string;
  productTagline: string;
  productDescription: string;
  copyrightYear: number;
  copyrightNotice: string;
  poweredByNotice: string;
  supportEmail: string;
  version: string;
  browserTitle: string;
}

const getEnvVar = (key: string, fallback: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch {
    // Fallthrough to process.env
  }
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key]!;
    }
  } catch {
    // Fallthrough to default
  }
  return fallback;
};

const companyName = getEnvVar('VITE_COMPANY_NAME', 'MK Innovexa');
const productName = getEnvVar('VITE_APP_NAME', 'RestoSetup ERP');

export const BRAND: BrandConfig = {
  companyName,
  companyLegalName: 'MK Innovexa',
  companyWebsite: 'https://mkinnovexa.com',
  companyTagline: 'Engineering Next-Gen Commercial Systems & Enterprise ERPs',
  productName,
  productShortName: 'RestoSetup',
  productTagline: 'Restaurant Branch Setup, Costing & Asset Management ERP',
  productDescription: 'Enterprise Restaurant Branch Setup, Construction Costing, Equipment Inventory and Asset Management System.',
  copyrightYear: 2026,
  copyrightNotice: `© 2026 ${companyName}. All rights reserved.`,
  poweredByNotice: `Powered by ${companyName}`,
  supportEmail: 'support@mkinnovexa.com',
  version: 'v2.4.0-enterprise',
  browserTitle: `${productName} — ${companyName}`
};
