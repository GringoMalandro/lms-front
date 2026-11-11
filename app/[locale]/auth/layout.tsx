import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { academyBrand, isAcademyHost } from '@/lib/independizar/academy'
import { getRequestBaseUrl } from '@/lib/seo'

// Auth screens must never be indexed by search engines.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (!isAcademyHost(new URL(await getRequestBaseUrl()).host)) return children

  return (
    <>
      <header className="absolute inset-x-0 top-0 z-10 flex justify-center px-4 py-4">
        <Link href="/">
          <Image src={academyBrand.logo} alt={academyBrand.name} width={185} height={45} unoptimized />
        </Link>
      </header>
      {children}
    </>
  )
}
