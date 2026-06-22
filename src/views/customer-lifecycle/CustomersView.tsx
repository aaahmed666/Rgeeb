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
  Active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  Onboarding: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  Warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  Suspended: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800",
  Churned: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("text-[10px] font-semibold uppercase", STATUS_STYLES[status])}>
      <span className="me-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {status}
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
          <Icon className="h-5 w-5 text-white" />
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
        header: "Customer Name",
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
        header: "Business Type",
        render: (row) => (
          <span className="text-sm text-foreground">{row.businessType}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "branches",
        header: "Branches",
        render: (row) => (
          <span className="text-sm font-medium text-foreground">{row.branches}</span>
        ),
        headClassName: "text-center",
        cellClassName: "text-center",
      },
      {
        key: "cameras",
        header: "Cameras",
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
        header: "AI Services",
        render: (row) => (
          <span className="text-sm font-medium text-foreground">{row.aiServices}</span>
        ),
        headClassName: "text-center",
        cellClassName: "text-center",
      },
      {
        key: "package",
        header: "Package",
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
        header: "End Date",
        render: (row) => (
          <span className="text-sm text-muted-foreground">{row.endDate}</span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        render: (row) => (
          <div className="flex items-center gap-1.5 justify-center">
            <Link href={`/dashboard/customer-lifecycle/customers/${row.id}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" title="View 360° Profile">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer text-blue-500"
              onClick={() => handleOpenEdit(row)}
              title="Edit Customer"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer text-destructive"
              onClick={() => handleOpenDelete(row)}
              title="Delete Customer"
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
            Customer Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage all registered enterprise customers
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="gap-1.5 cursor-pointer">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Customers"
          value={statsQ.data?.totalCustomers ?? 0}
          icon={Users}
          bgColor="bg-slate-800 dark:bg-slate-700"
          isLoading={statsQ.isLoading}
        />
        <StatCard
          title="Total Cameras"
          value={statsQ.data?.totalCameras ?? 0}
          icon={Camera}
          bgColor="bg-purple-500"
          isLoading={statsQ.isLoading}
        />
        <StatCard
          title="Active AI Services"
          value={statsQ.data?.activeAiServices ?? 0}
          icon={Cpu}
          bgColor="bg-cyan-500"
          isLoading={statsQ.isLoading}
        />
        <StatCard
          title="Avg Risk Score"
          value="Low"
          icon={AlertTriangle}
          bgColor="bg-emerald-500"
          isLoading={statsQ.isLoading}
        />
      </div>

      {/* ── Filters ── */}
      <Tabs value={businessType} onValueChange={(val) => { setBusinessType(val); setPage(1); }}>
        <TabsList className="h-auto flex-wrap">
          {BUSINESS_TYPES.map((t) => (
            <TabsTrigger key={t} value={t} className="text-xs">
              {t}
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
        errorMessage="Failed to load customers"
        emptyMessage="No customers found"
        emptyDescription="Try adjusting your search or filters to find what you're looking for."
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search customers by name or ID…"
        onRefresh={() => customersQ.refetch()}
        title="All Customers"
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
              <DialogTitle>Add Enterprise Customer</DialogTitle>
              <DialogDescription>Create a new customer profile. New credentials will be auto-generated.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-name" className="text-right">Name</Label>
                <Input id="create-name" value={formName} onChange={(e) => setFormName(e.target.value)} required className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Industry</Label>
                <div className="col-span-3">
                  <Select value={formBusinessType} onValueChange={setFormBusinessType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Business Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.filter(t => t !== "All").map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status</Label>
                <div className="col-span-3">
                  <Select value={formStatus} onValueChange={(val) => setFormStatus(val as Customer["status"])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Onboarding">Onboarding</SelectItem>
                      <SelectItem value="Warning">Warning</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-branches" className="text-right">Branches</Label>
                <Input id="create-branches" type="number" min={1} value={formBranches} onChange={(e) => setFormBranches(Number(e.target.value))} required className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-cameras" className="text-right">Cameras</Label>
                <Input id="create-cameras" type="number" min={1} value={formCameras} onChange={(e) => setFormCameras(Number(e.target.value))} required className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-ai" className="text-right">AI Services</Label>
                <Input id="create-ai" type="number" min={0} value={formAiServices} onChange={(e) => setFormAiServices(Number(e.target.value))} required className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-package" className="text-right">Package</Label>
                <Input id="create-package" value={formPackage} onChange={(e) => setFormPackage(e.target.value)} required className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-end" className="text-right">End Date</Label>
                <Input id="create-end" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} required className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Customer
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
              <DialogTitle>Edit Enterprise Customer</DialogTitle>
              <DialogDescription>Update the details for this enterprise customer profile.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Name</Label>
                <Input id="edit-name" value={formName} onChange={(e) => setFormName(e.target.value)} required className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Industry</Label>
                <div className="col-span-3">
                  <Select value={formBusinessType} onValueChange={setFormBusinessType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Business Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.filter(t => t !== "All").map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status</Label>
                <div className="col-span-3">
                  <Select value={formStatus} onValueChange={(val) => setFormStatus(val as Customer["status"])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Onboarding">Onboarding</SelectItem>
                      <SelectItem value="Warning">Warning</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-branches" className="text-right">Branches</Label>
                <Input id="edit-branches" type="number" min={1} value={formBranches} onChange={(e) => setFormBranches(Number(e.target.value))} required className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-cameras" className="text-right">Cameras</Label>
                <Input id="edit-cameras" type="number" min={1} value={formCameras} onChange={(e) => setFormCameras(Number(e.target.value))} required className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-ai" className="text-right">AI Services</Label>
                <Input id="edit-ai" type="number" min={0} value={formAiServices} onChange={(e) => setFormAiServices(Number(e.target.value))} required className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-package" className="text-right">Package</Label>
                <Input id="edit-package" value={formPackage} onChange={(e) => setFormPackage(e.target.value)} required className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-end" className="text-right">End Date</Label>
                <Input id="edit-end" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} required className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
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
              Delete Customer Profile
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedCustomer?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedCustomer) deleteMutation.mutate(selectedCustomer.id);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
