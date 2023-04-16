import "./line.css";
import { createSignal, onMount, Index } from 'solid-js';
import { handleKeypress, handleKeydown} from './../canvas'

export default function Line(props) {

  onMount(async () => {
    document.getElementById(props.index).focus();
  });

  return (
    <><div class={props.mode === 0 ? "line normal-line" : "line"}>
      <span class="index no-print">{props.index}</span>
      <span class="content" style="color:white;font-size:19px;" innerHTML={props.content} id={props.index}
        contenteditable="true">
      </span>
    </div></>
  );
}



