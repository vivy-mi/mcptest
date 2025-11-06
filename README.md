# Job Hunt System

This repository contains a Node.js + Express + SQLite project with a simple web UI:

- server.js: Express server exposing CRUD API for jobs and serving static assets
- seed.js: Inserts sample job data into the SQLite database
- public/: Frontend assets (index.html, main.js, style.css)
- package.json: Project scripts and dependencies

To run locally:

1. Install dependencies: `npm install`
2. Seed demo data (optional): `npm run seed`
3. Start the server: `npm run start`
4. Open http://localhost:3000/

Note: The database file `db.sqlite` is local-only and typically should be ignored in VCS. If you want to persist it, remove it from .gitignore.
