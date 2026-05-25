"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth";
import { FaceLoginButton } from "@/components/FaceLoginButton";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function LoginView() {
  const { t } = useTranslation();
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false as boolean,
    },
  });

  const rememberMe = watch("rememberMe");

  React.useEffect(() => {
    if (isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, router]);

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values.email, values.password, values.rememberMe);
      toast.success(t("common.success"));
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-secondary overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl opacity-50" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl opacity-50" />

      {/* Header controls */}
      <div className="absolute top-6 right-6 flex gap-2 z-10">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      {/* Main content */}
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Logo and heading */}
          <div className="mb-10 flex flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center justify-center rounded-full bg-primary/10 p-3">
              <Logo className="h-10 w-auto" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome back
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-border/50 bg-card shadow-2xl backdrop-blur-sm p-8 sm:p-10">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* Email field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-semibold"
                >
                  Email address
                </Label>
                <div className="relative group">
                  <Mail className="pointer-events-none absolute start-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className={`ps-11 h-11 rounded-lg border-border/80 bg-secondary/40 placeholder:text-muted-foreground/60 transition-all focus:bg-card focus:border-primary/50 focus:ring-2 focus:ring-primary/20 ${
                      errors.email
                        ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                        : ""
                    }`}
                    disabled={isSubmitting}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-semibold"
                  >
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="pointer-events-none absolute start-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`ps-11 pe-11 h-11 rounded-lg border-border/80 bg-secondary/40 placeholder:text-muted-foreground/60 transition-all focus:bg-card focus:border-primary/50 focus:ring-2 focus:ring-primary/20 ${
                      errors.password
                        ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                        : ""
                    }`}
                    disabled={isSubmitting}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="pointer-events-auto absolute end-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me checkbox */}
              <div className="flex items-center gap-2.5">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setValue("rememberMe", checked === true)
                  }
                  disabled={isSubmitting}
                  className="rounded border-border/80"
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm font-medium cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors"
                >
                  Remember me
                </Label>
              </div>

              {/* Sign in button */}
              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-primary/25"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ms-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  or continue with
                </span>
              </div>
            </div>

            {/* Alternative login options */}
            <div className="space-y-3">
              <FaceLoginButton />
              <Link href="/register">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 rounded-lg border-border/50 hover:bg-secondary/50 transition-all"
                >
                  Create account
                </Button>
              </Link>
            </div>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-muted-foreground">
              By signing in, you agree to our{" "}
              <Link
                href="#"
                className="font-medium text-primary hover:underline"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="#"
                className="font-medium text-primary hover:underline"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
