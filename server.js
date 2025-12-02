const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/save', (req,res)=>{
  try{ fs.writeFileSync(path.join(__dirname,'autosave_project.json'), JSON.stringify(req.body,null,2)); res.json({ok:true}); }catch(e){ res.status(500).json({ok:false,error:e.message}); }
});

wss.on('connection', ws => {
  console.log('ws connected');
  ws.on('message', msg => {
    try{ const d = JSON.parse(msg); if(d.type==='frame'){ // echo
      wss.clients.forEach(c=>{ if(c.readyState===WebSocket.OPEN) c.send(JSON.stringify({type:'frame', payload:d.payload})); });
    } }catch(e){}
  });
});

const port = process.env.PORT||3000;
server.listen(port, ()=> console.log('DFifty PRO server listening on', port));
