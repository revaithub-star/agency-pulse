# Agency Pulse

Agency Pulse is a self-hosted agency management system with SQLite persistence, financial tracking, role-based access control, and protected project credentials.

## Features

**Dashboard**
- Total, active, and completed projects
- Revenue, expenses, and net profit tracking
- Outstanding payments and monthly revenue charts
- Quick project overview and recent activity

**Clients**
- Client information and contact details
- Company and project associations
- Total revenue and outstanding amounts
- Client-wise financial summaries

**Projects**
- Project name, client, URL, source, dates, and status
- Budget and agreed amount tracking
- Project credentials and hosting details (password-protected)
- Notes and attachments
- Per-project currency support

**Financials**
- Payment recording and status tracking
- Expense categorization and logging
- Outstanding payment calculations
- Project and client profitability

**Reports**
- Revenue, expense, and profit reports
- Client-wise and project-wise breakdowns
- Date-range filtering
- CSV export with proper escaping

**Users**
- Admin user creation (one-time setup signup)
- Staff/team member management
- Granular role-based permissions
- User enable/disable functionality

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- A server with writable access to the `data/` directory (SQLite database)
- For private uploads: writable `uploads/` directory outside the public web root

## Installation

1. Install dependencies:

	```bash
	npm install
	```

2. Create `.env.local` with a unique `AUTH_SECRET`:

	```bash
	AUTH_SECRET=$(openssl rand -base64 32)
	echo "AUTH_SECRET=$AUTH_SECRET" > .env.local
	```

3. Optionally configure custom paths:

	```bash
	echo "SQLITE_DATABASE_PATH=data/agency.sqlite" >> .env.local
	echo "UPLOADS_DIRECTORY=uploads" >> .env.local
	echo "MAX_ATTACHMENT_SIZE_MB=10" >> .env.local
	```

4. Start the development server:

	```bash
	npm run dev
	```

5. Open `http://localhost:3000`. The first load will detect no users and show the admin signup page.

6. Create your admin account using an email and a strong password (minimum 8 characters). **This signup closes permanently after the first user is created.**

7. Log in with your admin credentials and add staff members from the Users tab.

For production, run `npm run build` followed by `npm start`. Use HTTPS in production and keep `.env.local` outside the source archive.

## Database and migrations

Agency Pulse uses SQLite with automatic schema initialization. The first startup creates:

- `users` — Admin and staff accounts with hashed passwords and granular permissions
- `clients` — Client information and contact details
- `projects` — Project records with client links, budget, and credentials
- `payments` — Recorded payments linked to projects and clients
- `expenses` — Expense records with categories and project associations
- `attachments` — Metadata for private project uploads

**Legacy data migration**: If you have an existing `data/db.json` file, it will be imported on first run into the new SQLite database, preserving all project IDs, amounts, dates, and credential data. The original JSON file is not deleted or modified.

## Data security

- All passwords (admin, project credentials, hosting) are hashed using scrypt or encrypted before storage.
- API responses redact credential and hosting passwords, displaying `[REDACTED]` instead.
- Session cookies are signed with `AUTH_SECRET` and valid for seven days.
- Attachments are stored outside the public web root with access controlled via API authorization.
- Do not commit real client data, credentials, or passwords to the repository.

## Environment variables

```
AUTH_SECRET                 # Required. Unique signing secret for session cookies.
SQLITE_DATABASE_PATH        # Optional. Path to SQLite database file (default: data/agency.sqlite).
UPLOADS_DIRECTORY           # Optional. Path to private uploads directory (default: uploads).
MAX_ATTACHMENT_SIZE_MB      # Optional. Maximum attachment size in MB (default: 10).
NODE_ENV                    # Set to 'production' for HTTPS and hardened cookies.
```

## Deployment

1. Build the application:

	```bash
	npm run build
	```

2. Deploy the `.next` directory, `node_modules`, `public`, `data`, and `.env.local` to your server.

3. Start the production server:

	```bash
	npm start
	```

4. Ensure the `data/` and `uploads/` directories are writable by the Node.js process.

5. Configure a reverse proxy (nginx, Apache) with HTTPS and point traffic to `localhost:3000`.

6. Back up the SQLite database regularly (default: `data/agency.sqlite`).

## Quality checks

```bash
npm run lint
npm run build
```

## Support

Include the application version, Node.js version, deployment host, relevant error logs, and your schema version when reporting issues. Never include passwords, session cookies, `AUTH_SECRET`, or client credentials in support requests.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
