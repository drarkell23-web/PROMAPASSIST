// dfiftyCoreShim.js
// Canonical DFifty runtime + live surfaces proxy

(function () {
  if (window.DFifty) return;

  const DF = {};
  DF.meshSurfaces = Array.isArray(window.surfaces) ? window.surfaces : [];
  DF.projectors = [];
  DF.projectorSurfaces = [];
  DF.viewParams = {
    widthPx: 1600,
    heightPx: 900,
    scale: 1,
    offsetX: 0,
    offsetY: 0
  };
  DF.lockGrid = {
    enabled: true,
    gridSize: 0.25,
    frozenSurfaces: new Set(),
    lockedSurfaces: new Set()
  };

  Object.defineProperty(window, "surfaces", {
    configurable: true,
    enumerable: true,
    get() {
      return DF.meshSurfaces;
    },
    set(v) {
      if (Array.isArray(v)) {
        DF.meshSurfaces.length = 0;
        v.forEach(x => DF.meshSurfaces.push(x));
      }
    }
  });

  window.DFifty = DF;
  console.info("[DFifty] Core shim initialized");
})();
