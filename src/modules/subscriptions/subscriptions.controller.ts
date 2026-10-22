import { Controller, Get } from "@nestjs/common";
import { SubscriptionsService } from "./subscriptions.service";

@Controller("modules")
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Get()
  findActiveModules() {
    return this.subscriptionsService.findActiveModules();
  }
}