import {
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { APP_CONFIG, type AppConfig } from '../config/configuration';
import {
  AI_COURSE_DRAFT_JSON_SCHEMA,
  aiCourseDraftSchema,
  type AiCourseDraftDto,
  type AiCourseDraftInputDto,
} from './dto';

const SYSTEM_PROMPT = `Você é um(a) assistente de conteúdo da Vethis, uma plataforma de educação
médica veterinária continuada no Brasil. A partir do material bruto de um curso
(ementa, tópicos, transcrição de aula, anotações), você monta um rascunho da
página de venda do curso.

Regras:
- Escreva em português do Brasil, tom profissional e claro (não publicitário
  exagerado).
- Use SOMENTE informações apoiadas no material. NÃO invente números de mercado,
  salários, estatísticas, nomes de instituições ou promessas de resultado.
- "subtitle": uma linha curta que resume a proposta do curso.
- "description": 1 a 3 parágrafos descrevendo o curso e para quem é.
- "workloadHours": estimativa inteira de carga horária. Se o material indicar
  durações, some-as; senão, estime de forma conservadora pela quantidade de aulas.
- "learningObjectives": 4 a 8 objetivos de aprendizagem, cada um começando por um
  verbo no infinitivo.
- "faq": 4 a 6 perguntas frequentes com respostas honestas (acesso, certificado,
  metodologia, pré-requisitos). Nada de política de preço inventada.
- "modules": organize o conteúdo em módulos, cada um com aulas. "durationMinutes"
  é uma estimativa inteira por aula (use 0 se não houver base). Se o material já
  vier estruturado em módulos/aulas, preserve essa estrutura.`;

@Injectable()
export class AiService {
  private client: Anthropic | null = null;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  /** IA disponível apenas quando a chave está configurada no ambiente. */
  isEnabled(): boolean {
    return Boolean(this.config.ANTHROPIC_API_KEY);
  }

  private getClient(): Anthropic {
    if (!this.config.ANTHROPIC_API_KEY) {
      throw new ServiceUnavailableException(
        'Recurso de IA indisponível: configure ANTHROPIC_API_KEY.',
      );
    }
    if (!this.client) {
      this.client = new Anthropic({ apiKey: this.config.ANTHROPIC_API_KEY });
    }
    return this.client;
  }

  async draftCourse(dto: AiCourseDraftInputDto): Promise<AiCourseDraftDto> {
    const client = this.getClient();

    const userContent = [
      dto.title ? `Título provisório do curso: ${dto.title}` : null,
      'Material bruto do curso:',
      dto.material,
    ]
      .filter(Boolean)
      .join('\n\n');

    const response = await client.messages.create({
      model: this.config.AI_MODEL,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system: SYSTEM_PROMPT,
      output_config: {
        format: {
          type: 'json_schema',
          schema: AI_COURSE_DRAFT_JSON_SCHEMA,
        },
      },
      messages: [{ role: 'user', content: userContent }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    if (!text.trim()) {
      throw new UnprocessableEntityException('A IA não retornou um rascunho utilizável.');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new UnprocessableEntityException('A IA retornou um formato inesperado.');
    }

    const result = aiCourseDraftSchema.safeParse(parsed);
    if (!result.success) {
      throw new UnprocessableEntityException('O rascunho gerado não passou na validação.');
    }
    return result.data;
  }
}
