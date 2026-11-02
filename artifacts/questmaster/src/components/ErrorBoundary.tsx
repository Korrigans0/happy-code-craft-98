import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, Loader2, RefreshCw, Send } from 'lucide-react';
import { sendCrashReport } from '@/lib/crashReport';

type Scope = 'app' | 'page' | 'table';

interface Props {
  children: ReactNode;
  /** app: whole site, page: one page (header stays usable), table: the tabletop only. */
  scope?: Scope;
  /** Changing this value clears the error (e.g. on navigation). */
  resetKey?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string;
  report: 'idle' | 'sending' | 'sent' | 'failed';
}

const INITIAL: State = { hasError: false, error: null, componentStack: '', report: 'idle' };

const COPY: Record<Scope, { title: string; text: string }> = {
  app: {
    title: "Oups, quelque chose s'est mal passé",
    text: 'Une erreur inattendue est survenue. Essayez de recharger la page.',
  },
  page: {
    title: "Cette page a rencontré un problème",
    text: 'Le reste du site fonctionne toujours. Vous pouvez réessayer ou revenir à l\'accueil.',
  },
  table: {
    title: 'La table de jeu a rencontré un problème',
    text: 'Le chat et les fiches restent accessibles. Vos données enregistrées ne sont pas perdues.',
  },
};

class ErrorBoundary extends Component<Props, State> {
  public state: State = INITIAL;

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ componentStack: errorInfo.componentStack ?? '' });
  }

  public componentDidUpdate(prev: Props) {
    if (this.state.hasError && prev.resetKey !== this.props.resetKey) this.setState(INITIAL);
  }

  private handleReload = () => window.location.reload();
  private handleRetry = () => this.setState(INITIAL);
  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReport = async () => {
    if (!this.state.error || this.state.report === 'sending' || this.state.report === 'sent') return;
    this.setState({ report: 'sending' });
    const ok = await sendCrashReport(this.state.error, this.state.componentStack, this.props.scope ?? 'app');
    this.setState({ report: ok ? 'sent' : 'failed' });
  };

  public render() {
    if (!this.state.hasError) return this.props.children;
    const scope = this.props.scope ?? 'app';
    const { title, text } = COPY[scope];
    const { report } = this.state;
    const contained = scope !== 'app';

    return (
      <div
        role="alert"
        className={
          contained
            ? 'flex min-h-[50vh] w-full items-center justify-center p-4'
            : 'flex min-h-screen items-center justify-center bg-gradient-dark p-4'
        }
      >
        <div className="max-w-md text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
            <p className="mt-2 text-muted-foreground">{text}</p>
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
          <div className="flex flex-wrap gap-3 justify-center">
            {contained ? (
              <Button variant="outline" onClick={this.handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                Réessayer
              </Button>
            ) : (
              <Button variant="outline" onClick={this.handleGoHome}>
                Retour à l'accueil
              </Button>
            )}
            <Button variant="gold" onClick={this.handleReload}>
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Recharger
            </Button>
            <Button
              variant="ghost"
              onClick={this.handleReport}
              disabled={report === 'sending' || report === 'sent'}
            >
              {report === 'sending' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : report === 'sent' ? (
                <Check className="mr-2 h-4 w-4" aria-hidden="true" />
              ) : (
                <Send className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              {report === 'sent' ? 'Rapport envoyé' : 'Envoyer le rapport'}
            </Button>
          </div>
          {report === 'failed' && (
            <p className="text-sm text-destructive" aria-live="polite">
              Le rapport n'a pas pu être envoyé. Réessayez dans un instant.
            </p>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
