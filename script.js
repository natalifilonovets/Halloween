'use strict';
const monsters = [
{id:'vampire',name:'VAMPIRE',facts:['I have sharp fangs.','I can turn into a bat.'],ability:'TURN INTO A BAT',asset:'assets/vampire.png'},
{id:'mummy',name:'MUMMY',facts:['I am wrapped in bandages.','My face is covered in bandages.'],ability:'ANCIENT MYSTERY',asset:'assets/mummy.png'},
{id:'werewolf',name:'WEREWOLF',facts:['I look like a wolf.','I howl at the full moon.'],ability:'HOWL AT THE MOON',asset:'assets/werewolf.png'},
{id:'frankenstein-monster',name:"FRANKENSTEIN'S MONSTER",facts:['I am very tall and strong.','I was made by a scientist.'],ability:'SUPER STRENGTH',asset:'assets/frankenstein-monster.png'},
{id:'invisible-man',name:'INVISIBLE MAN',facts:["You can't see my body.",'My clothes can still be seen.'],ability:'BECOME INVISIBLE',asset:'assets/invisible-man.png'}];
monsters.push(
{id:'witch',name:'WITCH',facts:['I wear a pointed hat.','I can fly on a broom.'],ability:'FLY ON A BROOM',asset:'assets/witch.png'},
{id:'ghost',name:'GHOST',facts:['I am white.','I can float in the air.'],ability:'FLOAT IN THE AIR',asset:'assets/ghost.png'},
{id:'zombie',name:'ZOMBIE',facts:['I have green skin.','I walk very slowly.'],ability:'WALK SLOWLY',asset:'assets/zombie.png'});
monsters.forEach(m=>m.shortName=({'frankenstein-monster':'MONSTER','invisible-man':'INVISIBLE'})[m.id]||m.name);
const questions=[['I have sharp fangs. I can turn into a bat. Who am I?','vampire',['werewolf','invisible-man']],['I am wrapped in bandages. Who am I?','mummy',['frankenstein-monster','vampire']],['I howl at the full moon. Who am I?','werewolf',['mummy','invisible-man']],['A scientist made me. I am very strong. Who am I?','frankenstein-monster',['werewolf','vampire']],["You can't see my body. Who am I?",'invisible-man',['mummy','frankenstein-monster']]];
questions.push(['I wear a pointed hat. I can fly on a broom. Who am I?','witch',['vampire','mummy']],['I am white. I can float in the air. Who am I?','ghost',['zombie','werewolf']],['I have green skin. I walk very slowly. Who am I?','zombie',['ghost','witch']]);
const learning={
'vampire':{hint:'Look for sharp fangs and a cape.',reason:'He can turn into a bat.',frame:'He can',ending:'turn into a bat.'},
'mummy':{hint:'Look for strips of cloth. They are bandages.',reason:'He is wrapped in bandages.',frame:'He is',ending:'wrapped in bandages.'},
'werewolf':{hint:'Look for pointed ears, a muzzle and a tail.',reason:'He can howl loudly.',frame:'He has',ending:'a tail.'},
'frankenstein-monster':{hint:'Look for a tall body and a square head.',reason:'He is very strong.',frame:'He is',ending:'very strong.'},
'invisible-man':{hint:'Look for clothes with no visible body inside.',reason:'He can disappear from sight.',frame:'He can',ending:'disappear from sight.'}};
Object.assign(learning,{
witch:{hint:'Look for a pointed hat and a broom.',reason:'She can fly on a broom.'},
ghost:{hint:'Look for a floating white body.',reason:'It can float in the air.'},
zombie:{hint:'Look for green skin and ragged clothes.',reason:'He walks very slowly.'}});
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let attempts=0,journeyTimer=null;
const key='dracula-monster-check-v3';
const fresh=()=>({screen:'intro',station:'portraits',letterIndex:0,letterOrder:[],revealed:{},viewed:[],round:1,index:0,stamps:[],complete:false,intro:0,cardDeck:[],activeCard:null,journeyTarget:null});
let state=fresh(),sound=false,locked=false,selected=null,audio;
try {const s=JSON.parse(localStorage.getItem(key));if(s&&Array.isArray(s.viewed)&&Array.isArray(s.stamps))state={...fresh(),...s};}catch{}
if(state.screen==='profile'||(state.screen==='gallery'&&state.station==='facts'))state.screen='card-table';
const stage=document.querySelector('#stage');
const byId=id=>monsters.find(m=>m.id===id);
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch{}}
function tone(correct=true){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.frequency.setValueAtTime(correct?660:220,audio.currentTime);o.frequency.exponentialRampToValueAtTime(correct?990:165,audio.currentTime+.15);g.gain.setValueAtTime(.05,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.25);o.start();o.stop(audio.currentTime+.26);}catch{}}
function go(screen){if(screen==='victory'&&!state.complete)return;state.screen=screen;save();render();}
function image(m,cls=''){return `<img class="${cls}" src="${m.asset}" alt="${m.name.toLowerCase()} character" width="1024" height="1024">`;}
function card(id,action='answer'){const m=byId(id);return `<button class="portrait theme-${id}" data-${action}="${id}"><span class="portrait-art">${image(m)}<span class="portrait-halo"></span><span class="portrait-platform" aria-hidden="true"></span></span><span class="portrait-name">${m.shortName||m.name}</span>${action==='profile'?`<span class="card-meta">${state.viewed.includes(id)?'✓ MET':'MEET MONSTER ↗'}</span>`:''}</button>`;}
function heading(kicker,title,sub=''){return `<div class="heading"><p class="eyebrow">${kicker}</p><h1>${title}</h1>${sub?`<p class="subtitle">${sub}</p>`:''}</div>`;}
function render(){if(journeyTimer){clearTimeout(journeyTimer);journeyTimer=null;}if(state.screen==='start'){state.screen='intro';state.intro=0;}if(state.screen==='victory'&&(!state.complete||state.stamps.length!==monsters.length)){state.screen='intro';state.intro=0;state.complete=false;}locked=false;selected=null;attempts=0;if(window.speechSynthesis)window.speechSynthesis.cancel();stage.className=state.screen;document.querySelector('#pass').textContent=`MONSTER PASS ${['gallery','card-table'].includes(state.screen)?state.viewed.length:state.stamps.length}/${monsters.length}`;document.querySelector('#pass').title=['gallery','card-table'].includes(state.screen)?'Gallery: monsters met':'Monster Check: passport stamps earned';document.querySelector('#steps').innerHTML=['Portraits','Names','Facts','Riddles'].map((x,i)=>`<span class="step ${state.complete||(['gallery','card-table'].includes(state.screen)?i===(state.station==='portraits'?0:2):state.screen==='letters'?i===1:state.screen==='round'?i===3:state.screen==='journey'?i===({'letters':1,'card-table':2,'round':3}[state.journeyTarget]):false)?'active':''}" title="${x}"></span>`).join('');
if(state.screen==='intro'||state.screen==='transition')renderCinematicDialogue();
else if(state.screen==='gallery'){
 const portraits=state.station==='portraits';
 stage.innerHTML=heading(portraits?'STATION 01 · LOOK & SAY':'STATION 03 · DISCOVER',portraits?'MEET THE MONSTERS':'MONSTER SECRETS',portraits?'Read the name. Tap to see the monster.':'Choose a friend. Rub to discover two facts.')+`<div class="cards five">${monsters.map(m=>portraits?`<button class="portrait flip-portrait theme-${m.id}" data-flip="${m.id}" aria-pressed="false" aria-label="Flip ${m.shortName} portrait"><span class="portrait-turn"><span class="portrait-front portrait-word"><span class="flip-star">✦</span><strong>${m.shortName}</strong><span class="flip-star">✧</span></span><span class="portrait-back portrait-picture" aria-hidden="true"><span class="portrait-art">${image(m)}</span></span></span></button>`:card(m.id,'profile')).join('')}</div><div class="gallery-bottom"><span>${portraits?'8 MONSTER FRIENDS':`${state.viewed.length} OF ${monsters.length} FRIENDS DISCOVERED`}</span><button class="primary" id="start-check" ${!portraits&&state.viewed.length<monsters.length?'disabled':''}>${portraits?'BUILD THE NAMES':'TRY THE RIDDLES'} →</button></div>`;
}
else if(state.screen==='card-table')renderCardTable();
else if(state.screen==='journey')renderJourney();
else if(state.screen==='letters')renderLetters();
else if(state.screen==='round')renderRound();
else if(state.screen==='victory')renderCelebration();
wire();addListening();if(state.screen==='card-table')wireCardTable();save();stage.focus({preventScroll:true});}
function renderRound(){const r=state.round,i=state.index;
if(r===1){const q=questions[i];stage.classList.add('who-challenge');stage.innerHTML=`<div class="challenge-top"><div class="challenge-title"><p class="eyebrow">DRACULA'S MONSTER CHALLENGE</p><h1>WHO AM I?</h1></div><div class="challenge-progress"><span class="round-count">STATION 04 · ${i+1}/${questions.length}</span><div class="quiz-medallions" aria-label="${i} of ${questions.length} clues solved">${questions.map((_,n)=>`<span class="quiz-medallion ${n<i?'lit':''} ${n===i?'current':''}" aria-hidden="true">✦</span>`).join('')}</div></div></div><section class="clue-scroll" aria-label="Your magical clue"><div class="scroll-crest" aria-hidden="true">${profileIcon('bat')}</div><p class="scroll-label">READ THE MAGIC CLUE</p><p id="quiz-clue">${q[0]}</p><div id="clue-audio"></div></section><p class="challenge-instruction">Choose the portrait that matches the clue.</p><div class="cards three challenge-portraits">${shuffle([q[1],...q[2]]).map((id,n)=>quizPortrait(id,n)).join('')}</div><aside class="quiz-host" aria-label="Count Dracula"><img src="assets/3ad26a70-5601-48f9-bd42-0fc684b35cbf.png" width="1024" height="1024" alt="Count Dracula, your host" decoding="async"><div><small>COUNT DRACULA</small><p id="host-speech" aria-live="polite">Look closely, my friend!</p></div></aside>`;}
stage.insertAdjacentHTML('beforeend','<div class="feedback-row"><p id="feedback" role="status"></p><button class="primary" id="next" hidden>NEXT →</button></div>');}
function feedback(text,correct){const el=document.querySelector('#feedback');el.textContent=(correct?'✦ ':'')+text;el.className=correct?'correct':'retry';if(correct)el.insertAdjacentHTML('afterbegin','<img class="feedback-stamp" src="assets/success-stamp.png" alt="Success">');document.querySelector('#live').textContent=text;tone(correct);}
function answer(id,button){if(locked)return;const correct=questions[state.index][1]===id;if(!correct){attempts++;const target=questions[state.index][1];feedback(attempts===1?'Not quite. Read the clue and try again!':learning[target].hint,false);if(attempts>=3&&state.round!==1){document.querySelector(`[data-answer="${target}"]`).classList.add('hint-glow');feedback(learning[target].hint+' Look at the glowing portrait.',false);} if(state.round===1){feedback(byId(id).name+'. '+(attempts===1?'Not quite. Try the clue again!':learning[target].hint),false);document.querySelector('#host-speech').textContent=attempts===1?'A good try! Look again.':'You can do this!';}button.classList.remove('shake');void button.offsetWidth;button.classList.add('shake');return;}locked=true;button.classList.add('chosen');feedback("That's right! "+learning[id].reason,true);document.querySelectorAll('[data-answer]').forEach(b=>b.disabled=true);if(state.round===1){state.stamps=[...new Set([...state.stamps,id])];celebrateQuiz(id,button);}document.querySelector('#next').hidden=false;save();}
function wire(){
 stage.querySelectorAll('[data-flip]').forEach(button=>button.onclick=()=>{
  const flipped=button.classList.toggle('is-flipped');
  button.setAttribute('aria-pressed',String(flipped));
  button.querySelector('.portrait-front').setAttribute('aria-hidden',String(flipped));
  button.querySelector('.portrait-back').setAttribute('aria-hidden',String(!flipped));
 });
stage.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));stage.querySelectorAll('[data-profile]').forEach(b=>b.onclick=()=>{state.profile=b.dataset.profile;go('profile');});stage.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>answer(b.dataset.answer,b));
const cont=document.querySelector('#continue');if(cont)cont.onclick=()=>{if(state.screen==='transition'){state.round=1;state.index=0;go('round');}else if(state.intro<2){state.intro++;save();updateCinematicDialogue();}else go('gallery');};
const start=document.querySelector('#start-check');if(start)start.onclick=()=>{
 if(state.station==='portraits'){state.station='names';state.letterIndex=0;state.letterOrder=[];beginJourney('letters');}
 else{state.station='riddles';state.round=1;state.index=0;state.stamps=[];go('round');}
};
if(state.screen==='letters')wireLetters();
if(state.screen==='journey'){stage.querySelectorAll('[data-arrive]').forEach(b=>b.onclick=arriveJourney);}
const next=document.querySelector('#next');if(next)next.onclick=()=>{if(state.index<questions.length-1){state.index++;save();render();}else completeMission();};
document.querySelector('#play-again')?.addEventListener('click',restartGame);
const passCard=document.querySelector('#monster-pass-card');if(passCard)passCard.onclick=()=>{passCard.classList.toggle('pass-sparkle');passCard.setAttribute('aria-pressed',String(passCard.classList.contains('pass-sparkle')));};
}
document.querySelector('#sound').onclick=()=>{sound=!sound;const b=document.querySelector('#sound');b.textContent=sound?'SOUND ON':'SOUND OFF';b.setAttribute('aria-pressed',String(sound));b.setAttribute('aria-label',sound?'Turn sound off':'Turn sound on');tone();};
function restartGame(){state=fresh();save();render();}
document.querySelector('#restart').onclick=restartGame;
for(const file of [...monsters.map(m=>m.asset),'assets/secret-card-face.png','assets/secret-card-table.png','assets/secret-card-back.png','assets/magic-eraser.png','assets/spell-room.png','assets/spell-orb.png','assets/hotel-gate.png','assets/3ad26a70-5601-48f9-bd42-0fc684b35cbf.png','assets/castle-interior.png','assets/success-stamp.png','assets/monster-card-back.png','assets/monster-silhouettes.png','assets/gallery-frame.svg','assets/clue-scroll.svg','assets/rescue-suitcase.png','assets/rescue-camera.png']){const img=new Image();img.src=file;}
render();

