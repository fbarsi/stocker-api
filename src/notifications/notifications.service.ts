import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

@Injectable()
export class NotificationsService {
  private expo = new Expo();
  private readonly logger = new Logger(NotificationsService.name);

  async sendPushNotification(pushTokens: string[], title: string, body: string, data?: any) {
    console.log("📨 [Service] Iniciando envío a:", pushTokens);

    const messages: ExpoPushMessage[] = [];
    for (const token of pushTokens) {
      // Chequeo estricto de Expo
      if (!Expo.isExpoPushToken(token)) {
        console.error(`⛔ [Service] Token inválido detectado y descartado: ${token}`);
        continue;
      }
      messages.push({
        to: token,
        sound: 'default',
        title,
        body,
        data,
      });
    }

    this.logger.log(`📦 Enviando ${messages.length} mensajes a Expo...`);

    const chunks = this.expo.chunkPushNotifications(messages);
    
    // CORRECCIÓN AQUÍ: Definimos el tipo explícitamente
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('❌ [Service] Error enviando a Expo:', error);
      }
    }
    return tickets;
  }
}