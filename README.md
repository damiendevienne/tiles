# Pavage interactif

Site statique, sans dépendances, compatible avec GitHub Pages. Ouvrir `index.html` pour l’utiliser localement.

Le pavage utilise uniquement `img/tile.png`. Le slider règle la taille des tuiles de 30 à 240 pixels. Les contrôles peuvent être repliés pour dégager la vue. Un indicateur dans le bouton sélectionné accompagne l’application des motifs.

## Motifs

A désigne l’image de base, B sa rotation de 90°. La notation associe une séquence répétée horizontalement à un décalage vers la gauche par ligne : `ABd0` pour des colonnes alternées, `ABd1` pour un damier. L’éditeur permet de choisir une séquence et un décalage de 0 à sa longueur moins 1.

## Export

« Exporter PNG » télécharge le pavage visible aux dimensions de la page (en pixels CSS), sans les contrôles. L’export conserve les modifications manuelles, le zoom et les tuiles coupées aux bords. Il capture les orientations finales au moment du clic, même si une rotation individuelle est encore en cours. Il est disponible dès que l’application d’un motif est terminée. Le canvas sert uniquement à créer ce fichier ; l’affichage interactif reste en HTML.

Pour permettre l’export lors d’une ouverture directe en `file://`, `export-image.js` contient une copie encodée de `img/tile.png`. Si cette image change, régénérer cette copie avec `python3 scripts/update-export-image.py`. Sur un serveur local ou GitHub Pages, l’export utilise directement `img/tile.png`.

## Amélioration future — uniquement sur demande

Envisager un rendu avec un seul canvas à la place des nombreux éléments HTML si les performances au dézoom restent insuffisantes. Conserver les clics, les motifs et les rotations horaires de 0,2 seconde ; mettre en cache le pavage fixe et ne redessiner que les zones animées. Cette piste n’est pas implémentée et son gain devra être mesuré.
