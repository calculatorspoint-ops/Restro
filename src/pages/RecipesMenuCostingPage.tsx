import React, { useState, useMemo } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  Percent,
  Clock,
  Trash2,
  Edit2,
  ChevronDown,
  Layers,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Calculator
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Recipe, RecipeIngredient } from '../types';
import { FoodCostCalculatorModal } from '../components/common/FoodCostCalculatorModal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';

export const RecipesMenuCostingPage: React.FC = () => {
  const { recipes, saveRecipe, deleteRecipe, inventory, settings, branches } = useData();
  const { canDeleteRecords, isManager } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');
  const [selectedRecipeForView, setSelectedRecipeForView] = useState<Recipe | null>(null);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Partial<Recipe> | null>(null);
  const [deleteModalRecipe, setDeleteModalRecipe] = useState<Recipe | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form state
  const [recipeCode, setRecipeCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Recipe['category']>('Mains');
  const [portionYield, setPortionYield] = useState(1);
  const [yieldUnit, setYieldUnit] = useState('serving');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(10);
  const [cookTimeMinutes, setCookTimeMinutes] = useState(10);
  const [packagingCost, setPackagingCost] = useState(25);
  const [overheadCost, setOverheadCost] = useState(50);
  const [targetFoodCostPercent, setTargetFoodCostPercent] = useState(30);
  const [sellingPrice, setSellingPrice] = useState(1200);
  const [instructions, setInstructions] = useState('');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  // Computed summary metrics
  const stats = useMemo(() => {
    const totalRecipes = recipes.length;
    if (totalRecipes === 0) {
      return { totalRecipes: 0, avgFoodCostPct: 0, avgGrossMargin: 0, highCostCount: 0 };
    }
    const sumFoodCostPct = recipes.reduce((sum, r) => sum + (r.actualFoodCostPercent || 0), 0);
    const sumMargin = recipes.reduce((sum, r) => sum + (r.grossMarginPercent || 0), 0);
    const highCostCount = recipes.filter((r) => r.actualFoodCostPercent > 35).length;

    return {
      totalRecipes,
      avgFoodCostPct: (sumFoodCostPct / totalRecipes).toFixed(1),
      avgGrossMargin: (sumMargin / totalRecipes).toFixed(1),
      highCostCount
    };
  }, [recipes]);

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    const term = (searchTerm || '').toLowerCase();
    return recipes.filter((r) => {
      if (!r) return false;
      const matchSearch =
        String(r.name || '').toLowerCase().includes(term) ||
        String(r.recipeCode || '').toLowerCase().includes(term);
      const matchCat = selectedCategory === 'all' || r.category === selectedCategory;
      const branchList = Array.isArray(r.branchAvailability) ? r.branchAvailability : [];
      const matchBranch =
        selectedBranchFilter === 'all' ||
        branchList.includes('all') ||
        branchList.includes(selectedBranchFilter);
      return matchSearch && matchCat && matchBranch;
    });
  }, [recipes, searchTerm, selectedCategory, selectedBranchFilter]);

  // Calculate live ingredient costs
  const liveFoodCost = useMemo(() => {
    return ingredients.reduce((sum, ing) => sum + (Number(ing.totalCost) || 0), 0);
  }, [ingredients]);

  const liveTotalCostPerPortion = useMemo(() => {
    const yieldSafe = portionYield > 0 ? portionYield : 1;
    return (liveFoodCost + Number(packagingCost) + Number(overheadCost)) / yieldSafe;
  }, [liveFoodCost, packagingCost, overheadCost, portionYield]);

  const liveSuggestedPrice = useMemo(() => {
    const target = targetFoodCostPercent > 0 ? targetFoodCostPercent / 100 : 0.3;
    return Math.round(liveTotalCostPerPortion / target);
  }, [liveTotalCostPerPortion, targetFoodCostPercent]);

  const liveFoodCostPercent = useMemo(() => {
    if (sellingPrice <= 0) return 0;
    return ((liveTotalCostPerPortion / sellingPrice) * 100).toFixed(1);
  }, [liveTotalCostPerPortion, sellingPrice]);

  const liveGrossProfit = useMemo(() => {
    return sellingPrice - liveTotalCostPerPortion;
  }, [sellingPrice, liveTotalCostPerPortion]);

  const liveGrossMarginPercent = useMemo(() => {
    if (sellingPrice <= 0) return 0;
    return ((liveGrossProfit / sellingPrice) * 100).toFixed(1);
  }, [liveGrossProfit, sellingPrice]);

  const handleOpenAddModal = () => {
    setEditingRecipe(null);
    setRecipeCode(`RCP-${Date.now().toString().slice(-4)}`);
    setName('');
    setCategory('Mains');
    setPortionYield(1);
    setYieldUnit('serving');
    setPrepTimeMinutes(10);
    setCookTimeMinutes(10);
    setPackagingCost(25);
    setOverheadCost(50);
    setTargetFoodCostPercent(30);
    setSellingPrice(1200);
    setInstructions('');
    setIngredients([]);
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setRecipeCode(recipe.recipeCode);
    setName(recipe.name);
    setCategory(recipe.category);
    setPortionYield(recipe.portionYield);
    setYieldUnit(recipe.yieldUnit);
    setPrepTimeMinutes(recipe.prepTimeMinutes);
    setCookTimeMinutes(recipe.cookTimeMinutes);
    setPackagingCost(recipe.packagingCost);
    setOverheadCost(recipe.overheadCost);
    setTargetFoodCostPercent(recipe.targetFoodCostPercent);
    setSellingPrice(recipe.sellingPrice);
    setInstructions(recipe.instructions);
    setIngredients(recipe.ingredients || []);
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingRecipe(null);
    setSubmitError(null);
  };

  const handleAddIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      {
        itemName: '',
        quantity: 1,
        unit: 'kg',
        unitCost: 0,
        totalCost: 0
      }
    ]);
  };

  const handleIngredientChange = (
    index: number,
    field: keyof RecipeIngredient,
    value: any
  ) => {
    setIngredients((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      if (field === 'inventoryItemId' && value) {
        const inv = inventory.find((i) => i.id === value);
        if (inv) {
          item.itemName = inv.itemName;
          item.unitCost = inv.unitCost;
          item.unit = inv.unit;
        }
      }

      const q = Number(item.quantity) || 0;
      const uc = Number(item.unitCost) || 0;
      item.totalCost = Math.round(q * uc * 100) / 100;
      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const recipeData: Partial<Recipe> = {
        ...(editingRecipe ? { id: editingRecipe.id } : {}),
        recipeCode,
        name,
        category,
        portionYield,
        yieldUnit,
        prepTimeMinutes,
        cookTimeMinutes,
        ingredients,
        totalFoodCost: Math.round(liveFoodCost),
        packagingCost: Number(packagingCost),
        overheadCost: Number(overheadCost),
        totalCostPerPortion: Math.round(liveTotalCostPerPortion),
        suggestedSellingPrice: liveSuggestedPrice,
        sellingPrice: Number(sellingPrice),
        targetFoodCostPercent: Number(targetFoodCostPercent),
        actualFoodCostPercent: Number(liveFoodCostPercent),
        grossProfit: Math.round(liveGrossProfit),
        grossMarginPercent: Number(liveGrossMarginPercent),
        branchAvailability: ['all'],
        instructions,
        status: 'active'
      };

      await saveRecipe(recipeData);

      // Dialog automatically closes ONLY after Firestore mutation succeeds
      setIsModalOpen(false);
      setEditingRecipe(null);
    } catch (err: any) {
      console.error('Failed to save recipe:', err);
      const rawMsg = err?.message || String(err || '');
      if (
        rawMsg.includes('Missing or insufficient permissions') ||
        rawMsg.includes('permission-denied')
      ) {
        setSubmitError(
          'Permission Denied: Your account role is not authorized to edit recipe formulations.'
        );
      } else {
        setSubmitError(rawMsg && rawMsg.length < 160 ? rawMsg : 'Failed to save recipe formulation. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecipe = (recipe: Recipe) => {
    setDeleteModalRecipe(recipe);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
            <span>Recipe & Menu Costing (COGS)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Formulate culinary recipes, link raw materials to inventory SKUs, and monitor food cost % and gross profit margins.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsCalculatorOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[42px] text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors active:bg-slate-100"
          >
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span>Quick Calculator</span>
          </button>

          {isManager && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[42px] text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Recipe</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Standard Recipes</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalRecipes}</div>
          <span className="text-[11px] text-slate-400">Standardized menu items</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Avg Food Cost %</span>
            <Percent className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.avgFoodCostPct}%</div>
          <span className="text-[11px] text-emerald-600 font-medium">Target range: 28% – 32%</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Avg Gross Margin</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{stats.avgGrossMargin}%</div>
          <span className="text-[11px] text-slate-400">Contribution to store EBITDA</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">High Cost SKUs</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.highCostCount}</div>
          <span className="text-[11px] text-slate-400">&gt;35% food cost threshold</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by recipe name, code (e.g. RCP-BUR-01)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-hidden"
          >
            <option value="all">All Categories</option>
            <option value="Mains">Mains</option>
            <option value="Starters">Starters</option>
            <option value="Beverages">Beverages</option>
            <option value="Desserts">Desserts</option>
            <option value="Bakery">Bakery</option>
            <option value="Sauces & Bases">Sauces & Bases</option>
          </select>
        </div>

        <span className="text-xs text-slate-500">
          Showing <strong>{filteredRecipes.length}</strong> recipes
        </span>
      </div>

      {/* Recipe Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecipes.map((recipe) => {
          const isHighCost = recipe.actualFoodCostPercent > 35;
          const isOptimal = recipe.actualFoodCostPercent <= 30;

          return (
            <div
              key={recipe.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all overflow-hidden flex flex-col justify-between"
            >
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-slate-100 text-slate-600 font-semibold">
                    {recipe.recipeCode}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isOptimal
                        ? 'bg-emerald-100 text-emerald-800'
                        : isHighCost
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {recipe.actualFoodCostPercent}% Food Cost
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{recipe.name}</h3>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                  <span>{recipe.category}</span>
                  <span>•</span>
                  <span>Yield: {recipe.portionYield} {recipe.yieldUnit}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)}m
                  </span>
                </div>
              </div>

              {/* Cost & Margin Metrics */}
              <div className="p-4 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Ingredient Raw Cost:</span>
                  <span className="font-semibold text-slate-900">
                    {settings.currencySymbol} {recipe.totalFoodCost.toLocaleString('en-PK')}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Total Portion Cost (with pkg):</span>
                  <span className="font-semibold text-slate-900">
                    {settings.currencySymbol} {recipe.totalCostPerPortion.toLocaleString('en-PK')}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Selling Price:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {settings.currencySymbol} {recipe.sellingPrice.toLocaleString('en-PK')}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center">
                  <span className="text-[11px] text-slate-500 font-medium">Gross Profit:</span>
                  <div className="text-right">
                    <span className="font-bold text-emerald-700">
                      {settings.currencySymbol} {recipe.grossProfit.toLocaleString('en-PK')}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      ({recipe.grossMarginPercent}% margin)
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedRecipeForView(recipe)}
                  className="text-emerald-700 hover:text-emerald-800 font-semibold text-[11px] flex items-center gap-1"
                >
                  <span>View Recipe Card</span>
                  <ChevronDown className="w-3 h-3 -rotate-90" />
                </button>

                  <div className="flex items-center gap-1">
                    {isManager && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(recipe)}
                        className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-sm transition-colors cursor-pointer"
                        title="Edit recipe formulation"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDeleteRecords && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRecipe(recipe)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-sm transition-colors cursor-pointer"
                        title="Delete recipe (Managers only)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recipe Details Drawer / View Modal */}
      {selectedRecipeForView && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-950 text-white rounded-t-xl">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {selectedRecipeForView.recipeCode}
                </span>
                <h2 className="text-base font-bold text-white">{selectedRecipeForView.name}</h2>
              </div>
              <button
                onClick={() => setSelectedRecipeForView(null)}
                className="text-slate-400 hover:text-white p-1 rounded-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Recipe Meta */}
              <div className="grid grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Category</span>
                  <span className="font-bold text-slate-800">{selectedRecipeForView.category}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Portion Yield</span>
                  <span className="font-bold text-slate-800">
                    {selectedRecipeForView.portionYield} {selectedRecipeForView.yieldUnit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Selling Price</span>
                  <span className="font-bold text-slate-900">
                    {settings.currencySymbol} {selectedRecipeForView.sellingPrice.toLocaleString('en-PK')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Food Cost %</span>
                  <span className="font-bold text-emerald-600">{selectedRecipeForView.actualFoodCostPercent}%</span>
                </div>
              </div>

              {/* Ingredients Breakdown Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Ingredient Formulation & Inventory Cost Link
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 text-slate-600 text-left font-semibold">
                      <tr>
                        <th className="p-2.5">Item Name</th>
                        <th className="p-2.5 text-right">Quantity</th>
                        <th className="p-2.5 text-right">Unit Cost</th>
                        <th className="p-2.5 text-right">Total (PKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedRecipeForView.ingredients.map((ing, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-medium">{ing.itemName}</td>
                          <td className="p-2.5 text-right">
                            {ing.quantity} {ing.unit}
                          </td>
                          <td className="p-2.5 text-right">
                            {settings.currencySymbol} {ing.unitCost.toLocaleString('en-PK')}
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900">
                            {settings.currencySymbol} {ing.totalCost.toLocaleString('en-PK')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                      <tr>
                        <td colSpan={3} className="p-2.5 text-right">
                          Raw Food Cost:
                        </td>
                        <td className="p-2.5 text-right text-emerald-700">
                          {settings.currencySymbol} {selectedRecipeForView.totalFoodCost.toLocaleString('en-PK')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Preparation Steps */}
              {selectedRecipeForView.instructions && (
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Standard Kitchen SOP & Preparation Steps
                  </h4>
                  <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 whitespace-pre-line leading-relaxed border border-slate-200">
                    {selectedRecipeForView.instructions}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 rounded-b-xl">
              <button
                type="button"
                onClick={() => setSelectedRecipeForView(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Recipe Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-950 text-white rounded-t-xl">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
                <span>{editingRecipe ? 'Edit Recipe Formulation' : 'New Recipe Formulation'}</span>
              </h2>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white p-1 disabled:opacity-40 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="p-6 space-y-5">
              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div className="flex-1 font-medium leading-relaxed">{submitError}</div>
                </div>
              )}

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Recipe SKU Code</label>
                  <input
                    type="text"
                    required
                    value={recipeCode}
                    onChange={(e) => setRecipeCode(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md font-mono"
                    placeholder="RCP-BUR-01"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Recipe / Menu Item Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md font-medium"
                    placeholder="e.g. Signature Truffle Angus Cheeseburger"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md"
                  >
                    <option value="Mains">Mains</option>
                    <option value="Starters">Starters</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Sauces & Bases">Sauces & Bases</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Portion Yield</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={portionYield}
                    onChange={(e) => setPortionYield(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Yield Unit</label>
                  <input
                    type="text"
                    value={yieldUnit}
                    onChange={(e) => setYieldUnit(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md"
                    placeholder="serving, portion, batch"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Food Cost %</label>
                  <input
                    type="number"
                    min="10"
                    max="60"
                    value={targetFoodCostPercent}
                    onChange={(e) => setTargetFoodCostPercent(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              {/* Ingredients Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Recipe Ingredients (Raw Materials)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Ingredient</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {ingredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:items-center shadow-2xs"
                    >
                      {/* Ingredient selector or custom name */}
                      <div className="sm:col-span-4">
                        <label className="text-[10px] text-slate-400 font-semibold sm:hidden block mb-1">
                          Ingredient #{idx + 1}
                        </label>
                        <select
                          value={ing.inventoryItemId || ''}
                          onChange={(e) => handleIngredientChange(idx, 'inventoryItemId', e.target.value)}
                          className="w-full min-h-[38px] px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="">-- Custom Ingredient --</option>
                          {inventory.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              [SKU] {inv.itemName} ({inv.unit})
                            </option>
                          ))}
                        </select>
                        {!ing.inventoryItemId && (
                          <input
                            type="text"
                            placeholder="Enter ingredient name"
                            value={ing.itemName}
                            onChange={(e) => handleIngredientChange(idx, 'itemName', e.target.value)}
                            className="w-full mt-1.5 min-h-[38px] px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-emerald-500"
                          />
                        )}
                      </div>

                      {/* Quantity & Unit in responsive columns */}
                      <div className="grid grid-cols-2 sm:contents gap-2">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 font-semibold sm:hidden block mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            step="0.001"
                            placeholder="Qty"
                            value={ing.quantity}
                            onChange={(e) => handleIngredientChange(idx, 'quantity', Number(e.target.value))}
                            className="w-full min-h-[38px] px-2.5 py-1.5 text-xs border border-slate-300 rounded-md text-right bg-white font-mono"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 font-semibold sm:hidden block mb-1">
                            Unit
                          </label>
                          <input
                            type="text"
                            placeholder="Unit (kg/pcs)"
                            value={ing.unit}
                            onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                            className="w-full min-h-[38px] px-2.5 py-1.5 text-xs border border-slate-300 rounded-md text-center bg-white"
                          />
                        </div>
                      </div>

                      {/* Unit Cost, Line Total and Delete button */}
                      <div className="flex items-center justify-between sm:contents gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                        <div className="sm:col-span-2 w-36 sm:w-auto">
                          <label className="text-[10px] text-slate-400 font-semibold sm:hidden block mb-1">
                            Unit Cost (PKR)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Unit Cost"
                            value={ing.unitCost}
                            onChange={(e) => handleIngredientChange(idx, 'unitCost', Number(e.target.value))}
                            className="w-full min-h-[38px] px-2.5 py-1.5 text-xs border border-slate-300 rounded-md text-right bg-white font-mono"
                          />
                        </div>

                        <div className="sm:col-span-1 text-right font-bold text-slate-900 text-xs font-mono">
                          Rs.{Math.round(ing.totalCost)}
                        </div>

                        <div className="sm:col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(idx)}
                            className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center text-slate-400 hover:text-rose-600 active:bg-rose-50 rounded-md transition-colors"
                            aria-label="Remove ingredient"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {ingredients.length === 0 && (
                    <div className="p-4 text-center border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                      No ingredients added yet. Click &quot;Add Ingredient&quot; to build the recipe formulation.
                    </div>
                  )}
                </div>
              </div>

              {/* Costs & Pricing Live Box */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] text-emerald-800 uppercase font-semibold block">
                      Raw Food Cost
                    </span>
                    <span className="text-sm font-bold text-emerald-950">
                      {settings.currencySymbol} {Math.round(liveFoodCost).toLocaleString('en-PK')}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] text-emerald-800 uppercase font-semibold mb-1">
                      Packaging Cost
                    </label>
                    <input
                      type="number"
                      value={packagingCost}
                      onChange={(e) => setPackagingCost(Number(e.target.value))}
                      className="w-full px-2 py-1 text-xs border border-emerald-300 rounded-md bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-emerald-800 uppercase font-semibold mb-1">
                      Overhead Cost
                    </label>
                    <input
                      type="number"
                      value={overheadCost}
                      onChange={(e) => setOverheadCost(Number(e.target.value))}
                      className="w-full px-2 py-1 text-xs border border-emerald-300 rounded-md bg-white font-bold"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-emerald-800 uppercase font-semibold block">
                      Suggested Selling Price
                    </span>
                    <span className="text-sm font-bold text-emerald-950">
                      {settings.currencySymbol} {liveSuggestedPrice.toLocaleString('en-PK')}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-emerald-950">Selling Price:</label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(Number(e.target.value))}
                        className="w-32 px-2 py-1 text-sm font-bold border border-emerald-400 rounded-md bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold">
                    <span className="text-emerald-900">
                      Food Cost: <strong>{liveFoodCostPercent}%</strong>
                    </span>
                    <span className="text-emerald-900">
                      Gross Margin: <strong>{liveGrossMarginPercent}%</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Kitchen Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preparation SOP & Kitchen Execution Notes
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md leading-relaxed"
                  placeholder="Step-by-step instructions for hot line cooks, temperature requirements, presentation plating..."
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {isSubmitting
                      ? 'Saving...'
                      : editingRecipe
                      ? 'Update Recipe'
                      : 'Save to Cloud Firestore'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Recipe Modal */}
      {deleteModalRecipe && (
        <DeleteConfirmModal
          isOpen={!!deleteModalRecipe}
          onClose={() => setDeleteModalRecipe(null)}
          onConfirm={async () => {
            await deleteRecipe(deleteModalRecipe.id);
          }}
          title="Delete Recipe Formulation"
          message={`Are you sure you want to remove recipe '${deleteModalRecipe.name}'?`}
          itemName={`${deleteModalRecipe.recipeCode || 'RCP'} - ${deleteModalRecipe.name}`}
        />
      )}

      {/* Standalone Quick Food Cost & Margin Calculator Modal */}
      <FoodCostCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        currencySymbol={settings.currencySymbol}
        initialCost={liveFoodCost > 0 ? liveFoodCost : 350}
        initialPrice={sellingPrice > 0 ? sellingPrice : 1200}
        onApplyPrice={(price) => {
          setSellingPrice(price);
        }}
      />
    </div>
  );
};
