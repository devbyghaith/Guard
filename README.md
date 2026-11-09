<p align="center"><img src="assets/logo.png" alt="Guard" width="160"></p>

# Guard

> **Originally built in January–February 2022.** Uploaded to GitHub in November 2026 as an archive of my early work. The commit dates match the original file timestamps. The code is as it was in 2022, except that the bot token in `settings/` was replaced with a placeholder.

A Discord server protection bot built with discord.js v13 and slash commands. It watches for destructive actions, such as mass channel or role deletion, mass bans or kicks, and bots being added, and responds automatically. Only the server owner and users they trust are allowed to do those things freely.

## Features
- **Channel protection:** detects channels being created or deleted, can recover deleted channels or remove new ones, then bans, kicks or disables the member responsible
- **Role protection:** the same for roles
- **Member protection:** limits mass bans and kicks, and blocks unauthorized bots from being added
- **Configurable per server:** repetition threshold, cooldown window (1–5 min), response action and logs channel, all through `/protection`
- **Access control:** `/access` (owner only) manages who can configure the bot, and `/bypass` exempts trusted users from protection
- **Logs:** member bans and server updates are logged
- **Reaction roles**

## Stack
Node.js, discord.js v13, `@discordjs/builders` / `@discordjs/rest` slash commands, MySQL (`mysql2`).

## Structure
```
settings/                        bot token/intents and MySQL settings
source/main.js                   entry point
source/client/index.js           client, command loading and registration
source/client/commands/          /access, /bypass, /protection, help
source/client/events/guild/      protection, logs, utilities and command listener
source/database/                 MySQL connection and table manager
```

## Running it
1. Fill in `settings/client.js` (bot token) and `settings/mysql.js`.
2. `yarn install`, then `yarn start`.

## Author
Ghaith (icxaith), 2022
