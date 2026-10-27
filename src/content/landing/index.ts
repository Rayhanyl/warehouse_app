import hero from "./hero.json";
import proofPoints from "./proof-points.json";
import workflow from "./workflow.json";
import painPoints from "./pain-points.json";
import security from "./security.json";
import cta from "./cta.json";
import footer from "./footer.json";
import { landingContentSchema } from "./schema";

export const landingContent = landingContentSchema.parse({
  hero,
  proofPoints,
  workflow,
  painPoints,
  security,
  cta,
  footer,
});
