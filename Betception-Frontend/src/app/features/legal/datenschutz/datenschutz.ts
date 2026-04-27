import { NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n, LanguageCode } from '../../../core/i18n/i18n';

type DatenschutzContent = {
  title: string;
  sections: Array<{ heading: string; paragraphs?: string[]; items?: string[] }>;
  back: string;
};

const CONTENT: Record<LanguageCode, DatenschutzContent> = {
  de: {
    title: 'Datenschutzerklaerung',
    sections: [
      {
        heading: '1. Verantwortlicher',
        paragraphs: ['Team BetCeption - nicht-kommerzielles Studentenprojekt im Rahmen eines Hochschulprojekts Softwaretechnik.'],
      },
      {
        heading: '2. Erhobene Daten',
        paragraphs: ['Bei der Registrierung und Nutzung werden folgende personenbezogene oder nutzungsbezogene Daten erhoben:'],
        items: [
          'E-Mail-Adresse als Pflichtfeld fuer die Anmeldung',
          'selbst gewaehlter Benutzername',
          'Passwort, gespeichert als bcrypt-Hash und niemals im Klartext',
          'Spielstaende, Transaktionen und Aktivitaetsdaten innerhalb der Plattform',
        ],
      },
      {
        heading: '3. Zweck der Verarbeitung',
        paragraphs: [
          'Die Daten werden ausschliesslich zur Bereitstellung der Spielfunktionalitaet verwendet, insbesondere fuer Authentifizierung, Spielstatus und Bestenliste. Eine Weitergabe an Dritte findet nicht statt.',
        ],
      },
      {
        heading: '4. Speicherdauer',
        paragraphs: [
          'Daten werden so lange gespeichert, wie das Konto aktiv ist. Eine Loeschung kann jederzeit durch Kontaktaufnahme mit dem Projektteam beantragt werden.',
        ],
      },
      {
        heading: '5. Cookies und Sessions',
        paragraphs: [
          'Es werden HttpOnly-Session-Cookies fuer die Authentifizierung gesetzt. Es werden keine Tracking- oder Werbe-Cookies verwendet.',
        ],
      },
      {
        heading: '6. Rechte der Nutzer',
        paragraphs: [
          'Gemaess DSGVO haben Nutzer das Recht auf Auskunft, Berichtigung und Loeschung ihrer Daten. Da es sich um ein nicht-kommerzielles Studentenprojekt handelt, wenden Sie sich bei Anfragen direkt an das Projektteam.',
        ],
      },
      {
        heading: '7. Hinweis zum Gluecksspiel',
        paragraphs: [
          'BetCeption verwendet ausschliesslich virtuelle Coins ohne Geldwert. Es handelt sich um kein Gluecksspiel im Sinne des Gluecksspielstaatsvertrags. Empfohlen ab 18 Jahren.',
        ],
      },
    ],
    back: 'Zurueck zur Startseite',
  },
  en: {
    title: 'Privacy Policy',
    sections: [
      {
        heading: '1. Controller',
        paragraphs: ['Team BetCeption - a non-commercial student project in the context of a university software engineering course.'],
      },
      {
        heading: '2. Data collected',
        paragraphs: ['During registration and use, the following personal or usage-related data may be collected:'],
        items: [
          'email address as a required login field',
          'self-selected username',
          'password stored as a bcrypt hash and never in plain text',
          'game states, transactions, and activity data inside the platform',
        ],
      },
      {
        heading: '3. Purpose of processing',
        paragraphs: [
          'The data is used exclusively to provide game functionality, especially authentication, game state, and leaderboard features. Data is not shared with third parties.',
        ],
      },
      {
        heading: '4. Retention period',
        paragraphs: [
          'Data is stored as long as the account is active. Deletion can be requested at any time by contacting the project team.',
        ],
      },
      {
        heading: '5. Cookies and sessions',
        paragraphs: [
          'HttpOnly session cookies are used for authentication. No tracking or advertising cookies are used.',
        ],
      },
      {
        heading: '6. User rights',
        paragraphs: [
          'Under the GDPR, users have the right to access, correct, and delete their data. Since this is a non-commercial student project, please contact the project team directly for requests.',
        ],
      },
      {
        heading: '7. Gambling notice',
        paragraphs: [
          'BetCeption uses only virtual coins with no monetary value. It is not gambling. Recommended for ages 18+.',
        ],
      },
    ],
    back: 'Back to homepage',
  },
  es: {
    title: 'Politica de privacidad',
    sections: [
      {
        heading: '1. Responsable',
        paragraphs: ['Team BetCeption - proyecto estudiantil no comercial en el contexto de un curso universitario de ingenieria de software.'],
      },
      {
        heading: '2. Datos recopilados',
        paragraphs: ['Durante el registro y el uso se pueden recopilar los siguientes datos personales o de uso:'],
        items: [
          'direccion de email como campo obligatorio para iniciar sesion',
          'nombre de usuario elegido por el usuario',
          'contrasena almacenada como hash bcrypt y nunca en texto claro',
          'estados de juego, transacciones y datos de actividad dentro de la plataforma',
        ],
      },
      {
        heading: '3. Finalidad del tratamiento',
        paragraphs: [
          'Los datos se usan exclusivamente para proporcionar la funcionalidad del juego, especialmente autenticacion, estado de juego y leaderboard. No se comparten datos con terceros.',
        ],
      },
      {
        heading: '4. Periodo de conservacion',
        paragraphs: [
          'Los datos se almacenan mientras la cuenta este activa. Se puede solicitar la eliminacion en cualquier momento contactando con el equipo del proyecto.',
        ],
      },
      {
        heading: '5. Cookies y sesiones',
        paragraphs: [
          'Se usan cookies de sesion HttpOnly para la autenticacion. No se usan cookies de tracking ni de publicidad.',
        ],
      },
      {
        heading: '6. Derechos de los usuarios',
        paragraphs: [
          'Segun el RGPD, los usuarios tienen derecho de acceso, rectificacion y eliminacion de sus datos. Como se trata de un proyecto estudiantil no comercial, las solicitudes deben dirigirse al equipo del proyecto.',
        ],
      },
      {
        heading: '7. Aviso sobre juego de azar',
        paragraphs: [
          'BetCeption usa exclusivamente coins virtuales sin valor monetario. No es juego de azar. Recomendado para mayores de 18.',
        ],
      },
    ],
    back: 'Volver al inicio',
  },
  fr: {
    title: 'Politique de confidentialite',
    sections: [
      {
        heading: '1. Responsable',
        paragraphs: ['Team BetCeption - projet etudiant non commercial dans le cadre d un cours universitaire de genie logiciel.'],
      },
      {
        heading: '2. Donnees collectees',
        paragraphs: ['Lors de l inscription et de l utilisation, les donnees personnelles ou donnees d usage suivantes peuvent etre collectees:'],
        items: [
          'adresse e-mail comme champ obligatoire pour la connexion',
          'nom d utilisateur choisi par l utilisateur',
          'mot de passe stocke sous forme de hash bcrypt et jamais en clair',
          'etats de jeu, transactions et donnees d activite dans la plateforme',
        ],
      },
      {
        heading: '3. Finalite du traitement',
        paragraphs: [
          'Les donnees sont utilisees exclusivement pour fournir les fonctionnalites du jeu, notamment l authentification, l etat du jeu et le leaderboard. Les donnees ne sont pas transmises a des tiers.',
        ],
      },
      {
        heading: '4. Duree de conservation',
        paragraphs: [
          'Les donnees sont conservees tant que le compte est actif. Une suppression peut etre demandee a tout moment en contactant l equipe du projet.',
        ],
      },
      {
        heading: '5. Cookies et sessions',
        paragraphs: [
          'Des cookies de session HttpOnly sont utilises pour l authentification. Aucun cookie de tracking ou publicitaire n est utilise.',
        ],
      },
      {
        heading: '6. Droits des utilisateurs',
        paragraphs: [
          'Selon le RGPD, les utilisateurs disposent d un droit d acces, de rectification et de suppression de leurs donnees. Comme il s agit d un projet etudiant non commercial, les demandes doivent etre adressees directement a l equipe du projet.',
        ],
      },
      {
        heading: '7. Note sur les jeux d argent',
        paragraphs: [
          'BetCeption utilise uniquement des coins virtuels sans valeur monetaire. Ce n est pas un jeu d argent. Recommande aux 18 ans et plus.',
        ],
      },
    ],
    back: 'Retour a l accueil',
  },
};

@Component({
  selector: 'app-datenschutz',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink],
  templateUrl: './datenschutz.html',
  styleUrl: './datenschutz.css',
})
export class DatenschutzComponent {
  readonly i18n = inject(I18n);

  get content() {
    return CONTENT[this.i18n.language()];
  }
}
