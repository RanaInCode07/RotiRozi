import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const corsOrigins = configService
    .get<string>('CORS_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // ── Global prefix ─────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Global pipes ──────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // strip unknown properties
      forbidNonWhitelisted: true,
      transform: true,          // auto-transform payloads to DTO types
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global interceptors ───────────────────────────────────────────────────
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // ── Global exception filter ───────────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── Swagger (only in non-production) ──────────────────────────────────────
  const swaggerEnabled = configService.get<string>('SWAGGER_ENABLED', 'true');
  if (swaggerEnabled !== 'false') {
    const config = new DocumentBuilder()
      .setTitle('Restaurant POS SaaS API')
      .setDescription(
        'Multi-tenant Restaurant Management System — API Documentation',
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT',
      )
      .addTag('auth', 'Authentication & registration')
      .addTag('tenants', 'Tenant management (Super Admin)')
      .addTag('outlets', 'Outlet management')
      .addTag('users', 'User & staff management')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port);
  console.log(`\n🚀 POS Backend running at: http://localhost:${port}/api/v1`);
  if (swaggerEnabled !== 'false') {
    console.log(`📖 Swagger UI:             http://localhost:${port}/api\n`);
  }
}

bootstrap();
