const API_BASE = '/api';

async function fetchJSON(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

export const api = {
  getProducts: () => fetchJSON('/products'),
  getOrders: () => fetchJSON('/orders'),
  getOrder: (id) => fetchJSON(`/orders/${id}`),
  createOrder: (orderData) => fetchJSON('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  }),
  allocateOrder: (id) => fetchJSON(`/orders/${id}/allocate`, { method: 'POST' }),
  getPickingTasks: () => fetchJSON('/picking-tasks'),
  completePickingTask: (taskId) => fetchJSON(`/picking-tasks/${taskId}/complete`, { method: 'POST' }),
  getExceptions: () => fetchJSON('/exceptions'),
  resolveException: (exceptionId, action) => fetchJSON(`/exceptions/${exceptionId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ action })
  }),
  getAnalytics: () => fetchJSON('/analytics'),
  reorderProduct: (productId) => fetchJSON(`/products/${productId}/reorder`, { method: 'POST' })
};