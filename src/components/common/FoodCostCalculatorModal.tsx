import React, { useState, useEffect, useCallback } from 'react';
import {
  Calculator,
  X,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Percent,
  Sparkles,
  ArrowRightLeft,
  ChevronDown
} from 'lucide-react';
import { BRAND } from '../../config/brand';

interface FoodCostCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
  initialCost?: number;
  initialPrice?: number;
  onApplyPrice?: (price: number) => void;
}

export const FoodCostCalculatorModal: React.FC<FoodCostCalculatorModalProps> = ({
  isOpen,
  onClose,
  currencySymbol = 'Rs.',
  initialCost = 350,
  initialPrice = 1200,
  onApplyPrice
}) => {
  const [costInput, setCostInput] = useState<string>(String(initialCost));
  const [packagingInput, setPackagingInput] = useState<string>('30');
  const [overheadInput, setOverheadInput] = useState<string>('50');
  const [activeField, setActiveField] = useState<'cost' | 'price' | 'packaging' | 'overhead'>('cost');
  const [targetCostPercent, setTargetCostPercent] = useState<number>(30);
  const [sellingPriceInput, setSellingPriceInput] = useState<string>(String(initialPrice));
  const [includeGst, setIncludeGst] = useState<boolean>(false);
  const gstRate = 0.16; // 16% GST

  useEffect(() => {
    if (isOpen) {
      const nextCost = String(initialCost || 350);
      const nextPrice = String(initialPrice || 1200);
      setCostInput((prev) => (prev === nextCost ? prev : nextCost));
      setSellingPriceInput((prev) => (prev === nextPrice ? prev : nextPrice));
    }
  }, [isOpen, initialCost, initialPrice]);

  // Numeric parsing
  const rawCost = Math.max(0, parseFloat(costInput) || 0);
  const packaging = Math.max(0, parseFloat(packagingInput) || 0);
  const overhead = Math.max(0, parseFloat(overheadInput) || 0);
  const totalCost = rawCost + packaging + overhead;
  const sellingPrice = Math.max(0, parseFloat(sellingPriceInput) || 0);

  // Calculations
  const calculatedFoodCostPct = sellingPrice > 0 ? (totalCost / sellingPrice) * 100 : 0;
  const grossProfit = Math.max(0, sellingPrice - totalCost);
  const grossMarginPct = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;
  const markupMultiplier = totalCost > 0 ? (sellingPrice / totalCost).toFixed(2) : '0.00';
  const priceWithGst = Math.round(sellingPrice * (1 + gstRate));

  // Keypad button press handler
  const handleKeypadPress = useCallback((val: string) => {
    const updateVal = (current: string) => {
      if (val === 'C') return '0';
      if (val === 'BACK') return current.length > 1 ? current.slice(0, -1) : '0';
      if (val === '.') return current.includes('.') ? current : current + '.';
      if (current === '0') return val;
      // Prevent excessively long inputs
      if (current.length >= 8) return current;
      return current + val;
    };

    if (activeField === 'cost') setCostInput(prev => updateVal(prev));
    else if (activeField === 'price') setSellingPriceInput(prev => updateVal(prev));
    else if (activeField === 'packaging') setPackagingInput(prev => updateVal(prev));
    else if (activeField === 'overhead') setOverheadInput(prev => updateVal(prev));
  }, [activeField]);

  // Support Desktop Keyboard input
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleKeypadPress(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        handleKeypadPress('.');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeypadPress('BACK');
      } else if (e.key?.toLowerCase() === 'c') {
        e.preventDefault();
        handleKeypadPress('C');
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const fields: ('cost' | 'price' | 'packaging' | 'overhead')[] = ['cost', 'price', 'packaging', 'overhead'];
        const nextIndex = (fields.indexOf(activeField) + 1) % fields.length;
        setActiveField(fields[nextIndex]);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (onApplyPrice) {
          onApplyPrice(sellingPrice);
          onClose();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeField, handleKeypadPress, onClose, onApplyPrice, sellingPrice]);

  if (!isOpen) return null;

  // Status classification
  const getMarginStatus = () => {
    if (calculatedFoodCostPct <= 28) return { label: 'Optimal Margin', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (calculatedFoodCostPct <= 34) return { label: 'Industry Standard', color: 'text-sky-700 bg-sky-50 border-sky-200' };
    if (calculatedFoodCostPct <= 38) return { label: 'Moderate Warning', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'High Food Cost', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  const status = getMarginStatus();

  const applyPresetTarget = (percent: number) => {
    setTargetCostPercent(percent);
    const newPrice = Math.round(totalCost / (percent / 100));
    setSellingPriceInput(String(newPrice));
  };

  const applyMarkup = (multiplier: number) => {
    const newPrice = Math.round(totalCost * multiplier);
    setSellingPriceInput(String(newPrice));
  };

  const roundToNearest = (increment: number) => {
    const rounded = Math.round(sellingPrice / increment) * increment;
    setSellingPriceInput(String(rounded));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[94dvh] sm:max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="p-3.5 sm:p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                Food Cost & Margin Calculator
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {BRAND.companyName} Culinary Engine
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg active:bg-slate-800 transition-colors"
            aria-label="Close calculator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Calculator Body */}
        <div className="p-3 sm:p-4 space-y-3.5 overflow-y-auto flex-1 overscroll-contain">
          {/* Key Output HUD Display */}
          <div className="p-3 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
                Live Margin Analysis
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${status.color}`}>
                {status.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 sm:p-2.5 bg-slate-800/80 rounded-lg">
                <span className="text-[10px] text-slate-400 block mb-0.5">Food Cost Ratio</span>
                <span className="text-lg sm:text-xl font-bold font-mono text-emerald-400 tabular-nums">
                  {calculatedFoodCostPct.toFixed(1)}%
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Target: {targetCostPercent}%</span>
              </div>

              <div className="p-2 sm:p-2.5 bg-slate-800/80 rounded-lg">
                <span className="text-[10px] text-slate-400 block mb-0.5">Gross Profit</span>
                <span className="text-lg sm:text-xl font-bold font-mono text-white tabular-nums">
                  {currencySymbol} {grossProfit.toLocaleString('en-PK')}
                </span>
                <span className="text-[9px] text-emerald-400 block mt-0.5">({grossMarginPct.toFixed(1)}% margin)</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-[10px] sm:text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 px-0.5 font-mono gap-1">
              <span>Markup: <strong className="text-white">{markupMultiplier}x</strong></span>
              <span>Total Cost: <strong className="text-white">{currencySymbol} {totalCost}</strong></span>
              {includeGst && (
                <span className="text-emerald-400">Incl 16% GST: <strong>{currencySymbol} {priceWithGst}</strong></span>
              )}
            </div>
          </div>

          {/* Quick Target Food Cost Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-700">
                Target Food Cost %:
              </label>
              <button
                type="button"
                onClick={() => setIncludeGst(!includeGst)}
                className={`text-[10px] px-2 py-0.5 rounded-sm font-medium border transition-colors ${
                  includeGst ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {includeGst ? '✓ 16% GST Included' : '+ 16% GST'}
              </button>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[25, 28, 30, 33, 35].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => applyPresetTarget(pct)}
                  className={`min-h-[40px] py-1.5 text-xs font-bold rounded-lg border transition-all active:scale-95 ${
                    targetCostPercent === pct
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 active:bg-slate-200'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Cost Inputs with Thumb-friendly Focus */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Select Field to Key In
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                (Keyboard 0-9, Backspace, Tab supported)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveField('cost')}
                className={`p-2 sm:p-2.5 rounded-lg border text-left cursor-pointer transition-all active:scale-[0.98] ${
                  activeField === 'cost'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                }`}
              >
                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-semibold block">
                  Raw Ingredients
                </span>
                <div className="text-sm sm:text-base font-bold font-mono text-slate-900 mt-0.5">
                  {currencySymbol} {costInput || '0'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveField('price')}
                className={`p-2 sm:p-2.5 rounded-lg border text-left cursor-pointer transition-all active:scale-[0.98] ${
                  activeField === 'price'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                }`}
              >
                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-semibold block">
                  Menu Selling Price
                </span>
                <div className="text-sm sm:text-base font-bold font-mono text-slate-900 mt-0.5">
                  {currencySymbol} {sellingPriceInput || '0'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveField('packaging')}
                className={`p-2 rounded-lg border text-left cursor-pointer transition-all active:scale-[0.98] ${
                  activeField === 'packaging'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                }`}
              >
                <span className="text-[9px] text-slate-500 uppercase font-semibold block">
                  Packaging Box
                </span>
                <div className="text-xs sm:text-sm font-bold font-mono text-slate-800 mt-0.5">
                  {currencySymbol} {packagingInput || '0'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveField('overhead')}
                className={`p-2 rounded-lg border text-left cursor-pointer transition-all active:scale-[0.98] ${
                  activeField === 'overhead'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                }`}
              >
                <span className="text-[9px] text-slate-500 uppercase font-semibold block">
                  Gas/Power Overhead
                </span>
                <div className="text-xs sm:text-sm font-bold font-mono text-slate-800 mt-0.5">
                  {currencySymbol} {overheadInput || '0'}
                </div>
              </button>
            </div>
          </div>

          {/* Quick Scientific / Multiplier Shortcuts Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="text-[10px] font-semibold text-slate-500 shrink-0">Quick Multiplier:</span>
            {[2.5, 3.0, 3.3, 3.5].map((mult) => (
              <button
                key={mult}
                type="button"
                onClick={() => applyMarkup(mult)}
                className="min-h-[32px] px-2 py-1 text-[11px] font-semibold rounded-md border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active:bg-emerald-50 active:border-emerald-300 shrink-0"
              >
                {mult}x
              </button>
            ))}
            <button
              type="button"
              onClick={() => roundToNearest(50)}
              className="min-h-[32px] px-2 py-1 text-[11px] font-semibold rounded-md border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active:bg-emerald-50 active:border-emerald-300 shrink-0"
              title="Round selling price to nearest 50 PKR"
            >
              Round Rs.50
            </button>
          </div>

          {/* Large Mobile Numeric Touch Keypad */}
          <div className="bg-slate-100/80 p-2 sm:p-2.5 rounded-xl border border-slate-200/80 select-none">
            <div className="text-[10px] font-semibold text-slate-500 uppercase text-center mb-1.5 flex items-center justify-center gap-1">
              <span>Editing:</span>
              <strong className="text-emerald-700 uppercase bg-emerald-50 px-1.5 py-0.2 rounded-xs border border-emerald-200">
                {activeField}
              </strong>
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'BACK'].map((key) => {
                const isClear = key === 'C';
                const isBack = key === 'BACK';

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeypadPress(key)}
                    className={`min-h-[48px] rounded-lg text-base sm:text-lg font-bold shadow-xs transition-transform active:scale-95 flex items-center justify-center select-none ${
                      isClear
                        ? 'bg-rose-50 border border-rose-200 text-rose-700 active:bg-rose-100'
                        : isBack
                        ? 'bg-amber-50 border border-amber-200 text-amber-800 active:bg-amber-100'
                        : 'bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 active:bg-emerald-100 active:border-emerald-400 active:text-emerald-900'
                    }`}
                  >
                    {isBack ? '⌫' : key}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions with Easy Thumb Reach */}
        <div className="p-3 sm:p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setCostInput('350');
              setPackagingInput('30');
              setOverheadInput('50');
              setSellingPriceInput('1200');
            }}
            className="min-h-[44px] px-3.5 text-xs font-semibold text-slate-600 hover:text-slate-900 active:bg-slate-100 rounded-lg border border-slate-300 bg-white flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {onApplyPrice ? (
            <button
              type="button"
              onClick={() => {
                onApplyPrice(sellingPrice);
                onClose();
              }}
              className="min-h-[44px] px-4 sm:px-6 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Price ({currencySymbol} {sellingPrice})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-6 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-lg shadow-sm"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
