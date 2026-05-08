/**
 * Backwards-compatible re-export of the unified axios client.
 *
 * The legacy implementation here:
 *  - read the JWT from `localStorage` (the rest of the app uses cookies),
 *  - did NOT send the `X-Branch-Id` header,
 *  - and on a 401 forced a hard `window.location` redirect that fought the
 *    React-router-driven auth flow.
 *
 * Everything in the app should use `@/lib/api/axios-config`. This module
 * exists only so existing imports keep working.
 */

import axiosInstance from "@/lib/api/axios-config";

export const api = axiosInstance;
export default axiosInstance;
