const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname);
const FRONTEND_SRC = path.join(ROOT_DIR, 'frontend', 'src');
const COMPONENTS_DIR = path.join(FRONTEND_SRC, 'components');

const DASHBOARD_JSX = path.join(COMPONENTS_DIR, 'StudioDashboard.jsx');
const DASHBOARD_CSS = path.join(COMPONENTS_DIR, 'StudioDashboard.css');
const STUDIO_VIEW = path.join(COMPONENTS_DIR, 'StudioView.jsx');

let errors = [];
let warnings = [];

console.log('Starting Studio Dashboard Verification...');

// 1. Check Files Exist
if (fs.existsSync(DASHBOARD_JSX)) {
  console.log('✅ StudioDashboard.jsx exists');
} else {
  errors.push('❌ StudioDashboard.jsx MISSING');
}

if (fs.existsSync(DASHBOARD_CSS)) {
  console.log('✅ StudioDashboard.css exists');
  const cssContent = fs.readFileSync(DASHBOARD_CSS, 'utf8');
  if (cssContent.length < 50) {
    warnings.push('⚠️ StudioDashboard.css looks suspiciously empty');
  } else {
    // Check for key classes
    if (cssContent.includes('.studio-dashboard') && cssContent.includes('.analytics-grid')) {
      console.log('✅ CSS contains core classes');
    } else {
      warnings.push('⚠️ CSS might differ from design spec (missing .studio-dashboard or .analytics-grid)');
    }
  }
} else {
  errors.push('❌ StudioDashboard.css MISSING');
}

// 2. Check Integration in StudioView
if (fs.existsSync(STUDIO_VIEW)) {
  const viewContent = fs.readFileSync(STUDIO_VIEW, 'utf8');
  
  // Check Import
  if (viewContent.includes(`import('./StudioDashboard')`)) {
    console.log('✅ StudioDashboard lazy import found');
  } else {
    errors.push('❌ StudioDashboard NOT imported in StudioView.jsx');
  }

  // Check Usage
  if (viewContent.includes('<StudioDashboard')) {
    console.log('✅ <StudioDashboard /> component used in JSX');
    
    // Check Props
    const propsToCheck = ['user={user}', 'projects={projects}', 'onNavigate={setActiveTab}'];
    propsToCheck.forEach(prop => {
      if (viewContent.includes(prop)) {
        console.log(`✅ Prop passed: ${prop}`);
      } else {
        warnings.push(`⚠️ Prop may be missing or named differently: ${prop}`);
      }
    });

  } else {
    errors.push('❌ <StudioDashboard /> tag NOT found in StudioView.jsx');
  }

} else {
  errors.push('❌ StudioView.jsx MISSING');
}

// 3. Check Logic in Dashboard
if (fs.existsSync(DASHBOARD_JSX)) {
  const dashboardContent = fs.readFileSync(DASHBOARD_JSX, 'utf8');
  if (dashboardContent.includes('export default StudioDashboard')) {
    console.log('✅ Component exported correctly');
  } else {
    errors.push('❌ Default export missing in StudioDashboard.jsx');
  }
  if (dashboardContent.includes("import './StudioDashboard.css'")) {
    console.log('✅ CSS imported in Dashboard');
  } else {
    errors.push('❌ CSS import missing in StudioDashboard.jsx');
  }
}

console.log('\n--- VERIFICATION SUMMARY ---');
if (errors.length === 0) {
  console.log('🎉 PASSED: Dashboard Integration looks valid.');
} else {
  console.log('🔥 FAILED: Critical issues found.');
  errors.forEach(e => console.error(e));
}

if (warnings.length > 0) {
  console.log('\nWarnings:');
  warnings.forEach(w => console.warn(w));
}
