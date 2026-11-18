import { Suspense } from "react";
import Script from "next/script";
import { Manrope, IBM_Plex_Sans_Arabic } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Providers } from "@/providers/Providers";
import Navbar from "@/components/Navbar";
import LocaleSync from "@/components/LocaleSync";

const latin = Manrope({
  subsets: ["latin"],
  variable: "--font-latin",
  display: "swap",
});

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

// Runs before first paint: applies the saved theme (zustand "shop-theme" store) or the OS preference.
const themeScript = `(function(){try{var s=JSON.parse(localStorage.getItem('shop-theme')||'null');var t=s&&s.state&&s.state.theme;if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${latin.variable} ${arabic.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-bg text-fg antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <LocaleSync />
            <Suspense fallback={null}>
              <Navbar />
            </Suspense>
            <main className="flex-1">{children}</main>
          </Providers>
        </NextIntlClientProvider>
        {process.env.NEXT_PUBLIC_MATOMO_URL && (
          <Script id="matomo" strategy="afterInteractive">
            {`var _paq=window._paq=window._paq||[];_paq.push(['trackPageView']);_paq.push(['enableLinkTracking']);(function(){var u=${JSON.stringify(process.env.NEXT_PUBLIC_MATOMO_URL)};_paq.push(['setTrackerUrl',u+'matomo.php']);_paq.push(['setSiteId','1']);var d=document,g=d.createElement('script'),s=d.getElementsByTagName('script')[0];g.async=true;g.src=u+'matomo.js';s.parentNode.insertBefore(g,s);})();`}
          </Script>
        )}
      </body>
    </html>
  );
}
