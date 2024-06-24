/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import color from "../color.json";

import React from 'react';
import dayjs from 'dayjs';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import ClearIcon from '@mui/icons-material/Clear';
import IconButton from '@mui/material/IconButton';

import LimitPicker from './LimitPicker';
import formatTimeCode from "../modules/formatTimeCode";
import { SaveData, saveDataProps } from '../modules/DataFormatter';

import { GASend } from '../../src/modules/googleAnalytics';


// 今期の間繰り返しボタンが有効化された場合の期限生成関数
const generateTaskLimit = (initTaskLimit: dayjs.Dayjs) => {
  const limitList: dayjs.Dayjs[] = [];
  let taskLimit = dayjs(initTaskLimit);

  for (;;) {
    limitList.push(taskLimit);

    // 1週間後にセット
    const nextTaskLimit = taskLimit.add(1, "week");

    // 学期末判定
    if (nextTaskLimit.month() <= 2 && nextTaskLimit.isAfter(dayjs(`${initTaskLimit.year()}/01/20`))) {
      break;
    } else if (nextTaskLimit.month() <= 7 && nextTaskLimit.isAfter(dayjs(`${initTaskLimit.year()}/08/01`))) {
      break;
    } else {
      taskLimit = nextTaskLimit;
    }
  }

  return limitList;
}


const addTask = (className: string, taskName: string, taskLimit: dayjs.Dayjs, enableRepeat: "enable" | "disable") => {
  // ランダムなID生成
  let id = "MT";
  for (let i=0; i<5; i++){
    id += Math.floor(Math.random()*10).toString();
  }

  const newData = (() => {
    // 繰り返しが無効な場合
    if (enableRepeat == "disable") {
      return new SaveData({
        [id]: {
          className: className,
          taskName: taskName,
          taskLimit: formatTimeCode(taskLimit.second(0).millisecond(0).toDate()),
          finish: false,
          display: true
        }
      });

    // 繰り返しが有効な場合
    } else {
      const taskLimitList = generateTaskLimit(taskLimit.second(0).millisecond(0));
      const newSaveData: saveDataProps = {};
      let index = 0;
      taskLimitList.forEach(taskLimit => {
        newSaveData[`${id}_${index}`] = {
          className: className,
          taskName: taskName,
          taskLimit: formatTimeCode(taskLimit.second(0).millisecond(0).toDate()),
          finish: false,
          display: true
        }
        index++;
      })

      return new SaveData(newSaveData);
    }
  })();

  chrome.storage.local.get(["userTask", "classNameDict"]).then(localData => {
    const saveData = newData.margeWith(localData.userTask).get();

    if (Object.values(localData.classNameDict).includes(className)){
      // ローカルに保存
      chrome.storage.local.set({
        userTask: saveData
      });

    } else {
      // 新たに入力された講義名ならそれとともにローカルに保存
      localData.classNameDict[id] = className;
      chrome.storage.local.set({
        userTask: saveData,
        classNameDict: localData.classNameDict
      });
    }

    // 画面を更新
    chrome.runtime.sendMessage({
      type: "refresh",
      status: "request"
    });
  });

  GASend("taskAdd", enableRepeat == "enable" ? "repeatEnabled" : "repeatDisabled");
}

type props = {
  modalIsOpen: boolean,
  modalHandler: (isOpen: boolean) => void
}

