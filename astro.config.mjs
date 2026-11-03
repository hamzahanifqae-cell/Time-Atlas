// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

import { buildSiteConfig } from './src/config/fromEnv.ts';
import { assertReleaseReady } from './src/config/site-node.ts';
import { isIndexableSitemapUrl } from './src/lib/seo/sitemapFilter.ts';

const mode = process.env.NODE_ENV === 'development' ? 'development' : 'production';
const env = loadEnv(mode, process.cwd(), '');
const isLocalBuild = env.PUBLIC_ALLOW_LOCAL_BUILD === 'true';
const isDevServer = process.argv.includes('dev');

const config = buildSiteConfig(env, { isLocalBuild: isLocalBuild || isDevServer });

// Standard `astro build` (no PUBLIC_ALLOW_LOCAL_BUILD, not `astro dev`) must fail fast if
// production configuration (domain/operator/contact) is missing or invalid — see
// /RELEASE_CHECKLIST.md. `npm run build:local` sets PUBLIC_ALLOW_LOCAL_BUILD=true to skip this.
if (!isDevServer) {
  assertReleaseReady(config);
}

const site = config.productionOrigin ?? undefined;

export default defineConfig({
  site,
  trailingSlash: "always",
  // Keep spaces between links and the words around them. The default compressor
  // trims those spaces out of the visible sentence.
  compressHTML: false,
  integrations: [
    react(),
    ...(site
      ? [
          sitemap({
            filter: isIndexableSitemapUrl,
            // Omit lastmod. A build timestamp would claim every page changed on every deploy.
          }),
        ]
      : []),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
