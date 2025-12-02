(function(){
  window.LaserOutput = window.LaserOutput || {};
  const L = window.LaserOutput;
  L.init = function(wsUrl){
    L.wsUrl = wsUrl || 'ws://localhost:3000';
    try{ L.ws = new WebSocket(L.wsUrl); L.ws.onopen = ()=>console.info('Laser WS connected'); L.ws.onmessage = (m)=>{ /* ignore */ }; }catch(e){ console.warn('LaserOutput ws failed', e); }
  };
  L.sendFrame = function(frame){
    try{ if(L.ws && L.ws.readyState===1) L.ws.send(JSON.stringify({type:'frame', payload: frame})); else console.info('Laser ws not open'); }catch(e){ console.warn('sendFrame err', e); }
  };
  // ILDA dumper (client-side request to backend)
  L.dumpILDA = function(points, name){ fetch('/api/save', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name, points})}).then(r=>r.json()).then(()=>console.info('ilda dumped')).catch(e=>console.warn(e)); };
  window.LaserOutput = L;
})();
