/*jshint esversion: 6, -W041, -W083, -W004*/

var fs = require("fs");
var jsonfile = require('jsonfile');
var amazejs = require('../startbot.js');
var request = require("request");
var mysql = require("mysql");

var discord = amazejs.getDiscord();
var botId = amazejs.getBotId();
var AxSServer = amazejs.getAxSId();
var config = amazejs.getConfig();

var pool = amazejs.getMySQLConn();

var validGameModes = [	["o", "osu", "osu!"],
						["t", "taiko", "o!t", "osu!taiko"],
						["c", "ctb", "o!c", "osu!catch", "catch"],
						["m", "mania", "o!m", "osu!mania"]];

var defaultGameModeNames = ["osu!", "osu!Taiko", "osu!Catch", "osu!Mania"];

exports.commands = {
	help: {
		permission: "default",
		description: "This is the help command, all commands are listed in here.",
		usage: "help [command]",
		examples: ["help", "help patat"],
		func: function(argsm, context, reply) {
			var cmdsArr = amazejs.getCommands();
			var allCommands = amazejs.getDynamicCommands();
			var adminCmd = "", miscCmd = "", audioCmd = "", dynamicCmd = "", AxSCmd = "";

			// give help about a command
			if(argsm[1]) {
				if(!cmdsArr[argsm[1]]) {
					reply(":warning: | Unknown command `" + argsm[1] + "`, please try again.");
					return;
				}

				var examples = "";
				for(var i in cmdsArr[argsm[1]].examples) {
					examples += "`" + context.commandPrefix + cmdsArr[argsm[1]].examples[i] + "`\n";
				}

				reply("`" + context.commandPrefix + argsm[1] + "` `" + cmdsArr[argsm[1]].description + "`\n\n" +
						"Permission required: `" + cmdsArr[argsm[1]].permission + "`\n\n" +
						"Usage: `" + context.commandPrefix + cmdsArr[argsm[1]].usage + "` \n\n" +
						"Examples: \n" + examples);
				return;
			}

			for(var j in allCommands.commands["server" + context.serverID])
			{
				dynamicCmd += "`" + context.commandPrefix + allCommands.commands["server" + context.serverID][j].commandname + "` ";
			}

			for(var cmd in cmdsArr) {
				if(cmdsArr[cmd].plugin == "./plugins/admin.js")
					adminCmd += "`" + context.commandPrefix + cmd + "` ";

				if(cmdsArr[cmd].plugin == "./plugins/misc.js")
					miscCmd += "`" + context.commandPrefix + cmd + "` ";

				if(cmdsArr[cmd].plugin == "./plugins/audio.js")
					audioCmd += "`" + context.commandPrefix + cmd + "` ";

				if(cmdsArr[cmd].plugin == "./plugins/axs.js")
					AxSCmd += "`" + context.commandPrefix + cmd + "` ";
			}

			if(context.serverID == AxSServer) {
				reply(	"```Command list```" +
						"*Need help with any of the commands? Type* `" + context.commandPrefix + "help [commandname]`! \n\n" +
						"**AxS commands**: \n" +
						AxSCmd + "\n\n" +
						"**Misc commands**: \n" +
						miscCmd + "\n\n" +
						"**Audio commands**: \n" +
						audioCmd + "\n\n" +
						"**Server made commands**: \n" +
						dynamicCmd + "\n\n" +
						"**Admin commands**: \n" +
						adminCmd);
			}
			else {
				reply(	"```Command list```" +
						"*Need help with any of the commands? Type* `" + context.commandPrefix + "help [commandname]`! \n\n" +
						"**Misc commands**: \n" +
						miscCmd + "\n\n" +
						"**Audio commands**: \n" +
						audioCmd + "\n\n" +
						"**Server made commands**: \n" +
						dynamicCmd + "\n\n" +
						"**Admin commands**: \n" +
						adminCmd);
			}
		}
	},
	botstats: {
		description: "Shows the stats of the bot. ",
		usage: "botstats",
		examples: ["botstats"],
		permission: "default",
        func: function(args, context, reply) {
			var allUsers = 0, allCommands = 0, favCommand, favCommandUsed, favChannel, favServer;

			function format(formatS){
				function pad(s){
					return (s < 10 ? '0' : '') + s;
				}
				var hours = Math.floor(formatS / (60*60));
				var minutes = Math.floor(formatS % (60*60) / 60);
				var seconds = Math.floor(formatS % 60);

				return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
			}

			Object.keys(discord.servers).forEach(function(key) { allUsers += discord.servers[key].member_count; });
			allCommands += Object.keys(exports.commands).length;

			function getUsers () {
				return new Promise((resolve, reject) => {
					pool.getConnection(function(err, connection) {
						connection.query("SELECT count(*) AS commands FROM commands WHERE typeCommand = 'command'; SELECT commandName, commandCount FROM commandstats ORDER BY commandCount DESC LIMIT 1", function(err, results) {
							if (err)
								return reject(err);

							return resolve(results);
						});

						connection.release();
					});
				});
			}

			getUsers()
				.then(result => {
					allCommands += parseInt(result[0][0].commands);

					discord.sendMessage({
						to: context.channelID,
						embed: {
							author: {
								"name": "Dirk",
								"icon_url": discord.users[config.ids.botId].avatarURL
							},
							color: 0xE91E63,
							fields: [
								{
									inline: true,
									name: "**Dirk**",
									value: config.version
								},
								{
									inline: true,
									name: "**Node.js**",
									value: process.version
								},
								{
									inline: true,
									name: "**discord.io**",
									value: discord.internals.version
								},
								{
									inline: true,
									name: "**Owner**",
									value: "Wesley#2772"
								},
								{
									inline: true,
									name: "**Serving**",
									value: allUsers + ' users in ' + Object.keys(discord.servers).length + ((Object.keys(discord.servers).length > 1) ? ' servers' : ' server')
								},
								{
									inline: true,
									name: "**Uptime**",
									value: format(process.uptime())
								},
								{
									inline: true,
									name: "**Commands**",
									value: allCommands
								},
								{
									inline: true,
									name: "**Favourite command**",
									value: result[1][0].commandName
								},
								{
									inline: true,
									name: '**Amount used**',
									value: result[1][0].commandCount
								}
							]
						}
					});
				})
				.catch(err => {
					console.log(err);
				});
        }
	},
	uptime: {
		permission: "default",
		description: "Shows the uptime of the server and bot.",
		usage: "uptime",
		examples: ["uptime"],
		func: function(argsm, context, reply) {
			function format(formatS){
				function pad(s){
					return (s < 10 ? '0' : '') + s;
				}

				var days 		= Math.floor(formatS / (24 * (60*60)));
				var hours 		= Math.floor((formatS / (60*60)) - (days * 24));
				var minutes 	= Math.floor(formatS % (60 * 60) / 60);
				var seconds 	= Math.floor(formatS % 60);

				return days + ' day(s), ' + pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
			}

			reply('Server uptime: `' + format(require('os').uptime()) + '`, Bot uptime: `' + format(process.uptime()) + '`');
		}
	},
	info: {
		permission: "default",
		description: "This will return some general information about the bot.",
		usage: "info",
		examples: ["info"],
		func: function(argsm, context, reply) {
			discord.sendMessage({
				to: context.channelID,
				embed: {
					author: {
						"name": "Dirk",
						"icon_url": discord.users[config.ids.botId].avatarURL
					},
					color: 0xE91E63,
					description: 	'Dirk is a multi-purpose Discord Bot. Right now it is mostly administration but more functionality will come! \n\n' +
									'The bot is still under development and thus it can contain bugs, if you find any bugs make sure to use the command "' + context.commandPrefix + 'feedback <message>". \n\n' +
									'If you need any help related to the bot (or just want to hang out), feel free to join my Discord server by typing "' + context.commandPrefix + 'invite". '
				}
			});
		}
	},
	feedback: {
		permission: "default",
		description: "Send feedback to the developer of the Discord bot. This can be either for a bug, feature request, etc.",
		usage: "feedback [message]",
		examples: ["feedback the feedback command isn't working properly; doesn't give me any feedback!"],
		func: function(argsm, context, reply) {
			if(!argsm[1]) {
				amazejs.sendWrong(context.channelID, context.userID,
						"Syntax: `" + context.commandPrefix + "feedback` `message`\n" +
						"`message`: The message you want to send to the Developer about a bug.");
				return;
			}

			discord.sendMessage({
				to: '307190533216796672',
				message: '<@' + context.userID + '> (`' + context.userID + '`) has sent feedback: `' + argsm[1] + '`'
			});

			discord.sendMessage({
				to: context.channelID,
				message: '<@' + context.userID + '>, Thank you. Your feedback has been received! '
			});
		}
	},
	invite: {
		permission: "default",
		description: "This will send an invite link to the server and an URL to add the bot to your own server(s).",
		usage: "invite",
		examples: ["invite"],
		func: function(argsm, context, reply) {
			discord.sendMessage({
				to: context.channelID,
				message: 'Invite link to the server: https://discord.gg/v3zNMFH \nAdd Dirk to your own server(s): <https://discordapp.com/oauth2/authorize?client_id=306194831217262592&scope=bot>'
			});
		}
	},
	time: {
		permission: "default",
		description: "This will return the current time in UTC+0",
		usage: "time",
		examples: ["time"],
		func: function(argsm, context, reply) {
			var currentTime = new Date(),
				curDay = currentTime.getUTCDate(),
				curMonth = currentTime.getUTCMonth() + 1,
				curYear = currentTime.getUTCFullYear(),
				curSeconds = (currentTime.getUTCSeconds() < 10) ? '0' + currentTime.getUTCSeconds() : currentTime.getUTCSeconds(),
				curMinutes = (currentTime.getUTCMinutes() < 10) ? '0' + currentTime.getUTCMinutes() : currentTime.getUTCMinutes(),
				curHours = currentTime.getUTCHours();

			reply(`Current date and time in UTC+0: ${curDay}/${curMonth}/${curYear} ${curHours}:${curMinutes}:${curSeconds}.`);
		}
	},
	patat: {
		permission: "default",
		description: "With this command you will vote for Patat.",
		usage: "patat",
		examples: ["patat"],
		func: function(argsm, context, reply) {
			pool.getConnection(function(err, connection) {
				if (err) throw err;
				connection.query("SELECT userID FROM patatorfriet WHERE userID = ?", [context.userID], function(err, results, fields) {
					if(results) {
						if(Object.keys(results).length <= 0) {
							connection.query('INSERT INTO patatorfriet VALUES(?, ?, ?, 1, 0)', [context.userID, context.serverID, context.username]);
						}
					}

					connection.release();
				});
			});

			reply("Patat ligt meer voor de hand dan friet. Er wonen immers meer mensen in de regio's waar in Nederland 'patat' gezegd wordt dan de Nederlandse gebieden waar men 'friet' zegt. in de taal wordt patat bovendien niet alleen langer dan friet, maar ook met meer varianten gebruikt. \n**IT IS PATAT**");
		}
	},
	friet: {
		permission: "default",
		description: "With this command you will vote for Friet.",
		usage: "friet",
		examples: ["friet"],
		func: function(argsm, context, reply) {
			pool.getConnection(function(err, connection) {
				if (err) throw err;
				connection.query("SELECT userID FROM patatorfriet WHERE userID = ?", [context.userID], function(err, results, fields) {
					if(results) {
						if(Object.keys(results).length <= 0) {
							connection.query('INSERT INTO patatorfriet VALUES(?, ?, ?, 0, 1)', [context.userID, context.serverID, context.username]);
						}
					}
					connection.release();
				});
			});

			reply("Friet wordt onder de rivier gebruikt. Deze benaming is meer logisch voor het benoemen van gefrituurde aardappelen sinds het staat voor \"gefrituurd\". Daarnaast is dit ook in de Engelse taal de gewoonlijke benoeming (fries) en wordt dit ook gebruikt in dat stinkland Frankrijk zelf (frites). \n**IT IS FRIET**");
		}
	},
	patatorfriet: {
		permission: "default",
		description: "This will show the score of the showdown between Patat and Friet.",
		usage: "patatorfriet",
		examples: ["patatorfriet"],
		func: function(argsm, context, reply) {
			var finalResult = "n/a";
			var patatCount = 0;
			var frietCount = 0;

			pool.getConnection(function(err, connection) {
				connection.query("SELECT sum(patat) AS patatCount, sum(friet) AS frietCount FROM patatorfriet;", function(err, results, fields) {
					patatCount = results[0].patatCount;
					frietCount = results[0].frietCount;

					if(patatCount > frietCount)
						finalResult = "Patat is koning";
					else if(patatCount < frietCount)
						finalResult = "Friet is koning";
					else
						finalResult = "Het is gelijkspel kut";

					reply("The current score is: \n" +
							"**Patat**: " + patatCount + "\n" +
							"**Friet**: " + frietCount + "\n\n**" + finalResult + "**");

					connection.release();
				});
			});
		}
	},
	poflog: {
		permission: "admin",
		description: "Logs all votes for patat or friet",
		usage: "poflog",
		examples: ["poflog"],
		func: function(argsm, context, reply) {
			var finalString = "";

			pool.getConnection(function(err, connection) {
				if (err) throw err;
				connection.query("SELECT * FROM patatorfriet", function(err, results, fields) {
					var foundUser = 0;

					for(var i in results) {
						if(results[i].patat == 1)
							patatOrFriet = "patat";
						else
							patatOrFriet = "friet";

						finalString += results[i].userName + " voted for " + patatOrFriet + "\n";
					}

					reply(finalString);

					connection.release();
				});
			});
		}
	},
	roll: {
		permission: "default",
		description: "Rolls a random number",
		usage: "roll [number/text] (if you want to roll a higher number than 100 or add some text to the roll)",
		examples: ["roll", "roll 150", "roll i want a 100 roll!!","roll 1000 i want a 200 roll!!"],
		func: function(argsm, context, reply) {
			var randomNumber = 0;

			if(argsm[1] == null)
			{
				randomNumber = Math.floor((Math.random() * 100) + 1);
			}
			else
			{
				if(isNumeric(argsm[1]))
					randomNumber = Math.floor((Math.random() * argsm[1]) + 1);
				else
					randomNumber = Math.floor((Math.random() * 100) + 1);
			}

			pool.getConnection(function(err, connection) {
				connection.query("SELECT * FROM rollstats", function(err, results) {
					if(Object.keys(results) == 0) {
						connection.query("INSERT INTO rollstats VALUES(?, 1)", [randomNumber]);
					}

					var insertNew = 0;
					for(var i in results) {
						if(results[i].rollAmount == randomNumber) {
							var newAmount = parseInt(results[i].timesRolled) + 1;

							connection.query("UPDATE rollstats SET timesRolled = ? WHERE rollAmount = ?", [newAmount, randomNumber]);
							break;
						}

						insertNew = 1;
					}

					if(insertNew == 1) {
						connection.query("INSERT INTO rollstats VALUES(?, 1)", [randomNumber]);
					}

					connection.release();
				});
			});

			reply("<@" + context.userID + "> rolled " + randomNumber);
		}
	},
	rollstats: {
		permission: "default",
		description: "Will display the top 10 rolls that have been rolled the most.",
		usage: "rollstats",
		examples: ["rollstats"],
		func: function(argsm, context, reply) {
			pool.getConnection(function(err, connection) {
				connection.query("SELECT * FROM rollstats ORDER BY timesRolled DESC LIMIT 10", function(err, results) {
					var finalString = "";

					for(var j in results) {
						if(results[j].timesRolled == 1)
							finalString += "`" + results[j].rollAmount + "` has been rolled `" + results[j].timesRolled + "` time. \n";
						else
							finalString += "`" + results[j].rollAmount + "` has been rolled `" + results[j].timesRolled + "` times. \n";
					}

					reply("**The top 10 rolls are:** \n" + finalString);
					connection.release();
				});
			});
		}
	},
	setosu: {
		permission: "default",
		description: "Will set/change your osu! username and mode.",
		usage: "setusername [mode] [username]",
		examples: ["setosu osu Wesley", "setosu ctb - Yuri -", "setosu taiko Sartan", "setosu mania Enchant"],
		func: function(argsm, context, reply) {
			var osuAlias 	= validGameModes[0].join(", ");
			var taikoAlias 	= validGameModes[1].join(", ");
			var ctbAlias 	= validGameModes[2].join(", ");
			var maniaAlias 	= validGameModes[3].join(", ");

			var validGameMode = false;
			var gameModeCode = 0;

			if(!argsm[1])
			{
				amazejs.sendWrong(context.channelID, context.userID,
						"Syntax: `" + context.commandPrefix + "setosu` `mode` `username`\n" +
						"`mode`: enter any of the aliases (Shown below)\n" +
						"`username`: Your osu! username\n" +
						"Example: `" + context.commandPrefix + "setosu c Wesley`\n\n" +
						"All aliases: " +
						"```osu!     : " + osuAlias + "\n" +
						"osu!Taiko: " + taikoAlias + "\n" +
						"osu!Catch: " + ctbAlias + "\n" +
						"osu!Mania: " + maniaAlias + "```");
				return;
			}

			var commandParams = argsm[1].split(" ");

			if(Object.keys(commandParams).length != 2) {
				amazejs.sendWrong(context.channelID, context.userID,
						"You forgot to fill in an username!\n\n" +
						"Syntax: `" + context.commandPrefix + "setosu` `mode` `username`\n" +
						"`mode`: enter any of the aliases (Shown below)\n" +
						"`username`: Your osu! username\n" +
						"Example: `" + context.commandPrefix + "setosu c Wesley`\n\n" +
						"All aliases: " +
						"```osu!     : " + osuAlias + "\n" +
						"osu!Taiko: " + taikoAlias + "\n" +
						"osu!Catch: " + ctbAlias + "\n" +
						"osu!Mania: " + maniaAlias + "```");
				return;
			}

			for(var mode in validGameModes) {
				for(var alias in validGameModes[mode]) {
					if(validGameModes[mode][alias] == commandParams[0]) {
						validGameMode = true;
						gameModeCode = mode;
						break;
					}
				}
			}

			if(!validGameMode) {
				amazejs.sendWrong(context.channelID, context.userID,
					"`" + commandParams[0] + "` is not a valid gamemode. Please use one of the following aliases: \n" +
					"```osu!     : " + osuAlias + "\n" +
					"osu!Taiko: " + taikoAlias + "\n" +
					"osu!Catch: " + ctbAlias + "\n" +
					"osu!Mania: " + maniaAlias + "```");
				return;
			}

			getUserJSON(commandParams[1], gameModeCode, function(Json, mode){
				if(Object.keys(Json).length > 0)
				{
					pool.getConnection(function(err, connection) {
						connection.query('SELECT userID FROM osunames WHERE userID = ?', [context.userID], function(err, results, fields) {
							if(Object.keys(results).length > 0) {
								connection.query('UPDATE osuNames SET userName = ?, gameMode = ? WHERE userID = ?', [commandParams[1], gameModeCode, context.userID], function(err, results, fields) {
									if(err) {
										console.log(err);
										connection.release();
										return;
									}
									connection.release();
								});
							}
							else {
								connection.query('INSERT INTO osunames VALUES(?, ?, ?)', [context.userID, commandParams[1], gameModeCode], function(err, results, fields) {
									if(err) {
										console.log(err);
										connection.release();
										return;
									}
									connection.release();
								});
							}
						});
					});

					reply("<@" + context.userID + ">, you set your osu! gamemode to `" + defaultGameModeNames[gameModeCode] + "` and username to `" + commandParams[1] + "`");
					return;
				}
				else
				{
					amazejs.sendWrong(context.channelID, context.userID,
						"This user was not found, this means that the account is either banned or doesn't exist. ");
					return;
				}
			});
		}
	},
	stats: {
		permission: "default",
		description: "This will show your osu! stats",
		usage: "stats [alias] [username]",
		examples: ["stats", "stats osu", "stats ctb Wesley"],
		func: function(argsm, context, reply) {
			if(!argsm[1]) {
				pool.getConnection(function(err, connection) {
					connection.query('SELECT userID, userName, gameMode FROM osunames WHERE userID = ?', [context.userID], function(err, results, fields) {
						if(err) {
							console.log(err);
							connection.release();
							return;
						}

						if(Object.keys(results).length > 0) {
							requestPromise("https://osu.ppy.sh/api/get_user?k=" + config.apiKeys.osu + "&type=string&m=" + results[0].gameMode + "&u=" + results[0].userName).then(user => {
								discord.sendMessage({
									to: context.channelID,
									embed: {
										author: {
											name: "Profile of " + user[0].username,
											icon_url: "https://s.ppy.sh/favicon.ico",
											url: "https://osu.ppy.sh/u/" + user[0].user_id
										},
										timestamp: new Date(),
										thumbnail: {
											url: "https://a.ppy.sh/" + user[0].user_id + "_.jpg"
										},
										description: "```" +
														"\n# Username        : " + user[0].username +
														"\n# Mode            : " + defaultGameModeNames[results[0].gameMode] +
														"\n# Level           : " + parseFloat(user[0].level).toFixed(2) +
														"\n# Playcount       : " + user[0].playcount +
														"\n# Accuracy        : " + parseFloat(user[0].accuracy).toFixed(2) +
														"\n# Pp              : " + addDot(user[0].pp_raw, ' ') +
														"\n# Rank            : " + addDot(user[0].pp_rank, ' ') +
														"\n# Country Rank    : " + user[0].pp_country_rank +
													"```",
										color: 0xFF66AA
									}
								});
							});
							return;
						}
						else {
							amazejs.sendWrong(context.channelID, context.userID,
								"You haven't set your osu! gamemode and username yet. \nUse `" + context.commandPrefix + "setosu` `mode` `username` to set your gamemode and username or use `" + context.commandPrefix + "stats` `mode` `username` to look up anyone.");
							return;
						}

						connection.release();
					});
				});
			}
			else {
				var commandParams = argsm[1].split(" ");

				if(Object.keys(commandParams).length >= 2) {
					let validGameMode = false,
						gameModeCode = 0;

					for(let mode in validGameModes) {
						for(let alias in validGameModes[mode]) {
							if(validGameModes[mode][alias] == commandParams[1]) {
								validGameMode = true;
								gameModeCode = mode;
								break;
							}
						}
					}

					if(!validGameMode) {
						let osuAlias 	= validGameModes[0].join(", ");
						let taikoAlias 	= validGameModes[1].join(", ");
						let ctbAlias 	= validGameModes[2].join(", ");
						let maniaAlias 	= validGameModes[3].join(", ");

						discord.sendMessage({
							to: context.channelID,
							embed: {
								author: {
									name: "Something went wrong!"
								},
								description: "`" + commandParams[1] + "` is not a valid gamemode. Please use one of the following aliases: \n" +
												"```osu!      : " + osuAlias + "\n" +
												"osu!Taiko : " + taikoAlias + "\n" +
												"osu!Catch : " + ctbAlias + "\n" +
												"osu!Mania : " + maniaAlias + "```",
								color: 0xFF66AA
							}
						});
						return;
					}

					requestPromise("https://osu.ppy.sh/api/get_user?k=" + config.apiKeys.osu + "&type=string&u=" + commandParams[0] + "&m=" + gameModeCode).then(user => {
						discord.sendMessage({
							to: context.channelID,
							embed: {
								author: {
									name: "Profile of " + user[0].username,
									icon_url: "https://s.ppy.sh/favicon.ico",
									url: "https://osu.ppy.sh/u/" + user[0].user_id
								},
								timestamp: new Date(),
								thumbnail: {
									url: "https://a.ppy.sh/" + user[0].user_id + "_.jpg"
								},
								description: "```" +
												"\n# Username        : " + user[0].username +
												"\n# Mode            : " + defaultGameModeNames[gameModeCode] +
												"\n# Level           : " + parseFloat(user[0].level).toFixed(2) +
												"\n# Playcount       : " + user[0].playcount +
												"\n# Accuracy        : " + parseFloat(user[0].accuracy).toFixed(2) +
												"\n# Pp              : " + addDot(user[0].pp_raw, ' ') +
												"\n# Rank            : " + addDot(user[0].pp_rank, ' ') +
												"\n# Country Rank    : " + user[0].pp_country_rank +
											"```",
								color: 0xFF66AA
							}
						});
					}).catch(e => {
						discord.sendMessage({
							to: context.channelID,
							embed: {
								author: {
									name: "Something went wrong!"
								},
								description: "This user was not found, this means that the account is either banned or doesn't exist.",
								color: 0xFF66AA
							}
						});
					});
				}
				else {
					requestPromise("https://osu.ppy.sh/api/get_user?k=" + config.apiKeys.osu + "&type=string&u=" + commandParams[0]).then(user => {
						discord.sendMessage({
							to: context.channelID,
							embed: {
								author: {
									name: "Profile of " + user[0].username,
									icon_url: "https://s.ppy.sh/favicon.ico",
									url: "https://osu.ppy.sh/u/" + user[0].user_id
								},
								timestamp: new Date(),
								thumbnail: {
									url: "https://a.ppy.sh/" + user[0].user_id + "_.jpg"
								},
								description: "```" +
												"\n# Username        : " + user[0].username +
												"\n# Mode            : " + defaultGameModeNames[0] +
												"\n# Level           : " + parseFloat(user[0].level).toFixed(2) +
												"\n# Playcount       : " + user[0].playcount +
												"\n# Accuracy        : " + parseFloat(user[0].accuracy).toFixed(2) +
												"\n# Pp              : " + addDot(user[0].pp_raw, ' ') +
												"\n# Rank            : " + addDot(user[0].pp_rank, ' ') +
												"\n# Country Rank    : " + user[0].pp_country_rank +
											"```",
								color: 0xFF66AA
							}
						});
					}).catch(e => {
						discord.sendMessage({
							to: context.channelID,
							embed: {
								author: {
									name: "Something went wrong!"
								},
								description: "This user was not found, this means that the account is either banned or doesn't exist.",
								color: 0xFF66AA
							}
						});
					});
				}
			}
		}
	}
};

function requestPromise(url) {
    return new Promise(function (resolve, reject) {
        request(url, function(err, res, body) {
			if(!err && res.statusCode === 200) {
				resolve(JSON.parse(body));
			}
			else {
				err = new Error("Unexpected status code: " + res.statusCode);
                err.res = res;
                return reject(err);
			}
        });
    });
}

function getUserJSON(username, mode, callback) {
	request({
        url: "https://osu.ppy.sh/api/get_user?k=" + config.apiKeys.osu + "&type=string&m=" + mode + "&u=" + username
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(JSON.parse(body), mode);
        } else {
            console.error("Failed!");
            callback([]);
        }
    });
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function addDot(nStr, splitter) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + splitter + '$2');
    }
    return x1 + x2;
}
