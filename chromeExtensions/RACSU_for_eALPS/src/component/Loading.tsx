/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import env from "../../env.json"

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

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
    z-index: 9999;
  `,

  circle: css`
    color: ${env.color.blue};
  `,

  info: css`
    font-size: 16px;
    margin-left: 10px;
  `
}

export default function Loading({isOpen, message="表示を更新中"}: {isOpen: boolean, message?: string}) {
  if (isOpen) {
    return (
      <Box css={style.overlay}>
        <CircularProgress size={20} css={style.circle}/>
        <p css={style.info}>{message}</p>
      </Box>
    );
  } else {
    return (
      <></>
    );
  }
}