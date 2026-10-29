# BlogSphere

BlogSphere is a full-stack blogging platform for publishing stories and having thoughtful conversations. It uses a React and Vite client, an Express REST API, MongoDB, and cookie-based authentication.

## Features

- Register, sign in, sign out, and restore a session after refresh.
- Create, publish, edit, draft, and delete your own stories.
- Browse, search, category-filter, and paginate published stories.
- Keep search, category filters, and page selection in the URL so results can be bookmarked, shared, and restored with browser back/forward.
- Comment on stories, edit your own comments, and moderate comments on your own posts.
- See a writer profile, private dashboard, published story count, and comments received.
- Preview a story before publishing, see an estimated reading time, and get clearer draft and image feedback.
- Use responsive layouts, a skip link, keyboard-dismissible navigation, screen-reader announcements, readable text contrast, reduced-motion support, and friendly loading and empty states.
- Secure API defaults: bcrypt password hashing, HTTP-only JWT cookie, signed double-submit CSRF token, allowed-origin CORS, Helmet, rate limits, server-side validation, and ownership checks.

## Technology and architecture

- **Client:** React 19, Vite, React Router, Axios, Lucide React.
- **API:** Node.js 22.12+, Express 5, Mongoose, Zod, bcryptjs, JWT.
- **Data:** MongoDB. The app does not ship with permanent hardcoded post data.
- **Authentication:** A seven-day JWT lives in an HTTP-only cookie. A signed CSRF token is returned by `GET /api/auth/csrf` and must accompany write requests in `X-CSRF-Token`.

```text
client/src/        React pages, reusable components, auth context, API client, styles
server/src/config  Environment and MongoDB setup
server/src/models  User, Post, and Comment schemas
server/src/routes  REST route definitions
server/src/controllers  Request handling and authorization
server/src/middleware   Authentication, CSRF, and error handling
server/test/       API and authorization integration tests
```

## Data model

- **User:** display name, unique normalized email, bcrypt hash, optional profile image, timestamps. The hash is excluded from normal queries and API JSON.
- **Post:** title, unique URL slug, excerpt, body, author reference, category, up to eight tags, optional HTTPS cover image, published flag, timestamps. Indexes support author/category/published queries and text search fields.
- **Comment:** body, author reference, post reference, timestamps. Deleting a post deletes its comments.

Public profile endpoints only expose the author's name, profile image, and account creation date. An email address is returned only through the authenticated `/api/auth/me` endpoint for the signed-in user.

## API reference

All responses use JSON. Successful responses generally have `success: true`; errors have `success: false` and a readable `message`, with field-level `errors` for validation failures. Cookie-authenticated write requests need a valid CSRF cookie and matching `X-CSRF-Token` header. The browser client handles this automatically.

| Method and path | Purpose | Authentication | Request body / query |
| --- | --- | --- | --- |
| `GET /api/health` | Check API status | No | — |
| `GET /api/auth/csrf` | Issue CSRF token cookie | No | — |
| `POST /api/auth/register` | Create account and sign in | CSRF | `{ name, email, password, passwordConfirmation }` |
| `POST /api/auth/login` | Sign in | CSRF | `{ email, password }` |
| `POST /api/auth/logout` | Clear session cookie | CSRF | — |
| `GET /api/auth/me` | Restore current session | No | — |
| `GET /api/auth/protected-check` | Example protected API route | Yes | — |
| `GET /api/users/:id` | Read public writer profile | No | — |
| `GET /api/users/:id/posts` | List an author's published posts | No | — |
| `GET /api/users/me/dashboard` | Read published count, comment count, recent posts | Yes | — |
| `GET /api/posts` | List published posts; supports `page`, `limit`, `q`, `category` | No | Query parameters |
| `GET /api/posts/categories` | List categories in use | No | — |
| `GET /api/posts/mine` | List signed-in user's posts and drafts | Yes | — |
| `GET /api/posts/:id` | Read a published post or your own draft | Optional | — |
| `GET /api/posts/slug/:slug` | Read a published post by slug | No | — |
| `POST /api/posts` | Create a post | Yes + CSRF | `{ title, excerpt, content, category, tags?, coverImage?, published? }` |
| `PUT /api/posts/:id` | Replace editable fields on your post | Yes + CSRF | Same fields as create |
| `DELETE /api/posts/:id` | Delete your post and its comments | Yes + CSRF | — |
| `GET /api/posts/:id/comments` | List comments on a readable post | Optional | — |
| `POST /api/posts/:id/comments` | Add a comment | Yes + CSRF | `{ content }` |
| `PUT /api/comments/:id` | Edit your comment | Yes + CSRF | `{ content }` |
| `DELETE /api/comments/:id` | Delete your comment or moderate on your post | Yes + CSRF | — |

