# Bannières d’affiliation

La liste `/admin/posts` propose une recherche (titre, slug, catégorie), les filtres langue/statut, une pagination de 25 lignes et une sélection conservée entre les pages. « Sélectionner les résultats sur toutes les pages » sélectionne les identifiants de tous les résultats chargés par l’endpoint existant, qui retourne actuellement la liste complète. Un changement de filtre efface la sélection. Le formulaire fige les identifiants sélectionnés à son ouverture.

Le formulaire commun permet de coller le code complet, de nommer le bloc et de choisir son mode public. Les codes dépassant 100 000 caractères sont refusés avec une explication, jamais tronqués. L’aperçu s’actualise sur demande dans une iframe opaque (`sandbox="allow-scripts allow-popups"`, sans `allow-same-origin`, sans accès au document parent). Aucun code de bannière n’est inséré directement dans le DOM de l’administration.

## Stockage et édition

Les bannières restent dans le contenu ordonné :

```html
<aside class="affiliate-block affiliate-block--banner"
  data-affiliate-block="banner"
  data-affiliate-source="CODE_COMPLET_ENCODE_URI"
  data-affiliate-name="NOM_ENCODE_URI"
  data-affiliate-mode="native"
  contenteditable="false">Bannière d’affiliation</aside>
```

L’encodage URI est réversible : il protège les scripts, pixels, iframes, espaces et paramètres du code source des transformations du navigateur. Les commandes de l’éditeur ne sont pas enregistrées. `lib/content/affiliate.ts` et `src/lib/affiliate.ts` côté API contiennent le même format et les mêmes fonctions ; conserver leur cohérence lors d’une évolution.

Les anciens blocs `data-affiliate-block="banner"` sont reconnus par un parseur HTML, y compris en présence d’éléments imbriqués. Leur contenu est conservé dans le nouveau format lors d’une modification dans l’éditeur. Les blocs `link`, liens de texte, images et intégrations ordinaires ne sont pas traités comme des bannières.

Chaque bloc, bouton ou bannière, possède Modifier / remplacer, Supprimer, une poignée de déplacement et Monter / Descendre. Pour un bouton, « Modifier / remplacer » rouvre le formulaire prérempli avec son URL et son texte ; « Enregistrer les modifications » remplace uniquement ce bloc à sa position. Ces commandes restent disponibles après sauvegarde et rechargement et ne sont pas enregistrées dans le contenu public. Les boutons n’ont ni fond ni contour autour du bloc ; la mention « Lien affilié » apparaît sous le bouton, y compris pour les anciens blocs. Les URL et les relations sponsorisées sont conservées. Le déplacement utilise le nœud existant ; le glisser-déposer permet de le positionner avant ou après les paragraphes/sections. Avec plusieurs anciennes bannières, utiliser les commandes du bloc voulu : le remplacement en lot refuse cet article et ne supprime aucun bloc arbitrairement.

## Traitement en lot

Le proxy Next appelle `POST /admin-api/posts/affiliate-banner` de l’API :

```json
{"ids":["identifiant-fr"],"source":"<script src=\"https://plateforme.example/banner.js\"></script>","name":"Campagne","mode":"native"}
```

Le rôle `ADMIN` est exigé par l’API ; `EDITOR`, `USER` et les requêtes anonymes sont refusés pour cette opération. Les routes classiques de création/édition empêchent également un `EDITOR` d’ajouter ou de modifier le code actif, encodé ou directement présent dans le HTML. `contentJson.html` doit correspondre à `contentHtml` lorsqu’il est fourni.

Le client envoie des groupes de 100 identifiants (limite API : 200). Chaque article est relu côté serveur. Le bloc est ajouté en fin de contenu ou remplacé à sa position. Les champs `contentHtml`, `contentMarkdown` et `contentJson.html` sont synchronisés sans changer les autres propriétés du document JSON. Les autres champs de l’article, relations, métadonnées, dates de publication et traductions ne sont pas modifiés ; `updatedAt` évolue normalement. Les formats structurés sans champ HTML sont signalés comme incompatibles plutôt que détruits.

