import { BadRequestError } from "@/lib/errors";

export class NoCategoryError extends BadRequestError {
  constructor(message: string, code: string = "NO_CATEGORY_ERROR") {
    super(message);
    this.code = code;
    this.name = "NoCategoryError";
  }
}
