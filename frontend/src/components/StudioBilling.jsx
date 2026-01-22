import React from 'react';
import { CreditCard, Zap, Check, Clock, TrendingUp, Shield, Rocket } from 'lucide-react';
import './StudioDashboard.css';

export default function StudioBilling({ credits = 0, plan = 'Free' }) {
  const PLANS = [
    {
      name: 'Free',
      price: '$0',
      credits: '500 / mo',
      features: ['Basic AI Access', 'Standard Generation Speed', 'Community Support'],
      active: plan === 'Free',
      color: 'var(--text-secondary)'
    },
    {
      name: 'Pro',
      price: '$29',
      credits: '5,000 / mo',
      features: ['Priority Access', 'Faster Generation', 'Commercial License', 'Private Mode'],
      active: plan === 'Pro',
      color: 'var(--color-purple)',
      popular: true
    },
    {
      name: 'Studio',
      price: '$99',
      credits: '20,000 / mo',
      features: ['API Access', 'Custom AI Models', 'Team Collaboration', '24/7 Support'],
      active: plan === 'Studio',
      color: 'var(--color-cyan)'
    }
  ];

  return (
    <div className="studio-dashboard animate-fadeIn">
      <div className="dashboard-header">
        <div className="welcome-text">
          <h1>Billing & Subscription</h1>
          <p>Manage your plan and credits.</p>
        </div>
        <div className="credit-balance-pill" style={{ 
          background: 'rgba(168, 85, 247, 0.1)', 
          border: '1px solid rgba(168, 85, 247, 0.2)',
          padding: '8px 16px',
          borderRadius: '50px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--color-purple)'
        }}>
          <Zap size={16} fill="currentColor" />
          <span style={{ fontWeight: 600 }}>{credits} Credits Available</span>
        </div>
      </div>

      <h3 className="section-title">Current Plan</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {PLANS.map((p) => (
          <div key={p.name} style={{
            background: p.active ? 'rgba(168, 85, 247, 0.05)' : 'rgba(255,255,255,0.02)',
            border: p.active ? '2px solid var(--color-purple)' : '1px solid rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '24px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {p.popular && (
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--color-purple)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '50px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>MOST POPULAR</div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: p.active ? 'var(--color-purple)' : 'white' }}>{p.name}</h3>
              {p.active && <div style={{ 
                background: 'var(--color-purple)', 
                color: 'white', 
                padding: '4px 8px', 
                borderRadius: '4px', 
                fontSize: '0.7rem' 
              }}>CURRENT</div>}
            </div>

            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {p.price} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/ month</span>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '12px', 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '8px' 
            }}>
              <Zap size={16} color="var(--color-purple)" />
              <span>{p.credits} credits</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              {p.features.map(f => (
                <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <Check size={14} color="var(--color-green)" /> {f}
                </div>
              ))}
            </div>

            <button style={{
              marginTop: 'auto',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: p.active ? 'rgba(255,255,255,0.1)' : 'var(--color-purple)',
              color: 'white',
              cursor: p.active ? 'default' : 'pointer',
              fontWeight: 600,
              opacity: p.active ? 0.7 : 1
            }}>
              {p.active ? 'Active Plan' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>

      <h3 className="section-title" style={{ marginTop: '32px' }}>Billing History</h3>
      <div style={{ 
        background: 'rgba(255,255,255,0.02)', 
        borderRadius: '16px', 
        border: '1px solid rgba(255,255,255,0.05)',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', color: 'var(--text-secondary)', flexDirection: 'column', gap: '12px' }}>
          <Clock size={40} style={{ opacity: 0.3 }} />
          <div>No billing history available on free plan.</div>
        </div>
      </div>
    </div>
  );
}