Sample success response for each endpoint (IDs and dates are abbreviated):

| Endpoint | Sample response body |
| --- | --- |
| `GET /api/health` | `{ "success": true, "status": "ok" }` |
| `GET /api/auth/csrf` | `{ "csrfToken": "<signed-token>" }` |
| `POST /api/auth/register` | `{ "success": true, "user": { "_id": "…", "name": "Avery", "email": "avery@example.com" } }` |
| `POST /api/auth/login` | `{ "success": true, "user": { "_id": "…", "name": "Avery", "email": "avery@example.com" } }` |
| `POST /api/auth/logout` | `{ "success": true, "message": "You are signed out." }` |
| `GET /api/auth/me` | `{ "success": true, "user": null }` (or the signed-in user's public fields plus email) |
| `GET /api/auth/protected-check` | `{ "success": true }` |
| `GET /api/users/:id` | `{ "success": true, "user": { "_id": "…", "name": "Avery", "profileImage": "", "createdAt": "…" } }` |
| `GET /api/users/:id/posts` | `{ "success": true, "posts": [{ "_id": "…", "title": "A story", "slug": "a-story", "commentCount": 2 }] }` |
| `GET /api/users/me/dashboard` | `{ "success": true, "stats": { "publishedPosts": 3, "commentsReceived": 8 }, "recentPosts": [] }` |
| `GET /api/posts` | `{ "success": true, "posts": [], "pagination": { "page": 1, "limit": 9, "total": 0, "pages": 0 } }` |
| `GET /api/posts/categories` | `{ "success": true, "categories": ["Design", "Writing"] }` |
| `GET /api/posts/mine` | `{ "success": true, "posts": [{ "_id": "…", "title": "A story", "published": false }] }` |
| `GET /api/posts/:id` | `{ "success": true, "post": { "_id": "…", "title": "A story", "slug": "a-story", "commentCount": 2 } }` |
| `GET /api/posts/slug/:slug` | `{ "success": true, "post": { "_id": "…", "title": "A story", "slug": "a-story", "commentCount": 2 } }` |
| `POST /api/posts` | `{ "success": true, "post": { "_id": "…", "title": "A story", "slug": "a-story", "commentCount": 0 } }` |
| `PUT /api/posts/:id` | `{ "success": true, "post": { "_id": "…", "title": "Updated story", "slug": "updated-story", "commentCount": 2 } }` |
| `DELETE /api/posts/:id` | `{ "success": true, "message": "Post and its comments were deleted." }` |
| `GET /api/posts/:id/comments` | `{ "success": true, "comments": [], "total": 0 }` |
| `POST /api/posts/:id/comments` | `{ "success": true, "comment": { "_id": "…", "content": "A thoughtful reply", "author": { "name": "Avery" } }, "total": 1 }` |
| `PUT /api/comments/:id` | `{ "success": true, "comment": { "_id": "…", "content": "An edited reply" } }` |
| `DELETE /api/comments/:id` | `{ "success": true, "total": 0 }` |

Post fields are validated server-side: title 4–140 chars, excerpt 10–240, body 40–50,000, category 2–40, up to 8 tags, and optional HTTPS cover URL. Comment text is 2–1,200 characters.

Example post list response:

```json
{
  "success": true,
  "posts": [{ "_id": "…", "title": "A story", "slug": "a-story", "author": { "_id": "…", "name": "Avery" }, "commentCount": 2 }],
  "pagination": { "page": 1, "limit": 9, "total": 1, "pages": 1 }
}
```

Common status codes: `200` success, `201` created, `400` invalid input or ID, `401` missing/expired login, `403` CSRF or ownership denied, `404` missing/private resource, `409` duplicate email/slug, `429` rate limit, and `500` unexpected server error. Internal stack traces are not sent to clients.

## Setup on macOS

### 1. Check required tools

Install Node.js 22.12 or newer and npm 10 or newer. The client uses Vite 7, which requires a recent Node 20 or 22 release; this project sets 22.12 as its minimum. The default development command starts a local MongoDB process for you; you do not need to install a separate database service for a local run.

```bash
brew install node
node --version
npm --version
```

If Homebrew is not installed, install Node from the [official Node.js downloads page](https://nodejs.org/en/download). If you prefer a separately managed MongoDB Community service instead of the bundled development database, Homebrew users on macOS 14 or later can run:

```bash
brew tap mongodb/brew
brew trust mongodb/brew
brew update
brew install mongodb-community@8.0
brew services start mongodb-community@8.0
brew services list
```

The last command should show `mongodb-community` as started. Set `MONGODB_URI=mongodb://localhost:27017/blogsphere` to use this service with the dev launcher. See MongoDB's [macOS Community Edition instructions](https://www.mongodb.com/docs/v8.0/tutorial/install-mongodb-on-os-x/) for prerequisites and troubleshooting.

For MongoDB Atlas, create an Atlas project and cluster in the web UI, add a database user, and add your current development IP in the project's IP Access List. In the cluster's **Connect** dialog, choose **Drivers**, select Node.js, and copy the connection string. Replace the username/password placeholders, percent-encode reserved characters in the password, and set that full URI as `MONGODB_URI`. Atlas requires both a database user and an allowed client IP; see [Connect to an Atlas cluster](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/?interface=atlas-ui) and [MongoDB connection strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

### 2. Install dependencies

If you are arranging a fresh copy, create a project folder, place the supplied project files inside it, and open Terminal there. For example:

```bash
mkdir -p ~/Projects/BlogSphere
cd ~/Projects/BlogSphere
```

Then install dependencies from the repository root:

```bash
npm install
```

### 3. Configure environment

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

For local development, `MONGODB_URI` is optional: `npm run dev` starts a MongoDB development instance and stores its data under the ignored `.data/mongodb/` folder. That data persists across browser refreshes and app restarts. This local database is for development; production must use a managed or separately secured MongoDB deployment.

To use Atlas or another external database, edit `server/.env` and set `MONGODB_URI`. Generate a strong JWT secret with:

```bash
openssl rand -base64 48
```

Paste it as `JWT_SECRET`. Keep `.env` files private; they are ignored by Git. `CLIENT_URL` must exactly match the browser origin, including protocol and port. The client defaults to the Vite development proxy, so `VITE_API_URL=/api` is correct for local development.

| Variable | Used by | Purpose |
| --- | --- | --- |
| `PORT` | Server | API port, default `4000` |
| `MONGODB_URI` | Server | Optional for local dev; set for Atlas or a separately managed MongoDB |
| `JWT_SECRET` | Server | At least 32 characters; use a unique random value |
| `CLIENT_URL` | Server | Exact allowed frontend origin |
| `NODE_ENV` | Server | `development`, `test`, or `production` |
| `COOKIE_SAME_SITE` | Server | `lax` locally; `none` for cross-site HTTPS deployments |
| `VITE_API_URL` | Client | API base URL including `/api` |

### 4. Run the app

From the repository root, start the local database, API, and Vite client together:

```bash
npm run dev
```

The development database uses the MongoDB binary managed by `mongodb-memory-server`. On its first run, it may download that binary if it is not already cached. To run only the client or API separately, use `npm run dev:client` or `npm run dev:server`; the standalone API command expects a MongoDB service to be available through `MONGODB_URI`.

Open the URL printed by Vite (usually [http://localhost:5173](http://localhost:5173); Vite may choose another port if that one is busy). The API health check is at [http://localhost:4000/api/health](http://localhost:4000/api/health). Create an account, publish a story, then open it in a private browser window to confirm it is public.

### Common setup issues

- **A directory listing appears at `127.0.0.1`:** a static file server (often an editor's “Live Server” button) is serving the project root. BlogSphere's React entry is `client/index.html`; stop that static server, run `npm run dev` from this project root, and open `http://localhost:5173` (use the port Vite prints if it selects another one).
- **The home page opens but says the API is unavailable:** check the `npm run dev` terminal for database startup errors. For an external database, confirm MongoDB is running and `server/.env` has a reachable `MONGODB_URI`, then restart `npm run dev`.
- **MongoDB connection refused:** start the local MongoDB service or verify the Atlas URI, database user, password URL encoding, and IP access rule.
- **CORS or cookie errors:** check `CLIENT_URL` character-for-character, keep credentials enabled, use HTTPS in production, and use `COOKIE_SAME_SITE=none` only with secure HTTPS origins that truly require cross-site cookies.
- **CSRF verification error:** reload the app to obtain a fresh token. Ensure the browser is not blocking cookies.
- **Port in use:** change `PORT` for the API or stop the process already using that port.
- **Dev server already running:** the root launcher detects an active BlogSphere API and Vite client and reports the existing URL instead of starting a second MongoDB process against the same local data.
- **Cover image rejected:** use an image URL that starts with `https://`.

## Tests and build

Backend tests use Node's built-in test runner, Supertest, and an in-memory MongoDB instance. The first run may download a MongoDB test binary.

```bash
npm test
npm run build
```

The tests cover registration and duplicate email, invalid credentials, CSRF rejection, post/comment persistence, owner authorization and comment moderation, cascade deletion, search, and pagination.

## Deployment guide

1. Create a MongoDB Atlas production database and restrict network access to your API host where practical. Atlas uses a database user, an IP access list, and a connection string for app access; see [Atlas connection setup](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/?interface=atlas-ui).
2. Deploy `server/` as a Node service. Set `NODE_ENV=production`, `PORT` as required by the host, `MONGODB_URI`, a newly generated `JWT_SECRET`, and the exact `CLIENT_URL`.
3. Deploy `client/` as a static Vite site with `VITE_API_URL=https://your-api-host.example/api`. Set the Vite build command to `npm run build` and output folder to `client/dist` when deploying from the repository root (or `dist` when the host runs in `client/`). Configure the host to send unknown paths to `index.html` for React Router refreshes.
4. If the client and API are on different sites, serve both over HTTPS and set `COOKIE_SAME_SITE=none`. The API must allow only the deployed client origin and credentials; do not use `*` for CORS.
5. Add production secrets through the hosting provider's environment settings, never in source control. Verify account creation, browser refresh, story publishing, comments, and owner-only edits on the deployed site.

Development and production use the same API routes, but separate MongoDB databases, secrets, origins, and environment variables. To prepare a new local Git repository after reviewing the files:

```bash
git init
git add .
git commit -m "Build BlogSphere blogging platform"
git branch -M main
git remote add origin <your-GitHub-repository-url>
git push -u origin main
```

Replace the remote placeholder with the repository URL you create on GitHub. Before pushing, check `git status` and confirm no `.env` file or secret is staged.

## Screenshots

After running the app, capture the home page, story detail with comments, writer dashboard, and mobile navigation. Add images under `docs/screenshots/` and link them here, for example:

```md
![BlogSphere home page](docs/screenshots/home.png)
```

## Future improvements

- Rich text/Markdown editor with safe rendering.
- Profile image upload through a managed image service.
- Email verification, password reset, and optional administrator roles.
- Comment pagination and notification preferences.
- Automated browser accessibility and responsive visual checks.

## License

This project is provided for learning and portfolio use. Add a specific license file before redistributing it under an open-source license.
