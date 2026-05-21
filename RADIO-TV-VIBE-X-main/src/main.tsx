import React from 'react';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.addEventListener('error', (e) => {
  console.error('GLOBAL ERROR:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('UNHANDLED REJECTION:', e.reason);
});

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', padding: '20px', textAlign: 'center' }}>
          <div>
            <h1 style={{ color: '#00ff00', fontSize: '24px', marginBottom: '16px' }}>⚠️ App Error</h1>
            <p style={{ color: '#ff4444', fontSize: '12px', maxWidth: '400px' }}>{this.state.error}</p>
            <p style={{ color: '#ff4444', fontSize: '10px', maxWidth: '500px', marginTop: '8px' }}>{this.state.error?.stack}</p>
            <button
              onClick={() => window.location.reload()}
              style={{ marginTop: '20px', padding: '10px 24px', background: '#00ff00', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >Reload Page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);