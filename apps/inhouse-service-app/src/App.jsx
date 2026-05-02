import React from 'react';
import { Check, ArrowUp, X } from 'lucide-react';

const OrderItem = ({ name, qty, details }) => (
  <div className="order-item">
    {name} x{qty} {details && <span className="item-detail">[{details}]</span>}
  </div>
);

const OrderCard = ({ number, time, items, status }) => {
  return (
    <div className="order-card">
      <div className="order-info">
        <div className="order-number-wrapper">
          <div className="order-number">{number}</div>
          <div className="order-time">{time}</div>
        </div>
        <div className="order-items">
          {items.map((item, idx) => (
            <OrderItem key={idx} {...item} />
          ))}
        </div>
      </div>
      <div className="order-actions">
        {status === 'preparing' ? (
          <button className="btn btn-check">
            <Check className="icon" size={24} color="#000" strokeWidth={3} />
          </button>
        ) : (
          <>
            <button className="btn btn-up">
              <ArrowUp className="icon" size={24} color="#000" strokeWidth={3} />
            </button>
            <button className="btn btn-remove">
              <X className="icon" size={24} color="#000" strokeWidth={3} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

function App() {
  const preparingOrders = [
    {
      number: '1420',
      time: '00:00:00 AM',
      status: 'preparing',
      items: [
        { name: 'Momo', qty: 1 },
        { name: 'Milkshake', qty: 2, details: 'iced, medium' },
        { name: 'Ice-cream', qty: 1, details: 'choco' }
      ]
    }
  ];

  const queueOrders = [
    {
      number: '1421',
      time: '00:00:00 AM',
      status: 'queue',
      items: [
        { name: 'Momo', qty: 1 },
        { name: 'Coffee', qty: 2 }
      ]
    },
    {
      number: '1432',
      time: '00:00:00 AM',
      status: 'queue',
      items: [
        { name: 'Chowmein', qty: 3, details: 'extra' },
        { name: 'Milkshake', qty: 2, details: 'iced, medium' },
        { name: 'Ice-cream', qty: 1, details: 'choco' },
        { name: 'Biriyani', qty: 2 },
        { name: 'Nan', qty: 1 }
      ]
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <header className="header">
        <div className="logo">Q-KARD</div>
      </header>

      <div className="section-bar section-preparing">PREPARING</div>
      <div className="orders-container">
        {preparingOrders.map(order => (
          <OrderCard key={order.number} {...order} />
        ))}
      </div>

      <div className="section-bar section-queue">ORDER QUEUE</div>
      <div className="orders-container">
        {queueOrders.map(order => (
          <OrderCard key={order.number} {...order} />
        ))}
      </div>
    </div>
  );
}

export default App;
