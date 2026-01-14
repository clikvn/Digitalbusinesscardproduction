import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { FieldVisibilitySettings } from "./FieldVisibilitySettings";
import { GroupConfiguration } from "./GroupConfiguration";
import { AlertCircle, Share2, Users, Eye, Lock, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { useTranslation } from "react-i18next";

export function ShareConfiguration() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6 pb-32 sm:pb-24">
      {/* Section 1: Configure Groups */}
      <div className="space-y-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0a0a0a] text-white font-semibold shrink-0 mt-0.5">
            1
          </div>
          <div>
            <h3 className="mb-1">{t('shareConfiguration.configureGroups')}</h3>
            <p className="text-sm text-[#71717a] leading-relaxed">
              {t('shareConfiguration.configureGroupsDescription')}
            </p>
          </div>
        </div>
        <GroupConfiguration />
      </div>

      {/* Section 2: Visibility Settings */}
      <div className="space-y-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0a0a0a] text-white font-semibold shrink-0 mt-0.5">
            2
          </div>
          <div>
            <h3 className="mb-1">{t('shareConfiguration.configureFieldVisibility')}</h3>
            <p className="text-sm text-[#71717a] leading-relaxed">
              {t('shareConfiguration.configureFieldVisibilityDescription')}
            </p>
          </div>
        </div>
        <FieldVisibilitySettings />
      </div>
    </div>
  );
}