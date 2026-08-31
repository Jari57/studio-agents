import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  BarChart3, 
  Zap, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  Activity,
  Music,
  Download,
  Share2,
  Clock,
  ArrowUpRight,
  LayoutDashboard,
  Server,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Database,
  Cpu,
  Globe,
  CreditCard,
  PieChart,
  Target,
  ArrowDown,
  ArrowUp,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminAnalytics = ({ BACKEND_URL = '', auth }) => {
  const [stats, setStats] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [agentStats, setAgentStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await auth?.currentUser?.getIdToken();
      if (!token) {
        toast.error('Admin authentication required');
        setIsLoading(false);
        return;
      }
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [statsRes, healthRes, agentRes] = await Promise.allSettled([
        fetch(`${BACKEND_URL}/api/admin/stats`, { headers }),
        fetch(`${BACKEND_URL}/api/admin/health-deep`, { headers }),
        fetch(`${BACKEND_URL}/api/admin/stats/agents`, { headers })
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        setStats(await statsRes.value.json());
      }
      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        setHealthData(await healthRes.value.json());
      }
      if (agentRes.status === 'fulfilled' && agentRes.value.ok) {
        setAgentStats(await agentRes.value.json());
      }
      setLastRefresh(new Date());
      toast.success('Dashboard refreshed');
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      toast.error('Failed to fetch live data');
    } finally {
      setIsLoading(false);
    }
  }, [BACKEND_URL, auth]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const fmt = (n, decimals = 0) => typeof n === 'number' ? n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : n || '—';
  const fmtUSD = (n) => typeof n === 'number' ? `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Not measured';

  // ── Card Components ──
  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <div style={{ background: "rgba(var(--studio-ink-rgb), 0.03)", borderRadius: '16px', padding: '20px', border: "1px solid rgba(var(--studio-ink-rgb), 0.06)", position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '80px', height: '80px', background: `color-mix(in srgb, ${color} 6%, transparent)`, borderRadius: '50%', filter: 'blur(30px)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `color-mix(in srgb, ${color} 8%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          <Icon size={18} />
        </div>
        {trend !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: trend >= 0 ? "var(--studio-sage)" : "var(--studio-danger)", fontSize: '0.75rem', fontWeight: '700', background: trend >= 0 ? "rgba(86,105,84, 0.1)" : 'rgba(239,68,68,0.1)', padding: '3px 7px', borderRadius: '20px' }}>
            {trend >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ marginTop: '12px', position: 'relative', zIndex: 1 }}>
        <p style={{ margin: 0, fontSize: '0.78rem', color: "var(--studio-muted)", fontWeight: '500' }}>{title}</p>
        <h2 style={{ margin: '2px 0', fontSize: '1.5rem', fontWeight: '800', color: "var(--studio-ink)" }}>{value}</h2>
        {subtitle && <p style={{ margin: 0, fontSize: '0.7rem', color: "var(--studio-muted)" }}>{subtitle}</p>}
      </div>
    </div>
  );

  const StatusDot = ({ status }) => {
    const colors = { ok: '#10b981', error: '#ef4444', not_configured: '#6b7280', degraded: '#f59e0b' };
    return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: colors[status] || "var(--studio-muted)", marginRight: 6 }} />;
  };

  const SectionHeader = ({ icon: Icon, title, color = "var(--studio-accent)" }) => (
    <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: "var(--studio-ink)" }}>
      <Icon size={18} color={color} /> {title}
    </h3>
  );

  const Panel = ({ children, style = {} }) => (
    <div style={{ background: "rgba(var(--studio-ink-rgb), 0.03)", borderRadius: '16px', padding: '20px', border: "1px solid rgba(var(--studio-ink-rgb), 0.06)", ...style }}>
      {children}
    </div>
  );

  const TabButton = ({ id, label, icon: Icon }) => (
    <button 
      onClick={() => setActiveTab(id)}
      style={{ 
        padding: '8px 16px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: activeTab === id ? '700' : '500',
        background: activeTab === id ? "linear-gradient(135deg, var(--studio-accent), var(--studio-blue))" : "rgba(var(--studio-ink-rgb), 0.05)",
        border: activeTab === id ? 'none' : "1px solid rgba(var(--studio-ink-rgb), 0.08)", color: "var(--studio-ink)", cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
        boxShadow: activeTab === id ? "0 4px 15px rgba(163,66,41, 0.3)" : 'none'
      }}
    >
      <Icon size={14} /> {label}
    </button>
  );

  // ── Loading state ──
  if (isLoading && !stats) {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center', color: "var(--studio-muted)" }}>
        <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: 16 }}>Loading Command Center...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const s = stats || {};
  const h = healthData || {};

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', color: "var(--studio-ink)" }}>
      {/* ── HEADER ── */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={28} color="var(--studio-accent)" /> Command Center
          </h1>
          <p style={{ margin: '4px 0 0', color: "var(--studio-muted)", fontSize: '0.85rem' }}>
            Live platform metrics • {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : 'Loading...'} 
            {h.overallStatus && <> • <StatusDot status={h.overallStatus === 'healthy' ? 'ok' : 'degraded'} /> {h.overallStatus}</>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchStats} disabled={isLoading} style={{ padding: '8px 14px', borderRadius: '10px', background: "rgba(var(--studio-ink-rgb), 0.05)", border: "1px solid rgba(var(--studio-ink-rgb), 0.1)", color: "var(--studio-ink)", fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: isLoading ? 0.5 : 1 }}>
            <RefreshCw size={14} style={isLoading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
          </button>
        </div>
      </div>

      {/* ── TAB NAVIGATION ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <TabButton id="overview" label="Overview" icon={LayoutDashboard} />
        <TabButton id="financial" label="Financial" icon={DollarSign} />
        <TabButton id="users" label="Users & Growth" icon={Users} />
        <TabButton id="infrastructure" label="Infrastructure" icon={Server} />
        <TabButton id="security" label="Security & Compliance" icon={Shield} />
        <TabButton id="agents" label="Agent Performance" icon={Music} />
      </div>

      {/* ============================================== */}
      {/* ══ OVERVIEW TAB ══ */}
      {/* ============================================== */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <StatCard title="Total Creators" value={fmt(s.users?.total)} icon={Users} color="var(--studio-accent)" subtitle={`${fmt(s.users?.newToday)} new today`} trend={s.growth?.wowUserGrowth} />
            <StatCard title="MRR" value={fmtUSD(s.revenue?.mrr)} icon={DollarSign} color="var(--studio-sage)" subtitle={`ARR: ${fmtUSD(s.revenue?.arr)}`} />
            <StatCard title="Conversion Rate" value={`${s.revenue?.conversionRate || 0}%`} icon={Target} color="var(--studio-warning)" subtitle={`${fmt(s.users?.paid)} paid users`} />
            <StatCard title="DAU Estimate" value={fmt(s.users?.dauEstimate)} icon={Activity} color="var(--studio-blue)" subtitle={`WAU: ${fmt(s.users?.wauEstimate)}`} />
            <StatCard title="LTV:CAC Ratio" value={`${s.unitEconomics?.ltvCacRatio || 0}x`} icon={TrendingUp} color="var(--studio-accent)" subtitle={`LTV: ${fmtUSD(s.unitEconomics?.ltv)}`} />
            <StatCard title="Gross Margin" value={typeof s.unitEconomics?.grossMargin === 'number' ? `${s.unitEconomics.grossMargin}%` : 'Not measured'} icon={PieChart} color="var(--studio-accent)" subtitle={`Cost/gen: ${fmtUSD(s.unitEconomics?.avgCostPerGeneration)}`} />
          </div>

          {/* Two-column: Breakeven + API Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* Breakeven Card */}
            <Panel>
              <SectionHeader icon={Target} title="Breakeven Analysis" color="var(--studio-sage)" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { l: 'Fixed Monthly Costs', v: fmtUSD(s.breakeven?.fixedMonthlyCosts?.total) },
                  { l: 'Variable Costs (est.)', v: fmtUSD(s.breakeven?.estimatedVariableCosts) },
                  { l: 'Total Monthly Costs', v: fmtUSD(s.breakeven?.totalMonthlyCosts) },
                  { l: 'Current MRR', v: fmtUSD(s.breakeven?.currentMRR) },
                  { l: 'Users to Breakeven', v: fmt(s.breakeven?.breakEvenUsers) },
                  { l: 'Months to Breakeven', v: s.breakeven?.monthsToBreakeven || '—' }
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '0.72rem', color: "var(--studio-muted)", textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.l}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '2px' }}>{item.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: '10px', background: s.breakeven?.profitable ? "rgba(86,105,84, 0.1)" : 'rgba(239,68,68,0.08)', border: `1px solid ${s.breakeven?.profitable ? "rgba(86,105,84, 0.2)" : 'rgba(239,68,68,0.15)'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {s.breakeven?.profitable ? <CheckCircle size={16} color="var(--studio-sage)" /> : <AlertTriangle size={16} color="var(--studio-warning)" />}
                <span style={{ fontSize: '0.82rem', fontWeight: '600' }}>{s.breakeven?.profitable ? 'Currently Profitable' : 'Pre-Profit — Scaling Phase'}</span>
              </div>
            </Panel>

            {/* API Provider Status */}
            <Panel>
              <SectionHeader icon={Wifi} title="API Provider Status" color="var(--studio-blue)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {h.checks && Object.entries(h.checks).filter(([k]) => !['process', 'operations'].includes(k)).map(([name, check]) => (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '8px', background: "rgba(var(--studio-ink-rgb), 0.02)" }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StatusDot status={check.status} />
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'capitalize' }}>{name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {check.latencyMs && <span style={{ fontSize: '0.72rem', color: "var(--studio-muted)" }}>{check.latencyMs}ms</span>}
                      {check.tier && <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: "rgba(163,66,41, 0.15)", color: "var(--studio-accent)" }}>{check.tier}</span>}
                      {check.credits !== undefined && <span style={{ fontSize: '0.72rem', color: "var(--studio-muted)" }}>{check.credits} credits</span>}
                      {check.characterUtilization && <span style={{ fontSize: '0.72rem', color: "var(--studio-muted)" }}>{check.characterUtilization} used</span>}
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: check.status === 'ok' ? "rgba(86,105,84, 0.1)" : check.status === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(107,114,128,0.1)', color: check.status === 'ok' ? "var(--studio-sage)" : check.status === 'error' ? "var(--studio-danger)" : "var(--studio-muted)", fontWeight: '700' }}>{check.status?.toUpperCase()}</span>
                    </div>
                  </div>
                ))}
                {(!h.checks || Object.keys(h.checks).length === 0) && (
                  <div style={{ fontSize: '0.85rem', color: "var(--studio-muted)", textAlign: 'center', padding: '20px' }}>Health check loading...</div>
                )}
              </div>
            </Panel>
          </div>

          {/* Tier Distribution */}
          <Panel style={{ marginBottom: '24px' }}>
            <SectionHeader icon={Users} title="User Tier Distribution" color="var(--studio-accent)" />
            <div style={{ display: 'flex', gap: '4px', height: '32px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
              {s.users?.byTier && Object.entries(s.users.byTier).filter(([,v]) => v > 0).map(([tier, count]) => {
                const colors = { free: '#6b7280', creator: '#06b6d4', studio: '#8b5cf6', pro: '#a855f7', lifetime: '#f59e0b' };
                const pct = s.users.total > 0 ? (count / s.users.total) * 100 : 0;
                return pct > 0 ? (
                  <div key={tier} style={{ width: `${pct}%`, background: colors[tier] || "var(--studio-muted)", display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '700', color: "var(--studio-ink)", minWidth: pct > 5 ? 'auto' : '0' }} title={`${tier}: ${count}`}>
                    {pct > 8 ? `${tier} (${count})` : ''}
                  </div>
                ) : null;
              })}
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {s.users?.byTier && Object.entries(s.users.byTier).map(([tier, count]) => (
                <div key={tier} style={{ fontSize: '0.78rem' }}>
                  <span style={{ color: "var(--studio-muted)", textTransform: 'capitalize' }}>{tier}:</span>{' '}
                  <span style={{ fontWeight: '700' }}>{fmt(count)}</span>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}

      {/* ============================================== */}
      {/* ══ FINANCIAL TAB ══ */}
      {/* ============================================== */}
      {activeTab === 'financial' && (
        <>
          {/* Revenue KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <StatCard title="Monthly Recurring Revenue" value={fmtUSD(s.revenue?.mrr)} icon={DollarSign} color="var(--studio-sage)" />
            <StatCard title="Annual Recurring Revenue" value={fmtUSD(s.revenue?.arr)} icon={TrendingUp} color="var(--studio-blue)" />
            <StatCard title="ARPU (All Users)" value={fmtUSD(s.revenue?.arpu)} icon={Users} color="var(--studio-accent)" />
            <StatCard title="ARPPU (Paying Only)" value={fmtUSD(s.revenue?.arppu)} icon={CreditCard} color="var(--studio-warning)" />
          </div>

          {/* Unit Economics Panel */}
          <Panel style={{ marginBottom: '24px' }}>
            <SectionHeader icon={BarChart3} title="Unit Economics — C-Suite View" color="var(--studio-sage)" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
              {[
                { label: 'Avg Cost / Generation', value: fmtUSD(s.unitEconomics?.avgCostPerGeneration), color: "var(--studio-danger)" },
                { label: 'Avg Revenue / Credit', value: fmtUSD(s.unitEconomics?.avgRevenuePerCredit), color: "var(--studio-sage)" },
                { label: 'Gross Margin', value: typeof s.unitEconomics?.grossMargin === 'number' ? `${s.unitEconomics.grossMargin}%` : 'Not measured', color: "var(--studio-sage)" },
                { label: 'Customer LTV', value: fmtUSD(s.unitEconomics?.ltv), color: "var(--studio-accent)" },
                { label: 'CAC (Blended)', value: fmtUSD(s.unitEconomics?.cac), color: "var(--studio-warning)" },
                { label: 'LTV:CAC Ratio', value: `${s.unitEconomics?.ltvCacRatio || 0}x`, color: "var(--studio-accent)" },
                { label: 'Payback Period', value: `${s.unitEconomics?.paybackMonths || '—'} mo`, color: "var(--studio-blue)" },
                { label: 'Projected CAGR', value: `${s.revenue?.projectedCAGR || 0}%`, color: "var(--studio-accent)" }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ width: '4px', height: '40px', borderRadius: '2px', background: item.color, flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '0.72rem', color: "var(--studio-muted)", textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '2px' }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Pricing Structure */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <Panel>
              <SectionHeader icon={CreditCard} title="Subscription Pricing" color="var(--studio-accent)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {s.revenue?.subscriptionPrices && Object.entries(s.revenue.subscriptionPrices).map(([tier, price]) => (
                  <div key={tier} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: "rgba(var(--studio-ink-rgb), 0.02)" }}>
                    <span style={{ textTransform: 'capitalize', fontWeight: '600', fontSize: '0.85rem' }}>{tier}</span>
                    <span style={{ fontWeight: '800', color: "var(--studio-sage)" }}>{fmtUSD(price)}{tier !== 'lifetime' ? '/mo' : ' one-time'}</span>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel>
              <SectionHeader icon={Zap} title="Credit Pack Pricing" color="var(--studio-warning)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {s.revenue?.creditPackPrices && Object.entries(s.revenue.creditPackPrices).map(([credits, price]) => (
                  <div key={credits} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: "rgba(var(--studio-ink-rgb), 0.02)" }}>
                    <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{credits} Credits</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: '800', color: "var(--studio-warning)" }}>{fmtUSD(price)}</span>
                      <div style={{ fontSize: '0.65rem', color: "var(--studio-muted)" }}>{fmtUSD(price / parseInt(credits))}/credit</div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* Revenue by Tier */}
          {s.revenue?.revenueByTier && (
            <Panel style={{ marginBottom: '24px' }}>
              <SectionHeader icon={PieChart} title="Revenue Breakdown by Tier" color="var(--studio-accent)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(s.revenue.revenueByTier).filter(([,v]) => v > 0).map(([tier, amount]) => {
                  const total = Object.values(s.revenue.revenueByTier).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
                  const colors = { creator: '#06b6d4', studio: '#8b5cf6', lifetime: '#f59e0b' };
                  return (
                    <div key={tier}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '5px' }}>
                        <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>{tier}</span>
                        <span style={{ fontWeight: '700' }}>{fmtUSD(amount)} <span style={{ color: "var(--studio-muted)", fontWeight: '500' }}>({pct}%)</span></span>
                      </div>
                      <div style={{ height: '8px', background: "rgba(var(--studio-ink-rgb), 0.05)", borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: colors[tier] || "var(--studio-accent)", borderRadius: '4px', transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}

          {/* Credit Costs per Feature */}
          <Panel style={{ marginBottom: '24px' }}>
            <SectionHeader icon={Zap} title="Credit Costs per Feature (Margin Analysis)" color="var(--studio-blue)" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              {s.unitEconomics?.creditCosts && Object.entries(s.unitEconomics.creditCosts).map(([feature, cost]) => (
                <div key={feature} style={{ padding: '10px', borderRadius: '8px', background: "rgba(var(--studio-ink-rgb), 0.02)", textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: "var(--studio-muted)", textTransform: 'uppercase' }}>{feature}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', marginTop: '2px' }}>{cost} <span style={{ fontSize: '0.65rem', fontWeight: '500', color: "var(--studio-muted)" }}>credits</span></div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Breakeven Deep Dive */}
          <Panel style={{ background: "linear-gradient(135deg, rgba(86,105,84, 0.05), rgba(61,100,114, 0.05))", border: "1px solid rgba(86,105,84, 0.1)" }}>
            <SectionHeader icon={Target} title="Breakeven & Profitability Deep Dive" color="var(--studio-sage)" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.82rem', color: "var(--studio-muted)", fontWeight: '600' }}>Fixed Costs (Monthly)</h4>
                {s.breakeven?.fixedMonthlyCosts && Object.entries(s.breakeven.fixedMonthlyCosts).filter(([k]) => k !== 'total').map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.82rem' }}>
                    <span style={{ color: "var(--studio-muted)", textTransform: 'capitalize' }}>{k}</span>
                    <span style={{ fontWeight: '600' }}>{fmtUSD(v)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', borderTop: "1px solid rgba(var(--studio-ink-rgb), 0.08)", marginTop: '8px', fontWeight: '800' }}>
                  <span>Total Fixed</span>
                  <span>{fmtUSD(s.breakeven?.fixedMonthlyCosts?.total)}</span>
                </div>
              </div>
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.82rem', color: "var(--studio-muted)", fontWeight: '600' }}>Revenue vs Costs</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ padding: '10px 12px', borderRadius: '8px', background: "rgba(86,105,84, 0.08)" }}>
                    <div style={{ fontSize: '0.7rem', color: "var(--studio-sage)" }}>REVENUE (MRR)</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '800' }}>{fmtUSD(s.breakeven?.currentMRR)}</div>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)' }}>
                    <div style={{ fontSize: '0.7rem', color: "var(--studio-danger)" }}>TOTAL COSTS</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '800' }}>{fmtUSD(s.breakeven?.totalMonthlyCosts)}</div>
                  </div>
                </div>
              </div>
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.82rem', color: "var(--studio-muted)", fontWeight: '600' }}>Verdict</h4>
                <div style={{ padding: '16px', borderRadius: '12px', background: s.breakeven?.profitable ? "rgba(86,105,84, 0.1)" : 'rgba(245,158,11,0.1)', border: `1px solid ${s.breakeven?.profitable ? "rgba(86,105,84, 0.2)" : 'rgba(245,158,11,0.2)'}`, textAlign: 'center' }}>
                  {s.breakeven?.profitable ? <CheckCircle size={28} color="var(--studio-sage)" /> : <AlertTriangle size={28} color="var(--studio-warning)" />}
                  <div style={{ fontSize: '1rem', fontWeight: '800', marginTop: '8px' }}>{s.breakeven?.profitable ? 'PROFITABLE' : 'PRE-PROFIT'}</div>
                  <div style={{ fontSize: '0.75rem', color: "var(--studio-muted)", marginTop: '4px' }}>
                    {s.breakeven?.profitable ? 'Unit economics positive' : `Need ${s.breakeven?.breakEvenUsers || '?'} paid users`}
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </>
      )}

      {/* ============================================== */}
      {/* ══ USERS & GROWTH TAB ══ */}
      {/* ============================================== */}
      {activeTab === 'users' && (
        <>
          {/* Growth KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <StatCard title="New Today" value={fmt(s.users?.newToday)} icon={Users} color="var(--studio-sage)" />
            <StatCard title="New This Week" value={fmt(s.users?.newThisWeek)} icon={Users} color="var(--studio-blue)" />
            <StatCard title="New This Month" value={fmt(s.users?.newThisMonth)} icon={Users} color="var(--studio-accent)" />
            <StatCard title="Monthly Growth" value={`${s.growth?.monthlyRate || 0}%`} icon={TrendingUp} color="var(--studio-warning)" />
            <StatCard title="Projected CAGR" value={`${s.growth?.projectedCAGR || 0}%`} icon={ArrowUpRight} color="var(--studio-accent)" subtitle="Based on current monthly growth" />
            <StatCard title="Credits in Circulation" value={fmt(s.credits?.totalInCirculation)} icon={Zap} color="var(--studio-accent)" subtitle={`Avg ${fmt(s.credits?.averagePerUser)}/user`} />
            <StatCard title="Est. Churn Rate" value={`${s.users?.estimatedChurnRate ?? '—'}%`} icon={ArrowDown} color="var(--studio-danger)" subtitle={`${fmt(s.users?.churningPaidUsers)} paid users inactive >30d`} />
          </div>

          {/* Signups Trend Chart */}
          <Panel style={{ marginBottom: '24px' }}>
            <SectionHeader icon={BarChart3} title="Signups — Last 30 Days" color="var(--studio-blue)" />
            {s.growth?.signupsTrend && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '120px', paddingTop: '8px' }}>
                {s.growth.signupsTrend.map((day, i) => {
                  const maxCount = Math.max(...s.growth.signupsTrend.map(d => d.count), 1);
                  const height = (day.count / maxCount) * 100;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }} title={`${day.date}: ${day.count} signups`}>
                      <div style={{ width: '100%', maxWidth: '20px', height: `${Math.max(height, 2)}%`, background: day.count > 0 ? "linear-gradient(180deg, var(--studio-accent), var(--studio-blue))" : "rgba(var(--studio-ink-rgb), 0.05)", borderRadius: '3px 3px 0 0', transition: 'height 0.3s' }} />
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.65rem', color: "var(--studio-muted)" }}>
              <span>{s.growth?.signupsTrend?.[0]?.date}</span>
              <span>{s.growth?.signupsTrend?.[s.growth.signupsTrend.length - 1]?.date}</span>
            </div>
          </Panel>

          {/* Credit Distribution + Customer Journey */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <Panel>
              <SectionHeader icon={PieChart} title="Credit Distribution" color="var(--studio-warning)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {s.users?.creditDistribution && Object.entries(s.users.creditDistribution).map(([range, count]) => {
                  const pct = s.users.total > 0 ? (count / s.users.total * 100).toFixed(1) : 0;
                  return (
                    <div key={range}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                        <span style={{ color: "var(--studio-muted)" }}>{range} credits</span>
                        <span style={{ fontWeight: '700' }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: '6px', background: "rgba(var(--studio-ink-rgb), 0.05)", borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: "linear-gradient(90deg, var(--studio-warning), var(--studio-danger))", borderRadius: '3px', transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel>
              <SectionHeader icon={ArrowUpRight} title="Customer Journey Map" color="var(--studio-accent)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {[
                  { stage: 'Awareness', desc: 'Landing page visit', metric: `${fmt(s.users?.total)} total users`, color: "var(--studio-muted)" },
                  { stage: 'Activation', desc: 'Account creation + first generation', metric: `${fmt(s.users?.total)} registered`, color: "var(--studio-blue)" },
                  { stage: 'Engagement', desc: 'Regular usage (DAU)', metric: `${fmt(s.users?.dauEstimate)} daily active`, color: "var(--studio-accent)" },
                  { stage: 'Monetization', desc: 'Subscribe or buy credits', metric: `${fmt(s.users?.paid)} paying (${s.revenue?.conversionRate}%)`, color: "var(--studio-sage)" },
                  { stage: 'Retention', desc: 'Return weekly', metric: `${fmt(s.users?.wauEstimate)} weekly active`, color: "var(--studio-warning)" },
                  { stage: 'Referral', desc: 'Invite others', metric: 'Organic growth', color: "var(--studio-accent)" }
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', padding: '8px 0' }}>
                    <div style={{ width: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: step.color, flexShrink: 0 }} />
                      {i < 5 && <div style={{ width: '2px', flex: 1, background: "rgba(var(--studio-ink-rgb), 0.06)" }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: '700' }}>{step.stage}</div>
                      <div style={{ fontSize: '0.7rem', color: "var(--studio-muted)" }}>{step.desc}</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: step.color, marginTop: '2px' }}>{step.metric}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}

      {/* ============================================== */}
      {/* ══ INFRASTRUCTURE TAB ══ */}
      {/* ============================================== */}
      {activeTab === 'infrastructure' && (
        <>
          {/* System Health KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <StatCard title="Uptime" value={`${s.system?.uptimeDays || 0}d`} icon={Clock} color="var(--studio-sage)" subtitle={`PID: ${h.checks?.process?.pid || '—'}`} />
            <StatCard title="Heap Memory" value={`${s.system?.memory?.heapUsed || 0}MB`} icon={Cpu} color="var(--studio-accent)" subtitle={`of ${s.system?.memory?.heapTotal || 0}MB (${h.checks?.process?.memory?.heapUtilization || '—'})`} />
            <StatCard title="RSS Memory" value={`${s.system?.memory?.rss || 0}MB`} icon={Database} color="var(--studio-blue)" subtitle={`External: ${s.system?.memory?.external || 0}MB`} />
            <StatCard title="Active Jobs" value={fmt((s.system?.activeVideoJobs || 0) + (s.system?.activePendingOps || 0) + (s.system?.activeFormatConversions || 0))} icon={Activity} color="var(--studio-warning)" subtitle={`Video: ${s.system?.activeVideoJobs || 0}, Ops: ${s.system?.activePendingOps || 0}`} />
          </div>

          {/* API Provider Detail Cards */}
          <Panel style={{ marginBottom: '24px' }}>
            <SectionHeader icon={Globe} title="API Provider Connections" color="var(--studio-blue)" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {s.apiProviders && Object.entries(s.apiProviders).map(([name, info]) => (
                <div key={name} style={{ padding: '16px', borderRadius: '12px', background: info.configured ? "rgba(86,105,84, 0.04)" : 'rgba(107,114,128,0.05)', border: `1px solid ${info.configured ? "rgba(86,105,84, 0.1)" : 'rgba(107,114,128,0.1)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', textTransform: 'capitalize' }}>{name}</span>
                    {info.configured ? <CheckCircle size={16} color="var(--studio-sage)" /> : <XCircle size={16} color="var(--studio-muted)" />}
                  </div>
                  {info.model && <div style={{ fontSize: '0.75rem', color: "var(--studio-muted)" }}>Model: {info.model}</div>}
                  {info.services && <div style={{ fontSize: '0.75rem', color: "var(--studio-muted)" }}>Services: {info.services.join(', ')}</div>}
                  {info.project && <div style={{ fontSize: '0.75rem', color: "var(--studio-muted)" }}>Project: {info.project}</div>}
                  {info.webhookConfigured !== undefined && <div style={{ fontSize: '0.75rem', color: "var(--studio-muted)" }}>Webhook: {info.webhookConfigured ? 'Configured' : 'Not set'}</div>}
                  <div style={{ marginTop: '6px' }}>
                    <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: info.configured ? "rgba(86,105,84, 0.15)" : 'rgba(107,114,128,0.15)', color: info.configured ? "var(--studio-sage)" : "var(--studio-muted)", fontWeight: '700' }}>{info.configured ? 'CONNECTED' : 'NOT CONFIGURED'}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Rate Limits + Operations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <Panel>
              <SectionHeader icon={Shield} title="Rate Limiting Configuration" color="var(--studio-warning)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {s.rateLimits && Object.entries(s.rateLimits).map(([name, config]) => (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: "rgba(var(--studio-ink-rgb), 0.02)" }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'capitalize' }}>{name}</span>
                    <span style={{ fontSize: '0.8rem', color: "var(--studio-muted)" }}>{config.max} req / {config.window}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <SectionHeader icon={Server} title="Runtime Environment" color="var(--studio-accent)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
                {[
                  ['Node.js', s.system?.nodeVersion],
                  ['Platform', s.system?.platform],
                  ['Environment', s.system?.env],
                  ['Architecture', h.checks?.process?.arch],
                  ['Health Check', h.totalCheckTimeMs ? `${h.totalCheckTimeMs}ms` : '—']
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: "1px solid rgba(var(--studio-ink-rgb), 0.03)" }}>
                    <span style={{ color: "var(--studio-muted)" }}>{label}</span>
                    <span style={{ fontWeight: '600' }}>{value || '—'}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* Stripe Balance (if available) */}
          {h.checks?.stripe?.status === 'ok' && (
            <Panel style={{ marginTop: '20px' }}>
              <SectionHeader icon={CreditCard} title="Stripe Balance (Live)" color="var(--studio-sage)" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '16px', borderRadius: '10px', background: "rgba(86,105,84, 0.06)" }}>
                  <div style={{ fontSize: '0.72rem', color: "var(--studio-muted)", textTransform: 'uppercase' }}>Available</div>
                  {h.checks.stripe.available?.map((b, i) => (
                    <div key={i} style={{ fontSize: '1.5rem', fontWeight: '800', color: "var(--studio-sage)" }}>{fmtUSD(b.amount)} <span style={{ fontSize: '0.7rem', color: "var(--studio-muted)" }}>{b.currency?.toUpperCase()}</span></div>
                  ))}
                </div>
                <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(245,158,11,0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: "var(--studio-muted)", textTransform: 'uppercase' }}>Pending</div>
                  {h.checks.stripe.pending?.map((b, i) => (
                    <div key={i} style={{ fontSize: '1.5rem', fontWeight: '800', color: "var(--studio-warning)" }}>{fmtUSD(b.amount)} <span style={{ fontSize: '0.7rem', color: "var(--studio-muted)" }}>{b.currency?.toUpperCase()}</span></div>
                  ))}
                </div>
              </div>
            </Panel>
          )}
        </>
      )}

      {/* ============================================== */}
      {/* ══ SECURITY & COMPLIANCE TAB ══ */}
      {/* ============================================== */}
      {activeTab === 'security' && (
        <>
          <Panel style={{ marginBottom: '24px' }}>
            <SectionHeader icon={Shield} title="OWASP Top 10 Compliance Matrix" color="var(--studio-danger)" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { id: 'A01', name: 'Broken Access Control', status: 'pass', detail: 'Firebase Auth + requireAdmin middleware, role-based tier access' },
                { id: 'A02', name: 'Cryptographic Failures', status: 'pass', detail: 'HTTPS enforced (Railway/Vercel), Firebase tokens (RS256), no secrets in client code' },
                { id: 'A03', name: 'Injection', status: 'pass', detail: 'sanitizeInput() strips control chars, validatePromptSafety() blocks 10+ patterns, parameterized Firestore queries' },
                { id: 'A04', name: 'Insecure Design', status: 'pass', detail: 'Credit system prevents abuse, rate limiting on all endpoints, admin-only destructive ops' },
                { id: 'A05', name: 'Security Misconfiguration', status: 'pass', detail: 'Helmet.js CSP headers, CORS allowlist, HSTS 1-year, no default credentials' },
                { id: 'A06', name: 'Vulnerable Components', status: 'warn', detail: 'Dependencies should be audited regularly — run npm audit periodically' },
                { id: 'A07', name: 'Auth Failures', status: 'pass', detail: 'Firebase Auth (Google/Email/Apple), brute-force protection (10 attempts/15min), token verification' },
                { id: 'A08', name: 'Data Integrity Failures', status: 'pass', detail: 'Stripe webhook signature verification, Firebase Admin SDK for server-side ops' },
                { id: 'A09', name: 'Logging & Monitoring', status: 'pass', detail: 'Winston rotating logs, Morgan HTTP logging, Sentry integration available' },
                { id: 'A10', name: 'SSRF', status: 'pass', detail: 'No user-controlled URL fetching in production endpoints, API keys server-side only' }
              ].map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', background: "rgba(var(--studio-ink-rgb), 0.02)" }}>
                  {item.status === 'pass' ? <CheckCircle size={16} color="var(--studio-sage)" /> : <AlertTriangle size={16} color="var(--studio-warning)" />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: '700' }}>{item.id}: {item.name}</div>
                    <div style={{ fontSize: '0.72rem', color: "var(--studio-muted)" }}>{item.detail}</div>
                  </div>
                  <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '4px', background: item.status === 'pass' ? "rgba(86,105,84, 0.15)" : 'rgba(245,158,11,0.15)', color: item.status === 'pass' ? "var(--studio-sage)" : "var(--studio-warning)", fontWeight: '700' }}>{item.status === 'pass' ? 'PASS' : 'REVIEW'}</span>
                </div>
              ))}
            </div>
          </Panel>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <Panel>
              <SectionHeader icon={Shield} title="Privacy & Legal Compliance" color="var(--studio-accent)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { item: 'Terms of Service', status: 'active', route: '#/legal' },
                  { item: 'Privacy Policy (GDPR/CCPA)', status: 'active', route: '#/legal' },
                  { item: 'Cookie Consent Banner', status: 'active', route: 'Frontend' },
                  { item: 'Music Copyright Notice', status: 'active', route: '#/legal' },
                  { item: 'Data Retention Policy', status: 'needed', route: 'Add to ToS' },
                  { item: 'GDPR Consent Form', status: 'needed', route: 'For EU users' },
                  { item: 'Terms Acceptance Tracking', status: 'needed', route: 'Firestore field' }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '6px', background: "rgba(var(--studio-ink-rgb), 0.02)" }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {item.status === 'active' ? <CheckCircle size={14} color="var(--studio-sage)" /> : <AlertTriangle size={14} color="var(--studio-warning)" />}
                      <span style={{ fontSize: '0.82rem' }}>{item.item}</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: item.status === 'active' ? "rgba(86,105,84, 0.1)" : 'rgba(245,158,11,0.1)', color: item.status === 'active' ? "var(--studio-sage)" : "var(--studio-warning)", fontWeight: '600' }}>{item.status === 'active' ? 'LIVE' : 'TODO'}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <SectionHeader icon={ShieldCheck} title="Content Safety" color="var(--studio-blue)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { item: 'Gemini Safety Settings', detail: 'BLOCK_MEDIUM_AND_ABOVE for hate, explicit, dangerous, harassment, civic', status: 'active' },
                  { item: 'Prompt Injection Guard', detail: 'validatePromptSafety() blocks system prompt overrides', status: 'active' },
                  { item: 'Input Sanitization', detail: 'sanitizeInput() strips control characters', status: 'active' },
                  { item: 'App Store Content Policy', detail: 'Apple & Google content moderation compliance', status: 'active' },
                  { item: 'Admin Email Allowlist', detail: `${s.admins?.length || 0} admin accounts configured`, status: 'active' }
                ].map((item, i) => (
                  <div key={i} style={{ padding: '10px 12px', borderRadius: '8px', background: "rgba(var(--studio-ink-rgb), 0.02)" }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '600' }}>{item.item}</span>
                      <CheckCircle size={14} color="var(--studio-sage)" />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: "var(--studio-muted)", marginTop: '2px' }}>{item.detail}</div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* Admin users */}
          <Panel>
            <SectionHeader icon={Users} title="Admin Accounts & Demo Users" color="var(--studio-warning)" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: '0.8rem', color: "var(--studio-muted)" }}>Admin Emails</h4>
                {s.admins?.map((email, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', padding: '4px 0', color: "var(--studio-muted)" }}>• {email}</div>
                ))}
              </div>
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: '0.8rem', color: "var(--studio-muted)" }}>Demo Accounts</h4>
                {s.demoAccounts?.map((email, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', padding: '4px 0', color: "var(--studio-muted)" }}>• {email}</div>
                ))}
              </div>
            </div>
          </Panel>
        </>
      )}

      {/* ============================================== */}
      {/* ══ AGENTS TAB ══ */}
      {/* ============================================== */}
      {activeTab === 'agents' && (
        <>
          {!agentStats ? (
            <Panel>
              <div style={{ textAlign: 'center', padding: '40px', color: "var(--studio-muted)", fontSize: '0.9rem' }}>
                <Music size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p style={{ margin: 0 }}>Agent usage data unavailable — no generations logged yet or index pending.</p>
              </div>
            </Panel>
          ) : (
            <>
              {/* Summary KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <StatCard title="Total Generations Sampled" value={fmt(agentStats.total)} icon={BarChart3} color="var(--studio-accent)" subtitle="Up to last 5,000 records" />
                <StatCard title="Unique Agents Used" value={fmt(Object.keys(agentStats.byAgent || {}).length)} icon={Music} color="var(--studio-blue)" />
                <StatCard title="Top Agent" value={Object.entries(agentStats.byAgent || {})[0]?.[0] || '—'} icon={Zap} color="var(--studio-sage)" subtitle={`${fmt(Object.entries(agentStats.byAgent || {})[0]?.[1])} uses`} />
              </div>

              {/* Per-agent breakdown */}
              <Panel style={{ marginBottom: '24px' }}>
                <SectionHeader icon={BarChart3} title="Usage by Agent" color="var(--studio-accent)" />
                {agentStats.byAgent && Object.keys(agentStats.byAgent).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Object.entries(agentStats.byAgent).map(([agent, count]) => {
                      const pct = agentStats.total > 0 ? ((count / agentStats.total) * 100).toFixed(1) : 0;
                      return (
                        <div key={agent}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '5px' }}>
                            <span style={{ fontWeight: '600' }}>{agent}</span>
                            <span style={{ fontWeight: '700' }}>{fmt(count)} <span style={{ color: "var(--studio-muted)", fontWeight: '500' }}>({pct}%)</span></span>
                          </div>
                          <div style={{ height: '8px', background: "rgba(var(--studio-ink-rgb), 0.05)", borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: "linear-gradient(90deg, var(--studio-accent), var(--studio-blue))", borderRadius: '4px', transition: 'width 0.5s' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: "var(--studio-muted)", fontSize: '0.85rem' }}>No agent data yet</div>
                )}
              </Panel>

              {/* By type */}
              <Panel>
                <SectionHeader icon={Activity} title="Usage by Generation Type" color="var(--studio-blue)" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                  {agentStats.byType && Object.entries(agentStats.byType).map(([type, count]) => (
                    <div key={type} style={{ padding: '12px', borderRadius: '10px', background: "rgba(var(--studio-ink-rgb), 0.02)", textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: "var(--studio-muted)", textTransform: 'uppercase', letterSpacing: '0.05em' }}>{type}</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: '800', marginTop: '4px' }}>{fmt(count)}</div>
                      <div style={{ fontSize: '0.68rem', color: "var(--studio-muted)", marginTop: '2px' }}>
                        {agentStats.total > 0 ? ((count / agentStats.total) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </>
          )}
        </>
      )}

      {/* Footer */}
      <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.72rem', color: "var(--studio-muted)" }}>
        Studio Agents Command Center v4.0 • {s.timestamp ? new Date(s.timestamp).toLocaleString() : '—'} 
        {s.generatedIn && ` • API: ${s.generatedIn}`} 
        {h.totalCheckTimeMs && ` • Health: ${h.totalCheckTimeMs}ms`}
      </div>
    </div>
  );
};

export default AdminAnalytics;
