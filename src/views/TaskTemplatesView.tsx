"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardCheck,
  Plus,
  Trash2,
  Loader2,
  Sun,
  Package,
  Sparkles,
  Snowflake,
  ShieldAlert,
  Tag,
  Clock,
  BarChart2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  createTaskTemplate,
  deleteTaskTemplate,
  fetchTaskTemplates,
  useTemplate,
  type TaskTemplate,
  type TaskTemplateCategory,
  type TaskTemplatePriority,
} from "@/services/taskTemplatesService";

const CATEGORIES: { value: TaskTemplateCategory; tone: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "operations", tone: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50", icon: Sun },
  { value: "inventory", tone: "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900/50", icon: Package },
  { value: "cleaning", tone: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50", icon: Sparkles },
  { value: "maintenance", tone: "bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-900/50", icon: Snowflake },
  { value: "quality", tone: "bg-slate-100 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800", icon: ShieldAlert },
  { value: "other", tone: "bg-muted border-border", icon: Tag },
];

function categoryStyle(c: TaskTemplateCategory) {
  return CATEGORIES.find((x) => x.value === c) ?? CATEGORIES[CATEGORIES.length - 1];
}

const PRIORITY_TONE: Record<TaskTemplatePriority, string> = {
  low: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

export default function TaskTemplatesView() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaskTemplate | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["task-templates"],
    queryFn: fetchTaskTemplates,
  });

  const useMut = useMutation({
    mutationFn: (id: string) => useTemplate(id, {}),
    onMutate: (id) => setPendingId(id),
    onSettled: () => setPendingId(null),
    onSuccess: () => {
      toast.success(t("templates.created", "Task created from template"));
      qc.invalidateQueries({ queryKey: ["task-templates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteTaskTemplate(id),
    onSuccess: () => {
      toast.success(t("templates.deleted", "Template deleted"));
      qc.invalidateQueries({ queryKey: ["task-templates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-3 text-white shadow-lg">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              {t("templates.title", "Task Templates")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("templates.subtitle", "Create reusable templates for quick task creation")}
            </p>
          </div>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow hover:opacity-95">
              <Plus className="h-4 w-4" />
              {t("templates.new", "New Template")}
            </Button>
          </DialogTrigger>
          <CreateTemplateDialog onClose={() => setCreateOpen(false)} />
        </Dialog>
      </header>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="me-2 h-5 w-5 animate-spin" />
          {t("common.loading", "Loading…")}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30">
              <ClipboardCheck className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <p className="text-base font-semibold">
              {t("templates.empty", "No templates yet")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("templates.emptyDesc", "Create your first template to speed up recurring tasks")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              tpl={tpl}
              busy={pendingId === tpl.id}
              onUse={() => useMut.mutate(tpl.id)}
              onDelete={() => setDeleteTarget(tpl)}
            />
          ))}
        </div>
      )}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={t("templates.confirmDeleteTitle", "Delete Template")}
        description={t("templates.confirmDeleteDesc", `Are you sure you want to delete "${deleteTarget?.nameEn}"? This action cannot be undone.`)}
        confirmLabel={t("common.delete", "Delete")}
        cancelLabel={t("common.cancel", "Cancel")}
        onConfirm={() => { if (deleteTarget) delMut.mutate(deleteTarget.id); setDeleteTarget(null); }}
      />
    </div>
  );
}

function TemplateCard({
  tpl,
  busy,
  onUse,
  onDelete,
}: {
  tpl: TaskTemplate;
  busy: boolean;
  onUse: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const style = categoryStyle(tpl.category);
  const Icon = style.icon;
  return (
    <Card className={cn("overflow-hidden border-2 transition-shadow hover:shadow-md", style.tone)}>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/70 text-foreground shadow-sm dark:bg-card">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold leading-tight">
              {tpl.nameAr ? `${tpl.nameAr} (${tpl.nameEn})` : tpl.nameEn}
            </h3>
            <Badge className="mt-1 bg-amber-100 text-xs font-semibold capitalize text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300">
              {tpl.category}
            </Badge>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-red-500 hover:bg-red-500/10 hover:text-red-600"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {tpl.description && (
          <p className="text-sm text-muted-foreground" dir="auto">
            {tpl.description}
          </p>
        )}

        <div className="rounded-lg border bg-white/60 p-3 dark:bg-card/60">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("templates.titleTemplate", "Title Template")}
          </div>
          <div className="mt-1 truncate text-sm font-mono" dir="auto">
            {tpl.titleTemplate || "—"}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
              PRIORITY_TONE[tpl.priority],
            )}
          >
            {tpl.priority}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            <Clock className="h-3 w-3" />
            {tpl.estimatedHours}h
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            <BarChart2 className="h-3 w-3" />
            {t("templates.used", "Used")} {tpl.usedCount}×
          </span>
        </div>

        <Button
          className={cn(
            "w-full gap-2 text-white",
            tpl.usedCount === 0
              ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-95"
              : "bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-95",
          )}
          disabled={busy}
          onClick={onUse}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {t("templates.use", "Use Template")}
        </Button>
      </CardContent>
    </Card>
  );
}

function CreateTemplateDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name_en: "",
    name_ar: "",
    description: "",
    category: "operations" as TaskTemplateCategory,
    priority: "medium" as TaskTemplatePriority,
    estimated_hours: 1,
    title_template: "",
  });

  const mut = useMutation({
    mutationFn: () => createTaskTemplate(form),
    onSuccess: () => {
      toast.success(t("templates.savedNew", "Template created"));
      qc.invalidateQueries({ queryKey: ["task-templates"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{t("templates.new", "New Template")}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>{t("templates.nameEn", "Name (EN)")}</Label>
            <Input
              value={form.name_en}
              onChange={(e) => setForm({ ...form, name_en: e.target.value })}
              placeholder="Morning Setup"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("templates.nameAr", "Name (AR)")}</Label>
            <Input
              value={form.name_ar}
              onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
              placeholder="تجهيز شيفت الصباح"
              dir="rtl"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>{t("templates.description", "Description")}</Label>
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("templates.titleTemplate", "Title Template")}</Label>
          <Input
            value={form.title_template}
            onChange={(e) => setForm({ ...form, title_template: e.target.value })}
            placeholder="Morning Setup - {branch name}"
          />
          <p className="text-xs text-muted-foreground">
            {t("templates.varsHint", "Use {branch name}, {customer name} as placeholders")}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>{t("templates.category", "Category")}</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v as TaskTemplateCategory })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="capitalize">
                    {c.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("templates.priority", "Priority")}</Label>
            <Select
              value={form.priority}
              onValueChange={(v) => setForm({ ...form, priority: v as TaskTemplatePriority })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["low", "medium", "high", "critical"] as TaskTemplatePriority[]).map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("templates.hours", "Hours")}</Label>
            <Input
              type="number"
              min={0}
              step={0.5}
              value={form.estimated_hours}
              onChange={(e) => setForm({ ...form, estimated_hours: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          disabled={!form.name_en || !form.title_template || mut.isPending}
          onClick={() => mut.mutate()}
          className="gap-2"
        >
          {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("common.save", "Save")}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
