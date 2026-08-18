import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Exceptions() {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadExceptions = async () => {
    setLoading(true);
    try {
      const data = await api.getExceptions();
      setExceptions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExceptions();
  }, []);

  const resolve = async (id) => {
    await api.resolveException(id, 'Resolved manually');
    loadExceptions();
  };

  if (loading) return <div>Loading exceptions...</div>;

  return (
    <div>
      <h1>Exception Handling</h1>
      <div className="card">
        {exceptions.length === 0 ? <p>No exceptions.</p> : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Product</th>
                <th>Order</th>
                <th>Description</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map(ex => (
                <tr key={ex.id}>
                  <td>{ex.id}</td>
                  <td><span className={`badge ${ex.type === 'out_of_stock' ? 'badge-danger' : 'badge-warning'}`}>{ex.type}</span></td>
                  <td>{ex.product?.name}</td>
                  <td>{ex.order ? `#${ex.order.id}` : 'N/A'}</td>
                  <td>{ex.description}</td>
                  <td>{ex.resolutionStatus}</td>
                  <td>
                    {ex.resolutionStatus === 'unresolved' && (
                      <button onClick={() => resolve(ex.id)}>Resolve</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}