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
	dynamicCommands = {commands: {}, inline: {}};

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
		args[0] != getCommandPrefix(serverID) + "enablechannel" && args[0] != getCommandPrefix(serverID) + "disablechannel" /*&&
		userID != config.ids.masterUser*/) {
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
            console.log(localDateString() + " | " + colors.red("[ERROR]") + "   Error running command: ", ex);
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
        bigNumberStrings 	: true
	});

	pool.getConnection(function(err, connection) {
		if(err)
			throw localDateString() + " | [ERROR]   Cannot connect to the MySQL database: " + err;
		else
			console.log(localDateString() + " | " + colors.green("[CONNECT]") + " Succesfully connected to the MySQL database. ");
	});
}

function loadConfig() {
    config = JSON.parse(fs.readFileSync("configfiles/config.json"));
    console.log(localDateString() + " | " + colors.green("[LOAD]") + "    Config file has been loaded!");
}

function loadWelcomeChannels() {
	pool.getConnection(function(err, connection) {
		connection.query("SELECT * FROM welcomeInChannel", function(err, results) {
			for(var i in results) {
				if(welcomeServers.hasOwnProperty("server" + results[i].serverID))
					welcomeServers["server" + results[i].serverID].channelID = results[i].channelID;
				else {
					welcomeServers["server" + results[i].serverID] = {};
					welcomeServers["server" + results[i].serverID].channelID = results[i].channelID;
				}
			}

			console.log(localDateString() + " | " + colors.green("[LOAD]") + "    Loaded all the Welcome Channels!");
			connection.release();
		});
	});
}

function loadCommandPrefix() {
	pool.getConnection(function(err, connection) {
		connection.query("SELECT * FROM commandPrefix", function(err, results) {
			for(var i in results) {
				commandPrefix["server" + results[i].serverID] = results[i].commandPrefix;
			}

			console.log(localDateString() + " | " + colors.green("[LOAD]") + "    Command Prefixes have been loaded!");
			connection.release();
		});
	});
}

function loadPermissions() {
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

			console.log(localDateString() + " | " + colors.green("[LOAD]") + "    Permissions have been loaded!");
			connection.release();
		});
	});
}

function loadBlacklist() {
	pool.getConnection(function(err, connection) {
		connection.query("SELECT * FROM blacklist", function(err, results, fields) {
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
}

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

exports.reloadBlacklist = function() {
	blackList = {};

	pool.getConnection(function(err, connection) {
		connection.query("SELECT * FROM blacklist", function(err, results, fields) {
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

			console.log(localDateString() + " | " + colors.green("[LOAD]") + "    The blacklist has been reloaded!");
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
		connection.query("SELECT * FROM welcomeInChannel", function(err, results) {
			for(var i in results) {
				if(welcomeServers.hasOwnProperty("server" + results[i].serverID))
					welcomeServers["server" + results[i].serverID].channelID = results[i].channelID;
				else {
					welcomeServers["server" + results[i].serverID] = {};
					welcomeServers["server" + results[i].serverID].channelID = results[i].channelID;
				}
			}

			console.log(localDateString() + " | " + colors.green("[LOAD]") + "    Reloaded all the Welcome Channels!");
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

// returns a commandPrefix that has been set (if not > default prefix)
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
loadMySQL();

// load extra things below here
loadPermissions();
loadPlugins();
loadBlacklist();
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
		parseCommand(message.substr(getCommandPrefix(serverID).length), {
            username: username,
            userID: userID,
            channelID: channelID,
            serverID: serverID
        });

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
	// User has joined a server
	if(event.t == "GUILD_MEMBER_ADD") {
		for(var i in event.d) {
			if(event.d[i].hasOwnProperty("id")) {
				if(welcomeServers.hasOwnProperty("server" + event.d.guild_id)) {
					discord.sendMessage({
						to: welcomeServers["server" + event.d.guild_id].channelID,
						message: "Welcome <@" + event.d[i].id + ">!"
					});
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
