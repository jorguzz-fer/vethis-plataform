import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SessionGuard } from '../auth/guards/session.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CouponsService } from './coupons.service';
import {
  createCouponSchema,
  updateCouponSchema,
  type AdminCouponDto,
  type CreateCouponDto,
  type UpdateCouponDto,
} from './dto';

/** Backoffice: cadastro de cupons (equipe e admin). */
@Controller({ path: 'admin/coupons', version: '1' })
@UseGuards(SessionGuard, RolesGuard)
@Roles('staff', 'admin')
export class CouponsAdminController {
  constructor(@Inject(CouponsService) private readonly coupons: CouponsService) {}

  @Get()
  list(): Promise<AdminCouponDto[]> {
    return this.coupons.list();
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createCouponSchema)) dto: CreateCouponDto,
  ): Promise<AdminCouponDto> {
    return this.coupons.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateCouponSchema)) dto: UpdateCouponDto,
  ): Promise<AdminCouponDto> {
    return this.coupons.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.coupons.remove(id);
  }
}
