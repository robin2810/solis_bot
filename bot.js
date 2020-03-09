var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var getJSON = require('get-json');
var fs = require('fs');
require('.');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '&') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];

        //args = args.splice(1);
        switch(cmd) {
            // &chiefvote
            case 'chiefvote':
              bot.sendMessage({
                  to: channelID,
                  message: '<@&684193899253596200>\n' + args.join(" ").substring(10) + '\n\n🙂 = yes, 😐 = neutral, 🙁 = no'
              }, async function(err, res) {
                  bot.deleteMessage({
                    channelID: channelID,
                    messageID: evt.d.id,
                  });
                  await Sleep(2500);
                  bot.addReaction({
                    channelID: channelID,
                    messageID: res.id,
                    reaction: '🙂'
                  });
                  await Sleep(2500);
                  bot.addReaction({
                    channelID: channelID,
                    messageID: res.id,
                    reaction: '😐'
                  });
                  await Sleep(2500);
                  bot.addReaction({
                    channelID: channelID,
                    messageID: res.id,
                    reaction: '🙁'
                  });
              });
            break;

            // &ur
            case 'ur':
              // &ur mom
              if(args[1] == 'mom') {
                bot.sendMessage({
                    to: channelID,
                    message: 'gay!'
                });
              }
            break;

            // &uh
            case 'uh':
              // &uh oh
              if(args[1] == 'oh') {
                bot.sendMessage({
                    to: channelID,
                    message: 'stinky!'
                });
              }
            break;
            // &mock [TEXT] => turns text into mocking spongebob + pic
            case 'mock':
              var x = true;
              var temp = "";
              for(var i = 0; i < args.length; i++) {
                args[i] = args[i+1];
              }
              for(var i = 0; i < (args.length - 1); i++) {
                for(var j = 0; j < args[i].length; j++) {
                  if(x) {
                    temp = temp + args[i].substring(j, j+1).toUpperCase();
                    x = false;
                  } else {
                    temp = temp + args[i].substring(j, j+1).toLowerCase();
                    x = true;
                  }
                }
                args[i] = temp;
                temp = "";
              }
              bot.sendMessage({
                  to: channelID,
                  message: "https://imgur.com/97IRY4A\n**" + args.join(" ") + "**"
              });
            break;
            // &wgl => Wynn Guild List
            /*case 'wgl':
            //request gets GuildList from Wynn API
            getJSON('https://api.wynncraft.com/public_api.php?action=guildList',
            function(error, response) {
                //data is the JSON string
              //All Entries get displayed in the chat
              var guildString = JSON.stringify(response.guilds);
              while(guildString.indexOf("\"") !== -1) {
                guildString = guildString.replace("\"", "");
              }
              var i = 1;
              var guilds = [];
              var length = 0;
              do {
                  index = guildString.indexOf(',', i);
                  guilds.push(guildString.substring(i, index));
                  i = index + 1;
                  length ++;
              } while (guildString.indexOf(',', i) !== -1 && length <= 100);

              var joined = "";
              for(var x = 0; x < guilds.length; x++) {
                  getJSON('https://api.wynncraft.com/public_api.php?action=guildStats&command=' + guilds[x],
                  function(error2, response2) {
                      guilds[x] = guilds[x] + " " + JSON.stringify(response2.prefix);
                  });
              }
              guilds = guilds.join("\n");
              bot.sendMessage({
                  to: channelID,
                  message: guilds
              });
            });
            break;*/
         }
     }
});

function Sleep(milliseconds) {
   return new Promise(resolve => setTimeout(resolve, milliseconds));
}
