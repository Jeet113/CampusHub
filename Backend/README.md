# CampusHub Backend

CampusHub is a modular Express REST API backed by MongoDB Atlas. It provides JWT authentication, role and ownership enforcement, moderated clubs/events/notices, safe event registration, Cloudinary uploads, notifications, admin operations, search, and pagination.

## Requirements

- Node.js 20 or newer
- npm
- MongoDB Atlas (transactions require a replica set; Atlas provides one)
- Cloudinary for file uploads

The only environment file is `CampusHub/.env`. Do not create `Backend/.env`.

## Installation

From the project root:

```bash
cd Backend
npm install
```

Copy missing values from the root `.env.example` into the existing root `.env`. Generate two different random JWT secrets with at least 32 characters. Never commit `.env`.

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `development`, `test`, or `production` |
| `PORT` | API port, normally `5000` |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | Access-token signing secret, 32+ characters |
| `JWT_REFRESH_SECRET` | Different refresh-token signing secret, 32+ characters |
| `ACCESS_TOKEN_EXPIRES_IN` | Access lifetime, normally `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh lifetime, normally `7d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CLIENT_URL` | Credentialed CORS origin |
| `VITE_API_URL` | Frontend API base URL |
| `SEED_PASSWORD` | Explicit password used only by development seed accounts |

Cloudinary variables may remain blank while working on non-upload endpoints; an upload then returns a clear `503`. MongoDB and JWT secrets are required to start the API.

## Run

```bash
cd Backend
npm run dev
```

Production-style syntax validation and startup:

```bash
npm run build
npm start
```

The health endpoint is `GET http://localhost:5000/api/v1/health`. It returns `200` and `database: "connected"` after startup has connected to MongoDB.

## Authentication and roles

Login/register returns a short-lived access token in the JSON response. Send it as `Authorization: Bearer <token>`. The longer-lived refresh token is rotated and stored in a credentialed HTTP-only cookie. Logout revokes the stored refresh-token hash. Only one active refresh session is retained per user.

Public registration permits `student` and `club`; `admin` is rejected. Protected operations reload the user, so suspended users are blocked immediately. Role checks and resource ownership are always enforced server-side:

- `student`: join clubs, register/cancel and save events, manage own profile and notifications
- `club`: manage only its associated club, members, events, and notices
- `admin`: approvals, metrics, moderation, status changes, and user deletion

Club registrations start `pending`. Club events start `pending` unless saved as `draft`. Club notices start `pending`. Admin approval publishes/approves them.

## API endpoints

All endpoints use `/api/v1`.

| Area | Endpoints |
| --- | --- |
| Health | `GET /health` |
| Auth | `POST /auth/register`, `/login`, `/logout`, `/refresh`, `/forgot-password`, `/reset-password`; `GET /auth/me` |
| Users | `GET /users/me`; `PUT /users/me`; `PATCH /users/me/password`; `POST /users/me/avatar` |
| Clubs | `GET/POST /clubs`; `GET/PUT/DELETE /clubs/:id`; `POST /clubs/:id/join`; member GET/PATCH/DELETE routes; logo/banner uploads |
| Events | `GET/POST /events`; `GET/PUT/DELETE /events/:id`; register/cancel, save/unsave, and banner routes |
| Notices | `GET/POST /notices`; `GET/PUT/DELETE /notices/:id`; `POST /notices/:id/attachments` |
| Notifications | `GET /notifications`; `PATCH /notifications/:id/read`; `PATCH /notifications/read-all` |
| Admin | metrics, approvals, approve/reject, user/club/event status, and delete-user routes under `/admin` |
| Search | `GET /search?q=...` |

Lists accept bounded `page` and `limit`. Events support `search`, `category`, `status`, and `sort`; clubs support `search`, `category`, `status`, and `sort`; notices support `search`, `category`, `important`, and `status`.

Uploads are `multipart/form-data`: avatar field `avatar`, club fields `logo`/`banner`, event field `banner`, and notice field `attachments`. Images accept JPEG, PNG, WebP, and GIF up to 5 MB. Notice attachments also accept PDF up to 10 MB. MongoDB stores only `{ url, publicId, resourceType }`.

## Seed development data

Set `SEED_PASSWORD` in the root `.env`, keep `NODE_ENV` non-production, then run:

```bash
npm run seed
```

It recreates development data: 1 admin, 2 club users, 6 students, 6 clubs, 10 events, and 10 notices. Representative logins are:

- `admin@campushub.local`
- `club@campushub.local`
- `student@campushub.local`

All use the root `SEED_PASSWORD`; the password is not hard-coded or printed.

## Tests and checks

```bash
npm run build
npm run lint
npm test
```

Unit and HTTP-boundary tests run without a database. Database integration tests are opt-in because they drop their test database and exercise MongoDB transactions. Use an Atlas database whose name contains `test`:

```bash
TEST_MONGODB_URI="mongodb+srv://.../campushub-test" npm run test:integration
```

On PowerShell, set `$env:TEST_MONGODB_URI` first, run `npm run test:integration`, then remove it. The safety guard refuses to drop a database without `test` in its name.

## Postman workflow

1. Create an environment with `baseUrl = http://localhost:5000/api/v1` and `accessToken` blank.
2. Call `POST {{baseUrl}}/auth/login` with JSON email/password.
3. Save `data.accessToken` into `accessToken`; Postman retains the refresh cookie automatically.
4. For protected requests use Bearer Token `{{accessToken}}`.
5. Call `POST {{baseUrl}}/auth/refresh` with `{}` to rotate the cookie and copy the new access token.
6. Test moderation in order: create a club/event, log in as admin, inspect `/admin/approvals`, then approve using `{ "type": "club" }` or `{ "type": "event" }`.
7. For capacity, approve an event, register as a student, repeat to verify `409`, cancel, and register again.
8. For uploads choose `form-data`, use the exact field names listed above, and select a permitted file.

Success responses use `{ success, message, data }` plus optional `pagination`; failures use `{ success: false, message, errors }`.

## React integration

Vite reads the root environment through `Frontend/vite.config.js`. `Frontend/src/services/api.js` is ready for gradual integration and supports JSON, FormData, credentialed cookies, Bearer access tokens, and one automatic refresh retry. Keep the current mock data as fallback while replacing one screen at a time. On login, call `setAccessToken(response.data.accessToken)` and keep the access token in memory; do not place the refresh token in local storage.

## Current external TODOs

- Supply actual Atlas, JWT, and Cloudinary values in the ignored root `.env`.
- Connect an email provider. In development, forgot-password returns its reset token for testing; production deliberately does not expose it.
- Run the opt-in integration suite against an Atlas test database.
- Replace frontend mocks incrementally using the prepared API client.
