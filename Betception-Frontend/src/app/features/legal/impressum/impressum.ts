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
        heading: 'Angaben gemaess Paragraph 5 TMG',
        paragraphs: [
          'Dieses Angebot ist ein nicht-kommerzielles Studentenprojekt und dient ausschliesslich Bildungs- und Unterhaltungszwecken. Es werden keine Waren oder Dienstleistungen angeboten und kein wirtschaftlicher Zweck verfolgt.',
          'Verantwortlich: Team BetCeption. Kontext: Hochschulprojekt Softwaretechnik.',
        ],
      },
      {
        heading: 'Haftungsausschluss',
        paragraphs: [
          'Alle auf dieser Plattform verwendeten Waehrungen sind rein virtuell und haben keinen Gegenwert in echtem Geld. Ein Umtausch in Echtgeld ist nicht moeglich. Dieses Angebot ist kein Gluecksspiel im Sinne des Gluecksspielstaatsvertrags.',
        ],
      },
      {
        heading: 'Streitschlichtung',
        paragraphs: [
          'Die Europaeische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit. Da es sich um ein nicht-kommerzielles Projekt handelt, nehmen wir nicht an einem Streitbeilegungsverfahren teil.',
        ],
      },
    ],
    back: 'Zurueck zur Startseite',
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
        heading: 'Informacion del proveedor',
        paragraphs: [
          'Esta oferta es un proyecto estudiantil no comercial con fines educativos y de entretenimiento. No se ofrecen bienes ni servicios y no se persigue ningun fin comercial.',
          'Responsable: Team BetCeption. Contexto: Proyecto universitario de ingenieria de software.',
        ],
      },
      {
        heading: 'Descargo de responsabilidad',
        paragraphs: [
          'Todas las monedas usadas en esta plataforma son coins puramente virtuales y no tienen valor monetario real. No es posible convertirlas en dinero real. Esta oferta no es juego de azar.',
        ],
      },
      {
        heading: 'Resolucion de disputas',
        paragraphs: [
          'La Comision Europea ofrece una plataforma para la resolucion de disputas online. Como se trata de un proyecto no comercial, no participamos en procedimientos de resolucion de disputas.',
        ],
      },
    ],
    back: 'Volver al inicio',
  },
  fr: {
    title: 'Mentions legales',
    sections: [
      {
        heading: 'Informations du fournisseur',
        paragraphs: [
          'Cette offre est un projet etudiant non commercial a des fins educatives et de divertissement. Aucun bien ni service n est propose et aucun objectif commercial n est poursuivi.',
          'Responsable: Team BetCeption. Contexte: Projet universitaire de genie logiciel.',
        ],
      },
      {
        heading: 'Clause de non-responsabilite',
        paragraphs: [
          'Toutes les monnaies utilisees sur cette plateforme sont des coins purement virtuels et n ont aucune valeur monetaire reelle. Une conversion en argent reel est impossible. Cette offre n est pas un jeu d argent.',
        ],
      },
      {
        heading: 'Reglement des litiges',
        paragraphs: [
          'La Commission europeenne fournit une plateforme de reglement en ligne des litiges. Comme il s agit d un projet non commercial, nous ne participons pas a une procedure de reglement des litiges.',
        ],
      },
    ],
    back: 'Retour a l accueil',
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
