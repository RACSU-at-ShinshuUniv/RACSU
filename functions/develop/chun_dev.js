const {initializeApp, cert} = require("firebase-admin/app");

// --- 初期化処理 ---------------------------------------------
// firebaseクライアント
const serviceAccount = require("../keys/ServiceAccount.json");
initializeApp({credential: cert(serviceAccount)});

const firestore_write = require("../firestore_write");


const main = async() => {
    console.log("start");

    await firestore_write.delete_user({"user_id": "chun_test"})
    .then(() => {
        console.log("add user end");
    })

    console.log("all end");
}

main();