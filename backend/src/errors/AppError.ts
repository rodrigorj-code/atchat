class AppError {
  public readonly message: string;

  public readonly statusCode: number;

  /** Mensagem opcional para o cliente (ex.: detalhe legível); o campo `error` usa `message` (código). */
  public readonly clientMessage?: string;

  constructor(message: string, statusCode = 400, clientMessage?: string) {
    this.message = message;
    this.statusCode = statusCode;
    this.clientMessage = clientMessage;
  }
}

export default AppError;
