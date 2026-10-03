import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Building,
  RefreshCw
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { EXCEL_TEMPLATES, downloadTemplate, parseExcelFile, exportToExcel } from '../utils/excel';

export const ExcelCenterPage: React.FC = () => {
  const { bulkImport, branches, selectedBranchId, settings, reloadState } = useData();
  const { currentUser } = useAuth();

  const [selectedModule, setSelectedModule] = useState<string>('inventory');
  const [selectedBranchForImport, setSelectedBranchForImport] = useState<string>(() => {
    return selectedBranchId !== 'all' ? selectedBranchId : branches[0]?.id || '';
  });

  // Import State
  const [parsedData, setParsedData] = useState<{ headers: string[]; rows: any[] } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsValidating(true);
    setValidationErrors([]);
    setImportSuccessMessage(null);

    try {
      const result = await parseExcelFile(file);
      const expectedTemplate = EXCEL_TEMPLATES[selectedModule];
      const errors: string[] = [];

      if (!result.rows || result.rows.length === 0) {
        errors.push('The uploaded Excel file does not contain any valid data rows.');
      } else {
        // Validate required columns
        const missingCols = expectedTemplate.columns.filter(
          (col) => !result.headers.some((h) => h.toLowerCase() === col.toLowerCase())
        );

        if (missingCols.length > 0) {
          errors.push(
            `Missing required column headers: [${missingCols.join(', ')}]. Please use the standardized template.`
          );
        }
      }

      setValidationErrors(errors);
      setParsedData(result);
    } catch (err: any) {
      setValidationErrors([`File read error: ${err.message || 'Corrupted Excel or CSV format'}`]);
      setParsedData(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedData || parsedData.rows.length === 0) return;
    setIsImporting(true);

    try {
      // Map collection name
      const collectionMap: Record<string, string> = {
        inventory: 'inventory',
        electrical: 'assets',
        lighting: 'assets',
        hvac: 'assets',
        furniture: 'assets',
        kitchen: 'assets',
        it_pos: 'assets',
        construction: 'constructionCosts',
        purchases: 'purchases',
        expenses: 'expenses'
      };

      const collectionName = collectionMap[selectedModule] || 'assets';

      // Attach current branch ID if missing
      const sanitizedRows = parsedData.rows.map((row) => ({
        ...row,
        branchId: row.branchId || selectedBranchForImport,
        category: row.category || selectedModule
      }));

      const count = await bulkImport(collectionName, sanitizedRows);
      setImportSuccessMessage(`Successfully imported ${count} records into ${selectedModule}!`);
      setParsedData(null);
      await reloadState();
    } catch (err: any) {
      setValidationErrors([`Import failed: ${err.message || 'Server error during processing'}`]);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-lg border border-slate-200">
        <h2 className="text-sm font-bold text-slate-900">
          Standardized Excel Import & Export Center
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Download standardized Excel templates, bulk-import existing restaurant inventory & equipment spreadsheets with automated validation, and export clean audit data.
        </p>
      </div>

      {/* Two Column Layout: Templates on Left, Import Tool on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Downloadable Templates */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Standardized Excel Templates (10 Modules)
          </div>

          <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 shadow-xs">
            {Object.entries(EXCEL_TEMPLATES).map(([key, template]) => (
              <div
                key={key}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    {template.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {template.filename} · {template.columns.length} columns
                  </div>
                </div>

                <button
                  onClick={() => downloadTemplate(key)}
                  className="px-2.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors flex items-center gap-1 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Template</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (7 cols): Import Wizard */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Bulk Upload & Sheet Validator
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your .xlsx spreadsheet. The engine will validate column headers and check row integrity before saving.
              </p>
            </div>

            {/* Target Module and Branch Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Target Import Module:
                </label>
                <select
                  value={selectedModule}
                  onChange={(e) => {
                    setSelectedModule(e.target.value);
                    setParsedData(null);
                    setValidationErrors([]);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-medium text-slate-900 focus:bg-white focus:outline-hidden"
                >
                  <option value="inventory">Master Inventory</option>
                  <option value="electrical">Electrical Items</option>
                  <option value="lighting">Lighting Fixtures</option>
                  <option value="hvac">HVAC / Air Conditioning</option>
                  <option value="furniture">Furniture & Fixtures</option>
                  <option value="kitchen">Kitchen Equipment</option>
                  <option value="it_pos">IT & POS Hardware</option>
                  <option value="construction">Construction Costing</option>
                  <option value="purchases">Purchases Register</option>
                  <option value="expenses">Operational Expenses</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Assign to Branch:
                </label>
                <select
                  value={selectedBranchForImport}
                  onChange={(e) => setSelectedBranchForImport(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md font-medium text-slate-900 focus:bg-white focus:outline-hidden"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} - {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* File Drag / Selector Box */}
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors bg-slate-50/50">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <label className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer block">
                <span>Select .xlsx / .csv spreadsheet file</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-400 mt-1">
                Standard Excel (.xlsx) file matching the {EXCEL_TEMPLATES[selectedModule]?.name} format
              </p>
            </div>

            {/* Success Banner */}
            {importSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{importSuccessMessage}</span>
              </div>
            )}

            {/* Errors Banner */}
            {validationErrors.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Validation Discrepancies Detected</span>
                </div>
                {validationErrors.map((err, i) => (
                  <p key={i} className="text-rose-700">{err}</p>
                ))}
              </div>
            )}

            {/* Preview Box */}
            {parsedData && parsedData.rows.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    Parsed Rows Preview ({parsedData.rows.length} rows detected)
                  </span>
                  <span className="text-emerald-600 font-medium">Ready for Import</span>
                </div>

                <div className="border border-slate-200 rounded-md overflow-x-auto max-h-56">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold sticky top-0">
                      <tr>
                        {parsedData.headers.slice(0, 6).map((h) => (
                          <th key={h} className="py-2 px-3 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedData.rows.slice(0, 5).map((row, idx) => (
                        <tr key={idx}>
                          {parsedData.headers.slice(0, 6).map((h) => (
                            <td key={h} className="py-2 px-3 whitespace-nowrap text-slate-700">
                              {String(row[h] || '-')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setParsedData(null)}
                    className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md border border-slate-300"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={isImporting || validationErrors.length > 0}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-md transition-colors flex items-center gap-1.5"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>{isImporting ? 'Processing Import...' : 'Confirm Bulk Import'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
