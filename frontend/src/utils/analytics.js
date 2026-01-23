/**
 * Google Analytics 4 Integration
 * Measurement ID: G-37J2MVHXS7 (from Firebase config)
 */

const GA_MEASUREMENT_ID = 'G-37J2MVHXS7';

// Initialize GA4
export function initAnalytics() {
  if (typeof window === 'undefined') return;
  
  // Don't track in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('[Analytics] Skipping in development');
    return;
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
    cookie_flags: 'SameSite=None;Secure'
  });

  console.log('[Analytics] GA4 initialized');
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
  signUp: (method) => trackEvent('sign_up', { method }),
  login: (method) => trackEvent('login', { method }),
  
  // Agent usage
  agentUsed: (agentId, agentName) => trackEvent('agent_used', { 
    agent_id: agentId, 
    agent_name: agentName 
  }),
  
  // Project actions
  projectCreated: (templateId) => trackEvent('project_created', { template_id: templateId }),
  projectCompleted: (projectId) => trackEvent('project_completed', { project_id: projectId }),
  
  // Content generation
  contentGenerated: (agentId, type) => trackEvent('content_generated', { 
    agent_id: agentId, 
    content_type: type 
  }),
  
  // Feature usage
  featureUsed: (featureName) => trackEvent('feature_used', { feature_name: featureName }),
  
  // Errors
  errorOccurred: (errorMessage, errorSource) => trackEvent('error_occurred', {
    error_message: errorMessage?.substring(0, 100),
    error_source: errorSource
  }),
  
  // Conversion events
  upgradeClicked: (plan) => trackEvent('upgrade_clicked', { plan }),
  creditsPurchased: (amount) => trackEvent('credits_purchased', { amount })
};

export default Analytics;
