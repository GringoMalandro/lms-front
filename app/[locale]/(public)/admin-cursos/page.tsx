import { isAcademyHost } from "@/lib/independizar/academy";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IndependizarAdminCourseManager } from "@/components/independizar/admin-course-manager";

export const dynamic = "force-dynamic";

export default async function IndependizarAdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase();
  if (!isAcademyHost(host)) notFound();

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect(`/${locale}/auth/login?next=/${locale}/admin-cursos`);
  if (user.app_metadata?.role !== "admin") notFound();

  return (
    <main className="pt-24 pb-8 md:pt-28">
      <IndependizarAdminCourseManager />
    </main>
  );
}
