# Deployment secrets

These are configured under **GitHub → repo → Settings → Secrets and variables → Actions**.
They are read by `.github/workflows/deploy.yml` on every push to `main`.

| Secret | What it is | How to get it |
|---|---|---|
| `DEPLOY_SSH_KEY` | Private key for a deploy-only SSH key | See step 1 below |
| `DEPLOY_KNOWN_HOSTS` | The server's SSH host key | `ssh-keyscan -p PORT HOST` |
| `DEPLOY_HOST` | Server hostname or IP | hPanel → Advanced → SSH |
| `DEPLOY_PORT` | SSH port (Hostinger often uses a non-default one) | hPanel → Advanced → SSH |
| `DEPLOY_USER` | SSH username | hPanel → Advanced → SSH |
| `DEPLOY_PATH` | Absolute path to the repo on the server | Where `git clone` put it, e.g. `/home/u123/public_html/PAGYS` |
| `SITE_URL` | Public site URL, used for the health check | e.g. `https://pagyss.com` |

## 1. Create a deploy key pair

Run this on your own machine, not on the server:

```
ssh-keygen -t ed25519 -C "github-actions-deploy" -f pagys_deploy
```

That produces two files:

- `pagys_deploy` — the **private** key. This is the value for `DEPLOY_SSH_KEY`.
- `pagys_deploy.pub` — the **public** key. Add it to the server below.

## 2. Add the public key to the server

In hPanel → Advanced → SSH → Manage SSH keys, or append to
`~/.ssh/authorized_keys` on the server via SSH.

## 3. Grab the host key

```
ssh-keyscan -p PORT HOST
```

Paste the full output (all three lines) as `DEPLOY_KNOWN_HOSTS`. This is what
prevents the workflow from connecting to an impostor host.

## Notes

- The workflow runs `npm ci && npm run build` **on the server**, so the served
  bundle is built from the committed source rather than relying on `dist/` being
  committed and current.
- It stops pm2 before `git reset --hard`, then restarts afterwards, so the
  process picks up new code in `server/index.js`.
- If the server has no `ecosystem.config.js`, the restart steps are skipped and
  the process must be restarted some other way.