# Audit des bannières d’affiliation

Vérification du code effectivement modifié, avec corrections et tests de démonstration. Aucune publication, aucun déploiement et aucun suivi d’affiliation réel.

## Défauts corrigés

1. Le contrôle d’origine du proxy comparait l’origine navigateur au nom d’hôte interne de Next.js. Un vrai clic pouvait recevoir 403 alors qu’un appel sans Origin réussissait. Le contrôle utilise désormais Host et le protocole transmis par le proxy ; les origines étrangères et opaques restent refusées.
2. Une page d’édition ouverte avant une action en lot pouvait réenregistrer son ancienne copie et effacer la nouvelle bannière. Le formulaire transmet maintenant `expectedUpdatedAt`, renouvelle sa révision après chaque sauvegarde et reçoit 409 si la copie est périmée. L’écriture manuelle vérifie également la révision atomiquement pendant la mise à jour. Les révisions avancent strictement, même pour deux écritures dans la même milliseconde.
3. Le rendu attendait des événements load de scripts non exécutables (`application/json`) ou ignorés (`nomodule`) et pouvait ainsi bloquer les scripts suivants. Il attend uniquement les scripts exécutables concernés. Un module marqué async n’est plus attendu comme un script bloquant.
4. La relance des seuls échecs remplaçait le bilan complet par celui de la reprise. Les réussites antérieures sont maintenant conservées. Une réponse omettant le résultat d’un identifiant est signalée comme un échec explicite ; une relance après une réponse perdue/incomplète ne réécrit pas une bannière identique.
5. Le traitement en lot choisissait silencieusement contentJson.html si ce champ contredisait le HTML public. L’article est maintenant signalé sans écrasement, afin de réconcilier les deux versions.
6. Monter/Descendre ne permettait pas de sortir d’une section lorsque la bannière atteignait sa limite. Les commandes permettent désormais de franchir le parent dans le contenu éditable.
7. Un code Unicode accepté à la limite des 100 000 caractères pouvait dépasser la limite HTTP de 1 Mo après son encodage et les copies du contenu dans la sauvegarde. Les routes de création et d’édition acceptent maintenant jusqu’à 4 Mo ; le code n’est pas tronqué.

## Scénarios effectivement exécutés

| Scénario demandé | Vérification réalisée | Résultat |
| --- | --- | --- |
| 1. Articles sans bannière | Appels via le proxy Next réel et les routes Fastify réelles ; comparaison des corps avant/après | Ajout en fin de chaque corps |
| 2. Mélange avec/sans bannière | Traitement d’articles vides, d’un bloc placé et d’un bloc historique | Remplacement à la position existante, ajout pour les autres |
| 3. Applications répétées | Trois répétitions, contrôle du nombre de blocs et des résultats API | Une seule bannière ; articles inchangés |
| 4. Déplacement et réouverture | Vrais événements souris Chromium, sauvegarde PUT du formulaire réel, GET et rechargement complet de la page | Bloc déplacé entre deux paragraphes, source et position conservées |
| 5. Remplacement en lot après déplacement | Remplacement via le proxy, comparaison du corps enregistré, rechargement et édition | Position personnalisée conservée |
| 6. Modification/suppression individuelle | Commandes du formulaire réel, sauvegardes, comparaison complète d’un second article | Aucun changement du second article |
| 7. Code complet | HTML, Unicode, CRLF, image, pixel, iframe, script externe puis inline, stockage encodé et relu ; aperçu dans iframe opaque | Contenu complet conservé ; scripts absents de la fenêtre admin ; accès au parent refusé ; rendu public et requêtes locales vérifiés séparément |
| 8. Direct et navigation Next.js | Vraie route publique /fr/articles/empty, lien vers la liste puis retour via Next Link ; sentinelle JS conservée dans le document | Une initialisation par visite ; aucune duplication dans le bloc ; viewport mobile vérifié |
| 9. Tous les résultats filtrés | 213 résultats sur 9 pages de 25 lignes ; 3 requêtes réelles de 100/100/13 identifiants ; échec injecté sur un article et reprise de ce seul article | Les 213 corps sont effectivement mis à jour ; bilan final cumulatif de 213 réussites |
| 10. Anciennes bannières et contenus ordinaires | Parseur HTML, remplacement d’un ancien aside, vérification de liens affiliés texte, bloc link et image ordinaire ; plusieurs anciennes bannières | Ancien bloc reconnu ; contenus ordinaires conservés ; ambiguïté signalée sans suppression arbitraire |
| 11. Droits, erreurs, concurrence | Refus API pour EDITOR/USER/anonyme ; refus proxy des origines étrangères/opaques ; erreur de stockage, épuisement des reprises, révision périmée, course pendant sauvegarde ; réponse client incomplète après écriture réussie | Refus attendus ; échecs individuels ; reprise idempotente ; aucun écrasement de la version récente dans ces tests |

Tests navigateur supplémentaires exécutés :

