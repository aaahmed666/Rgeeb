"use client";

import { api } from "@/lib/api";

/**
 * Customer Lifecycle Mock Service
 *
 * Provides simulated data for all Customer Lifecycle module views.
 * All functions return Promises with setTimeout to simulate network latency.
 * Replace with real API calls in Phase 2.
 */

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

export interface DashboardStats {
  totalCustomers: number;
  totalCustomersTrend: number;
  activeCustomers: number;
  activeCustomersTrend: number;
  inOnboarding: number;
  inOnboardingLabel: string;
  activeSubscriptions: number;
  activeSubscriptionsTrend: number;
  upcomingRenewals: number;
  upcomingRenewalsLabel: string;
  totalBranches: number;
  totalBranchesTrend: number;
  totalCameras: number;
  totalCamerasTrend: number;
  activeAiServices: number;
  activeAiServicesTrend: number;
  activeIntegrations: number;
  activeIntegrationsTrend: number;
}

export interface CustomerDistribution {
  name: string;
  value: number;
  color: string;
}

export interface LifecycleStatusItem {
  stage: string;
  count: number;
  color: string;
  percentage: number;
}

export interface GrowthDataPoint {
  month: string;
  value: number;
}

export interface SubscriptionTier {
  name: string;
  value: number;
  color: string;
}

export interface StatusDistribution {
  label: string;
  count: number;
  color: string;
}

export interface OnboardingEfficiency {
  velocity: number;
  avgDays: number;
  trend: number;
  trendLabel: string;
}

export interface Customer {
  id: string;
  name: string;
  initials: string;
  customerId: string;
  businessType: string;
  status: "Active" | "Onboarding" | "Warning" | "Suspended" | "Churned";
  branches: number;
  cameras: number;
  aiServices: number;
  package: string;
  endDate: string;
}

export interface Contact {
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  initials: string;
  tier: string;
  customerId: string;
  industry: string;
  region: string;
  avatar?: string;
  annualRevenue: string;
  healthScore: number;
  totalBranches: number;
  totalBranchesTrend: string;
  totalCameras: number;
  totalCamerasLabel: string;
  aiServices: number;
  aiServicesTrend: string;
  activeIntegrations: number;
  activeIntegrationsLabel: string;
  companyInfo: {
    legalName: string;
    businessType: string;
    accountManager: string;
    primaryContact: string;
    headquartersAddress: string;
    primaryPhone: string;
    supportSla: string;
  };
  contacts: Contact[];
  subscription: {
    plan: string;
    planEdition: string;
    status: "Active" | "Warning" | "Expired";
    startDate: string;
    renewalDate: string;
    daysRemaining: number;
    features: string[];
  };
  recentActivity: ActivityEvent[];
}

export interface LifecycleStage {
  key: string;
  label: string;
  date: string | null;
  status: "completed" | "current" | "upcoming";
  estimatedDate?: string;
}

export interface Milestone {
  id: string;
  task: string;
  owner: string;
  targetDate: string;
  status: "Completed" | "In Progress" | "Scheduled" | "Blocked";
}

export interface LifecycleProgress {
  customerId: string;
  customerName: string;
  statusLabel: string;
  currentStage: string;
  totalCompletion: number;
  lastUpdated: string;
  stages: LifecycleStage[];
  milestones: Milestone[];
  engagementHealth: {
    score: number;
    maxScore: number;
    onboardingVelocity: string;
    onboardingVelocityTrend: string;
    supportTickets: string;
  };
  accountSpecialist: {
    name: string;
    role: string;
  };
  timeInStage: { days: number; trend: string };
  projectedGoLive: { date: string; status: string };
  riskAssessment: { level: string; description: string };
}

export interface ActivityEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: "subscription" | "system" | "training" | "ai" | "integration" | "asset" | "account";
  tags?: string[];
  attachment?: { name: string; size: string; note?: string };
}

export interface TimelineData {
  customerId: string;
  customerName: string;
  daysSinceLaunch: number;
  daysTrend: string;
  daysTrendLabel: string;
  activeCameras: number;
  activeCamerasLabel: string;
  annualizedValue: string;
  annualizedValueLabel: string;
  events: ActivityEvent[];
}

export interface RenewalEntry {
  id: string;
  customerName: string;
  customerInitials: string;
  accountManager: string;
  currentPackage: string;
  expiryDate: string;
  daysLeft: number;
  status: string;
  riskScore: number;
  riskLabel: string;
  riskColor: string;
  action: string;
}

