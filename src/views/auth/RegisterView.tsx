"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Mail,
  Package as PackageIcon,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
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
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { isRtl } from "@/lib/i18n";
import {
  fetchCategories,
  fetchCities,
  fetchCountries,
  fetchPackages,
} from "@/services/lookupsService";
import { sendOtpRequest } from "@/services/authService";

const STEPS = [
  { key: "basic", titleKey: "Basic Info", subKey: "Account Information", icon: UserIcon },
  { key: "category", titleKey: "Category", subKey: "Select Category", icon: PackageIcon },
  { key: "verify", titleKey: "Verification", subKey: "Verify Your Email", icon: ShieldCheck },
  { key: "package", titleKey: "Package Details", subKey: "Select Package", icon: PackageIcon },
] as const;

interface BasicInfo {
  name_ar: string;
  name_en: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
  nationality: string;
  city_id: string;
}

export default function RegisterView() {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";
  const rtl = isRtl(lang);
  const router = useRouter();
  const { register } = useAuth();

  const [step, setStep] = React.useState(0);
  const [basic, setBasic] = React.useState<BasicInfo>({
    name_ar: "",
    name_en: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    nationality: "",
    city_id: "",
  });
  const [showPw, setShowPw] = React.useState(false);
  const [categoryId, setCategoryId] = React.useState<string>("");
  const [otp, setOtp] = React.useState<string>("");
  const [packageId, setPackageId] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);
  const [sendingOtp, setSendingOtp] = React.useState(false);

  // Lookups
  const countriesQ = useQuery({ queryKey: ["countries"], queryFn: fetchCountries });
  const citiesQ = useQuery({
    queryKey: ["cities", basic.nationality],
    queryFn: () => fetchCities(basic.nationality),
    enabled: !!basic.nationality,
  });
  const categoriesQ = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const packagesQ = useQuery({
    queryKey: ["packages", categoryId],
    queryFn: () => fetchPackages({ all: true, category_id: categoryId || undefined }),
    enabled: step >= 3,
  });

  const localised = (en?: string, ar?: string, fallback?: string) =>
    (rtl ? ar || en : en || ar) || fallback || "";

  // --- Validation per step ---
  const validateBasic = (): string | null => {
    if (!basic.name_ar.trim()) return "Arabic name is required";
    if (!basic.name_en.trim()) return "English name is required";
    if (!/^\S+@\S+\.\S+$/.test(basic.email)) return "Please enter a valid email";
    if (!/^\+?\d{8,15}$/.test(basic.phone.replace(/\s/g, "")))
      return "Please enter a valid phone number";
    if (basic.password.length < 8) return "Password must be at least 8 characters";
    if (basic.password !== basic.confirm) return "Passwords do not match";
    if (!basic.nationality) return "Country is required";
    if (!basic.city_id) return "City is required";
    return null;
  };

  const goNext = async () => {
    if (step === 0) {
      const err = validateBasic();
      if (err) return toast.error(err);
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!categoryId) return toast.error("Please select a category");
      // Trigger OTP send when moving to verification
      try {
        setSendingOtp(true);
        const res = await sendOtpRequest(basic.email);
        toast.success(res.message);
        setStep(2);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not send OTP");
      } finally {
        setSendingOtp(false);
      }
      return;
    }
    if (step === 2) {
      if (otp.length !== 6) return toast.error("Verification code is required");
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!packageId) return toast.error("Please select a package");
      await handleRegister();
    }
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const resendOtp = async () => {
    try {
      setSendingOtp(true);
      const res = await sendOtpRequest(basic.email);
      toast.success(res.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not resend code");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleRegister = async () => {
    setSubmitting(true);
    try {
      await register({
        name_ar: basic.name_ar,
        name_en: basic.name_en,
        name: basic.name_en,
        email: basic.email,
        phone: basic.phone,
        password: basic.password,
        password_confirmation: basic.confirm,
        otp_code: otp,
        nationality: basic.nationality,
        city_id: basic.city_id,
        category_id: categoryId,
        package_id: packageId,
      });
      toast.success("Account created");
      router.push('/dashboard');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary">
      <div className="absolute top-4 end-4 z-10 flex gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="mb-3 h-12 w-auto" />
          <h1 className="text-2xl font-bold sm:text-3xl">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete the steps below to get started
          </p>
        </div>

        <Stepper current={step} />

        <div className="mt-8 rounded-2xl border bg-card p-6 shadow-xl sm:p-8">
          {step === 0 && (
            <BasicInfoStep
              value={basic}
              onChange={setBasic}
              showPw={showPw}
              onTogglePw={() => setShowPw((v) => !v)}
              countries={countriesQ.data ?? []}
              countriesLoading={countriesQ.isLoading}
              cities={citiesQ.data ?? []}
              citiesLoading={citiesQ.isFetching}
              rtl={rtl}
            />
          )}
          {step === 1 && (
            <CategoryStep
              categories={categoriesQ.data ?? []}
              loading={categoriesQ.isLoading}
              selected={categoryId}
              onSelect={setCategoryId}
              localised={localised}
            />
          )}
          {step === 2 && (
            <VerifyStep
              email={basic.email}
              otp={otp}
              onChange={setOtp}
              onResend={resendOtp}
              sending={sendingOtp}
            />
          )}
          {step === 3 && (
            <PackageStep
              packages={packagesQ.data ?? []}
              loading={packagesQ.isLoading}
              selected={packageId}
              onSelect={setPackageId}
              localised={localised}
            />
          )}

          <div className="mt-8 flex items-center justify-between border-t pt-6">
            <Button
              variant="ghost"
              onClick={goBack}
              disabled={step === 0 || submitting}
            >
              <ArrowLeft className="me-2 h-4 w-4 rtl-flip" />
              Previous
            </Button>

            <Button onClick={goNext} disabled={submitting || sendingOtp}>
              {step === 3
                ? submitting
                  ? "Subscribing..."
                  : "Subscribe"
                : step === 2
                  ? "Verify My Email"
                  : sendingOtp && step === 1
                    ? "Sending code..."
                    : step === 1
                      ? "Submit"
                      : "Next"}
              {step === 3 ? (
                <Check className="ms-2 h-4 w-4" />
              ) : (
                <ArrowRight className="ms-2 h-4 w-4 rtl-flip" />
              )}
            </Button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ============== Stepper ============== */
function Stepper({ current }: { current: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const active = i === current;
        const done = i < current;
        return (
          <React.Fragment key={s.key}>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border transition-colors",
                  active && "border-primary bg-primary text-primary-foreground",
                  done && "border-primary/50 bg-primary/10 text-primary",
                  !active && !done && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    "truncate text-sm font-semibold",
                    !active && !done && "text-muted-foreground",
                  )}
                >
                  {s.titleKey}
                </p>
                <p className="truncate text-xs text-muted-foreground">{s.subKey}</p>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ============== Step 1: Basic Info ============== */
function BasicInfoStep({
  value,
  onChange,
  showPw,
  onTogglePw,
  countries,
  countriesLoading,
  cities,
  citiesLoading,
  rtl,
}: {
  value: BasicInfo;
  onChange: (next: BasicInfo) => void;
  showPw: boolean;
  onTogglePw: () => void;
  countries: { id: string; name_ar?: string; name_en?: string; name: string }[];
  countriesLoading: boolean;
  cities: { id: string; name_ar?: string; name_en?: string; name: string }[];
  citiesLoading: boolean;
  rtl: boolean;
}) {
  const set = (patch: Partial<BasicInfo>) => onChange({ ...value, ...patch });
  return (
    <>
      <h2 className="text-xl font-bold">Basic Information</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your account details (All fields are required)
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Name (Arabic)">
          <Input
            value={value.name_ar}
            onChange={(e) => set({ name_ar: e.target.value })}
            placeholder="الاسم بالعربية"
            dir="rtl"
          />
        </Field>
        <Field label="Name (English)">
          <Input
            value={value.name_en}
            onChange={(e) => set({ name_en: e.target.value })}
            placeholder="John Doe"
          />
        </Field>

        <Field label="Email">
          <Input
            type="email"
            value={value.email}
            onChange={(e) => set({ email: e.target.value })}
            placeholder="john.doe@email.com"
          />
        </Field>
        <Field label="Phone">
          <Input
            value={value.phone}
            onChange={(e) => set({ phone: e.target.value })}
            placeholder="+966500000000"
          />
        </Field>

        <Field label="Password">
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              value={value.password}
              onChange={(e) => set({ password: e.target.value })}
              placeholder="••••••••"
              className="pe-10"
            />
            <button
              type="button"
              onClick={onTogglePw}
              className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Field label="Confirm Password">
          <Input
            type={showPw ? "text" : "password"}
            value={value.confirm}
            onChange={(e) => set({ confirm: e.target.value })}
            placeholder="••••••••"
          />
        </Field>

        <Field label="Country">
          <Select
            value={value.nationality}
            onValueChange={(v) => set({ nationality: v, city_id: "" })}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={countriesLoading ? "Loading..." : "Select country"}
              />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {rtl ? c.name_ar || c.name : c.name_en || c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="City">
          <Select
            value={value.city_id}
            onValueChange={(v) => set({ city_id: v })}
            disabled={!value.nationality}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  !value.nationality
                    ? "Select country first"
                    : citiesLoading
                      ? "Loading..."
                      : "Select city"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {cities.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {rtl ? c.name_ar || c.name : c.name_en || c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/* ============== Step 2: Category ============== */
function CategoryStep({
  categories,
  loading,
  selected,
  onSelect,
  localised,
}: {
  categories: import("@/services/lookupsService").Category[];
  loading: boolean;
  selected: string;
  onSelect: (v: string) => void;
  localised: (en?: string, ar?: string, fb?: string) => string;
}) {
  return (
    <>
      <h2 className="text-xl font-bold">Select Category</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Please select a category for your account.
      </p>

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-xl border bg-muted/40"
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const id = String(c.id);
            const isActive = selected === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className={cn(
                  "group flex flex-col items-start rounded-xl border bg-card p-5 text-start transition-all hover:border-primary/60 hover:shadow-md",
                  isActive && "border-primary ring-2 ring-primary/30 shadow-md",
                )}
              >
                <div className="mb-4 flex h-28 w-full items-center justify-center rounded-lg bg-gradient-to-br from-muted to-muted/40">
                  <PackageIcon className="h-10 w-10 text-primary/60" />
                </div>
                <p className="font-semibold">
                  {localised(c.name_en, c.name_ar, c.name)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {localised(c.description_en, c.description_ar, c.description)}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ============== Step 3: Verify ============== */
function VerifyStep({
  email,
  otp,
  onChange,
  onResend,
  sending,
}: {
  email: string;
  otp: string;
  onChange: (v: string) => void;
  onResend: () => void;
  sending: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Mail className="h-7 w-7" />
      </div>
      <h2 className="text-2xl font-bold">Verify Your Email</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        We've sent a 6-digit code to <strong>{email}</strong>
      </p>

      <div className="mt-6">
        <InputOTP maxLength={6} value={otp} onChange={onChange}>
          <InputOTPGroup>
            {Array.from({ length: 6 }).map((_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Didn't receive the code?{" "}
        <button
          type="button"
          onClick={onResend}
          disabled={sending}
          className="font-semibold text-primary hover:underline disabled:opacity-50"
        >
          {sending ? "Sending..." : "Resend Code"}
        </button>
      </p>
    </div>
  );
}

/* ============== Step 4: Package ============== */
function PackageStep({
  packages,
  loading,
  selected,
  onSelect,
  localised,
}: {
  packages: import("@/services/lookupsService").PackageItem[];
  loading: boolean;
  selected: string;
  onSelect: (v: string) => void;
  localised: (en?: string, ar?: string, fb?: string) => string;
}) {
  return (
    <>
      <h2 className="text-xl font-bold">Select Plan</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Select a package and subscribe to continue
      </p>

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl border bg-muted/40" />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((p) => {
            const id = String(p.id);
            const isActive = selected === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className={cn(
                  "flex flex-col items-start rounded-xl border bg-card p-5 text-start transition-all hover:border-primary/60 hover:shadow-md",
                  isActive && "border-primary ring-2 ring-primary/30 shadow-md",
                )}
              >
                <p className="text-base font-semibold">
                  {localised(p.name_en, p.name_ar, p.name)}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {localised(p.description_en, p.description_ar, p.description)}
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-primary">${p.price ?? 0}</span>
                  {p.duration && (
                    <span className="text-sm text-muted-foreground">
                      / {p.duration} {p.duration_unit ?? "month"}
                    </span>
                  )}
                </div>
                <div
                  className={cn(
                    "mt-4 flex h-5 w-5 items-center justify-center rounded-full border",
                    isActive ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                  )}
                >
                  {isActive && <Check className="h-3 w-3" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
