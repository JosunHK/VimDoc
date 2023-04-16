import { innerHTML, render } from 'solid-js/web';
import { createSignal, onMount, Index } from 'solid-js';
import {clearHistory, colorText, addEventListenerForSpan} from '../canvas.jsx'
import {appWindow} from '@tauri-apps/api/window';

const { invoke } = window.__TAURI__.tauri

let modeMap = new Map();
modeMap.set(0, "NORMAL");
modeMap.set(1, "INSERT");

let setLines;
let currentFile = "";
let currentPath = "/";

let prevFiles = [];
let nextFiles = [];

const [msg, setMsg] = createSignal("");
setInterval(saveTempFile, 300000);

function saveTempFile(){
  let fileName = currentFile === "" ? "untitled" : currentFile;
  fileName = "." + fileName + "_temp";
  saveEvent(fileName);
}
function restoreFile(){
  let fileName = currentFile === "" ? "untitled" : currentFile;
  fileName = "." + fileName + "_temp";
  loadEvent(fileName);
}

function returnEvent(event) {
  event.preventDefault();
  let element = document.querySelectorAll('.command-display')[0];
  element.innerHTML="";
  let toEle = document.querySelectorAll('.lastline')[0];
  if(!toEle){
    toEle = document.getElementById("1");
  }else{
    toEle.classList.remove("lastline");
  }
  toEle.focus();
}

function executeCommand(){
  let element = document.querySelectorAll('.command-display')[0];
  let command = element.innerHTML;
  let commandArr = command.split(" ");
  if(commandArr[0] === 'e'){
    let fileName = commandArr.length > 1 ? commandArr[1] : "savedFile";
    loadEvent(fileName, false);
  }

  if(commandArr[0] === 'restore'){
    restoreFile();
  }

  if(commandArr[0] === 'wt'){
    saveTempFile();
  }

  if(commandArr[0] === 'w'){
    let fileName = commandArr.length > 1 ? commandArr[1] : currentFile;
    saveEvent(fileName);
  }

  if(commandArr[0] === 'cd'){
    currentPath = commandArr[1];
  }
  

  if(commandArr[0] === 'c'){
    let idList = commandArr[1];
    let id = idList.split(",");
    let color = commandArr.length > 1 ? commandArr[2] : "white";
    for(let i =0; i< id.length;i++){
      if(id[i].includes("-")){
        let sub = id[i].split("-");
        for(let j = sub[0]*1; j <= sub[1]*1; j++ ){
          colorText(j, color);
        }
      }else{
        colorText(id[i], color);
      }
    }
  }

  if(commandArr[0] === 'bl'){
    let prev = "none";
    if(prevFiles.length > 0){
      prev = prevFiles[prevFiles.length -1];
    }

    let next = "none";
    if(nextFiles.length > 0){
      next = nextFiles[nextFiles.length -1];
    }

    setMsg(`prev - ${prev} next - ${next}`);
  }

  if(commandArr[0] === 'bp'){
    if(prevFiles.length < 1) return;
    console.log(prevFiles);
    console.log(nextFiles);
    console.log(currentFile);
    let fileName = prevFiles.pop();
    nextFiles.push(currentFile);
    loadEvent(fileName, true);
  }

  if(commandArr[0] === 'bn'){
    if(nextFiles.length < 1) return;
    console.log(prevFiles);
    console.log(nextFiles);
    console.log(currentFile);
    let fileName = nextFiles.pop();
    prevFiles.push(currentFile);
    loadEvent(fileName, true);
  }

  if(commandArr[0] === 'bd'){
    prevFiles = [];
    nextFiles = [];
  }

  if(commandArr[0] === 'new'){
    setLines(
    [{
      content: 
      <>
      </>
    }]);

    appWindow.setTitle("VimDoc - untitled");
    if(currentFile !== "") prevFiles.push(currentFile);
    currentFile = "";

    let content = document.querySelectorAll(".content");
    for(let i =0; i<content.length; i++){
      addEventListenerForSpan(content[i]);
    }
  }

}

function saveEvent(fileName){
  let content = document.querySelectorAll(".content");
  let contentArr = [];
  let styleArr = [];
  for(let i =0; i<content.length; i++){
    contentArr.push(content[i].innerHTML);
    styleArr.push(content[i].style.cssText);
  }

  let fileContent = contentArr.join("!,") + "/style/" + styleArr.join("!,");
  let dir = currentPath + fileName;
  invoke('save', {file: fileContent, fileName: dir})
    .then((response)=>{
      if (response.includes("oops")){
        setMsg("File could not be saved");
        return;
      } 
    })

   appWindow.setTitle("VimDoc - " + fileName);
   setMsg("File saved!");
}

export function handleKeypress(event) {

  if (event.code === 'Enter') {
    event.preventDefault();
    executeCommand();
    returnEvent(event);
  }

  if (event.code === 'Escape') {
    returnEvent(event);
  }
}

function loadEvent(fileName, bn){
  let dir = currentPath + fileName;
  invoke('load', {fileName : dir})
    .then((response)=>{
        if (response.includes("oops")){
          console.log(response);
          setMsg("File not found");
          return;
        } 

        let split = response.split("/style/");

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

        clearHistory();

        appWindow.setTitle("VimDoc - " + fileName);
        if(currentFile !== "" && !bn)prevFiles.push(currentFile);
        currentFile = fileName;
        setMsg("File loaded!");
    });
}


export default function Statusbar(props) {

  onMount(async () => {
    let element = document.querySelectorAll('.command-display')[0];
    element.addEventListener("keypress", function (event) {
      handleKeypress(event);

    setLines = props.setter;
    });
  });

  return (
    <>
      <div class="status-bar no-print">
        <div class="mode-display" contenteditable="true">
          {modeMap.get(props.mode)}
        </div>
        <div class="command-display" contenteditable="true">
        </div>
        <div class="repeat-display" contenteditable="true">
          {props.repeat}
        </div>
        <div class="error-display">
          {msg()}
        </div>
      </div>
    </>
  );
}

