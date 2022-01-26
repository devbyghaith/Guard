module.exports = {
    once: true,
    type: "ready",

    async execute(client) {
        console.log("[DISCORD]", (`Hello World! I'm logged in as ${client.user.tag}`));

        client.discordApi.setToken(client.token);
        client.registerCommands();
    },
};