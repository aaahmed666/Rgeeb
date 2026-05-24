"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Plus,
  Loader2,
  Phone,
  MapPin,
  Video,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Upload,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table";
import {
  Branch,
  BranchInput,
  createBranch,
  deleteBranch,
  fetchBranches,
  updateBranch,
} from "@/services/organizationService";

export default function BranchesView() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Branch | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);

  const {
    data: branches = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["org", "branches"],
    queryFn: fetchBranches,
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return branches;
    return branches.filter((b) =>
      [b.name, b.nameAr, b.phone, b.address]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [branches, search]);

  const delMut = useMutation({
    mutationFn: (id: string) => deleteBranch(id),
    onSuccess: () => {
      toast.success(t("branches.deleted", "Branch deleted"));
      qc.invalidateQueries({ queryKey: ["org", "branches"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary ring-1 ring-primary/20">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              {t("branches.title", "Branches")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("branches.subtitle", "Manage your organization's locations")}
            </p>
          </div>
        </div>
        <Button
          className="gap-2 shadow-sm shadow-primary/20"
          data-tour="add-branch"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          {t("branches.new", "Add New Branch")}
        </Button>
      </header>

      <DataTable
        data={filtered}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : "Failed to load"}
        emptyMessage={t("branches.empty", "No branches yet")}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("branches.searchPlaceholder", "Search branches…")}
        actions={
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {t("branches.new", "Add New Branch")}
          </Button>
        }
        columns={[
          {
            key: "name",
            header: t("branches.name", "Branch Name"),
            render: (b) => (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold">{b.name || "—"}</div>
                  {b.nameAr && (
                    <div
                      className="text-xs text-muted-foreground"
                      dir="rtl"
                    >
                      {b.nameAr}
                    </div>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: "phone",
            header: t("branches.phone", "Phone"),
            render: (b) =>
              b.phone ? (
                <span className="inline-flex items-center gap-1 text-sm">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  {b.phone}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
          },
          {
            key: "address",
            header: t("branches.address", "Address"),
            render: (b) =>
              b.address ? (
                <span className="inline-flex items-center gap-1 text-sm">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  {b.address}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />—
                </span>
              ),
          },
          {
            key: "cameras",
            header: t("branches.cameras", "Cameras"),
            render: (b) => (
              <span className="inline-flex items-center gap-1 text-sm font-medium">
                <Video className="h-3 w-3 text-muted-foreground" />
                {b.camerasCount}
              </span>
            ),
          },
          {
            key: "status",
            header: t("branches.status", "Status"),
            render: (b) => (
              <Badge
                className={
                  b.active
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground hover:bg-muted"
                }
              >
                {b.active
                  ? t("common.active", "Active")
                  : t("common.inactive", "Inactive")}
              </Badge>
            ),
          },
          {
            key: "actions",
            header: "",
            headClassName: "w-12",
            render: (b) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing(b);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="me-2 h-4 w-4" />{" "}
                    {t("common.edit", "Edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => setDeleteTarget(b)}
                  >
                    <Trash2 className="me-2 h-4 w-4" />{" "}
                    {t("common.delete", "Delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
      />

      <BranchDrawer
        open={open}
        onOpenChange={setOpen}
        branch={editing}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={t("branches.confirmDeleteTitle", "Delete Branch")}
        description={t(
          "branches.confirmDeleteDesc",
          `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`
        )}
        confirmLabel={t("common.delete", "Delete")}
        cancelLabel={t("common.cancel", "Cancel")}
        onConfirm={() => {
          if (deleteTarget) delMut.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

interface BranchFormState extends BranchInput {
  permit_number?: string;
  permit_activity_type?: string;
  permit_end_date?: string;
  permit_image?: File | null;
}

function BranchDrawer({
  open,
  onOpenChange,
  branch,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  branch: Branch | null;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<BranchFormState>({
    name: "",
    name_ar: "",
    phone: "",
    address: "",
    active: true,
    permit_number: "",
    permit_activity_type: "",
    permit_end_date: "",
    permit_image: null,
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: branch?.name ?? "",
        name_ar: branch?.nameAr ?? "",
        phone: branch?.phone ?? "",
        address: branch?.address ?? "",
        active: branch?.active ?? true,
        permit_number: "",
        permit_activity_type: "",
        permit_end_date: "",
        permit_image: null,
      });
    }
  }, [open, branch]);

  const mut = useMutation({
    mutationFn: () => {
      const payload: BranchInput = {
        name: form.name,
        name_ar: form.name_ar,
        phone: form.phone,
        address: form.address,
        active: form.active,
      };
      return branch ? updateBranch(branch.id, payload) : createBranch(payload);
    },
    onSuccess: () => {
      toast.success(
        branch
          ? t("branches.updated", "Branch updated")
          : t("branches.created", "Branch created")
      );
      qc.invalidateQueries({ queryKey: ["org", "branches"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        side="right"
      >
        {/* Header */}
        <SheetHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                <Building2 className="h-4 w-4" />
              </div>
              <SheetTitle className="text-base font-semibold">
                {branch
                  ? t("branches.edit", "Edit Branch")
                  : t("branches.new", "Add Branch")}
              </SheetTitle>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("branches.name", "Branch Name")}</Label>
              <Input
                placeholder="Enter branch name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("branches.phone", "Phone")}</Label>
              <Input
                placeholder="Enter phone number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("branches.address", "Address")}</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px] resize-none"
                placeholder="Enter branch address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Label className="cursor-pointer">
                  {t("common.active", "Active")}
                </Label>
              </div>
              <Switch
                checked={!!form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </div>
          </div>

          <Separator />

          {/* Municipality Permit */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">
                  {t("branches.municipalityPermit", "Municipality Permit")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "branches.permitOptional",
                    "Optional permit details and activity type"
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("branches.permitNumber", "Permit Number")}</Label>
              <Input
                placeholder="Enter municipality permit number"
                value={form.permit_number}
                onChange={(e) =>
                  setForm({ ...form, permit_number: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("branches.activityType", "Activity Type")}</Label>
              <Input
                placeholder="Enter type of activity"
                value={form.permit_activity_type}
                onChange={(e) =>
                  setForm({ ...form, permit_activity_type: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("branches.permitEndDate", "Permit End Date")}</Label>
              <Input
                type="date"
                value={form.permit_end_date}
                onChange={(e) =>
                  setForm({ ...form, permit_end_date: e.target.value })
                }
              />
            </div>

            {/* Permit image upload */}
            <div className="space-y-1.5">
              <Label>{t("branches.permitImage", "Permit Image")}</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  setForm({
                    ...form,
                    permit_image: e.target.files?.[0] ?? null,
                  })
                }
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 p-4 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
              >
                <Upload className="h-4 w-4" />
                {form.permit_image
                  ? form.permit_image.name
                  : t("branches.uploadPermitImage", "Upload Permit Image")}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            className="flex-1 gap-2"
            disabled={!form.name || mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {branch
              ? t("common.save", "Save Changes")
              : t("branches.submit", "Add Branch")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
