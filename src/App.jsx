import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, m, useScroll, useTransform } from "framer-motion";
import { Link, Route, Routes, useLocation, useParams } from "react-router-dom";
import content from "./data/site-content.json";
import {
  MOTION,
  MotionHeading,
  MotionProvider,
  Reveal,
  ScrollHeroFrame,
  ScrollWordReveal,
  SERVICE_VIEWPORT_ONCE,
  VIEWPORT_ONCE,
  heroImageVariants,
  mediaImageVariants,
  mediaVariants,
  menuItemVariants,
  menuVariants,
  revealVariants,
  routeVariants,
  serviceContentVariants,
  serviceHeroImageVariants,
  serviceImageVariants,
  serviceMediaImageVariants,
  serviceMediaVariants,
  serviceSectionVariants,
} from "./motion-system";

const languages = ["en", "es"];
const localeContent = Object.fromEntries(
  languages.map((language) => [
    language,
    {
      pages: content.pages.filter((item) => item.language === language || (!item.language && language === "en")),
      projects: content.projects.filter((item) => item.language === language || (!item.language && language === "en")),
    },
  ]),
);
const pageMaps = Object.fromEntries(
  languages.map((language) => [
    language,
    Object.fromEntries(localeContent[language].pages.map((page) => [page.slug, page])),
  ]),
);
const projectMaps = Object.fromEntries(
  languages.map((language) => [
    language,
    Object.fromEntries(localeContent[language].projects.map((project) => [project.slug, project])),
  ]),
);
const postBySlug = Object.fromEntries(content.posts.map((post) => [post.slug, post]));

const pageTranslations = {
  "poa-studio-for-another-architecture": "por-otra-arquitectura-2",
  projects: "proyectos",
  office: "estudio",
  contact: "contacto",
  "architecture-new-build": "arquitectura-y-obra-nueva",
  "renovation-refurbishment": "renovacion-rehabilitacion",
  "interior-design": "diseno-interiores",
  "3d-visualization": "visualizacion-3d",
  "management-advisory": "gestion-y-asesoria",
  "architecture-studio-in-cordoba": "estudio-de-arquitectura-en-cordoba",
  "architecture-firm-madrid": "estudio-de-arquitectura-en-madrid",
  "architecture-firm-marbella": "estudio-de-arquitectura-en-marbella",
  "cookie-policy": "politica-de-cookies",
  "legal-notice": "aviso-legal",
  "privacy-policy": "politica-de-privacidad",
};
const reversePageTranslations = Object.fromEntries(
  Object.entries(pageTranslations).map(([english, spanish]) => [spanish, english]),
);

const serviceConfig = {
  en: [
    {
      slug: "architecture-new-build",
      title: "Architecture & New Build",
      description: "Bespoke residential architecture, from site strategy and permits through structural completion.",
    },
    {
      slug: "renovation-refurbishment",
      title: "Renovation & Refurbishment",
      description: "Existing structures assessed, rehabilitated and refined with technical and material precision.",
    },
    {
      slug: "interior-design",
      title: "Interior Design",
      description: "Light, materials, joinery and furniture conceived as one continuous architectural system.",
    },
    {
      slug: "3d-visualization",
      title: "3D Visualization",
      description: "High-fidelity models that make spatial, technical and material decisions visible early.",
    },
    {
      slug: "management-advisory",
      title: "Management & Advisory",
      description: "Site supervision, due diligence, budget control and one accountable point of coordination.",
    },
  ],
  es: [
    {
      slug: "arquitectura-y-obra-nueva",
      title: "Arquitectura y Obra Nueva",
      description: "Arquitectura residencial a medida, desde la estrategia y las licencias hasta la ejecución estructural.",
    },
    {
      slug: "renovacion-rehabilitacion",
      title: "Renovación y Rehabilitación",
      description: "Estructuras existentes analizadas, rehabilitadas y refinadas con precisión técnica y material.",
    },
    {
      slug: "diseno-interiores",
      title: "Diseño de Interiores",
      description: "Luz, materiales, carpintería y mobiliario concebidos como un único sistema arquitectónico.",
    },
    {
      slug: "visualizacion-3d",
      title: "Visualización 3D",
      description: "Modelos de alta fidelidad que permiten decidir antes sobre espacio, técnica y materialidad.",
    },
    {
      slug: "gestion-y-asesoria",
      title: "Gestión y Asesoramiento",
      description: "Dirección, control económico y coordinación técnica desde un único punto de responsabilidad.",
    },
  ],
};

const faqQuestionTitles = {
  "architecture-new-build": [
    "How do you define quiet luxury in a new build?",
    "How do you manage projects for international clients?",
    "Can a new-build project be managed remotely?",
    "How is sustainability integrated into the architecture?",
    "When do architecture and interior design come together?",
    "How long does a high-end new build take?",
  ],
  "renovation-refurbishment": [
    "What distinguishes refurbishment from a standard renovation?",
    "What does a technical assessment include?",
    "How do you prevent unforeseen costs?",
    "Can you convert a non-residential building into a home?",
    "How do you preserve a building’s original character?",
    "Can you manage the renovation remotely?",
  ],
  "interior-design": [
    "Why integrate interior design from the beginning?",
    "How do you create interiors that remain timeless?",
    "Why choose bespoke joinery?",
    "How do international clients select materials remotely?",
    "What does your FF&E procurement service include?",
    "Can you join a project with existing architectural plans?",
  ],
  "3d-visualization": [
    "How accurate are your architectural visualizations?",
    "Can we explore alternatives before construction?",
    "Is 3D visualization available as a standalone service?",
    "How is a technical rendering different from an artist’s impression?",
  ],
  "management-advisory": [
    "How do you assess a property before purchase?",
    "How do you manage projects for international clients?",
    "What does a technical due-diligence report include?",
  ],
  "arquitectura-y-obra-nueva": [
    "¿Cómo definís el lujo discreto en una obra nueva?",
    "¿Cómo gestionáis licencias y permisos?",
    "¿Podéis gestionar un proyecto para clientes internacionales?",
    "¿Cómo integráis la sostenibilidad en la arquitectura?",
    "¿Cuándo se integran arquitectura e interiorismo?",
    "¿Cuánto dura una obra nueva de alto nivel?",
  ],
  "renovacion-rehabilitacion": [
    "¿Qué diferencia una rehabilitación de una reforma convencional?",
    "¿Qué incluye una evaluación técnica?",
    "¿Cómo evitáis costes imprevistos?",
    "¿Podéis convertir un edificio no residencial en vivienda?",
    "¿Cómo preserváis el carácter original de un edificio?",
    "¿Podéis gestionar la rehabilitación a distancia?",
  ],
  "diseno-interiores": [
    "¿Por qué integrar el interiorismo desde el principio?",
    "¿Cómo creáis interiores que perduran en el tiempo?",
    "¿Por qué elegir carpintería a medida?",
    "¿Cómo seleccionan los materiales los clientes internacionales?",
    "¿Qué incluye el servicio de adquisición de FF&E?",
    "¿Podéis incorporaros a un proyecto con planos existentes?",
  ],
  "visualizacion-3d": [
    "¿Qué precisión tienen las visualizaciones arquitectónicas?",
    "¿Podemos explorar alternativas antes de construir?",
    "¿Ofrecéis la visualización 3D como servicio independiente?",
    "¿Qué diferencia un render técnico de una impresión artística?",
  ],
  "gestion-y-asesoria": [
    "¿Cómo evaluáis una propiedad antes de comprarla?",
    "¿Cómo gestionáis proyectos para clientes internacionales?",
    "¿Qué incluye un informe técnico de due diligence?",
  ],
};

