"use client";

import type { ElementType } from "react";
import {
  LayoutDashboard,
  Lightbulb,
  Activity,
  Video,
  Bell,
  ClipboardList,
  ClipboardCheck,
  CalendarClock,
  Radar,
  Cpu,
  Settings,
  LogOut,
  Users,
  Tag,
  Briefcase,
  Package,
  Bot,
  CreditCard,
  ShieldCheck,
  Building2,
  BarChart3,
  TrendingUp,
  Brain,
  Gauge,
  MessageSquare,
  MessagesSquare,
  ListChecks,
  CheckSquare,
  Columns,
  AlertTriangle,
  FileBarChart2,
  CalendarRange,
  FileStack,
  Sparkles,
  ShieldAlert,
  Building,
  UserCog,
  KeyRound,
  BellRing,
  Lock,
  Network,
  FileText,
  Crown,
  Camera,
  UserCheck,
  Plug,
  Globe,
  Link2,
  ShoppingBag,
  RotateCcw,
  DollarSign,
  Timer,
  Users2,
  BarChart2,
  HeartPulse,
} from "lucide-react";
import {
  HardHatIcon as HardHat,
  ChefHatIcon as ChefHat,
  LockIcon as LockService,
  FlameIcon as Flame,
  CigaretteIcon as Cigarette,
  DropletsIcon as Droplets,
  ScanFaceIcon as ScanFace,
  AlignJustifyIcon as AlignJustify,
  ClockIcon as Clock,
  UtensilsCrossedIcon as UtensilsCrossed,
  CoffeeIcon as Coffee,
  TruckIcon as Truck,
  CarIcon as Car,
  ReceiptIcon as Receipt,
  SandwichIcon as Sandwich,
  NavigationIcon as Navigation,
  IdCardIcon as IdCard,
  EyeIcon as Eye,
  RadioIcon as Radio,
  BoxIcon as Box,
  AlertOctagonIcon as AlertOctagon,
  PersonStandingIcon as PersonStanding,
  SearchPersonIcon as SearchPerson,
  BusIcon as Bus,
} from "@/components/ai-service-icons";
import {
  UsersIcon as AiUsers,
  ActivityIcon as AiActivity,
  TrendingUpIcon as AiTrendingUp,
  UserCheckIcon as AiUserCheck,
  CreditCardIcon as AiCreditCard,
} from "@/components/ai-service-icons";

export type LeafItem = {
  href: string;
  icon: ElementType;
  label: string;
  badge?: { text: string; tone?: "live" | "new" | "ai" | "warn" };
  permission?: string;
};
export type SubGroupItem = LeafItem & { children?: LeafItem[] };
export type GroupItem = LeafItem & {
  children?: (SubGroupItem | LeafItem)[];
  subGroups?: SubGroupItem[];
};
