import React from "react";
import { useTranslation } from "react-i18next";
import ReactCountryFlag from "react-country-flag";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: "en", label: t("common.english"), countryCode: "US" },
    { code: "vi", label: t("common.vietnamese"), countryCode: "VN" },
  ];

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ReactCountryFlag
            countryCode={currentLanguage.countryCode}
            svg
            style={{
              width: "1.2em",
              height: "1.2em",
            }}
            title={currentLanguage.label}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={i18n.language === lang.code ? "bg-accent" : ""}
          >
            <ReactCountryFlag
              countryCode={lang.countryCode}
              svg
              style={{
                width: "1.2em",
                height: "1.2em",
                marginRight: "0.5rem",
              }}
              title={lang.label}
            />
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
