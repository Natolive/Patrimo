import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, type OnGatewayConnection, type OnGatewayDisconnect } from '@nestjs/websockets';
import { streamSubscribeSchema } from '@patrimo/shared';
import type { IncomingMessage } from 'node:http';
import type { WebSocket } from 'ws';
import { AuthenticateService } from '../../../auth/application/authenticate.service.js';
import { readSessionCookie } from '../../../auth/infrastructure/http/session-cookie.js';
import { StreamPricesService } from '../../application/stream-prices.service.js';

// WebSocket `/stream` : le navigateur envoie `subscribe` avec ses valeurs, le serveur pousse un `tick` à chaque cotation.
@WebSocketGateway({ path: '/stream' })
export class PricesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // Session vérifiée à l'ouverture ; un `subscribe` arrivé avant la réponse l'attend.
  private readonly allowed = new WeakMap<WebSocket, Promise<boolean>>();
  private readonly stops = new Map<WebSocket, () => void>();

  constructor(
    private readonly authenticate: AuthenticateService,
    private readonly streamPrices: StreamPricesService,
  ) {}

  handleConnection(client: WebSocket, req: IncomingMessage) {
    // Pas de CORS pour un WebSocket : sans ce contrôle, un autre site ouvrirait la connexion avec le cookie de session.
    const allowed =
      req.headers.origin === process.env.CORS_ORIGIN
        ? this.authenticate.execute(readSessionCookie(req)).then(
            () => true,
            () => false,
          )
        : Promise.resolve(false);
    this.allowed.set(client, allowed);
    void allowed.then((ok) => ok || client.close(4401, 'Session expirée'));
  }

  handleDisconnect(client: WebSocket) {
    this.stops.get(client)?.();
    this.stops.delete(client);
  }

  @SubscribeMessage('subscribe')
  async subscribe(@ConnectedSocket() client: WebSocket, @MessageBody() body: unknown) {
    const parsed = streamSubscribeSchema.safeParse(body);
    if (!parsed.success || !(await this.allowed.get(client))) return;
    this.stops.get(client)?.();
    this.stops.set(
      client,
      this.streamPrices.execute(parsed.data, (tick) => client.send(JSON.stringify({ event: 'tick', data: tick }))),
    );
  }
}
