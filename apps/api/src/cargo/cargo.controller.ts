import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { Auth, Client, Public, Roles, type AuthContext, type ClientInfo } from "../common/decorators.js";
import { CargoService } from "./cargo.service.js";
import { CargoDto, CargoEventDto, TrackDto } from "./dto.js";

/** Cadastro e andamento das cargas: equipe de Operação e administrador. */
@Roles("admin", "operacao")
@Controller("cargo")
export class CargoController {
  constructor(private readonly service: CargoService) {}

  @Get()
  list(@Query("q") query: unknown, @Query("stage") stage: unknown) {
    return this.service.list(typeof query === "string" ? query : "", typeof stage === "string" ? stage : "");
  }

  @Get(":id")
  get(@Param("id", ParseIntPipe) id: number) {
    return this.service.get(id);
  }

  @Post()
  create(@Auth() auth: AuthContext, @Body() body: CargoDto, @Client() client: ClientInfo) {
    return this.service.create(auth, body, client);
  }

  @Patch(":id") @HttpCode(204)
  update(@Auth() auth: AuthContext, @Param("id", ParseIntPipe) id: number, @Body() body: CargoDto, @Client() client: ClientInfo) {
    return this.service.update(auth, id, body, client);
  }

  @Post(":id/events") @HttpCode(204)
  addEvent(@Auth() auth: AuthContext, @Param("id", ParseIntPipe) id: number, @Body() body: CargoEventDto, @Client() client: ClientInfo) {
    return this.service.addEvent(auth, id, body, client);
  }

  @Delete(":id/events/:eventId") @HttpCode(204)
  removeEvent(@Auth() auth: AuthContext, @Param("id", ParseIntPipe) id: number, @Param("eventId", ParseIntPipe) eventId: number, @Client() client: ClientInfo) {
    return this.service.removeEvent(auth, id, eventId, client);
  }

  @Delete(":id") @HttpCode(204)
  remove(@Auth() auth: AuthContext, @Param("id", ParseIntPipe) id: number, @Client() client: ClientInfo) {
    return this.service.remove(auth, id, client);
  }
}

/** Consulta do cliente. É POST para o CNPJ/CPF não ficar em endereços e registros de acesso. */
@Public()
@Controller("public/tracking")
export class TrackingController {
  constructor(private readonly service: CargoService) {}

  @Post() @HttpCode(200)
  track(@Body() body: TrackDto, @Client() client: ClientInfo) {
    return this.service.track(body.code, body.document, client);
  }
}
