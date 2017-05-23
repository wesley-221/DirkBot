/* jshint -W061, esversion: 6 */
var fs = require("fs");
var jsonfile = require('jsonfile');
var amazejs = require("../startbot.js");

var discord = amazejs.getDiscord();
var botId = amazejs.getBotId();
var pool = amazejs.getMySQLConn();

var config = amazejs.getConfig();

// testdata 
var x = {
	"match": {
		"match_id": "33091631",
		"name": "snelle mp",
		"start_time": "2017-05-12 00:50:36",
		"end_time": "2017-05-12 00:57:03"
	},
	"games": [{
		"game_id": "178312595",
		"start_time": "2017-05-12 00:53:46",
		"end_time": "2017-05-12 00:54:23",
		"beatmap_id": "36657",
		"play_mode": "2",
		"match_type": "0",
		"scoring_type": "0",
		"team_type": "2",
		"mods": "0",
		"scores": [{
			"slot": "0",
			"team": "1",
			"user_id": "4430811",
			"score": "260100",
			"maxcombo": "97",
			"rank": "0",
			"count50": "32",
			"count100": "6",
			"count300": "91",
			"countmiss": "0",
			"countgeki": "13",
			"countkatu": "0",
			"perfect": "0",
			"pass": "1"
		}, {
			"slot": "1",
			"team": "2",
			"user_id": "2931883",
			"score": "255700",
			"maxcombo": "97",
			"rank": "0",
			"count50": "32",
			"count100": "6",
			"count300": "91",
			"countmiss": "0",
			"countgeki": "13",
			"countkatu": "0",
			"perfect": "0",
			"pass": "1"
		}, {
			"slot": "2",
			"team": "1",
			"user_id": "2114149",
			"score": "261200",
			"maxcombo": "97",
			"rank": "0",
			"count50": "32",
			"count100": "6",
			"count300": "91",
			"countmiss": "0",
			"countgeki": "13",
			"countkatu": "0",
			"perfect": "0",
			"pass": "1"
		}, {
			"slot": "3",
			"team": "2",
			"user_id": "2407265",
			"score": "257900",
			"maxcombo": "97",
			"rank": "0",
			"count50": "32",
			"count100": "6",
			"count300": "91",
			"countmiss": "0",
			"countgeki": "13",
			"countkatu": "0",
			"perfect": "0",
			"pass": "1"
		}, {
			"slot": "4",
			"team": "1",
			"user_id": "4100941",
			"score": "254600",
			"maxcombo": "97",
			"rank": "0",
			"count50": "32",
			"count100": "6",
			"count300": "91",
			"countmiss": "0",
			"countgeki": "13",
			"countkatu": "0",
			"perfect": "0",
			"pass": "1"
		}, {
			"slot": "5",
			"team": "2",
			"user_id": "4169363",
			"score": "253500",
			"maxcombo": "97",
			"rank": "0",
			"count50": "32",
			"count100": "6",
			"count300": "91",
			"countmiss": "0",
			"countgeki": "13",
			"countkatu": "0",
			"perfect": "0",
			"pass": "1"
		}]
	}, {
		"game_id": "178312762",
		"start_time": "2017-05-12 00:55:40",
		"end_time": "2017-05-12 00:56:37",
		"beatmap_id": "697276",
		"play_mode": "2",
		"match_type": "0",
		"scoring_type": "0",
		"team_type": "2",
		"mods": "0",
		"scores": [{
			"slot": "0",
			"team": "1",
			"user_id": "4430811",
			"score": "189598",
			"maxcombo": "43",
			"rank": "0",
			"count50": "93",
			"count100": "3",
			"count300": "118",
			"countmiss": "9",
			"countgeki": "36",
			"countkatu": "2",
			"perfect": "0",
			"pass": "1"
		}, {
			"slot": "1",
			"team": "2",
			"user_id": "2931883",
			"score": "248392",
			"maxcombo": "75",
			"rank": "0",
			"count50": "94",
			"count100": "3",
			"count300": "124",
			"countmiss": "3",
			"countgeki": "40",
			"countkatu": "1",
			"perfect": "0",
			"pass": "1"
		}, {
			"slot": "2",
			"team": "1",
			"user_id": "2114149",
			"score": "488666",
			"maxcombo": "130",
			"rank": "0",
			"count50": "95",
			"count100": "3",
			"count300": "127",
			"countmiss": "0",
			"countgeki": "43",
			"countkatu": "0",
			"perfect": "0",
			"pass": "1"
		}, {
			"slot": "3",
			"team": "2",
			"user_id": "2407265",
			"score": "485366",
			"maxcombo": "130",
			"rank": "0",
			"count50": "95",
			"count100": "3",
			"count300": "127",
			"countmiss": "0",
			"countgeki": "43",
			"countkatu": "0",
			"perfect": "0",
			"pass": "1"
		}, {
			"slot": "4",
			"team": "1",
			"user_id": "4100941",
			"score": "231152",
			"maxcombo": "70",
			"rank": "0",
			"count50": "82",
			"count100": "3",
			"count300": "120",
			"countmiss": "7",
			"countgeki": "39",
			"countkatu": "13",
			"perfect": "0",
			"pass": "0"
		}, {
			"slot": "5",
			"team": "2",
			"user_id": "4169363",
			"score": "244240",
			"maxcombo": "79",
			"rank": "0",
			"count50": "92",
			"count100": "3",
			"count300": "123",
			"countmiss": "4",
			"countgeki": "40",
			"countkatu": "3",
			"perfect": "0",
			"pass": "1"
		}]
	}]
};

