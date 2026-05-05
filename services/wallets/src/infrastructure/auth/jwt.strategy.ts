import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { passportJwtSecret } from "jwks-rsa";

export interface KeycloakJwtPayload {
  sub: string;
  preferred_username?: string;
  email?: string;
  iss: string;
  aud: string | string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const audience = process.env.KEYCLOAK_AUDIENCE;
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      ...(audience ? { audience } : {}),
      issuer: process.env.KEYCLOAK_ISSUER,
      algorithms: ["RS256"],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: process.env.KEYCLOAK_JWKS_URI ?? "",
      }),
    });
  }

  validate(payload: KeycloakJwtPayload): KeycloakJwtPayload {
    return payload;
  }
}