export interface RenewalGroup {
  label: string;
  urgency: "critical" | "warning" | "normal";
  contractCount: number;
  totalValue: string;
  entries: RenewalEntry[];
}

export interface RenewalStats {
  healthScore: number;
  healthTrend: string;
  upcomingRenewals: number;
  upcomingRenewalsLabel: string;
  forecastedRevenue: string;
  forecastedRevenueTrend: string;
  highRiskAttrition: number;
  highRiskAttritionLabel: string;
}

export interface ServiceUtilization {
  name: string;
  used: number;
  total: number;
  unit: string;
  percentage: number;
  status: string;
}

export interface AiServiceLog {
  id: string;
  serviceName: string;
  unitCost: string;
  callsLast24h: number;
  status: "Stable" | "Throttled" | "Error";
}

export interface SubscriptionOverview {
  planName: string;
  subscriptionId: string;
  status: "Active" | "Warning" | "Expired";
  renewalDate: string;
  performanceLabel: string;
  utilization: ServiceUtilization[];
  nodeCoverage: {
    percentage: number;
    label: string;
    primaryNodes: number;
    edgeGateways: number;
  };
  aiServiceLogs: AiServiceLog[];
  storage: {
    hot: { label: string; description: string; size: string };
    standard: { label: string; description: string; size: string };
    archive: { label: string; description: string; size: string };
  };
  nextInvoice: {
    amount: string;
    period: string;
    trend: string;
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════════════════════ */

const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalCustomers: 1482,
  totalCustomersTrend: 12,
  activeCustomers: 1240,
  activeCustomersTrend: 5,
  inOnboarding: 42,
  inOnboardingLabel: "Stable",
  activeSubscriptions: 1186,
  activeSubscriptionsTrend: 6,
  upcomingRenewals: 18,
  upcomingRenewalsLabel: "Next 30 Days",
  totalBranches: 482,
  totalBranchesTrend: 9,
  totalCameras: 8500,
  totalCamerasTrend: 24,
  activeAiServices: 26,
  activeAiServicesTrend: 8,
  activeIntegrations: 34,
  activeIntegrationsTrend: 15,
};

const MOCK_CUSTOMER_DISTRIBUTION: CustomerDistribution[] = [
  { name: "Retail", value: 38, color: "#f97316" },
  { name: "Healthcare", value: 22, color: "#3b82f6" },
  { name: "Logistics", value: 18, color: "#22c55e" },
  { name: "Manufacturing", value: 12, color: "#a855f7" },
  { name: "Technology", value: 6, color: "#06b6d4" },
  { name: "Other", value: 4, color: "#64748b" },
];

const MOCK_LIFECYCLE_STATUS: LifecycleStatusItem[] = [
  { stage: "Active", count: 842, color: "#22c55e", percentage: 57 },
  { stage: "Onboarding", count: 234, color: "#3b82f6", percentage: 16 },
  { stage: "Implementation", count: 178, color: "#f97316", percentage: 12 },
  { stage: "Renewal Pending", count: 124, color: "#eab308", percentage: 8 },
  { stage: "At Risk", count: 68, color: "#ef4444", percentage: 5 },
  { stage: "Churned", count: 36, color: "#64748b", percentage: 2 },
];

const MOCK_GROWTH_DATA: GrowthDataPoint[] = [
  { month: "Jan", value: 820 },
  { month: "Feb", value: 850 },
  { month: "Mar", value: 870 },
  { month: "Apr", value: 920 },
  { month: "May", value: 950 },
  { month: "Jun", value: 1010 },
  { month: "Jul", value: 1060 },
  { month: "Aug", value: 1120 },
  { month: "Sep", value: 1180 },
  { month: "Oct", value: 1250 },
  { month: "Nov", value: 1340 },
  { month: "Dec", value: 1482 },
];

const MOCK_SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  { name: "Enterprise", value: 62, color: "#1a1f2e" },
  { name: "Pro", value: 24, color: "#f97316" },
  { name: "Basic", value: 14, color: "#2dd4bf" },
];