const ui = {
  en: {
    projects: "Projects",
    studio: "Studio",
    services: "Services",
    journal: "Journal",
    contact: "Contact",
    hero: "Architecture, with another point of view.",
    heroIntro: "Precise spaces shaped around the way people live, work and belong.",
    heroAction: "Explore selected work",
    manifestoTitle: "POA stands for\nPor Otra Arquitectura",
    manifesto:
      "We create enduring places where design, use and investment align from the first decision to the final detail.",
    selectedTitle: "Selected spaces, built with intention.",
    selectedAction: "View the complete project archive",
    servicesTitle: "One studio. Every dimension of the work.",
    servicesIntro: "A coordinated practice, from feasibility and planning to interiors and delivery.",
    serviceAction: "Read about this service",
    methodTitle: "Clarity before construction.",
    methodBody:
      "Every project is modelled, tested and coordinated before work begins. Design, technical requirements, budget and long-term value are treated as one problem, not separate phases.",
    methodAction: "Understand our approach",
    processTitle: "A clear path from first conversation to built work.",
    process: [
      [
        "Initial conversation",
        "We begin by understanding how you want to live, what the site or building allows, and which decisions will define the project. Ambition, timing, investment and practical constraints are made clear from the outset.",
      ],
      [
        "Analysis and direction",
        "We study planning conditions, structure, orientation, programme and cost before fixing a direction. Each possibility is tested for spatial quality, technical feasibility and long-term value.",
      ],
      [
        "Architectural proposal",
        "The chosen direction becomes a precise architectural proposal connecting layout, light, materials and construction. Drawings, models and visualisations make every decision legible before work begins.",
      ],
    ],
    studioTitle: "International experience, grounded in place.",
    studioBody:
      "A multidisciplinary team across Córdoba, Madrid and Marbella, working from intimate renovations to complex residential developments.",
    studioAction: "Meet the studio",
    journalTitle: "Ideas around architecture and the life of buildings.",
    journalAction: "Read the journal",
    projectArchiveTitle: "Projects made to endure.",
    projectArchiveIntro: "Residential, cultural, commercial and urban work across Spain and beyond.",
    backProjects: "All projects",
    projectContinue: "Next project",
    officeTitle: "There is no project without a team.",
    contactTitle: "Tell us what you want to make possible.",
    mail: "Write to the studio",
    footerQuestion: "Have a place in mind?",
    footerAction: "Let’s give it form.",
    correspondence: "Correspondence",
    privacy: "Privacy",
    legal: "Legal",
    completeApproach: "The complete POA approach",
    journalArchive: "The complete POA editorial archive.",
    articleAction: "Read article",
    projectAction: "View project",
    notFound: "This space is still undefined.",
    returnHome: "Return home",
    menu: "Menu",
    close: "Close",
  },
  es: {
    projects: "Proyectos",
    studio: "Estudio",
    services: "Servicios",
    journal: "Cuaderno",
    contact: "Contacto",
    hero: "Arquitectura, desde otro punto de vista.",
    heroIntro: "Espacios precisos, pensados para la forma en que vivimos, trabajamos y habitamos.",
    heroAction: "Explorar proyectos seleccionados",
    manifestoTitle: "POA significa\nPor Otra Arquitectura",
    manifesto:
      "Creamos lugares duraderos donde diseño, uso e inversión se alinean desde la primera decisión hasta el último detalle.",
    selectedTitle: "Espacios construidos con intención.",
    selectedAction: "Ver el archivo completo de proyectos",
    servicesTitle: "Un estudio. Todas las dimensiones del proyecto.",
    servicesIntro: "Una práctica coordinada, desde la viabilidad y el diseño hasta el interior y la ejecución.",
    serviceAction: "Conocer este servicio",
    methodTitle: "Claridad antes de construir.",
    methodBody:
      "Cada proyecto se modela, se comprueba y se coordina antes de comenzar. Diseño, técnica, presupuesto y valor a largo plazo se abordan como un único problema.",
    methodAction: "Conocer nuestra forma de trabajar",
    processTitle: "Un recorrido claro desde la primera conversación hasta la obra.",
    process: [
      [
        "Conversación inicial",
        "Empezamos por comprender cómo quieres habitar, qué permite el lugar o el edificio y qué decisiones definirán el proyecto. Objetivos, plazos, inversión y condicionantes prácticos quedan claros desde el inicio.",
      ],
      [
        "Análisis y dirección",
        "Estudiamos normativa, estructura, orientación, programa y costes antes de fijar una dirección. Cada posibilidad se contrasta por su calidad espacial, viabilidad técnica y valor a largo plazo.",
      ],
      [
        "Propuesta arquitectónica",
        "La dirección elegida se convierte en una propuesta precisa que conecta distribución, luz, materiales y construcción. Planos, modelos y visualizaciones hacen legible cada decisión antes de comenzar la obra.",
      ],
    ],
    studioTitle: "Experiencia internacional, arraigada en cada lugar.",
    studioBody:
      "Un equipo multidisciplinar en Córdoba, Madrid y Marbella, desde reformas íntimas hasta desarrollos residenciales complejos.",
    studioAction: "Conocer el estudio",
    journalTitle: "Ideas sobre arquitectura y la vida de los edificios.",
    journalAction: "Leer el cuaderno",
    projectArchiveTitle: "Proyectos pensados para perdurar.",
    projectArchiveIntro: "Obra residencial, cultural, comercial y urbana en España y otros contextos.",
    backProjects: "Todos los proyectos",
    projectContinue: "Proyecto siguiente",
    officeTitle: "No hay proyecto sin equipo.",
    contactTitle: "Cuéntanos qué quieres hacer posible.",
    mail: "Escribir al estudio",
    footerQuestion: "¿Tienes un lugar en mente?",
    footerAction: "Démosle forma.",
    correspondence: "Correspondencia",
    privacy: "Privacidad",
    legal: "Legal",
    completeApproach: "La mirada completa de POA",
    journalArchive: "El archivo editorial completo de POA.",
    articleAction: "Leer artículo",
    projectAction: "Ver proyecto",
    notFound: "Este espacio todavía no está definido.",
    returnHome: "Volver al inicio",
    menu: "Menú",
    close: "Cerrar",
  },
};

const presentationNoise = [
  /developed by/i,
  /currently viewing a placeholder/i,
  /unblock content/i,
  /more information/i,
  /estudio de arquitectura con experiencia en proyectos internacionales/i,
];

function cleanText(text = "") {
  return text.replace(/\s*[—–]\s*/g, ", ").replace(/\s+/g, " ").trim();
}

function isNoise(text) {
  return presentationNoise.some((pattern) => pattern.test(text));
}

function isDisplayableImage(image) {
  return Boolean(image?.src) && !image.originalUrl?.includes("por-otra-arquitectura-blanco-transparente");
}

