// =======================================
// Modules
// =======================================
var Discord = require("discord.io");
var fs = require("fs");
var colors = require("colors");
var mysql = require("mysql");

// ======================================
// Global variables
// ======================================
var discord, config, permissions, commands = {};

console.log();
console.log("                 ________   ___   ________   ___  __            ________   ________   _________   ");
console.log("                |\\   ___ \\ |\\  \\ |\\   __  \\ |\\  \\|\\  \\         |\\   __  \\ |\\   __  \\ |\\___   ___\\ ");
console.log("                \\ \\  \\_|\\ \\\\ \\  \\\\ \\  \\|\\  \\\\ \\  \\/  /|_       \\ \\  \\|\\ /_\\ \\  \\|\\  \\\\|___ \\  \\_| ");
console.log("                 \\ \\  \\ \\\\ \\\\ \\  \\\\ \\   _  _\\\\ \\   ___  \\       \\ \\   __  \\\\ \\  \\\\\\  \\    \\ \\  \\  ");
console.log("                  \\ \\  \\_\\\\ \\\\ \\  \\\\ \\  \\\\  \\|\\ \\  \\\\ \\  \\       \\ \\  \\|\\  \\\\ \\  \\\\\\  \\    \\ \\  \\ ");
console.log("                   \\ \\_______\\\\ \\__\\\\ \\__\\\\ _\\ \\ \\__\\\\ \\__\\       \\ \\_______\\\\ \\_______\\    \\ \\__\\");
console.log("                    \\|_______| \\|__| \\|__|\\|__| \\|__| \\|__|        \\|_______| \\|_______|     \\|__|");
console.log();

// ======================================
// Command parsing
// ======================================
// checkBlacklistChannel() returns true when it's blacklisted and false if it's not
function checkBlacklistChannel(userID, serverID, channelID, args) {
	var blacklist = JSON.parse(fs.readFileSync("configfiles/blacklist.json"));
	args = args.split(" ");

	if(blacklist.hasOwnProperty("server" + serverID) &&
		args[0] != commandPrefix(serverID) + "enable" && args[0] != commandPrefix(serverID) + "disable" &&
		args[0] != commandPrefix(serverID) + "enablechannel" && args[0] != commandPrefix(serverID) + "disablechannel" &&
		userID != config.ids.masterUser) {
		for(var j in blacklist["server" + serverID].nocommandsinchannel) {
			if(blacklist["server" + serverID].nocommandsinchannel[j] == channelID)
				return true;
		}
	}

	return false;
}

// checkBlacklistCommand() returns true when it's blacklisted and false if it's not
function checkBlacklistCommand(serverID, args) {
	var blacklist = JSON.parse(fs.readFileSync("configfiles/blacklist.json"));
	args = args.split(" ");

	if(blacklist.hasOwnProperty("server" + serverID)) {
		for(var i in blacklist["server" + serverID].disabledcommands) {
			if(commandPrefix(serverID) + blacklist["server" + serverID].disabledcommands[i] == args[0])
				return true;
		}
	}

	return false;
}

function runCommand(args, context) {
    if (args.length < 1) return;
    if (commands[args[0]]) {
        if (commands[args[0]].permission &&
            !userHasPermission(context.userID, context.channelID, context.serverID, commands[args[0]].permission) &&
			commands[args[0]].permission != "default") {
				if(context.userID != config.ids.masterUser) {
					var msg = ":no_entry: | You don't have permission to use this command.";
					discord.sendMessage({
						to: context.channelID,
						message: msg
					});

					console.log(localDateString() + " | [COMMAND] " + context.username + " (" + context.userID + " @ " +
	                    discord.servers[context.serverID].name + ") no permission for " + context.userID, args);
	                return;
				}
        }

        console.log(localDateString() + " | [COMMAND] " + context.username + " (" + context.userID + " @ " +
            discord.servers[context.serverID].name + ") ran ", args);

        try {
            var result = commands[args[0]].func(args, context, function(msg) {
                discord.sendMessage({
                    to: context.channelID,
                    message: msg
                });
            });
            if (result) {
                discord.sendMessage({
                    to: context.channelID,
                    message: result
                });
            }
        } catch (ex) {
            console.log(localDateString() + " | " + colors.red("[ERROR]") + " Error running command: ", ex);
        }
    }
}

