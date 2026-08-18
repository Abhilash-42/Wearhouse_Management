// Mock data store – all data is in-memory and resets on server restart

const products = [
  { id: 1, name: "Wireless Mouse", sku: "WM-001", category: "Electronics", price: 25.99, reorderPoint: 20, reorderQuantity: 100, location: "A1-01-01" },
  { id: 2, name: "Mechanical Keyboard", sku: "KB-002", category: "Electronics", price: 89.99, reorderPoint: 15, reorderQuantity: 50, location: "A1-02-03" },
  { id: 3, name: "USB-C Cable", sku: "CB-003", category: "Accessories", price: 12.50, reorderPoint: 50, reorderQuantity: 200, location: "B2-01-02" },
  { id: 4, name: "27\" Monitor", sku: "MN-004", category: "Electronics", price: 299.99, reorderPoint: 10, reorderQuantity: 30, location: "C3-04-01" },
  { id: 5, name: "Laptop Stand", sku: "LS-005", category: "Accessories", price: 45.00, reorderPoint: 30, reorderQuantity: 80, location: "B2-03-05" },
  { id: 6, name: "Desk Lamp", sku: "DL-006", category: "Home Office", price: 35.75, reorderPoint: 25, reorderQuantity: 60, location: "D4-01-03" },
  { id: 7, name: "Webcam 1080p", sku: "WC-007", category: "Electronics", price: 59.99, reorderPoint: 12, reorderQuantity: 40, location: "A1-04-02" },
  { id: 8, name: "Notebook", sku: "NB-008", category: "Stationery", price: 5.99, reorderPoint: 100, reorderQuantity: 500, location: "E5-02-01" }
];

// Initial inventory: productId -> { onHand, allocated }
const inventory = {
  1: { onHand: 15, allocated: 0 },
  2: { onHand: 8, allocated: 0 },
  3: { onHand: 120, allocated: 0 },
  4: { onHand: 5, allocated: 0 },
  5: { onHand: 45, allocated: 0 },
  6: { onHand: 10, allocated: 0 },
  7: { onHand: 0, allocated: 0 },   // out of stock
  8: { onHand: 250, allocated: 0 }
};

const orders = [
  {
    id: 1001,
    customerName: "Acme Corp",
    customerTier: "vip",
    items: [
      { productId: 1, quantity: 10 },
      { productId: 3, quantity: 20 }
    ],
    status: "allocated",
    createdAt: new Date("2026-01-15T10:00:00Z"),
    deadline: new Date("2026-01-20T10:00:00Z"),
    priorityScore: 0,  // calculated
    allocatedItems: [],
    pickingStatus: "pending",
    packingStatus: "pending",
    qualityCheck: "pending",
    dispatchStatus: "pending",
    exceptionIds: []
  },
  {
    id: 1002,
    customerName: "Globex Inc",
    customerTier: "priority",
    items: [
      { productId: 4, quantity: 8 }
    ],
    status: "new",
    createdAt: new Date("2026-01-16T09:30:00Z"),
    deadline: new Date("2026-01-19T09:30:00Z"),
    priorityScore: 0,
    allocatedItems: [],
    pickingStatus: "pending",
    packingStatus: "pending",
    qualityCheck: "pending",
    dispatchStatus: "pending",
    exceptionIds: []
  },
  {
    id: 1003,
    customerName: "Initech",
    customerTier: "standard",
    items: [
      { productId: 5, quantity: 30 },
      { productId: 6, quantity: 15 }
    ],
    status: "new",
    createdAt: new Date("2026-01-16T11:00:00Z"),
    deadline: new Date("2026-01-22T11:00:00Z"),
    priorityScore: 0,
    allocatedItems: [],
    pickingStatus: "pending",
    packingStatus: "pending",
    qualityCheck: "pending",
    dispatchStatus: "pending",
    exceptionIds: []
  }
];

let pickingTasks = [
  { id: 2001, orderId: 1001, items: [], status: "pending", assignedTo: null }
];

let exceptions = [
  { id: 3001, type: "out_of_stock", productId: 7, orderId: null, description: "Webcam 1080p is out of stock", resolutionStatus: "unresolved", resolutionAction: null },
  { id: 3002, type: "low_stock", productId: 4, orderId: null, description: "Monitor stock below reorder point", resolutionStatus: "unresolved", resolutionAction: null }
];

let nextIds = {
  order: 1004,
  pickingTask: 2002,
  exception: 3003
};

module.exports = {
  products,
  inventory,
  orders,
  pickingTasks,
  exceptions,
  nextIds
};