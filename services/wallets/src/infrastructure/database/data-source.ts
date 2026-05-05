import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { WalletEntity } from "./wallet.entity";

export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [WalletEntity],
  migrations: [__dirname + "/migrations/*.{ts,js}"],
  migrationsTableName: "migrations",
  synchronize: false,
  logging: process.env.DB_LOGGING === "true",
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
