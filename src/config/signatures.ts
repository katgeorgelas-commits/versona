/**
 * Versona Signatures — the canonical library.
 *
 * Nine human-first work archetypes, arranged on a 3×3 grid:
 *   • Focus: Craft · People · Systems  (what they orient around)
 *   • Mode:  Initiating · Sustaining · Evolving  (how they move)
 *
 * Signatures are AI-derived during onboarding from values, work style, skills,
 * and conversational answers. The point is shared ground — people find others
 * who share their Signature, and hiring teams see how Signatures complement
 * each other on a team.
 */

export type SignatureSlug =
  | "architect"
  | "maker"
  | "catalyst"
  | "operator"
  | "craftsperson"
  | "connector"
  | "pioneer"
  | "apprentice"
  | "mentor";

export type SignatureFocus = "systems" | "craft" | "people";
export type SignatureMode = "initiating" | "sustaining" | "evolving";

export type Signature = {
  slug: SignatureSlug;
  name: string;
  oneliner: string;
  archetype: { focus: SignatureFocus; mode: SignatureMode };
  description: string;
  brings: string[];
  energizes: string[];
  workingWith: string[];
  pairsWith: SignatureSlug[];
  iconKey: string;
};

export const SIGNATURES: Record<SignatureSlug, Signature> = {
  architect: {
    slug: "architect",
    name: "The Architect",
    oneliner: "Builds clarity out of ambiguity.",
    archetype: { focus: "systems", mode: "initiating" },
    description:
      "Architects see structure where others see noise. They draw the blueprint, decide quickly, and would rather ship a sharp v1 than debate a perfect v3.",
    brings: [
      "Cuts through ambiguity to a workable plan",
      "Makes decisions under uncertainty",
      "Names the real problem behind the stated one",
      "Founder energy — comfortable with risk",
    ],
    energizes: [
      "Greenfield problems with no playbook",
      "Quiet stretches of deep focus",
      "Teammates who push back hard and well",
    ],
    workingWith: [
      "Give them autonomy and a real outcome — they'll route around process",
      "They'll tell you when they think you're wrong; that's the feature",
      "Pair them with an Operator when execution scales beyond their head",
    ],
    pairsWith: ["operator", "connector", "mentor"],
    iconKey: "compass",
  },

  maker: {
    slug: "maker",
    name: "The Maker",
    oneliner: "Lives in the work. Ships before they explain.",
    archetype: { focus: "craft", mode: "initiating" },
    description:
      "Makers think with their hands. They prototype to think, learn by shipping, and have a strong opinion about craft that they'll quietly defend with the work.",
    brings: [
      "Fast prototyping and iteration",
      "Strong personal taste",
      "Bias toward shipping over meeting",
      "Tells the team what's actually possible",
    ],
    energizes: [
      "A blank canvas with a real deadline",
      "Working through problems in the medium itself",
      "Teammates who critique honestly",
    ],
    workingWith: [
      "Show them, don't tell them — they respond to drafts, not docs",
      "They'd rather be trusted than managed",
      "Pair with a Mentor or Connector to scale their craft beyond themselves",
    ],
    pairsWith: ["mentor", "catalyst", "craftsperson"],
    iconKey: "hammer",
  },

  catalyst: {
    slug: "catalyst",
    name: "The Catalyst",
    oneliner: "Lights a fire under the room.",
    archetype: { focus: "people", mode: "initiating" },
    description:
      "Catalysts make things happen through other people. They sell the vision, recruit the believers, and find momentum where others find friction.",
    brings: [
      "Vision-casting and persuasion",
      "Rallies teams around a shared goal",
      "Closes deals, partnerships, hires",
      "Comfortable with public exposure",
    ],
    energizes: [
      "Big-stage moments and pitches",
      "Building from zero",
      "Networks of motivated people",
    ],
    workingWith: [
      "Give them something solid to sell — they'll outpace the substrate",
      "They burn hot; pace matters",
      "Pair with an Architect or Operator who handles depth",
    ],
    pairsWith: ["architect", "operator", "connector"],
    iconKey: "flame",
  },

  operator: {
    slug: "operator",
    name: "The Operator",
    oneliner: "Makes the machine run.",
    archetype: { focus: "systems", mode: "sustaining" },
    description:
      "Operators turn ambition into infrastructure. They love the unglamorous middle — the runbooks, the dashboards, the quietly compounding systems that let everyone else move fast.",
    brings: [
      "Reliable execution at scale",
      "Process design that doesn't bureaucratize",
      "Anticipates failure modes before they bite",
      "Reduces founder-shaped chaos",
    ],
    energizes: [
      "Turning one-offs into repeatable systems",
      "Owning a number end-to-end",
      "Quiet wins that show up in dashboards",
    ],
    workingWith: [
      "Trust them with the boring stuff — that's where they shine",
      "Give them clear scope and they'll own outcomes",
      "Pair with an Architect upstream and a Catalyst downstream",
    ],
    pairsWith: ["architect", "catalyst", "pioneer"],
    iconKey: "layers",
  },

  craftsperson: {
    slug: "craftsperson",
    name: "The Craftsperson",
    oneliner: "Plays the long game with the work itself.",
    archetype: { focus: "craft", mode: "sustaining" },
    description:
      "Craftspeople care about how something is made, not just whether it ships. They build for the long term, raise the bar quietly, and create artifacts that age well.",
    brings: [
      "Depth and durability of work",
      "Quality standards that lift the team",
      "Slow truth instead of fast certainty",
      "Mastery that compounds over years",
    ],
    energizes: [
      "Problems with no obvious answer",
      "Time and space to do it right",
      "Teammates who notice the small things",
    ],
    workingWith: [
      "Speed isn't their language — outcomes are",
      "They'll politely push back on shortcuts that cost long-term quality",
      "Pair with a Maker upstream and an Apprentice they can teach",
    ],
    pairsWith: ["maker", "apprentice", "mentor"],
    iconKey: "diamond",
  },

  connector: {
    slug: "connector",
    name: "The Connector",
    oneliner: "Builds trust over years, not quarters.",
    archetype: { focus: "people", mode: "sustaining" },
    description:
      "Connectors invest in relationships before they're convenient. They remember the small things, show up consistently, and turn one good conversation into ten because the first person tells the next.",
    brings: [
      "Long-term relationships that compound",
      "Community that outlasts any single product",
      "Generosity with credit and attention",
      "A network you can borrow when it counts",
    ],
    energizes: [
      "Building in public",
      "Helping someone two steps behind",
      "Long honest conversations",
    ],
    workingWith: [
      "Their reach is real — but it's earned, so don't treat it like a list",
      "They'll burn out if asked to chase short-term metrics that violate trust",
      "Pair with a Catalyst for big moments and a Mentor to widen reach",
    ],
    pairsWith: ["catalyst", "mentor", "craftsperson"],
    iconKey: "users",
  },

  pioneer: {
    slug: "pioneer",
    name: "The Pioneer",
    oneliner: "Maps the territory before there's a map.",
    archetype: { focus: "systems", mode: "evolving" },
    description:
      "Pioneers go to the edge first. They live for new markets, new categories, and questions the team hasn't thought to ask yet. They're comfortable being wrong on the way to being early.",
    brings: [
      "Pattern recognition across domains",
      "Comfort with high-risk, high-information bets",
      "Spots opportunity before it's named",
      "Translates frontier signal into team language",
    ],
    energizes: [
      "Conversations that change a roadmap",
      "Being early on something real",
      "Synthesizing across fields",
    ],
    workingWith: [
      "Don't grade them on hit rate alone — grade on what the team learned",
      "Give them a runway before asking for proof",
      "Pair with an Architect to harden insight into structure",
    ],
    pairsWith: ["architect", "operator", "apprentice"],
    iconKey: "telescope",
  },

  apprentice: {
    slug: "apprentice",
    name: "The Apprentice",
    oneliner: "Learns by shipping. Welcomes the rewrite.",
    archetype: { focus: "craft", mode: "evolving" },
    description:
      "Apprentices are early in a path they've chosen on purpose. Their best trait is openness — they ask the question others are too proud to ask, and their growth rate is their unfair advantage.",
    brings: [
      "Compounding growth rate",
      "Beginner's mind on stuck problems",
      "Cross-discipline references",
      "Resilience to feedback that would bruise others",
    ],
    energizes: [
      "A real critic who'll tell them the truth",
      "Working alongside someone better than them",
      "Public learning",
    ],
    workingWith: [
      "Invest early — the returns ratio compounds",
      "Match them to a Mentor or Craftsperson and watch what happens",
      "Don't underestimate them; that's a mistake they'll quietly remember",
    ],
    pairsWith: ["mentor", "craftsperson", "pioneer"],
    iconKey: "telescope",
  },

  mentor: {
    slug: "mentor",
    name: "The Mentor",
    oneliner: "Lifts others as they go.",
    archetype: { focus: "people", mode: "evolving" },
    description:
      "Mentors multiply the people around them. They explain without condescending, ask the question that unlocks the answer, and care about the careers of teammates as much as their own work.",
    brings: [
      "Coaching that creates lasting capability",
      "Articulates tacit knowledge clearly",
      "Recruits via reputation, not pitches",
      "Quiet glue that keeps teams together",
    ],
    energizes: [
      "Seeing a teammate make the leap",
      "Hard conversations done well",
      "Long-form thinking and writing",
    ],
    workingWith: [
      "Their impact is in others — measure them through their team",
      "Protect their time; they over-give by default",
      "Pair with Apprentices, Connectors, and anyone leveling up fast",
    ],
    pairsWith: ["apprentice", "connector", "craftsperson"],
    iconKey: "mic",
  },
};

export const SIGNATURE_LIST = Object.values(SIGNATURES);

export const FOCUS_LABEL: Record<SignatureFocus, string> = {
  systems: "Systems",
  craft: "Craft",
  people: "People",
};

export const MODE_LABEL: Record<SignatureMode, string> = {
  initiating: "Initiating",
  sustaining: "Sustaining",
  evolving: "Evolving",
};

export const FOCUS_DESC: Record<SignatureFocus, string> = {
  systems: "Orients around structure, scale, and how the pieces fit.",
  craft: "Orients around the work itself — the medium, the artifact, the quality of the thing made.",
  people: "Orients around relationships, teams, and what humans do together.",
};

export const MODE_DESC: Record<SignatureMode, string> = {
  initiating: "Starts new things. Moves first, defines, ships.",
  sustaining: "Keeps things alive. Deepens, scales, makes lasting.",
  evolving: "Changes things. Learns, pivots, opens new ground.",
};
