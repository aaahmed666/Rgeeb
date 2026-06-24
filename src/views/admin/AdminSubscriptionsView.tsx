"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import {
  ShieldAlert,
  CreditCard,
  CheckCircle2,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import { AdminPageHeader, StatusPill } from "@/components/admin/AdminPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import {
  fetchAdminSubscriptions,
  fetchAdminActiveSubscriptions,
  fetchAdminClients,
  fetchAdminPackages,
  createAdminSubscription,
  updateAdminSubscription,
  deleteAdminSubscription,
  type AdminSubscription,
  type AdminSubscriptionInput,
} from "@/services/adminService";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";

function formatDate(d?: string) {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? d : date.toLocaleDateString();
}

/** ISO / date string → YYYY-MM-DD for <input type="date">. */
function toDateInput(d?: string) {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

const PAYMENT_STATUSES = ["paid", "pending", "unpaid", "failed", "refunded"];
const SUB_TYPES = ["new", "renewal", "upgrade", "trial"];

const EMPTY_FORM = {
  client_id: "",
  package_id: "",
  type: "new",
  payment_status: "paid",
  amount: "",
  start_date: "",
  end_date: "",
};

export default function AdminSubscriptionsView() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const qc = useQueryClient();

  const allQ = useQuery({ queryKey: ["admin", "subscriptions"], queryFn: fetchAdminSubscriptions });
  const activeQ = useQuery({ queryKey: ["admin", "subscriptions-active"], queryFn: fetchAdminActiveSubscriptions });
  // Lookups for the form selects (only fetched once the dialog is opened).
  const [dialogOpen, setDialogOpen] = useState(false);
  const clientsQ = useQuery({ queryKey: ["admin", "clients"], queryFn: fetchAdminClients, enabled: dialogOpen });
  const packagesQ = useQuery({ queryKey: ["admin", "packages"], queryFn: fetchAdminPackages, enabled: dialogOpen });

  const [editing, setEditing] = useState<AdminSubscription | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [toDelete, setToDelete] = useState<AdminSubscription | null>(null);

  const { searchValue: search, debouncedValue: debouncedSearch, handleSearchChange } =
    useDebounceSearch("", 300);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
    qc.invalidateQueries({ queryKey: ["admin", "subscriptions-active"] });
  };

  const createMut = useMutation({
    mutationFn: (v: AdminSubscriptionInput) => createAdminSubscription(v),
    onSuccess: () => { toast.success(t("admin.subscriptions.created", "Subscription created")); invalidate(); setDialogOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, v }: { id: string; v: Partial<AdminSubscriptionInput> }) => updateAdminSubscription(id, v),
    onSuccess: () => { toast.success(t("admin.subscriptions.updated", "Subscription updated")); invalidate(); setDialogOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAdminSubscription(id),
    onSuccess: () => { toast.success(t("admin.subscriptions.deleted", "Subscription deleted")); invalidate(); setToDelete(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };
  const openEdit = (s: AdminSubscription) => {
    setEditing(s);
    setForm({
      client_id: s.clientId ?? "",
      package_id: s.packageId ?? "",
      type: s.type ?? "new",
      payment_status: s.paymentStatus ?? "paid",
      amount: s.price != null ? String(s.price) : "",
      start_date: toDateInput(s.startDate),
      end_date: toDateInput(s.endDate),
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.client_id) { toast.error(t("admin.subscriptions.clientRequired", "Client is required")); return; }
    if (!form.package_id) { toast.error(t("admin.subscriptions.packageRequired", "Package is required")); return; }
    if (!form.start_date || !form.end_date) { toast.error(t("admin.subscriptions.datesRequired", "Start and end dates are required")); return; }
    const payload: AdminSubscriptionInput = {
      client_id: form.client_id,
      package_id: form.package_id,
      type: form.type,
      payment_status: form.payment_status,
      amount: form.amount === "" ? 0 : Number(form.amount),
      start_date: form.start_date,
      end_date: form.end_date,
    };
    if (editing) updateMut.mutate({ id: editing.id, v: payload });
    else createMut.mutate(payload);
  };

  // When a package is picked, default the amount to its price (only if empty).
  const onPackageChange = (pkgId: string) => {
    const pkg = packagesQ.data?.find((p) => p.id === pkgId);
    setForm((f) => ({
      ...f,
      package_id: pkgId,
      amount: f.amount === "" && pkg?.price != null ? String(pkg.price) : f.amount,
    }));
  };

  const busy = createMut.isPending || updateMut.isPending;

  const dataColumns = useMemo(
    () => [
      { key: "userName", header: t("admin.subscriptions.client"), render: (s: AdminSubscription) => <span className="font-medium">{s.userName ?? "—"}</span> },
      { key: "userEmail", header: t("admin.subscriptions.user"), render: (s: AdminSubscription) => <span className="text-sm text-muted-foreground">{s.userEmail ?? "—"}</span> },
      { key: "package", header: t("admin.subscriptions.package"), render: (s: AdminSubscription) => <Badge variant="secondary">{s.package ?? "—"}</Badge> },
      { key: "price", header: t("admin.subscriptions.amount"), render: (s: AdminSubscription) => <span>{s.price != null ? `$${s.price}` : "—"}</span> },
      { key: "status", header: t("admin.subscriptions.status"), render: (s: AdminSubscription) => <StatusPill status={s.status} /> },
      { key: "startDate", header: t("admin.subscriptions.startDate"), render: (s: AdminSubscription) => <span className="text-sm">{formatDate(s.startDate)}</span> },
      { key: "endDate", header: t("admin.subscriptions.endDate"), render: (s: AdminSubscription) => <span className="text-sm">{formatDate(s.endDate)}</span> },
      {
        key: "daysRemaining",
        header: t("admin.sub_daysLeft"),
        render: (s: AdminSubscription) =>
          s.daysRemaining != null
            ? <span className={s.daysRemaining < 30 ? "text-destructive font-semibold" : ""}>{s.daysRemaining}d</span>
            : <span>—</span>,
      },
      {
        key: "actions",
        header: "",
        render: (s: AdminSubscription) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(s)}>
                <Pencil className="me-2 h-4 w-4" /> {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => setToDelete(s)}>
                <Trash2 className="me-2 h-4 w-4" /> {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t]
  );

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-lg font-semibold">{t("errors.unauthorized", "Access Denied")}</p>
        </div>
      </div>
    );
  }

  const filteredAll = (allQ.data ?? []).filter((s) =>
    !debouncedSearch.trim() || [s.userName, s.userEmail, s.package].filter(Boolean).join(" ").toLowerCase().includes(debouncedSearch.trim().toLowerCase())
  );
  const filteredActive = (activeQ.data ?? []).filter((s) =>
    !debouncedSearch.trim() || [s.userName, s.userEmail, s.package].filter(Boolean).join(" ").toLowerCase().includes(debouncedSearch.trim().toLowerCase())
  );

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        titleKey="admin.subscriptions"
        Icon={CreditCard}
        onRefresh={() => { allQ.refetch(); activeQ.refetch(); }}
        isRefreshing={allQ.isFetching || activeQ.isFetching}
        right={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> {t("admin.subscriptions.addSubscription", "Add Subscription")}
          </Button>
        }
      />

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            {t("admin.sub_allTab")}
            {allQ.data && <Badge variant="secondary" className="ml-2">{allQ.data.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="active">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-green-500" />
            {t("admin.sub_activeTab")}
            {activeQ.data && <Badge variant="secondary" className="ml-2">{activeQ.data.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <DataTable
            data={filteredAll as unknown as (Record<string, unknown> & { id: string | number })[]}
            searchValue={search}
            onSearchChange={handleSearchChange}
            searchPlaceholder={t("admin.subscriptions.searchPlaceholder", "Search subscriptions…")}
            isLoading={allQ.isLoading}
            isError={allQ.isError}
            errorMessage={allQ.error instanceof Error ? allQ.error.message : t("admin.common.loadingFailed")}
            emptyMessage={t("admin.subscriptions_empty")}
            columns={dataColumns as never}
          />
        </TabsContent>

        <TabsContent value="active">
          <DataTable
            data={filteredActive as unknown as (Record<string, unknown> & { id: string | number })[]}
            isLoading={activeQ.isLoading}
            isError={activeQ.isError}
            errorMessage={activeQ.error instanceof Error ? activeQ.error.message : t("admin.common.loadingFailed")}
            emptyMessage={t("admin.subscriptions.activeSubscriptions")}
            columns={dataColumns as never}
          />
        </TabsContent>
      </Tabs>

      {/* ── Add / Edit subscription ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? t("admin.subscriptions.editSubscription", "Edit Subscription")
                : t("admin.subscriptions.addSubscription", "Add Subscription")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("admin.subscriptions.client", "Client")} *</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={clientsQ.isLoading ? t("common.loading", "Loading…") : t("admin.subscriptions.selectClient", "Select client")} />
                </SelectTrigger>
                <SelectContent>
                  {(clientsQ.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nameEn || c.name || c.email || c.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("admin.subscriptions.package", "Package")} *</Label>
              <Select value={form.package_id} onValueChange={onPackageChange}>
                <SelectTrigger>
                  <SelectValue placeholder={packagesQ.isLoading ? t("common.loading", "Loading…") : t("admin.subscriptions.selectPackage", "Select package")} />
                </SelectTrigger>
                <SelectContent>
                  {(packagesQ.data ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nameEn || p.nameAr || p.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("admin.subscriptions.type", "Type")}</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUB_TYPES.map((ty) => (
                      <SelectItem key={ty} value={ty}>{t(`admin.subscriptions.type_${ty}`, ty)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("admin.subscriptions.paymentStatus", "Payment status")}</Label>
                <Select value={form.payment_status} onValueChange={(v) => setForm((f) => ({ ...f, payment_status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((ps) => (
                      <SelectItem key={ps} value={ps}>{t(`admin.subscriptions.pay_${ps}`, ps)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("admin.subscriptions.amount", "Amount")}</Label>
              <Input
                type="number"
                min={0}
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("admin.subscriptions.startDate", "Start date")} *</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("admin.subscriptions.endDate", "End date")} *</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSave} disabled={busy}>
              {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {editing ? t("common.save") : t("admin.form_add", "Add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={t("admin.subscriptions.deleteSubscription", "Delete subscription")}
        description={`${t("admin.common.confirmDelete")} "${toDelete?.userName ?? toDelete?.package ?? ""}"?`}
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        isLoading={deleteMut.isPending}
      />
    </div>
  );
}
