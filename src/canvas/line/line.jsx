import "./line.css";
import { createSignal, Index } from 'solid-js';
import { handleKeypress } from './../canvas'

export default function Line(props) {
  return (
    <><div class="line">
      <span class="index">{props.index}</span>
      <span class="content" onKeypress={handleKeypress} contenteditable="true">{props.content}</span>
    </div></>
  );
}

