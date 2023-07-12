const Line_Sender = require("./line_sender");

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
      this.line_sender.text({
        message: `${event_data.message.text}を受け取りました。`
      });
    }
  }
}