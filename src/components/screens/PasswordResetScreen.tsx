import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase-client';
import { api } from '../../lib/api';
import { toast } from 'sonner@2.0.3';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Loader2, CheckCircle2, XCircle, Lock } from 'lucide-react@0.487.0';

/**
 * PasswordResetScreen handles password reset from email link.
 * 
 * Flow:
 * 1. User clicks password reset link in email
 * 2. Supabase redirects to /auth/reset-password with token in URL
 * 3. This component exchanges the token and shows password reset form
 * 4. User enters new password
 * 5. Password is updated and user is redirected to login
 */
export function PasswordResetScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'ready' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const handleResetToken = async () => {
      try {
        console.log('[PasswordReset] Processing password reset token...');
        console.log('[PasswordReset] Current URL:', window.location.href);
        console.log('[PasswordReset] Current pathname:', window.location.pathname);
        console.log('[PasswordReset] Hash:', window.location.hash);
        console.log('[PasswordReset] Search:', window.location.search);
        
        // Parse hash and search params to check for type=recovery specifically
        const hash = window.location.hash;
        const search = window.location.search;
        const hashParams = new URLSearchParams(hash.substring(1));
        const searchParams = new URLSearchParams(search);
        const type = hashParams.get('type') || searchParams.get('type');
        
        // CRITICAL: Only process if type=recovery is explicitly present
        // Email confirmation links have type=signup or no type, and should go to /auth/callback
        const isPasswordReset = type === 'recovery';
        
        // If we're not on the reset-password page but have password reset tokens, redirect to the correct page
        if (window.location.pathname !== '/auth/reset-password' && isPasswordReset) {
          console.log('[PasswordReset] Detected password reset token (type=recovery) on wrong page, redirecting to /auth/reset-password');
          navigate(`/auth/reset-password${search}${hash}`, { replace: true });
          return;
        }
        
        // If we're on reset-password page but don't have type=recovery, check if it's email confirmation
        if (window.location.pathname === '/auth/reset-password' && !isPasswordReset && type) {
          console.log('[PasswordReset] Wrong token type on reset-password page. Type:', type);
          console.log('[PasswordReset] This appears to be an email confirmation link, redirecting to /auth/callback');
          navigate(`/auth/callback${search}${hash}`, { replace: true });
          return;
        }
        
        // If we're on the reset-password page but don't have tokens, check if we should stay
        if (window.location.pathname === '/auth/reset-password' && !isPasswordReset && !type) {
          // Check if there's an existing session (user might have already set session)
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            console.log('[PasswordReset] Found existing session, showing reset form');
            setStatus('ready');
            return;
          }
          // No tokens and no session - show error
          console.error('[PasswordReset] No reset tokens found on reset-password page');
          setErrorMessage(t('error.pleaseRequestNewReset'));
          setStatus('error');
          return;
        }
        
        // Get the hash fragment from URL (Supabase uses hash-based tokens)
        // Note: hashParams and type were already parsed above, but we need to get tokens
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        // Also check query params (some Supabase configurations use query params)
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get('code');
        const errorParam = queryParams.get('error');
        const errorDescription = queryParams.get('error_description');
        
        console.log('[PasswordReset] URL params:', { 
          hasAccessToken: !!accessToken, 
          hasCode: !!code, 
          type,
          error: errorParam,
          pathname: window.location.pathname
        });

        // Handle error from Supabase
        if (errorParam) {
          console.error('[PasswordReset] Error from Supabase:', errorParam, errorDescription);
          setErrorMessage(errorDescription || errorParam || t('error.invalidOrExpiredResetLink'));
          setStatus('error');
          return;
        }

        // If we have a code, exchange it for a session (PKCE flow)
        if (code) {
          console.log('[PasswordReset] Exchanging code for session...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('[PasswordReset] Code exchange error:', error);
            setErrorMessage(error.message || 'Invalid or expired reset link');
            setStatus('error');
            return;
          }

          if (data.user) {
            console.log('[PasswordReset] Session established for user:', data.user.id);
            setStatus('ready');
            return;
          }
        }

        // If we have tokens in the hash, set the session
        if (accessToken && refreshToken) {
          console.log('[PasswordReset] Setting session from hash tokens...');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('[PasswordReset] Session set error:', error);
            setErrorMessage(error.message || 'Invalid or expired reset link');
            setStatus('error');
            return;
          }

          if (data.user) {
            console.log('[PasswordReset] Session established for user:', data.user.id);
            setStatus('ready');
            return;
          }
        }

        // If no tokens or code, check if there's an existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('[PasswordReset] Found existing session');
          setStatus('ready');
          return;
        }

        // No valid authentication found
        console.error('[PasswordReset] No valid reset tokens found');
        setErrorMessage(t('error.pleaseRequestNewReset'));
        setStatus('error');

      } catch (error: any) {
        console.error('[PasswordReset] Unexpected error:', error);
        setErrorMessage(error.message || t('error.unexpectedError'));
        setStatus('error');
      }
    };

    handleResetToken();
  }, [navigate, t]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (newPassword.length < 6) {
      toast.error(t('error.passwordMinLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('error.passwordsDoNotMatch'));
      return;
    }

    setIsResetting(true);

    try {
      console.log('[PasswordReset] Resetting password...');
      
      await api.auth.resetPassword(newPassword);

      setStatus('success');
      toast.success(t('auth.passwordResetRedirectingLogin'));

      // Sign out the user so they can log in with new password
      await supabase.auth.signOut({ scope: 'local' });

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/auth?reset=success', { replace: true });
      }, 2000);

    } catch (error: any) {
      console.error('[PasswordReset] Reset error:', error);
      toast.error(error.message || t('error.failedToResetPassword'));
    } finally {
      setIsResetting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#e9e6dc] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <CardTitle>{t('auth.verifyingResetLink')}</CardTitle>
            <CardDescription>
              {t('auth.pleaseWaitVerifyLink')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#e9e6dc] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <CardTitle className="text-red-600">{t('auth.resetLinkInvalid')}</CardTitle>
            <CardDescription className="text-red-500">
              {errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => navigate('/auth', { replace: true })}
              variant="outline"
              className="w-full"
            >
              {t('common.returnToSignIn')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#e9e6dc] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-green-600">{t('auth.passwordReset')}</CardTitle>
            <CardDescription>
              {t('auth.passwordResetRedirecting')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // status === 'ready' - Show password reset form
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#e9e6dc] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Lock className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>{t('auth.resetYourPassword')}</CardTitle>
          <CardDescription>
            {t('auth.enterNewPasswordBelow')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">{t('auth.newPassword')}</Label>
              <Input 
                id="new-password" 
                type="password" 
                placeholder={t('auth.enterNewPassword')} 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                required 
                minLength={6}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                {t('error.passwordMinLength')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t('auth.confirmPassword')}</Label>
              <Input 
                id="confirm-password" 
                type="password" 
                placeholder={t('auth.confirmNewPassword')} 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
                minLength={6}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isResetting}>
              {isResetting ? t('auth.resetting') : t('auth.resetPassword')}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              <button 
                type="button"
                onClick={() => navigate('/auth', { replace: true })}
                className="text-primary hover:underline font-medium"
              >
                {t('auth.backToSignIn')}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
