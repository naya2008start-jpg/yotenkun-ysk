import React, { Component, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application Render Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border-2 border-amber-200 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto text-3xl font-black">
              要
            </div>
            <h2 className="text-xl font-black text-slate-900">画面の読み込みをやり直します</h2>
            <p className="text-xs text-slate-600 font-bold leading-relaxed">
              一時的な読み込みエラーが発生しました。下のボタンを押してアプリを再読み込みしてください。
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-2xl shadow-md transition-all cursor-pointer"
            >
              アプリを再読み込みする
            </button>
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