function completeMission(){
 state.complete=true;go('victory');
 try{if(window.parent!==window)window.parent.postMessage({type:'HOTEL_MISSION_COMPLETED',mission:'meet-the-monsters',code:'MONSTER1'},'*');}catch{}
}
function addListening(){
 if(!('speechSynthesis' in window))return;
 const target=state.screen==='profile'?document.querySelector('#profile-actions'):state.screen==='round'&&state.round===1?document.querySelector('#clue-audio'):null;
 if(!target)return;
 const text=state.screen==='profile'?byId(state.profile).facts.join(' '):questions[state.index][0];
 const button=document.createElement('button');button.className='listen-button secondary';button.innerHTML=state.screen==='profile'?`${profileIcon('sound')}<span>LISTEN</span>`:state.screen==='round'&&state.round===1?`${profileIcon('sound')}<span class="sr-only">Listen to the clue</span>`:'LISTEN';button.setAttribute('aria-label','Listen to the English sentences');
 button.onclick=()=>{const voice=window.speechSynthesis.getVoices().find(v=>v.localService&&/^en[-_]/i.test(v.lang));if(!voice){if(state.screen==='round'&&state.round===1){document.querySelector('#host-speech').textContent='No English voice is installed. Read the clue.';button.title='English voice unavailable';}else button.textContent='ENGLISH VOICE UNAVAILABLE';return;}window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=.82;utterance.onerror=()=>{if(state.screen==='round'&&state.round===1){const bubble=document.querySelector('#host-speech');if(bubble)bubble.textContent='Voice unavailable. Read the clue.';}else button.textContent='VOICE UNAVAILABLE';};window.speechSynthesis.speak(utterance);};target.append(button);
}

