import React, { useState } from "react";
import { useForm } from "react-hook-form@7.55.0";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { ImageUploader } from "../ImageUploader";
import { BusinessCardData } from "../../../types/business-card";
import { useAllFieldPermissions } from "../../../hooks/useBusinessManagement";
import { Lock } from "lucide-react";

interface PersonalInfoFormProps {
  data: BusinessCardData['personal'];
  onChange: (data: BusinessCardData['personal']) => void;
  onFieldFocus?: (field: { label: string; value: string; onApply: (value: string) => void }) => void;
}

export function PersonalInfoForm({ data, onChange, onFieldFocus }: PersonalInfoFormProps) {
  const form = useForm({
    defaultValues: data,
    values: data,
  });
  
  // Check field permissions for employees
  const { isReadonly } = useAllFieldPermissions();

  const handleChange = (field: keyof BusinessCardData['personal'], value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <Card className="border-[#e4e4e7] shadow-sm gap-3">
      <CardHeader className="px-4 md:px-6 md:pt-6 pb-[0px] pt-[12px] pr-[16px] pl-[16px]">
        <CardTitle className="text-lg">Personal Information</CardTitle>
        <p className="text-sm text-[#71717a] m-[0px]">Your name, title, and bio</p>
      </CardHeader>
      <CardContent className="px-4 md:px-6 pb-5 md:pb-6 space-y-6">
        <Form {...form}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleChange('name', e.target.value);
                    }}
                    onFocus={() => {
                      onFieldFocus?.({
                        label: 'Full Name',
                        value: data.name,
                        onApply: (value) => handleChange('name', value)
                      });
                    }}
                    placeholder="Enter your full name"
                  />
                </FormControl>
                <FormDescription>This will be displayed prominently on your card</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => {
              const readonly = isReadonly('personal.title');
              return (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Professional Title *
                    {readonly && (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" title="This field is read-only" />
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        if (!readonly) {
                          field.onChange(e);
                          handleChange('title', e.target.value);
                        }
                      }}
                      onFocus={() => {
                        if (!readonly) {
                          onFieldFocus?.({
                            label: 'Professional Title',
                            value: data.title,
                            onApply: (value) => handleChange('title', value)
                          });
                        }
                      }}
                      placeholder="e.g., Interior Designer"
                      disabled={readonly}
                      className={readonly ? 'bg-muted cursor-not-allowed' : ''}
                    />
                  </FormControl>
                  {readonly ? (
                    <FormDescription className="text-muted-foreground">
                      This field is controlled by your business owner
                    </FormDescription>
                  ) : (
                    <FormDescription>Your job title or profession</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio / About</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleChange('bio', e.target.value);
                    }}
                    onFocus={() => {
                      onFieldFocus?.({
                        label: 'Bio',
                        value: data.bio,
                        onApply: (value) => handleChange('bio', value)
                      });
                    }}
                    placeholder="Tell people about yourself..."
                    rows={4}
                    className="overflow-hidden"
                  />
                </FormControl>
                <FormDescription>A brief description about you and your work</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-medium">Images</h3>
          
          <ImageUploader
            label="Profile Image"
            value={data.profileImage}
            onChange={(value) => handleChange('profileImage', value)}
            description="Optional - Your profile photo"
            aspectRatio="1/1"
          />
        </div>
      </CardContent>
    </Card>
  );
}
