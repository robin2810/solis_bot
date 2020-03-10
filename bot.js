var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var getJSON = require('sync-request');
var fs = require('fs');
require('.');

var commandsHypixel = ["initiateping"],
var commandsWynn = ["chiefvote"],
initiatePing,
apiKey = 'd22f01f1-da75-4bfc-8ede-9fcd9dec2129',
guildId = '5e58976f8ea8c9832198e154',
ms_to_day = 86400000;

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

    var serverID = evt.d.guild_id;

    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '&') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        var cmd2 = args[1];

        //args = args.splice(1);
        switch(cmd) {
            // &initiateping [685284276362543115]
            case 'initiateping':
              if(serverID == '685284276362543115') {
                if (cmd2 == 'start') {
                  initiatePing = setInterval(initiate_ping, 5000, channelID);
                  bot.sendMessage({
                      to: channelID,
                      message: 'Initiate Ping is now started'
                  });
                } else if (cmd2 == 'stop') {
                  clearInterval(initiatePing);
                  bot.sendMessage({
                      to: channelID,
                      message: 'Initiate Ping is now stopped'
                  });
                } else {
                  bot.sendMessage({
                      to: channelID,
                      message: 'wrong usage, try: &initiateping start or &initiateping stop'
                  });
                }
              } else {
                bot.sendMessage({
                    to: channelID,
                    message: 'this command is not meant for this server!'
                });
              }
            break;

            // &chiefvote [627293915501953024]
            case 'chiefvote':
            if(serverID == '627293915501953024') {
              bot.sendMessage({
                  to: channelID,
                  message: '<@&627583725302972427>\n' + args.join(" ").substring(10)
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
            } else {
              bot.sendMessage({
                  to: channelID,
                  message: 'this command is not meant for this server!'
              });
            }
            break;

            // &help
            case 'help':
              if(serverID == '627293915501953024') { //WYNN
                bot.sendMessage({
                    to: channelID,
                    message: 'you can use the following commands: &' + commandsWynn.join(', &')
                });
              } else if(serverID == '685284276362543115') { //HYPIXEL
                bot.sendMessage({
                    to: channelID,
                    message: 'you can use the following commands: &' + commandsHypixel.join(', &')
                });
              }
            break;

            //default
            default:
              if(serverID == '627293915501953024') { //WYNN
                bot.sendMessage({
                    to: channelID,
                    message: 'unknown command, try: &' + commandsWynn.join(', &')
                });
              } else if(serverID == '685284276362543115') { //HYPIXEL
                bot.sendMessage({
                    to: channelID,
                    message: 'unknown command, try: &' + commandsHypixel.join(', &')
                });
              }
            break;
         }
     }
});

function initiate_ping(channelID) {
  var currentDate = Date.now();
  var urlOuter = 'https://api.hypixel.net/guild?key=' + apiKey + '&id=' + guildId;
  var responseOuter = JSON.parse(getJSON('GET', urlOuter).getBody());
  var members = responseOuter.guild.members;
  var responded_username;
  var out = '',
  dont_return_out = false;
  var previousOut;
  var messageID = fs.readFileSync('messageID.txt', 'utf8');

  if(messageID != "") {
    dont_return_out = true;
    bot.getMessage({
        channelID: channelID,
        messageID: messageID
    }, function(err, res) {
      var message = res.content.split('\n');
      var names = [];
      for(i = 0; i < message.length; i = i+2) {
        var temp = message[i].split(" ");
        names.push(temp[0]);
      }
      for(i = 0; i < members.length; i++) {
        if(members[i].rank == 'Initiate' && ((currentDate - members[i].joined) > (ms_to_day*7))) {
          var playerUuid = members[i].uuid;
          var url = 'https://api.hypixel.net/player?key=' + apiKey + '&uuid=' + playerUuid;
          var response = JSON.parse(getJSON('GET', url).getBody());
          responded_username = response.player.displayname;
          if(dont_return_out) {
            dont_return_out = names.includes(responded_username);
          }
          out = out + responded_username + ' joined ' + ((currentDate - members[i].joined)/ms_to_day).toFixed(2) + ' days ago.\n=====\n';
        }
      }
      if(!dont_return_out) {
        bot.sendMessage({
            to: channelID,
            message: out
        }, function(err, res) {
          if(err == "") {
            console.log(err);
          } else {
            fs.writeFileSync('messageID.txt', res.id);
          }
        });
      }
    });
  } else {
    for(i = 0; i < members.length; i++) {
      if(members[i].rank == 'Initiate' && ((currentDate - members[i].joined) > (ms_to_day*7))) {
        var playerUuid = members[i].uuid;
        var url = 'https://api.hypixel.net/player?key=' + apiKey + '&uuid=' + playerUuid;
        var response = JSON.parse(getJSON('GET', url).getBody());
        responded_username = response.player.displayname;
        out = out + responded_username + ' joined ' + ((currentDate - members[i].joined)/ms_to_day).toFixed(2) + ' days ago.\n=====\n';
      }
    }

    if(!dont_return_out) {
      bot.sendMessage({
          to: channelID,
          message: out
      }, function(err, res) {
        if(err == "") {
          console.log(err);
        } else {
          fs.writeFileSync('messageID.txt', res.id);
        }
      });
    }
  }
}
