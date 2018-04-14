var http = require('http');
var https = require('https');
const Discord = require('discord.js');
const Client = require('node-rest-client').Client;
const rp = require('request-promise');
const bot = new Discord.Client();
const api = new Client();

TEST_MODE = false;

// Just run a little http page
var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(process.env.PORT || 8080);
console.log('HTTP Server running & listening...');

/**
 * Rich embed discord
 * @type {Discord}
 */
const makeEmbed = (title, message, elements = []) => {
  const embed = new Discord.RichEmbed()
    .setTitle(`${title}`)
    // .setAuthor('CryptoBot', 'http://kedu.fr/image.png')
    .setColor(0x4671ed)
    .setDescription(message)
    .setTimestamp()
    .setFooter('-- to the moon');

    if (elements.length > 0) {
      elements.forEach((obj, i) => {
        embed.addField(obj.title, obj.value, true)
      });
    }
  return embed;
};

bot.on('ready', () => {
  console.log('Discord Bot is running...');
});

bot.on('message', message => {
  const user = message.author;
  const msg = message.content;

  if (message.content === 'ping') {
    message.reply('pong');
  }

  console.log(`--> Request from ${user.username} in ${message.channel.name}`);
  if (user.username == 'duke') {
    const regCommand = new RegExp(/https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/ig);
    const matchcommands = msg.match(regCommand);

    // There is an url
    if (matchcommands.length > 0) {      
      var matches = matchcommands[0].match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
      var domain = matches && matches[1].replace('www.', '');
      
      // Tradingview ?
      if (domain === 'tradingview.com') {
        // message.channel.send(msg);
        message.guild.channels.find('name', 'test').sendMessage(msg);
      }
    }

  }
});

bot.login(process.env.DISCORDBOT);

// pings server every 15 minutes to prevent dynos from sleeping
setInterval(() => {
  if (!TEST_MODE) {
    https.get('https://discordbot-pro.herokuapp.com/');
  }
}, 900000);
