import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, Res } from '@nestjs/common';
import {
  changePasswordSchema,
  disableTwoFactorSchema,
  enableTwoFactorSchema,
  loginSchema,
  loginTwoFactorSchema,
  updateProfileSchema,
  type ChangePasswordDto,
  type DisableTwoFactorDto,
  type EnableTwoFactorDto,
  type LoginDto,
  type LoginResultDto,
  type LoginTwoFactorDto,
  type RecoveryCodesDto,
  type TwoFactorSetupDto,
  type UpdateProfileDto,
  type UserDto,
} from '@patrimo/shared';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from '../../../common/infrastructure/http/pipes/zod-validation.pipe.js';
import { RateLimit } from '../../../common/infrastructure/http/rate-limit.decorator.js';
import { ChangePasswordService } from '../../application/change-password.service.js';
import { DisableTwoFactorService } from '../../application/disable-two-factor.service.js';
import { EnableTwoFactorService } from '../../application/enable-two-factor.service.js';
import { LoginTwoFactorService } from '../../application/login-two-factor.service.js';
import { LoginService } from '../../application/login.service.js';
import { LogoutService } from '../../application/logout.service.js';
import { SetupTwoFactorService } from '../../application/setup-two-factor.service.js';
import { UpdateProfileService } from '../../application/update-profile.service.js';
import { Authorize } from './authorize.decorator.js';
import { CurrentUser } from './current-user.decorator.js';
import { clearSessionCookie, readSessionCookie, writeSessionCookie } from './session-cookie.js';

const MINUTE = 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginService: LoginService,
    private readonly loginTwoFactorService: LoginTwoFactorService,
    private readonly logoutService: LogoutService,
    private readonly updateProfileService: UpdateProfileService,
    private readonly changePasswordService: ChangePasswordService,
    private readonly setupTwoFactorService: SetupTwoFactorService,
    private readonly enableTwoFactorService: EnableTwoFactorService,
    private readonly disableTwoFactorService: DisableTwoFactorService,
  ) {}

  // Essais de mot de passe sur un compte, et depuis une même machine. 2FA active : pas de session, un jeton pour l'étape suivante.
  @Post('login')
  @RateLimit({ by: 'email', limit: 10, windowMs: 15 * MINUTE }, { by: 'ip', limit: 50, windowMs: 15 * MINUTE })
  @HttpCode(HttpStatus.OK)
  async login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<LoginResultDto> {
    const result = await this.loginService.execute(dto);
    if ('challenge' in result) return { challenge: result.challenge };
    writeSessionCookie(res, result);
    return { user: result.user };
  }

  // Essais de codes 2FA depuis une même machine (en plus des 5 essais par jeton).
  @Post('login/2fa')
  @RateLimit({ by: 'ip', limit: 20, windowMs: 15 * MINUTE })
  @HttpCode(HttpStatus.OK)
  async loginTwoFactor(
    @Body(new ZodValidationPipe(loginTwoFactorSchema)) dto: LoginTwoFactorDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResultDto> {
    const session = await this.loginTwoFactorService.execute(dto);
    writeSessionCookie(res, session);
    return { user: session.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.logoutService.execute(readSessionCookie(req));
    clearSessionCookie(res);
  }

  @Get('me')
  @Authorize()
  me(@CurrentUser() user: UserDto): UserDto {
    return user;
  }

  @Patch('me')
  @Authorize()
  updateProfile(@CurrentUser() user: UserDto, @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileDto): Promise<UserDto> {
    return this.updateProfileService.execute(user, dto);
  }

  // Essais du mot de passe actuel : limite par IP, comme les autres routes qui testent un mot de passe.
  @Post('me/password')
  @Authorize()
  @RateLimit({ by: 'ip', limit: 10, windowMs: 15 * MINUTE })
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(@CurrentUser() user: UserDto, @Req() req: Request, @Body(new ZodValidationPipe(changePasswordSchema)) dto: ChangePasswordDto): Promise<void> {
    return this.changePasswordService.execute(user, readSessionCookie(req), dto);
  }

  @Post('me/2fa/setup')
  @Authorize()
  @HttpCode(HttpStatus.OK)
  setupTwoFactor(@CurrentUser() user: UserDto): Promise<TwoFactorSetupDto> {
    return this.setupTwoFactorService.execute(user);
  }

  @Post('me/2fa/enable')
  @Authorize()
  @RateLimit({ by: 'ip', limit: 20, windowMs: 15 * MINUTE })
  @HttpCode(HttpStatus.OK)
  enableTwoFactor(@CurrentUser() user: UserDto, @Body(new ZodValidationPipe(enableTwoFactorSchema)) dto: EnableTwoFactorDto): Promise<RecoveryCodesDto> {
    return this.enableTwoFactorService.execute(user, dto);
  }

  @Post('me/2fa/disable')
  @Authorize()
  @RateLimit({ by: 'ip', limit: 10, windowMs: 15 * MINUTE })
  @HttpCode(HttpStatus.NO_CONTENT)
  disableTwoFactor(@CurrentUser() user: UserDto, @Body(new ZodValidationPipe(disableTwoFactorSchema)) dto: DisableTwoFactorDto): Promise<void> {
    return this.disableTwoFactorService.execute(user, dto);
  }
}
