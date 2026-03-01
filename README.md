# CloudBot

A monorepo containing the CloudBot API, dashboard, and web applications built with Cloudflare Workers, D1, R2, and Next.js.

## Prerequisites

- Node.js 24+ and pnpm
- Cloudflare account (for remote deployment)
- Wrangler CLI (included in dependencies)

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
wrangler d1 create cloudbot-db --remote
```

**Output example:**

```
✅ Successfully created DB 'cloudbot-db'
Created your database using D1's new storage backend.

[[d1_databases]]
binding = "CLOUDBOT_DB"
database_name = "cloudbot-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Copy the `database_id` for the next step.**

### Step 3: Update wrangler.jsonc with D1 Info

Update `apps/api/wrangler.jsonc`:

```json
"d1_databases": [
    {
        "binding": "CLOUDBOT_DB",
        "database_name": "CLOUDBOT_DB",
        "database_id": "YOUR_ACTUAL_DATABASE_ID_HERE",
        "migrations_dir": "./../../packages/server/src/drizzle/migrations"
    }
]
```

### Step 4: Run D1 Migrations

```bash
# Apply migrations to remote database
wrangler d1 migrations apply CLOUDBOT_DB --remote
```

To verify:

```bash
# List tables in remote database
wrangler d1 execute CLOUDBOT_DB --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
```

### Step 5: Create Remote R2 Bucket

```bash
# Create the R2 bucket
wrangler r2 bucket create cloudbot-bucket
```

### Step 6: Create AI Search Instance

In the Cloudflare dashboard, navigate to **AI** → **AI Search** and create a new AI Search instance with the name `cloudbot-ai-search`. When prompted, connect it to the `cloudbot-bucket` R2 bucket you created in the previous step. This enables semantic search over files stored in R2 and is required for certain search features in the API.

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

To enable automatic deployment via GitHub Actions, you need to configure secrets and variables in your GitHub repository. Go to **GitHub** → **Settings** → **Secrets and variables** → **Actions**.

#### Required Secrets (Deployment)

**GitHub Secrets** → Configure in GitHub "Secrets" tab:

- **CLOUDFLARE_API_TOKEN** - Cloudflare API token with Workers edit permissions
  - Go to Cloudflare Dashboard → **My Profile** → **API Tokens**
  - Click **Create Token** → Select "Edit Cloudflare Workers"

- **CLOUDFLARE_ACCOUNT_ID** - Your Cloudflare account ID
  - Go to Cloudflare Dashboard → **Home**
  - Copy your Account ID

#### API Worker Configuration

**Configure as GitHub Secrets** (encrypted in both GitHub and Cloudflare):

- `BETTER_AUTH_SECRET` - Secret key for Better Auth. Generate with:
  - MacOS/Linux: `openssl rand -hex 32`
  - Windows PowerShell: `[byte[]]$bytes = New-Object byte[] 16; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes); ($bytes | ForEach-Object { $_.ToString("x2") }) -join ""`
- `ENCRYPTION_KEY` - 32-character key for AES-256 encryption (generate same way)
- `RESEND_API_KEY` - Resend API key (if email signup enabled)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret (if OAuth enabled)
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret (if OAuth enabled)
- `GITLAB_CLIENT_SECRET` - GitLab OAuth client secret (if OAuth enabled)
- `SSO_CLIENT_SECRET` - SSO client secret (if SSO enabled)
- `CLOUDFLARE_SECRET_ACCESS_KEY` - Cloudflare R2 secret access key
- `AI_GATEWAY_API_KEY` - Vercel AI Gateway API key (optional)
- `ANTHROPIC_API_KEY` - Anthropic API key (optional)
- `ANTHROPIC_AUTH_TOKEN` - Anthropic auth token (optional)
- `AWS_SECRET_ACCESS_KEY` - AWS secret key for Bedrock (optional)
- `AZURE_API_KEY` - Azure API key (optional)
- `GOOGLE_PRIVATE_KEY` - Google service account private key (optional)
- `OPENAI_API_KEY` - OpenAI API key (optional)
- `EXA_API_KEY` - Exa Labs API key (optional)
- `PARALLEL_API_KEY` - Parallel API key (optional)
- `TAVILY_API_KEY` - Tavily API key (optional)

**Configure as GitHub Variables** (plaintext in GitHub, available as env vars in Cloudflare):

