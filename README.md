# Freeshot Page URL Indexer for Cloudflare Workers

> This Worker extracts **website page URLs only** from the paginated Freeshot Live TV listing.  
> It does **not** extract embed URLs, iframe URLs, `.m3u8`, or video stream URLs.

## 1-click deploy

After you upload this project to a **public GitHub or GitLab repository**, replace `YOUR_USERNAME/YOUR_REPO` below with your real repo path.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/YOUR_USERNAME/YOUR_REPO)

Direct deploy URL format:

```text
https://deploy.workers.cloudflare.com/?url=https://github.com/YOUR_USERNAME/YOUR_REPO
```

Cloudflare's Deploy to Cloudflare button works by cloning a public GitHub/GitLab repo into the deployer's account, configuring the Worker, then building and deploying it with Workers Builds.

## Endpoints

Once deployed:

```text
https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev/urls.txt
https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev/playlist.m3u
https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev/json
```

## What it extracts

Only URLs matching:

```text
https://freeshot.live/live-tv/channel-name/123
```

## Manual deploy

```bash
npm install
npm run deploy
```

## Local development

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:8787/playlist.m3u
```

## Files

```text
wrangler.toml
package.json
src/index.js
README.md
```
