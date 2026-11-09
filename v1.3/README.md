# DiagCore V1.3.0 : contrat et recette

Statut : version 1.3.0 de référence pour les cours. Le répertoire `v1/` (1.2.2) est conservé comme archive technique. Les références de chargement du portail ont été vérifiées sur `main`, y compris les pages DHCP.

## Activation

Charger ensemble `v1.3/diagcore.js` et `v1.3/diagcore.css`. Monter le scénario avec `DiagCore.mount('#diagnostic', scenario, {mode:'vertical'})`.
Sans tableau `interventions` le code historique V1.2.2 est exécuté. Un tableau `interventions` non vide active le nouveau parcours, sans nouvelle option de mode. Ne pas mélanger `interventions` et l'ancienne propriété `correction`.

## Champs d'un scénario V1.3

- `groups[].checks[]` : mêmes identifiants, labels et observations que V1.2.2 ; `subtitle` facultatif ; `observe(context)` initial ; `verify(context)` facultatif après diagnostic, sinon `observe(context)` réutilisé.
- `hypotheses[]`, `requiredChecks`, `minimumChecks`, `groupPicker` : identiques au mode vertical V1.2.2.
- `interventions: [{id, label, subtitle?, execute?, observation?}]` : interventions sans classement correct/incorrect.
- `execute(context)` : résultat immédiat ou Promise. Si absent, aucune exécution n'est présumée ; une observation descriptive facultative s'affiche.
- `getRevision()` : fonction synchrone facultative renvoyant la révision technique pertinente ; le scénario choisit les changements pertinents.
- `canClose(context)` : fonction de validation obligatoire pour autoriser une clôture ; renvoie un booléen ou `{allowed:boolean,feedback:string}`, éventuellement de façon asynchrone.
- `workTitle`, `workPrompt`, `interventionTitle`, `closeLabel` : libellés personnalisables.

## Résultats et responsabilité

Exemple de retour explicite d'une intervention :

```js
{executed:true,changed:true,observation:'Service démarré',revision:2}
```

`executed` confirme l'opération ; `changed` confirme un changement technique, pas la résolution. `observation` accepte les types de V1.2.2 : texte, commande, image ou tableau de blocs. `passed` est facultatif pour les vérifications, informatif et sans clôture automatique.

Sans `getRevision`, DiagCore utilise une révision logique incrémentée exclusivement si `changed===true` est signalé. Une opération refusée ou sans changement ne fait pas augmenter cette révision. Si le simulateur expose une révision, le scénario doit la fournir via `getRevision()` pour que DiagCore puisse détecter les modifications réalisées hors de ses boutons.

Les contrôles initiaux restent comptés une seule fois par `id` dans `getCompleted()`. Les vérifications répétées sont enregistrées séparément dans l'historique et dans le contexte de clôture avec leur révision.

## Contexte transmis aux callbacks

```js
{completed: Set, revision: 2, interventions: [{id,revision,executed,changed}], verifications: [{id,revision,passed}], history: [...] }
```

Une vérification ancienne demeure dans l'historique mais le scénario doit exiger une vérification de la révision courante pour autoriser la clôture. `canClose` est aussi refusé si la révision change pendant son attente.

## Actions déclenchées par un simulateur externe

Une application peut transmettre un résultat déjà produit, sans simuler un clic :

```js
const generation = app.getGeneration();
const accepted = app.reportExternal({
  generation, operationId:'operation-unique-42',
  kind:'intervention', id:'start',
  result:{executed:true,changed:true,revision:3,observation:'Service démarré'}
});
```

`kind` vaut `intervention` ou `verification`. L'`id` doit appartenir au scénario. Un `operationId` déjà reçu, une génération périmée, une instance détruite ou une confirmation hors du parcours d'intervention sont refusés. La méthode renvoie un booléen. Une confirmation arrivant pendant une autre action DiagCore est également refusée, sans mise en file automatique : l'application peut la représenter ultérieurement si elle est encore pertinente.

## Redémarrage et opérations asynchrones

`restart()` efface toutes les données pédagogiques et incrémente la génération. `destroy()` invalide aussi les réponses encore attendues. Le contrôle de génération intervient après l'attente asynchrone et avant toute mutation DiagCore. Ces méthodes ne réinitialisent pas le simulateur. Une action technique déjà envoyée peut modifier l'état externe malgré l'invalidation de sa confirmation. La synchronisation réelle dépend du scénario ou de `getRevision()`.

## Méthodes

`restart()`, `destroy()`, `getHistory()`, `getCompleted()`, `getRevision()`, `getGeneration()`, `reportExternal(report)`.

## Démonstrateur et limites

Le démonstrateur `v1.3/demo.html` propose des actions exécutées sans changement, des modifications, des refus, des vérifications, une clôture et un appel externe. Il emploie un simulateur fictif intégré à la page. Dix tests de `tests.html` ont été exécutés avec succès dans un DOM simulé, après correction des confirmations externes invalides et des révisions d'interventions refusées. Le démonstrateur a également été validé lors d'un essai utilisateur. Ces résultats ne certifient pas chaque navigateur et chaque intégration réelle avec R2D3 ou Outlook.

Non inclus : sauvegarde persistante, R2D3 intégré, bibliothèque de simulateurs, nouveau mode graphique, notation, état technique interne.

[Exécuter les tests automatisés dans un navigateur](./tests.html). Ces tests incluent la compatibilité V1.2.2, la clôture, les générations et les confirmations externes. Ils restent à exécuter dans les navigateurs cibles.

## Contrôles de validation à exécuter

1. Scénarios historiques V1.2.2 inchangés, mode classique et vertical.
2. Deux interventions successives avant vérification et répétition d'une intervention.
3. Action refusée, sans changement ou asynchrone, doubles clics pendant attente.
4. Vérifications répétées et nouvelle révision invalidant les vérifications antérieures pour la clôture.
5. Clôture refusée, clôture validée après contrôle courant.
6. Action externe confirmée une fois et doublon refusé.
7. Redémarrage/destroy pendant une opération asynchrone : résultat tardif ignoré par DiagCore.
8. Test smartphone, contraste, sous-titres, clavier et terminaux longs.

Politique actuelle : utiliser uniquement `v1.3/diagcore.js` avec `v1.3/diagcore.css` dans les cours. Ne pas charger une seconde version dans une même page : les versions exposent toutes `window.DiagCore`. Les anciennes copies restent archivées, sans nouvelle intégration.