import ButtonImage from "./buttonImage"
import style from "./taskListHeader.module.css"

export default function Header({updateAt}: {updateAt: string}) {
  return (
    <div className={style.header}>
      <img id={style.logo_img} src="/icon/icon32.png" alt="RACSU Logo" />
      <p id={style.update_date}>
        eALPS 登録課題一覧（最終更新 {updateAt}）
      </p>
      <ButtonImage id={style.button_update} imageSrc="/image/update.png" imageAlt="課題を更新"/>
      <ButtonImage id={style.button_add} imageSrc="/image/add.png" imageAlt="課題を追加"/>
      <ButtonImage id={style.button_setting} imageSrc="/image/setting.png" imageAlt="RACSU設定"/>
    </div>
  );
}