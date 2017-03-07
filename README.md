# DirkBot
Source of Dirk Bot

If you want to make this bot work, you have to create a file: `/configfiles/config.json`.
This file should contain the following information:

```javascript
{
	"botToken": "",
	"ids": {
		"botId": "189393959577976833",
		"AxSServer": "121334952016084992",
		"masterUser": "88662320791707648"
	},
	"apiKeys": {
		"youtube": "",
		"osu": ""
	},
	"masterCommandPrefix": "!",
	"MySQL": {
		"host": "",
		"port": "3306",
		"user": "",
		"password": "",
		"database": "dirkbot"
	}
}
```

`botToken`: The token of your bot, get a code from here: <https://discordapp.com/developers/applications/me>

`ids.botId`: The id of the bot user (right mouse on the bot -> Copy ID)

`ids.AxSServer`: The official AxS server id is `121334952016084992`, feel free to change this to any of your own servers if you want to run the commands in there

`ids.masterUser`: The id of the master user (usually yourself), this is used to bypass certain things


`apiKeys.youtube`: The api key for youtube, get a key from here: <https://console.developers.google.com/>

`apiKeys.osu`: The api key for osu!, get a key from here: <https://osu.ppy.sh/p/api>

`masterCommandPrefix`: By default `!`, change it to anything

`MySQL.host`: The IP of the MySQL server

`MySQL.port`: The port of the MySQL server

`MySQL.user`: The username of the MySQL server

`MySQL.password`: The password of the MySQL server

`MySQL.database`: By default `dirkbot`, the database name


Here is an empty database file with all the tables required:

Soon™
