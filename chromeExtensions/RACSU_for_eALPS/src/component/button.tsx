import style from "./button.module.css"

type Color = "green" | "wine" | "yellow" | "gray";

export default function Button({id, text, color}: {id: string, text: string, color: Color}) {
  return (
    <button id={id} type="button" className={`${style.button} ${style[color]}`} >{text}</button>
  );
}