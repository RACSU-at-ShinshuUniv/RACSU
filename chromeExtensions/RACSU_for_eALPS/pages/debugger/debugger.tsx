/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import React from 'react';
import ReactDOM from 'react-dom/client';

import Box from '@mui/material/Box';
import dayjs from 'dayjs';

import env from "../../env.json"
import { IcalClient, getMoodleURL, icalDataProps } from '../../src/modules/IcalClient';
import { saveDataProps } from '../../src/modules/DataFormatter';

import Loading from '../../src/component/Loading';


function PrintJSON({jsonData}: {jsonData: {[id: string]: string | boolean | {}}}) {
  if (Object.keys(jsonData).length == 0) {
    return (
      <p>データなし</p>
    )

  } else {
    return (
      <>
        {Object.keys(jsonData).map(key => (
          <p key={key}>{key}: {String(jsonData[key])}</p>
        ))}
      </>
    )
  }
}

function PrintIcalData({icalData}: {icalData: icalDataProps}) {
  const today = new Date();
  const reactNodeList: React.ReactNode[] = [];
  const taskIds = Object.keys(icalData);

  taskIds.forEach(id => {
    const isUserEvent = (icalData[id].CATEGORIES !== undefined && icalData[id].CATEGORIES == "ユーザー登録イベント");
    const isValidSummary = (icalData[id].SUMMARY !== undefined && icalData[id].SUMMARY.match(new RegExp(env.regExpValidEvent)) !== null);
    const isValidLimit = (icalData[id].DTEND !== undefined && (((new Date(icalData[id].DTEND)).getTime() - today.getTime()) / 86400000) > -3);
    const display = ((isUserEvent || isValidSummary) && isValidLimit);
    const eventType = (() => {
      if (isUserEvent) {
        return "ユーザー登録イベント";
      } else if (isValidSummary) {
        return "有効イベント"
      } else {
        return "無効イベント"
      }
    })();

    reactNodeList.push(
      <Box key={id} css={css`margin: 5px 0; background-color: ${display ? "#e0fce7" : "#ff57572e"};`}>
        <p><b>ID</b>: {id}</p>
        <p><b>CATEGORIES:</b> {icalData[id]?.CATEGORIES}</p>
        <p><b>SUMMARY</b>: {icalData[id]?.SUMMARY}</p>
        <p><b>DESCRIPTION</b>: {icalData[id]?.DESCRIPTION}</p>
        <p><b>CLASS</b>: {icalData[id]?.CLASS}</p>
        <p><b>DTEND</b>: {dayjs(icalData[id]?.DTEND).format("YYYY/MM/DD HH:mm")}</p>
        <p><b>有効イベント判定</b>: {eventType}</p>
        <p><b>有効期限判定</b>: {isValidLimit ? "表示期限内" : "期限切れ"}</p>
      </Box>
    );
  });

  if (reactNodeList.length == 0) {
    reactNodeList.push(
      <p key="0">データなし</p>
    );
  }

  return (reactNodeList);
}

function PrintSaveData({ saveData }: {saveData: saveDataProps}) {
  const reactNodeList: React.ReactNode[] = [];
  const taskIds = Object.keys(saveData);

  taskIds.forEach(id => {
    reactNodeList.push(
      <Box key={id} css={css`margin: 5px 0; background-color: ${saveData[id].display ? "#e0fce7" : "#ff57572e"};`}>
        <p><b>ID</b>: {id}</p>
        <p><b>className:</b> {saveData[id].className}</p>
        <p><b>taskName</b>: {saveData[id].taskName}</p>
        <p><b>taskLimit</b>: {saveData[id].taskLimit?.fullDate} {saveData[id].taskLimit?.time}</p>
        <p><b>finish</b>: {String(saveData[id].finish)}</p>
      </Box>
    );
  });

  if (reactNodeList.length == 0) {
    reactNodeList.push(
      <p key="0">データなし</p>
    );
  }

  return (reactNodeList);
}

function Section({children}: {children: React.ReactNode | React.ReactNode[]}) {
  const style = css`
    border: 1px solid #000000;
    border-radius: 5px;
    padding: 5px 10px;
    margin: 10px 0;
    font-size: 16px;
    overflow-wrap: break-word;

    & h1 {
      font-size: 18px;
      font-weight: bold;
    }
  `;

  return (
    <Box css={style}>
      {children}
    </Box>
  );
}

