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
wrangler d1 create cloudbot-db
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
        "database_name": "cloudbot-db",
        "database_id": "YOUR_ACTUAL_DATABASE_ID_HERE",
        "migrations_dir": "./../../packages/server/src/drizzle/migrations"
    }
]
```

### Step 4: Run D1 Migrations

```bash
# Apply migrations to remote database
wrangler d1 migrations apply cloudbot-db --env=production --remote
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

### Step 6: Create AI Search Instance

In the Cloudflare dashboard, navigate to **AI** → **AI Search** and create a new AI Search instance. When prompted, connect it to the `cloudbot-bucket` R2 bucket you created in the previous step. This enables semantic search over files stored in R2 and is required for certain search features in the API.

Set the `AUTORAG_NAME` environment variable to the name you chose for the AI Search instance.

### Step 7: Update Custom Domains in wrangler.jsonc

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

### Step 8: Set Up GitHub Secrets (for CI/CD)

This step is based on `.github/workflows/deploy.yml`.

Go to **GitHub** -> **Settings** -> **Secrets and variables** -> **Actions** and add the following.

#### 8.1 Required for Workflow to Run

| Name                    | Type     | Required? | What it is                                                                        | How to obtain                                                                                                                           |
| ----------------------- | -------- | --------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Secret   | Yes       | API token used by Wrangler GitHub Action to deploy Workers and run D1 migrations. | Cloudflare Dashboard -> **My Profile** -> **API Tokens** -> **Create Token**. Use a token with Workers/D1 permissions for your account. |
| `CLOUDFLARE_ACCOUNT_ID` | Variable | Yes       | Cloudflare account ID used by Wrangler action.                                    | Cloudflare Dashboard -> right sidebar/account overview -> copy **Account ID**.                                                          |

#### 8.2 Deploy Jobs

These values are passed to the API, App, and Dashboard Worker deployments.

**GitHub Variables (`vars`)**

