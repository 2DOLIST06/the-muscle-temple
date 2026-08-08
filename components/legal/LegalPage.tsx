import { Container } from "@/components/ui/Container";
import type { LegalPageKey, Locale } from "@/lib/i18n/routing";

const copy: Record<
  Locale,
  Record<LegalPageKey, { title: string; paragraphs: string[] }>
> = {
  en: {
    terms: {
      title: "Terms of Use",
      paragraphs: [
        "By using Body Training Guide, you agree to use the website lawfully and responsibly.",
        "The content is provided for general information and may be updated without notice.",
      ],
    },
    medicalDisclaimer: {
      title: "Medical Disclaimer",
      paragraphs: [
        "The information on Body Training Guide is educational and does not replace advice from a doctor or qualified health professional.",
        "Consult a professional before beginning or changing an exercise, nutrition, or health program.",
      ],
    },
    affiliateDisclosure: {
      title: "Affiliate Disclosure",
      paragraphs: [
        "Some links may be affiliate links. Body Training Guide may receive a commission if you make a purchase through one of these links, at no additional cost to you.",
        "Affiliate relationships do not determine our editorial opinions.",
      ],
    },
    privacy: {
      title: "Privacy Policy",
      paragraphs: [
        "We only process personal data needed to operate and improve Body Training Guide and to respond to requests.",
        "You may contact us to exercise your applicable data protection rights.",
      ],
    },
    cookies: {
      title: "Cookies",
      paragraphs: [
        "Body Training Guide may use essential, analytics, and preference cookies to operate and improve the website.",
        "You can manage optional cookies through your browser or the consent controls made available on the site.",
      ],
    },
    legal: {
      title: "Legal Notice",
      paragraphs: [
        "Body Training Guide publishes informational content about training, nutrition, and recovery.",
        "For a question about this website or its content, please use the contact page.",
      ],
    },
  },
  fr: {
    terms: {
      title: "Conditions d'utilisation",
      paragraphs: [
        "En utilisant Body Training Guide, vous acceptez d'utiliser le site de manière légale et responsable.",
        "Le contenu est fourni à titre informatif et peut être modifié sans préavis.",
      ],
    },
    medicalDisclaimer: {
      title: "Avertissement médical",
      paragraphs: [
        "Les informations de Body Training Guide sont éducatives et ne remplacent pas l'avis d'un médecin ou d'un professionnel de santé qualifié.",
        "Consultez un professionnel avant de commencer ou de modifier un programme d'entraînement, de nutrition ou de santé.",
      ],
    },
    affiliateDisclosure: {
      title: "Affiliation",
      paragraphs: [
        "Certains liens peuvent être des liens d'affiliation. Body Training Guide peut recevoir une commission en cas d'achat, sans coût supplémentaire pour vous.",
        "Les relations d'affiliation ne déterminent pas nos avis éditoriaux.",
      ],
    },
    privacy: {
      title: "Confidentialité",
      paragraphs: [
        "Nous traitons uniquement les données personnelles nécessaires au fonctionnement et à l'amélioration de Body Training Guide ainsi qu'à la réponse aux demandes.",
        "Vous pouvez nous contacter pour exercer les droits applicables à la protection de vos données.",
      ],
    },
    cookies: {
      title: "Cookies",
      paragraphs: [
        "Body Training Guide peut utiliser des cookies essentiels, de mesure d'audience et de préférence pour faire fonctionner et améliorer le site.",
        "Vous pouvez gérer les cookies facultatifs dans votre navigateur ou avec les outils de consentement proposés sur le site.",
      ],
    },
    legal: {
      title: "Mentions légales",
      paragraphs: [
        "Body Training Guide publie des contenus informatifs sur l'entraînement, la nutrition et la récupération.",
        "Pour toute question concernant ce site ou son contenu, utilisez la page de contact.",
      ],
    },
  },
};

export const getLegalPageCopy = (locale: Locale, page: LegalPageKey) =>
  copy[locale][page];

export function LegalPage({
  locale,
  page,
}: {
  locale: Locale;
  page: LegalPageKey;
}) {
  const content = getLegalPageCopy(locale, page);
  return (
    <Container>
      <article className="max-w-3xl py-12">
        <h1 className="text-3xl font-bold text-slate-950">{content.title}</h1>
        {content.paragraphs.map((paragraph) => (
          <p className="mt-4 text-slate-700" key={paragraph}>
            {paragraph}
          </p>
        ))}
      </article>
    </Container>
  );
}
