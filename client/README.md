Client (static) for Chani & Esther Project

How to use:
- Serve the files in `Project/client` (e.g., open `index.html` in browser or serve with a static server).
- The client expects backend at http://localhost:3000
- Features: login, register, student and teacher dashboards (create assignment, submit, view submissions, averages)

Notes:
- Token is stored in localStorage as returned by /auth/login (format: "Bearer <token>").
- Role detection is done by decoding JWT payload in-browser (not secure for production).
