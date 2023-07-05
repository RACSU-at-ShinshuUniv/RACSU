const request = require('request');

module.exports = ({code=""}) => {
  code = code.slice(0, 8).replace("Q", "G");
  const department = code.slice(0,1)
  const term = new Date();
  term.setMonth(term.getMonth()-3);
  const url = `https://campus-3.shinshu-u.ac.jp/syllabusj/Display?NENDO=${term.getFullYear()}&BUKYOKU=${department}&CODE=${code}`;

  return new Promise((resolve, reject) => {
    request({
      url: url,
      method: 'GET'
    }, (error, response, body) => {
      if (error){
        reject(new Error("Cannot get data"));

      } else {
        const name_a = body.replace(/\n|\r\n|\t| /g, "").match(/授業名<\/td><tdcolspan="7">(?<name>.*?)<\/td>/);
        const name_b = body.replace(/\n|\r\n|\t| /g, "").match(/科目名<\/td><tdcolspan="1">(?<name>.*?)<\/td>/);

        const name = (() => {
          if (name_a !== null && name_a.groups.name !== undefined){
            return name_a.groups.name

          } else if (name_b !== null && name_b.groups.name !== undefined){
            return name_b.groups.name

          } else {
            return "不明な授業"
          }
        })();

        resolve(name);
      }
    });
  });
}


