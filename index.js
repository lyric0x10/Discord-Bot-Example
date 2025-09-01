// index.js (CommonJS)
const {
	Client,
	GatewayIntentBits,
	Collection,
	SlashCommandBuilder,
} = require("discord.js");
const {
	REST
} = require("@discordjs/rest");
const {
	Routes
} = require("discord-api-types/v10");
const fs = require("fs");
const path = require("path");
const config = require("./config.json");

const client = new Client({
	intents: [GatewayIntentBits.Guilds]
});
client.commands = new Collection();

// --- Define commands dict (filename -> SlashCommandBuilder) ---
// NOTE: use a User option (not mentionable) so the command returns a user/member, not a role.
const commands = {
	"UserInfo.js": new SlashCommandBuilder()
		.setName("userinfo")
		.setDescription("Returns embed with avatar, roles, join date.")
		.addUserOption((option) =>
			option
			.setName("user")
			.setDescription("Select a user.")
			.setRequired(true)
		),
	"Ping.js": new SlashCommandBuilder().setName("ping").setDescription("Pong"),
	"Poll.js": new SlashCommandBuilder()
		.setName("poll")
		.setDescription("Create a 2 option poll.")
		.addStringOption((option1) =>
			option1
			.setName("option1")
			.setDescription("Option 1")
			.setRequired(true)
		)
		.addStringOption((option2) =>
			option2
			.setName("option2")
			.setDescription("Option 2")
			.setRequired(true)
		),
	"TicTacToe.js": new SlashCommandBuilder()
		.setName("tictactoe")
		.setDescription("Play Tic Tac Toe vs AI.")
		.addIntegerOption((difficulty) =>
			difficulty
			.setName("difficulty")
			.setDescription("AI's difficulty level, 1-10 (1=easy, 10=hard).")
			.setRequired(true)
		),
	"Purge.js": new SlashCommandBuilder()
		.setName("purge")
		.setDescription("Deletes a number of messages.")
		.addIntegerOption((amount) =>
			amount
			.setName("amount")
			.setDescription("Number of messages to delete (1-100).")
			.setRequired(true)
		),
};

// Build a map: command name -> filename
const nameToFile = {};
for (const [file, builder] of Object.entries(commands)) {
	nameToFile[builder.toJSON().name] = file;
}

// --- Register commands to the guild ---
const rest = new REST({
	version: "10"
}).setToken(config.token);

(async () => {
	try {
		console.log("Registering slash commands...");
		const commandArray = Object.values(commands).map((cmd) => cmd.toJSON());
		await rest.put(
			Routes.applicationGuildCommands(config.clientId, config.guildId), {
				body: commandArray
			}
		);
		console.log("Slash commands registered successfully.");
	} catch (error) {
		console.error("Error registering commands:", error);
	}
})();

// --- Interaction handler: dynamically require the command file and call execute ---
// use isChatInputCommand for slash commands
client.on("interactionCreate", async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const file = nameToFile[interaction.commandName];
	if (!file) {
		return interaction.reply({
			content: "Unknown command.",
			ephemeral: true,
		});
	}

	try {
		// require the command file (assumes CommonJS exports)
		const cmdPath = path.join(__dirname, "commands", file);
		// Clear cache for development hot reloads (optional)
		delete require.cache[require.resolve(cmdPath)];
		const module = require(cmdPath);

		if (!module || typeof module.execute !== "function") {
			return interaction.reply({
				content: "Command is missing execute function.",
				ephemeral: true,
			});
		}

		// Run the command
		await module.execute(interaction);
	} catch (err) {
		console.error("Command execution error:", err);
		if (!interaction.replied && !interaction.deferred) {
			await interaction.reply({
				content: "There was an error running that command.",
				ephemeral: true,
			});
		} else {
			try {
				await interaction.editReply(
					"There was an error running that command."
				);
			} catch (_) {}
		}
	}
});

// --- Ready event ---
client.once("clientReady", () => {
	console.log(`${client.user.tag} is online!`);
});

client.login(config.token);