function imageFor(item, index = 0) {
  const images = item?.gallery?.filter(isDisplayableImage) || [];
  return images[index]?.src || (isDisplayableImage(item?.hero) ? item.hero.src : "") || "";
}

function imageKey(item) {
  const url = item?.gallery?.find(isDisplayableImage)?.originalUrl || item?.hero?.originalUrl || "";
  return url.replace(/-\d+x\d+(?=\.[^.]+$)/, "");
}

function primaryText(item) {
  return cleanText(
    item?.sections
      ?.flatMap((section) => section.blocks)
      .find((block) => block.type === "text" && block.text.length > 80 && !isNoise(block.text))?.text || "",
  );
}

function homePath(language) {
  return language === "en" ? "/en/" : "/";
}

function pagePath(language, slug) {
  if (language === "en") {
    if (slug === "poa-studio-for-another-architecture") return "/en/";
    if (slug === "projects") return "/en/projects/";
    if (slug === "office") return "/en/office/";
    if (slug === "contact") return "/en/contact/";
    return `/en/${slug}/`;
  }
  if (slug === "por-otra-arquitectura-2") return "/";
  if (slug === "proyectos") return "/proyectos/";
  if (slug === "estudio") return "/estudio/";
  if (slug === "contacto") return "/contacto/";
  return `/${slug}/`;
}

function projectsPath(language) {
  return language === "en" ? "/en/projects/" : "/proyectos/";
}

function projectPath(language, slug) {
  return `${language === "en" ? "/en" : ""}/portfolio/${slug}/`;
}

function officePath(language) {
  return language === "en" ? "/en/office/" : "/estudio/";
}

function contactPath(language) {
  return language === "en" ? "/en/contact/" : "/contacto/";
}

function journalPath(language, slug) {
  const prefix = language === "en" ? "/en/journal/" : "/journal/";
  return slug ? `${prefix}${slug}/` : prefix;
}

function useLanguage() {
  const location = useLocation();
  return location.pathname === "/en" || location.pathname.startsWith("/en/") ? "en" : "es";
}

function translatedPath(pathname, language) {
  const target = language === "en" ? "es" : "en";
  if (pathname === homePath(language)) return homePath(target);
  if (pathname === projectsPath(language)) return projectsPath(target);
  if (pathname === officePath(language)) return officePath(target);
  if (pathname === contactPath(language)) return contactPath(target);
  if (pathname === journalPath(language)) return journalPath(target);

  const projectPrefix = language === "en" ? "/en/portfolio/" : "/portfolio/";
  if (pathname.startsWith(projectPrefix)) {
    const slug = pathname.slice(projectPrefix.length).split("/")[0];
    const current = projectMaps[language][slug];
    const targetProject = localeContent[target].projects.find((project) => imageKey(project) === imageKey(current));
    return targetProject ? projectPath(target, targetProject.slug) : projectsPath(target);
  }

  const articlePrefix = language === "en" ? "/en/journal/" : "/journal/";
  if (pathname.startsWith(articlePrefix)) {
    const slug = pathname.slice(articlePrefix.length).split("/")[0];
    return postBySlug[slug] ? journalPath(target, slug) : journalPath(target);
  }

  const slug = pathname.split("/").filter(Boolean).at(-1);
  const targetSlug = language === "en" ? pageTranslations[slug] : reversePageTranslations[slug];
  return targetSlug ? pagePath(target, targetSlug) : homePath(target);
}

function useDocumentTitle(title, language) {
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = title ? `${title} | POA Estudio` : "POA Estudio | Por Otra Arquitectura";
  }, [title, language]);
}

let pendingLanguageScrollY = null;

function rememberLanguageScroll(event) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  pendingLanguageScrollY = window.scrollY;
}

