function doPost(e){
  const method = e.parameter.method;
  if (method == "auth"){
    const token = e.parameter.token;
    const address = e.parameter.address;
    try {
      send_auth_email(address, token);
      return ContentService.createTextOutput("Done");

    } catch(e) {
      return ContentService.createTextOutput("Can't send");
    }

  } else if (method == "notify"){
    const tasks_today = e.parameter.tasks_today;
    const others = e.parameter.others;
    const address = e.parameter.address;
    try {
      send_task_notify(address, tasks_today, others);
      return ContentService.createTextOutput("Done");

    } catch(e) {
      return ContentService.createTextOutput("Can't send");
    }

  }else {
    return ContentService.createTextOutput("Error");
  }
}

function send_auth_email(address, token){
  const title = "認証コードのお知らせ"
  const body = `\
ご利用いただきありがとうございます。
あなたの認証コードは「${token}」です。
上記の7桁の認証コードを、英字を含めてすべてコピーして、
LINEのメッセージとして送信してください。
この認証を依頼していない場合は、このメールを無視してください。

こちらのメールに返信しても対応できません。
ご連絡はこちら：
racsu.shinshu.univ+support@gmail.com

RACSU 運営`

  const options = {
    name: "RACSU 学生メール認証",
    from: 'racsu.shinshu.univ+auth@gmail.com',
    noReply: true
  };

  GmailApp.sendEmail(address, title, body, options);
}

function send_task_notify(address, tasks_today, others){
  // address = "21t2168a@shinshu-u.ac.jp"
  // others = 14
  // tasks_today = {
  //   '703': {
  //     task_name: '事前学習課題（以下に記載されている学習動画や実験資料をしっかり理解してから答えること）',
  //     task_limit_time: "24:00",
  //     class_name: '電気電子実験Ⅰ(16T以降)'
  //   },
  //   '704': {
  //     task_name: '事後課題',
  //     task_limit_time: "23:59",
  //     class_name: '電気電子実験Ⅰ(16T以降)'
  //   }
  // };
  const tasks_today_keys = Object.keys(tasks_today);


  const today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'MM/dd');
  const title = `【${today} 本日${tasks_today_keys.length}件 今後${others}件】未完了課題があります`
  const body = HtmlService.createHtmlOutputFromFile("temp").getContent();
  let content = "";
  tasks_today_keys.forEach((key) => {
    content +=
    `<tr>
        <td></td>
        <td>
            <p style="margin:0;font-size:14px;color:#ff4500;">${tasks_today[key].task_limit_time}</p>
        </td>
        <td style="color:#1c1c1c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:0;">
            ${tasks_today[key].class_name}
        </td>
        <td></td>
        <td align="right" style="color:#1c1c1c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:0;">
            ${tasks_today[key].task_name}
        </td>
    </tr>
    <tr><td colspan="6" height="6"></td></tr>
    <tr>
        <td></td>
        <td colspan="4" height="1" bgcolor="#eeeeee"></td>
        <td></td>
    </tr>
    <tr><td colspan="6" height="5"></td></tr>`;
  })

  const inserted_body = body.replace("<contents></contents>", content).replace(/\$1/g, tasks_today_keys.length).replace(/\$2/g, others).replace(/\$3/g, today);

  const options = {
    name: "RACSU 課題通知",
    from: 'racsu.shinshu.univ+notify@gmail.com',
    htmlBody: inserted_body,
    noReply: true
  };

  GmailApp.sendEmail(address, title, "htmlメールが表示できませんでした", options);
}