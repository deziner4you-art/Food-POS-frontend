import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Prevents a single render exception anywhere in the tree from white-screening
 * the whole in-store terminal. Falls back to a minimal recovery screen instead.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Unhandled UI error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white', fontFamily: 'sans-serif', textAlign: 'center', padding: '20px' }}>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '10px' }}>Something went wrong</h1>
          <p style={{ color: '#94a3b8', marginBottom: '20px', maxWidth: '400px' }}>
            The POS ran into an unexpected error. Your offline data is safe. Please reload the terminal.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
