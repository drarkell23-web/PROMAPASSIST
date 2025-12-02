DFifty PRO — ROOT-Level Production Build
========================================

This package is a root-level professional projection-mapping build intended to be served from a Node/Express server.
Drop the entire folder on a server/host with Node installed and run:

  npm install express ws
  node server.js

Then open http://localhost:3000/index.html

Files are intentionally placed in the project root for compatibility with your workflow.
The UI is styled for a high-end pro look. Surfaces support lock/freeze via LockGrid and points are proxied to prevent writes when frozen/locked.

Notes:
- For real hardware laser output, integrate with your ILDA/laser driver safely.
- For production Electron builds, wrap this folder with electron-builder on Windows CI.
