import Button from "./button"
import style from "./taskListFooter.module.css"

export default function Footer({warningMessage}: {warningMessage: string}) {
  return (
    <div className={style.footer}>
      <div>
        <p className={style.warning}>{warningMessage}</p>
        <p>※課題の完了情報はeALPSと同期されません。</p>
      </div>
      <Button id="" color="green" text="完了済みをすべて削除"/>
      <Button id="" color="wine" text="超過をすべて削除"/>
    </div>
  );
}