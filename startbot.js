/* jshint -W004 */
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
var discord, config, pool,
	permission = {}, commands = {}, blackList = {}, commandPrefix = {}, welcomeServers = {},
	dynamicCommands = {commands: {}, inline: {}}, highlights = {};

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
	args = args.split(" ");

	if(blackList.hasOwnProperty("server" + serverID) &&
		args[0] != getCommandPrefix(serverID) + "enable" && args[0] != getCommandPrefix(serverID) + "disable" &&
		args[0] != getCommandPrefix(serverID) + "enablechannel" && args[0] != getCommandPrefix(serverID) + "disablechannel" &&
		userID != config.ids.masterUser) {
		for(var j in blackList["server" + serverID].nocommandsinchannel) {
			if(blackList["server" + serverID].nocommandsinchannel[j] == channelID)
				return true;
		}
	}

	return false;
}

// checkBlacklistCommand() returns true when it's blacklisted and false if it's not
function checkBlacklistCommand(serverID, args) {
	args = args.split(" ");

	if(blackList.hasOwnProperty("server" + serverID)) {
		for(var i in blackList["server" + serverID].disabledcommands) {
			if(getCommandPrefix(serverID) + blackList["server" + serverID].disabledcommands[i] == args[0])
				return true;
		}
	}

	return false;
}

// Parse the command
function parseCommand(message, context) {
    if (message.indexOf(" ") > 0) {
        var f = message.indexOf(" ");
        runCommand([message.substr(0, f), message.substr(f + 1)], context);
    } else {
        runCommand([message], context);
    }
}

// Run the actual command
function runCommand(args, context) {
    if (args.length < 1) return;
    if (commands[args[0]]) {
        if (commands[args[0]].permission && !userHasPermission(context.userID, context.channelID, context.serverID, commands[args[0]].permission) && commands[args[0]].permission != "default" ||
			(commands[args[0]].permission == "owner" && context.userID != config.ids.masterUser)) {
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
            console.log(localDateString() + " | " + colors.red("[ERROR]") + "   Error running command: ", ex);
        }
    }
}

