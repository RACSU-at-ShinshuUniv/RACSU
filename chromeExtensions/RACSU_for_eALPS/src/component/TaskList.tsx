/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import color from "../color.json";

import React from 'react'

import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';

import formatTimeCode, { formattedTimeCodeProps } from "../modules/formatTimeCode";

const style = {
  task_list: css`
    & > .MuiBox-root:last-child {
      border-bottom: none;
    }
  `,

  task_content: css`
    display: flex;
    margin: 3px 0;
    & .MuiTypography-root { // FormControlLabelのラベル要素の横幅上書き
      width: 100%;
    }
  `,

  task_checkbox: css`
    padding: 0;
    & .MuiSvgIcon-root {
      font-size: 17px;
    }
  `,

  task_ul: css`
    display: flex;
    list-style: none;
    font-size: 15px;
  `,

  task_li_time: css`
    display: block;
    margin-left: 5px;
  `,

  task_li_cName: css`
    display: block;
    margin-left: 10px;
  `,

  task_li_tName: css`
    display: block;
    margin-left: auto;
  `,

  task_day: css`
    font-size: 12px;
    color: ${color.text};
    margin-right: 5px;
  `,

  task_index_tomorrow: css`
    font-size: 14px;
    width: 36px;
    height: 23px;
    color: #ffffff;
    background-color: ${color.yellow};
    text-align: center;
    margin-right: 5px;
  `,

  task_index_past: css`
    font-size: 14px;
    width: 36px;
    height: 23px;
    color: #ffffff;
    background-color: ${color.wine};
    text-align: center;
    margin-right: 5px;
  `
}

type checkHandlerProps = (
  checked: boolean,
  id: string
) => void;

type saveDataProps = {
  [id: string]: {
    className: string,
    taskName: string,
    display: boolean,
    finish: boolean,
    taskLimit: formattedTimeCodeProps
  }
}

type taskItemProps = {
  id: string,
  saveData: {
    className: string,
    taskName: string,
    display: boolean,
    finish: boolean,
    taskLimit: formattedTimeCodeProps
  },
  checkHandler: checkHandlerProps
  type?: "other" | "today"
}

type taskContainerProps = {
  type: "today" | "tomorrow" | "past" | "other",
  day: string
  children: React.ReactNode[]
}

const getSortedIds = (saveData: saveDataProps) => {
  const array = Object.keys(saveData).map((k)=>({ key: k, value: saveData[k] }));
  array.sort((a, b) => (new Date(a.value.taskLimit.source).getTime()) - (new Date(b.value.taskLimit.source)).getTime());
  return array.map((val) => val.key);
}

const detectLimitType = (timeCode: formattedTimeCodeProps) => {
  const diff = ((new Date(timeCode.source).getTime()) - (new Date().getTime())) / 86400000;
  if (diff < 0){
    return "past";
  } else if (0 <= diff && diff < 1){
    return "today";
  } else if (1 <= diff && diff < 2){
    return "tomorrow";
  } else {
    return "other";
  }
}

function TaskItem({id, saveData, checkHandler, type="other"}: taskItemProps) {
  const [checked, setChecked] = React.useState(saveData.finish);
  const _checkHandler = () => {
    setChecked(!checked);
    checkHandler(!checked, id);
  };

  const indexColor = () => {
    if (checked) {
      return color.text_checked;
    } else {
      return color.text;
    }
  };

  const timeColor = () => {
    if (type == "today") {
      if (checked) {
        return color.red_checked;
      } else {
        return color.red;
      }
    } else {
      return indexColor();
    }
  };

  return (
    <FormControlLabel
      control={
      <Checkbox css={style.task_checkbox}
        onClick={_checkHandler}
        checked={checked}/>
      }
      css={style.task_content}
      label={
        <ul css={[style.task_ul, css`color: ${indexColor()};`]}>
          <li css={[style.task_li_time, css`color: ${timeColor()};`]} className="taskLimitTime">{saveData.taskLimit.time}</li>
          <li css={style.task_li_cName}>{saveData.className}</li>
          <li css={style.task_li_tName}>{saveData.taskName}</li>
        </ul>
      }/>
  );
}

