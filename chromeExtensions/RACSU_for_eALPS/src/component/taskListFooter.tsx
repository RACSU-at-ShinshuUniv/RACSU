/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import commonDesign from "../common/design.json"

import Button from '@mui/material/Button';

const style = {
  footer: css`
    display: flex;
    height: 34px;
    padding-top: 5px;
    padding-left: 20px;
    padding-right: 20px;
    justify-content: flex-end;
    align-items: flex-end;
    border-top: 1px solid ${commonDesign.color.window_border};
  `,

  button_delete_finish: css`
    margin-right: 4px;
    font-size: 12px;
    background-color: ${commonDesign.color.green};
    :hover {
      background-color: ${commonDesign.color.green_hover};
    }
  `,

  button_delete_past: css`
  font-size: 12px;
  background-color: ${commonDesign.color.wine};
  :hover {
    background-color: ${commonDesign.color.wine_hover};
  }
  `,

  info: css`
    font-size: 12px;
    margin-right: auto;
  `,

  warning: css`
    color: #ff0000;
    font-weight: bold;
    font-size: 13px;
  `
}


export default function Footer({warningMessage}: {warningMessage: string}) {
  return (
    <div css={style.footer}>
      <div css={style.info}>
        <p css={style.warning}>{warningMessage}</p>
        <p>※課題の完了情報はeALPSと同期されません。</p>
      </div>
      <Button css={style.button_delete_finish} variant="contained">完了済みをすべて削除</Button>
      <Button css={style.button_delete_past} variant="contained">超過をすべて削除</Button>
    </div>
  );
}