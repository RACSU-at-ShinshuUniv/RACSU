/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import color from "../color.json";

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

const style = {
  window: {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: "#ffffff",
    border: `2px solid ${color.modal_border}`,
    borderRadius: "5px",
    boxShadow: 10,
    width: "75%",
    maxWidth: "480px",
    padding: "20px"
  },

  info: css`
    color: ${color.text};
    font-size: 16px;
  `,

  warning: css`
    color: ${color.warning};
    font-size: 13px;
  `,

  button_cancel: css`
    margin-right: 4px;
    font-size: 13px;
    color: ${color.gray};
    border-color: ${color.gray};
    :hover {
      border-color: ${color.gray};
      background-color: ${color.gray_hover};
    }
  `,

  button_delete: css`
  font-size: 13px;
  background-color: ${color.red};
  :hover {
    background-color: ${color.red_hover};
  }
  `,
}

type props = {
  modalIsOpen: boolean,
  modalHandler: (isOpen: boolean) => void,
  deleteType: string,
  deleteHandler: () => void
}

export default function DeleteConfirmModal({modalIsOpen, modalHandler, deleteType, deleteHandler}: props) {
  return (
    <div>
      <Modal
        open={modalIsOpen}
        onClose={() => modalHandler(false)}
        aria-labelledby="削除の確認"
        aria-describedby={`すべての${deleteType}を非表示にしてもよろしいですか？`}
      >
        <Box sx={style.window}>
          <p css={style.info}>すべての{deleteType}を非表示にしてもよろしいですか？</p>
          <p css={style.warning}>※この操作は実行後取り消せません。</p>
          <Box display="flex" justifyContent="flex-end" marginTop="10px">
            <Button css={style.button_cancel} onClick={() => modalHandler(false)} variant="outlined">キャンセル</Button>
            <Button css={style.button_delete} onClick={() => deleteHandler()} variant="contained">{deleteType}を非表示</Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}