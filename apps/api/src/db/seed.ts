import { hash } from '@node-rs/argon2';
import { and, eq, inArray, isNull, notInArray } from 'drizzle-orm';
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
    slug: 'prof-luiz-henrique-guimaraes',
    name: 'Prof. Luiz Henrique Guimarães',
    bio: 'Coordenador acadêmico da Pós-graduação em Nefrologia e Urologia de Cães e Gatos. Responde pela integração entre os módulos, pelo alinhamento dos conteúdos, pelo acompanhamento do corpo docente e pela organização das atividades aplicadas, mantendo a coerência entre bases fisiopatológicas, métodos diagnósticos e condutas clínicas e terapêuticas do curso.',
  },
  {
    slug: 'dr-filiphe-mesquita',
    name: 'Prof. Dr. Filiphe de Paula Nunes Mesquita',
    bio: 'Coordenador científico do curso de Farmacoterapêutica Clínica em Cães e Gatos. Médico-veterinário formado pela Universidade Federal Rural do Semi-Árido (UFERSA), especialista em Anestesiologia Veterinária pelo Instituto Qualittas, mestre em Farmacologia pelo Instituto de Ciências Biomédicas da USP e doutor em Farmacologia pela Faculdade de Ciências Médicas da Unicamp.',
  },
  {
    slug: 'dra-cintia-ghorayeb',
    name: 'Dra. Cintia Ghorayeb',
    bio: 'Coordenadora da Pós-graduação em Clínica Médica de Cães e Gatos. Responde pela integração entre os módulos, pelo alinhamento dos conteúdos ao raciocínio clínico orientado por problemas e pelo acompanhamento do corpo docente e dos encontros síncronos quinzenais do curso.',
  },
  {
    slug: 'coordenacao-mielograma',
    name: 'Dr. Márcio Moreira e Dra. Roberta Ruiz',
    bio: 'Coordenação da Formação em Mielograma e Hematopatologia Medular em Cães e Gatos. Dr. Márcio Moreira responde pela trilha teórico-prática de leitura do mielograma, da citomorfologia medular ao diagnóstico hematopatológico avançado. Dra. Roberta Ruiz é especialista em Patologia e Medicina Veterinária Legal, mestre em Biociências e doutoranda em Patologia pela USP, e preside a Comissão de Responsabilidade Técnica do CRMV-SP.',
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
  /** Teto de parcelas sem juros deste curso. Padrão 24 (teto global). */
  maxInstallments?: number;
  level: CourseLevel;
  specialty: string;
  /** Coordenação. Omitido quando ainda não definida (a seção some da página). */
  instructor?: string;
  /** Destaque: maior aparece antes na home e no catálogo. Padrão 0. */
  featuredRank?: number;
  /** Vitrine "Em breve": sem preço nem checkout. Padrão false. */
  comingSoon?: boolean;
  cover?: string;
  workloadHours?: number;
  learningObjectives?: string[];
  faq?: SeedFaqItem[];
  modules: SeedModule[];
  /**
   * Preserva capa e instrutor já existentes no banco (não sobrescreve em re-seed).
   * Para cursos cujo comercial/coordenação é gerido no backoffice.
   */
  preserveCoverInstructor?: boolean;
  /** Preserva só a capa já existente no banco (a coordenação vem do seed). */
  preserveCover?: boolean;
  /**
   * Recria os módulos/aulas a partir do seed a cada re-seed (em vez de só popular
   * quando o curso ainda não tem módulos). Use para manter a grade sincronizada.
   */
  replaceModules?: boolean;
}

