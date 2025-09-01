const { EmbedBuilder } = require("discord.js");

module.exports.execute = async function (interaction) {
	const ping = interaction.client.ws.ping;

	const embed = new EmbedBuilder()
		.setTitle("🏓 Pong!")
		.setDescription(`Bot Latency: **${ping}**ms`)
		.setTimestamp();

	await interaction.reply({ embeds: [embed] });
};
