import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AuditController } from "./audit/audit.controller.js";
import { DashboardService } from "./audit/dashboard.service.js";
import { AuthController } from "./auth/auth.controller.js";
import { CargoController, TrackingController } from "./cargo/cargo.controller.js";
import { CargoService } from "./cargo/cargo.service.js";
import { AuthService } from "./auth/auth.service.js";
import { SessionGuard } from "./auth/session.guard.js";
import { SessionService } from "./auth/session.service.js";
import { CoreModule } from "./common/core.module.js";
import { ContentController, PublicContentController, SettingsController, SiteContentController } from "./content/content.controller.js";
import { ContentService } from "./content/content.service.js";
import { SettingsService } from "./content/settings.service.js";
import { SiteService } from "./content/site.service.js";
import { InternalKeyGuard } from "./common/internal-key.guard.js";
import { CaptchaService } from "./forms/captcha.service.js";
import { FormsController } from "./forms/forms.controller.js";
import { FormsService } from "./forms/forms.service.js";
import { HealthController } from "./health/health.controller.js";
import { OperationRegistryController, StructureRegistryController } from "./registry/registry.controller.js";
import { RegistryService } from "./registry/registry.service.js";
import { SearchService } from "./registry/search.service.js";
import { UsersController } from "./users/users.controller.js";
import { UsersService } from "./users/users.service.js";

@Module({
  imports: [CoreModule],
  controllers: [HealthController, AuthController, UsersController, AuditController, FormsController, ContentController, SiteContentController, SettingsController, PublicContentController, CargoController, TrackingController, OperationRegistryController, StructureRegistryController],
  providers: [
    AuthService, SessionService, UsersService, CaptchaService, FormsService, ContentService, SiteService, SettingsService, CargoService, DashboardService, RegistryService, SearchService,
    // a ordem importa: primeiro a chave interna, depois a sessão
    { provide: APP_GUARD, useClass: InternalKeyGuard },
    { provide: APP_GUARD, useClass: SessionGuard },
  ],
})
export class AppModule {}