export default function TaskAddModal({modalIsOpen, modalHandler}: props) {
  const style = {
    window: {
      position: 'absolute' as 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      bgcolor: "#ffffff",
      border: `2px solid ${color.modal_border}`,
      borderRadius: "5px",
      boxShadow: 10,
      width: "75%",
      maxWidth: "480px",
      padding: "10px 20px",
    },

    button_cancel: css`
      margin-right: 4px;
      font-size: 13px;
      color: ${color.text.default};
      background-color: ${color.button.cancel};;
      border: none;
      :hover {
        border: none;
        background-color: ${color.button.cancel_hover};
      }
    `,

    button_ok: css`
    font-size: 13px;
    background-color: ${color.button.ok};
    :hover {
      background-color: ${color.button.ok_hover};
    }
    `,

    auto_complete: css`
      width: 260px;
    `
  }

  const [limitDate, limitDateHandler] = React.useState(dayjs());
  const [enableRepeat, enableRepeatHandler] = React.useState<"enable" | "disable">("disable");
  const [className, setClassName] = React.useState('');
  const [taskName, setTaskName] = React.useState('');

  const [openClassNameSelect, setOpenClassNameSelect] = React.useState(false);
  const [classNameOptions, setClassNameOptions] = React.useState<string[] | []>([]);
  const isClassNameSelectLoading = openClassNameSelect && classNameOptions.length === 0;

  const enableSend = (limitDate.isAfter(dayjs()) && className !== "" && taskName !== "");

  // サジェストの削除関数
  const deleteSuggest = React.useCallback((deleteClassName: string) => {
    chrome.storage.local.get(["classNameDict"]).then(localData => {
      // 引数の講義名を配列から削除
      for (const key in localData.classNameDict) {
        if (localData.classNameDict[key] == deleteClassName) {
          delete localData.classNameDict[key];
        }
      }

      // 上書き保存
      chrome.storage.local.set({
        classNameDict: localData.classNameDict
      });

      // 選択とサジェストを更新
      setClassName("");
      setClassNameOptions(Object.values(localData.classNameDict));
    });
  }, []);

  // オートコンプリートのサジェスト挿入関数
  React.useEffect(() => {
    let active = true;
    if (!isClassNameSelectLoading) {
      return undefined;
    }

    // 非同期で講義名を取得してサジェストを更新
    (async () => {
      const { classNameDict } = await chrome.storage.local.get(["classNameDict"]);

      if (active) {
        if (Object.values(classNameDict).length == 0) {
          setClassNameOptions(["サジェストなし"]);
        } else {
          setClassNameOptions(Object.values(classNameDict));
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [isClassNameSelectLoading]);

  // オートコンプリートのサジェストクリア関数
  React.useEffect(() => {
    // カーソルが外れたらサジェストをクリア
    if (!openClassNameSelect) {
      setClassNameOptions([]);
    }
  }, [openClassNameSelect]);

  return (
    <Box>
      <Modal
        open={modalIsOpen}
        onClose={() => modalHandler(false)}
        aria-labelledby="課題の手動追加"
        aria-describedby="課題の手動追加"
      >
        <Box sx={style.window} fontSize="15px" color={color.text.default}>
          <Box display="flex" flexDirection="column" alignItems="center">
            <Box display="flex" alignItems="center" width="100%">
              <Box marginRight="auto">講義名：</Box>
              <Autocomplete
                css={style.auto_complete}
                freeSolo
                disableClearable
                open={openClassNameSelect}
                onOpen={() => setOpenClassNameSelect(true)}
                onClose={() => setOpenClassNameSelect(false)}
                onInputChange={(_event, newInputValue) => setClassName(newInputValue)}
                getOptionDisabled={(option) => (option == "サジェストなし")}
                options={classNameOptions}
                loading={isClassNameSelectLoading}
                value={className}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="選択または入力"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <React.Fragment>
                          {isClassNameSelectLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </React.Fragment>
                      )
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box display="flex" alignItems="center" width="100%">
                      <Box onClick={() => setOpenClassNameSelect(false)} marginRight="auto" width="100%">
                        {option}
                      </Box>
                      <IconButton size="small" onClick={() => deleteSuggest(option)}>
                        <ClearIcon fontSize="inherit" />
                      </IconButton>
                    </Box>
                  </li>
                )}
              />
            </Box>
            <Box display="flex" alignItems="center" marginTop="15px" width="100%">
              <Box marginRight="auto">課題の詳細：</Box>
              <Autocomplete
                css={style.auto_complete}
                freeSolo
                disableClearable
                options={['レポート提出', 'eALPSで小テスト']}
                renderInput={(params) =>
                  <TextField
                    {...params}
                    placeholder="選択または入力"
                  />
                }
                onInputChange={(_event, newInputValue) => setTaskName(newInputValue)}
              />
            </Box>
            <Box display="flex" alignItems="center" marginTop="15px" width="100%">
              <Box marginRight="auto">提出締め切り：</Box>
              <LimitPicker limitDate={limitDate} limitDateHandler={limitDateHandler}/>
            </Box>
            <Box display="flex" alignItems="center" marginTop="15px" width="100%">
              <Box marginRight="auto">毎週繰り返し：</Box>
              <RadioGroup
                row
                value={enableRepeat}
                onChange={(event) => {
                  enableRepeatHandler(((event.target as HTMLInputElement).value) as "enable" | "disable");
                }}
              >
                <FormControlLabel value="disable" control={<Radio />} label="しない" />
                <FormControlLabel value="enable" control={<Radio />} label="今期の間繰り返し" />
              </RadioGroup>
            </Box>
          </Box>

          <Box display="flex" justifyContent="flex-end" marginTop="10px">
            <Button css={style.button_cancel} onClick={() => modalHandler(false)} variant="outlined">キャンセル</Button>
            <Button css={style.button_ok} onClick={() => {
                addTask(className, taskName, limitDate, enableRepeat);
                setClassName("");
                setTaskName("");
                modalHandler(false);
              }}
              variant="contained"
              disabled={!enableSend}
            >追加</Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}