import { z } from "zod";

export const SubStatusEnum = z.enum(["TRIAL", "ACTIVE", "SUSPENDED", "CANCELLED"]);

export const ListingCreateSchema = z.object({
  directoryId: z.string().cuid(),
  categorySlug: z.string().min(2),
  ville: z.string().min(2).max(60),
  villeLabel: z.string().max(80).optional(),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(30).optional(),
  description: z.string().max(2000).optional(),
  address: z.string().max(200).optional(),
  website: z.string().url().optional(),
});

export const ListingUpdateSchema = z.object({
  description: z.string().max(2000).optional(),
  address: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  photos: z.array(z.string().url()).optional(),
  isPublished: z.boolean().optional(),
});

export const MessageCreateSchema = z.object({
  listingId: z.string().cuid(),
  senderName: z.string().min(2).max(80),
  senderEmail: z.string().email(),
  content: z.string().min(5).max(2000),
});

export const MessageReplySchema = z.object({
  reply: z.string().min(2).max(2000),
});

export const ReviewCreateSchema = z.object({
  listingId: z.string().cuid(),
  authorName: z.string().min(2).max(80),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1500).optional(),
});

export const SeoGenerateSchema = z.object({
  directoryId: z.string().cuid(),
  mode: z.enum(["metier", "ville"]),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug invalide"),
  label: z.string().min(2).max(80),
});

export const SeoPageUpdateSchema = z.object({
  title: z.string().max(180).optional(),
  description: z.string().max(320).optional(),
  h1: z.string().max(180).optional(),
  isPublished: z.boolean().optional(),
});

export const CategoryCreateSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Slug invalide (a-z, 0-9, tirets)"),
  label: z.string().min(2).max(80),
  icon: z.string().max(6).optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .nullable(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

export const CategoryUpdateSchema = CategoryCreateSchema.partial();

export const PlanUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  priceCents: z.coerce.number().int().min(0).max(9_999_99).optional(),
  priority: z.coerce.number().int().min(0).max(10).optional(),
  stripePriceId: z.string().max(120).optional().nullable(),
  features: z.array(z.string().max(120)).max(20).optional(),
  trialDays: z.coerce.number().int().min(0).max(90).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

const AdminServiceInput = z.object({
  id: z.string().cuid().optional(),
  title: z.string().min(2).max(120),
  items: z.array(z.string().max(200)).max(20).default([]),
  priceLabel: z.string().max(60).optional().nullable(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const AdminListingUpdateSchema = z.object({
  categoryId: z.string().cuid().optional(),
  ville: z.string().min(2).max(60).optional(),
  villeLabel: z.string().max(80).optional(),
  description: z.string().max(4000).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  photos: z.array(z.string().url()).max(30).optional(),
  priority: z.coerce.number().int().min(0).max(10).optional(),
  isPublished: z.boolean().optional(),
  whatsapp: z
    .string()
    .regex(/^\+?[0-9\s]{6,20}$/, "Numéro invalide")
    .optional()
    .nullable(),
  facebook: z.string().url().optional().nullable(),
  instagram: z.string().url().optional().nullable(),
  services: z.array(AdminServiceInput).max(30).optional(),
  companyName: z.string().min(2).max(120).optional(),
  companyEmail: z.string().email().optional(),
  companyPhone: z.string().min(6).max(30).optional().nullable(),
  companyWebsite: z.string().url().optional().nullable(),
  planId: z.string().cuid().optional(),
  subscriptionStatus: SubStatusEnum.optional(),
});

export const AdminListingCreateSchema = z.object({
  categoryId: z.string().cuid(),
  planId: z.string().cuid(),
  companyName: z.string().min(2).max(120),
  companyEmail: z.string().email(),
  companyPhone: z.string().min(6).max(30).optional(),
  companyWebsite: z.string().url().optional(),
  ville: z.string().min(2).max(60),
  villeLabel: z.string().max(80).optional(),
  description: z.string().max(2000).optional(),
  address: z.string().max(200).optional(),
  status: SubStatusEnum.optional(),
  isPublished: z.boolean().optional(),
});

export const DirectorySettingsSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  tagline: z.string().max(160).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  darkBg: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  emailFrom: z.string().email().optional(),
});

export const InscriptionSchema = z.object({
  directorySlug: z.string().min(2),
  planKey: z.string().min(2),
  categorySlug: z.string().min(2),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(30).optional(),
  ville: z.string().min(2).max(60),
  villeLabel: z.string().max(80).optional(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(25),
});
