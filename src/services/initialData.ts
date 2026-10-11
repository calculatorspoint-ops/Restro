import {
  Branch,
  Project,
  LocationArea,
  ConstructionCost,
  Asset,
  InventoryItem,
  StockTransaction,
  PurchaseOrder,
  Supplier,
  Expense,
  SystemSettings,
  User,
  Recipe
} from '../types';

export const INITIAL_SETTINGS: SystemSettings = {
  companyName: "Royal Spice Hospitality Group",
  companyTagline: "Premium Multi-Branch Restaurant & Cafe Operations",
  currency: "PKR",
  currencySymbol: "Rs.",
  taxRate: 16,
  dateFormat: "DD-MM-YYYY",
  lowStockThreshold: 10,
  warrantyAlertDays: 60,
  maintenanceAlertDays: 14
};

export const INITIAL_USERS: User[] = [
  {
    id: "usr-masteradmin",
    name: "Muhammad Khurram",
    email: "muhammadkhurram@gmail.com",
    role: "super_manager",
    isMasterAdmin: true,
    assignedBranchIds: ["all"],
    phone: "+92 300 1234567",
    status: "active",
    createdAt: "2026-01-01T08:00:00.000Z"
  },
  {
    id: "usr-superadmin",
    name: "Muhammad Khurram (Director Operations)",
    email: "admin@restosetup.com",
    role: "super_manager",
    assignedBranchIds: ["all"],
    phone: "+92 300 1234567",
    status: "active",
    createdAt: "2026-01-10T10:00:00.000Z"
  },
  {
    id: "usr-manager1",
    name: "Tariq Mehmood (Project Manager)",
    email: "manager@restosetup.com",
    role: "manager",
    assignedBranchIds: ["br-khi-01", "br-lhr-02"],
    phone: "+92 321 9876543",
    status: "active",
    createdAt: "2026-01-15T11:00:00.000Z"
  },
  {
    id: "usr-staff1",
    name: "Bilal Ahmed (Site Inventory Supervisor)",
    email: "staff@restosetup.com",
    role: "staff",
    assignedBranchIds: ["br-khi-01"],
    phone: "+92 333 4567890",
    status: "active",
    createdAt: "2026-02-01T09:30:00.000Z"
  }
];

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: "br-khi-01",
    code: "KHI-01",
    name: "Clifton Gourmet Bistro & Grill",
    address: "Plot 14-C, Block 4, Clifton, Sea View Boulevard",
    city: "Karachi",
    province: "Sindh",
    contactNumber: "+92 21 35876543",
    branchManager: "Tariq Mehmood",
    openingDate: "2026-03-25",
    status: "Setup in Progress",
    notes: "Flagship 180-seat fine dining restaurant with outdoor terrace and dedicated commercial bakery.",
    createdAt: "2026-01-15T09:00:00.000Z",
    createdBy: "Muhammad Khurram",
    updatedAt: "2026-01-15T09:00:00.000Z",
    updatedBy: "Muhammad Khurram"
  },
  {
    id: "br-lhr-02",
    code: "LHR-02",
    name: "Gulberg Urban Cafe & Roastery",
    address: "94-B/2, M.M. Alam Road, Gulberg III",
    city: "Lahore",
    province: "Punjab",
    contactNumber: "+92 42 35789123",
    branchManager: "Hamza Siddiqui",
    openingDate: "2026-04-15",
    status: "Under Construction",
    notes: "Specialty coffee roastery and live artisanal bakery with 120 indoor seats and drive-thru counter.",
    createdAt: "2026-01-20T10:30:00.000Z",
    createdBy: "Muhammad Khurram",
    updatedAt: "2026-01-20T10:30:00.000Z",
    updatedBy: "Muhammad Khurram"
  },
  {
    id: "br-isb-03",
    code: "ISB-03",
    name: "F-7 Express Artisanal Kitchen",
    address: "Shop 4, Beverly Centre, Blue Area / F-7",
    city: "Islamabad",
    province: "ICT",
    contactNumber: "+92 51 2824567",
    branchManager: "Adnan Malik",
    openingDate: "2026-05-01",
    status: "Planning",
    notes: "High-density cloud kitchen and quick-service delivery hub catering to F-6, F-7, and Blue Area corporate.",
    createdAt: "2026-02-01T14:15:00.000Z",
    createdBy: "Muhammad Khurram",
    updatedAt: "2026-02-01T14:15:00.000Z",
    updatedBy: "Muhammad Khurram"
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj-khi-01",
    branchId: "br-khi-01",
    projectName: "Clifton Flagship Launch & Complete Fit-out",
    startDate: "2026-01-15",
    expectedCompletionDate: "2026-03-20",
    actualCompletionDate: "",
    projectManager: "Tariq Mehmood",
    status: "In Progress",
    estimatedBudget: 18500000,
    actualCost: 15420000,
    remainingBudget: 3080000,
    progressPercent: 82,
    notes: "Civil and flooring complete. Kitchen stainless steel exhaust and AC cassette installation underway.",
    createdAt: "2026-01-15T09:00:00.000Z",
    createdBy: "Muhammad Khurram",
    updatedAt: "2026-01-15T09:00:00.000Z",
    updatedBy: "Muhammad Khurram"
  },
  {
    id: "proj-lhr-02",
    branchId: "br-lhr-02",
    projectName: "Gulberg Roastery Interior & MEP Setup",
    startDate: "2026-02-01",
    expectedCompletionDate: "2026-04-10",
    actualCompletionDate: "",
    projectManager: "Hamza Siddiqui",
    status: "In Progress",
    estimatedBudget: 14000000,
    actualCost: 7850000,
    remainingBudget: 6150000,
    progressPercent: 55,
    notes: "Flooring tiles laid. Electrical wiring and HVAC ducting in progress.",
    createdAt: "2026-02-01T10:00:00.000Z",
    createdBy: "Muhammad Khurram",
    updatedAt: "2026-02-01T10:00:00.000Z",
    updatedBy: "Muhammad Khurram"
  }
];

