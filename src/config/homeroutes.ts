/**
 * Home Route SEO Configuration
 * 
 * Defines meta tags for Theaterpedia.org Network Homepage routes.
 * These routes serve as the central hub and search portal for the network.
 * 
 * Timeline: Temporary implementation for 3-6 months during migration.
 */

export interface HomeRouteMeta {
  path: string;
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
}

export const homeRoutes: Record<string, HomeRouteMeta> = {
  home: {
    path: '/',
    title: 'Theaterpedia - Theater Community Platform',
    description: 'Connecting artists, projects, and audiences in the world of theater. Discover theater projects, events, and community resources across the Theaterpedia network.',
    keywords: 'theater, theatre, community, platform, projects, events, artists, performances',
    ogTitle: 'Theaterpedia - Theater Community Platform',
    ogDescription: 'Connecting artists, projects, and audiences in the world of theater.',
    ogImage: 'https://res.cloudinary.com/little-papillon/image/upload/v1666847011/pedia_ipsum/core/theaterpedia.jpg',
    twitterCard: 'summary_large_image'
  },
  
  getstarted: {
    path: '/getstarted',
    title: 'Get Started - Theaterpedia',
    description: 'Register for conference events and join the Theaterpedia theater community. Start exploring theater projects and connecting with artists.',
    keywords: 'theater registration, conference, get started, join theaterpedia, theater events',
    ogTitle: 'Get Started - Theaterpedia',
    ogDescription: 'Register for conference events and join the Theaterpedia theater community.',
    twitterCard: 'summary'
  },
  
  blog: {
    path: '/blog',
    title: 'Blog - Theaterpedia',
    description: 'Read articles, insights, and stories from the Theaterpedia theater community. Explore the latest updates, project highlights, and industry news.',
    keywords: 'theater blog, articles, stories, news, insights, community updates',
    ogTitle: 'Theaterpedia Blog',
    ogDescription: 'Read articles and stories from the theater community.',
    twitterCard: 'summary_large_image'
  },
  
  team: {
    path: '/team',
    title: 'Team - Theaterpedia',
    description: 'Meet the Theaterpedia team and contributors. Learn about the people behind the platform and the theater community network.',
    keywords: 'team, contributors, about us, people, theaterpedia staff',
    ogTitle: 'Meet the Theaterpedia Team',
    ogDescription: 'Learn about the people behind the platform and the theater community network.',
    twitterCard: 'summary'
  },
  
  events: {
    path: '/events',
    title: 'Events - Theaterpedia',
    description: 'Discover upcoming theater events, performances, workshops, and conferences across the Theaterpedia network. Find events near you or online.',
    keywords: 'theater events, performances, workshops, conferences, theater calendar',
    ogTitle: 'Theater Events - Theaterpedia',
    ogDescription: 'Discover upcoming theater events, performances, and workshops across the network.',
    twitterCard: 'summary_large_image'
  },
  
  projects: {
    path: '/projects',
    title: 'Projects - Theaterpedia',
    description: 'Explore theater projects across the Theaterpedia network. Discover productions, research, and creative collaborations from the theater community.',
    keywords: 'theater projects, productions, research, collaborations, creative work',
    ogTitle: 'Theater Projects - Theaterpedia',
    ogDescription: 'Explore theater projects and creative collaborations across the network.',
    twitterCard: 'summary_large_image'
  },
  
  search: {
    path: '/search',
    title: 'Search - Theaterpedia',
    description: 'Search across the Theaterpedia network. Find theater projects, events, artists, and content from across the theater community.',
    keywords: 'search, find, discover, theater search, network search',
    ogTitle: 'Search Theaterpedia Network',
    ogDescription: 'Search across the theater community network for projects, events, and artists.',
    twitterCard: 'summary'
  }
};

/**
 * Get meta tags for a specific route
 */
export function getHomeRouteMeta(path: string): HomeRouteMeta | null {
  // Normalize path (remove trailing slash except for root)
  const normalizedPath = path === '/' ? '/' : path.replace(/\/$/, '');
  
  // Find matching route
  const route = Object.values(homeRoutes).find(r => r.path === normalizedPath);
  return route || null;
}

/**
 * Generate meta tags for use in SSR or client-side rendering
 */
export function generateMetaTags(meta: HomeRouteMeta): string {
  const tags: string[] = [];
  
  // Basic meta tags
  tags.push(`<title>${meta.title}</title>`);
  tags.push(`<meta name="description" content="${meta.description}">`);
  
  if (meta.keywords) {
    tags.push(`<meta name="keywords" content="${meta.keywords}">`);
  }
  
  // Open Graph tags
  tags.push(`<meta property="og:title" content="${meta.ogTitle || meta.title}">`);
  tags.push(`<meta property="og:description" content="${meta.ogDescription || meta.description}">`);
  tags.push(`<meta property="og:type" content="website">`);
  
  if (meta.ogImage) {
    tags.push(`<meta property="og:image" content="${meta.ogImage}">`);
  }
  
  // Twitter Card tags
  tags.push(`<meta name="twitter:card" content="${meta.twitterCard || 'summary'}">`);
  tags.push(`<meta name="twitter:title" content="${meta.ogTitle || meta.title}">`);
  tags.push(`<meta name="twitter:description" content="${meta.ogDescription || meta.description}">`);
  
  if (meta.ogImage) {
    tags.push(`<meta name="twitter:image" content="${meta.ogImage}">`);
  }
  
  return tags.join('\n  ');
}
