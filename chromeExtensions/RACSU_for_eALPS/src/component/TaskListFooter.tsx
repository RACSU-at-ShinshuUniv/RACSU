/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import color from "../color.json";

import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';

const style = {
  fab: css`
    position: absolute;
    background-color: ${color.blue_checked};
    width: 45px;
    height: 45px;
    bottom: 12px;
    right: 12px;

    & .MuiSvgIcon-root {
      color: #ffffff;
    }

    &:hover {
      background-color: ${color.blue};
    }
  `
};

type props = {
  addHandler: () => void
}

export default function TaskListFooter({addHandler}: props) {
  return (
    <Fab aria-label="add" css={style.fab} onClick={addHandler}>
      <AddIcon />
    </Fab>
  );
}