Une écriture conditionnelle sur `updatedAt` protège contre les changements intervenus depuis la lecture, avec trois tentatives sur une version fraîche. Si les représentations HTML et JSON divergent, l’article est signalé sans écrasement. Les sauvegardes du formulaire utilisent également une révision expectedUpdatedAt et reçoivent 409 si une action en lot ou une autre sauvegarde a modifié l’article entre-temps. Une application identique est déclarée inchangée. La réponse contient les résultats individuels `modified`, `unchanged`, `failed` et leurs totaux. La relance des seuls échecs est idempotente, y compris après une réponse réseau perdue ; les réussites précédentes restent incluses dans le bilan. Un résultat individuel absent est signalé comme un échec, jamais comme une réussite implicite.

## Rendu public et limites

- **Dans la page (`native`, valeur par défaut)** : rendu natif des liens/images/iframes ; les scripts sont recréés explicitement à leur position. Les scripts externes sans `async` sont attendus avant le script suivant. Les scripts `async` conservent leur comportement asynchrone. Les scripts ne sont pas réexécutés lors d’un simple nouveau rendu React ; un nouveau montage après navigation initialise la bannière une fois pour cette visite. Les liens reçoivent les relations sponsorisées sans réécrire leurs URL.
- **Document isolé (`isolated`, choix explicite)** : document iframe avec exécution normale à l’analyse, adapté notamment à `document.write`. Hauteur initiale de 300 px, ajustable verticalement. Les liens sont aussi marqués sponsorisés. Ce mode ne donne pas accès au DOM ni au stockage de la page parente ; les fournisseurs qui l’exigent doivent utiliser le mode dans la page.
- Un `document.write(...)` directement identifiable dans le code est signalé dans le formulaire et refusé à l’exécution en mode natif, avec un message visible. Le contenu distant d’un script externe n’est pas inspecté : choisir explicitement le document isolé si le fournisseur documente cet usage.
- L’aperçu reste toujours isolé, quel que soit le mode public. Il ne prouve pas la compatibilité d’un fournisseur avec le domaine public.
- Les restrictions de domaine, la CSP, les bloqueurs, le consentement, les cookies tiers et les règles propres aux régies restent à vérifier avec leurs codes réels. Les scripts de fournisseurs supposant un unique chargement global, un événement `DOMContentLoaded` déjà passé ou un nettoyage propriétaire nécessitent une validation particulière en navigation Next.js. Un script tiers natif peut laisser des variables/écouteurs globaux ; aucun nettoyage universel de ce code n’est possible.
- Le code actif natif est du code de confiance administrateur et dispose des droits de la page publique. Les bannières sont activées après hydratation JavaScript. La hauteur d’un document isolé ne peut pas être mesurée automatiquement depuis le parent opaque.

Aucune migration SQL, publication ni déploiement n’est nécessaire pour préparer ces changements. Installer la nouvelle dépendance `parse5` dans les deux dépôts avant compilation.

## Vérifications réalisées

- TypeScript : les deux dépôts.
- Build : API et Next.js réussis (64 pages générées par Next.js).
- Suite API : tests de conservation exacte, position, anciens blocs, ambiguïté explicite, absence de doublon, droits, portée linguistique, préservation du statut/SEO, relance et concurrence.
- Chromium avec scripts, pixels et iframe de test : édition, ajout/remplacement, suppression, déplacement par poignée et boutons, sérialisation/rechargement, aperçu opaque, scripts externes puis inline, liens sponsorisés, paramètres d’URL, chargement direct, navigation Next.js, nouveau rendu React, viewport mobile et `document.write` isolé.
- Liste admin avec réponses API simulées : sélection de la page, de tous les résultats, changement de langue, compteur, payload exact et relance des échecs.

Ces vérifications utilisent des fournisseurs de test et une persistance de test ; elles ne modifient aucune donnée de production et ne valident pas la comptabilisation de commissions par une régie réelle.

Le compte rendu détaillé des onze scénarios et les limites exactes des tests se trouvent dans `affiliate-audit.md`.

La suite `npm run test:postgres` de l’API vérifie désormais la persistance et la concurrence sur PostgreSQL réel, via une connexion de test locale explicite. Les résultats locaux et CI sont consignés dans `affiliate-audit.md` ; ils complètent les premiers tests avec stockage simulé.
