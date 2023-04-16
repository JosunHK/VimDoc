import { innerHTML, render } from 'solid-js/web';
import { createSignal, onMount, Index, createEffect } from 'solid-js';
import "./canvas.css";
import Line from './line/line'
import Statusbar from './statusbar/statusbar'
import {appWindow} from '@tauri-apps/api/window';

const NORMAL_MODE = 0;
const INSERT_MODE = 1;
const VISUAL_MODE = 2;
await appWindow.setTitle("VimDoc - untitled");

let clipboard = "";
let styleClipboard = "";

let lastline = 0;

let history = [];
let redoStack = [];

const { invoke } = window.__TAURI__.tauri
const [key, setKey] = createSignal("");
const [command, setCommand] = createSignal("");
const [mode, setMode] = createSignal(0);
const [repeat, setRepeat] = createSignal("");
const [lines, setLines] = createSignal([
  {
    content: 
    <>
    </>
  },
], { equals: false });

export function clearHistory(){
  history = [];
  redoStack = [];
}

export function addEventListenerForSpan(element){
    element.addEventListener("keydown", function (event) {
      handleKeydown(event);
    });

    element.addEventListener("keypress", function (event) {
      handleKeypress(event);
  });
}

export function colorText(id, color){
  const ele = document.getElementById(id);
  ele.style.color = color;
}

//TODO: moves to another class
//commands
function moveCaret(window, fromEle, toEle) {
  //only toEle is needed now, other params might not be needed;
  toEle.focus();
}

function copyEvent(event){
  event.preventDefault();
  clipboard = event.target.innerHTML;
  styleClipboard = event.target.style.cssText;
}

function resizeImage(event, i){
  let currentSize = event.target.children[0].style.width.split("%")[0] * 1;
  currentSize += (10 * i);
  event.target.children[0].style.width = currentSize + "%";
}

function resizeFont(event, i){
  let currentSize = event.target.style.fontSize.split("px")[0] * 1;
  currentSize += (1 * i);
  event.target.style.fontSize= currentSize + "px";
}

function nextWordEvent(event){
  event.preventDefault();
  let ele = event.target;
  let content = ele.innerHTML;
  let caret = new VanillaCaret(ele); // Initialize
  let currentPos = caret.getPos();
  let toPos = currentPos + 1;
  if(toPos >  ele.innerHTML.length) return; 
  caret.setPos(toPos);
}

function undo(event){
  event.preventDefault();
  let id = event.target.id;
  if(history.length < 1) return;
  saveRedo();
  let u = history.pop();
  let split = u.split("/style/");

  let contentStr= split[0];
  let styleStr = split[1];

  let contentArr = contentStr.split("!,");
  let styleArr= styleStr.split("!,");
  let lineArr = [];

  for(let i =0; i<contentArr.length; i++){
    lineArr.push({content: contentArr[i]});
  }

  setLines(lineArr);

  let content = document.querySelectorAll(".content");
  for(let i =0; i<content.length; i++){
    content[i].style.cssText = styleArr[i];
    addEventListenerForSpan(content[i]);
  }
  let toEle = document.getElementById(id);
  moveCaret(window, event.target, toEle);
}

function redo(event){
  if(redoStack.length < 1) return;
  let id = event.target.id;
  saveHistory();
  let u = redoStack.pop();
  let split = u.split("/style/");

  let contentStr= split[0];
  let styleStr = split[1];

  let contentArr = contentStr.split("!,");
  let styleArr= styleStr.split("!,");
  let lineArr = [];

  for(let i =0; i<contentArr.length; i++){
    lineArr.push({content: contentArr[i]});
  }

  setLines(lineArr);

  let content = document.querySelectorAll(".content");
  for(let i =0; i<content.length; i++){
    content[i].style.cssText = styleArr[i];
    addEventListenerForSpan(content[i]);
  }
  let toEle = document.getElementById(id);
  moveCaret(window, event.target, toEle);
}

function decodeHtml(html) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

function newLineEvent(event, isCopy, isAbove) {
  event.preventDefault();
  const fromEle = event.target;
  let content = isCopy ? clipboard : "";
  // setLines([...lines(), { content: content }]);
  let lineArr = lines();
  let index = fromEle.id*1;
  if(isAbove) index -= 1;
  lineArr.splice(index, 0, {content: content});
  setLines(lineArr);
  let e = isAbove? -1 : 1;
  const toEle = document.getElementById(fromEle.id * 1 + e);
  moveCaret(window, fromEle, toEle);
  addEventListenerForSpan(toEle);
  if(isCopy){
    toEle.style.cssText = styleClipboard; 
  }
}

