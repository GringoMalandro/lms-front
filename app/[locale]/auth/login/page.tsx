import { isAcademyHost } from '@/lib/independizar/academy'
import { getRequestBaseUrl } from '@/lib/seo'
import { LoginForm } from '@/components/login-form'
import { getCurrentTenantId } from '@/lib/supabase/tenant'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'seo' })
  return { title: t('auth.login') }
}

export default async function Page() {
  const isAcademy = isAcademyHost(new URL(await getRequestBaseUrl()).host)
  const tenantId = isAcademy ? undefined : await getCurrentTenantId()

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm tenantId={tenantId} isAcademy={isAcademy} />
      </div>
    </div>
  )
}
