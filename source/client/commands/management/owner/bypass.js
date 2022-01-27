const DiscordJSBuilders = require("@discordjs/builders");

const { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");

const TableManager = require("../../../../database/table-manager");

const GuildsTable = new TableManager("guilds");
const BypassTable = new TableManager("bypass");
const UsersTable = new TableManager("users");

module.exports = {
    data: new DiscordJSBuilders.SlashCommandBuilder()
        .setName("bypass")
        .setDescription("Manage the current server bypass list! (NOTE: Only the server owner is allowed to use this command)")
        .addSubcommand((subcommand) => subcommand
            .setName("add")
            .setDescription("Add a user to the bypass list")
            .addUserOption((option) => option
                .setName("user")
                .setDescription("User to add to the bypass list")
                .setRequired(true)))
        .addSubcommand((subcommand) => subcommand
            .setName("remove")
            .setDescription("Remove a user from the bypass list")
            .addUserOption((option) => option
                .setName("user")
                .setDescription("User to remove from the bypass list")
                .setRequired(true))),
    
    isExecutable: (interaction) => interaction.user.id == interaction.guild.ownerId,
    execute: async (client, interaction) => {
        let guildData = await GuildsTable.fetchRow({ Guild: interaction.guildId });

        let executedComamnd = interaction.options.getSubcommand();
        let selectedUser = interaction.options.getUser("user");

        let selectedUserData = await UsersTable.fetchRow({ User: selectedUser.id });
        let userData = await UsersTable.fetchRow({ User: interaction.guild.ownerId });
        let isUserBypassed = await BypassTable.doesRowExist({ Guild: guildData.Id , User: selectedUserData.Id });

        switch (executedComamnd.toLowerCase()) {
            case ("add"):
                if (isUserBypassed) return interaction.reply({ ephemeral: true, embeds: [ new MessageEmbed().setColor(0xEF5350).setDescription(">>> **لقد قمت بإضافة هذا المستخدم الى قائمة التجاوز من قبل**") ] });
                else {
                    let confirmationEmbed = new MessageEmbed();
                        confirmationEmbed.setColor(0xFAA81A);
                        confirmationEmbed.setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });
                        confirmationEmbed.setTitle("تاكيد التخطي");
                        confirmationEmbed.setDescription(`هل انت متأكد من اضافة <@${selectedUser.id}> الى قائمة التجاوز؟`);
                        confirmationEmbed.addField("تحذير:", (`إذا قمت بإضافة هذا المستخدم الى قائمة التجاوز فسيكون قادرًا على فعل الإجراءات التالية دون أن يقاومه البوت !!!`));
                        confirmationEmbed.addField("الإجراءات:", (`• **حذف / إنشاء الرومات**\n• **حذف / إنشاء الرتب**\n• **طرد / حظر الأعضاء**`))
                        confirmationEmbed.setTimestamp();
                    
                    let confirmButton = new MessageButton();
                        confirmButton.setStyle("SUCCESS");
                        confirmButton.setCustomId("CONFIRMATION_CONFIRM");
                        confirmButton.setLabel("نعم");

                    let cancelButton = new MessageButton();
                        cancelButton.setStyle("DANGER");
                        cancelButton.setCustomId("CONFIRMATION_CANCEL");
                        cancelButton.setLabel("لا");

                    let confirmationMessage = await interaction.channel.send({ embeds: [ confirmationEmbed ], components: [ new MessageActionRow().addComponents(confirmButton, cancelButton) ] });
                    let confirmationCollector = confirmationMessage.createMessageComponentCollector({ componentType: "BUTTON", max: 1, filter: (i) => i.user.id == interaction.user.id });

                    confirmationCollector.on("collect", async (buttonInteraction) => {
                        switch (buttonInteraction.customId) {
                            case ("CONFIRMATION_CONFIRM"):
                                await BypassTable.insertRow({ Guild: guildData.Id, Giver: userData.Id, User: selectedUserData.Id });

                                return confirmationMessage.edit({ embeds: [ new MessageEmbed().setColor(0x66BB6A).setDescription(`>>> **تم اضافة <@${selectedUser.id}> الى قائمة التجاوز بنجاح**`) ], components: [] });
                            break;

                            case ("CONFIRMATION_CANCEL"):
                                return confirmationMessage.edit({ embeds: [ new MessageEmbed().setColor(0xEF5350).setDescription(`>>> **تم إلغاء عملية اضافة <@${selectedUser.id}> الى قائمة التجاوز**`) ], components: [] });
                            break;
                        };
                    });
                };
            break;

            case ("remove"):
                if (isUserBypassed) {
                    await BypassTable.deleteRow({ Guild: guildData.Id , User: selectedUserData.Id });

                    return interaction.reply({ ephemeral: true, embeds: [ new MessageEmbed().setColor(0x66BB6A).setDescription(`>>> **تم إزالة <@${selectedUser.id}> من قائمة التجاوز بنجاح**`) ] });
                } else return interaction.reply({ ephemeral: true, embeds: [ new MessageEmbed().setColor(0xEF5350).setDescription(`>>> **لم تقم بإضافة <@${selectedUser.id}> الى قائمة التجاوز من قبل**`) ] });
            break;
        };
    },
};