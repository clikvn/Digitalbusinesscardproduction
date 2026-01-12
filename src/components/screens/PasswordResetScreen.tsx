import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
        
        // Get the hash fragment from URL (Supabase uses hash-based tokens)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        // Also check query params (some Supabase configurations use query params)
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get('code');
        const errorParam = queryParams.get('error');
        const errorDescription = queryParams.get('error_description');
        
        console.log('[PasswordReset] URL params:', { 
          hasAccessToken: !!accessToken, 
          hasCode: !!code, 
          type,
          error: errorParam 
        });

        // Handle error from Supabase
        if (errorParam) {
          console.error('[PasswordReset] Error from Supabase:', errorParam, errorDescription);
          setErrorMessage(errorDescription || errorParam || 'Invalid or expired reset link');
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
        setErrorMessage('Invalid or expired reset link. Please request a new password reset.');
        setStatus('error');

      } catch (error: any) {
        console.error('[PasswordReset] Unexpected error:', error);
        setErrorMessage(error.message || 'An unexpected error occurred');
        setStatus('error');
      }
    };

    handleResetToken();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsResetting(true);

    try {
      console.log('[PasswordReset] Resetting password...');
      
      await api.auth.resetPassword(newPassword);

      setStatus('success');
      toast.success('Password reset successfully! Redirecting to login...');

      // Sign out the user so they can log in with new password
      await supabase.auth.signOut({ scope: 'local' });

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/auth?reset=success', { replace: true });
      }, 2000);

    } catch (error: any) {
      console.error('[PasswordReset] Reset error:', error);
      toast.error(error.message || 'Failed to reset password');
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
            <CardTitle>Verifying reset link...</CardTitle>
            <CardDescription>
              Please wait while we verify your password reset link.
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
            <CardTitle className="text-red-600">Reset Link Invalid</CardTitle>
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
              Return to Sign In
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
            <CardTitle className="text-green-600">Password Reset!</CardTitle>
            <CardDescription>
              Your password has been reset successfully. Redirecting to sign in...
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
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input 
                id="new-password" 
                type="password" 
                placeholder="Enter new password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                required 
                minLength={6}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input 
                id="confirm-password" 
                type="password" 
                placeholder="Confirm new password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
                minLength={6}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isResetting}>
              {isResetting ? 'Resetting...' : 'Reset Password'}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              <button 
                type="button"
                onClick={() => navigate('/auth', { replace: true })}
                className="text-primary hover:underline font-medium"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
