const Discord = require('discord.js');
const Client = require('node-rest-client').Client;
const rp = require('request-promise');
const bot = new Discord.Client();
const api = new Client();

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
const makeEmbed = (title, desc, elements = []) => {
  const embed = new Discord.RichEmbed()
    .setTitle(`${title}`)
    // .setAuthor('CryptoBot', 'http://www.scpc.org.au/wp-content/uploads/2016/10/rocketkid-1024x682.jpg')
    .setColor(0x4671ed)
    .setDescription(desc)
    .setTimestamp()
    .setFooter('-- to the moon');

    elements.forEach((obj, i) => {
      embed.addField(obj.title, obj.value, true)
      if ((i+=1) < elements.length) {
        // embed.addBlankField(true);
      }
    });
  return embed;
};

bot.on('ready', () => {
  console.log('Discord Bot is running...');
});

bot.on('message', message => {
  const user = message.author;

  if (message.content === 'ping') {
    message.reply('pong');
  }
  const msg = message.content;

  console.log(`--> Request from ${user.username}`);
});

bot.login(process.env.DISCORDBOT);
