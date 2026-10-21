import { Analytics } from '@vercel/analytics/next';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import AnnouncementBanner from '@/components/core/banners/announcement-banner';
import EnvBanner from '@/components/core/banners/env-banner';
import PublicOnly from '@/components/core/banners/public-only';
import ReactQueryProvider from '@/components/core/providers/react-query-provider';
import { Provider } from '@/components/ui/provider';
import { Toaster } from '@/components/ui/toaster';
import { routing } from '@/localization/routing';
import type { Locale } from '@/types/Locale';

// The banner must reflect a flag/date change within minutes without a
// redeploy — never statically generate this layout (dashboard/layout.tsx's
// own force-dynamic still wins for that nested subtree).
export const revalidate = 300;

/**
 * Metadata for each page, can be overridden by page-specific metadata (e.g., in page.tsx)
 */
export const metadata: Metadata = {
  metadataBase: new URL('https://tonsite.be'), // base url
  title: {
    default: 'Website', // default title
    template: '%s – Website', // template for page titles
  },
  description: 'Default description for the website',
  openGraph: {
    siteName: 'Website',
    locale: 'fr_BE',
    type: 'website',
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) notFound();

  // Passe les messages au client (pour les Client Components)
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Provider>
          <NextIntlClientProvider messages={messages}>
            <EnvBanner />
            <Toaster />
            <PublicOnly>
              <AnnouncementBanner />
            </PublicOnly>
            <ReactQueryProvider>{children}</ReactQueryProvider>
          </NextIntlClientProvider>
        </Provider>
        <Analytics />
      </body>
    </html>
  );
}
