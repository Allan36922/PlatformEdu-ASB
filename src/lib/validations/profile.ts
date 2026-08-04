import { z } from "zod";

export const profileSchema = z.object({
  full_name: z.string().min(2, "Ingresa tu nombre completo").max(100),
  headline: z.string().max(120).optional().or(z.literal("")),
  bio: z.string().max(1000).optional().or(z.literal("")),
  website_url: z.string().url("URL inválida").optional().or(z.literal("")),
  twitter_url: z.string().url("URL inválida").optional().or(z.literal("")),
  linkedin_url: z.string().url("URL inválida").optional().or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const onboardingSchema = z.object({
  role: z.enum(["student", "instructor"]),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
