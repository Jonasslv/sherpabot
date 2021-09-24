const { Client } = require('discord.js');
const { readFileSync } = require('fs');
const { checkCommand } = require('./src/utils.js');
const { retrieveAllTokensData, getTokenList, getAVAXValue, } = require('./src/graph.js');
const lodash = require('lodash');

//Create instance of bot.
const client = new Client();

//Sync read to wait for settings
var settings = JSON.parse(readFileSync('./settings.json'));
console.log('Settings loaded!');
const botPrefix = settings.botprefix;

//Login with set token ID
client.login(settings.tokenid);

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  //Create timer to refresh tokens data
  retrieveAllTokensData(client).then(async () => {
    await refreshSherpaData(client);
    console.log('Tokens loaded!');
  });
  setInterval(retrieveAllTokensData, settings.refreshTokenList, client); //give time to refresh tokendata
  setInterval(refreshSherpaData, settings.refreshTokenList + 30000, client); //give time to refresh tokendata
});

async function refreshSherpaData(client) {
  //update bot presence
  const filteredResult = lodash.filter(getTokenList(), { "symbol": "SHERPA" });
  const orderedResult = lodash.orderBy(filteredResult, ["totalLiquidity", "tradeVolume"], ['desc', 'desc']);
  const tokenPrice = (getAVAXValue() * orderedResult[0].derivedETH).toFixed(2);

  client.user.setPresence({
    status: 'online',
    activity: {
      name: `SHERPA $${tokenPrice}`,
      type: "PLAYING"
    }
  });
}


