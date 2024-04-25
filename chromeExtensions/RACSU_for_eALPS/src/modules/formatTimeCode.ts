const formatTimeCode = (timeCode: any) => {
  const limit = new Date(timeCode);
  const hour = limit.toLocaleString("ja-JP", {
    "hour12": false,
    "hourCycle": "h24",
    "hour": "2-digit"
  }).replace("時", "");

  if (hour !== "00"){
    const year = limit.toLocaleString("ja-JP", {
      "hour12": false,
      "hourCycle": "h24",
      "year": "numeric"
    }).replace("年", "");
    const date = limit.toLocaleString("ja-JP", {
      "hour12": false,
      "hourCycle": "h24",
      "month": "2-digit",
      "day": "2-digit"
    });
    const time = limit.toLocaleString("ja-JP", {
      "hour12": false,
      "hourCycle": "h24",
      "hour": "2-digit",
      "minute": "2-digit"
    });
    const weekDay = limit.toLocaleString("ja-JP", {
      "hour12": false,
      "hourCycle": "h24",
      "weekday": "short"
    });

    return {
      year: year,
      date: date,
      time: time,
      weekDay: weekDay,
      fullDate: `${year}/${date}`,
      source: limit.toISOString()
    }

  } else {
    limit.setDate(limit.getDate()-1);
    const year = limit.toLocaleString("ja-JP", {
      "hour12": false,
      "hourCycle": "h24",
      "year": "numeric"
    }).replace("年", "");
    const date = limit.toLocaleString("ja-JP", {
      "hour12": false,
      "hourCycle": "h24",
      "month": "2-digit",
      "day": "2-digit"
    });
    const time = limit.toLocaleString("ja-JP", {
      "hour12": false,
      "hourCycle": "h24",
      "hour": "2-digit",
      "minute": "2-digit"
    });
    const weekDay = limit.toLocaleString("ja-JP", {
      "hour12": false,
      "hourCycle": "h24",
      "weekday": "short"
    });

    return {
      year: year,
      date: date,
      time: `24:${time.split(":")[1]}`,
      weekDay: weekDay,
      fullDate: `${year}/${date}`,
      source: limit.toISOString()
    }
  }
}

export type formattedTimeCodeProps ={
  year: string
  fullDate: string,
  date: string,
  source: string,
  time: string,
  weekDay: string,
}

export default formatTimeCode;