/*jshint -W041, -W083, -W100*/

var fs = require("fs");
var jsonfile = require('jsonfile');
var amazejs = require("../startbot.js");
var request = require("request");

var youtubeStream 	= require("youtube-audio-stream");
var ytdl 			= require("ytdl-core");

var discord = amazejs.getDiscord();
var botId = amazejs.getBotId();
var config = amazejs.getConfig();
var queue = {};
var queueOngoing = {};
var ytSource = {}, streamRef = {};

exports.commands = {
	q: {
		permission: "default",
		description: "This will add a song to the queue.",
		usage: "q [youtube url]",
		examples: ["q https://www.youtube.com/watch?v=7Ttv-R5RU6A", "q https://www.youtube.com/watch?v=AKLrKMz-avE"],
		func: function(argsm, context, reply) {
			var serverID = discord.channels[context.channelID].guild_id;
			var commandPrefix = amazejs.getCommandPrefix(serverID);

			var requestUrl, requestUrlID, requestUrlTitle;

			if(!argsm[1]) {
				amazejs.sendWrong(context.channelID, context.userID,
						"Syntax: `" + commandPrefix + "q` `youtubeurl`\n" +
						"`youtubeurl`: the url of the youtube video you want to queue up\n" +
						"Example: `" + commandPrefix + "q https://www.youtube.com/watch?v=7Ttv-R5RU6A`");
				return;
			}

			if(argsm[1].match(/http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/)) {
				requestUrl = argsm[1];
				var matches = requestUrl.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
			    requestUrlID = matches[1];
			}
			else {
				amazejs.sendWrong(context.channelID, context.userID,
					"Invalid Youtube link, please try again.");
				return;
			}

			if(!queue.hasOwnProperty("server" + serverID))
				queue["server" + serverID] = [];


			if(queue["server" + serverID][Object.keys(queue["server" + serverID]).length - 1] === undefined) {
				queue["server" + serverID].push([Object.keys(queue["server" + serverID]).length, context.username, requestUrl]);
			}
			else {
				var nextNumber = queue["server" + serverID][Object.keys(queue["server" + serverID]).length - 1][0] + 1;
				queue["server" + serverID].push([nextNumber, context.username, requestUrl]);
			}

			discord.getMessages({
				channelID: context.channelID,
				limit: 5
			}, function(err, messageArr) {
				for(var i in messageArr) {
					if(context.userID == messageArr[i].author.id && (commandPrefix + argsm.join(" ")) == messageArr[i].content) {
						discord.deleteMessage({
							channelID: context.channelID,
							messageID: messageArr[i].id
						});
					}
				}
			});

			getYoutubeTitle(requestUrlID, function(data, videoID) {
				for(var i in data.items) {
					discord.sendMessage({
						to: context.channelID,
						embed: {
							description: "**" + context.username + "** has requested the song **" + data.items[i].snippet.title + " (" + ytToSeconds(data.items[i].contentDetails.duration) + ")**.",
							color: 0x00FF00
						}
					});
				}
			});
		}
	},
	play: {
		permission: "default",
		description: "This will make the bot join a voice channel and start the queue.",
		usage: "play",
		examples: ["play"],
		func: function(argsm, context, reply) {
			var serverID = discord.channels[context.channelID].guild_id;
			var commandPrefix = amazejs.getCommandPrefix(serverID);
			var botVoiceChannel = discord.servers[context.serverID].members[botId].voice_channel_id;
			var userVoiceChannel = discord.servers[context.serverID].members[context.userID].voice_channel_id;

			if(Object.keys(queue["server" + serverID]).length <= 0) {
				amazejs.sendWrong(context.channelID, context.userID,
					"The queue is empty!");
				return;
			}
			else {
				if(userVoiceChannel === undefined || userVoiceChannel === null) {
					amazejs.sendWrong(context.channelID, context.userID,
						"You are not in a voice channel. Please join a voice channel to use this command.");
					return;
				}
				else {
					if(botVoiceChannel === undefined || botVoiceChannel === null) {
						discord.joinVoiceChannel(userVoiceChannel, function(err) {
							if(err) console.log(err);
						});
					}

					setTimeout(function(){
						botVoiceChannel = discord.servers[context.serverID].members[botId].voice_channel_id;

						if(!queueOngoing.hasOwnProperty("server" + serverID)) {
							queueOngoing["server" + serverID] = {};
							queueOngoing["server" + serverID].onGoing = false;
						}

						if(queueOngoing["server" + serverID].onGoing === false) {
							queueOngoing["server" + serverID].onGoing = true;
							playQueue(context.channelID, serverID, botVoiceChannel);
						}
						else {
							amazejs.sendWrong(context.channelID, context.userID,
								"The bot is already playing! Queue your song by using `" + commandPrefix + "q`.");
						}

						reply("I have joined the voice chat, starting the queue!");
					}, 1000);
				}
			}
		}
	},
	queue: {
		permission: "default",
		description: "This will show all songs that have been queued.",
		usage: "queue",
		examples: ["queue"],
		func: function(argsm, context, reply) {
			var serverID = discord.channels[context.channelID].guild_id;
			var finalString = "";
			var allQueueIDs = [];

			if(queue.hasOwnProperty("server" + serverID)) {
				for(var i in queue["server" + serverID]) {
					var matches = queue["server" + serverID][i][2].match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
					allQueueIDs.push(matches[1]);
				}

				var xx = 0;
				var queueLoop = function() {
				    getYoutubeTitle(allQueueIDs[xx], function(Json, videoID) {
				        for (var item in Json.items) {
				            finalString += "[" + queue["server" + serverID][xx][0] + "] " + Json.items[item].snippet.title + " (" + ytToSeconds(data.items[i].contentDetails.duration) + ") requested by: " + "" + queue["server" + serverID][xx][1] + " \n";
				        }

						xx ++;

				        if (xx < allQueueIDs.length) {
				            queueLoop();
				        } else {
							if(finalString.length <= 0) {
								amazejs.sendWrong(context.channelID, context.userID,
									"The queue is empty!");
							}
							else {
								reply("```" + finalString + "```");
							}
				        }
				    });
				};

				queueLoop();
			}
			else {
				amazejs.sendWrong(context.channelID, context.userID,
					"The queue is empty!");
				return;
			}
		}
	},
	removefromqueue: {
		permission: "audio.dj",
		description: "This will remove a single song from the audio queue.",
		usage: "removefromqueue [songid]",
		examples: ["removefromqueue 1", "removefromqueue 3"],
		func: function(argsm, context, reply) {
			var serverID = discord.channels[context.channelID].guild_id;
			var commandPrefix = amazejs.getCommandPrefix(serverID);

			if(!argsm[1]) {
				amazejs.sendWrong(context.channelID, context.userID,
						"Syntax: `" + commandPrefix + "removefromqueue` `songid`\n" +
						"`songid`: the songid of what song you want to remove from the queue \n" +
						"Example: `" + commandPrefix + "removefromqueue 1`");
				return;
			}

			if(!isNumeric(argsm[1])) {
				amazejs.sendWrong(context.channelID, context.userID,
						"`songid` has to be a number! \n\n" +
						"Syntax: `" + commandPrefix + "removefromqueue` `songid`\n" +
						"`songid`: the songid of what song you want to remove from the queue \n" +
						"Example: `" + commandPrefix + "removefromqueue 1`");
				return;
			}

			if(queue.hasOwnProperty("server" + serverID)) {
				var deleteThis;

				for(var i in queue["server" + serverID]) {
					if(queue["server" + serverID][i][0] == argsm[1]) {
						deleteThis = i;
						break;
					}
				}

				if(deleteThis !== undefined) {
					reply("Succesfully removed " + queue["server" + serverID][deleteThis][0]);
					queue["server" + serverID].splice(deleteThis, 1);
				}
				else {
					amazejs.sendWrong(context.channelID, context.userID,
						"Invalid id!");
					return;
				}
			}
			else {
				amazejs.sendWrong(context.channelID, context.userID,
					"The queue is empty!");
				return;
			}
		}
	},
	clearqueue: {
		permission: "audio.dj",
		description: "This will clear the whole audio queue.",
		usage: "clearqueue",
		examples: ["clearqueue"],
		func: function(argsm, context, reply) {
			var serverID = discord.channels[context.channelID].guild_id;
			if(!queue.hasOwnProperty("server" + serverID)) {
				amazejs.sendWrong(context.channelID, context.userID,
					"The queue is already empty!");
				return;
			}

			queue["server" + serverID].splice(0, Object.keys(queue["server" + serverID]).length);

			reply("Succesfully cleared the audio queue!");
		}
	},
	stopq: {
		permission: "default",
		description: "This will stop the audio queue. All the remaining songs will stay in the queue.",
		usage: "q [youtube url]",
		examples: ["q https://www.youtube.com/watch?v=7Ttv-R5RU6A", "q https://www.youtube.com/watch?v=AKLrKMz-avE"],
		func: function(argsm, context, reply) {
			var serverID = discord.channels[context.channelID].guild_id;
			queueOngoing["server" + serverID].onGoing = false;

			reply("The bot will stop playing songs after the current song has ended!");
		}
	},
	stop: {
		permission: "default",
		description: "d",
		usage: "u",
		examples: ["e"],
		func: function(argsm, context, reply) {
			var serverID = discord.channels[context.channelID].guild_id;
			var botVoiceChannel = discord.servers[context.serverID].members[botId].voice_channel_id;
			var assert = require('assert');

			ytSource["server" + serverID].on('data', function(x) {
				ytSource["server" + serverID].destroy();
			});


			// discord.getAudioContext(botVoiceChannel, function(error, stream) {
			// 	console.log(stream);
			// });
			//
			// streamRef["server" + serverID].on('unpipe', (src) => {
			// 	console.error('Something has stopped piping into the writer.');
			// 	assert.equal(src, ytSource["server" + serverID]);
			//
			//
			// 	// console.log(streamRef["server" + serverID]);
			//
			// 	discord.getAudioContext(botVoiceChannel, function(error, stream) {
			// 		console.log(stream);
			// 	});
            // });

            // ytSource["server" + serverID].unpipe(streamRef["server" + serverID]);



			// console.log(ytSource["server" +serverID]);
			// console.log(streamRef["server" + serverID]);
			//
			//
			// ytSource["server" + serverID].on('data', function() {
			//
			// 	ytSource["server" + serverID].end();
			// 	streamRef["server" + serverID].end();
			//
			// });

			// streamRef["server" + serverID].stop();
			// ytSource["server" + serverID].unpipe(streamRef["server" + serverID]);

			// ytSource["server" + serverID].on('unpipe', (src) => {
			// 	console.log(src);
			// });

			// reply(":no_entry: | You can't stop the audio yet, I'm sorry for the inconvenience. Will try to fix it ASAP.");
		}
	},
	leave: {
		permission: "audio.admin",
		description: "d",
		usage: "u",
		examples: ["e"],
		func: function(argsm, context, reply) {
			var botVoiceChannel = discord.servers[context.serverID].members[botId].voice_channel_id;
			discord.leaveVoiceChannel(botVoiceChannel, function(err) {
				if(err) console.log(err);
			});
		}
	},
};

