import { useColorScheme } from 'nativewind';
import { TouchableOpacity } from 'react-native';
import { Sun, Moon } from 'lucide-react-native';
import { saveThemeMode } from '@/lib/settings';
import { useIconColors } from '@/lib/iconTheme';

export function ThemeToggle() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const iconColors = useIconColors();

  const handleToggle = async () => {
    const nextMode = colorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(nextMode);
    await saveThemeMode(nextMode);
  };

  return (
    <TouchableOpacity onPress={handleToggle}>
      {colorScheme === 'dark' ? (
        <Sun size={24} color={iconColors.foreground} />
      ) : (
        <Moon size={24} color={iconColors.foreground} />
      )}
    </TouchableOpacity>
  );
}
