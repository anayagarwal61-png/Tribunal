# Discord Mod Bot

A custom moderation bot with an **owner override**: whoever's Discord ID is set as `OWNER_ID`
always passes the bot's permission checks, no matter what role they hold in the server (even
if they're your "#3" staff rank).

## What it can't do (important)

This bot **cannot bypass Discord's role hierarchy**. That's not a limitation of this code —
it's enforced by Discord's API itself, server-side. Concretely:

- The bot can only manage roles/members that sit **below its own highest role** in
  Server Settings → Roles.
- No bot, including this one, can ever act on the Server Owner.
- `OWNER_ID` only affects whether *this bot* lets someone run its commands — it does not
  change what Discord itself allows the bot to do.

So: whoever you set as `OWNER_ID` gets to *run* every command, but the bot will still refuse
(with a clear error) if the target is a role/member Discord won't let it touch. The fix in
that case is always the same: drag the bot's role higher in Server Settings → Roles.

## Setup

### 1. Create the bot application
1. Go to https://discord.com/developers/applications → **New Application**.
2. Go to **Bot** in the sidebar → **Reset Token** → copy it (this is your `DISCORD_TOKEN`).
3. Under **Privileged Gateway Intents**, enable **Server Members Intent**.
4. Go to **OAuth2 → General** and copy the **Client ID** (this is your `CLIENT_ID`).

### 2. Invite it to your server
1. Go to **OAuth2 → URL Generator**.
2. Scopes: check `bot` and `applications.commands`.
3. Bot permissions: check Manage Roles, Manage Channels, Kick Members, Ban Members,
   Moderate Members, Send Messages, View Channels.
4. Copy the generated URL, open it in your browser, and add the bot to your server.
5. **Then go to Server Settings → Roles and drag the bot's role near the top** — above
   any role you want it to be able to manage.

### 3. Get your IDs
1. In Discord, go to Settings → **Advanced** → turn on **Developer Mode**.
2. Right-click your server icon → **Copy Server ID** → this is `GUILD_ID`.
3. Right-click your own username → **Copy User ID** → this is `OWNER_ID`.

### 4. Configure and install
```bash
cp .env.example .env
# open .env and fill in DISCORD_TOKEN, CLIENT_ID, GUILD_ID, OWNER_ID
npm install
```

### 5. Deploy the slash commands, then start the bot
```bash
npm run deploy
npm start
```

Guild commands (what `deploy-commands.js` uses) show up **instantly** in your server —
good for testing. If you later want the bot in multiple servers, switch to global commands
(see the comment in `deploy-commands.js`), which take up to ~1 hour to propagate everywhere.

## Commands

| Command | What it does | Permission needed (unless you're OWNER_ID) |
|---|---|---|
| `/role create` | Create a new role | Manage Roles |
| `/role delete` | Delete a role | Manage Roles |
| `/role edit` | Rename/recolor a role | Manage Roles |
| `/role perms` | View a role's notable permissions | Manage Roles |
| `/role give` | Give a role to a member | Manage Roles |
| `/role remove` | Remove a role from a member | Manage Roles |
| `/channel lock` | Block @everyone from sending messages | Manage Channels |
| `/channel unlock` | Restore @everyone's send permission | Manage Channels |
| `/member timeout` | Timeout a member (max 28 days) | Moderate Members |
| `/member kick` | Kick a member | Kick Members |
| `/member ban` | Ban a member | Ban Members |

## Hosting it 24/7

Running `npm start` on your own computer only keeps the bot online while that computer is
on and the terminal is open. For it to stay online all the time, you'll want to run it on a
small always-on host — Railway, Render, or a cheap VPS are common free/low-cost options for
a bot this size. Happy to walk through deploying to one of those if you want.
