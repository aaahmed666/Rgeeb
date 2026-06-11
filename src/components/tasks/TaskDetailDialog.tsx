"use client";

/**
 * TaskDetailDialog — restores the OLD production task-detail features that
 * were missing from the rewrite: comments, activity log, and file
 * attachments. Backed by tasksService.comment / logs / uploadAttachment
 * (OLD contract: POST /customer/tasks/comment, GET /customer/tasks/logs,
 * multipart POST /customer/tasks/attachment).
 */

import * as React from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, MessageSquare, History, Paperclip, Send, Upload } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { tasksService, type TaskItem } from "@/services/tasksService";

interface TaskDetailDialogProps {
  task: TaskItem | null;
  onOpenChange: (open: boolean) => void;
}

function asStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    return asStr(o.name ?? o.title ?? o.body ?? o.description ?? "");
  }
  return "";
}

export default function TaskDetailDialog({ task, onOpenChange }: TaskDetailDialogProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [comment, setComment] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const open = !!task;
  const taskId = task?.id ?? "";

  const logsQuery = useQuery({
    queryKey: ["task-logs", taskId],
    queryFn: () => tasksService.logs(taskId),
    enabled: open,
    staleTime: 30_000,
  });

  const commentMutation = useMutation({
    mutationFn: (body: string) => tasksService.comment(taskId, body),
    onSuccess: () => {
      setComment("");
      toast.success(t("tasks.commentAdded", "Comment added"));
      void qc.invalidateQueries({ queryKey: ["task-logs", taskId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const attachmentMutation = useMutation({
    mutationFn: (file: File) => tasksService.uploadAttachment(taskId, file),
    onSuccess: () => {
      toast.success(t("tasks.attachmentUploaded", "Attachment uploaded"));
      void qc.invalidateQueries({ queryKey: ["task-logs", taskId] });
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const logs = (logsQuery.data ?? []) as Record<string, unknown>[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="truncate">{task?.title ?? ""}</span>
            {task?.status && (
              <Badge variant="outline" className="shrink-0 capitalize">
                {String(task.status).replace(/_/g, " ")}
              </Badge>
            )}
          </DialogTitle>
          {task?.description ? (
            <DialogDescription className="line-clamp-3 text-start">
              {task.description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <Tabs defaultValue="comments">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="comments" className="gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              {t("tasks.comments", "Comments")}
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5">
              <History className="h-3.5 w-3.5" />
              {t("tasks.activityLog", "Activity")}
            </TabsTrigger>
            <TabsTrigger value="attachments" className="gap-1.5">
              <Paperclip className="h-3.5 w-3.5" />
              {t("tasks.attachments", "Files")}
            </TabsTrigger>
          </TabsList>

          {/* ── Comments ── */}
          <TabsContent value="comments" className="space-y-3">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("tasks.commentPlaceholder", "Write a comment…")}
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={!comment.trim() || commentMutation.isPending}
                onClick={() => commentMutation.mutate(comment.trim())}
                className="gap-1.5"
              >
                {commentMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5 rtl:rotate-180" />
                )}
                {t("tasks.addComment", "Add Comment")}
              </Button>
            </div>
          </TabsContent>

          {/* ── Activity log ── */}
          <TabsContent value="activity">
            {logsQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("tasks.noActivity", "No activity recorded for this task yet")}
              </p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto pe-1">
                {logs.map((l, i) => {
                  const text =
                    asStr(l.description) ||
                    asStr(l.action) ||
                    asStr(l.body) ||
                    asStr(l.message);
                  const who = asStr(l.user) || asStr(l.created_by) || asStr(l.author);
                  const when = asStr(l.created_at) || asStr(l.date);
                  return (
                    <li
                      key={String(l.id ?? i)}
                      className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm"
                    >
                      <p className="text-foreground">{text || t("tasks.logEntry", "Activity entry")}</p>
                      {(who || when) && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[who, when].filter(Boolean).join(" — ")}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>

          {/* ── Attachments ── */}
          <TabsContent value="attachments" className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) attachmentMutation.mutate(f);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={attachmentMutation.isPending}
              className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/40 disabled:opacity-60"
            >
              {attachmentMutation.isPending ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Upload className="h-6 w-6" />
              )}
              {t("tasks.uploadAttachmentHint", "Click to upload a file attachment")}
            </button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
