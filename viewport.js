'use strict';
// Fit the complete stage to the visible area, including mobile zoom and iframe resize.
function fitGameViewport(){
 const visual=window.visualViewport,root=document.documentElement;
 const width=Math.max(1,Math.min(root.clientWidth,window.innerWidth,visual?.width||Infinity));
 const height=Math.max(1,Math.min(window.innerHeight,visual?.height||Infinity));
 const values={'--visible-width':width+'px','--visible-height':height+'px','--visible-left':(visual?.offsetLeft||0)+'px','--visible-top':(visual?.offsetTop||0)+'px','--game-scale':String(Math.min(width/1600,height/900)),'--dialog-scale':String(Math.min(1,width/780,height/800))};
 for(const [name,value] of Object.entries(values))if(root.style.getPropertyValue(name)!==value)root.style.setProperty(name,value);
}
fitGameViewport();
window.addEventListener('resize',fitGameViewport,{passive:true});
window.addEventListener('orientationchange',fitGameViewport,{passive:true});
window.addEventListener('pageshow',fitGameViewport);
window.visualViewport?.addEventListener('resize',fitGameViewport,{passive:true});
window.visualViewport?.addEventListener('scroll',fitGameViewport,{passive:true});
new ResizeObserver(fitGameViewport).observe(document.documentElement);
document.fonts?.ready.then(fitGameViewport);
