/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import color from "../color.json";

import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

const style = {
  button_delete_finish: css`
    margin-right: 4px;
    font-size: 12px;
    background-color: ${color.green};
    :hover {
      background-color: ${color.green_hover};
    }
  `,

  button_delete_past: css`
  font-size: 12px;
  background-color: ${color.wine};
  :hover {
    background-color: ${color.wine_hover};
  }
  `,

  warning: css`
    color: ${color.warning};
    font-weight: bold;
    font-size: 13px;
  `,

  info: css`
    font-size: 12px;
  `,
}

type props = {
  warningMessage: string,
  modalHandler_A: (isOpen: boolean) => void,
  modalHandler_B: (isOpen: boolean) => void
}

export default function Footer({warningMessage, modalHandler_A, modalHandler_B}: props) {
  return (
    <Box display="flex" alignItems="center" padding="5px 16px" height="fit-content" borderTop={`1px solid ${color.frame_border}`}>
      <Box marginRight="auto" marginTop="auto">
        <p css={style.warning}>{warningMessage}</p>
        <p css={style.info}>※課題の完了情報はeALPSと同期されません。</p>
      </Box>
      <Button css={style.button_delete_finish} onClick={() => modalHandler_A(true)} variant="contained">完了済みをすべて削除</Button>
      <Button css={style.button_delete_past} onClick={() => modalHandler_B(true)} variant="contained">超過をすべて削除</Button>
    </Box>
  );
}