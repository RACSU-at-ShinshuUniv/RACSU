const axios = require('axios');
const gas = require("../keys/GASUrl.json")

module.exports = async({data={}}) => {
  try {
    const response = await axios.post(gas.url, data);
    return Promise.resolve(response.data);
  } catch (error) {
    return Promise.reject(error.message);
  }
}