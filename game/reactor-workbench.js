'use strict';

const reactorDialog = document.querySelector('#event-layer');
const reactorHost = document.querySelector('#reactor-host');
let reactorFrame = null;
let reactorNode = null;

function setReactorStage(node) {
 if (reactorNode === node) return;
 reactorFrame?.remove();
 reactorFrame = null;
 reactorNode = node;
 reactorHost.hidden = true;
}

function syncReactor() {
 const open = Boolean(reactorNode && reactorDialog.open && !$('#panel').hidden);
 if (reactorHost.hidden === open) reactorHost.hidden = !open;
 reactorDialog.classList.toggle('reactor-mode',open);
 if (open && !reactorFrame) {
  const frame = document.createElement('iframe');
  frame.title = '反应罐操作台';
  frame.src = 'workbench-2d.html?embedded=1';
  frame.onload = syncReactor;
  reactorFrame = frame;
  reactorHost.append(frame);
 }
 reactorFrame?.contentWindow?.postMessage({type:'reactor-visibility',active:open},'*');
}

const reactorObserver = new MutationObserver(syncReactor);
reactorObserver.observe(reactorDialog,{attributeFilter:['open']});
reactorObserver.observe(document.querySelector('#panel'),{attributeFilter:['hidden']});
window.addEventListener('message', event => {
 if (!reactorFrame || event.source !== reactorFrame.contentWindow || !reactorDialog.open || reactorHost.hidden) return;
 if (event.data?.type === 'reactor-close') $('#event-close').click();
 if (event.data?.type === 'reactor-result' && state.node === reactorNode && window.Scene?.active) {
  dispatch({type:'finish',reactor:event.data.result});
 }
});
