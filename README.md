# DiagCore

Moteur de diagnostic pédagogique autonome, extraction minimale de la logique de **DiagTree** (C²). Aucun fichier de C² n'a été modifié.

## Version 1.2.2 : résultats de Mon diagnostic

Les résultats des hypothèses utilisent désormais les couleurs de QCMCore : bordure verte `#00d958` si l'hypothèse est validée et orange `#ff9900` si elle est erronée ou prématurée. Les fonds sont foncés pour assurer une lecture en blanc dans les thèmes clair et sombre. Le style est appliqué uniquement aux entrées de la phase `hypotheses` via les classes `diagcore__entry--hypothesis-correct` et `diagcore__entry--hypothesis-wrong`. Observations, corrections, retests, historique et validation restent inchangés. La famille `1.2.` est conservée pour la compatibilité avec Messagerie.

## Version 1.2.1 : navigation libre (mode vertical)

- La version autonome a été réalignée sur la copie des portails pour conserver `groupPicker`, `hideHypothesisUntilReady`, le sélecteur de catégories et les styles associés.
- Un contrôle déjà consulté reste cliquable et peut afficher à nouveau son observation. Les catégories entièrement consultées restent actives.
- Un bouton consulté est identifié par `.diagcore__choice--visited` (bleu clair, y compris en mode sombre).
- `state.done` demeure un ensemble d'identifiants distincts : les répétitions ne gonflent pas `minimumChecks`, `requiredChecks` ni `getCompleted()`.
- Chaque ouverture d'une observation ajoute une nouvelle entrée dans `getHistory()`. `restart()` efface historique, contrôles distincts et catégorie choisie.
- La présentation historique sans `mode:'vertical'` n'est pas modifiée.

**Intégration dans les portails :** lors d'une opération distincte, remplacer ensemble `ressources/diagcore/v1/diagcore.js` et `ressources/diagcore/v1/diagcore.css` par les fichiers homologues du dépôt autonome. Actualiser si nécessaire les paramètres de cache `?v=` des deux ressources dans les cours, sans toucher aux scripts de scénario. Le numéro `1.2.1` conserve volontairement la famille `1.2.` exigée par le scénario Messagerie actuel.

## Version 1.2.1 (mode vertical facultatif)

- `v1/diagcore.js` : navigation, embranchements, historique, retour, redémarrage, vérification via `check()` et fin de parcours.
- `v1/diagcore.css` : styles de DiagTree isolés et préfixés, interface responsive, thèmes clair et sombre.
- `demo/index.html` et `demo/scenario.js` : démonstration DHCP sans simulateur ni serveur.

Démonstration prévue sur GitHub Pages : https://chaoli22000bzh.github.io/diagcore/demo/

**Attention :** l'URL publique nécessite l'activation préalable de GitHub Pages dans les paramètres du dépôt (source : `main`, dossier `/`).

## Utilisation depuis un cours

```html
<link rel="stylesheet" href="https://chaoli22000bzh.github.io/diagcore/v1/diagcore.css">
<div id="mon-diagnostic"></div>
<script src="https://chaoli22000bzh.github.io/diagcore/v1/diagcore.js"></script>
```

Puis, dans un script chargé après DiagCore :

```js
const nodes = {
  start: {title:'Incident',text:'Que vérifier ?',choices:[['test','Vérifier le poste']]},
  test: {title:'Contrôle',text:'Effectue le contrôle.',check:()=>true,fail:'Contrôle manquant.',next:'done'},
  done: {title:'Terminé',text:'Problème résolu.',complete:true}
};
DiagCore.mount('#mon-diagnostic',nodes,{onComplete:()=>console.log('Diagnostic terminé')});
```

Les attributs historiques de DiagTree sont conservés : `title`, `text`, `choices`, `next`, `check`, `fail`, `returnToTp`. Pour un nouveau scénario, préférer `complete:true`. Les contrôles restent des fonctions JavaScript : pas de conversion JSON obligatoire.

