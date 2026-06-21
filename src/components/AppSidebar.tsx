"use client";

import * as React from "react";
import * as ReactDOM from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lightbulb,
  ChevronRight,
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
  User,
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
  ClipboardCheck as ClipboardCheckIcon,
  BarChart2,
  HeartPulse,
  Landmark,
  MapPin,
  Filter,
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
// Re-alias AI service icons that conflict with lucide nav icons
import {
  UsersIcon as AiUsers,
  ActivityIcon as AiActivity,
  TrendingUpIcon as AiTrendingUp,
  UserCheckIcon as AiUserCheck,
  CreditCardIcon as AiCreditCard,
} from "@/components/ai-service-icons";
import { useTranslation } from "react-i18next";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

import type {
  LeafItem,
  SubGroupItem,
  GroupItem,
} from "@/components/AppSidebarNavItems";

export function AppSidebar() {
  const { t, i18n } = useTranslation();
  const { logout, isAdmin, hasPermission, user } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();
  // Use i18n.language as dependency so this re-computes when language changes.
  // i18n.dir() alone doesn't trigger re-render; the useTranslation hook does via languageChanged.
  const isRtl = (i18n.resolvedLanguage ?? i18n.language) === "ar";
  const [openGroup, setOpenGroup] = React.useState<string | null>(null);
  const [openSubGroups, setOpenSubGroups] = React.useState<
    Record<string, string | null>
  >({});

  const getOpenSubGroup = (parentLabel: string): string | null =>
    openSubGroups[parentLabel] ?? null;

  const setOpenSubGroup = (parentLabel: string, subLabel: string | null) =>
    setOpenSubGroups((prev) => ({ ...prev, [parentLabel]: subLabel }));

  const isActive = (href: string) => {
    // Root dashboard items (/dashboard and /dashboard/admin) must be exact-match
    // only — otherwise every sub-page would keep "Dashboard" highlighted.
    const isRootDashboard =
      href === "/dashboard" || href === "/dashboard/admin";
    return isRootDashboard
      ? pathname === href
      : pathname === href ||
          pathname.startsWith(href + "/") ||
          pathname.startsWith(href + "?");
  };

  // canSee uses the same hasPermission the page guards use. hasPermission now
  // requires `read` (see auth.tsx / @/lib/permissions canAccess), so an item
  // shows in the sidebar IFF its page actually opens — no more mismatch.
  const canSee = (item: LeafItem) =>
    !item.permission || hasPermission(item.permission);

  const filterGroup = (item: GroupItem): GroupItem | null => {
    if (!item.children?.length && !item.subGroups?.length)
      return canSee(item) ? item : null;
    if (item.subGroups?.length) {
      const subGroups = item.subGroups
        .map((sg) => ({ ...sg, children: (sg.children ?? []).filter(canSee) }))
        .filter((sg) => sg.children.length > 0 || canSee(sg));
      if (subGroups.length === 0 && !canSee(item)) return null;
      return { ...item, subGroups };
    }
    const children = (item.children ?? []).filter(canSee);
    if (children.length === 0 && !canSee(item)) return null;
    return { ...item, children };
  };

  const statistics: GroupItem[] = [
    {
      href: isAdmin ? "/dashboard/admin" : "/dashboard",
      icon: LayoutDashboard,
      label: t("navigation.dashboard"),
    },
    {
      href: "/dashboard/statistics",
      icon: Lightbulb,
      label: t("navigation.insights"),
      permission: "insights",
      children: [
        {
          href: "/dashboard/statistics",
          icon: Gauge,
          label: t("insights.overview"),
          permission: "insights",
        },
        {
          href: "/dashboard/analytics",
          icon: BarChart3,
          label: t("insights.analytics", "Analytics"),
          permission: "analytics",
        },
        {
          href: "/dashboard/br-intelligence",
          icon: Brain,
          label: t("insights.brIntelligence", "Br Intelligence"),
          badge: { text: "★", tone: "ai" },
          permission: "br-intelligence",
        },
        {
          href: "/dashboard/productivity",
          icon: TrendingUp,
          label: t("insights.productivity", "Productivity"),
          permission: "productivity",
        },
        {
          href: "/dashboard/chat-analytics",
          icon: MessagesSquare,
          label: t("insights.chatAnalytics", "Chat Analytics"),
          badge: { text: "AI", tone: "ai" },
          permission: "chat-analytics",
        },
        {
          href: "/dashboard/chat-settings",
          icon: MessageSquare,
          label: t("insights.chatSettings", "Chat Settings"),
          permission: "chat-settings",
        },
      ],
    },
    // ── Customer Island (parity with old project's island module) ──
    {
      href: "/dashboard/customer-island/dashboard",
      icon: Landmark,
      label: t("navigation.customerIsland", "Customer Island"),
      permission: "island",
      children: [
        { href: "/dashboard/customer-island/dashboard", icon: LayoutDashboard, label: t("island.tabs.dashboard", "Island Dashboard"), permission: "island" },
        { href: "/dashboard/customer-island/traffic", icon: TrendingUp, label: t("island.tabs.traffic", "Traffic Analytics"), permission: "island" },
        { href: "/dashboard/customer-island/conversion", icon: Filter, label: t("island.tabs.conversion", "Conversion Funnel"), permission: "island" },
        { href: "/dashboard/customer-island/employee-presence", icon: UserCheck, label: t("island.tabs.presence", "Employee Presence"), permission: "island" },
        { href: "/dashboard/customer-island/response-time", icon: Clock, label: t("island.tabs.responseTime", "Response Time"), permission: "island" },
        { href: "/dashboard/customer-island/demographics", icon: Users, label: t("island.tabs.demographics", "Demographics"), badge: { text: "NEW", tone: "new" }, permission: "island" },
        { href: "/dashboard/customer-island/heatmap", icon: MapPin, label: t("island.tabs.heatmap", "Heatmap Analysis"), badge: { text: "NEW", tone: "new" }, permission: "island" },
        { href: "/dashboard/customer-island/violations", icon: AlertTriangle, label: t("island.tabs.violations", "Violations"), badge: { text: "NEW", tone: "new" }, permission: "island" },
      ],
    },
  ];

  const monitoring: GroupItem[] = [
    {
      href: "/dashboard/system-monitoring",
      icon: Radar,
      label: t("navigation.systemMonitoring"),
      permission: "system-monitoring",
    },
    {
      href: "/dashboard/live-feeds",
      icon: Video,
      label: t("navigation.liveFeeds"),
      badge: { text: "LIVE", tone: "live" },
      permission: "live-feeds",
    },
    {
      href: "/dashboard/detection-feed",
      icon: Activity,
      label: t("navigation.detectionFeed"),
      badge: { text: "AI", tone: "ai" },
      permission: "detection-feed",
    },
    {
      href: "/dashboard/event-timeline",
      icon: CalendarClock,
      label: t("navigation.eventTimeline"),
      permission: "event-timeline",
    },
    {
      href: "/dashboard/notifications",
      icon: Bell,
      label: t("navigation.notifications"),
      badge: { text: "NEW", tone: "new" },
      permission: "notifications",
    },
    {
      href: "/dashboard/tasks",
      icon: ClipboardList,
      label: t("navigation.tasks"),
      badge: { text: "!", tone: "warn" },
      permission: "tasks",
      children: [
        {
          href: "/dashboard/tasks",
          icon: ListChecks,
          label: t("navigation.tasksAll", "Task Management"),
          permission: "tasks",
        },
        {
          href: "/dashboard/kanban",
          icon: Columns,
          label: t("navigation.kanban", "Kanban Board"),
          permission: "kanban",
        },
        {
          href: "/dashboard/my-tasks",
          icon: CheckSquare,
          label: t("navigation.myTasks", "My Tasks"),
          permission: "my-tasks",
        },
        {
          href: "/dashboard/task-analytics",
          icon: BarChart3,
          label: t("navigation.taskAnalytics", "Task Analytics"),
          permission: "task-analytics",
        },
        {
          href: "/dashboard/escalation-alerts",
          icon: AlertTriangle,
          label: t("navigation.escalationAlerts", "Escalation & Alerts"),
          permission: "escalation-alerts",
        },
        {
          href: "/dashboard/task-reports",
          icon: FileBarChart2,
          label: t("navigation.taskReports", "Task Reports"),
          permission: "task-reports",
        },
        {
          href: "/dashboard/ai-scheduler",
          icon: CalendarRange,
          label: t("navigation.aiScheduler", "AI Smart Scheduler"),
          permission: "ai-scheduler",
        },
        {
          href: "/dashboard/task-templates",
          icon: FileStack,
          label: t("navigation.taskTemplates", "Task Templates"),
          permission: "task-templates",
        },
        {
          href: "/dashboard/ai-task-rules",
          icon: Sparkles,
          label: t("navigation.aiTaskRules", "AI Task Rules"),
          permission: "ai-task-rules",
        },
      ],
    },
  ];

  const aiServicesGroup: GroupItem[] = [
    {
      href: "/dashboard/ai-services",
      icon: Cpu,
      label: t("navigation.aiServices"),
      permission: "ai-services",
      subGroups: [
        {
          href: "/dashboard/ai-services/safety",
          icon: ShieldAlert,
          label: t("aiServices.safety", "Safety"),
          permission: "ai-services",
          children: [
            {
              href: "/dashboard/ai-services/safety/helmet-detection",
              icon: HardHat,
              label: t("aiServices.helmetDetection", "Helmet Detection"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/safety/kitchen-ppe",
              icon: ChefHat,
              label: t("aiServices.kitchenPpe", "Kitchen PPE"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/safety/restricted-area",
              icon: LockService,
              label: t("aiServices.restrictedArea", "Restricted Area"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/safety/smoke-fire",
              icon: Flame,
              label: t("aiServices.smokeFire", "Smoke & Fire"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/safety/smoking-detection",
              icon: Cigarette,
              label: t("aiServices.smokingDetection", "Smoking Detection"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/safety/spill-detection",
              icon: Droplets,
              label: t("aiServices.spillDetection", "Spill Detection"),
              permission: "ai-services",
            },
          ],
        },
        {
          href: "/dashboard/ai-services/analytics",
          icon: BarChart3,
          label: t("aiServices.analytics", "Analytics"),
          permission: "ai-services",
          children: [
            {
              href: "/dashboard/ai-services/analytics/age-gender",
              icon: AiUsers,
              label: t("aiServices.ageGender", "Age Gender Analytics"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/analytics/behavior-analysis",
              icon: AiActivity,
              label: t("aiServices.behaviorAnalysis", "Behavior Analysis"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/analytics/customer-traffic",
              icon: AiTrendingUp,
              label: t("aiServices.customerTraffic", "Customer Traffic"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/analytics/face-attendance",
              icon: AiUserCheck,
              label: t("aiServices.faceAttendance", "Face Attendance"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/analytics/face-detection",
              icon: ScanFace,
              label: t("aiServices.faceDetection", "Face Detection"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/analytics/queue-management",
              icon: AlignJustify,
              label: t("aiServices.queueManagement", "Queue Management"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/analytics/waiting-customer",
              icon: Clock,
              label: t("aiServices.waitingCustomer", "Waiting Customer"),
              permission: "ai-services",
            },
          ],
        },
        {
          href: "/dashboard/ai-services/operations",
          icon: Settings,
          label: t("aiServices.operations", "Operations"),
          permission: "ai-services",
          children: [
            {
              href: "/dashboard/ai-services/operations/cash-register",
              icon: AiCreditCard,
              label: t("aiServices.cashRegister", "Cash Register"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/operations/clean-tables",
              icon: UtensilsCrossed,
              label: t("aiServices.cleanTables", "Clean Tables"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/operations/cup-counting",
              icon: Coffee,
              label: t("aiServices.cupCounting", "Cup Counting"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/operations/delivery-tracking",
              icon: Truck,
              label: t("aiServices.deliveryTracking", "Delivery Tracking"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/operations/drive-thru",
              icon: Car,
              label: t("aiServices.driveThru", "Drive Thru"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/operations/receipt-detection",
              icon: Receipt,
              label: t("aiServices.receiptDetection", "Receipt Detection"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/operations/sandwich-counting",
              icon: Sandwich,
              label: t("aiServices.sandwichCounting", "Sandwich Counting"),
              permission: "ai-services",
            },
          ],
        },
        {
          href: "/dashboard/ai-services/monitoring",
          icon: Radar,
          label: t("aiServices.monitoring", "Monitoring"),
          permission: "ai-services",
          children: [
            {
              href: "/dashboard/ai-services/monitoring/gate-monitoring",
              icon: Navigation,
              label: t("aiServices.gateMonitoring", "Gate Monitoring"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/monitoring/license-plate",
              icon: IdCard,
              label: t("aiServices.licensePlate", "License Plate"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/monitoring/mask-detection",
              icon: Eye,
              label: t("aiServices.maskDetection", "Mask Detection"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/monitoring/motion-detection",
              icon: Radio,
              label: t("aiServices.motionDetection", "Motion Detection"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/monitoring/object-detection",
              icon: Box,
              label: t("aiServices.objectDetection", "Object Detection"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/monitoring/overcrowd-violation",
              icon: AlertOctagon,
              label: t("aiServices.overcrowdViolation", "Overcrowd Violation"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/monitoring/people-counting",
              icon: PersonStanding,
              label: t("aiServices.peopleCounting", "People Counting"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/monitoring/person-detection",
              icon: SearchPerson,
              label: t("aiServices.personDetection", "Person Detection"),
              permission: "ai-services",
            },
            {
              href: "/dashboard/ai-services/monitoring/vehicle-tracking",
              icon: Bus,
              label: t("aiServices.vehicleTracking", "Vehicle Tracking"),
              permission: "ai-services",
            },
          ],
        },
      ],
    },
  ];

  const settingsGroup: GroupItem[] = [
    {
      href: "/dashboard/organization/branches",
      icon: Building2,
      label: t("navigation.organization", "Organization"),
      permission: "organization",
      children: [
        {
          href: "/dashboard/organization/branches",
          icon: Building,
          label: t("navigation.branches", "Branches"),
          permission: "branches",
        },
        {
          href: "/dashboard/organization/departments",
          icon: Network,
          label: t("navigation.departments", "Departments"),
          permission: "departments",
        },
        {
          href: "/dashboard/organization/employees",
          icon: UserCog,
          label: t("navigation.employees", "Employees"),
          permission: "employees",
        },
        {
          href: "/dashboard/cameras",
          icon: Camera,
          label: t("navigation.cameras", "Cameras"),
          permission: "cameras",
        },
        {
          href: "/dashboard/attendance",
          icon: UserCheck,
          label: t("navigation.attendance", "Attendance"),
          permission: "attendance",
        },
      ],
    },
    {
      href: "/dashboard/preferences/roles",
      icon: Settings,
      label: t("navigation.preferences", "Preferences"),
      permission: "preferences",
      children: [
        {
          href: "/dashboard/preferences/roles",
          icon: KeyRound,
          label: t("navigation.roles", "Roles"),
          permission: "roles",
        },
        {
          href: "/dashboard/preferences/permissions",
          icon: ShieldCheck,
          label: t("navigation.permissions", "Permissions"),
          permission: "permissions",
        },
        {
          href: "/dashboard/preferences/notification-settings",
          icon: BellRing,
          label: t("navigation.notificationSettings", "Notification Settings"),
          permission: "notification-settings",
        },
        {
          href: "/dashboard/preferences/security",
          icon: Lock,
          label: t("navigation.security", "Security"),
          permission: "security",
        },
      ],
    },
    {
      href: "/dashboard/report-center",
      icon: FileText,
      label: t("navigation.reportCenter", "Report Center"),
      permission: "report-center",
    },
    {
      href: "/dashboard/subscription",
      icon: Crown,
      label: t("navigation.subscription", "Subscription"),
      permission: "subscription",
    },
    {
      href: "/dashboard/fatoorah",
      icon: CreditCard,
      label: t("navigation.fatoorah", "Fatoorah"),
      permission: "fatoorah",
    },
    {
      href: "/dashboard/foodics/connection",
      icon: Plug,
      label: t("navigation.foodicsIntelligence", "Foodics Intelligence"),
      permission: "foodics",
      children: [
        {
          href: "/dashboard/foodics/connection",
          icon: Link2,
          label: t("navigation.foodicsConnection", "Connection"),
          permission: "foodics",
        },
        {
          href: "/dashboard/foodics/orders",
          icon: ShoppingBag,
          label: t("navigation.foodicsOrders", "Orders"),
          permission: "foodics",
        },
        {
          href: "/dashboard/foodics/refund-verification",
          icon: RotateCcw,
          label: t("navigation.foodicsRefund", "Refund Verification"),
          permission: "foodics",
        },
        {
          href: "/dashboard/foodics/cash-drawer-audit",
          icon: DollarSign,
          label: t("navigation.foodicsCashDrawer", "Cash Drawer Audit"),
          permission: "foodics",
        },
        {
          href: "/dashboard/foodics/prep-time",
          icon: Timer,
          label: t("navigation.foodicsPrepTime", "Prep Time Intelligence"),
          permission: "foodics",
        },
        {
          href: "/dashboard/foodics/footfall",
          icon: Users2,
          label: t("navigation.foodicsFootfall", "Footfall vs Revenue"),
          permission: "foodics",
        },
        {
          href: "/dashboard/foodics/inventory-audit",
          icon: ClipboardCheckIcon,
          label: t("navigation.foodicsInventory", "Inventory Audit"),
          permission: "foodics",
        },
        {
          href: "/dashboard/foodics/dashboard",
          icon: BarChart2,
          label: t("navigation.foodicsDashboard", "Foodics Dashboard"),
          badge: { text: "AI", tone: "ai" },
          permission: "foodics",
        },
        {
          href: "/dashboard/foodics/connection#health",
          icon: HeartPulse,
          label: t("navigation.foodicsHealth", "System Health"),
          permission: "foodics",
        },
      ],
    },
  ];

  const admin: LeafItem[] = [
    {
      href: "/dashboard/admin",
      icon: LayoutDashboard,
      label: t("admin.dashboard.title", "Dashboard"),
    },
    {
      href: "/dashboard/admin/clients",
      icon: Users,
      label: t("admin.clients.title", "Clients"),
    },
    {
      href: "/dashboard/admin/users",
      icon: UserCog,
      label: t("admin.users.title", "Users"),
    },
    {
      href: "/dashboard/admin/categories",
      icon: Tag,
      label: t("admin.categories.title", "Categories"),
    },
    {
      href: "/dashboard/admin/services",
      icon: Briefcase,
      label: t("admin.services.title", "Services"),
    },
    {
      href: "/dashboard/admin/packages",
      icon: Package,
      label: t("admin.packages.title", "Packages"),
    },
    {
      href: "/dashboard/admin/ai-models",
      icon: Bot,
      label: t("admin.aiModels.title", "AI Models"),
    },
    {
      href: "/dashboard/admin/roles",
      icon: ShieldCheck,
      label: t("adminRoles.title", "Roles"),
      badge: { text: "NEW", tone: "new" },
    },
    {
      href: "/dashboard/admin/detections",
      icon: Radar,
      label: t("adminDetections.title", "Detections"),
      badge: { text: "NEW", tone: "new" },
    },
    {
      href: "/dashboard/admin/orchestrator",
      icon: Cpu,
      label: t("orchestrator.title", "Orchestrator"),
      badge: { text: "NEW", tone: "new" },
    },
    {
      href: "/dashboard/admin/settings",
      icon: Settings,
      label: t("admin.settings", "Settings"),
    },
    {
      href: "/dashboard/admin/subscriptions",
      icon: CreditCard,
      label: t("admin.subscriptions.title", "Subscriptions"),
    },
    {
      href: "/dashboard/admin/cities",
      icon: Building2,
      label: t("admin.cities", "Cities"),
    },
    {
      href: "/dashboard/admin/countries",
      icon: Globe,
      label: t("admin.countries", "Countries"),
    },
  ];

  const statisticsVisible = isAdmin
    ? []
    : (statistics.map(filterGroup).filter(Boolean) as GroupItem[]);
  const monitoringVisible = isAdmin
    ? []
    : (monitoring.map(filterGroup).filter(Boolean) as GroupItem[]);
  const aiServicesVisible = isAdmin
    ? []
    : (aiServicesGroup.map(filterGroup).filter(Boolean) as GroupItem[]);
  const settingsVisible = isAdmin
    ? []
    : (settingsGroup.map(filterGroup).filter(Boolean) as GroupItem[]);

  // ── Collapsed hover flyout (Portal-based to escape overflow:hidden) ────────
  const CollapsedFlyout = ({
    item,
    children: trigger,
  }: {
    item: GroupItem;
    children: React.ReactNode;
  }) => {
    const [open, setOpen] = React.useState(false);
    const [coords, setCoords] = React.useState({ top: 0, left: 0 });
    const triggerRef = React.useRef<HTMLDivElement>(null);
    const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    const handleMouseEnter = () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.top,
          left: isRtl ? rect.left - 8 : rect.right + 8,
        });
      }
      setOpen(true);
    };
    const handleMouseLeave = () => {
      closeTimer.current = setTimeout(() => setOpen(false), 150);
    };

    const hasSubGroups = !!item.subGroups?.length;
    const hasChildren = !!item.children?.length;
    const hasNested = hasSubGroups || hasChildren;

    const flyout =
      open && mounted ? (
        <div
          style={{
            position: "fixed",
            top: coords.top,
            left: isRtl ? undefined : coords.left,
            right: isRtl ? `calc(100vw - ${coords.left}px)` : undefined,
            zIndex: 9999,
            minWidth: 220,
            maxWidth: 280,
            maxHeight: "calc(100vh - 16px)",
            overflowY: "auto",
          }}
          className="rounded-lg border border-sidebar-border bg-sidebar shadow-2xl py-1.5"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Parent header */}
          <Link
            prefetch={true}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 text-sm font-semibold",
              "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              "rounded-md mx-1 transition-colors",
              isActive(item.href) &&
                "bg-sidebar-accent text-sidebar-accent-foreground",
              ""
            )}
          >
            {React.createElement(item.icon, { className: "h-4 w-4 shrink-0" })}
            <span className="flex-1 truncate">{item.label}</span>
            {renderBadge(item.badge)}
          </Link>

          {/* Children / SubGroups */}
          {hasNested && (
            <div className="mt-1 border-t border-sidebar-border/50 pt-1">
              {hasSubGroups
                ? item.subGroups!.map((sg) => (
                    <div key={sg.label}>
                      {/* Sub-group label */}
                      <div
                        className={cn(
                          "flex items-center gap-2 px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest",
                          "text-sidebar-foreground/50",
                          ""
                        )}
                      >
                        {React.createElement(sg.icon, {
                          className: "h-3 w-3 shrink-0",
                        })}
                        <span>{sg.label}</span>
                      </div>
                      {/* Leaf children indented */}
                      {(sg.children ?? []).map((c) => (
                        <Link
                          prefetch={true}
                          key={c.label}
                          href={c.href}
                          className={cn(
                            "flex items-center gap-2 pl-6 pr-3 py-1.5 text-sm",
                            "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            "rounded-md mx-1 transition-colors",
                            isActive(c.href) &&
                              "bg-sidebar-accent text-sidebar-accent-foreground",
                            ""
                          )}
                        >
                          {React.createElement(c.icon, {
                            className: "h-3.5 w-3.5 shrink-0 opacity-70",
                          })}
                          <span className="flex-1 truncate">{c.label}</span>
                          {renderBadge(c.badge)}
                        </Link>
                      ))}
                    </div>
                  ))
                : (item.children ?? []).map((c) => (
                    <Link
                      prefetch={true}
                      key={c.label}
                      href={c.href}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 text-sm",
                        "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        "rounded-md mx-1 transition-colors",
                        isActive(c.href) &&
                          "bg-sidebar-accent text-sidebar-accent-foreground",
                        ""
                      )}
                    >
                      {React.createElement(c.icon, {
                        className: "h-3.5 w-3.5 shrink-0 opacity-70",
                      })}
                      <span className="flex-1 truncate">{c.label}</span>
                      {renderBadge(c.badge)}
                    </Link>
                  ))}
            </div>
          )}
        </div>
      ) : null;

    return (
      <>
        <div
          ref={triggerRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {trigger}
        </div>
        {mounted && typeof document !== "undefined"
          ? ReactDOM.createPortal(flyout, document.body)
          : null}
      </>
    );
  };
  // ─────────────────────────────────────────────────────────────────────────

  const renderBadge = (b?: LeafItem["badge"]) => {
    if (!b) return null;
    const tone = b.tone ?? "new";
    const className = cn(
      "ms-auto h-5 px-1.5 text-[10px] font-bold uppercase tracking-wide",
      tone === "live" && "bg-red-500/15 text-red-500 border-red-500/30",
      tone === "ai" && "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
      tone === "new" &&
        "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
      tone === "warn" && "bg-amber-500/15 text-amber-500 border-amber-500/30"
    );
    return (
      <Badge
        variant="outline"
        className={className}
      >
        {b.text}
      </Badge>
    );
  };

  const renderLeaf = (item: LeafItem) => {
    const Icon = item.icon;
    const leafAsGroup: GroupItem = item;
    const button = (
      <SidebarMenuButton
        asChild
        isActive={isActive(item.href)}
        tooltip={collapsed ? undefined : item.label}
      >
        <Link
          prefetch={true}
          href={item.href}
          className={cn("flex w-full items-center gap-2", "")}
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1 truncate">{item.label}</span>
          {renderBadge(item.badge)}
        </Link>
      </SidebarMenuButton>
    );
    return (
      <SidebarMenuItem key={item.label}>
        {collapsed ? (
          <CollapsedFlyout item={leafAsGroup}>{button}</CollapsedFlyout>
        ) : (
          button
        )}
      </SidebarMenuItem>
    );
  };

  const renderSubGroup = (subGroup: SubGroupItem, parentLabel: string) => {
    const Icon = subGroup.icon;
    const leafChildren = subGroup.children ?? [];
    const active =
      isActive(subGroup.href) || leafChildren.some((c) => isActive(c.href));
    const currentOpen = getOpenSubGroup(parentLabel);
    const isOpen =
      currentOpen === subGroup.label || (currentOpen === null && active);

    return (
      <Collapsible
        key={subGroup.label}
        open={isOpen}
        onOpenChange={(o) =>
          setOpenSubGroup(parentLabel, o ? subGroup.label : null)
        }
        className="group/subcollapsible"
      >
        <SidebarMenuSubItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuSubButton
              isActive={active}
              className={cn("w-full", "")}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
              <span className="flex-1 truncate">{subGroup.label}</span>
              <ChevronRight
                className={cn(
                  "ms-auto h-3.5 w-3.5 transition-transform duration-200",
                  isRtl
                    ? "rotate-180 group-data-[state=open]/subcollapsible:-rotate-90"
                    : "group-data-[state=open]/subcollapsible:rotate-90"
                )}
              />
            </SidebarMenuSubButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {leafChildren.map((c) => {
                const ChildIcon = c.icon;
                return (
                  <SidebarMenuSubItem key={c.label}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={isActive(c.href)}
                    >
                      <Link
                        prefetch={true}
                        href={c.href}
                        className={cn("flex items-center gap-2", "")}
                      >
                        <ChildIcon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                        <span className="flex-1 truncate">{c.label}</span>
                        {renderBadge(c.badge)}
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuSubItem>
      </Collapsible>
    );
  };

  const renderGroupItem = (item: GroupItem) => {
    // Leaf item — no children and no subGroups
    if (!item.children?.length && !item.subGroups?.length)
      return renderLeaf(item);

    const Icon = item.icon;
    const hasSubGroups = !!item.subGroups?.length;

    const active =
      isActive(item.href) ||
      (item.subGroups?.some(
        (sg) =>
          isActive(sg.href) || (sg.children ?? []).some((c) => isActive(c.href))
      ) ??
        false) ||
      (item.children?.some((c) => isActive(c.href)) ?? false);

    const isOpen = openGroup === item.label || (openGroup === null && active);

    // When collapsed → show rich flyout on hover
    if (collapsed) {
      const iconButton = (
        <SidebarMenuButton
          tooltip={undefined}
          isActive={active}
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1 truncate">{item.label}</span>
        </SidebarMenuButton>
      );
      return (
        <SidebarMenuItem key={item.label}>
          <CollapsedFlyout item={item}>{iconButton}</CollapsedFlyout>
        </SidebarMenuItem>
      );
    }

    return (
      <Collapsible
        key={item.label}
        open={isOpen}
        onOpenChange={(o) => setOpenGroup(o ? item.label : null)}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={item.label}
              isActive={active}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 truncate">{item.label}</span>
              <ChevronRight
                className={cn(
                  "ms-auto h-4 w-4 transition-transform duration-200",
                  isRtl
                    ? "rotate-180 group-data-[state=open]/collapsible:-rotate-90"
                    : "group-data-[state=open]/collapsible:rotate-90"
                )}
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {hasSubGroups
                ? item.subGroups!.map((sg) => renderSubGroup(sg, item.label))
                : (item.children ?? []).map((c) => {
                    const ChildIcon = c.icon;
                    return (
                      <SidebarMenuSubItem key={c.label}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isActive(c.href)}
                        >
                          <Link
                            prefetch={true}
                            href={c.href}
                            className={cn("flex items-center gap-2", "")}
                          >
                            <ChildIcon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                            <span className="flex-1 truncate">{c.label}</span>
                            {renderBadge(c.badge)}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  };

  return (
    <Sidebar
      collapsible="icon"
      side={isRtl ? "right" : "left"}
      data-tour="sidebar"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <SidebarHeader className="h-14 flex-row items-center border-b border-sidebar-border p-0 px-3">
        <Logo
          variant="dark"
          className="h-8 w-auto shrink-0"
        />
        {!collapsed && (
          <span className="text-sm font-semibold text-sidebar-foreground">
            {t("common.appName")}
          </span>
        )}
      </SidebarHeader>

      <SidebarContent>
        {statisticsVisible.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel
              className={cn(
                "text-[11px] font-semibold uppercase tracking-wider text-primary/80",
                isRtl && "text-right"
              )}
            >
              {t("sidebar.statistics")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {statisticsVisible.map(renderGroupItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {monitoringVisible.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel
              className={cn(
                "text-[11px] font-semibold uppercase tracking-wider text-primary/80",
                isRtl && "text-right"
              )}
            >
              {t("sidebar.monitoring")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {monitoringVisible.map(renderGroupItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {aiServicesVisible.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel
              className={cn(
                "text-[11px] font-semibold uppercase tracking-wider text-primary/80",
                isRtl && "text-right"
              )}
            >
              {t("sidebar.aiServices")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {aiServicesVisible.map(renderGroupItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {settingsVisible.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel
              className={cn(
                "text-[11px] font-semibold uppercase tracking-wider text-primary/80",
                isRtl && "text-right"
              )}
            >
              {t("sidebar.settings", "Settings")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{settingsVisible.map(renderGroupItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel
              className={cn(
                "text-[11px] font-semibold uppercase tracking-wider text-primary/80",
                isRtl && "text-right"
              )}
            >
              <ShieldCheck className="me-1 inline h-3 w-3" />
              {t("sidebar.admin")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{admin.map(renderLeaf)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {/* User info row */}
        {!collapsed && (
          <div
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 border-b border-sidebar-border/50",
              ""
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {(user?.name ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-sidebar-foreground">
                {user?.name ?? ""}
              </p>
              <p className="truncate text-[10px] text-sidebar-foreground/50">
                {isAdmin
                  ? t("common.roleAdmin", "Admin")
                  : t("common.roleUser", "User")}
              </p>
            </div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/dashboard/profile"}
              tooltip={t("navigation.profile", "Profile")}
            >
              <Link href="/dashboard/profile">
                <User className="h-4 w-4" />
                <span>{t("navigation.profile", "Profile")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/dashboard/settings"}
              tooltip={t("navigation.settings", "Settings")}
            >
              <Link href="/dashboard/settings">
                <Settings className="h-4 w-4" />
                <span>{t("navigation.settings", "Settings")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              tooltip={t("common.logout")}
              className={cn(
                "text-destructive/80 hover:text-destructive hover:bg-destructive/10",
                ""
              )}
            >
              <LogOut className="h-4 w-4" />
              <span>{t("common.logout")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
