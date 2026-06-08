/** True when built with vite.config.static.js for GitLab Pages / browser prototype. */
export const isStaticBuild = import.meta.env.VITE_STATIC_BUILD === 'true';
