import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Companies", "timezone", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "America/Sao_Paulo"
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Companies", "timezone");
  }
};
