# Discord Bot Example

A simple Discord bot built with `discord.js` showcasing a variety of commands including games, utilities, and polls.

## Features

### Game Commands
- **Tic Tac Toe**: Play against an AI with selectable difficulty levels (1–10).

### Utility Commands
- **Ping**: Check if the bot is online.
- **Purge**: Delete a specified number of messages (1–100).
- **UserInfo**: Display a user's avatar, roles, and join date.

### Voting Commands
- **Poll**: Create a simple 2-option poll for server members.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/discord-bot-example.git
   cd discord-bot-example
````

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `config.json` file with your bot token and IDs:

   ```json
   {
     "token": "YOUR_BOT_TOKEN",
     "clientId": "YOUR_CLIENT_ID",
     "guildId": "YOUR_GUILD_ID"
   }
   ```

## Usage

1. Run the bot:

   ```bash
   node index.js
   ```

2. Use slash commands in your Discord server:

   * `/ping`
   * `/purge <amount>`
   * `/userinfo <user>`
   * `/poll <option1> <option2>`
   * `/tictactoe <difficulty>`

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT License
