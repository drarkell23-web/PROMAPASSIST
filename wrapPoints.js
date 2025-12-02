// wrapPoints.js
// Protects surface.points so locked / frozen surfaces NEVER move

function wrapPoints(surface) {
  if (!surface || !Array.isArray(surface.points)) return surface.points;
  if (surface.__pointsProxy) return surface.__pointsProxy;

  const arr = surface.points;

  const handler = {
    set(target, prop, value) {
      // intercept numeric index writes only
      if (typeof prop === "string" && /^\d+$/.test(prop)) {
        const DF = window.DFifty || {};
        const lg = DF.lockGrid || {
          frozenSurfaces: new Set(),
          lockedSurfaces: new Set()
        };

        const isFrozen =
          lg.frozenSurfaces && lg.frozenSurfaces.has(surface.id);
        const isLocked =
          surface.locked ||
          (lg.lockedSurfaces && lg.lockedSurfaces.has(surface.id));

        if (isFrozen || isLocked) {
          // silently ignore writes
          return true;
        }
      }

      // everything else is allowed
      target[prop] = value;
      return true;
    },
    get(target, prop) {
      const v = target[prop];
      return typeof v === "function" ? v.bind(target) : v;
    }
  };

  const proxy = new Proxy(arr, handler);
  surface.__pointsProxy = proxy;
  surface.points = proxy;
  return proxy;
}

window.wrapPoints = wrapPoints;
console.info("[DFifty] wrapPoints proxy active");
