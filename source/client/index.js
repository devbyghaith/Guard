const DiscordJS = require('discord.js');
const Path = require('path');
const Fs = require('fs');

const { Routes } = require('discord-api-types/v9');
const { REST } = require('@discordjs/rest');

class ExtendedClient extends DiscordJS.Client {
    constructor(option) {
        super(option);
        this.discordApi = new REST({ version: '9' });
        this.commands = new DiscordJS.Collection();
    };

    loadEvents = (eventsPath) => {
        if (Fs.existsSync(eventsPath)) {
            Fs.readdirSync(eventsPath)
            .forEach((eventFile) => {
                let filePath = Path.join(eventsPath, eventFile);
                let fileStatus = Fs.lstatSync(filePath);

                if (fileStatus.isDirectory()) return this.loadEvents(filePath);
                else {
                    let event = require(filePath);

                    if (event) {
                        if (event.type?.length) this[event.once ? "once" : "on"](event.type, event.execute.bind(null, this)); 
                        else console.log(("[HANDLER]"), ("[EVENTS]"), (`No <event.type> specified in <${eventFile}>`));
                    } else console.log(("[HANDLER]"), ("[EVENTS]"), (`No export found in <${eventFile}>`));
                };
            });
        } else console.log(("[HANDLER]"), ("[EVENTS]"), (`<${eventsPath}> does not exist`));
    };

    loadCommands = (commandsPath) => {
        if (Fs.existsSync(commandsPath)) {
            Fs.readdirSync(commandsPath)
            .forEach((commandFile) => {
                let filePath = Path.join(commandsPath, commandFile);
                let fileStatus = Fs.lstatSync(filePath);

                if (fileStatus.isDirectory()) return this.loadCommands(filePath);
                else {
                    let command = require(filePath);

                    if (command) this.commands.set(command.data.name, command);
                    else console.log(("[HANDLER]"), ("[EVENTS]"), (`No export found in <${commandFile}>`));
                };
            });
        } else console.log(("[HANDLER]"), ("[EVENTS]"), (`<${commandsPath}> does not exist`));
    };

    registerCommands = () => {
        this.discordApi.put(Routes.applicationGuildCommands(this.user.id, "890977052688273448"), {
            body: this.commands.map((command) => command.data.toJSON()),
        }).then(() => {
            console.log("[DISCORD]", "[COMMANDS]", (`Successfully registered application private commands`));
        }).catch((error) => {
            console.log("[DISCORD]", "[COMMANDS]", (`Unbale to register application private commands`));
            console.log("[DISCORD]", "[COMMANDS]", (error?.message ? error.message : error));
        });
    };

    registerPrivateCommands = () => {
        this.discordApi.put(Routes.applicationGuildCommands(this.user.id, ("938780069894164490")), {
            body: this.commands.filter((command) => command.isPrivate).map((command) => command.data.toJSON()),
        }).then(() => {
            console.log("[DISCORD]", "[COMMANDS]", (`Successfully registered application private commands`));
        }).catch((error) => {
            console.log("[DISCORD]", "[COMMANDS]", (`Unbale to register application private commands`));
            console.log("[DISCORD]", "[COMMANDS]", (error?.message ? error.message : error));
        });
    };
};

module.exports = ExtendedClient;