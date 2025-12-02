(function(){
  window.ProjectorManager = window.ProjectorManager || {};
  const PM = window.ProjectorManager;
  PM.list = function(){ window.DFifty.projectors = window.DFifty.projectors||[]; return window.DFifty.projectors; };
  PM.add = function(opts){ const p = { id:'p_'+Math.random().toString(36).slice(2,8), name: opts.name||'Projector', width: opts.width||1920, height: opts.height||1080, assigned: [] }; PM.list().push(p); return p; };
  PM.remove = function(id){ const list=PM.list(); const i=list.findIndex(x=>x.id===id); if(i>=0) list.splice(i,1); };
  PM.assignSurface = function(projectorId, surfaceId){ const p=PM.list().find(x=>x.id===projectorId); if(!p) return; if(!p.assigned) p.assigned=[]; if(!p.assigned.includes(surfaceId)) p.assigned.push(surfaceId); };
  PM.exportProjector = function(id){ const p=PM.list().find(x=>x.id===id); if(!p) return null; const surfaces = (p.assigned||[]).map(sid=> (window.DFifty.meshSurfaces||[]).find(s=>s.id===sid)).filter(Boolean); return {projector:p, surfaces}; };
  console.info('ProjectorManager ready');
  window.ProjectorManager = PM;
})();
