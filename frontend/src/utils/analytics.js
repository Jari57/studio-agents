/**
 * Google Analytics 4 Integration
 * Measurement ID: G-37J2MVHXS7 (from Firebase config)
 */

const GA_MEASUREMENT_ID = 'G-37J2MVHXS7';

// Initialize GA4
export function initAnalytics() {
  if (typeof window === 'undefined') return;
  
  // Track in development too for testing (but with a flag)
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isDev) {
    console.log('[Analytics] Running in development mode - tracking enabled for testing');
  }

  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
    anonymize_ip: true, // GDPR compliance
    cookie_flags: 'SameSite=None;Secure',
    send_page_view: true
  });

  // Log initial page view
  console.log('[Analytics] GA4 initialized - Measurement ID:', GA_MEASUREMENT_ID);
  
  // Track unique visitor count in localStorage
  try {
    const visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
      const newVisitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('visitor_id', newVisitorId);
      localStorage.setItem('first_visit', new Date().toISOString());
      
      // Track new visitor
      trackEvent('new_visitor', {
        first_visit: new Date().toISOString()
      });
    }
    
    // Update visit count
    const visitCount = parseInt(localStorage.getItem('visit_count') || '0') + 1;
    localStorage.setItem('visit_count', visitCount.toString());
    localStorage.setItem('last_visit', new Date().toISOString());
    
  } catch (e) {
    console.warn('[Analytics] LocalStorage not available');
  }
}

// Track page views
export function trackPageView(pagePath, pageTitle) {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: pagePath,
    page_title: pageTitle
  });
}

// Track custom events
export function trackEvent(eventName, parameters = {}) {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', eventName, parameters);
}

// Pre-defined event helpers
export const Analytics = {
  // User actions
  signUp: (method) => {
    trackEvent('sign_up', { method });
    // Store signup timestamp in localStorage for metrics
    try {
      const signups = JSON.parse(localStorage.getItem('app_signups') || '[]');
      signups.push({ timestamp: new Date().toISOString(), method });
      localStorage.setItem('app_signups', JSON.stringify(signups));
    } catch (e) {}
  },
  login: (method) => trackEvent('login', { method }),
  
  // Agent usage
  agentUsed: (agentId, agentName) => {
    trackEvent('agent_used', { 
      agent_id: agentId, 
      agent_name: agentName 
    });
    // Track agent usage counts
    try {
      const usage = JSON.parse(localStorage.getItem('agent_usage') || '{}');
      usage[agentId] = (usage[agentId] || 0) + 1;
      localStorage.setItem('agent_usage', JSON.stringify(usage));
    } catch (e) {}
  },
  
  // Project actions
  projectCreated: (templateId) => {
    trackEvent('project_created', { template_id: templateId });
    // Track project count
    try {
      const count = parseInt(localStorage.getItem('projects_created') || '0');
      localStorage.setItem('projects_created', (count + 1).toString());
    } catch (e) {}
  },
  projectCompleted: (projectId) => trackEvent('project_completed', { project_id: projectId }),
  
  // Content generation
  contentGenerated: (agentId, type) => {
    trackEvent('content_generated', { 
      agent_id: agentId, 
      content_type: type 
    });
    // Track generation count
    try {
      const count = parseInt(localStorage.getItem('generations_total') || '0');
      localStorage.setItem('generations_total', (count + 1).toString());
      
      // Track by agent
      const byAgent = JSON.parse(localStorage.getItem('generations_by_agent') || '{}');
      byAgent[agentId] = (byAgent[agentId] || 0) + 1;
      localStorage.setItem('generations_by_agent', JSON.stringify(byAgent));
    } catch (e) {}
  },
  
  // Feature usage
  featureUsed: (featureName) => trackEvent('feature_used', { feature_name: featureName }),
  
  // Errors
  errorOccurred: (errorMessage, errorSource) => trackEvent('error_occurred', {
    error_message: errorMessage?.substring(0, 100),
    error_source: errorSource
  }),
  
  // Conversion events
  upgradeClicked: (plan) => trackEvent('upgrade_clicked', { plan }),
  creditsPurchased: (amount) => {
    trackEvent('credits_purchased', { amount });
    try {
      const revenue = parseFloat(localStorage.getItem('total_revenue') || '0');
      localStorage.setItem('total_revenue', (revenue + amount).toString());
    } catch (e) {}
  },
  
  // Get metrics summary
  getMetrics: () => {
    try {
      const signups = JSON.parse(localStorage.getItem('app_signups') || '[]').length;
      const generations = parseInt(localStorage.getItem('generations_total') || '0');
      const projects = parseInt(localStorage.getItem('projects_created') || '0');
      const agentUsage = JSON.parse(localStorage.getItem('agent_usage') || '{}');
      const revenue = parseFloat(localStorage.getItem('total_revenue') || '0');
      
      return {
        totalSignups: signups,
        totalGenerations: generations,
        totalProjects: projects,
        agentUsage,
        totalRevenue: revenue,
        avgGenerationsPerUser: signups > 0 ? (generations / signups).toFixed(2) : 0
      };
    } catch (e) {
      return null;
    }
  }
};

export default Analytics;
