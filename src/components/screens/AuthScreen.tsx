import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase-client';
import { api } from '../../lib/api';
import { toast } from 'sonner@2.0.3';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { MailCheck, ArrowLeft } from 'lucide-react@0.487.0';

export function AuthScreen() {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmationPending, setShowConfirmationPending] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const navigate = useNavigate();
  const { userCode } = useParams<{ userCode: string }>();
  const [searchParams] = useSearchParams();

  // Check for email confirmation success
  useEffect(() => {
    const confirmed = searchParams.get('confirmed');
    if (confirmed === 'true') {
      toast.success(t('auth.emailVerified'));
      // Clean up the URL
      navigate('/auth', { replace: true });
    }
    
    // Check for password reset success
    const reset = searchParams.get('reset');
    if (reset === 'success') {
      toast.success(t('auth.passwordResetSuccess'));
      // Clean up the URL
      navigate('/auth', { replace: true });
    }
  }, [searchParams, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const cleanName = name.trim();
    
    try {
      if (isLogin) {
        // ============================================
        // LOGIN FLOW - Fetch user code from database
        // ============================================
        const { data: signInData, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });
        if (error) throw error;
        
        // Fetch user code from database (source of truth)
        const userId = signInData.user.id;
        const { data: ownershipData, error: fetchError } = await supabase
          .from('user_code_ownership')
          .select('user_code')
          .eq('user_id', userId)
          .single();

        if (fetchError || !ownershipData) {
          console.error('Failed to fetch user code:', fetchError);
          toast.error(t('auth.failedToLoadProfile'));
          throw new Error('User code not found');
        }

        // Check if user is an employee and if account is active
        const { data: employeeStatus, error: statusError } = await supabase
          .rpc('check_employee_status', { p_user_id: userId });

        if (statusError) {
          console.error('Error checking employee status:', statusError);
          // Continue with login if check fails (fail open for edge cases)
        } else if (employeeStatus && employeeStatus.is_active === false) {
          // Employee account is deactivated - sign them out and show message
          try {
            await supabase.auth.signOut({ scope: 'local' });
          } catch (error) {
            console.warn('SignOut error (non-critical):', error);
          }
          toast.error(employeeStatus.message || t('auth.accountDeactivatedMessage'));
          throw new Error('Account deactivated');
        }

        // Store user code in localStorage for quick access
        const userCode = ownershipData.user_code;
        localStorage.setItem('user_code', userCode);
        
        toast.success(t('auth.loginSuccess'));
        
        // Navigate to correct studio with database user code
        navigate(`/${userCode}/studio`);
        return; // Exit early for login flow
        
      } else {
        // ============================================
        // SIGNUP FLOW - With Email Confirmation
        // ============================================
        // Signup flow:
        // 1. api.auth.signup creates user with emailRedirectTo
        // 2. If email confirmation is required, show "check your email" message
        // 3. If no confirmation needed, initialize user data and navigate to studio
        
        const signupResponse = await api.auth.signup(cleanEmail, cleanPassword, cleanName);
        
        // Check if email confirmation is required
        if (signupResponse.needsEmailConfirmation) {
          console.log('[AuthScreen] Email confirmation required');
          setPendingEmail(cleanEmail);
          setShowConfirmationPending(true);
          return; // Exit early - user needs to confirm email
        }
        
        // No confirmation needed - proceed to studio
        if (signupResponse.userCode) {
          localStorage.setItem('user_code', signupResponse.userCode);
        }
        
        toast.success(t('auth.accountCreated'));
        
        // Navigate to studio with the new user code
        navigate(`/${signupResponse.userCode}/studio`);
        return; // Exit early for signup flow
      }
      
    } catch (error: any) {
      console.error('Auth error:', error);
      
      if (error.message?.includes("Invalid login credentials")) {
         toast.error(t('auth.invalidCredentials'));
      } else if (error.message?.includes("User already registered")) {
         toast.error(t('auth.emailAlreadyRegistered'));
         setIsLogin(true);
      } else if (error.message?.includes("User code not found")) {
         toast.error(t('auth.profileNotFound'));
      } else if (error.message?.includes("Account deactivated")) {
         // Error message already shown in toast above
         // Don't show another error
      } else {
         toast.error(error.message || t('auth.authenticationFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    
    const cleanEmail = email.trim();
    
    if (!cleanEmail) {
      toast.error(t('auth.enterEmailAddress'));
      setForgotPasswordLoading(false);
      return;
    }

    try {
      await api.auth.forgotPassword(cleanEmail);
      toast.success(t('auth.passwordResetEmailSent'));
      setShowForgotPassword(false);
      setEmail('');
    } catch (error: any) {
      console.error('Forgot password error:', error);
      if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
        // Don't reveal if email exists or not for security
        toast.success(t('auth.passwordResetLinkSent'));
        setShowForgotPassword(false);
        setEmail('');
      } else {
        toast.error(error.message || t('auth.failedToSendResetEmail'));
      }
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // Show forgot password screen
  if (showForgotPassword) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#e9e6dc] p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <CardTitle>{t('auth.resetPassword')}</CardTitle>
            </div>
            <CardDescription>
              {t('auth.resetPasswordDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">{t('auth.email')}</Label>
                <Input 
                  id="forgot-email" 
                  type="email" 
                  placeholder="jane@example.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  autoFocus
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={forgotPasswordLoading}>
                {forgotPasswordLoading ? t('common.sending') : t('auth.sendResetLink')}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                <button 
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
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

  // Show confirmation pending screen
  if (showConfirmationPending) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#e9e6dc] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <MailCheck className="h-12 w-12 text-primary" />
            </div>
            <CardTitle>{t('auth.checkYourEmail')}</CardTitle>
            <CardDescription className="text-base">
              {t('auth.confirmationLinkSent')} <strong>{pendingEmail || email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('auth.clickLinkToVerify')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('auth.didntReceiveEmail')}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                if (!pendingEmail) return;
                setResendingEmail(true);
                try {
                  const { error } = await supabase.auth.resend({
                    type: 'signup',
                    email: pendingEmail,
                    options: {
                      emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                  });
                  if (error) {
                    toast.error(error.message || t('auth.failedToResendEmail'));
                  } else {
                    toast.success(t('auth.confirmationEmailSent'));
                  }
                } catch (error: any) {
                  toast.error(error.message || 'Failed to resend email');
                } finally {
                  setResendingEmail(false);
                }
              }}
              disabled={resendingEmail}
              className="w-full"
            >
              {resendingEmail ? t('common.sending') : t('auth.resendConfirmationEmail')}
            </Button>
            <div className="pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmationPending(false);
                  setIsLogin(true);
                }}
                className="text-primary hover:underline font-medium text-sm"
              >
                {t('auth.alreadyConfirmed')}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#e9e6dc] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}</CardTitle>
          <CardDescription>
            {isLogin 
              ? t('auth.signInDescription')
              : t('auth.signUpDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">{t('common.fullName')}</Label>
                <Input 
                  id="name" 
                  placeholder="Jane Doe" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="jane@example.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.password')}</Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                )}
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('common.pleaseWait') : (isLogin ? t('auth.signIn') : t('auth.signUp'))}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground mt-4">
              {isLogin ? t('auth.dontHaveAccount') + ' ' : t('auth.alreadyHaveAccount') + ' '}
              <button 
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? t('auth.signUp') : t('auth.signIn')}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}