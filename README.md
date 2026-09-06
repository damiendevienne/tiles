# Pavage interactif

Site statique, sans dépendances, compatible avec GitHub Pages. Ouvrir `index.html` pour l’utiliser localement.

Le pavage utilise uniquement `img/tile.png`. Le slider règle la taille des tuiles de 30 à 240 pixels. Les contrôles peuvent être repliés pour dégager la vue. Un indicateur dans le bouton sélectionné accompagne l’application des motifs.

## Motifs

A désigne l’image de base, B sa rotation de 90°. La notation associe une séquence répétée horizontalement à un décalage vers la gauche par ligne : `ABd0` pour des colonnes alternées, `ABd1` pour un damier. L’éditeur permet de choisir une séquence et un décalage de 0 à sa longueur moins 1.

## Amélioration future — uniquement sur demande

Envisager un rendu avec un seul canvas à la place des nombreux éléments HTML si les performances au dézoom restent insuffisantes. Conserver les clics, les motifs et les rotations horaires de 0,2 seconde ; mettre en cache le pavage fixe et ne redessiner que les zones animées. Cette piste n’est pas implémentée et son gain devra être mesuré.
