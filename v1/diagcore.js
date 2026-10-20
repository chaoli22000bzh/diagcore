/* DiagCore 1.0.0 - extraction minimale du moteur DiagTree (C² D3-01/D3-02). */
(function(global){
  'use strict';
  function mount(container, nodes, options){
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
    const brand=document.createElement('b');brand.className='diagcore__brand';brand.textContent=opts.brand||'DiagCore';
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
  global.DiagCore=Object.freeze({version:'1.0.0',mount});
})(window);
