"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Camera,
  Cpu,
  AlertTriangle,
  Eye,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SharedTablePaginated } from "@/components/SharedTablePaginated";
import { type DataTableColumn } from "@/components/ui/data-table";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  fetchCustomerList,
  fetchDashboardStats,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/services/customerLifecycleMockService";
import type { Customer, DashboardStats } from "@/services/customerLifecycleMockService";

/* ── Status Badge ───────────────────────────────────────────────────────── */

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-[var(--status-success)]/10 text-[var(--status-success)] border-[var(--status-success)]",
  Onboarding: "bg-[var(--status-info)]/10 text-[var(--status-info)] border-[var(--status-info)]",
  Warning: "bg-[var(--status-warning)]/10 text-[var(--status-warning)] border-[var(--status-warning)]",
  Suspended: "bg-muted/10 text-muted-foreground dark:text-muted-foreground border-border dark:border-border",
  Churned: "bg-[var(--status-danger)]/10 text-[var(--status-danger)] border-[var(--status-danger)]",
};

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <Badge variant="outline" className={cn("text-[10px] font-semibold uppercase", STATUS_STYLES[status])}>
      <span className="me-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {t("customerLifecycle.status." + status.toLowerCase(), status)}
    </Badge>
  );
}

/* ── Stat Card ──────────────────────────────────────────────────────────── */