exports.commands = {
	eval: {
		permission: "owner",
		description: "Evaluates or executes an argument.",
		usage: "eval [data]",
		examples: ["eval discord.users['88662320791707648'].username", "eval discord.users['88662320791707648'].discriminator"],
		func: function(argsm, context, reply) {
			var returnMessage, isError = false, isFormatted = false;

			try {
				returnMessage = eval(argsm[1]);
			}
			catch(err) {
				isError = true;
				returnMessage = err.toString();
			}
			finally {
				if(typeof returnMessage === 'undefined') {
					returnMessage = '```undefined```';
				}
				else if(typeof returnMessage === 'object') {
					try {
						returnMessage = '```json\n' + JSON.stringify(returnMessage) + '```';
					}
					catch(err) {
						returnMessage = '```Error converting JSON result to string: \n' + err.toString() + '```';
					}
				}
				else {
					returnMessage = '```\n' + returnMessage + '```';
				}

				if(returnMessage.length > 1980) returnMessage = (returnMessage.substring(0, 1950) + '...```');

				discord.sendMessage({
					to: context.channelID,
					message: (isError ? 'Error: \n' : '') + returnMessage
				});
			}
		}
	},
	// sql: {
	// 	permission: "owner",
	// 	description: "Execute a SQL query",
	// 	usage: "sql [query]",
	// 	examples: [""],
	// 	func: function(argsm, context, reply) {
	// 		var returnMessage, isError = false, isFormatted = false;
	//
	// 		try {
	// 			pool.getConnection(function(err, connection) {
	// 				if(err) console.log('connection error: ' + err);
	// 				connection.query(argsm[1], function(err, results) {
	// 					if(err) {
	// 						isError = true;
	// 						returnMessage = err.toString();
	// 					}
	// 					else {
	// 						for(let i in results) {
	// 							for(let j in Object.keys(results[i])) {
	// 								if(results[i][Object.keys(results[i])[j]] === undefined) continue;
	// 								returnMessage += results[i][Object.keys(results[i])[j]];
	// 							}
	// 						}
	// 					}
	//
	// 					discord.sendMessage({
	// 						to: context.channelID,
	// 						message: (isError ? 'Error: ' : '') + '```' + returnMessage + '```'
	// 					});
	// 				});
	// 			});
	// 		}
	// 		catch(err) {
	// 			console.log(err);
	// 		}
	// 	}
	// },
	setgame: {
		permission: "owner",
		description: "Will change the \"Now playing\" of the bot.",
		usage: "setgame [text]",
		examples: ["setgame", "setgame HI IM WESLEY!"],
		func: function(argsm, context, reply) {
			if(!argsm[1])
			{
				amazejs.setGame("Type !help for help");
				reply("<@" + context.userID + "> has changed the bot's title back to default.");
				return;
			}

			if(argsm[1].length >= 12)
			{
				amazejs.sendWrong(context.channelID, context.userID,
					"The name can only be 12 characters long.");
				return;
			}

			amazejs.setGame(argsm[1]);
			reply("<@" + context.userID + "> has set the bot's title to `" + argsm[1] + "`");
		}
	},
	reload: {
		permission: "owner",
		description: "This will reload all plugins and permissions.",
		usage: "reload",
		examples: ["roll"],
        func: function(argsm, context, reply) {
            amazejs.reloadPlugins();
            amazejs.reloadPermissions();
            reply("**Reloaded permissions and plugins.**");
        }
	},
	enchantava: {
		permission: "owner",
		description: "This will reload all plugins and permissions.",
		usage: "enchantava",
		examples: ["enchantava"],
		func: function(argsm, context, reply) {
			pool.getConnection(function(err, connection){
				connection.query("SELECT count FROM enchant", [context.serverID, context.userID], function(err, results){
					connection.query("UPDATE enchant SET count = ?", [results[0].count + 1]);
					connection.release();
				});
			});
		}
	},
	enchant: {
		permission: "owner",
		description: "This will reload all plugins and permissions.",
		usage: "enchantava",
		examples: ["enchantava"],
		func: function(argsm, context, reply) {
			pool.getConnection(function(err, connection){
				connection.query("SELECT count FROM enchant", [context.serverID, context.userID], function(err, results){
					discord.sendMessage({
						to: context.channelID,
						message: "Enchant has changed his avatar " + results[0].count + " times."
					});

					connection.release();
				});
			});
		}
	}
};
