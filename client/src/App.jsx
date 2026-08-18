import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Orders from './components/Orders';
import OrderDetail from './components/OrderDetail';
import Picking from './components/Picking';
import Exceptions from './components/Exceptions';
import Analytics from './components/Analytics';
import AIAnalysis from './components/AIAnalysis';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="picking" element={<Picking />} />
        <Route path="exceptions" element={<Exceptions />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="ai-analysis" element={<AIAnalysis />} />
      </Route>
    </Routes>
  );
}

export default App;