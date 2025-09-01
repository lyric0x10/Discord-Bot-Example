const {
    EmbedBuilder
} = require("discord.js");

module.exports.execute = async function (interaction) {
    const amount = interaction.options.getInteger("amount");

    if (!amount || amount < 1 || amount > 100) {
        return interaction.reply({
            content: "Amount must be between 1 and 100.",
            ephemeral: true
        });
    }

    try {
        await interaction.channel.bulkDelete(amount, true);
        await interaction.reply({
            content: "Done!",
            ephemeral: true
        });
    } catch (err) {
        console.error(err);
        await interaction.reply({
            content: "There was an error trying to purge messages in this channel!",
            ephemeral: true
        });
    }
};