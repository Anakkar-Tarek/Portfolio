export interface Service {
  readonly badge: string;
  readonly icon: string;
  readonly title: string;
  readonly desc: string;
}

export const services = [
  {
    badge: "Strategy",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>`,
    title: "Digital Marketing Strategy",
    desc: "Developing structured strategies that help brands increase visibility, reach new audiences, and strengthen their digital presence.",
  },
  {
    badge: "Growth",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
    title: "Media Buying",
    desc: "Planning and purchasing ad placements across digital platforms to maximise brand reach, drive targeted traffic, and deliver measurable results.",
  },
  {
    badge: "Visuals",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
    title: "Videography & Photography",
    desc: "Creating high-quality visual content that captures the identity and atmosphere of a brand \u2014 content that stops the scroll.",
  },
  {
    badge: "Editing",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    title: "Editing & Post-Production",
    desc: "Transforming raw footage and images into polished content optimized for online platforms and maximum engagement.",
  },
  {
    badge: "Presence",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`,
    title: "Website Creation",
    desc: "Designing modern websites and landing pages that present brands clearly, effectively, and memorably online.",
  },
  {
    badge: "Narrative",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    title: "Brand Storytelling",
    desc: "Helping brands communicate their values, personality, and experience through authentic narratives that resonate and stick.",
  },
] as const satisfies readonly Service[];

export const serviceArrowSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>` as const;

export const serviceInquiryOptions = [
  "Digital Marketing Strategy",
  "Media Buying",
  "Videography & Photography",
  "Editing & Post-Production",
  "Website Creation",
  "Brand Storytelling",
  "Multiple / Not Sure",
] as const;
