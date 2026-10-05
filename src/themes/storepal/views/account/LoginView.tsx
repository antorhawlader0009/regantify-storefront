import { AuthPage } from './AuthPage';

/** StorePal has no login page, only the dialog: this route just opens it (see AuthPage). */
export function LoginView({ subdomain }: { subdomain: string }) {
  return <AuthPage subdomain={subdomain} mode="login" />;
}
