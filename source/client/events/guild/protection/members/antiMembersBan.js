const TableManager = require('../../../../../database/table-manager');

const { MessageEmbed } = require('discord.js');

const ProtectionsTable = new TableManager("protections");
const ChannelsTable = new TableManager("channels");
const BypassTable = new TableManager("bypass");
const GuildsTable = new TableManager("guilds");
const UsersTable = new TableManager("users");

const Repetitions = new Map();
const Timeouts = new Map();
const Bans = new Map();

module.exports = {
    once: false,
    type: "guildBanAdd",

    execute: async (client, ban) => {
        let guildData = await GuildsTable.fetchRow({ Guild: ban.guild.id });

        if (guildData.areProtectionsEnabled) {
            let isAntiMembersEnabled = await ProtectionsTable.doesRowExist({ Guild: guildData.Id, Type: "ANTI_MEMBERS", isEnabled: 1 });

            if (isAntiMembersEnabled) {
                let antiMembersSettings = await ProtectionsTable.fetchRow({ Guild: guildData.Id, Type: "ANTI_MEMBERS", isEnabled: 1 });
                let membersBanLogs = await ban.guild.fetchAuditLogs({ limit: 1, type: "MEMBER_BAN_ADD" });

                if (membersBanLogs.entries?.size) {
                    let memberBanLog = membersBanLogs.entries.first?.();

                    if (memberBanLog?.executor) {
                        if (memberBanLog.executor.id == client.user.id) return;
                        if (memberBanLog.target?.id?.length && memberBanLog.target.id != ban.user.id) return; 

                        let memberBanner = memberBanLog.executor;
                        let userData = await UsersTable.fetchRow({ User: memberBanner.id });
                        let shouldBypassUser = memberBanner.id == ban.guild.ownerId || await BypassTable.doesRowExist({ Guild: guildData.Id, User: userData.Id });

                        if (shouldBypassUser) return;
                        else {
                            let userBanKey = (`${ban.guild.id}:${memberBanner.id}`);
                            let userRepetition = Repetitions.has(userBanKey) ? Repetitions.get(userBanKey) : 0;
                            let membersBannedByUser = Bans.has(userBanKey) ? Bans.get(userBanKey) : [];

                            Bans.set((userBanKey), [ ...membersBannedByUser, ban.user ]);

                            let allMembersBannedByUser = Bans.get(userBanKey);

                            if (userRepetition >= antiMembersSettings.maxRepetition) {
                                let executorMember = ban.guild.members.cache.has(memberBanner.id) ? ban.guild.members.cache.get(memberBanner.id) : ban.guild.members.fetch({ force: true, user: memberBanner.id });
                                
                                if (antiMembersSettings.shouldBanMember && executorMember.bannable) await executorMember.ban({ reason: (`Protection: Anti Members kick is enabled`) });
                                else if (antiMembersSettings.shouldBanMember && executorMember.kickable) await executorMember.kick(`Protection: Anti Members kick is enabled`);
                                else if (antiMembersSettings.shouldDisableMember && executorMember.manageable) await executorMember.roles.cache.filter((role) => role.id !== ban.guild.id).forEach((role) => executorMember.roles.remove(role));

                                if (antiMembersSettings.recoverLost) {
                                    let inviteLink = await ban.guild.invites.create(ban.guild.channels.cache.filter((channel) => channel.type == "GUILD_TEXT").first().id, { maxAge: 0, maxUses: 0 });

                                    await allMembersBannedByUser.forEach(async (bannedMember) => {
                                        await ban.guild.bans.remove(bannedMember.id);

                                        if (inviteLink?.code?.length && client.users.cache.has(bannedMember.id)) {
                                            let bannedMemberUser = client.users.cache.get(bannedMember.id);
                                            let apologyEmbed = new MessageEmbed();
                                                apologyEmbed.setColor("RANDOM");
                                                apologyEmbed.setAuthor({ name: ban.guild.name, iconURL: ban.guild.iconURL({ dynamic: true }) });
                                                apologyEmbed.setDescription(`**${ban.guild.name}** got attacked and you was a victim. Your ban has been successfully revoked!`);
                                                apologyEmbed.setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) });
                                                apologyEmbed.setTimestamp();
                                            
                                            bannedMemberUser?.send?.({ content: inviteLink.url, embeds: [ apologyEmbed ] });
                                        };
                                    });
                                };

                                if (antiMembersSettings.logsChannel) {
                                    let logChannelData = await ChannelsTable.fetchRow({ Id: antiMembersSettings.logsChannel });
                                    let logChannel = client.channels.cache.get(logChannelData.Channel);

                                    if (logChannel) {
                                        let logEmbed = new MessageEmbed();
                                            logEmbed.setColor("RANDOM");
                                            logEmbed.setDescription("**Protection** / **Members** / **Anti Ban**");
                                            logEmbed.setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) });
                                            logEmbed.setAuthor({ name: ban.guild.name, iconURL: ban.guild.iconURL({ dynamic: true }) });
                                            logEmbed.addField("Responsible Member:", (`<@${memberBanner.id}> (\`${memberBanner.id}\`)`));
                                            logEmbed.addField("Banned Members:", allMembersBannedByUser.map((bannedMember) => (`• <@${bannedMember.id}> (\`${bannedMember.id}\`)`)).join("\n"));
                                            logEmbed.setTimestamp();

                                        if (antiMembersSettings.shouldBanMember && executorMember.bannable) logEmbed.addField("Action taken:", (`• **Banned:** \`✅\`\n• **Banned:** \`❌\`\n• **Disabled:** \`❌\`\n• **Nothing:** \`❌\`\n`));
                                        else if (antiMembersSettings.shouldBanMember && executorMember.kickable) logEmbed.addField("Action taken:", (`• **Banned:** \`❌\`\n• **Banned:** \`✅\`\n• **Disabled:** \`❌\`\n• **Nothing:** \`❌\`\n`));
                                        else if (antiMembersSettings.shouldDisableMember && executorMember.manageable) logEmbed.addField("Action taken:", (`• **Banned:** \`❌\`\n• **Banned:** \`❌\`\n• **Disabled:** \`✅\`\n• **Nothing:** \`❌\`\n`));
                                        else logEmbed.addField("Action taken:", (`• **Banned:** \`❌\`\n• **Banned:** \`❌\`\n• **Disabled:** \`❌\`\n• **Nothing:** \`✅\`\n`));

                                        logChannel?.send?.({ embeds: [ logEmbed ] });
                                    };
                                };
                            } else {
                                Repetitions.set((userBanKey), (userRepetition + 1));

                                if (!Timeouts.has(userBanKey)) {
                                    let clearRepetitionTimeout = setTimeout(() => {
                                        if (Bans.has(userBanKey)) Bans.delete(userBanKey);
                                        if (Repetitions.has(userBanKey)) Repetitions.delete(userBanKey);
                                        if (Timeouts.has(userBanKey)) Timeouts.delete(userBanKey);
                                    }, (antiMembersSettings.clearRepetitionAfter || 300) * 1000);

                                    Timeouts.set((userBanKey), clearRepetitionTimeout);
                                } else Timeouts.get(userBanKey)?.refresh?.();
                            };
                        };
                    };
                };
            };
        };
    },
};