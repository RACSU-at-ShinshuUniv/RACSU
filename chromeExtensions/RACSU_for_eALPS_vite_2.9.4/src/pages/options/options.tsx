import React from 'react'
import ReactDOM from 'react-dom/client'

import "./options.css"
import "../../common/css/button.css"

import Header  from '../../common/header'

const App = () => {
  return (
    <div className="test">
      <p>hello world form react</p>
      <Header updateAt='2023/01/01'/>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
