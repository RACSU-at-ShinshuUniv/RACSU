const axios = require('axios');

module.exports = async({code=""}) => {
  code = code.slice(0, 8).replace("Q", "G");
  const department = code.slice(0,1);
  const term = new Date();
  term.setMonth(term.getMonth()-3);
  const url = `https://campus-3.shinshu-u.ac.jp/syllabusj/Display?NENDO=${term.getFullYear()}&BUKYOKU=${department}&CODE=${code}`;

  try{
    console.time(`fetch time(${code})`);
    // const res = await axios.get(url, { timeout : 5000 });
    const res = await axios.get(url);
    console.timeEnd(`fetch time(${code})`);

    const name_a = res.data.replace(/\n|\r\n|\t| /g, "").match(/授業名<\/td><tdcolspan="7">(?<name>.*?)<\/td>/);
    const name_b = res.data.replace(/\n|\r\n|\t| /g, "").match(/科目名<\/td><tdcolspan="1">(?<name>.*?)<\/td>/);

    const name = (() => {
      if (name_a !== null && name_a.groups.name !== undefined){
        return name_a.groups.name;

      } else if (name_b !== null && name_b.groups.name !== undefined){
        return name_b.groups.name;

      } else {
        return "不明な授業";
      }
    })();

    return Promise.resolve(name);

  } catch(e) {
    return Promise.reject(e);
  }
}


