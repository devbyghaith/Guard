const TableManager = require('../../../../database/table-manager');

const arrayChunk = require('../../../../functions/arrayChunk');

const { MessageEmbed } = require('discord.js');

const GuildsTable = new TableManager("guilds");
const ChannelsTable = new TableManager("channels");
const LogsTable = new TableManager("logs");

module.exports = {
    once: false,
    type: "guildUpdate",

    execute: async (client, oldGuild, newGuild) => {
        let guildData = await GuildsTable.fetchRow({ Guild: oldGuild.id });

        if (guildData?.areLogsEnabled) {
            let guildUpdateSettings = await LogsTable.fetchRow({ Guild: guildData.Id, Action: "GUILD_UPDATE" });

            if (guildUpdateSettings?.isEnabled && typeof guildUpdateSettings.Channel == "number") {
                let logChannelSettings = await ChannelsTable.fetchRow({ Id: guildUpdateSettings.Channel, Guild: guildData.Id });

                if (logChannelSettings?.Channel?.length && client.channels.cache.has(logChannelSettings.Channel)) {
                    let logChannel = client.channels.cache.get(logChannelSettings.Channel);
                    let logEmbeds = [];

                    if (logChannel.type !== "GUILD_TEXT") return;
                    if (oldGuild.name !== newGuild.name) {
                        let nameUpdateEmbed = new MessageEmbed();
                            nameUpdateEmbed.setColor("RANDOM");
                            nameUpdateEmbed.setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) });
                            nameUpdateEmbed.setAuthor({ name: newGuild.name, iconURL: newGuild.iconURL({ dynamic: true }) });
                            nameUpdateEmbed.setDescription("**Update Server** / **Server Name**");
                            nameUpdateEmbed.addField("Old name:", oldGuild.name, true);
                            nameUpdateEmbed.addField("New name:", newGuild.name, true);
                            nameUpdateEmbed.setTimestamp();
                        logEmbeds.push(nameUpdateEmbed);
                    };

                    if (logEmbeds?.length) {
                        try {
                            arrayChunk(logEmbeds, 10).forEach((embeds) => {
                                logChannel.send?.({ embeds });
                            });
                        } catch (error) {
                            console.log(('[CATCHES]'), ("[DISCORD]"), error?.message ? error.message : error);
                        };
                    };
                };
            };
        };
    },
};