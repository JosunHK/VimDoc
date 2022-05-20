import { render } from 'solid-js/web';
import { createSignal, Index } from 'solid-js';
import "./canvas.css";
import Line from './line/line'

export default function Canvas() {

  let key;

  const[lines, setLines] = createSignal([
    {index: 1, content: "bruh"},
    {index: 2, content: "Hello"},
    {index: 3, content: "world"},
    {index: 4, content: "!"}
  ]);

  return (
    <>
    <div class="canvas">
      <Index each={lines()}>{(line, i) =>
        <Line ref={key} index={line().index} content={line().content}/>
      }</Index>
    </div>
    <div>{key.command}</div>
    </>
  );
}

