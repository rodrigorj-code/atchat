import { sign } from "jsonwebtoken";
import authConfig from "../config/auth";
import User from "../models/User";

export type CreateAccessTokenOptions = {
  /** Empresa efetiva no JWT (modo suporte: tenant acedido). */
  supportTargetCompanyId?: number;
};

export const createAccessToken = (
  user: User,
  options?: CreateAccessTokenOptions
): string => {
  const { secret, expiresIn } = authConfig;

  const effectiveCompanyId =
    options?.supportTargetCompanyId !== undefined &&
    options.supportTargetCompanyId !== null
      ? options.supportTargetCompanyId
      : user.companyId;

  const payload: {
    usarname: string;
    profile: string;
    id: number;
    companyId: number;
    supportMode?: boolean;
    supportHomeCompanyId?: number;
  } = {
    usarname: user.name,
    profile: user.profile,
    id: user.id,
    companyId: effectiveCompanyId
  };

  if (
    options?.supportTargetCompanyId != null &&
    options.supportTargetCompanyId !== user.companyId
  ) {
    payload.supportMode = true;
    payload.supportHomeCompanyId = user.companyId;
  }

  return sign(payload, secret, {
    expiresIn
  });
};

export type CreateRefreshTokenOptions = {
  supportTargetCompanyId?: number | null;
};

export const createRefreshToken = (
  user: User,
  options?: CreateRefreshTokenOptions
): string => {
  const { refreshSecret, refreshExpiresIn } = authConfig;

  const payload: {
    id: number;
    tokenVersion: number;
    companyId: number;
    supportTargetCompanyId?: number;
  } = {
    id: user.id,
    tokenVersion: user.tokenVersion,
    companyId: user.companyId
  };

  if (options?.supportTargetCompanyId != null) {
    payload.supportTargetCompanyId = options.supportTargetCompanyId;
  }

  return sign(payload, refreshSecret, {
    expiresIn: refreshExpiresIn
  });
};