function profileIcon(kind){
 const paths={bat:'<path d="M32 20l-5-8-1 10C17 12 9 11 2 10c6 8 7 15 6 23 9-5 15-2 17 7l7 5 7-5c2-9 8-12 17-7-1-8 0-15 6-23-7 1-15 2-24 12l-1-10z"/>',fangs:'<path d="M9 17q23 18 46 0v12q-23 19-46 0z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M15 23l4 22 8-16zm34 0-4 22-8-16z"/>',sound:'<path d="M9 25h11l13-11v36L20 39H9z"/><path d="M41 22q11 10 0 20m7-28q19 18 0 36" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',star:'<path d="M32 7l6 17 18 8-18 7-6 18-7-18-17-7 17-8z"/>'};
 return `<svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true" focusable="false">${paths[kind]||paths.star}</svg>`;
}
function quizPortrait(id,index){
 const descriptions={vampire:'Pale guest with fangs and a red-lined cape',mummy:'Guest wrapped in ivory bandages',werewolf:'Furry guest with pointed ears and a bushy tail','frankenstein-monster':'Tall green guest with a square head and big boots','invisible-man':'Floating hat, goggles and clothes with no visible body',witch:'Guest with a pointed hat and a broom',ghost:'Floating white guest',zombie:'Green guest in ragged clothes'};
 return `<button class="portrait quiz-portrait theme-${id}" data-answer="${id}" aria-label="Choose portrait ${index+1}: ${descriptions[id]}"><span class="quiz-frame-crest" aria-hidden="true">✦</span><span class="portrait-art"><span class="portrait-halo" aria-hidden="true"></span><img src="${byId(id).asset}" width="1024" height="1024" alt="${descriptions[id]}" decoding="sync" fetchpriority="high"><span class="portrait-platform" aria-hidden="true"></span></span><span class="quiz-choice-mark" aria-hidden="true">◇</span></button>`;
}
function celebrateQuiz(id,button){
 feedback("That's right! "+byId(id).name+'. '+learning[id].reason,true);
 document.querySelector('#host-speech').textContent='Splendid! You found my friend!';
 const gems=document.querySelectorAll('.quiz-medallion');gems[state.index].classList.add('lit');document.querySelector('.quiz-medallions').setAttribute('aria-label',`${state.index+1} of ${questions.length} clues solved`);
 button.classList.add('quiz-winner','effect-'+id);
 const burst=document.createElement('span');burst.className='quiz-particles';burst.setAttribute('aria-hidden','true');burst.innerHTML=Array.from({length:12},(_,i)=>`<i style="--angle:${i*30}deg;--delay:${i%3*.06}s">✦</i>`).join('');button.append(burst);
 const magic=document.createElement('span');magic.className='quiz-ability';magic.setAttribute('aria-hidden','true');magic.innerHTML=id==='vampire'?profileIcon('bat'):id==='werewolf'?'☾':id==='mummy'?'≋':id==='frankenstein-monster'?'ϟ':'✧';button.append(magic);
}

