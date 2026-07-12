import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InfraestructureModule } from './infraestructure/infraestructure.module';
import { AppController } from './app.controller';

@Module({
  imports: [ConfigModule.forRoot(), InfraestructureModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
