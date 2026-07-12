import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InfraestructureModule } from './infraestructure/infraestructure.module';

@Module({
  imports: [ConfigModule.forRoot(), InfraestructureModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
