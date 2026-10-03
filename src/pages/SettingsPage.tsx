import React, { useState } from 'react';
import { Settings, Save, Download, CheckCircle2, Building, ShieldCheck, Mail, Globe } from 'lucide-react';
import { useData } from '../context/DataContext';
import { SystemSettings } from '../types';
import { BRAND } from '../config/brand';
import { MKInnovexaLogo } from '../components/brand/MKInnovexaLogo';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useData();

  const [formSettings, setFormSettings] = useState<SystemSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDownloadBackup = () => {
    window.open('/api/state', '_blank');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-lg border border-slate-200">
        <h2 className="text-sm font-bold text-slate-900">
          System & Organizational Settings
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure corporate branding, Pakistani Rupee currency formatting, sales tax rates, and maintenance threshold triggers.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>System configurations saved successfully.</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-6">
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
            1. Corporate Organization & Branding
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Company / Restaurant Group Name *
              </label>
              <input
                type="text"
                required
                value={formSettings.companyName || ''}
                onChange={(e) => setFormSettings({ ...formSettings, companyName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Corporate Tagline / Subtitle
              </label>
              <input
                type="text"
                value={formSettings.companyTagline || ''}
                onChange={(e) => setFormSettings({ ...formSettings, companyTagline: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
            2. Currency & Fiscal Parameters
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Base Currency Code
              </label>
              <input
                type="text"
                value={formSettings.currency || 'PKR'}
                onChange={(e) => setFormSettings({ ...formSettings, currency: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Currency Display Symbol
              </label>
              <input
                type="text"
                value={formSettings.currencySymbol || 'Rs.'}
                onChange={(e) => setFormSettings({ ...formSettings, currencySymbol: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                General Sales Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formSettings.taxRate ?? 16}
                onChange={(e) => setFormSettings({ ...formSettings, taxRate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                System Date Format
              </label>
              <select
                value={formSettings.dateFormat || 'DD-MM-YYYY'}
                onChange={(e) => setFormSettings({ ...formSettings, dateFormat: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-hidden"
              >
                <option value="DD-MM-YYYY">DD-MM-YYYY (Recommended standard)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
            3. Automated Operations Alert Thresholds
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                min="1"
                value={formSettings.lowStockThreshold ?? 10}
                onChange={(e) => setFormSettings({ ...formSettings, lowStockThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Warranty Expiry Alert (Days in advance)
              </label>
              <input
                type="number"
                min="7"
                value={formSettings.warrantyAlertDays ?? 60}
                onChange={(e) => setFormSettings({ ...formSettings, warrantyAlertDays: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                HVAC Maintenance Due Alert (Days)
              </label>
              <input
                type="number"
                min="3"
                value={formSettings.maintenanceAlertDays ?? 14}
                onChange={(e) => setFormSettings({ ...formSettings, maintenanceAlertDays: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save System Settings</span>
          </button>
        </div>
      </form>

      {/* Production Backup & Data Management */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Production Data Management & State Backup
        </h3>
        <p className="text-xs text-slate-500">
          Export full JSON snapshot of all branches, physical assets, construction milestones, purchases, and inventory records for off-site backup or archiving.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Download Database JSON Backup</span>
          </button>
        </div>
      </div>

      {/* MK Innovexa Enterprise Platform Information */}
      <div className="bg-slate-950 text-white p-6 rounded-xl border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <MKInnovexaLogo variant="monogram" theme="dark" size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white tracking-tight">{BRAND.companyName}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-emerald-950 text-emerald-400 border border-emerald-800/80 uppercase">
                  Parent Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{BRAND.companyTagline}</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 w-fit">
            {BRAND.version}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
            <div className="text-[10px] uppercase font-mono text-slate-400 tracking-wider mb-1">Product System</div>
            <div className="font-bold text-white">{BRAND.productName}</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">{BRAND.poweredByNotice}</div>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
            <div className="text-[10px] uppercase font-mono text-slate-400 tracking-wider mb-1">Engineering Support</div>
            <div className="font-bold text-white flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{BRAND.supportEmail}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Commercial SLA 24/7</div>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
            <div className="text-[10px] uppercase font-mono text-slate-400 tracking-wider mb-1">Intellectual Property</div>
            <div className="font-bold text-white">{BRAND.copyrightNotice}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Enterprise License Active</div>
          </div>
        </div>
      </div>
    </div>
  );
};
