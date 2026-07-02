# Création d'une application web de supervision "FutureKawa"
Description du projet

Créer une application web de type dashboard permettant de centraliser plusieurs API ayant exactement la même structure. La documentation de l'API est disponible dans le fichier swagger.json.

L'application doit permettre de gérer plusieurs zones de supervision, récupérer les données des API, recevoir des alertes en temps réel et afficher les données des capteurs.

## Stack technique
Backend : Laravel
Frontend : React.js
Base de données : PostgreSQL
Graphiques : Chart.js
Conteneurisation : Docker Compose

L'application doit être entièrement exécutable avec :

docker-compose up

### Authentification

L'application possède son propre système d'authentification.

Les paramètres (clé, utilisateur administrateur, etc.) doivent être configurables via le fichier .env.

### Gestion des zones

L'utilisateur peut créer plusieurs zones.

Chaque zone contient les informations suivantes :

Nom de la zone
URL de l'API
Nom d'utilisateur
Mot de passe

Ces identifiants servent à récupérer automatiquement un JWT auprès de l'API distante afin d'effectuer les appels authentifiés.

### Gestion des lots

À l'intérieur de chaque zone, l'utilisateur peut créer plusieurs lots.

Remarque : dans l'API distante, les capteurs sont appelés lots.

Chaque lot doit contenir :

Nom du lot
Capteur (lot) surveillé
Date de début de stockage
Durée de stockage

L'application devra automatiquement calculer si la durée de stockage est dépassée.

### Réception des alertes (Webhook)

Créer un endpoint permettant aux API distantes d'envoyer des alertes.

Le webhook doit être protégé par un token transmis dans un header HTTP.

Exemple :

Authorization:<TOKEN>

Le token doit être configurable dans le fichier .env.

Les alertes reçues doivent être enregistrées en base de données.

### WebSocket

L'application doit se connecter au WebSocket de chaque API afin de recevoir les mesures en temps réel.

Endpoint :

endpoint/ws/ example : "http://example.com/ws/"

Exemple de message reçu :

{
    "zone": "brazil",
    "lot": "dht22-t1",
    "value": 23.6,
    "timestamp": 1782894384
}

Les données reçues doivent être :

affichées en temps réel;
utilisées pour alimenter les graphiques.
### Fonctionnalités
#### Dashboard

Le tableau de bord doit afficher :

nombre de zones ;
nombre de lots ;
alertes actives ;
alertes corrigées ;
état des connexions aux API (detecter ca avec websocket);
graphiques des mesures.
Surveillance en temps réel

Afficher les valeurs des capteurs (lots) en temps réel grâce au WebSocket.

Utiliser Chart.js pour afficher l'historique des mesures.

Gestion des alertes

Deux types d'alertes doivent être gérés :

1. Alertes envoyées par les API

Les alertes reçues via le webhook.

2. Alertes locales

Créer automatiquement une alerte lorsqu'un lot dépasse sa durée de stockage et envoyer email.

L'utilisateur doit pouvoir marquer une alerte comme corrigée.

## Architecture attendue

Le projet doit respecter une architecture propre.

Backend Laravel :

Controllers
Services
Models
Repositories (si nécessaire)
Requests
Policies
API Resources

Frontend React :

Components
Pages
Services
Hooks
Context (ou Redux si nécessaire)

Le code doit être maintenable et facilement extensible.

Docker

Créer un environnement Docker Compose comprenant au minimum :

Laravel
React
PostgreSQL
Nginx

Le projet doit être prêt à démarrer avec une seule commande :

docker-compose up --build

Toutes les dépendances doivent être installées manualement avec lance docker "npm install et composer install".

Contraintes
Utiliser les bonnes pratiques Laravel et React.
Écrire un code propre et bien documenté.
Utiliser les migrations Laravel.
Prévoir la gestion des erreurs réseau.
Prévoir le renouvellement automatique du JWT si celui-ci expire.
Les paramètres sensibles doivent être stockés dans le fichier .env.
Le frontend doit communiquer uniquement avec le backend Laravel et serveur API.

## Gestion des lots (Pour enlever ambiguite)

Dans l'application, un lot est un regroupement logique créé par l'utilisateur afin de surveiller plusieurs capteurs.

Important : dans l'API distante, les capteurs sont appelés lots. Il ne faut pas confondre ces deux notions.

Lot (application) : groupe de surveillance contenant plusieurs capteurs.
Lot (API) : correspond à un capteur individuel.

Lors de la création d'un lot dans l'application, l'utilisateur pourra sélectionner un ou plusieurs capteurs récupérés depuis l'API (appelés lots dans l'API). Le backend devra effectuer cette correspondance automatiquement.

Exemple :

Zone : Usine A
Lot (application) : Salle de production
Capteurs récupérés depuis l'API (appelés "lots") :
dht22-t1
dht22-h1
bmp280-p1

Le lot Salle de production regroupe donc ces trois capteurs afin de faciliter leur surveillance et leur gestion.

## Communication Frontend / Backend / APIs externes

Le frontend React peut communiquer directement avec les API distantes (REST et WebSocket).

Cependant, le frontend ne doit jamais posséder ni gérer les identifiants sensibles (username, password) pour generer token JWT c'est backend qui fournit au frontend les informations nécessaires pour se connecter aux APIs.

donc : 

React reçoit uniquement JWT déjà généré
jamais credentials (username,password)