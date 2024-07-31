/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import env from "../../env.json"

import React from 'react';

import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';

import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoDeleteIcon from '@mui/icons-material/AutoDelete';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

const style = {
  title: css`
    color: ${env.color.green};
    font-size: 16px;
    margin-left: 10px;
  `,

  button_other: css`
    color: ${env.color.gray};
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
          color: ${env.color.gray};
          font-size: 18;
          margin-right: 10px;
        }
      }
    }
  `
};

type props = {
  lastUpdate: string,
  updateHandler: () => void,
  confirmDelPastHandler: () => void,
  confirmDelFinishHandler: () => void,
  settingHandler: () => void
}

export default function TaskListHeader({lastUpdate, updateHandler, confirmDelPastHandler, confirmDelFinishHandler, settingHandler}: props) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (type: "refresh" | "delPast" | "delFinish" | "setting" | "close") => {
    switch (type) {
      case "refresh":
        updateHandler()
        break;

      case "delFinish":
        confirmDelFinishHandler()
        break;

      case "delPast":
        confirmDelPastHandler()
        break;

      case "setting":
        settingHandler()
        break;

      case "close":
        break;
    }
    setAnchorEl(null);
  };

  return (
    <Box display="flex" alignItems="center" padding="0 10px" borderBottom={`1px solid ${env.color.frame_border}`}>
      <img width="35px" height="35px" src="/icon/icon48.png" alt="RACSU Logo" />
      <p css={style.title}>
        eALPS 登録課題一覧（最終更新 {lastUpdate}）
      </p>
      <Box marginLeft="auto">
        <IconButton css={style.button_other} onClick={handleClick}>
          <MoreVertIcon css={css`color: ${env.color.gray};`} />
        </IconButton>
        <Menu
          id="menu"
          anchorEl={anchorEl}
          open={open}
          onClose={() => handleClose("close")}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }} // アンカーに接地する位置
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }} // アンカー位置
          css={style.menu_item}
        >
          <MenuItem onClick={() => handleClose("refresh")}>
            <RefreshIcon />
            リストを更新
          </MenuItem>
          <MenuItem onClick={() => handleClose("delFinish")}>
            <DeleteIcon />
            完了課題を非表示
          </MenuItem>
          <MenuItem onClick={() => handleClose("delPast")}>
            <AutoDeleteIcon />
            超過課題を非表示
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem onClick={() => handleClose("setting")}>
            <SettingsOutlinedIcon />
            設定
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  )
}