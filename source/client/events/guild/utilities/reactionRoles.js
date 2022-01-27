const TableManager = require('../../../../database/table-manager');

const ReactionRolesTable = new TableManager("reactionroles");
const MessagesTable = new TableManager("messages");
const GuildsTable = new TableManager("guilds");
const EmojisTable = new TableManager("emojis");
const RolesTable = new TableManager("roles");

module.exports = {
    once: false,
    type: "raw",

    execute: async (client, data) => {
        if (["MESSAGE_REACTION_REMOVE", "MESSAGE_REACTION_ADD"].includes(data.t)) {
            let guildData = await GuildsTable.fetchRow({ Guild: data.d.guild_id });
            let guild = client.guilds.cache.get(data.d.guild_id);

            if (guildData?.areReactionRolesEnabled) {
                let doesMessageExist = await MessagesTable.doesRowExist({ Guild: guildData.Id, Message: data.d.message_id });

                if (doesMessageExist) {
                    let messageData = await MessagesTable.fetchRow({ Guild: guildData.Id, Message: data.d.message_id });
                    let shouldMessageBeWatched = await ReactionRolesTable.doesRowExist({ Guild: guildData.Id, Message: messageData.Id });

                    if (shouldMessageBeWatched) {
                        let emojiData = await EmojisTable.fetchRow({ EmojiId: data.d.emoji.id, EmojiName: data.d.emoji.name });
                        let isEmojiSupported = await ReactionRolesTable.doesRowExist({ Guild: guildData.Id, Message: messageData.Id, Emoji: emojiData.Id });

                        if (isEmojiSupported) {
                            let reactionRoleSettings = await ReactionRolesTable.fetchRow({ Guild: guildData.Id, Message: messageData.Id, Emoji: emojiData.Id });
                            let reactionRoleRoleData = await RolesTable.fetchRow({ Id: reactionRoleSettings.Role });
                            let reactionRoleRole = guild.roles.cache.get(reactionRoleRoleData.Role);
                                    
                            let member = guild.members.cache.has(data.d.user_id) ? guild.members.cache.get(data.d.user_id) : await guild.members.fetch({ user: data.d.user_id, force: true });
                            
                            switch (data.t) {
                                case ("MESSAGE_REACTION_ADD"):                                    
                                    if (data.d?.member?.roles?.includes(reactionRoleRoleData.Role)) return
                                        else {
                                            if (guild.members.cache.has(data.d.user_id)) {
                                                if (member && reactionRoleRole.editable) return member.roles.add(reactionRoleRole);
                                            } else {
                                                if (member && reactionRoleRole.editable) return member.roles.add(reactionRoleRole);
                                            };
                                        };
                                break;

                                case ("MESSAGE_REACTION_REMOVE"):
                                    if (member.roles.cache.has(reactionRoleRoleData.Role)) {
                                        if (guild.members.cache.has(data.d.user_id)) {
                                            if (member && reactionRoleRole.editable) return member.roles.remove(reactionRoleRole);
                                        } else {
                                            if (member && reactionRoleRole.editable) return member.roles.remove(reactionRoleRole);
                                        };
                                    };
                                break;
                            };
                        };
                    };
                };
            };
        };
    },
};