function playQueue(channelID, serverID, botVoiceChannel) {
	if (queueOngoing.hasOwnProperty("server" + serverID)) {
		if(queueOngoing["server" + serverID].onGoing === true) {
			if(Object.keys(queue["server" + serverID]).length <= 0) {
				queueOngoing["server" + serverID].onGoing = false;

				discord.sendMessage({
					to: channelID,
					message: "No more songs left in the queue!"
				});
				return;
			}

			discord.getAudioContext(botVoiceChannel, function(err, stream) {
				if(err) console.log(err);

				streamRef["server" + serverID] = stream;
				ytSource["server" + serverID] = youtubeStream(queue["server" + serverID][0][2]);
				// ytSource["server" + serverID] = ytdl(queue["server" + serverID][0][2]);

				ytSource["server" + serverID].pipe(stream, {end: false});

				// fs.createReadStream('music/haitai.mp3').pipe(stream, {end: false});

				var matches = queue["server" + serverID][0][2].match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);

				getYoutubeTitle(matches[1], function(Json, videoID) {
					for(var item in Json.items) {
						discord.sendMessage({
							to: channelID,
							embed: {
								title: "Now playing " + Json.items[item].snippet.title,
								url: queue["server" + serverID][0][2],
								description: "Requested by " + queue["server" + serverID][0][1] + "\nDuration: " + ytToSeconds(Json.items[item].contentDetails.duration)
							}
						});

						queue["server" + serverID].splice(0, 1);
					}
				});

				stream.once('done', function() {
					playQueue(channelID, serverID, botVoiceChannel);
				});
			});
		}
		else {
			queueOngoing["server" + serverID].onGoing = false;

			discord.sendMessage({
				to: channelID,
				message: "The bot has stopped playing!"
			});
		}
	}
	else
		return;
}

function getYoutubeTitle(videoID, callback) {
    request({
        url: "https://www.googleapis.com/youtube/v3/videos?id=" + videoID + "&key=" + config.apiKeys.youtube + "&fields=items(snippet(title),contentDetails(duration))&part=snippet,contentDetails"
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(JSON.parse(body), videoID);
        } else {
            console.error("Failed!");
            callback([]);
        }
    });
}

function ytToSeconds(input) {
	var reptms = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
	var hours = 0, minutes = 0, seconds = 0, totalseconds;
	if (reptms.test(input)) {
		var matches = reptms.exec(input);
		if (matches[1]) hours = Number(matches[1]);
		if (matches[2]) minutes = Number(matches[2]);
		if (matches[3]) seconds = Number(matches[3]);

		var returnString = 0;

		if (hours) return hours + ":" + minutes + ":" + seconds;
		if (minutes) return minutes + ":" + seconds;
		if (seconds) return "00:" + seconds;
	}
	else
		return "Invalid time";
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
