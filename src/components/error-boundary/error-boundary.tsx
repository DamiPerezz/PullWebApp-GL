import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

// ErrorBoundary global: un dato malo de un evento (p.ej. un horario null que
// rompe un .slice) NO debe dejar TODA la web en blanco para todos. Aquí lo
// contenemos y ofrecemos recargar.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Sin PII: solo el error para diagnóstico (se elimina en prod si el
    // build strippea console, pero deja rastro en dev).
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.25rem',
          padding: '2rem',
          background: '#0a0a0f',
          color: '#fff',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2.5rem' }}>⚡</div>
        <h1 style={{ fontSize: '1.4rem', margin: 0 }}>Algo salió mal</h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 420, margin: 0 }}>
          Hubo un problema cargando esta página. Vuelve a intentarlo.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '0.85rem 1.75rem',
            borderRadius: 12,
            border: '1px solid rgba(139,92,246,0.5)',
            background: 'rgba(139,92,246,0.15)',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Recargar
        </button>
      </div>
    );
  }
}
