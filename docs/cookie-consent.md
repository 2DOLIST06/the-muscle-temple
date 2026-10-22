# Consentement interne hors affiliation

## Inventaire du code au 22 octobre 2026

Le registre de production (`lib/consent/registry.ts`) est vide : aucun outil de
statistiques, publicité hors affiliation ou préférence facultative trouvé dans le
frontend, ses dépendances, les fichiers publics ou l’API. Aucun GA/GTM/pixel ajouté.
La bannière reste affichée en l’absence de service déclaré, conformément à la
demande produit. Elle est non modale et ne bloque jamais la navigation. Accepter et
refuser enregistrent un choix vide pour six mois ; aucun futur service n’est ainsi
autorisé. Personnaliser et le lien du pied de page ouvrent un dialogue indiquant
l’absence actuelle de cookie facultatif géré. Fermer le dialogue ne vaut pas choix.

Éléments préservés, nécessaires aux fonctionnalités demandées :

| Élément | Usage / point de chargement |
| --- | --- |
| `user_jwt`, `admin_jwt` | Cookies HttpOnly de connexion, 12 h ; routes `user-api/auth` et `admin-api/login` |
| `mt_admin_posts` | Données de l’éditeur, `components/admin/post-storage.ts` |
| `admin-header-hidden` | Commande d’affichage de l’en-tête administrateur, `SiteShell` |
| `adminToken` | Authentification du panneau distinct de l’API (`src/routes/admin/panel.ts`) |
| Newsletter | Envoi demandé aux routes applicatives, aucun stockage navigateur identifié |
| Recherche alimentaire | API applicative, requêtes Open Food Facts côté serveur |
| Scanner | Caméra sur demande et autorisation navigateur, bibliothèque ZXing locale |
| Contenus/images | API éditoriale, Next Image et hôtes configurés (CloudFront, Unsplash), pas de SDK de suivi identifié |
| JSON-LD | Données structurées non exécutables, pas un service de mesure |

Les liens, images liées, bannières, widgets et suivis d’affiliation ainsi que
`AffiliateHtml.tsx` sont exclus. Ce travail ne certifie pas l’ensemble du site ni
les contenus dynamiques de tiers. Aucun scanner automatique n’est fourni.

## Ajouter un service facultatif

1. Examiner ses finalités et son comportement réel. Déclarer dans `services` un
   identifiant unique, un nom, la finalité FR/EN, la catégorie, les ressources
   (scripts, endpoints, embeds), les informations `disclosure` (fournisseur,
   durées réelles par clé, lien vers sa politique et éventuels cookies tiers), `activate`, `stop` et les clés exactes à nettoyer
   (cookies avec path/domain, localStorage, sessionStorage). Aucun classement
   automatique d’après le nom des cookies ; aucune suppression par préfixe.
2. Mettre TOUTE initialisation facultative dans `activate`. Le seul appel à cette
   méthode appartient à `ConsentManager`. Une déclaration ne lance aucune ressource.
   Aucun import avec effet de bord, script JSX, preload/preconnect, iframe, pixel,
   CSS externe ou requête initiale hors de cette fonction. Les modules SDK peuvent
   être importés dynamiquement à cet endroit seulement. Si cet import est asynchrone,
   vérifier un signal d’annulation avant de poursuivre : un retrait peut survenir
   pendant l’import. Ne jamais appeler `activate` depuis un composant de page.
3. `activate` est synchrone : il démarre les travaux et doit installer immédiatement
   leur mécanisme d’annulation. `stop` doit annuler les tâches en attente, timers,
   événements, workers et appels, et empêcher tout futur accès facultatif. Retourner
   `stopped` uniquement si cela est garanti ; sinon retourner `reload`. Retirer une
   balise script déjà exécutée ne suffit pas. Les erreurs d’arrêt déclenchent aussi
   le rechargement après enregistrement du choix.
4. Incrémenter `policyVersion` après tout changement de finalité ou d’implémentation.
   La signature des identifiants/finalités/catégories/ressources/nettoyages invalide
   aussi les anciens choix lorsqu’un registre change. Mettre à jour les deux langues
   des pages cookies/confidentialité et tester chaque nouvelle intégration.
5. Le précontrôle de build `scripts/check-consent-integrations.mjs` signale les
   signatures courantes GA/GTM/Meta/Clarity/Hotjar ajoutées directement hors des
   adaptateurs `lib/consent/services/`. Il ne détecte pas tout code obfusqué ni le
   contenu distant : la revue reste nécessaire. Les adaptateurs doivent être
   importés uniquement par le registre, sans effet de bord ; la déclaration et le
   branchement par `activate` restent obligatoires. Les catégories, le panneau et
   le blocage suivent alors automatiquement le registre.
6. Ne pas modifier les intégrations d’affiliation dans ce circuit. Ne jamais déclarer
   les clés d’authentification, d’administration ou du consentement comme facultatives
   (le constructeur refuse ces clés connues).

## Cycle de vie et limites