function parseCommand(message, context) {
    if (message.indexOf(" ") > 0) {
        var f = message.indexOf(" ");
        runCommand([message.substr(0, f), message.substr(f + 1)], context);
    } else {
        runCommand([message], context);
    }
}

function userHasPermission(userID, channelID, serverID, permission) {
    var userPerms = [];

    if (userID) {
		if(!permissions.hasOwnProperty("server" + serverID)) permissions["server" + serverID] = [];
		if(!permissions["server" + serverID].hasOwnProperty("user" + userID)) permissions["server" + serverID]["user" + userID] = [];

		userPerms = userPerms.concat(permissions["server" + serverID]["user" + userID] ? permissions["server" + serverID]["user" + userID] : []);
	}

    if (channelID) userPerms = userPerms.concat(permissions["server" + serverID]["channel" + channelID] ? permissions["server" + serverID]["channel" + channelID] : []);
    if (serverID) userPerms = userPerms.concat(permissions["server" + serverID]["server" + serverID] ? permissions["server" + serverID]["server" + serverID] : []);
    if (permissions["server" + serverID]["default"]) userPerms = userPerms.concat(permissions["server" + serverID]["default"]);
    var permParts = permission.split(".");

    for (var i = 0; i < userPerms.length; i++) {
        var negate = false;
        var userPerm = userPerms[i];
        if (userPerm.length > 0 && userPerm[0] == "-") {
            negate = true;
            userPerm = userPerm.substr(1);
        }
        var userPermParts = userPerm.split(".");
        if (userPermParts.length > permParts.length) continue;
        var matched = true;
        for (var j = 0; j < permParts.length; j++) {
            if (userPermParts[j] == "*") return !negate;
            else if (userPermParts[j] != permParts[j]) {
                matched = false;
                break;
            }
        }
        if (matched) return !negate;
    }
    return false;
}

// ==========================================
// Load permissions and permission functions
// ==========================================
function loadConfig() {
    config = JSON.parse(fs.readFileSync("configfiles/config.json"));
    console.log(localDateString() + " | " + colors.green("[LOAD]") + " Config loaded!");
}

exports.reloadPermissions = function() {
    permissions = JSON.parse(fs.readFileSync("configfiles/permissions.json"));
    console.log(localDateString() + " | " + colors.green("[LOAD]") + " Permissions reloaded!");
};
function loadPermissions() {
    permissions = JSON.parse(fs.readFileSync("configfiles/permissions.json"));
    console.log(localDateString() + " | " + colors.green("[LOAD]") + " Permissions loaded!");
}

// ======================================
// Plugin functions
// ======================================
function loadPlugin(name, configObject) {
    var path = "./plugins/" + name + ".js";

    delete require.cache[require.resolve(path)];
    var plugin = require(path);

    for (var i in configObject) {
        plugin.config[i] = configObject[i];
    }

    if (plugin.commands) {
        for (var cmd in plugin.commands) {
            if (commands[cmd]) throw localDateString() + " | [ERROR] Command " + cmd + " is already defined!";

            if (!plugin.commands[cmd].func) 		throw localDateString() + " | [ERROR] No command function for " + cmd + "!";
            if (!plugin.commands[cmd].permission) 	console.warn(localDateString() + " | " + colors.yellow("[WARNING]") + " The command \"" + cmd + "\" doesn't have any permissions.");
			if (!plugin.commands[cmd].description) 	console.warn(localDateString() + " | " + colors.yellow("[WARNING]") + " The command \"" + cmd + "\" doesn't have any description.");
			if (!plugin.commands[cmd].usage) 		console.warn(localDateString() + " | " + colors.yellow("[WARNING]") + " The command \"" + cmd + "\" doesn't have any usage.");
			if (!plugin.commands[cmd].examples) 	console.warn(localDateString() + " | " + colors.yellow("[WARNING]") + " The command \"" + cmd + "\" doesn't have any examples.");

            commands[cmd] = plugin.commands[cmd];
            commands[cmd].plugin = path;
            commands[cmd].command = cmd;
        }
    }

    console.log(localDateString() + " | " + colors.green("[LOAD]") + " Loaded " + name + "!");
}

