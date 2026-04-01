import {
  Model,
  Table,
  Column,
  PrimaryKey,
  AutoIncrement,
  DataType,
  CreatedAt,
  UpdatedAt
} from "sequelize-typescript";

@Table({
  tableName: "FlowExecutionLogs"
})
export default class FlowExecutionLog extends Model<FlowExecutionLog> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  ticket_id: number;

  @Column
  company_id: number;

  @Column
  flow_id: number | null;

  @Column
  node_id: string;

  @Column
  node_type: string;

  @Column
  event_type: string;

  @Column
  status: string;

  @Column(DataType.JSON)
  details: Record<string, unknown> | null;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
