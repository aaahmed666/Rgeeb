import Link from "next/link";

export const metadata = { title: "Privacy Policy — RGEEB" };

/**
 * Minimal Privacy Policy page.
 * Created because the login footer links to /privacy; previously this was a 404.
 * Replace the placeholder copy with the real legal text before launch.
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6 sm:p-10">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">
        This page describes how RGEEB collects, uses, and protects your data.
        The full policy text will be published here. For questions, please
        contact support.
      </p>
      <Link href="/login" className="text-sm font-medium text-primary underline">
        Back to sign in
      </Link>
    </main>
  );
}
