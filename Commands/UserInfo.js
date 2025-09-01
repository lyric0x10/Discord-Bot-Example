const { EmbedBuilder } = require("discord.js");

module.exports.execute = async function (interaction) {
	const member = interaction.options.getMember("user");
	const user = interaction.options.getUser("user");

	if (!user) {
		return interaction.reply({
			content: "No user provided.",
			ephemeral: true,
		});
	}

	let guildMember = member;
	if (!guildMember && interaction.guild) {
		try {
			guildMember = await interaction.guild.members.fetch(user.id);
		} catch (err) {
			guildMember = null;
		}
	}

	const title = `${user.username}#${user.discriminator}`;
	const avatar = user.displayAvatarURL({ size: 512 });

	const joinedValue =
		guildMember && guildMember.joinedTimestamp
			? new Date(guildMember.joinedTimestamp).toLocaleString()
			: "Not in this server / unknown";

	const createdValue = user.createdTimestamp
		? new Date(user.createdTimestamp).toLocaleString()
		: "Unknown";

	const rolesValue =
		guildMember && guildMember.roles && guildMember.roles.cache
			? guildMember.roles.cache
					.filter((r) => r.id !== interaction.guild.id)
					.map((r) => r.name)
					.join(", ") || "None"
			: "Not in this server / None";

	const embed = new EmbedBuilder()
		.setTitle(title)
		.setThumbnail(avatar)
		.addFields(
			{
				name: "Joined Server",
				value: joinedValue,
				inline: true,
			},
			{
				name: "Account Created",
				value: createdValue,
				inline: true,
			},
			{
				name: "Roles",
				value: rolesValue,
				inline: false,
			}
		)
		.setTimestamp();

	await interaction.reply({ embeds: [embed] });
};
