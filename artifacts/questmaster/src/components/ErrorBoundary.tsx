import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-dark p-4">
          <div className="max-w-md text-center space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Oups, quelque chose s'est mal passé
              </h1>
              <p className="mt-2 text-muted-foreground">
                Une erreur inattendue est survenue. Essayez de recharger la page.
              </p>
            </div>
            {this.state.error && (
              <details className="text-left">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  Détails techniques
                </summary>
                <pre className="mt-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={this.handleGoHome}>
                Retour à l'accueil
              </Button>
              <Button variant="gold" onClick={this.handleReload}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Recharger
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
