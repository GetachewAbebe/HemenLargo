import React, { Component } from "react";
import { AlertOctagon, RefreshCw, Download, LifeBuoy } from "lucide-react";
import { exportAllDataAsJSON } from "../../utils/storage";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical Application Crash caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleSafeReset = () => {
    if (
      window.confirm(
        "Clear browser local application cache and reload? Your backup was downloaded automatically if you clicked the backup button."
      )
    ) {
      localStorage.clear();
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-screen animate-fade">
          <div className="error-boundary-card">
            <div className="error-boundary-icon-wrap">
              <AlertOctagon size={42} className="text-rose" />
            </div>

            <h1 className="error-boundary-title">
              ይቅርታ! ያልተጠበቀ ችግር አጋጥሟል (System Error)
            </h1>
            <p className="error-boundary-desc">
              The application encountered an unexpected runtime error. Your shop records in local storage and cloud database are preserved and safe.
            </p>

            <div className="error-boundary-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={this.handleReload}
              >
                <RefreshCw size={18} />
                <span>Reload Sukie POS (እንደገና ጫን)</span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={exportAllDataAsJSON}
              >
                <Download size={18} />
                <span>Export Emergency Data Backup (JSON)</span>
              </button>
            </div>

            <div className="error-boundary-details">
              <details>
                <summary>
                  <LifeBuoy size={14} />
                  <span>Technical Diagnostics (የስህተት ዝርዝር)</span>
                </summary>
                <pre className="error-stack-trace">
                  {this.state.error?.toString()}
                  {"\n"}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            </div>

            <button
              type="button"
              className="btn-safe-reset-link"
              onClick={this.handleSafeReset}
            >
              Clear Local Storage & Start Fresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
