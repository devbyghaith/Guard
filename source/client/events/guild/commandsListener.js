const { MessageEmbed } = require("discord.js");

module.exports = {
    once: false,
    type: "interactionCreate",

    async execute(client, interaction) {
        if (!interaction.isCommand()) return;

        let command = client.commands.get(interaction.commandName);

        if (command) {
            if (command.isExecutable && command.isExecutable instanceof Function) {
                let isExecutable = await command.isExecutable(interaction);

                if (isExecutable) {
                    try {
                        return command.execute(client, interaction);
                    } catch (error) {
                        console.log("[CATCHES]", (error.message ? error.message : error));
            return interaction.reply({ embeds: [ new MessageEmbed().setColor(0xEF5350).setTitle(">>> حدث خطأ غير متوقع. يرجى إعادة المحاولة لاحقًا") ], ephemeral: true });
                    };
                } else return interaction.reply({ embeds: [ new MessageEmbed().setColor(0xEF5350).setTitle(">>> لا يمكنك استخدام هذا الامر !") ] })
            } else return command.execute(client, interaction);
        };
    },
};