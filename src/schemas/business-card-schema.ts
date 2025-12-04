import { z } from 'zod';

// Visibility Group Type
export const VisibilityGroupSchema = z.enum(['Public', 'Private', 'Business', 'Personal']);
export type VisibilityGroup = z.infer<typeof VisibilityGroupSchema>;

// Portfolio Categories
export const PortfolioCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type PortfolioCategory = z.infer<typeof PortfolioCategorySchema>;

// Portfolio Items
export const PortfolioItemTypeSchema = z.enum(['images', 'video', 'virtual-tour']);
export type PortfolioItemType = z.infer<typeof PortfolioItemTypeSchema>;

export const PortfolioItemSchema = z.object({
  id: z.string(),
  type: PortfolioItemTypeSchema,
  title: z.string(),
  description: z.string(),
  categoryId: z.string(),
  images: z.array(z.string()).optional(),
  videoUrl: z.string().optional(),
  tourUrl: z.string().optional(),
});
export type PortfolioItem = z.infer<typeof PortfolioItemSchema>;

// Generic Contact/Profile Fields
export const ContactFieldSchema = z.object({
  value: z.string(),
  groups: z.array(VisibilityGroupSchema),
});

// Messaging & Social
export const MessagingAppSchema = z.object({
  username: z.string(),
  groups: z.array(VisibilityGroupSchema),
});

export const SocialChannelSchema = z.object({
  username: z.string(),
  groups: z.array(VisibilityGroupSchema),
});

// Profile Image Data
export const ProfileImageDataSchema = z.object({
  imageUrl: z.string(),
  facePosition: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }).nullable().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    scale: z.number(),
  }).optional(),
  avatarPosition: z.object({
    x: z.number(),
    y: z.number(),
    scale: z.number(),
  }).optional(),
});

// Group Share Settings (Dynamic Keys)
export const GroupShareSettingsSchema = z.record(z.array(z.string()));

// Main Business Card Schema
export const BusinessCardDataSchema = z.object({
  personal: z.object({
    name: z.string(),
    title: z.string(),
    businessName: z.string(),
    bio: z.string(),
    profileImage: z.string(), // Stored as JSON string currently, but validated as string
  }),
  contact: z.object({
    phone: ContactFieldSchema,
    email: ContactFieldSchema,
    address: ContactFieldSchema,
  }),
  socialMessaging: z.object({
    zalo: MessagingAppSchema,
    messenger: MessagingAppSchema,
    telegram: MessagingAppSchema,
    whatsapp: MessagingAppSchema,
    kakao: MessagingAppSchema,
    discord: MessagingAppSchema,
    wechat: MessagingAppSchema,
  }),
  socialChannels: z.object({
    facebook: SocialChannelSchema,
    linkedin: SocialChannelSchema,
    twitter: SocialChannelSchema,
    youtube: SocialChannelSchema,
    tiktok: SocialChannelSchema,
  }),
  portfolioCategories: z.array(PortfolioCategorySchema),
  portfolio: z.array(PortfolioItemSchema),
  profile: z.object({
    about: ContactFieldSchema, // Reusing ContactFieldSchema as it matches structure
    serviceAreas: ContactFieldSchema,
    specialties: ContactFieldSchema,
    experience: ContactFieldSchema,
    languages: ContactFieldSchema,
    certifications: ContactFieldSchema,
  }),
  groupShareSettings: GroupShareSettingsSchema.optional(),
  customLabels: z.record(z.string()).optional(),
  aiAgentVisible: z.boolean().optional(),
});

export type BusinessCardData = z.infer<typeof BusinessCardDataSchema>;
