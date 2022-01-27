const TableManager = require('../../../../../database/table-manager');

const { MessageEmbed } = require('discord.js');

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
    type: "channelCreate",

    execute: async (client, channel) => {
        let guildData = await GuildsTable.fetchRow({ Guild: channel.guildId });

        if (guildData.areProtectionsEnabled) {
            let isAntiChannelsEnabled = await ProtectionsTable.doesRowExist({ Guild: guildData.Id, Type: "ANTI_CHANNELS", isEnabled: 1 });

            if (isAntiChannelsEnabled) {
                let antiChannelsSettings = await ProtectionsTable.fetchRow({ Guild: guildData.Id, Type: "ANTI_CHANNELS", isEnabled: 1 });
                let channelsCreateLogs = await channel.guild.fetchAuditLogs({ limit: 1, type: "CHANNEL_CREATE" });

                if (channelsCreateLogs.entries?.size) {
                    let channelCreateLog = channelsCreateLogs.entries.first?.();

                    if (channelCreateLog?.executor) {
                        if (channelCreateLog.executor.id == client.user.id) return;

                        let channelCreater = channelCreateLog.executor;
                        let userData = await UsersTable.fetchRow({ User: channelCreater.id });
                        let shouldBypassUser = channelDeleter.id == channel.guild.ownerId || await BypassTable.doesRowExist({ Guild: guildData.Id, User: userData.Id });

                        if (shouldBypassUser) return;
                        else {
                            let userCreateKey = (`${channel.guildId}:${channelCreater.id}`);
                            let userRepetition = Repetitions.has(userCreateKey) ? Repetitions.get(userCreateKey) : 0;
                            let channelsCreatedByUser = Channels.has(userCreateKey) ? Channels.get(userCreateKey) : [];

                            Channels.set((userCreateKey), [ ...channelsCreatedByUser, channel ]);

                            let allChannelsCreatedByUser = Channels.get(userCreateKey);

                            if (userRepetition >= antiChannelsSettings.maxRepetition) {
                                let executorMember = channel.guild.members.cache.has(channelCreater.id) ? channel.guild.members.cache.get(channelCreater.id) : channel.guild.members.fetch({ force: true, user: channelCreater.id });
                                
                                Channels.delete(userCreateKey);

                                if (antiChannelsSettings.recoverLost) await allChannelsCreatedByUser.filter((createdChannel) => createdChannel.deletable).forEach(async (createdChannel) => await createdChannel.delete());

                                if (antiChannelsSettings.shouldBanMember && executorMember.bannable) await executorMember.ban({ reason: (`Protection: Anti Channels deletion is enabled`) });
                                else if (antiChannelsSettings.shouldKickMember && executorMember.kickable) await executorMember.kick(`Protection: Anti Channels deletion is enabled`);
                                else if (antiChannelsSettings.shouldDisableMember && executorMember.manageable) await executorMember.roles.cache.filter((role) => role.id !== channel.guildId).forEach((role) => executorMember.roles.remove(role));

                                if (antiChannelsSettings.logsChannel) {
                                    let logChannelData = await ChannelsTable.fetchRow({ Id: antiChannelsSettings.logsChannel });
                                    let logChannel = client.channels.cache.get(logChannelData.Channel);

                                    if (logChannel) {
                                        let logEmbed = new MessageEmbed();
                                            logEmbed.setColor("RANDOM");
                                            logEmbed.setDescription("**Protection** / **Channels** / **Anti Create**");
                                            logEmbed.setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) });
                                            logEmbed.setAuthor({ name: channel.guild.name, iconURL: channel.guild.iconURL({ dynamic: true }) });
                                            logEmbed.addField("Responsible Member:", (`<@${channelCreater.id}> (\`${channelCreater.id}\`)`));
                                            logEmbed.addField("Created Channels:", allChannelsCreatedByUser.map((createdChannel) => (`• **${createdChannel.name}** (\`${createdChannel.type.slice(("GUILD_").length).split("_").join(" ")}\`)`)).join("\n"));
                                            logEmbed.setTimestamp();

                                        if (antiChannelsSettings.shouldBanMember && executorMember.bannable) logEmbed.addField("Action taken:", (`• **Banned:** \`✅\`\n• **Kicked:** \`❌\`\n• **Disabled:** \`❌\`\n• **Nothing:** \`❌\`\n`));
                                        else if (antiChannelsSettings.shouldKickMember && executorMember.kickable) logEmbed.addField("Action taken:", (`• **Banned:** \`❌\`\n• **Kicked:** \`✅\`\n• **Disabled:** \`❌\`\n• **Nothing:** \`❌\`\n`));
                                        else if (antiChannelsSettings.shouldDisableMember && executorMember.manageable) logEmbed.addField("Action taken:", (`• **Banned:** \`❌\`\n• **Kicked:** \`❌\`\n• **Disabled:** \`✅\`\n• **Nothing:** \`❌\`\n`));
                                        else logEmbed.addField("Action taken:", (`• **Banned:** \`❌\`\n• **Kicked:** \`❌\`\n• **Disabled:** \`❌\`\n• **Nothing:** \`✅\`\n`));

                                        logChannel?.send?.({ embeds: [ logEmbed ] });
                                    };
                                };
                            } else {
                                Repetitions.set((userCreateKey), (userRepetition + 1));

                                if (!Timeouts.has(userCreateKey)) {
                                    let clearRepetitionTimeout = setTimeout(() => {
                                        if (Channels.has(userCreateKey)) Channels.delete(userCreateKey);
                                        if (Repetitions.has(userCreateKey)) Repetitions.delete(userCreateKey);
                                        if (Timeouts.has(userCreateKey)) Timeouts.delete(userCreateKey);
                                    }, (antiChannelsSettings.clearRepetitionAfter || 300) * 1000);

                                    Timeouts.set((userCreateKey), clearRepetitionTimeout);
                                } else Timeouts.get(userCreateKey)?.refresh?.();
                            };
                        };
                    };
                };
            };
        };
    },
};