function dialogueLines(){return state.screen==='intro'?["Welcome to Hotel Transylvania! I'm Count Dracula!",'Before you enter, meet my monster friends!','Can you pass the Monster Check?']:["Great! Now let's test your monster skills!"];}
function renderCinematicDialogue(){
 stage.classList.add('cinematic-dialogue');
 stage.innerHTML=`<div class="lobby-light" aria-hidden="true"></div><div class="dracula-entrance"><span class="dracula-contact-shadow" aria-hidden="true"></span><img class="dialogue-host" src="assets/3ad26a70-5601-48f9-bd42-0fc684b35cbf.png" width="1024" height="1024" alt="Friendly Count Dracula" decoding="sync" fetchpriority="high"></div><div class="cinematic-conversation"><section class="gothic-bubble" aria-label="Count Dracula says"><span class="bubble-ornament top" aria-hidden="true">${profileIcon('bat')}</span><p class="eyebrow">COUNT DRACULA</p><h1 id="dracula-dialogue" aria-live="polite" aria-atomic="true"></h1><span class="bubble-ornament bottom" aria-hidden="true">✦</span></section><div class="cinematic-actions"><button class="primary" id="continue"></button><div class="dialogue-dots" aria-label="Dialogue progress"></div></div></div>`;
 updateCinematicDialogue(false);
}
function updateCinematicDialogue(animate=true){
 const lines=dialogueLines(),n=state.screen==='intro'?state.intro:0,dialogue=document.querySelector('#dracula-dialogue'),button=document.querySelector('#continue');
 dialogue.textContent=lines[n];button.textContent=(state.screen==='transition'?'START ROUND 1':n===2?"LET'S GO!":'CONTINUE')+' →';
 document.querySelector('.dialogue-dots').innerHTML=lines.map((_,i)=>`<span class="step ${i===n?'active':''}" aria-hidden="true"></span>`).join('');document.querySelector('.dialogue-dots').setAttribute('aria-label',`Dialogue ${n+1} of ${lines.length}`);
 if(animate){dialogue.classList.remove('dialogue-line-enter');void dialogue.offsetWidth;dialogue.classList.add('dialogue-line-enter');document.querySelector('.dracula-entrance').classList.remove('dracula-acknowledge');void dialogue.offsetWidth;document.querySelector('.dracula-entrance').classList.add('dracula-acknowledge');}
}

