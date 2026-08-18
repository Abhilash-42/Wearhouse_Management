const express = require('express');
const path = require('path');
const cors = require('cors');
const data = require('./data');
const { allocateOrder, getReorderRecommendations, calculatePriorityScore } = require('./allocation');

const app = express();
app.use(cors());
app.use(express.json());

// Utility to find product by id
const findProduct = (id) => data.products.find(p => p.id === id);

// GET all products with current inventory
app.get('/api/products', (req, res) => {
  const productsWithInventory = data.products.map(product => {
    const inv = data.inventory[product.id] || { onHand: 0, allocated: 0 };
    return {
      ...product,
      onHand: inv.onHand,
      allocated: inv.allocated,
      available: inv.onHand - inv.allocated
    };
  });
  res.json(productsWithInventory);
});

// GET all orders
app.get('/api/orders', (req, res) => {
  // Sort by priority score descending
  const sorted = [...data.orders].sort((a, b) => b.priorityScore - a.priorityScore);
  res.json(sorted);
});

// POST create new order
app.post('/api/orders', (req, res) => {
  const { customerName, customerTier, items, deadline } = req.body;
  
  // Basic validation
  if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid order data' });
  }
  
  const newOrder = {
    id: data.nextIds.order++,
    customerName,
    customerTier: customerTier || 'standard',
    items: items.map(item => ({ productId: item.productId, quantity: item.quantity })),
    status: 'new',
    createdAt: new Date(),
    deadline: new Date(deadline) || new Date(Date.now() + 7*24*60*60*1000),
    priorityScore: 0,
    allocatedItems: [],
    pickingStatus: 'pending',
    packingStatus: 'pending',
    qualityCheck: 'pending',
    dispatchStatus: 'pending',
    exceptionIds: []
  };
  
  // Allocate immediately
  allocateOrder(newOrder, data.inventory, data.products, data.exceptions, data.nextIds);
  data.orders.push(newOrder);
  
  res.status(201).json(newOrder);
});

// GET order by id
app.get('/api/orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const order = data.orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  // Enrich allocated items with product info
  const enriched = {
    ...order,
    allocatedItems: order.allocatedItems.map(item => ({
      ...item,
      product: findProduct(item.productId)
    })),
    exceptions: order.exceptionIds.map(exId => data.exceptions.find(e => e.id === exId))
  };
  res.json(enriched);
});

// POST manually run allocation for an order
app.post('/api/orders/:id/allocate', (req, res) => {
  const id = parseInt(req.params.id);
  const order = data.orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  allocateOrder(order, data.inventory, data.products, data.exceptions, data.nextIds);
  res.json(order);
});

// GET picking tasks
app.get('/api/picking-tasks', (req, res) => {
  // Automatically create picking tasks for allocated orders that don't have one
  data.orders.forEach(order => {
    if ((order.status === 'allocated' || order.status === 'partial') && order.pickingStatus === 'pending') {
      const existingTask = data.pickingTasks.find(t => t.orderId === order.id);
      if (!existingTask) {
        const newTask = {
          id: data.nextIds.pickingTask++,
          orderId: order.id,
          items: order.allocatedItems.map(item => ({
            productId: item.productId,
            allocated: item.allocated,
            location: findProduct(item.productId)?.location || 'Unknown'
          })),
          status: 'pending',
          assignedTo: null
        };
        data.pickingTasks.push(newTask);
      }
    }
  });
  
  const enrichedTasks = data.pickingTasks.map(task => ({
    ...task,
    order: data.orders.find(o => o.id === task.orderId),
    items: task.items.map(item => ({
      ...item,
      product: findProduct(item.productId)
    }))
  }));
  res.json(enrichedTasks);
});

// POST complete picking task
app.post('/api/picking-tasks/:id/complete', (req, res) => {
  const id = parseInt(req.params.id);
  const task = data.pickingTasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  
  task.status = 'completed';
  const order = data.orders.find(o => o.id === task.orderId);
  if (order) {
    order.pickingStatus = 'completed';
    // Move to packing
    order.packingStatus = 'pending';
  }
  res.json(task);
});

