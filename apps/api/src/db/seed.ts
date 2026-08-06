import { hash } from '@node-rs/argon2';
import { and, eq, isNull, notInArray } from 'drizzle-orm';
import { loadConfig, type AppConfig } from '../config/configuration';
import { createDb } from './client';
import { courseModules, courses, instructors, lessons, specialties } from './schema/catalog';
import { enrollments } from './schema/enrollment';
import { users } from './schema/identity';
import { leads } from './schema/crm';
import { channelRules, channels } from './schema/channels';
import type { ChannelGroup, CourseLevel } from './schema/enums';

/** Especialidades/áreas do catálogo Vethis. */
const SPECIALTIES = [
  { slug: 'medicina-felina', name: 'Medicina Felina' },
  { slug: 'emergencia-uti', name: 'Emergência & UTI' },
  { slug: 'farmacologia', name: 'Farmacologia Clínica' },
  { slug: 'patologia', name: 'Patologia' },
  { slug: 'nefrologia', name: 'Nefrologia' },
  { slug: 'hematologia', name: 'Hematologia' },
  { slug: 'gestao-rt', name: 'Gestão & Responsabilidade Técnica' },
  { slug: 'cardiologia', name: 'Cardiologia' },
  { slug: 'cirurgia', name: 'Cirurgia' },
  { slug: 'clinica-medica', name: 'Clínica Médica' },
  { slug: 'dermatologia', name: 'Dermatologia' },
  { slug: 'anestesiologia', name: 'Anestesiologia' },
];

/** Corpo docente — mesmos nomes/fotos da seção "Instrutores" do site. */
interface SeedInstructor {
  slug: string;
  name: string;
  bio: string;
  photo?: string;
}
const INSTRUCTORS: SeedInstructor[] = [
  {
    slug: 'coordenacao-clinica-felinos',
    name: 'Dra. Patrícia Bastos',
    bio: "Coordenadora acadêmica da Pós-graduação em Clínica Médica de Felinos. Médica-veterinária graduada pela Universidade Paulista (1995), com especialização em Medicina Felina (Anclivepa-SP), Ultrassonografia (Echoa) e Geriatria e Neonatologia (Unyleya), além de diplomas internacionais em Medicina Felina e em Nefrologia e Urologia (2025). Atua na clínica desde 1998, é veterinária Cat Friendly (AAFP) e palestrante em universidades nacionais e internacionais. Idealizadora e responsável pelo conteúdo do Cat's Academy Pro (certificado pelo MEC), leva ao curso o ensino baseado em casos reais e no raciocínio clínico aplicado à rotina do gato.",
    photo: 'patricia.jpg',
  },
  {
    slug: 'dra-roberta-ruiz',
    name: 'Dra. Roberta Ruiz',
    bio: 'Especialista em Patologia e Medicina Veterinária Legal, mestre em Biociências e doutoranda em Patologia pela USP. Preside a Comissão de Responsabilidade Técnica do CRMV-SP.',
    photo: 'roberta.jpg',
  },
  {
    slug: 'dr-ricardo-mendes',
    name: 'Dr. Ricardo Mendes',
    bio: 'Diretor clínico e pesquisador em clínica médica de pequenos animais.',
    photo: 'ricardo-mendes.webp',
  },
  {
    slug: 'dra-ana-faria',
    name: 'Dra. Ana B. Faria',
    bio: 'Especialista em clínica de felinos e gestão da rotina veterinária.',
    photo: 'ana-faria.webp',
  },
  {
    slug: 'dr-carlos-nunes',
    name: 'Dr. Carlos Nunes',
    bio: 'Farmacologista clínico e referência em terapêutica de pequenos animais.',
    photo: 'carlos-nunes.webp',
  },
  {
    slug: 'dra-lucia-prado',
    name: 'Dra. Lúcia Prado',
    bio: 'Intensivista e docente de emergência e medicina transfusional.',
    photo: 'lucia-prado.webp',
  },
];

interface SeedLesson {
  title: string;
  min: number;
  free?: boolean;
}
interface SeedModule {
  title: string;
  lessons: SeedLesson[];
}
interface SeedFaqItem {
  question: string;
  answer: string;
}
interface SeedCourse {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  priceCents: number;
  level: CourseLevel;
  specialty: string;
  instructor: string;
  /** Destaque: maior aparece antes na home e no catálogo. Padrão 0. */
  featuredRank?: number;
  /** Vitrine "Em breve": sem preço nem checkout. Padrão false. */
  comingSoon?: boolean;
  cover?: string;
  workloadHours?: number;
  learningObjectives?: string[];
  faq?: SeedFaqItem[];
  modules: SeedModule[];
}

