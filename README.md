# Pavage de Truchet / Truchet tiling

Site statique, sans dépendances, compatible avec GitHub Pages. Ouvrir `index.html` pour l’utiliser localement.

## Langues et ressources

Le sélecteur FR / EN se trouve dans le menu général et se masque quand celui-ci est replié. Au premier affichage, la langue du navigateur détermine le choix : français pour `fr`, anglais sinon. Ce choix ne repose pas sur le pays ou une géolocalisation ; aucun service externe n’est appelé. Le choix manuel est mémorisé localement lorsque le navigateur l’autorise.

Le menu propose [En savoir plus sur les pavages de Truchet](http://drmathart.com/Resources/Truchet/) et un lien vers le [code source](https://github.com/damiendevienne/tiles).

Le pavage, l’aperçu et l’export utilisent uniquement `img/tile.png`. Le slider règle la taille des tuiles de 30 à 240 pixels. Les contrôles peuvent être repliés pour dégager la vue. Un indicateur dans le bouton sélectionné accompagne l’application des motifs.

## Navigation

La molette zoome autour du pointeur ; cliquer-glisser déplace le pavage. Sur écran tactile, glisser avec un doigt déplace le pavage et pincer avec deux doigts zoome autour de leur centre. Le slider reste synchronisé (30 à 240 pixels) et zoome autour du centre de l’écran. Un clic ou toucher bref tourne une tuile ; un glissement ne la tourne pas. Les contrôles restent fixes et le navigateur ne zoome pas la page. Au toucher, si le menu est ouvert, un premier appui bref sur une tuile replie le menu sans tourner la tuile ; les appuis suivants tournent les tuiles.

Les orientations des tuiles visitées sont conservées pendant la navigation. Appliquer un motif réinitialise cette mémoire et prolonge le nouveau motif sur les zones découvertes ensuite. L’export PNG respecte le cadrage courant, y compris après déplacement.

## Motifs

A désigne l’image de base, B sa rotation de 90°. La notation associe une séquence répétée horizontalement à un décalage vers la gauche par ligne : `ABd0` pour des colonnes alternées, `ABd1` pour un damier. L’éditeur permet de choisir une séquence et un décalage de 0 à sa longueur moins 1.

## Export

Chaque export porte la signature `https://damiendevienne.github.io/tiles/` en petit, en bleu `#002b68` sur un fond `#e9ddaf` à 50 % d’opacité aux coins arrondis, en bas à droite.

« Exporter PNG » télécharge le pavage visible aux dimensions de la page (en pixels CSS), sans les contrôles. L’export conserve les modifications manuelles, le zoom et les tuiles coupées aux bords. Il capture les orientations finales au moment du clic, même si une rotation individuelle est encore en cours. Il est disponible dès que l’application d’un motif est terminée. Le canvas sert uniquement à créer ce fichier ; l’affichage interactif reste en HTML.

Pour permettre l’export lors d’une ouverture directe en `file://`, `export-image.js` contient une copie encodée de `img/tile.png`. Si cette image change, régénérer cette copie avec `python3 scripts/update-export-image.py`. Sur un serveur local ou GitHub Pages, l’export utilise directement `img/tile.png`.

## Amélioration future — uniquement sur demande

Envisager un rendu avec un seul canvas à la place des nombreux éléments HTML si les performances au dézoom restent insuffisantes. Conserver les clics, les motifs et les rotations horaires de 0,2 seconde ; mettre en cache le pavage fixe et ne redessiner que les zones animées. Cette piste n’est pas implémentée et son gain devra être mesuré.

## Licence / License

Copyright © 2026 Damien de Vienne. Ce projet est distribué sous [licence MIT](LICENSE). Elle permet l’utilisation, la modification et la redistribution, y compris commerciale, à condition de conserver la notice de copyright et la licence. Le logiciel est fourni sans garantie.

This project is available under the [MIT License](LICENSE). Use, modification and redistribution, including commercial use, are permitted provided the copyright and license notices are retained. The software is provided without warranty.
