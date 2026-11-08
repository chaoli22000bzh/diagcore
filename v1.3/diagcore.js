/* DiagCore 1.3.0 - extraction minimale du moteur DiagTree (C² D3-01/D3-02). */
(function(global){
  'use strict';
  function mount(container, nodes, options){
    if(options&&options.mode==='vertical')return Array.isArray(nodes&&nodes.interventions)?mountWorkflow(typeof container==='string'?document.querySelector(container):container,nodes,options):mountVertical(container,nodes,options);
    const root=typeof container==='string'?document.querySelector(container):container;
    if(!root) throw new Error('DiagCore : conteneur introuvable');
    if(!nodes||typeof nodes!=='object'||!nodes.start) throw new Error('DiagCore : scénario sans nœud start');
    const opts=options||{}, labels=Object.assign({
      subtitle:'Démarche de diagnostic', back:'← Retour', home:'↥ Début du diagnostic',
      verify:'J’ai effectué cette vérification', continue:'Continuer',
      finish:'Terminer le diagnostic', invalid:'Étape de diagnostic introuvable'
    },opts.labels||{});
    const state={history:[], completed:false};
    root.classList.add('diagcore');
    if(opts.theme==='light'||opts.theme==='dark')root.dataset.diagcoreTheme=opts.theme;
    root.replaceChildren();
    const header=document.createElement('header');header.className='diagcore__head';
    const brand=document.createElement('b');brand.className='diagcore__brand';brand.textContent=opts.brand||'Diagnostic';
    const subtitle=document.createElement('span');subtitle.className='diagcore__subtitle';subtitle.textContent=opts.subtitle||labels.subtitle;
    header.append(brand,subtitle);
    const body=document.createElement('div');body.className='diagcore__body';
    const footer=document.createElement('footer');footer.className='diagcore__footer';
    const back=document.createElement('button');back.type='button';back.textContent=labels.back;
    const home=document.createElement('button');home.type='button';home.textContent=labels.home;
    footer.append(back,home);root.append(header,body,footer);
    function render(id,push=true){
      const node=nodes[id];
      if(!node){body.textContent=labels.invalid+' : '+id;return;}
      if(push&&state.history.at(-1)!==id)state.history.push(id);
      state.completed=false;
      back.disabled=state.history.length<2;
      body.replaceChildren();
      const step=document.createElement('section');step.className='diagcore__step';
      const kicker=document.createElement('span');kicker.className='diagcore__kicker';kicker.textContent=labels.subtitle;
      const title=document.createElement('h3');title.textContent=node.title||'';
      const para=document.createElement('p');para.textContent=node.text||'';
      const feedback=document.createElement('div');feedback.className='diagcore__feedback';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
      const actions=document.createElement('div');actions.className='diagcore__actions';
      step.append(kicker,title,para,feedback,actions);body.append(step);
      function button(text,handler){
        const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',handler);actions.append(b);
      }
      if(Array.isArray(node.choices)){
        node.choices.forEach(([to,label])=>button(label,()=>render(to)));
      }else if(node.next){
        button(node.check?labels.verify:labels.continue,()=>{
          let ok=true;
          try{if(typeof node.check==='function')ok=Boolean(node.check(opts.context));}
          catch(err){ok=false;if(typeof opts.onError==='function')opts.onError(err);}
          if(!ok){feedback.textContent='⚠ '+(node.fail||'Vérification non validée.');feedback.classList.add('diagcore__feedback--warn');return;}
          render(node.next);
        });
      }
      if(node.returnToTp||node.complete){
        button(opts.finishLabel||labels.finish,()=>{
          state.completed=true;
          if(typeof opts.onComplete==='function')opts.onComplete({history:[...state.history],node:id});
          root.dispatchEvent(new CustomEvent('diagcore:complete',{bubbles:true,detail:{history:[...state.history],node:id}}));
        });
      }
      if(typeof opts.onStep==='function')opts.onStep({id,node,history:[...state.history]});
    }
    back.addEventListener('click',()=>{
      if(state.history.length<2)return;
      state.history.pop();
      render(state.history.pop());
    });
    home.addEventListener('click',()=>{state.history=[];render('start');});
    render('start');
    return {restart:()=>{state.history=[];render('start');},goTo:id=>render(id),getHistory:()=>[...state.history],destroy:()=>root.replaceChildren()};
  }

  // Mode vertical facultatif : le mode DiagTree historique reste inchangé.
  function mountVertical(container,scenario,options){
    const root=typeof container==='string'?document.querySelector(container):container;
    if(!root)throw Error('DiagCore : conteneur introuvable');
    const s=scenario||{},opts=options||{},groups=s.groups||[];
    if(!Array.isArray(groups)||!groups.length)throw Error('DiagCore : groupes de contrôles manquants');
    const checks=groups.flatMap(group=>group.checks||[]);
    if(checks.some(c=>!c.id||!c.label)||new Set(checks.map(c=>c.id)).size!==checks.length)throw Error('DiagCore : identifiants de contrôles invalides');
    const state={done:new Set(),history:[],phase:'checks',resolved:false,selectedGroup:null};
    root.classList.add('diagcore','diagcore--vertical');
    if(opts.theme==='light'||opts.theme==='dark')root.dataset.diagcoreTheme=opts.theme;
    root.replaceChildren();
    const timeline=document.createElement('div');timeline.className='diagcore__timeline';
    const next=document.createElement('section');next.className='diagcore__next';
    root.append(timeline,next);
    function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}
    function btn(parent,label,run,disabled=false){const b=el('button','diagcore__choice',label);b.type='button';b.disabled=disabled;b.addEventListener('click',run);parent.append(b);return b;}
    function appendPart(parent,observation){
      if(observation==null)return;
      const parts=Array.isArray(observation)?observation:[observation];
      parts.forEach(part=>{
        const data=typeof part==='string'?{type:'text',text:part}:part;
        if(!data)return;
        if(data.type==='command'){const p=el('pre','diagcore__terminal');const code=el('code',null,data.text||'');p.append(code);parent.append(p);}
        else if(data.type==='image'){const fig=el('figure','diagcore__figure');const img=el('img');img.src=data.src;img.alt=data.alt||'';img.loading='lazy';fig.append(img);if(data.caption)fig.append(el('figcaption',null,data.caption));parent.append(fig);}
        else parent.append(el('p',null,data.text||''));
      });
    }
    function addEntry(type,title,observation,extraClass=''){
      const article=el('article','diagcore__entry diagcore__entry--'+type+(extraClass?' '+extraClass:''));
      article.append(el('h3',null,title));
      appendPart(article,observation);
      timeline.append(article);
      state.history.push({type,title});
    }
    function scroll(observation=false){const target=observation?timeline.lastElementChild:next;if(target)requestAnimationFrame(()=>target.scrollIntoView({behavior:'smooth',block:'start'}));}
    function hasRequired(arr){return (arr||[]).every(id=>state.done.has(id));}
    function show(){
      next.replaceChildren();
      if(state.phase==='checks'){
        if(s.title)next.append(el('h2','diagcore__title',s.title));
        if(s.prompt)next.append(el('p','diagcore__prompt',s.prompt));
        const visible=checks;
        if(s.groupPicker&&state.selectedGroup===null){
          const grid=el('div','diagcore__equipment-grid');
          for(const [index,group] of groups.entries()){
            const pending=(group.checks||[]).filter(c=>visible.includes(c));
            const b=btn(grid,group.title||('Équipement '+(index+1)),()=>{
              state.selectedGroup=index;show();scroll();
            });
             if(pending.length&&pending.every(c=>state.done.has(c.id)))b.classList.add('diagcore__choice--visited');
            b.classList.add('diagcore__equipment');
          }
          next.append(grid);
        }
        for(const [groupIndex,group] of groups.entries()){
          if(s.groupPicker&&state.selectedGroup!==groupIndex)continue;
          const pending=(group.checks||[]).filter(c=>visible.includes(c));
          if(!pending.length)continue;
          const sec=el('div','diagcore__group');
          if(group.title)sec.append(el('h3','diagcore__group-title',group.title));
          for(const c of pending){const control=btn(sec,c.label,()=>{
            if(typeof c.enabled==='function'&&!c.enabled({completed:new Set(state.done)}))return;
            state.done.add(c.id);
            state.selectedGroup=null;
            const result=typeof c.observe==='function'?c.observe({completed:new Set(state.done)}):c.observation;
            addEntry('observation',c.label,[...(c.action?[{type:'text',text:c.action}]:[]),...(Array.isArray(result)?result:[result])]);
            show();scroll(true);
          });
          if(state.done.has(c.id))control.classList.add('diagcore__choice--visited');
          }
          next.append(sec);
        }
        if(s.groupPicker&&state.selectedGroup!==null){
          const back=btn(next,'← Choisir un autre équipement',()=>{state.selectedGroup=null;show();scroll();});
          back.classList.add('diagcore__equipment-back');
        }
        const min=Math.max(0,s.minimumChecks||0);
        if(s.hypotheses?.length&&(!s.hideHypothesisUntilReady||state.done.size>=min)){
          const diagnosticArea=el('div','diagcore__diagnostic-area');
          const diagnosticButton=btn(diagnosticArea,s.hypothesisLabel||'Formuler une hypothèse',()=>{
            state.phase='hypotheses';state.selectedGroup=null;show();scroll();
          },state.done.size<min);
          diagnosticButton.classList.add('diagcore__diagnostic-button');
          next.append(diagnosticArea);
          if(state.done.size<min)next.append(el('p','diagcore__hint',(min-state.done.size)+' contrôle(s) supplémentaire(s) nécessaire(s).'));
        }
      }else if(state.phase==='hypotheses'){
        next.append(el('h2','diagcore__title',s.hypothesisTitle||'Quelle hypothèse retiens-tu ?'));
        for(const h of s.hypotheses||[])btn(next,h.label,()=>{
          const valid=Boolean(h.correct)&&hasRequired(h.requiredChecks);
          addEntry(valid?'decision':'feedback',h.label,valid?(h.feedback||'Hypothèse retenue.'):(!h.correct?(h.feedback||'Cette hypothèse ne correspond pas aux faits observés.'):(h.prematureFeedback||'Certaines vérifications indispensables manquent.')),valid?'diagcore__entry--hypothesis-correct':'diagcore__entry--hypothesis-wrong');
          state.phase=valid?'correction':'checks';show();scroll();
        });
        btn(next,s.backLabel||'Poursuivre les contrôles',()=>{state.phase='checks';show();scroll();});
      }else if(state.phase==='correction'){
        const c=s.correction||{};
        next.append(el('h2','diagcore__title',c.title||'Appliquer la correction'));
        btn(next,c.label||'Effectuer la correction',()=>{
          if(!hasRequired(c.requiredChecks)){
            addEntry('feedback','Intervention prématurée',c.prematureFeedback||'Des contrôles indispensables sont manquants.');
            state.phase='checks';show();scroll();return;
          }
          addEntry('action',c.label||'Correction',c.observation||'Correction effectuée.');
          state.phase='verification';show();scroll();
        });
      }else if(state.phase==='verification'){
        const v=s.verification||{};
        next.append(el('h2','diagcore__title',v.title||'Vérifier la correction'));
        btn(next,v.label||'Effectuer le contrôle final',()=>{
          const result=typeof v.check==='function'?v.check({completed:new Set(state.done)}):true;
          const valid=Boolean(result);
          addEntry(valid?'observation':'feedback',v.label||'Contrôle final',valid?v.observation:(v.failure||'La correction n’est pas confirmée.'));
          state.phase=valid?'finished':'checks';show();scroll();
          if(valid){state.resolved=true;if(typeof opts.onComplete==='function')opts.onComplete({history:[...state.history],completed:[...state.done]});root.dispatchEvent(new CustomEvent('diagcore:complete',{bubbles:true,detail:{history:[...state.history],completed:[...state.done]}}));}
        });
      }else next.append(el('p','diagcore__complete',s.success||'Diagnostic terminé : correction vérifiée.'));
    }
    function reset(){state.done.clear();state.history=[];state.phase='checks';state.selectedGroup=null;state.resolved=false;timeline.replaceChildren();show();}
    show();
    return {restart:reset,getHistory:()=>[...state.history],getCompleted:()=>[...state.done],destroy:()=>root.replaceChildren()};
  }


  // V1.3 : extension facultative du parcours vertical. Aucun état technique n'est détenu ici.
  function mountWorkflow(root,scenario,options){
    const s=scenario,opts=options||{},groups=s.groups||[];
    if(!Array.isArray(groups)||!groups.length)throw Error('DiagCore : groupes manquants');
    const checks=groups.flatMap(g=>g.checks||[]);
    const actions=s.interventions||[];
    if(!root)throw Error('DiagCore : conteneur introuvable');
    if(!actions.length||checks.some(c=>!c.id||!c.label)||actions.some(a=>!a.id||!a.label))throw Error('DiagCore : contrôles ou interventions invalides');
    if(new Set(checks.map(c=>c.id)).size!==checks.length||new Set(actions.map(a=>a.id)).size!==actions.length)throw Error('DiagCore : identifiants dupliqués');
    const st={done:new Set(),history:[],phase:'checks',selectedGroup:null,revision:0,interventions:[],verifications:[],externalIds:new Set(),pending:false,generation:0,destroyed:false,diagnosis:null};
    root.classList.add('diagcore','diagcore--vertical');
    if(opts.theme==='light'||opts.theme==='dark')root.dataset.diagcoreTheme=opts.theme;
    root.replaceChildren();
    const timeline=document.createElement('div'),next=document.createElement('section');
    timeline.className='diagcore__timeline';next.className='diagcore__next';root.append(timeline,next);
    function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=String(text);return e;}
    function button(parent,label,run,subtitle){
      const b=el('button','diagcore__choice');b.type='button';
      b.append(el('span','diagcore__button-main',label));
      if(subtitle)b.append(el('span','diagcore__button-subtitle',subtitle));
      b.addEventListener('click',run);parent.append(b);return b;
    }
    function appendObservation(parent,value){
      for(const part of Array.isArray(value)?value:[value]){
        if(part==null)continue;
        const data=typeof part==='string'?{type:'text',text:part}:part;
        if(data.type==='command'){const pre=el('pre','diagcore__terminal');pre.append(el('code',null,data.text||''));parent.append(pre);}
        else if(data.type==='image'){const fig=el('figure','diagcore__figure'),img=el('img');img.src=data.src;img.alt=data.alt||'';img.loading='lazy';fig.append(img);if(data.caption)fig.append(el('figcaption',null,data.caption));parent.append(fig);}
        else parent.append(el('p',null,data.text||''));
      }
    }
    function entry(type,title,observation,meta={}){
      const card=el('article','diagcore__entry diagcore__entry--'+type+(meta.style?' '+meta.style:''));
      card.append(el('h3',null,title));appendObservation(card,observation);
      timeline.append(card);
      st.history.push({type,title,...meta,revision:revision()});
    }
    function revision(){
      if(typeof s.getRevision==='function'){
        try{const r=s.getRevision();if((typeof r==='string'&&r!=='')||typeof r==='number')return r;}catch(e){/* conserver la dernière révision connue */}
      }
      return st.revision;
    }
    function context(){return {completed:new Set(st.done),revision:revision(),interventions:st.interventions.map(x=>({...x})),verifications:st.verifications.map(x=>({...x})),history:st.history.map(x=>({...x}))};}
    function validResult(raw){
      if(raw&&typeof raw==='object'&&!Array.isArray(raw)&&('executed'in raw||'changed'in raw||'observation'in raw||'passed'in raw||'allowed'in raw))return raw;
      return {executed:true,changed:false,observation:raw};
    }
    function updateRevision(result){
      if(result.revision!==undefined&&result.revision!==null){
        if(typeof result.revision==='number'||typeof result.revision==='string')st.revision=result.revision;
      }else if(result.changed===true&&typeof s.getRevision!=='function'){
        st.revision=typeof st.revision==='number'?st.revision+1:String(st.revision)+'+';
      }
    }
    function complete(){
      st.phase='finished';show();
      const detail={history:st.history.map(x=>({...x})),completed:[...st.done],revision:revision()};
      if(typeof opts.onComplete==='function')opts.onComplete(detail);
      root.dispatchEvent(new CustomEvent('diagcore:complete',{bubbles:true,detail}));
    }
    function scroll(){const target=timeline.lastElementChild||next;if(target)requestAnimationFrame(()=>target.scrollIntoView({behavior:'smooth',block:'start'}));}
    function apply(kind,item,result,external=false){
      updateRevision(result);
      const rev=revision();
      const name=item.label||item.id;
      const observation=result.observation!==undefined?result.observation:(result.executed===false?'Opération non exécutée.':'Opération terminée.');
      if(kind==='control'){
        if(result.executed!==false)st.done.add(item.id);
        entry(result.executed===false?'feedback':'observation',name,observation,{id:item.id,kind,executed:result.executed!==false});
      }else if(kind==='intervention'){
        st.interventions.push({id:item.id,revision:rev,executed:result.executed===true,changed:result.changed===true,external});
        entry(result.executed===false?'feedback':'action',name,observation,{id:item.id,kind,executed:result.executed===true,changed:result.changed===true});
      }else if(kind==='verification'){
        if(result.executed!==false)st.verifications.push({id:item.id,revision:rev,passed:result.passed===true,external});
        entry(result.executed===false?'feedback':'observation',name,observation,{id:item.id,kind,passed:result.passed===true,executed:result.executed!==false});
      }
      st.selectedGroup=null;show();scroll();
    }
    async function perform(kind,item,operation){
      if(st.pending||st.destroyed)return;
      const generation=st.generation;
      st.pending=true;next.querySelectorAll('button').forEach(b=>b.disabled=true);
      try{
        let output=typeof operation==='function'?operation(context()):operation;
        output=await output;
        if(st.destroyed||generation!==st.generation)return;
        const r=validResult(output);
        apply(kind,item,r);
      }catch(error){
        if(st.destroyed||generation!==st.generation)return;
        apply(kind,item,{executed:false,changed:false,observation:'Opération impossible : '+(error&&error.message?error.message:String(error))});
      }finally{
        if(!st.destroyed&&generation===st.generation){st.pending=false;show();}
      }
    }
    async function askClose(){
      if(st.pending||st.destroyed)return;
      const generation=st.generation;st.pending=true;next.querySelectorAll('button').forEach(b=>b.disabled=true);
      try{
        if(typeof s.canClose!=='function'){
          entry('feedback','Clôture refusée','Aucune condition de clôture définie par le scénario.',{kind:'close',allowed:false});return;
        }
        const r=await s.canClose(context());
        if(st.destroyed||generation!==st.generation)return;
        const allowed=r===true||(r&&r.allowed===true);
        const message=r&&typeof r==='object'?r.feedback:undefined;
        entry(allowed?'decision':'feedback',allowed?'Clôture acceptée':'Clôture refusée',message||(allowed?'Incident résolu et vérifié.':'Poursuis les vérifications avant de clôturer.'),{kind:'close',allowed});
        if(allowed)complete();else scroll();
      }catch(error){
        if(st.destroyed||generation!==st.generation)return;
        entry('feedback','Clôture refusée','Validation impossible : '+(error&&error.message?error.message:String(error)),{kind:'close',allowed:false});
      }finally{if(!st.destroyed&&generation===st.generation){st.pending=false;show();}}
    }
    function show(){
      if(st.destroyed)return;
      next.replaceChildren();
      if(st.phase==='finished'){next.append(el('p','diagcore__complete',s.success||'Diagnostic terminé.'));return;}
      const working=st.phase==='work';
      if(st.phase==='checks'||working){
        next.append(el('h2','diagcore__title',working?(s.workTitle||'Poursuivre le dépannage'):(s.title||'Choisir un contrôle')));
        if(working)next.append(el('p','diagcore__prompt',s.workPrompt||'Le dépannage n’est pas terminé. Vérifie si l’incident est résolu.'));
        else if(s.prompt)next.append(el('p','diagcore__prompt',s.prompt));
        if(s.groupPicker&&st.selectedGroup===null){
          const grid=el('div','diagcore__equipment-grid');
          groups.forEach((g,index)=>{
            const b=button(grid,g.title||'Équipement '+(index+1),()=>{st.selectedGroup=index;show();});
            b.classList.add('diagcore__equipment');
            if((g.checks||[]).length&&(g.checks||[]).every(c=>st.done.has(c.id)))b.classList.add('diagcore__choice--visited');
          });next.append(grid);
        }
        groups.forEach((group,index)=>{
          if(s.groupPicker&&st.selectedGroup!==index)return;
          const section=el('div','diagcore__group');
          if(group.title)section.append(el('h3','diagcore__group-title',group.title));
          (group.checks||[]).forEach(c=>{
            const b=button(section,c.label,()=>{
              if(typeof c.enabled==='function'&&!c.enabled(context()))return;
              if(working){
                perform('verification',c,typeof c.verify==='function'?c.verify:typeof c.observe==='function'?c.observe:()=>c.observation);
              }else{
                perform('control',c,typeof c.observe==='function'?c.observe:()=>c.observation);
              }
            },c.subtitle);
            if(st.done.has(c.id))b.classList.add('diagcore__choice--visited');
          });
          next.append(section);
        });
        if(s.groupPicker&&st.selectedGroup!==null){
          button(next,'← Choisir un autre équipement',()=>{st.selectedGroup=null;show();}).classList.add('diagcore__equipment-back');
        }
        if(working&&(!s.groupPicker||st.selectedGroup===null)){
          const area=el('div','diagcore__workflow');
          area.append(el('h3','diagcore__group-title',s.interventionTitle||'Interventions possibles'));
          actions.forEach(a=>button(area,a.label,()=>{
            if(typeof a.enabled==='function'&&!a.enabled(context()))return;
            const operation=typeof a.execute==='function'?a.execute:()=>({executed:false,changed:false,observation:a.observation||'Aucune exécution technique confirmée.'});
            perform('intervention',a,operation);
          },a.subtitle));
          button(area,s.closeLabel||'Demander la clôture',askClose).classList.add('diagcore__diagnostic-button');
          next.append(area);
        }
        if(!working){
          const min=Math.max(0,s.minimumChecks||0);
          if(s.hypotheses&&s.hypotheses.length&&(!s.hideHypothesisUntilReady||st.done.size>=min)){
            const b=button(next,s.hypothesisLabel||'Formuler une hypothèse',()=>{st.phase='hypotheses';st.selectedGroup=null;show();});
            b.classList.add('diagcore__diagnostic-button');b.disabled=st.done.size<min;
          }
          if(st.done.size<min)next.append(el('p','diagcore__hint',(min-st.done.size)+' contrôle(s) supplémentaire(s) nécessaire(s).'));
        }
      }else if(st.phase==='hypotheses'){
        next.append(el('h2','diagcore__title',s.hypothesisTitle||'Quelle hypothèse retiens-tu ?'));
        (s.hypotheses||[]).forEach(h=>button(next,h.label,()=>{
          const correct=!!h.correct&&(h.requiredChecks||[]).every(id=>st.done.has(id));
          entry(correct?'decision':'feedback',h.label,correct?(h.feedback||'Hypothèse retenue.'):(!h.correct?(h.feedback||'Cette hypothèse ne correspond pas aux faits observés.'):(h.prematureFeedback||'Certaines vérifications indispensables manquent.')),{kind:'hypothesis',style:correct?'diagcore__entry--hypothesis-correct':'diagcore__entry--hypothesis-wrong',correct});
          if(correct){st.diagnosis=h.label;st.phase='work';}else st.phase='checks';
          show();scroll();
        }));
        button(next,s.backLabel||'Poursuivre les contrôles',()=>{st.phase='checks';show();});
      }
    }
    function reportExternal(report){
      if(st.destroyed||st.pending||st.phase!=='work'||!report||report.generation!==st.generation)return false;
      const id=String(report.operationId||'');
      if(!id||st.externalIds.has(id))return false;
      const kind=report.kind;
      const item=kind==='intervention'?actions.find(x=>x.id===report.id):kind==='verification'?checks.find(x=>x.id===report.id):null;
      if(!item)return false;
      st.externalIds.add(id);
      apply(kind,item,validResult(report.result));
      return true;
    }
    function restart(){
      st.generation++;st.done.clear();st.history=[];st.phase='checks';st.selectedGroup=null;st.revision=0;st.interventions=[];st.verifications=[];st.externalIds.clear();st.diagnosis=null;st.pending=false;timeline.replaceChildren();show();
    }
    show();
    return {restart,getHistory:()=>st.history.map(x=>({...x})),getCompleted:()=>[...st.done],
      getRevision:revision,getGeneration:()=>st.generation,reportExternal,
      destroy:()=>{st.generation++;st.destroyed=true;root.replaceChildren();}};
  }

  global.DiagCore=Object.freeze({version:'1.3.0',mount});
})(window);
