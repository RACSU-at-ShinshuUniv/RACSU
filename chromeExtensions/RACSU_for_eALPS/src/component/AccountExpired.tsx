/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import env from "../../env.json";

import Box from "@mui/material/Box";
import LaunchIcon from "@mui/icons-material/Launch";

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
    z-index: 5000;
  `,

  info: css`
    font-size: 16px;
  `,

  info_help: css`
    font-size: 14px;
    margin-top: 20px;
    text-align: center;
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
  `,

  link_inline: css`
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    font-size: 14px;
    color: ${env.color.blue};
    margin-top: 5px;
    border-bottom: 1px solid #00000000;

    & .MuiSvgIcon-root {
      font-size: 16px;
    }

    &:hover {
      border-bottom: 1px solid ${env.color.blue};
    }
  `,
};

export default function AccountExpired({
  isOpen,
  message,
  buttonMessage = "連携設定を開始する",
  settingCallback,
}: {
  isOpen: boolean;
  message: string;
  buttonMessage?: string;
  settingCallback: () => void;
}) {
  if (isOpen) {
    return (
      <Box css={style.overlay}>
        <p css={style.info}>{message}</p>
        <Box css={style.link} onClick={() => settingCallback()}>
          <p>{buttonMessage}</p>
          <LaunchIcon />
        </Box>
        <p css={style.info_help}>
          うまくいかない場合は、
          <Box
            css={style.link_inline}
            onClick={() => {
              const optionsPage = chrome.runtime.getURL(
                "pages/options/index.html",
              );
              window.open(optionsPage, "_blank");
            }}
          >
            <p>設定ページ</p>
            <LaunchIcon />
          </Box>
          を確認、
          <br />
          または
          <Box
            css={style.link_inline}
            onClick={() => {
              window.open(env.contactFormURL, "_blank");
            }}
          >
            <p>お問い合わせページ</p>
            <LaunchIcon />
          </Box>
          よりお知らせください。
        </p>
      </Box>
    );
  } else {
    return <></>;
  }
}
