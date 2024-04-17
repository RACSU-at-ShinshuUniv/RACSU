/** @jsxImportSource @emotion/react */

import React from 'react'
import ReactDOM from 'react-dom/client'

// import "../../src/css/common.css"

import Header from '../../src/component/taskListHeader'
import Footer from '../../src/component/taskListFooter'

import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';

import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';

import { css } from '@emotion/react';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  border: '1px solid #000',
  borderRadius: "5px",
  boxShadow: 24,
  padding: 2,
};

const cssStyle = css`
  background-color: #0000ff;
`


function LoadingButtonsTransition() {
  const [loading, setLoading] = React.useState(true);
  function handleClick() {
    setLoading(true);
  }

  return (
    <div>
      <FormControlLabel
        sx={{
          display: 'block',
        }}
        control={
          <Switch
            checked={loading}
            onChange={() => setLoading(!loading)}
            name="loading"
            color="primary"
          />
        }
        label="Loading"
      />
      <Box sx={{ '& > button': { m: 1 } }}>
        <LoadingButton
          size="small"
          onClick={handleClick}
          loading={loading}
          variant="outlined"
          disabled
        >
          <span>disabled</span>
        </LoadingButton>
        <LoadingButton
          size="small"
          onClick={handleClick}
          loading={loading}
          loadingIndicator="Loading…"
          variant="outlined"
        >
          <span>Fetch data</span>
        </LoadingButton>
        <LoadingButton
          size="small"
          onClick={handleClick}
          endIcon={<SendIcon />}
          loading={loading}
          loadingPosition="end"
          variant="contained"
        >
          <span>Send</span>
        </LoadingButton>
        <LoadingButton
          size="small"
          color="secondary"
          onClick={handleClick}
          loading={loading}
          loadingPosition="start"
          startIcon={<SaveIcon />}
          variant="contained"
        >
          <span>Save</span>
        </LoadingButton>
      </Box>

      <Box sx={{ '& > button': { m: 1 } }}>
        <LoadingButton
          onClick={handleClick}
          loading={loading}
          variant="outlined"
          disabled
        >
          <span>disabled</span>
        </LoadingButton>
        <LoadingButton
          onClick={handleClick}
          loading={loading}
          loadingIndicator="Loading…"
          variant="outlined"
        >
          <span>Fetch data</span>
        </LoadingButton>
        <LoadingButton
          onClick={handleClick}
          endIcon={<SendIcon />}
          loading={loading}
          loadingPosition="end"
          variant="contained"
        >
          <span>Send</span>
        </LoadingButton>
        <LoadingButton
          color="secondary"
          onClick={handleClick}
          loading={loading}
          loadingPosition="start"
          startIcon={<SaveIcon />}
          variant="contained"
        >
          <span>Save</span>
        </LoadingButton>
      </Box>
    </div>
  );
}

function BasicModal() {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div>
      <Button onClick={handleOpen}>Open modal</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Text in a modal
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            <LoadingButtonsTransition />
          </Typography>
        </Box>
      </Modal>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Header updateAt='none'/>
    <Footer warningMessage='テストメッセージ'/>
    {/* <BasicModal /> */}
  </React.StrictMode>,
)
