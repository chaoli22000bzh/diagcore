# DiagCore

Moteur de diagnostic pédagogique autonome, extraction minimale de la logique de **DiagTree** (C²). Aucun fichier de C² n'a été modifié.

## Version initiale 1.0.0

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

Les styles sont préfixés `.diagcore` ou `.diagcore__...` et n'affectent pas le reste des cours. Le thème suit `prefers-color-scheme` par défaut ; l'option `theme:'light'` ou `theme:'dark'` le force. Les couleurs principales peuvent être personnalisées par les variables CSS `--dc-bg`, `--dc-surface`, `--dc-text`, `--dc-muted`, `--dc-border`, `--dc-hover`. Définir les surcharges avec une spécificité suffisante pour les thèmes automatiques.

## Périmètre actuel

Cette première version conserve la logique pédagogique de DiagTree. Les choix exprimés par l'élève ne constituent pas, à eux seuls, des preuves : les contrôles effectifs passent par `check()`. Pas de sauvegarde de progression ni de moteur de preuve général. Les scénarios restent indépendants du moteur. Ne pas modifier les fichiers de `v1/` d'une façon incompatible avec les cours déjà publiés.

Avant intégration en production, tester les parcours dans les navigateurs cibles et vérifier que GitHub Pages est activé.
