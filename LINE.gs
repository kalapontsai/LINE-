// 20181204 revision init
// 20210616 revised
//LINE ID:@***

function doGet(e) {
  return ContentService.createTextOutput(UrlFetchApp.fetch("http://ip-api.com/json"));
}

function doPost(e) {
  var CHANNEL_ACCESS_TOKEN = '***get token from LINE development***';
  var msg = JSON.parse(e.postData.contents);
  Logger.log(msg);

  // 取出 replayToken 和發送的訊息文字
  var replyToken = msg.events[0].replyToken;
  var userMessage = msg.events[0].message.text;
  var reply_Txt = ProcMsg(msg.events[0].message);
  if (reply_Txt == ''){
    return;
  }

  if (typeof replyToken === 'undefined') {
    return;
  }

  var url = 'https://api.line.me/v2/bot/message/reply';
  
  UrlFetchApp.fetch(url, {
      'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': replyToken,
      'messages': [{
        'type': 'text',
        'text': reply_Txt ,
      }],
    }),
  });
}

function ProcMsg(message)
{ var type = message.type;
  var retMsg;
  var feed_txt = '';
  Logger.log(message);
  switch(type)
  {
    case 'text':
      var cmd1 = String(message.text.split(' ')[0]);
      var cmd2 = String(message.text.split(' ')[1]);
      if ((cmd1 == 'id' ) && (cmd2 != 'undefined'))
      {
        feed_txt = phone(cmd2);
      }
      else if (cmd1 == 'roll')
      {
        var rollLimit = 100;
        if (new RegExp("^[0-9]*$").test(cmd2))
          {
            rollLimit = cmd2;
          }
        feed_txt = Math.floor(Math.random() * rollLimit);
      }
      else if (cmd1 == '天氣')
      {
        feed_txt = Weather();
      }
      else if (cmd1 == 'st')
      {
        feed_txt = Stock(cmd2);
      }
      else if (cmd1 == 'AQI')
      {
        var check_code = (new RegExp("^[\\u4e00-\\u9fa5]{2}$")).test(cmd2);
        if (check_code)
        {
          var result = get_AQI(cmd2);
          if (result){
            var emoji = '😊';
            if (result[3] >= 100)
            {
              emoji = '😷';
            }
            feed_txt = result[0] + ':\r\n狀態 : ' + result[1] + emoji + '\r\n污染物 : ' + result[2] + '\r\nAQI : ' + result[3] + '\r\nPM2.5 : ' + result[4] + '\r\nPM10 : ' + result[5];
          }
        }
      }
    break;
    case 'image':
         retMsg = {
           'type': type,
         };
    break;
    case 'sticker':
         retMsg = {
           'type': type,
           'packageId': message.packageId,
           'stickerId': message.stickerId            
         };
    break;   
  }
  Logger.log(feed_txt);
  return feed_txt;
}

function phone(key) 
{
  var phone_sheet_url = 'https://docs.google.com/spreadsheets/d/*** auth code ***/edit?usp=sharing';
  //debug
  key ='xxx';
  //debug
  var result = '';
  var Sheet = SpreadsheetApp.openByUrl(phone_sheet_url);
  var St = Sheet.getSheets()[0];

  //startRow、startColumn、numRows 和 numColumns
  var NameList = Array(St.getSheetValues(2,1,St.getLastRow(),5));
  //Logger.log(St.getLastRow());
  for (var i = 0;i < St.getLastRow(); i++)
  {
    if (NameList[0][i][0] == key)
    {
      Logger.log(NameList[0][i]);
      result = NameList[0][i];
      break;
    }
  }
  if (result == ''){
    result = 'NA';
  }
  return result;
}

