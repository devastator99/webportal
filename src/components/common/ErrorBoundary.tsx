
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.props.onReset?.();
    this.setState({
      hasError: false,
      error: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="container mx-auto px-4 py-8 mt-20">
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                An error occurred while trying to render this component.
              </p>
              {this.state.error && (
                <details className="text-sm">
                  <summary className="cursor-pointer">Error details</summary>
                  <p className="mt-2 font-mono">{this.state.error.message}</p>
                </details>
              )}
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-center">
            <Button onClick={this.resetErrorBoundary} variant="default">
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// A hook to create reset keys for error boundaries
export const useErrorBoundaryKey = () => {
  const [key, setKey] = React.useState(0);
  const reset = () => setKey(prevKey => prevKey + 1);
  return { key, reset };
};
