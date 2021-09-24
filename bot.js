const { Client } = require('discord.js');
const { readFileSync } = require('fs');
const { retrieveAllTokensData, getTokenList, getAVAXValue, } = require('./src/graph.js');
const { ethers } = require('ethers');
const lodash = require('lodash');
const { Constants } = require('./src/resources.js');
const SUPPLY_ABI = `[{"type": "function","stateMutability": "view","payable": false,"outputs":`+
  `[{"type": "uint256","name": "","internalType": "uint256"}],"name": "totalSupply","inputs": [],`+
  `"constant": true}]`;

//Create instance of bot.
const client = new Client();
const provider = new ethers.providers.StaticJsonRpcProvider(Constants.RPCURL);


const enumStatus =  Object.freeze({
  price:0,
  mcap:1
});
var currentStatus = enumStatus.price;

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

  const sherpaContract = new ethers.Contract(Constants.SHERPAToken,SUPPLY_ABI,provider);
  const totalSupply = await sherpaContract.totalSupply()/1e18;

  const mcap = `Total Mcap $${((tokenPrice * totalSupply)/1_000_000).toFixed(2)}M`;

  let relevantInformation;
  switch(currentStatus){
    case enumStatus.price:
      relevantInformation = `SHERPA $${tokenPrice}`;
      currentStatus = enumStatus.mcap;
    break;
    case enumStatus.mcap:
      relevantInformation = mcap;
      currentStatus = enumStatus.price;
    break;
  }
  client.user.setPresence({
    status: 'online',
    activity: {
      name: `${relevantInformation}`,
      type: "PLAYING"
    }
  });
}


