import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react@0.487.0';

type CallbackStatus = 'loading' | 'success' | 'error';

/**
 * AuthCallbackScreen handles the email confirmation callback from Supabase.
 * 
 * Flow:
 * 1. User clicks confirmation link in email
 * 2. Supabase redirects to /auth/callback with token in URL hash
 * 3. This component exchanges the token for a session
 * 4. On success, initializes user data and redirects to login
 */
export function AuthCallbackScreen() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[AuthCallback] Processing email confirmation...');
        
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
        
        console.log('[AuthCallback] URL params:', { 
          hasAccessToken: !!accessToken, 
          hasCode: !!code, 
          type,
          error: errorParam 
        });

        // Handle error from Supabase
        if (errorParam) {
          console.error('[AuthCallback] Error from Supabase:', errorParam, errorDescription);
          setErrorMessage(errorDescription || errorParam || 'Email confirmation failed');
          setStatus('error');
          return;
        }

        // If we have a code, exchange it for a session (PKCE flow)
        if (code) {
          console.log('[AuthCallback] Exchanging code for session...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('[AuthCallback] Code exchange error:', error);
            setErrorMessage(error.message || 'Failed to verify email');
            setStatus('error');
            return;
          }

          if (data.user) {
            console.log('[AuthCallback] Session established for user:', data.user.id);
            await initializeUserAndRedirect(data.user.id);
            return;
          }
        }

        // If we have tokens in the hash, set the session
        if (accessToken && refreshToken) {
          console.log('[AuthCallback] Setting session from hash tokens...');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('[AuthCallback] Session set error:', error);
            setErrorMessage(error.message || 'Failed to verify email');
            setStatus('error');
            return;
          }

          if (data.user) {
            console.log('[AuthCallback] Session established for user:', data.user.id);
            await initializeUserAndRedirect(data.user.id);
            return;
          }
        }

        // If no tokens or code, check if there's an existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('[AuthCallback] Found existing session');
          await initializeUserAndRedirect(session.user.id);
          return;
        }

        // No valid authentication found
        console.error('[AuthCallback] No valid authentication tokens found');
        setErrorMessage('Invalid or expired confirmation link. Please try signing up again.');
        setStatus('error');

      } catch (error: any) {
        console.error('[AuthCallback] Unexpected error:', error);
        setErrorMessage(error.message || 'An unexpected error occurred');
        setStatus('error');
      }
    };

    /**
     * Initialize user data after email confirmation and redirect to login
     */
    const initializeUserAndRedirect = async (userId: string) => {
      try {
        console.log('[AuthCallback] Initializing user data for:', userId);
        
        // Check if user data already exists
        const { data: existingData } = await supabase
          .from('user_code_ownership')
          .select('user_code')
          .eq('user_id', userId)
          .single();

        if (existingData?.user_code) {
          console.log('[AuthCallback] User data already exists:', existingData.user_code);
        } else {
          // Initialize user data via RPC function
          console.log('[AuthCallback] Calling initialize_user_data...');
          const { data: initData, error: initError } = await supabase
            .rpc('initialize_user_data', { p_user_id: userId });

          if (initError) {
            console.error('[AuthCallback] Failed to initialize user data:', initError);
            // Continue anyway - user can still log in, support can help if needed
          } else {
            console.log('[AuthCallback] User data initialized:', initData);
          }
        }

        // Sign out the user so they can log in fresh
        // This ensures a clean login experience
        await supabase.auth.signOut({ scope: 'local' });

        setStatus('success');
        
        // Redirect to auth page with success indicator after a short delay
        setTimeout(() => {
          navigate('/auth?confirmed=true', { replace: true });
        }, 2000);

      } catch (error: any) {
        console.error('[AuthCallback] Error during user initialization:', error);
        // Still redirect to login even if initialization fails
        setStatus('success');
        setTimeout(() => {
          navigate('/auth?confirmed=true', { replace: true });
        }, 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#e9e6dc] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <CardTitle>Verifying your email...</CardTitle>
              <CardDescription>
                Please wait while we confirm your email address.
              </CardDescription>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-green-600">Email Verified!</CardTitle>
              <CardDescription>
                Your email has been confirmed. Redirecting you to sign in...
              </CardDescription>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="flex justify-center mb-4">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              <CardTitle className="text-red-600">Verification Failed</CardTitle>
              <CardDescription className="text-red-500">
                {errorMessage}
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        {status === 'error' && (
          <CardContent className="text-center">
            <button
              onClick={() => navigate('/auth', { replace: true })}
              className="text-primary hover:underline font-medium"
            >
              Return to Sign In
            </button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