function Debugger() {
  const [debugData, setDebugData] = React.useState({
    syncData: {},
    localData: {},
    classNameDict: {},
    moodleURL_g: "",
    moodleURLConnection_g: false,
    icalData_g: {},
    moodleURL_s: "",
    moodleURLConnection_s: false,
    icalData_s: {},
    saveData: {}
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async() => {
      const syncData = await chrome.storage.sync.get();
      const localData = await chrome.storage.local.get();
      const moodleURL = {
        g: getMoodleURL({
            accountExpiration: syncData.accountExpiration,
            userDepartment: "g",
            moodleId: syncData.moodleGeneralId,
            moodleToken: syncData.moodleGeneralToken
          }),
        s: getMoodleURL({
            accountExpiration: syncData.accountExpiration,
            userDepartment: syncData.userDepartment,
            moodleId: syncData.moodleSpecificId,
            moodleToken: syncData.moodleSpecificToken
          })
      };
      const icalClient_g = new IcalClient(moodleURL.g);
      const icalClient_s = new IcalClient(moodleURL.s);
      const moodleURLConnection_g = await icalClient_g.isValidUrl();
      const moodleURLConnection_s = await icalClient_s.isValidUrl();
      const icalData_g = await icalClient_g.getLatestContents();
      const icalData_s = await icalClient_s.getLatestContents();

      setDebugData({
        ...debugData,
        syncData: syncData,
        localData: localData,
        classNameDict: localData.classNameDict,
        moodleURL_g: moodleURL.g,
        moodleURLConnection_g: moodleURLConnection_g,
        icalData_g: icalData_g,
        moodleURL_s: moodleURL.s,
        moodleURLConnection_s: moodleURLConnection_s,
        icalData_s: icalData_s,
        saveData: localData.userTask
      });
      setLoading(false);
    })();
  }, []);

  return (
    <Box padding="10px 20px" fontSize="16px">
      <h1>RACSU for eALPS デバッグツール</h1>
      <p>本ツールが正しく課題データを取得できているかを確認するためのページです。</p>
      <p>バグの報告等は、このページのスクリーンショットを撮影して共有してください。</p>
      <p css={css`font-weight: bold;`}>※ 課題データ（URL1）と課題データ（URL2）で、課題提出期限が設定されているイベントであるのに無効イベントとして表示される場合は、以下までお知らせください。</p>
      <p css={css`font-weight: bold; margin-bottom: 5px;`}>お問い合わせ：racsu.shinshu-univ[at]gmail.com</p>
      <p>データ取得日時：{dayjs().format("YYYY/MM/DD HH:mm:ss")}</p>
      <Section>
        <h1>拡張機能同期データ</h1>
        <PrintJSON jsonData={debugData.syncData}/>
      </Section>
      <Section>
        <h1>拡張機能ローカルデータ</h1>
        <PrintJSON jsonData={debugData.localData} />
      </Section>
      <Section>
        <h1>講義名データ</h1>
        <PrintJSON jsonData={debugData.classNameDict} />
      </Section>
      <Section>
        <h1>データ取得先URL1</h1>
        <p>{debugData.moodleURL_g}</p>
      </Section>
      <Section>
        <h1>データ取得先URL1 接続状態</h1>
        <p>{debugData.moodleURLConnection_g ? "正常接続" : "接続できませんでした"}</p>
      </Section>
      <Section>
        <h1>データ取得先URL2</h1>
        <p>{debugData.moodleURL_s}</p>
      </Section>
      <Section>
        <h1>データ取得先URL2 接続状態</h1>
        <p>{debugData.moodleURLConnection_s ? "正常接続" : "接続できませんでした"}</p>
      </Section>
      <Section>
        <h1>課題データ（URL1）</h1>
        <PrintIcalData icalData={debugData.icalData_g} />
      </Section>
      <Section>
        <h1>課題データ（URL2）</h1>
        <PrintIcalData icalData={debugData.icalData_s} />
      </Section>
      <Section>
        <h1>課題データ（ローカル）</h1>
        <PrintSaveData saveData={debugData.saveData} />
      </Section>
      <Loading isOpen={loading} message='デバッグ情報を取得中'/>
    </Box>
  );
}


ReactDOM.createRoot(document.getElementById('root')!).render(
  <Debugger />
)