const MOCK_STATUS_DISTRIBUTION: StatusDistribution[] = [
  { label: "Active Deployment", count: 842, color: "#22c55e" },
  { label: "Setting Up", count: 118, color: "#3b82f6" },
  { label: "At Risk / Attention", count: 24, color: "#ef4444" },
  { label: "Suspended", count: 12, color: "#1e293b" },
];

const MOCK_ONBOARDING_EFFICIENCY: OnboardingEfficiency = {
  velocity: 78,
  avgDays: 14.2,
  trend: 2.4,
  trendLabel: "On Target",
};

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "RGE-10293",
    name: "Nexus Market",
    initials: "NM",
    customerId: "RGE-10293",
    businessType: "Retail",
    status: "Active",
    branches: 24,
    cameras: 1420,
    aiServices: 12,
    package: "Enterprise Pro",
    endDate: "Dec 14, 2025",
  },
  {
    id: "RGE-10294",
    name: "Global Logistics Co.",
    initials: "GL",
    customerId: "RGE-10294",
    businessType: "Logistics",
    status: "Onboarding",
    branches: 8,
    cameras: 512,
    aiServices: 4,
    package: "Advanced Tier",
    endDate: "Oct 20, 2025",
  },
  {
    id: "RGE-10295",
    name: "SafeVault Security",
    initials: "SV",
    customerId: "RGE-10295",
    businessType: "Security",
    status: "Warning",
    branches: 42,
    cameras: 3120,
    aiServices: 18,
    package: "Enterprise Pro",
    endDate: "Feb 02, 2025",
  },
  {
    id: "RGE-10296",
    name: "Titan Hospitality",
    initials: "TH",
    customerId: "RGE-10296",
    businessType: "Retail",
    status: "Active",
    branches: 115,
    cameras: 12400,
    aiServices: 24,
    package: "Custom SLA",
    endDate: "Jan 12, 2026",
  },
  {
    id: "RGE-10297",
    name: "Swift Courier Service",
    initials: "SC",
    customerId: "RGE-10297",
    businessType: "Logistics",
    status: "Active",
    branches: 16,
    cameras: 840,
    aiServices: 6,
    package: "Standard Tier",
    endDate: "Aug 30, 2025",
  },
  {
    id: "RGE-10298",
    name: "Metro Health Systems",
    initials: "MH",
    customerId: "RGE-10298",
    businessType: "Healthcare",
    status: "Active",
    branches: 32,
    cameras: 2100,
    aiServices: 15,
    package: "Enterprise Pro",
    endDate: "Mar 15, 2026",
  },
  {
    id: "RGE-10299",
    name: "Apex Manufacturing",
    initials: "AM",
    customerId: "RGE-10299",
    businessType: "Manufacturing",
    status: "Onboarding",
    branches: 5,
    cameras: 280,
    aiServices: 3,
    package: "Standard Tier",
    endDate: "Nov 22, 2025",
  },
  {
    id: "RGE-10300",
    name: "CloudPeak Solutions",
    initials: "CP",
    customerId: "RGE-10300",
    businessType: "Technology",
    status: "Active",
    branches: 12,
    cameras: 640,
    aiServices: 8,
    package: "Advanced Tier",
    endDate: "Jul 08, 2025",
  },
];

let MOCK_CUSTOMERS_LIST: Customer[] = [...MOCK_CUSTOMERS];

const MOCK_LIFECYCLE_PROGRESS: LifecycleProgress = {
  customerId: "RGE-10293",
  customerName: "Global Retail Group",
  statusLabel: "In Implementation",
  currentStage: "AI Services Configuration",
  totalCompletion: 65,
  lastUpdated: "Today, 10:45 AM",
  stages: [
    { key: "requirements", label: "Waiting for Requirements", date: "Oct 12, 2023", status: "completed" },
    { key: "onboarding", label: "Onboarding Started", date: "Oct 15, 2023", status: "completed" },
    { key: "camera-setup", label: "Camera Setup", date: "Oct 28, 2023", status: "completed" },
    { key: "integration", label: "Integration Setup", date: "Nov 04, 2023", status: "completed" },
    { key: "ai-config", label: "AI Services Configuration", date: null, status: "current", estimatedDate: "Nov 15" },
    { key: "training", label: "Training Go Live", date: null, status: "upcoming" },
    { key: "active", label: "Active Customer", date: null, status: "upcoming" },
    { key: "renewal", label: "Renewal Due", date: null, status: "upcoming" },
  ],
  milestones: [
    { id: "m1", task: "RTSP Stream Authentication", owner: "Dev Team A", targetDate: "Nov 01", status: "Completed" },
    { id: "m2", task: "Webhook Integration (Stripe)", owner: "Cloud Ops", targetDate: "Nov 04", status: "Completed" },
    { id: "m3", task: "AI Object Weight Tuning", owner: "Data Scientist", targetDate: "Nov 12", status: "In Progress" },
    { id: "m4", task: "Model Training (Custom Retail)", owner: "AI Core", targetDate: "Nov 18", status: "Scheduled" },
  ],
  engagementHealth: {
    score: 8.4,
    maxScore: 10,
    onboardingVelocity: "+12% High",
    onboardingVelocityTrend: "up",
    supportTickets: "2 Open",
  },
  accountSpecialist: {
    name: "Sarah Jenkins",
    role: "AI Deployment Lead",
  },
  timeInStage: { days: 4.2, trend: "0.8 faster than avg" },
  projectedGoLive: { date: "Dec 01, 2023", status: "On schedule" },
  riskAssessment: { level: "Low Risk", description: "No blockers detected" },
};

