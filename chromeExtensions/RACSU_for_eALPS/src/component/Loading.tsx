/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import commonDesign from "../design.json";

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

const style = {
  overlay: css`
    display: flex;
    background-color: ${commonDesign.color.loading_background};
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    justify-content: center;
    align-items: center;
    z-index: 999;
  `,

  circle: css`
    color: ${commonDesign.color.blue};
  `,

  info: css`
    margin-left: 10px;
  `
}

export default function Loading({isOpen}: {isOpen: boolean}) {
  if (isOpen) {
    return (
      <Box css={style.overlay}>
        <CircularProgress size={20} css={style.circle}/>
        <p css={style.info}>課題データを更新中</p>
      </Box>
    );
  } else {
    return (
      <></>
    );
  }
}