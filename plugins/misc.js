/*jshint -W041, -W083, -W004*/

var fs = require("fs");
var jsonfile = require('jsonfile');
var amazejs = require('../startbot.js');
var request = require("request");
var mysql = require("mysql");

var discord = amazejs.getDiscord();
var botId = amazejs.getBotId();
var AxSServer = amazejs.getAxSId();
var config = amazejs.getConfig();

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
			var allCommands = JSON.parse(fs.readFileSync("configfiles/commands.json"));
			var serverID = discord.channels[context.channelID].guild_id;
			var adminCmd = "", miscCmd = "", audioCmd = "", dynamicCmd = "", AxSCmd = "";
			var commandPrefix = amazejs.commandPrefix(serverID);

			// give help about a command
			if(argsm[1]) {
				if(!cmdsArr[argsm[1]]) {
					reply(":warning: | Unknown command `" + argsm[1] + "`, please try again.");
					return;
				}

				var examples = "";
				for(var i in cmdsArr[argsm[1]].examples) {
					examples += "`" + commandPrefix + cmdsArr[argsm[1]].examples[i] + "`\n";
				}

				reply("`" + commandPrefix + argsm[1] + "` `" + cmdsArr[argsm[1]].description + "`\n\n" +
						"Permission required: `" + cmdsArr[argsm[1]].permission + "`\n\n" +
						"Usage: `" + commandPrefix + cmdsArr[argsm[1]].usage + "` \n\n" +
						"Examples: \n" + examples);
				return;
			}

			for(var j in allCommands.commands["server" + serverID])
			{
				dynamicCmd += "`" + commandPrefix + allCommands.commands["server" + serverID][j].commandname + "` ";
			}

			for(var cmd in cmdsArr) {
				if(cmdsArr[cmd].plugin == "./plugins/admin.js")
					adminCmd += "`" + commandPrefix + cmd + "` ";

				if(cmdsArr[cmd].plugin == "./plugins/misc.js")
					miscCmd += "`" + commandPrefix + cmd + "` ";

				if(cmdsArr[cmd].plugin == "./plugins/audio.js")
					audioCmd += "`" + commandPrefix + cmd + "` ";

				if(cmdsArr[cmd].plugin == "./plugins/axs.js")
					AxSCmd += "`" + commandPrefix + cmd + "` ";
			}

			if(serverID == AxSServer) {
				reply(	"```Command list```" +
						"*Need help with any of the commands? Type* `" + commandPrefix + "help [commandname]`! \n\n" +
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
						"*Need help with any of the commands? Type* `" + commandPrefix + "help [commandname]`! \n\n" +
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
	patat: {
		permission: "default",
		description: "With this command you will vote for Patat.",
		usage: "patat",
		examples: ["patat"],
		func: function(argsm, context, reply) {
			var connection = amazejs.getMySQLConn();
			var serverID = discord.channels[context.channelID].guild_id;

			connection.query("SELECT userID FROM patatOrFriet WHERE userID = ?", [context.userID], function(err, results, fields) {
				if(err) {
					console.log(err);
					console.log(context.userID);
					connection.end();
					return;
				}

				if(results) {
					if(Object.keys(results).length <= 0) {
						connection.query('INSERT INTO patatOrFriet VALUES(?, ?, ?, 1, 0)', [context.userID, serverID, context.username], function(err, results, fields) {
							if(err) {
								console.log(err);
								console.log(context.userID);
							}
							connection.end();
						});
					}
				}
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
			var connection = amazejs.getMySQLConn();
			var serverID = discord.channels[context.channelID].guild_id;

			connection.query("SELECT userID FROM patatOrFriet WHERE userID = ?", [context.userID], function(err, results, fields) {
				if(err) {
					console.log(err);
					console.log(context.userID);
					connection.end();
					return;
				}

				if(results) {
					if(Object.keys(results).length <= 0) {
						connection.query('INSERT INTO patatOrFriet VALUES(?, ?, ?, 0, 1)', [context.userID, serverID, context.username], function(err, results, fields) {
							if(err) {
								console.log(err);
								console.log(context.userID);
							}

							connection.end();
						});
					}
				}
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
			var connection = amazejs.getMySQLConn();
			var finalResult = "n/a";
			var patatCount = 0;
			var frietCount = 0;

			connection.query("SELECT sum(patat) AS patatCount, sum(friet) AS frietCount FROM patatOrFriet;", function(err, results, fields) {
				if(err) console.log(err);

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

				connection.end();
			});
		}
	},
	poflog: {
		permission: "admin",
		description: "Logs all votes for patat or friet",
		usage: "poflog",
		examples: ["poflog"],
		func: function(argsm, context, reply) {
			var connection = amazejs.getMySQLConn();
			var serverID = discord.channels[context.channelID].guild_id;
			var finalString = "";

			connection.query("SELECT * FROM patatOrFriet", function(err, results, fields) {
				if(err) {
					console.log(err);
					connection.end();
					return;
				}

				var foundUser = 0;

				for(var i in results) {
					if(results[i].patat == 1)
						patatOrFriet = "patat";
					else
						patatOrFriet = "friet";
					//
					// if(discord.servers[serverID].members[results[i].userID] == undefined) {
					// 	console.log("Unknown user `" + results[i].userID + "` voted for " + patatOrFriet);
					// }
					// else {
					// 	console.log(discord.servers[serverID].members[results[i].userID].username + " voted for: " + patatOrFriet);
					// }
					finalString += results[i].userName + " voted for " + patatOrFriet + "\n";
				}

				reply(finalString);

				connection.end();
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

			var settingFile = JSON.parse(fs.readFileSync("configfiles/rollstats.json"));

			if(settingFile.hasOwnProperty(randomNumber))
				settingFile.randomNumber ++;
			else
				settingFile[randomNumber] = 1;

			jsonfile.writeFile("configfiles/rollstats.json", settingFile);

			reply("<@" + context.userID + "> rolled " + randomNumber);
		}
	},
	rollstats: {
		permission: "default",
		description: "Will display the top 10 rolls that have been rolled the most.",
		usage: "rollstats",
		examples: ["rollstats"],
		func: function(argsm, context, reply) {
			var settingFile = JSON.parse(fs.readFileSync("configfiles/rollstats.json"));

			var values = [];
			for(var i in settingFile) {
			   values.push({ key: i, value: settingFile[i] });
			}

			values.sort(function(a,b) {return (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0);} );
			values.reverse();

			var finalString = "";

			for(var j = 0; j < 10; j ++) {
				if(values[j].value == 1)
					finalString += "`" + values[j].key + "` has been rolled `" + values[j].value + "` time. \n";
				else
					finalString += "`" + values[j].key + "` has been rolled `" + values[j].value + "` times. \n";
			}

			reply("**The top 10 rolls are:** \n" + finalString);
		}
	},
	setosu: {
		permission: "default",
		description: "Will set/change your osu! username and mode.",
		usage: "setusername [mode] [username]",
		examples: ["setosu osu Wesley", "setosu ctb - Yuri -", "setosu taiko Sartan", "setosu mania Enchant"],
		func: function(argsm, context, reply) {
			var serverID = discord.channels[context.channelID].guild_id;
			var commandPrefix = amazejs.commandPrefix(serverID);
			var connection = amazejs.getMySQLConn();

			var osuAlias 	= validGameModes[0].join(", ");
			var taikoAlias 	= validGameModes[1].join(", ");
			var ctbAlias 	= validGameModes[2].join(", ");
			var maniaAlias 	= validGameModes[3].join(", ");

			var validGameMode = false;
			var gameModeCode = 0;

			if(!argsm[1])
			{
				amazejs.sendWrong(context.channelID, context.userID,
						"Syntax: `" + commandPrefix + "setosu` `mode` `username`\n" +
						"`mode`: enter any of the aliases (Shown below)\n" +
						"`username`: Your osu! username\n" +
						"Example: `" + commandPrefix + "setosu c Wesley`\n\n" +
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
						"Syntax: `" + commandPrefix + "setosu` `mode` `username`\n" +
						"`mode`: enter any of the aliases (Shown below)\n" +
						"`username`: Your osu! username\n" +
						"Example: `" + commandPrefix + "setosu c Wesley`\n\n" +
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
					connection.query('SELECT userID FROM osuNames WHERE userID = ?', [context.userID], function(err, results, fields) {
						if(Object.keys(results).length > 0) {
							connection.query('UPDATE osuNames SET userName = ?, gameMode = ? WHERE userID = ?', [commandParams[1], gameModeCode, context.userID], function(err, results, fields) {
								if(err) {
									console.log(err);
									console.log(commandParams[1]);
									console.log(gamemodecode);
									console.log(context.userID);
									connection.end();
									return;
								}
								connection.end();
							});
						}
						else {
							connection.query('INSERT INTO osuNames VALUES(?, ?, ?)', [context.userID, commandParams[1], gameModeCode], function(err, results, fields) {
								if(err) {
									console.log(err);
									console.log(context.userID);
									console.log(commandParams[1]);
									console.log(gamemodecode);
									connection.end();
									return;
								}
								connection.end();
							});
						}
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
			var osunames = JSON.parse(fs.readFileSync("configfiles/osuname.json"));
			var serverID = discord.channels[context.channelID].guild_id;
			var commandPrefix = amazejs.commandPrefix(serverID);
			var connection = amazejs.getMySQLConn();

			if(!argsm[1]) {
				connection.query('SELECT userID, userName, gameMode FROM osuNames WHERE userID = ?', [context.userID], function(err, results, fields) {
					if(err) {
						console.log(err);
						connection.end();
						return;
					}

					if(Object.keys(results).length > 0) {
						getUserJSON(results[0].userName, results[0].gameMode, function(Json, mode){
							for(var i in Json) {
								discord.sendMessage({
									to: context.channelID,
									message: "```" +
										"\n# Username        : " + Json[i].username +
										"\n# Mode            : " + defaultGameModeNames[results[0].gameMode] +
										"\n# Level           : " + parseFloat(Json[i].level).toFixed(2) +
										"\n# Playcount       : " + addDot(Json[i].playcount) +
										"\n# Accuracy        : " + parseFloat(Json[i].accuracy).toFixed(2) +
										"\n# Pp              : " + addDot(Json[i].pp_raw) +
										"\n# Rank            : " + Json[i].pp_rank +
										"\n# Country rank    : " + Json[i].pp_country_rank +
										"```",
									embed: {
										title: "Profile of " + Json[i].username,
										url: "https://osu.ppy.sh/u/" + Json[i].user_id,
										image: {
											url: "https://a.ppy.sh/" + Json[i].user_id + "_.jpg",
											height: 128,
											width: 128
										},
										color: 0x0080FF
									}
								});
							}
						});

						return;
					}
					else {
						amazejs.sendWrong(context.channelID, context.userID,
							"You haven't set your osu! gamemode and username yet. \nUse `" + commandPrefix + "setosu` `mode` `username` to set your gamemode and username or use `" + commandPrefix + "stats` `mode` `username` to look up anyone.");
						return;
					}

					connection.end();
				});
			}
			else {
				var commandParams = argsm[1].split(" ");
				var validGameMode = false;
				var gameMode = commandParams[0];
				var gameModeCode = 0;

				for(var mode in validGameModes) {
					for(var alias in validGameModes[mode]) {
						if(validGameModes[mode][alias] == gameMode) {
							validGameMode = true;
							gameModeCode = mode;
							break;
						}
					}
				}

				if(!validGameMode) {
					var osuAlias 	= validGameModes[0].join(", ");
					var taikoAlias 	= validGameModes[1].join(", ");
					var ctbAlias 	= validGameModes[2].join(", ");
					var maniaAlias 	= validGameModes[3].join(", ");

					amazejs.sendWrong(context.channelID, context.userID,
						"`" + gameMode + "` is not a valid gamemode. Please use one of the following aliases: \n" +
						"```osu!     : " + osuAlias + "\n" +
						"osu!Taiko: " + taikoAlias + "\n" +
						"osu!Catch: " + ctbAlias + "\n" +
						"osu!Mania: " + maniaAlias + "```");
					return;
				}

				if(Object.keys(commandParams).length >= 2) {
					commandParams.splice(0, 1);
					var userName = commandParams.join(" ");

					getUserJSON(userName, gameModeCode, function(Json, mode) {
						if(Object.keys(Json).length > 0) {
							for(var i in Json) {
								discord.sendMessage({
									to: context.channelID,
									message: "```" +
										"\n# Username        : " + Json[i].username +
										"\n# Mode            : " + defaultGameModeNames[gameModeCode] +
										"\n# Level           : " + parseFloat(Json[i].level).toFixed(2) +
										"\n# Playcount       : " + addDot(Json[i].playcount) +
										"\n# Accuracy        : " + parseFloat(Json[i].accuracy).toFixed(2) +
										"\n# Pp              : " + addDot(Json[i].pp_raw) +
										"\n# Rank            : " + Json[i].pp_rank +
										"\n# Country rank    : " + Json[i].pp_country_rank +
										"```",
									embed: {
										title: "Profile of " + Json[i].username,
										url: "https://osu.ppy.sh/u/" + Json[i].user_id,
										image: {
											url: "https://a.ppy.sh/" + Json[i].user_id + "_.jpg",
											height: 128,
											width: 128
										},
										color: 0x0080FF
									}
								});
							}
						}
						else {
							amazejs.sendWrong(context.channelID, context.userID,
								"This user was not found, this means that the account is either banned or doesn't exist. ");
							return;
						}
					});

					return;
				}
				else {
					connection.query('SELECT userID, userName, gameMode FROM osuNames WHERE userID = ?', [context.userID], function(err, results, fields) {
						if(err) {
							console.log(err);
							connection.end();
							return;
						}

						if(Object.keys(results).length > 0) {
							getUserJSON(results[0].userName, gameModeCode, function(Json, mode) {
								if(Object.keys(Json).length > 0) {
									for(var i in Json) {
										discord.sendMessage({
											to: context.channelID,
											message: "```" +
												"\n# Username        : " + Json[i].username +
												"\n# Mode            : " + defaultGameModeNames[gameModeCode] +
												"\n# Level           : " + parseFloat(Json[i].level).toFixed(2) +
												"\n# Playcount       : " + addDot(Json[i].playcount) +
												"\n# Accuracy        : " + parseFloat(Json[i].accuracy).toFixed(2) +
												"\n# Pp              : " + addDot(Json[i].pp_raw) +
												"\n# Rank            : " + Json[i].pp_rank +
												"\n# Country rank    : " + Json[i].pp_country_rank +
												"```",
											embed: {
												title: "Profile of " + Json[i].username,
												url: "https://osu.ppy.sh/u/" + Json[i].user_id,
												image: {
													url: "https://a.ppy.sh/" + Json[i].user_id + "_.jpg",
													height: 128,
													width: 128
												},
												color: 0x0080FF
											}
										});
									}
								}
								else {
									amazejs.sendWrong(context.channelID, context.userID,
										"This user was not found, this means that the account is either banned or doesn't exist. ");
									return;
								}
							});
						}
						else {
							amazejs.sendWrong(context.channelID, context.userID,
								"You haven't set your osu! gamemode and username ye so you can't look for just a gamemode. \nUse `" + commandPrefix + "setosu` `mode` `username` to set your gamemode and username or use `" + commandPrefix + "stats` `mode` `username` to look up anyone.");
							return;
						}

						connection.end();
					});
				}
			}
		}
	}
};

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

function addDot(nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ' ' + '$2');
    }
    return x1 + x2;
}