const MOCK_TIMELINE_DATA: TimelineData = {
  customerId: "RGE-10293",
  customerName: "Global Retail Dynamics",
  daysSinceLaunch: 142,
  daysTrend: "+12% vs last month",
  daysTrendLabel: "Healthy",
  activeCameras: 1204,
  activeCamerasLabel: "across 24 branches",
  annualizedValue: "$42.8k",
  annualizedValueLabel: "Next renewal: Aug 12",
  events: [
    {
      id: "e1", title: "Subscription Renewed", type: "subscription",
      description: "Enterprise AI Analytics Tier renewed for an additional 12 months. The license coverage now extends to June 2025.",
      date: "Today, 10:24 AM",
    },
    {
      id: "e2", title: "System Go Live", type: "system",
      description: "Customer has officially transitioned to active production mode. All 24 branch nodes are reporting stable heartbeat and processing live inference data.",
      date: "May 28, 2024, 09:00 AM",
      tags: ["Production Ready", "Milestone Reached"],
    },
    {
      id: "e3", title: "Onboarding Training Completed", type: "training",
      description: "Standard operator training session completed by Sarah Miller. 12 staff members certified on the Rgeeb Dashboard and Alert Management systems.",
      date: "May 15, 2024, 02:30 PM",
      attachment: { name: "Training_Summary_GlobalRetail.pdf", size: "2.4 MB", note: "Completed by Trainer #44" },
    },
    {
      id: "e4", title: 'AI Service: "Loss Prevention" Activated', type: "ai",
      description: "Automated shoplifting detection and suspicious behavior monitoring modules are now live across the primary HQ location.",
      date: "April 30, 2024, 11:15 AM",
    },
    {
      id: "e5", title: "Slack Integration Activated", type: "integration",
      description: "Real-time alerts will now be pushed to the #retail-ops-security channel.",
      date: "April 12, 2024, 04:45 PM",
    },
    {
      id: "e6", title: "New Assets Provisioned: 120 Cameras", type: "asset",
      description: 'Batch import of 120 Sony 4K PTZ cameras completed for the "Chicago Downtown" branch.',
      date: "March 28, 2024, 10:00 AM",
    },
    {
      id: "e7", title: "Subscription Initialized", type: "subscription",
      description: "Enterprise Plan (Tier 3) created with unlimited AI service seats and 5,000 camera capacity.",
      date: "March 15, 2024, 02:22 PM",
    },
    {
      id: "e8", title: "Account Created", type: "account",
      description: "Initial record established for Global Retail Dynamics by Marcus Sterling (Sales Director).",
      date: "March 10, 2024, 11:30 AM",
    },
  ],
};

const MOCK_RENEWAL_STATS: RenewalStats = {
  healthScore: 94.2,
  healthTrend: "↑ 1.2% vs last month",
  upcomingRenewals: 124,
  upcomingRenewalsLabel: "Total contracts in next 30 days",
  forecastedRevenue: "$4.2M",
  forecastedRevenueTrend: "↑ 8% target surplus",
  highRiskAttrition: 7,
  highRiskAttritionLabel: "Requires immediate action",
};