function ScrollManager() {
  const location = useLocation();
  useLayoutEffect(() => {
    window.history.scrollRestoration = "manual";
    if (pendingLanguageScrollY !== null) return undefined;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const frame = window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [location.pathname]);
  return null;
}

function BrandLogo({ className = "" }) {
  return <span className={`brand-logo ${className}`} aria-hidden="true" />;
}

function Header() {
  const language = useLanguage();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const labels = ui[language];
  const navigationServices = [4, 0, 3, 1, 2].map((index) => serviceConfig[language][index]);
  const isHome = location.pathname === "/" || location.pathname === "/en/";
  const { scrollY } = useScroll();
  const retainedNavInset = useRef(0);
  const servicesTriggerRef = useRef(null);
  const servicesCloseTimer = useRef(null);
  const openServices = () => {
    window.clearTimeout(servicesCloseTimer.current);
    setServicesOpen(true);
  };
  const queueServicesClose = () => {
    window.clearTimeout(servicesCloseTimer.current);
    servicesCloseTimer.current = window.setTimeout(() => setServicesOpen(false), 140);
  };
  const navInset = useTransform(scrollY, (value) => {
    if (!isHome) return `${retainedNavInset.current}px`;
    if (typeof window === "undefined") return "0px";
    const morphRatio = window.innerWidth <= 760 ? 0.32 : 0.42;
    const scrollProgress = Math.min(Math.max(value / Math.max(window.innerHeight * morphRatio, 1), 0), 1);
    const morphProgress = Math.min(Math.max((scrollProgress - 0.08) / 0.92, 0), 1);
    retainedNavInset.current = (1 - morphProgress) * 24;
    return `${retainedNavInset.current}px`;
  });
  useEffect(() => {
    setOpen(false);
    setServicesOpen(false);
  }, [location.pathname]);

  useLayoutEffect(() => {
    let frame = 0;
    const darkSurfaceSelector = [
      ".home-hero",
      ".page-hero--media",
      ".service-index",
      ".studio-feature",
      ".office-method",
      ".editorial-section--faq",
      ".contact-hero",
      ".menu-overlay",
      ".footer",
      ".article-prose blockquote",
    ].join(", ");
    const lightSurfaceSelector = [
      ".home-content-layer",
      ".page-hero:not(.page-hero--media)",
      ".service-index__list > a.is-active",
    ].join(", ");
    const updateContrast = () => {
      frame = 0;
      const header = document.querySelector(".site-header");
      if (!header) return;
      const controls = header.querySelectorAll(
        ".wordmark, .desktop-nav > a, .desktop-services__trigger, .language-switch, .header-contact, .menu-trigger",
      );

      controls.forEach((control) => {
        const rect = control.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = Math.min(Math.max(rect.left + rect.width / 2, 0), window.innerWidth - 1);
        const y = Math.min(Math.max(rect.top + rect.height / 2, 0), window.innerHeight - 1);
        const stack = document.elementsFromPoint(x, y).filter((element) => !header.contains(element));
        const visibleSurface = stack[0];
        const isLightSurface = visibleSurface?.closest(lightSurfaceSelector);
        const isDarkSurface = !isLightSurface && visibleSurface?.closest(darkSurfaceSelector);
        control.dataset.navContrast = isDarkSurface ? "light" : "dark";
      });
    };
    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateContrast);
    };

    requestUpdate();
    const shell = document.querySelector(".site-shell");
    const routeObserver = new MutationObserver(requestUpdate);
    if (shell) {
      routeObserver.observe(shell, { childList: true, subtree: true });
    }
    const transitionTimer = window.setTimeout(
      requestUpdate,
      (MOTION.duration.exit + MOTION.duration.enter) * 1000 + 80,
    );
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(transitionTimer);
      routeObserver.disconnect();
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [location.pathname, open]);

  useEffect(() => {
    if (!open && !servicesOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        setServicesOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, servicesOpen]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(
    () => () => {
      window.clearTimeout(servicesCloseTimer.current);
    },
    [],
  );

  useLayoutEffect(() => {
    if (!servicesOpen) return undefined;
    let frame;
    const syncPanelPosition = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const trigger = servicesTriggerRef.current;
        const panel = document.getElementById("desktop-services-menu");
        if (!trigger || !panel) return;
        const rect = trigger.getBoundingClientRect();
        panel.style.setProperty("--services-left", `${rect.left + rect.width / 2}px`);
        panel.style.setProperty("--services-top", `${rect.bottom + 13}px`);
      });
    };

    syncPanelPosition();
    window.addEventListener("scroll", syncPanelPosition, { passive: true });
    window.addEventListener("resize", syncPanelPosition);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", syncPanelPosition);
      window.removeEventListener("resize", syncPanelPosition);
    };
  }, [servicesOpen]);

  return (
    <>
      <m.header className="site-header" style={{ y: navInset, "--nav-inset": navInset }}>
        <Link className="wordmark" to={homePath(language)} aria-label="POA Estudio">
          <BrandLogo />
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link to={projectsPath(language)}>{labels.projects}</Link>
          <Link to={officePath(language)}>{labels.studio}</Link>
          <div
            className="desktop-services"
            onMouseEnter={openServices}
            onMouseLeave={queueServicesClose}
            onBlur={queueServicesClose}
          >
            <button
              ref={servicesTriggerRef}
              className="desktop-services__trigger"
              type="button"
              aria-haspopup="true"
              aria-expanded={servicesOpen}
              aria-controls="desktop-services-menu"
              onClick={openServices}
              onFocus={openServices}
            >
              {labels.services}
            </button>
          </div>
        </nav>
        <div className="header-actions">
          <Link
            className="language-switch"
            to={translatedPath(location.pathname, language)}
            onClick={rememberLanguageScroll}
          >
            {language === "en" ? "ES" : "EN"}
          </Link>
          <Link className="header-contact" to={contactPath(language)}>
            {labels.contact}
          </Link>
          <button
            className="menu-trigger"
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? labels.close : labels.menu}
          </button>
        </div>
      </m.header>
      <AnimatePresence initial={false}>
        {servicesOpen && (
          <m.nav
            className="desktop-services__panel"
            id="desktop-services-menu"
            aria-label={labels.services}
            initial={{ opacity: 0, y: -8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.99 }}
            transition={{ type: "tween", duration: MOTION.duration.state, ease: MOTION.ease }}
            onMouseEnter={openServices}
            onMouseLeave={queueServicesClose}
            onFocus={openServices}
            onBlur={queueServicesClose}
          >
            {navigationServices.map((service) => (
              <Link to={pagePath(language, service.slug)} key={service.slug} onClick={() => setServicesOpen(false)}>
                {service.title}
              </Link>
            ))}
          </m.nav>
        )}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            className="menu-overlay is-open"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <m.nav className="menu-overlay__nav" aria-label="Menu">
              <m.div className="menu-overlay__item" variants={menuItemVariants}>
                <Link to={projectsPath(language)}>{labels.projects}</Link>
              </m.div>
              <m.div className="menu-overlay__item" variants={menuItemVariants}>
                <Link to={officePath(language)}>{labels.studio}</Link>
              </m.div>
              <m.div className="menu-overlay__services" variants={menuItemVariants}>
                <p>{labels.services}</p>
                <div className="menu-overlay__service-links">
                  {navigationServices.map((service) => (
                    <Link to={pagePath(language, service.slug)} key={service.slug}>
                      {service.title}
                    </Link>
                  ))}
                </div>
              </m.div>
              <m.div className="menu-overlay__item" variants={menuItemVariants}>
                <Link to={contactPath(language)}>{labels.contact}</Link>
              </m.div>
            </m.nav>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Footer() {
  const language = useLanguage();
  const labels = ui[language];
  const locationSlugs =
    language === "en"
      ? ["architecture-studio-in-cordoba", "architecture-firm-madrid", "architecture-firm-marbella"]
      : [
          "estudio-de-arquitectura-en-cordoba",
          "estudio-de-arquitectura-en-madrid",
          "estudio-de-arquitectura-en-marbella",
        ];

  return (
    <footer className="footer">
      <Reveal className="footer-callout">
        <p>{labels.footerQuestion}</p>
        <Link to={contactPath(language)}>{labels.footerAction}</Link>
      </Reveal>
      <div className="footer-grid">
        {[
          ["Córdoba", "Av. del Gran Capitán, 20, 2ºB", "14001 Córdoba", "+34 665 33 73 63"],
          ["Madrid", "C. de Manzanares, 4", "28005 Madrid", "+34 744 66 90 88"],
          ["Marbella", "Calle Antonio Mingote, 8", "29670 Marbella, Málaga", "+34 633 70 03 00"],
        ].map(([city, address, postcode, phone], index) => (
          <div key={city}>
            <Link className="footer-city" to={pagePath(language, locationSlugs[index])}>
              {city}
            </Link>
            <span>{address}</span>
            <span>{postcode}</span>
            <a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>
          </div>
        ))}
        <div>
          <p>{labels.correspondence}</p>
          <a href="mailto:hola@poaestudio.com">hola@poaestudio.com</a>
          <Link to={pagePath(language, language === "en" ? "privacy-policy" : "politica-de-privacidad")}>
            {labels.privacy}
          </Link>
          <Link to={pagePath(language, language === "en" ? "legal-notice" : "aviso-legal")}>{labels.legal}</Link>
        </div>
      </div>
      <div className="footer-base">
        <Link className="footer-brand" to={homePath(language)} aria-label="POA Estudio">
          <BrandLogo />
        </Link>
        <span>Por Otra Arquitectura</span>
        <span>España · Internacional</span>
      </div>
    </footer>
  );
}

function AnimatedImage({ image, src, className = "", eager = false, alt = "", streamlined = false }) {
  const imageSrc = src || image?.src;
  if (!imageSrc) return null;
  return (
    <m.figure
      className={`media-frame ${className}`}
      variants={streamlined ? serviceMediaVariants : mediaVariants}
      initial="hidden"
      whileInView="visible"
      viewport={streamlined ? SERVICE_VIEWPORT_ONCE : VIEWPORT_ONCE}
    >
      <m.img
        variants={streamlined ? serviceMediaImageVariants : mediaImageVariants}
        src={imageSrc}
        alt={alt || image?.alt || ""}
        loading={eager ? "eager" : "lazy"}
        fetchpriority={eager ? "high" : "auto"}
      />
    </m.figure>
  );
}

function WordReveal({ children }) {
  return <ScrollWordReveal className="word-reveal">{children}</ScrollWordReveal>;
}

