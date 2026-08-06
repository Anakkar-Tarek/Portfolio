export interface TemplatePreview {
  readonly brand: string;
  readonly description: string;
  readonly image: string;
  readonly alt: string;
}

export const templates = [
  {
    brand: "Norte Coffee Gallery",
    description: "",
    image: "/images/templates/1.webp",
    alt: "Dior social media template preview",
  },
  {
    brand: "Tamuda Wellness Agency",
    description: "",
    image: "/images/templates/2.webp",
    alt: "TUMI social media template preview",
  },
  {
    brand: "AFCD Foundation",
    description: "",
    image: "/images/templates/3.webp",
    alt: "Moet Hennessy social media template preview",
  },
  {
    brand: "PGPR Technologies",
    description: "",
    image: "/images/templates/4.webp",
    alt: "Retail brand template preview",
  },
  {
    brand: "ACT Tetouan",
    description: "",
    image: "/images/templates/5.webp",
    alt: "Beauty brand template preview",
  },
  {
    brand: "Youth First Academy",
    description: "",
    image: "/images/templates/6.webp",
    alt: "Lifestyle brand template preview",
  },
  {
    brand: "Bakero Store",
    description: "",
    image: "/images/templates/7.webp",
    alt: "Bakero brand template preview",
  },
] as const satisfies readonly TemplatePreview[];