function deletLineEvent(event) {
  event.preventDefault();
  const fromEle = event.target;
  let lineArr = lines();
  let size = lineArr.length;
  if(size*1 === 1) return;

  lineArr.splice(fromEle.id -1, 1);
  setLines(lineArr);

  let bias = size === fromEle.id *1? -1 : 0;
  let toEleId = (fromEle.id * 1) + bias;

  const toEle = document.getElementById(toEleId);
  moveCaret(window, fromEle, toEle);
}

function imgEvent(event){
  event.preventDefault();
  let url = event.target.innerHTML.replace( /(<([^>]+)>)/ig, '');
  let id = event.target.getAttribute("id");
  event.target.innerHTML = `<img style="width:100%" src="${url}"/>`;
}

function lineUpEvent(event, times) {
  event.preventDefault();
  const fromEle = event.target;
  let toId = Math.max(fromEle.id * 1 - times, 1); //can't go above first line 
  const toEle = document.getElementById(toId);
  moveCaret(window, fromEle, toEle);
}

function moveCaretLeft(event){
  //Prevents WebView's Default action
  event.preventDefault();

  //get target element
  let ele = event.target;

  //manually manipulate the position of the caret
  let caret = new VanillaCaret(ele); // Initialize
  let currentPos = caret.getPos();
  let toPos = currentPos - 1;
  if(toPos < 0 ) toPos = 0;
  caret.setPos(toPos);
}

function moveCaretRight(event) {
  event.preventDefault();
  let ele = event.target;
  let caret = new VanillaCaret(ele); // Initialize
  let currentPos = caret.getPos();
  let toPos = currentPos + 1;
  if(toPos >  decodeHtml(ele.innerHTML).length) return; 
  caret.setPos(toPos);
}

function lastPosEvent(event) {
  event.preventDefault();
  let ele = event.target;
  let caret = new VanillaCaret(ele); // Initialize
  caret.setPos(decodeHtml(ele.innerHTML).length);
}

function firstPosEvent(event) {
  event.preventDefault();
  let ele = event.target;
  let caret = new VanillaCaret(ele); // Initialize
  caret.setPos(0);
}

function toFirstLine(event, times) {
  event.preventDefault();
  const fromEle = event.target;
  const toEle = document.getElementById(1);
  moveCaret(window, fromEle, toEle);
}

function toLastLine(event, times) {
  event.preventDefault();
  const fromEle = event.target;
  let toId = lines().length;
  const toEle = document.getElementById(toId);
  moveCaret(window, fromEle, toEle);
}

function lineDownEvent(event, times) {
  event.preventDefault();
  const fromEle = event.target;
  let toId = Math.min(fromEle.id * 1 + times, lines().length); //can't go below last line 
  if(lines().length === toId) window.scrollBy(0,10);
  const toEle = document.getElementById(toId);
  moveCaret(window, fromEle, toEle);
}

function statusBarEvent(event){
  event.target.classList.add("lastline");
  document.querySelectorAll('.command-display')[0].focus();
}

function indentEvent(event) {
  event.preventDefault();
  //init
  let content = event.target.innerHTML;
  content = content.replace(/ /g, "$");
  content = content.replace(/\&nbsp;/g, "$");
  let caret = new VanillaCaret(event.target); // Initialize
  let currentPos = caret.getPos();
  let result = content.substring(0, currentPos)
    + '$$$$' + content.substring(currentPos, content.length);
  result = result.replace(/\$/g, "&nbsp;");
  event.target.innerHTML = result;
  caret.setPos(currentPos + 4);
}

function saveHistory(){
  let content = document.querySelectorAll(".content");
  let contentArr = [];
  let styleArr = [];
  for(let i =0; i<content.length; i++){
    contentArr.push(content[i].innerHTML);
    styleArr.push(content[i].style.cssText);
  }

  let fileContent = contentArr.join("!,") + "/style/" + styleArr.join("!,");

  history.push(fileContent);
}

