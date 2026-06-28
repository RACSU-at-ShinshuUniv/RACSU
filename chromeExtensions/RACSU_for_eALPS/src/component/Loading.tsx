/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import env from "../../env.json";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

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
    flex-direction: column;
  `,

  circle: css`
    color: ${env.color.blue};
  `,

  loadingMessage: css`
    display: flex;
    align-items: center;
  `,

  info: css`
    font-size: 16px;
    margin-left: 10px;
  `,
};

export default function Loading({
  isOpen,
  message = "表示を更新中",
  exContents,
}: {
  isOpen: boolean;
  message?: string;
  exContents?: React.ReactNode;
}) {
  if (isOpen) {
    return (
      <Box css={style.overlay}>
        <Box css={style.loadingMessage}>
          <CircularProgress size={20} css={style.circle} />
          <p css={style.info}>{message}</p>
        </Box>
        {exContents && <Box>{exContents}</Box>}
      </Box>
    );
  } else {
    return <></>;
  }
}
