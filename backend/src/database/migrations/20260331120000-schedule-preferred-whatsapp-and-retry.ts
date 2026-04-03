import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      await queryInterface.addColumn(
        "Schedules",
        "preferredWhatsappId",
        {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: "Whatsapps", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "SET NULL"
        },
        { transaction: t }
      );

      await queryInterface.addColumn(
        "Schedules",
        "lastError",
        {
          type: DataTypes.TEXT,
          allowNull: true
        },
        { transaction: t }
      );

      await queryInterface.addColumn(
        "Schedules",
        "lastAttemptAt",
        {
          type: DataTypes.DATE,
          allowNull: true
        },
        { transaction: t }
      );

      await queryInterface.addColumn(
        "Schedules",
        "attemptCount",
        {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        { transaction: t }
      );
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      await queryInterface.removeColumn("Schedules", "attemptCount", {
        transaction: t
      });
      await queryInterface.removeColumn("Schedules", "lastAttemptAt", {
        transaction: t
      });
      await queryInterface.removeColumn("Schedules", "lastError", {
        transaction: t
      });
      await queryInterface.removeColumn("Schedules", "preferredWhatsappId", {
        transaction: t
      });
    });
  }
};
