import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import type { SessionInfo } from "@hr/shared";
import { AllowPendingPassword, Auth, Client, Public, type AuthContext, type ClientInfo } from "../common/decorators.js";
import { AuthService } from "./auth.service.js";
import { ChangePasswordDto, ForgotDto, LoginDto, ResetDto } from "./dto.js";
import { toSessionUser } from "./session.service.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public() @Post("login") @HttpCode(200)
  login(@Body() body: LoginDto, @Client() client: ClientInfo) {
    return this.service.login(body, client);
  }

  @AllowPendingPassword() @Post("logout") @HttpCode(204)
  logout(@Auth() auth: AuthContext, @Client() client: ClientInfo) {
    return this.service.logout(auth, client);
  }

  @AllowPendingPassword() @Get("session")
  session(@Auth() auth: AuthContext): SessionInfo {
    return { sessionId: auth.sessionId, remember: auth.remember, user: toSessionUser(auth.user) };
  }

  @Public() @Post("password/forgot") @HttpCode(204)
  forgot(@Body() body: ForgotDto, @Client() client: ClientInfo) {
    return this.service.forgot(body, client);
  }

  @Public() @Post("password/reset") @HttpCode(204)
  reset(@Body() body: ResetDto, @Client() client: ClientInfo) {
    return this.service.reset(body, client);
  }

  @AllowPendingPassword() @Post("password/change") @HttpCode(200)
  change(@Auth() auth: AuthContext, @Body() body: ChangePasswordDto, @Client() client: ClientInfo) {
    return this.service.changePassword(auth, body, client);
  }

  @Get("sessions")
  sessions(@Auth() auth: AuthContext) {
    return this.service.listSessions(auth);
  }

  @Delete("sessions") @HttpCode(204)
  revokeOthers(@Auth() auth: AuthContext, @Client() client: ClientInfo) {
    return this.service.revokeSessions(auth, client);
  }

  @Delete("sessions/:id") @HttpCode(204)
  revokeOne(@Auth() auth: AuthContext, @Client() client: ClientInfo, @Param("id", ParseUUIDPipe) id: string) {
    return this.service.revokeSessions(auth, client, id);
  }
}
