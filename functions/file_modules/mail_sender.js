const request = require('request');
const gas = require("../keys/GASUrl.json")

module.exports = async({method="", data={}}) => {
  return new Promise((resolve, reject) => {
    if (method == "auth"){
      request({
        url: gas.url,
        method: 'POST',
        followAllRedirects: true,
        form: data
      }, (error, response, body) => {
        if (error){
          reject(new Error("Cannot send gmail"));
        } else {
          resolve(body);
        }
      });
    }
  });
}

