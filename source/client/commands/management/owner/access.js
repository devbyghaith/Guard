const DiscordJSBuilders = require("@discordjs/builders");

const { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");

const TableManager = require("../../../../database/table-manager");

const GuildsTable = new TableManager("guilds");
const AccessTable = new TableManager("access");
const UsersTable = new TableManager("users");

module.exports = {
    data: new DiscordJSBuilders.SlashCommandBuilder()
        .setName("access")
        .setDescription("Manage the current server access list! (NOTE: Only the server owner is allowed to use this command)")
        .addSubcommand((subcommand) => subcommand
            .setName("add")
            .setDescription("Add a user to the access list")
            .addUserOption((option) => option
                .setName("user")
                .setDescription("User to add to the access list")
                .setRequired(true)))
        .addSubcommand((subcommand) => subcommand
            .setName("remove")
            .setDescription("Remove a user from the access list")
            .addUserOption((option) => option
                .setName("user")
                .setDescription("User to remove from the access list")
                .setRequired(true))),
    
    isExecutable: (interaction) => interaction.user.id == interaction.guild.ownerId,
    execute: async (client, interaction) => {
        let guildData = await GuildsTable.fetchRow({ Guild: interaction.guildId });

        let executedComamnd = interaction.options.getSubcommand();
        let selectedUser = interaction.options.getUser("user");

        let selectedUserData = await UsersTable.fetchRow({ User: selectedUser.id });
        let userData = await UsersTable.fetchRow({ User: interaction.guild.ownerId });
        let isUserAccessed = await AccessTable.doesRowExist({ Guild: guildData.Id , User: selectedUserData.Id });

        switch (executedComamnd.toLowerCase()) {
            case ("add"):
                if (isUserAccessed) return interaction.reply({ ephemeral: true, embeds: [ new MessageEmbed().setColor(0xEF5350).setDescription(">>> **لقد قمت بإعطاء هذا المستخدم الصلاحية من قبل**") ] });
                else {
                    let confirmationEmbed = new MessageEmbed();
                        confirmationEmbed.setColor(0xFAA81A);
                        confirmationEmbed.setAuthor({ name: interaction.client.user.tag, iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) });
                        confirmationEmbed.setTitle("تاكيد اعطاء الصلاحية");
                        confirmationEmbed.setDescription(`هل انت متأكد من اعطاء <@${selectedUser.id}> صلاحية التحكم في البوت ؟`);
                        confirmationEmbed.addField("تحذير:", (`إذا قمت بإعطاء هذا المستخدم صلاحية التحكم فسيكون قادرًا على فعل الإجراءات التالية دون أن يقاومه البوت !!!`));
                        confirmationEmbed.addField("الإجراءات:", (`• **تعديل إعدادات الحماية**`))
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
                                await AccessTable.insertRow({ Guild: guildData.Id, Giver: userData.Id, User: selectedUserData.Id });

                                return confirmationMessage.edit({ embeds: [ new MessageEmbed().setColor(0x66BB6A).setDescription(`>>> **تمت إعطاء الصلاحية الى <@${selectedUser.id}> بنجاح إلى**`) ], components: [] });
                            break;

                            case ("CONFIRMATION_CANCEL"):
                                return confirmationMessage.edit({ embeds: [ new MessageEmbed().setColor(0xEF5350).setDescription(`>>> **تم إلغاء عملية اعطاء <@${selectedUser.id}> الصلاحية**`) ], components: [] });
                            break;
                        };
                    });
                };
            break;

            case ("remove"):
                if (isUserAccessed) {
                    await AccessTable.deleteRow({ Guild: guildData.Id , User: selectedUserData.Id });

                    return interaction.reply({ ephemeral: true, embeds: [ new MessageEmbed().setColor(0x66BB6A).setDescription(`>>> **تمت الإزالة الصلاحية من <@${selectedUser.id}> بنجاح**`) ] });
                } else return interaction.reply({ ephemeral: true, embeds: [ new MessageEmbed().setColor(0xEF5350).setDescription(`>>> **لم تقم بإعطاء <@${selectedUser.id}> مسبقا**`) ] });
            break;
        };
    },
};