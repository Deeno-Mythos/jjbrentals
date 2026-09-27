# JJB Rentals

A responsive room-rental website and booking system built with SvelteKit. Guests can compare rooms, see daily rates, and send booking requests. The admin console provides a calendar and booking-management tools.

## Rooms and rates

| Room | Rate |
| --- | ---: |
| Fan-cooled room (no air conditioning) | ₱750 per day |
| Air-conditioned double room | ₱850 per day |
| Air-conditioned bunk room | ₱850 per day |

## Features

- Responsive room, gallery, and booking pages using the supplied property media.
- Cloudinary delivery for optimized images and video.
- Booking requests saved to Turso and shown as pending in the admin calendar.
- Admin actions to confirm, decline, or cancel requests. Only confirmed bookings block a room's dates; the check-out day remains available.
- Overlap protection enforced in the database when a booking is confirmed.
- Booking table, index, and overlap trigger are created automatically the first time a booking or admin booking endpoint is used.
- A public health endpoint for uptime and database monitoring.
- SvelteKit's Vercel adapter for deployment.

## Requirements

- Node.js `^20.19.0` or `>=22.12.0`
- npm
- A Turso database and database auth token
- A Cloudinary cloud name

## Local development

```sh
npm install
```

Create a `.env.local` file in the project root. You can copy `.env.example` and replace the placeholders. Keep real credentials private; `.env*` files are ignored by Git.

```dotenv
CLOUD_NAME=your-cloudinary-cloud-name
TURSODB_URL=turso://your-database.turso.io
TURSODB_API_TOKEN=your-database-auth-token
ADMIN_PASSWORD=use-a-unique-password-at-least-13-characters-long
```

The database client also accepts `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` instead of `TURSODB_URL` and `TURSODB_API_TOKEN`.

Start the development server:

```sh
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Admin console

Open `/admin` on the deployed site or local server and sign in with `ADMIN_PASSWORD`. Choose a unique password of at least 13 characters. The session is stored in a secure, HTTP-only cookie and expires after eight hours.

New guest requests start as **pending** and do not reserve a room. Confirming a request makes those dates unavailable; if another confirmed stay overlaps, the update is rejected. Cancelled stays no longer block availability.

## API

### `GET /api/health`

Designed for external health-check services. It performs a read-only Turso ping and returns JSON. HTTP `200` means the API and database are reachable; HTTP `503` means the database is unavailable or not configured. The response does not include credentials or raw database errors.

Example healthy response:

```json
{
  "service": "jjb-rentals",
  "status": "ok",
  "checkedAt": "2026-01-01T12:00:00.000Z",
  "checks": {
    "api": { "status": "ok" },
    "database": { "status": "ok", "latencyMs": 18 }
  }
}
```

### `POST /api/bookings`

Creates a pending booking request. Send JSON with `roomId` (`fan`, `aircon`, or `aircon-bunk`), `checkIn`, `checkOut` (`YYYY-MM-DD`), `guests`, `guestName`, and `guestPhone`. `guestEmail` and `notes` are optional. The server calculates the rate and total; client-supplied prices are not used.

```json
{
  "roomId": "aircon-bunk",
  "checkIn": "2026-10-10",
  "checkOut": "2026-10-12",
  "guests": 2,
  "guestName": "Example Guest",
  "guestPhone": "+63 900 000 0000",
  "guestEmail": "guest@example.com",
  "notes": "Late arrival"
}
```

Admin booking endpoints are protected by the `/admin` session: `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/bookings?from=YYYY-MM-DD&to=YYYY-MM-DD`, and `PATCH /api/admin/bookings` to update a booking status.

## Deployment to Vercel

1. Import this GitHub repository into Vercel, or connect it to the existing Vercel project.
2. Add the required environment variables in the Vercel project settings for each target environment:
   - `CLOUD_NAME`
   - `TURSODB_URL` and `TURSODB_API_TOKEN` (or `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`)
   - `ADMIN_PASSWORD`
3. Deploy. If Vercel is connected to this repository, pushes to the production branch can trigger a deployment automatically.

Do not commit `.env`, `.env.local`, database tokens, admin passwords, or other secrets. `.env.example` contains placeholders only.

## Checks and build

```sh
npm run check
npm run build
npm run preview
```

`npm run preview` serves the production build locally after a successful build.
