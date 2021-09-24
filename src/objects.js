const { makeEmbed } = require('./utils.js');

module.exports = {
  CommandRunner: class {
    constructor(msg) {
      this.embed = undefined;
      this.msg = msg;

      this.sendMessage = function () {
        if (this.embed == undefined) {
          console.log('Invalid Embed.');
          return;
        }

        msg.channel.send(makeEmbed(this.embed));
      }
    }
  }

}