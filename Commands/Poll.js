const { SlashCommandBuilder } = require("@discordjs/builders");
const {
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("poll")
		.setDescription("Create a 2-option poll with buttons")
		.addStringOption((opt) =>
			opt
				.setName("option1")
				.setDescription("Text for option 1")
				.setRequired(true)
		)
		.addStringOption((opt) =>
			opt
				.setName("option2")
				.setDescription("Text for option 2")
				.setRequired(true)
		),

	async execute(interaction) {
		try {
			const Option1 = interaction.options.getString("option1");
			const Option2 = interaction.options.getString("option2");

			const initialVotes = { 1: [], 2: [] };

			const buildBar = (count1, count2) => {
				const total = count1 + count2;
				const greenCount =
					total === 0 ? 8 : Math.round((count1 / total) * 16);
				const clampedGreen = Math.min(16, Math.max(0, greenCount));
				const redCount = 16 - clampedGreen;
				return "🟩".repeat(clampedGreen) + "🟥".repeat(redCount);
			};

			const embed = new EmbedBuilder()
				.setTitle("Poll")
				.setDescription(
					"Click a button to vote. ✅ = Option 1, ❌ = Option 2"
				)
				.addFields(
					{ name: `✅ ${Option1}`, value: `Votes: 0`, inline: true },
					{ name: `❌ ${Option2}`, value: `Votes: 0`, inline: true },
					{
						name: "Results",
						value: `${buildBar(
							0,
							0
						)}\n\n0 — ${Option1} | 0 — ${Option2}`,
						inline: false,
					},
					{
						name: "votes_json",
						value: JSON.stringify(initialVotes),
						inline: false,
					}
				)
				.setColor(0x2f3136);

			const pollId = `${interaction.id}_${Date.now()}`;

			const row = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`poll_${pollId}_1`)
					.setEmoji("✅")
					.setStyle(ButtonStyle.Success),
				new ButtonBuilder()
					.setCustomId(`poll_${pollId}_2`)
					.setEmoji("❌")
					.setStyle(ButtonStyle.Danger)
			);

			const pollMessage = await interaction.reply({
				embeds: [embed],
				components: [row],
				fetchReply: true,
			});

			const collector = pollMessage.createMessageComponentCollector({
				componentType: ComponentType.Button,
				time: 24 * 60 * 60 * 1000, // 24 hours
			});

			collector.on("collect", async (btnInteraction) => {
				try {
					const msg = await btnInteraction.message.fetch();
					const currentEmbed = msg.embeds[0];
					if (!currentEmbed) {
						return btnInteraction.reply({
							content: "Poll data missing.",
							ephemeral: true,
						});
					}

					const votesField = currentEmbed.fields.find(
						(f) => f.name === "votes_json"
					);
					let votes = { 1: [], 2: [] };
					if (votesField) {
						try {
							votes = JSON.parse(votesField.value);
						} catch (e) {
							votes = { 1: [], 2: [] };
						}
					}

					const userId = btnInteraction.user.id;

					if (
						votes["1"].includes(userId) ||
						votes["2"].includes(userId)
					) {
						return btnInteraction.reply({
							content: "You already voted in this poll.",
							ephemeral: true,
						});
					}

					const chosen = btnInteraction.customId.endsWith("_1")
						? "1"
						: "2";
					votes[chosen].push(userId);

					const count1 = votes["1"].length;
					const count2 = votes["2"].length;
					const bar = buildBar(count1, count2);

					const newEmbed = EmbedBuilder.from(currentEmbed).setFields(
						{
							name: `✅ ${Option1}`,
							value: `Votes: ${count1}`,
							inline: true,
						},
						{
							name: `❌ ${Option2}`,
							value: `Votes: ${count2}`,
							inline: true,
						},
						{
							name: "Results",
							value: `${bar}\n\n${count1} — ${Option1} | ${count2} — ${Option2}`,
							inline: false,
						}
					);

					await msg.edit({ embeds: [newEmbed] });

					await btnInteraction.reply({
						content: `You voted for **${
							chosen === "1" ? Option1 : Option2
						}**.`,
						ephemeral: true,
					});
				} catch (err) {
					console.error("Poll collect error:", err);
					try {
						await btnInteraction.reply({
							content:
								"An error occurred while recording your vote.",
							ephemeral: true,
						});
					} catch {}
				}
			});

			collector.on("end", async () => {
				try {
					const disabledRow = new ActionRowBuilder().addComponents(
						row.components.map((c) =>
							ButtonBuilder.from(c).setDisabled(true)
						)
					);
					await pollMessage.edit({ components: [disabledRow] });
				} catch (err) {}
			});
		} catch (err) {
			console.error("Failed to run /poll:", err);
			try {
				await interaction.reply({
					content: "Failed to create poll — check the bot logs.",
					ephemeral: true,
				});
			} catch {}
		}
	},
};
