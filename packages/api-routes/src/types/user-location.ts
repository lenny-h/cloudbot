/**
 * User location derived from Cloudflare Workers' `request.cf` properties.
 * These are automatically populated by Cloudflare's edge network on every request,
 * requiring zero additional API calls or client-side geolocation.
 *
 * @see https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties
 */
export interface UserLocation {
  city?: string;
  region?: string;
  regionCode?: string;
  country?: string;
  timezone?: string;
  latitude?: string;
  longitude?: string;
}