/** Catálogo Vethis — cursos publicados com módulos e aulas. */
const COURSES: SeedCourse[] = [
  {
    slug: 'pos-clinica-medica-felinos',
    title: 'Pós-graduação em Clínica Médica de Felinos',
    subtitle:
      'Atenda gatos com mais segurança, raciocínio clínico e confiança, do ambulatório à emergência.',
    description:
      'Pós-graduação 100% online e aplicada à rotina, com 360 horas e certificação. O gato não é um cão pequeno: aqui você desenvolve o raciocínio clínico orientado por problemas e domina as principais afecções da espécie: nefrologia e urologia, doenças infecciosas (PIF, FeLV, FIV, esporotricose), cardiologia, neurologia, gastroenterologia e hepatologia, endocrinologia, oncologia, dermatologia, oftalmologia, emergência, anestesia e analgesia, comportamento, cirurgia e odontologia felina. São 80 horas de videoaulas somadas a leituras dirigidas, quatro casos clínicos por módulo (52 no total), fóruns, quizzes e projeto aplicado.',
    priceCents: 693600,
    level: 'avancado',
    specialty: 'medicina-felina',
    instructor: 'coordenacao-clinica-felinos',
    featuredRank: 100,
    cover: '/cursos/pos-clinica-medica-felinos.png',
    workloadHours: 360,
    learningObjectives: [
      'Construir o raciocínio clínico a partir dos sinais apresentados pelo gato.',
      'Interpretar hemograma, bioquímica, urinálise, ultrassonografia, radiografia, AFAST e TFAST com olhar felino.',
      'Estadiar e conduzir pacientes renais de acordo com os critérios IRIS.',
      'Investigar e manejar PIF, FeLV, FIV, esporotricose, micoplasmose, calicivirose e herpesvirose.',
      'Reconhecer cardiomiopatia hipertrófica, interpretar NT-proBNP e abordar o tromboembolismo aórtico.',
      'Diferenciar doença inflamatória intestinal de linfoma e conduzir lipidose, pancreatite e tríade felina.',
      'Atualizar-se sobre velagliflozina, monitoramento contínuo da glicose e remissão diabética.',
      'Tomar decisões em emergência: obstrução uretral, dispneia, choque e trauma.',
      'Planejar anestesia e analgesia para gatos braquicefálicos, cardiopatas e renais.',
      'Compreender comportamento, tensão intergatos, enriquecimento ambiental e estratégias para reduzir o estresse.',
      'Reconhecer quando indicar endoscopia, laparotomia, procedimentos cirúrgicos e abordagens odontológicas.',
    ],
    faq: [
      {
        question: 'Para quem é esta pós-graduação?',
        answer:
          'Para médicos-veterinários que atendem gatos na rotina clínica, atuam em hospitais, internação, emergência ou terapia intensiva, ou desejam construir uma atuação especializada em Medicina Felina.',
      },
      {
        question: 'Qual a duração e a carga horária?',
        answer:
          'A formação tem duração de até 12 meses e 360 horas no total: 80 horas de videoaulas gravadas somadas a leituras dirigidas, casos clínicos, exercícios, fóruns, atividades avaliativas e projeto final.',
      },
      {
        question: 'Como funciona o pagamento?',
        answer:
          'Investimento de R$ 6.936,00. Você pode parcelar em até 24x de R$ 289,00 no boleto, pagar no Pix à vista com 5% de desconto (R$ 6.589,20) ou no cartão com condição especial.',
      },
      {
        question: 'Como funciona a metodologia?',
        answer:
          'Modalidade EaD, com os módulos liberados progressivamente no ambiente virtual. Cada módulo reúne videoaulas, material de apoio (artigos, consensos e guidelines), quatro casos clínicos, quiz e exercícios de interpretação de exames, estudo no seu ritmo, de qualquer dispositivo.',
      },
      {
        question: 'Como é a avaliação?',
        answer:
          'A avaliação é contínua e considera os quizzes de cada módulo, a resolução dos casos clínicos, os exercícios, a participação nos fóruns e a atividade final aplicada.',
      },
      {
        question: 'O curso é certificado e reconhecido?',
        answer:
          'Sim. Curso certificado e reconhecido pelo MEC, ofertado em parceria com a Rede de Ensino Doctum. Ao concluir, você recebe o certificado de pós-graduação de 360 horas, disponível na área do aluno.',
      },
    ],
    modules: [
      {
        title: 'Módulo 1: Bases da Medicina Felina',
        lessons: [
          {
            title: 'Particularidades fisiológicas e farmacológicas do felino',
            min: 50,
            free: true,
          },
          { title: 'Metabolismo hepático idiossincrático', min: 50 },
          { title: 'Toxicidade de fármacos', min: 50 },
          { title: 'Resposta imune diferenciada', min: 50 },
          { title: 'Semiologia orientada por problemas', min: 50 },
          { title: 'Construção do raciocínio clínico a partir dos sinais do paciente', min: 50 },
        ],
      },
      {
        title: 'Módulo 2: Exames Laboratoriais e Diagnóstico por Imagem',
        lessons: [
          { title: 'Interpretação de exames laboratoriais', min: 39 },
          { title: 'Hematologia felina', min: 39 },
          { title: 'Bioquímica sérica', min: 38 },
          { title: 'Urinálise com enfoque nas particularidades dos felinos', min: 38 },
          { title: 'Alterações decorrentes de estresse', min: 38 },
          { title: 'Hemólise e interferências pré-analíticas', min: 38 },
          { title: 'Particularidades dos intervalos de referência', min: 38 },
          { title: 'Ultrassonografia', min: 38 },
          { title: 'AFAST', min: 38 },
          { title: 'TFAST', min: 38 },
          { title: 'Radiografia', min: 38 },
        ],
      },
      {
        title: 'Módulo 3: Nefrologia e Urologia',
        lessons: [
          { title: 'Doença renal crônica', min: 54 },
          { title: 'Estadiamento IRIS', min: 54 },
          { title: 'Monitoramento do paciente renal', min: 54 },
          { title: 'Manejo nutricional', min: 54 },
          { title: 'Novas terapias', min: 54 },
          { title: 'Doença do trato urinário inferior dos felinos', min: 54 },
          { title: 'Cistite idiopática', min: 54 },
          { title: 'Urolitíase', min: 54 },
          { title: 'Insuficiência ou injúria renal aguda', min: 54 },
          { title: 'Ureterolitíase', min: 54 },
        ],
      },
      {
        title: 'Módulo 4: Doenças Infecciosas',
        lessons: [
          { title: 'Peritonite infecciosa felina (PIF)', min: 45 },
          { title: 'Diagnóstico da PIF', min: 45 },
          { title: 'PCR', min: 45 },
          { title: 'Teste de Rivalta', min: 45 },
          { title: 'Citologia e avaliação de efusões', min: 45 },
          { title: 'Protocolo terapêutico com GS-441524', min: 45 },
          { title: 'FeLV', min: 45 },
          { title: 'FIV', min: 45 },
          { title: 'Esporotricose', min: 45 },
          { title: 'Micoplasmose hemotrópica', min: 45 },
          { title: 'Calicivirose', min: 45 },
          { title: 'Herpesvírus felino', min: 45 },
        ],
      },
      {
        title: 'Módulo 5: Cardiologia e Neurologia',
        lessons: [
          { title: 'Convulsões em gatos', min: 22 },
          { title: 'Particularidades das manifestações convulsivas felinas', min: 22 },
          { title: 'Síndrome vestibular felina', min: 22 },
          { title: 'Meningoencefalites infecciosas', min: 22 },
          { title: 'Toxoplasmose neurológica', min: 22 },
          { title: 'Manifestações neurológicas da PIF', min: 22 },
          { title: 'Dor neuropática', min: 21 },
          { title: 'Manejo prático da dor neuropática', min: 21 },
          { title: 'Síndrome de hiperestesia felina', min: 21 },
          { title: 'Cardiomiopatia hipertrófica', min: 21 },
          { title: 'Biomarcadores cardíacos (NT-proBNP)', min: 21 },
          { title: 'Ecocardiografia', min: 21 },
          { title: 'Eletrocardiografia', min: 21 },
          { title: 'Tromboembolismo aórtico', min: 21 },
        ],
      },
      {
        title: 'Módulo 6: Gastroenterologia e Hepatologia',
        lessons: [
          { title: 'Doença inflamatória intestinal', min: 68 },
          { title: 'Diferenciação entre doença inflamatória intestinal e linfoma', min: 68 },
          { title: 'Lipidose hepática e manejo nutricional', min: 68 },
          { title: 'Alimentação por sonda', min: 68 },
          { title: 'Pancreatite felina', min: 67 },
          { title: 'Dificuldades e limitações diagnósticas da pancreatite', min: 67 },
          { title: 'Abordagem ao vômito crônico', min: 67 },
          { title: 'Tríade felina', min: 67 },
        ],
      },
      {
        title: 'Módulo 7: Endocrinologia',
        lessons: [
          { title: 'Diabetes mellitus', min: 40 },
          { title: 'Insulinoterapia', min: 40 },
          { title: 'Monitoramento contínuo da glicose', min: 40 },
          { title: 'Remissão diabética', min: 40 },
          { title: 'Uso do Senvelgo® (velagliflozina)', min: 40 },
          { title: 'Critérios para seleção e acompanhamento de pacientes', min: 40 },
          { title: 'Hipertireoidismo', min: 40 },
          { title: 'Tratamento com iodo radioativo', min: 40 },
          { title: 'Manejo clínico do hipertireoidismo', min: 40 },
        ],
      },
      {
        title: 'Módulo 8: Oncologia',
        lessons: [
          { title: 'Linfoma alimentar', min: 30 },
          { title: 'Linfoma mediastinal', min: 30 },
          { title: 'Linfoma extranodal', min: 30 },
          { title: 'Carcinoma de células escamosas', min: 30 },
          { title: 'Mastocitoma', min: 30 },
          { title: 'Adenocarcinoma mamário', min: 30 },
          { title: 'Quimioterapia em felinos', min: 30 },
          { title: 'Efeitos colaterais', min: 30 },
          { title: 'Tratamento de suporte', min: 30 },
          { title: 'Cuidados paliativos', min: 30 },
          { title: 'Eutanásia', min: 30 },
          { title: 'Diretrizes AAFP/IAAHPC 2023', min: 30 },
        ],
      },
      {
        title: 'Módulo 9: Dermatologia e Oftalmologia',
        lessons: [
          { title: 'Síndrome atópica felina', min: 50 },
          { title: 'Complexo granuloma eosinofílico', min: 50 },
          { title: 'Ceratite eosinofílica', min: 50 },
          { title: 'Uveíte', min: 50 },
          { title: 'Glaucoma', min: 50 },
          { title: 'Diagnóstico diferencial das doenças oftalmológicas', min: 50 },
        ],
      },
      {
        title: 'Módulo 10: Emergência e Intensivismo',
        lessons: [
          { title: 'Suporte hemodinâmico', min: 60 },
          { title: 'Obstrução uretral e desobstrução segura', min: 60 },
          { title: 'Dispneia', min: 60 },
          { title: 'Toracocentese', min: 60 },
          { title: 'Oxigenioterapia', min: 60 },
          { title: 'Trauma', min: 60 },
          { title: 'Choque', min: 60 },
        ],
      },
      {
        title: 'Módulo 11: Anestesia e Controle da Dor',
        lessons: [
          { title: 'Drogas seguras em felinos', min: 30 },
          { title: 'Drogas contraindicadas ou que exigem cautela', min: 30 },
          { title: 'Protocolos para gatos braquicefálicos', min: 30 },
          { title: 'Protocolos para gatos cardiopatas', min: 30 },
          { title: 'Protocolos para gatos renais', min: 30 },
          { title: 'Analgesia multimodal', min: 30 },
          { title: 'Pregabalina (Bonqat®)', min: 30 },
          { title: 'Redução do estresse no transporte e na consulta', min: 30 },
        ],
      },
      {
        title: 'Módulo 12: Comportamento e Bem-estar',
        lessons: [
          { title: 'Tensão entre gatos', min: 36 },
          { title: 'Identificação de conflitos entre gatos', min: 36 },
          { title: 'Manejo da tensão intergatos', min: 36 },
          { title: 'Enriquecimento ambiental', min: 36 },
          { title: 'Introdução de novos gatos', min: 36 },
        ],
      },
      {
        title: 'Módulo 13: Cirurgia e Odontologia',
        lessons: [
          { title: 'Técnica cirúrgica com foco em felinos', min: 30 },
          { title: 'Ovariohisterectomia', min: 30 },
          { title: 'Orquiectomia', min: 30 },
          { title: 'Endoscopia', min: 30 },
          { title: 'Comparação entre endoscopia e laparotomia', min: 30 },
          { title: 'Odontologia felina', min: 30 },
          { title: 'Reabsorção dentária felina (FORL)', min: 30 },
          { title: 'Estomatite crônica', min: 30 },
          { title: 'Extrações dentárias', min: 30 },
          { title: 'Neoplasias da cavidade oral', min: 30 },
        ],
      },
    ],
  },
  {
    slug: 'pos-medicina-felina',
    cover: '/cursos/pos-medicina-felina.png',
    title: 'Pós-graduação em Medicina Felina',
    subtitle: 'O gato como paciente único, do ambulatório à internação.',
    description:
      'Formação completa em medicina felina: comportamento, particularidades fisiológicas, principais afecções e manejo hospitalar do paciente gato.',
    priceCents: 249700,
    level: 'avancado',
    specialty: 'medicina-felina',
    instructor: 'dra-ana-faria',
    comingSoon: true,
    modules: [
      {
        title: 'O paciente felino',
        lessons: [
          { title: 'Comportamento e manejo de baixo estresse', min: 16, free: true },
          { title: 'Particularidades fisiológicas do gato', min: 20 },
        ],
      },
      {
        title: 'Afecções prevalentes',
        lessons: [
          { title: 'Doença renal crônica felina', min: 24 },
          { title: 'Trato urinário inferior (FLUTD)', min: 18 },
        ],
      },
    ],
  },
  {
    slug: 'pos-emergencia-pequenos-animais',
    cover: '/cursos/pos-emergencia-pequenos-animais.png',
    title: 'Pós-graduação em Emergência Médica de Pequenos Animais',
    subtitle: 'Do atendimento inicial à terapia intensiva.',
    description:
      'Programa de emergência e cuidados intensivos: triagem, ressuscitação, monitoração e condutas no paciente crítico.',
    priceCents: 259700,
    level: 'avancado',
    specialty: 'emergencia-uti',
    instructor: 'dra-lucia-prado',
    comingSoon: true,
    modules: [
      {
        title: 'Atendimento inicial',
        lessons: [
          { title: 'Triagem e ABCs da emergência', min: 15, free: true },
          { title: 'Ressuscitação e fluidoterapia', min: 22 },
        ],
      },
      {
        title: 'Terapia intensiva',
        lessons: [
          { title: 'Choque: reconhecimento e manejo', min: 20 },
          { title: 'Monitoração do paciente crítico', min: 21 },
        ],
      },
    ],
  },
  {
    slug: 'farmacologia-clinica',
    cover: '/cursos/farmacologia-clinica.png',
    title: 'Curso de Farmacologia Clínica de Pequenos Animais',
    subtitle: 'Prescrição segura e racional na rotina.',
    description:
      'Bases da farmacologia aplicada à clínica: farmacocinética, principais classes, interações e prescrição racional.',
    priceCents: 119700,
    level: 'intermediario',
    specialty: 'farmacologia',
    instructor: 'dr-carlos-nunes',
    comingSoon: true,
    modules: [
      {
        title: 'Fundamentos',
        lessons: [
          { title: 'Farmacocinética e farmacodinâmica', min: 14, free: true },
          { title: 'Cálculo de doses e vias de administração', min: 16 },
        ],
      },
      {
        title: 'Terapêutica aplicada',
        lessons: [
          { title: 'Antimicrobianos: uso racional', min: 20 },
          { title: 'Analgesia e anti-inflamatórios', min: 18 },
        ],
      },
    ],
  },
  {
    slug: 'patologia-geral-forense',
    cover: '/cursos/patologia-geral-forense.png',
    title: 'Curso de Patologia Geral e Forense',
    subtitle: 'Do processo patológico à perícia veterinária.',
    description:
      'Mecanismos gerais de lesão e adaptação celular e introdução à patologia forense e à necropsia pericial.',
    priceCents: 109700,
    level: 'intermediario',
    specialty: 'patologia',
    instructor: 'dr-ricardo-mendes',
    comingSoon: true,
    modules: [
      {
        title: 'Patologia geral',
        lessons: [
          { title: 'Lesão e morte celular', min: 15, free: true },
          { title: 'Inflamação e reparo', min: 18 },
        ],
      },
      {
        title: 'Patologia forense',
        lessons: [
          { title: 'Necropsia pericial e coleta de amostras', min: 22 },
          { title: 'Estimativa de causa e cronotanatognose', min: 19 },
        ],
      },
    ],
  },
  {
    slug: 'pos-nefrologia',
    cover: '/cursos/pos-nefrologia.png',
    title: 'Pós-graduação em Nefrologia de Pequenos Animais',
    subtitle: 'Do diagnóstico precoce à terapia renal substitutiva.',
    description:
      'Formação em nefrologia e urologia: injúria renal aguda e crônica, proteinúria, distúrbios hidroeletrolíticos e diálise.',
    priceCents: 239700,
    level: 'avancado',
    specialty: 'nefrologia',
    instructor: 'dr-ricardo-mendes',
    comingSoon: true,
    modules: [
      {
        title: 'Avaliação renal',
        lessons: [
          { title: 'Marcadores e estadiamento IRIS', min: 16, free: true },
          { title: 'Proteinúria e hipertensão', min: 20 },
        ],
      },
      {
        title: 'Manejo',
        lessons: [
          { title: 'Injúria renal aguda', min: 22 },
          { title: 'Terapia renal substitutiva', min: 24 },
        ],
      },
    ],
  },
  {
    slug: 'hematologia-transfusional',
    cover: '/cursos/hematologia-transfusional.png',
    title: 'Curso de Hematologia e Medicina Transfusional',
    subtitle: 'Do hemograma à bolsa de sangue.',
    description:
      'Interpretação do hemograma, principais anemias e coagulopatias, e prática segura de medicina transfusional.',
    priceCents: 99700,
    level: 'intermediario',
    specialty: 'hematologia',
    instructor: 'dra-lucia-prado',
    comingSoon: true,
    modules: [
      {
        title: 'Hematologia clínica',
        lessons: [
          { title: 'Interpretação do hemograma', min: 15, free: true },
          { title: 'Anemias: abordagem diagnóstica', min: 19 },
        ],
      },
      {
        title: 'Medicina transfusional',
        lessons: [
          { title: 'Tipagem, provas de compatibilidade e doadores', min: 21 },
          { title: 'Transfusão: indicações e reações', min: 18 },
        ],
      },
    ],
  },
  {
    slug: 'responsabilidade-tecnica',
    cover: '/cursos/responsabilidade-tecnica.png',
    title: 'Curso de Responsabilidade Técnica Veterinária',
    subtitle: 'A RT na prática, sem insegurança.',
    description:
      'O papel do responsável técnico: legislação, documentação, boas práticas e gestão da conformidade em estabelecimentos veterinários.',
    priceCents: 79700,
    level: 'iniciante',
    specialty: 'gestao-rt',
    instructor: 'dra-ana-faria',
    comingSoon: true,
    modules: [
      {
        title: 'Fundamentos da RT',
        lessons: [
          { title: 'Legislação e atribuições do RT', min: 13, free: true },
          { title: 'Documentação e escrituração', min: 15 },
        ],
      },
      {
        title: 'Conformidade na prática',
        lessons: [
          { title: 'Boas práticas e biossegurança', min: 17 },
          { title: 'Fiscalização e gestão de não conformidades', min: 16 },
        ],
      },
    ],
  },
];

