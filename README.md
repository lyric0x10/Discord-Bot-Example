# Discord Bot — Example (games, utilities, voting)

[![Build](https://img.shields.io/badge/build-example-brightgreen)]()
[![Language](https://img.shields.io/badge/language-JavaScript-blue)]()
[![License](https://img.shields.io/badge/license-MIT-lightgrey)]()

A simple **Discord bot example** demonstrating:

* Game commands (Tic Tac Toe vs an AI)
* Utility commands (`purge`, `ping`, `userinfo`)
* Voting (`poll` — 2-option poll)

This README follows the same structure as the Lua Parser example you provided.

---

## 📖 Table of Contents

* [Features](#-features)
* [Files & Structure](#-files--structure)
* [How to Run](#-how-to-run)
* [Commands (details)](#-commands-details)
* [Examples](#-examples)
* [About the Code](#-about-the-code)
* [Troubleshooting & Notes](#-troubleshooting--notes)
* [Limitations](#-limitations)
* [Future Plans](#-future-plans)
* [Contributing](#-contributing)
* [License](#-license)

---

## ✨ Features

* Slash-command based architecture (uses `SlashCommandBuilder` objects).
* Dynamic command loader: maps command name → filename and `require()`s command modules at runtime.
* Commands included:

  * `userinfo` — returns an embed with avatar, roles, join date.
  * `ping` — latency check (Pong).
  * `poll` — create a 2-option poll.
  * `tictactoe` — play Tic Tac Toe vs AI (difficulty 1–10).
  * `purge` — bulk-delete messages (1–100).
* Development-friendly: deletes `require.cache` so command file changes are hot-reloadable without restarting the process (when using the same Node process).

---

## 📁 Files & Structure (example)

```
├─ index.js              # main entry (registers commands + handles interactions)
├─ config.json           # token, clientId, guildId
├─ package.json
├─ commands/
│  ├─ Ping.js
│  ├─ UserInfo.js
│  ├─ Poll.js
│  ├─ TicTacToe.js
│  └─ Purge.js
└─ LICENSE
```

---

## 🚀 How to Run

### Requirements

* Node.js (>= 16.9.0)
* A Discord bot application with token, client ID and a test guild ID (for guild-scoped command registration)

> Note: This example registers **guild** commands via `applicationGuildCommands`. Use this during development for immediate updates. For global commands (slower propagation) you would use application commands route instead.

### Install

```bash
# from repo root
npm install
```

Install dependencies you need (example):

```bash
npm install discord.js @discordjs/rest discord-api-types
```

### config.json

Create a `config.json` next to `index.js`:

```json
{
  "token": "YOUR_BOT_TOKEN",
  "clientId": "YOUR_APPLICATION_CLIENT_ID",
  "guildId": "YOUR_TEST_GUILD_ID"
}
```

### Run

```bash
node index.js
```

You should see console messages for command registration and bot startup.

---

## 🛠 Commands (details)

All commands are slash (chat input) commands. The bot registers them from the `commands` dictionary in `index.js`.

### `userinfo`

* **Usage:** `/userinfo user:@someone`
* **Description:** Returns an embed that includes the user's avatar, role list and join date in the guild.
* **Options:** `user` (User) — required.

### `ping`

* **Usage:** `/ping`
* **Description:** Simple latency check. Responds with "Pong" (and optionally latency info).

### `poll`

* **Usage:** `/poll option1:Yes option2:No`
* **Description:** Creates a simple 2-option poll. (Implementation may add reactions or an interactive component.)

### `tictactoe`

* **Usage:** `/tictactoe difficulty:5`
* **Description:** Play Tic Tac Toe vs AI.
* **Options:** `difficulty` (Integer, 1–10) — required. (1 = easy, 10 = hard)

### `purge`

* **Usage:** `/purge amount:10`
* **Description:** Bulk-delete a number of messages from the channel.
* **Options:** `amount` (Integer, 1–100) — required.
* **Permissions:** The bot (and probably the user) must have the `MANAGE_MESSAGES` permission.

---

## 🧾 Examples

Registering commands: `index.js` uses `@discordjs/rest` and `Routes.applicationGuildCommands(config.clientId, config.guildId)` to register the command array produced from `SlashCommandBuilder` objects.

Handling interactions: on the `interactionCreate` event the code:

* Checks `isChatInputCommand()`.
* Maps the command name to a filename (`nameToFile`).
* `require()`s `commands/<file>`, clears the cache for hot reload.
* Calls the command module's `execute(interaction)`.

Example command call in chat (slash UI):

```
/tictactoe difficulty:3
```

Expected behavior: the bot responds with an interactive message showing the tic-tac-toe board and accepts moves (depending on your command implementation).

---

## 🧑‍💻 About the Code

Highlights from your `index.js`:

* Uses `SlashCommandBuilder` to build command metadata programmatically.
* Keeps `commands` mapping in the main file (filename -> builder).
* Builds `nameToFile` for quick lookup of filesystem command modules by registered command name.
* Registers commands to a guild using `REST.put(...)`.
* Clears `require.cache` for each command require to allow editing commands during runtime.

You mentioned using CommonJS module exports (e.g. `module.exports = { execute: async (interaction) => { ... } }`) — the handler expects each command file to export an `execute` function.

---

## 🛠 Troubleshooting & Notes

* **Event name**: Make sure your ready event uses the correct event string:

  ```js
  // correct
  client.once("ready", () => { console.log(`${client.user.tag} is online!`); });
  ```

  If your code uses `clientReady`, change it to `ready`.
* **Permissions & intents**:

  * The example uses `GatewayIntentBits.Guilds`. If a command requires fetching members or presence info, you may need additional intents and to enable privileged intents in the Discord Developer Portal.
* **Command registration**:

  * Guild commands update instantly. Global commands take up to an hour to propagate.
  * If you change the `SlashCommandBuilder` shape, re-run the registration (the example runs the registration at startup).
* **Rate limits & tokens**:

  * Keep your bot token secret. If leaked, regenerate it in the Developer Portal.
* **Purging messages**:

  * Discord's bulk delete endpoint only supports deleting messages younger than 14 days. Ensure your `purge` command handles and reports this.
* **Error handling**:

  * The interaction handler attempts to reply/editReply if an exception occurs — ensure your command modules use try/catch where appropriate.

---

## ⚠️ Limitations

* This is a **minimal example** for demonstration/learning; production bots require more robust permission checks, logging, and error handling.
* Not all Discord edge-cases (rate limits, partials) are fully handled in the minimal example.
* Tic Tac Toe AI difficulty controls are as implemented — complexity depends on your AI logic.

---

## 🔮 Future Plans

* Add a modular command loader (auto-load all files in `commands/` automatically).
* Move command registration to a dedicated script or add an `npm run register-commands` script.
* Add tests for command handlers and permission checks.
* Improve Tic Tac Toe AI (minimax with pruning for consistent difficulty levels).
* Add more utility features: `ban`, `kick`, logging, configurable prefixes (if mixing message commands).

---

## 🤝 Contributing

Contributions welcome!

* Open an issue for bugs/feature requests.
* Submit PRs with small, focused changes.
* Add unit tests where appropriate.
* Keep the repository style consistent and document any new commands.

---

## 📜 License

This project is licensed under the **MIT License**. See `LICENSE` for details.