function get_AQI(locate){
  //空氣品質指標(AQI)」opendata下載路徑 https://data.gov.tw/dataset/40448
  //debug
  //locate = "士林";
  //debug
  var AQI_url = 'https://data.epa.gov.tw/api/v1/aqx_p_432?limit=1000&api_key=9be7b239-557b-4c10-9775-78cadfc555e9&sort=ImportDate%20desc&format=json';
  var response = UrlFetchApp.fetch(AQI_url, {'muteHttpExceptions': true});
  var AQI_row = JSON.parse(response);
  //Logger.log(AQI_row.records[2].SiteName);
  //Logger.log(AQI_row.records.length)
  for (var i=0;i<AQI_row.records.length;i++)
  {
    if (AQI_row.records[i].SiteName === locate) {
      return [AQI_row.records[i]['SiteName'],AQI_row.records[i]['Status'],AQI_row.records[i]['Pollutant'],AQI_row.records[i]['AQI'],AQI_row.records[i]['PM2.5'],AQI_row.records[i]['PM10']];
    }
  }
  return false;
}
function Weather(){
  //一般天氣預報-台南市天氣小幫手 https://data.gov.tw/dataset/9229
  var W_url = 'https://opendata.cwb.gov.tw/fileapi/v1/opendataapi/F-C0032-016?Authorization=rdec-key-123-45678-011121314&format=JSON';
  var response = UrlFetchApp.fetch(W_url, {'muteHttpExceptions': true});
  var W_row = JSON.parse(response);
  var parameterValue = W_row.cwbopendata.dataset.parameterSet.parameter;
  var p_Result = '';
  //Logger.log(W_row.cwbopendata.dataset.parameterSet.parameter);
  if (parameterValue.length > 0)
  {
    for (var i=1;i<parameterValue.length-2;i++)
      {
        p_Result += parameterValue[i].parameterValue ;
      }
    return p_Result;
  }
  Logger.log(p_Result);
  return false;
}

function Stock(id){
  //股市即時資訊
  var timestamp = Date.now();
  if ((parseInt(id)*10) != (id*10))
  {
  id = '2330';
  }
  var stockInfoUrl = "http://mis.twse.com.tw/stock/api/getStockInfo.jsp?json=1&_="+timestamp+"&ex_ch=tse_"+id+".tw"
  Logger.log(stockInfoUrl);
  //var response = UrlFetchApp.fetch(stockInfoUrl, {'muteHttpExceptions': true});
  var response = UrlFetchApp.fetch(stockInfoUrl);
  if (response.getContent().length > 0)
  {
    var T_row = JSON.parse(response);
    Logger.log(T_row.msgArray[0]);
    // if (T_row.msgArray[0].c == id)
    // { 
    const Price = T_row.msgArray[0].y;
    var Decim = 0;
    var Decimal = 0;
    if (Price < 50)
    {
      Decim = 100;
      Decimal = 2;
    }
    else if (Price < 500)
    {
      Decim = 10;
      Decimal = 1;
    }
    else
    {
      Decim = 1;
      Decimal = 0;
    }
    var tmp = '代號:' + id + '\r\n';
    tmp += '公司:' + T_row.msgArray[0].n + '\r\n';
    tmp += '昨收:' + Math.round(T_row.msgArray[0].y * Decim) / Decim + '\r\n';
    //tmp += '昨收:' + parseInt(T_row.msgArray[0].y) + '\r\n';
    tmp += '開盤:' + Math.round(T_row.msgArray[0].o * Decim) / Decim + '\r\n';
    tmp += '最高:' + Math.round(T_row.msgArray[0].h * Decim) / Decim + '\r\n';
    tmp += '最低:' + Math.round(T_row.msgArray[0].l * Decim) / Decim + '\r\n';
    if (T_row.msgArray[0].z == "-"){
      // var a = Math.round(T_row.msgArray[0].a.split('_')[0] * Decim) / Decim;
      // var b = Math.round(T_row.msgArray[0].b.split('_')[0] * Decim) / Decim;
      var a = ((10000 * T_row.msgArray[0].a.split('_')[0])/10000).toFixed(Decimal);
      var b = ((10000 * T_row.msgArray[0].a.split('_')[0])/10000).toFixed(Decimal);
      tmp += '成交:' + a + '*' + b;
    }
    else {
      // tmp += '成交:' + (Math.round(T_row.msgArray[0].z * Decim) / Decim) ;
      tmp += '成交:' + ((10000 * T_row.msgArray[0].z)/10000).toFixed(Decimal) ;
    }
    Logger.log(tmp);
    return tmp;
    // }
  }
  Logger.log("Fetch fail");
  return false;
}
