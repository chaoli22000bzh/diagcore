/* Scénario indépendant. Aucun simulateur ni serveur n'est nécessaire. */
(function(){
 'use strict';
 const facts=new Set();
 const nodes={
  start:{title:'Un poste ne reçoit pas d’adresse IPv4',text:'Le poste est connecté au réseau, mais il ne peut pas accéder aux ressources. Quelle vérification veux-tu commencer ?',choices:[['ip','Consulter la configuration IP du poste'],['cable','Contrôler la liaison réseau'],['server','Vérifier la disponibilité du service DHCP']]},
  cable:{title:'Contrôle de la liaison',text:'La liaison Ethernet est active. C’est un premier élément utile, mais il ne suffit pas à expliquer le défaut.',next:'evidence'},
  ip:{title:'Vérifier la configuration IPv4',text:'Dans cette démonstration, clique sur « Effectuer le contrôle IP » pour révéler le résultat du poste.',check:()=>facts.has('ip'),fail:'Effectue d’abord le contrôle IP dans le panneau d’observation.',next:'ipResult'},
  ipResult:{title:'Résultat de la configuration IP',text:'Le poste possède une adresse 169.254.18.27/16 : il n’a pas reçu de bail DHCP. Cette observation ne démontre pas encore que le serveur est en panne.',next:'evidence'},
  server:{title:'Contrôler le service DHCP',text:'Dans le panneau d’observation, effectue le contrôle du service DHCP.',check:()=>facts.has('server'),fail:'Effectue le contrôle du service DHCP avant de continuer.',next:'serverResult'},
  serverResult:{title:'État du serveur',text:'Le service DHCP répond sur le serveur. Il faut encore examiner le trajet des requêtes entre ce poste et le serveur.',next:'evidence'},
  evidence:{title:'Quelle piste explorer maintenant ?',text:'Tu peux poursuivre les vérifications dans l’ordre de ton choix ou proposer une hypothèse.',choices:[['ip','Revoir la configuration IP'],['server','Revoir le service DHCP'],['relay','Contrôler le relais DHCP'],['hypothesis','Formuler une hypothèse']]},
  relay:{title:'Vérifier le relais DHCP',text:'Effectue le contrôle du relais dans le panneau d’observation.',check:()=>facts.has('relay'),fail:'Effectue d’abord le contrôle du relais DHCP.',next:'relayResult'},
  relayResult:{title:'Résultat du contrôle',text:'L’adresse du serveur DHCP n’est pas configurée sur l’interface relais du VLAN de ce poste.',next:'hypothesis'},
  hypothesis:{title:'Quelle hypothèse retiens-tu ?',text:'Quelle cause explique le mieux les faits recueillis ?',choices:[['correction','Le relais DHCP du VLAN n’est pas configuré'],['wrong','Le serveur DHCP est nécessairement arrêté'],['evidence','Je souhaite effectuer d’autres vérifications']]},
  wrong:{title:'Une conclusion trop rapide',text:'Le service DHCP peut être disponible sans être accessible depuis ce VLAN. Compare les résultats avant de conclure.',next:'evidence'},
  correction:{title:'Appliquer la correction',text:'Choisis « Configurer le relais » dans le panneau d’observation. Pour cette démonstration, cette action représente la configuration du relais DHCP.',check:()=>facts.has('fixed')&&facts.has('relay'),fail:'Contrôle le relais, puis applique la correction dans le panneau d’observation.',next:'retest'},
  retest:{title:'Vérifier après correction',text:'Lance le test de renouvellement du bail dans le panneau d’observation.',check:()=>facts.has('retest')&&facts.has('fixed'),fail:'Lance le renouvellement DHCP après la correction.',next:'done'},
  done:{title:'✓ Incident résolu',text:'Après configuration du relais, le poste reçoit une adresse IPv4 du réseau attendu. La correction a été vérifiée.',complete:true}
 };
 const output=document.querySelector('#observations');
 const descriptions={ip:'IP : 169.254.18.27/16, pas de bail DHCP.',server:'Serveur : service DHCP actif.',relay:'Relais : destination DHCP absente sur le VLAN.',fixed:'Correction : relais DHCP configuré.',retest:'Retest : bail 192.168.20.42/24 obtenu.'};
 const result=document.querySelector('#result');
 const app=DiagCore.mount('#diagnostic',nodes,{
  subtitle:'Incident DHCP · Poste utilisateur',onComplete:()=>{result.textContent='Diagnostic terminé et vérifié.';},
  onStep:({id})=>{result.textContent=id==='done'?'Tu peux terminer le diagnostic.':'';}
 });
 document.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>{
  const action=button.dataset.action;
  if(action==='fixed'&&!facts.has('relay')){output.textContent='Contrôle d’abord le relais DHCP.';return;}
  if(action==='retest'&&!facts.has('fixed')){output.textContent='Applique d’abord la correction.';return;}
  facts.add(action);output.textContent=descriptions[action];
 }));
 document.querySelector('#reset-demo').addEventListener('click',()=>{facts.clear();output.textContent='Aucune vérification effectuée.';result.textContent='';app.restart();});
})();
