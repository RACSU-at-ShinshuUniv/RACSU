/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import color from "../color.json";

import React from 'react';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

const style = {
  window_sx: {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: "#ffffff",
    border: `2px solid ${color.modal_border}`,
    borderRadius: "5px",
    boxShadow: 10,
    width: "75%",
    maxWidth: "600px",
    padding: "20px",
  },

  window: css`
    color: ${color.text.default};

    h1 {
      font-weight: normal;
      font-size: 21px;
      color: ${color.blue};
    }

    h2 {
      font-weight: normal;
      font-size: 16px;
    }

    p {
      font-size: 13px;
    }
  `,

  button_start: css`
    font-size: 13px;
    height: fit-content;
    margin-left: 15px;
    background-color: ${color.button.ok};
    :hover {
      background-color: ${color.button.ok_hover};
    }
  `,
}

type props = {
  modalIsOpen: boolean,
  modalHandler: (isOpen: boolean) => void,
  loadingHandler: (isOpen: boolean) => void,
  enableClose?: boolean,
  headerMessage?: string
}

export default function DeleteConfirmModal({modalIsOpen, modalHandler, loadingHandler, enableClose=true, headerMessage=""}: props) {
  const options = [
    { label: "人文学部", value: "l"},
    { label: "教育学部", value: "e"},
    { label: "経法学部", value: "j"},
    { label: "理学部", value: "s"},
    { label: "医学部", value: "m"},
    { label: "工学部", value: "t"},
    { label: "農学部", value: "a"},
    { label: "繊維学部", value: "f"}
  ];

  const [department, setDepartment] = React.useState<{label: string, value: string} | null>(null);

  const startHandler = () => {
    modalHandler(false);
    loadingHandler(true);
    chrome.storage.sync.set({
      needToSetSpecific: true,
      accountStatus: "linking"
    }).then(() => {
      const thisTerm = new Date();
      thisTerm.setMonth(thisTerm.getMonth()-3);
      open(`https://lms.ealps.shinshu-u.ac.jp/${thisTerm.getFullYear()}/${department?.value}/calendar/export.php`, "_blank", "width=500,height=700");
    })
  }

  return (
    <div>
      <Modal
        open={modalIsOpen}
        onClose={enableClose ? () => modalHandler(false) : () => {}}
        aria-labelledby=""
        aria-describedby=""
      >
        <Box css={style.window} sx={style.window_sx}>
          <h1>{headerMessage}</h1>
          <h2>学部を選択して、「連携を開始」ボタンを押してください。</h2>
          <p>別タブでACSUログインページが開きます。</p>
          <p>ログイン後、数回ページ遷移をして連携情報を取得します。</p>

          <Box display="flex" alignItems="center" justifyContent="center" marginTop="18px">
            <Autocomplete
              disablePortal
              id="combo-box-demo"
              options={options}
              sx={{ width: 300 }}
              renderInput={(params) => <TextField {...params} label="学部を選択" />}
              isOptionEqualToValue={(option, selectedValue) => option.value === selectedValue.value}
              onChange={(_event: any, newValue: {label: string, value: string} | null) => {
                setDepartment(newValue);
              }}
            />
            <Button
              css={style.button_start}
              onClick={startHandler}
              variant="contained"
              disabled={department == null}
            >連携を開始</Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}