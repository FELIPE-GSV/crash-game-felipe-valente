import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { RoundEntity } from "./round.entity";
import { BetEntity } from "./bet.entity";

export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [RoundEntity, BetEntity],
  migrations: [__dirname + "/migrations/*.{ts,js}"],
  migrationsTableName: "migrations",
  synchronize: false,
  logging: process.env.DB_LOGGING === "true",
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
