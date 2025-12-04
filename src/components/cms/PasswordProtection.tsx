import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Lock } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface PasswordProtectionProps {
  onAuthenticated: (password: string) => void;
  isSetup: boolean;
}

export function PasswordProtection({ onAuthenticated, isSetup }: PasswordProtectionProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSetup) {
      // Setting up new password
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      onAuthenticated(password);
    } else {
      // Verifying existing password
      onAuthenticated(password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e9e6dc] to-[#d4cfc0] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-[#535146]/10">
              <Lock className="w-6 h-6 text-[#535146]" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            {isSetup ? "Set Up Password" : "Enter Password"}
          </CardTitle>
          <CardDescription className="text-center">
            {isSetup 
              ? "Create a password to protect your business card CMS" 
              : "Enter your password to access the CMS"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSetup ? "Create password (min 6 characters)" : "Enter your password"}
                required
                minLength={isSetup ? 6 : undefined}
              />
            </div>
            
            {isSetup && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  minLength={6}
                />
              </div>
            )}

            <Button type="submit" className="w-full bg-[#535146] hover:bg-[#535146]/90">
              {isSetup ? "Set Password & Continue" : "Unlock CMS"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