const MOCK_RENEWAL_GROUPS: RenewalGroup[] = [
  {
    label: "Expiring in 7 Days",
    urgency: "critical",
    contractCount: 8,
    totalValue: "$640k",
    entries: [
      {
        id: "r1", customerName: "Astra Media Group", customerInitials: "AM",
        accountManager: "Marcus V.", currentPackage: "Enterprise AI+",
        expiryDate: "Oct 24, 2023", daysLeft: 4, status: "Negotiating",
        riskScore: 82, riskLabel: "82% High Risk", riskColor: "red", action: "View Case",
      },
      {
        id: "r2", customerName: "Sentinel City Council", customerInitials: "SC",
        accountManager: "Sarah L.", currentPackage: "Gov-Vision Max",
        expiryDate: "Oct 27, 2023", daysLeft: 7, status: "Overdue",
        riskScore: 95, riskLabel: "95% Attrition", riskColor: "red", action: "Escalate",
      },
    ],
  },
  {
    label: "Expiring in 14 Days",
    urgency: "warning",
    contractCount: 22,
    totalValue: "$1.1M",
    entries: [
      {
        id: "r3", customerName: "Nike Logistics AP", customerInitials: "NK",
        accountManager: "David K.", currentPackage: "Global Fleet",
        expiryDate: "Nov 02, 2023", daysLeft: 12, status: "Committed",
        riskScore: 12, riskLabel: "12% Healthy", riskColor: "green", action: "Edit Quote",
      },
      {
        id: "r4", customerName: "Velocity Retail", customerInitials: "VL",
        accountManager: "Sarah L.", currentPackage: "Store Analytics Pro",
        expiryDate: "Nov 04, 2023", daysLeft: 14, status: "Review Pending",
        riskScore: 45, riskLabel: "45% Neutral", riskColor: "yellow", action: "Reach Out",
      },
    ],
  },
  {
    label: "Expiring in 30 Days",
    urgency: "normal",
    contractCount: 94,
    totalValue: "$2.4M",
    entries: [
      {
        id: "r5", customerName: "Pax Healthcare", customerInitials: "PX",
        accountManager: "Marcus V.", currentPackage: "Health-Care Pro",
        expiryDate: "Nov 18, 2023", daysLeft: 28, status: "New Opportunity",
        riskScore: 5, riskLabel: "5% Healthy", riskColor: "green", action: "Send Quote",
      },
    ],
  },
];

const MOCK_SUBSCRIPTION_OVERVIEW: SubscriptionOverview = {
  planName: "Enterprise Ultra",
  subscriptionId: "RGEEB-SUB-88421-2024",
  status: "Active",
  renewalDate: "Oct 12, 2024",
  performanceLabel: "Q3 Performance",
  utilization: [
    { name: "Camera Nodes", used: 142, total: 200, unit: "Licenses", percentage: 71, status: "58 available" },
    { name: "AI Inference Credits", used: 8.4, total: 10, unit: "M Monthly", percentage: 84, status: "Critical threshold (80%+)" },
    { name: "Retention Storage (Cold Cloud)", used: 4.2, total: 5.0, unit: "TB Total", percentage: 84, status: "0.8 TB Remaining" },
  ],
  nodeCoverage: {
    percentage: 71,
    label: "Fleet Active",
    primaryNodes: 112,
    edgeGateways: 30,
  },
  aiServiceLogs: [
    { id: "l1", serviceName: "Crowd Density Analysis", unitCost: "0.05 Cr", callsLast24h: 12402, status: "Stable" },
    { id: "l2", serviceName: "License Plate Recognition", unitCost: "0.12 Cr", callsLast24h: 2910, status: "Stable" },
    { id: "l3", serviceName: "Intrusion Detection (Active)", unitCost: "0.08 Cr", callsLast24h: 452, status: "Throttled" },
    { id: "l4", serviceName: "Behavioral Sentiment", unitCost: "0.25 Cr", callsLast24h: 8922, status: "Stable" },
  ],
  storage: {
    hot: { label: "Hot Edge Storage", description: "Instant access / Real-time processing", size: "1.2 TB" },
    standard: { label: "Standard Cloud", description: "Archived event clips / 7 day retention", size: "2.4 TB" },
    archive: { label: "Deep Archive", description: "LTS Compliance data / 1 year retention", size: "0.6 TB" },
  },
  nextInvoice: {
    amount: "$12,450.00",
    period: "Oct 01 — Oct 31",
    trend: "↗ 8% increase from last period",
  },
};

