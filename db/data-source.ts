import { DataSource, DataSourceOptions } from 'typeorm';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: 'postgresql://chatt_bd_user:GaR6KfPtfCAcoE9XhWtn99DhYpvjHEbD@dpg-cqr7mljv2p9s73bfhb8g-a.frankfurt-postgres.render.com/chatt_bd',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/db/migrations/*.js'],
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