- Nouveau rendu React sans changement du HTML : scripts externes et inline toujours exécutés une seule fois.
- Scripts nomodule et application/json avant un script classique : aucune attente bloquante.
- Module async avec attente interne : le script inline suivant reste indépendant de son achèvement.
- document.write dans le document isolé : texte effectivement affiché.
- Échec du chargement d’un script externe : message visible et poursuite du script suivant.
- Commandes Monter/Descendre dans une section imbriquée, viewport mobile.
- Résultat individuel omis après une véritable écriture API : échec affiché, reprise déclarée inchangée, aucun doublon et aucune nouvelle écriture.

Les liens et paramètres d’URL ont été comparés au code de démonstration ; les relations sponsorisées et la présence des éléments ordinaires ont été contrôlées dans le DOM.

## Nature et limites des preuves

Le navigateur Chromium a utilisé les composants, le formulaire, le proxy Next.js et les routes Fastify réels. Les lectures et sauvegardes de ces routes utilisaient un adaptateur de stockage **en mémoire**, commun aux requêtes et conservé lors des rechargements navigateur. Cette première campagne ne vérifiait ni PostgreSQL ni le redémarrage du serveur ; la campagne PostgreSQL réelle ci-dessous complète maintenant ces preuves.

Les courses et erreurs de stockage ont été injectées dans cet adaptateur. Les clauses Prisma conditionnelles sur updatedAt et le traitement P2025 ont été vérifiés par lecture du code et exercés via cet adaptateur ; leur exécution SQL a depuis été validée par la campagne PostgreSQL ci-dessous. Un test de charge prolongé reste hors périmètre.

Les scripts, images, pixels et iframes de démonstration n’appellent que 127.0.0.1. Les origines externes du navigateur et les images optimisées distantes ont été bloquées ou remplacées par une image inoffensive. Aucun code de régie réelle n’a été utilisé. Un textarea affiche normalement CRLF sous forme LF ; le transport/stockage encodé du code fourni à l’API conserve ses caractères d’origine lorsqu’il n’est pas modifié.

Restent à valider avec un code fournisseur réel et son environnement autorisé : restrictions de domaine/CSP, consentement, cookies tiers, pixels effectivement comptabilisés et commissions. Certains scripts dépendent de DOMContentLoaded, d’un état global unique ou d’une procédure de nettoyage propre au fournisseur ; les tests de démonstration ne prouvent pas leur compatibilité. Le document isolé ne dispose pas de l’origine ni du DOM parent et sa hauteur initiale reste fixe et ajustable.

Le glisser-déposer a été exercé sur Chromium desktop ; les commandes de déplacement ont aussi été exercées sur un viewport mobile. Safari, Firefox et les gestes tactiles natifs ne sont pas couverts.

## Vérifications automatisées et reproduction

Résultats finaux : **42 tests API réussis, 8 tests d’origine du proxy réussis, aucun échec**. Les builds de l’API et de Next.js réussissent ; Next.js génère 64 pages après retrait de la route de vérification temporaire. Les contrôles TypeScript et git diff --check réussissent dans les deux dépôts. Le build Next.js a été effectué sans backend distant (URL de boucle locale indisponible), ce qui vérifie la compilation et les chemins de repli, pas un pré-rendu de contenu de production. Les parcours de contenu réels ont été vérifiés séparément dans Chromium avec le serveur de test local.

- API : `npm test` dans the-muscle-temple-api. Les tests affiliate-workflow utilisent les vraies routes avec l’adaptateur de test défini dans test/affiliate-fixture-helper.ts.
- Origines du proxy : `node --experimental-strip-types --test test/admin-request-origin.test.mjs` dans the-muscle-temple, avec Node compatible avec l’effacement natif des types (environnement de vérification : Node 24 ; projet ciblé : Node 22).
- Types et build : `npm run typecheck` et `npm run build` dans chaque dépôt.
- Les parcours Chromium ont été exécutés depuis les scripts de travail work/audit-affiliate avec des serveurs locaux dédiés. La route de vérification React temporaire est retirée après les tests ; elle ne fait pas partie du produit livré.

Aucune migration de schéma n’est requise. Le nouveau champ de requête expectedUpdatedAt est optionnel pour conserver la compatibilité des clients API existants, mais le formulaire d’administration l’envoie systématiquement lorsqu’une révision a été chargée. Un client ancien qui n’envoie pas cette révision ne bénéficie pas de la détection d’une copie périmée antérieure à la requête ; il bénéficie néanmoins de la vérification pendant l’écriture.


## Validation PostgreSQL réelle avant PR

Instance dédiée créée pour cet audit : PostgreSQL 16.15, conteneur local `btg-affiliate-pg-test`, port publié uniquement sur `127.0.0.1:55439`, base `btg_affiliate_test`, données éphémères en tmpfs. Les dix migrations existantes ont été appliquées sur cette base vide. Aucune connexion de production ni donnée de production n’a été utilisée.

