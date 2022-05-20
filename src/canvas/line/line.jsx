import "./line.css";
import { createSignal, Index } from 'solid-js';

export default function Line(props) {
  const[key, setKey] = createSignal("");

  function handleKeypress(event) {
    console.log(event.code);
    setKey(event.code);
  }

  return (
    <><div class="line" ref={props.ref} command={key()}>
      <span class="index">{props.index}</span>
      <span class="content" contenteditable="true"
      onKeypress={handleKeypress}>{props.content}</span>
    </div></>
  );
}