function ProjectCard({ project, language }) {
  const labels = ui[language];
  return (
    <m.article
      className="project-card"
      variants={revealVariants}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
    >
      <Link to={projectPath(language, project.slug)}>
        <div className="project-card__media">
          <img src={imageFor(project)} alt={project.gallery?.[0]?.alt || project.title} loading="lazy" />
          <span>{labels.projectAction}</span>
        </div>
        <h3>{cleanText(project.title)}</h3>
      </Link>
    </m.article>
  );
}

function ProjectGrid({ projects, language, all = false }) {
  return (
    <div className={`project-grid ${all ? "project-grid--all" : ""}`}>
      {projects.map((project) => (
        <ProjectCard project={project} language={language} key={`${language}-${project.id}`} />
      ))}
    </div>
  );
}

function EditorialSections({ item, skip = 0, serviceMode = false }) {
  const sections = item?.sections?.slice(skip) || [];
  return (
    <div className="editorial-sections">
      {sections.map((section, sectionIndex) => {
        const blocks = section.blocks
          .map((block) => ({ ...block, text: cleanText(block.text) }))
          .filter((block) => block.text && !isNoise(block.text));
        const headingBlocks = blocks.filter((block) => block.type === "heading");
        const bodyBlocks = blocks.filter((block) => block.type !== "heading");
        const images = section.images.filter(isDisplayableImage);
        if (!blocks.length && !images.length) return null;
        const isFaqSection =
          faqQuestionTitles[item.slug] &&
          headingBlocks.some((block) => /^(frequently asked questions|preguntas frecuentes)$/i.test(block.text));

        if (isFaqSection) {
          const faqHeadingIndex = blocks.findIndex(
            (block) => block.type === "heading" && /^(frequently asked questions|preguntas frecuentes)$/i.test(block.text),
          );
          const closingHeadingIndex = blocks.findIndex(
            (block, index) => index > faqHeadingIndex && block.type === "heading",
          );
          const faqEnd = closingHeadingIndex === -1 ? blocks.length : closingHeadingIndex;
          const answers = blocks.slice(faqHeadingIndex + 1, faqEnd).filter((block) => block.type !== "heading");
          const closingBlocks = closingHeadingIndex === -1 ? [] : blocks.slice(closingHeadingIndex);
          const questions = faqQuestionTitles[item.slug];

          return (
            <m.section
              className="editorial-section editorial-section--faq"
              key={`${item.id}-${sectionIndex}`}
              variants={serviceMode ? serviceSectionVariants : revealVariants}
              initial="hidden"
              whileInView="visible"
              viewport={serviceMode ? SERVICE_VIEWPORT_ONCE : VIEWPORT_ONCE}
            >
              <m.div
                className="faq-heading"
                variants={serviceMode ? serviceContentVariants : undefined}
              >
                <h2>{blocks[faqHeadingIndex].text}</h2>
              </m.div>
              <m.div
                className="faq-list"
                variants={serviceMode ? serviceContentVariants : undefined}
              >
                {answers.map((block, index) => (
                  <article className="faq-item" key={`${questions[index]}-${index}`}>
                    <h3>{questions[index]}</h3>
                    {block.type === "quote" ? <blockquote>{block.text}</blockquote> : <p>{block.text}</p>}
                  </article>
                ))}
              </m.div>
              {closingBlocks.length > 0 && (
                <m.div
                  className="faq-closing"
                  variants={serviceMode ? serviceContentVariants : undefined}
                >
                  <div>
                    {closingBlocks
                      .filter((block) => block.type === "heading")
                      .map((block) => <h2 key={block.text}>{block.text}</h2>)}
                  </div>
                  <div>
                    {closingBlocks
                      .filter((block) => block.type !== "heading")
                      .map((block, index) => <p key={`${block.text}-${index}`}>{block.text}</p>)}
                  </div>
                </m.div>
              )}
            </m.section>
          );
        }

        return (
          <m.section
            className="editorial-section"
            key={`${item.id}-${sectionIndex}`}
            variants={serviceMode ? serviceSectionVariants : revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={serviceMode ? SERVICE_VIEWPORT_ONCE : VIEWPORT_ONCE}
          >
            <m.div
              className="editorial-copy"
              variants={serviceMode ? serviceSectionVariants : undefined}
            >
              <m.div variants={serviceMode ? serviceContentVariants : undefined}>
                {headingBlocks.map((block, index) => {
                  const Element = index === 0 ? "h2" : "h3";
                  return <Element key={`${block.text}-${index}`}>{block.text}</Element>;
                })}
              </m.div>
              {bodyBlocks.length > 0 && (
                <m.div
                  className="body-copy"
                  variants={serviceMode ? serviceContentVariants : undefined}
                >
                  {bodyBlocks.map((block, index) => {
                    if (block.type === "list") {
                      return (
                        <p className="list-line" key={`${block.text}-${index}`}>
                          {block.text}
                        </p>
                      );
                    }
                    if (block.type === "quote") return <blockquote key={`${block.text}-${index}`}>{block.text}</blockquote>;
                    return <p key={`${block.text}-${index}`}>{block.text}</p>;
                  })}
                </m.div>
              )}
            </m.div>
            {images.length > 0 && (
              <div className={`section-media-grid count-${images.length}`}>
                {images.map((image, index) => (
                  <AnimatedImage
                    image={image}
                    key={`${image.src}-${index}`}
                    streamlined={serviceMode}
                  />
                ))}
              </div>
            )}
          </m.section>
        );
      })}
    </div>
  );
}

function ServiceExperience({ language }) {
  const [active, setActive] = useState(0);
  const services = serviceConfig[language].map((service) => ({
    ...service,
    page: pageMaps[language][service.slug],
  }));
  const labels = ui[language];

  return (
    <div className="service-index">
      <div className="service-index__list">
        {services.map((service, index) => (
          <div
            className={`service-index__item${active === index ? " is-active" : ""}`}
            key={service.slug}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
          >
            {active === index && (
              <div className="service-index__mobile-stage" aria-live="polite">
                <img src={imageFor(service.page)} alt={service.title} loading="eager" />
              </div>
            )}
            <button
              className="service-index__trigger"
              type="button"
              aria-expanded={active === index}
              aria-controls={`service-detail-${language}-${index}`}
              onClick={() => setActive(index)}
            >
              <h3>{service.title}</h3>
            </button>
            <div
              className="service-index__detail"
              id={`service-detail-${language}-${index}`}
              aria-hidden={active !== index}
            >
              <div>
                <p>{service.description}</p>
                <Link
                  className="service-index__action"
                  to={pagePath(language, service.slug)}
                  tabIndex={active === index ? 0 : -1}
                >
                  {labels.serviceAction}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="service-index__stage" aria-live="polite">
        <AnimatePresence initial={false}>
          <m.img
            className="is-active"
            src={imageFor(services[active].page)}
            alt={services[active].title}
            loading="eager"
            variants={serviceImageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            key={services[active].slug}
          />
        </AnimatePresence>
      </div>
    </div>
  );
}

function PressStrip({ page }) {
  const logos = page?.sections
    ?.flatMap((section) => section.images)
    .filter((image) => image?.originalUrl?.includes("/medios-"))
    .filter(isDisplayableImage);
  if (!logos?.length) return null;
  return (
    <m.section
      className="press-strip"
      aria-label="Selected publications"
      variants={revealVariants}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
    >
      <div className="press-strip__track">
        {[false, true].map((isDuplicate) => (
          <div
            className="press-strip__set"
            aria-hidden={isDuplicate ? "true" : undefined}
            key={isDuplicate ? "duplicate" : "primary"}
          >
            {logos.map((image, index) => (
              <img
                src={image.src}
                alt={isDuplicate ? "" : image.alt || "Publication"}
                loading="lazy"
                key={`${image.src}-${index}`}
              />
            ))}
          </div>
        ))}
      </div>
    </m.section>
  );
}

function HomePage({ language }) {
  const labels = ui[language];
  const pages = pageMaps[language];
  const projects = localeContent[language].projects;
  const homeSlug = language === "en" ? "poa-studio-for-another-architecture" : "por-otra-arquitectura-2";
  const page = pages[homeSlug];
  const heroProject = projects[0];
  const methodImage = page?.sections?.flatMap((section) => section.images).find((image) =>
    image?.originalUrl?.includes("estudio-arquitectura"),
  );
  useDocumentTitle("", language);

  return (
    <main>
      <ScrollHeroFrame>
        <m.img
          src={imageFor(heroProject)}
          alt={heroProject?.title || "POA Estudio"}
          fetchpriority="high"
          variants={heroImageVariants}
          initial="hidden"
          animate="visible"
        />
        <div className="hero-scrim" />
        <div className="home-hero__content">
          <MotionHeading text={labels.hero} immediate delay={0.12} />
          <m.p
            variants={revealVariants}
            custom={0.36}
            initial="hidden"
            animate="visible"
          >
            {labels.heroIntro}
          </m.p>
          <m.div variants={revealVariants} custom={0.46} initial="hidden" animate="visible">
            <Link className="hero-project-link" to={projectsPath(language)}>
              {labels.heroAction}
            </Link>
          </m.div>
        </div>
        <m.div
          className="hero-credit"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "tween", duration: 0.52, delay: 0.6, ease: MOTION.ease }}
        >
          <span>{cleanText(heroProject?.title)}</span>
          <span>Córdoba · Madrid · Marbella</span>
        </m.div>
      </ScrollHeroFrame>

      <div className="home-content-layer">
        <section className="intro-chapter">
          <MotionHeading as="h2" className="intro-chapter__manifesto-title" text={labels.manifestoTitle} />
          <WordReveal>{labels.manifesto}</WordReveal>
        </section>

        <section className="projects-chapter">
          <Reveal className="chapter-heading">
            <h2>{labels.selectedTitle}</h2>
            <Link className="text-action" to={projectsPath(language)}>
              {labels.selectedAction}
            </Link>
          </Reveal>
          <ProjectGrid projects={projects.slice(0, 6)} language={language} />
        </section>

        <section className="expertise-chapter">
          <Reveal className="chapter-heading">
            <h2>{labels.servicesTitle}</h2>
            <p>{labels.servicesIntro}</p>
          </Reveal>
          <ServiceExperience language={language} />
        </section>

        <section className="method-chapter">
          <AnimatedImage image={methodImage || projects[2]?.gallery?.[0]} />
          <m.div
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
          >
            <h2>{labels.methodTitle}</h2>
            <p>{labels.methodBody}</p>
            <Link className="text-action" to={pagePath(language, serviceConfig[language][4].slug)}>
              {labels.methodAction}
            </Link>
          </m.div>
        </section>

        <PressStrip page={page} />

        <section className="process-chapter">
          <MotionHeading as="h2" text={labels.processTitle} />
          <div className="process-list">
            {labels.process.map(([title, body], index) => (
              <m.article
                key={title}
                custom={index * 0.06}
                variants={revealVariants}
                initial="hidden"
                whileInView="visible"
                viewport={VIEWPORT_ONCE}
              >
                <h3>{title}</h3>
                <p>{body}</p>
              </m.article>
            ))}
          </div>
        </section>

        <section className="studio-feature">
          <AnimatedImage image={projects[9]?.gallery?.[0]} />
          <m.div
            className="studio-feature__copy"
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
          >
            <h2>{labels.studioTitle}</h2>
            <p>{labels.studioBody}</p>
            <Link className="text-action text-action--light" to={officePath(language)}>
              {labels.studioAction}
            </Link>
          </m.div>
        </section>

        <section className="journal-preview">
          <Reveal className="chapter-heading">
            <h2>{labels.journalTitle}</h2>
            <Link className="text-action" to={journalPath(language)}>
              {labels.journalAction}
            </Link>
          </Reveal>
          <div className="journal-preview__grid">
            {content.posts.slice(0, 3).map((post) => (
              <Link to={journalPath(language, post.slug)} key={post.id}>
                <img src={imageFor(post)} alt={post.title} loading="lazy" />
                <h3>{cleanText(post.title)}</h3>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function PageHero({ title, intro, image, serviceMode = false }) {
  return (
    <section className={`page-hero ${image?.src ? "page-hero--media" : ""}`}>
      {image?.src && (
        <m.img
          src={image.src}
          alt={image.alt || title}
          fetchpriority="high"
          variants={serviceMode ? serviceHeroImageVariants : heroImageVariants}
          initial="hidden"
          animate="visible"
        />
      )}
      {image?.src && <div className="hero-scrim" />}
      <div className="page-hero__content">
        <MotionHeading text={cleanText(title)} immediate delay={serviceMode ? 0.04 : 0.08} />
        {intro && (
          <m.p
            variants={serviceMode ? serviceContentVariants : revealVariants}
            custom={serviceMode ? 0.16 : 0.28}
            initial="hidden"
            animate="visible"
          >
            {cleanText(intro)}
          </m.p>
        )}
      </div>
    </section>
  );
}

function ProjectsPage({ language }) {
  const labels = ui[language];
  useDocumentTitle(labels.projects, language);
  return (
    <main>
      <PageHero title={labels.projectArchiveTitle} intro={labels.projectArchiveIntro} />
      <section className="project-index">
        <ProjectGrid projects={localeContent[language].projects} language={language} all />
      </section>
    </main>
  );
}

function ProjectPage({ language }) {
  const { slug } = useParams();
  const project = projectMaps[language][slug];
  const labels = ui[language];
  useDocumentTitle(project?.title, language);
  if (!project) return <NotFound language={language} />;
  const [name] = project.title.split("|").map((part) => cleanText(part));
  const gallery = project.gallery.filter(isDisplayableImage);
  const projectBlocks = project.sections
    .flatMap((section) => section.blocks)
    .map((block) => cleanText(block.text))
    .filter((text) => text && !isNoise(text));

  return (
    <main>
      <section className="project-hero">
        <div className="project-hero__title">
          <Link className="text-action" to={projectsPath(language)}>
            {labels.backProjects}
          </Link>
          <MotionHeading text={name} className={name.length > 38 ? "is-long" : ""} immediate delay={0.08} />
        </div>
        <AnimatedImage image={gallery[0]} eager alt={project.title} />
      </section>
      {projectBlocks.length > 0 && (
        <section className="project-description">
          {projectBlocks.map((text, index) => (
            <p key={`${text}-${index}`}>{text}</p>
          ))}
        </section>
      )}
      <section className="project-gallery">
        {gallery.slice(1).map((image, index) => (
          <AnimatedImage image={image} key={`${image.src}-${index}`} />
        ))}
      </section>
      <ProjectNext current={project} language={language} />
    </main>
  );
}

function ProjectNext({ current, language }) {
  const projects = localeContent[language].projects;
  const index = projects.findIndex((project) => project.id === current.id);
  const next = projects[(index + 1) % projects.length];
  const [name, place] = next.title.split("|").map((part) => cleanText(part));
  return (
    <section className="project-navigation" aria-label={ui[language].projectContinue}>
      <Link className="next-project" to={projectPath(language, next.slug)}>
        <div className="next-project__content">
          <p>{ui[language].projectContinue}</p>
          <h2>{name}</h2>
          {place && <span>{place}</span>}
        </div>
        <figure className="next-project__media">
          <img src={imageFor(next)} alt={next.title} loading="lazy" />
        </figure>
      </Link>
      <Link className="project-navigation__all" to={projectsPath(language)}>
        {ui[language].backProjects}
      </Link>
    </section>
  );
}

function titleCaseName(name, language) {
  return cleanText(name)
    .toLocaleLowerCase(language)
    .replace(/(^|[\s-])(\p{L})/gu, (match, separator, letter) => `${separator}${letter.toLocaleUpperCase(language)}`);
}

function officeProfiles(sections, language) {
  return sections.flatMap((section) => {
    const names = section.blocks.filter((block) => block.type === "heading");
    const biographies = section.blocks.filter((block) => block.type !== "heading");
    return names.map((block, index) => ({
      name: titleCaseName(block.text, language),
      biography: cleanText(biographies[index]?.text || ""),
      image: section.images[index],
    }));
  });
}

function OfficePage({ language }) {
  const slug = language === "en" ? "office" : "estudio";
  const page = pageMaps[language][slug];
  const labels = ui[language];
  const heroSection = page.sections[0];
  const teamIntroduction = page.sections[1];
  const directors = officeProfiles(page.sections.slice(3, 5), language);
  const designers = officeProfiles([page.sections[6]], language);
  const expertiseBlocks = page.sections[7].blocks.map((block) => ({ ...block, text: cleanText(block.text) }));
  const methodHeadingIndex = expertiseBlocks.findIndex(
    (block, index) => index > 0 && block.type === "heading",
  );
  const expertiseHeading = expertiseBlocks.find((block) => block.type === "heading")?.text;
  const expertiseIntro = expertiseBlocks.find((block) => block.type !== "heading")?.text;
  const specialists = expertiseBlocks
    .slice(2, methodHeadingIndex)
    .filter((block) => block.type !== "heading")
    .map((block) => {
      const [name, role] = block.text.split("|").map((part) => part.trim());
      return { name, role };
    });
  const methodHeading = expertiseBlocks[methodHeadingIndex]?.text;
  const methodText = expertiseBlocks.slice(methodHeadingIndex + 1).find((block) => block.type !== "heading")?.text;
  const copy =
    language === "en"
      ? {
          directors: "Directors",
          directorRole: "Director · Architect",
          designers: "Architects and interior designers",
          designerRole: "Architect · Interior design",
        }
      : {
          directors: "Directores",
          directorRole: "Director · Arquitecto",
          designers: "Arquitectos y diseñadores de interiores",
          designerRole: "Arquitectura · Diseño de interiores",
        };
  useDocumentTitle(labels.studio, language);
  return (
    <main className="office-page">
      <PageHero
        title={cleanText(heroSection.blocks.find((block) => block.type === "heading")?.text || labels.officeTitle)}
        intro={cleanText(heroSection.blocks.find((block) => block.type !== "heading")?.text || primaryText(page))}
        image={localeContent[language].projects[20]?.gallery?.[0]}
      />

      <section className="office-introduction">
        <MotionHeading
          as="h2"
          text={cleanText(teamIntroduction.blocks.find((block) => block.type === "heading")?.text || "")}
        />
        <Reveal>
          <p>{cleanText(teamIntroduction.blocks.find((block) => block.type !== "heading")?.text || "")}</p>
        </Reveal>
      </section>

      <section className="office-team">
        <MotionHeading as="h2" text={copy.directors} />
        <div className="office-directors">
          {directors.map((person, index) => (
            <m.article
              className="office-person"
              key={person.name}
              variants={revealVariants}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              custom={index * 0.06}
            >
              <figure className="office-person__portrait">
                <img src={person.image.src} alt={person.name} loading="lazy" />
              </figure>
              <div className="office-person__content">
                <h3>{person.name}</h3>
                <p className="office-person__role">{copy.directorRole}</p>
                <p>{person.biography}</p>
              </div>
            </m.article>
          ))}
        </div>
      </section>

      <section className="office-designers">
        <MotionHeading as="h2" text={copy.designers} />
        <div className="office-designers__grid">
          {designers.map((person, index) => (
            <m.article
              className="office-person office-person--secondary"
              key={person.name}
              variants={revealVariants}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              custom={index * 0.08}
            >
              <figure className="office-person__portrait">
                <img src={person.image.src} alt={person.name} loading="lazy" />
              </figure>
              <div className="office-person__content">
                <h3>{person.name}</h3>
                <p className="office-person__role">{copy.designerRole}</p>
              </div>
            </m.article>
          ))}
        </div>
      </section>

      <section className="office-expertise">
        <div>
          <MotionHeading as="h2" text={expertiseHeading} />
          <Reveal>
            <p>{expertiseIntro}</p>
          </Reveal>
        </div>
        <div className="office-roster">
          {specialists.map((person, index) => (
            <m.div
              key={person.name}
              variants={revealVariants}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              custom={index * 0.035}
            >
              <span>{person.name}</span>
              <span>{person.role}</span>
            </m.div>
          ))}
        </div>
      </section>

      <m.section
        className="office-method"
        variants={revealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT_ONCE}
      >
        <h2>{methodHeading}</h2>
        <p>{methodText}</p>
      </m.section>
    </main>
  );
}

function ContactPage({ language }) {
  const labels = ui[language];
  useDocumentTitle(labels.contact, language);
  return (
    <main>
      <section className="contact-hero">
        <MotionHeading text={labels.contactTitle} immediate delay={0.08} />
        <m.a
          href="mailto:hola@poaestudio.com"
          variants={revealVariants}
          custom={0.3}
          initial="hidden"
          animate="visible"
        >
          {labels.mail}: hola@poaestudio.com
        </m.a>
      </section>
      <section className="contact-locations">
        {[
          ["Córdoba", "Av. del Gran Capitán, 20, 2ºB", "14001 Córdoba", "+34 665 33 73 63"],
          ["Madrid", "C. de Manzanares, 4", "28005 Madrid", "+34 744 66 90 88"],
          ["Marbella", "Calle Antonio Mingote, 8", "29670 Marbella, Málaga", "+34 633 70 03 00"],
        ].map(([city, address, postcode, phone], index) => (
          <m.article
            key={city}
            custom={index * 0.07}
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
          >
            <h2>{city}</h2>
            <p>{address}</p>
            <p>{postcode}</p>
            <a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>
          </m.article>
        ))}
      </section>
    </main>
  );
}

function GenericPage({ language, forcedSlug }) {
  const params = useParams();
  const slug = forcedSlug || params.slug;
  const page = pageMaps[language][slug];
  useDocumentTitle(page?.title, language);
  if (!page) return <NotFound language={language} />;
  const isServicePage = serviceConfig[language].some((service) => service.slug === slug);
  const legalSlugs = [
    "privacy-policy",
    "legal-notice",
    "cookie-policy",
    "politica-de-privacidad",
    "aviso-legal",
    "politica-de-cookies",
  ];
  const sourceTitle =
    page.sections.flatMap((section) => section.blocks).find((block) => block.type === "heading" && !isNoise(block.text))
      ?.text || page.title;
  const conciseTitles = {
    ...Object.fromEntries(serviceConfig[language].map((service) => [service.slug, service.title])),
    "architecture-studio-in-cordoba": "Architecture studio in Córdoba",
    "architecture-firm-madrid": "Architecture firm in Madrid",
    "architecture-firm-marbella": "Architecture firm in Marbella",
    "estudio-de-arquitectura-en-cordoba": "Estudio de arquitectura en Córdoba",
    "estudio-de-arquitectura-en-madrid": "Estudio de arquitectura en Madrid",
    "estudio-de-arquitectura-en-marbella": "Estudio de arquitectura en Marbella",
  };
  return (
    <main className={legalSlugs.includes(slug) ? "legal-page" : isServicePage ? "service-page" : ""}>
      <PageHero
        title={conciseTitles[slug] || sourceTitle}
        intro={legalSlugs.includes(slug) ? "" : primaryText(page)}
        image={legalSlugs.includes(slug) ? null : page.hero || page.gallery[0]}
        serviceMode={isServicePage}
      />
      <EditorialSections
        item={page}
        skip={legalSlugs.includes(slug) ? 0 : 1}
        serviceMode={isServicePage}
      />
    </main>
  );
}

function JournalPage({ language }) {
  const labels = ui[language];
  useDocumentTitle(labels.journal, language);
  return (
    <main>
      <PageHero title={labels.journalTitle} intro={labels.journalArchive} />
      <section className="journal-grid">
        {content.posts.map((post) => (
          <m.article
            className="journal-card-shell"
            key={post.id}
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_ONCE}
          >
            <Link to={journalPath(language, post.slug)} className="journal-card">
              {imageFor(post) && <img src={imageFor(post)} alt={post.title} loading="lazy" />}
              <div>
                <h2>{cleanText(post.title)}</h2>
                <p>{cleanText(post.excerpt || primaryText(post))}</p>
                <span>{labels.articleAction}</span>
              </div>
            </Link>
          </m.article>
        ))}
      </section>
    </main>
  );
}

function ArticleSections({ item }) {
  return (
    <div className="article-content">
      {item.sections.map((section, sectionIndex) => {
        const blocks = section.blocks
          .map((block) => ({ ...block, text: cleanText(block.text) }))
          .filter((block) => block.text && !isNoise(block.text));
        const images = section.images
          .filter(isDisplayableImage)
          .filter((image) => image.src !== item.hero?.src);
        if (!blocks.length && !images.length) return null;

        return (
          <section className="article-section" key={`${item.id}-${sectionIndex}`}>
            {blocks.length > 0 && (
              <div className="article-prose">
                {blocks.map((block, index) => {
                  if (block.type === "heading") {
                    const Element = block.level && block.level >= 3 ? "h3" : "h2";
                    return <Element key={`${block.text}-${index}`}>{block.text}</Element>;
                  }
                  if (block.type === "quote") return <blockquote key={`${block.text}-${index}`}>{block.text}</blockquote>;
                  return (
                    <p className={block.type === "list" ? "list-line" : ""} key={`${block.text}-${index}`}>
                      {block.text}
                    </p>
                  );
                })}
              </div>
            )}
            {images.length > 0 && (
              <div className="article-media-grid">
                {images.map((image, index) => (
                  <AnimatedImage image={image} key={`${image.src}-${index}`} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function articleIntroduction(post) {
  const firstTextBlock = post.sections
    ?.flatMap((section) => section.blocks)
    .find((block) => block.type === "text" && !isNoise(block.text));
  const lead = cleanText(firstTextBlock?.text || post.excerpt || "");
  const sentences = lead.match(/[^.!?]+[.!?]+/g);
  if (sentences?.length) return sentences.slice(0, 3).join(" ").trim();
  if (lead.length <= 260) return lead;
  return `${lead.slice(0, 260).replace(/\s+\S*$/, "")}…`;
}

function ArticlePage({ language }) {
  const { slug } = useParams();
  const post = postBySlug[slug];
  useDocumentTitle(post?.title, language);
  if (!post) return <NotFound language={language} />;
  const articleIntro = articleIntroduction(post);
  return (
    <main className="article-page">
      <PageHero title={cleanText(post.title)} intro={articleIntro} image={post.hero || post.gallery[0]} />
      <ArticleSections item={post} />
    </main>
  );
}

function SpanishResolver() {
  const { slug } = useParams();
  if (pageMaps.es[slug]) return <GenericPage language="es" forcedSlug={slug} />;
  if (postBySlug[slug]) return <ArticlePage language="es" />;
  return <NotFound language="es" />;
}

function NotFound({ language = "en" }) {
  const labels = ui[language];
  useDocumentTitle("404", language);
  return (
    <main className="not-found">
      <MotionHeading text={labels.notFound} immediate />
      <Link className="primary-action" to={homePath(language)}>
        {labels.returnHome}
      </Link>
    </main>
  );
}

function App() {
  const location = useLocation();

  return (
    <MotionProvider>
      <div className="site-shell">
        <ScrollManager />
        <Header />
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            className="route-stage"
            key={location.pathname}
            variants={routeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onAnimationStart={(definition) => {
              if (definition !== "visible" || pendingLanguageScrollY === null) return;
              const scrollY = pendingLanguageScrollY;
              pendingLanguageScrollY = null;
              window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
              window.requestAnimationFrame(() => {
                window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
              });
            }}
          >
            <Routes location={location}>
              <Route path="/" element={<HomePage language="es" />} />
              <Route path="/en/" element={<HomePage language="en" />} />
              <Route path="/proyectos/" element={<ProjectsPage language="es" />} />
              <Route path="/en/projects/" element={<ProjectsPage language="en" />} />
              <Route path="/portfolio/:slug/" element={<ProjectPage language="es" />} />
              <Route path="/en/portfolio/:slug/" element={<ProjectPage language="en" />} />
              <Route path="/estudio/" element={<OfficePage language="es" />} />
              <Route path="/en/office/" element={<OfficePage language="en" />} />
              <Route path="/contacto/" element={<ContactPage language="es" />} />
              <Route path="/en/contact/" element={<ContactPage language="en" />} />
              <Route path="/journal/" element={<JournalPage language="es" />} />
              <Route path="/en/journal/" element={<JournalPage language="en" />} />
              <Route path="/journal/:slug/" element={<ArticlePage language="es" />} />
              <Route path="/en/journal/:slug/" element={<ArticlePage language="en" />} />
              <Route path="/en/:slug/" element={<GenericPage language="en" />} />
              <Route path="/:slug/" element={<SpanishResolver />} />
              <Route path="*" element={<NotFound language="en" />} />
            </Routes>
          </m.div>
        </AnimatePresence>
        <Footer />
      </div>
    </MotionProvider>
  );
}

export default App;
