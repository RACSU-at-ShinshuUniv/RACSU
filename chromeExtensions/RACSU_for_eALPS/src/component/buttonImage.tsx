import style from "./buttonImage.module.css"

export default function ButtonImage({id, imageSrc, imageAlt}: {id: string, imageSrc: string, imageAlt: string}) {
  return (
    <button id={id} type="button" className={style.buttonImage}>
      <img src={imageSrc} alt={imageAlt} />
    </button>
  );
}