function reloadPlugin(name, configObject) {
    var path = "./plugins/" + name + ".js";

    delete require.cache[require.resolve(path)];
    var plugin = require(path);

    for (var i in configObject) {
        plugin.config[i] = configObject[i];
    }
    if (plugin.commands) {
        for (var cmd in plugin.commands) {
            if (commands[cmd]) throw localDateString() + " | [ERROR] Command " + cmd + " is already defined!";

            if (!plugin.commands[cmd].func) 		throw localDateString() + " | [ERROR] No command function for " + cmd + "!";
            if (!plugin.commands[cmd].permission) 	console.warn(localDateString() + " | " + colors.yellow("[WARNING]") + " The command \"" + cmd + "\" doesn't have any permissions.");
			if (!plugin.commands[cmd].description) 	console.warn(localDateString() + " | " + colors.yellow("[WARNING]") + " The command \"" + cmd + "\" doesn't have any description.");
			if (!plugin.commands[cmd].usage) 		console.warn(localDateString() + " | " + colors.yellow("[WARNING]") + " The command \"" + cmd + "\" doesn't have any usage.");
			if (!plugin.commands[cmd].examples) 	console.warn(localDateString() + " | " + colors.yellow("[WARNING]") + " The command \"" + cmd + "\" doesn't have any examples.");

            commands[cmd] = plugin.commands[cmd];
            commands[cmd].plugin = path;
            commands[cmd].command = cmd;
        }
    }

    console.log(localDateString() + " | " + colors.green("[LOAD]") + " Loaded " + name + "!");
}

exports.reloadPlugins = function(){
    console.log(localDateString() + " | " + colors.green("[LOAD]") + " Reloading plugins...");
    commands = {};
    var i, filename;
    var pluginFiles = [];
    var configs = {};
    fs.readdir("plugins", function(err, files) {
        if (err) throw localDateString() + " | [ERROR] Error loading plugins: " + err;

        for (i = 0; i < files.length; i++) {
            filename = files[i];

            if (filename && filename[0] != '.') {
                if (filename.lastIndexOf(".js") == filename.length - 3) {
                    pluginFiles.push(filename);
                } else if (filename.lastIndexOf(".config.json") == filename.length - 12) {
                    configs[filename.substr(0, filename.length - 12)] = JSON.parse(fs.readFileSync("./plugins/" + filename));
                }
            }
        }

        for (i = 0; i < pluginFiles.length; i++) {
            var pluginName = pluginFiles[i].substr(0, pluginFiles[i].length - 3);

            if (configs[pluginName]) {
                reloadPlugin(pluginName, configs[pluginName]);
            } else {
                reloadPlugin(pluginName, {});
            }
        }
    });
};

function loadPlugins() {
    console.log(localDateString() + " | " + colors.green("[LOAD]") + " Loading plugins...");
    var i, filename;
    var pluginFiles = [];
    var configs = {};
    fs.readdir("plugins", function(err, files) {
        if (err) throw localDateString() + " | [ERROR] Error loading plugins: " + err;

        for (i = 0; i < files.length; i++) {
            filename = files[i];
            if (filename && filename[0] != '.') {
                if (filename.lastIndexOf(".js") == filename.length - 3) {
                    pluginFiles.push(filename);
                } else if (filename.lastIndexOf(".config.json") == filename.length - 12) {
                    configs[filename.substr(0, filename.length - 12)] = JSON.parse(fs.readFileSync("./plugins/" + filename));
                }
            }
        }

        for (i = 0; i < pluginFiles.length; i++) {
            var pluginName = pluginFiles[i].substr(0, pluginFiles[i].length - 3);
            if (configs[pluginName]) {
                loadPlugin(pluginName, configs[pluginName]);
            } else {
                loadPlugin(pluginName, {});
            }
        }
    });
}

