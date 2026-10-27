import { z } from "zod";

const linkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});

export const landingContentSchema = z.object({
  hero: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    primaryCta: linkSchema,
    secondaryCta: linkSchema,
    visualLabel: z.string().min(1),
    visualCaption: z.string().min(1),
    image: z.object({
      src: z.string().min(1),
      alt: z.string().min(1),
    }),
  }),
  proofPoints: z.array(z.object({
    label: z.string().min(1),
    description: z.string().min(1),
    icon: z.enum(["boxes", "route", "shield-check"]),
  })).min(1),
  workflow: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    steps: z.array(z.object({
      number: z.string().min(1),
      label: z.string().min(1),
      description: z.string().min(1),
      image: z.object({
        src: z.string().min(1),
        alt: z.string().min(1),
      }),
    })).min(1),
  }),
  painPoints: z.array(z.object({
    problem: z.string().min(1),
    answer: z.string().min(1),
    accent: z.enum(["teal", "amber", "blue"]),
  })).min(1),
  security: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    points: z.array(z.string().min(1)).min(1),
    controlPanel: z.object({
      label: z.string().min(1),
      items: z.array(z.object({
        label: z.string().min(1),
        status: z.string().min(1),
      })).min(1),
    }),
    image: z.object({
      src: z.string().min(1),
      alt: z.string().min(1),
    }),
  }),
  cta: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    button: linkSchema,
  }),
  footer: z.object({
    productName: z.string().min(1),
    description: z.string().min(1),
    copyright: z.string().min(1),
    image: z.object({
      src: z.string().min(1),
      alt: z.string().min(1),
    }),
  }),
});

export type LandingContent = z.infer<typeof landingContentSchema>;
