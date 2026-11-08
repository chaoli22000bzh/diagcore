/* Simulateur fictif indépendant de DiagCore. */
(function(){
'use strict';
const tech={on:false,revision:0};let app;let sequence=0;
const status=document.querySelector('#technical');
function display(){status.textContent='Simulateur : DHCP '+(tech.on?'actif':'arrêté')+' | Révision '+tech.revision;}
function ip(){return {type:'command',text:'IPv4 : '+(tech.on?'192.168.1.104':'169.254.12.8')+'\nPasserelle : '+(tech.on?'192.168.1.1':'absente')};}
const scenario={
 title:'Que contrôler ?',groupPicker:true,minimumChecks:1,hideHypothesisUntilReady:true,
 getRevision:()=>tech.revision,
 workTitle:'Intervenir ou vérifier',workPrompt:'Le dépannage n’est pas terminé. Vérifie si l’incident est résolu.',
 groups:[{title:'PC',checks:[
  {id:'ip',label:'Afficher la configuration IPv4',subtitle:'ipconfig /all',observe:()=>({executed:true,observation:ip()}),verify:()=>({executed:true,observation:ip(),passed:tech.on})},
  {id:'ping',label:'Tester la passerelle',subtitle:'ping 192.168.1.1',observe:()=>({executed:true,observation:tech.on?'Réponse reçue':'Destination inaccessible',passed:tech.on})}
 ]},{title:'Serveur',checks:[
  {id:'service',label:'Contrôler le service DHCP',observe:()=>({executed:true,observation:tech.on?'Actif':'Arrêté',passed:tech.on})}
 ]}],
 hypotheses:[
  {label:'Le service DHCP est arrêté',correct:true,requiredChecks:['ip'],feedback:'Hypothèse retenue. Poursuis les interventions.'},
  {label:'Le DNS est en panne',correct:false,feedback:'Une adresse APIPA indique d’abord un problème DHCP.'}
 ],
 interventions:[
  {id:'renew',label:'Renouveler le bail',subtitle:'ipconfig /renew',execute:async()=>{
   await new Promise(resolve=>setTimeout(resolve,400));
   return {executed:true,changed:false,observation:tech.on?'Bail renouvelé.':'Serveur DHCP injoignable.'};
  }},
  {id:'start',label:'Démarrer le service DHCP',subtitle:'Service DHCP',execute:async()=>{
   await new Promise(resolve=>setTimeout(resolve,400));
   const changed=!tech.on;tech.on=true;if(changed)tech.revision++;display();
   return {executed:true,changed,revision:tech.revision,observation:changed?'Service démarré.':'Service déjà actif.'};
  }},
  {id:'refused',label:'Essayer une action refusée',execute:()=>({executed:false,changed:false,observation:'Accès refusé.'})}
 ],
 canClose:({revision,verifications})=>{
  const checked=verifications.some(v=>v.id==='ip'&&v.revision===revision);
  return {allowed:tech.on&&checked,feedback:!tech.on?'La panne persiste.':checked?'Incident résolu et vérifié.':'Vérifie la configuration actuelle avant de clôturer.'};
 },
 success:'Diagnostic terminé : incident résolu et vérifié.'
};
function start(){if(app)app.destroy();app=DiagCore.mount('#diag',scenario,{mode:'vertical'});display();}
document.querySelector('#restart').addEventListener('click',()=>{app.restart();display();});
document.querySelector('#resetBoth').addEventListener('click',()=>{tech.on=false;tech.revision++;app.restart();display();});
document.querySelector('#external').addEventListener('click',()=>{
 const generation=app.getGeneration(),operationId='sim-'+(++sequence);
 const changed=!tech.on;tech.on=true;if(changed)tech.revision++;display();
 const ok=app.reportExternal({generation,operationId,kind:'intervention',id:'start',result:{executed:true,changed,revision:tech.revision,observation:'Action externe confirmée.'}});
 if(!ok)status.textContent+=' | Confirmation non acceptée : termine d’abord le diagnostic initial.';
});
start();
})();