const MOCK_CUSTOMER_PROFILE: CustomerProfile = {
  id: "RGE-10293",
  name: "Global Retail Corp",
  initials: "GR",
  tier: "Enterprise Partner",
  customerId: "GRC-8829-01",
  industry: "Multinational Retail",
  region: "North America & EMEA",
  annualRevenue: "$2.4M",
  healthScore: 98,
  totalBranches: 142,
  totalBranchesTrend: "+2 New",
  totalCameras: 3850,
  totalCamerasLabel: "Global",
  aiServices: 24,
  aiServicesTrend: "12 Active",
  activeIntegrations: 8,
  activeIntegrationsLabel: "Healthy",
  companyInfo: {
    legalName: "Global Retail Holdings LLC",
    businessType: "Enterprise / Retail Tech",
    accountManager: "Marcus Sterling",
    primaryContact: "sarah.j@globalretail.com",
    headquartersAddress: "1500 Broadway, New York, NY 10036, United States",
    primaryPhone: "+1 (212) 555-0198",
    supportSla: "Tier 1 - 24/7 Priority",
  },
  contacts: [
    { name: "Sarah Jenkins", role: "VP of Retail Operations", email: "sarah.j@globalretail.com", phone: "+1 (212) 555-0198" },
    { name: "David Miller", role: "IT Security Lead", email: "d.miller@globalretail.com", phone: "+1 (212) 555-0192" },
    { name: "Amelie C.", role: "Procurement Manager", email: "procurement@globalretail.com", phone: "+1 (212) 555-0177" }
  ],
  subscription: {
    plan: "Enterprise Ultra",
    planEdition: "Pro Edition",
    status: "Active",
    startDate: "Jan 12, 2023",
    renewalDate: "Jan 11, 2025",
    daysRemaining: 342,
    features: ["Unlimited Historical Analytics", "Custom API Endpoints", "White-label Dashboard"],
  },
  recentActivity: [
    {
      id: "pa1", title: "New Branch Added: London Flagship", type: "asset",
      description: "Marcus Sterling configured 12 new AI-enabled cameras for the London central location.",
      date: "2 hours ago",
    },
    {
      id: "pa2", title: "SAP ERP Integration Synced", type: "integration",
      description: "The daily automated inventory and footfall data synchronization completed successfully.",
      date: "5 hours ago",
    },
    {
      id: "pa3", title: "Module Updated: Sentiment Analysis v2.4", type: "ai",
      description: "System automatically updated the sentiment analysis engine for all retail floor cameras.",
      date: "Yesterday, 4:30 PM",
    },
  ],
};

/* ═══════════════════════════════════════════════════════════════════════════
   SERVICE FUNCTIONS (API Client with Mock Fallbacks)
   ═══════════════════════════════════════════════════════════════════════════ */

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    return await api.get<DashboardStats>("/customer-lifecycle/dashboard-stats");
  } catch (e) {
    console.warn("Using mock fallback for fetchDashboardStats", e);
    await delay(300);
    return MOCK_DASHBOARD_STATS;
  }
}

export async function fetchCustomerGrowth(): Promise<GrowthDataPoint[]> {
  try {
    return await api.get<GrowthDataPoint[]>("/customer-lifecycle/customer-growth");
  } catch (e) {
    console.warn("Using mock fallback for fetchCustomerGrowth", e);
    await delay(300);
    return MOCK_GROWTH_DATA;
  }
}

export async function fetchSubscriptionTiers(): Promise<SubscriptionTier[]> {
  try {
    return await api.get<SubscriptionTier[]>("/customer-lifecycle/subscription-tiers");
  } catch (e) {
    console.warn("Using mock fallback for fetchSubscriptionTiers", e);
    await delay(200);
    return MOCK_SUBSCRIPTION_TIERS;
  }
}

export async function fetchStatusDistribution(): Promise<StatusDistribution[]> {
  try {
    return await api.get<StatusDistribution[]>("/customer-lifecycle/status-distribution");
  } catch (e) {
    console.warn("Using mock fallback for fetchStatusDistribution", e);
    await delay(200);
    return MOCK_STATUS_DISTRIBUTION;
  }
}