Le test `the-muscle-temple-api/test/affiliate-postgres.integration.ts` utilise un vrai PrismaClient et les vrais endpoints Fastify via app.inject. Une seconde connexion Prisma et une requête SELECT SQL relisent les données enregistrées. Les garde-fous exigent AFFILIATE_TEST_DATABASE_URL explicite, une adresse locale, un nom de base btg_affiliate_test et ALLOW_AFFILIATE_POSTGRES_TESTS=1 ; aucun repli vers DATABASE_URL n’est autorisé.

Résultat : **5 scénarios PostgreSQL réussis (6 tests rapportés avec le parent), 0 échec** :

1. Ajout de deux bannières, remplacement d’un bloc déjà placé, source complète relue par SQL, HTML/JSON cohérents, métadonnées préservées et répétition idempotente.
2. Sauvegarde d’un bloc déplacé entre deux paragraphes, relecture depuis une autre connexion et via l’API, puis remplacement en lot à cette même position.
3. Deux sauvegardes concurrentes lisent volontairement la même révision réelle avant leurs écritures : une seule reçoit 200, l’autre reçoit 409 via le vrai P2025 Prisma/PostgreSQL. Une nouvelle tentative obsolète reçoit encore 409 sans altérer la ligne gagnante ; une réconciliation explicite avec une révision fraîche conserve ensuite les deux changements.
4. Une action en lot est suspendue après sa vraie lecture SQL ; une sauvegarde concurrente est enregistrée avant sa reprise. La mise à jour conditionnelle échoue, relit la version récente et ajoute la bannière sans perdre le nouveau paragraphe. Les barrières ne simulent aucune donnée ni réponse SQL : elles imposent uniquement l’ordre d’exécution.
5. Un trigger PostgreSQL temporaire provoque une véritable erreur SQL sur un seul article. L’autre est enregistré, la ligne en échec est intacte. Après suppression du trigger, la reprise réussit et une répétition complète annonce deux articles inchangés, avec un seul bloc chacun.

Les lignes de démonstration et le trigger sont supprimés après les tests. La source utilise demo.invalid mais aucun navigateur ni appel HTTP fournisseur n’est exécuté dans cette suite.

Reproduction sur une base locale déjà migrée : définir AFFILIATE_TEST_DATABASE_URL et ALLOW_AFFILIATE_POSTGRES_TESTS=1, puis exécuter `npm run test:postgres` dans l’API. La CI API ajoutée reproduit ces tests sur un service PostgreSQL 16 éphémère GitHub Actions. Le verrou npm de l’API est désormais suivi pour permettre npm ci reproductible.

Les workflows ajoutés ne contiennent que installation, génération Prisma, migrations sur la base de service, tests et compilation. Ils n’invoquent aucun déploiement. Le fichier vercel.json désactive les déploiements Git uniquement pour la branche codex/affiliate-banners-verified, conformément à la consigne de ne pas déployer ; les autres branches gardent leur comportement habituel.

## PR, revue et CI

Les changements n’avaient pas encore de PR au début de ce contrôle. Deux PR ont été créées à la demande de l’utilisateur :

- Front : https://github.com/2DOLIST06/the-muscle-temple/pull/155
- API : https://github.com/2DOLIST06/the-muscle-temple-api/pull/57

Contrôles GitHub Actions vérifiés :

- Front, commit d’implémentation `9dd91b4cffe76c745604c77806c885619ab7bfd3` : workflow Affiliate validation terminé avec succès. npm ci, 8 tests d’origine, TypeScript et build passent sous Node 22. Exécution : https://github.com/2DOLIST06/the-muscle-temple/actions/runs/39299789084
- API, commit `583db5b003591858ffb87da92a42cb54796fa01e` : workflow Affiliate validation terminé avec succès. npm ci, génération Prisma, 42 tests API, déploiement des dix migrations uniquement sur le service PostgreSQL de test, suite PostgreSQL réelle, TypeScript et build passent sous Node 22. Exécution : https://github.com/2DOLIST06/the-muscle-temple-api/actions/runs/39299879941

Les timelines, soumissions de revue et fils de commentaires ont été consultés pour les deux PR : aucun commentaire de revue ni demande de modification n’était présent au relevé. Cela ne constitue pas une approbation humaine. Les anciennes PR front #150/#151 étaient déjà fusionnées et ne correspondent pas aux changements actuels ; elles n’ont pas été utilisées comme preuve de CI pour ces nouvelles PR.

Les dernières vérifications locales ont confirmé zéro article de test, zéro auteur de test et zéro trigger d’erreur restant dans la base isolée après nettoyage. Le conteneur PostgreSQL éphémère est ensuite arrêté et supprimé. Aucun merge ni déploiement applicatif n’a été effectué. La mise à jour du présent compte rendu ajoute uniquement de la documentation et entraîne une nouvelle vérification CI du front ; le statut du dernier commit est également contrôlé dans la PR.
