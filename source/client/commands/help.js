const DiscordJSBuilders = require("@discordjs/builders");

module.exports = {
    data: new DiscordJSBuilders.SlashCommandBuilder()
        .setName("help")
        .setDescription("Need help?"),
    
    execute: async (client, interaction) => {
        
    },
};