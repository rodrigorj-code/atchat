import * as Yup from "yup";
import { Request, Response } from "express";
import AppError from "../errors/AppError";
import Invoices from "../models/Invoices";

import FindAllInvoiceService from "../services/InvoicesService/FindAllInvoiceService";
import ListInvoicesServices from "../services/InvoicesService/ListInvoicesServices";
import ShowInvoceService from "../services/InvoicesService/ShowInvoiceService";
import UpdateInvoiceService from "../services/InvoicesService/UpdateInvoiceService";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

type UpdateInvoiceData = {
  status: string;
  id?: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { invoices, count, hasMore } = await ListInvoicesServices({
    searchParam,
    pageNumber
  });

  return res.json({ invoices, count, hasMore });
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { Invoiceid } = req.params;
  const { companyId } = req.user;

  const invoice = await ShowInvoceService(Invoiceid, companyId);

  return res.status(200).json(invoice);
};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const invoice: Invoices[] = await FindAllInvoiceService(companyId);

  return res.status(200).json(invoice);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const InvoiceData: UpdateInvoiceData = req.body;
  const { id: paramId } = req.params;
  const { companyId } = req.user;

  const schema = Yup.object().shape({
    status: Yup.string().required()
  });

  try {
    await schema.validate(InvoiceData);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const { status } = InvoiceData;
  const id = paramId || InvoiceData.id;

  if (!id) {
    throw new AppError("ERR_INVOICE_ID_REQUIRED", 400);
  }

  const plan = await UpdateInvoiceService({
    id,
    status,
    companyId
  });

  return res.status(200).json(plan);
};
