import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { loginSchema, signupSchema, type LoginDto, type SignupDto, type UserDto } from '@pea/shared';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from '../../../common/infrastructure/http/pipes/zod-validation.pipe.js';
import { RateLimit } from '../../../common/infrastructure/http/rate-limit.decorator.js';
import { LoginService } from '../../application/login.service.js';
import { LogoutService } from '../../application/logout.service.js';
import { SignupService } from '../../application/signup.service.js';
import { Authorize } from './authorize.decorator.js';
import { CurrentUser } from './current-user.decorator.js';
import { clearSessionCookie, readSessionCookie, writeSessionCookie } from './session-cookie.js';

const MINUTE = 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly signupService: SignupService,
    private readonly loginService: LoginService,
    private readonly logoutService: LogoutService,
  ) {}

  @Post('signup')
  @RateLimit({ by: 'ip', limit: 10, windowMs: 60 * MINUTE })
  async signup(@Body(new ZodValidationPipe(signupSchema)) dto: SignupDto, @Res({ passthrough: true }) res: Response): Promise<UserDto> {
    const session = await this.signupService.execute(dto);
    writeSessionCookie(res, session);
    return session.user;
  }

  // Essais de mot de passe sur un compte, et depuis une même machine.
  @Post('login')
  @RateLimit({ by: 'email', limit: 10, windowMs: 15 * MINUTE }, { by: 'ip', limit: 50, windowMs: 15 * MINUTE })
  @HttpCode(HttpStatus.OK)
  async login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<UserDto> {
    const session = await this.loginService.execute(dto);
    writeSessionCookie(res, session);
    return session.user;
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
}