// Check the permissions when a user enters a command
function userHasPermission(userID, channelID, serverID, permissionToSplit) {
    var userPerms = [];

    if (userID) {
		if(!permission.hasOwnProperty("server" + serverID)) permission["server" + serverID] = [];
		if(!permission["server" + serverID].hasOwnProperty("user" + userID)) permission["server" + serverID]["user" + userID] = [];

		userPerms = userPerms.concat(permission["server" + serverID]["user" + userID] ? permission["server" + serverID]["user" + userID] : []);
	}

    if (channelID) userPerms = userPerms.concat(permission["server" + serverID]["channel" + channelID] ? permission["server" + serverID]["channel" + channelID] : []);
    if (serverID) userPerms = userPerms.concat(permission["server" + serverID]["server" + serverID] ? permission["server" + serverID]["server" + serverID] : []);
    if (permission["server" + serverID]["default"]) userPerms = userPerms.concat(permission["server" + serverID]["default"]);
    var permParts = permissionToSplit.split(".");

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
// Load functions
// ==========================================
function loadMySQL() {
	pool = mysql.createPool({
		connectionLimit 	: 10,
		host     			: config.MySQL.host,
		port	 			: config.MySQL.port,
		user    			: config.MySQL.user,
		password			: config.MySQL.password,
		database			: config.MySQL.database,
		supportBigNumbers 	: true,
        bigNumberStrings 	: true,
		multipleStatements	: true
	});

	pool.getConnection(function(err, connection) {
		if(err)
			throw localDateString() + " | [ERROR]   Cannot connect to the MySQL database: " + err;
		else
			console.log(localDateString() + " | " + colors.green("[CONNECT]") + " Succesfully connected to the MySQL database: " + config.MySQL.database + ". ");
	});
}

// Initialize the config variable
function loadConfig() {
    config = JSON.parse(fs.readFileSync("configfiles/config.json"));
    console.log(localDateString() + " | " + colors.green("[LOAD]") + "    Config file has been loaded!");
}

// Initialize the welcomeServers variable
function loadWelcomeChannels() {
	pool.getConnection(function(err, connection) {
		connection.query("SELECT * FROM wmtoggle", function(err, results) {
			for(var i in results) {
				if(welcomeServers.hasOwnProperty("server" + results[i].serverID))
					welcomeServers["server" + results[i].serverID]['channel' + results[i].channelID] = {'jtoggle': results[i].welcomeMessage, 'ltoggle': results[i].leaveMessage};
				else {
					welcomeServers["server" + results[i].serverID] = {};
					welcomeServers["server" + results[i].serverID]['channel' + results[i].channelID] = {'jtoggle': results[i].welcomeMessage, 'ltoggle': results[i].leaveMessage};
				}
			}

			console.log(localDateString() + " | " + colors.green("[LOAD]") + "    Loaded all the Welcome Channels!");
			connection.release();
		});
	});
}

// Initialize the commandPrefix variable
function loadCommandPrefix() {
	pool.getConnection(function(err, connection) {
		connection.query("SELECT * FROM commandprefix", function(err, results) {
			for(var i in results) {
				commandPrefix["server" + results[i].serverID] = results[i].commandPrefix;
			}

			console.log(localDateString() + " | " + colors.green("[LOAD]") + "    Command Prefixes have been loaded!");
			connection.release();
		});
	});
}

// Initialize the permission variable
function loadPermissions() {
	pool.getConnection(function(err, connection) {
		connection.query('SELECT * FROM permission', function(err, results, fields) {
			for(var i in results) {
				if(!permission.hasOwnProperty("server" + results[i].serverID)) {
					permission["server" + results[i].serverID] = {};
					permission["server" + results[i].serverID]["user" + results[i].userID] = [results[i].permissionName];
				}
				else {
					if(!permission["server" + results[i].serverID].hasOwnProperty("user" + results[i].userID)) {
						permission["server" + results[i].serverID]["user" + results[i].userID] = [results[i].permissionName];
					}
					else {
						permission["server" + results[i].serverID]["user" + results[i].userID].push(results[i].permissionName);
					}
				}
			}

			console.log(localDateString() + " | " + colors.green("[LOAD]") + "    Permissions have been loaded!");
			connection.release();
		});
	});
}

// Initialize the blackList variable
function loadBlacklist() {
	pool.getConnection(function(err, connection) {
		connection.query("SELECT * FROM blacklist", function(err, results) {
			for(var i in results) {
				if(!blackList.hasOwnProperty("server" + results[i].serverID)) {
					blackList["server" + results[i].serverID] = {"nocommandsinchannel": [], "disabledcommands": []};

					if(results[i].noCmdInChannel != "0")
						blackList["server" + results[i].serverID].nocommandsinchannel.push(results[i].noCmdInChannel);

					if(results[i].disabledCommand != "N/A")
						blackList["server" + results[i].serverID].disabledcommands.push(results[i].disabledCommand);
				}
				else {
					if(results[i].noCmdInChannel != "0")
						blackList["server" + results[i].serverID].nocommandsinchannel.push(results[i].noCmdInChannel);

					if(results[i].disabledCommand != "N/A")
						blackList["server" + results[i].serverID].disabledcommands.push(results[i].disabledCommand);
				}
			}

			console.log(localDateString() + " | " + colors.green("[LOAD]") + "    The blacklist has been loaded!");
			connection.release();
		});
	});
}

// Initialize the highlights variable
function loadHighlights() {
	pool.getConnection(function(err, connection) {
		connection.query("SELECT * FROM highlightlist; SELECT * FROM highlights;", function(err, results) {
			for(var i in results[0]) {
				if(!highlights.hasOwnProperty('server' + results[0][i].serverID)) {
					highlights["server" + results[0][i].serverID] = {'channels': [], 'keywords': []};
					highlights["server" + results[0][i].serverID].channels.push(results[0][i].channelID);
				}
				else {
					highlights["server" + results[0][i].serverID].channels.push(results[0][i].channelID);
				}
			}

			for(var i in results[1]) {
				if(!highlights.hasOwnProperty('server' + results[1][i].serverID)) {
					highlights["server" + results[1][i].serverID] = {'channels': [], 'keywords': []};
					highlights["server" + results[1][i].serverID].keywords.push(results[1][i].keyword);
				}
				else {
					highlights["server" + results[1][i].serverID].keywords.push(results[1][i].keyword);
				}
			}

			console.log(localDateString() + " | " + colors.green("[LOAD]") + "    The highlights has been loaded!");
			connection.release();
		});
	});
}

// Load a single plugin (commands)
function loadPlugin(name, configObject) {
    var path = "./plugins/" + name + ".js";

    delete require.cache[require.resolve(path)];
    var plugin = require(path);

    for (var i in configObject) {
        plugin.config[i] = configObject[i];
    }

    if (plugin.commands) {
        for (var cmd in plugin.commands) {
            if (commands[cmd]) throw localDateString() + " | [ERROR]   Command " + cmd + " is already defined!";

            if (!plugin.commands[cmd].func) 		throw localDateString() + " | [ERROR]   No command function for " + cmd + "!";
            if (!plugin.commands[cmd].permission) 	console.warn(localDateString() + " | " + colors.yellow("[WARNING]") + " The command \"" + cmd + "\" doesn't have any permissions.");
			if (!plugin.commands[cmd].description) 	console.warn(localDateString() + " | " + colors.yellow("[WARNING]") + " The command \"" + cmd + "\" doesn't have any description.");
			if (!plugin.commands[cmd].usage) 		console.warn(localDateString() + " | " + colors.yellow("[WARNING]") + " The command \"" + cmd + "\" doesn't have any usage.");
			if (!plugin.commands[cmd].examples) 	console.warn(localDateString() + " | " + colors.yellow("[WARNING]") + " The command \"" + cmd + "\" doesn't have any examples.");

            commands[cmd] = plugin.commands[cmd];
            commands[cmd].plugin = path;
            commands[cmd].command = cmd;
        }
    }

    console.log(localDateString() + " | " + colors.green("[LOAD]") + "    Loaded the plugin " + name + "!");
}

// Load _ALL_ plugins
function loadPlugins() {
    console.log(localDateString() + " | " + colors.green("[LOAD]") + "    Loading plugins...");
    var i, filename;
    var pluginFiles = [];
    var configs = {};
    fs.readdir("plugins", function(err, files) {
        if (err) throw localDateString() + " | [ERROR]   Error loading plugins: " + err;

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

	console.log(localDateString() + " | " + colors.green("[LOAD]") + "    Finished loading plugins.");
}

// Load all dynamic commands (both normal commands and inline)
function loadDynamicCommands() {
	pool.getConnection(function(err, connection) {
		connection.query("SELECT * FROM commands", function(err, results) {
			for(var i in results) {
				if(results[i].typeCommand == "command") {
					if(dynamicCommands.commands.hasOwnProperty("server" + results[i].serverID)) {
						dynamicCommands.commands["server" + results[i].serverID][results[i].commandName] = {commandname: "", message: ""};
						dynamicCommands.commands["server" + results[i].serverID][results[i].commandName].commandname = results[i].commandName;
						dynamicCommands.commands["server" + results[i].serverID][results[i].commandName].message = results[i].commandMessage;
					}
					else {
						dynamicCommands.commands["server" + results[i].serverID] = {};
						dynamicCommands.commands["server" + results[i].serverID][results[i].commandName] = {commandname: "", message: ""};
						dynamicCommands.commands["server" + results[i].serverID][results[i].commandName].commandname = results[i].commandName;
						dynamicCommands.commands["server" + results[i].serverID][results[i].commandName].message = results[i].commandMessage;
					}
				}
				else if(results[i].typeCommand == "inline") {
					if(dynamicCommands.inline.hasOwnProperty("server" + results[i].serverID)) {
						dynamicCommands.inline["server" + results[i].serverID][results[i].commandName] = {inlinecommand: "", message: ""};
						dynamicCommands.inline["server" + results[i].serverID][results[i].commandName].inlinecommand = results[i].commandName;
						dynamicCommands.inline["server" + results[i].serverID][results[i].commandName].message = results[i].commandMessage;
					}
					else {
						dynamicCommands.inline["server" + results[i].serverID] = {};
						dynamicCommands.inline["server" + results[i].serverID][results[i].commandName] = {inlinecommand: "", message: ""};
						dynamicCommands.inline["server" + results[i].serverID][results[i].commandName].inlinecommand = results[i].commandName;
						dynamicCommands.inline["server" + results[i].serverID][results[i].commandName].message = results[i].commandMessage;
					}
				}
			}

			console.log(localDateString() + " | " + colors.green("[LOAD]") + "    Dynamic commands have been loaded!");
			connection.release();
		});
	});
}

// ==========================================
// Reload functions
// ==========================================
exports.reloadPermissions = function() {
	permission = {};

	pool.getConnection(function(err, connection) {
		connection.query('SELECT * FROM permission', function(err, results, fields) {
			for(var i in results) {
				if(!permission.hasOwnProperty("server" + results[i].serverID)) {
					permission["server" + results[i].serverID] = {};
					permission["server" + results[i].serverID]["user" + results[i].userID] = [];
					permission["server" + results[i].serverID]["user" + results[i].userID].push(results[i].permissionName);
				}
				else {
					if(!permission["server" + results[i].serverID].hasOwnProperty("user" + results[i].userID)) {
						permission["server" + results[i].serverID]["user" + results[i].userID] = [];
						permission["server" + results[i].serverID]["user" + results[i].userID].push(results[i].permissionName);
					}
					else {
						permission["server" + results[i].serverID]["user" + results[i].userID].push(results[i].permissionName);
					}
				}
			}

			console.log(localDateString() + " | " + colors.green("[LOAD]") + "    Permissions have been reloaded!");
			connection.release();
		});
	});
};

function reloadPlugin(name, configObject) {
    var path = "./plugins/" + name + ".js";

    delete require.cache[require.resolve(path)];
    var plugin = require(path);

    for (var i in configObject) {
        plugin.config[i] = configObject[i];
    }
    if (plugin.commands) {
        for (var cmd in plugin.commands) {
            if (commands[cmd]) throw localDateString() + " | [ERROR]   Command " + cmd + " is already defined!";

            if (!plugin.commands[cmd].func) 		throw localDateString() + " | [ERROR]   No command function for " + cmd + "!";
            if (!plugin.commands[cmd].permission) 	console.warn(localDateString() + " | " + colors.yellow("[WARNING]") + " The command \"" + cmd + "\" doesn't have any permissions.");
			if (!plugin.commands[cmd].description) 	console.warn(localDateString() + " | " + colors.yellow("[WARNING]") + " The command \"" + cmd + "\" doesn't have any description.");
			if (!plugin.commands[cmd].usage) 		console.warn(localDateString() + " | " + colors.yellow("[WARNING]") + " The command \"" + cmd + "\" doesn't have any usage.");
			if (!plugin.commands[cmd].examples) 	console.warn(localDateString() + " | " + colors.yellow("[WARNING]") + " The command \"" + cmd + "\" doesn't have any examples.");

            commands[cmd] = plugin.commands[cmd];
            commands[cmd].plugin = path;
            commands[cmd].command = cmd;
        }
    }

    console.log(localDateString() + " | " + colors.green("[LOAD]") + "    Reloaded the plugin " + name + "!");
}

exports.reloadPlugins = function(){
    console.log(localDateString() + " | " + colors.green("[LOAD]") + "    Reloading plugins...");
    commands = {};
    var i, filename;
    var pluginFiles = [];
    var configs = {};
    fs.readdir("plugins", function(err, files) {
        if (err) throw localDateString() + " | [ERROR]   Error loading plugins: " + err;

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

exports.reloadCommandPrefix = function() {
	commandPrefix = {};

	pool.getConnection(function(err, connection) {
		connection.query("SELECT * FROM commandPrefix", function(err, results) {
			for(var i in results) {
				commandPrefix["server" + results[i].serverID] = results[i].commandPrefix;
			}

			console.log(localDateString() + " | " + colors.green("[LOAD]") + "    Command Prefixes have been reloaded!");
			connection.release();
		});
	});
};

exports.reloadWelcomeChannels = function() {
	welcomeServers = {};

	pool.getConnection(function(err, connection) {
		connection.query("SELECT * FROM wmtoggle", function(err, results) {
			for(var i in results) {
				if(welcomeServers.hasOwnProperty("server" + results[i].serverID))
					welcomeServers["server" + results[i].serverID]['channel' + results[i].channelID] = {'jtoggle': results[i].welcomeMessage, 'ltoggle': results[i].leaveMessage};
				else {
					welcomeServers["server" + results[i].serverID] = {};
					welcomeServers["server" + results[i].serverID]['channel' + results[i].channelID] = {'jtoggle': results[i].welcomeMessage, 'ltoggle': results[i].leaveMessage};
				}
			}

			console.log(localDateString() + " | " + colors.green("[LOAD]") + "    Loaded all the Welcome Channels!");
			connection.release();
		});
	});
};

exports.reloadDynamicCommands = function() {
	dynamicCommands = {commands: {}, inline: {}};

	pool.getConnection(function(err, connection) {
		connection.query("SELECT * FROM commands", function(err, results) {
			for(var i in results) {
				if(results[i].typeCommand == "command") {
					if(dynamicCommands.commands.hasOwnProperty("server" + results[i].serverID)) {
						dynamicCommands.commands["server" + results[i].serverID][results[i].commandName] = {commandname: "", message: ""};
						dynamicCommands.commands["server" + results[i].serverID][results[i].commandName].commandname = results[i].commandName;
						dynamicCommands.commands["server" + results[i].serverID][results[i].commandName].message = results[i].commandMessage;
					}
					else {
						dynamicCommands.commands["server" + results[i].serverID] = {};
						dynamicCommands.commands["server" + results[i].serverID][results[i].commandName] = {commandname: "", message: ""};
						dynamicCommands.commands["server" + results[i].serverID][results[i].commandName].commandname = results[i].commandName;
						dynamicCommands.commands["server" + results[i].serverID][results[i].commandName].message = results[i].commandMessage;
					}
				}
				else if(results[i].typeCommand == "inline") {
					if(dynamicCommands.inline.hasOwnProperty("server" + results[i].serverID)) {
						dynamicCommands.inline["server" + results[i].serverID][results[i].commandName] = {inlinecommand: "", message: ""};
						dynamicCommands.inline["server" + results[i].serverID][results[i].commandName].inlinecommand = results[i].commandName;
						dynamicCommands.inline["server" + results[i].serverID][results[i].commandName].message = results[i].commandMessage;
					}
					else {
						dynamicCommands.inline["server" + results[i].serverID] = {};
						dynamicCommands.inline["server" + results[i].serverID][results[i].commandName] = {inlinecommand: "", message: ""};
						dynamicCommands.inline["server" + results[i].serverID][results[i].commandName].inlinecommand = results[i].commandName;
						dynamicCommands.inline["server" + results[i].serverID][results[i].commandName].message = results[i].commandMessage;
					}
				}
			}

			console.log(localDateString() + " | " + colors.green("[LOAD]") + "    Dynamic commands have been reloaded!");
			connection.release();
		});
	});
};

// ======================================
// Exports
// ======================================
exports.getMySQLConn = function() {
	return pool;
};

exports.getBlacklist = function() {
	return blackList;
};

exports.getHighlights = function() {
	return highlights;
};

exports.getDynamicCommands = function() {
	return dynamicCommands;
};

exports.getPermission = function() {
	return permission;
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
        game: {
			"name" : gamename
		}
    });
};

exports.getBotId = function() {
	return config.ids.botId;
};

exports.getAxSId = function() {
	return config.ids.AxSServer;
};

exports.getCommandPrefixArray = function() {
	return commandPrefix;
};

exports.getWelcomeChannels = function() {
	return welcomeServers;
};

exports.getCommandPrefix = function(serverID) {
	if(!serverID)
		return config.masterCommandPrefix;

	if(commandPrefix.hasOwnProperty("server" + serverID)) {
		return commandPrefix["server" + serverID];
	}
	else {
		return config.masterCommandPrefix;
	}
};

function getCommandPrefix(serverID) {
	if(!serverID)
		return config.masterCommandPrefix;

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
	var dateObject = new Date(),
		curDate = dateObject.toLocaleDateString(),
		curTime = dateObject.toLocaleTimeString();

	return curDate + " - " + curTime;
};

function localDateString () {
	var dateObject = new Date(),
		curDate = dateObject.toLocaleDateString(),
		curTime = dateObject.toLocaleTimeString();

	return curDate + " - " + curTime;
}

function logCommand(commandSplit, serverID, channelID, userID) {
	var commandSplit = commandSplit.split(" "),
		commandBlacklist = ['reload', 'eval', 'setgame'];

	if(commandBlacklist.indexOf(commandSplit[0]) !== -1)
		return;

	pool.getConnection(function(err, connection) {
		connection.query("SELECT * FROM commandstats WHERE serverID = ? AND channelID = ? AND userID = ? AND commandName = ?", [serverID, channelID, userID, commandSplit[0]], function(err, results) {
			if(Object.keys(results).length > 0) {
				connection.query("UPDATE commandstats SET commandCount = ? WHERE serverID = ? AND channelID = ? AND userID = ? AND commandName = ?", [(parseInt(results[0].commandCount) + 1), serverID, channelID, userID, commandSplit[0]], function(err) {});
			}
			else {
				connection.query("INSERT INTO commandstats VALUES(?, ?, ?, ?, ?)", [serverID, channelID, userID, commandSplit[0], 1], function(err) {});
			}

			connection.release();
		});
	});
}

// ======================================
// Start the bot
// ======================================
// These two need to be on top, usually are needed before everything else
loadConfig();
loadMySQL();

// load extra things below here
loadPermissions();
loadPlugins();
loadBlacklist();
loadHighlights();
loadCommandPrefix();
loadWelcomeChannels();
loadDynamicCommands();

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
        game: {
			"name": "Type !help for help"
		}
    });
});


