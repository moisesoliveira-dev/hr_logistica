import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { AdminOnly, Auth, Client, type AuthContext, type ClientInfo } from "../common/decorators.js";
import { CreateUserDto, ProfileDto, StatusDto } from "./dto.js";
import { UsersService } from "./users.service.js";

@AdminOnly()
@Controller("users")
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  list(@Query("q") q: unknown, @Query("role") role: unknown, @Query("status") status: unknown, @Query("page") page: unknown) {
    const text = (value: unknown) => (typeof value === "string" ? value.slice(0, 100) : "");
    return this.service.list({ q: text(q), role: text(role), status: text(status), page: text(page) });
  }

  @Post()
  create(@Auth() auth: AuthContext, @Body() body: CreateUserDto, @Client() client: ClientInfo) {
    return this.service.create(auth, body, client);
  }

  @Patch(":id") @HttpCode(204)
  update(@Auth() auth: AuthContext, @Param("id", ParseIntPipe) id: number, @Body() body: ProfileDto, @Client() client: ClientInfo) {
    return this.service.update(auth, id, body, client);
  }

  @Post(":id/status") @HttpCode(204)
  status(@Auth() auth: AuthContext, @Param("id", ParseIntPipe) id: number, @Body() body: StatusDto, @Client() client: ClientInfo) {
    return this.service.setStatus(auth, id, body.active, client);
  }

  @Post(":id/temporary-password") @HttpCode(200)
  temporaryPassword(@Auth() auth: AuthContext, @Param("id", ParseIntPipe) id: number, @Client() client: ClientInfo) {
    return this.service.temporaryPassword(auth, id, client);
  }

  @Post(":id/unlock") @HttpCode(204)
  unlock(@Auth() auth: AuthContext, @Param("id", ParseIntPipe) id: number, @Client() client: ClientInfo) {
    return this.service.unlock(auth, id, client);
  }
}
