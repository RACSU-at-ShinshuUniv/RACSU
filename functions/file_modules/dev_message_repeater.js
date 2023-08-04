const Line_Sender = require("./line_sender");
const firestore_read = require("./firestore_read");

exports.set_client = async({client=null, reply_token=""}) => {
  this.line_sender = new Line_Sender({
    client: client,
    reply_token: reply_token
  });
}

exports.handle = async({event_data=""}) => {
  if (event_data.type == "message"){
    // テキストメッセージのみ処理
    if (event_data.message.type == "text"){

      console.time('my-timer');

      const contents = await firestore_read.get_data({
        collection: "flex",
        doc: "U5a2991011c7a349ab5c5bebc4347cfb6"
      })

      console.timeEnd('my-timer');


      this.line_sender.flex_task_list({
        contents: contents.contents,
        alt_text: contents.alt_text
      });
    }
  }
}