Le provider unique du layout survit aux navigations Next.js. Le moteur vérifie le
stockage avant toute activation, et ne démarre chaque service qu’une fois. Il ne
modifie ni `fetch`, ni les méthodes DOM, ni le getter/setter global de cookies.
Un choix `btg_consent` ne contient que `categories`, `chosenAt`, `version`. Six mois
calendaires à date fixe, sans réécriture à la visite (fin de mois bornée au dernier
jour du mois cible). Expiration, changement d’onglet, retour sur la page et focus
revalident le choix ; les timers peuvent être suspendus par le navigateur en arrière-plan.
Le dialogue natif assure modalité, clavier, focus et fermeture par Échap ; le lien
du pied de page permet tout refus ou retrait.

Le stockage inaccessible ou une écriture non confirmée maintient les services
bloqués, y compris après un retour de focus dans le même document. Le choix ne peut
pas être garanti entre rechargements si le navigateur refuse sa persistance. Un
échec est affiché et peut être retenté explicitement. Le nettoyage vise seulement
les clés exactes déclarées ; il ne peut pas effacer les cookies HttpOnly ou de
domaines tiers. Les requêtes déjà envoyées ne peuvent pas être annulées rétroactivement.
Tout futur SDK doit respecter le contrat d’arrêt, vérifié lors de son intégration.

## Contrôles

`node --experimental-strip-types --test test/*.test.mjs` exécute le service factice
uniquement dans les tests : blocage initial, refus et rechargement, catégories,
retrait, nettoyage ciblé, expiration, version, stockage indisponible, activation
unique et rechargement après arrêt impossible. Vérifications projet :
`npm run typecheck`, `npm run build` et lint avec la configuration existante.


### Tests navigateur reproductibles

Prérequis : Python Playwright et Chromium (`/usr/bin/chromium` dans cet environnement).
Les scripts ne déploient rien et utilisent des identifiants factices. Après le build,
lancer dans des terminaux séparés :

```sh
node test/consent-auth-stub.mjs
API_BASE_URL=http://127.0.0.1:3201 npm run start -- --hostname 127.0.0.1 --port 3199
python3 test/consent-browser.py
python3 test/consent-auth-browser.py
```

Le premier script navigateur couvre navigation sans choix, FR/EN, mobile,
personnalisation, Échap, choix persisté, expiration, valeur invalide et stockage
inaccessible. Le second vérifie les routes Next de connexion membre/admin avec
une API amont factice, la conservation des cookies HttpOnly après refus et
rechargement, ainsi que le confinement/restauration du focus au clavier.
Ces contrôles ne vérifient pas les identifiants ni les sessions de production.

### Résultats du 22 octobre 2026

- TypeScript, lint du projet et build Next.js : réussis (64 pages générées).
- 14 scénarios du moteur, 1 du contrôle d’intégration et 8 tests existants
  d’origine des requêtes administratives : réussis.
- Les deux parcours Chromium ci-dessus passent sur la version compilée, notamment
  les connexions avec API factice et le confinement/restauration du focus.
- Comparaison à HEAD : fichiers d’affiliation et d’authentification examinés,
  textes d’affiliation FR/EN et dépôt API inchangés. Aucun déploiement effectué.
- Environnement de test Node 24 ; la cible déclarée du projet reste Node 22.

Fichiers créés/modifiés : `app/AppLayoutBoundary.tsx`,
`components/layout/Footer.tsx`, `components/layout/SiteShell.tsx`,
`components/legal/LegalDocument.tsx`, `components/legal/CookieServiceInventory.tsx`,
`components/consent/ConsentProvider.tsx`,
`lib/consent/registry.ts`, `lib/consent/manager.ts`,
`scripts/check-consent-integrations.mjs`, `package.json`,
`docs/cookie-consent.md`, `test/cookie-consent.test.mjs`,
`test/consent-integrations.test.mjs`, `test/cookie-inventory.test.mjs`,
`test/consent-browser.py`,
`test/consent-auth-stub.mjs`, `test/consent-auth-browser.py`.


### Inventaire public relié au registre

Les routes `/cookies` et `/fr/cookies`, déjà liées depuis le footer, rendent
`CookieServiceInventory` à partir du même registre que le moteur. Une nouvelle
entrée apparaît donc dans la politique lors du déploiement de cette entrée, avec
fournisseur, catégorie, finalité, ressources, cookies propriétaires (nom, domaine,
chemin), localStorage, sessionStorage, durées de conservation et politique du
fournisseur. Décrire les durées par clé dans `disclosure.retention` si elles varient.
Les éventuels cookies de domaines tiers se déclarent dans
`disclosure.thirdPartyCookies`, séparément des clés nettoyables.

Ce rendu ne lance jamais `activate`, ne lit pas le stockage du visiteur et n’est
pas un scanner. Les mécanismes nécessaires restent documentés séparément. Les
mentions de services absents ne restent plus figées quand le registre change.
Le test `test/cookie-inventory.test.mjs` vérifie le registre vide et un service
factice FR/EN sans activation. Mettre à jour la date de la politique lors d’un
changement de fond ; l’ajout d’une entrée ne constitue pas une validation juridique.
