import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Link } from 'react-router-dom';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerTier: 'standard',
    items: [{ productId: 1, quantity: 1 }],
    deadline: ''
  });

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.createOrder(formData);
    setShowForm(false);
    setFormData({ customerName: '', customerTier: 'standard', items: [{ productId: 1, quantity: 1 }], deadline: '' });
    loadOrders();
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: 1, quantity: 1 }]
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  if (loading) return <div>Loading orders...</div>;

  return (
    <div>
      <h1>Order Management</h1>
      <button onClick={() => setShowForm(!showForm)} className="secondary" style={{ marginBottom: '1rem' }}>
        {showForm ? 'Cancel' : 'Create New Order'}
      </button>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <input
                type="text"
                placeholder="Customer Name"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
              />
              <select
                value={formData.customerTier}
                onChange={(e) => setFormData({ ...formData, customerTier: e.target.value })}
              >
                <option value="standard">Standard</option>
                <option value="priority">Priority</option>
                <option value="vip">VIP</option>
              </select>
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
            <h4>Items</h4>
            {formData.items.map((item, index) => (
              <div key={index} className="form-row">
                <select
                  value={item.productId}
                  onChange={(e) => updateItem(index, 'productId', parseInt(e.target.value))}
                >
                  {/* Product IDs 1-8, ideally fetch products but static is fine for demo */}
                  <option value={1}>Wireless Mouse</option>
                  <option value={2}>Mechanical Keyboard</option>
                  <option value={3}>USB-C Cable</option>
                  <option value={4}>27" Monitor</option>
                  <option value={5}>Laptop Stand</option>
                  <option value={6}>Desk Lamp</option>
                  <option value={7}>Webcam 1080p</option>
                  <option value={8}>Notebook</option>
                </select>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                />
                {index > 0 && <button type="button" className="danger" onClick={() => {
                  const newItems = formData.items.filter((_, i) => i !== index);
                  setFormData({ ...formData, items: newItems });
                }}>Remove</button>}
              </div>
            ))}
            <button type="button" onClick={addItem} className="secondary">Add Item</button>
            <br /><br />
            <button type="submit">Create Order</button>
          </form>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Tier</th>
              <th>Items</th>
              <th>Status</th>
              <th>Priority Score</th>
              <th>Deadline</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.customerName}</td>
                <td>{o.customerTier}</td>
                <td>{o.items.reduce((sum, i) => sum + i.quantity, 0)}</td>
                <td><span className={`badge ${o.status === 'allocated' ? 'badge-success' : o.status === 'partial' ? 'badge-warning' : 'badge-info'}`}>{o.status}</span></td>
                <td>{o.priorityScore}</td>
                <td>{new Date(o.deadline).toLocaleString()}</td>
                <td><Link to={`/orders/${o.id}`}><button>View</button></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}