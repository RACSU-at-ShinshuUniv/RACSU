/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import color from "../../src/color.json";

import React from 'react';
import ReactDOM from 'react-dom/client';

import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField';
import Switch, { SwitchProps } from '@mui/material/Switch';

import Loading from '../../src/component/Loading';
import StartAccountLinkModal from '../../src/component/StartAccountLinkModal';

import { IcalClient } from '../../src/modules/IcalClient';

const IOSSwitch = styled((props: SwitchProps) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 42,
  height: 26,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(16px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: theme.palette.mode === 'dark' ? '#2ECA45' : '#65C466',
        opacity: 1,
        border: 0,
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: '#33cf4d',
      border: '6px solid #fff',
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color:
        theme.palette.mode === 'light'
          ? theme.palette.grey[100]
          : theme.palette.grey[600],
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: theme.palette.mode === 'light' ? 0.7 : 0.3,
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 22,
    height: 22,
  },
  '& .MuiSwitch-track': {
    borderRadius: 26 / 2,
    backgroundColor: theme.palette.mode === 'light' ? '#E9E9EA' : '#39393D',
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500,
    }),
  },
}));


function SettingParagraph({title, description: description, children}: {title: string, description: React.ReactNode, children: React.ReactNode}) {
  const style = {
    title: css`
      font-size: 18px;
      margin-bottom: 10px;
    `
  }
  return(
    <Box marginTop="30px">
      <p css={style.title}>{title}</p>
      <Box marginLeft="15px">
        {children}
      </Box>
      <Box fontSize="13px" color={color.gray} marginTop="10px" marginLeft="15px">
        {description}
      </Box>
    </Box>
  )
}

function IcalUrlSection({type, title, initUrl, enableEdit, editHandler}: {type: "g" | "s", title: string, initUrl: string, enableEdit: boolean, editHandler: any}) {
  const style = {
    title: css`
      font-size: 15px;
      margin-right: 20px;
    `,

    textField: css`
      width: 400px;

      .MuiInputBase-root {
        padding: 6px;
      }

      textarea {
        font-size: 13px;
        line-height: 1.5em;
      }
    `
  };

  return (
    <Box display="flex" alignItems="center" marginBottom="10px">
      <p css={style.title}>{title}</p>
      <TextField
        css={style.textField}
        id="filled-multiline-static"
        multiline
        rows={4}
        disabled={!enableEdit}
        className='icalUrl'
        defaultValue={initUrl}
        onChange={(event) => {
          editHandler((initData: any) => {
            return {
              g: type == "g" ? event.target.value : initData?.g,
              s: type == "s" ? event.target.value : initData?.s
            };
          })
        }}
      />
    </Box>
  )
}

