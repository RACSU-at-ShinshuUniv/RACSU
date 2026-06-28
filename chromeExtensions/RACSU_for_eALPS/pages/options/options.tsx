/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import env from "../../env.json";

import React from "react";
import ReactDOM from "react-dom/client";

import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Switch, { SwitchProps } from "@mui/material/Switch";

import Loading from "../../src/component/Loading";
import StartAccountLinkModal from "../../src/component/StartAccountLinkModal";
import LaunchIcon from "@mui/icons-material/Launch";

import {
  IcalClient,
  getAccountParams,
  getMoodleURL,
} from "../../src/modules/IcalClient";

// import { GASend } from "../../src/modules/googleAnalytics";
import { syncStorageDataProps } from "../../src/background";
import UserDataDeleteConfirmModal from "../../src/component/UserDataDeleteConfirmModal";
// GASend("pageOpen", "options");

const IOSSwitch = styled((props: SwitchProps) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 42,
  height: 26,
  padding: 0,
  "& .MuiSwitch-switchBase": {
    padding: 0,
    margin: 2,
    transitionDuration: "300ms",
    "&.Mui-checked": {
      transform: "translateX(16px)",
      color: "#fff",
      "& + .MuiSwitch-track": {
        backgroundColor: theme.palette.mode === "dark" ? "#2ECA45" : "#65C466",
        opacity: 1,
        border: 0,
      },
      "&.Mui-disabled + .MuiSwitch-track": {
        opacity: 0.5,
      },
    },
    "&.Mui-focusVisible .MuiSwitch-thumb": {
      color: "#33cf4d",
      border: "6px solid #fff",
    },
    "&.Mui-disabled .MuiSwitch-thumb": {
      color:
        theme.palette.mode === "light"
          ? theme.palette.grey[100]
          : theme.palette.grey[600],
    },
    "&.Mui-disabled + .MuiSwitch-track": {
      opacity: theme.palette.mode === "light" ? 0.7 : 0.3,
    },
  },
  "& .MuiSwitch-thumb": {
    boxSizing: "border-box",
    width: 22,
    height: 22,
  },
  "& .MuiSwitch-track": {
    borderRadius: 26 / 2,
    backgroundColor: theme.palette.mode === "light" ? "#E9E9EA" : "#39393D",
    opacity: 1,
    transition: theme.transitions.create(["background-color"], {
      duration: 500,
    }),
  },
}));

