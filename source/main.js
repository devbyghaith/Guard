const ClientSettings = require('../settings/client');

const ExtendedClient = require("./client");

const Path = require("path");

const Client = new ExtendedClient(ClientSettings.Super);

Client.loadCommands(Path.join(__dirname, "client", "commands"));
Client.loadEvents(Path.join(__dirname, "client", "events"));

Client.login(ClientSettings.Token).catch((reason) => {
    console.log("[DISCORD]", ('Unable to create a connection with Discord'));
    console.log("[DISCORD]", reason);
});