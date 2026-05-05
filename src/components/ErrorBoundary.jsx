import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReload={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}

const ErrorFallback = ({ error, onReload }) => {
  const { colors } = useTheme();

  return (
    <div className={`min-h-screen flex items-center justify-center p-8 bg-[${colors.background}]`}>
      <div className={`bg-[${colors.surface}] rounded-2xl p-12 max-w-xl w-full text-center border border-[${colors.border}] shadow-2xl`}>
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className={`text-2xl font-bold text-[${colors.text}] mb-3`}>Something went wrong</h1>
        <p className={`text-[${colors.textSecondary}] mb-6 leading-relaxed`}>
          {error?.message || 'An unexpected error occurred. Please try reloading the page.'}
        </p>
        <details className="text-left bg-gray-50 rounded-lg p-4 mb-6 max-h-52 overflow-y-auto">
          <summary className={`cursor-pointer text-[${colors.textSecondary}] text-sm mb-2`}>Error details</summary>
          <pre className="text-xs text-red-500 whitespace-pre-wrap break-words">{error?.stack}</pre>
        </details>
        <button
          onClick={onReload}
          className={`bg-[${colors.primary}] text-white px-8 py-3 border-none rounded-lg font-semibold text-base cursor-pointer`}
        >
          Reload Page
        </button>
      </div>
    </div>
  );
};

export default ErrorBoundary;
