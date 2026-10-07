import { MAP_CONFIG } from '../config/constants.js';
import { distanceMeters, estimateWalkMinutes } from './geo.js';

/**
 * Walking route from the public OSM foot router. Falls back to a straight line
 * with an estimated time when the service is unreachable.
 */
export async function getWalkingRoute(from, to) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MAP_CONFIG.routingTimeoutMs);
  try {
    const url = `${MAP_CONFIG.routingUrl}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Routing ${response.status}`);
    const data = await response.json();
    const route = data.routes?.[0];
    if (!route) throw new Error('Sin ruta');
    return {
      points: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      meters: route.distance,
      minutes: Math.max(1, Math.round(route.duration / 60)),
      approximate: false,
    };
  } catch {
    const meters = distanceMeters(from, to);
    return {
      points: [[from.lat, from.lng], [to.lat, to.lng]],
      meters,
      minutes: estimateWalkMinutes(meters),
      approximate: true,
    };
  } finally {
    clearTimeout(timer);
  }
}
