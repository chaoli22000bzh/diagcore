# DiagCore

Moteur pédagogique autonome de diagnostic et de dépannage, en JavaScript et CSS, destiné aux cours DHCP, DNS, Messagerie et Incidents.

## Version de référence : DiagCore 1.3.0

**La V1.3 est désormais la seule version recommandée pour les cours et les nouvelles intégrations.** Les cours du portail pédagogique ont été migrés vers cette version, y compris le diagnostic principal DHCP et sa page historique de test (vérification des références dans la branche `main`).

Le moteur peut fonctionner avec les scénarios historiques de la V1.2.2 sans imposer leur conversion. Un scénario qui déclare `interventions` active le nouveau parcours multi-interventions.

### Ressources officielles

- [Documentation technique et contrat V1.3](v1.3/README.md)
- [Moteur JavaScript V1.3](v1.3/diagcore.js)
- [Feuille CSS V1.3](v1.3/diagcore.css)
- [Démonstrateur V1.3](v1.3/demo.html)
- [Tests automatisés V1.3](v1.3/tests.html)

### Intégration recommandée

Charger **une seule version de DiagCore par page**, avec son CSS de la même version :

```html
<link rel="stylesheet" href="https://chaoli22000bzh.github.io/DiagCore/v1.3/diagcore.css">
<div id="mon-diagnostic"></div>
<script src="https://chaoli22000bzh.github.io/DiagCore/v1.3/diagcore.js"></script>
```

Puis monter le scénario depuis le JavaScript du cours :

```js
if (!window.DiagCore?.version?.startsWith('1.3.')) {
  throw new Error('DiagCore V1.3 indisponible');
}
const instance = DiagCore.mount('#mon-diagnostic', scenario, {mode:'vertical'});
```

**Ne jamais charger deux versions dans une même page.** Toutes exposent l'objet global `window.DiagCore` : un second chargement remplacerait la première implémentation. Ne pas mélanger non plus les feuilles CSS de versions différentes.

Les scénarios, les observations, les interfaces de simulateur et les règles de validation restent propres à chaque cours. DiagCore ne dépend ni de R2D3, ni d'Outlook, ni de C².

### Fonctionnalités principales

- Sélection de groupes et de contrôles, contrôles répétables, hypothèses et historique.
- Interventions multiples, librement enchaînées et répétables.
- Vérifications multiples associées aux révisions techniques pertinentes.
- Exécution synchrone ou asynchrone et confirmation explicite d'actions réalisées dans un simulateur externe.
- Clôture autorisée par le scénario, jamais déduite automatiquement d'un bouton d'intervention.
- Redémarrage indépendant des simulateurs et protection contre les résultats asynchrones tardifs.
- Affichage responsive et sous-titres facultatifs dans les boutons.

### État de validation

Les dix tests automatisés de la V1.3 ont réussi dans un environnement DOM simulé. Le démonstrateur a été validé lors d'un essai utilisateur. Les essais automatisés ne constituent pas à eux seuls une certification exhaustive sur tous les navigateurs ni une validation de chaque intégration avec un simulateur réel.

## Politique des anciennes versions

Les fichiers des anciennes versions, dont `v1/` (V1.2.2), sont **conservés uniquement comme archives techniques et solution de retour arrière**.

- Aucune nouvelle ressource pédagogique ne doit y faire référence.
- Il n'est pas nécessaire de supprimer les archives pour utiliser uniquement la V1.3 dans les cours.
- La présence d'une ancienne version dans GitHub n'entraîne pas son chargement dans les pages.
- **Les anciennes URL peuvent encore être accessibles** tant que les fichiers restent publiés par GitHub Pages. Les supprimer pour bloquer leur accès serait une opération distincte, à décider après vérification des éventuels liens externes.
- L'historique complet des changements reste disponible dans les commits Git et les fichiers archivés.

Pour tout nouveau développement, toute correction ou toute documentation opérationnelle, utiliser exclusivement le dossier [`v1.3/`](v1.3/).
