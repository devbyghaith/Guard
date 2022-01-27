const { MessageEmbed } = require('discord.js');
const ExtendedClient = require('../../../..');

const TableManager = require('../../../../../database/table-manager');

const ProtectionsTable = new TableManager("protections");
const ChannelsTable = new TableManager("channels");
const BypassTable = new TableManager("bypass");
const GuildsTable = new TableManager("guilds");
const UsersTable = new TableManager("users");

const Repetitions = new Map();
const Timeouts = new Map();
const Channels = new Map();

module.exports = {
    once: false,
    type: "channelDelete",

    execute: async (client, channel) => {
        let guildData = await GuildsTable.fetchRow({ Guild: channel.guildId });

        if (guildData.areProtectionsEnabled) {
            let isAntiChannelsEnabled = await ProtectionsTable.doesRowExist({ Guild: guildData.Id, Type: "ANTI_CHANNELS", isEnabled: 1 });

            if (isAntiChannelsEnabled) {
                let antiChannelsSettings = await ProtectionsTable.fetchRow({ Guild: guildData.Id, Type: "ANTI_CHANNELS", isEnabled: 1 });
                let channelsDeleteLogs = await channel.guild.fetchAuditLogs({ limit: 1, type: "CHANNEL_DELETE" });

                if (channelsDeleteLogs.entries?.size) {
                    let channelDeleteLog = channelsDeleteLogs.entries.first?.();

                    if (channelDeleteLog?.executor) {
                        if (channelDeleteLog.executor.id == client.user.id) return;

                        let channelDeleter = channelDeleteLog.executor;                        
                        let userData = await UsersTable.fetchRow({ User: channelDeleter.id });
                        let shouldBypassUser = channelDeleter.id == channel.guild.ownerId || await BypassTable.doesRowExist({ Guild: guildData.Id, User: userData.Id });

                        if (shouldBypassUser) return;
                        else {
                            let userDeleteKey = (`${channel.guildId}:${channelDeleter.id}`);
                            let userRepetition = Repetitions.has(userDeleteKey) ? Repetitions.get(userDeleteKey) : 0;
                            let channelsDeletedByUser = Channels.has(userDeleteKey) ? Channels.get(userDeleteKey) : [];

                            Channels.set((userDeleteKey), [ ...channelsDeletedByUser, { ...channel, deletedAt: Date.now(), deletedBy: channelDeleter, children: channel.type == "GUILD_CATEGORY" ? channel.guild.channels.filter((c) => c.parentId == channel.id) : null } ]);

                            let allChannelsDeletedByUser = Channels.get(userDeleteKey);
                            
                            if (userRepetition >= antiChannelsSettings.maxRepetition) {
                                let executorMember = channel.guild.members.cache.has(channelDeleter.id) ? channel.guild.members.cache.get(channelDeleter.id) : channel.guild.members.fetch({ force: true, user: channelDeleter.id });
                                
                                Channels.delete(userDeleteKey);

                                if (antiChannelsSettings.recoverLost) {
                                    await allChannelsDeletedByUser.sort((a, b) => a.deletedAt > b.deletedAt).forEach(async (deletedChannel) => {
                                        await channel.guild.channels.create(deletedChannel.name, {
                                            type: deletedChannel.type,
                                            parent: deletedChannel.parentId && channel.guild.channels.cache.has(deletedChannel.parentId) ? deletedChannel.parentId : null,
                                            reason: (`Protection: Anti Channels deletion is enabled`),
                                            position: deletedChannel.rawPosition,
                                        });
                                    });
                                };

                                if (antiChannelsSettings.shouldBanMember && executorMember.bannable) await executorMember.ban({ reason: (`Protection: Anti Channels deletion is enabled`) });
                                else if (antiChannelsSettings.shouldKickMember && executorMember.kickable) await executorMember.kick(`Protection: Anti Channels deletion is enabled`);
                                else if (antiChannelsSettings.shouldDisableMember && executorMember.manageable) await executorMember.roles.cache.filter((role) => role.id !== channel.guildId).forEach((role) => executorMember.roles.remove(role));

                                if (antiChannelsSettings.logsChannel) {
                                    let logChannelData = await ChannelsTable.fetchRow({ Id: antiChannelsSettings.logsChannel });
                                    let logChannel = client.channels.cache.get(logChannelData.Channel);

                                    if (logChannel) {
                                        let logEmbed = new MessageEmbed();
                                            logEmbed.setColor("RANDOM");
                                            logEmbed.setDescription("**Protection** / **Channels** / **Anti Delete**");
                                            logEmbed.setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) });
                                            logEmbed.setAuthor({ name: channel.guild.name, iconURL: channel.guild.iconURL({ dynamic: true }) });
                                            logEmbed.addField("Responsible Member:", (`<@${channelDeleter.id}> (\`${channelDeleter.id}\`)`));
                                            logEmbed.addField("Deleted Channels:", allChannelsDeletedByUser.map((deletedChannel) => (`• **${deletedChannel.name}** (\`${deletedChannel.type.slice(("GUILD_").length).split("_").join(" ")}\`)`)).join("\n"));
                                            logEmbed.setTimestamp();

                                            if (antiChannelsSettings.shouldBanMember && executorMember.bannable) logEmbed.addField("Action taken:", (`• **Banned:** \`✅\`\n• **Kicked:** \`❌\`\n• **Disabled:** \`❌\`\n• **Nothing:** \`❌\`\n`));
                                            else if (antiChannelsSettings.shouldKickMember && executorMember.kickable) logEmbed.addField("Action taken:", (`• **Banned:** \`❌\`\n• **Kicked:** \`✅\`\n• **Disabled:** \`❌\`\n• **Nothing:** \`❌\`\n`));
                                            else if (antiChannelsSettings.shouldDisableMember && executorMember.manageable) logEmbed.addField("Action taken:", (`• **Banned:** \`❌\`\n• **Kicked:** \`❌\`\n• **Disabled:** \`✅\`\n• **Nothing:** \`❌\`\n`));
                                            else logEmbed.addField("Action taken:", (`• **Banned:** \`❌\`\n• **Kicked:** \`❌\`\n• **Disabled:** \`❌\`\n• **Nothing:** \`✅\`\n`));

                                        logChannel?.send?.({ embeds: [ logEmbed ] });
                                    };
                                };
                            } else {
                                Repetitions.set((userDeleteKey), (userRepetition + 1));

                                if (!Timeouts.has(userDeleteKey)) {
                                    let clearRepetitionTimeout = setTimeout(() => {
                                        if (Channels.has(userDeleteKey)) Channels.delete(userDeleteKey);
                                        if (Repetitions.has(userDeleteKey)) Repetitions.delete(userDeleteKey);
                                        if (Timeouts.has(userDeleteKey)) Timeouts.delete(userDeleteKey);
                                    }, (antiChannelsSettings.clearRepetitionAfter || 300) * 1000);

                                    Timeouts.set((userDeleteKey), clearRepetitionTimeout);
                                } else Timeouts.get(userDeleteKey)?.refresh?.();
                            };
                        };
                    };
                };
            };
        };
    },
};