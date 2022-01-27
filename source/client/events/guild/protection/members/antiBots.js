const TableManager = require('../../../../../database/table-manager');

const { MessageEmbed } = require('discord.js');

const ProtectionsTable = new TableManager("protections");
const ChannelsTable = new TableManager("channels");
const BypassTable = new TableManager("bypass");
const GuildsTable = new TableManager("guilds");
const UsersTable = new TableManager("users");

module.exports = {
    once: false,
    type: "guildMemberAdd",

    execute: async (client, member) => {
        if (member.user?.bot) {
            let guildData = await GuildsTable.fetchRow({ Guild: member.guild.id });

            if (guildData.areProtectionsEnabled) {
                let memberData = await UsersTable.fetchRow({ User: member.user.id });

                if (!memberData.isBot) UsersTable.updateRow({ Id: memberData.Id }, { isBot: 1 });

                let isAntiBotEnabled = await ProtectionsTable.doesRowExist({ Guild: guildData.Id, Type: "ANTI_BOTS", isEnabled: 1 });
                let shoudBypassTheBot = await BypassTable.doesRowExist({ Guild: guildData.Id, User: memberData.Id });

                if (!shoudBypassTheBot && isAntiBotEnabled) {
                    let botAddLogs = await member.guild.fetchAuditLogs({ limit: 1, type: "BOT_ADD" });
                    let botAddLog = botAddLogs?.entries?.first();

                    let antiBotSettings = await ProtectionsTable.fetchRow({ Guild: guildData.Id, Type: "ANTI_BOTS", isEnabled: 1 });
                    let logChannelData = antiBotSettings.logsChannel ? await ChannelsTable.fetchRow({ Id: antiBotSettings.logsChannel }) : null;
                    let logChannel = client.channels.cache.get(logChannelData?.Channel);
                    let logEmbed = new MessageEmbed();
                        logEmbed.setColor("RANDOM");
                        logEmbed.setDescription("**Protection** / **Anti Bots**");
                        logEmbed.setAuthor({ name: member.guild.name, iconURL: member.guild.iconURL({ dynamic: true }) });
                    if (botAddLog?.executor) logEmbed.addField("Responsible Member:", (`<@${botAddLog.executor.id}> (\`${botAddLog.executor.id}\`)`));
                        logEmbed.addField("Added Bot:", (`<@${member.id}> (\`${member.id}\`)`))
                        logEmbed.setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) });
                        logEmbed.setTimestamp();


                    if (antiBotSettings.shouldBanMember && member.bannable) {
                        await member.ban({ reason: (`Protection: Anti Bot is enabled`) });

                        logEmbed.addField("Action taken:", (`• **Banned:** \`✅\`\n• **Kicked:** \`❌\`\n• **Disabled:** \`❌\`\n• **Nothing:** \`❌\`\n`));
                    } else if (antiBotSettings.shouldKickMember && member.kickable) {
                        await member.kick(`Protection: Anti Bot is enabled`);  
                    
                        logEmbed.addField("Action taken:", (`• **Banned:** \`❌\`\n• **Kicked:** \`✅\`\n• **Disabled:** \`❌\`\n• **Nothing:** \`❌\`\n`));
                    } else if (antiBotSettings.shouldDisableMember && member.manageable && member.roles.botRole?.editable) {
                        member.roles.botRole.permissions.toArray().map((permission) => member.roles.botRole.permissions.remove(permission));

                        logEmbed.addField("Action taken:", (`• **Banned:** \`❌\`\n• **Kicked:** \`❌\`\n• **Disabled:** \`✅\`\n• **Nothing:** \`❌\`\n`));
                    } else logEmbed.addField("Action taken:", (`• **Banned:** \`❌\`\n• **Kicked:** \`❌\`\n• **Disabled:** \`❌\`\n• **Nothing:** \`✅\`\n`));

                    logChannel?.send?.({ embeds: [ logEmbed ] });
                };
            };
        };
    },
};