function App() {
  const style = {
    title: css`
      color: ${color.text};
      font-size: 24px;
      margin-left: 5px;
    `,

    button_edit: css`
      font-size: 13px;
      background-color: ${color.button.cancel};
      color: ${color.text.default};

      &:hover {
        background-color: ${color.button.cancel_hover};

      }
    `,

    button_start: css`
      font-size: 13px;
      background-color: ${color.button.ok};
      margin-left: 5px;

      &:hover {
        background-color: ${color.button.ok_hover};
      }
    `,

    display_title: css`
      font-size: 15px;
      margin-right: auto;
    `
  };

  const [openAutoSetting, setOpenAutoSetting] = React.useState(false);
  const [openInitAutoSetting, setOpenInitAutoSetting] = React.useState(false);
  const [openLoading, setOpenLoading] = React.useState(false);
  const [enableStatus, setEditStatus] = React.useState({enable: false, message: "URLを編集"});
  const [initUrl, setInitUrl] = React.useState({g: "", s: ""});
  const [moodleUrl, setMoodleUrl] = React.useState({g: "", s: ""});
  const [enableDisplay, setEnableDisplay] = React.useState(false);

  React.useEffect(() => {
    chrome.storage.sync.get().then(userConfig => {
      const moodleURL_g = userConfig.moodleGeneralId !== "" ? `https://lms.ealps.shinshu-u.ac.jp/${userConfig.accountExpiration}/g/calendar/export_execute.php?userid=${userConfig.moodleGeneralId}&authtoken=${userConfig.moodleGeneralToken}&preset_what=all&preset_time=recentupcoming` : "設定されていません";
      const moodleURL_s = userConfig.moodleSpecificId !== "" ? `https://lms.ealps.shinshu-u.ac.jp/${userConfig.accountExpiration}/${userConfig.userDepartment}/calendar/export_execute.php?userid=${userConfig.moodleSpecificId}&authtoken=${userConfig.moodleSpecificToken}&preset_what=all&preset_time=recentupcoming` : "設定されていません";

      setEnableDisplay(userConfig.displayList);
      setInitUrl({
        g: moodleURL_g,
        s: moodleURL_s
      });
      setMoodleUrl({
        g: moodleURL_g,
        s: moodleURL_s
      });

      if (userConfig.accountStatus == "installed") {
        setOpenInitAutoSetting(true);
      } else if (userConfig.accountStatus == "accountExpired"){
        setOpenAutoSetting(true);
      }
    });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.type == "setting" && message.status == "complete"){
        window.open("https://timetable.ealps.shinshu-u.ac.jp/portal/", "_blank");
        window.location.reload();
      }
    });
  }, []);

  const enableEditHandler = () => {
    if (enableStatus.enable) {
      setOpenLoading(true);
      const icalClient = new IcalClient(moodleUrl.g, moodleUrl.s);
      icalClient.isValidUrl().then(res => {
        if (res) {
          setEditStatus({
            enable: false,
            message: "URLを編集"
          });
        }
        setOpenLoading(false);
      })

    } else {
      setEditStatus({
        enable: true,
        message: "保存"
      });
    }
  };

  const enableDisplayHandler = () => {
    setEnableDisplay(initStatus => {
      chrome.storage.sync.set({
        displayList: !initStatus
      });
      return !initStatus
    })
  }

  return(
    <Box display="flex" alignItems="center" flexDirection="column">
      <Box display="flex" marginTop="50px" marginBottom="40px">
        <img width="35px" height="35px" src="/icon/icon48.png" alt="RACSU Logo" />
        <p css={style.title}>RACSU for eALPS 拡張機能オプション</p>
      </Box>
      <Box>
        <SettingParagraph title='eALPS連携設定' description={
          <>
            <p>RACSUは、eALPSが発行するカレンダー共有URLから課題を取得します。</p>
            <p>iCalendar形式のファイルが発行されるURLを設定してください。</p>
            <p>「自動設定を開始」ボタンより、カレンダー共有URLを自動取得できます。</p>
          </>
        }>
          <IcalUrlSection
            type='g'
            title='共通教育URL：'
            enableEdit={enableStatus.enable}
            initUrl={initUrl.g}
            editHandler={setMoodleUrl}
          />
          <IcalUrlSection
            type='s'
            title='専門教育URL：'
            enableEdit={enableStatus.enable}
            initUrl={initUrl.s}
            editHandler={setMoodleUrl}
          />
          <Box display="flex" marginLeft="auto" width="fit-content">
            <Button css={style.button_edit} variant="contained" onClick={enableEditHandler}>{enableStatus.message}</Button>
            <Button css={style.button_start} variant="contained" onClick={() => setOpenAutoSetting(true)}>自動設定を開始</Button>
          </Box>
        </SettingParagraph>

        <SettingParagraph title='課題表示設定' description={
          <p>有効にすると、eALPS時間割ページに課題一覧を表示します。</p>
        }>
          <Box display="flex" alignItems="center">
            <p css={style.display_title}>eALPSポータルでの課題リスト表示：</p>
            <IOSSwitch sx={{ m: 1, margin: "0" }} checked={enableDisplay} onChange={enableDisplayHandler}/>
          </Box>
        </SettingParagraph>
      </Box>

      <Loading isOpen={openLoading} message='連携情報を確認中'/>
      <StartAccountLinkModal
        modalIsOpen={openAutoSetting}
        modalHandler={setOpenAutoSetting}
        loadingHandler={setOpenLoading}
      />
      <StartAccountLinkModal
        modalIsOpen={openInitAutoSetting}
        modalHandler={setOpenInitAutoSetting}
        loadingHandler={setOpenLoading}
        enableClose={false}
        headerMessage='RACSUをインストールしていただきありがとうございます！'
      />
    </Box>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
