import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  AutoIncrement,
  DataType
} from "sequelize-typescript";
import Company from "./Company";

export interface RatingOption {
  name: string;
  value: number;
}

@Table({
  tableName: "RatingTemplates"
})
class RatingTemplate extends Model<RatingTemplate> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @Column
  name: string;

  @Column(DataType.TEXT)
  message: string;

  @Column(DataType.JSON)
  options: RatingOption[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default RatingTemplate;
