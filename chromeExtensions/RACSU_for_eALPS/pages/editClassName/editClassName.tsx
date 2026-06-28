/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React from "react";
import ReactDOM from "react-dom/client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import env from "../../env.json";
import type { localStorageDataProps } from "../../src/background";

type ClassNameData = localStorageDataProps["classNameDict"];

function App() {
  const [classNames, setClassNames] = React.useState<ClassNameData>({});
  const [savedClassNames, setSavedClassNames] = React.useState<ClassNameData>(
    {},
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState("");

  const classNameEntries = React.useMemo(
    () => Object.entries(classNames),
    [classNames],
  );

  const hasChanges = React.useMemo(
    () => JSON.stringify(classNames) !== JSON.stringify(savedClassNames),
    [classNames, savedClassNames],
  );

  React.useEffect(() => {
    chrome.storage.local
      .get(["classNameDict"])
      .then((localData: Partial<localStorageDataProps>) => {
        const classNameDict = localData.classNameDict ?? {};
        setClassNames(classNameDict);
        setSavedClassNames(classNameDict);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const styles = {
    page: css`
      min-height: 100vh;
      background: #f6f8fb;
      color: ${env.color.text};
    `,
    title: css`
      font-size: 24px;
      font-weight: 700;
      margin: 0;
    `,
    form: css`
      width: min(760px, calc(100vw - 32px));
      border-radius: 8px;
    `,
    tip: css`
      width: min(760px, calc(100vw - 32px));
      box-sizing: border-box;
      margin-bottom: 16px;
    `,
    classCode: css`
      width: 110px;
      color: ${env.color.gray};
      font-size: 14px;
      font-weight: 700;
      flex-shrink: 0;
    `,
    buttonSave: css`
      background-color: ${env.color.button.ok};

      &:hover {
        background-color: ${env.color.button.ok_hover};
      }
    `,
    buttonReset: css`
      background-color: ${env.color.button.cancel};
      color: ${env.color.text.default};

      &:hover {
        background-color: ${env.color.button.cancel_hover};
      }
    `,
  };

  const handleClassNameChange = (classCode: string, className: string) => {
    setSaveMessage("");
    setClassNames((current) => ({
      ...current,
      [classCode]: className,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");

    try {
      const changedClassNameEntries = Object.entries(classNames)
        .map(([classCode, className]) => ({
          before: savedClassNames[classCode],
          after: className,
        }))
        .filter(
          (classNameEntry) =>
            classNameEntry.before !== undefined &&
            classNameEntry.before !== classNameEntry.after,
        );

      const localData = (await chrome.storage.local.get([
        "userTask",
      ])) as Partial<localStorageDataProps>;
      const userTask = localData.userTask ?? {};
      const updatedUserTask: localStorageDataProps["userTask"] =
        Object.fromEntries(
          Object.entries(userTask).map(([id, task]) => {
            const changedClassNameEntry = changedClassNameEntries.find(
              (classNameEntry) =>
                task.display && task.className === classNameEntry.before,
            );

            return [
              id,
              changedClassNameEntry === undefined
                ? task
                : {
                    ...task,
                    className: changedClassNameEntry.after,
                  },
            ];
          }),
        );

      await chrome.storage.local.set({
        classNameDict: classNames,
        userTask: updatedUserTask,
      });
      setSavedClassNames(classNames);
      setSaveMessage("保存しました。");
    } catch (error) {
      console.error(error);
      setSaveMessage("保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSaveMessage("");
    setClassNames(savedClassNames);
  };

  return (
    <Box
      css={styles.page}
      display="flex"
      alignItems="center"
      flexDirection="column"
      padding="48px 16px"
    >
      <Box
        display="flex"
        alignItems="center"
        width="min(760px, calc(100vw - 32px))"
        marginBottom="28px"
      >
        <img
          width="45px"
          height="45px"
          src="/icon/icon48.png"
          alt="RACSU Logo"
        />
        <Box marginLeft="12px">
          <h1 css={styles.title}>授業名の修正</h1>
          <Typography color="text.secondary" fontSize="14px" marginTop="4px">
            登録済みの授業コードごとに表示する授業名を手動修正できます。
          </Typography>
        </Box>
      </Box>

      <Alert css={styles.tip} severity="info">
        授業コード（例：T123455）を
        <Link href={env.syllabusTopURL} target="_blank" rel="noreferrer">
          信州大学シラバス
        </Link>
        で検索することで、授業名がわかる場合があります。
      </Alert>

      <Paper css={styles.form} elevation={0}>
        <Stack spacing={2} padding="24px">
          {isLoading ? (
            <Box display="flex" justifyContent="center" padding="32px">
              <CircularProgress size={28} />
            </Box>
          ) : classNameEntries.length > 0 ? (
            classNameEntries.map(([classCode, className]) => (
              <Box
                key={classCode}
                display="flex"
                alignItems="center"
                gap="16px"
              >
                <Box css={styles.classCode}>{classCode}</Box>
                <TextField
                  label="授業名"
                  value={className}
                  fullWidth
                  size="small"
                  onChange={(event) =>
                    handleClassNameChange(classCode, event.target.value)
                  }
                />
              </Box>
            ))
          ) : (
            <Typography color="text.secondary" fontSize="14px">
              登録済みの授業データがありません。
            </Typography>
          )}

          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap="16px"
          >
            <Typography color="text.secondary" fontSize="13px">
              {saveMessage}
            </Typography>
            <Box display="flex" justifyContent="flex-end" gap="8px">
              <Button
                css={styles.buttonReset}
                variant="contained"
                disabled={!hasChanges || isSaving}
                onClick={handleReset}
              >
                変更をもとに戻す
              </Button>
              <Button
                css={styles.buttonSave}
                variant="contained"
                disabled={!hasChanges || isSaving}
                onClick={handleSave}
              >
                保存
              </Button>
            </Box>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
