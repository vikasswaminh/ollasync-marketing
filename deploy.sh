#!/usr/bin/env bash
# Ollasync marketing deploy → Cloudflare Pages project "ollasync-marketing" (ollasync.com).
# Mints a short-lived Pages-Write token from the master mint-token in cf.txt, deploys dist/,
# then REVOKES the token. Secret values are never printed (only sha256 prefixes / token ids).
#
# Prereqs:
#   - cf.txt in the repo root (GITIGNORED) containing the master mint-token (cfat_...)
#   - CF_ACCOUNT_ID env var = your Cloudflare account id
#   - Node (wrangler runs via npx)
#
# Usage:
#   npm ci && npm run build
#   CF_ACCOUNT_ID=<acct> ./deploy.sh main        # PRODUCTION (updates ollasync.com)
#   CF_ACCOUNT_ID=<acct> ./deploy.sh preview      # preview (<hash>.ollasync-marketing.pages.dev)
set -euo pipefail

BRANCH="${1:-preview}"
DIST="dist"
PROJECT="ollasync-marketing"
ACCT="${CF_ACCOUNT_ID:?set CF_ACCOUNT_ID to your Cloudflare account id}"
PAGES_WRITE_PG="8d28297797f24fb8a0c332fe0866ec89"   # Cloudflare "Pages: Write" permission-group id (a global constant, not a secret)
API="https://api.cloudflare.com/client/v4"

[ -d "$DIST" ] || { echo "dist/ not found — run: npm ci && npm run build"; exit 2; }
MASTER=$(grep -oE 'cfat_[A-Za-z0-9]+' cf.txt | head -1)
[ -n "$MASTER" ] || { echo "master token (cfat_...) not found in cf.txt (place cf.txt in the repo root)"; exit 2; }
echo "master token sha256: $(printf %s "$MASTER" | sha256sum | cut -c1-12)…  (redacted)"

echo "→ verifying master token…"
curl -s "$API/accounts/$ACCT/tokens/verify" -H "Authorization: Bearer $MASTER" \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);if(!j.success){console.error("verify failed",JSON.stringify(j.errors));process.exit(1)}console.log("  master token OK:",j.result.status)})'

echo "→ minting short-lived Pages-Write token…"
EXPIRES=$(date -u -d '+1 hour' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v+1H +%Y-%m-%dT%H:%M:%SZ)
MINT=$(curl -s -X POST "$API/accounts/$ACCT/tokens" \
  -H "Authorization: Bearer $MASTER" -H "Content-Type: application/json" \
  -d "{\"name\":\"olla-pages-deploy-$(date +%s)\",\"policies\":[{\"effect\":\"allow\",\"resources\":{\"com.cloudflare.api.account.$ACCT\":\"*\"},\"permission_groups\":[{\"id\":\"$PAGES_WRITE_PG\"}]}],\"expires_on\":\"$EXPIRES\"}")
TOKEN=$(echo "$MINT" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);if(!j.success){console.error("mint failed",JSON.stringify(j.errors));process.exit(1)}process.stdout.write(j.result.value)})')
TOKEN_ID=$(echo "$MINT" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);process.stdout.write(j.result.id)})')
echo "  minted token id: $TOKEN_ID  (sha256 $(printf %s "$TOKEN" | sha256sum | cut -c1-12)…, expires $EXPIRES)"

revoke() {
  echo "→ revoking minted token $TOKEN_ID…"
  curl -s -X DELETE "$API/accounts/$ACCT/tokens/$TOKEN_ID" -H "Authorization: Bearer $MASTER" \
    | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log("  revoke:",j.success?"OK":JSON.stringify(j.errors))})' || echo "  revoke call failed — REVOKE MANUALLY: $TOKEN_ID"
}
trap revoke EXIT

echo "→ deploying $DIST to Pages project '$PROJECT' branch '$BRANCH'…"
CLOUDFLARE_API_TOKEN="$TOKEN" CLOUDFLARE_ACCOUNT_ID="$ACCT" \
  npx --yes wrangler@3 pages deploy "$DIST" \
    --project-name "$PROJECT" --branch "$BRANCH" --commit-dirty=true 2>&1 | tee /tmp/olla_deploy.log || true

echo "→ deploy step done (token revoked on exit)."
