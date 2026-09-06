import type { Metadata } from "next";

import { SignIn } from "@/views/SignIn";

export const metadata: Metadata = {
  title: "Sign in — Video Speed Reader",
  description: "Sign in to Video Speed Reader to manage your transcripts.",
};

export default function SignInPage() {
  return <SignIn />;
}
