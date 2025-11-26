import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class NotificationsService {
  private expo = new Expo();
  private readonly logger = new Logger(NotificationsService.name);

  async sendPushNotification(pushTokens: string[], title: string, body: string, data?: any) {
    const messages: ExpoPushMessage[] = [];
    for (const token of pushTokens) {
      if (!Expo.isExpoPushToken(token)) {
        console.error(`Token inválido: ${token}`);
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
    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await this.expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        this.logger.error('Error enviando notificaciones', error);
      }
    }
  }
}