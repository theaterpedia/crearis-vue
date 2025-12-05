# SSR Optimization Review for Theaterpedia

## Executive Summary

This document identifies **essential SSR optimizations** required for the Theaterpedia three-system architecture during the 3-6 month migration period. Focus is on **critical SEO requirements** without requiring a full SSR rewrite.
It further reasons in depth on the question how and when to start server-prerendering the project-sites (estimate: from JAN 2026 onwards).

## Current Architecture Status

### ✅ Completed SEO Implementations

1. **Home Route SEO** (`src/config/homeroutes.ts`)
   - Static meta tags for network homepage routes
   - Implemented in `Home.vue`, `GetStarted.vue`
   - Covers: `/`, `/getstarted`, `/blog`, `/team`, `/events`, `/projects`, `/search`

2. **Project Site SEO** (`ProjectSite.vue`)
   - Dynamic meta tags from `projects.config` JSONB field
   - Fallback chain to project properties
   - Covers: `/sites/:domaincode`

3. **Improved Footer** (`homeSiteFooter.vue`)
   - Comprehensive navigation and branding
   - Applied to home routes

### Current Limitations

The current implementation uses **client-side meta tag injection** via `document.createElement()`. This has limitations:

- ❌ Search engine crawlers may not see meta tags on first render
- ❌ Social media scrapers (Facebook, Twitter) require server-side meta tags
- ❌ No server-side rendering of page content
- ❌ Initial page load shows empty HTML shell

## Critical SSR Requirements for SEO

### Priority 1: Server-Side Meta Tag Rendering (CRITICAL)

**Impact**: High - Required for social media sharing and search engine indexing

**Problem**: Current client-side meta injection is invisible to:
- Facebook/Twitter/LinkedIn scrapers
- Some search engine crawlers
- First-paint renders

**Solution Options**:

#### Option A: Nitro SSR Middleware (Recommended for 3-6 months)
```typescript
// server/middleware/seo.ts
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const path = url.pathname

  // Match home routes
  if (path === '/') {
    return sendHTML(event, renderHomeWithMeta(homeRoutes.home))
  }

  // Match project sites
  const projectMatch = path.match(/^\/sites\/([^\/]+)$/)
  if (projectMatch) {
    const domaincode = projectMatch[1]
    const project = await fetchProject(domaincode)
    return sendHTML(event, renderProjectSiteWithMeta(project))
  }
})
```

**Effort**: Medium (2-3 days)
**Risk**: Low
**Benefit**: Fixes social sharing and crawler visibility immediately

#### Option B: Pre-render Static Pages
Pre-generate HTML for known routes during build:
```bash
# Generate static HTML for home routes
pnpm run build:ssg
```

**Effort**: Low (1 day)
**Risk**: Low
**Limitation**: Only works for static routes, not dynamic project sites

### Priority 2: Sitemap Generation (HIGH)

**Impact**: High - Critical for search engine discovery

**Problem**: No `sitemap.xml` for search engines to discover pages

**Solution**: Generate dynamic sitemap from database
```typescript
// server/api/sitemap.xml.ts
export default defineEventHandler(async (event) => {
  const db = await getDatabase()
  const projects = await db.all('SELECT domaincode, updated_at FROM projects WHERE status = "published"')
  
  const urls = [
    // Static home routes
    { loc: 'https://theaterpedia.org/', lastmod: '2025-01-01', priority: 1.0 },
    { loc: 'https://theaterpedia.org/events', lastmod: '2025-01-01', priority: 0.8 },
    // ... more static routes
    
    // Dynamic project sites
    ...projects.map(p => ({
      loc: `https://theaterpedia.org/sites/${p.domaincode}`,
      lastmod: p.updated_at,
      priority: 0.7
    }))
  ]
  
  setHeader(event, 'Content-Type', 'application/xml')
  return generateSitemapXML(urls)
})
```

**Effort**: Low (1 day)
**Risk**: None
**Benefit**: Essential for search engine crawling

### Priority 3: Robots.txt Configuration (HIGH)

**Impact**: Medium - Controls search engine crawling

**Problem**: No `robots.txt` to guide search engines

**Solution**: Create static robots.txt
```txt
# public/robots.txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /login
Disallow: /tasks

