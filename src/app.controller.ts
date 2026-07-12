import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class AppController {
  @Get()
  getHealth() {
    return { status: 'ok', version: 'deploy-test', date: '2026-07-12' };
  }
}
