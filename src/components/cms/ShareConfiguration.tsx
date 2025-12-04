import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { FieldVisibilitySettings } from "./FieldVisibilitySettings";
import { GroupConfiguration } from "./GroupConfiguration";
import { AlertCircle, Share2, Users, Eye, Lock, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";

export function ShareConfiguration() {
  return (
    <div className="space-y-6 pb-32 sm:pb-24">
      {/* Section 1: Configure Groups */}
      <div className="space-y-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0a0a0a] text-white font-semibold shrink-0 mt-0.5">
            1
          </div>
          <div>
            <h3 className="mb-1">Configure Your Groups</h3>
            <p className="text-sm text-[#71717a] leading-relaxed">
              Create and customize contact groups to organize how you share your information
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
            <h3 className="mb-1">Configure Field Visibility</h3>
            <p className="text-sm text-[#71717a] leading-relaxed">
              Choose which fields each group can see, then generate share links in the Share tab
            </p>
          </div>
        </div>
        <FieldVisibilitySettings />
      </div>
    </div>
  );
}