/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import color from "../color.json";

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
// import Autocomplete from '@mui/joy/Autocomplete';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

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
    // height: "300px",
    padding: "20px"
  },

  info: css`
    color: ${color.text};
    font-size: 16px;
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
  addHandler: () => void
}

export default function TaskAddModal({modalIsOpen, modalHandler}: props) {
  return (
    <div>
      <Modal
        open={modalIsOpen}
        onClose={() => modalHandler(true)}
        aria-labelledby="削除の確認"
        aria-describedby={`す`}
      >
        <Box sx={style.window}>
          <p css={style.info}>すべてのをリストから削除してもよろしいですか？</p>
          <Autocomplete options={['Option 1', 'Option 2']} renderInput={(params) => <TextField {...params} label="Movie" />}/>
        </Box>
      </Modal>
    </div>
  );
}