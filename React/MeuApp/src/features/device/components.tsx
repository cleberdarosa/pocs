import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/AppCard';
import { Icon, type IconName } from '@/components/Icon';
import { Colors, TextStyles } from '@/core/theme/appTheme';
import { DS } from '@/core/theme/designSystem';

interface PermissionHeaderProps {
  icon: IconName;
  title: string;
  description: string;
  status: string;
  statusIcon?: IconName;
}

export function PermissionHeader({
  icon,
  title,
  description,
  status,
  statusIcon,
}: PermissionHeaderProps) {
  return (
    <AppCard style={styles.header}>
      <Icon name={icon} size={64} color={Colors.primary} />
      <Text style={[TextStyles.titleMedium, styles.center]}>{title}</Text>
      <Text style={[TextStyles.body, styles.center]}>{description}</Text>
      <View style={styles.chip}>
        {statusIcon && <Icon name={statusIcon} size={18} color={Colors.primary} />}
        <Text style={styles.chipText}>{status}</Text>
      </View>
    </AppCard>
  );
}

export function MessageCard({ message }: { message: string }) {
  return (
    <AppCard style={styles.message}>
      <Icon name="info-outline" color={Colors.primary} />
      <Text style={[TextStyles.body, styles.flex]}>{message}</Text>
    </AppCard>
  );
}

export function formatPermissionStatus(
  status: { granted: boolean; canAskAgain: boolean; status: string } | null,
  extra?: { limited?: boolean; restricted?: boolean },
): string {
  if (!status) return 'Verificando...';
  if (extra?.limited) return 'Acesso limitado';
  if (status.granted) return 'Permitido';
  if (extra?.restricted) return 'Restrito pelo dispositivo';
  if (status.status === 'denied' && !status.canAskAgain) return 'Bloqueado permanentemente';
  return 'Não permitido';
}

export const isPermanentlyDenied = (
  status: { granted: boolean; canAskAgain: boolean } | null,
) => status != null && !status.granted && !status.canAskAgain;

export const deviceStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: DS.spaceLg,
    gap: DS.spaceMd,
  },
  preview: {
    height: 240,
    borderRadius: DS.radiusLg,
    marginVertical: DS.spaceSm,
  },
});

const styles = StyleSheet.create({
  header: {
    padding: DS.spaceLg,
    alignItems: 'center',
    gap: DS.spaceSm,
    marginBottom: DS.spaceSm,
  },
  center: {
    textAlign: 'center',
  },
  chip: {
    marginTop: DS.spaceSm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spaceXs,
    borderWidth: 1,
    borderColor: Colors.textMuted,
    borderRadius: DS.radiusSm,
    paddingHorizontal: DS.spaceMd - 4,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  message: {
    padding: DS.spaceMd,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spaceMd,
  },
  flex: {
    flex: 1,
  },
});