discord.on("message", function(username, userID, channelID, message, event) {
	// Check if user sends a private message to the bot, if so ignore
	if (channelID in discord.directMessages)
		return;

	// Check if the user is the actual bot, if so ignore
	if(userID == config.ids.botId)
		return;

	var serverID = discord.channels[channelID].guild_id;

	// Whenever a user types a message insert/update it in the database
	pool.getConnection(function(err, connection) {
		connection.query("SELECT * FROM activeusers WHERE serverID = ? AND channelID = ? AND userID = ?", [serverID, channelID, userID], function(err, results) {
			if(Object.keys(results).length > 0) {
				connection.query("UPDATE activeusers SET messageCount = ? WHERE serverID = ? AND channelID = ? AND userID = ?", [(parseInt(results[0].messageCount) + 1), serverID, channelID, userID], function(err) {});
			}
			else {
				connection.query("INSERT INTO activeusers VALUES(?, ?, ?, ?)", [serverID, channelID, userID, 1], function(err) {});
			}

			connection.release();
		});
	});

	// help command works even when it is the config.masterCommandPrefix
	if (message.indexOf(config.masterCommandPrefix) === 0 && message.substr(config.masterCommandPrefix.length) == "help") {
		parseCommand(message.substr(config.masterCommandPrefix.length), {
            username: username,
            userID: userID,
            channelID: channelID,
            serverID: serverID,
			messageID: event.d.id,
			commandPrefix: getCommandPrefix(serverID)
        });

		logCommand(message.substr(config.masterCommandPrefix.length), serverID, channelID, userID);
		return;
	}

	if (message.indexOf(getCommandPrefix(serverID)) === 0) {
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
			logCommand(message.substr(config.masterCommandPrefix.length), serverID, channelID, userID);
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
			logCommand(message.substr(config.masterCommandPrefix.length), serverID, channelID, userID);
			return;
		}

		// Static commands from the various files
		parseCommand(message.substr(getCommandPrefix(serverID).length), {
            username: username,
            userID: userID,
            channelID: channelID,
            serverID: serverID,
			messageID: event.d.id,
			commandPrefix: getCommandPrefix(serverID)
        });

		logCommand(message.substr(config.masterCommandPrefix.length), serverID, channelID, userID);

		// Run the dynamic command
		if(dynamicCommands.commands.hasOwnProperty("server" + serverID)) {
			for(var cmd in dynamicCommands.commands["server" + serverID]) {
				var commandSplit = message.split(" ");

				if(commandSplit[0] == getCommandPrefix(serverID) + dynamicCommands.commands["server" + serverID][cmd].commandname) {
					discord.sendMessage({
						to: channelID,
						message: dynamicCommands.commands["server" + serverID][cmd].message
					});

					console.log(localDateString() + " | [COMMAND] " + username + " (" + userID + " @ " + discord.servers[serverID].name + ") ran [ '" + dynamicCommands.commands["server" + serverID][cmd].commandname + "' ]");
					return;
				}
			}
		}
    }
	else {
		// Run an inline command
		if(dynamicCommands.inline.hasOwnProperty("server" + serverID)) {
			for(var inl in dynamicCommands.inline["server" + serverID]) {
				if(message.toLowerCase().includes(dynamicCommands.inline["server" + serverID][inl].commandName)) {
					var beginPos = message.search(dynamicCommands.inline["server" + serverID][inl].commandName);
					var endPos = dynamicCommands.inline["server" + serverID][inl].commandName.length + beginPos - 1;

					if((message[beginPos - 1] == " " || message[beginPos - 1] === "" || message[beginPos - 1] === undefined) &&
						(message[endPos + 1] == " " || message[endPos + 1] === "" || message[endPos + 1] === undefined)) {}
						else
							return;

					discord.sendMessage({
						to: channelID,
						message: dynamicCommands.inline["server" + serverID][inl].commandMessage
					});

					console.log(localDateString() + " | [COMMAND] " + username + " (" + userID + " @ " + discord.servers[serverID].name + ") ran inline [ '" + dynamicCommands.inline["server" + serverID][inl].commandName + "' ]");
					return;
				}
			}
		}
		pool.getConnection(function(err, connection) {
			if (err) throw err;
			connection.query("SELECT * FROM commands WHERE typeCommand = \"inline\" AND serverID = ?", [serverID], function(err, results, fields) {
				for(var inl in results) {
					if(message.toLowerCase().includes(results[inl].commandName)) {
						var beginPos = message.search(results[inl].commandName);
						var endPos = results[inl].commandName.length + beginPos - 1;

						if((message[beginPos - 1] == " " || message[beginPos - 1] === "" || message[beginPos - 1] === undefined) &&
							(message[endPos + 1] == " " || message[endPos + 1] === "" || message[endPos + 1] === undefined)) {}
							else
								return;

						discord.sendMessage({
							to: channelID,
							message: results[inl].commandMessage
						});

						console.log(localDateString() + " | [COMMAND] " + username + " (" + userID + " @ " + discord.servers[serverID].name + ") ran inline [ '" + results[inl].commandName + "' ]");
						return;
					}
				}

				connection.release();
			});
		});
	}
});