- `NODE_ENV` - Environment mode ("production")
- `BETTER_AUTH_URL` - The base URL for Better Auth (e.g., "https://api.your-domain.com")
- `ADMIN_USER_IDS` - Comma-separated list of admin user IDs (optional)
- `ALLOWED_ORIGINS` - Comma-separated CORS origins (e.g., "https://chat.your-domain.com,https://admin.your-domain.com")
- `ENABLE_EMAIL_SIGNUP` - Enable email/password signup ("true" or "false")
- `ENABLE_OAUTH_LOGIN` - Enable OAuth providers ("true" or "false")
- `ENABLE_SSO` - Enable SSO authentication ("true" or "false")
- `ALLOWED_EMAIL_DOMAINS` - Restrict email domains (comma-separated, optional)
- `RESEND_SENDER_EMAIL` - Resend sender email address
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (public)
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID (public)
- `GITLAB_CLIENT_ID` - GitLab OAuth client ID (public)
- `SSO_DOMAIN` - SSO domain (e.g., "example.com")
- `SSO_PROVIDER_ID` - SSO provider ID (e.g., "keycloak-test")
- `SSO_CLIENT_ID` - SSO client ID (public)
- `SSO_ISSUER` - SSO issuer URL
- `SSO_DISCOVERY_ENDPOINT` - OIDC discovery endpoint
- `SSO_AUTHORIZATION_ENDPOINT` - Authorization endpoint
- `SSO_TOKEN_ENDPOINT` - Token endpoint
- `SSO_JWKS_ENDPOINT` - JWKS endpoint
- `NEXT_PUBLIC_LLM_MODELS` - JSON array of LLM models (see `.env.example`)
- `R2_ENDPOINT` - Cloudflare R2 endpoint URL
- `CLOUDFLARE_ACCESS_KEY_ID` - Cloudflare R2 access key ID (public)
- `AWS_ACCESS_KEY_ID` - AWS access key ID (public)
- `AWS_REGION` - AWS region (e.g., "us-east-1")
- `AZURE_RESOURCE_NAME` - Azure resource name
- `GOOGLE_VERTEX_PROJECT` - Google Vertex AI project ID
- `GOOGLE_VERTEX_LOCATION` - Google Vertex AI location
- `GOOGLE_CLIENT_EMAIL` - Google service account email
- `GOOGLE_PRIVATE_KEY_ID` - Google private key ID
- `SEARCH_PROVIDER` - Search provider name (e.g., "google", "tavily")
- `TITLE_MODEL_IDX` - Model index for titles (e.g., "0")
- `ARTIFACT_MODEL_IDX` - Model index for artifacts (e.g., "0")
- `SEARCH_MODEL_IDX` - Model index for search (e.g., "0")
- `COMPLETION_MODEL_IDX` - Model index for completions (e.g., "0")

#### Web App Secrets

**Configure as GitHub Variables** (all are non-sensitive configuration):

- `NEXT_PUBLIC_API_URL` - API URL (e.g., "https://api.your-domain.com")
- `NEXT_PUBLIC_ENABLE_EMAIL_SIGNUP` - Same as API ("true" or "false")
- `NEXT_PUBLIC_ENABLE_OAUTH_LOGIN` - Same as API ("true" or "false")
- `NEXT_PUBLIC_ENABLE_SSO` - Same as API ("true" or "false")
- `NEXT_PUBLIC_CSP_ENDPOINTS` - Content Security Policy endpoints (e.g., R2 bucket URL)
- `NEXT_PUBLIC_LLM_MODELS` - Same JSON as API

_Note: These are embedded in the client-side bundle during build, so they're passed as build-time environment variables, not Cloudflare secrets._

#### Dashboard App Secrets

**Configure as GitHub Variables** (all are non-sensitive configuration):

- `NEXT_PUBLIC_API_URL` - API URL (e.g., "https://api.your-domain.com")
- `NEXT_PUBLIC_ENABLE_EMAIL_SIGNUP` - Same as API ("true" or "false")
- `NEXT_PUBLIC_ENABLE_OAUTH_LOGIN` - Same as API ("true" or "false")
- `NEXT_PUBLIC_ENABLE_SSO` - Same as API ("true" or "false")
- `NEXT_PUBLIC_CSP_ENDPOINTS` - Content Security Policy endpoints

_Note: These are embedded in the client-side bundle during build._

#### Cloudflare Workers Configuration

The GitHub Actions workflow automatically handles configuration:

**Secrets** (listed in `secrets:` parameter):

- Uploaded as encrypted Cloudflare Worker secrets
- Never visible in Cloudflare dashboard or logs
- Access via `env.SECRET_NAME` in your worker code

**Variables** (passed via `env:` section):

- Available as environment variables during build and runtime
- Can also be defined in `wrangler.jsonc` under `[vars]`
- Visible in logs for easier debugging

For manual deployment, set secrets with:

```bash
wrangler secret put BETTER_AUTH_SECRET --env production
wrangler secret put OPENAI_API_KEY --env production
```

And define non-sensitive config in `wrangler.jsonc`:

```jsonc
{
  "vars": {
    "NODE_ENV": "production",
    "BETTER_AUTH_URL": "https://api.your-domain.com",
  },
}
```

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

For manual deployment, ensure all environment variables from Step 9 are configured as Cloudflare Workers secrets using:

```bash
# Set secrets for API worker
wrangler secret put BETTER_AUTH_SECRET --env production
wrangler secret put OPENAI_API_KEY --env production
# ... (repeat for all required secrets)

# Or use wrangler.toml [vars] for non-sensitive configuration
```

Then deploy:

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
wrangler d1 migrations apply CLOUDBOT_DB --local
```

Wrangler automatically keeps track of the migrations already applied to the local D1 database, so it is safe to run this command multiple times during development as you create new migrations.

### 3. Run Other Apps Locally

```bash
pnpm run dev --filter=web --filter=dashboard
```

### 4. View Local Data

```bash
# Query local D1 database
wrangler d1 execute CLOUDBOT_DB --local --command "SELECT * FROM users"

# List local R2 objects
wrangler r2 object list cloudbot-bucket --local
```

## Common Commands

### D1 Database Commands

```bash
# Execute SQL on local database
wrangler d1 execute YOUR_D1_DATABASE --local --command "SELECT * FROM users"

# Execute SQL on remote database
wrangler d1 execute CLOUDBOT_DB --remote --command "SELECT * FROM users"

# Execute SQL from file
wrangler d1 execute CLOUDBOT_DB --remote --file=./query.sql

# List all D1 databases
wrangler d1 list

# Delete a database (careful!)
wrangler d1 delete CLOUDBOT_DB
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
wrangler d1 migrations apply CLOUDBOT_DB --remote

# Check migration status
wrangler d1 migrations list CLOUDBOT_DB
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
