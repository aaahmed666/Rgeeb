"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FolderKanban, Plus, Pencil, Trash2, RefreshCw, Search, XCircle, MoreVertical,
  CheckCircle2, Clock, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import {
  fetchProjects, createProject, updateProject, cancelProject, deleteProject,
  type Project, type ProjectInput,
} from "@/services/projectsService";

const EMPTY: ProjectInput = { name: "", description: "", status: "pending" };
const STATUSES = ["pending", "active", "completed", "cancelled"] as const;

function statusBadge(status: string) {
  switch (status) {
    case "active": return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30">Active</Badge>;
    case "completed": return <Badge className="bg-blue-500/15 text-blue-700 border-blue-500/30">Completed</Badge>;
    case "cancelled": return <Badge className="bg-red-500/15 text-red-700 border-red-500/30">Cancelled</Badge>;
    default: return <Badge variant="secondary">Pending</Badge>;
  }
}

export default function ProjectsView() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Project | null>(null);
  const [form, setForm] = React.useState<ProjectInput>(EMPTY);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [cancelId, setCancelId] = React.useState<string | null>(null);

  const { data: projects = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => [p.name, p.description, p.branchName, p.status].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [projects, search]);

  const stats = React.useMemo(() => ({
    total: projects.length,
    active: projects.filter((p) => p.status === "active").length,
    completed: projects.filter((p) => p.status === "completed").length,
    pending: projects.filter((p) => p.status === "pending").length,
  }), [projects]);

  const saveMut = useMutation({
    mutationFn: editing ? (input: ProjectInput) => updateProject(editing.id, input) : createProject,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); toast.success(editing ? "Project updated" : "Project created"); setOpen(false); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });
  const cancelMut = useMutation({
    mutationFn: cancelProject,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); toast.success("Project cancelled"); setCancelId(null); },
    onError: () => toast.error("Cancel failed"),
  });
  const deleteMut = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); toast.success("Project deleted"); setDeleteId(null); },
    onError: () => toast.error("Delete failed"),
  });

  function openCreate() { setEditing(null); setForm(EMPTY); setOpen(true); }
  function openEdit(p: Project) {
    setEditing(p);
    setForm({ name: p.name, description: p.description ?? "", status: p.status, branch_id: p.branchId, start_date: p.startDate, end_date: p.endDate });
    setOpen(true);
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary"><FolderKanban className="h-5 w-5" /></div>
          <div>
            <h1 className="text-lg font-bold sm:text-xl">Projects</h1>
            <p className="text-xs text-muted-foreground">Manage and track all projects</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button size="sm" onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" /> New Project</Button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, icon: FolderKanban, color: "text-blue-500" },
          { label: "Active", value: stats.active, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-500" },
          { label: "Completed", value: stats.completed, icon: AlertCircle, color: "text-purple-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-border/60 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-md bg-muted p-2 ${color}`}><Icon className="h-4 w-4" /></div>
              <div>
                <p className="text-2xl font-bold">{isLoading ? "—" : value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grid of project cards */}
      <div>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9 max-w-sm" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">No projects found</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((proj) => (
              <Card key={proj.id} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold leading-tight">{proj.name}</h3>
                      {proj.branchName && <p className="text-xs text-muted-foreground mt-0.5">{proj.branchName}</p>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {statusBadge(proj.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(proj)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          {proj.status !== "cancelled" && (
                            <DropdownMenuItem onClick={() => setCancelId(proj.id)}><XCircle className="mr-2 h-4 w-4" />Cancel</DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(proj.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {proj.description && <p className="text-sm text-muted-foreground line-clamp-2">{proj.description}</p>}
                  {(proj.tasksCount !== undefined) && (
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{proj.completedTasksCount ?? 0}/{proj.tasksCount} tasks</span>
                      </div>
                      <Progress value={proj.progress ?? 0} className="h-1.5" />
                    </div>
                  )}
                  {(proj.startDate || proj.endDate) && (
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      {proj.startDate && <span>Start: {proj.startDate}</span>}
                      {proj.endDate && <span>End: {proj.endDate}</span>}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Project" : "New Project"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Project name" />
            </div>
            <div className="grid gap-1.5">
              <Label>Description</Label>
              <Textarea value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Project description..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date ?? ""} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <Label>End Date</Label>
                <Input type="date" value={form.end_date ?? ""} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select value={form.status ?? "pending"} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending || !form.name.trim()}>
              {saveMut.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel confirm */}
      <AlertDialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Cancel Project?</AlertDialogTitle><AlertDialogDescription>The project will be marked as cancelled.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction onClick={() => cancelId && cancelMut.mutate(cancelId)}>Yes, Cancel</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Project?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteId && deleteMut.mutate(deleteId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
