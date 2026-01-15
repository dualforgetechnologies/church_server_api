import { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';

export interface ErrorResult {
  code: number;
  message: string;
  meta?: Record<string, unknown>;
}

export function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientValidationError | Error | unknown
): ErrorResult {
  console.log('---handlePrismaError---', { error });

  // Known Prisma client errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const { code, meta } = error;

    switch (code) {
      case 'P2002': {
        const fields = (meta?.target as string[]) || [];
        return {
          code: StatusCodes.CONFLICT,
          message: `Unique constraint violation on: ${fields.join(', ')}`,
          meta: { fields },
        };
      }

      case 'P2003': {
        const model = meta?.modelName || 'UnknownModel';
        const constraint = meta?.constraint || 'unknown foreign key';
        return {
          code: StatusCodes.BAD_REQUEST,
          message: `Foreign key constraint failed on '${constraint}' (model: ${model}). Ensure the related record exists.`,
          meta: { model, constraint },
        };
      }

      case 'P2025': {
        return {
          code: StatusCodes.NOT_FOUND,
          message: 'Requested record does not exist.',
        };
      }

      default: {
        return {
          code: StatusCodes.INTERNAL_SERVER_ERROR,
          message: `Database error: ${error.message.replace(/\n/g, '')}`,
        };
      }
    }
  }

   // Prisma query validation errors (e.g., unknown argument)
  if (error instanceof Prisma.PrismaClientValidationError) {
    // Try to extract the unknown argument from the message
    const match = error.message.match(/Unknown argument `(.*?)`/);
    const unknownArg = match ? match[1] : null;

    return {
      code: StatusCodes.BAD_REQUEST,
      message: unknownArg
        ? `Invalid Prisma query: Unknown field '${unknownArg}'`
        : `Invalid Prisma query: ${error.message.replace(/\n/g, '')}`,
    };
  }


  if (error instanceof ZodError) {
    return {
      code: StatusCodes.BAD_REQUEST,
      message: 'Validation failed',
      meta: {
        issues: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
    };
  }

  // JS errors
  if (error instanceof Error) {
    return {
      code: StatusCodes.INTERNAL_SERVER_ERROR,
      message: error.message,
    };
  }

  // Fallback for unknown errors
  return {
    code: StatusCodes.INTERNAL_SERVER_ERROR,
    message: 'An unknown error occurred.',
  };
}
