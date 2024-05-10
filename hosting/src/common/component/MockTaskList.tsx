/** @jsxImportSource @emotion/react */
"use client";

import React from 'react';

import { css } from '@emotion/react';
import color from "@/common/color.json";

import { Box, IconButton, Fab, Menu, MenuItem, Divider, FormControlLabel, Checkbox } from '@mui/material';

import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoDeleteIcon from '@mui/icons-material/AutoDelete';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AddIcon from '@mui/icons-material/Add';


function Header() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const style = {
    title: css`
      color: ${color.green};
      font-size: 16px;
      margin-left: 10px;
    `,

    button_other: css`
      color: ${color.gray};
    `,

    menu_item: css`
      & .MuiPaper-root {
        border-radius: 6;
        min-width: 180;

        & .MuiMenu-list {
          padding: 4px 0;
        }

        & .MuiMenuItem-root {
          & .MuiSvgIcon-root {
            color: ${color.gray};
            font-size: 18;
            margin-right: 10px;
          }
        }
      }
    `
  };

  return (
    <Box display="flex" alignItems="center" padding="0 10px" borderBottom={`1px solid ${color.frame_border}`}>
      <img width="35px" height="35px" src="/icon/icon32.png" alt="RACSU Logo" />
      <p css={style.title}>
        eALPS 登録課題一覧
      </p>
      <Box marginLeft="auto">
        <IconButton css={style.button_other} onClick={handleClick}>
          <MoreVertIcon css={css`color: ${color.gray};`} />
        </IconButton>
        <Menu
          id="menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }} // アンカーに接地する位置
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }} // アンカー位置
          css={style.menu_item}
        >
          <MenuItem onClick={handleClose}>
            <RefreshIcon />
            リストを更新
          </MenuItem>
          <MenuItem onClick={handleClose}>
            <DeleteIcon />
            完了課題を非表示
          </MenuItem>
          <MenuItem onClick={handleClose}>
            <AutoDeleteIcon />
            超過課題を非表示
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem onClick={handleClose}>
            <SettingsOutlinedIcon />
            設定
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  )
}

function Footer() {
  const style = {
    fab: css`
      position: absolute;
      background-color: ${color.blue_checked};
      width: 45px;
      height: 45px;
      bottom: 12px;
      right: 12px;

      & .MuiSvgIcon-root {
        color: #ffffff;
      }

      &:hover {
        background-color: ${color.blue};
      }
    `
  }

  return (
    <Fab aria-label="add" css={style.fab}>
      <AddIcon />
    </Fab>
  );
}

type formattedTimeCodeProps = {
  year: string
  fullDate: string,
  date: string,
  source: string,
  time: string,
  weekDay: string
}

type saveDataProps = {
  [id: string]: {
    className: string,
    taskName: string,
    display: boolean,
    finish: boolean,
    taskLimit: formattedTimeCodeProps
  }
}

