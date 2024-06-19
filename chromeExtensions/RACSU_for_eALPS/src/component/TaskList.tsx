/** @jsxImportSource @emotion/react */

import React from 'react';

import Header from './TaskListHeader';
import Footer from './TaskListFooter';
import Contents from '../../src/component/TaskListContents';
import DeleteConfirmModal from './DeleteConfirmModal';
import TaskAddModal from './TaskAddModal';
import Loading from './Loading';
import AccountExpired from './AccountExpired';

import Box from '@mui/material/Box';

function App({width}: {width: string}) {
  // ReactHook作成
  const [openModal_delFinish, setOpenModal_delFinish] = React.useState(false);
  const [openModal_delPast, setOpenModal_delPast] = React.useState(false);
  const [openModal_add, setOpenModal_add] = React.useState(false);
  const [openLoading, setOpenLoading] = React.useState(false);
  const [accountExpiredState, setAccountExpiredState] = React.useState({isOpen: false, message: "", settingCallback: () => {}});
  const [localDataState, setLocalDataState] = React.useState({taskData: {}, lastUpdate: ""});


  // 初期描画の非同期関数作成
  const initRendering = async() => {
    const userConfig = await chrome.storage.sync.get();

    if (userConfig.accountStatus == "linked"){
      const localData = await chrome.storage.local.get(["userTask", "lastUpdate"]);
      setLocalDataState({
        taskData: localData.userTask,
        lastUpdate: localData.lastUpdate
      })
      setOpenLoading(false);

    } else if (userConfig.accountStatus == "installed") {
      const optionsPage = chrome.runtime.getURL("pages/options/index.html");
      setAccountExpiredState({
        isOpen: true,
        message: "RACSUをご利用いただくにはeALPSとの連携が必要です。",
        settingCallback: () => {
          window.open(optionsPage, "_blank");
        }
      })

    } else if (userConfig.accountStatus == "accountExpired") {
      const thisTerm = new Date();
      thisTerm.setMonth(thisTerm.getMonth()-3);
      await chrome.storage.sync.set({
        needToSetSpecific: true,
        accountStatus: "linking"
      });
      setAccountExpiredState({
        isOpen: true,
        message: "年度変更によりeALPSとの再連携が必要です。",
        settingCallback: () => {
          open(`https://lms.ealps.shinshu-u.ac.jp/${thisTerm.getFullYear()}/${userConfig.userDepartment}/calendar/export.php`, "_blank", "width=500,height=700");
        }
      });
    }
  };


  // 各ボタンのハンドラー作成
  // 初回のみの定義で良いものはuseCallbackを使用
  const updateHandler = React.useCallback(() => {
    setOpenLoading(true);
    chrome.runtime.sendMessage({
      type: "update",
      status: "start"
    });
  }, []);

  const settingHandler = React.useCallback(() => {
    const optionsPage = chrome.runtime.getURL("pages/options/index.html");
    window.open(optionsPage, "_blank");
  }, []);

  const checkHandler = React.useCallback((id: string, checked: boolean) => {
    // ローカルデータの完了フラグを立てる
    chrome.storage.local.get(["userTask"]).then(localData => {
      localData.userTask[id].finish = checked;

      chrome.storage.local.set(localData).then(() => {
        // 課題データのStateを更新して再描画
        setLocalDataState(initData => {
          return {
            lastUpdate: initData.lastUpdate,
            taskData: localData.userTask
          }
        });

        // 全体へ更新メッセージ発信
        chrome.runtime.sendMessage({
          type: "refresh",
          status: "execution"
        }).catch((e) => console.log(e));
      });
    });
  }, []);

  const delPastHandler = React.useCallback(() => {
    setOpenModal_delPast(false);
    setOpenLoading(true);

    chrome.storage.local.get(["userTask"]).then(localData => {
      // 超過課題を取得
      document.querySelectorAll('.past').forEach(pastTask => {
        pastTask.querySelectorAll("input[name=finish]").forEach(pastCheckbox => {
          // ローカルデータの非表示フラグを立てる
          localData.userTask[pastCheckbox.id].display = false;
        });
      });

      // 課題データのStateを更新して再描画
      setLocalDataState(initData => {
        return {
          lastUpdate: initData.lastUpdate,
          taskData: localData.userTask
        }
      });

      // ローカルに保存
      chrome.storage.local.set(localData).then(() => {
        // 全体へ更新メッセージ発信
        chrome.runtime.sendMessage({
          type: "refresh",
          status: "execution"
        }).catch((e) => console.log(e));
      });

      // ローディング解除
      setOpenLoading(false);
    });
  }, []);

  const delFinishHandler = React.useCallback(() => {
    setOpenModal_delFinish(false);
    setOpenLoading(true);

    chrome.storage.local.get(["userTask"]).then(localData => {
      // 完了済みの課題を取得
      document.querySelectorAll("input[name=finish]:checked").forEach(checkbox => {
        // ローカルデータの非表示フラグを立てる
        localData.userTask[checkbox.id].display = false;
      });

      // 課題データのStateを更新して再描画
      setLocalDataState(initData => {
        return {
          lastUpdate: initData.lastUpdate,
          taskData: localData.userTask
        }
      });

      // ローカルに保存
      chrome.storage.local.set(localData).then(() => {
        // 全体へ更新メッセージ発信
        chrome.runtime.sendMessage({
          type: "refresh",
          status: "execution"
        }).catch((e) => console.log(e));
      });

      // ローディング解除
      setOpenLoading(false);
    });
  }, []);


  // 初回のみの実行関数
  React.useEffect(() => {
    // 課題更新のイベントリスナー作成
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type == "update"){
        if (message.status == "complete"){
          chrome.storage.local.get(["userTask", "lastUpdate"]).then(localData => {
            // 課題データのStateを更新して再描画
            setLocalDataState({
              lastUpdate: localData.lastUpdate,
              taskData: localData.userTask
            });

            // ローディング解除
            setOpenLoading(false);
          })
        }

      } else if (message.type == "refresh") {
        if (message.status == "execution") {
          chrome.storage.local.get(["userTask", "lastUpdate"]).then(localData => {
          // 課題データのStateを更新して再描画
            setLocalDataState({
              lastUpdate: localData.lastUpdate,
              taskData: localData.userTask
            });
          });

          // ローディング解除
          setOpenLoading(false);
        }
      }
    });

    // 初期描画
    initRendering();
  }, []);



  console.log("Page rendering");
  return (
    <Box position="relative" width={width}>
      <Header
        lastUpdate={localDataState.lastUpdate}
        updateHandler={updateHandler}
        confirmDelFinishHandler={() => setOpenModal_delFinish(true)}
        confirmDelPastHandler={() => setOpenModal_delPast(true)}
        settingHandler={settingHandler}
      />
      <Box padding="0 10px" height="300px" overflow="auto">
        <Contents saveData={localDataState.taskData} checkHandler={checkHandler} />
      </Box>
      <Footer addHandler={() => setOpenModal_add(true)} />

      <DeleteConfirmModal modalIsOpen={openModal_delFinish} modalHandler={setOpenModal_delFinish} deleteType='完了済みの課題' deleteHandler={delFinishHandler} />
      <DeleteConfirmModal modalIsOpen={openModal_delPast} modalHandler={setOpenModal_delPast} deleteType='超過課題' deleteHandler={delPastHandler} />
      <TaskAddModal modalIsOpen={openModal_add} modalHandler={setOpenModal_add} addHandler={() => null}/>
      <Loading isOpen={openLoading} />
      <AccountExpired isOpen={accountExpiredState.isOpen} message={accountExpiredState.message} settingCallback={accountExpiredState.settingCallback} />
    </Box>
  )
}

export default App;