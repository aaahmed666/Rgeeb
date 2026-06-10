import type React from "react";

export interface AIServiceMeta {
  id: string;
  /** Numeric backend service id used for /customer/service-monitor/{id}/dashboard */
  apiId?: number;
  label: string;
  /** i18n translation key for the label, e.g. "aiServices.helmetDetection" */
  labelKey?: string;
  category: string;
  categoryHref: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
  description: string;
  detailedDescription: string;
  useCases: string[];
  stats: {
    totalDetections: number;
    todayDetections: number;
    accuracy: number;
    uptime: number;
    avgResponseMs: number;
    cameras: number;
  };
}