function renderCelebration(){
 stage.classList.add('victory-celebration');
 stage.innerHTML=`<div class="celebration-rays" aria-hidden="true"></div><div class="victory-confetti" aria-hidden="true">${Array.from({length:26},(_,i)=>`<i style="--x:${(i*37)%100}%;--delay:${i%7*.15}s;--turn:${i*29}deg;--color:${['#f8d18a','#d99cba','#c2dae8'][i%3]}"></i>`).join('')}</div><div class="victory-title"><p class="eyebrow">MISSION 01 COMPLETE</p><h1>Welcome to the monster family!</h1></div><img class="victory-dracula" src="assets/3ad26a70-5601-48f9-bd42-0fc684b35cbf.png" alt="Dracula welcomes you" width="1024" height="1024" decoding="sync"><div class="victory-dialogue"><small>COUNT DRACULA</small><p>Amazing! You know all my monster friends! Welcome to our family!</p></div><div class="victory-cast">${monsters.map((m,i)=>`<div class="celebrating-monster cast-${i}">${image(m)}<span class="cast-shadow" aria-hidden="true"></span></div>`).join('')}</div><button class="award magical-pass" id="monster-pass-card" aria-label="Your official Monster Pass. Click to add a magical sparkle." aria-pressed="false"><span class="pass-corner corner-tl" aria-hidden="true">✦</span><span class="pass-corner corner-tr" aria-hidden="true">✦</span><p class="eyebrow">HOTEL TRANSYLVANIA · MONSTER PASS</p><h2>OFFICIAL MONSTER FRIEND</h2><p class="pass-message">You've met all ${monsters.length} monsters!</p><div class="pass-portraits">${monsters.map(m=>`<span>${image(m)}<i aria-hidden="true">✦</i></span>`).join('')}</div><span class="pass-ribbon" aria-hidden="true">✧ &nbsp; A FRIEND FOR ALL ETERNITY &nbsp; ✧</span></button><div class="victory-actions"><button class="primary" id="play-again">PLAY AGAIN ↻</button></div><div class="victory-pumpkin pumpkin-left" aria-hidden="true">${victoryPumpkin()}</div><div class="victory-pumpkin pumpkin-right" aria-hidden="true">${victoryPumpkin()}</div>`;
}
function victoryPumpkin(){return `<svg viewBox="0 0 150 130"><defs><radialGradient id="pumpkin-orange"><stop stop-color="#ffb653"/><stop offset=".7" stop-color="#c85423"/><stop offset="1" stop-color="#703022"/></radialGradient></defs><path d="M70 25l-4-21 18-2-4 25" fill="#5b6340"/><ellipse cx="75" cy="77" rx="67" ry="49" fill="url(#pumpkin-orange)"/><ellipse cx="75" cy="77" rx="39" ry="49" fill="none" stroke="#8b391a77" stroke-width="3"/><path d="M34 63l22-8-5 19ZM114 63l-22-8 5 19ZM44 89l19 8 11-7 12 7 20-8-9 20H55Z" fill="#ffe6a3"/></svg>`;}

