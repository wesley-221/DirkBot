/* jshint esversion: 6, -W083*/

var amazejs = require('../startbot.js');
var request = require("request");
var discord = amazejs.getDiscord();
var botId = amazejs.getBotId();
var AxSServer = amazejs.getAxSId();
var config = amazejs.getConfig();

var pool = amazejs.getMySQLConn();

var mpId = 33091631; // temporary id

exports.commands = {
	calculate: {
		permission: "admin",
		description: "calculate",
		usage: "calculate",
		examples: ["calculate"],
		func: function(argsm, context, reply) {
			requestPromise("https://osu.ppy.sh/api/get_match?k=" + config.apiKeys.osu + "&mp=" + mpId).then((multi) => {
				// console.log(Object.keys(multi));
				// console.log(Object.keys(multi.games));

				for(let game in multi.games) {
					// ===================================================================
					// TODO: Fix the loop so that it is async as well,
					//		 currently shows the correct data just not in the proper order
					// ===================================================================
					requestPromise("https://osu.ppy.sh/api/get_beatmaps?k=" + config.apiKeys.osu + "&b=" + multi.games[game].beatmap_id).then((map) => {
						let scores = multi.games[game].scores;
						let tOneAccTotalFruit = parseInt(scores[0].count50) + parseInt(scores[0].count100) + parseInt(scores[0].count300) +
	                        					parseInt(scores[0].countmiss) + parseInt(scores[0].countkatu), 													// The total amount of fruits in the map
	                    	tOneAccFruitCaught = parseInt(scores[0].count50) + parseInt(scores[0].count100) + parseInt(scores[0].count300), 					// The total amount of fruits that x user caught
							teamOneAccuracyPlayer = ((tOneAccFruitCaught / tOneAccTotalFruit) * 100).toFixed(2),												// The accuracy of the player, rounded to 2 decimals
							teamOneScore = ((scores[1].pass == 1) ? parseInt(scores[1].score) : 0) + ((scores[2].pass == 1) ? parseInt(scores[2].score) : 0);	// The score without the modifier, score will be 0 if player is dead at the end of the map

						let tTwoAccTotalFruit = parseInt(scores[3].count50) + parseInt(scores[3].count100) + parseInt(scores[3].count300) +
	                        					parseInt(scores[3].countmiss) + parseInt(scores[3].countkatu), 													// The total amount of fruits in the map
	                    	tTwoAccFruitCaught = parseInt(scores[3].count50) + parseInt(scores[3].count100) + parseInt(scores[3].count300), 					// The total amount of fruits that x user caught
							teamTwoAccuracyPlayer = ((tTwoAccFruitCaught / tTwoAccTotalFruit) * 100).toFixed(2),												// The accuracy of the player, rounded to 2 decimals
							teamTwoScore = ((scores[4].pass == 1) ? parseInt(scores[4].score) : 0) + ((scores[5].pass == 1) ? parseInt(scores[5].score) : 0);	// The score without the modifier, score will be 0 if player is dead at the end of the map

						console.log("-----------------------------------");
						console.log(map[0].artist + ' - ' + map[0].title + ' [' + map[0].version + ']');
						console.log('teamOneAccuracyPlayer: ' + teamOneAccuracyPlayer);
						console.log('teamOneScore without modifier: ' + teamOneScore);
						console.log();
						console.log('teamTwoAccuracyPlayer: ' + teamTwoAccuracyPlayer);
						console.log('teamTwoScore without modifier: ' + teamTwoScore);
						console.log("-----------------------------------");
					});
				}
			});
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
