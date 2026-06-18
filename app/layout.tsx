import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://avtomagistral77.ru'),
  title: {
    default: 'Автомагистраль - грузоперевозки и спецтехника',
    template: '%s | Автомагистраль',
  },
  description:
    'Грузовые перевозки, услуги спецтехники и организация работ для бизнеса, строительных объектов, подрядчиков и частных задач.',
  icons: {
    icon: '/landings/avtomagistral/brand/favicon.svg',
  },
  openGraph: {
    title: 'Автомагистраль - грузоперевозки и спецтехника',
    description:
      'Грузовые перевозки, услуги спецтехники и организация работ для бизнеса, строительных объектов, подрядчиков и частных задач.',
    images: [
      {
        url: '/landings/avtomagistral/brand/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Автомагистраль - грузоперевозки и спецтехника',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
