import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [a, p, o] = await Promise.all([
          api.getAnalytics(),
          api.getProducts(),
          api.getOrders()
        ]);
        setAnalytics(a);
        setProducts(p);
        setOrders(o);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  const lowStock = products.filter(p => p.available <= p.reorderPoint);
  const pendingOrders = orders.filter(o => o.status === 'new' || o.status === 'partial');

  return (
    <div>
      <h1>Dashboard</h1>
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
          <div className="label">Low Stock Items</div>
          <div className="value">{analytics.lowStockCount}</div>
        </div>
        <div className="card stat">
          <div className="label">Unresolved Exceptions</div>
          <div className="value">{analytics.unresolvedExceptions}</div>
        </div>
      </div>

      <div className="card">
        <h3>⚠️ Low Stock Alerts</h3>
        {lowStock.length === 0 ? <p>No low stock items.</p> : (
          <table>
            <thead>
              <tr><th>Product</th><th>Available</th><th>Reorder Point</th><th>Action</th></tr>
            </thead>
            <tbody>
              {lowStock.map(p => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.available}</td>
                  <td>{p.reorderPoint}</td>
                  <td><button onClick={() => api.reorderProduct(p.id).then(() => window.location.reload())}>Reorder</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>📋 Pending Orders</h3>
        {pendingOrders.length === 0 ? <p>No pending orders.</p> : (
          <ul>
            {pendingOrders.map(o => (
              <li key={o.id}>
                <Link to={`/orders/${o.id}`}>Order #{o.id} - {o.customerName} (Priority: {o.priorityScore})</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}