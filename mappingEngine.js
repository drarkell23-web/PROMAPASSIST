// mappingEngine.js
// DFifty PRO mapping core — authoritative mesh generator + model manager
// 4 / 8 / 16 / 32 point DFIFTY-style meshes

(function () {
  console.log("[DFifty] MappingEngine loaded");

  // namespace
  const ME = {};
  window.MappingEngine = ME;

  // ---------------------------------------------------------------------------
  // INTERNAL HELPERS
  // ---------------------------------------------------------------------------
  function getSurfaces() {
    if (window.DFifty && Array.isArray(window.DFifty.meshSurfaces)) {
      return window.DFifty.meshSurfaces;
    }
    if (!window.surfaces) window.surfaces = [];
    return window.surfaces;
  }

  function makeId() {
    return "s_" + Math.random().toString(36).substring(2, 9);
  }

  // Grid definitions (DFifty-accurate)
  function resolveGrid(n) {
    n = Number(n) || 4;

    switch (n) {
      case 4:  return { rows: 2, cols: 2 };
      case 8:  return { rows: 2, cols: 4 }; // wide quad
      case 16: return { rows: 4, cols: 4 };
      case 32: return { rows: 4, cols: 8 };
      default: {
        // fallback generic square-ish grid
        const root = Math.round(Math.sqrt(n));
        const rows = root;
        const cols = Math.max(2, Math.round(n / root));
        return { rows, cols };
      }
    }
  }

  function createGridPoints(rows, cols, left, top, width, height) {
    const pts = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const u = c / (cols - 1);
        const v = r / (rows - 1);
        pts.push({
          x: left + u * width,
          y: top + v * height
        });
      }
    }
    return pts;
  }

  function computeBounds(points) {
    if (!points || !points.length) {
      return { left: -0.2, top: -0.2, width: 0.4, height: 0.4 };
    }
    let minX = points[0].x;
    let maxX = points[0].x;
    let minY = points[0].y;
    let maxY = points[0].y;

    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    return {
      left: minX,
      top: minY,
      width: (maxX - minX) || 0.4,
      height: (maxY - minY) || 0.4
    };
  }

  // ---------------------------------------------------------------------------
  // CREATE SURFACE
  // ---------------------------------------------------------------------------
  ME.createDefaultSurface = function (opts = {}) {
    const surfaces = getSurfaces();
    const id = makeId();

    const meshDetail = Number(opts.meshDetail || 4);
    const grid = resolveGrid(meshDetail);

    const width = opts.width || 0.35;
    const height = opts.height || 0.25;

    const ox = opts.offsetX || 0;
    const oy = opts.offsetY || 0;

    const left = -width / 2 + ox;
    const top = -height / 2 + oy;

    const points = createGridPoints(grid.rows, grid.cols, left, top, width, height);

    const surface = {
      id,
      name: opts.name || `Surface ${surfaces.length + 1}`,
      meshDetail,
      meshRows: grid.rows,
      meshCols: grid.cols,
      points,
      color: opts.color || "#00ffc6",
      opacity: opts.opacity ?? 1.0,
      visible: true,
      locked: false,
      __solo: false
    };

    surfaces.push(surface);

    // Protect points array
    if (typeof window.wrapPoints === "function") {
      wrapPoints(surface);
    }

    return surface;
  };

  // ---------------------------------------------------------------------------
  // DELETE SURFACE
  // ---------------------------------------------------------------------------
  ME.deleteSurface = function (id) {
    const surfaces = getSurfaces();
    const i = surfaces.findIndex(s => s.id === id);
    if (i !== -1) surfaces.splice(i, 1);
  };

  // ---------------------------------------------------------------------------
  // DUPLICATE SURFACE
  // ---------------------------------------------------------------------------
  ME.duplicateSurface = function (id) {
    const surfaces = getSurfaces();
    const src = surfaces.find(s => s.id === id);
    if (!src) return null;

    const copy = JSON.parse(JSON.stringify(src));
    copy.id = makeId();
    copy.name = src.name + " Copy";

    // small offset so it doesn't overlap
    copy.points.forEach(p => {
      p.x += 0.05;
      p.y += 0.05;
    });

    surfaces.push(copy);

    if (typeof wrapPoints === "function") {
      wrapPoints(copy);
    }

    return copy;
  };

  // ---------------------------------------------------------------------------
  // MESH DETAIL CHANGE (DFifty-exact)
  // ---------------------------------------------------------------------------
  ME.setMeshDetail = function (surfaceOrId, meshDetail) {
    const surfaces = getSurfaces();
    const s = typeof surfaceOrId === "string"
      ? surfaces.find(x => x.id === surfaceOrId)
      : surfaceOrId;

    if (!s) return;

    const detail = Number(meshDetail) || 4;
    const grid = resolveGrid(detail);

    const bounds = computeBounds(s.points);

    const pts = createGridPoints(
      grid.rows,
      grid.cols,
      bounds.left,
      bounds.top,
      bounds.width,
      bounds.height
    );

    s.meshDetail = detail;
    s.meshRows = grid.rows;
    s.meshCols = grid.cols;
    s.points = pts;

    if (typeof wrapPoints === "function") {
      wrapPoints(s);
    }
  };

  // ---------------------------------------------------------------------------
  // EXPORT PROJECT AS JSON (DFifty compatible)
  // ---------------------------------------------------------------------------
  ME.exportJSON = function () {
    const surfaces = getSurfaces();
    return JSON.stringify(
      {
        format: "DFIFTY-PRO",
        version: 1,
        surfaces,
        meta: {
          exportedAt: new Date().toISOString()
        }
      },
      null,
      2
    );
  };

  // backward compatibility for main.js
  ME.export = ME.exportJSON;

  // ---------------------------------------------------------------------------
  // IMPORT PROJECT
  // ---------------------------------------------------------------------------
  ME.importJSON = function (obj) {
    if (!obj || !obj.surfaces) return false;
    const surfaces = getSurfaces();
    surfaces.length = 0;
    obj.surfaces.forEach(s => {
      surfaces.push(s);
      if (typeof wrapPoints === "function") wrapPoints(s);
    });
    return true;
  };

  // ---------------------------------------------------------------------------
  // GET SURFACES PUBLIC API
  // ---------------------------------------------------------------------------
  ME.getSurfaces = getSurfaces;

})();