export const INITIAL_LOCATIONS: LocationArea[] = [
  { id: "loc-khi-01", branchId: "br-khi-01", name: "Main Dining Hall", code: "MDH", description: "Ground floor main seating area" },
  { id: "loc-khi-02", branchId: "br-khi-01", name: "Commercial Hot Kitchen", code: "CHK", description: "Main cookline and preparation" },
  { id: "loc-khi-03", branchId: "br-khi-01", name: "Dry & Cold Storage", code: "STR", description: "Walk-in cold rooms and racking" },
  { id: "loc-khi-04", branchId: "br-khi-01", name: "Beverage & Espresso Bar", code: "BAR", description: "Front specialty beverage counter" },
  { id: "loc-khi-05", branchId: "br-khi-01", name: "Reception & Billing Counter", code: "REC", description: "Entrance host stand and POS" }
];

export const INITIAL_CONSTRUCTION: ConstructionCost[] = [
  {
    id: "cc-01",
    branchId: "br-khi-01",
    date: "2026-01-20",
    category: "Flooring",
    subcategory: "Porcelain Tiles",
    description: "Supply and laying of 60x120cm non-slip Italian porcelain floor tiles",
    workArea: "Main Dining Hall & Corridors",
    vendorContractor: "Al-Madina Tile Emporium",
    quantity: 3200,
    unit: "sqft",
    unitRate: 450,
    materialCost: 1440000,
    labourCost: 320000,
    otherCost: 50000,
    totalCost: 1810000,
    paymentStatus: "Paid",
    paidAmount: 1810000,
    invoiceRefNumber: "INV-AMT-2026-08",
    remarks: "Includes epoxy grouting and waterproofing",
    createdAt: "2026-01-20T10:00:00.000Z",
    createdBy: "Tariq Mehmood",
    updatedAt: "2026-01-20T10:00:00.000Z",
    updatedBy: "Tariq Mehmood"
  },
  {
    id: "cc-02",
    branchId: "br-khi-01",
    date: "2026-01-28",
    category: "Ceiling",
    subcategory: "Gypsum False Ceiling",
    description: "Multi-level moisture-resistant gypsum false ceiling with shadow line channels",
    workArea: "Main Dining & Private Rooms",
    vendorContractor: "Crescent Interiors",
    quantity: 2800,
    unit: "sqft",
    unitRate: 280,
    materialCost: 560000,
    labourCost: 224000,
    otherCost: 20000,
    totalCost: 804000,
    paymentStatus: "Paid",
    paidAmount: 804000,
    invoiceRefNumber: "INV-CI-2026-44",
    remarks: "Cutouts made for cassette ACs and downlights",
    createdAt: "2026-01-28T10:00:00.000Z",
    createdBy: "Tariq Mehmood",
    updatedAt: "2026-01-28T10:00:00.000Z",
    updatedBy: "Tariq Mehmood"
  }
];

