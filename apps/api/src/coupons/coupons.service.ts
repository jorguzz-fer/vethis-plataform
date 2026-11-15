import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, inArray, isNull, ne, sql } from 'drizzle-orm';
import { DB, type Database } from '../db/client';
import { couponCourses, coupons, type Coupon } from '../db/schema';
import { COUPON_PROBLEM_MESSAGE, couponProblem, endOfDaySaoPaulo } from './coupon-pricing';
import type { AdminCouponDto, CreateCouponDto, UpdateCouponDto } from './dto';

/** Cupons de desconto: CRUD do backoffice e validação/uso no checkout. */
@Injectable()
export class CouponsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async list(): Promise<AdminCouponDto[]> {
    const rows = await this.db
      .select()
      .from(coupons)
      .where(isNull(coupons.deletedAt))
      .orderBy(desc(coupons.createdAt));
    const links = rows.length
      ? await this.db
          .select()
          .from(couponCourses)
          .where(
            inArray(
              couponCourses.couponId,
              rows.map((r) => r.id),
            ),
          )
      : [];
    return rows.map((r) =>
      toDto(
        r,
        links.filter((l) => l.couponId === r.id).map((l) => l.courseId),
      ),
    );
  }

  async create(dto: CreateCouponDto): Promise<AdminCouponDto> {
    await this.assertCodeFree(dto.code);
    const id = await this.db
      .transaction(async (tx) => {
        const [row] = await tx
          .insert(coupons)
          .values({
            code: dto.code,
            discountType: dto.discountType,
            discountValue: dto.discountValue,
            appliesToAllCourses: dto.appliesToAllCourses,
            maxUses: dto.maxUses,
            expiresAt: dto.expiresAt ? endOfDaySaoPaulo(dto.expiresAt) : null,
            active: dto.active,
          })
          .returning({ id: coupons.id });
        if (!row) throw new BadRequestException('Falha ao criar o cupom');
        if (!dto.appliesToAllCourses && dto.courseIds.length) {
          await tx
            .insert(couponCourses)
            .values(
              [...new Set(dto.courseIds)].map((courseId) => ({ couponId: row.id, courseId })),
            );
        }
        return row.id;
      })
      .catch(rethrowUnique);
    return this.get(id);
  }

  async update(id: string, dto: UpdateCouponDto): Promise<AdminCouponDto> {
    const current = await this.load(id);
    if (dto.code && dto.code !== current.code) await this.assertCodeFree(dto.code, id);
    const appliesToAll = dto.appliesToAllCourses ?? current.appliesToAllCourses;
    const type = dto.discountType ?? current.discountType;
    const value = dto.discountValue ?? current.discountValue;
    if (type === 'percent' && value > 100) {
      throw new BadRequestException('Percentual máximo é 100%');
    }
    await this.db
      .transaction(async (tx) => {
        await tx
          .update(coupons)
          .set({
            ...(dto.code !== undefined ? { code: dto.code } : {}),
            ...(dto.discountType !== undefined ? { discountType: dto.discountType } : {}),
            ...(dto.discountValue !== undefined ? { discountValue: dto.discountValue } : {}),
            ...(dto.appliesToAllCourses !== undefined
              ? { appliesToAllCourses: dto.appliesToAllCourses }
              : {}),
            ...(dto.maxUses !== undefined ? { maxUses: dto.maxUses } : {}),
            ...(dto.expiresAt !== undefined
              ? { expiresAt: dto.expiresAt ? endOfDaySaoPaulo(dto.expiresAt) : null }
              : {}),
            ...(dto.active !== undefined ? { active: dto.active } : {}),
            updatedAt: new Date(),
          })
          .where(eq(coupons.id, id));
        // Cursos: substitui a lista quando ela (ou o "todos") muda.
        if (dto.courseIds !== undefined || dto.appliesToAllCourses !== undefined) {
          await tx.delete(couponCourses).where(eq(couponCourses.couponId, id));
          const ids = appliesToAll ? [] : [...new Set(dto.courseIds ?? [])];
          if (ids.length) {
            await tx
              .insert(couponCourses)
              .values(ids.map((courseId) => ({ couponId: id, courseId })));
          }
        }
      })
      .catch(rethrowUnique);
    if (!appliesToAll) {
      const [count] = await this.db
        .select({ n: sql<number>`count(*)::int` })
        .from(couponCourses)
        .where(eq(couponCourses.couponId, id));
      if (!count?.n) {
        throw new BadRequestException('Escolha ao menos um curso ou marque "Todos os cursos"');
      }
    }
    return this.get(id);
  }

  /** Exclusão lógica: o código fica livre e pedidos antigos mantêm a referência. */
  async remove(id: string): Promise<void> {
    await this.load(id);
    await this.db
      .update(coupons)
      .set({ deletedAt: new Date(), active: false, updatedAt: new Date() })
      .where(eq(coupons.id, id));
  }

  /**
   * Cupom utilizável agora neste curso, ou 400 com o motivo (mensagem pronta
   * para o checkout). O limite de usos conta só pedidos pagos.
   */
  async findUsable(code: string, courseId: string): Promise<Coupon> {
    const normalized = code.trim().toUpperCase();
    const [coupon] = await this.db
      .select()
      .from(coupons)
      .where(and(eq(coupons.code, normalized), isNull(coupons.deletedAt)))
      .limit(1);
    if (!coupon) throw new BadRequestException(COUPON_PROBLEM_MESSAGE.not_found);
    let courseAllowed = coupon.appliesToAllCourses;
    if (!courseAllowed) {
      const [link] = await this.db
        .select({ courseId: couponCourses.courseId })
        .from(couponCourses)
        .where(and(eq(couponCourses.couponId, coupon.id), eq(couponCourses.courseId, courseId)))
        .limit(1);
      courseAllowed = Boolean(link);
    }
    const problem = couponProblem(coupon, courseAllowed);
    if (problem) throw new BadRequestException(COUPON_PROBLEM_MESSAGE[problem]);
    return coupon;
  }

  /** Conta um uso (pedido pago). Idempotência fica a cargo de quem confirma o pedido. */
  async redeem(couponId: string): Promise<void> {
    await this.db
      .update(coupons)
      .set({ usedCount: sql`${coupons.usedCount} + 1`, updatedAt: new Date() })
      .where(eq(coupons.id, couponId));
  }

  private async get(id: string): Promise<AdminCouponDto> {
    const row = await this.load(id);
    const links = await this.db
      .select({ courseId: couponCourses.courseId })
      .from(couponCourses)
      .where(eq(couponCourses.couponId, id));
    return toDto(
      row,
      links.map((l) => l.courseId),
    );
  }

  private async load(id: string): Promise<Coupon> {
    const [row] = await this.db
      .select()
      .from(coupons)
      .where(and(eq(coupons.id, id), isNull(coupons.deletedAt)))
      .limit(1);
    if (!row) throw new NotFoundException('Cupom não encontrado');
    return row;
  }

  private async assertCodeFree(code: string, exceptId?: string): Promise<void> {
    const [taken] = await this.db
      .select({ id: coupons.id })
      .from(coupons)
      .where(
        and(
          eq(coupons.code, code),
          isNull(coupons.deletedAt),
          ...(exceptId ? [ne(coupons.id, exceptId)] : []),
        ),
      )
      .limit(1);
    if (taken) throw new ConflictException(`Já existe um cupom com o código ${code}`);
  }
}

function toDto(row: Coupon, courseIds: string[]): AdminCouponDto {
  return {
    id: row.id,
    code: row.code,
    discountType: row.discountType,
    discountValue: row.discountValue,
    appliesToAllCourses: row.appliesToAllCourses,
    courseIds: row.appliesToAllCourses ? [] : courseIds,
    maxUses: row.maxUses,
    usedCount: row.usedCount,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Corrida entre dois cadastros com o mesmo código: o índice único decide. */
function rethrowUnique(err: unknown): never {
  const code =
    (err as { code?: string; cause?: { code?: string } })?.code ??
    (err as { cause?: { code?: string } })?.cause?.code;
  if (code === '23505') throw new ConflictException('Já existe um cupom com este código');
  throw err;
}
