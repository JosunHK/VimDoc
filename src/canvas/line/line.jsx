import "./line.css";
import { createSignal, Index } from 'solid-js';
import { handleKeypress, handleKeydown} from './../canvas'

export default function Line(props) {

  return (
    <><div class="line">
      <span class="index">{props.index}</span>
      <span class="content" id={props.index}
        onKeypress={handleKeypress}
        onKeydown={handleKeydown}
        contenteditable="true">
        {props.content}
      </span>
    </div></>
  );
}



