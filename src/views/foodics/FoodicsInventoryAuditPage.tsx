"use client";
import { useTranslation } from "react-i18next";

import React, { useEffect, useState, useCallback } from "react";
import {
  Loader2, Plus, Trash2, Edit2, X, Check, History,
  Package, AlertCircle } from "lucide-react";
import { foodicsService, FoodicsInventoryZone, FoodicsInventoryAudit } from "@/services/foodicsService";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";

export default function FoodicsInventoryAuditPage() {
  const { hasPermission } = useAuth();
  const can = usePermission("foodics");
  const { t } = useTranslation();
  const [zones, setZones] = useState<FoodicsInventoryZone[]>([]);
  const [auditHistory, setAuditHistory] = useState<FoodicsInventoryAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"zones" | "history">("zones");

  const [branchId, setBranchId] = useState("");
  const [deleteZoneId, setDeleteZoneId] = useState<string | null>(null);

  // Add zone dialog
  const [showAdd, setShowAdd] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneBranch, setNewZoneBranch] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  // Edit zone
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await foodicsService.getInventoryZones(branchId || undefined);
      setZones(res.data ?? []);
    } catch {
      setZones([]);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await foodicsService.getInventoryAuditHistory({
        branch_id: branchId || undefined,
      });
      setAuditHistory(res.data ?? []);
    } catch {
      setAuditHistory([]);
    }
  }, [branchId]);

  useEffect(() => {
    foodicsService.getBranches().then((r) => {
      const b = r.data ?? [];
      setBranches(b);
      if (b.length > 0 && !newZoneBranch) setNewZoneBranch(b[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchZones();
    fetchHistory();
  }, [fetchZones, fetchHistory]);

  const handleAddZone = async () => {
    if (!newZoneName.trim()) { setAddError(t("validation.required")); return; }
    if (!newZoneBranch) { setAddError(t("validation.required")); return; }
    setAddLoading(true);
    setAddError("");
    try {
      await foodicsService.createInventoryZone({ name: newZoneName.trim(), branch_id: newZoneBranch });
      setShowAdd(false);
      setNewZoneName("");
      await fetchZones();
    } catch {
      setAddError(t("admin.common.addFailed"));
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditZone = async (id: string) => {
    if (!editName.trim()) return;
    setEditLoading(true);
    try {
      await foodicsService.updateInventoryZone(id, { name: editName.trim() });
      setEditId(null);
      await fetchZones();
    } catch {
      // ignore
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteZone = async (id: string) => {
    try {
      await foodicsService.deleteInventoryZone(id);
      await fetchZones();
    } catch {
      // ignore
    }
  };

  const STATUS_COLORS: Record<string, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    inactive: "bg-gray-100 text-gray-600",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  };

  if (!hasPermission("foodics.inventory.audits.read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-muted-foreground">{t("foodics.accessDenied")}</p>
        <p className="text-sm text-muted-foreground mt-1">You don&apos;t have permission to view Inventory Audit.</p>
      </div>
    );
  }

  return (
    <>
    <div className="p-6 space-y-6">
      {/* Tabs */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("zones")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition ${
              activeTab === "zones" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Package className="w-4 h-4" /> {t("foodics.zoneName")}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition ${
              activeTab === "history" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="w-4 h-4" /> {t("foodics.auditHistory")}
          </button>
        </div>

        <div className="p-4">
          {/* Branch filter + Add Zone button */}
          <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none">
              <option value="">{t("foodics.allBranches")}</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {activeTab === "zones" && (
              <button
                disabled={!can.create}
                onClick={() => can.create && setShowAdd(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
              >
                <Plus className="w-4 h-4" /> {t("foodics.addZone")}
              </button>
            )}
          </div>

          {activeTab === "zones" && (
            loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : zones.length === 0 ? (
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {t("foodics.noInventory")}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {zones.map((zone) => (
                  <div key={zone.id} className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-start justify-between mb-2">
                      {editId === zone.id ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-2 py-1 rounded border border-border bg-card text-sm focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <p className="font-semibold text-card-foreground">{zone.name}</p>
                      )}
                      <div className="flex items-center gap-1 ml-2">
                        {editId === zone.id ? (
                          <>
                            <button
                              disabled={!can.update || editLoading}
                              onClick={() => can.update && !editLoading && handleEditZone(zone.id)}
                              className="p-1 rounded hover:bg-muted text-green-600 transition"
                            >
                              {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button onClick={() => setEditId(null)} className="p-1 rounded hover:bg-muted text-muted-foreground transition">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              disabled={!can.update}
                              onClick={() => { if (can.update) { setEditId(zone.id); setEditName(zone.name); } }}
                              className="p-1 rounded hover:bg-muted text-muted-foreground transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              disabled={!can.delete}
                              onClick={() => can.delete && setDeleteZoneId(zone.id)}
                              className="p-1 rounded hover:bg-muted text-destructive transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{zone.branch_name}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">{zone.items_count} items</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        STATUS_COLORS[zone.status] ?? "bg-gray-100 text-gray-600"
                      }`}>{zone.status}</span>
                    </div>
                    {zone.last_audit && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last audit: {zone.last_audit}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === "history" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase">
                    <th className="text-left py-3 px-2">ID</th>
                    <th className="text-left py-3 px-2">{t("foodics.zoneName")}</th>
                    <th className="text-left py-3 px-2">{t("foodics.date")}</th>
                    <th className="text-left py-3 px-2">{t("foodics.status")}</th>
                    <th className="text-right py-3 px-2">{t("foodics.activeItems")}</th>
                    <th className="text-right py-3 px-2">{t("foodics.discrepancy")}</th>
                    <th className="text-left py-3 px-2">{t("foodics.branch")}</th>
                  </tr>
                </thead>
                <tbody>
                  {auditHistory.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">
                      {t("foodics.noCashDrawer")}
                    </td></tr>
                  ) : (
                    auditHistory.map((a) => (
                      <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition">
                        <td className="py-3 px-2 font-mono text-xs">{a.id}</td>
                        <td className="py-3 px-2">{a.zone_name}</td>
                        <td className="py-3 px-2 text-muted-foreground">{a.date}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600"
                          }`}>{a.status}</span>
                        </td>
                        <td className="py-3 px-2 text-right">{a.items_audited}</td>
                        <td className="py-3 px-2 text-right font-medium text-amber-600">{a.discrepancies}</td>
                        <td className="py-3 px-2">{a.branch_name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Zone Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-card-foreground mb-4">{t("foodics.addZone")}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">{t("foodics.zoneName")}</label>
                <input
                  type="text"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="e.g. Kitchen Storage A"
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t("foodics.branch")}</label>
                <select
                  value={newZoneBranch}
                  onChange={(e) => setNewZoneBranch(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none"
                >
                  <option value="">{t("common.select")}</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              {addError && (
                <p className="text-xs text-destructive">{addError}</p>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddZone}
                disabled={addLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition"
              >
                {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {t("foodics.addZone")}
              </button>
              <button
                onClick={() => { setShowAdd(false); setAddError(""); setNewZoneName(""); }}
                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    <ConfirmDeleteDialog
      open={deleteZoneId !== null}
      onOpenChange={(o) => { if (!o) setDeleteZoneId(null); }}
      title={t("validation.deleteConfirm", "Delete Zone")}
      description={t("validation.deleteConfirmDesc", "Are you sure you want to delete this zone? This cannot be undone.")}
      onConfirm={() => { const id = deleteZoneId; setDeleteZoneId(null); if (id) void handleDeleteZone(id); }}
    />
    </>
  );
}
