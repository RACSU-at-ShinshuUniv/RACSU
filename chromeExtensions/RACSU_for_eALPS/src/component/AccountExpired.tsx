/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import env from "../../env.json"

import Box from '@mui/material/Box';
import LaunchIcon from '@mui/icons-material/Launch';

const style = {
  overlay: css`
    display: flex;
    background-color: ${env.color.loading_background};
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    z-index: 10000;
  `,

  info: css`
    font-size: 16px;
    margin-left: 10px;
  `,

  link: css`
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 16px;
    color: ${env.color.blue};
    margin-top: 5px;
    border-bottom: 1px solid #00000000;

    & .MuiSvgIcon-root {
      font-size: 20px;
    }

    &:hover {
      border-bottom: 1px solid ${env.color.blue};
    }
  `
}

export default function AccountExpired({isOpen, message, settingCallback}: {isOpen: boolean, message: string, settingCallback: () => void}) {
  if (isOpen) {
    return (
      <Box css={style.overlay}>
        <p css={style.info}>{message}</p>
        <Box css={style.link} onClick={() => settingCallback()}>
          <p>連携設定を開始する</p>
          <LaunchIcon />
        </Box>
      </Box>
    );
  } else {
    return (
      <></>
    );
  }
}