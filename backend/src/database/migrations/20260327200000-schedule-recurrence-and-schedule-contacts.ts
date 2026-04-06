import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      await queryInterface.addColumn(
        "Schedules",
        "scheduleType",
        {
          type: DataTypes.STRING,
          allowNull: true
        },
        { transaction: t }
      );

      await queryInterface.addColumn(
        "Schedules",
        "recurrenceType",
        {
          type: DataTypes.STRING,
          allowNull: true
        },
        { transaction: t }
      );

      await queryInterface.addColumn(
        "Schedules",
        "recurrenceDaysOfWeek",
        {
          type: DataTypes.JSONB,
          allowNull: true
        },
        { transaction: t }
      );

      await queryInterface.addColumn(
        "Schedules",
        "recurrenceDayOfMonth",
        {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        { transaction: t }
      );

      await queryInterface.addColumn(
        "Schedules",
        "timeToSend",
        {
          type: DataTypes.STRING,
          allowNull: true
        },
        { transaction: t }
      );

      await queryInterface.addColumn(
        "Schedules",
        "lastRunAt",
        {
          type: DataTypes.DATE,
          allowNull: true
        },
        { transaction: t }
      );

      await queryInterface.addColumn(
        "Schedules",
        "nextRunAt",
        {
          type: DataTypes.DATE,
          allowNull: true
        },
        { transaction: t }
      );

      await queryInterface.addColumn(
        "Schedules",
        "isActive",
        {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        { transaction: t }
      );

      await queryInterface.createTable(
        "ScheduleContacts",
        {
          id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
          },
          scheduleId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Schedules", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE"
          },
          contactId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Contacts", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE"
          },
          lastSentAt: {
            type: DataTypes.DATE,
            allowNull: true
          },
          lastError: {
            type: DataTypes.TEXT,
            allowNull: true
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false
          }
        },
        { transaction: t }
      );

      await queryInterface.addConstraint(
        "ScheduleContacts",
        ["scheduleId", "contactId"],
        {
          type: "unique",
          name: "ScheduleContacts_scheduleId_contactId_unique",
          transaction: t
        }
      );

      await queryInterface.addIndex("ScheduleContacts", ["scheduleId"], {
        name: "ScheduleContacts_scheduleId_idx",
        transaction: t
      });

      await queryInterface.sequelize.query(
        `INSERT INTO "ScheduleContacts" ("scheduleId", "contactId", "createdAt", "updatedAt")
         SELECT s.id, s."contactId", NOW(), NOW()
         FROM "Schedules" s
         WHERE s."contactId" IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM "ScheduleContacts" sc
           WHERE sc."scheduleId" = s.id AND sc."contactId" = s."contactId"
         )`,
        { transaction: t }
      );
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      await queryInterface.dropTable("ScheduleContacts", { transaction: t });
      await queryInterface.removeColumn("Schedules", "isActive", { transaction: t });
      await queryInterface.removeColumn("Schedules", "nextRunAt", { transaction: t });
      await queryInterface.removeColumn("Schedules", "lastRunAt", { transaction: t });
      await queryInterface.removeColumn("Schedules", "timeToSend", { transaction: t });
      await queryInterface.removeColumn("Schedules", "recurrenceDayOfMonth", {
        transaction: t
      });
      await queryInterface.removeColumn("Schedules", "recurrenceDaysOfWeek", {
        transaction: t
      });
      await queryInterface.removeColumn("Schedules", "recurrenceType", { transaction: t });
      await queryInterface.removeColumn("Schedules", "scheduleType", { transaction: t });
    });
  }
};
