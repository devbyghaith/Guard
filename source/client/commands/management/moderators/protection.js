const DiscordJSBuilders = require("@discordjs/builders");

const { MessageEmbed } = require("discord.js");

const TableManager = require("../../../../database/table-manager");

const ProtectionsTable = new TableManager("protections");
const ChannelsTable = new TableManager("channels");
const GuildsTable = new TableManager("guilds");
const AccessTable = new TableManager("access");
const UsersTable = new TableManager("users");

module.exports = {
    data: new DiscordJSBuilders.SlashCommandBuilder()
        .setName("protection")
        .setDescription("Manage server protection (NOTE: Server owner and users with access are allowed to use this command)")
        .addSubcommandGroup((subcommandGroup) => subcommandGroup
            .setName("main")
            .setDescription("Manage the settings of server protection")
            .addSubcommand((subcommand) => subcommand
                .setName("status")
                .setDescription("Manage the status of server channels protection")
                .addBooleanOption((option) => option
                    .setName("enabled")
                    .setDescription("Update the protection status (True: ON | False: OFF)")
                    .setRequired(true))))
        .addSubcommandGroup((subcommandGroup) => subcommandGroup
            .setName("channels")
            .setDescription("Channels Protection"))
            .addSubcommandGroup((subcommandGroup) => subcommandGroup
                .setName("channels_settings")
                .setDescription("Manage the settings of server channels protection")
                .addSubcommand((subcommand) => subcommand
                    .setName("recover")
                    .setDescription("Whether to recover deleted channels or delete created ones")
                    .addBooleanOption((option) => option
                        .setName("enabled")
                        .setDescription("Update the recover status (True: ON | False: OFF)")
                        .setRequired(true)))
                .addSubcommand((subcommand) => subcommand
                    .setName("behavior")
                    .setDescription("How should the bot behave when channels are created or deleted")
                    .addStringOption((option) => option
                        .setName("action")
                        .setDescription("The action")
                        .addChoice("ban member", "shouldBanMember")
                        .addChoice("kick member", "shouldKickMember")
                        .addChoice("disable member", "shouldDisableMember")
                        .setRequired(true)))
                .addSubcommand((subcommand) => subcommand
                    .setName("repetition")
                    .setDescription("Amount of channels that can be created or deleted before the bot responds")
                    .addNumberOption((option) => option
                        .setName("amount")
                        .setDescription("The amount")
                        .setRequired(true)))
                .addSubcommand((subcommand) => subcommand
                    .setName("logs")
                    .setDescription("Where should the bot logs be sent to")
                    .addChannelOption((option) => option
                        .setName("channel")
                        .addChannelType(0)
                        .setDescription("The channel")
                        .setRequired(true)))
                .addSubcommand((subcommand) => subcommand
                    .setName("cooldown")
                    .setDescription("Moderators will not be able to create or delete more that the allowed repetition amount in this time")
                    .addStringOption((option) => option
                        .setName("time")
                        .setDescription("The time")
                        .addChoice("1m", (1 * 60).toString())
                        .addChoice("2m", (2 * 60).toString())
                        .addChoice("3m", (3 * 60).toString())
                        .addChoice("4m", (4 * 60).toString())
                        .addChoice("5m", (5 * 60).toString())
                        .setRequired(true))))
            .addSubcommandGroup((subcommandGroup) => subcommandGroup
                .setName("roles")
                .setDescription("Roles Protection"))
                .addSubcommandGroup((subcommandGroup) => subcommandGroup
                    .setName("roles_settings")
                    .setDescription("Manage the settings of server roles protection")
                    .addSubcommand((subcommand) => subcommand
                        .setName("recover")
                        .setDescription("Whether to recover deleted roles or delete created ones")
                        .addBooleanOption((option) => option
                            .setName("enabled")
                            .setDescription("Update the recover status (True: ON | False: OFF)")
                            .setRequired(true)))
                    .addSubcommand((subcommand) => subcommand
                        .setName("behavior")
                        .setDescription("How should the bot behave when roles are created or deleted")
                        .addStringOption((option) => option
                            .setName("action")
                            .setDescription("The action")
                            .addChoice("ban member", "shouldBanMember")
                            .addChoice("kick member", "shouldKickMember")
                            .addChoice("disable member", "shouldDisableMember")
                            .setRequired(true)))
                    .addSubcommand((subcommand) => subcommand
                        .setName("repetition")
                        .setDescription("Amount of roles that can be created or deleted before the bot responds")
                        .addNumberOption((option) => option
                            .setName("amount")
                            .setDescription("The amount")
                            .setRequired(true)))
                    .addSubcommand((subcommand) => subcommand
                        .setName("logs")
                        .setDescription("Where should the bot logs be sent to")
                        .addChannelOption((option) => option
                            .setName("channel")
                            .addChannelType(0)
                            .setDescription("The channel")
                            .setRequired(true)))
                    .addSubcommand((subcommand) => subcommand
                        .setName("cooldown")
                        .setDescription("Moderators will not be able to create or delete more that the allowed repetition amount in this time")
                        .addStringOption((option) => option
                            .setName("time")
                            .setDescription("The time")
                            .addChoice("1m", (1 * 60 * 1000).toString())
                            .addChoice("2m", (2 * 60 * 1000).toString())
                            .addChoice("3m", (3 * 60 * 1000).toString())
                            .addChoice("4m", (4 * 60 * 1000).toString())
                            .addChoice("5m", (5 * 60 * 1000).toString())
                            .setRequired(true))))
            .addSubcommandGroup((subcommandGroup) => subcommandGroup
                .setName("members")
                .setDescription("Members Protection"))
                .addSubcommandGroup((subcommandGroup) => subcommandGroup
                    .setName("members_settings")
                    .setDescription("Manage the settings of server members protection")
                    .addSubcommand((subcommand) => subcommand
                        .setName("behavior")
                        .setDescription("How should the bot behave when members are banned or kicked")
                        .addStringOption((option) => option
                            .setName("action")
                            .setDescription("The action")
                            .addChoice("ban member", "shouldBanMember")
                            .addChoice("kick member", "shouldKickMember")
                            .addChoice("disable member", "shouldDisableMember")
                            .setRequired(true)))
                    .addSubcommand((subcommand) => subcommand
                        .setName("repetition")
                        .setDescription("Amount of members that can be banned or kicked before the bot responds")
                        .addNumberOption((option) => option
                            .setName("amount")
                            .setDescription("The amount")
                            .setRequired(true)))
                    .addSubcommand((subcommand) => subcommand
                        .setName("logs")
                        .setDescription("Where should the bot logs be sent to")
                        .addChannelOption((option) => option
                            .setName("channel")
                            .addChannelType(0)
                            .setDescription("The channel")
                            .setRequired(true)))
                    .addSubcommand((subcommand) => subcommand
                        .setName("cooldown")
                        .setDescription("Moderators will not be able to ban or kick more that the allowed repetition amount in this time")
                        .addStringOption((option) => option
                            .setName("time")
                            .setDescription("The time")
                            .addChoice("1m", (1 * 60 * 1000).toString())
                            .addChoice("2m", (2 * 60 * 1000).toString())
                            .addChoice("3m", (3 * 60 * 1000).toString())
                            .addChoice("4m", (4 * 60 * 1000).toString())
                            .addChoice("5m", (5 * 60 * 1000).toString())
                            .setRequired(true)))),
    
    isExecutable: async (interaction) => interaction.user.id == interaction.guild.ownerId || await AccessTable.doesRowExist({ Guild: (await GuildsTable.fetchRow({ Guild: interaction.guildId })).Id, User: (await UsersTable.fetchRow({ User: interaction.user.id })).Id }),
    execute: async (client, interaction) => {
        let guildData = await GuildsTable.fetchRow({ Guild: interaction.guildId });

        let executedSubcommandGroup = interaction.options.getSubcommandGroup();
        let executedSubcommand = interaction.options.getSubcommand();

        console.log(executedSubcommandGroup, executedSubcommand);


        switch (executedSubcommandGroup) {
            case ("channels_settings"):
                switch (executedSubcommand) {
                    case ("recover"):
                        let newRecoverValue = interaction.options.getBoolean("enabled");

                        await ProtectionsTable.updateRow({ Guild: guildData.Id, Type: "ANTI_CHANNELS" }, { Guild: guildData.Id, Type: "ANTI_CHANNELS", recoverLost: newRecoverValue ? 1 : 0 });
                    break;
                    
                    case ("behavior"):
                        let newActionValue = interaction.options.getString("action");
                        let newValueObject = {
                            shouldKickMember: 0,
                            shouldDisableMember: 0,
                            shouldBanMember: 0,
                        };
                        
                        newValueObject[newActionValue] = 1;

                        await ProtectionsTable.updateRow({ Guild: guildData.Id, Type: "ANTI_CHANNELS" }, { Guild: guildData.Id, Type: "ANTI_CHANNELS", ...newValueObject });
                    break;

                    case ("repetition"):
                        let newRepetitionValue = interaction.options.getNumber("amount");

                        await ProtectionsTable.updateRow({ Guild: guildData.Id, Type: "ANTI_CHANNELS" }, { Guild: guildData.Id, Type: "ANTI_CHANNELS", maxRepetition: newRepetitionValue });
                    break;

                    case ("cooldown"):
                        let newCooldownValue = interaction.options.getString("time");

                        await ProtectionsTable.updateRow({ Guild: guildData.Id, Type: "ANTI_CHANNELS" }, { Guild: guildData.Id, Type: "ANTI_CHANNELS", clearRepetitionAfter: Number(newCooldownValue) });
                    break;

                    case ("logs"):
                        let newLogsChannel = interaction.options.getChannel("channel");
                        let newChannelData = await ChannelsTable.fetchRow({ Guild: guildData.Id, Channel: newLogsChannel.id });

                        await ProtectionsTable.updateRow({ Guild: guildData.Id, Type: "ANTI_CHANNELS" }, { Guild: guildData.Id, Type: "ANTI_CHANNELS", logsChannel: newChannelData.Id });
                    break;
                };

                return interaction.reply({ ephemeral: true, embeds: [ new MessageEmbed().setColor(0x66BB6A).setDescription(">>> **تم تحديث إعدادات حماية الرومات**") ] });
            break;

            case ("roles_settings"):
                switch (executedSubcommand) {
                    case ("recover"):
                        let newRecoverValue = interaction.options.getBoolean("enabled");

                        await ProtectionsTable.updateRow({ Guild: guildData.Id, Type: "ANTI_ROLES" }, { Guild: guildData.Id, Type: "ANTI_ROLES", recoverLost: newRecoverValue ? 1 : 0 });
                    break;
                    
                    case ("behavior"):
                        let newActionValue = interaction.options.getString("action");
                        let newValueObject = {
                            shouldKickMember: 0,
                            shouldDisableMember: 0,
                            shouldBanMember: 0,
                        };
                        
                        newValueObject[newActionValue] = 1;

                        await ProtectionsTable.updateRow({ Guild: guildData.Id, Type: "ANTI_ROLES" }, { Guild: guildData.Id, Type: "ANTI_ROLES", ...newValueObject });
                    break;

                    case ("repetition"):
                        let newRepetitionValue = interaction.options.getNumber("amount");

                        await ProtectionsTable.updateRow({ Guild: guildData.Id, Type: "ANTI_ROLES" }, { Guild: guildData.Id, Type: "ANTI_ROLES", maxRepetition: newRepetitionValue });
                    break;

                    case ("cooldown"):
                        let newCooldownValue = interaction.options.getString("time");

                        await ProtectionsTable.updateRow({ Guild: guildData.Id, Type: "ANTI_ROLES" }, { Guild: guildData.Id, Type: "ANTI_ROLES", clearRepetitionAfter: Number(newCooldownValue) });
                    break;

                    case ("logs"):
                        let newLogsChannel = interaction.options.getChannel("channel");
                        let newChannelData = await ChannelsTable.fetchRow({ Guild: guildData.Id, Channel: newLogsChannel.id });

                        await ProtectionsTable.updateRow({ Guild: guildData.Id, Type: "ANTI_ROLES" }, { Guild: guildData.Id, Type: "ANTI_ROLES", logsChannel: newChannelData.Id });
                    break;
                };
                
                return interaction.reply({ ephemeral: true, embeds: [ new MessageEmbed().setColor(0x66BB6A).setDescription(">>> **تم تحديث إعدادات حماية الرتب**") ] });
            break;

            case ("members_settings"):
                switch (executedSubcommand) {
                    case ("recover"):
                        let newRecoverValue = interaction.options.getBoolean("enabled");

                        await ProtectionsTable.updateRow({ Guild: guildData.Id, Type: "ANTI_MEMBERS" }, { Guild: guildData.Id, Type: "ANTI_MEMBERS", recoverLost: newRecoverValue ? 1 : 0 });
                    break;
                    
                    case ("behavior"):
                        let newActionValue = interaction.options.getString("action");
                        let newValueObject = {
                            shouldKickMember: 0,
                            shouldDisableMember: 0,
                            shouldBanMember: 0,
                        };
                        
                        newValueObject[newActionValue] = 1;

                        await ProtectionsTable.updateRow({ Guild: guildData.Id, Type: "ANTI_MEMBERS" }, { Guild: guildData.Id, Type: "ANTI_MEMBERS", ...newValueObject });
                    break;

                    case ("repetition"):
                        let newRepetitionValue = interaction.options.getNumber("amount");

                        await ProtectionsTable.updateRow({ Guild: guildData.Id, Type: "ANTI_MEMBERS" }, { Guild: guildData.Id, Type: "ANTI_MEMBERS", maxRepetition: newRepetitionValue });
                    break;

                    case ("cooldown"):
                        let newCooldownValue = interaction.options.getString("time");

                        await ProtectionsTable.updateRow({ Guild: guildData.Id, Type: "ANTI_MEMBERS" }, { Guild: guildData.Id, Type: "ANTI_MEMBERS", clearRepetitionAfter: Number(newCooldownValue) });
                    break;

                    case ("logs"):
                        let newLogsChannel = interaction.options.getChannel("channel");
                        let newChannelData = await ChannelsTable.fetchRow({ Guild: guildData.Id, Channel: newLogsChannel.id });

                        await ProtectionsTable.updateRow({ Guild: guildData.Id, Type: "ANTI_MEMBERS" }, { Guild: guildData.Id, Type: "ANTI_MEMBERS", logsChannel: newChannelData.Id });
                    break;
                };
                
                return interaction.reply({ ephemeral: true, embeds: [ new MessageEmbed().setColor(0x66BB6A).setDescription(">>> **تم تحديث إعدادات حماية الاعضاء**") ] });
            break;

            case("main"):
                switch (executedSubcommand) {
                    case ("status"):
                        let newStatusValue = interaction.options.getBoolean("enabled");

                        await GuildsTable.updateRow({ Id: guildData.Id }, { Id: guildData.Id, areProtectionsEnabled: newStatusValue });
                    break;
                };
                
                return interaction.reply({ ephemeral: true, embeds: [ new MessageEmbed().setColor(0x66BB6A).setDescription(">>> **تم تحديث إعدادات الحماية**") ] });
            break;
        };
    },
};