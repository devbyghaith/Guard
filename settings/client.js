const { Intents } = require("discord.js");

module.exports = {
    Token: "YOUR_DISCORD_BOT_TOKEN",
    Super: {
        intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_BANS,
            Intents.FLAGS.GUILD_MEMBERS,
            Intents.FLAGS.GUILD_VOICE_STATES,
            Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        ],
    },
};