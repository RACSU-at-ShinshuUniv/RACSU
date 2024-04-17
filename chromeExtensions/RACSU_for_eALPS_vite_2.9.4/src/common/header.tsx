export default function Header({updateAt}: {updateAt: string}) {
  return (
    <div className="header">
      <img id="logo_img" src="./image/icon32.png" alt="RACSU Logo" />
      <div id="update_date">
        <p>
          eALPS 登録課題一覧（最終更新 <span id="last_update" />）
        </p>
        <button type="button" id="button_update">
          <img src="./image/update.png" alt="課題を更新" />
        </button>
      </div>
      <button type="button" id="button_add">
        <img src="./image/add.png" alt="課題を追加" />
      </button>
      <button type="button" id="button_setting">
        <img src="./image/setting.png" alt="RACSU設定" />
      </button>
    </div>
  );
}