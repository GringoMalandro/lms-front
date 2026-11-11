import { isAcademyHost } from "@/lib/independizar/academy";
import Link from "next/link";
import { getCurrentTenant } from "@/lib/supabase/tenant";
import { getLocale, getTranslations } from 'next-intl/server';
import { getRequestBaseUrl } from "@/lib/seo";
import { APP_NAME } from '@/lib/app-name';
import { IconBrandTwitter, IconBrandFacebook, IconBrandInstagram, IconBrandYoutube, IconBrandLinkedin, IconBrandTiktok, IconBrandGithub } from '@tabler/icons-react'
import type { FooterSettings, SocialPlatform } from "@/lib/landing-pages/types";

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001'

const SOCIAL_ICONS: Record<SocialPlatform, React.ComponentType<{ className?: string }>> = {
    twitter: IconBrandTwitter,
    facebook: IconBrandFacebook,
    instagram: IconBrandInstagram,
    youtube: IconBrandYoutube,
    linkedin: IconBrandLinkedin,
    tiktok: IconBrandTiktok,
    github: IconBrandGithub,
}

interface FooterProps {
    footerSettings?: FooterSettings
}

export async function Footer({ footerSettings }: FooterProps = {}) {
    const tenant = await getCurrentTenant();
    const t = await getTranslations('landingPageBuilder.footer');
    const locale = await getLocale();
    const isSpanish = locale !== 'en';
    // Real product name (#730) when there's no tenant to brand this footer with
    // (the platform's own marketing pages).
    const platformName = APP_NAME;
    const isAcademy = isAcademyHost(new URL(await getRequestBaseUrl()).host);
    const brandName = isAcademy ? "Independizar" : tenant && tenant.id !== DEFAULT_TENANT_ID ? tenant.name : platformName;
    const slogan = isAcademy ? (isSpanish ? "Aprende. Crece. Sé libre." : "Learn. Grow. Be free.") : null;
    const academyCopyright = isAcademy ? `© ${new Date().getFullYear()} Independizar. ${slogan} ${isSpanish ? "Un proyecto de Tren del Agua Inc. Todos los derechos reservados." : "A project of Tren del Agua Inc. All rights reserved."}` : null;

    // If footerSettings is provided, render custom footer
    if (footerSettings) {
        return (
            <footer className="border-t border-border bg-muted/50 py-12">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                        {/* Brand column */}
                        <div>
                            <h3 className="font-bold text-lg mb-4 text-foreground">{brandName}</h3>
                            {slogan && <p className="mb-3 text-sm font-medium text-[#008f89]">{slogan}</p>}
                            {footerSettings.description && (
                                <p className="text-muted-foreground text-sm">{footerSettings.description}</p>
                            )}
                            {footerSettings.socialLinks && footerSettings.socialLinks.length > 0 && (
                                <div className="flex items-center gap-3 mt-4">
                                    {footerSettings.socialLinks.map((link, idx) => {
                                        const Icon = SOCIAL_ICONS[link.platform]
                                        if (!Icon) return null
                                        return (
                                            <a
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-muted-foreground hover:text-foreground transition-colors"
                                                title={link.platform}
                                            >
                                                <Icon className="w-5 h-5" />
                                            </a>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Custom columns */}
                        {footerSettings.columns?.map((column, idx) => (
                            <div key={idx}>
                                <h4 className="font-semibold text-foreground mb-4">{column.title}</h4>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    {column.links?.map((link, linkIdx) => (
                                        <li key={linkIdx}>
                                            <a href={link.href} className="hover:text-foreground transition-colors">
                                                {link.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 flex flex-wrap justify-center gap-5 text-sm text-muted-foreground">
                    <Link href="/privacy" className="hover:text-foreground">{isAcademy && isSpanish ? "Política de privacidad" : "Privacy Policy"}</Link>
                    <Link href="/terms" className="hover:text-foreground">{isAcademy && isSpanish ? "Términos de servicio" : "Terms of Service"}</Link>
                </div>
                <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
                        {academyCopyright ?? (footerSettings.copyrightText || `\u00A9 ${new Date().getFullYear()} ${brandName}. ${t('allRightsReserved')}`)}
                    </div>
                </div>
            </footer>
        )
    }

    if (isAcademy) {
        return (
            <footer className="border-t border-[#008f89]/20 bg-[#071d34] text-white">
                <div className="container mx-auto px-6 py-12">
                    <div className="grid gap-10 md:grid-cols-3">
                        <div>
                            <Link href="/" className="inline-flex items-center gap-3 text-2xl font-bold"><img src="/independizar-logo.svg" alt="Independizar" className="h-12 w-12 object-contain" /><span>Independizar<span className="text-[#008f89]">.</span></span></Link>
                            <p className="mt-3 text-sm text-slate-300">{slogan}</p>
                            <p className="mt-3 text-sm text-slate-400">{isSpanish ? "Un proyecto de Tren del Agua Inc." : "A project of Tren del Agua Inc."}</p>
                        </div>
                        <div>
                            <h3 className="mb-4 font-semibold text-white">{isSpanish ? "Explorar" : "Explore"}</h3>
                            <nav className="flex flex-col gap-3 text-sm text-slate-300">
                                <Link href="/academia" className="hover:text-[#4ad4c9]">{isSpanish ? "Cursos de inglés" : "English courses"}</Link>
                                <Link href="/pricing" className="hover:text-[#4ad4c9]">{isSpanish ? "Planes" : "Plans"}</Link>
                            </nav>
                        </div>
                        <div>
                            <h3 className="mb-4 font-semibold text-white">{isSpanish ? "Información" : "Information"}</h3>
                            <nav className="flex flex-col gap-3 text-sm text-slate-300">
                                <Link href="/privacy" className="hover:text-[#4ad4c9]">{isSpanish ? "Política de privacidad" : "Privacy Policy"}</Link>
                                <Link href="/terms" className="hover:text-[#4ad4c9]">{isSpanish ? "Términos de servicio" : "Terms of Service"}</Link>
                                <a href="mailto:independizar@trendelagua.com" className="break-all hover:text-[#4ad4c9]">independizar@trendelagua.com</a>
                            </nav>
                        </div>
                    </div>
                    <div className="mt-10 border-t border-white/15 pt-6 text-center text-sm text-slate-400">
                        © {new Date().getFullYear()} Independizar. {slogan} {isSpanish ? "Un proyecto de Tren del Agua Inc. Todos los derechos reservados." : "A project of Tren del Agua Inc. All rights reserved."}
                    </div>
                </div>
            </footer>
        );
    }

    // Default footer (#730): every link must resolve to a route that
    // actually exists under app/[locale]/(public)/ — a school that hasn't
    // configured its own footer yet gets Courses, Pricing and About, not
    // "Instructors" / "Careers" / "Contact" / legal pages that were never built.
    return (
        <footer className="border-t border-border bg-muted/50 py-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    <div>
                        <h3 className="font-bold text-lg mb-4 text-foreground">{brandName}</h3>
                        <p className="text-muted-foreground text-sm">
                            {slogan ?? t('defaultDescription')}
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-foreground mb-4">{t('platform')}</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/courses" className="hover:text-foreground transition-colors">{t('courses')}</Link></li>
                            <li><Link href="/pricing" className="hover:text-foreground transition-colors">{t('pricing')}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-foreground mb-4">{t('company')}</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/about" className="hover:text-foreground transition-colors">{t('aboutUs')}</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-10 flex flex-wrap justify-center gap-5 text-sm text-muted-foreground">
                    <Link href="/privacy" className="hover:text-foreground">{isAcademy ? "Política de privacidad" : "Privacy Policy"}</Link>
                    <Link href="/terms" className="hover:text-foreground">{isAcademy ? "Términos de servicio" : "Terms of Service"}</Link>
                </div>
                <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
                    {academyCopyright ?? <>© {new Date().getFullYear()} {brandName}. {t('allRightsReserved')}</>}
                </div>
            </div>
        </footer>
    );
}
