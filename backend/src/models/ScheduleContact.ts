import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  DataType,
  BelongsTo,
  ForeignKey
} from "sequelize-typescript";
import Schedule from "./Schedule";
import Contact from "./Contact";

@Table({ tableName: "ScheduleContacts" })
class ScheduleContact extends Model<ScheduleContact> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Schedule)
  @Column
  scheduleId: number;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @Column({ allowNull: true })
  lastSentAt: Date | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  lastError: string | null;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Schedule)
  schedule: Schedule;

  @BelongsTo(() => Contact)
  contact: Contact;
}

export default ScheduleContact;
