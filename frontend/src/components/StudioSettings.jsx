import React, { useState } from 'react';
import { User, Save, LogOut } from 'lucide-react';
import './StudioDashboard.css';

export default function StudioSettings({ userProfile, setUserProfile, onLogout }) {
  // Local state for form before save
  const [formData, setFormData] = useState(userProfile || {});
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setUserProfile(formData);
    localStorage.setItem('studio_user_profile', JSON.stringify(formData));
    alert('Settings saved successfully!');
  };

  return (
    <div className="studio-dashboard animate-fadeIn">
      <div className="dashboard-header">
        <div className="welcome-text">
          <h1>Settings</h1>
          <p>Configure your studio experience.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '32px' }}>
        {/* Settings Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {['Profile', 'Notifications', 'Appearance', 'Privacy'].map(item => (
            <button key={item} style={{
              textAlign: 'left',
              padding: '12px 16px',
              background: item === 'Profile' ? 'rgba(255,255,255,0.05)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: item === 'Profile' ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: item === 'Profile' ? 600 : 400
            }}>
              {item}
            </button>
          ))}
          
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '12px 0' }}></div>
          
          <button onClick={onLogout} style={{
             textAlign: 'left',
             padding: '12px 16px',
             background: 'rgba(239, 68, 68, 0.1)',
             border: 'none',
             borderRadius: '8px',
             color: 'var(--color-red)',
             cursor: 'pointer',
             display: 'flex',
             alignItems: 'center',
             gap: '8px'
          }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section: Profile */}
          <div className="settings-section">
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} /> Public Profile
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>Stage Name / Display Name</label>
                <input 
                  type="text" 
                  value={formData.stageName || ''} 
                  onChange={(e) => handleChange('stageName', e.target.value)}
                  style={{ 
                    width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', 
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' 
                  }}
                  placeholder="e.g. DJ Montez"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>Primary Genre</label>
                <input 
                  type="text" 
                  value={formData.genre || ''} 
                  onChange={(e) => handleChange('genre', e.target.value)}
                  style={{ 
                    width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', 
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' 
                  }}
                  placeholder="e.g. Hip Hop"
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>Bio</label>
                <textarea 
                  value={formData.bio || ''} 
                  onChange={(e) => handleChange('bio', e.target.value)}
                  rows={4}
                  style={{ 
                    width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', 
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontFamily: 'inherit' 
                  }}
                  placeholder="Tell us about your style..."
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>Location</label>
                <input 
                  type="text" 
                  value={formData.location || ''} 
                  onChange={(e) => handleChange('location', e.target.value)}
                  style={{ 
                    width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', 
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' 
                  }}
                />
              </div>

               <div className="form-group">
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>Website</label>
                <input 
                  type="text" 
                  value={formData.website || ''} 
                  onChange={(e) => handleChange('website', e.target.value)}
                  style={{ 
                    width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', 
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' 
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleSave}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 24px', background: 'var(--color-purple)', color: 'white',
                border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <Save size={18} /> Save Changes
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
