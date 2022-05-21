import { render } from 'solid-js/web';
import { createSignal, Index } from 'solid-js';
import "./canvas.css";
import Line from './line/line'

const[key, setKey] = createSignal("");
const[lines, setLines] = createSignal([
  {index: 1, content: ""},
]);

export default function Canvas() {


  return (
    <>
    <div class="canvas">
      <For each={lines()}>{(line, i) =>
        <Line index={line.index} content={line.content}/>
      }</For>
    </div>
    </>
  );
}

export function handleKeypress(event) {
  setKey(event.code);
  setLines([...lines(), {index: lines().length + 1, content : ""}]);
}
