import { render } from 'solid-js/web';
import { createSignal, Index } from 'solid-js';
import "./canvas.css";
import Line from './line/line'

const[key, setKey] = createSignal("");
const[lines, setLines] = createSignal([
  {content: ""},
]);

//TODO: moves to another class
//commands
function moveCaret(window, fromEle, toEle){
  //only toEle is needed now, other params might not be needed;
  toEle.focus();
}

function newLineEvent(event){
  event.preventDefault();
  setLines([...lines(), {content : ""}]);
  const fromEle = event.target;
  const toEle = document.getElementById(fromEle.id * 1 + 1);
  moveCaret(window, fromEle, toEle);
}

function lineUpEvent(event){
  event.preventDefault();
  const fromEle = event.target;
  let toId = Math.max(fromEle.id * 1 - 1, 1); //can't go above first line 
  const toEle = document.getElementById(toId);
  moveCaret(window, fromEle, toEle);
}

function lineDownEvent(event){
  event.preventDefault();
  const fromEle = event.target;
  let toId = Math.min(fromEle.id * 1 + 1, lines().length); //can't go below last line 
  const toEle = document.getElementById(toId);
  moveCaret(window, fromEle, toEle);
}

function indentEvent(event){
  event.preventDefault();
  event.target.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;" + event.target.innerHTML;
}
//commands
export default function Canvas() {
  return (
    <>
    <div class="canvas">
      <For each={lines()}>{(line, i) =>
        <Line index={i() + 1} content={line.content}/>
      }</For>
    </div>
    </>
  );
}

export function updateContent(event){
  let content = event.target.innerHTML;
  let id = event.target.id *1 - 1;
  let line = lines()[id];
  line.content = content;
  lines()[id] = line;
  setLines(lines());
}

export function handleKeypress(event) {
  console.log(event.code)
  if(event.code === 'Enter'){
    newLineEvent(event);
  }
}

export function handleKeydown(event) {
  console.log(event.code)
  if(event.code === 'ArrowUp'){
    lineUpEvent(event);
  }

  if(event.code === 'ArrowDown'){
    lineDownEvent(event);
  }

  if(event.code === 'Tab'){
    indentEvent(event);
  }
}

