"use client";

import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Show a spinner on the confirm button while a delete mutation is pending */
  isLoading?: boolean;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  isLoading = false,
}: ConfirmDeleteDialogProps) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("common.areYouSure");
  const resolvedDescription = description ?? t("validation.deleteConfirm");
  const resolvedConfirm = confirmLabel ?? t("common.delete");
  const resolvedCancel = cancelLabel ?? t("common.cancel");
  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{resolvedTitle}</AlertDialogTitle>
          <AlertDialogDescription>{resolvedDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-3">
          <AlertDialogCancel disabled={isLoading}>
            {resolvedCancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-70"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {resolvedConfirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
