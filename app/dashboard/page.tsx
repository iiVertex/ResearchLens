import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import type { DocumentItem } from "@/lib/api"

export const metadata = { title: "Dashboard — ResearchLens" }

export default async function DashboardPage() {
  const user = await getUser()
  if (!user) redirect("/login")

  const supabase = await createClient()
  const { data: documents } = await supabase
    .from("documents")
    .select("id, name, status, num_pages, error, created_at")
    .order("created_at", { ascending: false })

  return (
    <DashboardClient
      userEmail={user.email ?? ""}
      initialDocuments={(documents ?? []) as DocumentItem[]}
    />
  )
}
