import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Sidebar, NavSection } from './components/layout/Sidebar';
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

const MainLayout: React.FC = () => {
  const { isAuthenticated, authLoading } = useAuth();
  const { loading, error, notification, clearNotification } = useData();

  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [alertsDrawerOpen, setAlertsDrawerOpen] = useState(false);

  if (authLoading) {
    return <LoadingScreen message="Initializing session and database access..." />;
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

  const renderActivePage = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardPage onNavigate={(sec) => setActiveSection(sec)} />;
      case 'branches':
        return <BranchesPage onNavigateToBranchDetail={() => setActiveSection('handover')} />;
      case 'projects':
        return <ProjectsPage />;
      case 'construction':
        return <ConstructionCostingPage />;
      case 'electrical':
        return <ElectricalLightingPage />;
      case 'hvac':
        return <HvacAcPage />;
      case 'furniture':
        return <FurniturePage />;
      case 'kitchen':
        return <KitchenEquipmentPage />;
      case 'it_pos':
        return <ItPosPage />;
      case 'general_assets':
        return <GeneralAssetRegisterPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'recipes':
        return <RecipesMenuCostingPage />;
      case 'purchases':
        return <PurchasesPage />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'handover':
        return <HandoverReportPage />;
      case 'branded_docs':
        return <BrandedDocumentsPage />;
      case 'locations':
        return <LocationRecordsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'excel':
        return <ExcelCenterPage />;
      case 'users':
        return <UsersPage />;
      case 'settings':
        return <SettingsPage />;
      case 'audit':
        return <AuditLogPage />;
      default:
        return <DashboardPage onNavigate={(sec) => setActiveSection(sec)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={(sec) => setActiveSection(sec)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          onToggleMobile={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onOpenAlerts={() => setAlertsDrawerOpen(true)}
          title={getSectionTitle(activeSection)}
          subtitle={getSectionSubtitle(activeSection)}
        />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20 lg:pb-8">
          {renderActivePage()}
        </main>

        <Footer />

        {/* Mobile Bottom Navigation Bar (1-hand thumb operation) */}
        <MobileBottomNav
          activeSection={activeSection}
          onSelectSection={(sec) => setActiveSection(sec)}
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
          setActiveSection(modMap[mod] || 'dashboard');
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
    <AuthProvider>
      <DataProvider>
        <MainLayout />
      </DataProvider>
    </AuthProvider>
  );
}
