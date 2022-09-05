import { innerHTML, render } from 'solid-js/web';
import { createSignal, onMount, Index } from 'solid-js';
import "./canvas.css";
import Line from './line/line'

const NORMAL_MODE = 0;
const INSERT_MODE = 1;
const VISUAL_MODE = 2;

const [key, setKey] = createSignal("");
const [lines, setLines] = createSignal([
  {
    content: 
    <>
      <span style='color:red'>test&nbsp;</span>
      <span style='color:blue'>test</span>
    </>
  },
]);

let mode = 0;

function addEventListenerForSpan(element){
    element.addEventListener("keydown", function (event) {
      handleKeydown(event);
    });

    element.addEventListener("keypress", function (event) {
      handleKeypress(event);
  });
}

//TODO: moves to another class
//commands
function moveCaret(window, fromEle, toEle) {
  //only toEle is needed now, other params might not be needed;
  toEle.focus();
}

function newLineEvent(event) {
  event.preventDefault();
  setLines([...lines(), { content: "" }]);
  const fromEle = event.target;
  const toEle = document.getElementById(fromEle.id * 1 + 1);
  const newEle = document.getElementById(lines().length);
  console.log(lines().length);
  moveCaret(window, fromEle, toEle);
  addEventListenerForSpan(newEle);
}

function lineUpEvent(event) {
  event.preventDefault();
  const fromEle = event.target;
  let toId = Math.max(fromEle.id * 1 - 1, 1); //can't go above first line 
  const toEle = document.getElementById(toId);
  moveCaret(window, fromEle, toEle);
}

function moveCaretRight(event) {
  console.log("move right event")
  event.preventDefault();
  let ele = event.target;
  console.log(ele);

  if (typeof ele.selectionStart == "number") {
    console.log("bruh1");
    ele.selectionStart = ele.selectionEnd = 2;
  } else if (typeof ele.createTextRange != "undefined") {
    console.log("bruh2");
    ele.focus();
    var range = ele.createTextRange();
    range.collapse(false);
    range.select();
  }
}

function lineDownEvent(event) {
  event.preventDefault();
  const fromEle = event.target;
  let toId = Math.min(fromEle.id * 1 + 1, lines().length); //can't go below last line 
  const toEle = document.getElementById(toId);
  moveCaret(window, fromEle, toEle);
}

function indentEvent(event) {
  event.preventDefault();
  console.log(event.target);
  //init
  let indent = <span class="tab">&nbsp;&nbsp;&nbsp;&nbsp;</span>;
  console.log(indent);
  let element = event.target;
  let range = document.createRange();
  let selection = window.getSelection();
  let currPos = selection.anchorOffset * 1;
  let content = event.target.innerHTML;
  let modifiedString = "";

  //modify the innerHTML to add tabspace after the cursor, different handling for end of line;
  console.log("content");
  console.log(content);
  console.log(selection);

}
//commands

export default function Canvas() {

  onMount(async () => {
    //add event listener to all loaded span
    var seletor = document.querySelectorAll("span");
    seletor.forEach((element) => {
      element.addEventListener("keydown", function (event) {
        handleKeydown(event);
      });

      element.addEventListener("keypress", function (event) {
        handleKeypress(event);
      });
    });
  });

  return (
    <>
      <div class="canvas">
        <For each={lines()}>{(line, i) =>
          <Line index={i() + 1} content={line.content} />
        }</For>
      </div>
    </>
  );
}

export function updateContent(event) {
  let content = event.target.innerHTML;
  let id = event.target.id * 1 - 1;
  let line = lines()[id];
  line.content = content;
  lines()[id] = line;
  setLines(lines());
}

export function handleKeypress(event) {
  if(mode !== INSERT_MODE)
    event.preventDefault();

  if (event.code === 'Enter') {
    newLineEvent(event);
  }
}

export function handleKeydown(event) {
  console.log(event.code)
  if (event.code === 'ArrowUp' || event.code === 'KeyK') {
    lineUpEvent(event);
  }

  if (event.code === 'ArrowDown' || event.code === 'KeyJ') {
    lineDownEvent(event);
  }

  if (event.code === 'Tab') {
    indentEvent(event);
  }

  if (event.code === 'Escape') {
    mode = NORMAL_MODE;
  }

  if (event.code === 'KeyI') {
    mode = INSERT_MODE;
  }

  if(event.code === 'KeyL'){
    moveCaretRight(event);
  }
}

