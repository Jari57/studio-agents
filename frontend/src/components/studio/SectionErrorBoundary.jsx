import React from 'react';
import { isStaleChunkError, recoverSection } from '../../utils/errorRecovery.mjs';

export default class SectionErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    console.error(`[SectionErrorBoundary] ${this.props.name || 'Section'}:`, error?.message);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    const newVersion = isStaleChunkError(this.state.error);
    return (
      <section role="alert" style={{ padding: 24, border: '1px solid var(--border-color)', borderRadius: 12, textAlign: 'center', background: 'var(--bg-secondary)' }}>
        <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>
          {newVersion ? 'Reload Studio to continue' : `${this.props.name || 'Section'} temporarily unavailable`}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 16 }}>
          {newVersion
            ? 'A required part of Studio could not load. A newer version may have been deployed. Save any work you can still access and wait for active creations to finish before reloading; unsaved changes may be lost.'
            : 'This section encountered an issue. Retry it without leaving your other work.'}
        </p>
        <button type="button" onClick={() => recoverSection(this.state.error, {
          reload: () => window.location.reload(),
          reset: () => this.setState({ hasError: false, error: null }),
        })} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer' }}>
          {newVersion ? 'Reload Studio' : 'Try Again'}
        </button>
      </section>
    );
  }
}
