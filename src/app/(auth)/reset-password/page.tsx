export const dynamic = 'force-dynamic';

import * as React from "react";
import ResetPasswordView from "@/views/auth/ResetPasswordView";

export default function Page() {
  return (
    <React.Suspense>
      <ResetPasswordView />
    </React.Suspense>
  );
}
