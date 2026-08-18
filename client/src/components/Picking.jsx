import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Picking() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await api.getPickingTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const completeTask = async (taskId) => {
    await api.completePickingTask(taskId);
    loadTasks();
  };

  if (loading) return <div>Loading picking tasks...</div>;

  return (
    <div>
      <h1>Picking & Packing Management</h1>
      <div className="card">
        {tasks.length === 0 ? <p>No picking tasks available.</p> : (
          <table>
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items to Pick</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id}>
                  <td>{task.id}</td>
                  <td>{task.orderId}</td>
                  <td>{task.order?.customerName}</td>
                  <td>
                    <ul>
                      {task.items.map((item, idx) => (
                        <li key={idx}>
                          {item.product?.name}: {item.allocated} units @ {item.location}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td><span className={`badge ${task.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{task.status}</span></td>
                  <td>
                    {task.status === 'pending' && (
                      <button className="success" onClick={() => completeTask(task.id)}>Complete Picking</button>
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