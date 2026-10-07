const WALKING_MINUTES_PER_KM = 13;

export function googleMapsDirectionsUrl({ lat, lng }) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function estimateWalk() {
  const km = (Math.random() * 1.6 + 0.4).toFixed(1);
  return { km, minutes: Math.round(km * WALKING_MINUTES_PER_KM) };
}