function StatCard({
  title,
  value,
  icon: Icon,
  bgColor,
  isLoading,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  bgColor: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", bgColor)}>
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-semibold">
            {title}
          </p>
          <p className="text-xl font-bold text-foreground">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Main CustomersView ─────────────────────────────────────────────────── */

export default function CustomersView() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [businessType, setBusinessType] = useState("All");

  const [page, setPage] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formBusinessType, setFormBusinessType] = useState("Retail");
  const [formStatus, setFormStatus] = useState<Customer["status"]>("Active");
  const [formBranches, setFormBranches] = useState(1);
  const [formCameras, setFormCameras] = useState(10);
  const [formAiServices, setFormAiServices] = useState(1);
  const [formPackage, setFormPackage] = useState("Standard Tier");
  const [formEndDate, setFormEndDate] = useState("Dec 31, 2026");

  const {
    searchValue,
    debouncedValue,
    handleSearchChange,
  } = useDebounceSearch("", 300);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedValue]);

  const statsQ = useQuery<DashboardStats>({
    queryKey: ["cl-dashboard-stats"],
    queryFn: fetchDashboardStats,
    staleTime: 30_000,
  });

  const customersQ = useQuery({
    queryKey: ["cl-customers", debouncedValue, businessType, page],
    queryFn: () =>
      fetchCustomerList({
        search: debouncedValue,
        businessType,
        page,
        perPage: 10,
      }),
    staleTime: 15_000,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cl-customers"] });
      queryClient.invalidateQueries({ queryKey: ["cl-dashboard-stats"] });
      setIsCreateOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Customer> }) => updateCustomer(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cl-customers"] });
      queryClient.invalidateQueries({ queryKey: ["cl-dashboard-stats"] });
      setIsEditOpen(false);
      setSelectedCustomer(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cl-customers"] });
      queryClient.invalidateQueries({ queryKey: ["cl-dashboard-stats"] });
      setIsDeleteOpen(false);
      setSelectedCustomer(null);
    },
  });

  const resetForm = () => {
    setFormName("");
    setFormBusinessType("Retail");
    setFormStatus("Active");
    setFormBranches(1);
    setFormCameras(10);
    setFormAiServices(1);
    setFormPackage("Standard Tier");
    setFormEndDate("Dec 31, 2026");
  };

  const handleOpenEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormName(customer.name);
    setFormBusinessType(customer.businessType);
    setFormStatus(customer.status);
    setFormBranches(customer.branches);
    setFormCameras(customer.cameras);
    setFormAiServices(customer.aiServices);
    setFormPackage(customer.package);
    setFormEndDate(customer.endDate);
    setIsEditOpen(true);
  };

  const handleOpenDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formName,
      businessType: formBusinessType,
      status: formStatus,
      branches: Number(formBranches),
      cameras: Number(formCameras),
      aiServices: Number(formAiServices),
      package: formPackage,
      endDate: formEndDate,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    updateMutation.mutate({
      id: selectedCustomer.id,
      updates: {
        name: formName,
        businessType: formBusinessType,
        status: formStatus,
        branches: Number(formBranches),
        cameras: Number(formCameras),
        aiServices: Number(formAiServices),
        package: formPackage,
        endDate: formEndDate,
      },
    });
  };

  const columns: DataTableColumn<Customer>[] = useMemo(
    () => [
      {
        key: "name",
        header: t("customerLifecycle.cust.customerName", "Customer Name"),
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {row.initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {row.name}
              </p>
              <p className="text-xs text-muted-foreground">{row.customerId}</p>
            </div>
          </div>
        ),
      },
      {
        key: "businessType",
        header: t("customerLifecycle.cust.businessType", "Business Type"),
        render: (row) => (
          <span className="text-sm text-foreground">{row.businessType}</span>
        ),
      },
      {
        key: "status",
        header: t("customerLifecycle.common.status", "Status"),
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "branches",
        header: t("customerLifecycle.cust.branches", "Branches"),
        render: (row) => (
          <span className="text-sm font-medium text-foreground">{row.branches}</span>
        ),
        headClassName: "text-center",
        cellClassName: "text-center",
      },
      {
        key: "cameras",
        header: t("customerLifecycle.cust.cameras", "Cameras"),
        render: (row) => (
          <span className="text-sm font-medium text-foreground">
            {row.cameras.toLocaleString()}
          </span>
        ),
        headClassName: "text-center",
        cellClassName: "text-center",
      },
      {
        key: "aiServices",
        header: t("customerLifecycle.cust.aiServices", "AI Services"),
        render: (row) => (
          <span className="text-sm font-medium text-foreground">{row.aiServices}</span>
        ),
        headClassName: "text-center",
        cellClassName: "text-center",
      },
      {
        key: "package",
        header: t("customerLifecycle.cust.package", "Package"),
        render: (row) => (
          <Badge
            variant="outline"
            className="text-[10px] font-semibold uppercase tracking-wide"
          >
            {row.package}
          </Badge>
        ),
      },
      {
        key: "endDate",
        header: t("customerLifecycle.cust.endDate", "End Date"),
        render: (row) => (
          <span className="text-sm text-muted-foreground">{row.endDate}</span>
        ),
      },
      {
        key: "actions",
        header: t("customerLifecycle.cust.actions", "Actions"),
        render: (row) => (
          <div className="flex items-center gap-1.5 justify-center">
            <Link href={`/dashboard/customer-lifecycle/customers/${row.id}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" title={t("customerLifecycle.cust.view360", "View 360° Profile")}>
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer text-[var(--status-info)]"
              onClick={() => handleOpenEdit(row)}
              title={t("customerLifecycle.cust.editCustomer", "Edit Customer")}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer text-destructive"
              onClick={() => handleOpenDelete(row)}
              title={t("customerLifecycle.cust.deleteCustomer", "Delete Customer")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
        headClassName: "text-center",
        cellClassName: "text-center",
      },
    ],
    []
  );

  const BUSINESS_TYPES = ["All", "Retail", "Logistics", "Security", "Healthcare", "Manufacturing", "Technology"];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* ── Page Header ── */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("customerLifecycle.cust.title", "Customer Management")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("customerLifecycle.cust.subtitle", "View and manage all registered enterprise customers")}
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="gap-1.5 cursor-pointer">
          <Plus className="h-4 w-4" />
          {t("customerLifecycle.cust.addCustomer", "Add Customer")}
        </Button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("customerLifecycle.cust.totalCustomers", "Total Customers")}
          value={statsQ.data?.totalCustomers ?? 0}
          icon={Users}
          bgColor="bg-muted dark:bg-muted"
          isLoading={statsQ.isLoading}
        />
        <StatCard
          title={t("customerLifecycle.cust.totalCameras", "Total Cameras")}
          value={statsQ.data?.totalCameras ?? 0}
          icon={Camera}
          bgColor="bg-[var(--chart-5)]"
          isLoading={statsQ.isLoading}
        />
        <StatCard
          title={t("customerLifecycle.cust.activeAiServices", "Active AI Services")}
          value={statsQ.data?.activeAiServices ?? 0}
          icon={Cpu}
          bgColor="bg-[var(--status-info)]"
          isLoading={statsQ.isLoading}
        />
        <StatCard
          title={t("customerLifecycle.cust.avgRisk", "Avg Risk Score")}
          value={t("customerLifecycle.cust.riskLow", "Low")}
          icon={AlertTriangle}
          bgColor="bg-[var(--status-success)]"
          isLoading={statsQ.isLoading}
        />
      </div>

      {/* ── Filters ── */}
      <Tabs value={businessType} onValueChange={(val) => { setBusinessType(val); setPage(1); }}>
        <TabsList className="h-auto flex-wrap">
          {BUSINESS_TYPES.map((bt) => (
            <TabsTrigger key={bt} value={bt} className="text-xs">
              {bt === "All" ? t("customerLifecycle.cust.allTypes", "All") : t("customerLifecycle.bizType." + bt.toLowerCase(), bt)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* ── Data Table ── */}
      <SharedTablePaginated
        columns={columns}
        data={customersQ.data?.data ?? []}
        isLoading={customersQ.isLoading}
        isError={customersQ.isError}
        errorMessage={t("customerLifecycle.cust.errLoad", "Failed to load customers")}
        emptyMessage={t("customerLifecycle.cust.empty", "No customers found")}
        emptyDescription={t("customerLifecycle.cust.emptyDesc", "Try adjusting your search or filters to find what you're looking for.")}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t("customerLifecycle.cust.searchPlaceholder", "Search customers by name or ID…")}
        onRefresh={() => customersQ.refetch()}
        title={t("customerLifecycle.cust.allCustomers", "All Customers")}
        currentPage={page}
        totalPages={customersQ.data?.totalPages ?? 1}
        onPageChange={setPage}
        totalItems={customersQ.data?.total ?? 0}
      />

      {/* ── CREATE DIALOG ── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>{t("customerLifecycle.cust.addDialogTitle", "Add Enterprise Customer")}</DialogTitle>
              <DialogDescription>{t("customerLifecycle.cust.addDialogDesc", "Create a new customer profile. New credentials will be auto-generated.")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-name" className="text-end">{t("customerLifecycle.cust.fName", "Name")}</Label>
                <Input id="create-name" value={formName} onChange={(e) => setFormName(e.target.value)} required className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-end">{t("customerLifecycle.cust.fIndustry", "Industry")}</Label>
                <div className="col-span-3">
                  <Select value={formBusinessType} onValueChange={setFormBusinessType}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("customerLifecycle.cust.selectBizType", "Select Business Type")} />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.filter((bt) => bt !== "All").map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-end">{t("customerLifecycle.common.status", "Status")}</Label>
                <div className="col-span-3">
                  <Select value={formStatus} onValueChange={(val) => setFormStatus(val as Customer["status"])}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("customerLifecycle.cust.selectStatus", "Select Status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">{t("customerLifecycle.status.active", "Active")}</SelectItem>
                      <SelectItem value="Onboarding">{t("customerLifecycle.status.onboarding", "Onboarding")}</SelectItem>
                      <SelectItem value="Warning">{t("customerLifecycle.status.warning", "Warning")}</SelectItem>
                      <SelectItem value="Suspended">{t("customerLifecycle.status.suspended", "Suspended")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-branches" className="text-end">{t("customerLifecycle.cust.branches", "Branches")}</Label>
                <Input id="create-branches" type="number" min={1} value={formBranches} onChange={(e) => setFormBranches(Number(e.target.value))} required className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-cameras" className="text-end">{t("customerLifecycle.cust.cameras", "Cameras")}</Label>
                <Input id="create-cameras" type="number" min={1} value={formCameras} onChange={(e) => setFormCameras(Number(e.target.value))} required className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-ai" className="text-end">{t("customerLifecycle.cust.aiServices", "AI Services")}</Label>
                <Input id="create-ai" type="number" min={0} value={formAiServices} onChange={(e) => setFormAiServices(Number(e.target.value))} required className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-package" className="text-end">{t("customerLifecycle.cust.package", "Package")}</Label>
                <Input id="create-package" value={formPackage} onChange={(e) => setFormPackage(e.target.value)} required className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-end" className="text-end">{t("customerLifecycle.cust.endDate", "End Date")}</Label>
                <Input id="create-end" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} required className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>{t("customerLifecycle.common.cancel", "Cancel")}</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("customerLifecycle.cust.addCustomer", "Add Customer")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── EDIT DIALOG ── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>{t("customerLifecycle.cust.editDialogTitle", "Edit Enterprise Customer")}</DialogTitle>
              <DialogDescription>{t("customerLifecycle.cust.editDialogDesc", "Update the details for this enterprise customer profile.")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-end">{t("customerLifecycle.cust.fName", "Name")}</Label>
                <Input id="edit-name" value={formName} onChange={(e) => setFormName(e.target.value)} required className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-end">{t("customerLifecycle.cust.fIndustry", "Industry")}</Label>
                <div className="col-span-3">
                  <Select value={formBusinessType} onValueChange={setFormBusinessType}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("customerLifecycle.cust.selectBizType", "Select Business Type")} />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.filter((bt) => bt !== "All").map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-end">{t("customerLifecycle.common.status", "Status")}</Label>
                <div className="col-span-3">
                  <Select value={formStatus} onValueChange={(val) => setFormStatus(val as Customer["status"])}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("customerLifecycle.cust.selectStatus", "Select Status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">{t("customerLifecycle.status.active", "Active")}</SelectItem>
                      <SelectItem value="Onboarding">{t("customerLifecycle.status.onboarding", "Onboarding")}</SelectItem>
                      <SelectItem value="Warning">{t("customerLifecycle.status.warning", "Warning")}</SelectItem>
                      <SelectItem value="Suspended">{t("customerLifecycle.status.suspended", "Suspended")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-branches" className="text-end">{t("customerLifecycle.cust.branches", "Branches")}</Label>
                <Input id="edit-branches" type="number" min={1} value={formBranches} onChange={(e) => setFormBranches(Number(e.target.value))} required className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-cameras" className="text-end">{t("customerLifecycle.cust.cameras", "Cameras")}</Label>
                <Input id="edit-cameras" type="number" min={1} value={formCameras} onChange={(e) => setFormCameras(Number(e.target.value))} required className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-ai" className="text-end">{t("customerLifecycle.cust.aiServices", "AI Services")}</Label>
                <Input id="edit-ai" type="number" min={0} value={formAiServices} onChange={(e) => setFormAiServices(Number(e.target.value))} required className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-package" className="text-end">{t("customerLifecycle.cust.package", "Package")}</Label>
                <Input id="edit-package" value={formPackage} onChange={(e) => setFormPackage(e.target.value)} required className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-end" className="text-end">{t("customerLifecycle.cust.endDate", "End Date")}</Label>
                <Input id="edit-end" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} required className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>{t("customerLifecycle.common.cancel", "Cancel")}</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("customerLifecycle.common.saveChanges", "Save Changes")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DELETE DIALOG ── */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {t("customerLifecycle.cust.deleteDialogTitle", "Delete Customer Profile")}
            </DialogTitle>
            <DialogDescription>
              {t("customerLifecycle.cust.deleteConfirm1", "Are you sure you want to delete")} <strong>{selectedCustomer?.name}</strong>? {t("customerLifecycle.cust.deleteConfirm2", "This action cannot be undone.")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>{t("customerLifecycle.common.cancel", "Cancel")}</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedCustomer) deleteMutation.mutate(selectedCustomer.id);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("customerLifecycle.cust.yesDelete", "Yes, Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
