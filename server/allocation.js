// Decision logic: priority scoring, inventory allocation, reorder recommendations

function calculatePriorityScore(order) {
  const now = new Date();
  const timeUntilDeadline = order.deadline - now; // ms
  const hoursUntilDeadline = Math.max(0, timeUntilDeadline / (1000 * 60 * 60));
  
  // Tier weights
  const tierWeight = {
    vip: 100,
    priority: 70,
    standard: 30
  };
  
  // Urgency: shorter deadline => higher score
  const urgencyScore = Math.max(0, 100 - hoursUntilDeadline * 10);
  
  // Order value: sum of item quantities * product price
  const products = require('./data').products;
  let valueScore = 0;
  order.items.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    if (product) valueScore += item.quantity * product.price;
  });
  valueScore = Math.min(100, valueScore / 100); // normalize roughly
  
  // Combine (weights can be adjusted)
  const score = tierWeight[order.customerTier] * 0.5 + urgencyScore * 0.3 + valueScore * 0.2;
  return Math.round(score);
}

function allocateOrder(order, inventory, products, exceptions, nextIds) {
  // Reset allocation
  order.allocatedItems = [];
  order.exceptionIds = [];
  let allocationComplete = true;
  
  for (const item of order.items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) continue;
    
    const inv = inventory[product.id];
    const available = inv ? inv.onHand - inv.allocated : 0;
    
    if (available >= item.quantity) {
      // Full allocation
      inv.allocated += item.quantity;
      order.allocatedItems.push({
        productId: item.productId,
        requested: item.quantity,
        allocated: item.quantity,
        shortage: 0
      });
    } else {
      // Partial or zero allocation
      const allocatedQty = Math.max(0, available);
      if (allocatedQty > 0) {
        inv.allocated += allocatedQty;
        order.allocatedItems.push({
          productId: item.productId,
          requested: item.quantity,
          allocated: allocatedQty,
          shortage: item.quantity - allocatedQty
        });
      } else {
        order.allocatedItems.push({
          productId: item.productId,
          requested: item.quantity,
          allocated: 0,
          shortage: item.quantity
        });
      }
      
      allocationComplete = false;
      
      // Create exception if not already exists for this product and order
      let exception = exceptions.find(e => e.productId === item.productId && e.orderId === order.id && e.resolutionStatus === 'unresolved');
      if (!exception) {
        const type = available === 0 ? 'out_of_stock' : 'low_stock';
        exception = {
          id: nextIds.exception++,
          type,
          productId: item.productId,
          orderId: order.id,
          description: `${product.name} shortage: requested ${item.quantity}, available ${allocatedQty}`,
          resolutionStatus: 'unresolved',
          resolutionAction: null
        };
        exceptions.push(exception);
      }
      order.exceptionIds.push(exception.id);
    }
  }
  
  order.status = allocationComplete ? 'allocated' : 'partial';
  order.priorityScore = calculatePriorityScore(order);
  return order;
}

function getReorderRecommendations(products, inventory) {
  const recommendations = [];
  products.forEach(product => {
    const inv = inventory[product.id];
    if (!inv) return;
    const available = inv.onHand - inv.allocated;
    if (available <= product.reorderPoint) {
      recommendations.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        currentStock: available,
        reorderPoint: product.reorderPoint,
        reorderQuantity: product.reorderQuantity,
        location: product.location
      });
    }
  });
  return recommendations;
}

module.exports = {
  calculatePriorityScore,
  allocateOrder,
  getReorderRecommendations
};