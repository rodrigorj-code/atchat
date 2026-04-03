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
import Company from "./Company";
import Contact from "./Contact";
import Ticket from "./Ticket";
import User from "./User";
import Whatsapp from "./Whatsapp";

@Table
class Schedule extends Model<Schedule> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column(DataType.TEXT)
  body: string;

  @Column
  sendAt: Date;

  @Column
  sentAt: Date;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @ForeignKey(() => Ticket)
  @Column
  ticketId: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @ForeignKey(() => Whatsapp)
  @Column({ allowNull: true })
  preferredWhatsappId: number | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  lastError: string | null;

  @Column({ allowNull: true })
  lastAttemptAt: Date | null;

  @Column({ defaultValue: 0 })
  attemptCount: number;

  @Column(DataType.STRING)
  status: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @Column
  mediaPath: string;

  @Column
  mediaName: string;

  @BelongsTo(() => Contact, "contactId")
  contact: Contact;

  @BelongsTo(() => Ticket)
  ticket: Ticket;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Company)
  company: Company;

  @BelongsTo(() => Whatsapp)
  preferredWhatsapp: Whatsapp;
}


export default Schedule;
