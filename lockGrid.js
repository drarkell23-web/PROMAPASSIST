// lockGrid.js
// Authoritative lock / freeze system (DFifty-style)

(function () {
  if (!window.DFifty) window.DFifty = {};
  if (!window.DFifty.lockGrid) {
    window.DFifty.lockGrid = {
      enabled: true,
      gridSize: 0.25,
      frozenSurfaces: new Set(),
      lockedSurfaces: new Set()
    };
  }

  const LG = window.DFifty.lockGrid;

  window.LockGrid = {
    freeze(id) {
      LG.frozenSurfaces.add(id);
    },
    unfreeze(id) {
      LG.frozenSurfaces.delete(id);
    },
    lock(id) {
      LG.lockedSurfaces.add(id);
    },
    unlock(id) {
      LG.lockedSurfaces.delete(id);
    },
    isFrozen(id) {
      return LG.frozenSurfaces.has(id);
    },
    isLocked(id) {
      return LG.lockedSurfaces.has(id);
    },
    setGridSize(size) {
      LG.gridSize = Number(size) || 0;
    }
  };

  console.info("[DFifty] LockGrid ready");
})();
