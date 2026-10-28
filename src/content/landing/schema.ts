import { z } from "zod";

const linkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});

const imageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
});

export const landingContentSchema = z.object({
  hero: z.object({
    skipLinkLabel: z.string().min(1),
    navigation: z.object({
      ariaLabel: z.string().min(1),
      mobileAriaLabel: z.string().min(1),
      openMenuLabel: z.string().min(1),
      openMenuAriaLabel: z.string().min(1),
      closeMenuLabel: z.string().min(1),
      closeMenuAriaLabel: z.string().min(1),
      links: z.array(linkSchema).min(1),
      loginLink: linkSchema,
      mobileLoginLink: linkSchema,
    }),
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    primaryCta: linkSchema,
    secondaryCta: linkSchema,
    visualLabel: z.string().min(1),
    visualSubLabel: z.string().min(1),
    sampleDataBadge: z.string().min(1),
    traceSummaryTitle: z.string().min(1),
    visualCaption: z.string().min(1),
    traceRecords: z.array(
      z.object({
        module: z.string().min(1),
        documentCode: z.string().min(1),
        detail: z.string().min(1),
        status: z.string().min(1),
        tone: z.enum(["blue", "teal", "amber"]),
      }),
    ).min(1),
    image: imageSchema,
  }),
  proofPoints: z.array(
    z.object({
      label: z.string().min(1),
      description: z.string().min(1),
      icon: z.enum(["boxes", "route", "shield-check"]),
    }),
  ).min(1),
  workflow: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    sampleBadge: z.string().min(1),
    steps: z.array(
      z.object({
        number: z.string().min(1),
        label: z.string().min(1),
        moduleLabel: z.string().min(1),
        documentExample: z.string().min(1),
        statusBadge: z.string().min(1),
        outcome: z.string().min(1),
        description: z.string().min(1),
        image: imageSchema,
      }),
    ).min(1),
  }),
  painPoints: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    columnProblemLabel: z.string().min(1),
    columnSolutionLabel: z.string().min(1),
    items: z.array(
      z.object({
        number: z.string().min(1),
        moduleTag: z.string().min(1),
        problem: z.string().min(1),
        answer: z.string().min(1),
      }),
    ).min(1),
  }),
  security: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    pillars: z.array(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
      }),
    ).min(1),
    controlPanel: z.object({
      label: z.string().min(1),
      sampleBadge: z.string().min(1),
      caption: z.string().min(1),
      items: z.array(
        z.object({
          label: z.string().min(1),
          detail: z.string().min(1),
          status: z.string().min(1),
          tone: z.enum(["teal", "amber", "blue"]),
        }),
      ).min(1),
    }),
    image: imageSchema,
  }),
  cta: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    button: linkSchema,
    secondaryLink: linkSchema,
  }),
  footer: z.object({
    productName: z.string().min(1),
    descriptor: z.string().min(1),
    description: z.string().min(1),
    copyright: z.string().min(1),
    loginLabel: z.string().min(1),
    image: imageSchema,
  }),
});

export type LandingContent = z.infer<typeof landingContentSchema>;
