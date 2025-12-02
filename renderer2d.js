// renderer2d.js
// DFifty-style triangle renderer with correct 4/8/16/32 meshes

(function () {
  const R = {};
  window.Renderer2D = R;

  let canvas, ctx;
  let width = 0,
    height = 0;

  let dragState = null; // { surfaceId, index }
  let hoverState = null;
  const PICK_RADIUS = 10;

  function getSurfaces() {
    if (window.DFifty && Array.isArray(window.DFifty.meshSurfaces)) {
      return window.DFifty.meshSurfaces;
    }
    window.surfaces = window.surfaces || [];
    return window.surfaces;
  }

  function isFrozenOrLocked(surface) {
    const DF = window.DFifty || {};
    const lg = DF.lockGrid || {
      frozenSurfaces: new Set(),
      lockedSurfaces: new Set()
    };

    const frozen = lg.frozenSurfaces && lg.frozenSurfaces.has(surface.id);
    const lockedFlag = surface.locked || (lg.lockedSurfaces && lg.lockedSurfaces.has(surface.id));

    return !!(frozen || lockedFlag);
  }

  function worldToScreen(pt) {
    return {
      x: Math.round(width * (0.5 + pt.x)),
      y: Math.round(height * (0.5 + pt.y))
    };
  }

  function screenToWorld(px, py) {
    return {
      x: px / width - 0.5,
      y: py / height - 0.5
    };
  }

  function getGrid(surface) {
    if (surface.meshRows && surface.meshCols) {
      return { rows: surface.meshRows, cols: surface.meshCols };
    }

    const count = surface.points ? surface.points.length : 4;
    const n = Number(surface.meshDetail || count) || 4;

    switch (n) {
      case 4:
        return { rows: 2, cols: 2 };
      case 8:
        return { rows: 2, cols: 4 };
      case 16:
        return { rows: 4, cols: 4 };
      case 32:
        return { rows: 4, cols: 8 };
      default: {
        const root = Math.round(Math.sqrt(count) || 2);
        const rows = root;
        const cols = Math.max(2, Math.round(count / rows));
        return { rows, cols };
      }
    }
  }

  function findHit(mx, my) {
    const surfaces = getSurfaces();
    for (const s of surfaces) {
      if (!s.visible) continue;
      if (isFrozenOrLocked(s)) continue;
      const pts = s.points || [];
      for (let i = 0; i < pts.length; i++) {
        const p = worldToScreen(pts[i]);
        const dx = p.x - mx;
        const dy = p.y - my;
        if (Math.hypot(dx, dy) <= PICK_RADIUS) {
          return { surfaceId: s.id, index: i };
        }
      }
    }
    return null;
  }

  function getSurfaceById(id) {
    return getSurfaces().find(s => s.id === id) || null;
  }

  function applySnap(worldPoint) {
    const DF = window.DFifty || {};
    const lg = DF.lockGrid || {};
    const size = Number(lg.gridSize || 0);
    if (!size) return worldPoint;
    return {
      x: Math.round(worldPoint.x / size) * size,
      y: Math.round(worldPoint.y / size) * size
    };
  }

  function onPointerDown(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = findHit(mx, my);
    if (hit) {
      dragState = hit;
    }
  }

  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (dragState) {
      const s = getSurfaceById(dragState.surfaceId);
      if (!s) return;
      if (isFrozenOrLocked(s)) return; // double safety
      const w = applySnap(screenToWorld(mx, my));
      const pt = s.points[dragState.index];
      pt.x = w.x;
      pt.y = w.y;
    } else {
      hoverState = findHit(mx, my);
    }
  }

  function onPointerUp() {
    dragState = null;
  }

  R.init = function (canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.warn("[Renderer2D] canvas not found:", canvasId);
      return;
    }
    ctx = canvas.getContext("2d");
    width = canvas.width;
    height = canvas.height;

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    function loop() {
      R.render();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    console.info("[Renderer2D] initialized on", canvasId);
  };

  // === The DFIFTY-style renderer ===
  R.render = function () {
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, width, height);

    // background
    ctx.fillStyle = "#050507";
    ctx.fillRect(0, 0, width, height);

    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const surfaces = getSurfaces();

    for (const s of surfaces) {
      if (!s.visible) continue;

      const pts = s.points || [];
      if (!pts.length) continue;

      const grid = getGrid(s);
      const rows = grid.rows;
      const cols = grid.cols;

      // --- Mesh fill via triangles ---
      ctx.globalAlpha = s.opacity != null ? s.opacity : 0.9;
      ctx.fillStyle = s.color || "#00ffc6";

      if (rows * cols <= pts.length) {
        for (let r = 0; r < rows - 1; r++) {
          for (let c2 = 0; c2 < cols - 1; c2++) {
            const iA = r * cols + c2;
            const iB = r * cols + (c2 + 1);
            const iC = (r + 1) * cols + c2;
            const iD = (r + 1) * cols + (c2 + 1);

            const A = worldToScreen(pts[iA]);
            const B = worldToScreen(pts[iB]);
            const C = worldToScreen(pts[iC]);
            const D = worldToScreen(pts[iD]);

            // Triangle ABC
            ctx.beginPath();
            ctx.moveTo(A.x, A.y);
            ctx.lineTo(B.x, B.y);
            ctx.lineTo(C.x, C.y);
            ctx.closePath();
            ctx.fill();

            // Triangle BDC
            ctx.beginPath();
            ctx.moveTo(B.x, B.y);
            ctx.lineTo(D.x, D.y);
            ctx.lineTo(C.x, C.y);
            ctx.closePath();
            ctx.fill();
          }
        }
      }

      // --- Outline ---
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2;
      ctx.strokeStyle = s.locked ? "#ffd56b" : (s.color || "#00ffc6");

      // Outline uses hull of four corners if 2x2 grid, otherwise skip heavy maths
      if (pts.length >= 4) {
        const A = worldToScreen(pts[0]);
        const B = worldToScreen(pts[cols - 1]);
        const C = worldToScreen(pts[pts.length - 1]);
        const D = worldToScreen(pts[pts.length - cols]);

        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.lineTo(C.x, C.y);
        ctx.lineTo(D.x, D.y);
        ctx.closePath();
        ctx.stroke();
      }

      // --- Handles + index labels ---
      const isFrozen = isFrozenOrLocked(s);

      pts.forEach((p, index) => {
        const sc = worldToScreen(p);
        const isHover =
          hoverState &&
          hoverState.surfaceId === s.id &&
          hoverState.index === index;

        const radius = isHover ? 8 : 6;

        ctx.beginPath();
        ctx.arc(sc.x, sc.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isFrozen ? "#dddddd" : "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "11px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(index), sc.x, sc.y - (radius + 9));
      });
    }
  };
})();
