import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as path from 'path';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const dbUrl =
      process.env.DATABASE_URL ||
      `file:${path.join(__dirname, '..', '..', 'prisma', 'dev.db')}`;
    const adapter = new PrismaLibSql({ url: dbUrl });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
