import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

const cannedAnswers = [
  {
    keywords: ['reorder', 'restock', 'replenish'],
    answer: 'Today I would prioritize Webcam 1080p, 27" Monitor, Mechanical Keyboard, Desk Lamp, and Wireless Mouse. Webcam 1080p is the most urgent because available stock is zero.'
  },
  {
    keywords: ['risk', 'risky', 'danger', 'critical'],
    answer: 'The highest operational risks are the Webcam 1080p stockout, the 27" Monitor shortage affecting Order #1002, and low Desk Lamp inventory. These should be reviewed before lower-priority work.'
  },
  {
    keywords: ['order', 'orders', 'delay', 'delayed'],
    answer: 'Order #1002 is the highest fulfillment risk because it needs 8 monitors while only 5 are available. Order #1003 also has a Desk Lamp shortage. Order #1001 is currently allocated.'
  },
  {
    keywords: ['bottleneck', 'slow', 'problem'],
    answer: 'The current bottleneck is the 27" Monitor. It is below its reorder point and is also required by a priority customer order, making it the strongest candidate for immediate replenishment.'
  },
  {
    keywords: ['today', 'morning', 'briefing', 'summary'],
    answer: 'Morning briefing: warehouse health is 72/100. There are 3 critical inventory risks, 2 order fulfillment risks, and 2 unresolved exceptions. Start with the Webcam 1080p stockout, then replenish monitors.'
  }
];

function getSeverity(available, reorderPoint) {
  if (available === 0) return 'critical';
  if (available < reorderPoint * 0.5) return 'critical';
  if (available <= reorderPoint) return 'warning';
  return 'healthy';
}

function severityLabel(severity) {
  return {
    critical: 'Critical',
    warning: 'Needs attention',
    healthy: 'Healthy'
  }[severity];
}

