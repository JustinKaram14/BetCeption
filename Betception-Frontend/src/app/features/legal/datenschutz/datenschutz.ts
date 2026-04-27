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
    title: 'Datenschutzerklärung',
    sections: [
      {
        heading: '1. Verantwortlicher',
        paragraphs: ['Team BetCeption - nicht-kommerzielles Studentenprojekt im Rahmen eines Hochschulprojekts Softwaretechnik.'],
      },
      {
        heading: '2. Erhobene Daten',
        paragraphs: ['Bei der Registrierung und Nutzung werden folgende personenbezogene oder nutzungsbezogene Daten erhoben:'],
        items: [
          'E-Mail-Adresse als Pflichtfeld für die Anmeldung',
          'selbst gewählter Benutzername',
          'Passwort, gespeichert als bcrypt-Hash und niemals im Klartext',
          'Spielstände, Transaktionen und Aktivitätsdaten innerhalb der Plattform',
        ],
      },
      {
        heading: '3. Zweck der Verarbeitung',
        paragraphs: [
          'Die Daten werden ausschließlich zur Bereitstellung der Spielfunktionalität verwendet, insbesondere für Authentifizierung, Spielstatus und Bestenliste. Eine Weitergabe an Dritte findet nicht statt.',
        ],
      },
      {
        heading: '4. Speicherdauer',
        paragraphs: [
          'Daten werden so lange gespeichert, wie das Konto aktiv ist. Eine Löschung kann jederzeit durch Kontaktaufnahme mit dem Projektteam beantragt werden.',
        ],
      },
      {
        heading: '5. Cookies und Sessions',
        paragraphs: [
          'Es werden HttpOnly-Session-Cookies für die Authentifizierung gesetzt. Es werden keine Tracking- oder Werbe-Cookies verwendet.',
        ],
      },
      {
        heading: '6. Rechte der Nutzer',
        paragraphs: [
          'Gemäß DSGVO haben Nutzer das Recht auf Auskunft, Berichtigung und Löschung ihrer Daten. Da es sich um ein nicht-kommerzielles Studentenprojekt handelt, wenden Sie sich bei Anfragen direkt an das Projektteam.',
        ],
      },
      {
        heading: '7. Hinweis zum Glücksspiel',
        paragraphs: [
          'BetCeption verwendet ausschließlich virtuelle Coins ohne Geldwert. Es handelt sich um kein Glücksspiel im Sinne des Glücksspielstaatsvertrags. Empfohlen ab 18 Jahren.',
        ],
      },
    ],
    back: 'Zurück zur Startseite',
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
    title: 'Política de privacidad',
    sections: [
      {
        heading: '1. Responsable',
        paragraphs: ['Team BetCeption - proyecto estudiantil no comercial en el contexto de un curso universitario de ingeniería de software.'],
      },
      {
        heading: '2. Datos recopilados',
        paragraphs: ['Durante el registro y el uso se pueden recopilar los siguientes datos personales o de uso:'],
        items: [
          'dirección de email como campo obligatorio para iniciar sesión',
          'nombre de usuario elegido por el usuario',
          'contraseña almacenada como hash bcrypt y nunca en texto claro',
          'estados de juego, transacciones y datos de actividad dentro de la plataforma',
        ],
      },
      {
        heading: '3. Finalidad del tratamiento',
        paragraphs: [
          'Los datos se usan exclusivamente para proporcionar la funcionalidad del juego, especialmente autenticación, estado de juego y clasificación. No se comparten datos con terceros.',
        ],
      },
      {
        heading: '4. Periodo de conservación',
        paragraphs: [
          'Los datos se almacenan mientras la cuenta esté activa. Se puede solicitar la eliminación en cualquier momento contactando con el equipo del proyecto.',
        ],
      },
      {
        heading: '5. Cookies y sesiones',
        paragraphs: [
          'Se usan cookies de sesión HttpOnly para la autenticación. No se usan cookies de tracking ni de publicidad.',
        ],
      },
      {
        heading: '6. Derechos de los usuarios',
        paragraphs: [
          'Según el RGPD, los usuarios tienen derecho de acceso, rectificación y eliminación de sus datos. Como se trata de un proyecto estudiantil no comercial, las solicitudes deben dirigirse al equipo del proyecto.',
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
    title: 'Politique de confidentialité',
    sections: [
      {
        heading: '1. Responsable',
        paragraphs: ["Team BetCeption - projet étudiant non commercial dans le cadre d'un cours universitaire de génie logiciel."],
      },
      {
        heading: '2. Données collectées',
        paragraphs: ["Lors de l'inscription et de l'utilisation, les données personnelles ou données d'usage suivantes peuvent être collectées:"],
        items: [
          'adresse e-mail comme champ obligatoire pour la connexion',
          "nom d'utilisateur choisi par l'utilisateur",
          'mot de passe stocké sous forme de hash bcrypt et jamais en clair',
          "états de jeu, transactions et données d'activité dans la plateforme",
        ],
      },
      {
        heading: '3. Finalité du traitement',
        paragraphs: [
          "Les données sont utilisées exclusivement pour fournir les fonctionnalités du jeu, notamment l'authentification, l'état du jeu et le classement. Les données ne sont pas transmises à des tiers.",
        ],
      },
      {
        heading: '4. Durée de conservation',
        paragraphs: [
          "Les données sont conservées tant que le compte est actif. Une suppression peut être demandée à tout moment en contactant l'équipe du projet.",
        ],
      },
      {
        heading: '5. Cookies et sessions',
        paragraphs: [
          "Des cookies de session HttpOnly sont utilisés pour l'authentification. Aucun cookie de tracking ou publicitaire n'est utilisé.",
        ],
      },
      {
        heading: '6. Droits des utilisateurs',
        paragraphs: [
          "Selon le RGPD, les utilisateurs disposent d'un droit d'accès, de rectification et de suppression de leurs données. Comme il s'agit d'un projet étudiant non commercial, les demandes doivent être adressées directement à l'équipe du projet.",
        ],
      },
      {
        heading: "7. Note sur les jeux d'argent",
        paragraphs: [
          "BetCeption utilise uniquement des coins virtuels sans valeur monétaire. Ce n'est pas un jeu d'argent. Recommandé aux 18 ans et plus.",
        ],
      },
    ],
    back: "Retour à l'accueil",
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
