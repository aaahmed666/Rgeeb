"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  User, Shield, Upload, Trash2, Eye, EyeOff,
  Crown, Clock, CheckCircle2, Circle, Loader2, Building2,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  fetchProfile, updateProfile, updateClient, changePassword,
  type UserProfile, type UpdateClientInput,
} from "@/services/profileService";
import {
  fetchCountries, fetchCities,
} from "@/services/lookupsService";

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon, iconBg,
}: {
  label: string; value: string; icon: React.ReactNode; iconBg: string;
}) {
  return (
    <div className="flex flex-1 items-center justify-between rounded-2xl border bg-card px-6 py-5 shadow-sm">
      <div>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-lg font-semibold text-foreground">{value}</p>
      </div>
      <div className={cn("flex h-14 w-14 items-center justify-center rounded-full text-white", iconBg)}>
        {icon}
      </div>
    </div>
  );
}

// ─── Password requirement indicator ──────────────────────────────────────────
function PwReq({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {met
        ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
        : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
      <span className={cn("text-xs", met ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
        {label}
      </span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProfileView() {
  const { t, i18n } = useTranslation();
  const { refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const isRtl = i18n.language === "ar";
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Profile data ──────────────────────────────────────────────────────────
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 30_000,
  });

  // ── Lookups ───────────────────────────────────────────────────────────────
  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    staleTime: Infinity,
  });

  const [selectedCountry, setSelectedCountry] = useState("");
  const { data: cities = [] } = useQuery({
    queryKey: ["cities", selectedCountry || profile?.country_id],
    queryFn: () =>
      fetchCities(selectedCountry || String(profile?.country_id ?? "")),
    enabled: !!(selectedCountry || profile?.country_id),
    staleTime: 60_000,
  });

  // ── Form state ────────────────────────────────────────────────────────────
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [email, setEmail]   = useState("");
  const [phone, setPhone]   = useState("");
  const [cityId, setCityId] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Sync form with fetched data
  useEffect(() => {
    if (!profile) return;
    setNameAr(profile.name_ar ?? profile.name ?? "");
    setNameEn(profile.name_en ?? profile.name ?? "");
    setEmail(profile.email ?? "");
    setPhone(profile.phone ?? "");
    setSelectedCountry(String(profile.country_id ?? ""));
    setCityId(String(profile.city_id ?? ""));
  }, [profile]);

  // ── Avatar ────────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
      toast.error("File too large. Max 800 KB.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleDeleteAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Update profile mutation ───────────────────────────────────────────────
  const updateMut = useMutation({
    mutationFn: () =>
      updateProfile({
        name_ar: nameAr,
        name_en: nameEn,
        email,
        phone,
        country_id: selectedCountry || undefined,
        city_id: cityId || undefined,
        avatar_file: avatarFile,
      }),
    onSuccess: async () => {
      toast.success(t("profile.updateSuccess"));
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await refreshProfile();
      setAvatarFile(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || t("profile.updateError"));
    },
  });

  // ── Password form ─────────────────────────────────────────────────────────
  const [curPw,   setCurPw]   = useState("");
  const [newPw,   setNewPw]   = useState("");
  const [confPw,  setConfPw]  = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCnf, setShowCnf] = useState(false);

  const pwHas6  = newPw.length >= 6;
  const pwHasUp = /[A-Z]/.test(newPw);
  const pwHasNum = /[0-9]/.test(newPw);
  const pwReady = !!(curPw && newPw && confPw && pwHas6);

  const pwMut = useMutation({
    mutationFn: () =>
      changePassword({
        current_password: curPw,
        password: newPw,
        password_confirmation: confPw,
      }),
    onSuccess: () => {
      toast.success(t("profile.passwordSuccess"));
      setCurPw(""); setNewPw(""); setConfPw("");
    },
    onError: (err: Error) => {
      toast.error(err.message || t("profile.passwordError"));
    },
  });

  const handlePasswordSubmit = useCallback(() => {
    if (!curPw)               { toast.error(t("profile.currentPasswordRequired")); return; }
    if (newPw.length < 6)    { toast.error(t("profile.passwordTooShort")); return; }
    if (newPw !== confPw)    { toast.error(t("profile.passwordMismatch")); return; }
    pwMut.mutate();
  }, [curPw, newPw, confPw, pwMut, t]);

  // ── Client / Company settings ─────────────────────────────────────────────
  const [clientNameEn, setClientNameEn] = useState("");
  const [clientNameAr, setClientNameAr] = useState("");
  const [clientEmail, setClientEmail]   = useState("");
  const [clientPhone, setClientPhone]   = useState("");
  const [clientAddress, setClientAddress] = useState("");

  // Sync client form from profile
  useEffect(() => {
    if (!profile?.client) return;
    const c = profile.client;
    setClientNameEn(c.name_en ?? c.name ?? "");
    setClientNameAr(c.name_ar ?? "");
    setClientEmail(c.email ?? "");
    setClientPhone(c.phone ?? "");
    setClientAddress(c.address ?? "");
  }, [profile]);

  const clientMut = useMutation({
    mutationFn: () =>
      updateClient({
        name_en: clientNameEn,
        name_ar: clientNameAr,
        email: clientEmail,
        phone: clientPhone,
        address: clientAddress,
        country_id: selectedCountry || undefined,
        city_id: cityId || undefined,
      }),
    onSuccess: async () => {
      toast.success(t("profile.clientUpdateSuccess", "Company info updated"));
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await refreshProfile();
    },
    onError: (err: Error) => {
      toast.error(err.message || t("profile.updateError"));
    },
  });

  // ── Derived values ────────────────────────────────────────────────────────
  const roleName = profile?.roles?.[0]?.name ?? "client";
  const packageName =
    profile?.subscription?.package_name ??
    profile?.client?.category?.name ??
    "—";
  const daysRemaining = profile?.subscription?.days_remaining;
  const avatarSrc = avatarPreview ?? profile?.avatar ?? "";
  const initials = (nameEn || nameAr || "U").charAt(0).toUpperCase();

  const localisedCountryName = (c: { name: string; name_ar?: string; name_en?: string }) =>
    isRtl ? (c.name_ar || c.name) : (c.name_en || c.name);
  const localisedCityName = (c: { name: string; name_ar?: string; name_en?: string }) =>
    isRtl ? (c.name_ar || c.name) : (c.name_en || c.name);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold">{t("profile.title")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("profile.subtitle")}</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <StatCard
          label={t("profile.roleLabel")}
          value={roleName}
          iconBg="bg-gradient-to-br from-amber-400 to-orange-500"
          icon={<User className="h-6 w-6" />}
        />
        <StatCard
          label={t("profile.packageLabel")}
          value={packageName}
          iconBg="bg-gradient-to-br from-pink-400 to-rose-500"
          icon={<Crown className="h-6 w-6" />}
        />
        {daysRemaining !== undefined && (
          <StatCard
            label={t("profile.daysRemainingLabel")}
            value={String(daysRemaining)}
            iconBg="bg-gradient-to-br from-teal-400 to-green-500"
            icon={<Clock className="h-6 w-6" />}
          />
        )}
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {t("profile.accountTab")}
          </TabsTrigger>
          {profile?.client && (
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {t("profile.companyTab", "Company")}
            </TabsTrigger>
          )}
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t("profile.securityTab")}
          </TabsTrigger>
        </TabsList>

        {/* ═══ ACCOUNT TAB ═══ */}
        <TabsContent value="account">
          <div className="rounded-2xl border bg-card shadow-sm p-6 space-y-6">
            <h2 className="text-base font-semibold">{t("profile.personalInfo")}</h2>

            {/* Avatar row */}
            <div className="flex items-start gap-5">
              <div className="relative">
                <Avatar className="h-20 w-20 rounded-full border-2 border-border shadow">
                  <AvatarImage src={avatarSrc} alt={nameEn || nameAr} className="object-cover" />
                  <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {/* Face-embedding indicator */}
                {profile?.has_face_embedding && (
                  <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {t("profile.uploadPhoto")}
                  </Button>
                  {(avatarPreview || profile?.avatar) && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleDeleteAvatar}
                      className="flex items-center gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t("profile.deletePhoto")}
                    </Button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t("profile.photoHint")}</p>
                <p className="text-xs text-muted-foreground">{t("profile.faceLoginHint")}</p>
              </div>
            </div>

            {/* Form grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Full name (Arabic) */}
              <div className="space-y-1.5">
                <Label htmlFor="nameAr">{t("profile.nameAr")}</Label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nameAr"
                    dir="rtl"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    className="ps-9"
                    placeholder="الاسم بالعربية"
                  />
                </div>
              </div>

              {/* Full name (English) */}
              <div className="space-y-1.5">
                <Label htmlFor="nameEn">{t("profile.nameEn")}</Label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nameEn"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="ps-9"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("profile.email")}</Label>
                <div className="relative">
                  <svg className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="5" width="16" height="12" rx="3" /><path d="M2 8l8 5 8-5" />
                  </svg>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="ps-9"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone">{t("profile.phone")}</Label>
                <div className="relative">
                  <svg className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 4h4l2 4-2.5 1.5a11 11 0 005 5L14 12l4 2v4a2 2 0 01-2 2A16 16 0 012 6a2 2 0 012-2z" />
                  </svg>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="ps-9"
                    placeholder="+966 500 000 000"
                  />
                </div>
              </div>

              {/* Country */}
              <div className="space-y-1.5">
                <Label>{t("profile.country")}</Label>
                <Select
                  value={selectedCountry}
                  onValueChange={(v) => {
                    setSelectedCountry(v);
                    setCityId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRtl ? "اختر الدولة" : "Select country"} />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {localisedCountryName(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City */}
              <div className="space-y-1.5">
                <Label>{t("profile.city")}</Label>
                <Select
                  value={cityId}
                  onValueChange={setCityId}
                  disabled={!selectedCountry}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRtl ? "اختر المدينة" : "Select city"} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {localisedCityName(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Save button */}
            <div className="flex justify-start pt-2">
              <Button
                onClick={() => updateMut.mutate()}
                disabled={updateMut.isPending}
                className="flex items-center gap-2 min-w-[160px]"
              >
                {updateMut.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />{t("profile.saving")}</>
                ) : (
                  <>{t("profile.saveChanges")}</>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ═══ COMPANY TAB ═══ */}
        {profile?.client && (
          <TabsContent value="company">
            <div className="rounded-2xl border bg-card shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">{t("profile.companyInfo", "Company Information")}</h2>
                  <p className="text-xs text-muted-foreground">{t("profile.companyInfoHint", "Update your organisation details")}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t("profile.companyNameEn", "Company Name (EN)")}</Label>
                  <Input
                    value={clientNameEn}
                    onChange={(e) => setClientNameEn(e.target.value)}
                    placeholder="Company Inc."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("profile.companyNameAr", "Company Name (AR)")}</Label>
                  <Input
                    dir="rtl"
                    value={clientNameAr}
                    onChange={(e) => setClientNameAr(e.target.value)}
                    placeholder="اسم الشركة"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("profile.companyEmail", "Company Email")}</Label>
                  <Input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="info@company.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("profile.companyPhone", "Company Phone")}</Label>
                  <Input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+966 11 000 0000"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>{t("profile.companyAddress", "Address")}</Label>
                  <Input
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    placeholder="123 Main St, Riyadh"
                  />
                </div>
              </div>

              <div className="flex justify-start pt-2">
                <Button
                  onClick={() => clientMut.mutate()}
                  disabled={clientMut.isPending}
                  className="flex items-center gap-2 min-w-[160px]"
                >
                  {clientMut.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />{t("profile.saving")}</>
                  ) : (
                    <>{t("profile.saveChanges")}</>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        )}

        {/* ═══ SECURITY TAB ═══ */}
        <TabsContent value="security">
          <div className="rounded-2xl border bg-card shadow-sm p-6 space-y-6 max-w-2xl">
            <h2 className="text-base font-semibold">{t("profile.changePassword")}</h2>

            <div className="space-y-4">
              {/* Current password */}
              <div className="space-y-1.5">
                <Label htmlFor="curPw">{t("profile.currentPassword")}</Label>
                <div className="relative">
                  <Input
                    id="curPw"
                    type={showCur ? "text" : "password"}
                    value={curPw}
                    onChange={(e) => setCurPw(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCur((v) => !v)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showCur ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New + confirm — side by side on large screens */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="newPw">{t("profile.newPassword")}</Label>
                  <div className="relative">
                    <Input
                      id="newPw"
                      type={showNew ? "text" : "password"}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confPw">{t("profile.confirmNewPassword")}</Label>
                  <div className="relative">
                    <Input
                      id="confPw"
                      type={showCnf ? "text" : "password"}
                      value={confPw}
                      onChange={(e) => setConfPw(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCnf((v) => !v)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showCnf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="rounded-xl border bg-muted/30 px-4 py-3 space-y-2">
                <p className="text-xs font-medium flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {t("profile.passwordRequirements")}
                </p>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                  <PwReq met={pwHas6}  label={t("profile.req6Chars")} />
                  <PwReq met={pwHasUp} label={t("profile.req1Upper")} />
                  <PwReq met={pwHasNum} label={t("profile.req1Number")} />
                </div>
              </div>

              {/* Submit */}
              <Button
                onClick={handlePasswordSubmit}
                disabled={!pwReady || pwMut.isPending}
                className="flex items-center gap-2 min-w-[180px]"
              >
                {pwMut.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />{t("profile.saving")}</>
                ) : (
                  <><Shield className="h-4 w-4" />{t("profile.changePasswordBtn")}</>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