export default function AIAnalysis() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [productData, orderData, exceptionData] = await Promise.all([
          api.getProducts(),
          api.getOrders(),
          api.getExceptions()
        ]);
        setProducts(productData);
        setOrders(orderData);
        setExceptions(exceptionData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const analysis = useMemo(() => {
    const risks = products
      .map(product => ({
        ...product,
        severity: getSeverity(product.available, product.reorderPoint),
        stockRatio: product.reorderPoint ? product.available / product.reorderPoint : 1
      }))
      .filter(product => product.severity !== 'healthy')
      .sort((a, b) => a.available - b.available);

    const orderRisks = orders.map(order => {
      const shortages = order.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return null;
        const shortage = Math.max(0, item.quantity - product.available);
        return shortage > 0 ? { product, requested: item.quantity, shortage } : null;
      }).filter(Boolean);

      return shortages.length > 0
        ? { ...order, shortages, severity: order.customerTier === 'vip' || order.customerTier === 'priority' ? 'critical' : 'warning' }
        : null;
    }).filter(Boolean);

    const criticalCount = risks.filter(r => r.severity === 'critical').length;
    const warningCount = risks.filter(r => r.severity === 'warning').length;
    const unresolvedCount = exceptions.filter(e => e.resolutionStatus === 'unresolved').length;
    const score = Math.max(45, Math.min(96, 100 - criticalCount * 8 - warningCount * 4 - unresolvedCount * 4));

    return { risks, orderRisks, criticalCount, warningCount, unresolvedCount, score };
  }, [products, orders, exceptions]);

  const recommendations = useMemo(() => {
    const result = [];
    const webcam = products.find(p => p.name === 'Webcam 1080p');
    const monitor = products.find(p => p.name === '27" Monitor');
    const keyboard = products.find(p => p.name === 'Mechanical Keyboard');
    const deskLamp = products.find(p => p.name === 'Desk Lamp');

    if (webcam?.available === 0) {
      result.push({ priority: 'Critical', title: 'Reorder Webcam 1080p', text: `Stock is zero. Replenish ${webcam.reorderQuantity} units immediately to remove the stockout risk.` });
    }
    if (monitor && monitor.available < monitor.reorderPoint) {
      result.push({ priority: 'Critical', title: 'Protect monitor availability', text: `Only ${monitor.available} units are available while Order #1002 needs 8. Replenish ${monitor.reorderQuantity} units.` });
    }
    if (keyboard && keyboard.available <= keyboard.reorderPoint) {
      result.push({ priority: 'High', title: 'Replenish Mechanical Keyboard', text: `Available stock is ${keyboard.available}, below the reorder point of ${keyboard.reorderPoint}.` });
    }
    if (deskLamp && deskLamp.available <= deskLamp.reorderPoint) {
      result.push({ priority: 'Medium', title: 'Review Desk Lamp inventory', text: `Available stock is ${deskLamp.available}. Keep a closer watch before the next order cycle.` });
    }
    result.push({ priority: 'Medium', title: 'Prioritize exception resolution', text: 'Resolve the outstanding inventory exceptions after replenishment so affected orders can be re-allocated.' });
    return result.slice(0, 5);
  }, [products]);

  const askAI = () => {
    const normalized = question.trim().toLowerCase();
    if (!normalized) return;
    const match = cannedAnswers.find(item => item.keywords.some(keyword => normalized.includes(keyword)));
    setAnswer(match?.answer || 'Based on the current warehouse snapshot, focus first on stockouts, priority-order shortages, and unresolved exceptions. Try asking about reorder recommendations, order risks, bottlenecks, or today\'s briefing.');
  };

  if (loading) return <div className="ai-loading">Loading AI warehouse analysis...</div>;

  return (
    <div className="ai-page">
      <div className="ai-header">
        <div>
          <div className="ai-eyebrow">SMART WAREHOUSE INTELLIGENCE</div>
          <h1>🤖 AI Warehouse Analysis</h1>
          <p className="page-subtitle">A decision-support view generated from your current warehouse data.</p>
        </div>
        <div className="ai-mode-badge">DEMO AI · HARD-CODED</div>
      </div>

      <div className="ai-hero card">
        <div className="health-score">
          <div className="score-ring"><span>{analysis.score}</span><small>/100</small></div>
          <div>
            <div className="label">Warehouse Health</div>
            <h2>{analysis.score >= 80 ? 'Operationally Healthy' : 'Needs Attention'}</h2>
            <p>Inventory pressure and fulfillment risk are the main concerns in the current snapshot.</p>
          </div>
        </div>
        <div className="ai-hero-stats">
          <div><strong className="critical-text">{analysis.criticalCount}</strong><span>Critical risks</span></div>
          <div><strong className="warning-text">{analysis.warningCount}</strong><span>Warnings</span></div>
          <div><strong>{analysis.orderRisks.length}</strong><span>Orders at risk</span></div>
          <div><strong>{analysis.unresolvedCount}</strong><span>Open exceptions</span></div>
        </div>
      </div>

      <div className="ai-grid ai-grid-top">
        <section className="card">
          <div className="section-heading">
            <div><h3>🚨 Critical Inventory Signals</h3><p>Products the AI would review first.</p></div>
            <span className="badge badge-danger">{analysis.risks.length} signals</span>
          </div>
          <div className="risk-list">
            {analysis.risks.map(product => (
              <div className={`risk-item ${product.severity}`} key={product.id}>
                <div className="risk-icon">{product.severity === 'critical' ? '!' : '!'}</div>
                <div className="risk-content">
                  <div className="risk-title-row"><strong>{product.name}</strong><span className={`ai-severity ${product.severity}`}>{severityLabel(product.severity)}</span></div>
                  <p>{product.available} available · reorder point {product.reorderPoint} · suggested reorder {product.reorderQuantity}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="section-heading">
            <div><h3>📦 Fulfillment Risk</h3><p>Orders affected by current inventory.</p></div>
            <span className="badge badge-warning">{analysis.orderRisks.length} at risk</span>
          </div>
          {analysis.orderRisks.length === 0 ? <p className="muted">No fulfillment risks detected.</p> : (
            <div className="order-risk-list">
              {analysis.orderRisks.map(order => (
                <div className="order-risk" key={order.id}>
                  <div className="order-risk-header"><strong>Order #{order.id}</strong><span className={`ai-severity ${order.severity}`}>{order.customerTier}</span></div>
                  <p>{order.customerName} · {order.status}</p>
                  {order.shortages.map(shortage => <div className="shortage" key={shortage.product.id}><span>{shortage.product.name}</span><strong>Short {shortage.shortage}</strong></div>)}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="card">
        <div className="section-heading">
          <div><h3>🧠 AI Recommendations</h3><p>Suggested actions based on the current warehouse snapshot.</p></div>
          <span className="demo-pill">SIMULATED</span>
        </div>
        <div className="recommendation-grid">
          {recommendations.map((item, index) => (
            <div className="recommendation" key={item.title}>
              <div className="recommendation-number">{index + 1}</div>
              <div><span className={`recommendation-priority ${item.priority.toLowerCase()}`}>{item.priority}</span><h4>{item.title}</h4><p>{item.text}</p></div>
            </div>
          ))}
        </div>
      </section>

      <div className="ai-grid">
        <section className="card">
          <div className="section-heading"><div><h3>🔎 Bottleneck Analysis</h3><p>Where the warehouse is most exposed.</p></div></div>
          <div className="bottleneck-card">
            <div className="bottleneck-score">1</div>
            <div><span className="ai-severity critical">Highest priority</span><h3>27&quot; Monitor</h3><p>The monitor is below its reorder point and is tied directly to a priority customer order. Replenishment would reduce both inventory and fulfillment risk.</p></div>
          </div>
        </section>

        <section className="card">
          <div className="section-heading"><div><h3>💬 Ask Warehouse AI</h3><p>Try a few questions. This demo uses predefined responses.</p></div></div>
          <div className="ai-chat">
            <div className="chat-suggestions">
              {['What should I reorder?', 'Which orders are at risk?', 'What is the bottleneck?', 'Give me today\'s briefing'].map(item => <button className="suggestion" key={item} onClick={() => setQuestion(item)}>{item}</button>)}
            </div>
            <div className="chat-input-row">
              <input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && askAI()} placeholder="Ask about inventory, orders, risks..." />
              <button onClick={askAI}>Ask AI</button>
            </div>
            {answer && <div className="chat-answer"><div className="chat-avatar">🤖</div><div><strong>Warehouse AI</strong><p>{answer}</p></div></div>}
          </div>
        </section>
      </div>

      <div className="ai-disclaimer">This page is intentionally hard-coded for the demo. The future version can replace these rules with a real AI model and predictive forecasting engine.</div>
    </div>
  );
}
