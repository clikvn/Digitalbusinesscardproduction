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
import { TermsAndConditionsScreen } from './TermsAndConditionsScreen';

export function AuthScreen() {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmationPending, setShowConfirmationPending] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showTermsAndConditions, setShowTermsAndConditions] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
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

  // Show terms when switching to signup if not yet accepted
  useEffect(() => {
    if (!isLogin && !termsAccepted && !showTermsAndConditions && !showForgotPassword && !showConfirmationPending) {
      setShowTermsAndConditions(true);
    }
  }, [isLogin, termsAccepted, showTermsAndConditions, showForgotPassword, showConfirmationPending]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For signup, proceed with registration (terms should already be accepted)
    if (!isLogin) {
      handleSignup();
      return;
    }
    
    // For login, proceed directly
    handleSignup();
  };

  const handleShowTerms = () => {
    setShowTermsAndConditions(true);
  };

  const handleTermsAccepted = () => {
    setTermsAccepted(true);
    setShowTermsAndConditions(false);
    // After accepting terms, user can now see and fill the registration form
  };

  const handleSwitchToSignup = () => {
    setIsLogin(false);
    // Reset terms acceptance when switching to signup
    setTermsAccepted(false);
  };

  const handleSwitchToLogin = () => {
    setIsLogin(true);
    // Reset terms acceptance when switching back to login
    setTermsAccepted(false);
  };

  const handleSignup = async () => {
    setLoading(true);
    
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    
    // Validate phone number is required for signup
    if (!isLogin && !cleanPhone) {
      toast.error(t('auth.phoneRequired'));
      setLoading(false);
      return;
    }
    
    try {
      if (isLogin) {
        // ============================================
        // LOGIN FLOW - Fetch user code from database
        // ============================================
        const { data: signInData, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });
        
        // Check for email confirmation error first
        if (error) {
          // Supabase throws an error when email is not confirmed
          // Error format: "Email not confirmed" or "AuthApiError: Email not confirmed"
          const errorMessage = error.message?.toLowerCase() || '';
          const isEmailNotConfirmed = 
            errorMessage.includes('email not confirmed') ||
            errorMessage.includes('email_not_confirmed') ||
            errorMessage.includes('email confirmation') ||
            (error.status === 400 && errorMessage.includes('not confirmed')) ||
            error.name === 'AuthApiError' && errorMessage.includes('email');
          
          if (isEmailNotConfirmed) {
            console.log('[AuthScreen] Email not confirmed error detected:', error.message);
            setLoading(false);
            toast.error(t('auth.emailNotVerified'));
            setTimeout(() => {
              navigate(`/auth/register-success?email=${encodeURIComponent(cleanEmail)}`, { replace: true });
            }, 100);
            return;
          }
          // If it's a different error, throw it to be handled by catch block
          throw error;
        }
        
        // Check if email is verified (fallback check in case error wasn't thrown)
        if (signInData?.user && !signInData.user.email_confirmed_at) {
          console.log('[AuthScreen] Email not verified - redirecting to register success page');
          setLoading(false); // Stop loading before navigation
          // Sign out the user
          await supabase.auth.signOut({ scope: 'local' });
          toast.error(t('auth.emailNotVerified'));
          // Redirect to register success page to guide user
          setTimeout(() => {
            navigate(`/auth/register-success?email=${encodeURIComponent(cleanEmail)}`, { replace: true });
          }, 100);
          return;
        }
        
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
        
        const signupResponse = await api.auth.signup(cleanEmail, cleanPassword, cleanName, cleanPhone);
        
        // Check if email confirmation is required
        if (signupResponse.needsEmailConfirmation) {
          console.log('[AuthScreen] Email confirmation required - redirecting to success page');
          setLoading(false); // Stop loading before navigation
          // Sign out the user to prevent any session access
          await supabase.auth.signOut({ scope: 'local' });
          // Use setTimeout to ensure navigation happens after state updates
          setTimeout(() => {
            navigate(`/auth/register-success?email=${encodeURIComponent(cleanEmail)}`, { replace: true });
          }, 100);
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
      
      // Check if this is an email not confirmed error (should have been handled above, but just in case)
      const errorMessage = error.message?.toLowerCase() || '';
      const isEmailNotConfirmed = 
        errorMessage.includes('email not confirmed') ||
        errorMessage.includes('email_not_confirmed') ||
        errorMessage.includes('email confirmation') ||
        (error.status === 400 && errorMessage.includes('not confirmed')) ||
        error.name === 'AuthApiError' && errorMessage.includes('email');
      
      if (isEmailNotConfirmed) {
        // This should have been handled above, but handle it here as fallback
        console.log('[AuthScreen] Email not confirmed error in catch block:', error.message);
        setLoading(false);
        toast.error(t('auth.emailNotVerified'));
        setTimeout(() => {
          navigate(`/auth/register-success?email=${encodeURIComponent(email.trim())}`, { replace: true });
        }, 100);
        return;
      } else if (error.message?.includes("Invalid login credentials")) {
         toast.error(t('auth.invalidCredentials'));
      } else if (error.message?.includes("User already registered") || 
                 error.message?.toLowerCase().includes("already registered") ||
                 error.message?.toLowerCase().includes("email already")) {
         toast.error(t('auth.emailAlreadyRegistered'));
         setIsLogin(true);
         setEmail(''); // Clear email field
         setPassword(''); // Clear password field
         setName(''); // Clear name field
         setPhone(''); // Clear phone field
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

  // Show terms and conditions screen when switching to signup
  if (showTermsAndConditions) {
    return (
      <TermsAndConditionsScreen
        onAccept={handleTermsAccepted}
        onBack={() => {
          setShowTermsAndConditions(false);
          setIsLogin(true); // Go back to login screen
          setTermsAccepted(false); // Reset acceptance
        }}
      />
    );
  }

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

  // Only show registration form if terms are accepted (for signup) or if it's login
  const canShowRegistrationForm = isLogin || (termsAccepted && !isLogin);

  // Don't show the form if it's signup and terms haven't been accepted yet
  if (!isLogin && !termsAccepted) {
    return null; // Terms screen will be shown by useEffect
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
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="phone">{t('common.phoneNumber')}</Label>
                <Input 
                  id="phone" 
                  type="tel"
                  placeholder={t('forms.phonePlaceholder')}
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
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
                onClick={() => {
                  if (isLogin) {
                    handleSwitchToSignup();
                  } else {
                    handleSwitchToLogin();
                  }
                }}
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