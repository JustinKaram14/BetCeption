import { NgFor } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n, LanguageCode } from '../../../core/i18n/i18n';

type ImpressumContent = {
  title: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
  back: string;
};

const CONTENT: Record<LanguageCode, ImpressumContent> = {
  de: {
    title: 'Impressum',
    sections: [
      {
        heading: 'Angaben gemäß Paragraph 5 TMG',
        paragraphs: [
          'Dieses Angebot ist ein nicht-kommerzielles Studentenprojekt und dient ausschließlich Bildungs- und Unterhaltungszwecken. Es werden keine Waren oder Dienstleistungen angeboten und kein wirtschaftlicher Zweck verfolgt.',
          'Verantwortlich: Team BetCeption. Kontext: Hochschulprojekt Softwaretechnik.',
        ],
      },
      {
        heading: 'Haftungsausschluss',
        paragraphs: [
          'Alle auf dieser Plattform verwendeten Währungen sind rein virtuell und haben keinen Gegenwert in echtem Geld. Ein Umtausch in Echtgeld ist nicht möglich. Dieses Angebot ist kein Glücksspiel im Sinne des Glücksspielstaatsvertrags.',
        ],
      },
      {
        heading: 'Streitschlichtung',
        paragraphs: [
          'Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit. Da es sich um ein nicht-kommerzielles Projekt handelt, nehmen wir nicht an einem Streitbeilegungsverfahren teil.',
        ],
      },
    ],
    back: 'Zurück zur Startseite',
  },
  en: {
    title: 'Legal Notice',
    sections: [
      {
        heading: 'Provider information',
        paragraphs: [
          'This offer is a non-commercial student project for educational and entertainment purposes only. No goods or services are offered and no commercial purpose is pursued.',
          'Responsible: Team BetCeption. Context: University software engineering project.',
        ],
      },
      {
        heading: 'Disclaimer',
        paragraphs: [
          'All currencies used on this platform are purely virtual coins and have no real-world monetary value. Conversion into real money is not possible. This offer is not gambling.',
        ],
      },
      {
        heading: 'Dispute resolution',
        paragraphs: [
          'The European Commission provides a platform for online dispute resolution. Since this is a non-commercial project, we do not participate in dispute resolution proceedings.',
        ],
      },
    ],
    back: 'Back to homepage',
  },
  es: {
    title: 'Aviso legal',
    sections: [
      {
        heading: 'Información del proveedor',
        paragraphs: [
          'Esta oferta es un proyecto estudiantil no comercial con fines educativos y de entretenimiento. No se ofrecen bienes ni servicios y no se persigue ningún fin comercial.',
          'Responsable: Team BetCeption. Contexto: proyecto universitario de ingeniería de software.',
        ],
      },
      {
        heading: 'Descargo de responsabilidad',
        paragraphs: [
          'Todas las monedas usadas en esta plataforma son coins puramente virtuales y no tienen valor monetario real. No es posible convertirlas en dinero real. Esta oferta no es juego de azar.',
        ],
      },
      {
        heading: 'Resolución de disputas',
        paragraphs: [
          'La Comisión Europea ofrece una plataforma para la resolución de disputas online. Como se trata de un proyecto no comercial, no participamos en procedimientos de resolución de disputas.',
        ],
      },
    ],
    back: 'Volver al inicio',
  },
  fr: {
    title: 'Mentions légales',
    sections: [
      {
        heading: 'Informations du fournisseur',
        paragraphs: [
          "Cette offre est un projet étudiant non commercial à des fins éducatives et de divertissement. Aucun bien ni service n'est proposé et aucun objectif commercial n'est poursuivi.",
          'Responsable: Team BetCeption. Contexte: projet universitaire de génie logiciel.',
        ],
      },
      {
        heading: 'Clause de non-responsabilité',
        paragraphs: [
          "Toutes les monnaies utilisées sur cette plateforme sont des coins purement virtuels et n'ont aucune valeur monétaire réelle. Une conversion en argent réel est impossible. Cette offre n'est pas un jeu d'argent.",
        ],
      },
      {
        heading: 'Règlement des litiges',
        paragraphs: [
          "La Commission européenne fournit une plateforme de règlement en ligne des litiges. Comme il s'agit d'un projet non commercial, nous ne participons pas à une procédure de règlement des litiges.",
        ],
      },
    ],
    back: "Retour à l'accueil",
  },
};

@Component({
  selector: 'app-impressum',
  standalone: true,
  imports: [NgFor, RouterLink],
  templateUrl: './impressum.html',
  styleUrl: './impressum.css',
})
export class ImpressumComponent {
  readonly i18n = inject(I18n);

  get content() {
    return CONTENT[this.i18n.language()];
  }
}
