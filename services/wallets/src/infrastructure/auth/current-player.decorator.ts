import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { KeycloakJwtPayload } from "./jwt.strategy";

export const CurrentPlayer = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{ user: KeycloakJwtPayload }>();
    return request.user.sub;
  },
);
