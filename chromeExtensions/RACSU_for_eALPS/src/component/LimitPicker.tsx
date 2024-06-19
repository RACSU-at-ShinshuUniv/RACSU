/** @jsxImportSource @emotion/react */
"use client";

import { css } from '@emotion/react';

import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers';
import { usePickerLayout, pickersLayoutClasses, PickersLayoutRoot, PickersLayoutContentWrapper } from '@mui/x-date-pickers/PickersLayout';
import { PickersShortcutsItem } from '@mui/x-date-pickers/PickersShortcuts';
import "./LimitPicker.css";


export default function LimitPicker({limitDate, limitDateHandler}: {limitDate: dayjs.Dayjs, limitDateHandler: (limitDate: dayjs.Dayjs) => void}) {
  const shortcutsItems: PickersShortcutsItem<dayjs.Dayjs | null>[] = [
    {
      label: "1限開始時",
      getValue: () => {
        const newDate = limitDate.hour(9).minute(0);
        return newDate;
      },
    },
    {
      label: "2限開始時",
      getValue: () => {
        const newDate = limitDate.hour(10).minute(30)
        return newDate;
      },
    },
    {
      label: "3限開始時",
      getValue: () => {
        const newDate = limitDate.hour(13).minute(0)
        return newDate;
      },
    },
    {
      label: "4限開始時",
      getValue: () => {
        const newDate = limitDate.hour(14).minute(40)
        return newDate;
      },
    },
    {
      label: "5限開始時",
      getValue: () => {
        const newDate = limitDate.hour(16).minute(20)
        return newDate;
      },
    },
    {
      label: "12:00",
      getValue: () => {
        const newDate = limitDate.hour(12).minute(0)
        return newDate;
      },
    },
    {
      label: "23:59",
      getValue: () => {
        const newDate = limitDate.hour(23).minute(59)
        return newDate;
      },
    },
  ];

  // 曜日表記を日本語化
  const dayOfWeekFormatter = (date: dayjs.Dayjs) => {
    const dayOfWeek = date.format("d");
    return ['日', '月', '火', '水', '木', '金', '土'][Number(dayOfWeek)];
  };

  // ピッカー内部の独自レイアウトを作成
  function CustomLayout(props: any) {
    const { content, actionBar, shortcuts } = usePickerLayout(props);
    const style = css`
      /* ヘッダー部のマージン削除 */
      & .MuiPickersCalendarHeader-root {
        margin: 0;
      }

      /* カレンダー部日付同士のマージン削除 */
      & .MuiDayCalendar-weekContainer {
        margin: 0;
      }

      /* カレンダー部の高さ設定 */
      & .MuiDateCalendar-root {
        height: 300px;
      }

      /* カレンダー部のはみ出し削除 */
      & .MuiPickersSlideTransition-root {
        min-height: unset;
        height: 220px;
      }

      /* 年選択部の高さ設定 */
      & .MuiYearCalendar-root {
        height: 250px;
      }

      /* 時間選択部の高さ設定 */
      & .MuiMultiSectionDigitalClock-root {
        height: 300px;
      }

      /* ショートカットボタンのパディング調整 */
      & .MuiListItem-root {
        padding: 1.5px 16px;
      }

      /* 確定ボタンのパディング調整 */
      & .MuiDialogActions-root {
        padding: 0 16px 2px 0;
      }

      /* ポップアップのスタイル */
      display: flex;
    `;

    return (
      <PickersLayoutRoot ownerState={props} className='customized' css={style}>
        <PickersLayoutContentWrapper
          sx={{ display: 'grid', height: "300px"}}
          className={pickersLayoutClasses.contentWrapper}
          >
          {content}
        </PickersLayoutContentWrapper>
        <Box>
          {shortcuts}
          {actionBar}
        </Box>
      </PickersLayoutRoot>
    );
  }

  return (
    <LocalizationProvider
      dateAdapter={AdapterDayjs}
      localeText={{
        previousMonth: '前月を表示',
        nextMonth: '次月を表示',
        okButtonLabel: "完了",
      }}
      dateFormats={{
        month: "M月",
        year: "YYYY年",
      }}
    >
      <DateTimePicker
        format='YYYY/MM/DD HH:mm'
        ampm={false}
        disablePast
        dayOfWeekFormatter={dayOfWeekFormatter}
        showDaysOutsideCurrentMonth
        openTo="day"
        timeSteps={{
          minutes: 1
        }}
        slots={{
          layout: CustomLayout,
        }}
        slotProps={{
          shortcuts: {
            items: shortcutsItems,
            changeImportance: 'accept'
          },
        }}
        value={limitDate}
        onChange={(newValue) => {
          if (newValue !== null) {
            limitDateHandler(newValue);
          }
        }}
      />
    </LocalizationProvider>
  );
}
