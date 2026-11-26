import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { AdminOnly, Auth, Client, Roles, type AuthContext, type ClientInfo } from "../common/decorators.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { CustomerDto, DirectionDto, NamedDto, PlaceDto, StageDto } from "./dto.js";
import { loadCargoOptions } from "./lists.js";
import { RegistryService } from "./registry.service.js";
import { searchCities, SearchService } from "./search.service.js";

const text = (value: unknown) => (typeof value === "string" ? value.slice(0, 100) : "");

/** Dados do dia a dia (clientes e locais), listas de apoio e as buscas enquanto se digita: Operação e administrador. */
@Roles("admin", "operacao")
@Controller()
export class OperationRegistryController {
  constructor(private readonly service: RegistryService, private readonly search: SearchService, private readonly prisma: PrismaService) {}

  @Get("options/cargo")
  options() {
    return loadCargoOptions(this.prisma);
  }

  @Get("search/places")
  searchPlaces(@Query("q") q: unknown) {
    return this.search.places(text(q));
  }

  @Get("search/cities")
  searchCities(@Query("q") q: unknown) {
    return searchCities(text(q));
  }

  @Get("search/customers")
  searchCustomers(@Query("q") q: unknown) {
    return this.search.customers(text(q));
  }

  @Get("registry/clientes")
  customers(@Query("q") q: unknown, @Query("page") page: unknown) {
    return this.service.customers(text(q), text(page));
  }

  @Post("registry/clientes") @HttpCode(204)
  createCustomer(@Auth() auth: AuthContext, @Body() body: CustomerDto, @Client() client: ClientInfo) {
    return this.service.saveCustomer(auth, null, body, client);
  }

  @Patch("registry/clientes/:id") @HttpCode(204)
  updateCustomer(@Auth() auth: AuthContext, @Param("id", ParseIntPipe) id: number, @Body() body: CustomerDto, @Client() client: ClientInfo) {
    return this.service.saveCustomer(auth, id, body, client);
  }

  @Delete("registry/clientes/:id") @HttpCode(204)
  removeCustomer(@Auth() auth: AuthContext, @Param("id", ParseIntPipe) id: number, @Client() client: ClientInfo) {
    return this.service.removeCustomer(auth, id, client);
  }

  @Get("registry/locais")
  places(@Query("q") q: unknown, @Query("page") page: unknown) {
    return this.service.places(text(q), text(page));
  }

  @Post("registry/locais") @HttpCode(204)
  createPlace(@Auth() auth: AuthContext, @Body() body: PlaceDto, @Client() client: ClientInfo) {
    return this.service.savePlace(auth, null, body, client);
  }

  @Patch("registry/locais/:id") @HttpCode(204)
  updatePlace(@Auth() auth: AuthContext, @Param("id", ParseIntPipe) id: number, @Body() body: PlaceDto, @Client() client: ClientInfo) {
    return this.service.savePlace(auth, id, body, client);
  }

  @Delete("registry/locais/:id") @HttpCode(204)
  removePlace(@Auth() auth: AuthContext, @Param("id", ParseIntPipe) id: number, @Client() client: ClientInfo) {
    return this.service.removePlace(auth, id, client);
  }
}

/** O que muda a estrutura do sistema: só o administrador. */
@AdminOnly()
@Controller("registry")
export class StructureRegistryController {
  constructor(private readonly service: RegistryService) {}

  @Get("etapas")
  stages() {
    return this.service.stages();
  }

  @Post("etapas") @HttpCode(204)
  createStage(@Auth() auth: AuthContext, @Body() body: StageDto, @Client() client: ClientInfo) {
    return this.service.createStage(auth, body, client);
  }

  @Patch("etapas/:key") @HttpCode(204)
  updateStage(@Auth() auth: AuthContext, @Param("key") key: string, @Body() body: StageDto, @Client() client: ClientInfo) {
    return this.service.updateStage(auth, key, body, client);
  }

  @Post("etapas/:key/move") @HttpCode(204)
  moveStage(@Auth() auth: AuthContext, @Param("key") key: string, @Body() body: DirectionDto, @Client() client: ClientInfo) {
    return this.service.moveStage(auth, key, body, client);
  }

  @Delete("etapas/:key") @HttpCode(204)
  removeStage(@Auth() auth: AuthContext, @Param("key") key: string, @Client() client: ClientInfo) {
    return this.service.removeStage(auth, key, client);
  }

  @Get("transportes")
  modes() {
    return this.service.modes();
  }

  @Post("transportes") @HttpCode(204)
  createMode(@Auth() auth: AuthContext, @Body() body: NamedDto, @Client() client: ClientInfo) {
    return this.service.saveMode(auth, null, body, client);
  }

  @Patch("transportes/:key") @HttpCode(204)
  updateMode(@Auth() auth: AuthContext, @Param("key") key: string, @Body() body: NamedDto, @Client() client: ClientInfo) {
    return this.service.saveMode(auth, key, body, client);
  }

  @Delete("transportes/:key") @HttpCode(204)
  removeMode(@Auth() auth: AuthContext, @Param("key") key: string, @Client() client: ClientInfo) {
    return this.service.removeMode(auth, key, client);
  }

  @Get("setores")
  departments() {
    return this.service.departments();
  }

  @Post("setores") @HttpCode(204)
  createDepartment(@Auth() auth: AuthContext, @Body() body: NamedDto, @Client() client: ClientInfo) {
    return this.service.saveDepartment(auth, null, body, client);
  }

  @Patch("setores/:id") @HttpCode(204)
  updateDepartment(@Auth() auth: AuthContext, @Param("id", ParseIntPipe) id: number, @Body() body: NamedDto, @Client() client: ClientInfo) {
    return this.service.saveDepartment(auth, id, body, client);
  }

  @Delete("setores/:id") @HttpCode(204)
  removeDepartment(@Auth() auth: AuthContext, @Param("id", ParseIntPipe) id: number, @Client() client: ClientInfo) {
    return this.service.removeDepartment(auth, id, client);
  }
}