/** Catálogo Vethis — cursos publicados com módulos e aulas. */
const COURSES: SeedCourse[] = [
  {
    slug: 'pos-clinica-medica-caes-gatos',
    title: 'Pós-graduação em Clínica Médica de Cães e Gatos',
    subtitle:
      'Mais segurança para diagnosticar, mais clareza para decidir, mais confiança para atender.',
    description:
      'A Pós-graduação em Clínica Médica de Cães e Gatos foi criada para o médico-veterinário que deseja atender com mais segurança desde a primeira consulta. A formação começa pela semiologia, interpretação de exames e vacinação, avança pelas doenças infecciosas e parasitárias e percorre as principais áreas da clínica médica, sempre com foco no que realmente aparece na rotina: cardiologia e sistema respiratório, endocrinologia, nefrologia e urologia, dermatologia, neurologia, oncologia, gastroenterologia e hepatologia, hematologia e medicina transfusional e nutrição clínica. Mais do que apresentar doenças, o curso desenvolve o raciocínio clínico: o aluno aprende a construir listas de problemas, interpretar exames, estabelecer diagnósticos diferenciais, elaborar planos terapêuticos e monitorar a evolução dos pacientes. São 360 horas, com duração de até 12 meses, na modalidade EaD, combinando videoaulas gravadas, leitura dirigida, casos clínicos, exercícios de interpretação de exames, quizzes, fóruns, encontros síncronos quinzenais e projeto aplicado.',
    // R$ 15.000,00 em até 10x de R$ 1.500,00.
    priceCents: 1500000,
    maxInstallments: 10,
    level: 'avancado',
    specialty: 'clinica-medica',
    instructor: 'dra-cintia-ghorayeb',
    // Capa é gerida no backoffice: preservada no re-seed (a coordenação vem do seed).
    preserveCover: true,
    replaceModules: true,
    featuredRank: 90,
    workloadHours: 360,
    learningObjectives: [
      'Realizar anamnese e exame físico orientados por problemas.',
      'Construir listas de problemas e diagnósticos diferenciais de forma organizada.',
      'Interpretar exames laboratoriais, radiográficos, ultrassonográficos e cardiológicos.',
      'Reconhecer as principais doenças de cada sistema e suas apresentações clínicas.',
      'Planejar condutas terapêuticas individualizadas e monitorar respostas ao tratamento.',
      'Reconhecer situações de urgência, instabilidade e necessidade de encaminhamento.',
      'Aplicar protocolos atualizados, considerando riscos, prognóstico e qualidade de vida.',
    ],
    faq: [
      {
        question: 'Para quem é esta pós-graduação?',
        answer:
          'Para médicos-veterinários recém-formados ou com experiência que atuam, ou pretendem atuar, em clínicas, hospitais, internação, emergência, terapia intensiva e atendimento de cães e gatos, incluindo quem deseja revisar conhecimentos e atualizar protocolos.',
      },
      {
        question: 'Qual a duração e a carga horária?',
        answer:
          'A formação tem duração máxima de 12 meses e 360 horas no total: 120 horas de videoaulas gravadas somadas a atividades acadêmicas complementares orientadas (leitura dirigida, casos clínicos, exercícios, fóruns, encontros síncronos e projeto aplicado).',
      },
      {
        question: 'Como funciona o pagamento?',
        answer:
          'Investimento de R$ 15.000,00. Você pode parcelar em até 10x de R$ 1.500,00 no cartão ou no boleto, ou pagar no Pix à vista com 5% de desconto (R$ 14.250,00).',
      },
      {
        question: 'Como funciona a metodologia?',
        answer:
          'Modalidade EaD, com liberação progressiva dos módulos no ambiente virtual e encontros síncronos quinzenais. Cada módulo reúne videoaulas, material de apoio (artigos, consensos e guidelines), quatro casos clínicos, quiz e exercícios de interpretação de exames, no seu ritmo e de qualquer dispositivo.',
      },
      {
        question: 'Como é a avaliação?',
        answer:
          'A avaliação é contínua e considera o desempenho nos quizzes, a resolução dos casos clínicos, a interpretação de exames, a participação nos fóruns, avaliações periódicas e a atividade final aplicada.',
      },
      {
        question: 'Quais áreas o curso cobre?',
        answer:
          'Semiologia e interpretação de exames, vacinação, doenças infecciosas e parasitárias, cardiologia e sistema respiratório, endocrinologia, nefrologia e urologia, dermatologia, neurologia, oncologia, gastroenterologia e hepatologia, hematologia e medicina transfusional e nutrição clínica.',
      },
    ],
    modules: [
      {
        title: 'Módulo 1: Semiologia, Interpretação de Exames e Vacinação',
        lessons: [
          {
            title: 'Semiologia e exame físico geral com desenvolvimento do raciocínio clínico',
            min: 15,
          },
          {
            title:
              'Construção de suspeitas diagnósticas, diagnósticos diferenciais e priorização de condutas',
            min: 15,
          },
          { title: 'Interpretação do hemograma completo', min: 15 },
          { title: 'Perfil bioquímico, eletrólitos e glicemia aplicados ao caso clínico', min: 15 },
          {
            title: 'Urinálise, relação proteína/creatinina urinária, cultura e antibiograma',
            min: 15,
          },
          { title: 'Medicina preventiva e acompanhamento por faixa etária', min: 15 },
          {
            title:
              'Vacinação de cães e gatos: protocolos, avaliação de risco, falhas vacinais e eventos adversos',
            min: 15,
          },
        ],
      },
      {
        title: 'Módulo 2: Doenças Infecciosas e Parasitárias',
        lessons: [
          { title: 'Cinomose e parvovirose', min: 15 },
          { title: 'Leptospirose e principais zoonoses infecciosas', min: 15 },
          { title: 'Complexo respiratório infeccioso canino e felino', min: 15 },
          { title: 'Erliquiose, anaplasmose, babesiose e micoplasmose hemotrópica', min: 15 },
          { title: 'Leishmaniose visceral canina', min: 15 },
          { title: 'FeLV e FIV', min: 15 },
          { title: 'Peritonite infecciosa felina', min: 15 },
          { title: 'Toxoplasmose', min: 15 },
          { title: 'Esporotricose e outras micoses relevantes', min: 15 },
          { title: 'Ectoparasitoses e controle integrado de pulgas, carrapatos e ácaros', min: 15 },
          { title: 'Uso racional de antimicrobianos e antiparasitários', min: 15 },
        ],
      },
      {
        title: 'Módulo 3: Cardiologia e Sistema Respiratório',
        lessons: [
          { title: 'Fisiologia cardiovascular aplicada', min: 15 },
          { title: 'Semiologia cardiovascular e interpretação de sopros', min: 15 },
          { title: 'Eletrocardiograma: fundamentos e interpretação clínica', min: 15 },
          { title: 'Doença valvar degenerativa mitral', min: 15 },
          { title: 'Cardiomiopatia dilatada', min: 15 },
          { title: 'Insuficiência cardíaca congestiva', min: 15 },
          { title: 'Cardiomiopatia hipertrófica felina', min: 15 },
          { title: 'Hipertensão arterial e pulmonar', min: 15 },
          { title: 'Tromboembolismo arterial', min: 15 },
          { title: 'Arritmias e síncope', min: 15 },
          { title: 'Abordagem da tosse e da dispneia', min: 15 },
          { title: 'Síndrome braquicefálica', min: 15 },
          { title: 'Colapso de traqueia e paralisia laríngea', min: 15 },
          { title: 'Bronquite crônica e asma felina', min: 15 },
          { title: 'Pneumonias e doenças infecciosas respiratórias', min: 15 },
          { title: 'Edema pulmonar cardiogênico e não cardiogênico', min: 15 },
          { title: 'Efusão pleural e pneumotórax', min: 15 },
          { title: 'Neoplasias respiratórias', min: 15 },
          {
            title: 'Radiografia torácica, ecocardiografia, biomarcadores cardíacos e TFAST',
            min: 15,
          },
          { title: 'Gasometria, oximetria e capnografia', min: 15 },
          {
            title:
              'Broncoscopia, lavados respiratórios, oxigenioterapia, nebulização e toracocentese',
            min: 15,
          },
        ],
      },
      {
        title: 'Módulo 4: Endocrinologia',
        lessons: [
          {
            title: 'Diabetes mellitus em cães e gatos, insulinoterapia e monitoramento contínuo',
            min: 15,
          },
          { title: 'Cetoacidose diabética', min: 15 },
          { title: 'Hiperadrenocorticismo', min: 15 },
          { title: 'Hipoadrenocorticismo e crise addisoniana', min: 15 },
          { title: 'Hipotireoidismo canino', min: 15 },
          { title: 'Hipertireoidismo felino', min: 15 },
          { title: 'Insulinoma', min: 15 },
          { title: 'Hiperaldosteronismo', min: 15 },
          { title: 'Distúrbios do cálcio', min: 15 },
          { title: 'Testes hormonais e interpretação crítica', min: 15 },
          { title: 'Emergências endócrinas', min: 15 },
        ],
      },
      {
        title: 'Módulo 5: Nefrologia e Urologia',
        lessons: [
          { title: 'Fisiologia renal aplicada', min: 15 },
          { title: 'Avaliação laboratorial da função renal e urinária', min: 15 },
          { title: 'Hemogasometria e equilíbrio ácido-base', min: 15 },
          { title: 'Doença renal crônica e estadiamento IRIS', min: 15 },
          { title: 'Injúria renal aguda', min: 15 },
          { title: 'Proteinúria e glomerulopatias', min: 15 },
          { title: 'Pielonefrite e infecção urinária', min: 15 },
          { title: 'Distúrbios eletrolíticos e acidobásicos', min: 15 },
          { title: 'Urolitíase e ureterolitíase', min: 15 },
          { title: 'Cistites e doença do trato urinário inferior', min: 15 },
          { title: 'Obstrução ureteral e uretral', min: 15 },
          { title: 'Incontinência urinária e prostatopatias', min: 15 },
        ],
      },
      {
        title: 'Módulo 6: Dermatologia',
        lessons: [
          { title: 'Fisiologia dermatológica e padrões lesionais', min: 15 },
          { title: 'Dermatite atópica', min: 15 },
          { title: 'Alergia alimentar', min: 15 },
          { title: 'DAPP e ectoparasitoses', min: 15 },
          { title: 'Piodermites e malasseziose', min: 15 },
          { title: 'Dermatofitose', min: 15 },
          { title: 'Demodicidose e escabiose', min: 15 },
          { title: 'Otite externa e média', min: 15 },
          { title: 'Doenças autoimunes e imunomediadas', min: 15 },
          { title: 'Alopecias endócrinas', min: 15 },
          { title: 'Citologia, raspado, tricograma e biópsia', min: 15 },
          { title: 'Terapêutica dermatológica integrada e controle de recidivas', min: 15 },
        ],
      },
      {
        title: 'Módulo 7: Neurologia',
        lessons: [
          { title: 'Exame neurológico e neurolocalização', min: 15 },
          { title: 'Convulsões e epilepsia', min: 15 },
          { title: 'Status epilepticus', min: 15 },
          { title: 'Doença do disco intervertebral', min: 15 },
          { title: 'Síndrome vestibular central e periférica', min: 15 },
          { title: 'Meningoencefalites', min: 15 },
          { title: 'Neuropatias e doenças neuromusculares', min: 15 },
          { title: 'Mielopatias e doenças degenerativas', min: 15 },
          { title: 'Trauma cranioencefálico e medular', min: 15 },
          { title: 'Análise do líquido cerebrospinal', min: 15 },
          { title: 'Tomografia e ressonância magnética', min: 15 },
          { title: 'Dor neuropática e monitoramento neurológico', min: 15 },
        ],
      },
      {
        title: 'Módulo 8: Oncologia',
        lessons: [
          { title: 'Princípios do diagnóstico e estadiamento oncológico', min: 15 },
          { title: 'Citologia, histopatologia e imunohistoquímica', min: 15 },
          { title: 'Linfoma', min: 15 },
          { title: 'Mastocitoma', min: 15 },
          { title: 'Neoplasias mamárias', min: 15 },
          { title: 'Hemangiossarcoma', min: 15 },
          { title: 'Osteossarcoma', min: 15 },
          { title: 'Carcinoma de células escamosas', min: 15 },
          { title: 'Melanoma e tumores de cavidade oral', min: 15 },
          { title: 'Princípios de quimioterapia', min: 15 },
          { title: 'Cirurgia oncológica e margens', min: 15 },
          { title: 'Cuidados paliativos, dor e qualidade de vida', min: 15 },
        ],
      },
      {
        title: 'Módulo 9: Gastroenterologia e Hepatologia',
        lessons: [
          { title: 'Fisiologia do sistema gastroentérico, hepático e pancreático', min: 15 },
          { title: 'Abordagem do vômito e da diarreia', min: 15 },
          { title: 'Regurgitação, disfagia e doenças esofágicas', min: 15 },
          { title: 'Gastrites e úlceras', min: 15 },
          { title: 'Enteropatias crônicas e doença inflamatória intestinal', min: 15 },
          { title: 'Pancreatite', min: 15 },
          { title: 'Insuficiência pancreática exócrina', min: 15 },
          { title: 'Constipação e megacólon', min: 15 },
          { title: 'Obstruções e corpos estranhos', min: 15 },
          { title: 'Hepatites e colangites', min: 15 },
          { title: 'Lipidose hepática', min: 15 },
          { title: 'Shunt portossistêmico', min: 15 },
          { title: 'Doenças da vesícula biliar e suporte nutricional', min: 15 },
        ],
      },
      {
        title: 'Módulo 10: Hematologia e Medicina Transfusional',
        lessons: [
          { title: 'Interpretação do hemograma', min: 15 },
          { title: 'Anemias regenerativas e não regenerativas', min: 15 },
          { title: 'Anemia hemolítica imunomediada', min: 15 },
          { title: 'Hemoparasitoses', min: 15 },
          { title: 'Trombocitopenias', min: 15 },
          { title: 'Coagulopatias e coagulação intravascular disseminada', min: 15 },
          { title: 'Leucocitose e leucopenia', min: 15 },
          { title: 'Neoplasias hematopoiéticas', min: 15 },
          {
            title: 'Avaliação de medula óssea: indicações, coleta e interpretação inicial',
            min: 15,
          },
          { title: 'Tipagem e prova de compatibilidade', min: 15 },
          { title: 'Indicação de sangue e hemocomponentes', min: 15 },
          { title: 'Reações transfusionais e hemovigilância', min: 15 },
        ],
      },
      {
        title: 'Módulo 11: Nutrição Clínica de Cães e Gatos',
        lessons: [
          {
            title: 'Avaliação nutricional, escore de condição corporal e escore de massa muscular',
            min: 15,
          },
          { title: 'Necessidades energéticas e cálculo de requerimentos', min: 15 },
          { title: 'Nutrição de filhotes, adultos e pacientes idosos', min: 15 },
          { title: 'Nutrição do paciente hospitalizado e suporte enteral', min: 15 },
          { title: 'Dietas terapêuticas nas doenças gastrointestinais', min: 15 },
          { title: 'Manejo nutricional das doenças renais e urinárias', min: 15 },
          { title: 'Nutrição aplicada às principais endocrinopatias', min: 15 },
          { title: 'Indicação, monitoramento e ajuste de dietas terapêuticas', min: 15 },
        ],
      },
    ],
  },
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
    slug: 'pos-nefrologia-urologia',
    cover: '/cursos/pos-nefrologia.png',
    title: 'Pós-graduação em Nefrologia e Urologia de Cães e Gatos',
    subtitle:
      'Da fisiopatologia renal à tomada de decisão clínica, à cirurgia e às terapias renais substitutivas.',
    description:
      'Pós-graduação 100% online, com 360 horas e certificação, para quem quer investigar e conduzir o paciente renal e urinário com segurança. O curso parte das bases anatômicas, fisiológicas e fisiopatológicas do sistema urinário e avança para urinálise e biomarcadores, diagnóstico por imagem, hemogasometria e eletrólitos, injúria renal aguda, doença renal crônica, infecções urinárias, urolitíases, hipertensão, proteinúria e glomerulopatias, doenças do trato urinário inferior, cirurgia e técnicas dialíticas. São 80 horas de videoaulas gravadas somadas a leituras dirigidas, quatro casos clínicos por módulo (48 no total), exercícios de interpretação de exames, quizzes, fóruns, encontros síncronos e projeto aplicado.',
    priceCents: 928800,
    level: 'avancado',
    specialty: 'nefrologia',
    instructor: 'prof-luiz-henrique-guimaraes',
    featuredRank: 80,
    workloadHours: 360,
    learningObjectives: [
      'Compreender a anatomia, a fisiologia e a fisiopatogenia renal aplicadas à clínica.',
      'Interpretar urinálise, densidade urinária, sedimento, proteinúria, creatinina, SDMA e biomarcadores.',
      'Diferenciar azotemia pré-renal, renal e pós-renal e organizar a investigação diagnóstica.',
      'Reconhecer os achados de ultrassonografia, radiografia e tomografia do trato urinário.',
      'Interpretar hemogasometria, distúrbios ácido-base e alterações eletrolíticas.',
      'Estadiar e acompanhar injúria renal aguda e doença renal crônica conforme os critérios IRIS.',
      'Planejar fluidoterapia e monitorar balanço hídrico, débito urinário e sobrecarga de volume.',
      'Investigar e tratar infecções urinárias com uso racional de antimicrobianos e stewardship.',
      'Diagnosticar, tratar e prevenir a recidiva das principais urolitíases.',
      'Mensurar e interpretar pressão arterial e proteinúria e abordar as glomerulopatias.',
      'Conduzir cistite idiopática, obstrução uretral e demais doenças do trato urinário inferior.',
      'Compreender as indicações de cirurgia, stent ureteral, bypass ureteral subcutâneo e terapias dialíticas.',
    ],
    faq: [
      {
        question: 'Para quem é esta pós-graduação?',
        answer:
          'Para médicos-veterinários que atendem cães e gatos na rotina clínica, atuam em hospitais, internação, emergência, terapia intensiva, laboratório, imagem ou cirurgia, ou desejam construir uma atuação especializada em Nefrologia e Urologia Veterinária.',
      },
      {
        question: 'Qual a duração e a carga horária?',
        answer:
          'A formação tem duração de até 12 meses e 360 horas no total: 80 horas de videoaulas gravadas somadas a 280 horas de atividades acadêmicas complementares orientadas (leitura dirigida, casos clínicos, exercícios, avaliações, fóruns, encontros síncronos e projeto final).',
      },
      {
        question: 'Como funciona o pagamento?',
        answer:
          'Investimento de R$ 9.288,00. Você pode parcelar em até 24x de R$ 387,00 no boleto, pagar no Pix à vista com 5% de desconto (R$ 8.823,60) ou no cartão com condição especial.',
      },
      {
        question: 'Como funciona a metodologia?',
        answer:
          'Modalidade EaD, com os módulos liberados progressivamente no ambiente virtual. Cada módulo reúne videoaulas gravadas, material de apoio selecionado pelo professor e quatro casos clínicos estruturados — 48 casos ao longo do curso —, além de exercícios de urinálise, proteinúria, hemogasometria, eletrólitos, imagem, balanço hídrico e prescrição.',
      },
      {
        question: 'Como é a avaliação?',
        answer:
          'A avaliação é contínua e considera os quizzes de cada módulo, a resolução dos casos clínicos, os exercícios de interpretação de exames, a participação nos fóruns, as avaliações periódicas e a atividade final aplicada.',
      },
      {
        question: 'O curso é certificado e reconhecido?',
        answer:
          'Sim. Curso certificado e reconhecido pelo MEC, ofertado em parceria com a Rede de Ensino Doctum. Ao concluir, você recebe o certificado de pós-graduação de 360 horas, disponível na área do aluno.',
      },
    ],
    modules: [
      {
        title: 'Módulo 1: Anatomia, Fisiologia e Fisiopatogenia Renal',
        lessons: [
          {
            title: 'Anatomia macroscópica e microscópica do sistema urinário',
            min: 36,
            free: true,
          },
          { title: 'Estrutura e função do néfron', min: 36 },
          { title: 'Hemodinâmica renal e taxa de filtração glomerular', min: 36 },
          { title: 'Mecanismos de concentração e diluição da urina', min: 36 },
          { title: 'Regulação de sódio, água, potássio, fósforo e cálcio', min: 36 },
          { title: 'Sistema renina-angiotensina-aldosterona', min: 36 },
          { title: 'Funções endócrinas dos rins', min: 36 },
          { title: 'Mecanismos de lesão glomerular, tubular e intersticial', min: 36 },
          { title: 'Fibrose e progressão da doença renal', min: 36 },
          { title: 'Relação entre fisiopatologia e manifestações clínicas', min: 36 },
        ],
      },
      {
        title: 'Módulo 2: Diagnóstico Laboratorial em Nefrologia',
        lessons: [
          { title: 'Métodos de coleta urinária e qualidade da amostra', min: 39 },
          { title: 'Urinálise física, química e microscópica', min: 39 },
          { title: 'Densidade urinária e capacidade de concentração', min: 38 },
          { title: 'Interpretação do sedimento urinário', min: 38 },
          { title: 'Ureia, creatinina e SDMA', min: 38 },
          { title: 'Biomarcadores de função e de lesão renal', min: 38 },
          { title: 'Relação proteína:creatinina urinária', min: 38 },
          { title: 'Albuminúria e proteinúria persistente', min: 38 },
          { title: 'Urocultura, antibiograma e contaminação da amostra', min: 38 },
          { title: 'Avaliação seriada e tendências laboratoriais', min: 38 },
          { title: 'Diferenciação entre azotemia pré-renal, renal e pós-renal', min: 38 },
        ],
      },
      {
        title: 'Módulo 3: Diagnóstico por Imagem Aplicado à Nefrologia e Urologia',
        lessons: [
          { title: 'Anatomia ultrassonográfica normal dos rins e trato urinário', min: 44 },
          { title: 'Alterações de ecogenicidade, arquitetura e dimensões renais', min: 44 },
          { title: 'Pieloectasia, hidronefrose e hidroureter', min: 44 },
          { title: 'Ureterólitos e obstruções', min: 44 },
          { title: 'Avaliação ultrassonográfica da bexiga e uretra', min: 44 },
          { title: 'Urolitíases radiopacas e radiolucentes', min: 44 },
          { title: 'Radiografia simples e estudos contrastados', min: 44 },
          { title: 'Tomografia computadorizada aplicada ao trato urinário', min: 43 },
          { title: 'Massas renais e vesicais', min: 43 },
          { title: 'Planejamento de procedimentos guiados por imagem', min: 43 },
          { title: 'Integração entre imagem, laboratório e clínica', min: 43 },
        ],
      },
      {
        title: 'Módulo 4: Hemogasometria, Equilíbrio Ácido-Base e Distúrbios Eletrolíticos',
        lessons: [
          { title: 'Coleta e interpretação da hemogasometria', min: 36 },
          { title: 'pH, bicarbonato, pressão de dióxido de carbono e excesso de bases', min: 36 },
          { title: 'Acidose e alcalose metabólicas', min: 36 },
          { title: 'Distúrbios respiratórios e alterações mistas', min: 36 },
          { title: 'Ânion gap e lactato', min: 36 },
          { title: 'Hipercalemia e hipocalemia', min: 36 },
          { title: 'Distúrbios de sódio e cloro', min: 36 },
          { title: 'Alterações de cálcio, fósforo e magnésio', min: 36 },
          { title: 'Cálculo e planejamento da correção eletrolítica', min: 36 },
          { title: 'Monitoramento e prevenção de correções excessivamente rápidas', min: 36 },
        ],
      },
      {
        title: 'Módulo 5: Injúria Renal Aguda Aplicada à Rotina Clínica',
        lessons: [
          { title: 'Definição e classificação da injúria renal aguda', min: 40 },
          { title: 'Classificação IRIS da IRA', min: 40 },
          { title: 'Fatores de risco e diagnóstico precoce', min: 40 },
          { title: 'Causas pré-renais, renais e pós-renais', min: 40 },
          { title: 'Nefrotoxinas e prevenção de lesão renal', min: 40 },
          { title: 'Fluidoterapia individualizada', min: 40 },
          { title: 'Monitoramento do débito urinário', min: 40 },
          { title: 'Oligúria, anúria e sobrecarga de volume', min: 40 },
          { title: 'Uso racional de diuréticos', min: 40 },
          { title: 'Nutrição e suporte do paciente crítico', min: 40 },
          { title: 'Critérios de encaminhamento para diálise', min: 40 },
          { title: 'Prognóstico e acompanhamento pós-alta', min: 40 },
        ],
      },
      {
        title: 'Módulo 6: Doença Renal Crônica Aplicada à Rotina Clínica',
        lessons: [
          { title: 'Definição e diagnóstico da doença renal crônica', min: 42 },
          { title: 'Estadiamento IRIS', min: 42 },
          { title: 'Subestadiamento por proteinúria e pressão arterial', min: 42 },
          { title: 'Avaliação de progressão e estabilidade', min: 42 },
          { title: 'Manejo nutricional e ingestão hídrica', min: 42 },
          { title: 'Controle de hiperfosfatemia', min: 42 },
          { title: 'Hipocalemia e acidose metabólica', min: 42 },
          { title: 'Anemia da doença renal crônica', min: 41 },
          { title: 'Distúrbio mineral e ósseo renal', min: 41 },
          { title: 'Controle de náusea, vômitos e inapetência', min: 41 },
          { title: 'Fluidoterapia domiciliar quando indicada', min: 41 },
          { title: 'Monitoramento longitudinal e qualidade de vida', min: 41 },
          { title: 'Comunicação de prognóstico e cuidados paliativos', min: 41 },
        ],
      },
      {
        title: 'Módulo 7: Infecções do Trato Urinário em Cães e Gatos',
        lessons: [
          { title: 'Bacteriúria subclínica', min: 30 },
          { title: 'Cistite bacteriana esporádica', min: 30 },
          { title: 'Infecções recorrentes e complicadas', min: 30 },
          { title: 'Pielonefrite', min: 30 },
          { title: 'Prostatite bacteriana', min: 30 },
          { title: 'Métodos de coleta para urocultura', min: 30 },
          { title: 'Interpretação de contagem bacteriana e antibiograma', min: 30 },
          { title: 'Seleção e duração da terapia antimicrobiana', min: 30 },
          { title: 'Recidiva, reinfecção e persistência', min: 30 },
          { title: 'Fatores predisponentes anatômicos e sistêmicos', min: 30 },
          { title: 'Resistência antimicrobiana e stewardship', min: 30 },
          { title: 'Monitoramento e prevenção de recorrências', min: 30 },
        ],
      },
      {
        title: 'Módulo 8: Urolitíase: Diagnóstico, Tratamento e Prevenção de Recidivas',
        lessons: [
          { title: 'Formação e classificação dos urólitos', min: 35 },
          { title: 'Estruvita em cães e gatos', min: 35 },
          { title: 'Oxalato de cálcio', min: 35 },
          { title: 'Urato e cistina', min: 35 },
          { title: 'Diagnóstico por urinálise e imagem', min: 35 },
          { title: 'Dissolução médica e critérios de indicação', min: 35 },
          { title: 'Remoção minimamente invasiva e cirúrgica', min: 35 },
          { title: 'Análise quantitativa dos urólitos', min: 35 },
          { title: 'Manejo nutricional e ingestão hídrica', min: 35 },
          { title: 'Controle de infecção associada', min: 35 },
          { title: 'Monitoramento pós-tratamento', min: 35 },
          { title: 'Prevenção de recidivas', min: 35 },
        ],
      },
      {
        title: 'Módulo 9: Intervenções Cirúrgicas em Nefrologia e Urologia',
        lessons: [
          { title: 'Planejamento pré-operatório do paciente renal e urinário', min: 39 },
          { title: 'Nefrectomia e preservação da função contralateral', min: 39 },
          { title: 'Nefrotomia e pielotomia', min: 38 },
          { title: 'Ureterotomia e reimplante ureteral', min: 38 },
          { title: 'Stent ureteral e bypass ureteral subcutâneo', min: 38 },
          { title: 'Cistotomia', min: 38 },
          { title: 'Uretrostomias e procedimentos uretrais', min: 38 },
          { title: 'Correção de anomalias e traumas urinários', min: 38 },
          { title: 'Cuidados anestésicos e analgesia', min: 38 },
          { title: 'Monitoramento pós-operatório', min: 38 },
          { title: 'Extravasamento urinário, obstrução e infecção como complicações', min: 38 },
        ],
      },
      {
        title: 'Módulo 10: Hipertensão Arterial, Proteinúria e Glomerulopatias',
        lessons: [
          { title: 'Fisiopatologia da hipertensão arterial sistêmica', min: 35 },
          { title: 'Técnicas de mensuração da pressão arterial', min: 35 },
          { title: 'Classificação de risco e lesão em órgãos-alvo', min: 35 },
          { title: 'Hipertensão associada à doença renal', min: 35 },
          { title: 'Proteinúria fisiológica e patológica', min: 35 },
          { title: 'Relação proteína:creatinina urinária', min: 35 },
          { title: 'Proteinúria glomerular e não glomerular', min: 35 },
          { title: 'Glomerulopatias imunomediadas e secundárias', min: 35 },
          { title: 'Investigação etiológica', min: 35 },
          { title: 'Terapias antiproteinúricas', min: 35 },
          { title: 'Bloqueio do sistema renina-angiotensina-aldosterona', min: 35 },
          { title: 'Monitoramento e prognóstico', min: 35 },
        ],
      },
      {
        title: 'Módulo 11: Doenças do Trato Urinário Inferior',
        lessons: [
          { title: 'Doença do trato urinário inferior felino', min: 25 },
          { title: 'Cistite idiopática felina', min: 25 },
          { title: 'Obstrução uretral e estabilização inicial', min: 25 },
          { title: 'Cateterização e cuidados pós-desobstrução', min: 25 },
          { title: 'Diurese pós-obstrutiva', min: 25 },
          { title: 'Tampões e estenoses uretrais', min: 25 },
          { title: 'Manejo ambiental multimodal', min: 25 },
          { title: 'Cistites não infecciosas em cães', min: 25 },
          { title: 'Incontinência urinária', min: 25 },
          { title: 'Neoplasias vesicais e uretrais', min: 25 },
          { title: 'Recorrência e prevenção', min: 25 },
          { title: 'Indicações de encaminhamento cirúrgico', min: 25 },
        ],
      },
      {
        title: 'Módulo 12: Terapias Renais Substitutivas e Técnicas Dialíticas',
        lessons: [
          { title: 'Princípios físicos da diálise', min: 20 },
          { title: 'Indicações e contraindicações', min: 20 },
          { title: 'Hemodiálise intermitente', min: 20 },
          { title: 'Terapia renal substitutiva contínua', min: 20 },
          { title: 'Diálise peritoneal', min: 20 },
          { title: 'Hemoperfusão e remoção de toxinas', min: 20 },
          { title: 'Acesso vascular', min: 20 },
          { title: 'Anticoagulação', min: 20 },
          { title: 'Prescrição e monitoramento dialítico', min: 20 },
          { title: 'Complicações intradialíticas', min: 20 },
          { title: 'Seleção de pacientes e prognóstico', min: 20 },
          { title: 'Integração com serviços de referência', min: 20 },
        ],
      },
    ],
  },
  {
    slug: 'farmacoterapeutica-clinica',
    cover: '/cursos/farmacologia-clinica.png',
    title: 'Farmacoterapêutica Clínica em Cães e Gatos',
    subtitle: 'Da escolha do fármaco à prescrição segura na rotina clínica.',
    description:
      'Curso de formação continuada, 100% online, com 26 horas de aulas gravadas e orientação eminentemente clínica. Parte dos fundamentos indispensáveis de farmacocinética e farmacodinâmica e concentra a maior carga na aplicação prática: seleção do fármaco, indicação e contraindicação, ajuste de dose, interações, monitoramento, segurança terapêutica e prescrição. O programa é organizado por situações clínicas e sistemas, com atenção às diferenças entre cães e gatos, ao uso racional de antimicrobianos, à farmacoterapia dermatológica, aos pacientes renais, hepáticos e geriátricos e aos erros de medicação mais frequentes.',
    priceCents: 130000,
    maxInstallments: 10,
    level: 'intermediario',
    specialty: 'farmacologia',
    instructor: 'dr-filiphe-mesquita',
    featuredRank: 70,
    workloadHours: 26,
    learningObjectives: [
      'Revisar os princípios de farmacocinética e farmacodinâmica realmente aplicáveis à rotina.',
      'Compreender as particularidades farmacológicas de cães e gatos, com ênfase no metabolismo felino.',
      'Selecionar fármacos por indicação clínica, mecanismo de ação, contraindicações e interações.',
      'Aplicar farmacoterapia racional às afecções neurológicas, dolorosas, cardiovasculares, renais, respiratórias, gastrointestinais e dermatológicas.',
      'Utilizar antimicrobianos com critério, relacionando escolha empírica, cultura, antibiograma, resistência e descalonamento.',
      'Reconhecer as particularidades terapêuticas de filhotes, geriátricos, gestantes, nefropatas, hepatopatas e pacientes críticos.',
      'Realizar cálculos de dose, concentração, diluição e infusão contínua (CRI) com segurança.',
      'Elaborar prescrições adequadas e reconhecer erros de medicação e situações de risco iatrogênico.',
      'Definir parâmetros clínicos e laboratoriais de monitoramento terapêutico.',
    ],
    faq: [
      {
        question: 'Para quem é este curso?',
        answer:
          'Para médicos-veterinários que atuam ou pretendem atuar na clínica de cães e gatos, profissionais de pronto atendimento, internação e especialidades clínicas, e estudantes de Medicina Veterinária em fase final de graduação.',
      },
      {
        question: 'Qual a carga horária?',
        answer:
          'São 26 horas de videoaulas gravadas, distribuídas em 9 módulos de curta duração. Apostila digital, quadros-resumo, tabelas de cálculo, quizzes, casos clínicos comentados e modelos de prescrição acompanham o curso sem ampliar a carga de aulas gravadas.',
      },
      {
        question: 'Como funciona o pagamento?',
        answer:
          'Investimento de R$ 1.300,00. Você pode parcelar em até 10x de R$ 130,00 ou pagar no Pix à vista com 5% de desconto (R$ 1.235,00).',
      },
      {
        question: 'Como funciona a metodologia?',
        answer:
          'Curso EaD com videoaulas gravadas em módulos curtos e foco em decisão terapêutica. As aulas trazem discussão de casos, algoritmos, tabelas comparativas de classes farmacológicas, resolução de cálculos e análise de prescrições.',
      },
      {
        question: 'Como é a avaliação?',
        answer:
          'Por quizzes ao final dos módulos e uma avaliação final objetiva sobre tomada de decisão farmacoterapêutica, cálculo de doses, interpretação de interações e segurança na prescrição.',
      },
      {
        question: 'Quem coordena o curso?',
        answer:
          'A coordenação científica é do Prof. Dr. Filiphe de Paula Nunes Mesquita, mestre em Farmacologia pelo ICB-USP e doutor em Farmacologia pela FCM-Unicamp, com docência complementada por professores convidados conforme a necessidade do programa.',
      },
    ],
    modules: [
      {
        title: 'Módulo 1: Bases Práticas da Farmacoterapêutica Clínica',
        lessons: [
          {
            title:
              'Farmacocinética aplicada: absorção, biodisponibilidade, distribuição, metabolismo e excreção',
            min: 22,
            free: true,
          },
          {
            title:
              'Farmacodinâmica aplicada à escolha terapêutica: receptores, agonismo, antagonismo, potência e eficácia',
            min: 22,
          },
          { title: 'Meia-vida, intervalo entre doses e estado de equilíbrio', min: 22 },
          { title: 'Vias de administração e impacto clínico', min: 21 },
          { title: 'Particularidades metabólicas dos felinos', min: 21 },
          { title: 'Fatores que modificam a resposta aos fármacos', min: 21 },
          { title: 'Princípios de ajuste de dose em disfunção renal e hepática', min: 21 },
        ],
      },
      {
        title: 'Módulo 2: Analgesia, Inflamação e Farmacologia Neurológica',
        lessons: [
          {
            title: 'AINEs: indicações, contraindicações, eventos adversos e monitoramento',
            min: 27,
          },
          { title: 'Glicocorticoides: potência, equivalência, uso racional e desmame', min: 27 },
          { title: 'Opioides e analgesia multimodal', min: 26 },
          { title: 'Dipirona e outros analgésicos de uso clínico', min: 26 },
          { title: 'Gabapentina e pregabalina', min: 26 },
          { title: 'Anticonvulsivantes: fenobarbital, levetiracetam e benzodiazepínicos', min: 26 },
          { title: 'Sedativos de rotina e cuidados na associação de fármacos', min: 26 },
          { title: 'Combinações de risco e interações relevantes', min: 26 },
        ],
      },
      {
        title: 'Módulo 3: Farmacoterapêutica Cardiovascular, Renal e Respiratória',
        lessons: [
          {
            title:
              'Inotrópicos positivos, vasodilatadores e moduladores do sistema renina-angiotensina-aldosterona',
            min: 27,
          },
          {
            title: 'Diuréticos: furosemida, espironolactona e princípios de uso racional',
            min: 27,
          },
          { title: 'Amlodipino e terapêutica da hipertensão', min: 26 },
          { title: 'Antiarrítmicos mais utilizados na rotina', min: 26 },
          { title: 'Ajustes farmacológicos no paciente renal', min: 26 },
          {
            title: 'Broncodilatadores, corticoides inalatórios, antitussígenos e mucolíticos',
            min: 26,
          },
          { title: 'Nebulização e vias inalatórias', min: 26 },
          {
            title: 'Monitoramento renal, eletrolítico e cardiovascular relacionado ao tratamento',
            min: 26,
          },
        ],
      },
      {
        title: 'Módulo 4: Farmacoterapêutica Gastrointestinal e Hepatobiliar',
        lessons: [
          { title: 'Antieméticos: maropitant, ondansetrona e metoclopramida', min: 23 },
          { title: 'Procinéticos e moduladores da motilidade gastrointestinal', min: 23 },
          {
            title: 'Inibidores de bomba de prótons, antagonistas H2 e protetores de mucosa',
            min: 23,
          },
          { title: 'Laxativos, moduladores de fezes e terapêutica da constipação', min: 23 },
          { title: 'Uso racional de fármacos na diarreia', min: 22 },
          { title: 'Hepatoprotetores e agentes empregados em doenças hepatobiliares', min: 22 },
          { title: 'Ácido ursodesoxicólico e S-adenosilmetionina', min: 22 },
          {
            title: 'Escolha terapêutica baseada em sinais clínicos e mecanismo fisiopatológico',
            min: 22,
          },
        ],
      },
      {
        title: 'Módulo 5: Antimicrobianos e Uso Racional',
        lessons: [
          { title: 'Princípios de antibioticoterapia e seleção racional', min: 27 },
          { title: 'Quando o antibiótico está e quando não está indicado', min: 27 },
          { title: 'Escolha empírica versus cultura e antibiograma', min: 27 },
          { title: 'Penicilinas, cefalosporinas e tetraciclinas', min: 27 },
          {
            title: 'Fluoroquinolonas, macrolídeos, sulfonamidas, nitroimidazóis e aminoglicosídeos',
            min: 27,
          },
          { title: 'Resistência antimicrobiana, descalonamento e duração do tratamento', min: 27 },
          { title: 'Associações antimicrobianas: quando usar e quando evitar', min: 26 },
          { title: 'Impacto renal e hepático de classes selecionadas', min: 26 },
          { title: 'Particularidades da antibioticoterapia em gatos', min: 26 },
        ],
      },
      {
        title: 'Módulo 6: Farmacoterapêutica Dermatológica Básica',
        lessons: [
          { title: 'Controle do prurido e da inflamação cutânea', min: 21 },
          { title: 'Oclacitinib, lokivetmab, ciclosporina e glicocorticoides', min: 21 },
          { title: 'Anti-histamínicos: indicações e limitações', min: 21 },
          { title: 'Antimicrobianos em piodermites e princípios de uso racional', min: 21 },
          { title: 'Terapia tópica: clorexidina, peróxido de benzoíla e outros agentes', min: 21 },
          {
            title: 'Antifúngicos tópicos e sistêmicos: itraconazol, cetoconazol e terbinafina',
            min: 21,
          },
          { title: 'Terapêutica básica das otites', min: 21 },
          { title: 'Isoxazolinas e controle de ectoparasitas', min: 21 },
          { title: 'Manejo farmacológico das dermatopatias alérgicas', min: 21 },
          { title: 'Terapia de suporte da barreira cutânea', min: 21 },
        ],
      },
      {
        title: 'Módulo 7: Antiparasitários e Farmacoterapia de Doenças Infecciosas Frequentes',
        lessons: [
          { title: 'Endoparasiticidas e ectoparasiticidas mais utilizados', min: 20 },
          { title: 'Isoxazolinas, lactonas macrocíclicas, benzimidazóis e praziquantel', min: 20 },
          { title: 'Princípios farmacoterapêuticos nas hemoparasitoses', min: 20 },
          {
            title: 'Uso de doxiciclina e imidocarb: indicações, cautelas e monitoramento',
            min: 20,
          },
          { title: 'Princípios terapêuticos aplicados à leishmaniose', min: 20 },
          { title: 'Giardíase e outras parasitoses de ocorrência frequente', min: 20 },
        ],
      },
      {
        title: 'Módulo 8: Pacientes Especiais, Interações e Monitoramento Terapêutico',
        lessons: [
          { title: 'Farmacoterapia em filhotes e animais geriátricos', min: 19 },
          { title: 'Cuidados em gestantes e lactantes', min: 19 },
          { title: 'Ajustes em nefropatas e hepatopatas', min: 19 },
          { title: 'Paciente crítico e alterações farmacocinéticas relevantes', min: 19 },
          { title: 'Interações medicamentosas clinicamente importantes', min: 19 },
          { title: 'Monitoramento terapêutico: o que acompanhar e quando reavaliar', min: 19 },
          {
            title:
              'Monitoramento de AINEs, anticonvulsivantes, diuréticos, moduladores cardiovasculares e antimicrobianos',
            min: 18,
          },
          { title: 'Polifarmácia e prevenção de duplicidade terapêutica', min: 18 },
        ],
      },
      {
        title: 'Módulo 9: Prescrição, Cálculo de Doses e Prevenção de Iatrogenias',
        lessons: [
          { title: 'Princípios de prescrição veterinária e organização do receituário', min: 9 },
          { title: 'Cálculo de dose em mg/kg e conversão para volume', min: 9 },
          {
            title: 'Cálculo a partir de concentrações em mg/mL, porcentagem e outras apresentações',
            min: 9,
          },
          { title: 'Diluições e transformação de unidades', min: 9 },
          { title: 'Taxa de infusão contínua (CRI)', min: 9 },
          { title: 'Conferência de cálculos e prevenção de erros de dez vezes', min: 9 },
          { title: 'Erros comuns de dose, via, frequência e concentração', min: 9 },
          { title: 'Duplicidade de princípios ativos e associações inadequadas', min: 9 },
          { title: 'Situações clássicas de toxicidade e iatrogenia em cães e gatos', min: 9 },
          { title: 'Discussão final de casos clínicos e prescrições', min: 9 },
        ],
      },
    ],
  },
  {
    slug: 'formacao-mielograma-hematopatologia-medular',
    title: 'Formação em Mielograma e Hematopatologia Medular em Cães e Gatos',
    subtitle:
      'Do reconhecimento celular ao diagnóstico hematopatológico avançado, com leitura orientada de lâminas e casos.',
    description:
      'Formação em Mielograma e Hematopatologia Medular em Cães e Gatos: uma trilha teórico-prática em três níveis, com 51 horas no total, que vai do reconhecimento celular ao diagnóstico hematopatológico avançado. O percurso é organizado por etapas: o módulo introdutório de citomorfologia medular e leitura inicial do mielograma; o nível intermediário, que aprofunda a interpretação hematopatológica e os distúrbios da hematopoiese; e o módulo avançado, que aborda hematopatologia neoplásica, leucemias, síndromes mielodisplásicas e introdução à biópsia de medula. No primeiro nível, o aluno aprende a reconhecer as principais populações celulares, organizar as sequências de maturação, avaliar qualidade e representatividade da amostra, realizar contagem diferencial orientada, compreender a relação mieloide:eritroide e distinguir medula normal, reacional ou claramente anormal. A metodologia combina teoria, leitura orientada de lâminas e discussão de casos, com foco em coleta, preparo, artefatos, armadilhas citológicas e um algoritmo básico de leitura. Indicada para médicos-veterinários, residentes, pós-graduandos e patologistas clínicos que desejam iniciar ou consolidar a leitura do mielograma com segurança e método.',
    // R$ 15.000,00 em até 10x de R$ 1.500,00.
    priceCents: 1500000,
    maxInstallments: 10,
    level: 'intermediario',
    specialty: 'hematologia',
    instructor: 'coordenacao-mielograma',
    featuredRank: 60,
    workloadHours: 51,
    learningObjectives: [
      'Reconhecer as principais populações celulares da medula óssea e organizar as sequências de maturação.',
      'Avaliar a qualidade e a representatividade da amostra e identificar artefatos e armadilhas citológicas.',
      'Realizar a contagem diferencial orientada e interpretar a relação mieloide:eritroide.',
      'Distinguir medula normal, reacional ou claramente anormal com um algoritmo básico de leitura.',
      'Interpretar os principais distúrbios da hematopoiese à luz do hemograma e do quadro clínico.',
      'Reconhecer padrões de hematopatologia neoplásica, leucemias e síndromes mielodisplásicas.',
      'Compreender as indicações e a leitura inicial da biópsia de medula óssea.',
    ],
    faq: [
      {
        question: 'Para quem é esta formação?',
        answer:
          'Para médicos-veterinários, residentes, pós-graduandos e patologistas clínicos que desejam iniciar ou consolidar a leitura do mielograma com segurança e método.',
      },
      {
        question: 'Como o curso é organizado?',
        answer:
          'Em três níveis: o módulo introdutório de citomorfologia medular e leitura inicial do mielograma; o nível intermediário, que aprofunda a interpretação hematopatológica e os distúrbios da hematopoiese; e o módulo avançado, que aborda hematopatologia neoplásica, leucemias, síndromes mielodisplásicas e introdução à biópsia de medula.',
      },
      {
        question: 'Qual a carga horária?',
        answer: 'A formação tem 51 horas no total, distribuídas entre os três níveis da trilha.',
      },
      {
        question: 'Como funciona o pagamento?',
        answer:
          'Investimento de R$ 15.000,00. Você pode parcelar em até 10x de R$ 1.500,00 no cartão ou no boleto, ou pagar no Pix à vista com 5% de desconto (R$ 14.250,00).',
      },
      {
        question: 'Como funciona a metodologia?',
        answer:
          'A metodologia combina teoria, leitura orientada de lâminas e discussão de casos, com foco em coleta, preparo, artefatos, armadilhas citológicas e um algoritmo básico de leitura.',
      },
    ],
    modules: [
      {
        title: 'Nível 1: Citomorfologia Medular e Leitura Inicial do Mielograma',
        lessons: [
          { title: 'Indicações do mielograma e integração com o hemograma', min: 120, free: true },
          { title: 'Coleta e preparo da amostra de medula óssea', min: 120 },
          { title: 'Artefatos e armadilhas citológicas', min: 90 },
          { title: 'Qualidade e representatividade da amostra', min: 90 },
          { title: 'Reconhecimento das principais populações celulares', min: 120 },
          {
            title: 'Sequências de maturação das linhagens eritroide, mieloide e megacariocítica',
            min: 120,
          },
          { title: 'Contagem diferencial orientada', min: 90 },
          { title: 'Relação mieloide:eritroide e sua interpretação', min: 90 },
          { title: 'Medula normal, reacional ou claramente anormal', min: 90 },
          { title: 'Algoritmo básico de leitura do mielograma', min: 90 },
          { title: 'Leitura orientada de lâminas e discussão de casos — nível 1', min: 120 },
        ],
      },
      {
        title: 'Nível 2: Interpretação Hematopatológica e Distúrbios da Hematopoiese',
        lessons: [
          { title: 'Interpretação hematopatológica integrada ao quadro clínico', min: 120 },
          { title: 'Hipoplasia e aplasia medular', min: 120 },
          { title: 'Hiperplasia eritroide, mieloide e megacariocítica', min: 120 },
          { title: 'Diseritropoiese, disgranulopoiese e dismegacariocitopoiese', min: 120 },
          { title: 'Medula na anemia não regenerativa e nas citopenias imunomediadas', min: 120 },
          { title: 'Medula nas doenças infecciosas e inflamatórias', min: 120 },
          { title: 'Mielofibrose, mielonecrose e outras alterações do estroma', min: 120 },
          { title: 'Leitura orientada de lâminas e discussão de casos — nível 2', min: 120 },
        ],
      },
      {
        title: 'Nível 3: Hematopatologia Neoplásica, Leucemias e Biópsia de Medula',
        lessons: [
          { title: 'Hematopatologia neoplásica: princípios e classificação', min: 120 },
          { title: 'Leucemias agudas', min: 120 },
          { title: 'Leucemias crônicas e neoplasias mieloproliferativas', min: 120 },
          { title: 'Síndromes mielodisplásicas', min: 120 },
          {
            title: 'Infiltração medular por linfoma, mieloma múltiplo e neoplasias metastáticas',
            min: 120,
          },
          { title: 'Exames complementares: citoquímica, imunofenotipagem e PARR', min: 120 },
          {
            title: 'Introdução à biópsia de medula óssea: indicações, coleta e leitura inicial',
            min: 120,
          },
          { title: 'Leitura orientada de lâminas e discussão de casos — nível 3', min: 120 },
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
      maxInstallments: c.maxInstallments ?? 24,
      level: c.level,
      status: 'published' as const,
      featuredRank: c.featuredRank ?? 0,
      comingSoon: c.comingSoon ?? false,
      specialtyId: specialtyId.get(c.specialty) ?? null,
      instructorId: (c.instructor ? instructorId.get(c.instructor) : undefined) ?? null,
      coverUrl: c.cover ? `${config.APP_URL}${c.cover}` : null,
      workloadHours: c.workloadHours ?? null,
      learningObjectives: c.learningObjectives ?? [],
      faq: c.faq ?? [],
    };
    // Em re-seed, opcionalmente preserva capa/instrutor já definidos no admin
    // (não sobrescreve esses campos; os demais continuam sincronizados pelo seed).
    const setScalars: Partial<typeof scalars> = { ...scalars };
    if (c.preserveCoverInstructor || c.preserveCover) {
      delete setScalars.coverUrl;
    }
    if (c.preserveCoverInstructor) {
      delete setScalars.instructorId;
    }
    const [course] = await db
      .insert(courses)
      .values({ slug: c.slug, publishedAt: new Date(), ...scalars })
      .onConflictDoUpdate({ target: courses.slug, set: setScalars })
      .returning({ id: courses.id });
    if (!course) continue;

    // Módulos/aulas: por padrão só popula quando o curso ainda não tem nenhum
    // (evita duplicar em re-seed). Com `replaceModules`, recria a grade a partir
    // do seed — apaga os módulos/aulas atuais e insere os do seed.
    const [hasModule] = await db
      .select({ id: courseModules.id })
      .from(courseModules)
      .where(eq(courseModules.courseId, course.id))
      .limit(1);
    if (hasModule && !c.replaceModules) continue;
    if (hasModule && c.replaceModules) {
      const existing = await db
        .select({ id: courseModules.id })
        .from(courseModules)
        .where(eq(courseModules.courseId, course.id));
      const ids = existing.map((m) => m.id);
      if (ids.length) {
        await db.delete(lessons).where(inArray(lessons.moduleId, ids));
        await db.delete(courseModules).where(eq(courseModules.courseId, course.id));
      }
    }
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
