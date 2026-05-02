import { Image, View } from 'react-native';

export function BrandHeader() {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 220 }}>
      <Image
        source={require('../../assets/kazilog-horizontal-academic.png')}
        style={{ width: 184, height: 44 }}
        resizeMode="contain"
      />
    </View>
  );
}