| Name                         | Required?                        | What it is                                                               | How to obtain                                                                                                                                         |
| ---------------------------- | -------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                   | Yes                              | Runtime environment for API worker.                                      | Setting to 'development' will turn on debug logs.                                                                                                     |
| `BASE_DOMAIN`                | Yes                              | Base cookie/domain scope (`your-domain.com`).                            | Your primary domain in Cloudflare DNS.                                                                                                                |
| `BETTER_AUTH_URL`            | Yes                              | Public base URL used by auth backend (`https://api.your-domain.com`).    | Your deployed API URL/domain.                                                                                                                         |
| `ADMIN_USER_IDS`             | Optional                         | Comma-separated user IDs that should have admin access.                  | Create after users exist; get IDs from your DB or from the browser console when the app is running.                                                   |
| `ALLOWED_ORIGINS`            | Yes                              | Comma-separated CORS allow-list for frontend origins.                    | Set to `chat.your-domain.com,admin.your-domain.com`                                                                                                   |
| `ENABLE_EMAIL_SIGNUP`        | Required                         | Feature flag (`true`/`false`) for email signup.                          | Decide based on your requirements.                                                                                                                    |
| `ENABLE_OAUTH_LOGIN`         | Required                         | Feature flag (`true`/`false`) for OAuth login.                           | Decide based on your requirements.                                                                                                                    |
| `ENABLE_SSO`                 | Required                         | Feature flag (`true`/`false`) for SSO login.                             | Decide based on your requirements.                                                                                                                    |
| `ALLOWED_EMAIL_DOMAINS`      | Optional                         | Comma-separated email domain allow-list.                                 | Define your allowed domains, if restricting signup (eg setting to `your-company.com` will only allow email addresses ending with `@your-company.com`) |
| `RESEND_SENDER_EMAIL`        | Required if email enabled        | Sender email identity for transactional email.                           | Create/verify sender domain/address in Resend dashboard.                                                                                              |
| `GOOGLE_CLIENT_ID`           | Required if Google OAuth enabled | Public OAuth client ID.                                                  | Google Cloud Console -> APIs & Services -> Credentials -> OAuth Client ID.                                                                            |
| `GITHUB_CLIENT_ID`           | Required if GitHub OAuth enabled | Public OAuth app/client ID.                                              | GitHub Developer Settings -> OAuth Apps/GitHub App credentials.                                                                                       |
| `GITLAB_CLIENT_ID`           | Required if GitLab OAuth enabled | Public OAuth client ID.                                                  | GitLab Applications settings for your OAuth app.                                                                                                      |
| `SSO_DOMAIN`                 | Required if SSO enabled          | Organization domain used by SSO flow.                                    | Value from your IdP/tenant configuration.                                                                                                             |
| `SSO_PROVIDER_ID`            | Required if SSO enabled          | Identifier for configured SSO provider.                                  | Value configured in your SSO provider setup.                                                                                                          |
| `SSO_CLIENT_ID`              | Required if SSO enabled          | Public SSO/OIDC client ID.                                               | Your IdP app/client registration.                                                                                                                     |
| `SSO_ISSUER`                 | Required if SSO enabled          | OIDC issuer URL.                                                         | Copy from IdP OIDC metadata/docs.                                                                                                                     |
| `SSO_DISCOVERY_ENDPOINT`     | Required if SSO enabled          | OIDC discovery URL.                                                      | Usually `https://<issuer>/.well-known/openid-configuration`.                                                                                          |
| `SSO_AUTHORIZATION_ENDPOINT` | Required if SSO enabled          | OIDC authorization endpoint URL.                                         | From IdP metadata/discovery document.                                                                                                                 |
| `SSO_TOKEN_ENDPOINT`         | Required if SSO enabled          | OIDC token endpoint URL.                                                 | From IdP metadata/discovery document.                                                                                                                 |
| `SSO_JWKS_ENDPOINT`          | Required if SSO enabled          | OIDC JWKS endpoint URL for key validation.                               | From IdP metadata/discovery document.                                                                                                                 |
| `NEXT_PUBLIC_LLM_MODELS`     | Yes                              | JSON list of models that you want to use.                                | Must be valid json. You can eg copy and modify the value in `.env.example`.                                                                           |
| `AUTORAG_NAME`               | Yes                              | Name of Cloudflare AI Search/AutoRAG instance.                           | Cloudflare dashboard -> AI Search/AutoRAG instance name.                                                                                              |
| `R2_ENDPOINT`                | Yes                              | Endpoint URL for your R2 bucket API access.                              | Set to `https://your-account-id.r2.cloudflarestorage.com`                                                                                             |
| `R2_BUCKET_NAME`             | Yes                              | Target R2 bucket name.                                                   | Bucket name created in Step 5.                                                                                                                        |
| `CLOUDFLARE_ACCESS_KEY_ID`   | Yes                              | R2 S3 access key ID.                                                     | Cloudflare R2 -> API Tokens -> create R2 API token/access key pair.                                                                                   |
| `AWS_ACCESS_KEY_ID`          | Required if AWS used             | AWS access key for AWS-based model/provider integrations.                | AWS IAM -> create access key for integration user.                                                                                                    |
| `AWS_REGION`                 | Required if AWS used             | AWS region for AWS integrations.                                         | Your AWS service region (example `us-east-1`).                                                                                                        |
| `AZURE_RESOURCE_NAME`        | Required if Azure used           | Azure OpenAI resource/deployment host resource name.                     | Azure portal -> Azure OpenAI resource overview.                                                                                                       |
| `GOOGLE_VERTEX_PROJECT`      | Required if Vertex used          | GCP project ID for Vertex AI.                                            | Google Cloud Console -> Project info.                                                                                                                 |
| `GOOGLE_VERTEX_LOCATION`     | Required if Vertex used          | Vertex AI region (example `us-central1`).                                | Google Cloud Console -> Vertex AI region you deployed in.                                                                                             |
| `GOOGLE_CLIENT_EMAIL`        | Required if Vertex used          | Service account email for Google auth.                                   | Google Cloud IAM -> Service Accounts -> email.                                                                                                        |
| `GOOGLE_PRIVATE_KEY_ID`      | Required if Vertex used          | ID of service account private key.                                       | Generated with Google service account key JSON.                                                                                                       |
| `SEARCH_PROVIDER`            | Yes                              | Name of configured search provider (see below table for allowed values). | Choose based on the API key you configured.                                                                                                           |
| `TITLE_MODEL_IDX`            | Optional                         | Index of model in `NEXT_PUBLIC_LLM_MODELS` for title generation.         | Choose integer index from your models array.                                                                                                          |
| `ARTIFACT_MODEL_IDX`         | Optional                         | Index of model for artifact generation.                                  | Choose integer index from your models array.                                                                                                          |
| `SEARCH_MODEL_IDX`           | Optional                         | Index of model used for search tasks.                                    | Choose integer index from your models array.                                                                                                          |
| `COMPLETION_MODEL_IDX`       | Optional                         | Index of model used for text completion in text editor.                  | Choose integer index from your models array.                                                                                                          |

