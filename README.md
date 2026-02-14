# CloudBot

A monorepo containing the CloudBot API, dashboard, and web applications built with Cloudflare Workers, D1, R2, and Next.js.

## Prerequisites

- Node.js 24+ and pnpm
- Cloudflare account (for remote deployment)
- Wrangler CLI (included in dependencies)

## Local Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Local Development (Automatic Local D1 and R2)

When you run `wrangler dev`, it automatically creates local D1 database and R2 bucket for testing:

```bash
# Start the API in development mode
cd apps/api
pnpm run dev
```

**What happens automatically:**

- ✅ Local D1 database is created at `.wrangler/state/v3/d1/`
- ✅ Local R2 bucket is created at `.wrangler/state/v3/r2/`
- ✅ API runs on `http://localhost:8787`
- To apply migrations to the local D1 database:

```bash
wrangler d1 migrations apply CLOUDBOT_D1_DATABASE --local
```

Wrangler automatically keeps track of the migrations already applied to the local D1 database, so it is safe to run this command multiple times during development as you create new migrations.

### 3. Run Other Apps Locally

```bash
pnpm run dev --filter=web --filter=dashboard
```

### 4. View Local Data

```bash
# Query local D1 database
wrangler d1 execute CLOUDBOT_D1_DATABASE --local --command "SELECT * FROM users"

# List local R2 objects
wrangler r2 object list cloudbot-bucket --local
```

## Production Setup (Remote D1 and R2)

### Step 1: Authenticate with Cloudflare

```bash
wrangler login
```

This opens your browser to authenticate with Cloudflare.

Verify authentication:

```bash
wrangler whoami
```

### Step 2: Create Remote D1 Database

```bash
# Create the D1 database
wrangler d1 create cloudbot-db
```

**Output example:**

```
✅ Successfully created DB 'cloudbot-db'
Created your database using D1's new storage backend.

[[d1_databases]]
binding = "DB"
database_name = "cloudbot-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Copy the `database_id` for the next step.**

### Step 3: Update wrangler.jsonc with D1 Info

Update `apps/api/wrangler.jsonc`:

```json
"d1_databases": [
    {
        "binding": "CLOUDBOT_D1_DATABASE",
        "database_name": "cloudbot-db",
        "database_id": "YOUR_ACTUAL_DATABASE_ID_HERE",
        "migrations_dir": "./../../packages/server/src/drizzle/migrations"
    }
]
```

### Step 4: Run D1 Migrations

```bash
# Apply migrations to remote database
wrangler d1 migrations apply cloudbot-db --remote
```

To verify:

```bash
# List tables in remote database
wrangler d1 execute cloudbot-db --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
```

### Step 5: Create Remote R2 Bucket

```bash
# Create the R2 bucket
wrangler r2 bucket create cloudbot-bucket
```

**Output:**

```
✅ Created bucket 'cloudbot-bucket'
```

### Step 6: Update wrangler.jsonc with R2 Info (if needed)

Update `apps/api/wrangler.jsonc`:

```json
"r2_buckets": [
    {
        "binding": "CLOUDBOT_BUCKET",
        "bucket_name": "cloudbot-bucket"
    }
]
```

### Step 7: Test Remote Connection

```bash
# Test with remote resources
cd apps/api
wrangler dev --remote
```

The `--remote` flag connects to your remote D1 and R2 instead of local ones.

### Step 8: Update Custom Domains in wrangler.jsonc

Replace the example domain (`nextgpt.cloud`) with your own domain in each app's `wrangler.jsonc`:

**apps/api/wrangler.jsonc:**

```json
"route": {
    "custom_domain": true,
    "zone_name": "your-domain.com",
    "pattern": "api.your-domain.com"
}
```

**apps/web/wrangler.jsonc:**

```json
"route": {
    "custom_domain": true,
    "zone_name": "your-domain.com",
    "pattern": "chat.your-domain.com"
}
```

**apps/dashboard/wrangler.jsonc:**

```json
"route": {
    "custom_domain": true,
    "zone_name": "your-domain.com",
    "pattern": "admin.your-domain.com"
}
```

Make sure your domain is added to Cloudflare and the nameservers are updated.

### Step 9: Set Up GitHub Secrets (for CI/CD)

To enable automatic deployment via GitHub Actions, add these secrets to your repository:

1. Go to **GitHub** → **Settings** → **Secrets and variables** → **Actions**

2. Click **New repository secret** and add:
   - **CLOUDFLARE_API_TOKEN**
     - Go to Cloudflare Dashboard → **My Profile** → **API Tokens**
     - Click **Create Token** → Select "Edit Cloudflare Workers"
     - Copy the token
   - **CLOUDFLARE_ACCOUNT_ID**
     - Go to Cloudflare Dashboard → **Home**
     - Copy your Account ID (under the domain)

### Step 10: Deploy via GitHub Actions (Automatic)

Once secrets are configured, deployments happen automatically:

```bash
# Just push to main branch
git add .
git commit -m "Update code"
git push origin main
```

**What happens automatically:**

- ✅ GitHub Actions workflow triggers
- ✅ API, Web, and Dashboard deploy simultaneously
- ✅ Status appears in your repo's **Actions** tab
- ✅ Cloudflare logging is turned off; you can turn it off in the 'wrangler.jsonc' file for each app under the 'observability' section.

### Step 11: Manual Deployment (if needed)

Make sure to set the correct environment variables for each app before deploying.

```bash
# Build and deploy all apps
pnpm run build
cd apps/api && pnpm run deploy
cd ../web && pnpm run deploy-cloudflare
cd ../dashboard && pnpm run deploy-cloudflare
```

**Your apps are now live at:**

- API: `https://api.your-domain.com`
- Web: `https://chat.your-domain.com`
- Dashboard: `https://admin.your-domain.com`

