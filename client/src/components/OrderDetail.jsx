import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const data = await api.getOrder(id);
      setOrder(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleAllocate = async () => {
    await api.allocateOrder(id);
    loadOrder();
  };

  const handleResolveException = async (exceptionId) => {
    await api.resolveException(exceptionId, 'Manual allocation override');
    loadOrder();
  };

  if (loading) return <div>Loading order...</div>;
  if (!order) return <div>Order not found</div>;

  const timelineSteps = [
    { label: 'Order Created', status: 'done' },
    { label: 'Inventory Allocated', status: order.status === 'allocated' || order.status === 'partial' ? 'done' : 'pending' },
    { label: 'Picking', status: order.pickingStatus },
    { label: 'Packing', status: order.packingStatus },
    { label: 'Quality Check', status: order.qualityCheck },
    { label: 'Dispatch', status: order.dispatchStatus }
  ];

  return (
    <div className="order-detail">
      <h1>Order #{order.id}</h1>
      <div className="card">
        <div className="form-row">
          <div><strong>Customer:</strong> {order.customerName}</div>
          <div><strong>Tier:</strong> {order.customerTier}</div>
          <div><strong>Status:</strong> {order.status}</div>
          <div><strong>Priority Score:</strong> {order.priorityScore}</div>
          <div><strong>Deadline:</strong> {new Date(order.deadline).toLocaleString()}</div>
        </div>
        <button onClick={handleAllocate} className="secondary">Re-run Allocation</button>
      </div>

      <div className="card">
        <h3>Items & Allocation</h3>
        <table>
          <thead>
            <tr><th>Product</th><th>Requested</th><th>Allocated</th><th>Shortage</th><th>Status</th></tr>
          </thead>
          <tbody>
            {order.allocatedItems.map((item, idx) => (
              <tr key={idx}>
                <td>{item.product?.name || `Product ${item.productId}`}</td>
                <td>{item.requested}</td>
                <td>{item.allocated}</td>
                <td>{item.shortage}</td>
                <td>{item.shortage === 0 ? <span className="badge badge-success">Fulfilled</span> : <span className="badge badge-warning">Shortage</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {order.exceptions && order.exceptions.length > 0 && (
        <div className="card">
          <h3>Exceptions</h3>
          {order.exceptions.map(ex => (
            <div key={ex.id} className="form-row" style={{ alignItems: 'center' }}>
              <span className={`badge ${ex.resolutionStatus === 'resolved' ? 'badge-success' : 'badge-danger'}`}>
                {ex.type}
              </span>
              <span>{ex.description}</span>
              <span>Status: {ex.resolutionStatus}</span>
              {ex.resolutionStatus === 'unresolved' && (
                <button onClick={() => handleResolveException(ex.id)}>Resolve</button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3>Fulfillment Timeline</h3>
        <ul className="timeline">
          {timelineSteps.map((step, idx) => (
            <li key={idx}>
              <strong>{step.label}</strong> - <span className={`badge ${step.status === 'done' || step.status === 'completed' ? 'badge-success' : step.status === 'pending' ? 'badge-info' : 'badge-warning'}`}>{step.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}