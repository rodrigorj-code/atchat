import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const sequelize = queryInterface.sequelize;
    const [planRows] = await sequelize.query(
      `SELECT id FROM "Plans" WHERE name = 'Plano 1' LIMIT 1`
    );
    const planExists = Array.isArray(planRows) && planRows.length > 0;

    const [companyRows] = await sequelize.query(
      `SELECT id FROM "Companies" WHERE name = 'Empresa 1' LIMIT 1`
    );
    const companyExists = Array.isArray(companyRows) && companyRows.length > 0;

    if (!planExists) {
      await queryInterface.bulkInsert("Plans", [
        {
          name: "Plano 1",
          users: 10,
          connections: 10,
          queues: 10,
          value: 30,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    }

    if (!companyExists) {
      const [plans] = await sequelize.query(
        `SELECT id FROM "Plans" WHERE name = 'Plano 1' LIMIT 1`
      );
      const planId = Array.isArray(plans) && (plans as any[]).length > 0 ? (plans as any[])[0].id : 1;
      await queryInterface.bulkInsert("Companies", [
        {
          name: "Empresa 1",
          planId,
          dueDate: "2093-03-14 04:00:00+01",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.bulkDelete("Companies", {}),
      queryInterface.bulkDelete("Plans", {})
    ]);
  }
};
