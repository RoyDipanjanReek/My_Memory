export type LandingFeature = {
  icon: "lightning" | "command" | "shield" | "search" | "stack" | "spark";
  title: string;
  description: string;
};

export type LandingStep = {
  step: string;
  title: string;
  description: string;
};

export type LandingBenefit = {
  title: string;
  description: string;
  metric: string;
};

export type LandingTestimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
};

export type LandingPlan = {
  name: string;
  price: string;
  description: string;
  ctaLabel: string;
  highlight?: boolean;
  features: string[];
};

export type LandingFaq = {
  question: string;
  answer: string;
};

export const trustedCompanies = [
  "Northstar Labs",
  "VantaForge",
  "SignalStack",
  "Orbital Cloud",
  "RelayKit",
  "FoundryOS"
] as const;

export const landingFeatures: LandingFeature[] = [
  {
    icon: "lightning",
    title: "Capture in one paste",
    description:
      "Drop in code, outbound copy, prompts, or notes and MemoryOS turns it into a reusable asset without forcing a form."
  },
  {
    icon: "command",
    title: "Retrieve through command search",
    description:
      "Open the command palette, type a few words, and copy the exact memory you need before context switching slows you down."
  },
  {
    icon: "search",
    title: "Search that prioritizes real usage",
    description:
      "Results are ranked by title quality, relevance, recency, and usage so the right answer floats to the top."
  },
  {
    icon: "stack",
    title: "Organize without friction",
    description:
      "Collections, favorites, pins, and history views give teams structure without turning knowledge capture into maintenance work."
  },
  {
    icon: "shield",
    title: "Built for secure growth",
    description:
      "Session-based auth, scoped access, modular services, and owner-isolated data make the product ready for serious accounts."
  },
  {
    icon: "spark",
    title: "Designed for developer flow",
    description:
      "Keyboard-first actions, instant copy feedback, and a fast UI make the app feel closer to Raycast than a typical CRUD dashboard."
  }
];

export const landingSteps: LandingStep[] = [
  {
    step: "01",
    title: "Capture what you already write",
    description:
      "Paste anything your team repeats: snippets, replies, prompts, checklists, release notes, and onboarding answers."
  },
  {
    step: "02",
    title: "Let the system shape the memory",
    description:
      "MemoryOS infers a title, tags, category, and retrieval signals so teams can save now and organize later."
  },
  {
    step: "03",
    title: "Reuse it instantly everywhere",
    description:
      "Search, copy, and ship from a workspace built to surface the right memory in seconds."
  }
];

export const landingBenefits: LandingBenefit[] = [
  {
    metric: "8.6 hrs",
    title: "Recovered every month per teammate",
    description:
      "Teams stop hunting through docs, chats, and old pull requests when their best answers live in one searchable system."
  },
  {
    metric: "3x faster",
    title: "Response velocity for repeated work",
    description:
      "From outreach to technical support, reusable memory shortens the path between question and confident reply."
  },
  {
    metric: "1 source",
    title: "Shared operational memory",
    description:
      "Instead of tribal knowledge scattered across tools, everyone works from the same trusted library of proven answers."
  }
];

export const landingTestimonials: LandingTestimonial[] = [
  {
    quote:
      "We replaced scattered snippets, doc fragments, and DM drafts with one memory workspace. New hires ramp faster because the best answers are already there.",
    name: "Priya Nair",
    role: "Engineering Manager",
    company: "Northstar Labs"
  },
  {
    quote:
      "MemoryOS feels fast in the way good developer tools do. Our team uses it for support macros, release comms, and code patterns every single day.",
    name: "Daniel Brooks",
    role: "Head of Developer Experience",
    company: "RelayKit"
  },
  {
    quote:
      "The biggest win is consistency. Sales engineers, founders, and support all pull from the same trusted responses without rewriting from scratch.",
    name: "Maya Chen",
    role: "COO",
    company: "SignalStack"
  }
];

export const landingPlans: LandingPlan[] = [
  {
    name: "Starter",
    price: "$0",
    description: "For solo builders who want a faster personal memory system.",
    ctaLabel: "Start free",
    features: [
      "Personal workspace",
      "Command palette search",
      "Favorites and collections",
      "Import and export backups"
    ]
  },
  {
    name: "Pro",
    price: "$19",
    description: "For professionals who rely on fast, repeatable communication and code reuse.",
    ctaLabel: "Start free trial",
    highlight: true,
    features: [
      "Unlimited memories",
      "Version history",
      "Priority retrieval signals",
      "Advanced analytics and recent usage"
    ]
  },
  {
    name: "Team",
    price: "$79",
    description: "For teams building a shared memory layer across engineering, support, and ops.",
    ctaLabel: "Talk to sales",
    features: [
      "Shared collections",
      "Role-ready access controls",
      "Audit-friendly history",
      "Admin reporting and onboarding support"
    ]
  }
];

export const landingFaqs: LandingFaq[] = [
  {
    question: "What makes MemoryOS different from a notes app?",
    answer:
      "Notes apps are great for storage. MemoryOS is optimized for retrieval. It is built around command search, instant copy, usage-aware ranking, and fast reuse."
  },
  {
    question: "Can teams use it without adding a lot of process?",
    answer:
      "Yes. The product is designed around paste-first capture, automatic metadata, and minimal upkeep so teams can build shared memory without adding admin overhead."
  },
  {
    question: "Is this only for engineers?",
    answer:
      "It is built with a developer-first UX, but it works well for support, ops, sales engineering, and founder workflows where repeated high-quality responses matter."
  },
  {
    question: "How do you handle security and access?",
    answer:
      "The app is structured around scoped users, session-based authentication, and modular services so authorization can grow with the product instead of being bolted on later."
  },
  {
    question: "Can I bring in my existing snippets and templates?",
    answer:
      "Yes. Import and export support make it easy to seed the workspace from existing data and keep reliable backups as your library grows."
  }
];
