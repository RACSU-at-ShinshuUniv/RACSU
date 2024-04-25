/** @jsxImportSource @emotion/react */

import React from 'react'
import ReactDOM from 'react-dom/client'

import Header from '../../src/component/TaskListHeader'
import Footer from '../../src/component/TaskListFooter'
import DeleteConfirmModal from '../../src/component/DeleteConfirmModal'
import TaskAddModal from '../../src/component/TaskAddModal'
import Loading from '../../src/component/Loading'
import TaskList from '../../src/component/TaskList'

const testData = {
  892:{
    className: 'シラバス未登録授業',
    display: true,
    finish: false,
    taskLimit: {
      date: "04/18",
      fullDate: "2024/04/18",
      source: "2024-04-18T14:59:00.000Z",
      time: "23:59",
      weekDay: "木",
      year: "2024"
    },
    taskName: '第二回講義の確認小テスト'
  },

  893: {
    className: 'シラバス未登録授業',
    display: true,
    finish: true,
    taskLimit: {
      date: "04/24",
      fullDate: "2024/04/24",
      source: "2024-04-24T14:59:00.000Z",
      time: "23:59",
      weekDay: "木",
      year: "2024"
    },
    taskName: '小テスト'
  },

  894: {
    className: 'シラバス未登録授業',
    display: true,
    finish: false,
    taskLimit: {
      date: "04/30",
      fullDate: "2024/04/30",
      source: "2024-04-30T14:59:00.000Z",
      time: "23:59",
      weekDay: "木",
      year: "2024"
    },
    taskName: '講義資料のダウンロード1'
  },

  895: {
    className: 'シラバス未登録授業',
    display: true,
    finish: false,
    taskLimit: {
      date: "04/30",
      fullDate: "2024/04/30",
      source: "2024-04-30T14:59:00.000Z",
      time: "23:59",
      weekDay: "木",
      year: "2024"
    },
    taskName: '講義資料のダウンロード2'
  },

  896: {
    className: 'シラバス未登録授業',
    display: true,
    finish: false,
    taskLimit: {
      date: "04/25",
      fullDate: "2024/04/25",
      source: "2024-04-25T14:59:00.000Z",
      time: "23:59",
      weekDay: "木",
      year: "2024"
    },
    taskName: '講義資料のダウンロード'
  }
}

function App() {
  const [openModal_delFinish, setOpenModal_delFinish] = React.useState(false);
  const [openModal_delPast, setOpenModal_delPast] = React.useState(false);
  const [openModal_add, setOpenModal_add] = React.useState(true);
  const [openLoading, setOpenLoading] = React.useState(false);

  const refreshHandler = () => {
    setOpenLoading(true);
  };
  const addHandler = () => {
    return
  };
  const settingHandler = () => {
    return
  };
  const checkHandler = (checked: boolean, id: string) => {
    console.log(id, checked);
  }

  return (
    <>
      <Header updateAt='none' refreshHandler={refreshHandler} addHandler={addHandler} settingHandler={settingHandler}/>
      <TaskList saveData={testData} checkHandler={checkHandler}/>
      <DeleteConfirmModal modalIsOpen={openModal_delFinish} modalHandler={setOpenModal_delFinish} deleteType='完了済みの課題' deleteHandler={() => console.log("del")} />
      <DeleteConfirmModal modalIsOpen={openModal_delPast} modalHandler={setOpenModal_delPast} deleteType='超過課題' deleteHandler={() => console.log("del")} />
      <TaskAddModal modalIsOpen={openModal_add} modalHandler={setOpenModal_add} addHandler={() => null}/>
      <Loading isOpen={openLoading} />
      <Footer warningMessage='' modalHandler_A={setOpenModal_delFinish} modalHandler_B={setOpenModal_delPast}/>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