function saveRedo(){
  let content = document.querySelectorAll(".content");
  let contentArr = [];
  let styleArr = [];
  for(let i =0; i<content.length; i++){
    contentArr.push(content[i].innerHTML);
    styleArr.push(content[i].style.cssText);
  }

  let fileContent = contentArr.join("!,") + "/style/" + styleArr.join("!,");
  redoStack.push(fileContent);
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
          <Line index={i() + 1} content={line.content} mode={mode()}/>
        }</For>
        <div id="filler"></div>
      </div>
      <Statusbar setter={setLines} repeat={repeat()} mode={mode()}/>
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
  if(mode() !== INSERT_MODE)
    event.preventDefault();

  if(
    mode() === NORMAL_MODE  &&(
      event.code === 'Enter' || 
      event.code === 'Comma' || 
      event.code === 'Period' || 
      event.code === 'Minus' || 
      event.code === 'Equal' 
    )
  ){
    saveHistory();
  }

  if(
    mode() === NORMAL_MODE  &&(
      event.code === 'Comma' || 
      event.code === 'Period' || 
      event.code === 'Minus' || 
      event.code === 'Equal' 
    )
  ){
    let times = repeat() *1;
    setRepeat("");
    for(let i =0; i<times; i++){
      handleKeypress(event);
    }
    if(times > 0 ) return;
  }

  if (event.code === 'Enter') {
    if(mode() !== INSERT_MODE) return; 
    newLineEvent(event, false, false);
  }

  if (event.code === 'Semicolon') {
    if(mode() !== NORMAL_MODE) return; 
    event.preventDefault();
    statusBarEvent(event);
  }

  if(event.code === "Comma"){
    if(mode() !== NORMAL_MODE) return; 
    event.preventDefault();
    resizeImage(event, 1);
  }

  if(event.code === "Period"){
    if(mode() !== NORMAL_MODE) return; 
    event.preventDefault();
    resizeImage(event, -1);
  }

  if(event.code === "Minus"){
    if(mode() !== NORMAL_MODE) return; 
    event.preventDefault();
    resizeFont(event, -1);
  }

  if(event.code === "Equal"){
    if(mode() !== NORMAL_MODE) return; 
    event.preventDefault();
    resizeFont(event, 1);
  }
}

export function handleKeydown(event) {
  console.log(event.code.replace("Key", ""));

  if (event.code === 'Escape') {
    setMode(NORMAL_MODE);
  }

  if(mode() !== NORMAL_MODE) return;

  if(event.code.includes("Digit") ){
    setRepeat(repeat() + event.code.replace("Digit", ""));
    return;
  }

  let isShifted = event.shiftKey;


  if(
    mode() === INSERT_MODE || 
    event.code === 'Tab' || 
    event.code === 'KeyO' || 
    event.code === 'KeyM' || 
    event.code === 'KeyD' || 
    event.code === 'KeyP' && !isShifted 
  ){
    saveHistory();
  }

  if(
    event.code === 'Tab' || 
    event.code === 'KeyO' || 
    event.code === 'KeyD' || 
    event.code === 'KeyH' || 
    event.code === 'KeyL' || 
    event.code === 'KeyP' && !isShifted 
  ){
    let times = repeat() *1;
    setRepeat("");
    for(let i =0; i<times; i++){
      handleKeydown(event);
    }
    if(times > 0 ) return;
  }

  if (event.code === 'ArrowUp' || (event.code === 'KeyK')) {
    let times = repeat() *1;
    if(times > 0 ){
      lineUpEvent(event, times);
      setRepeat("");
      return;
    }
      lineUpEvent(event, 1);
  }

  if (event.code === 'ArrowDown' || (event.code === 'KeyJ')) {
    let times = repeat() *1;
    if(times > 0 ){
      lineDownEvent(event, times);
      setRepeat("");
      return;
    }
    lineDownEvent(event, 1);
  }

  if (event.code === 'Tab') {
    indentEvent(event);
  }

  if (event.code === 'KeyI') {
    event.preventDefault();
    if(isShifted){
      firstPosEvent(event);
    }
    setMode(INSERT_MODE);
  }

  if(event.code === 'KeyL'){
    event.preventDefault();
    moveCaretRight(event);
  }

  if(event.code === 'KeyH'){
    event.preventDefault();
    moveCaretLeft(event);
  }

  if (event.code === 'KeyO') {
    event.preventDefault();
    if(isShifted){
      newLineEvent(event, false, true);
    }else{
      newLineEvent(event, false, false);
    }
  }

  if (event.code === 'KeyY') {
    event.preventDefault();
    copyEvent(event);
  }

  if (event.code === 'KeyP') {
    event.preventDefault();
    if(isShifted){
      newLineEvent(event, true, true);
    }else{
      newLineEvent(event, true, false);
    }
  }

  if (event.code === 'KeyM') {
    event.preventDefault();
    if(isShifted){
      window.print();      
    }else{
      imgEvent(event, true);
    }
  }

  if (event.code === 'KeyD') {
    event.preventDefault();
    deletLineEvent(event, true);
  }

  if (event.code === 'KeyA') {
    event.preventDefault();
    if(isShifted){
      lastPosEvent(event, true);
    }else{
      moveCaretRight(event);
    }
    setMode(INSERT_MODE);
  }

  if (event.code === 'KeyG') {
    event.preventDefault();
    if(isShifted){
      toLastLine(event);
    }else{
      toFirstLine(event);
    }
  }

  if(event.code === 'KeyU'){
    event.preventDefault();
    undo(event);
  }

  if(event.code === 'KeyR'){
    event.preventDefault();
    redo(event);
  }

  if(
    mode() === NORMAL_MODE  && !(
      event.code === 'Comma' || 
      event.code === 'Period' || 
      event.code === 'Minus' || 
      event.code === 'Equal' 
    )){
      setRepeat("");
    }
}
