import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("FlowExecutionLogs", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      ticket_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Tickets", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      flow_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      node_id: {
        type: DataTypes.STRING(64),
        allowNull: false,
        defaultValue: ""
      },
      node_type: {
        type: DataTypes.STRING(64),
        allowNull: false,
        defaultValue: ""
      },
      event_type: {
        type: DataTypes.STRING(64),
        allowNull: false
      },
      status: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: "ok"
      },
      details: {
        type: DataTypes.JSON,
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
    }).then(() =>
      queryInterface.addIndex("FlowExecutionLogs", ["ticket_id", "createdAt"], {
        name: "FlowExecutionLogs_ticket_created_idx"
      })
    ).then(() =>
      queryInterface.addIndex("FlowExecutionLogs", ["company_id", "createdAt"], {
        name: "FlowExecutionLogs_company_created_idx"
      })
    );
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable("FlowExecutionLogs");
  }
};