// GET exceptions
app.get('/api/exceptions', (req, res) => {
  const enriched = data.exceptions.map(ex => ({
    ...ex,
    product: findProduct(ex.productId),
    order: ex.orderId ? data.orders.find(o => o.id === ex.orderId) : null
  }));
  res.json(enriched);
});

// POST resolve exception
app.post('/api/exceptions/:id/resolve', (req, res) => {
  const id = parseInt(req.params.id);
  const exception = data.exceptions.find(e => e.id === id);
  if (!exception) return res.status(404).json({ error: 'Exception not found' });
  
  const { action } = req.body;
  exception.resolutionStatus = 'resolved';
  exception.resolutionAction = action || 'Manual override';
  
  // If exception is for an order, attempt re-allocation
  if (exception.orderId) {
    const order = data.orders.find(o => o.id === exception.orderId);
    if (order) {
      allocateOrder(order, data.inventory, data.products, data.exceptions, data.nextIds);
    }
  }
  
  res.json(exception);
});

// POST simulate reorder for a product (increase onHand)
app.post('/api/products/:id/reorder', (req, res) => {
  const id = parseInt(req.params.id);
  const product = findProduct(id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  
  const inv = data.inventory[id];
  if (!inv) {
    data.inventory[id] = { onHand: product.reorderQuantity, allocated: 0 };
  } else {
    inv.onHand += product.reorderQuantity;
  }
  
  // Re-run allocation for any orders that had shortages on this product
  data.orders.forEach(order => {
    if (order.exceptionIds.some(exId => {
      const ex = data.exceptions.find(e => e.id === exId);
      return ex && ex.productId === id && ex.resolutionStatus === 'unresolved';
    })) {
      allocateOrder(order, data.inventory, data.products, data.exceptions, data.nextIds);
    }
  });
  
  res.json({ message: 'Reorder completed', product: { ...product, onHand: data.inventory[id].onHand, allocated: data.inventory[id].allocated, available: data.inventory[id].onHand - data.inventory[id].allocated } });
});

// GET analytics
app.get('/api/analytics', (req, res) => {
  const totalOrders = data.orders.length;
  const pendingOrders = data.orders.filter(o => o.status === 'new' || o.status === 'partial').length;
  const completedOrders = data.orders.filter(o => o.dispatchStatus === 'dispatched').length;
  const lowStockItems = getReorderRecommendations(data.products, data.inventory);
  const unresolvedExceptions = data.exceptions.filter(e => e.resolutionStatus === 'unresolved').length;
  
  // Order processing time (mock: average hours between creation and dispatch)
  const dispatched = data.orders.filter(o => o.dispatchStatus === 'dispatched');
  const avgProcessingHours = dispatched.length > 0 
    ? dispatched.reduce((sum, o) => sum + (o.dispatchTime - o.createdAt) / (1000*60*60), 0) / dispatched.length 
    : 0;
  
  // Bottleneck: which product causes most exceptions?
  const productExceptionCounts = {};
  data.exceptions.forEach(ex => {
    if (ex.resolutionStatus === 'unresolved') {
      productExceptionCounts[ex.productId] = (productExceptionCounts[ex.productId] || 0) + 1;
    }
  });
  const bottleneckProductId = Object.keys(productExceptionCounts).sort((a,b) => productExceptionCounts[b] - productExceptionCounts[a])[0];
  const bottleneckProduct = bottleneckProductId ? findProduct(parseInt(bottleneckProductId)) : null;
  
 res.json({
  totalOrders,
  pendingOrders,
  completedOrders,
  lowStockCount: lowStockItems.length,
  lowStockItems,
  unresolvedExceptions,
  avgProcessingHours: Math.round(avgProcessingHours * 10) / 10,
  bottleneckProduct,
  bottleneckExceptionCount: bottleneckProductId ? productExceptionCounts[bottleneckProductId] : 0
});
});
// Serve React frontend in production
const clientPath = path.join(__dirname, '../client/dist');

app.use(express.static(clientPath));

// React Router fallback
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientPath, 'index.html'));
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);

  data.orders.forEach(order => {
    order.priorityScore = calculatePriorityScore(order);
  });
});
