const {initializeApp, cert} = require("firebase-admin/app");

// --- 初期化処理 ---------------------------------------------
// firebaseクライアント
const serviceAccount = require("../keys/ServiceAccount.json");
initializeApp({credential: cert(serviceAccount)});

const firestore_write = require("../firestore_write");
const firestore_read = require("../firestore_read");
const { user } = require("firebase-functions/v1/auth");


const main = async() => {
    console.log("start");

    // const url = await firestore_read.get_cal_url({"user_id": "U991c6ebc40028a4c00636723d2ed1f70"})
    // await firestore_write.add_user({"user_id": "test", "user_name": "chun"})
    // console.log(url[0], "\n", url[1]);
    await firestore_write.add_class_name_data({class_code:"aiueo", class_name:"ゴミ術リテラシー"})
    console.log("all end");
}

main();

// const term = new Date();
// term.setMonth(term.getMonth()-3);

// console.log(term)