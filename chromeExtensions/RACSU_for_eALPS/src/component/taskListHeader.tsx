/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import commonDesign from "../common/design.json"

import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

const style = {
  header: css`
    display: flex;
    align-items: center;
    padding: 0 10px;
    color: ${commonDesign.color.text};
    height: 44px;
    border-bottom: 1px solid ${commonDesign.color.window_border};
  `,

  logo: css`
    width: 35px;
    height: 35px;
  `,

  title: css`
    color: ${commonDesign.color.green};
    font-size: 16px;
    margin-left: 10px;
  `,

  button_refresh: css`
    margin-right: auto;
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

export default function Header({updateAt}: {updateAt: string}) {
  return (
    <div css={style.header}>
      <img css={style.logo} src="/icon/icon32.png" alt="RACSU Logo" />
      <p css={style.title}>
        eALPS 登録課題一覧（最終更新 {updateAt}）
      </p>
      <IconButton css={style.button_refresh} aria-label="refresh">
        <RefreshIcon css={style.icon_refresh} />
      </IconButton>
      <IconButton aria-label="add">
        <AddIcon css={style.icon_add} />
      </IconButton>
      <IconButton aria-label="setting">
        <SettingsOutlinedIcon css={style.icon_setting} />
      </IconButton>
    </div>
  );
}