/*jshint esversion: 6, -W061, -W083 */

var fs = require("fs");
var jsonfile = require('jsonfile');
var amazejs = require("../startbot.js");

var discord = amazejs.getDiscord();
var botId = amazejs.getBotId();
var pool = amazejs.getMySQLConn();
var dirkRoleName = "Dirken";

var config = amazejs.getConfig();

exports.commands = {
	givemethepower: {
		permission: "default",
		description: "Assign the role \"" + dirkRoleName + "\" to yourself and use the command again to gain all permission.",
		usage: "givemethepower",
		examples: ["givemethepower"],
		func: function(argsm, context, reply) {
			var discord = amazejs.getDiscord();
			var dirkRoleId = 0;
			var givePower = 0;
			var alreadyHavePower = 0;

			for(var i in discord.servers[context.context.serverID].roles) {
				if(discord.servers[context.context.serverID].roles[i].name == dirkRoleName) {
					dirkRoleId = discord.servers[context.context.serverID].roles[i].id;
				}
			}

			for(var j in discord.servers[context.context.serverID].members[context.userID].roles) {
				if(discord.servers[context.context.serverID].members[context.userID].roles[j] == dirkRoleId) {
					if(discord.servers[context.context.serverID].members[context.userID].roles[dirkRoleId] === undefined) {
						givePower = 1;
						break;
					}
					else {
						givePower = 0;
					}
				}
			}

			if(givePower) {
				var allPermission = amazejs.getPermission();

				if(!allPermission.hasOwnProperty("server" + context.serverID)) {
					allPermission["server" + context.serverID] = [];

					if(!allPermission["server" + context.serverID].hasOwnProperty("user" + context.userID)) {
						allPermission["server" + context.serverID]["user" + context.userID] = [];
					}
				}
				else {
					if(!allPermission["server" + context.serverID].hasOwnProperty("user" + context.userID)) {
						allPermission["server" + context.serverID]["user" + context.userID] = [];
					}
				}

				for(var l in allPermission["server" + context.serverID]["user" + context.userID]) {
					if(allPermission["server" + context.serverID]["user" + context.userID][l] == "*") {
						alreadyHavePower = 1;
						break;
					}
				}

				if(!alreadyHavePower) {
					allPermission["server" + context.serverID]["user" + context.userID].push('*');

					pool.getConnection(function(err, connection){
						connection.query("INSERT INTO permission VALUES(?, ?, '*')", [context.serverID, context.userID], function(err){
							connection.release();
						});
					});

					discord.sendMessage({
					    to: context.userID,
					    message: "You now have all permissions enabled on the server `" + discord.servers[context.serverID].name + "`."
					});
				}
				else {
					discord.sendMessage({
					    to: context.userID,
					    message: "You already have all permissions on the server `" + discord.servers[context.serverID].name + "`. "
					});
				}
			}
			else {
				discord.sendMessage({
				    to: context.userID,
				    message: "To get permissions on this server you need to create a new role `" + dirkRoleName + "` (Don't forget the capital letters). \n" +
							"Once you've created this role give yourself the role, **not** the bot. \nWhen you have the role `" + dirkRoleName + "`, go ahead and use the command `" + context.commandPrefix + "givemethepower` in the designated server. \n" +
							"You will now get a confirmation message that you have all permissions enabled. Have fun!"
				});
			}
		}
	},
	manage: {
		permission: "admin.manage",
		description: "Manages commands, inline commands, highlights and more to come (?).",
		usage: "manage [command/inline/highlight] [add/edit/remove] [target] [text]",
		examples: ["manage command add ping pong", "manage inline edit ping pang" ,"manage highlight remove victory"],
		func: function(argsm, context, reply) {
			var commands = amazejs.getDynamicCommands();

			if(!argsm[1]) {
				amazejs.sendWrong(context.channelID, context.userID,
						"Syntax: `" + context.commandPrefix + "manage` `command/inline/highlight` `add/edit/remove` `target` `text`\n" +
						"`command/inline/highlight`: What do you want to manage\n" +
						"`add/edit/remove`: What you want to do with the `command/inline/highlight`\n" +
						"`target`: The \"trigger\" for the `text` to appear \n" +
						"`text`: The text that will show up when someone calls the `trigger`\n" +
						"Example: `" + context.commandPrefix + "manage command add ping pong!`");
				return;
			}

			var args = argsm[1].split(' ');

			if(!((args[0] == "command" || args[0] == "inline" || args[0] == "highlight") &&
				(args[1] == "add" || args[1] == "edit" || args[1] == "remove"))) {
					amazejs.sendWrong(context.channelID, context.userID,
							"Syntax: `" + context.commandPrefix + "manage` `command/inline/highlight` `add/edit/remove` `target` `text`\n" +
							"`command/inline/highlight`: What do you want to manage\n" +
							"`add/edit/remove`: What you want to do with the `command/inline/highlight`\n" +
							"`target`: The \"trigger\" for the `text` to appear \n" +
							"`text`: The text that will show up when someone calls the `trigger`\n" +
							"Example: `" + context.commandPrefix + "manage command add ping pong!`");
					return;
			}
			else {
				if(args[1] != "remove" && (!args[2] || !args[3])) {
					amazejs.sendWrong(context.channelID, context.userID,
							"Syntax: `" + context.commandPrefix + "manage` `command/inline/highlight` `add/edit/remove` `target` `text`\n" +
							"`command/inline/highlight`: What do you want to manage\n" +
							"`add/edit/remove`: What you want to do with the `command/inline/highlight`\n" +
							"`target`: The \"trigger\" for the `text` to appear \n" +
							"`text`: The text that will show up when someone calls the `trigger`\n" +
							"Example: `" + context.commandPrefix + "manage command add ping pong!`");
					return;
				}

				if(args[0] == "command") {
					// ==================
					// add a new command
					// ==================
					if(args[1] == "add") {
						let command = args[2],
							description = args.splice(3, Object.keys(args).length).join(' ');

						if(commands.commands.hasOwnProperty('server' + context.serverID)) {
							if(commands.commands['server' + context.serverID].hasOwnProperty(command)) {
								reply('<@' + context.userID + '>, the command `' + context.commandPrefix + command + '` already exists. Please try again with a different name or edit the command by using `' + context.commandPrefix + 'manage command edit ' + command + ' [description]`.');
								return;
							}
							else {
								commands.commands['server'+ context.serverID][command] = {commandname: command, message: description};

								pool.getConnection(function(err, connection) {
									connection.query("INSERT INTO commands values(?, ?, \"command\", ?)", [context.serverID, command, description]);
									connection.release();
								});

								reply('<@' + context.userID + '>, succesfully created the command `' + context.commandPrefix + command + '`.');
								return;
							}
						}
						else {
							commands.commands['server'+ context.serverID] = {};
							commands.commands['server'+ context.serverID][command] = {commandname: command, message: description};

							pool.getConnection(function(err, connection) {
								connection.query("INSERT INTO commands values(?, ?, \"command\", ?)", [context.serverID, command, description]);
								connection.release();
							});

							reply('<@' + context.userID + '>, succesfully created the command `' + context.commandPrefix + command + '`.');
							return;
						}
					}
					// ===================
					// edit a command
					// ===================
					else if(args[1] == "edit") {
						let command = args[2],
							description = args.splice(3, Object.keys(args).length).join(' ');

						if(commands.commands.hasOwnProperty('server' + context.serverID)) {
							if(commands.commands['server' + context.serverID].hasOwnProperty(command)) {
								commands.commands['server'+ context.serverID][command] = {commandname: command, message: description};

								pool.getConnection(function(err, connection) {
									connection.query("UPDATE commands SET commandMessage = ? WHERE serverID = ? AND commandName = ? AND typeCommand = \"command\"", [description, context.serverID, command]);
									connection.release();
								});

								reply('<@' + context.userID + '>, succesfully edited the command `' + context.commandPrefix + command + '`.');
								return;
							}
							else {
								reply('<@' + context.userID + '>, the command `' + context.commandPrefix + command + '` does not yet exist.');
								return;
							}
						}
						else {
							reply('<@' + context.userID + '>, the command `' + context.commandPrefix + command + '` does not yet exist.');
							return;
						}
					}
					// =====================
					// remove a command
					// =====================
					else if(args[1] == "remove") {
						let command = args[2];

						if(commands.commands.hasOwnProperty('server' + context.serverID)) {
							if(commands.commands['server' + context.serverID].hasOwnProperty(command)) {
								pool.getConnection(function(err, connection) {
									connection.query("DELETE FROM commands WHERE serverID = ? AND commandName = ? AND typeCommand = \"command\"", [context.serverID, command]);
									connection.release();
								});

								delete commands.commands['server' + context.serverID][command];

								reply('<@' + context.userID + '>, the command `' + context.commandPrefix + command + '` has been deleted.');
								return;
							}
							else {
								reply('<@' + context.userID + '>, the command `' + context.commandPrefix + command + '` does not yet exist.');
								return;
							}
						}
						else {
							reply('<@' + context.userID + '>, the command `' + context.commandPrefix + command + '` does not yet exist.');
							return;
						}
					}
				}
				else if(args[0] == "inline") {
					// =========================
					// add a new inline command
					// =========================
					if(args[1] == "add") {
						let command = args[2],
							description = args.splice(3, Object.keys(args).length).join(' ');

						if(commands.commands.hasOwnProperty('server' + context.serverID)) {
							if(commands.inline['server' + context.serverID].hasOwnProperty(command)) {
								reply('<@' + context.userID + '>, the inline-command `' + context.commandPrefix + command + '` already exists. Please try again with a different name or edit the command by using `' + context.commandPrefix + 'manage inline edit ' + command + ' [description]`.');
								return;
							}
							else {
								commands.inline['server'+ context.serverID][command] = {inlinecommand: command, message: description};

								pool.getConnection(function(err, connection) {
									connection.query("INSERT INTO commands values(?, ?, \"inline\", ?)", [context.serverID, command, description]);
									connection.release();
								});

								reply('<@' + context.userID + '>, succesfully created the inline-command `' + context.commandPrefix + command + '`.');
								return;
							}
						}
						else {
							commands.inline['server'+ context.serverID] = {};
							commands.inline['server'+ context.serverID][command] = {inlinecommand: command, message: description};

							pool.getConnection(function(err, connection) {
								connection.query("INSERT INTO commands values(?, ?, \"inline\", ?)", [context.serverID, command, description]);
								connection.release();
							});

							reply('<@' + context.userID + '>, succesfully created the inline-command `' + context.commandPrefix + command + '`.');
							return;
						}
					}
					// =========================
					// edit an inline command
					// =========================
					else if(args[1] == "edit") {
						let command = args[2],
							description = args.splice(3, Object.keys(args).length).join(' ');

							if(commands.inline.hasOwnProperty('server' + context.serverID)) {
								if(commands.inline['server' + context.serverID].hasOwnProperty(command)) {
									commands.inline['server'+ context.serverID][command] = {inlinecommand: command, message: description};

									pool.getConnection(function(err, connection) {
										connection.query("UPDATE commands SET commandMessage = ? WHERE serverID = ? AND commandName = ? AND typeCommand = \"inline\"", [description, context.serverID, command]);
										connection.release();
									});

									reply('<@' + context.userID + '>, succesfully edited the inline-command `' + context.commandPrefix + command + '`.');
									return;
								}
								else {
									reply('<@' + context.userID + '>, the inline-command `' + context.commandPrefix + command + '` does not yet exist.');
									return;
								}
							}
							else {
								reply('<@' + context.userID + '>, the inline-command `' + context.commandPrefix + command + '` does not yet exist.');
								return;
							}
					}
					// =========================
					// remove an inline command
					// =========================
					else if(args[1] == "remove") {
						let command = args[2];

						if(commands.inline.hasOwnProperty('server' + context.serverID)) {
							if(commands.inline['server' + context.serverID].hasOwnProperty(command)) {
								pool.getConnection(function(err, connection) {
									connection.query("DELETE FROM commands WHERE serverID = ? AND commandName = ? AND typeCommand = \"inline\"", [context.serverID, command]);
									connection.release();
								});

								delete commands.inline['server' + context.serverID][command];

								reply('<@' + context.userID + '>, the inline-command `' + context.commandPrefix + command + '` has been deleted.');
								return;
							}
							else {
								reply('<@' + context.userID + '>, the inline-command `' + context.commandPrefix + command + '` does not yet exist.');
								return;
							}
						}
						else {
							reply('<@' + context.userID + '>, the inline-command `' + context.commandPrefix + command + '` does not yet exist.');
							return;
						}
					}
				}
				else if(args[0] == "highlight") {
					amazejs.sendWrong(context.channelID, context.userID, 'Highlights are being worked on. Stay tuned!');
					return;
					// =========================
					// add a new highlight
					// =========================
					// if(args[1] == "add") {
					// 	let command = args[2],
					// 		description = args.splice(3, Object.keys(args).length).join(' ');
					// }
					// =========================
					// edit a highlight
					// =========================
					// else if(args[1] == "edit") {
					// 	let command = args[2],
					// 		description = args.splice(3, Object.keys(args).length).join(' ');
					// }
					// =========================
					// remove a highlight
					// =========================
					// else if(args[1] == "remove") {
					//
					// }
				}
			}
		}
	},
	changeprefix: {
		permission: "admin.changeprefix",
		description: "Changes the commandprefix to something different.",
		usage: "changeprefix [prefix]",
		examples: ["changeprefix !!", "changeprefix |", "changeprefix \\"],
		func: function(argsm, context, reply) {
			var commandPrefixArray = amazejs.getCommandPrefixArray();
			if(!argsm[1] || argsm[1].length > 4) {
				amazejs.sendWrong(context.channelID, context.userID,
						"Syntax: `" + context.commandPrefix + "changeprefix` `prefix`\n" +
						"`prefix`: the new prefix \n" +
						"Example: `" + context.commandPrefix + "changeprefix 1!`");
				return;
			}

			if(argsm[1] == "!!" || argsm[1] == "!!!" || argsm[1] == "!!!!") {
				amazejs.sendWrong(context.channelID, context.userID,
						"**Invalid prefix: `!!`, `!!!`, `!!!!` are unavailable.**\n" +
						"Syntax: `" + context.commandPrefix + "changeprefix` `prefix`\n" +
						"`prefix`: the new prefix \n" +
						"Example: `" + context.commandPrefix + "changeprefix 1!`");
				return;
			}

			if(commandPrefixArray.hasOwnProperty('server' + context.serverID)) {
				// update query
				pool.getConnection(function(err, connection){
					connection.query("UPDATE commandprefix SET commandPrefix = ? WHERE serverID = ?", [argsm[1], context.serverID], function(err){
						connection.release();
					});
				});

				commandPrefixArray['server' + context.serverID] = argsm[1];

				reply("<@" + context.userID + ">, succesfully changed the prefix for this server to `" + argsm[1] + "`.");
				return;
			}
			else {
				// insert query
				pool.getConnection(function(err, connection){
					connection.query("INSERT INTO commandprefix VALUES(?, ?)", [context.serverID, argsm[1]], function(err){
						connection.release();
					});
				});

				commandPrefixArray['server' + context.serverID] = argsm[1];

				reply("<@" + context.userID + ">, succesfully changed the prefix for this server to `" + argsm[1] + "`.");
				return;
			}

			reply("<@" + context.userID + ">, changed the command prefix to `" + argsm[1] + "`.");
		}
	},
	togglehighlight: {
		permission: "admin.highlight.toggle",
		description: "Sets the channel where the highlights will be sent to..",
		usage: "togglehighlight",
		examples: ["togglehighlight"],
		func: function(argsm, context, reply) {
			var highlight = amazejs.getHighlights();

			if(highlight.hasOwnProperty('server' + context.serverID)) {
				if(highlight['server' + context.serverID].channels.indexOf(context.channelID) != -1) {
					pool.getConnection(function(err, connection) {
						connection.query("DELETE FROM highlightlist WHERE serverID = ? AND channelID = ?", [context.serverID, context.channelID], function(err) {
							connection.release();
						});
					});

					highlight['server' + context.serverID].channels.splice(highlight['server' + context.serverID].channels.indexOf(context.channelID), 1);
					reply("<@" + context.userID + ">, highlights will no longer be sent to this channel.");
				}
				else {
					pool.getConnection(function(err, connection) {
						connection.query("INSERT INTO highlightlist VALUES(?, ?)", [context.serverID, context.channelID], function(err) {
							connection.release();
						});
					});

					highlight['server' + context.serverID].channels.push(context.channelID);
					reply("<@" + context.userID + ">, highlights will now be sent to this channel.");
				}
			}
			else {
				pool.getConnection(function(err, connection) {
					connection.query("INSERT INTO highlightlist VALUES(?, ?)", [context.serverID, context.channelID], function(err) {
						connection.release();
					});
				});

				highlights["server" + context.serverID] = {'channels': [], 'keywords': []};
				highlights["server" + context.serverID].channels.push(context.channelID);

				reply("<@" + context.userID + ">, highlights will now be sent to this channel.");
			}
		}
	},
	togglecommand: {
		permission: "admin.commands.toggle",
		description: "Toggle the ability to use commands a command serverwide.",
		usage: "togglecommand [command]",
		examples: ["togglecommand patat", "togglecommand friet", "togglecommand patatorfriet"],
		func: function(argsm, context, reply) {
			var blacklist = amazejs.getBlacklist();

			if(!argsm[1]) {
				amazejs.sendWrong(context.channelID, context.userID,
								"Syntax: `" + context.commandPrefix + "togglecommand` `commandname`\n" +
								"`commandname`: this will be the command that you will enable. \n" +
								"Example: `" + context.commandPrefix + "togglecommand patat`\n\n");
						return;
			}

			if(blacklist.hasOwnProperty("server" + context.serverID)) {
				if(blacklist['server' + context.serverID].disabledcommands.indexOf(argsm[1]) != -1) {
					pool.getConnection(function(err, connection) {
						connection.query("DELETE FROM blacklist WHERE serverID = ? AND disabledCommand = ?", [context.serverID, argsm[1]], function(err) {
							connection.release();
						});
					});

					blacklist['server' + context.serverID].disabledcommands.splice(blacklist['server' + context.serverID].disabledcommands.indexOf(argsm[1]), 1);
					reply("<@" + context.userID + ">, succesfully enabled the command `" + context.commandPrefix + argsm[1] + "` server-wide.");
					return;
				}
				else {
					pool.getConnection(function(err, connection) {
						connection.query("INSERT INTO blacklist (?, 'N/A', ?)", [context.serverID, argsm[1]], function(err) {
							connection.release();
						});
					});

					blacklist['server' + context.serverID].disabledcommands.push(argsm[1]);
					reply("<@" + context.userID + ">, succesfully disabled the command `" + context.commandPrefix + argsm[1] + "` server-wide.");
					return;
				}
			}
			else {
				pool.getConnection(function(err, connection) {
					connection.query("INSERT INTO blacklist VALUES(?, 'N/A', ?)", [context.serverID, argsm[1]], function(err) {
						connection.release();
					});
				});

				blacklist['server' + context.serverID] = {nocommandsinchannel: [], disabledcommands: []};
				blacklist['server' + context.serverID].disabledcommands.push(context.channelID);
				reply("<@" + context.userID + ">, succesfully disabled the command `" + context.commandPrefix + argsm[1] + "` server-wide.");
				return;
			}
		}
	},
	togglechannel: {
		permission: "admin.commands.toggle",
		description: "Toggle the ability to use commands in the current channel",
		usage: "togglechannel",
		examples: ["togglechannel"],
		func: function(argsm, context, reply) {
			var blacklist = amazejs.getBlacklist();

			if(blacklist.hasOwnProperty("server" + context.serverID)) {
				if(blacklist['server' + context.serverID].nocommandsinchannel.indexOf(context.channelID) != -1) {
					pool.getConnection(function(err, connection) {
						connection.query("DELETE FROM blacklist WHERE serverID = ? AND noCmdInChannel = ?", [context.serverID, context.channelID], function(err) {
							connection.release();
						});
					});

					blacklist['server' + context.serverID].nocommandsinchannel.splice(blacklist['server' + context.serverID].nocommandsinchannel.indexOf(context.channelID), 1);

					reply("<@" + context.userID + ">, succesfully enabled the usage of commands in this channel.");
					return;
				}
				else {
					pool.getConnection(function(err, connection) {
						connection.query("INSERT INTO blacklist VALUES(?, ?, \"N/A\")", [context.serverID, context.channelID], function(err) {
							connection.release();
						});
					});

					blacklist['server' + context.serverID].nocommandsinchannel.push(context.channelID);
					reply("<@" + context.userID + ">, succesfully disabled the usage of commands in this channel.");
					return;
				}
			}
			else {
				pool.getConnection(function(err, connection) {
					connection.query("INSERT INTO blacklist VALUES(?, ?, \"N/A\")", [context.serverID, context.channelID], function(err) {
						connection.release();
					});
				});

				blacklist['server' + context.serverID] = {nocommandsinchannel: [], disabledcommands: []};
				blacklist['server' + context.serverID].nocommandsinchannel.push(context.channelID);
				reply("<@" + context.userID + ">, succesfully disabled the usage of commands in this channel.");
				return;
			}
		}
	},
	wm: {
		permission: "admin.welcome",
		description: "The bot will send a message when a new user joins and/or leaves this server when this is enabled.",
		usage: "wm [jtoggle/ltoggle]",
		examples: ["wm jtoggle", "wm ltoggle"],
		func: function(argsm, context, reply) {
			if(argsm[1] == "jtoggle" || argsm[1] == "ltoggle") {
				var welcome = amazejs.getWelcomeChannels();
				var joinToggle = 0;

				if(argsm[1] == "jtoggle") {
					if(welcome.hasOwnProperty("server" + context.serverID)) {
						if(welcome['server' + context.serverID].hasOwnProperty('channel' + context.channelID)) {
							if(welcome['server' + context.serverID]['channel' + context.channelID].jtoggle === 0) {
								pool.getConnection(function(err, connection) {
									connection.query("UPDATE wmtoggle SET welcomeMessage = 1 WHERE serverID = ? AND channelID = ?", [context.serverID, context.channelID], function(err) {
										connection.release();
									});
								});

								amazejs.reloadWelcomeChannels();
								reply("<@" + context.userID + ">, a message will now be sent in this channel when a user joins this server.");
							}
							else {
								pool.getConnection(function(err, connection) {
									connection.query("UPDATE wmtoggle SET welcomeMessage = 0 WHERE serverID = ? AND channelID = ?", [context.serverID, context.channelID], function(err) {
										connection.release();
									});
								});

								amazejs.reloadWelcomeChannels();
								reply("<@" + context.userID + ">, there will no longer be a message for when someone joins the server in this channel. ");
							}
						}
						else {
							pool.getConnection(function(err, connection) {
								connection.query("INSERT INTO wmtoggle VALUES(?, ?, ?, ?)", [context.serverID, context.channelID, 1, 0], function(err) {
									connection.release();
								});
							});

							amazejs.reloadWelcomeChannels();
							reply("<@" + context.userID + ">, a message will now be sent in this channel when a user joins this server.");
							return;
						}
					}
					else {
						pool.getConnection(function(err, connection) {
							connection.query("INSERT INTO wmtoggle VALUES(?, ?, ?, ?)", [context.serverID, context.channelID, 1, 0], function(err) {
								if(err) console.log(err);
								connection.release();
							});
						});

						amazejs.reloadWelcomeChannels();
						reply("<@" + context.userID + ">, a message will now be sent in this channel when a user joins this server.");
						return;
					}
				}
				else if(argsm[1] == "ltoggle") {
					if(welcome.hasOwnProperty("server" + context.serverID)) {
						if(welcome['server' + context.serverID].hasOwnProperty('channel' + context.channelID)) {
							if(welcome['server' + context.serverID]['channel' + context.channelID].ltoggle === 0) {
								pool.getConnection(function(err, connection) {
									connection.query("UPDATE wmtoggle SET leaveMessage = 1 WHERE serverID = ? AND channelID = ?", [context.serverID, context.channelID], function(err) {
										connection.release();
									});
								});

								amazejs.reloadWelcomeChannels();
								reply("<@" + context.userID + ">, a message will now be sent in this channel when a user leaves this server.");
							}
							else {
								pool.getConnection(function(err, connection) {
									connection.query("UPDATE wmtoggle SET leaveMessage = 0 WHERE serverID = ? AND channelID = ?", [context.serverID, context.channelID], function(err) {
										connection.release();
									});
								});

								amazejs.reloadWelcomeChannels();
								reply("<@" + context.userID + ">, there will no longer be a message for when someone leaves the server in this channel. ");
							}
						}
						else {
							pool.getConnection(function(err, connection) {
								connection.query("INSERT INTO wmtoggle VALUES(?, ?, ?, ?)", [context.serverID, context.channelID, 0, 1], function(err) {
									connection.release();
								});
							});

							amazejs.reloadWelcomeChannels();
							reply("<@" + context.userID + ">, a message will now be sent in this channel when a user leaves this server.");
							return;
						}
					}
					else {
						pool.getConnection(function(err, connection) {
							connection.query("INSERT INTO wmtoggle VALUES(?, ?, ?, ?)", [context.serverID, context.channelID, 0, 1], function(err) {
								if(err) console.log(err);
								connection.release();
							});
						});

						amazejs.reloadWelcomeChannels();
						reply("<@" + context.userID + ">, a message will now be sent in this channel when a user leaves this server.");
						return;
					}
				}
			}
			else {
				amazejs.sendWrong(context.channelID, context.userID,
						"To toggle the welcome and/or leave message, use the following arguments: `jtoggle`, `ltoggle`. For more information type `" + context.commandPrefix + "wm`.");
				return;
			}
		}
	},
	perm: {
		permission: "admin.permission",
		description: "Manage the permissions, show the permissions for a command or user, add or remove permission to a user.",
		usage: "perm [showall/showuser/add/remove] [<@mention>] [<permission>]",
		examples: ["perm showall", "perm showuser", "perm add @Wesley admin.*", "perm remove @Wesley admin.*"],
		func: function(argsm, context, reply) {
			if(!argsm[1]) {
				amazejs.sendWrong(context.channelID, context.userID,
						"Syntax: `" + context.commandPrefix + "perm` `showall/showuser/add/remove` `<@mention>` `<permission>`\n" +
						"`showall/showuser/add/remove`: `showall` will show all permissions for all comands. \n`showuser` will show all permissions of the given `@mention`. \n`add` will add a `permission` to the `@mention`. \n`remove` will remove a `permission` from the `@mention`\n\n" +
						"`<@mention>`: This parameter is only required for `add` and `remove`. The user you want to `add` or `remove` the `permission` off.\n" +
						"`<permission>`: This parameter is only required for `add` and `remove`. The permission you want to `add` or `remove`.");
				return;
			}

			var args = argsm[1].split(' ');

			// =========================
			// Show all permissions
			// =========================
			if(args[0] == "showall") {
				var cmdsArr = amazejs.getCommands();
				var finalString = [];
				var spacing = 15;
				var finalStringCount = 0;

				for(var cmd in cmdsArr) {
					addspacing = spacing - cmd.length;
					spaces = "";

					for(i = 0; i <= addspacing; i++)
						spaces += " ";

					if(finalString[finalStringCount]) {
						if(finalString[finalStringCount].length >= 1000) {
							finalString[finalStringCount] += "Command: " + cmd + spaces + " | Permission: " + cmdsArr[cmd].permission + "\n";

							finalStringCount ++;
						}
						else {
							finalString[finalStringCount] += "Command: " + cmd + spaces + " | Permission: " + cmdsArr[cmd].permission + "\n";
						}
					}
					else {
						finalString[finalStringCount] = "";
						finalString[finalStringCount] += "Command: " + cmd + spaces + " | Permission: " + cmdsArr[cmd].permission + "\n";
					}
				}

				if(Object.keys(finalString).length > 1) {
					reply("**All commands and permissions (Potentional long list):**");

					for(let i = 0; i < Object.keys(finalString).length; i ++) {
						setTimeout(function(){
							reply("```" + finalString[0] + "```");
						}, (parseInt(i) + 1) * 1200);
					}
				}
				else {
					discord.sendMessage({
						to: context.channelID,
						message: "**All commands and permissions (Potentional long list):** \n```" + finalString[0] + "```"
					});
				}
			}
			// =================================
			// Show all permissions from X user
			// =================================
			else if(args[0] == "showuser") {
				if(!args[1]) {
					amazejs.sendWrong(context.channelID, context.userID,
							"Syntax: `" + context.commandPrefix + "perm` `showall/showuser/add/remove` `<@mention>` `<permission>`\n" +
							"`showall/showuser/add/remove`: `showall` will show all permissions for all comands. \n`showuser` will show all permissions of the given `@mention`. \n`add` will add a `permission` to the `@mention`. \n`remove` will remove a `permission` from the `@mention`\n\n" +
							"`<@mention>`: This parameter is only required for `add` and `remove`. The user you want to `add` or `remove` the `permission` off.\n" +
							"`<permission>`: This parameter is only required for `add` and `remove`. The permission you want to `add` or `remove`.");
					return;
				}

				let user = args[1].replace('<@', '').replace('>', '');

				pool.getConnection(function(err, connection) {
					connection.query("SELECT * FROM permission WHERE userID = ? ORDER BY serverID ASC", [user], function(err, results) {
						let allPerms = {},
							finalString = '',
							spacing = 15;

						for(let i in results) {
							if(!allPerms.hasOwnProperty(results[i].serverID))
								allPerms[results[i].serverID] = [];

							allPerms[results[i].serverID].push(results[i].permissionName);
						}

						for(let i in allPerms) {
							let spacingCount = spacing - discord.servers[i].name.length,
								addSpacing = '';
							for(let i = 0; i < spacingCount; i ++) {addSpacing += ' ';}

							finalString += "Server: " + discord.servers[i].name + addSpacing + " | Permission: " + allPerms[i].join(', ') + "\n";
						}

						// check for .length > 0

						reply("```" + finalString + "```");

						connection.release();
					});
				});
			}
			// ======================================
			// Add or remove permissions from X user
			// ======================================
			else if(args[0] == "add" || args[0] == "remove") {
				if(!args[1] || !args[2]) {
					amazejs.sendWrong(context.channelID, context.userID,
							"Syntax: `" + context.commandPrefix + "perm` `showall/showuser/add/remove` `<@mention>` `<permission>`\n" +
							"`showall/showuser/add/remove`: `showall` will show all permissions for all comands. \n`showuser` will show all permissions of the given `@mention`. \n`add` will add a `permission` to the `@mention`. \n`remove` will remove a `permission` from the `@mention`\n\n" +
							"`<@mention>`: This parameter is only required for `add` and `remove`. The user you want to `add` or `remove` the `permission` off.\n" +
							"`<permission>`: This parameter is only required for `add` and `remove`. The permission you want to `add` or `remove`.");
					return;
				}
				// ======================================
				// Add permissions to X user
				// ======================================
				let user = args[1].replace('<@', '').replace('>', ''),
					permissions = amazejs.getPermission();

				if(args[0] == "add") {
					amazejs.sendWrong(context.channelID, context.userID, 'add/remove are being worked on. Stay tuned!');
					// if(permissions.hasOwnProperty('server' + context.serverID)) {
					// 	if(permissions['server' + context.serverID].hasOwnProperty('user' + context.userID)) {
					// 		console.log('hi');
					// 	}
					// 	else {
					// 		pool.getConnection(function(err, connection) {
					// 			connection.query("INSERT INTO permission VALUES(?, ?, ?)", [context.serverID, user, args[2]]);
					// 			connection.release();
					// 		});
					//
					// 		permission['server' + context.serverID]['user' + context.userID] = [args[2]];
					//
					// 		reply("<@" + context.userID + ">, succesfully added the permission `" + args[2] + "` to <@" + user + ">.");
					// 		return;
					// 	}
					// }
					// else {
					// 	pool.getConnection(function(err, connection) {
					// 		connection.query("INSERT INTO permission VALUES(?, ?, ?)", [context.serverID, user, args[2]]);
					// 		connection.release();
					// 	});
					//
					// 	permission['server' + context.serverID] = {};
					// 	permission['server' + context.serverID]['user' + context.userID] = [args[2]];
					//
					// 	reply("<@" + context.userID + ">, succesfully added the permission `" + args[2] + "` to <@" + user + ">.");
					// 	return;
					// }
				}
				else if(args[0] == "remove") {
					amazejs.sendWrong(context.channelID, context.userID, 'add/remove are being worked on. Stay tuned!');
				}
			}
		}
	},
	remindme: {
		permission: "admin.remindme",
		description: "The bot will send you a reminder in X amount of time specified by you.",
		usage: "remindme [number] [second(s)/minute(s)/hour(s)] [message]",
		examples: ["remindme 1 hour Reminder message", "remindme 2 minutes Reminder message", "remindme 15 hours Reminder message" ],
		func: function(argsm, context, reply) {
			if(!argsm[1])
			{
				reply("<@" + context.userID + ">, Usage: " + context.commandPrefix + "remindme `time` `amount` `message` \n" +
					"Example: `" + context.commandPrefix + "remindme 5 seconds hi im a big message` \n" +
					"`time` has to be a number` \n" +
					"`amount` can only contain: `second`, `seconds`, `minute`, `minutes`, `hour`, `hours`, `day`, `days`");
				return;
			}

			var args = argsm[1];
			args = args.trim().split(" ");

			var amount, time, message, finalTime;

			amount = args[0];
			time = args[1];
			args.splice(0, 2);

			if(!isNumeric(amount))
			{
				reply("You have to enter a number for the first argument");
				return;
			}

			if(time == "second" || time == "seconds")
			{
				finalTime = parseInt(amount) * (1000);
			}
			else if(time == "minute" || time == "minutes")
			{
				finalTime = parseInt(amount) * (1000 * 60);
			}
			else if(time == "hour" || time == "hours")
			{
				finalTime = parseInt(amount) * (1000 * 60 * 60);
			}
			else if(time == "day" || time == "days")
			{
				finalTime = parseInt(amount) * (1000 * 60 * 60 * 24);
			}
			else
			{
				reply("<@" + context.userID + ">, Second parameter can only contain: `second`, `seconds`, `minute`, `minutes`, `hour`, `hours`, `day`, `days`");
				return;
			}

			reply("<@" + context.userID + ">, will remind you in " + amount + " " + time + ". ");

			(function(context, args, finaltime){
				var argjoin = args.join(' ');

				setTimeout(function(){
					reply("<@" + context.userID + ">, **Reminder: **\n" + argjoin);
				}, finalTime);
			}(context, args, finalTime));
		}
	},
	// Rework clear command with promise/await so it actually clears
	clear: {
		permission: "admin.clear",
		description: "Will clear the chat for an X amount of lines. ",
		usage: "clear [amount of lines]",
		examples: ["clear", "clear 50", "clear 100"],
        func: function(args, context, reply) {
			var discord = amazejs.getDiscord();
			var deleteLines = 50;

			if(args[1]) {
				if(isNumeric(args[1]) && args[1] <= 100) {
					deleteLines = args[1];
				}
				else {
					amazejs.sendWrong(context.channelID, context.userID,
							"The amount of lines you want to delete has to be numeric. ");
					return;
				}
			}

			discord.getMessages({
				channelID: context.channelID,
				limit: deleteLines
			}, function(error, messageArray) {
				var finalArray = [];
				for(var i in messageArray) {
					finalArray.push(messageArray[i].id);
				}

				discord.deleteMessages({
					channelID: context.channelID,
					messageIDs: finalArray
				}, function(error, response) {
					if(error) console.log(error);
					if(response) console.log(response);

					reply("Cleared " + messageArray.length + " messages.");
				});
			});
		}
	}
};

function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}
