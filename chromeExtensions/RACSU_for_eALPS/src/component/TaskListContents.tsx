/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import color from "../color.json";

import React from 'react'

import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';

import dayjs from 'dayjs';

import { formattedTimeCodeProps } from "../modules/formatTimeCode";

type checkHandlerProps = (
  id: string,
  checked: boolean
) => void;

type saveDataProps = {
  [id: string]: {
    className: string,
    taskName: string,
    display: boolean,
    finish: boolean,
    taskLimit: formattedTimeCodeProps
  }
};

const getSortedIds = (saveData: saveDataProps) => {
  const array = Object.keys(saveData).map((k)=>({ key: k, value: saveData[k] }));
  array.sort((a, b) => (new Date(a.value.taskLimit.source).getTime()) - (new Date(b.value.taskLimit.source)).getTime());
  return array.map((val) => val.key);
}

const detectLimitType = (timeCode: dayjs.Dayjs) => {
  const now = dayjs();

  if (timeCode.isBefore(now)){
    return "past";

  } else if (timeCode.format('YYYY/MM/DD') == now.add(1, "day").format('YYYY/MM/DD')){
    return "tomorrow";

  } else if (timeCode.format('YYYY/MM/DD') == now.format('YYYY/MM/DD')){
    return "today";

  } else {
    return "other";
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
};

function TaskItem({id, saveData, checkHandler, type="other"}: taskItemProps) {
  const style = {
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
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 30vw;
      @media screen and (max-width:535px) {
        max-width: 80px;
      }
    `,

    task_li_tName: css`
      display: block;
      margin-left: auto;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 35vw;
      @media screen and (max-width:460px) {
        max-width: 120px;
      }
    `
  };

  const indexColor = () => {
    if (saveData.finish) {
      return color.text.disabled;
    } else {
      return color.text.default;
    }
  };

  const timeColor = () => {
    if (type == "today") {
      if (saveData.finish) {
        return color.text.disabled;
      } else {
        return color.text.default;
      }
    } else {
      return indexColor();
    }
  };

  return (
    <FormControlLabel
      control={
        <Checkbox
          css={style.task_checkbox}
          onClick={() => checkHandler(id, !saveData.finish)}
          checked={saveData.finish}
          name='finish'
          id={id}
        />
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

type taskContainerProps = {
  type: "today" | "tomorrow" | "past" | "other",
  day: string,
  children: React.ReactNode[],
  ids?: string
}

function TaskContainer({type, day, children, ids}: taskContainerProps) {
  const style = {
    task_day: css`
      font-size: 12px;
      color: ${color.text};
      margin-right: 5px;
    `,

    task_index_tomorrow: css`
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      padding: 2px 3px;
      white-space: nowrap;
      color: #ffffff;
      background-color: ${color.yellow};
      margin-right: 5px;
      @media screen and (max-width:850px) {
        font-size: 13px;
      }
    `,

    task_index_past: css`
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      padding: 2px 3px;
      white-space: nowrap;
      color: #ffffff;
      background-color: ${color.wine};
      margin-right: 5px;
      @media screen and (max-width:850px) {
        font-size: 13px;
      }
    `
  };

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
      <Box className="past" display="flex" alignItems="center" borderBottom={`1px solid ${color.frame_border}`}>
        <Box css={style.task_index_past} id={ids}>超過</Box>
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
  const taskNodeList: React.ReactNode[] = [];

  // 各期間の表示課題数保存変数
  let todayTaskCount: number = 0, otherTaskCount: number = 0;

  // ソート済みキー配列を取得
  const sortedKeys: string[] = getSortedIds(saveData);

  // ソート済みキー配列を当日・その他に仕分け
  const todayTaskIds: string[] = [], otherTaskIds: string[] = [];
  sortedKeys.forEach(id => {
    const task = saveData[id];
    if (detectLimitType(dayjs(task.taskLimit.source)) == "today" && task.display){
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
      if (!saveData[id].finish) todayTaskCount++
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
      const taskLimitType_thisContent = detectLimitType(dayjs(taskLimit_thisContent.source));
      let taskIds_thisContent = "";
      const otherTaskNodeList_thisContent: React.ReactNode[] = [];

      for (; ; i++) {
        const id = otherTaskIds[i];
        taskIds_thisContent += `${id}/`;
        otherTaskNodeList_thisContent.push(<TaskItem key={id} id={id} saveData={saveData[id]} checkHandler={checkHandler}/>);
        if (!saveData[id].finish) otherTaskCount++

        if (i+1 == otherTaskIds.length){
          break;
        };

        if (saveData[otherTaskIds[i+1]].taskLimit.date !== taskLimit_thisContent.date){
          break;
        };
      }

      otherTaskNodeList.push(
        <TaskContainer key={taskIds_thisContent} type={taskLimitType_thisContent} day={taskLimit_thisContent.date} ids={taskIds_thisContent}>
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
      <Box key="info" color={color.text} fontSize="14px">
        取得可能期間内に表示できる課題がありません。
      </Box>
    );
  }

  if (todayTaskCount+otherTaskCount !== 0) {
    chrome.action.setBadgeText({text: `${todayTaskCount+otherTaskCount}`});
    chrome.action.setBadgeBackgroundColor({
      color: '#555555'
    });
  } else {
    chrome.action.setBadgeText({text: ""});
  }

  console.log("Task list rendering");
  return (
    <Box css={css`& > .MuiBox-root:last-child {border-bottom: none;}`}>
      {taskNodeList}
    </Box>
  )
}

type props = {
  saveData: saveDataProps,
  checkHandler: checkHandlerProps
}

// メモ化してsaveDataが変化したときのみ再レンダリングするようにする
const TaskListContents = React.memo(({saveData, checkHandler}: props) => {
  return (
    <App saveData={saveData} checkHandler={checkHandler} />
  );
})

export default TaskListContents;