Sitemap: https://theaterpedia.org/sitemap.xml
```

**Effort**: Minimal (10 minutes)
**Risk**: None
**Benefit**: Prevents indexing of admin routes, directs to sitemap

### Priority 4: Canonical URLs (MEDIUM)

**Impact**: Medium - Prevents duplicate content penalties

**Problem**: No canonical URLs set

**Solution**: Add to meta tag functions
```typescript
// Add canonical URL
setMeta('link[rel="canonical"]', { 
  rel: 'canonical', 
  href: `https://theaterpedia.org${path}` 
})
```

**Effort**: Low (1 hour)
**Risk**: None
**Benefit**: Prevents SEO penalties for duplicate content

### Priority 5: Performance Optimizations (MEDIUM)

**Impact**: Medium - Page speed affects SEO rankings

**Current Issues**:
- No image lazy loading
- No code splitting for large components
- All data fetched on mount (multiple sequential API calls)

**Solutions**:

1. **Lazy Load Images (Implemented)**
```vue
<!-- Works with any image URL, including CDN images -->
<img :src="project.cimg" :alt="project.name" loading="lazy" />
```

**✅ Applied to:**
- `EventCard.vue` - Event card images
- `PostCard.vue` - Post card images  
- `ItemCard.vue` (clist) - Background images
- `ItemRow.vue` (clist) - Thumbnail images
- `ItemTile.vue` (clist) - Tile background images

**❌ NOT applied to:**
- `Hero.vue` - Hero images are above the fold and critical for LCP (Largest Contentful Paint)
- `CardHero.vue` - Same reason as Hero.vue

**Note on CDN Images**: The `loading="lazy"` attribute works perfectly with external CDN URLs (like Cloudinary). The browser delays the HTTP request to the CDN until the image is near the viewport, which:
- Reduces initial bandwidth usage
- Lowers CDN costs (images below fold aren't fetched unless user scrolls)
- Improves page load time
- Better Core Web Vitals scores

2. **Parallel Data Fetching** (Already implemented)
```typescript
await Promise.all([
  fetchPosts(),
  fetchEvents(),
  fetchProjects(),
  fetchUsers()
])
```

3. **Code Splitting** for heavy components
```typescript
const AdminMenu = defineAsyncComponent(() => import('@/components/AdminMenu.vue'))
```

**Effort**: Low-Medium (1-2 days)
**Risk**: Low
**Benefit**: Faster page loads = better SEO + user experience

## ❌ NOT Required for 3-6 Month Timeline

These are **not essential** for the temporary implementation:

1. **Full Vue SSR/Nuxt Migration** - Too complex for timeline
2. **Structured Data (JSON-LD)** - Nice-to-have, not critical
3. **PWA/Service Workers** - Planned for admin SPA, not needed for public sites
4. **hreflang Tags** - Only needed if multi-language support required
5. **HTTP/2 Push** - Premature optimization
6. **Critical CSS Inlining** - Not worth effort for short timeline

## Implementation Roadmap

### Week 1: Critical Items
- [ ] Implement Nitro SSR middleware for meta tags (Priority 1)
- [ ] Generate dynamic sitemap.xml (Priority 2)
- [ ] Add robots.txt (Priority 3)

### Week 2: Polish
- [ ] Add canonical URLs (Priority 4)
- [ ] Implement lazy loading for images (Priority 5)
- [ ] Add code splitting for heavy components (Priority 5)

### Week 3: Testing & Validation
- [ ] Test social media sharing on Facebook/Twitter/LinkedIn
- [ ] Submit sitemap to Google Search Console
- [ ] Run Lighthouse audits for performance
- [ ] Validate meta tags with crawlers

## Testing Checklist

### Before Deployment
- [ ] Test meta tags with Facebook debugger: https://developers.facebook.com/tools/debug/
- [ ] Test Twitter cards: https://cards-dev.twitter.com/validator
- [ ] Verify sitemap.xml loads: https://theaterpedia.org/sitemap.xml
- [ ] Check robots.txt: https://theaterpedia.org/robots.txt
- [ ] Run Lighthouse SEO audit (target: 90+ score)
- [ ] Test canonical URLs are correct
- [ ] Verify page titles in browser tabs

### After Deployment
- [ ] Submit sitemap to Google Search Console
- [ ] Monitor crawl errors in Search Console
- [ ] Check indexed pages after 1 week
- [ ] Monitor Core Web Vitals
- [ ] Test social sharing previews in real posts

## Nitro SSR Implementation Details

### Current Setup
Crearis-vue uses **Nitro 3.0** which has built-in SSR capabilities. We can leverage these without full Vue SSR:

```typescript
// nitro.config.ts
export default defineNitroConfig({
  preset: 'node-server',
  serveStatic: true,
  compressPublicAssets: true,
  
  // Enable SSR for specific routes
  prerender: {
    routes: [
      '/',
      '/getstarted',
      '/blog',
      '/events',
      '/projects',
      '/team',
      '/search'
    ]
  }
})
```

### Meta Tag Injection Strategy

Instead of full Vue SSR, use **strategic HTML injection** for meta tags only:

```typescript
// server/utils/seo-render.ts
export function injectMetaTags(html: string, meta: SeoMeta): string {
  const metaTags = `
    <title>${meta.title}</title>
    <meta name="description" content="${meta.description}">
    <meta name="keywords" content="${meta.keywords}">
    <meta property="og:title" content="${meta.ogTitle}">
    <meta property="og:description" content="${meta.ogDescription}">
    <meta property="og:image" content="${meta.ogImage}">
    <meta name="twitter:card" content="${meta.twitterCard}">
    <link rel="canonical" href="${meta.canonical}">
  `
  
  // Inject before </head>
  return html.replace('</head>', `${metaTags}\n</head>`)
}
```

This approach:
- ✅ Works with existing Vue SPA
- ✅ No major architecture changes
- ✅ Satisfies social media scrapers
- ✅ Improves crawler visibility
- ✅ Minimal implementation effort

## Monitoring & Analytics

### Essential Tracking
1. **Google Search Console**
   - Monitor crawl errors
   - Track indexed pages
   - Review search queries

2. **Google Analytics 4**
   - Page views and engagement
   - Referral sources
   - User behavior flow

3. **Lighthouse CI**
   - Automated performance testing
   - SEO score tracking
   - Accessibility checks

### Key Metrics to Track
- SEO score (target: 90+)
- Page load time (target: < 3s)
- First Contentful Paint (target: < 1.8s)
- Indexed pages count
- Organic search traffic

## Conclusion

The **minimum viable SEO implementation** for 3-6 months requires:

1. ✅ **Already Complete**: Client-side meta tags, home route config, project site SEO
2. 🔴 **Critical**: Server-side meta tag rendering via Nitro middleware
3. 🔴 **Critical**: Sitemap.xml generation
4. 🟡 **Important**: robots.txt, canonical URLs, performance optimization

**Total Implementation Time**: ~5-7 days for critical items

This approach provides **80% of SEO benefits with 20% of the effort** compared to a full SSR rewrite, making it ideal for the 3-6 month migration timeline.

---


## If we want to pre-rendering Project Sites - Technical Analysis

### Current Challenge

Your project sites use dynamic routes: `/sites/:domaincode`

To pre-render these, the build tool needs to know **all possible domaincode values** at build time.

### Solution Approach

**Yes, if you export projects to a TS file**, you can pre-render them. Here's how:

#### Option 1: Static Route List in nitro.config.ts

```typescript
// nitro.config.ts
import { projects } from './src/config/projects' // Your exported projects

