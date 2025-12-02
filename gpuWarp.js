(function(){
  window.GPUWarp = window.GPUWarp || {};
  const G = window.GPUWarp;
  G.init = function(canvasId){
    try{
      const canvas = document.getElementById(canvasId);
      const gl = canvas.getContext('webgl2');
      if(!gl){ console.warn('GPUWarp: WebGL2 unavailable'); return; }
      G.gl = gl; G.canvas = canvas;
      // basic passthrough shader
      const vs = `#version 300 es
in vec2 a; out vec2 uv; void main(){ uv = a*0.5+0.5; gl_Position = vec4(a,0,1); }`;
      const fs = `#version 300 es
precision highp float; in vec2 uv; out vec4 o; void main(){ o = vec4(uv,0.0,1.0); }`;
      function compile(type, src){ const s = gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s); if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s)); return s; }
      const prog = gl.createProgram(); gl.attachShader(prog, compile(gl.VERTEX_SHADER,vs)); gl.attachShader(prog, compile(gl.FRAGMENT_SHADER,fs)); gl.linkProgram(prog);
      G.prog = prog;
      // quad
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
      G.buf = buf;
      console.info('GPUWarp init');
    }catch(e){ console.warn('GPUWarp init error', e); }
  };
  window.GPUWarp = G;
})();
