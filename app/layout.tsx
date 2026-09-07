import type { Metadata } from 'next';
import './globals.css';

const [githubOwner = '', githubRepository = ''] = (
  process.env.GITHUB_REPOSITORY ?? ''
).split('/');
const isGitHubUserSite = githubRepository.endsWith('.github.io');
const githubBasePath =
  githubRepository && !isGitHubUserSite ? `/${githubRepository}` : '';
const githubPagesUrl = githubOwner
  ? `https://${githubOwner}.github.io${githubBasePath}/`
  : '';
const configuredSiteUrl =
  process.env.SITE_URL || githubPagesUrl || 'http://localhost:3000';
const siteUrl = configuredSiteUrl.endsWith('/')
  ? configuredSiteUrl
  : `${configuredSiteUrl}/`;
const socialImagePath = 'og.png';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: '落地价｜Tesla Model Y 花费比较',
  description: '比较在维州全款、个人车贷与 novated lease 的预计税后经济成本。',
  openGraph: {
    title: '落地价｜Tesla Model Y 花费比较',
    description: '现金 · 个人车贷 · Novated lease — Victoria',
    type: 'website',
    images: [
      {
        url: socialImagePath,
        width: 1200,
        height: 630,
        alt: '落地价｜Tesla Model Y 花费比较',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '落地价｜Tesla Model Y 花费比较',
    description: '现金 · 个人车贷 · Novated lease — Victoria',
    images: [socialImagePath],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
