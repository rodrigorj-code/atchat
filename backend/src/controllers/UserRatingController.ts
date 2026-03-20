import { Request, Response } from "express";
import { Op } from "sequelize";
import ListUserRatingsService from "../services/UserRatingServices/ListUserRatingsService";
import DashboardDataService from "../services/ReportService/DashbardDataService";
import UserRating from "../models/UserRating";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { pageNumber, limit, dateFrom, dateTo, userId } = req.query;

  const { ratings, count, hasMore } = await ListUserRatingsService({
    companyId,
    pageNumber: pageNumber ? parseInt(String(pageNumber), 10) : 1,
    limit: limit ? parseInt(String(limit), 10) : 50,
    dateFrom: dateFrom ? String(dateFrom) : undefined,
    dateTo: dateTo ? String(dateTo) : undefined,
    userId: userId ? parseInt(String(userId), 10) : undefined,
  });

  return res.status(200).json({ ratings, count, hasMore });
};

export const summary = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { dateFrom, dateTo } = req.query;

  const params: any = {};
  if (dateFrom) params.date_from = String(dateFrom);
  if (dateTo) params.date_to = String(dateTo);
  if (!dateFrom && !dateTo) params.days = 30;

  const dashboardData = await DashboardDataService(companyId, params);
  const attendants = dashboardData.attendants || [];

  let ratingDateFrom: string | null = null;
  let ratingDateTo: string | null = null;
  if (params.date_from) ratingDateFrom = `${params.date_from} 00:00:00`;
  if (params.date_to) ratingDateTo = `${params.date_to} 23:59:59`;
  if (!ratingDateFrom && !ratingDateTo && params.days) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - params.days);
    ratingDateFrom = start.toISOString().slice(0, 10) + " 00:00:00";
    ratingDateTo = end.toISOString().slice(0, 10) + " 23:59:59";
  }

  const ratingWhere: any = { companyId };
  if (ratingDateFrom || ratingDateTo) {
    ratingWhere.createdAt = {};
    if (ratingDateFrom) ratingWhere.createdAt[Op.gte] = ratingDateFrom;
    if (ratingDateTo) ratingWhere.createdAt[Op.lte] = ratingDateTo;
  }

  const totalRatings = await UserRating.count({ where: ratingWhere });

  const avgRating =
    attendants.length > 0
      ? (
          attendants.reduce((s: number, a: any) => s + (Number(a.rating) || 0), 0) /
          attendants.length
        ).toFixed(1)
      : "0.0";

  return res.status(200).json({
    attendants,
    avgRating,
    totalRatings,
  });
};
