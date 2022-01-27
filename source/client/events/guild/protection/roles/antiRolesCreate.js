const TableManager = require('../../../../../database/table-manager');

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
    type: "roleCreate",

    execute: async (client, role) => {
        let guildData = await GuildsTable.fetchRow({ Guild: role.guild.id });

        if (guildData.areProtectionsEnabled) {
            let isAntiRolesEnabled = await ProtectionsTable.doesRowExist({ Guild: guildData.Id, Type: "ANTI_ROLES", isEnabled: 1 });

            if (isAntiRolesEnabled) {
                let antiRolesSettings = await ProtectionsTable.fetchRow({ Guild: guildData.Id, Type: "ANTI_ROLES", isEnabled: 1 });
                let rolesCreateLogs = await role.guild.fetchAuditLogs({ limit: 1, type: "ROLE_CREATE" });

                if (rolesCreateLogs.entries?.size) {
                    let roleCreateLog = rolesCreateLogs.entries.first?.();

                    if (roleCreateLog?.executor) {
                        if (roleCreateLog.executor.id == client.user.id) return;

                        let roleCreater = roleCreateLog.executor;
                        let userData = await UsersTable.fetchRow({ User: roleCreater.id });
                        let shouldBypassUser = roleCreater.id == role.guild.ownerId || await BypassTable.doesRowExist({ Guild: guildData.Id, User: userData.Id });

                        if (shouldBypassUser) return;
                        else {
                            let userCreateKey = (`${role.guildId}:${roleCreater.id}`);
                            let userRepetition = Repetitions.has(userCreateKey) ? Repetitions.get(userCreateKey) : 0;
                            let rolesCreatedByUser = Roles.has(userCreateKey) ? Roles.get(userCreateKey) : [];

                            Roles.set((userCreateKey), [ ...rolesCreatedByUser, role ]);

                            let allRolesCreatedByUser = Roles.get(userCreateKey);

                            if (userRepetition >= antiRolesSettings.maxRepetition) {
                                let executorMember = role.guild.members.cache.has(roleCreater.id) ? role.guild.members.cache.get(roleCreater.id) : role.guild.members.fetch({ force: true, user: roleCreater.id });
                                
                                Roles.delete(userCreateKey);
                               
                                if (antiRolesSettings.recoverLost) await allRolesCreatedByUser.forEach(async (createdRole) => await createdRole.delete({  }));

                                if (antiRolesSettings.shouldBanMember && executorMember.bannable) await executorMember.ban({ reason: (`Protection: Anti Roles Create is enabled`) });
                                else if (antiRolesSettings.shouldKickMember && executorMember.kickable) await executorMember.kick(`Protection: Anti Roles Create is enabled`);
                                else if (antiRolesSettings.shouldDisableMember && executorMember.manageable) await executorMember.roles.cache.filter((role) => role.id !== role.guild.id).forEach((role) => executorMember.roles.remove(role));

                                if (antiRolesSettings.logsChannel) {
                                    let logChannelData = await ChannelsTable.fetchRow({ Id: antiRolesSettings.logsChannel });
                                    let logChannel = client.channels.cache.get(logChannelData.Channel);

                                    if (logChannel) {
                                        let logEmbed = new MessageEmbed();
                                            logEmbed.setColor("RANDOM");
                                            logEmbed.setDescription("**Protection** / **Roles** / **Anti Create**");
                                            logEmbed.setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) });
                                            logEmbed.setAuthor({ name: role.guild.name, iconURL: role.guild.iconURL({ dynamic: true }) });
                                            logEmbed.addField("Responsible Member:", (`<@${roleCreater.id}> (\`${roleCreater.id}\`)`));
                                            logEmbed.addField("Created Roles:", allRolesCreatedByUser.map((createdRole) => (`• **${createdRole.name}**`)));
                                            logEmbed.setTimestamp();

                                        if (antiRolesSettings.shouldBanMember && executorMember.bannable) logEmbed.addField("Action taken:", (`• **Banned:** \`✅\`\n• **Kicked:** \`❌\`\n• **Disabled:** \`❌\`\n• **Nothing:** \`❌\`\n`));
                                        else if (antiRolesSettings.shouldKickMember && executorMember.kickable) logEmbed.addField("Action taken:", (`• **Banned:** \`❌\`\n• **Kicked:** \`✅\`\n• **Disabled:** \`❌\`\n• **Nothing:** \`❌\`\n`));
                                        else if (antiRolesSettings.shouldDisableMember && executorMember.manageable) logEmbed.addField("Action taken:", (`• **Banned:** \`❌\`\n• **Kicked:** \`❌\`\n• **Disabled:** \`✅\`\n• **Nothing:** \`❌\`\n`));
                                        else logEmbed.addField("Action taken:", (`• **Banned:** \`❌\`\n• **Kicked:** \`❌\`\n• **Disabled:** \`❌\`\n• **Nothing:** \`✅\`\n`));

                                        logChannel?.send?.({ embeds: [ logEmbed ] });
                                    };
                                };
                            } else {
                                Repetitions.set((userCreateKey), (userRepetition + 1));

                                if (!Timeouts.has(userCreateKey)) {
                                    let clearRepetitionTimeout = setTimeout(() => {
                                        if (Roles.has(userCreateKey)) Roles.delete(userCreateKey);
                                        if (Repetitions.has(userCreateKey)) Repetitions.delete(userCreateKey);
                                        if (Timeouts.has(userCreateKey)) Timeouts.delete(userCreateKey);
                                    }, (antiRolesSettings.clearRepetitionAfter || 300) * 1000);

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