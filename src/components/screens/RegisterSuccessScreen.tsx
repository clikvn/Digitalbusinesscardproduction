import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase-client';
import { toast } from 'sonner@2.0.3';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { CheckCircle2, Mail, ArrowRight } from 'lucide-react@0.487.0';

export function RegisterSuccessScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [resendingEmail, setResendingEmail] = useState(false);
  
  const email = searchParams.get('email') || '';

  const handleResendEmail = async () => {
    if (!email) return;
    
    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
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
      toast.error(error.message || t('auth.failedToResendEmail'));
    } finally {
      setResendingEmail(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#e9e6dc] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-green-600">
            {t('auth.registerSuccessTitle')}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {t('auth.registerSuccessMessage')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  {t('auth.checkYourEmail')}
                </p>
                {email && (
                  <p className="text-sm text-blue-700 mt-1">
                    {t('auth.confirmationLinkSent')} <strong>{email}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('auth.verifyEmailBeforeLogin')}
            </p>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>{t('auth.step1CheckEmail')}</li>
              <li>{t('auth.step2ClickLink')}</li>
              <li>{t('auth.step3ReturnToLogin')}</li>
            </ol>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleResendEmail}
              disabled={resendingEmail || !email}
              className="w-full"
            >
              {resendingEmail ? t('common.sending') : t('auth.resendConfirmationEmail')}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              {t('auth.didntReceiveEmail')}
            </p>
          </div>

          <div className="pt-4 border-t">
            <Button
              type="button"
              onClick={handleGoToLogin}
              className="w-full"
              variant="default"
            >
              {t('auth.goToLogin')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              {t('auth.verifyEmailFirst')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
