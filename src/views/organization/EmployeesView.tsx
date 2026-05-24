"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Plus,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  Upload,
  Clock,
  User,
  Building2,
  IdCard,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { DataTable } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";
import {
  Employee,
  EmployeeInput,
  createEmployee,
  deleteEmployee,
  fetchEmployees,
  updateEmployee,
  fetchBranches,
  fetchDepartments,
} from "@/services/organizationService";
import { fetchRoles } from "@/services/rolesService";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
type DaySchedule = { dayOff: boolean; startTime: string; endTime: string };
type WorkingHours = Record<(typeof DAYS)[number], DaySchedule>;

function defaultWorkingHours(): WorkingHours {
  return DAYS.reduce((acc, day) => {
    acc[day] = {
      dayOff: day === "Friday" || day === "Saturday",
      startTime: "09:00",
      endTime: "17:00",
    };
    return acc;
  }, {} as WorkingHours);
}

interface ExtendedEmployeeInput extends EmployeeInput {
  name_ar?: string;
  national_id?: string;
  employee_code?: string;
  is_main_admin?: boolean;
  certificate_number?: string;
  certificate_end_date?: string;
  certificate_image?: File | null;
  working_hours?: WorkingHours;
  photo?: File | null;
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "slate" | "emerald" | "rose";
}) {
  const tones = {
    slate:
      "bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  } as const;
  const bg = {
    slate: "bg-slate-50 dark:bg-slate-900/30",
    emerald: "bg-emerald-50 dark:bg-emerald-950/20",
    rose: "bg-rose-50 dark:bg-rose-950/20",
  } as const;
  return (
    <Card className={bg[tone]}>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          {icon}
        </div>
        <div>
          <div className="text-3xl font-bold leading-none">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EmployeesView() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  const {
    data: employees = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["org", "employees"],
    queryFn: fetchEmployees,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      [e.name, e.email, e.phone, e.branchName, e.departmentName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [employees, search]);

  const total = employees.length;
  const active = employees.filter((e) => e.active).length;
  const inactive = total - active;

  const delMut = useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => {
      toast.success(t("employees.deleted", "Employee deleted"));
      qc.invalidateQueries({ queryKey: ["org", "employees"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-700 to-orange-500 p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              {t("employees.title", "Employees")}
            </h1>
            <p className="text-sm text-white/80">
              {t(
                "employees.subtitle",
                "Manage your team members and their access"
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label={t("employees.totalEmployees", "Total Employees")}
          value={total}
          tone="slate"
        />
        <StatCard
          icon={<UserCheck className="h-5 w-5" />}
          label={t("common.active", "Active")}
          value={active}
          tone="emerald"
        />
        <StatCard
          icon={<UserX className="h-5 w-5" />}
          label={t("common.inactive", "Inactive")}
          value={inactive}
          tone="rose"
        />
      </div>

      <DataTable
        title={t("employees.directory", "Employee Directory")}
        data={filtered}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : "Failed to load"}
        emptyMessage={t("employees.empty", "No employees found")}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t(
          "employees.searchPlaceholder",
          "Search employees..."
        )}
        actions={
          <Button
            size="sm"
            data-tour="add-employee"
            className="gap-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:opacity-95"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />{" "}
            {t("employees.new", "Add New Employee")}
          </Button>
        }
        columns={[
          {
            key: "user",
            header: t("employees.user", "User"),
            render: (e) => (
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  {e.avatar && (
                    <AvatarImage
                      src={e.avatar}
                      alt={e.name}
                    />
                  )}
                  <AvatarFallback>{(e.name || "?").charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="truncate font-medium">{e.name || "—"}</div>
                  {e.email && (
                    <div className="truncate text-xs text-muted-foreground">
                      {e.email}
                    </div>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: "department",
            header: t("employees.department", "Department"),
            render: (e) =>
              e.departmentName ? (
                <div>
                  <div className="text-sm">{e.departmentName}</div>
                  {e.departmentNameAr && (
                    <div
                      className="text-xs text-muted-foreground"
                      dir="rtl"
                    >
                      {e.departmentNameAr}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
          },
          {
            key: "branch",
            header: t("employees.branch", "Branch"),
            render: (e) => (
              <span className="text-sm">{e.branchName || "—"}</span>
            ),
          },
          {
            key: "phone",
            header: t("employees.phone", "Phone"),
            render: (e) => <span className="text-sm">{e.phone || "—"}</span>,
          },
          {
            key: "status",
            header: t("common.active", "Active"),
            render: (e) => (
              <Badge
                className={
                  e.active
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground hover:bg-muted"
                }
              >
                {e.active
                  ? t("common.active", "Active")
                  : t("common.inactive", "Inactive")}
              </Badge>
            ),
          },
          {
            key: "role",
            header: t("employees.role", "Role"),
            render: (e) => <span className="text-sm">{e.roleName || "—"}</span>,
          },
          {
            key: "actions",
            header: "",
            headClassName: "w-12",
            render: (e) => (
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
                      setEditing(e);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="me-2 h-4 w-4" />{" "}
                    {t("common.edit", "Edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => setDeleteTarget(e)}
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

      <EmployeeDrawer
        open={open}
        onOpenChange={setOpen}
        employee={editing}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={t("employees.confirmDeleteTitle", "Delete Employee")}
        description={t(
          "employees.confirmDeleteDesc",
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

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground">{title}</div>
        {subtitle && (
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        )}
      </div>
    </div>
  );
}

function EmployeeDrawer({
  open,
  onOpenChange,
  employee,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employee: Employee | null;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isEdit = !!employee;
  const photoRef = useRef<HTMLInputElement>(null);
  const certRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [form, setForm] = useState<ExtendedEmployeeInput>({
    name: "",
    name_ar: "",
    email: "",
    phone: "",
    password: "",
    branch_id: "",
    department_id: "",
    role_id: "",
    active: true,
    is_main_admin: false,
    national_id: "",
    employee_code: "",
    certificate_number: "",
    certificate_end_date: "",
    certificate_image: null,
    photo: null,
    working_hours: defaultWorkingHours(),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["org", "branches"],
    queryFn: fetchBranches,
    enabled: open,
  });
  const { data: departments = [] } = useQuery({
    queryKey: ["org", "departments"],
    queryFn: fetchDepartments,
    enabled: open,
  });
  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setPhotoPreview(employee?.avatar ?? null);
      setForm({
        name: employee?.name ?? "",
        name_ar: "",
        email: employee?.email ?? "",
        phone: employee?.phone ?? "",
        password: "",
        branch_id: employee?.branchId ?? "",
        department_id: employee?.departmentId ?? "",
        role_id: "",
        active: employee?.active ?? true,
        is_main_admin: false,
        national_id: "",
        employee_code: "",
        certificate_number: "",
        certificate_end_date: "",
        certificate_image: null,
        photo: null,
        working_hours: defaultWorkingHours(),
      });
    }
  }, [open, employee]);

  const mut = useMutation({
    mutationFn: () => {
      const payload: Partial<EmployeeInput> = {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        active: form.active,
      };
      if (form.password) payload.password = form.password;
      if (form.branch_id) payload.branch_id = form.branch_id;
      if (form.department_id) payload.department_id = form.department_id;
      if (form.role_id) payload.role_id = form.role_id;
      return employee
        ? updateEmployee(employee.id, payload)
        : createEmployee(payload as EmployeeInput);
    },
    onSuccess: () => {
      toast.success(
        employee
          ? t("employees.updated", "Employee updated")
          : t("employees.created", "Employee created")
      );
      qc.invalidateQueries({ queryKey: ["org", "employees"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, photo: file });
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const updateDay = (
    day: (typeof DAYS)[number],
    patch: Partial<DaySchedule>
  ) => {
    setForm((prev) => ({
      ...prev,
      working_hours: {
        ...prev.working_hours!,
        [day]: { ...prev.working_hours![day], ...patch },
      },
    }));
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
        side="right"
      >
        {/* Header */}
        <SheetHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-orange-500 text-white">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold">
                {isEdit
                  ? t("employees.edit", "Edit Employee")
                  : t("employees.new", "Add New Employee")}
              </SheetTitle>
              <p className="text-xs text-muted-foreground">
                {t(
                  "employees.drawerSubtitle",
                  "Fill in the details to add a new employee"
                )}
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Photo upload */}
          <div className="flex flex-col items-center gap-3">
            <input
              ref={photoRef}
              type="file"
              accept="image/png,image/jpg,image/jpeg,image/gif,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              className="relative group flex h-28 w-28 items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 transition hover:border-primary overflow-hidden"
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-primary">
                  <Upload className="h-6 w-6" />
                  <span className="text-[10px] font-medium">
                    Employee Photo
                  </span>
                </div>
              )}
            </button>
            <p className="text-xs text-muted-foreground text-center">
              Drop image here or click to upload
              <br />
              PNG, JPG, JPEG, GIF, WEBP (Max 5MB)
            </p>
          </div>

          <Separator />

          {/* Personal Information */}
          <div>
            <SectionHeader
              icon={<User className="h-3.5 w-3.5" />}
              title={t("employees.personalInfo", "Personal Information")}
            />
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("employees.nameAr", "Arabic Name")}</Label>
                  <Input
                    dir="rtl"
                    placeholder="أدخل الاسم بالعربي"
                    value={form.name_ar}
                    onChange={(e) =>
                      setForm({ ...form, name_ar: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("employees.nameEn", "English Name")}</Label>
                  <Input
                    placeholder="Enter name in English"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("employees.phone", "Phone Number")}</Label>
                <Input
                  placeholder="05XXXXXXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("employees.email", "Email")}</Label>
                <Input
                  type="email"
                  placeholder="employee@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  {isEdit
                    ? t(
                        "employees.passwordOptional",
                        "Password (leave blank to keep)"
                      )
                    : t("employees.password", "Password")}
                </Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Organization */}
          <div>
            <SectionHeader
              icon={<Building2 className="h-3.5 w-3.5" />}
              title={t("employees.organization", "Organization")}
            />
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("employees.role", "Role")}</Label>
                  <Select
                    value={form.role_id || undefined}
                    onValueChange={(v) => setForm({ ...form, role_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("common.select", "Select")} />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem
                          key={r.id}
                          value={r.id}
                        >
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("employees.department", "Department")}</Label>
                  <Select
                    value={form.department_id || undefined}
                    onValueChange={(v) =>
                      setForm({ ...form, department_id: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("common.select", "Select")} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem
                          key={d.id}
                          value={d.id}
                        >
                          {d.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("employees.branch", "Branch")}</Label>
                <Select
                  value={form.branch_id || undefined}
                  onValueChange={(v) => setForm({ ...form, branch_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("common.select", "Select")} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem
                        key={b.id}
                        value={b.id}
                      >
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Identification */}
          <div>
            <SectionHeader
              icon={<IdCard className="h-3.5 w-3.5" />}
              title={t("employees.identification", "Identification")}
            />
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>
                    {t("employees.nationalId", "National ID / Iqama")}
                  </Label>
                  <Input
                    placeholder="1XXXXXXXXX"
                    value={form.national_id}
                    onChange={(e) =>
                      setForm({ ...form, national_id: e.target.value })
                    }
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {t(
                      "employees.nationalIdHint",
                      "Saudi ID or residency number"
                    )}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("employees.employeeCode", "Employee Code")}</Label>
                  <Input
                    placeholder="EMP-001"
                    value={form.employee_code}
                    onChange={(e) =>
                      setForm({ ...form, employee_code: e.target.value })
                    }
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {t(
                      "employees.employeeCodeHint",
                      "Unique employee identifier"
                    )}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>
                  {t("employees.certificateNumber", "Certificate Number")}
                </Label>
                <Input
                  value={form.certificate_number}
                  onChange={(e) =>
                    setForm({ ...form, certificate_number: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  {t("employees.certificateEndDate", "Certificate End Date")}
                </Label>
                <Input
                  type="date"
                  value={form.certificate_end_date}
                  onChange={(e) =>
                    setForm({ ...form, certificate_end_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  {t("employees.certificateImage", "Certificate Image")}
                </Label>
                <input
                  ref={certRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      certificate_image: e.target.files?.[0] ?? null,
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() => certRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 p-3 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  <Upload className="h-4 w-4" />
                  {form.certificate_image
                    ? form.certificate_image.name
                    : t(
                        "employees.uploadCertificate",
                        "Upload Certificate Image"
                      )}
                </button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Status & Permissions */}
          <div>
            <SectionHeader
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
              title={t("employees.statusPermissions", "Status & Permissions")}
            />
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{t("common.active", "Active")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "employees.activeHint",
                      "Employee can log in and use the system"
                    )}
                  </p>
                </div>
                <Switch
                  checked={!!form.active}
                  onCheckedChange={(v) => setForm({ ...form, active: v })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{t("employees.mainAdmin", "Main Admin")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "employees.mainAdminHint",
                      "Grant full administrative access"
                    )}
                  </p>
                </div>
                <Switch
                  checked={!!form.is_main_admin}
                  onCheckedChange={(v) =>
                    setForm({ ...form, is_main_admin: v })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Working Hours */}
          <div>
            <SectionHeader
              icon={<Clock className="h-3.5 w-3.5" />}
              title={t("employees.workingHours", "Working Hours")}
              subtitle={t(
                "employees.workingHoursSubtitle",
                "Set schedule for each day of the week"
              )}
            />
            <div className="space-y-2">
              {DAYS.map((day) => {
                const sched = form.working_hours![day];
                return (
                  <div
                    key={day}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 transition",
                      sched.dayOff && "bg-muted/50"
                    )}
                  >
                    <div className="w-24 shrink-0">
                      <div className="text-sm font-medium">{day}</div>
                      <div className="text-xs text-muted-foreground">{day}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={sched.dayOff}
                        onCheckedChange={(v) => updateDay(day, { dayOff: v })}
                        className="data-[state=checked]:bg-rose-500"
                      />
                      <span
                        className={cn(
                          "text-xs font-medium",
                          sched.dayOff
                            ? "text-rose-600"
                            : "text-muted-foreground"
                        )}
                      >
                        {t("employees.dayOff", "Day Off")}
                      </span>
                    </div>
                    {sched.dayOff ? (
                      <div className="ml-auto flex items-center gap-1.5 rounded-md bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                        🌴 {t("employees.dayOffLabel", "DAY OFF")}
                      </div>
                    ) : (
                      <div className="ml-auto flex items-center gap-2">
                        <div className="space-y-0.5">
                          <div className="text-[10px] text-muted-foreground">
                            {t("employees.startTime", "Start Time")}
                          </div>
                          <Input
                            type="time"
                            value={sched.startTime}
                            onChange={(e) =>
                              updateDay(day, { startTime: e.target.value })
                            }
                            className="h-8 w-24 text-xs"
                          />
                        </div>
                        <span className="mt-4 text-muted-foreground">→</span>
                        <div className="space-y-0.5">
                          <div className="text-[10px] text-muted-foreground">
                            {t("employees.endTime", "End Time")}
                          </div>
                          <Input
                            type="time"
                            value={sched.endTime}
                            onChange={(e) =>
                              updateDay(day, { endTime: e.target.value })
                            }
                            className="h-8 w-24 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
            className="flex-1 gap-2 bg-gradient-to-r from-slate-700 to-orange-500 text-white hover:opacity-95"
            disabled={
              !form.name ||
              !form.email ||
              (!isEdit && !form.password) ||
              mut.isPending
            }
            onClick={() => mut.mutate()}
          >
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <Plus className="h-4 w-4" />
            {isEdit
              ? t("common.save", "Save Changes")
              : t("employees.addEmployee", "+ Add Employee")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
