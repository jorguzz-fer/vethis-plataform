import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from '../auth/guards/session.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ChannelsService } from './channels.service';
import {
  createChannelRuleSchema,
  createChannelSchema,
  updateChannelRuleSchema,
  updateChannelSchema,
  type ChannelDto,
  type CreateChannelDto,
  type CreateChannelRuleDto,
  type LeadsFlowDto,
  type UnmappedOriginDto,
  type UpdateChannelDto,
  type UpdateChannelRuleDto,
} from './dto';

/** Gestão de canais de aquisição (staff/admin). */
@Controller({ path: 'admin/channels', version: '1' })
@UseGuards(SessionGuard, RolesGuard)
@Roles('staff', 'admin')
export class ChannelsController {
  constructor(@Inject(ChannelsService) private readonly channels: ChannelsService) {}

  @Get()
  list(): Promise<ChannelDto[]> {
    return this.channels.listChannels();
  }

  @Get('leads-flow')
  leadsFlow(@Query('from') from?: string, @Query('to') to?: string): Promise<LeadsFlowDto> {
    return this.channels.getLeadsFlow({ from, to });
  }

  @Get('unmapped-origins')
  unmapped(@Query('from') from?: string, @Query('to') to?: string): Promise<UnmappedOriginDto[]> {
    return this.channels.getUnmappedOrigins({ from, to });
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createChannelSchema)) dto: CreateChannelDto,
  ): Promise<ChannelDto> {
    return this.channels.createChannel(dto);
  }

  @Patch('rules/:ruleId')
  updateRule(
    @Param('ruleId') ruleId: string,
    @Body(new ZodValidationPipe(updateChannelRuleSchema)) dto: UpdateChannelRuleDto,
  ): Promise<ChannelDto> {
    return this.channels.updateRule(ruleId, dto);
  }

  @Delete('rules/:ruleId')
  @HttpCode(200)
  deleteRule(@Param('ruleId') ruleId: string): Promise<ChannelDto> {
    return this.channels.deleteRule(ruleId);
  }

  @Post(':id/rules')
  addRule(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createChannelRuleSchema)) dto: CreateChannelRuleDto,
  ): Promise<ChannelDto> {
    return this.channels.addRule(id, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateChannelSchema)) dto: UpdateChannelDto,
  ): Promise<ChannelDto> {
    return this.channels.updateChannel(id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id') id: string): Promise<{ ok: true }> {
    return this.channels.deleteChannel(id);
  }
}