export default defineNitroConfig({
  preset: 'node-server',
  serveStatic: true,
  compressPublicAssets: true,
  
  prerender: {
    routes: [
      // Static home routes
      '/',
      '/getstarted',
      '/blog',
      '/events',
      '/projects',
      '/team',
      '/search',
      
      // Dynamic project sites from TS file
      ...projects.map(p => `/sites/${p.domaincode}`)
    ]
  }
})
```

#### Option 2: Dynamic Route Discovery Function

```typescript
// nitro.config.ts
export default defineNitroConfig({
  preset: 'node-server',
  
  prerender: {
    // Function that returns routes to pre-render
    routes: async () => {
      // Import your projects data
      const { projects } = await import('./src/config/projects')
      
      return [
        '/',
        '/getstarted',
        // ... other static routes
        ...projects.map(p => `/sites/${p.domaincode}`)
      ]
    }
  }
})
```

#### Option 3: Fetch from Database at Build Time

```typescript
// nitro.config.ts
export default defineNitroConfig({
  prerender: {
    routes: async () => {
      // Import your database adapter
      const { getDatabase } = await import('./server/database/index')
      const db = await getDatabase()
      
      // Fetch all published projects
      const projects = await db.all(
        'SELECT domaincode FROM projects WHERE status = "published"'
      )
      
      return [
        '/',
        '/getstarted',
        ...projects.map(p => `/sites/${p.domaincode}`)
      ]
    }
  }
})
```

### Pros and Cons

#### ✅ Advantages of Pre-rendering Project Sites:

1. **Instant Load** - HTML ready immediately, no API calls needed
2. **Perfect SEO** - All content visible to crawlers on first request
3. **CDN-friendly** - Static HTML files can be cached at edge locations
4. **Lower Server Load** - No dynamic rendering needed
5. **Social Media** - Open Graph tags work perfectly for sharing

#### ❌ Disadvantages:

1. **Stale Data** - Pre-rendered at build time, doesn't reflect live updates
2. **Build Time** - If you have 100+ projects, build takes longer
3. **Deployment Complexity** - Need to rebuild and redeploy to update content
4. **Storage** - Each project generates a separate HTML file

### Hybrid Approach (Recommended)

The **best solution** for your use case:

```typescript
// nitro.config.ts
export default defineNitroConfig({
  prerender: {
    routes: async () => {
      const { projects } = await import('./src/config/projects')
      
      // Only pre-render "important" or "featured" projects
      const featuredProjects = projects
        .filter(p => p.config?.featured === true || p.status === 'published')
        .map(p => `/sites/${p.domaincode}`)
      
      return [
        '/',
        '/getstarted',
        ...featuredProjects
      ]
    }
  },
  
  // Enable ISR (Incremental Static Regeneration) - if using Netlify/Vercel
  routeRules: {
    '/sites/**': {
      swr: 3600, // Cache for 1 hour, then regenerate in background
    }
  }
})
```

### Your Projects TS File Structure

You'd need something like:

```typescript
// src/config/projects.ts
export interface ProjectSummary {
  domaincode: string
  name: string
  status: 'draft' | 'published'
  config?: {
    featured?: boolean
    seo_title?: string
    seo_description?: string
  }
}

