export interface TemplatePreview {
  readonly brand: string;
  readonly description: string;
  readonly image: string;
  readonly alt: string;
}

export const templates = [
  {
    brand: "Dior",
    description: "French luxury fashion house known for couture, beauty, and accessories.",
    image: "/images/templates/1.webp",
    alt: "Dior social media template preview",
  },
  {
    brand: "TUMI",
    description: "Premium travel and luggage brand focused on modern mobility.",
    image: "/images/templates/2.webp",
    alt: "TUMI social media template preview",
  },
  {
    brand: "Moet Hennessy",
    description: "Luxury wines and spirits group behind high-end celebration brands.",
    image: "/images/templates/3.webp",
    alt: "Moet Hennessy social media template preview",
  },
  {
    brand: "Retail Brand",
    description: "Product-focused retail business built around lifestyle merchandising.",
    image: "/images/templates/4.webp",
    alt: "Retail brand template preview",
  },
  {
    brand: "Beauty Brand",
    description: "Beauty and skincare label centered on premium self-care products.",
    image: "/images/templates/5.webp",
    alt: "Beauty brand template preview",
  },
  {
    brand: "Lifestyle Brand",
    description: "Lifestyle-driven brand mixing culture, content, and everyday inspiration.",
    image: "/images/templates/6.webp",
    alt: "Lifestyle brand template preview",
  },
] as const satisfies readonly TemplatePreview[];
