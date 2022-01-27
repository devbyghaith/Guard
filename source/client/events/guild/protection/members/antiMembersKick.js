const TableManager = require('../../../../../database/table-manager');

const { MessageEmbed } = require('discord.js');

const ProtectionsTable = new TableManager("protections");
const ChannelsTable = new TableManager("channels");
const BypassTable = new TableManager("bypass");
const GuildsTable = new TableManager("guilds");
const UsersTable = new TableManager("users");

const Repetitions = new Map();
const Timeouts = new Map();
const Members = new Map();

module.exports = {
    once: false,
    type: "guildMemberRemove",

    execute: async (client, member) => {
        let guildData = await GuildsTable.fetchRow({ Guild: member.guild.id });

        if (guildData.areProtectionsEnabled) {
            let isAntiMembersEnabled = await ProtectionsTable.doesRowExist({ Guild: guildData.Id, Type: "ANTI_MEMBERS", isEnabled: 1 });

            if (isAntiMembersEnabled) {
                let antiMembersSettings = await ProtectionsTable.fetchRow({ Guild: guildData.Id, Type: "ANTI_MEMBERS", isEnabled: 1 });
                let membersKickLogs = await member.guild.fetchAuditLogs({ limit: 1, type: "MEMBER_KICK" });

                if (membersKickLogs.entries?.size) {
                    let memberKickLog = membersKickLogs.entries.first?.();

                    if (memberKickLog?.executor) {
                        if (memberKickLog.executor.id == client.user.id) return;
                        if (memberKickLog.target?.id?.length && memberKickLog.target.id != member.id) return; 

                        let memberKicker = memberKickLog.executor;
                        let userData = await UsersTable.fetchRow({ User: memberKicker.id });
                        let shouldBypassUser = memberKicker.id == member.guild.id || await BypassTable.doesRowExist({ Guild: guildData.Id, User: userData.Id });

                        if (shouldBypassUser) return;
                        else {
                            let userKickKey = (`${member.guildId}:${memberKicker.id}`);
                            let userRepetition = Repetitions.has(userKickKey) ? Repetitions.get(userKickKey) : 0;
                            let membersKickedByUser = Members.has(userKickKey) ? Members.get(userKickKey) : [];

                            Members.set((userKickKey), [ ...membersKickedByUser, member ]);

                            let allMembersKickedByUser = Members.get(userKickKey);

                            if (userRepetition >= antiMembersSettings.maxRepetition) {
                                let executorMember = member.guild.members.cache.has(memberKicker.id) ? member.guild.members.cache.get(memberKicker.id) : member.guild.members.fetch({ force: true, user: memberKicker.id });
                                
                                if (antiMembersSettings.shouldBanMember && executorMember.bannable) await executorMember.ban({ reason: (`Protection: Anti Members kick is enabled`) });
                                else if (antiMembersSettings.shouldKickMember && executorMember.kickable) await executorMember.kick(`Protection: Anti Members kick is enabled`);
                                else if (antiMembersSettings.shouldDisableMember && executorMember.manageable) await executorMember.roles.cache.filter((role) => role.id !== member.guildId).forEach((role) => executorMember.roles.remove(role));

                                if (antiMembersSettings.logsChannel) {
                                    let logChannelData = await ChannelsTable.fetchRow({ Id: antiMembersSettings.logsChannel });
                                    let logChannel = client.channels.cache.get(logChannelData.Channel);

                                    if (logChannel) {
                                        let logEmbed = new MessageEmbed();
                                            logEmbed.setColor("RANDOM");
                                            logEmbed.setDescription("**Protection** / **Members** / **Anti Kick**");
                                            logEmbed.setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) });
                                            logEmbed.setAuthor({ name: member.guild.name, iconURL: member.guild.iconURL({ dynamic: true }) });
                                            logEmbed.addField("Responsible Member:", (`<@${memberKicker.id}> (\`${memberKicker.id}\`)`));
                                            logEmbed.addField("Kicked Members:", allMembersKickedByUser.map((kickedMember) => (`• <@${kickedMember.id}> (\`${kickedMember.id}\`)`)).join("\n"));
                                            logEmbed.setTimestamp();

                                        if (antiMembersSettings.shouldBanMember && executorMember.bannable) logEmbed.addField("Action taken:", (`• **Banned:** \`✅\`\n• **Kicked:** \`❌\`\n• **Disabled:** \`❌\`\n• **Nothing:** \`❌\`\n`));
                                        else if (antiMembersSettings.shouldKickMember && executorMember.kickable) logEmbed.addField("Action taken:", (`• **Banned:** \`❌\`\n• **Kicked:** \`✅\`\n• **Disabled:** \`❌\`\n• **Nothing:** \`❌\`\n`));
                                        else if (antiMembersSettings.shouldDisableMember && executorMember.manageable) logEmbed.addField("Action taken:", (`• **Banned:** \`❌\`\n• **Kicked:** \`❌\`\n• **Disabled:** \`✅\`\n• **Nothing:** \`❌\`\n`));
                                        else logEmbed.addField("Action taken:", (`• **Banned:** \`❌\`\n• **Kicked:** \`❌\`\n• **Disabled:** \`❌\`\n• **Nothing:** \`✅\`\n`));

                                        logChannel?.send?.({ embeds: [ logEmbed ] });
                                    };
                                };
                            } else {
                                Repetitions.set((userKickKey), (userRepetition + 1));

                                if (!Timeouts.has(userKickKey)) {
                                    let clearRepetitionTimeout = setTimeout(() => {
                                        if (Members.has(userKickKey)) Members.delete(userKickKey);
                                        if (Repetitions.has(userKickKey)) Repetitions.delete(userKickKey);
                                        if (Timeouts.has(userKickKey)) Timeouts.delete(userKickKey);
                                    }, (antiMembersSettings.clearRepetitionAfter || 300) * 1000);

                                    Timeouts.set((userKickKey), clearRepetitionTimeout);
                                } else Timeouts.get(userKickKey)?.refresh?.();
                            };
                        };
                    };
                };
            };
        };
    },
};