function TaskContainer({type, day, children}: taskContainerProps) {
  if (type == "tomorrow") {
    return (
      <Box display="flex" alignItems="center" borderBottom={`1px solid ${color.frame_border}`}>
        <Box css={style.task_index_tomorrow}>あす</Box>
        <p css={style.task_day}>{day}</p>
        <Box width="100%">
          {children}
        </Box>
      </Box>
    )

  } else if (type == "past") {
    return (
      <Box display="flex" alignItems="center" borderBottom={`1px solid ${color.frame_border}`}>
        <Box css={style.task_index_past}>超過</Box>
        <p css={style.task_day}>{day}</p>
        <Box width="100%">
          {children}
        </Box>
      </Box>
    )

  } else if (type == "other") {
    return (
      <Box display="flex" alignItems="center" borderBottom={`1px solid ${color.frame_border}`}>
        <p css={style.task_day}>{day}</p>
        <Box width="100%">
          {children}
        </Box>
      </Box>
    )
  }
}

function TaskIndex({type, children}: {type: "today" | "other", children: React.ReactNode}) {
  const _color:string = (() => {
    if (type == "today") {
      return color.yellow
    } else {
      return color.sky
    }
  })();
  return (
    <Box color={_color} fontSize="20px" marginTop="10px" marginBottom="5px">
      {children}
    </Box>
  )
}

function App({saveData, checkHandler}: {saveData: saveDataProps, checkHandler: checkHandlerProps}) {
  const today = formatTimeCode(new Date());
  const taskNodeList: React.ReactNode[] = [];

  // 各期間の表示課題数保存変数
  let todayTaskCount: number = 0, otherTaskCount: number = 0;

  // ソート済みキー配列を取得
  const sortedKeys: string[] = getSortedIds(saveData);

  // ソート済みキー配列を当日・その他に仕分け
  const todayTaskIds: string[] = [], otherTaskIds: string[] = [];
  sortedKeys.forEach(id => {
    const task = saveData[id];
    if (task.taskLimit.fullDate == today.fullDate && task.display){
      todayTaskIds.push(id);
    } else if (task.display){
      otherTaskIds.push(id);
    }
  });

  // 当日課題のコンテンツリスト作成
  const todayTaskNodeList: React.ReactNode[] = [];
  if (todayTaskIds.length !== 0) {
    for (const id of todayTaskIds) {
      todayTaskNodeList.push(
        <TaskItem key={id} id={id} saveData={saveData[id]} checkHandler={checkHandler} type="today"/>
      );
      if (!saveData[id].finish) todayTaskCount++;
    }
    taskNodeList.push(
      <TaskIndex key="today" type="today">
        本日提出 {todayTaskCount}件
      </TaskIndex>
    );
    taskNodeList.push(todayTaskNodeList);
  }

  // その他課題のコンテンツリスト作成
  // 同日の課題はまとめるために2重ループ
  const otherTaskNodeList: React.ReactNode[] = []
  if (otherTaskIds.length !== 0) {
    for (let i=0; ; i++) {
      const taskLimit_thisContent = saveData[otherTaskIds[i]].taskLimit;
      const taskId_thisContent = otherTaskIds[i];
      const otherTaskNodeList_thisContent: React.ReactNode[] = [];

      for (; ; i++) {
        const id = otherTaskIds[i];
        otherTaskNodeList_thisContent.push(<TaskItem key={id} id={id} saveData={saveData[id]} checkHandler={checkHandler}/>);
        if (!saveData[id].finish) otherTaskCount++;

        if (i+1 == otherTaskIds.length){
          break;
        };

        if (saveData[otherTaskIds[i+1]].taskLimit.date !== taskLimit_thisContent.date){
          break;
        };
      }

      otherTaskNodeList.push(
        <TaskContainer key={taskId_thisContent} type={detectLimitType(taskLimit_thisContent)} day={taskLimit_thisContent.date}>
          {otherTaskNodeList_thisContent}
        </TaskContainer>
      )

      if (i+1 == otherTaskIds.length){
        break;
      }
    }

    taskNodeList.push(
      <TaskIndex key="other" type="other">
        今後の提出予定 {otherTaskCount}件
      </TaskIndex>
    )
    taskNodeList.push(otherTaskNodeList);
  }

  if (taskNodeList.length == 0) {
    taskNodeList.push(
      <Box color={color.text} fontSize="14px">
        取得可能期間内に表示できる課題がありません。
      </Box>
    );
  }

  return (
    <Box padding="0 10px" height="260px" overflow="auto" css={style.task_list}>
      {taskNodeList}
    </Box>
  )
}

export default function TaskList({saveData, checkHandler}: {saveData: saveDataProps, checkHandler: checkHandlerProps}) {
  return (
    <App saveData={saveData} checkHandler={checkHandler}/>
  );
}