export async function fetchOnboardingEfficiency(): Promise<OnboardingEfficiency> {
  try {
    return await api.get<OnboardingEfficiency>("/customer-lifecycle/onboarding-efficiency");
  } catch (e) {
    console.warn("Using mock fallback for fetchOnboardingEfficiency", e);
    await delay(200);
    return MOCK_ONBOARDING_EFFICIENCY;
  }
}

export async function fetchCustomerList(params?: {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  businessType?: string;
}): Promise<{ data: Customer[]; total: number; page: number; totalPages: number }> {
  try {
    return await api.get<{ data: Customer[]; total: number; page: number; totalPages: number }>("/customer-lifecycle/customers", { query: params });
  } catch (e) {
    console.warn("Using mock fallback for fetchCustomerList", e);
    await delay(400);
    let filtered = [...MOCK_CUSTOMERS_LIST];
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (c) => c.name.toLowerCase().includes(q) || c.customerId.toLowerCase().includes(q)
      );
    }
    if (params?.status && params.status !== "All") {
      filtered = filtered.filter((c) => c.status === params.status);
    }
    if (params?.businessType && params.businessType !== "All") {
      filtered = filtered.filter((c) => c.businessType === params.businessType);
    }
    const page = params?.page ?? 1;
    const perPage = params?.perPage ?? 10;
    const start = (page - 1) * perPage;
    return {
      data: filtered.slice(start, start + perPage),
      total: filtered.length,
      page,
      totalPages: Math.ceil(filtered.length / perPage),
    };
  }
}

export async function fetchCustomerProfile(id?: string): Promise<CustomerProfile> {
  try {
    return await api.get<CustomerProfile>(`/customer-lifecycle/customers/${id}`);
  } catch (e) {
    console.warn("Using mock fallback for fetchCustomerProfile", e);
    await delay(400);
    const found = MOCK_CUSTOMERS_LIST.find((c) => c.id === id);
    if (found) {
      return {
        ...MOCK_CUSTOMER_PROFILE,
        id: found.id,
        name: found.name,
        initials: found.initials,
        customerId: found.customerId,
        industry: found.businessType,
        totalBranches: found.branches,
        totalCameras: found.cameras,
        aiServices: found.aiServices,
        subscription: {
          ...MOCK_CUSTOMER_PROFILE.subscription,
          plan: found.package,
          status: found.status === "Active" ? "Active" : found.status === "Warning" ? "Warning" : "Expired",
          renewalDate: found.endDate,
        },
        companyInfo: {
          ...MOCK_CUSTOMER_PROFILE.companyInfo,
          businessType: found.businessType,
        }
      };
    }
    return MOCK_CUSTOMER_PROFILE;
  }
}

export async function fetchLifecycleProgress(customerId?: string): Promise<LifecycleProgress> {
  try {
    return await api.get<LifecycleProgress>(`/customer-lifecycle/lifecycle/${customerId}`);
  } catch (e) {
    console.warn("Using mock fallback for fetchLifecycleProgress", e);
    await delay(400);
    const found = MOCK_CUSTOMERS_LIST.find((c) => c.id === customerId);
    if (found) {
      return {
        ...MOCK_LIFECYCLE_PROGRESS,
        customerId: found.id,
        customerName: found.name,
        statusLabel: `Status: ${found.status}`,
      };
    }
    return MOCK_LIFECYCLE_PROGRESS;
  }
}

export async function fetchTimelineData(customerId?: string): Promise<TimelineData> {
  try {
    return await api.get<TimelineData>(`/customer-lifecycle/timeline/${customerId}`);
  } catch (e) {
    console.warn("Using mock fallback for fetchTimelineData", e);
    await delay(300);
    const found = MOCK_CUSTOMERS_LIST.find((c) => c.id === customerId);
    if (found) {
      return {
        ...MOCK_TIMELINE_DATA,
        customerId: found.id,
        customerName: found.name,
        activeCameras: found.cameras,
      };
    }
    return MOCK_TIMELINE_DATA;
  }
}

export async function fetchRenewalStats(): Promise<RenewalStats> {
  try {
    return await api.get<RenewalStats>("/customer-lifecycle/renewals/stats");
  } catch (e) {
    console.warn("Using mock fallback for fetchRenewalStats", e);
    await delay(200);
    return MOCK_RENEWAL_STATS;
  }
}

export async function fetchRenewalGroups(): Promise<RenewalGroup[]> {
  try {
    return await api.get<RenewalGroup[]>("/customer-lifecycle/renewals/groups");
  } catch (e) {
    console.warn("Using mock fallback for fetchRenewalGroups", e);
    await delay(400);
    return MOCK_RENEWAL_GROUPS;
  }
}

