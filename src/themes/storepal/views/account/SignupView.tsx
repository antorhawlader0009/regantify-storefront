import { AuthPage } from './AuthPage';

/** StorePal has no sign-up page, only the dialog: this route just opens it (see AuthPage). */
export function SignupView({ subdomain }: { subdomain: string }) {
  return <AuthPage subdomain={subdomain} mode="signup" />;
}
