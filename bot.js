var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var getJSON = require('sync-request');
var fs = require('fs');
require('.');

var homeDir = '/home/pi/.discord/lxt_bot/';

var commandsHypixel = ["initiateping", "verify", "ping"],
commandsWynn = ["chiefvote", "ping"],
initiatePing,
apiKey = '1e77bbdd-5969-4d8a-8a4d-43092b6471f8',
guildId = '5e58976f8ea8c9832198e154',
ms_to_day = 86400000;

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', reason.stack || reason)
});

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
bot.on('guildMemberAdd', function(member) {
  if(member.guild_id == '685284276362543115') {
    var usersArray = Object.values(bot.users);
    if(usersArray.find(usersArray => usersArray.id === member.id).bot == false) {
      bot.addToRole({
        serverID: member.guild_id,
        userID: member.id,
        roleID: '685302841224855572' //Normies
      });
      bot.addToRole({
        serverID: member.guild_id,
        userID: member.id,
        roleID: '685303000381915175' //Guest
      });
    } else {
      bot.addToRole({
        serverID: member.guild_id,
        userID: member.id,
        roleID: '685635246628012043' //Bot
      });
      bot.addToRole({
        serverID: member.guild_id,
        userID: member.id,
        roleID: '685637329725030400' //Robo Normies
      });
    }
  }
});
bot.on('message', async function (user, userID, channelID, message, evt) {

    var serverID = evt.d.guild_id;

    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '&') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        var cmd2 = args[1];

        //args = args.splice(1);
        switch(cmd) {
            // &initiateping <start|stop> [685284276362543115]
            case 'initiateping':
              if(serverID == '685284276362543115') {
                if (cmd2 == 'start') {
                  initiatePing = setInterval(initiate_ping, 60000, channelID);
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

            // &verify <discordtag> [685284276362543115]
            case 'verify':
              if(serverID == '685284276362543115') {
                temp = args;
                temp.shift();
                cmd2 = temp.join(' ');
                console.log(cmd2);
                if(cmd2 == null) {
                  bot.sendMessage({
                      to: channelID,
                      message: 'wrong usage, try: &verify <discordtag#number>'
                  });
                } else {
                  var discordtag = cmd2.split("#");
                  cmd2 = discordtag[0] + "#" + discordtag[1];
                  var usersArray = Object.values(bot.users);
                  if(usersArray.find(usersArray => usersArray.username === discordtag[0] && usersArray.discriminator == discordtag[1]) != undefined) {
                    if(usersArray.find(usersArray => usersArray.username === discordtag[0] && usersArray.discriminator == discordtag[1]).bot == true) {
                      bot.sendMessage({
                        to: channelID,
                        message: cmd2 + " is a bot!"
                      });
                    } else {
                      var userIdFromDisctag = usersArray.find(usersArray => usersArray.username === discordtag[0] && usersArray.discriminator == discordtag[1]).id;
                      bot.addToRole({
                        serverID: '685284276362543115',
                        userID: userIdFromDisctag,
                        roleID: '685302948095328268' //friend
                      });
                      await Sleep(1000);
                      bot.addToRole({
                        serverID: '685284276362543115',
                        userID: userIdFromDisctag,
                        roleID: '685290524747235338' //members
                      });
                      await Sleep(1000);
                      bot.addToRole({
                        serverID: '685284276362543115',
                        userID: userIdFromDisctag,
                        roleID: '685290389413822540' //initiate
                      });
                      await Sleep(1000);
                      bot.addToRole({
                        serverID: '685284276362543115',
                        userID: userIdFromDisctag,
                        roleID: '685303138986885203' //ranks
                      });
                      await Sleep(1000);
                      bot.addToRole({
                        serverID: '685284276362543115',
                        userID: userIdFromDisctag,
                        roleID: '685303870896734208' //bronze
                      });
                      await Sleep(1000);
                      bot.removeFromRole({
                        serverID: '685284276362543115',
                        userID: userIdFromDisctag,
                        roleID: '685303000381915175' //guest
                      });
                      await Sleep(1000);
                      bot.sendMessage({
                        to: channelID,
                        message: cmd2 + " verified!"
                      });
                    }
                  } else {
                    bot.sendMessage({
                      to: channelID,
                      message: "User " + cmd2 + " not found!"
                    });
                  }
                }
              } else {
                bot.sendMessage({
                    to: channelID,
                    message: 'this command is not meant for this server!'
                });
              }
            break;

            // &chiefvote <votemessage> [627293915501953024]
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

            case 'ping':
              bot.sendMessage({
                to: channelID,
                message: 'pong'
              })
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
  try {
    var responseOuter = JSON.parse(getJSON('GET', urlOuter).getBody());
    var members = responseOuter.guild.members;
    var responded_username;
    var out = '',
    out2 = '',
    dont_return_out = false;
    var previousOut;
    var messageID = fs.readFileSync(homeDir + 'messageID.txt', 'utf8');

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
          if(members[i].rank == 'Initiate') {
            var playerUuid = members[i].uuid;
            var url = 'https://api.hypixel.net/player?key=' + apiKey + '&uuid=' + playerUuid;
            var response = JSON.parse(getJSON('GET', url).getBody());
            responded_username = response.player.displayname;
            if((currentDate - members[i].joined) > (ms_to_day*7)) {
              if(dont_return_out) {
                dont_return_out = names.includes(responded_username);
              }
              out = out + responded_username + ' joined ' + ((currentDate - members[i].joined)/ms_to_day).toFixed(2) + ' days ago.\n=====\n';
              out2 = out2 + members[i].uuid + ' joined ' + ((currentDate - members[i].joined)/ms_to_day).toFixed(2) + ' days ago.\n=====\n';
            } else {
              out2 = out2 + members[i].uuid + ' joined ' + ((currentDate - members[i].joined)/ms_to_day).toFixed(2) + ' days ago.\n=====\n';
            }
          }
        }
        if(Math.round(Date.now()/1000) % Math.round(ms_to_day/1000) == 0) {
          console.log(Date(Date.now().toString()));
          console.log(out2);
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
        if(members[i].rank == 'Initiate') {
          var playerUuid = members[i].uuid;
          var url = 'https://api.hypixel.net/player?key=' + apiKey + '&uuid=' + playerUuid;
          var response = JSON.parse(getJSON('GET', url).getBody());
          responded_username = response.player.displayname;
          if((currentDate - members[i].joined) > (ms_to_day*7)) {
            out = out + responded_username + ' joined ' + ((currentDate - members[i].joined)/ms_to_day).toFixed(2) + ' days ago.\n=====\n';
            out2 = out2 + members[i].uuid + ' joined ' + ((currentDate - members[i].joined)/ms_to_day).toFixed(2) + ' days ago.\n=====\n';
          } else {
            out2 = out2 + members[i].uuid + ' joined ' + ((currentDate - members[i].joined)/ms_to_day).toFixed(2) + ' days ago.\n=====\n';
          }
        }
      }
      if(Math.round(Date.now()/1000) % Math.round(ms_to_day/1000) == 0) {
        console.log(Date(Date.now().toString()));
        console.log(out2);
      }
      if(!dont_return_out) {
        bot.sendMessage({
          to: channelID,
          message: out
        }, function(err, res) {
          if(err == "") {
            console.log(err);
          } else {
            fs.writeFileSync(homeDir + 'messageID.txt', res.id);
          }
        });
      }
    }
  } catch(err) {
    console.log(err);
  }
}

function Sleep(milliseconds) {
   return new Promise(resolve => setTimeout(resolve, milliseconds));
}