function TaskList({saveData}: {saveData: saveDataProps}) {
  const style = {
    task_list: css`
      background-color: #ffffff;

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
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 120px;
      @media screen and (max-width:400px) {
        max-width: 80px;
      }
    `,

    task_li_tName: css`
      display: block;
      margin-left: auto;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
      @media screen and (max-width:500px) {
        max-width: 80px;
      }
    `,

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
        font-weight: bold;
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
        font-weight: bold;
      }
    `
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
    type?: "other" | "today"
  }

  type taskContainerProps = {
    type: "today" | "tomorrow" | "past" | "other",
    day: string
    children: React.ReactNode | React.ReactNode[]
  }

  function TaskItem({id, saveData, type="other"}: taskItemProps) {
    const [checked, setChecked] = React.useState(saveData.finish);
    const _checkHandler = () => {
      setChecked(!checked);
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
    const _color = (() => {
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

  const taskNodeList: React.ReactNode[] = [];

  // 当日課題のコンテンツリスト作成
  const todayTaskNodeList: React.ReactNode[] = [];

  todayTaskNodeList.push(
    <TaskItem key="1" id="1" saveData={saveData[1]} type="today"/>,
    <TaskItem key="2" id="2" saveData={saveData[2]} type="today"/>
  );
  taskNodeList.push(
    <TaskIndex key="today" type="today">
      本日提出 1件
    </TaskIndex>
  );
  taskNodeList.push(todayTaskNodeList);


  // その他課題のコンテンツリスト作成
  // 同日の課題はまとめるために2重ループ
  const otherTaskNodeList: React.ReactNode[] = [];

  otherTaskNodeList.push(
    <TaskContainer key="3" type="past" day={saveData[3].taskLimit.date}>
      <TaskItem key="3" id="3" saveData={saveData[3]}/>
    </TaskContainer>
  );

  otherTaskNodeList.push(
    <TaskContainer key="5" type="tomorrow" day={saveData[5].taskLimit.date}>
      <TaskItem key="4" id="4" saveData={saveData[4]}/>
      <TaskItem key="5" id="5" saveData={saveData[5]}/>
    </TaskContainer>
  );

  otherTaskNodeList.push(
    <TaskContainer key="6" type="other" day={saveData[6].taskLimit.date}>
      <TaskItem key="6" id="6" saveData={saveData[6]}/>
    </TaskContainer>
  );

  taskNodeList.push(
    <TaskIndex key="other" type="other">
      今後の提出予定 3件
    </TaskIndex>
  )
  taskNodeList.push(otherTaskNodeList);

  return (
    <Box padding="0 10px" height="260px" overflow="auto" css={style.task_list}>
      {taskNodeList}
    </Box>
  )
}

export default function MockTaskList() {
  const saveData = {
    1:{
      className: '微分積分学Ⅱ',
      display: true,
      finish: false,
      taskLimit: {
        date: "04/18",
        fullDate: "2024/04/18",
        source: "2024-04-18T14:59:00.000Z",
        time: "23:59",
        weekDay: "木",
        year: "2024"
      },
      taskName: '第二回講義の確認小テスト'
    },

    2: {
      className: 'English class2',
      display: true,
      finish: true,
      taskLimit: {
        date: "04/24",
        fullDate: "2024/04/24",
        source: "2024-04-24T14:59:00.000Z",
        time: "23:59",
        weekDay: "木",
        year: "2024"
      },
      taskName: 'writing test'
    },

    3: {
      className: 'アジアの文化',
      display: true,
      finish: false,
      taskLimit: {
        date: "05/26",
        fullDate: "2024/05/26",
        source: "2024-05-26T14:59:00.000Z",
        time: "23:59",
        weekDay: "木",
        year: "2024"
      },
      taskName: '講義の感想'
    },

    4: {
      className: '統計学の基礎',
      display: true,
      finish: true,
      taskLimit: {
        date: "05/29",
        fullDate: "2024/05/29",
        source: "2024-05-29T14:59:00.000Z",
        time: "23:59",
        weekDay: "木",
        year: "2024"
      },
      taskName: 'レポートアップロード'
    },

    5: {
      className: '微分積分学Ⅱ',
      display: true,
      finish: false,
      taskLimit: {
        date: "05/29",
        fullDate: "2024/05/29",
        source: "2024-05-29T15:00:00.000Z",
        time: "24:00",
        weekDay: "木",
        year: "2024"
      },
      taskName: '第三回講義の事前学習'
    },

    6: {
      className: '経営学入門',
      display: true,
      finish: false,
      taskLimit: {
        date: "06/02",
        fullDate: "2024/06/02",
        source: "2024-06-02T14:59:00.000Z",
        time: "23:59",
        weekDay: "木",
        year: "2024"
      },
      taskName: '確認テスト（1回目）'
    }
  };

  const style = {
    frame: css`
      position: relative;
      background-color: #ffffff;
      width: 90vw;
      max-width: 510px;
      height: 320px;
      text-align: start;
      border-radius: 5px;
    `
  };

  return (
    <Box css={[style.frame]}>
      <Header />
      <TaskList saveData={saveData} />
      <Footer />
    </Box>
  )
}