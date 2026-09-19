# RwandaQuest Tours

Public website, admin dashboard, and Node API for [rwandaquesttours.com](https://rwandaquesttours.com).

| App | Folder | Live host |
| --- | --- | --- |
| Public site | `travel-app` | [rwandaquesttours.com](https://rwandaquesttours.com) |
| Admin | `shadcn-admin` | [admin.rwandaquesttours.com](https://admin.rwandaquesttours.com) |
| API | `backend` | [backend.rwandaquesttours.com](https://backend.rwandaquesttours.com) |

Both frontends call `https://backend.rwandaquesttours.com` by default (see `travel-app/.env.production` and `shadcn-admin/.env.production`). Override only if you run the API locally.

## Run locally

Needs **Node 18+** and **npm**. MySQL is required only if you run the API yourself.

```bash
git clone https://github.com/shemagithub/juju.git
cd juju
```

### Public site (port 3000)

```bash
cd travel-app
npm install
npm start
```

### Admin (port 5173)

```bash
cd shadcn-admin
cp .env.example .env.development   # already points at the live API
npm install
npm run dev
```

Sign in with the staff account created in the backend (local seed defaults: `superadmin@tourism.local` / `ChangeMe123!`).

### API (port 4000)

```bash
cd backend
cp .env.example .env
# set MYSQL_* and SMTP_* for your machine
npm install
npm run dev
```

To point the site or admin at this local API:

- travel-app: `REACT_APP_API_URL=http://localhost:4000` in `travel-app/.env`
- admin: `VITE_API_URL=http://localhost:4000` in `shadcn-admin/.env.development`

## Production builds (cPanel)

Apache needs `mod_rewrite`. Each app already includes `public/.htaccess` so SPA routes (`/blog`, `/sign-in`, …) fall back to `index.html`.

**Website** — extract the `travel-app/build` files into `public_html` (so `index.html` and `.htaccess` sit at the document root):

```bash
cd travel-app
npm ci
CI=false npm run build
cd build && zip -r ../../rwandaquest-frontend.zip .
```

**Admin** — extract `shadcn-admin/dist` into the admin subdomain document root:

```bash
cd shadcn-admin
npm ci
npx vite build
cd dist && zip -r ../../rwandaquest-admin.zip .
```

Do not mix old `static/` or `assets/` files with a new extract. Show hidden files in cPanel so `.htaccess` is not missing.

The API stays on `backend.rwandaquesttours.com`. CORS already allows the public site and `https://admin.rwandaquesttours.com`.
