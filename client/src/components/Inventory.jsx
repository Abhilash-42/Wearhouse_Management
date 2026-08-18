import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleReorder = async (id) => {
    await api.reorderProduct(id);
    loadProducts();
  };

  if (loading) return <div>Loading inventory...</div>;

  return (
    <div>
      <h1>Inventory & Stock Monitoring</h1>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Location</th>
              <th>On Hand</th>
              <th>Allocated</th>
              <th>Available</th>
              <th>Reorder Point</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => {
              const status = p.available === 0 ? 'Out of Stock' : p.available <= p.reorderPoint ? 'Low Stock' : 'In Stock';
              const badgeClass = status === 'Out of Stock' ? 'badge-danger' : status === 'Low Stock' ? 'badge-warning' : 'badge-success';
              return (
                <tr key={p.id}>
                  <td>{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>{p.location}</td>
                  <td>{p.onHand}</td>
                  <td>{p.allocated}</td>
                  <td>{p.available}</td>
                  <td>{p.reorderPoint}</td>
                  <td><span className={`badge ${badgeClass}`}>{status}</span></td>
                  <td>
                    {p.available <= p.reorderPoint && (
                      <button onClick={() => handleReorder(p.id)}>Reorder</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}