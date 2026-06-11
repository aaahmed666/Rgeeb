import Link from "next/link";

export const metadata = { title: "Terms of Service — RGEEB" };

/**
 * Minimal Terms of Service page.
 * Created because the login footer links to /terms; previously this was a 404.
 * Replace the placeholder copy with the real legal text before launch.
 */
export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6 sm:p-10">
      <h1 className="text-2xl font-bold">Terms of Service</h1>
      <p className="text-sm text-muted-foreground">
        These terms govern your use of the RGEEB platform. The full legal text
        will be published here. For questions, please contact support.
      </p>
      <Link href="/login" className="text-sm font-medium text-primary underline">
        Back to sign in
      </Link>
    </main>
  );
}
