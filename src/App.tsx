import React, { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Sidebar, NavSection, SECTION_TO_ROUTE } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AlertsDrawer } from './components/common/AlertsDrawer';
import { Toast } from './components/common/Toast';
import { Footer } from './components/layout/Footer';
import { LoadingScreen } from './components/common/LoadingScreen';
import { MobileBottomNav } from './components/layout/MobileBottomNav';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { BranchesPage } from './pages/BranchesPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ConstructionCostingPage } from './pages/ConstructionCostingPage';
import { ElectricalLightingPage } from './pages/ElectricalLightingPage';
import { HvacAcPage } from './pages/HvacAcPage';
import { FurniturePage } from './pages/FurniturePage';
import { KitchenEquipmentPage } from './pages/KitchenEquipmentPage';
import { ItPosPage } from './pages/ItPosPage';
import { GeneralAssetRegisterPage } from './pages/GeneralAssetRegisterPage';
import { InventoryPage } from './pages/InventoryPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { HandoverReportPage } from './pages/HandoverReportPage';
import { LocationRecordsPage } from './pages/LocationRecordsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ExcelCenterPage } from './pages/ExcelCenterPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { LoginPage } from './pages/LoginPage';
import { RecipesMenuCostingPage } from './pages/RecipesMenuCostingPage';
import { BrandedDocumentsPage } from './pages/BrandedDocumentsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './components/common/ProtectedRoute';

const ROUTE_TO_SECTION: Record<string, NavSection> = Object.entries(SECTION_TO_ROUTE).reduce(
  (acc, [sec, route]) => {
    acc[route] = sec as NavSection;
    return acc;
  },
  {} as Record<string, NavSection>
);

const MainLayout: React.FC = () => {
  const { isAuthenticated, authLoading } = useAuth();
  const { notification, clearNotification } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [alertsDrawerOpen, setAlertsDrawerOpen] = useState(false);

  const activeSection: NavSection = useMemo(() => {
    const currentPath = location.pathname.replace(/\/$/, '') || '/dashboard';
    return ROUTE_TO_SECTION[currentPath] || 'dashboard';
  }, [location.pathname]);

  if (authLoading) {
    return <LoadingScreen message="Preparing your workspace" stage="Verifying session" />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const getSectionTitle = (section: NavSection) => {
    switch (section) {
      case 'dashboard':
        return 'Executive Dashboard';
      case 'branches':
        return 'Branch Management';
      case 'projects':
        return 'Branch Setup Projects';
      case 'construction':
        return 'Building & Construction Costing';
      case 'electrical':
        return 'Electrical & Lighting Inventory';
      case 'hvac':
        return 'HVAC & Air Conditioning Management';
      case 'furniture':
        return 'Furniture & Fixtures';
      case 'kitchen':
        return 'Commercial Kitchen Equipment';
      case 'it_pos':
        return 'IT & Point of Sale (POS) Systems';
      case 'general_assets':
        return 'Central Asset Register';
      case 'inventory':
        return 'Inventory & Stock Management';
      case 'recipes':
        return 'Recipe & Menu Costing (COGS)';
      case 'purchases':
        return 'Purchase Orders & Invoices';
      case 'suppliers':
        return 'Suppliers & Vendors Directory';
      case 'expenses':
        return 'Operational Expense Vouchers';
      case 'handover':
        return 'Final Branch Handover Report';
      case 'branded_docs':
        return 'Branded Documents & PDF Export';
      case 'locations':
        return 'Location & Room Inventory';
      case 'reports':
        return 'Executive Management Reports';
      case 'excel':
        return 'Excel Import & Export Center';
      case 'users':
        return 'User Roles & Access Control';
      case 'settings':
        return 'System & Organization Settings';
      case 'audit':
        return 'System Audit Trail Log';
      default:
        return 'RestoSetup ERP';
    }
  };

  const getSectionSubtitle = (section: NavSection) => {
    switch (section) {
      case 'dashboard':
        return 'Real-time multi-branch capital expenditure, equipment status, and budget variance';
      case 'electrical':
        return 'Detailed specification of installed lights, downlights, wattage, DB boards, and wiring';
      case 'hvac':
        return 'Cassette units, split ACs, tonnage, service logs, and cooling equipment';
      case 'handover':
        return 'Official handover certification with sign-off signatures and full fit-out cost audit';
      case 'construction':
        return 'Contractor milestones, civil blockwork, Italian porcelain flooring, and false ceilings';
      case 'excel':
        return 'Download standardized Excel templates and bulk import existing sheets with validation';
      case 'recipes':
        return 'Formulate culinary recipes, link ingredients to raw material inventory, and calculate food cost % and gross margin';
      case 'branded_docs':
        return 'Generate printable inspection sheets, contractor payment vouchers, and asset handover certificates';
      default:
        return undefined;
    }
  };

  const handleNavigateSection = (sec: NavSection) => {
    const route = SECTION_TO_ROUTE[sec] || `/${sec}`;
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex relative overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* Left Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={handleNavigateSection}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 z-10 relative">
        <Header
          onToggleMobile={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onOpenAlerts={() => setAlertsDrawerOpen(true)}
          title={getSectionTitle(activeSection)}
          subtitle={getSectionSubtitle(activeSection)}
        />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20 lg:pb-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage onNavigate={handleNavigateSection} />} />
            <Route path="/branches" element={<BranchesPage onNavigateToBranchDetail={() => navigate('/handover')} />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/construction" element={<ConstructionCostingPage />} />
            <Route path="/electrical" element={<ElectricalLightingPage />} />
            <Route path="/hvac" element={<HvacAcPage />} />
            <Route path="/furniture" element={<FurniturePage />} />
            <Route path="/kitchen" element={<KitchenEquipmentPage />} />
            <Route path="/it-pos" element={<ItPosPage />} />
            <Route path="/assets" element={<GeneralAssetRegisterPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/recipes" element={<RecipesMenuCostingPage />} />
            <Route path="/purchases" element={<PurchasesPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/handover" element={<HandoverReportPage />} />
            <Route path="/branded-docs" element={<BrandedDocumentsPage />} />
            <Route path="/locations" element={<LocationRecordsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/excel" element={<ProtectedRoute path="/excel"><ExcelCenterPage /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute path="/users"><UsersPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute path="/settings"><SettingsPage /></ProtectedRoute>} />
            <Route path="/audit" element={<ProtectedRoute path="/audit"><AuditLogPage /></ProtectedRoute>} />
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <Footer />

        {/* Mobile Bottom Navigation Bar (1-hand thumb operation) */}
        <MobileBottomNav
          activeSection={activeSection}
          onSelectSection={handleNavigateSection}
          onOpenMenu={() => setMobileSidebarOpen(true)}
        />
      </div>

      {/* Alerts Drawer */}
      <AlertsDrawer
        isOpen={alertsDrawerOpen}
        onClose={() => setAlertsDrawerOpen(false)}
        onNavigateToModule={(mod) => {
          const modMap: Record<string, NavSection> = {
            Inventory: 'inventory',
            Projects: 'projects',
            Maintenance: 'hvac',
            Purchases: 'purchases'
          };
          const target = modMap[mod] || 'dashboard';
          navigate(SECTION_TO_ROUTE[target] || `/${target}`);
        }}
      />

      {/* Floating Success / Error Notification Toast */}
      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onClose={clearNotification}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <MainLayout />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
