const TableManager = require('../../../../database/table-manager');

const { MessageEmbed } = require('discord.js');

const GuildsTable = new TableManager("guilds");
const ChannelsTable = new TableManager("channels");
const LogsTable = new TableManager("logs");

module.exports = {
    once: false,
    type: "guildBanAdd",

    execute: async (client, ban) => {
        let guildData = await GuildsTable.fetchRow({ Guild: ban.guild.id });

        if (guildData?.areLogsEnabled) {
            let guildUpdateSettings = await LogsTable.fetchRow({ Guild: guildData.Id, Action: "MEMBER_BANNED" });

            if (guildUpdateSettings?.isEnabled && typeof guildUpdateSettings.Channel == "number") {
                let logChannelSettings = await ChannelsTable.fetchRow({ Id: guildUpdateSettings.Channel, Guild: guildData.Id });

                if (logChannelSettings?.Channel?.length && client.channels.cache.has(logChannelSettings.Channel)) {
                    let logChannel = client.channels.cache.get(logChannelSettings.Channel);
                    let logEmbeds = [];

                    if (logChannel.type !== "GUILD_TEXT") return;

                    const bannedEmbed = new MessageEmbed();
                        bannedEmbed.setColor("RANDOM");
                        bannedEmbed.setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) });
                        bannedEmbed.setAuthor({ name: ban.guild.name, iconURL: ban.guild.iconURL({ dynamic: true }) });
                        bannedEmbed.setDescription("**Member Banned**");
                        bannedEmbed.addField("Member:", (`<@!${ban.user.id}> (${ban.user.id})`));
                        bannedEmbed.setTimestamp();
                    logEmbeds.push(bannedEmbed);

                    if (logEmbeds?.length) {
                        try {
                            logChannel.send?.({ embeds: logEmbeds });
                        } catch (error) {
                            console.log(('[CATCHES]'), ("[DISCORD]"), error?.message ? error.message : error);
                        };
                    };
                };
            };
        };
    },
};