export const INITIAL_ASSETS: Asset[] = [
  {
    id: "ast-khi-01",
    branchId: "br-khi-01",
    locationId: "loc-khi-01",
    locationName: "Main Dining Hall",
    category: "lighting",
    subcategory: "Architectural Downlights",
    itemName: "LED Downlight 18W Warm White",
    brand: "Philips",
    model: "DN029B 18W 3000K",
    specification: "Recessed 18W 220V 1600 Lumens Warm White Aluminium Housing",
    wattage: "18W",
    voltage: "220V",
    quantity: 24,
    unit: "units",
    unitCost: 2850,
    totalCost: 68400,
    serialNumber: "PHL-DL18-2026-BATCH1",
    installationDate: "2026-02-10",
    supplierName: "Pak Lighting & Electricals",
    invoiceNumber: "INV-PLE-2026-102",
    warranty: "2 Years Replacement",
    condition: "Brand New",
    status: "In Use",
    remarks: "Installed on Main Dining Hall Ceiling Grid A & B",
    createdAt: "2026-02-10T10:00:00.000Z",
    createdBy: "Tariq Mehmood",
    updatedAt: "2026-02-10T10:00:00.000Z",
    updatedBy: "Tariq Mehmood"
  },
  {
    id: "ast-khi-04",
    branchId: "br-khi-01",
    locationId: "loc-khi-01",
    locationName: "Main Dining Hall",
    category: "hvac",
    subcategory: "Cassette AC",
    itemName: "4 Ton Inverter Cassette AC",
    brand: "Gree",
    model: "GUD140T/A-S",
    specification: "360-degree round flow cassette, R410A refrigerant, wired digital wall controller",
    tonnage: "4.0 Ton",
    capacity: "48,000 BTU",
    quantity: 2,
    unit: "units",
    unitCost: 485000,
    totalCost: 970000,
    serialNumber: "GREE-CASS-48K-901",
    installationDate: "2026-02-14",
    supplierName: "Karachi Air Conditioning Centre",
    invoiceNumber: "INV-KAC-2026-45",
    warranty: "5 Years Compressor / 1 Year Parts",
    condition: "Brand New",
    status: "In Use",
    lastMaintenanceDate: "2026-02-14",
    nextMaintenanceDate: "2026-05-14",
    remarks: "Outdoor condensers mounted on dedicated terrace plinths with anti-vibration pads",
    createdAt: "2026-02-14T10:00:00.000Z",
    createdBy: "Tariq Mehmood",
    updatedAt: "2026-02-14T10:00:00.000Z",
    updatedBy: "Tariq Mehmood"
  },
  {
    id: "ast-khi-07",
    branchId: "br-khi-01",
    locationId: "loc-khi-02",
    locationName: "Commercial Hot Kitchen",
    category: "kitchen",
    subcategory: "Cooking Equipment",
    itemName: "Heavy Duty 4-Burner Commercial Gas Range with Oven",
    brand: "Falcon Professional",
    model: "G3101",
    specification: "Heavy duty cast iron pan supports, piezo ignition, thermostatic drop-down door oven",
    quantity: 1,
    unit: "units",
    unitCost: 820000,
    totalCost: 820000,
    serialNumber: "FAL-RNG-2026-788",
    installationDate: "2026-02-16",
    supplierName: "Al-Raziq Kitchen Equipment",
    invoiceNumber: "INV-ARK-2026-88",
    warranty: "2 Years Full",
    condition: "Brand New",
    status: "In Use",
    lastMaintenanceDate: "2026-02-16",
    nextMaintenanceDate: "2026-04-16",
    remarks: "Tested with natural gas supply line pressure 8 inches water column",
    createdAt: "2026-02-16T10:00:00.000Z",
    createdBy: "Tariq Mehmood",
    updatedAt: "2026-02-16T10:00:00.000Z",
    updatedBy: "Tariq Mehmood"
  },
  {
    id: "ast-khi-09",
    branchId: "br-khi-01",
    locationId: "loc-khi-05",
    locationName: "Reception & Billing Counter",
    category: "it_pos",
    subcategory: "POS Terminals",
    itemName: "Dual-Screen Touch POS Billing Terminal",
    brand: "Sunmi",
    model: "T2 Pro Dual",
    specification: "15.6 inch main display + 10.1 inch customer screen, 4GB RAM, 64GB SSD, integrated Seiko 80mm printer",
    quantity: 2,
    unit: "units",
    unitCost: 165000,
    totalCost: 330000,
    serialNumber: "SNM-T2P-889102",
    installationDate: "2026-02-22",
    supplierName: "Silicon Systems Technologies",
    invoiceNumber: "INV-SST-2026-302",
    warranty: "1 Year Hardware",
    condition: "Brand New",
    status: "In Use",
    assignedTo: "Cashier Station 1 & 2",
    ipAddress: "192.168.10.20",
    remarks: "Configured with RestoSetup POS and connected to thermal KOT network",
    createdAt: "2026-02-22T10:00:00.000Z",
    createdBy: "Tariq Mehmood",
    updatedAt: "2026-02-22T10:00:00.000Z",
    updatedBy: "Tariq Mehmood"
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: "inv-khi-01",
    itemCode: "INV-PKG-001",
    itemName: "Eco Kraft Takeaway Meal Boxes 1000ml",
    category: "Packaging",
    subcategory: "Food Containers",
    unit: "cartons (500 pcs)",
    branchId: "br-khi-01",
    warehouseLocation: "Dry Storage Rack A-1",
    openingStock: 30,
    stockIn: 50,
    stockOut: 15,
    adjustments: 0,
    currentStock: 65,
    minimumLevel: 20,
    reorderLevel: 30,
    unitCost: 12500,
    stockValue: 812500,
    supplierName: "Chenab Paper & Packaging",
    remarks: "Custom embossed with restaurant group logo",
    createdAt: "2026-01-20T10:00:00.000Z",
    updatedAt: "2026-01-20T10:00:00.000Z"
  },
  {
    id: "inv-khi-02",
    itemCode: "INV-PKG-002",
    itemName: "Branded Paper Drinking Straws 8mm",
    category: "Packaging",
    subcategory: "Disposables",
    unit: "boxes (1000 pcs)",
    branchId: "br-khi-01",
    warehouseLocation: "Dry Storage Rack A-2",
    openingStock: 10,
    stockIn: 20,
    stockOut: 24,
    adjustments: 0,
    currentStock: 6,
    minimumLevel: 10,
    reorderLevel: 15,
    unitCost: 2800,
    stockValue: 16800,
    supplierName: "Chenab Paper & Packaging",
    remarks: "Low stock alert triggered",
    createdAt: "2026-01-20T10:00:00.000Z",
    updatedAt: "2026-01-20T10:00:00.000Z"
  }
];