// ======================================
// Exports
// ======================================
exports.getMySQLConn = function() {
	var connection = mysql.createConnection({
		host     : config.MySQL.host,
		port	 : config.MySQL.port,
		user     : config.MySQL.user,
		password : config.MySQL.password,
		database : config.MySQL.database
	});

	connection.connect(function(err) {
		if (err) {
		  console.error('error connecting: ' + err.stack);
		  return;
		}

		// console.log('Connected as id ' + connection.threadId);
	});

	return connection;
};

exports.getCommands = function() {
	return commands;
};

exports.getConfig = function() {
	return config;
};

exports.getDiscord = function() {
	return discord;
};

exports.setGame = function(gamename) {
    discord.setPresence({
        game: gamename
    });
};

exports.getBotId = function() {
	return config.ids.botId;
};

exports.getAxSId = function() {
	return config.ids.AxSServer;
};

exports.commandPrefix = function(serverID) {
	if(!serverID)
		return config.masterCommandPrefix;

	var commandPrefix = JSON.parse(fs.readFileSync("configfiles/config.commandprefix.json"));

	if(commandPrefix.hasOwnProperty("server" + serverID)) {
		return commandPrefix["server" + serverID];
	}
	else {
		return config.masterCommandPrefix;
	}
};

function commandPrefix(serverID) {
	if(!serverID)
		return config.masterCommandPrefix;

	var commandPrefix = JSON.parse(fs.readFileSync("configfiles/config.commandprefix.json"));

	if(commandPrefix.hasOwnProperty("server" + serverID)) {
		return commandPrefix["server" + serverID];
	}
	else {
		return config.masterCommandPrefix;
	}
}

exports.sendWrong = function(channelID, user, message) {
	discord.sendMessage({
		to: channelID,
		message: ":no_entry: | **Something went wrong for** <@" + user + ">. \n\n" + message
	});

	return;
};

exports.localDateString = function() {
	var curTime = new Date().getTime();
	curTime = new Date(curTime).toLocaleTimeString();

	return curTime;
};

function localDateString () {
	var curTime = new Date().getTime();
	curTime = new Date(curTime).toLocaleTimeString();

	return curTime;
}

// ======================================
// Start the bot
// ======================================
loadConfig();
loadPermissions();
loadPlugins();

exports.discord = discord = new Discord.Client({
	autorun: true,
    token: config.botToken
});

discord.on("ready", function() {
	for(var i in discord.servers) {
		console.log(localDateString() + " | " + colors.green("[CONNECT]") + " Connected to the server: %s", discord.servers[i].name);
	}

    console.log(localDateString() + " | Logged in as %s, connected to %s servers. \n", discord.username, Object.keys(discord.servers).length);

	discord.setPresence({
        game: "Type !help for help"
    });
});

