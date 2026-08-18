import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div>Loading analytics...</div>;
  if (!analytics) return <div>No data</div>;

  return (
    <div>
      <h1>Operational Analytics & Bottlenecks</h1>
      <div className="grid">
        <div className="card stat">
          <div className="label">Total Orders</div>
          <div className="value">{analytics.totalOrders}</div>
        </div>
        <div className="card stat">
          <div className="label">Pending Orders</div>
          <div className="value">{analytics.pendingOrders}</div>
        </div>
        <div className="card stat">
          <div className="label">Completed Orders</div>
          <div className="value">{analytics.completedOrders}</div>
        </div>
        <div className="card stat">
          <div className="label">Avg Processing (hrs)</div>
          <div className="value">{analytics.avgProcessingHours}</div>
        </div>
      </div>

      <div className="card">
        <h3>Low Stock Items (Reorder Recommendations)</h3>
        {analytics.lowStockItems.length === 0 ? <p>No low stock items.</p> : (
          <ul>
            {analytics.lowStockItems.map(item => (
              <li key={item.productId}>
                {item.name} (SKU: {item.sku}) – Available: {item.currentStock}, Reorder Point: {item.reorderPoint}, Suggested Reorder Qty: {item.reorderQuantity}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h3>Bottleneck Identification</h3>
        {analytics.bottleneckProduct ? (
          <div>
            <p><strong>Most problematic product:</strong> {analytics.bottleneckProduct.name}</p>
            <p>Unresolved exceptions caused: {analytics.bottleneckExceptionCount}</p>
            <div className="analytics-chart">
              <div className="bar" style={{ height: `${Math.min(100, analytics.bottleneckExceptionCount * 20)}%` }}>
                {analytics.bottleneckExceptionCount}
              </div>
            </div>
          </div>
        ) : (
          <p>No bottleneck detected.</p>
        )}
      </div>

      <div className="card">
        <h3>Unresolved Exceptions</h3>
        <p>{analytics.unresolvedExceptions} exceptions require attention.</p>
      </div>
    </div>
  );
}