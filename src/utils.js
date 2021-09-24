const { commandList } = require('./resources.js');
const { MessageEmbed } = require('discord.js');
const { getTokenList } = require('./graph.js');
const StringMask = require('string-mask');
const lodash = require('lodash');

const cooldownSet = new Set();

function prettyFormat(nb) {
  nb = nb * 1;
  nb = nb.toFixed(2);
  var formatter = new StringMask('#.##0,00', { reverse: true });
  nb = (nb.toString()).replace(/\D/g, ""); //get rid of the formatting
  return formatter.apply(nb);
}

function formatCurrency(nb) {

  let value = nb > 0.01 ? prettyFormat(nb) : nb > 0.000001 ? Number(nb).toFixed(6) : Number(nb).toExponential(6);

  return `$${value}`;
}

class APYMath {
  /*
      dayInterest= interest in %
      reinvestDay= daily compounds
      fee= performance fee in %
  */
  static APRToAPY(interest, reinvestsPeriod, fee, period = 1) {
    let reinvests = reinvestsPeriod * period;
    //takeout performance fee and turn to decimal
    interest = (interest - ((interest / 100) * fee)) / 100;
    let APY = (Math.pow((1 + interest / reinvests), reinvests) - 1) * 100;
    return APY;
  }
}

//Function for checking if the command is valid
function checkCommand(str) {
  hasCommand = false;
  let reportedCommand = '';
  let args = '';
  //For every command in commandList
  commandList.every(function (element, index) {
    hasCommand = (element == str.substring(0, element.length));
    args = str.substring(element.length);
    if (hasCommand) {
      reportedCommand = element;
      return false;
    }
    else return true
  })

  //Return if the command is valid, the command and their args
  return {
    ValidCommand: hasCommand,
    ReportedCommand: reportedCommand,
    Args: args
  };
}

//Filter existing tokens
function filterToken(args) {
  let list = getTokenList();

  //Correct Wrapped Names
  if (args == "AVAX") {
    args = "WAVAX"
  }
  if (args == "BTC") {
    args = "WBTC"
  }

  //filter list by symbol, then name, then id
  let filteredResult = lodash.filter(list, { "symbol": args });
  if (filteredResult.length == 0) {
    filteredResult = lodash.filter(list, { "name": args });
  }
  if (filteredResult.length == 0) {
    filteredResult = lodash.filter(list, function (o) { return o.id.toLowerCase() == args.toLowerCase(); });
  }

  return filteredResult;
}

//Cooldown function, stores in memory the cooldown timer, takes settings.json timeout
function checkCooldown(msg, command, cooldownMessage) {
  if (cooldownSet.has(msg.author.id + command)) {
    msg.channel.send('This command is in cooldown, wait a little.').then(message =>
      message.delete({ timeout: cooldownMessage }));
    return false;
  } else {
    cooldownSet.add(msg.author.id + command);
    setTimeout(() => {
      cooldownSet.delete(msg.author.id + command);
    }, cooldownMessage + 1000);
    return true;
  }
}

function makeEmbed(embedObject) {
  let embed = new MessageEmbed()
    // Set the title of the field
    .setTitle(embedObject.Title)
    // Set the color of the embed
    .setColor(embedObject.Color)
    // Put timestamp in the footer
    .setTimestamp()
    // Set the main content of the embed
    .setDescription(embedObject.Description);
  //Lookup for fields
  if (embedObject.Fields != undefined) {
    embed.addFields(embedObject.Fields);
  };
  if (embedObject.Thumbnail != undefined) {
    embed.setThumbnail(embedObject.Thumbnail);
  };
  if (embedObject.Footer != undefined) {
    embed.setFooter(embedObject.Footer);
  }
  if (embedObject.URL != undefined) {
    embed.setURL(embedObject.URL);
  }

  return embed;
}

module.exports = {
  checkCommand: checkCommand,
  checkCooldown: checkCooldown,
  makeEmbed: makeEmbed,
  filterToken: filterToken,
  formatCurrency: formatCurrency,
  APYMath: APYMath
}