export const projects: ProjectSummary[] = [
  {
    domaincode: 'munich-festival',
    name: 'Munich Theatre Festival',
    status: 'published',
    config: { featured: true }
  },
  // ... more projects
]
```

### Implementation Steps

1. **Export projects to TS file** (from database or manual)
2. **Update nitro.config.ts** with prerender routes
3. **Run build**: `pnpm run build` (Nitro will pre-render automatically)
4. **Deploy** the .output directory

### When This Makes Sense

Pre-rendering is ideal if:
- ✅ You have a **manageable number** of projects (< 100)
- ✅ Content **doesn't change frequently** (daily/weekly is fine, not hourly)
- ✅ You have a **CI/CD pipeline** to rebuild on content updates
- ✅ You want **maximum SEO performance**

### When NOT to Pre-render

Skip pre-rendering if:
- ❌ You have **hundreds of projects** (slow builds)
- ❌ Content updates **frequently** (multiple times per day)
- ❌ You need **real-time data** from ODOO API
- ❌ Projects have **user-specific content** (personalization)

### My Recommendation for Theaterpedia

Given your architecture ("under migration", ODOO API-centric, 3-6 month timeline):

**Use Priority 1 (Server-Side Meta Tag Injection)** instead of pre-rendering because:

1. More flexible during migration period
2. Always shows latest ODOO data
3. Simpler deployment (no rebuild needed for updates)
4. Still satisfies social media scrapers with server-side meta tags

Then **consider pre-rendering later** once architecture stabilizes.

Would you like me to create an example configuration for pre-rendering project sites with a projects TS file?