discord.on("message", function(username, userID, channelID, message, event) {
	// log "event.d.channel_id", then pm the bot user and copy that channel_id down here
	if(event.d.channel_id == "278160895949930497")
		return;

	var serverID = discord.channels[channelID].guild_id;
	if(userID == config.ids.botId)
		return;

	// help command works even when it is the config.masterCommandPrefix
	if (message.indexOf(config.masterCommandPrefix) === 0 && message.substr(config.masterCommandPrefix.length) == "help") {
		parseCommand(message.substr(config.masterCommandPrefix.length), {
            username: username,
            userID: userID,
            channelID: channelID,
            serverID: serverID
        });

		return;
	}

	if (message.indexOf(commandPrefix(serverID)) === 0) {
		// Check for blacklisted commands
		if(checkBlacklistChannel(userID, serverID, channelID, message)) {
			discord.sendMessage({
				to: channelID,
				embed: {
					title: ":no_entry: An error has occured.",
					description: "The usage of commands has been disabled in this channel.",
					color: 0xFF0000
				}
			});
			console.log(localDateString() + " | [COMMAND] " + username + " (" + userID + " @ " + discord.servers[serverID].name + ") ran a command in a blacklisted channel.");
			return;
		}

		if(checkBlacklistCommand(serverID, message)) {
			discord.sendMessage({
				to: channelID,
				embed: {
					title: ":no_entry: An error has occured.",
					description: "This command has been disabled.",
					color: 0xFF0000
				}
			});
			console.log(localDateString() + " | [COMMAND] " + username + " (" + userID + " @ " + discord.servers[serverID].name + ") ran a blacklisted command.");
			return;
		}

		// Static commands from the various files
		parseCommand(message.substr(commandPrefix(serverID).length), {
            username: username,
            userID: userID,
            channelID: channelID,
            serverID: serverID
        });

		// Dynamic commands, located in "configfiles/commands.json"
		var allCommands = JSON.parse(fs.readFileSync("configfiles/commands.json"));

		for(var cmd in allCommands.commands["server" + serverID]) {
			var commandSplit = message.split(" ");
			var allcmd = allCommands.commands["server" + serverID];

			if(commandSplit[0] == commandPrefix(serverID) + allcmd[cmd].commandname) {
				discord.sendMessage({
                    to: channelID,
                    message: allcmd[cmd].message
                });

				console.log(localDateString() + " | [COMMAND] " + username + " (" + userID + " @ " + discord.servers[serverID].name + ") ran [ '" + allcmd[cmd].commandname + "' ]");
				return;
			}
		}
    }
	else {
		var allInline = JSON.parse(fs.readFileSync("configfiles/commands.json"));

		for(var inl in allInline.inline["server" + serverID]) {
			var allinl = allInline.inline["server" + serverID];

			if(message.toLowerCase().includes(allinl[inl].inlinecommand)) {
				var beginPos = message.search(allinl[inl].inlinecommand);
				var endPos = allinl[inl].inlinecommand.length + beginPos - 1;

				if((message[beginPos - 1] == " " || message[beginPos - 1] === "" || message[beginPos - 1] === undefined) &&
					(message[endPos + 1] == " " || message[endPos + 1] === "" || message[endPos + 1] === undefined)) {}
					else
						return;

				discord.sendMessage({
					to: channelID,
					message: allinl[inl].message
				});

				console.log(localDateString() + " | [COMMAND] " + username + " (" + userID + " @ " + discord.servers[serverID].name + ") ran inline [ '" + allinl[inl].inlinecommand + "' ]");
				return;
			}
		}
	}
});

discord.on("any", function(event) {
	// User has joined a server
	if(event.t == "GUILD_MEMBER_ADD") {
		var welcomeMessage = JSON.parse(fs.readFileSync("configfiles/welcomechannel.json"));
		for(var i in event.d) {
			if(event.d[i].hasOwnProperty("id")) {
				if(welcomeMessage.hasOwnProperty("server" + event.d.guild_id)) {
					if(welcomeMessage["server" + event.d.guild_id].channelID != "N/A") {
						discord.sendMessage({
							to: welcomeMessage["server" + event.d.guild_id].channelID,
							message: "Welcome <@" + event.d[i].id + ">!"
						});
					}
				}

				console.log(localDateString() + " | [JOIN] Member " + event.d[i].username + " has joined the server: " + discord.servers[event.d.guild_id].name + ". ");
			}
		}
	}
});

discord.on("disconnected", function() {
    console.log("Connection lost! Reconnecting in 3 seconds");
    setTimeout(discord.connect, 3000);
});
