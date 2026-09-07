import type { NextConfig } from 'next';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const isGitHubUserSite = repositoryName.endsWith('.github.io');
const inferredGitHubBasePath =
  process.env.GITHUB_ACTIONS === 'true' && repositoryName && !isGitHubUserSite
    ? `/${repositoryName}`
    : '';
const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH;
const assetPrefix =
  configuredBasePath === undefined
    ? inferredGitHubBasePath
    : configuredBasePath.replace(/\/$/, '');

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  assetPrefix: assetPrefix || undefined,
};

export default nextConfig;
