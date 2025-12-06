# GitHub Authentication Setup

## Quick Method: Personal Access Token

### Step 1: Create a Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: `ERP Deployment`
4. Select scopes: Check **`repo`** (full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)

### Step 2: Push with Token

When you run the push command, use your token as the password:

```bash
git push -u origin main
```

When prompted:
- **Username**: `abdulrahmanbathhish`
- **Password**: Paste your Personal Access Token (not your GitHub password!)

### Alternative: Use Token in URL (One-time)

```bash
git remote set-url origin https://YOUR_TOKEN@github.com/abdulrahmanbathhish/erp-stock-sales.git
git push -u origin main
```

Replace `YOUR_TOKEN` with your actual token.

---

## Or Use SSH (More Secure)

If you prefer SSH:

1. Generate SSH key:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. Add to GitHub:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
   Copy the output and add it at: https://github.com/settings/keys

3. Update remote:
   ```bash
   git remote set-url origin git@github.com:abdulrahmanbathhish/erp-stock-sales.git
   git push -u origin main
   ```