function SettingParagraph({
  title,
  description: description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  const style = {
    section: css`
      padding: 24px;
      border-bottom: 1px solid #e4e8ef;

      &:last-of-type {
        border-bottom: none;
      }
    `,
    title: css`
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 16px;
    `,
    contents: css`
      margin-left: 0;
    `,
    description: css`
      color: ${env.color.gray};
      font-size: 13px;
      line-height: 1.7;
      margin-top: 12px;
      margin-left: 0;
    `,
  };
  return (
    <Box css={style.section}>
      <p css={style.title}>{title}</p>
      <Box css={style.contents}>{children}</Box>
      {description !== undefined && (
        <Box css={style.description}>{description}</Box>
      )}
    </Box>
  );
}

function IcalUrlSection({
  type,
  title,
  initUrl,
  enableEdit,
  editHandler,
}: {
  type: "g" | "s";
  title: string;
  initUrl: string;
  enableEdit: boolean;
  editHandler: any;
}) {
  const style = {
    row: css`
      gap: 16px;
      margin-bottom: 12px;
    `,
    title: css`
      width: 140px;
      flex-shrink: 0;
      font-size: 15px;
      margin: 0;
    `,

    textField: css`
      width: min(520px, 100%);

      .MuiInputBase-root {
        padding: 6px;
      }

      textarea {
        font-size: 13px;
        line-height: 1.5em;
      }
    `,
  };

  return (
    <Box css={style.row} display="flex" alignItems="center">
      <p css={style.title}>{title}</p>
      <TextField
        css={style.textField}
        id="filled-multiline-static"
        multiline
        rows={4}
        disabled={!enableEdit}
        className="icalUrl"
        defaultValue={initUrl}
        onChange={(event) => {
          editHandler((initData: any) => {
            return {
              g: type == "g" ? event.target.value : initData?.g,
              s: type == "s" ? event.target.value : initData?.s,
            };
          });
        }}
      />
    </Box>
  );
}

function App() {
  const style = {
    page: css`
      min-height: 100vh;
      background: #f6f8fb;
      color: ${env.color.text};
    `,

    header: css`
      width: min(760px, calc(100vw - 32px));
    `,

    title: css`
      color: ${env.color.text};
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 0 12px;
    `,

    content: css`
      width: min(760px, calc(100vw - 32px));
      border-radius: 8px;
    `,

    button_edit: css`
      font-size: 13px;
      background-color: ${env.color.button.cancel};
      color: ${env.color.text.default};

      &:hover {
        background-color: ${env.color.button.cancel_hover};
      }
    `,

    button_start: css`
      font-size: 13px;
      background-color: ${env.color.button.ok};
      margin-left: 5px;

      &:hover {
        background-color: ${env.color.button.ok_hover};
      }
    `,

    button_reset: css`
      font-size: 13px;
      background-color: ${env.color.button.warning};
      margin-left: 5px;

      &:hover {
        background-color: ${env.color.button.warning_hover};
      }
    `,

    display_title: css`
      font-size: 15px;
      margin-right: auto;
    `,

    link: css`
      cursor: pointer;
      display: flex;
      align-items: center;
      font-size: 15px;
      color: ${env.color.blue};
      margin-top: 5px;
      border-bottom: 1px solid #00000000;

      & .MuiSvgIcon-root {
        font-size: 18px;
      }

      &:hover {
        border-bottom: 1px solid ${env.color.blue};
      }
    `,

    info: css`
      font-size: 15px;
      max-width: 80%;
      overflow-wrap: anywhere;
    `,

    error: css`
      font-size: 16px;
      color: ${env.color.red};
      margin-bottom: 10px;
    `,
  };

  const [openAutoSetting, setOpenAutoSetting] = React.useState(false);
  const [openInitAutoSetting, setOpenInitAutoSetting] = React.useState(false);
  const [openAllDataDeleteConfirmModal, setOpenAllDataDeleteConfirmModal] =
    React.useState(false);
  const [openTaskDataDeleteConfirmModal, setOpenTaskDataDeleteConfirmModal] =
    React.useState(false);
  const [openLoading, setOpenLoading] = React.useState(false);
  const [enableStatus, setEditStatus] = React.useState({
    enable: false,
    message: "URLを編集",
  });
  const [initUrl, setInitUrl] = React.useState({ g: "", s: "" });
  const [moodleUrl, setMoodleUrl] = React.useState({ g: "", s: "" });
  const [enableDisplay, setEnableDisplay] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [linkErrorMessages, setLinkErrorMessages] = React.useState<string | undefined>();
  const [userStatus, setUserStatus] = React.useState("");

  React.useEffect(() => {
    chrome.storage.sync.get().then((d) => {
      const userConfig = d as syncStorageDataProps;
      const moodleURL_g =
        userConfig.moodleGeneralId !== ""
          ? getMoodleURL({
              accountExpiration: userConfig.accountExpiration,
              userDepartment: "g",
              moodleId: userConfig.moodleGeneralId,
              moodleToken: userConfig.moodleGeneralToken,
            })
          : "設定されていません";
      const moodleURL_s =
        userConfig.moodleSpecificId !== ""
          ? getMoodleURL({
              accountExpiration: userConfig.accountExpiration,
              userDepartment: userConfig.userDepartment,
              moodleId: userConfig.moodleSpecificId,
              moodleToken: userConfig.moodleSpecificToken,
            })
          : "設定されていません";

      setEnableDisplay(userConfig.displayList);
      setInitUrl({
        g: moodleURL_g,
        s: moodleURL_s,
      });
      setMoodleUrl({
        g: moodleURL_g,
        s: moodleURL_s,
      });
      setUserStatus(userConfig.accountStatus);
      setLinkErrorMessages(userConfig.errorMessage);

      if (userConfig.accountStatus == "installed") {
        setOpenInitAutoSetting(true);
      } else if (userConfig.accountStatus == "accountExpired") {
        setOpenAutoSetting(true);
      }
    });

    chrome.runtime.onMessage.addListener((message) => {
      if (message == "autoSetupComplete") {
        chrome.runtime
          .sendMessage("taskDataUpdate")
          .then(() => {
            window.open(
              "https://timetable.ealps.shinshu-u.ac.jp/portal/",
              "_blank",
            );
            window.location.reload();
          })
          .catch((e) => console.log(e));
      }
    });
  }, []);

  const enableEditHandler = () => {
    if (enableStatus.enable) {
      setOpenLoading(true);
      const icalClient = new IcalClient(moodleUrl.g, moodleUrl.s);
      icalClient
        .isValidUrl()
        .then((res) => {
          if (res) {
            setEditStatus({
              enable: false,
              message: "URLを編集",
            });
            const {
              expiration: accountExpiration,
              userid: moodleGeneralId,
              authtoken: moodleGeneralToken,
            } = getAccountParams(moodleUrl.g);
            const {
              department: userDepartment,
              userid: moodleSpecificId,
              authtoken: moodleSpecificToken,
            } = getAccountParams(moodleUrl.s);
            chrome.storage.sync.set({
              userDepartment: userDepartment,
              moodleSpecificId: moodleSpecificId,
              moodleSpecificToken: moodleSpecificToken,
              moodleGeneralId: moodleGeneralId,
              moodleGeneralToken: moodleGeneralToken,
              accountExpiration: accountExpiration,
              accountStatus: "linked",
            });
            setErrorMessage("");
            setUserStatus("linked");
            // GASend("changeSetting", "updateIcalURLManually");
          } else {
            setErrorMessage(
              "URL設定エラー：入力されたURLで正常な接続ができませんでした。",
            );
          }
          setOpenLoading(false);
        })
        .catch((_e) => {
          setErrorMessage(
            "URL設定エラー：入力されたURLで正常な接続ができませんでした。",
          );
          setOpenLoading(false);
        });
    } else {
      setEditStatus({
        enable: true,
        message: "保存",
      });
    }
  };

  const enableDisplayHandler = React.useCallback(() => {
    setEnableDisplay((initStatus) => {
      chrome.storage.sync.set({
        displayList: !initStatus,
      });
      if (initStatus) {
        // GASend("changeSetting", "disableDisplayPortal");
      } else {
        // GASend("changeSetting", "enableDisplayPortal");
      }
      return !initStatus;
    });
  }, []);

  return (
    <Box
      css={style.page}
      display="flex"
      alignItems="center"
      flexDirection="column"
      padding="48px 16px"
    >
      <Box
        css={style.header}
        display="flex"
        alignItems="center"
        marginBottom="28px"
      >
        <img
          width="45px"
          height="45px"
          src="/icon/icon48.png"
          alt="RACSU Logo"
        />
        <p css={style.title}>RACSU for eALPS 拡張機能オプション</p>
      </Box>
      <Paper css={style.content} elevation={0}>
        <SettingParagraph title="ユーザー情報">
          <Box display="flex" alignItems="center">
            <p css={style.display_title}>ステータス：</p>
            <Box display="flex" css={style.info}>
              <p>{userStatus}</p>
            </Box>
          </Box>
          {userStatus == "linkError" && (
            <Box display="flex" alignItems="center" marginTop="10px">
              <p css={style.display_title}>エラー内容：</p>
              <Box display="flex" css={style.info}>
                <p>{linkErrorMessages}</p>
              </Box>
            </Box>
          )}
        </SettingParagraph>
        <SettingParagraph
          title="eALPS連携設定"
          description={
            <>
              <p>
                RACSUは、eALPSが発行するカレンダー共有URLから課題を取得します。
              </p>
              <p>iCalendar形式のファイルが発行されるURLを設定してください。</p>
              <p>
                「自動設定を開始」ボタンより、カレンダー共有URLを自動取得できます。
              </p>
            </>
          }
        >
          <IcalUrlSection
            type="g"
            title="共通教育URL："
            enableEdit={enableStatus.enable}
            initUrl={initUrl.g}
            editHandler={setMoodleUrl}
          />
          <IcalUrlSection
            type="s"
            title="専門教育URL："
            enableEdit={enableStatus.enable}
            initUrl={initUrl.s}
            editHandler={setMoodleUrl}
          />
          <p css={style.error}>{errorMessage}</p>
          <Box display="flex" marginLeft="auto" width="fit-content">
            <Button
              css={style.button_edit}
              variant="contained"
              onClick={enableEditHandler}
            >
              {enableStatus.message}
            </Button>
            <Button
              css={style.button_start}
              variant="contained"
              onClick={() => setOpenAutoSetting(true)}
            >
              自動設定を開始
            </Button>
          </Box>
        </SettingParagraph>

        <SettingParagraph
          title="課題表示設定"
          description={
            <p>有効にすると、eALPS時間割ページに課題一覧を表示します。</p>
          }
        >
          <Box display="flex" alignItems="center">
            <p css={style.display_title}>eALPSポータルでの課題リスト表示：</p>
            <IOSSwitch
              sx={{ m: 1, margin: "0" }}
              checked={enableDisplay}
              onChange={enableDisplayHandler}
            />
          </Box>
        </SettingParagraph>

        <SettingParagraph title="その他の操作">
          <Box display="flex" alignItems="center">
            <p css={style.display_title}>デバック：</p>
            <Box
              display="flex"
              css={style.link}
              onClick={() => {
                chrome.tabs.create({
                  url:
                    "chrome-extension://" +
                    chrome.runtime.id +
                    "/pages/debugger/index.html",
                });
              }}
            >
              <p>デバックツールを開く</p>
              <LaunchIcon />
            </Box>
          </Box>

          <Box display="flex" alignItems="center" marginTop="10px">
            <p css={style.display_title}>お問い合わせ：</p>
            <Box
              display="flex"
              css={style.link}
              onClick={() => {
                chrome.tabs.create({
                  url: env.contactFormURL,
                });
              }}
            >
              <p>お問い合わせページを開く</p>
              <LaunchIcon />
            </Box>
          </Box>

          <Box display="flex" alignItems="center" marginTop="10px">
            <p css={style.display_title}>授業名の修正：</p>
            <Box
              display="flex"
              css={style.link}
              onClick={() => {
                chrome.tabs.create({
                  url:
                    "chrome-extension://" +
                    chrome.runtime.id +
                    "/pages/editClassName/index.html",
                });
              }}
            >
              <p>授業名の編集ページを開く</p>
              <LaunchIcon />
            </Box>
          </Box>

          <Box display="flex" alignItems="center" marginTop="20px">
            <p css={style.display_title}>データの削除：</p>
            <Button
              css={style.button_reset}
              variant="contained"
              onClick={() => setOpenTaskDataDeleteConfirmModal(true)}
            >
              課題データを削除
            </Button>
            <Button
              css={style.button_reset}
              variant="contained"
              onClick={() => setOpenAllDataDeleteConfirmModal(true)}
            >
              すべてのデータを削除
            </Button>
          </Box>
        </SettingParagraph>
      </Paper>

      <Loading
        isOpen={openLoading}
        message="連携情報を確認中"
        exContents={
          <Box marginTop="20px" textAlign="center" fontSize="15px">
            <p>
              このページが長時間表示されている場合、すでに連携が済んでいる可能性があります。
            </p>
            <p>
              F5キーでこのページを再読み込み、またはeALPSにアクセスしてみてください。
            </p>
          </Box>
        }
      />
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
        headerMessage="RACSUをインストールしていただきありがとうございます！"
      />
      <UserDataDeleteConfirmModal
        modalIsOpen={openTaskDataDeleteConfirmModal}
        modalHandler={setOpenTaskDataDeleteConfirmModal}
        deleteType="すべての課題データ"
        deleteHandler={() => {
          chrome.storage.local.clear();
          chrome.storage.local.set({
            classNameDict: {},
            userTask: {},
            lastUpdate: "",
          });
          window.location.reload();
        }}
      />
      <UserDataDeleteConfirmModal
        modalIsOpen={openAllDataDeleteConfirmModal}
        modalHandler={setOpenAllDataDeleteConfirmModal}
        deleteType="すべてのデータ"
        deleteHandler={() => {
          chrome.storage.local.clear();
          chrome.storage.sync.clear();
          chrome.storage.sync.set({
            needToSetGeneral: false,
            needToSetSpecific: false,
            userDepartment: "",
            moodleGeneralId: "",
            moodleGeneralToken: "",
            moodleSpecificId: "",
            moodleSpecificToken: "",
            accountStatus: "installed",
            accountExpiration: "",
            displayList: true,
            errorMessage: "",
          });
          chrome.storage.local.set({
            classNameDict: {},
            userTask: {},
            lastUpdate: "",
          });
          window.location.reload();
        }}
      />
    </Box>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
