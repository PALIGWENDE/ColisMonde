---
name: Voyageur de Colis
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#3e494a'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#6f797a'
  outline-variant: '#bec8ca'
  surface-tint: '#006972'
  primary: '#00535b'
  on-primary: '#ffffff'
  primary-container: '#006d77'
  on-primary-container: '#9becf7'
  inverse-primary: '#82d3de'
  secondary: '#895100'
  on-secondary: '#ffffff'
  secondary-container: '#fd9d1a'
  on-secondary-container: '#663b00'
  tertiary: '#01544f'
  on-tertiary: '#ffffff'
  tertiary-container: '#286d67'
  on-tertiary-container: '#a9ece4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9ff0fb'
  primary-fixed-dim: '#82d3de'
  on-primary-fixed: '#001f23'
  on-primary-fixed-variant: '#004f56'
  secondary-fixed: '#ffdcbc'
  secondary-fixed-dim: '#ffb86b'
  on-secondary-fixed: '#2c1700'
  on-secondary-fixed-variant: '#683d00'
  tertiary-fixed: '#acefe7'
  tertiary-fixed-dim: '#90d3cb'
  on-tertiary-fixed: '#00201e'
  on-tertiary-fixed-variant: '#00504b'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding-mobile: 20px
  container-padding-desktop: 40px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

Le système de design repose sur une esthétique **Moderne et Humaine**, fusionnant la fiabilité d'un service logistique avec la chaleur d'une communauté d'entraide. L'objectif est d'inspirer une confiance immédiate tout en soulignant l'aspect premium et accessible du service.

Le style visuel emprunte au **Minimalisme chaleureux** : une utilisation généreuse de l'espace blanc, des superpositions de couches douces et une typographie affirmée. L'interface utilise des métaphores de voyage subtiles, comme des tracés de pointillés ("flight-paths") et des arrondis généreux pour évoquer la fluidité du mouvement international. Le sentiment doit être celui d'un service haut de gamme, mais profondément ancré dans l'échange interpersonnel.

## Colors

La palette est conçue pour équilibrer l'autorité et l'énergie :

- **Primaire (Teal Profond - #006D77) :** Utilisé pour les éléments de structure, la navigation principale et les boutons d'action prioritaires. Il véhicule la stabilité et le professionnalisme.
- **Accent (Ambre Chaleureux - #FF9F1C) :** Utilisé avec parcimonie pour attirer l'attention sur les points de conversion, les indicateurs d'urgence (comme un colis en attente) et les éléments interactifs secondaires.
- **Support (Teal Doux - #83C5BE) :** Une nuance plus claire pour les arrière-plans de composants, les badges et les états de survol.
- **Neutres (#F8F9FA, #E9ECEF, #2B2D42) :** L'arrière-plan principal utilise l'off-white pour éviter la fatigue visuelle, tandis que le gris foncé est réservé au texte pour garantir un contraste optimal.

## Typography

La hiérarchie typographique distingue clairement les titres de l'information fonctionnelle. 

- **Titres (Plus Jakarta Sans) :** Une police géométrique et accueillante. Les graisses lourdes (Bold/ExtraBold) sont privilégiées pour marquer les étapes clés du parcours utilisateur.
- **Corps de texte (Inter) :** Choisie pour sa lisibilité exceptionnelle dans les interfaces denses en données (poids des colis, dates de voyage, prix).
- **Consignes :** Toujours utiliser des titres courts et directs. Le contraste entre le Teal profond des titres et le gris anthracite du corps de texte renforce la structure visuelle.

## Layout & Spacing

Le système repose sur une grille de **8px** pour assurer une cohérence mathématique parfaite.

- **Structure :** Utilisation d'une grille fluide de 12 colonnes sur desktop et 4 colonnes sur mobile.
- **Rythme Vertical :** Les espaces entre les cartes de colis sont fixés à 16px pour maintenir une densité d'information équilibrée.
- **Adaptabilité :** Sur mobile, les marges extérieures sont de 20px pour laisser respirer le contenu tout en maximisant l'espace pour les détails de l'expédition. Les cartes occupent généralement toute la largeur de l'écran moins les marges.

## Elevation & Depth

La profondeur est gérée par des **couches tonales** et des ombres portées extrêmement diffuses pour éviter un aspect "lourd".

- **Niveau 0 (Fond) :** #F8F9FA.
- **Niveau 1 (Cartes/Conteneurs) :** Fond blanc pur (#FFFFFF) avec une ombre de type "Soft Glow" (0px 4px 20px rgba(0, 109, 119, 0.05)).
- **Niveau 2 (Éléments flottants/Modales) :** Ombre plus marquée pour détacher l'élément (0px 12px 32px rgba(0, 0, 0, 0.1)).

Les bordures sont quasi-inexistantes, sauf pour les champs de saisie et les états inactifs, où un gris très clair (#E9ECEF) est utilisé.

## Shapes

La signature visuelle repose sur un arrondi de **16px** (`rounded-lg` dans ce système) pour tous les conteneurs principaux et les cartes. 

- **Composants d'interface :** Les boutons et les champs de saisie suivent cette norme de 16px pour conserver une esthétique douce et sécurisante.
- **Motifs graphiques :** Des lignes en pointillés courbes relient les points A et B sur les cartes de trajet, utilisant une épaisseur de 2px avec des terminaisons arrondies. Des cercles parfaits sont utilisés pour les avatars et les icônes de statut.

## Components

- **Boutons :** Le bouton primaire est plein (Teal #006D77), texte blanc, avec un arrondi de 16px. Le bouton secondaire est une version "Outline" avec une bordure de 2px.
- **Cartes de Colis :** Fond blanc, ombre douce, titre en Plus Jakarta Sans 18px. Inclure un badge d'accent (Ambre) pour le prix ou l'urgence.
- **Champs de Saisie :** Fond #F8F9FA, bordure 1px #E9ECEF, texte d'aide en Inter 14px. État actif marqué par une bordure Teal de 2px.
- **Chips (Badges) :** Forme pillule, fond clair (Teal à 10% d'opacité) avec texte Teal foncé pour indiquer les catégories de colis (Électronique, Vêtements, etc.).
- **Indicateurs de Trajet :** Utiliser une ligne pointillée discrète entre le point de départ et l'arrivée, avec une icône d'avion ou de train minimaliste en mouvement sur la ligne.
- **Listes :** Séparateurs horizontaux très légers (1px #F1F3F5), padding vertical généreux de 16px.