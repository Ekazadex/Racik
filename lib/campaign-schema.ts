import { z } from 'zod';

export const campaignRequestSchema = z
  .object({
    language: z.enum(['en', 'id']),
    product: z.string().trim().min(2).max(80),
    audience: z.string().trim().min(2).max(160),
    goal: z.enum(['awareness', 'conversion', 'launch']),
    offer: z.string().trim().max(240),
    tone: z.enum(['hangat', 'ceria', 'premium', 'santai']),
  })
  .strict();

export const campaignResultSchema = z
  .object({
    campaignName: z.string().min(2).max(100),
    bigIdea: z.string().min(10).max(320),
    instagramCaption: z.string().min(20).max(1200),
    shortVideoScript: z.string().min(20).max(1000),
    whatsappMessage: z.string().min(20).max(700),
    storySlides: z.array(z.string().min(3).max(240)).length(3),
    callToAction: z.string().min(3).max(120),
    hashtags: z
      .array(z.string().regex(/^#[\p{L}\p{N}_]{1,30}$/u))
      .length(5),
    assumptions: z.array(z.string().min(3).max(180)).max(3),
  })
  .strict();

export type CampaignRequest = z.infer<typeof campaignRequestSchema>;
export type CampaignResult = z.infer<typeof campaignResultSchema>;
