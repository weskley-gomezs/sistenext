import React, { useEffect, useRef } from 'react';
import { AgendaItem } from '../types';
import { NotificationService } from '../utils/notificationService';

interface NotificationManagerProps {
  agenda: AgendaItem[];
}

export function NotificationManager({ agenda }: NotificationManagerProps) {
  const sentNotifications = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkAgenda = () => {
      if (NotificationService.permission !== 'granted') return;

      const now = new Date();
      
      agenda.forEach((item) => {
        if (item.status === 'Concluído' || item.status === 'Cancelado') return;

        const [year, month, day] = item.date.split('-').map(Number);
        const [hours, minutes] = item.time.split(':').map(Number);
        
        const meetingDate = new Date(year, month - 1, day, hours, minutes);
        const diffMs = meetingDate.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));

        // Notificar se faltar 5 minutos ou se for a hora exata (até 1 minuto depois)
        // E se não tivermos notificado ainda para este item
        const notificationId = `${item.id}-${diffMins <= 5 ? 'upcoming' : 'now'}`;

        if (diffMins >= 0 && diffMins <= 5 && !sentNotifications.current.has(notificationId)) {
          const title = diffMins === 0 ? 'Compromisso Agora!' : `Compromisso em ${diffMins} min`;
          const body = `${item.title}${item.relatedEntity !== 'Geral' ? ` - ${item.relatedEntity}` : ''}\nHorário: ${item.time}`;
          
          NotificationService.send(title, {
            body,
            tag: item.id, // Substitui notificações anteriores do mesmo item
            requireInteraction: true,
          });

          sentNotifications.current.add(notificationId);
        }
      });
    };

    // Check immediately and then every minute
    checkAgenda();
    const interval = setInterval(checkAgenda, 60000);

    return () => clearInterval(interval);
  }, [agenda]);

  return null; // Componente puramente lógico
}