SEARCH_PROVIDER allowed values: `vercel-ai-perplexity`, `vercel-ai-parallel`, `anthropic`, `azure`, `google`, `google-enterprise`, `openai`, `exalabs`, `parallel`, `tavily`. Careful: If you use a model provider as search provider, you can only use models from that provider for web search.

**GitHub Secrets (`secrets`)**

| Name                           | Required?                             | What it is                                               | How to obtain                                                               |
| ------------------------------ | ------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`           | Yes                                   | Secret used by Better Auth for signing/crypto.           | Generate random 32-byte hex string: `openssl rand -hex 32` (or equivalent). |
| `ENCRYPTION_KEY`               | Yes                                   | App encryption key (AES-style secret).                   | Generate strong random key (32-byte hex or app-required format).            |
| `RESEND_API_KEY`               | Required if email enabled             | API key for sending email through Resend.                | Resend dashboard -> API Keys -> create key.                                 |
| `GOOGLE_CLIENT_SECRET`         | Required if Google OAuth enabled      | OAuth client secret for Google login.                    | Google Cloud OAuth credentials page.                                        |
| `GITHUB_CLIENT_SECRET`         | Required if GitHub OAuth enabled      | OAuth app/client secret for GitHub login.                | GitHub Developer Settings -> OAuth app secret.                              |
| `GITLAB_CLIENT_SECRET`         | Required if GitLab OAuth enabled      | OAuth client secret for GitLab login.                    | GitLab application credentials page.                                        |
| `SSO_CLIENT_SECRET`            | Required if SSO enabled               | OIDC client secret for enterprise SSO provider.          | Your IdP application credentials.                                           |
| `CLOUDFLARE_SECRET_ACCESS_KEY` | Yes                                   | R2 S3 secret key paired with `CLOUDFLARE_ACCESS_KEY_ID`. | Cloudflare R2 API token/access key creation flow.                           |
| `AI_GATEWAY_API_KEY`           | Required if Vercel AI Gateway used    | Vercel AI Gateway api key.                               | Vercel dashboard.                                                           |
| `ANTHROPIC_API_KEY`            | Required if Anthropic key auth used   | Anthropic API key.                                       | Anthropic console -> API keys.                                              |
| `ANTHROPIC_AUTH_TOKEN`         | Required if Anthropic token auth used | Anthropic auth token alternative to API key mode.        | Anthropic account/token settings, if using token auth.                      |
| `AWS_SECRET_ACCESS_KEY`        | Required if AWS used                  | AWS secret access key paired with `AWS_ACCESS_KEY_ID`.   | AWS IAM access key creation flow.                                           |
| `AZURE_API_KEY`                | Required if Azure used                | API key for Azure model endpoint.                        | Azure portal -> Keys and Endpoint for your resource.                        |
| `GOOGLE_PRIVATE_KEY`           | Required if Vertex used               | Service account private key value for Google auth.       | Download/create service account key JSON and copy private key value.        |
| `OPENAI_API_KEY`               | Required if OpenAI used               | OpenAI API key for model calls.                          | OpenAI dashboard -> API keys.                                               |
| `EXA_API_KEY`                  | Required if Exa search used           | API key for Exa search provider.                         | Exa dashboard -> API keys.                                                  |
| `PARALLEL_API_KEY`             | Required if Parallel search used      | API key for Parallel search provider.                    | Parallel provider dashboard -> API keys.                                    |
| `TAVILY_API_KEY`               | Required if Tavily search used        | API key for Tavily search provider.                      | Tavily dashboard -> API keys.                                               |

Note: The `deploy-api` step also has a Wrangler `secrets:` list. Keep this list in sync with the values you actually use (e.g. if you dont use tavily, remove TAVILY_API_KEY from the `secrets:` list). If a key is listed there but missing in GitHub (and thus in `env:`), deployment can fail.

### Step 9: Deploy via GitHub Actions (Automatic)

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
- ✅ Cloudflare logging is turned on; you can turn it off in the 'wrangler.jsonc' file for each app under the 'observability' section.

### Step 10: Manual Deployment (if needed)

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
