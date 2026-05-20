/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import env from "../../env.json";

import React from "react";

import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

const style = {
  window: {
    position: "absolute" as "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    bgcolor: "#ffffff",
    border: `2px solid ${env.color.modal_border}`,
    borderRadius: "5px",
    boxShadow: 10,
    width: "75%",
    maxWidth: "480px",
    padding: "20px",
  },

  info: css`
    color: ${env.color.text.default};
    font-size: 16px;
  `,

  content: css`
    color: ${env.color.text.default};
    font-size: 16px;
    font-weight: bold;
    margin-top: 10px;
  `,

  warning: css`
    color: ${env.color.text.warning};
    font-size: 13px;
  `,

  button_cancel: css`
    margin-right: 4px;
    font-size: 13px;
    color: ${env.color.text.default};
    background-color: ${env.color.button.cancel};
    border: none;
    :hover {
      border: none;
      background-color: ${env.color.button.cancel_hover};
    }
  `,

  button_delete: css`
    font-size: 13px;
    background-color: ${env.color.button.warning};
    :hover {
      background-color: ${env.color.button.warning_hover};
    }
  `,
};

type props = {
  updateMessageTargetVersion: string;
};

export default function UpdateMessageModal({
  updateMessageTargetVersion,
}: props) {
  const [modalIsOpen, setModalIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (updateMessageTargetVersion == "1.3.8") {
      setModalIsOpen(true);
    }
  }, [updateMessageTargetVersion]);

  return (
    <div>
      <Modal
        open={modalIsOpen}
        onClose={() => {
          setModalIsOpen(false);
          chrome.storage.sync.set({ updateMessageTargetVersion: "" });
        }}
        aria-labelledby=" アップデートのお知らせ"
      >
        <Box sx={style.window}>
          <p css={style.info}>
            いつもRACSU for eALPSをご利用いただきありがとうございます。
          </p>
          <p css={style.info}>
            バージョン {updateMessageTargetVersion}{" "}
            へのアップデートが完了しました！
          </p>
          <p css={style.content}>
            ・一部の大学院授業の取得に対応しました。
            <br />
            （設定ページより「自動設定を開始」を実行してください）
          </p>
          <p css={style.content}>
            ・不具合/要望お問い合わせフォームを追加しました。
          </p>
          <Box display="flex" justifyContent="flex-end" marginTop="10px">
            <Button
              css={style.button_cancel}
              onClick={() => {
                setModalIsOpen(false);
                chrome.storage.sync.set({ updateMessageTargetVersion: "" });
              }}
              variant="outlined"
            >
              閉じる
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}
