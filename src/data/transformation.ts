export interface TransformationMetric {
  readonly count: number;
  readonly label: string;
  readonly format?: "comma";
}

export interface TransformationSide {
  readonly period: string;
  readonly image: string;
  readonly alt: string;
  readonly metrics: readonly TransformationMetric[];
}

export const transformationResult = {
  before: {
    period: "Jan 1 - Jan 31",
    image: "/images/IG2.webp",
    alt: "Before - Jan 1 to Jan 31: 25,342 views, 597 accounts reached",
    metrics: [
      { count: 25342, label: "Views", format: "comma" },
      { count: 597, label: "Accounts Reached" },
    ],
  },
  after: {
    period: "Feb 9 - Mar 10",
    image: "/images/IG1.webp",
    alt: "After - Feb 9 to Mar 10: 349,391 views, 35,070 accounts reached",
    metrics: [
      { count: 349391, label: "Views", format: "comma" },
      { count: 35070, label: "Accounts Reached", format: "comma" },
    ],
  },
} as const satisfies {
  readonly before: TransformationSide;
  readonly after: TransformationSide;
};
