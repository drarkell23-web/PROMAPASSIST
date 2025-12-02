// main.js
// DFifty PRO orchestration: UI wiring + surfaces list + autosave

(function () {
  const CANVAS_ID = "mapperCanvas";

  window.addEventListener("DOMContentLoaded", () => {
    try {
      // Ensure DFifty core
      if (!window.DFifty) window.DFifty = {};
      if (!Array.isArray(window.DFifty.meshSurfaces)) {
        window.DFifty.meshSurfaces = [];
      }

      // Init rendering + GPU + laser
      if (window.Renderer2D) Renderer2D.init(CANVAS_ID);
      if (window.GPUWarp) GPUWarp.init(CANVAS_ID);
      if (window.LaserOutput) LaserOutput.init("ws://localhost:3000");

      // Default grid snap
      if (window.LockGrid) LockGrid.setGridSize(0.25);

      // Create defaults if no surfaces yet
      const ss = window.DFifty.meshSurfaces;
      if (!ss.length) {
        MappingEngine.createDefaultSurface({
          name: "Surface 1",
          meshDetail: 4
        });
        MappingEngine.createDefaultSurface({
          name: "Surface 2",
          meshDetail: 4,
          offsetX: 0.3
        });
      }

      // Hook UI
      hookUI();

      // Initial UI refresh
      refreshSurfaces();
      refreshInspector();

      // Autosave every 10s
      setInterval(doAutosave, 10000);
    } catch (e) {
      console.error("[main] init error", e);
    }
  });

  // ==== UI HOOKS ===========================================================

  function hookUI() {
    const addBtn = document.getElementById("add-surface");
    const dupBtn = document.getElementById("duplicate-surface");
    const expBtn = document.getElementById("btn-export");
    const saveBtn = document.getElementById("btn-save");
    const loadBtn = document.getElementById("btn-load");
    const runBtn = document.getElementById("btn-run");
    const meshSel = document.getElementById("mesh-detail");
    const snapSel = document.getElementById("grid-snap");
    const addProjBtn = document.getElementById("add-projector");

    if (addBtn) {
      addBtn.addEventListener("click", () => {
        MappingEngine.createDefaultSurface({});
        refreshSurfaces();
        updateStatus("Added surface");
      });
    }

    if (dupBtn) {
      dupBtn.addEventListener("click", () => {
        const s = getActiveSurface();
        if (s) {
          MappingEngine.duplicateSurface(s.id);
          refreshSurfaces();
          updateStatus("Duplicated " + s.name);
        }
      });
    }

    if (expBtn) {
      expBtn.addEventListener("click", () => {
        const data = MappingEngine.export(); // alias to exportJSON
        const blob = new Blob([data], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "project.json";
        a.click();
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        doAutosave(true);
      });
    }

    if (loadBtn) {
      loadBtn.addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json";
        input.onchange = async e => {
          const f = e.target.files[0];
          if (!f) return;
          const txt = await f.text();
          try {
            const obj = JSON.parse(txt);
            if (obj.surfaces) {
              window.DFifty.meshSurfaces.length = 0;
              obj.surfaces.forEach(s => window.DFifty.meshSurfaces.push(s));
              refreshSurfaces();
              updateStatus("Project loaded");
            }
          } catch (err) {
            console.error("load error", err);
            alert("Invalid project JSON");
          }
        };
        input.click();
      });
    }

    if (runBtn) {
      runBtn.addEventListener("click", () => {
        // placeholder for future “render / send to laser” action
        updateStatus("Render triggered");
      });
    }

    if (meshSel) {
      meshSel.addEventListener("change", e => {
        const s = getActiveSurface();
        if (!s) return;
        const detail = Number(e.target.value || 4);
        MappingEngine.setMeshDetail(s, detail);
        refreshSurfaces();
        updateStatus("Mesh detail: " + detail);
      });
    }

    if (snapSel) {
      snapSel.addEventListener("change", e => {
        const v = parseFloat(e.target.value || "0");
        if (window.LockGrid) LockGrid.setGridSize(v);
        updateStatus("Snap grid: " + (v || "off"));
      });
    }

    if (addProjBtn) {
      addProjBtn.addEventListener("click", () => {
        if (!window.ProjectorManager) return;
        const p = ProjectorManager.add({ name: "Projector " + (ProjectorManager.list().length + 1) });
        refreshProjectors();
        updateStatus("Added projector " + p.name);
      });
    }
  }

  // ==== HELPERS ===========================================================

  function getActiveSurface() {
    const ss = window.DFifty.meshSurfaces || [];
    return ss[0] || null; // simple: first surface is "active"
  }

  function refreshSurfaces() {
    const container = document.getElementById("surface-list");
    if (!container) return;
    container.innerHTML = "";

    const ss = window.DFifty.meshSurfaces || [];
    ss.forEach((s, idx) => {
      const row = document.createElement("div");
      row.className = "row";
      row.style.justifyContent = "space-between";
      row.style.padding = "6px";
      row.style.borderBottom = "1px solid rgba(255,255,255,0.07)";

      const left = document.createElement("div");
      left.innerHTML =
        "<strong>" +
        s.name +
        "</strong><div class=\"small\">" +
        s.id +
        "</div>";

      const right = document.createElement("div");

      const freeze = document.createElement("button");
      freeze.textContent = "🔒";
      freeze.title = "Freeze";
      freeze.onclick = () => {
        if (window.LockGrid) LockGrid.freeze(s.id);
        s.__df_frozen = true;
        updateStatus("Frozen " + s.name);
      };

      const unlock = document.createElement("button");
      unlock.textContent = "🔓";
      unlock.title = "Unlock";
      unlock.onclick = () => {
        if (window.LockGrid) LockGrid.unfreeze(s.id);
        s.__df_frozen = false;
        updateStatus("Unlocked " + s.name);
      };

      const solo = document.createElement("button");
      solo.textContent = "◎";
      solo.title = "Solo";
      solo.onclick = () => {
        ss.forEach(x => (x.__solo = false));
        s.__solo = true;
        updateStatus("Solo " + s.name);
      };

      const del = document.createElement("button");
      del.textContent = "🗑";
      del.title = "Delete";
      del.onclick = () => {
        MappingEngine.deleteSurface(s.id);
        refreshSurfaces();
        updateStatus("Deleted " + s.name);
      };

      right.appendChild(freeze);
      right.appendChild(unlock);
      right.appendChild(solo);
      right.appendChild(del);

      row.appendChild(left);
      row.appendChild(right);
      container.appendChild(row);
    });
  }

  function refreshProjectors() {
    const container = document.getElementById("projector-list");
    if (!container || !window.ProjectorManager) return;
    container.innerHTML = "";

    const list = ProjectorManager.list();
    list.forEach(p => {
      const row = document.createElement("div");
      row.className = "row";
      row.style.justifyContent = "space-between";
      row.style.padding = "4px 0";
      row.innerHTML =
        "<div class=\"small\">" +
        p.name +
        " (" +
        p.width +
        "×" +
        p.height +
        ")</div>";
      container.appendChild(row);
    });
  }

  function refreshInspector() {
    const el = document.getElementById("inspector");
    if (!el) return;
    const s = getActiveSurface();
    if (!s) {
      el.innerHTML = "<div class=\"small\">No surface selected</div>";
      return;
    }
    el.innerHTML =
      "<div class=\"small\">Active surface: <strong>" +
      s.name +
      "</strong></div>" +
      "<div class=\"small\">Points: " +
      (s.points ? s.points.length : 0) +
      "</div>";
  }

  function updateStatus(msg) {
    const el = document.getElementById("status-line");
    if (el) el.textContent = msg;
    setTimeout(() => {
      if (el) el.textContent = "Ready";
    }, 2000);
  }

  function doAutosave(force) {
    try {
      const data = MappingEngine.export(); // alias to exportJSON
      if (window.localStorage) {
        localStorage.setItem("dfifty_pro_autosave", data);
      }
      // optional backend save (if server.js is running)
      fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: data
      }).catch(() => {});
      if (force) updateStatus("Saved");
    } catch (e) {
      console.warn("autosave error", e);
    }
  }
})();
