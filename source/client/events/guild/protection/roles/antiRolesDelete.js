const TableManager = require('../../../../../database/table-manager');

const { MessageEmbed } = require('discord.js');

const ProtectionsTable = new TableManager("protections");
const ChannelsTable = new TableManager("channels");
const BypassTable = new TableManager("bypass");
const GuildsTable = new TableManager("guilds");
const UsersTable = new TableManager("users");

const Repetitions = new Map();
const Timeouts = new Map();
const Roles = new Map();

module.exports = {
    once: false,
    type: "roleDelete",

    execute: async (client, role) => {
        let guildData = await GuildsTable.fetchRow({ Guild: role.guild.id });

        if (guildData.areProtectionsEnabled) {
            let isAntiRolesEnabled = await ProtectionsTable.doesRowExist({ Guild: guildData.Id, Type: "ANTI_ROLES", isEnabled: 1 });

            if (isAntiRolesEnabled) {
                let antiRolesSettings = await ProtectionsTable.fetchRow({ Guild: guildData.Id, Type: "ANTI_ROLES", isEnabled: 1 });
                let rolesDeleteLogs = await role.guild.fetchAuditLogs({ limit: 1, type: "ROLE_DELETE" });

                if (rolesDeleteLogs.entries?.size) {
                    let roleDeleteLog = rolesDeleteLogs.entries.first?.();

                    if (roleDeleteLog?.executor) {
                        if (roleDeleteLog.executor.id == client.user.id) return;

                        let roleDeleter = roleDeleteLog.executor;                        
                        let userData = await UsersTable.fetchRow({ User: roleDeleter.id });
                        let shouldBypassUser = role.guild.ownerId || await BypassTable.doesRowExist({ Guild: guildData.Id, User: userData.Id });

                        if (shouldBypassUser) return;
                        else {
                            let userDeleteKey = (`${role.guildId}:${roleDeleter.id}`);
                            let userRepetition = Repetitions.has(userDeleteKey) ? Repetitions.get(userDeleteKey) : 0;
                            let rolesDeletedByUser = Roles.has(userDeleteKey) ? Roles.get(userDeleteKey) : [];

                            Roles.set((userDeleteKey), [ ...rolesDeletedByUser, { ...role, deletedAt: Date.now(), deletedBy: roleDeleter } ]);

                            let allRolesDeletedByUser = Roles.get(userDeleteKey);

                            if (userRepetition >= antiRolesSettings.maxRepetition) {
                                let executorMember = role.guild.members.cache.has(roleDeleter.id) ? role.guild.members.cache.get(roleDeleter.id) : role.guild.members.fetch({ force: true, user: roleDeleter.id });

                                Roles.delete(userDeleteKey);

                                if (antiRolesSettings.recoverLost) await allRolesDeletedByUser.forEach(async (deletedRole) => {
                                    await role.guild.roles.create({
                                        color: deletedRole.color,
                                        name: deletedRole.name,
                                        icon: deletedRole.icon,
                                        hoist: deletedRole.hoist,
                                        permissions: deletedRole.permissions,
                                        position: deletedRole.rawPosition,
                                        mentionable: deletedRole.mentionable,
                                        unicodeEmoji: deletedRole.unicodeEmoji,
                                        reason: (`Protection: Anti Roles deletion is enabled`)
                                    });
                                });

                                if (antiRolesSettings.shouldBanMember && executorMember.bannable) await executorMember.ban({ reason: (`Protection: Anti Roles Create is enabled`) });
                                else if (antiRolesSettings.shouldKickMember && executorMember.kickable) await executorMember.kick(`Protection: Anti Roles Create is enabled`);
                                else if (antiRolesSettings.shouldDisableMember && executorMember.manageable) await executorMember.roles.cache.filter((role) => role.id !== role.guild.id).forEach((role) => executorMember.roles.remove(role));

                                if (antiRolesSettings.logsChannel) {
                                    let logChannelData = await ChannelsTable.fetchRow({ Id: antiRolesSettings.logsChannel });
                                    let logChannel = client.channels.cache.get(logChannelData.Channel);

                                    if (logChannel) {
                                        let logEmbed = new MessageEmbed();
                                            logEmbed.setColor("RANDOM");
                                            logEmbed.setDescription("**Protection** / **Roles** / **Anti Delete**");
                                            logEmbed.setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) });
                                            logEmbed.setAuthor({ name: role.guild.name, iconURL: role.guild.iconURL({ dynamic: true }) });
                                            logEmbed.addField("Responsible Member:", (`<@${roleDeleter.id}> (\`${roleDeleter.id}\`)`));
                                            logEmbed.addField("Deleted Roles:", allRolesDeletedByUser.map((deletedRole) => (`• **${deletedRole.name}**`)).join("\n"));
                                            logEmbed.setTimestamp();

                                        if (antiRolesSettings.shouldBanMember && executorMember.bannable) logEmbed.addField("Action taken:", (`• **Banned:** \`✅\`\n• **Kicked:** \`❌\`\n• **Disabled:** \`❌\`\n• **Nothing:** \`❌\`\n`));
                                        else if (antiRolesSettings.shouldKickMember && executorMember.kickable) logEmbed.addField("Action taken:", (`• **Banned:** \`❌\`\n• **Kicked:** \`✅\`\n• **Disabled:** \`❌\`\n• **Nothing:** \`❌\`\n`));
                                        else if (antiRolesSettings.shouldDisableMember && executorMember.manageable) logEmbed.addField("Action taken:", (`• **Banned:** \`❌\`\n• **Kicked:** \`❌\`\n• **Disabled:** \`✅\`\n• **Nothing:** \`❌\`\n`));
                                        else logEmbed.addField("Action taken:", (`• **Banned:** \`❌\`\n• **Kicked:** \`❌\`\n• **Disabled:** \`❌\`\n• **Nothing:** \`✅\`\n`));

                                        logChannel?.send?.({ embeds: [ logEmbed ] });
                                    };
                                };
                            } else {
                                Repetitions.set((userDeleteKey), (userRepetition + 1));

                                if (!Timeouts.has(userDeleteKey)) {
                                    let clearRepetitionTimeout = setTimeout(() => {
                                        if (Roles.has(userDeleteKey)) Roles.delete(userDeleteKey);
                                        if (Repetitions.has(userDeleteKey)) Repetitions.delete(userDeleteKey);
                                        if (Timeouts.has(userDeleteKey)) Timeouts.delete(userDeleteKey);
                                    }, (antiRolesSettings.clearRepetitionAfter || 300) * 1000);

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