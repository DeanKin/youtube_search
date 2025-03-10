require('dotenv').config({ path: '.env.local' });

const sendEmail = require('./api/sendemail/sendEmail');

const KEYW = process.env.SEARCH_KEYWORDS
console.log(`KEYW: ${KEYW}`)


// Sample usage
sendEmail({
    receiverEmail: "deanltk@hku.hk",
    templateId: "4262396",
    systemId: "YOUTUBE_ALERT",
    substitutionVars: {
        '[CUSTOMFIELD1]': 'Testing2025-02-12',
        '[CUSTOMFIELD2]': '2025-02-27',
        '[CUSTOMFIELD4]': KEYW,
        '[CUSTOMFIELD3]': `1. Title: 香港二月份 流感數字持續攀升 請繼續關注 快測有助對症下藥 #曾祈殷醫生 感染及傳染病科專科 - 鄭丹瑞《健康旦》(CC中文字幕)&lt;br/&gt;
   &nbsp;&nbsp;&nbsp;URL: https://www.youtube.com/watch?v=IvLBv3T25ZQ &lt;br/&gt;
   &nbsp;&nbsp;&nbsp;Published: February 11, 2025 at 02:30 AM UTC &lt;br/&gt;
   &nbsp;&nbsp;&nbsp;Channel: 健康旦 HiEggo &lt;br/&gt;
   &nbsp;&nbsp;&nbsp;Description: 今集請來感染及傳染病科專科醫生曾祈恩醫生，曾醫生會分享臨床真實個案接種疫苗的正面效果，亦會教大家用多合一快速測試棒的 ...... &lt;br/&gt; &lt;br/&gt;
   Description: 今集嘉賓請來Joanna 澳洲註冊營養師及Paully養生專家同旦哥傾吓偈。 長者因年齡增長、患病、體弱無胃口等因素，容易引致營養 ......&lt;br/&gt;&lt;br/&gt;`
    },
    cc: ["kenneth8@hku.hk", "jatsang@hku.hk"],
    
    language: 'zh-hk'
})
.then(console.log)
.catch(console.error);