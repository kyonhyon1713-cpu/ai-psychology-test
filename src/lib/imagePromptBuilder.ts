import type { Trait } from "@/data/questions";

export interface NormalizedScores {
  imagination: number;
  relationship: number;
  structure: number;
  emotion: number;
  exploration: number;
}

interface PromptInput {
  resultType: string;
  topTraits: [Trait, Trait];
  normalizedScores: NormalizedScores;
}

const traitObjects: Record<Trait, string> = {
  imagination: "butterflies",
  relationship: "two connected rings",
  structure: "a geometric door",
  emotion: "flowing waves",
  exploration: "a winding path",
};

const traitMood: Record<Trait, string> = {
  imagination: "surreal, imaginative, floating, symbolic",
  relationship: "connected, harmonious, relational, gently mirrored",
  structure: "geometric, symmetrical, balanced, orderly",
  emotion: "soft, flowing, atmospheric, emotionally expressive",
  exploration: "mysterious, open horizon, journey, discovery",
};

const traitLabels: Record<Trait, string> = {
  imagination: "Imaginative interpretation",
  relationship: "Relational interpretation",
  structure: "Structural perception",
  emotion: "Emotional responsiveness",
  exploration: "Exploratory interpretation",
};

export function buildImagePrompt({
  resultType,
  topTraits,
  normalizedScores,
}: PromptInput): string {
  const [primaryTrait, secondaryTrait] = topTraits;

  const primaryObject = traitObjects[primaryTrait];
  const secondaryObject = traitObjects[secondaryTrait];

  const primaryMood = traitMood[primaryTrait];
  const secondaryMood = traitMood[secondaryTrait];

  const primaryLabel = traitLabels[primaryTrait];
  const secondaryLabel = traitLabels[secondaryTrait];

  return `
Create a symbolic visual artwork representing the result of a self-exploration abstract image test.

Result title:
"${resultType}"

Primary tendency:
${primaryLabel}

Secondary tendency:
${secondaryLabel}

Primary symbolic object:
${primaryObject}

Secondary symbolic object:
${secondaryObject}

The ${primaryObject} must be the main visual focus.
The ${secondaryObject} should appear as a meaningful supporting visual element.

Create one coherent inner landscape rather than separate isolated objects.

Personality interpretation scores:
- Imaginative interpretation: ${normalizedScores.imagination}/100
- Relational interpretation: ${normalizedScores.relationship}/100
- Structural perception: ${normalizedScores.structure}/100
- Emotional responsiveness: ${normalizedScores.emotion}/100
- Exploratory interpretation: ${normalizedScores.exploration}/100

Primary visual characteristics:
${primaryMood}

Secondary visual characteristics:
${secondaryMood}

Art direction:
- symbolic surreal digital illustration
- dreamlike inner landscape
- elegant and refined
- subtle inkblot-inspired symmetry
- atmospheric lighting
- visually cohesive
- slightly mysterious but not frightening
- sophisticated rather than cartoonish
- centered composition suitable for a personality result page

Do not include:
- any text
- letters
- numbers
- logos
- user interface elements
- medical imagery
- diagnosis-related imagery
- horror imagery
- disturbing imagery

This image represents an abstract visual interpretation tendency, not a medical or psychological diagnosis.
`.trim();
}