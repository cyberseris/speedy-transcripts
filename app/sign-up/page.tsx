import type { Metadata } from "next";

import { SignUp } from "@/views/SignUp";

export const metadata: Metadata = {
  title: "Create your account — Video Speed Reader",
  description: "Create a free Video Speed Reader account and turn videos into transcripts.",
};

export default function SignUpPage() {
  return <SignUp />;
}
