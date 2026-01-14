import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Crown, Check, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../../lib/supabase-client';
import { useQueryClient } from '@tanstack/react-query';

interface UpgradePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan?: string;
}

export function UpgradePlanDialog({ open, onOpenChange, currentPlan }: UpgradePlanDialogProps) {
  const { t } = useTranslation();
  const [promotionCode, setPromotionCode] = useState('');
  const [isApplyingPromotion, setIsApplyingPromotion] = useState(false);
  const queryClient = useQueryClient();
  
  const isFreePlan = !currentPlan || currentPlan === 'free';
  const isPremium = currentPlan === 'premium';
  const isAdmin = currentPlan === 'admin';

  // Don't show upgrade dialog for admin users
  if (isAdmin) {
    return null;
  }

  const handleApplyPromotion = async () => {
    if (!promotionCode.trim()) {
      toast.error(t('dialogs.pleaseEnterPromotionCode'));
      return;
    }

    setIsApplyingPromotion(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t('dialogs.mustBeLoggedInForPromotion'));
        setIsApplyingPromotion(false);
        return;
      }

      // Apply the promotion code using the RPC function
      const { data, error } = await supabase.rpc('apply_promotion_code', {
        p_code: promotionCode.trim().toUpperCase(),
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error applying promotion code:', error);
        toast.error(error.message || t('dialogs.failedToApplyPromotionCode'));
        setIsApplyingPromotion(false);
        return;
      }

      // Handle response - check for both success and valid fields
      if (data && (data.success === true || data.valid === true)) {
        const planName = data.plan_name || '';
        toast.success(data.message || t('dialogs.promotionCodeAppliedSuccess'));
        setPromotionCode('');
        
        // Invalidate queries to refresh plan and business owner status
        queryClient.invalidateQueries({ queryKey: ['user-plan'] });
        queryClient.invalidateQueries({ queryKey: ['is-business-owner'] });
        
        // If upgraded to business plan, reload page to show "My Business" section
        if (planName === 'business') {
          // Close dialog first
          onOpenChange(false);
          // Reload page after a short delay to show success message
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          // For other plans, just close the dialog
          setTimeout(() => {
            onOpenChange(false);
          }, 1500);
        }
      } else {
        // Show specific error message from validation
        const errorMessage = data?.error || data?.message || t('dialogs.invalidOrExpiredPromotionCode');
        console.error('Promotion code validation failed:', data);
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('Unexpected error applying promotion:', error);
      toast.error(error.message || t('error.unexpectedError'));
    } finally {
      setIsApplyingPromotion(false);
    }
  };

  const plans = [
    {
      name: t('dialogs.freePlanName'),
      price: '$0',
      period: t('dialogs.freePlanPeriod'),
      features: [
        t('dialogs.freePlanFeature1'),
        t('dialogs.freePlanFeature2'),
        t('dialogs.freePlanFeature3'),
        t('dialogs.freePlanFeature4'),
      ],
      current: currentPlan === 'free',
    },
    {
      name: t('dialogs.premiumPlanName'),
      price: '$9.99',
      period: t('dialogs.premiumPlanPeriod'),
      features: [
        t('dialogs.premiumPlanFeature1'),
        t('dialogs.premiumPlanFeature2'),
        t('dialogs.premiumPlanFeature3'),
        t('dialogs.premiumPlanFeature4'),
        t('dialogs.premiumPlanFeature5'),
        t('dialogs.premiumPlanFeature6'),
      ],
      current: currentPlan === 'premium',
    },
    {
      name: t('dialogs.businessPlanName'),
      price: '$29.99',
      period: t('dialogs.businessPlanPeriod'),
      features: [
        t('dialogs.businessPlanFeature1'),
        t('dialogs.businessPlanFeature2'),
        t('dialogs.businessPlanFeature3'),
        t('dialogs.businessPlanFeature4'),
        t('dialogs.businessPlanFeature5'),
        t('dialogs.businessPlanFeature6'),
      ],
      current: false,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-500" />
            {t('dialogs.upgradeYourPlan')}
          </DialogTitle>
          <DialogDescription>
            {t('dialogs.upgradePlanDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative border-2 rounded-lg p-4 transition-all ${
                plan.current
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {plan.name}
                    {plan.current && (
                      <span className="text-xs font-normal text-muted-foreground">({t('dialogs.currentPlan')})</span>
                    )}
                  </h3>
                  <div className="mt-1">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
                  </div>
                </div>
                {plan.current ? (
                  <Button variant="outline" disabled>
                    {t('dialogs.currentPlan')}
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      // TODO: Integrate with payment/subscription system
                      console.log(`Upgrade to ${plan.name} plan`);
                      // For now, show a message
                      alert(`${t('dialogs.upgradeTo')} ${plan.name} ${t('dialogs.plan')} - ${t('dialogs.paymentIntegrationComingSoon')}`);
                    }}
                  >
                    {isFreePlan && plan.name === t('dialogs.premiumPlanName') ? t('dialogs.upgradeNow') : t('dialogs.selectPlan')}
                  </Button>
                )}
              </div>

              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Promotion Code Section */}
        <div className="mt-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border-2 border-amber-200">
          <div className="flex items-start gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">{t('dialogs.promotionCode')}</p>
              <p className="text-xs text-amber-700 mt-1">
                {t('dialogs.promotionCodeDescription')}
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="promotion-code" className="text-sm font-medium text-amber-900">
                {t('dialogs.enterPromotionCode')}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="promotion-code"
                  type="text"
                  placeholder={t('dialogs.promotionCodePlaceholder')}
                  value={promotionCode}
                  onChange={(e) => setPromotionCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isApplyingPromotion && promotionCode.trim()) {
                      handleApplyPromotion();
                    }
                  }}
                  disabled={isApplyingPromotion}
                  className="flex-1 uppercase"
                />
                <Button
                  onClick={handleApplyPromotion}
                  disabled={isApplyingPromotion || !promotionCode.trim()}
                  title="Press Enter or click to submit"
                  type="button"
                >
                  {isApplyingPromotion ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('dialogs.applying')}
                    </>
                  ) : (
                    <>
                      <span>{t('dialogs.submit')}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-amber-600">
              {t('dialogs.promotionCodeHelp')}
            </p>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>{t('dialogs.freeTrialNote')}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
