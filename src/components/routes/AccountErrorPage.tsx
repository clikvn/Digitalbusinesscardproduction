import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";
import { Button } from "../ui/button";

interface AccountErrorPageProps {
  message: string;
  title?: string;
}

export function AccountErrorPage({ message, title }: AccountErrorPageProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const defaultTitle = title || t("error.accountNotAvailable");
  const buttonText = t("error.backToWelcome");

  return (
    <div className="bg-[#faf9f5] w-full h-full flex items-center justify-center p-6" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl border border-[#e4e4e7] shadow-sm p-8 md:p-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-[#fef2f2] p-4">
              <AlertCircle className="w-8 h-8 text-[#ef4444]" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-[#0a0a0a] mb-3">
            {defaultTitle}
          </h1>
          <p className="text-[#71717a] text-base leading-relaxed mb-6">
            {message}
          </p>
          <Button
            onClick={() => navigate('/myclik')}
            className="w-full"
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
}
