/** @jsxImportSource @emotion/react */

import ReactDOM from 'react-dom/client';

import TaskList from '../../src/component/TaskList';

import { GASend } from '../../src/modules/googleAnalytics';
GASend("pageOpen", "portal");

ReactDOM.createRoot(document.getElementById('root')!).render(
  <TaskList width='100%'/>
)
