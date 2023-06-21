const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const serviceAccount = require('../keys/ServiceAccount.json');

initializeApp({credential: cert(serviceAccount)});

const firebase_write = require("../file_modules/firestore_write");
const firebase_read = require("../file_modules/firestore_read");

const test = async() => {
  console.log("A")
  return Promise.resolve("done A")

  // console.log("Error")
  // Promise.reject("error")

  console.log("B")
  return Promise.resolve("done B")
}

const main = async () => {
  await firebase_write.add_user({user_id:"test_line_id2", user_name:"べっちっち"});

  const user_data = await firebase_read.get_user_status({user_id:"test_line_id2"})
  console.log(user_data.user_name);
  console.log("all end")
}

// main().catch(err => console.error(err));

test().then((f) => {
  console.log(f)
}).catch(() => {
  console.log("error")
})