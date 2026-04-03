import * as Yup from "yup";

/**
 * Fluxo PIX em 2 passos: plano + revisão. Validações de endereço/cartão não se aplicam.
 */
export default [Yup.object(), Yup.object()];