/** Seed de desenvolvimento idempotente (ON CONFLICT DO NOTHING por slug). */
async function main(): Promise<void> {
  const config: AppConfig = loadConfig();
  const { db, sql } = createDb(config.DATABASE_URL);

  await db
    .insert(specialties)
    .values(SPECIALTIES)
    .onConflictDoNothing({ target: specialties.slug });

  // Instrutores (upsert idempotente): cria e ATUALIZA nome, bio e foto — antes o
  // nome não era atualizado em re-seed (por isso "Patrícia Bastos e Roberta Ruiz"
  // persistia mesmo após a mudança para só a Dra. Patrícia).
  for (const i of INSTRUCTORS) {
    const avatarUrl = i.photo ? `${config.APP_URL}/instrutores/${i.photo}` : null;
    await db
      .insert(instructors)
      .values({ slug: i.slug, name: i.name, bio: i.bio, avatarUrl })
      .onConflictDoUpdate({
        target: instructors.slug,
        set: { name: i.name, bio: i.bio, avatarUrl },
      });
  }

  // Mapas slug → id para especialidades e instrutores.
  const specialtyId = new Map<string, string>();
  for (const s of await db
    .select({ id: specialties.id, slug: specialties.slug })
    .from(specialties)) {
    specialtyId.set(s.slug, s.id);
  }
  const instructorId = new Map<string, string>();
  for (const i of await db
    .select({ id: instructors.id, slug: instructors.slug })
    .from(instructors)) {
    instructorId.set(i.slug, i.id);
  }

  // Cursos + módulos + aulas.
  for (const c of COURSES) {
    // Campos escalares do curso — idempotentes: atualiza se já existir (para que
    // mudanças de preço, capa, destaque, ementa etc. sejam aplicadas em re-seed).
    const scalars = {
      title: c.title,
      subtitle: c.subtitle,
      description: c.description,
      priceCents: c.priceCents,
      level: c.level,
      status: 'published' as const,
      featuredRank: c.featuredRank ?? 0,
      comingSoon: c.comingSoon ?? false,
      specialtyId: specialtyId.get(c.specialty) ?? null,
      instructorId: instructorId.get(c.instructor) ?? null,
      coverUrl: c.cover ? `${config.APP_URL}${c.cover}` : null,
      workloadHours: c.workloadHours ?? null,
      learningObjectives: c.learningObjectives ?? [],
      faq: c.faq ?? [],
    };
    const [course] = await db
      .insert(courses)
      .values({ slug: c.slug, publishedAt: new Date(), ...scalars })
      .onConflictDoUpdate({ target: courses.slug, set: scalars })
      .returning({ id: courses.id });
    if (!course) continue;

    // Só popula módulos/aulas quando o curso ainda não tem nenhum (evita duplicar
    // em re-seed — o upsert acima sempre retorna a linha, criada ou atualizada).
    const [hasModule] = await db
      .select({ id: courseModules.id })
      .from(courseModules)
      .where(eq(courseModules.courseId, course.id))
      .limit(1);
    if (hasModule) continue;
    let mPos = 0;
    for (const m of c.modules) {
      mPos += 1;
      const [mod] = await db
        .insert(courseModules)
        .values({ courseId: course.id, title: m.title, position: mPos })
        .returning({ id: courseModules.id });
      if (!mod) continue;
      let lPos = 0;
      for (const l of m.lessons) {
        lPos += 1;
        await db.insert(lessons).values({
          moduleId: mod.id,
          title: l.title,
          durationSeconds: l.min * 60,
          position: lPos,
          isFree: l.free ?? false,
        });
      }
    }
  }
  console.log(`Cursos: ${COURSES.length} definidos (idempotente).`);

  // Poda: em pré-lançamento o seed é a FONTE DE VERDADE do catálogo. Todo curso
  // publicado fora do seed é legado/duplicata (ex.: Farmacologia repetida com
  // preço) → soft-delete. Reversível (deleted_at); o catálogo já filtra por ele.
  // Felinos e os demais do seed são preservados (estão em seedSlugs).
  // OBS: mantenha SEED_ON_START=false após o lançamento para não podar cursos
  // criados pelo backoffice.
  const seedSlugs = COURSES.map((c) => c.slug);
  const pruned = await db
    .update(courses)
    .set({ deletedAt: new Date() })
    .where(and(notInArray(courses.slug, seedSlugs), isNull(courses.deletedAt)))
    .returning({ slug: courses.slug });
  if (pruned.length > 0) {
    console.log(`Cursos podados (fora do seed): ${pruned.map((p) => p.slug).join(', ')}`);
  }

  // Aluno demo + matrícula no primeiro curso (para testar a área do aluno).
  const [firstCourse] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.slug, COURSES[0]!.slug))
    .limit(1);

  const passwordHash = await hash('aluno12345');
  const [student] = await db
    .insert(users)
    .values({ email: 'aluno@vethis.dev', passwordHash, name: 'Aluno Demo', role: 'aluno' })
    .onConflictDoNothing({ target: users.email })
    .returning();

  const studentRow =
    student ??
    (await db.select().from(users).where(eq(users.email, 'aluno@vethis.dev')).limit(1))[0];
  if (studentRow && firstCourse) {
    await db
      .insert(enrollments)
      .values({ userId: studentRow.id, courseId: firstCourse.id, status: 'active' })
      .onConflictDoNothing({ target: [enrollments.userId, enrollments.courseId] });
    console.log('Aluno demo: aluno@vethis.dev / aluno12345 (matriculado).');
  }

  // Usuário staff para o backoffice.
  const staffHash = await hash('staff12345');
  await db
    .insert(users)
    .values({
      email: 'staff@vethis.dev',
      passwordHash: staffHash,
      name: 'Equipe Vethis',
      role: 'staff',
    })
    .onConflictDoNothing({ target: users.email });
  console.log('Staff demo: staff@vethis.dev / staff12345.');

  // Leads de exemplo para o CRM.
  await db
    .insert(leads)
    .values([
      { name: 'Clínica PetVida', email: 'contato@petvida.example', stage: 'new' },
      { name: 'Dr. Rafael Costa', email: 'rafael@example.com', stage: 'contacted' },
      { name: 'Hospital Veterinário Sul', email: 'adm@hvsul.example', stage: 'qualified' },
    ])
    .onConflictDoNothing();

  // Canais de aquisição do CRM (template do mapa de fluxo) + regras UTM→canal.
  type SeedChannel = {
    name: string;
    group: ChannelGroup;
    color: string;
    sortOrder: number;
    rules: Array<{ s: string; m: string | null }>;
  };
  const GOLD = '#B58D4F';
  const GREEN = '#3E7D5F';
  const BLUE = '#2B6CB0';
  const SEED_CHANNELS: SeedChannel[] = [
    {
      name: 'Google Ads',
      group: 'pago',
      color: GOLD,
      sortOrder: 1,
      rules: [
        { s: 'google', m: 'cpc' },
        { s: 'google', m: 'paid' },
      ],
    },
    {
      name: 'Meta Ads',
      group: 'pago',
      color: GOLD,
      sortOrder: 2,
      rules: [
        { s: 'facebook', m: 'paid' },
        { s: 'instagram', m: 'paid' },
        { s: 'ig', m: 'paid' },
        { s: 'meta', m: null },
      ],
    },
    {
      name: 'TikTok Ads',
      group: 'pago',
      color: GOLD,
      sortOrder: 3,
      rules: [{ s: 'tiktok', m: null }],
    },
    {
      name: 'LinkedIn',
      group: 'pago',
      color: GOLD,
      sortOrder: 4,
      rules: [{ s: 'linkedin', m: null }],
    },
    {
      name: 'Landing pages',
      group: 'organico',
      color: GREEN,
      sortOrder: 5,
      rules: [{ s: 'landing', m: null }],
    },
    {
      name: 'Blog',
      group: 'organico',
      color: GREEN,
      sortOrder: 6,
      rules: [{ s: 'blog', m: null }],
    },
    {
      name: 'Instagram',
      group: 'organico',
      color: GREEN,
      sortOrder: 7,
      rules: [
        { s: 'instagram', m: 'organic' },
        { s: 'instagram', m: null },
      ],
    },
    {
      name: 'E-mail mkt',
      group: 'organico',
      color: GREEN,
      sortOrder: 8,
      rules: [
        { s: 'newsletter', m: null },
        { s: 'email', m: null },
      ],
    },
    {
      name: 'Quiz vocacional',
      group: 'organico',
      color: GREEN,
      sortOrder: 9,
      rules: [{ s: 'quiz', m: null }],
    },
    {
      name: 'Base própria',
      group: 'base_propria',
      color: BLUE,
      sortOrder: 10,
      rules: [
        { s: 'crm', m: null },
        { s: 'base', m: null },
      ],
    },
    {
      name: 'Upsell',
      group: 'base_propria',
      color: BLUE,
      sortOrder: 11,
      rules: [{ s: 'upsell', m: null }],
    },
    {
      name: 'Egressos',
      group: 'base_propria',
      color: BLUE,
      sortOrder: 12,
      rules: [{ s: 'egressos', m: null }],
    },
    {
      name: 'Cross-sell',
      group: 'base_propria',
      color: BLUE,
      sortOrder: 13,
      rules: [{ s: 'crosssell', m: null }],
    },
  ];
  for (const ch of SEED_CHANNELS) {
    const [inserted] = await db
      .insert(channels)
      .values({ name: ch.name, group: ch.group, color: ch.color, sortOrder: ch.sortOrder })
      .onConflictDoNothing({ target: channels.name })
      .returning({ id: channels.id });
    let channelId = inserted?.id;
    if (!channelId) {
      const [ex] = await db
        .select({ id: channels.id })
        .from(channels)
        .where(eq(channels.name, ch.name))
        .limit(1);
      channelId = ex?.id;
    }
    if (channelId) {
      await db
        .insert(channelRules)
        .values(ch.rules.map((r) => ({ channelId, utmSource: r.s, utmMedium: r.m })))
        .onConflictDoNothing();
    }
  }
  console.log(`Canais: ${SEED_CHANNELS.length} definidos (idempotente).`);

  console.log('Seed concluído.');
  await sql.end();
}

main().catch((err) => {
  console.error('Falha no seed:', err);
  process.exit(1);
});