export const INITIAL_PURCHASES: PurchaseOrder[] = [
  {
    id: "po-khi-01",
    poNumber: "PO-2026-001",
    branchId: "br-khi-01",
    supplierId: "sup-01",
    supplierName: "Al-Raziq Kitchen Equipment",
    date: "2026-01-20",
    category: "Kitchen Equipment",
    items: [
      {
        itemName: "Falcon Commercial 4-Burner Range with Oven",
        specification: "Heavy duty cast iron, piezo ignition",
        quantity: 1,
        unit: "unit",
        unitPrice: 820000,
        discount: 20000,
        taxPercent: 16,
        total: 928000
      }
    ],
    subtotal: 820000,
    discount: 20000,
    tax: 128000,
    grandTotal: 928000,
    paidAmount: 928000,
    paymentStatus: "Paid",
    deliveryStatus: "Received",
    invoiceNumber: "INV-ARK-2026-88",
    notes: "Delivered to site and commission test passed",
    createdAt: "2026-01-20T10:00:00.000Z",
    createdBy: "Tariq Mehmood"
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: "sup-01",
    name: "Al-Raziq Kitchen Equipment & Stainless Steel",
    contactPerson: "Haji Muhammad Raziq",
    phone: "+92 21 32415566",
    email: "raziqkitchens@gmail.com",
    address: "Showroom 12, Campbell Street, Aram Bagh",
    city: "Karachi",
    ntnTaxNumber: "1489230-8",
    paymentTerms: "50% Advance, 50% on Delivery",
    category: "Commercial Kitchens",
    notes: "Authorized importer for Falcon, Sirman, and Rational equipment",
    totalPurchases: 4500000,
    paidAmount: 4500000,
    outstandingAmount: 0,
    createdAt: "2026-01-10T10:00:00.000Z"
  },
  {
    id: "sup-02",
    name: "Pak Lighting & Electrical Solutions",
    contactPerson: "Engr. Salman Qureshi",
    phone: "+92 21 34551122",
    email: "salman@paklighting.com.pk",
    address: "Building 45-C, Khayaban-e-Ittehad, Phase 6, DHA",
    city: "Karachi",
    ntnTaxNumber: "2891456-2",
    paymentTerms: "Net 30 Days",
    category: "Electrical & Lighting",
    notes: "Official Philips commercial lighting partner and panel fabricator",
    totalPurchases: 2850000,
    paidAmount: 2500000,
    outstandingAmount: 350000,
    createdAt: "2026-01-10T10:00:00.000Z"
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: "exp-khi-01",
    branchId: "br-khi-01",
    date: "2026-01-22",
    category: "Utilities",
    description: "K-Electric industrial load sanction fee and 100 kVA transformer approval deposit",
    amount: 650000,
    paidBy: "Tariq Mehmood",
    paymentMethod: "Bank Transfer",
    vendor: "K-Electric Limited",
    referenceNumber: "KE-DEP-2026-9041",
    remarks: "Official demand notice voucher deposit paid via Meezan Bank",
    createdAt: "2026-01-22T10:00:00.000Z",
    createdBy: "Tariq Mehmood"
  },
  {
    id: "exp-khi-02",
    branchId: "br-khi-01",
    date: "2026-02-05",
    category: "Transportation",
    description: "Heavy trailer transport and crane unloading charges for rooftop chiller units",
    amount: 85000,
    paidBy: "Tariq Mehmood",
    paymentMethod: "Cash",
    vendor: "Karachi Crane & Logistics",
    referenceNumber: "LOG-CR-2026-11",
    remarks: "Crane permit acquired from traffic police for night operation",
    createdAt: "2026-02-05T10:00:00.000Z",
    createdBy: "Tariq Mehmood"
  }
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: "rcp-01",
    recipeCode: "RCP-BUR-01",
    name: "Prime Angus Smash Cheeseburger & Brioche",
    category: "Mains",
    portionYield: 1,
    yieldUnit: "serving",
    prepTimeMinutes: 8,
    cookTimeMinutes: 6,
    ingredients: [
      {
        itemName: "Angus Beef Chuck-Brisket Blend",
        quantity: 0.18,
        unit: "kg",
        unitCost: 2600,
        totalCost: 468
      },
      {
        itemName: "Artisanal Glazed Brioche Bun",
        quantity: 1,
        unit: "pcs",
        unitCost: 85,
        totalCost: 85
      },
      {
        itemName: "Aged Monterey Jack / Cheddar Slice",
        quantity: 2,
        unit: "slices",
        unitCost: 35,
        totalCost: 70
      },
      {
        itemName: "Caramelized Onions & House Burger Aioli",
        quantity: 0.04,
        unit: "kg",
        unitCost: 800,
        totalCost: 32
      },
      {
        inventoryItemId: "inv-khi-01",
        itemName: "Eco Kraft Takeaway Meal Boxes 1000ml",
        quantity: 1,
        unit: "pcs",
        unitCost: 25,
        totalCost: 25
      }
    ],
    totalFoodCost: 655,
    packagingCost: 25,
    overheadCost: 70,
    totalCostPerPortion: 750,
    suggestedSellingPrice: 1950,
    sellingPrice: 1850,
    targetFoodCostPercent: 30,
    actualFoodCostPercent: 35.4,
    grossProfit: 1100,
    grossMarginPercent: 59.5,
    branchAvailability: ["all"],
    instructions: "1. Sear 2x 90g chilled beef balls on 220C flat griddle.\n2. Smash paper-thin with cast iron press and season immediately.\n3. Flip after 2 mins, apply cheese, and steam.\n4. Toast brioche on buttered salamander and layer sauce and pickles.",
    status: "active",
    createdAt: "2026-02-01T10:00:00.000Z",
    updatedAt: "2026-02-01T10:00:00.000Z"
  },
  {
    id: "rcp-02",
    recipeCode: "RCP-BEV-02",
    name: "Specialty Spanish Iced Latte (16oz)",
    category: "Beverages",
    portionYield: 1,
    yieldUnit: "cup (16oz)",
    prepTimeMinutes: 4,
    cookTimeMinutes: 2,
    ingredients: [
      {
        itemName: "Single Origin Ethiopian Yirgacheffe Beans",
        quantity: 0.02,
        unit: "kg",
        unitCost: 6500,
        totalCost: 130
      },
      {
        itemName: "Condensed Sweetened Cream Milk",
        quantity: 0.035,
        unit: "kg",
        unitCost: 1200,
        totalCost: 42
      },
      {
        itemName: "Premium Fresh Whole Milk",
        quantity: 0.18,
        unit: "liters",
        unitCost: 280,
        totalCost: 50.4
      },
      {
        inventoryItemId: "inv-khi-02",
        itemName: "Branded Paper Drinking Straws 8mm",
        quantity: 1,
        unit: "pcs",
        unitCost: 2.8,
        totalCost: 2.8
      }
    ],
    totalFoodCost: 222.4,
    packagingCost: 45,
    overheadCost: 35,
    totalCostPerPortion: 302.4,
    suggestedSellingPrice: 950,
    sellingPrice: 920,
    targetFoodCostPercent: 28,
    actualFoodCostPercent: 24.2,
    grossProfit: 617.6,
    grossMarginPercent: 67.1,
    branchAvailability: ["all"],
    instructions: "1. Extract 38g double espresso shot over 35g condensed milk base.\n2. Stir thoroughly until silky.\n3. Fill 16oz cup with crushed ice, pour 180ml chilled whole milk.\n4. Float espresso mixture on top for marbled aesthetic.",
    status: "active",
    createdAt: "2026-02-05T10:00:00.000Z",
    updatedAt: "2026-02-05T10:00:00.000Z"
  },
  {
    id: "rcp-03",
    recipeCode: "RCP-STR-03",
    name: "White Truffle & Grana Padano Hand-Cut Fries",
    category: "Starters",
    portionYield: 1,
    yieldUnit: "portion (250g)",
    prepTimeMinutes: 5,
    cookTimeMinutes: 7,
    ingredients: [
      {
        itemName: "Imported Dutch Russet Potatoes",
        quantity: 0.32,
        unit: "kg",
        unitCost: 240,
        totalCost: 76.8
      },
      {
        itemName: "Italian White Truffle Infused Olive Oil",
        quantity: 0.015,
        unit: "liters",
        unitCost: 7500,
        totalCost: 112.5
      },
      {
        itemName: "Grana Padano Aged Parmesan",
        quantity: 0.03,
        unit: "kg",
        unitCost: 3800,
        totalCost: 114
      },
      {
        itemName: "Fresh Chives, Sea Salt Flakes & Garlic",
        quantity: 0.01,
        unit: "kg",
        unitCost: 900,
        totalCost: 9
      }
    ],
    totalFoodCost: 312.3,
    packagingCost: 20,
    overheadCost: 50,
    totalCostPerPortion: 382.3,
    suggestedSellingPrice: 890,
    sellingPrice: 850,
    targetFoodCostPercent: 32,
    actualFoodCostPercent: 36.7,
    grossProfit: 467.7,
    grossMarginPercent: 55.0,
    branchAvailability: ["all"],
    instructions: "1. Double fry hand-cut potato sticks (140C blanch, 190C crisping).\n2. Drain excess oil for 30 seconds.\n3. Toss in stainless steel bowl with truffle oil, microplaned parmesan, and sea salt.\n4. Garnish with minced chives.",
    status: "active",
    createdAt: "2026-02-10T10:00:00.000Z",
    updatedAt: "2026-02-10T10:00:00.000Z"
  }
];

