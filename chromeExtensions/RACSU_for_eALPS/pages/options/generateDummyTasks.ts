import { useCallback, useRef, useState } from "react";

const classIds = [
  "L1063100",
  "L1432100",
  "E0800901",
  "E2185900",
  "A3442300",
  "A3448300",
  "E2214900",
  "E510090mae",
] as const;

const taskNames = [
  "第1回レポート提出",
  "授業アンケートへの回答",
  "課題資料の確認",
  "演習問題の提出",
  "小テストの受験",
  "講義内容についての振り返り",
  "事前学習課題",
  "最終レポート提出",
] as const;

const taskNamesWithoutCourseInfo = [
  "確認テストの受験",
  "講義資料へのコメント提出",
  "予習課題の提出",
  "復習問題への回答",
  "グループワーク資料の提出",
  "出席確認フォームへの回答",
  "中間課題の提出",
  "授業内容のまとめ",
] as const;

const weekdays = ["日", "月", "火", "水", "木", "金", "土"] as const;

type TaskLimit = {
  date: string;
  fullDate: string;
  source: string;
  time: string;
  weekDay: string;
  year: string;
};

export type DummyTask = {
  className: string;
  display: true;
  finish: false;
  taskLimit: TaskLimit;
  taskName: string;
  classId?: string;
  classUrl?: string;
};

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const pad2 = (value: number) => String(value).padStart(2, "0");

// 現在から1～90日後の23:59（ローカル時間）を生成する。
const createRandomFutureLimit = (): TaskLimit => {
  const daysLater = Math.floor(Math.random() * 90) + 1;
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + daysLater);
  deadline.setHours(23, 59, 0, 0);

  const year = String(deadline.getFullYear());
  const month = pad2(deadline.getMonth() + 1);
  const day = pad2(deadline.getDate());
  const hour = pad2(deadline.getHours());
  const minute = pad2(deadline.getMinutes());

  return {
    date: `${month}/${day}`,
    fullDate: `${year}/${month}/${day}`,
    source: deadline.toISOString(),
    time: `${hour}:${minute}`,
    weekDay: weekdays[deadline.getDay()],
    year,
  };
};

const createRandomKey = (usedKeys: Set<string>): string => {
  let key: string;

  do {
    key = String(Math.floor(Math.random() * 900_000) + 100);
  } while (usedKeys.has(key));

  usedKeys.add(key);
  return key;
};

// courseUrlが入れ子に格納されている場合も検索する。
const findCourseUrl = (value: JsonValue): string => {
  if (value === null || typeof value !== "object") return "";

  if (!Array.isArray(value) && typeof value.courseUrl === "string") {
    return value.courseUrl;
  }

  for (const child of Object.values(value)) {
    const courseUrl = findCourseUrl(child);
    if (courseUrl) return courseUrl;
  }

  return "";
};

const getCourseUrl = async (classId: string): Promise<string> => {
  const endpoint = `https://lms.ealps.shinshu-u.ac.jp/courseInfo/2026/${encodeURIComponent(classId)}.json`;

  try {
    const response = await fetch(endpoint, { credentials: "include" });

    if (!response.ok) {
      console.warn(`${classId}: 授業情報なし（HTTP ${response.status}）`);
      return "";
    }

    return findCourseUrl((await response.json()) as JsonValue);
  } catch (error) {
    console.warn(`${classId}: 授業情報の取得に失敗しました`, error);
    return "";
  }
};

export const generateDummyTasks = async (
  reservedKeys: Iterable<string> = [],
): Promise<Record<string, DummyTask>> => {
  const usedKeys = new Set(reservedKeys);
  const tasks: Record<string, DummyTask> = {};

  await Promise.all(
    classIds.map(async (classId, index) => {
      const courseInfoTaskKey = createRandomKey(usedKeys);
      const noCourseInfoTaskKey = createRandomKey(usedKeys);

      tasks[courseInfoTaskKey] = {
        className: `不明な授業（${classId}）`,
        display: true,
        finish: false,
        taskLimit: createRandomFutureLimit(),
        taskName: taskNames[index % taskNames.length],
        classId: classId,
        classUrl: await getCourseUrl(classId),
      };

      tasks[noCourseInfoTaskKey] = {
        className: `不明な授業（${classId}）`,
        display: true,
        finish: false,
        taskLimit: createRandomFutureLimit(),
        taskName: taskNamesWithoutCourseInfo[index],
      };
    }),
  );

  return tasks;
};

const requiredClickCount = 10;
const clickTimeLimit = 3000;

export const useDummyTaskGenerator = () => {
  const [message, setMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const clickTimes = useRef<number[]>([]);

  const addDummyTasks = useCallback(async () => {
    setIsGenerating(true);

    try {
      const localData = (await chrome.storage.local.get([
        "userTask",
        "classNameDict",
      ])) as {
        userTask?: Record<string, unknown>;
        classNameDict?: Record<string, string>;
      };
      const userTask = localData.userTask ?? {};
      const classNameDict = localData.classNameDict ?? {};
      const dummyTasks = await generateDummyTasks(Object.keys(userTask));

      for (const classId of classIds) {
        classNameDict[classId] = `不明な授業（${classId}）`;
      }

      await chrome.storage.local.set({
        userTask: {
          ...userTask,
          ...dummyTasks,
        },
        classNameDict,
      });

      await chrome.runtime.sendMessage("taskWindowUpdateRequest").catch(() => {
        // 課題一覧が開かれていない場合は応答先がないため無視する。
      });
      setMessage("ダミー課題を追加しました");
    } catch (error) {
      console.error("ダミー課題の生成に失敗しました", error);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleIconClick = useCallback(() => {
    if (isGenerating) return;

    const now = Date.now();
    const recentClicks = clickTimes.current.filter(
      (clickedAt) => now - clickedAt <= clickTimeLimit,
    );
    recentClicks.push(now);

    if (recentClicks.length >= requiredClickCount) {
      clickTimes.current = [];
      void addDummyTasks();
      return;
    }

    clickTimes.current = recentClicks;
  }, [addDummyTasks, isGenerating]);

  return { handleIconClick, message };
};
