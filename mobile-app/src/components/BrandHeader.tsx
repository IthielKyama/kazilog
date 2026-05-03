import { View, Text } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

export function BrandHeader() {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.brand,
        }}
      >
        <MapPin size={18} color="#ffffff" />
      </View>
      <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.5 }}>
        KaziLog
      </Text>
    </View>
  );
}