## Thèmes et isolation

L'en-tête affiche un nom pédagogique configurable avec l'option `brand` (par exemple `brand:'Diagnostic DHCP'`). Le moteur utilise « Diagnostic » par défaut. Les règles de navigation et de progression sont inchangées.

Les styles sont préfixés `.diagcore` ou `.diagcore__...` et n'affectent pas le reste des cours. Le thème suit `prefers-color-scheme` par défaut ; l'option `theme:'light'` ou `theme:'dark'` le force. Les couleurs principales peuvent être personnalisées par les variables CSS `--dc-bg`, `--dc-surface`, `--dc-text`, `--dc-muted`, `--dc-border`, `--dc-hover`. Définir les surcharges avec une spécificité suffisante pour les thèmes automatiques.


## Mode vertical optionnel (1.2.0)

Le mode classique reste celui par défaut. Pour activer le parcours vertical, utiliser `mode:'vertical'` avec un scénario déclarant des groupes de contrôles.

[Exemple générique vertical](https://chaoli22000bzh.github.io/diagcore/demo/vertical.html)

```js
const scenario = {
  title:'Choisis une vérification',
  minimumChecks:1,
  groups:[{title:'Poste',checks:[
    {id:'ip',label:'Consulter la configuration IPv4',
     action:'Commande : ipconfig /all',
     observation:{type:'command',text:'IPv4 : 169.254.10.3'}}
  ]}],
  hypotheses:[{label:'Absence de réponse DHCP',correct:true,requiredChecks:['ip']}],
  correction:{label:'Appliquer une correction',requiredChecks:['ip'],observation:'Correction appliquée'},
  verification:{label:'Retester le poste',check:()=>true,observation:'Bail DHCP reçu'},
  success:'Diagnostic terminé.'
};
DiagCore.mount('#diagnostic',scenario,{mode:'vertical'});
```

**Contrats principaux :**

- `groups[].checks[]` définit les contrôles par équipement ou catégorie. Chaque contrôle possède `id`, `label`, une éventuelle `action` et `observation`, qui peut être une valeur ou une fonction `observe({completed})`.
- `observation` accepte du texte, `{type:'text',text}`, `{type:'command',text}`, `{type:'image',src,alt,caption}`, ou un tableau de ces blocs. Les images sont fournies par le scénario.
- `minimumChecks` limite l'accès aux hypothèses. `hypotheses[]` définit `label`, `correct`, `requiredChecks`, `feedback`, `prematureFeedback`.
- `correction` et `verification` sont indépendantes du DHCP. Leurs libellés et observations sont configurables. `verification.check({completed})` peut refuser une validation finale.
- La timeline s'allonge vers le bas ; le contrôle et son résultat sont affichés ensemble. Les hypothèses erronées permettent de reprendre l'exploration.
- `onComplete` fonctionne aussi en mode vertical. L'instance expose `restart()`, `getHistory()`, `getCompleted()`, `destroy()`.
- Le mode vertical ne modifie ni les scénarios classiques ni les TP C².

**Limites de la première extraction :** un contrôle est simulé par les observations fournies dans le scénario et est enregistré dès qu'il est sélectionné. Pour une vérification technique réelle, employer un adaptateur spécifique via `observe` et `verification.check`. Aucune commande réseau réelle n'est exécutée depuis le navigateur.

## Périmètre actuel

Cette première version conserve la logique pédagogique de DiagTree. Les choix exprimés par l'élève ne constituent pas, à eux seuls, des preuves : les contrôles effectifs passent par `check()`. Pas de sauvegarde de progression ni de moteur de preuve général. Les scénarios restent indépendants du moteur. Ne pas modifier les fichiers de `v1/` d'une façon incompatible avec les cours déjà publiés.

Avant intégration en production, tester les parcours dans les navigateurs cibles et vérifier que GitHub Pages est activé.
