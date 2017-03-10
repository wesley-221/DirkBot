/* jshint esversion: 6, -W004, -W083*/

var fs = require("fs");
var jsonfile = require('jsonfile');
var amazejs = require('../startbot.js');
var request = require("request");
var async = require('async');

var discord = amazejs.getDiscord();
var botId = amazejs.getBotId();
var AxSServer = amazejs.getAxSId();
var config = amazejs.getConfig();

var pool = amazejs.getMySQLConn();

exports.commands = {
	setmappool: {
		permission: "axs.admin",
		description: "Changes the mappool to a different google docs",
		usage: "setmappool [google docs id]",
		examples: ["setmappool 1b57Q7xnL2FCYeru-lDAtHKlfzQtJcDRiePqef2I1y78", "mappool 1KkW-n87hYnwPedU0W2e0q1w4ZHNUjJyXFlrAQBXxcW8"],
		func: function(argsm, context, reply) {
			var serverID = discord.channels[context.channelID].guild_id;
			var commandPrefix = amazejs.getCommandPrefix(serverID);

			if(!argsm[1]) {
				amazejs.sendWrong(context.channelID, context.userID,
						"Syntax: `" + commandPrefix + "setmappool` `google docs id`\n" +
						"`inlinecommand`: The google docs id. https://docs.google.com/spreadsheets/d/1KkW-n87hYnwPedU0W2e0q1w4ZHNUjJyXFlrAQBXxcW8/, copy the `1KkW-n87hYnwPedU0W2e0q1w4ZHNUjJyXFlrAQBXxcW8` part.\n" +
						"Example: `" + commandPrefix + "setmappool 1KkW-n87hYnwPedU0W2e0q1w4ZHNUjJyXFlrAQBXxcW8!`\n\n");
			}

			pool.getConnection(function(err, connection) {
				connection.query("UPDATE spreadsheetID SET spreadsheetID = ?", [argsm[1]], function(err, results) {
					if(err) console.log(err);

					reply("<@" + context.userID + ">, succesfully updated the google docs ID to `" + argsm[1] + "`. ");
					amazejs.reloadMappool();
					connection.release();
				});
			});
		}
	},
	reloadmappool: {
		permission: "axs.admin",
		description: "Reloads the mappool",
		usage: "mappool [stagename]",
		examples: ["mappool", "mappool groupstage", "mappool roundof8"],
		func: function(argsm, context, reply) {
			amazejs.reloadMappool();
			reply("<@" + context.userID + ">, succesfully reloaded the google docs ID.");
		}
	},
	mappool: {
		permission: "default",
		description: "Shows the maps of the given stage (Groupstage, round of 8, etc.)",
		usage: "mappool [stagename]",
		examples: ["mappool", "mappool groupstage", "mappool roundof8"],
		func: function(argsm, context, reply) {
			var mappool = amazejs.getMappool();

			if(!argsm[1]) {
				var allStages = "";

				for(var stage in mappool) {
					allStages += stage + ', ';
				}

				reply("All stages: " + allStages);
				return;
			}

			var modMessage = {
				"nomod": "",
				"hidden": "",
				"hardrock": "",
				"doubletime": "",
				"freemod": "",
				"tiebreaker": ""
			};

			for(var stage in mappool) {
				if(stage == argsm[1]) {
					var finalString = "";

					finalString += `\`\`\`=========== The maps for ${stage} =========== \n`;

					for(var mod in mappool[stage]) {
						var tempString = "";
						var modUnderline = "";

						for(var i = 0; i < mod.length + 1; i ++)
							modUnderline += '-';
						tempString += `${mod}: \n${modUnderline}\n`;

						var mapNameBiggestLength = 0,
							mapNameSpaces = "",
							diffNameBiggestLength = 0,
							diffNameSpaces = "";

						for(var i in mappool[stage][mod]) {
							if(mappool[stage][mod][i].map.length > mapNameBiggestLength)
								mapNameBiggestLength = mappool[stage][mod][i].map.length;

							if(mappool[stage][mod][i].difficulty.length > diffNameBiggestLength)
								diffNameBiggestLength = mappool[stage][mod][i].difficulty.length;
						}

						for(var i = 0; i < mapNameBiggestLength - "Mapname".length; i ++)
							mapNameSpaces += " ";

						for(var i = 0; i < diffNameBiggestLength - "Difficulty".length; i ++ )
							diffNameSpaces += " ";

						tempString += `Mapname ${mapNameSpaces} Difficulty ${diffNameSpaces} Modifier\n`;

						for(var map in mappool[stage][mod]) {
							var mapNameCurrentLength = mappool[stage][mod][map].map.length,
								diffNameCurrentLength = mappool[stage][mod][map].difficulty.length,
								mapNameCurrentSpaces = "", diffNameCurrentSpaces = "";

							for(var i = 0; i < (mapNameBiggestLength - mapNameCurrentLength); i ++)
								mapNameCurrentSpaces += " ";

							if(diffNameCurrentLength < "Difficulty".length) {
								if(diffNameBiggestLength > "Difficulty".length) {
									for(var i = 0; i < (diffNameBiggestLength - diffNameCurrentLength); i++)
										diffNameCurrentSpaces += " ";
								}
								else {
									for(var i = 0; i < ("Difficulty".length - diffNameCurrentLength); i++)
										diffNameCurrentSpaces += " ";
								}
							}
							else {
								for(var i = 0; i < (diffNameBiggestLength - diffNameCurrentLength); i ++)
									diffNameCurrentSpaces += " ";
							}

							tempString += `${mappool[stage][mod][map].map} ${mapNameCurrentSpaces} ${mappool[stage][mod][map].difficulty} ${diffNameCurrentSpaces} ${mappool[stage][mod][map].modifier} \n`;
						}

						modMessage[mod.toLowerCase()] = tempString;
					}

					var times = 0;
					async.each(modMessage, function(message, callback) {
						setTimeout(function() {
							discord.sendMessage({
								to: context.channelID,
								message: "```md\n" + message + "```"
							});
						}, 1000 * times);

						times++;
						callback();
					});
				}
			}
		}
	},
	curmatch: {
		permission: "axs.host.curmatch",
		description: "This will set the multiplayer match for yourself. This is used for the command \"calculate\".",
		usage: "curmatch [mproomID] [Team 1 name] [Team 2 name]",
		examples: ["curmatch 25200157 \"1 Miss Gods\" \"Never Give Up\"", "curmatch 30870075 \"wesley is the best\" \"sartan is the best\""],
		func: function(argsm, context, reply) {
			var commandPrefix = amazejs.getCommandPrefix(serverID);
			var serverID = discord.channels[context.channelID].guild_id;

			if(!argsm[1]) {
				amazejs.sendWrong(context.channelID, context.userID,
						"Syntax: `" + commandPrefix + "curmatch` `mpRoom` `\"team 1 name\"` `\"team 2 name\"`\n" +
						"`mpRoom`: The URL to the multiplayer match, can be `https://osu.ppy.sh/mp/30838148` or `30838148` \n" +
						"`\"team 1/2 name\"`: The name of the teams that are playing, make sure to use quotation marks for the team names!" +
						"Example: `" + commandPrefix + "curmatch 25200157 \"1 Miss Gods\" \"Never Give Up\"`");
				return;
			}

			var quotesFound = argsm[1].match(/"/g);
			var splittedArgs = argsm[1].trim().split(/"/);

			for(var i in splittedArgs) {
				splittedArgs[i] = splittedArgs[i].trim();
				if(splittedArgs[i] === '') {
					splittedArgs.splice(i, 1);
				}
			}

			if(Object.keys(splittedArgs).length != 3 || quotesFound.length != 4) {
				amazejs.sendWrong(context.channelID, context.userID,
					"You either haven't filled in 3 parameters or forgot to put the teams in between quotation marks (`\"`). \n\n" +
					"Syntax: `" + commandPrefix + "curmatch` `mpRoom` `\"team 1 name\"` `\"team 2 name\"`\n" +
					"`mpRoom`: The URL to the multiplayer match, can be `https://osu.ppy.sh/mp/30838148` or `30838148` \n" +
					"`\"team 1/2 name\"`: The name of the teams that are playing, make sure to use quotation marks for the team names!" +
					"Example: `" + commandPrefix + "curmatch 25200157 \"1 Miss Gods\" \"Never Give Up\"`");
				return;
			}
			else {
				if(splittedArgs[0].match(/^(https|http):\/\/osu.ppy.sh\/mp\/\d+$|^\d+$/)) {
					pool.getConnection(function(err, connection) {
						connection.query("SELECT * FROM calcUserData", function(err, results) {
							if(Object.keys(results).length > 0) {
								var updateData = 0;
								for(var result in results) {
									if(results[result].userID == context.userID) {
										updateData = 1;
										break;
									}
								}

								if(updateData == 1) {
									connection.query("UPDATE calcUserData SET mpLink = ?, t1Name = ?, t2Name = ? WHERE userID = ?", [splittedArgs[0], splittedArgs[1], splittedArgs[2], context.userID], function(err) {
										if(err) console.log(err);
									});
								}
								else {
									connection.query("INSERT INTO calcUserData VALUES(?, ?, ?, ?)", [context.userID, splittedArgs[0], splittedArgs[1], splittedArgs[2]], function(err) {
										if(err) console.log(err);
									});
								}
							}
							else {
								connection.query("INSERT INTO calcUserData VALUES(?, ?, ?, ?)", [context.userID, splittedArgs[0], splittedArgs[1], splittedArgs[2]], function(err) {
									if(err) console.log(err);
								});
							}

							reply("<@" + context.userID + ">, succesfully set your data: \n" +
								"Multiplayer room ID: `" + splittedArgs[0] + "`\n" +
								"Team 1 name: `" + splittedArgs[1] + "`\n" +
								"Team 2 name: `" + splittedArgs[2] + "`");

							connection.release();
						});
					});
				}
				else {
					amazejs.sendWrong(context.channelID, context.userID,
						"You have entered an invalid URL to the multiplayer match. It should be either `https://osu.ppy.sh/mp/30838148` or `30838148`.\n\n" +
						"Syntax: `" + commandPrefix + "curmatch` `mpRoom` `\"team 1 name\"` `\"team 2 name\"`\n" +
						"`mpRoom`: The URL to the multiplayer match, can be `https://osu.ppy.sh/mp/30838148` or `30838148` \n" +
						"`\"team 1/2 name\"`: The name of the teams that are playing, make sure to use quotation marks for the team names!" +
						"Example: `" + commandPrefix + "curmatch 25200157 \"1 Miss Gods\" \"Never Give Up\"`");
					return;
				}
			}
		}
	},
	calculate: {
		permission: "axs.host.calculate",
		description: "This will calculate the scores of a multiplayer game with the AxS score system.",
		usage: "calculate",
		examples: ["calculate"],
	    func: function(argsm, context, reply) {

		}
	}
};


function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
