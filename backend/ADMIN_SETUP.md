# Admin & Demo Account Setup

## Admin Emails (Full Access)

The following emails have admin privileges:

| Email | Purpose |
|-------|---------|
| `jari@studioagents.ai` | Primary admin account |
| `demo@studioagents.ai` | Demo/presentation account |
| `test@studioagents.ai` | QA testing account |
| `support@studioagents.ai` | Support team access |
| `dev@studioagents.ai` | Developer testing |

## Demo Account Configuration

Demo accounts get pre-loaded credits for testing:

| Email | Credits | Tier | Display Name |
|-------|---------|------|--------------|
| `demo@studioagents.ai` | 1000 | Lifetime | Demo User |
| `test@studioagents.ai` | 500 | Pro | Test User |
| `jari@studioagents.ai` | 9999 | Lifetime | Jari (Admin) |

## Setting Up Email Accounts

### Option 1: Gmail Aliases (Free, Quick)
If you have a Gmail account, you can create aliases:
- `yourname+demo@gmail.com`
- `yourname+test@gmail.com`
- `yourname+admin@gmail.com`

All emails go to your main inbox.

### Option 2: Custom Domain (Recommended for Production)
Set up these emails on your domain `studioagents.ai`:
1. Use Google Workspace, Zoho Mail, or similar
2. Create mailboxes for each admin email
3. Or use email forwarding to a single inbox

### Option 3: Temporary Solution
For immediate testing, you can:
1. Sign up with any email you control
2. Use the admin API to upgrade that account

## Admin API Endpoints

### Check Admin Status
```bash
GET /api/admin/status
Authorization: Bearer <firebase-token>
```

### List All Users
```bash
GET /api/admin/users
Authorization: Bearer <firebase-token>
```

### Set User Credits
```bash
POST /api/admin/users/:uid/credits
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "credits": 500,
  "reason": "Demo setup"
}
```

### Set User Tier
```bash
POST /api/admin/users/:uid/tier
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "tier": "pro"  // free, creator, pro, lifetime
}
```

### Setup All Demo Accounts
```bash
POST /api/admin/demo/setup
Authorization: Bearer <firebase-token>
```
This automatically configures all demo accounts with their preset credits and tiers.

### Get Platform Stats
```bash
GET /api/admin/stats
Authorization: Bearer <firebase-token>
```

## Testing Admin Access

1. Sign in with an admin email
2. Open browser console and run:
```javascript
fetch('/api/admin/status', {
  headers: { 'Authorization': 'Bearer ' + await firebase.auth().currentUser.getIdToken() }
}).then(r => r.json()).then(console.log)
```

3. Should return `{ isAdmin: true, ... }`

## Security Notes

- Admin emails are hardcoded in `server.js` for security
- All admin actions are logged
- Token verification is required for all admin endpoints
- Consider adding IP restrictions for production