discord.on("any", function(event) {
	// A user has left a server, send a message to the given channel if assigned to do so
	if(event.t == "GUILD_MEMBER_REMOVE") {
		if(welcomeServers.hasOwnProperty("server" + event.d.guild_id)) {
			for(var i in welcomeServers['server' + event.d.guild_id]) {
				if(welcomeServers['server' + event.d.guild_id][i].ltoggle == 1) {
					discord.sendMessage({
						to: i.replace('channel', ''),
						message: '**' + event.d.user.username + '** has left the server.'
					});
				}
			}
		}
	}

	// A user has joined a server, send a message to the given channel if assigned to do so
	if(event.t == "GUILD_MEMBER_ADD") {
		if(welcomeServers.hasOwnProperty("server" + event.d.guild_id)) {
			for(var i in welcomeServers['server' + event.d.guild_id]) {
				if(welcomeServers['server' + event.d.guild_id][i].jtoggle == 1) {
					discord.sendMessage({
						to: i.replace('channel', ''),
						message: '<@' + event.d.user.id + '> has joined the server.'
					});
				}
			}
		}
	}
});

// Disconnect handler, reconnect in 3 seconds
discord.on("disconnect", function(err, event) {
    console.log(localDateString() + colors.red(" | [DISCONNECT] Connection lost, Code: " + event + ", " + err + ". Reconnecting in 3 seconds. "));
    setTimeout(discord.connect, 3000);
});
