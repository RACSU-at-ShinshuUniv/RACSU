/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import commonDesign from "../design.json";

import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import Box from '@mui/material/Box';

const style = {
  title: css`
    color: ${commonDesign.color.green};
    font-size: 16px;
    margin-left: 10px;
  `,

  icon_refresh: css`
    color: ${commonDesign.color.green};
  `,

  icon_add: css`
    color: ${commonDesign.color.gray};
    width: 28px;
    height: 28px;
  `,

  icon_setting: css`
    color: ${commonDesign.color.gray};
  `
};

type props = {
  updateAt: string,
  refreshHandler: () => void,
  addHandler: () => void,
  settingHandler: () => void
}

export default function Header({updateAt, refreshHandler, addHandler, settingHandler}: props) {
  return (
    <Box display="flex" alignItems="center" padding="0 10px" borderBottom={`1px solid ${commonDesign.color.frame_border}`}>
      <img width="35px" height="35px" src="/icon/icon32.png" alt="RACSU Logo" />
      <p css={style.title}>
        eALPS 登録課題一覧（最終更新 {updateAt}）
      </p>
      <IconButton sx={{marginRight: "auto"}} onClick={() => refreshHandler()}>
        <RefreshIcon css={style.icon_refresh} />
      </IconButton>
      <IconButton onClick={() => addHandler()}>
        <AddIcon css={style.icon_add} />
      </IconButton>
      <IconButton onClick={() => settingHandler()}>
        <SettingsOutlinedIcon css={style.icon_setting} />
      </IconButton>
    </Box>
  );
}