import { Suspense } from "react"
import { AuthForm } from "@/components/auth/auth-form"

export const metadata = { title: "Create account — ResearchLens" }

export default function SignupPage() {
  return (
    <Suspense>
      <AuthForm mode="signup" />
    </Suspense>
  )
}