### Continuous Deployment (CI/CD)

When new commits are pushed to the `main` branch, GitHub Actions automatically builds and redeploys all apps. You can monitor the deployment status in the **Actions** tab of your GitHub repository.

## Common Commands

### D1 Database Commands

```bash
# Execute SQL on local database
wrangler d1 execute YOUR_D1_DATABASE --local --command "SELECT * FROM users"

# Execute SQL on remote database
wrangler d1 execute cloudbot-db --remote --command "SELECT * FROM users"

# Execute SQL from file
wrangler d1 execute cloudbot-db --remote --file=./query.sql

# List all D1 databases
wrangler d1 list

# Delete a database (careful!)
wrangler d1 delete cloudbot-db
```

### R2 Bucket Commands

```bash
# List buckets
wrangler r2 bucket list

# Get bucket info
wrangler r2 bucket info cloudbot-bucket

# Upload a file
wrangler r2 object put cloudbot-bucket/path/file.txt --file=./local-file.txt

# List objects in bucket
wrangler r2 object list cloudbot-bucket

# Download an object
wrangler r2 object get cloudbot-bucket/path/file.txt --file=./downloaded-file.txt

# Delete an object
wrangler r2 object delete cloudbot-bucket/path/file.txt

# Delete a bucket (must be empty)
wrangler r2 bucket delete cloudbot-bucket
```

### Development Commands

```bash
# Run API locally (local D1 + R2)
pnpm run dev --filter=api

# Run API with remote resources
cd apps/api && wrangler dev --remote

# Run all tests
pnpm test

# Build all packages
pnpm run build

# Deploy API to production
cd apps/api && pnpm run deploy
```

## Environment Variables

For local development, you may need environment variables. Create `.env.local` files:

**apps/api/.env.local:**

```env
# Optional: for development only
CLOUDFLARE_API_TOKEN=your_api_token
```

**apps/web/.env.local:**

```env
NEXT_PUBLIC_API_URL=http://localhost:8787
```

**apps/dashboard/.env.local:**

```env
NEXT_PUBLIC_API_URL=http://localhost:8787
```

## Project Structure

```
cloudbot/
├── apps/
│   ├── api/          # Cloudflare Workers API (Hono)
│   ├── dashboard/    # Admin dashboard (Next.js)
│   └── web/          # Chatbot interface (Next.js)
├── packages/
│   ├── api-routes/   # Shared API route definitions
│   ├── server/       # Database schema and utilities
│   ├── ui/           # Shared UI components
│   └── ...
```

## Troubleshooting

### "Could not access D1 database"

- Make sure you've created the database with `wrangler d1 create`
- Verify the `database_id` in `wrangler.jsonc` matches the created database
- Try running with `--remote` flag: `wrangler dev --remote`

### "R2 bucket not found"

- Create the bucket: `wrangler r2 bucket create cloudbot-bucket`
- Verify the `bucket_name` in `wrangler.jsonc` is correct
- Check you're authenticated: `wrangler whoami`

### Migrations not applying

```bash
# Apply migrations manually
wrangler d1 migrations apply cloudbot-db --remote

# Check migration status
wrangler d1 migrations list cloudbot-db
```

### Clear local development data

```bash
# Delete local wrangler state
rm -rf .wrangler
```

## Learn More

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [D1 Database Documentation](https://developers.cloudflare.com/d1/)
- [R2 Storage Documentation](https://developers.cloudflare.com/r2/)
- [Hono Framework](https://hono.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
