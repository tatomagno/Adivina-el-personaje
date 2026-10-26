import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Protect React DOM reconciliation against mobile browser auto-translate / WebView DOM mutations
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.apply(this, arguments as unknown as [Node]) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments as unknown as [Node, Node | null]) as T;
  };
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('Recovered from UI render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-6 text-center gap-4">
          <h2 className="text-xl font-bold text-amber-300 font-serif">
            Se actualizó la vista del juego
          </h2>
          <p className="text-sm text-stone-400 max-w-sm">
            Tu navegador modificó el texto automáticamente. Toca abajo para continuar la partida sin perder la conexión.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-sm shadow-lg"
          >
            Continuar Jugando
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