function renderLetters(){
 const m=monsters[state.letterIndex];
 stage.innerHTML=heading(`STATION 02 · ${state.letterIndex+1}/${monsters.length}`,'THE SPELL ROOM','Find the letters hiding in the magic bubbles. Tap them in any order.')+`<div class="rune-arena"><div class="spell-portrait">${image(m,'letter-monster')}</div><div class="letter-bank" role="group" aria-label="Magic letter bubbles"></div></div><div class="letter-answer" role="group" aria-label="Spell the monster name"></div><p id="letter-feedback" role="status"></p><div class="letter-actions"><button class="secondary" id="clear-name">START AGAIN</button><button class="primary" id="next-name" hidden>NEXT →</button></div>`;
}
function wireLetters(){
 const m=monsters[state.letterIndex],letters=m.shortName.replaceAll(' ','').split('');
 const distractors=shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(c=>!letters.includes(c))).slice(0,3);
 if(state.runeName!==m.id||!Array.isArray(state.runeBank)){
  state.runeName=m.id;state.runeBank=shuffle([...letters,...distractors].map((letter,id)=>({letter,id})));
 }
 const bank=state.runeBank;
 let order=Array.isArray(state.letterOrder)?state.letterOrder:[];
 // Restore accepted runes, allowing any collection order and duplicate letters.
 const restored=[],counts={};
 for(const id of order){const r=bank.find(r=>r.id===id);if(!r||restored.includes(id))continue;const count=letters.filter(c=>c===r.letter).length;if((counts[r.letter]||0)<count){restored.push(id);counts[r.letter]=(counts[r.letter]||0)+1;}}
 order=restored;state.letterOrder=order;
 let bankDrawn=false;
 const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 function filledSlots(){
  const filled=[];
  for(const id of order){const rune=bank.find(r=>r.id===id),slot=letters.findIndex((c,i)=>c===rune.letter&&!filled.includes(i));if(slot>=0)filled.push(slot);}
  return filled;
 }
 function draw(){
  const solved=order.length===letters.length,filled=filledSlots();
  stage.querySelector('.letter-answer').innerHTML=letters.map((c,i)=>`<span class="letter-slot ${filled.includes(i)?'filled':''}" data-slot-index="${i}" aria-label="Letter ${i+1}: ${filled.includes(i)?c.toLowerCase():'empty'}">${filled.includes(i)?c.toLowerCase():'<span aria-hidden="true">·</span>'}</span>`).join('');
  if(!bankDrawn)stage.querySelector('.letter-bank').innerHTML=bank.map((r,i)=>{
   const side=i%2,position=Math.floor(i/2),col=position%2,row=Math.floor(position/2);
   return `<span class="rune-anchor orb-tint-${i%3}" style="--rune-x:${side?72+col*16:5+col*16}%;--rune-y:${5+row*31}%;--rune-delay:${-i*.8}s;--rune-duration:${11+i%4*2}s"><button class="letter-tile magic-rune" data-letter="${r.id}" aria-label="Letter ${r.letter.toLowerCase()}">${r.letter.toLowerCase()}</button></span>`;
  }).join('');
  bankDrawn=true;
  stage.querySelector('#next-name').hidden=!solved;
  stage.querySelector('#clear-name').hidden=solved;
  stage.querySelectorAll('[data-letter]').forEach(b=>{
   b.disabled=solved||order.includes(Number(b.dataset.letter));
   b.onpointerdown=e=>{if(e.button!==undefined&&e.button!==0)return;e.preventDefault();pick(Number(b.dataset.letter),b);};
   b.onclick=()=>pick(Number(b.dataset.letter),b);
  });
  if(solved)stage.querySelector('#letter-feedback').textContent='Spell complete! '+m.shortName.toLowerCase();
 }
 function pick(id,button){
  if(order.includes(id)||order.length===letters.length)return;
  const rune=bank.find(r=>r.id===id);if(!rune)return;
  const filled=filledSlots(),target=letters.findIndex((c,i)=>c===rune.letter&&!filled.includes(i));
  if(target<0){
   stage.querySelector('#letter-feedback').textContent='This letter belongs to another spell. Try a different bubble!';
   button.classList.add('orb-miss');setTimeout(()=>button.classList.remove('orb-miss'),550);tone(false);return;
  }
  // Commit immediately: other bubbles remain tappable while the effect plays.
  const from=button.getBoundingClientRect?.();
  order.push(id);state.letterOrder=order;save();draw();
  const slot=stage.querySelector(`[data-slot-index="${target}"]`);slot.classList.add('rune-arrival');
  if(!reduced()&&from&&button.animate){
   const to=slot.getBoundingClientRect(),bounds=stage.getBoundingClientRect(),scale=bounds.width/stage.offsetWidth;
   const spark=document.createElement('span');spark.className='flying-rune';spark.textContent=rune.letter.toLowerCase();spark.setAttribute('aria-hidden','true');
   spark.style.left=((from.left-bounds.left)/scale)+'px';spark.style.top=((from.top-bounds.top)/scale)+'px';stage.append(spark);
   const flight=spark.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${(to.left-from.left)/scale}px,${(to.top-from.top)/scale}px) scale(.55)`,opacity:0}],{duration:650,easing:'cubic-bezier(.2,.7,.3,1)',fill:'forwards'});
   flight.finished.then(()=>spark.remove(),()=>spark.remove());
  }
  stage.querySelector('#letter-feedback').textContent=order.length===letters.length?'Spell complete! '+m.shortName.toLowerCase():'Lovely! Find another letter.';
  tone(true);
 }
 stage.querySelector('#clear-name').onclick=()=>{order=[];state.letterOrder=[];save();draw();stage.querySelector('#letter-feedback').textContent='The spell is ready. Try again!';};
 stage.querySelector('#next-name').onclick=()=>{if(order.length!==letters.length)return;state.letterOrder=[];state.runeBank=null;state.runeName=null;if(state.letterIndex<monsters.length-1){state.letterIndex++;go('letters');}else{state.station='facts';beginJourney('card-table');}};
 draw();save();
}

function beginJourney(target){state.journeyTarget=target;go('journey');}
function arriveJourney(){
 const target=state.journeyTarget;
 if(!['letters','card-table','round'].includes(target))return;
 state.journeyTarget=null;go(target);
}
function renderJourney(){
 const scenes={letters:{number:'02',title:'The Spell Room',line:'You know their names! Follow me to the magic bubbles.',asset:'assets/spell-room.png'},'card-table':{number:'03',title:'The Secret Card Table',line:'Your spell worked! A mysterious deck is waiting. Each card holds a monster secret.',asset:'assets/secret-card-table.png'},round:{number:'04',title:'The Riddle Hall',line:'You discovered every secret! Now my friends have some riddles for you.',asset:'assets/castle-interior.png'}};
 const scene=scenes[state.journeyTarget]||scenes.letters;
 stage.style.setProperty('--journey-art',`url('${scene.asset}')`);
 stage.innerHTML=`<div class="journey-veil"></div><button class="journey-skip" data-arrive aria-label="Skip transition and enter the next station">→</button><div class="journey-host"><img src="assets/3ad26a70-5601-48f9-bd42-0fc684b35cbf.png" alt="Count Dracula guides you to the next room"></div><section class="journey-copy"><p class="eyebrow">NEXT STOP · STATION ${scene.number}</p><h1>${scene.title}</h1><p>${scene.line}</p><button class="primary" data-arrive>LET'S GO →</button></section>`;
 const journeyRun=state,target=state.journeyTarget;journeyTimer=setTimeout(()=>{if(state===journeyRun&&state.screen==='journey'&&state.journeyTarget===target)arriveJourney();},6500);
}
function prepareCardDeck(){
 // A revealed card counts immediately, including cards revealed in older saves.
 state.viewed=[...new Set([...state.viewed,...monsters.filter(m=>state.revealed[m.id]?.length===2).map(m=>m.id)])];
 if(state.activeCard&&!byId(state.activeCard))state.activeCard=null;
 const remaining=monsters.map(m=>m.id).filter(id=>!state.viewed.includes(id)&&id!==state.activeCard);
 const existing=Array.isArray(state.cardDeck)?[...new Set(state.cardDeck)].filter(id=>remaining.includes(id)):[];
 state.cardDeck=[...existing,...shuffle(remaining.filter(id=>!existing.includes(id)))];
}
function renderCardTable(){
 prepareCardDeck();
 const complete=state.viewed.length===monsters.length;
 stage.innerHTML=`<div class="table-heading"><p class="eyebrow">STATION 03 · THE SECRET CARD TABLE</p><h1>Every card holds a secret</h1><p>Take a mystery card. Rub away the magic dust.</p></div><div class="table-progress" aria-label="${state.viewed.length} of ${monsters.length} cards discovered">${monsters.map(m=>`<span class="${state.viewed.includes(m.id)?'done':''}">✦</span>`).join('')}</div><div class="table-deck" aria-label="Face-down mystery cards">${state.cardDeck.map((id,i)=>`<button class="table-card-back" data-draw-card="${id}" aria-label="Draw mystery card ${i+1}" style="--card-angle:${(i-(state.cardDeck.length-1)/2)*7}deg;--card-x:${(i-(state.cardDeck.length-1)/2)*108}px;--card-y:${Math.abs(i-(state.cardDeck.length-1)/2)*12}px"><img src="assets/secret-card-back.png" alt="" draggable="false"></button>`).join('')}</div><div class="table-instruction">${complete?'All eight secrets discovered!':'Choose any card — who will you meet?'}</div><div class="table-collected">${monsters.filter(m=>state.viewed.includes(m.id)).map(m=>`<span>${image(m)}<small>${m.shortName}</small></span>`).join('')}</div>${complete?'<button class="primary table-finish" id="table-finish">TO THE RIDDLE HALL →</button>':''}<div id="card-overlay-host"></div>`;
 if(state.activeCard)renderSecretCard(state.activeCard);
}
function renderSecretCard(id){
 const m=byId(id);if(!m)return;
 stage.querySelector('#card-overlay-host').innerHTML=`<section class="secret-card-overlay" role="dialog" aria-modal="true" aria-labelledby="secret-card-name"><article class="secret-card-face"><div class="card-reveal-stars" aria-hidden="true">✦ · ✧ · ✦</div><button class="card-put-back" id="card-put-back" aria-label="Close this card">×</button><div class="secret-card-portrait">${image(m)}</div><div class="secret-card-copy"><h2 id="secret-card-name">${m.shortName}</h2><div class="secret-scratch"><div class="secret-facts">${m.facts.map(f=>`<p>${escapeHTML(f)}</p>`).join('')}</div><canvas id="secret-dust" width="960" height="560" aria-label="Rub away the magic dust to uncover the facts"></canvas><img class="magic-eraser" src="assets/magic-eraser.png" alt="" aria-hidden="true" draggable="false"></div><div class="secret-card-actions"><button class="text-btn" id="accessible-reveal" aria-label="Reveal both clues without rubbing">REVEAL</button><button class="primary" id="keep-card" disabled>NEXT CARD →</button></div></div></article></section>`;
}
function wireCardTable(){
 stage.querySelectorAll('[data-draw-card]').forEach(b=>b.onclick=()=>{
  if(state.activeCard||!state.cardDeck.length)return;
  const id=b.dataset.drawCard;if(!state.cardDeck.includes(id))return;
  state.activeCard=id;state.cardDeck=state.cardDeck.filter(card=>card!==id);save();render();
 });
 stage.querySelector('#table-finish')?.addEventListener('click',()=>{state.station='riddles';state.round=1;state.index=0;state.stamps=[];beginJourney('round');});
 if(!state.activeCard)return;
 const id=state.activeCard,canvas=stage.querySelector('#secret-dust'),ctx=canvas.getContext('2d'),eraser=stage.querySelector('.magic-eraser'),area=stage.querySelector('.secret-scratch');
 let down=false,last=null,revealed=false,inked=false;
 const erasedCells=new Set(),columns=48,rows=28;
 function reveal(clearCover=true){
  if(clearCover){canvas.hidden=true;eraser.hidden=true;stage.querySelector('#accessible-reveal').hidden=true;}
  if(revealed)return;revealed=true;
  state.revealed[id]=[0,1];state.viewed=[...new Set([...state.viewed,id])];state.cardDeck=state.cardDeck.filter(card=>card!==id);save();stage.querySelector('#keep-card').disabled=false;
  stage.querySelector('.secret-card-face').classList.add('secret-discovered');
  tone(true);
 }
 function cover(){
  ctx.globalCompositeOperation='source-over';ctx.fillStyle='#403358';ctx.fillRect(0,0,960,560);
  ctx.textAlign='center';
 }
 cover();
 const dustArt=new Image();dustArt.onload=()=>{
  if(inked||revealed||!canvas.isConnected)return;
  // Crop with uniform scaling: never stretch the illustration to the canvas.
  const scale=Math.max(960/dustArt.width,560/dustArt.height),w=dustArt.width*scale,h=dustArt.height*scale;
  ctx.drawImage(dustArt,(960-w)/2,(560-h)/2,w,h);ctx.fillStyle='#20152b99';ctx.fillRect(0,0,960,560);
 };dustArt.src='assets/secret-card-back.png';
 // Brush size is measured in the card's own pixels, independent of zoom.
 const radius=38;
 function moveEraser(e){
  const r=canvas.getBoundingClientRect();
  const x=Math.max(0,Math.min(960,(e.clientX-r.left)*960/r.width));
  const y=Math.max(0,Math.min(560,(e.clientY-r.top)*560/r.height));
  eraser.style.left=(x/960*100)+'%';eraser.style.top=(y/560*100)+'%';
  return {x,y};
 }
 function rub(e){
  if(canvas.hidden)return;inked=true;
  const {x,y}=moveEraser(e),start=last||{x,y};
  ctx.globalCompositeOperation='destination-out';ctx.lineWidth=radius*2;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.lineTo(x,y);ctx.stroke();
  ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();
  const steps=Math.max(1,Math.ceil(Math.hypot(x-start.x,y-start.y)/10));
  for(let step=0;step<=steps;step++){
   const px=start.x+(x-start.x)*step/steps,py=start.y+(y-start.y)*step/steps;
   for(let cy=Math.max(0,Math.floor((py-radius)/20));cy<Math.min(rows,Math.ceil((py+radius)/20));cy++)
    for(let cx=Math.max(0,Math.floor((px-radius)/20));cx<Math.min(columns,Math.ceil((px+radius)/20));cx++)
     if(Math.hypot(cx*20+10-px,cy*20+10-py)<=radius)erasedCells.add(cy*columns+cx);
  }
  last={x,y};
 }
 canvas.onpointerdown=e=>{
  if(down||e.isPrimary===false||(e.button!==undefined&&e.button!==0))return;
  e.preventDefault();down=true;last=null;canvas.setPointerCapture(e.pointerId);area.classList.add('is-rubbing');rub(e);
 };
 canvas.onpointermove=e=>{if(down)rub(e);else moveEraser(e);};
 function stopRubbing(){
  down=false;last=null;area.classList.remove('is-rubbing');
  // Completing the card never removes the remaining dust. Only the hand does.
  if(erasedCells.size/(columns*rows)>=.85)reveal(false);
 }
 canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=stopRubbing;
 stage.querySelector('#accessible-reveal').onclick=()=>reveal(true);
 function dismissCard(){
  
  if(state.activeCard!==id)return;
  if(!revealed){
   const slot=Math.floor(Math.random()*(state.cardDeck.length+1));
   state.cardDeck.splice(slot,0,id);
  }
  state.activeCard=null;save();
  const face=stage.querySelector('.secret-card-face');
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||!face.animate){render();return;}
  stage.querySelector('.secret-card-overlay').classList.add('card-leaving');
  const leave=face.animate([{transform:'translateY(0) scale(1)',opacity:1},{transform:'translateY(180px) scale(.3)',opacity:0}],{duration:500,easing:'ease-in',fill:'forwards'});
  const departingRun=state;leave.finished.then(()=>{if(state===departingRun&&state.screen==='card-table'&&!state.activeCard)render();},()=>{});
 }
 stage.querySelector('#card-put-back').onclick=dismissCard;
 stage.querySelector('#keep-card').onclick=()=>{if(revealed)dismissCard();};
 if(state.revealed[id]?.length===2)reveal();
 stage.querySelector('.secret-card-overlay').onkeydown=e=>{
  if(e.key==='Escape'){e.preventDefault();stage.querySelector('#card-put-back').click();}
  if(e.key==='Tab'){
   const buttons=[...stage.querySelector('.secret-card-overlay').querySelectorAll('button')].filter(b=>!b.disabled&&!b.hidden);
   const first=buttons[0],last=buttons[buttons.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
 };
 stage.querySelector('#card-put-back').focus();
}