export async function fetchSubscriptionOverview(customerId?: string): Promise<SubscriptionOverview> {
  try {
    return await api.get<SubscriptionOverview>(`/customer-lifecycle/subscriptions/${customerId}`);
  } catch (e) {
    console.warn("Using mock fallback for fetchSubscriptionOverview", e);
    await delay(300);
    const found = MOCK_CUSTOMERS_LIST.find((c) => c.id === customerId);
    if (found) {
      return {
        ...MOCK_SUBSCRIPTION_OVERVIEW,
        status: found.status === "Active" ? "Active" : found.status === "Warning" ? "Warning" : "Expired",
        renewalDate: found.endDate,
        utilization: [
          { name: "Camera Nodes", used: found.cameras, total: found.cameras + 500, unit: "Licenses", percentage: Math.round((found.cameras / (found.cameras + 500)) * 100), status: "500 available" },
          { name: "AI Inference Credits", used: found.aiServices * 0.8, total: found.aiServices * 1.5, unit: "M Monthly", percentage: Math.round((found.aiServices * 0.8 / (found.aiServices * 1.5)) * 100), status: "Within limits" },
          { name: "Retention Storage (Cold Cloud)", used: found.branches * 0.2, total: found.branches * 0.5, unit: "TB Total", percentage: Math.round((found.branches * 0.2 / (found.branches * 0.5)) * 100), status: "Healthy" },
        ]
      };
    }
    return MOCK_SUBSCRIPTION_OVERVIEW;
  }
}

export async function fetchCustomerDistribution(): Promise<CustomerDistribution[]> {
  try {
    return await api.get<CustomerDistribution[]>("/customer-lifecycle/distribution");
  } catch (e) {
    console.warn("Using mock fallback for fetchCustomerDistribution", e);
    await delay(200);
    return MOCK_CUSTOMER_DISTRIBUTION;
  }
}

export async function fetchLifecycleStatus(): Promise<LifecycleStatusItem[]> {
  try {
    return await api.get<LifecycleStatusItem[]>("/customer-lifecycle/lifecycle-status");
  } catch (e) {
    console.warn("Using mock fallback for fetchLifecycleStatus", e);
    await delay(200);
    return MOCK_LIFECYCLE_STATUS;
  }
}

export async function createCustomer(customer: Omit<Customer, "id" | "initials" | "customerId">): Promise<Customer> {
  try {
    return await api.post<Customer>("/customer-lifecycle/customers", customer);
  } catch (e) {
    console.warn("Using mock fallback for createCustomer", e);
    await delay(300);
    const nextIdNum = MOCK_CUSTOMERS_LIST.length > 0
      ? Math.max(...MOCK_CUSTOMERS_LIST.map((c) => {
          const parsed = parseInt(c.id.replace("RGE-", ""), 10);
          return isNaN(parsed) ? 10000 : parsed;
        })) + 1
      : 10301;
    const id = `RGE-${nextIdNum}`;
    const initials = customer.name
      .split(" ")
      .map((w) => w.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase() || "CU";
    const newCustomer: Customer = {
      ...customer,
      id,
      initials,
      customerId: id,
    };
    MOCK_CUSTOMERS_LIST.push(newCustomer);
    return newCustomer;
  }
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
  try {
    return await api.put<Customer>(`/customer-lifecycle/customers/${id}`, updates);
  } catch (e) {
    console.warn("Using mock fallback for updateCustomer", e);
    await delay(300);
    const index = MOCK_CUSTOMERS_LIST.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Customer not found");
    const updated = { ...MOCK_CUSTOMERS_LIST[index], ...updates };
    MOCK_CUSTOMERS_LIST[index] = updated;
    return updated;
  }
}

export async function deleteCustomer(id: string): Promise<boolean> {
  try {
    await api.delete(`/customer-lifecycle/customers/${id}`);
    return true;
  } catch (e) {
    console.warn("Using mock fallback for deleteCustomer", e);
    await delay(300);
    const index = MOCK_CUSTOMERS_LIST.findIndex((c) => c.id === id);
    if (index === -1) return false;
    MOCK_CUSTOMERS_LIST.splice(index, 1);
    return true;
  }
}
